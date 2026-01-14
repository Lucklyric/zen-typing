-- Supabase Schema: Zen Typing Cloud Sync
-- Date: 2026-01-12
-- Run this in Supabase SQL Editor
-- IDEMPOTENT: Safe to run multiple times

-- ============================================
-- Extensions
-- ============================================
-- Enable pgcrypto for gen_random_uuid() if not already enabled
-- Supabase typically has this pre-installed, but explicit is safer
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- ============================================
-- Table: user_settings
-- JSONB settings for flexibility (no migrations needed for new fields)
-- ============================================
CREATE TABLE IF NOT EXISTS user_settings (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  settings JSONB NOT NULL DEFAULT '{
    "themePreference": "system",
    "showIPA": false,
    "soundEnabled": true,
    "dictationMode": false,
    "focusMode": false,
    "fontSize": "medium",
    "showProgress": true,
    "showTimer": true,
    "typingMode": "normal",
    "splitRatio": 0.5,
    "autoSwitchReference": true,
    "centerAreaHeight": 500
  }'::jsonb,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE user_settings ENABLE ROW LEVEL SECURITY;

-- Drop existing policy if exists (for idempotency)
DROP POLICY IF EXISTS "Users can manage own settings" ON user_settings;

-- Policy: Users can only access their own settings (with explicit WITH CHECK)
CREATE POLICY "Users can manage own settings" ON user_settings
  FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- ============================================
-- Table: custom_texts
-- User's saved typing practice texts
-- ============================================
CREATE TABLE IF NOT EXISTS custom_texts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  text TEXT NOT NULL CHECK (char_length(text) <= 25000),
  mode TEXT NOT NULL DEFAULT 'normal' CHECK (mode IN ('normal', 'reference')),
  reference_text TEXT CHECK (
    (mode = 'normal' AND reference_text IS NULL) OR
    (mode = 'reference' AND reference_text IS NOT NULL AND char_length(reference_text) <= 25000)
  ),
  word_count INTEGER NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE custom_texts ENABLE ROW LEVEL SECURITY;

-- Drop existing policy if exists (for idempotency)
DROP POLICY IF EXISTS "Users can manage own texts" ON custom_texts;

-- Policy: Users can only access their own texts (with explicit WITH CHECK)
CREATE POLICY "Users can manage own texts" ON custom_texts
  FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- ============================================
-- Indexes
-- ============================================
CREATE INDEX IF NOT EXISTS idx_custom_texts_user_id
  ON custom_texts(user_id);

CREATE INDEX IF NOT EXISTS idx_custom_texts_created
  ON custom_texts(user_id, created_at DESC, id DESC);

-- ============================================
-- Function: Limit texts per user to 50
-- Deterministic: tie-break by id for consistent ordering
-- ============================================
CREATE OR REPLACE FUNCTION enforce_max_texts()
RETURNS TRIGGER AS $$
BEGIN
  -- Delete oldest texts if user has more than 50
  -- Deterministic ordering: created_at DESC, then id DESC
  DELETE FROM custom_texts
  WHERE id IN (
    SELECT id FROM custom_texts
    WHERE user_id = NEW.user_id
    ORDER BY created_at DESC, id DESC
    OFFSET 50
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Trigger: Run after insert to enforce limit
DROP TRIGGER IF EXISTS limit_custom_texts ON custom_texts;
CREATE TRIGGER limit_custom_texts
  AFTER INSERT ON custom_texts
  FOR EACH ROW
  EXECUTE FUNCTION enforce_max_texts();

-- ============================================
-- Function: Auto-update updated_at timestamp
-- ============================================
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers: Auto-update timestamps
DROP TRIGGER IF EXISTS update_user_settings_timestamp ON user_settings;
CREATE TRIGGER update_user_settings_timestamp
  BEFORE UPDATE ON user_settings
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

DROP TRIGGER IF EXISTS update_custom_texts_timestamp ON custom_texts;
CREATE TRIGGER update_custom_texts_timestamp
  BEFORE UPDATE ON custom_texts
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

-- ============================================
-- Enable Realtime (idempotent)
-- ============================================
DO $$
BEGIN
  -- Add user_settings to realtime if not already added
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime' AND tablename = 'user_settings'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE user_settings;
  END IF;

  -- Add custom_texts to realtime if not already added
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime' AND tablename = 'custom_texts'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE custom_texts;
  END IF;
END $$;

-- ============================================
-- Edge Function: delete-user (deploy separately)
-- ============================================
-- See supabase/functions/delete-user/index.ts
-- This function requires service_role key and must be deployed via:
--   supabase functions deploy delete-user
