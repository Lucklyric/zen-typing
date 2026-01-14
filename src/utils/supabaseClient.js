/**
 * Supabase Client Singleton
 *
 * Provides a single Supabase client instance for the entire app.
 * Publishable key is safe to commit - RLS protects all data access.
 */
import { createClient } from '@supabase/supabase-js';

// Supabase configuration (publishable key is safe to expose with RLS enabled)
const supabaseUrl = 'https://seqmeaxnwmiywuyzpgvp.supabase.co';
const supabasePublishableKey = 'sb_publishable_eNgYLQe29fXTS2e6M7-rlQ_3GBsGt7-';

// Supabase is always configured now (hardcoded)
export const isSupabaseConfigured = true;

// Create Supabase client
export const supabase = createClient(supabaseUrl, supabasePublishableKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
    // Storage key for session persistence
    storageKey: 'zen-typing-auth',
  },
});

// Log initialization in development
if (import.meta.env.DEV) {
  console.log('[Supabase] Client initialized');
}
