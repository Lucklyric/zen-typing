/**
 * Sync Service
 *
 * Handles synchronization between localStorage and Supabase cloud storage.
 * Manages sync status, offline queue, and real-time subscriptions.
 */
import { supabase, isSupabaseConfigured } from './supabaseClient';

/**
 * Sync status type
 * @typedef {'synced' | 'syncing' | 'offline' | 'error'} SyncStatus
 */

/**
 * Sync state object
 * @typedef {Object} SyncState
 * @property {SyncStatus} status - Current sync status
 * @property {Date|null} lastSyncAt - Last successful sync timestamp
 * @property {Array} pendingChanges - Queue of changes to sync when online
 * @property {string|null} error - Last error message
 */

// localStorage key for persisting pending changes
const PENDING_CHANGES_KEY = 'zen-typing-pending-sync';

// UUID v4 pattern (Supabase uses UUID for primary keys)
const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * Check if an ID looks like a valid UUID (database ID)
 * Local IDs are timestamp-based strings like "1704067200000"
 * @param {string} id - ID to check
 * @returns {boolean}
 */
function isUUID(id) {
  return typeof id === 'string' && UUID_REGEX.test(id);
}

// Load persisted pending changes from localStorage
function loadPersistedPendingChanges() {
  try {
    const stored = localStorage.getItem(PENDING_CHANGES_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
}

// Persist pending changes to localStorage
function persistPendingChanges(changes) {
  try {
    if (changes.length === 0) {
      localStorage.removeItem(PENDING_CHANGES_KEY);
    } else {
      localStorage.setItem(PENDING_CHANGES_KEY, JSON.stringify(changes));
    }
  } catch (err) {
    console.error('Failed to persist pending changes:', err);
  }
}

// Initial sync state
const initialSyncState = {
  status: 'synced',
  lastSyncAt: null,
  pendingChanges: [],
  error: null,
};

// In-memory sync state (loads pending changes from localStorage)
let syncState = {
  ...initialSyncState,
  pendingChanges: loadPersistedPendingChanges(),
};

// Subscribers to sync state changes
const subscribers = new Set();

// Track active sync operations to prevent status clobbering
let activeSyncCount = 0;

// Mutex for processPendingChanges to prevent concurrent execution
let isProcessingPending = false;

/**
 * Get current sync state
 * @returns {SyncState}
 */
export function getSyncState() {
  return { ...syncState };
}

/**
 * Subscribe to sync state changes
 * @param {Function} callback - Called with new sync state
 * @returns {Function} Unsubscribe function
 */
export function subscribeSyncState(callback) {
  subscribers.add(callback);
  // Immediately call with current state
  callback(getSyncState());
  return () => subscribers.delete(callback);
}

/**
 * Update sync state and notify subscribers
 * @param {Partial<SyncState>} updates - State updates
 */
function updateSyncState(updates) {
  syncState = { ...syncState, ...updates };

  // Always persist pending changes when they're updated (content may change even if length doesn't)
  if (updates.pendingChanges !== undefined) {
    persistPendingChanges(syncState.pendingChanges);
  }

  subscribers.forEach((callback) => callback(getSyncState()));
}

/**
 * Set sync status with concurrency protection
 * - 'syncing': increments active count, only updates status if not already syncing
 * - 'synced': decrements active count, only updates status if no other operations running
 * - 'error': decrements active count and always updates status (errors are important)
 * - 'offline': directly sets status (network state change)
 * @param {SyncStatus} status
 * @param {string} [error] - Error message if status is 'error'
 */
export function setSyncStatus(status, error = null) {
  if (status === 'syncing') {
    activeSyncCount++;
    // Only update status if not already syncing (prevent flicker)
    if (syncState.status !== 'syncing') {
      updateSyncState({ status: 'syncing', error: null });
    }
  } else if (status === 'synced') {
    activeSyncCount = Math.max(0, activeSyncCount - 1);
    // Only set synced if all operations complete
    if (activeSyncCount === 0) {
      updateSyncState({
        status: 'synced',
        error: null,
        lastSyncAt: new Date(),
      });
    }
  } else if (status === 'error') {
    activeSyncCount = Math.max(0, activeSyncCount - 1);
    // Errors are always important to show
    updateSyncState({
      status: 'error',
      error: error,
    });
  } else {
    // 'offline' or other statuses - direct update
    updateSyncState({
      status,
      error: status === 'error' ? error : null,
    });
  }
}

/**
 * Check if user is online
 * @returns {boolean}
 */
export function isOnline() {
  return navigator.onLine;
}

/**
 * Process pending changes queue
 * @param {string} userId - User ID to sync changes for
 * @returns {Promise<{success: boolean, error?: string}>}
 */
export async function processPendingChanges(userId) {
  if (!userId || syncState.pendingChanges.length === 0) {
    return { success: true };
  }

  // Guard: Don't process if offline - changes would just re-queue and get lost
  if (!isOnline()) {
    return { success: false, error: 'Offline', offline: true };
  }

  // Mutex: Prevent concurrent execution to avoid double-apply or clobbered updates
  if (isProcessingPending) {
    console.log('[Sync] processPendingChanges: Already processing, skipping');
    return { success: true, skipped: true };
  }

  isProcessingPending = true;
  try {
    // Snapshot pending changes at start (new changes during processing stay in queue)
    const pending = [...syncState.pendingChanges];
    const errors = [];
    const failedChanges = [];
    const allInsertedTexts = [];

    // Process clearAll first to avoid conflicts with subsequent adds
    const clearAllChanges = pending.filter(c => c.type === 'clearAll');
    const deleteChanges = pending.filter(c => c.type === 'delete');
    const otherChanges = pending.filter(c => c.type !== 'clearAll' && c.type !== 'delete');

    // Reorder: clearAll first, then deletes, then other operations
    const orderedPending = [...clearAllChanges, ...deleteChanges, ...otherChanges];

    for (const change of orderedPending) {
      try {
        if (change.type === 'settings') {
          const result = await syncSettingsToCloud(change.data, userId);
          if (!result.success) {
            errors.push(result.error);
            failedChanges.push(change);
          }
        } else if (change.type === 'texts') {
          const result = await syncCustomTextsToCloud(change.data, userId);
          if (!result.success) {
            errors.push(result.error);
            failedChanges.push(change);
          } else if (result.insertedTexts?.length > 0) {
            // Collect inserted texts so caller can update local IDs
            allInsertedTexts.push(...result.insertedTexts);
          }
        } else if (change.type === 'delete') {
          // Handle single text deletion
          const result = await deleteCustomTextFromCloudDirect(change.data.id, userId);
          if (!result.success) {
            errors.push(result.error);
            failedChanges.push(change);
          }
        } else if (change.type === 'clearAll') {
          // Handle clear all texts
          const result = await clearAllCustomTextsFromCloudDirect(userId);
          if (!result.success) {
            errors.push(result.error);
            failedChanges.push(change);
          }
        }
      } catch (err) {
        errors.push(err.message);
        failedChanges.push(change);
      }
    }

    // Only keep failed changes in queue (successfully processed are removed)
    updateSyncState({ pendingChanges: failedChanges });

    // Update sync status based on result
    if (errors.length > 0) {
      setSyncStatus('error', errors.join('; '));
      return { success: false, error: errors.join('; '), insertedTexts: allInsertedTexts };
    }

    // Successfully processed all pending changes
    setSyncStatus('synced');
    return { success: true, insertedTexts: allInsertedTexts };
  } finally {
    isProcessingPending = false;
  }
}

// Callback for processing pending changes on reconnect (set by App.jsx)
let onReconnectCallback = null;

/**
 * Set callback to be called when coming back online
 * @param {Function} callback - Called with no args when online
 */
export function setOnReconnectCallback(callback) {
  onReconnectCallback = callback;
}

/**
 * Initialize network status listeners
 * @returns {Function} Cleanup function
 */
export function initNetworkListeners() {
  const handleOnline = () => {
    // Process pending changes whenever we come online and have pending work
    // Don't just check for 'offline' status - also process if we have queued changes
    if (syncState.status === 'offline' || syncState.pendingChanges.length > 0) {
      // Notify App to process pending changes with user context
      if (onReconnectCallback) {
        onReconnectCallback();
      } else if (syncState.status === 'offline') {
        setSyncStatus('synced');
      }
    }
  };

  const handleOffline = () => {
    setSyncStatus('offline');
  };

  window.addEventListener('online', handleOnline);
  window.addEventListener('offline', handleOffline);

  // Set initial status based on network
  if (!isOnline()) {
    setSyncStatus('offline');
  } else if (syncState.pendingChanges.length > 0) {
    // App started online with persisted pending changes - trigger processing
    if (onReconnectCallback) {
      // Delay slightly to allow App to set up the callback
      setTimeout(() => {
        if (onReconnectCallback && isOnline() && syncState.pendingChanges.length > 0) {
          onReconnectCallback();
        }
      }, 100);
    }
  }

  return () => {
    window.removeEventListener('online', handleOnline);
    window.removeEventListener('offline', handleOffline);
  };
}

/**
 * Reset sync state (call on sign out)
 */
export function resetSyncState() {
  syncState = { ...initialSyncState };
  activeSyncCount = 0; // Reset sync counter to prevent stuck 'syncing' status
  isProcessingPending = false; // Reset mutex to allow future processing
  persistPendingChanges([]); // Clear persisted pending changes
  subscribers.forEach((callback) => callback(getSyncState()));
}

/**
 * Clear pending changes queue (call after successful force sync)
 */
export function clearPendingChanges() {
  updateSyncState({ pendingChanges: [] });
}

// ============================================
// Settings Sync Functions
// ============================================

/**
 * Sync settings to cloud
 * @param {Object} settings - Settings object to sync
 * @param {string} userId - User ID
 * @returns {Promise<{success: boolean, error?: string}>}
 */
export async function syncSettingsToCloud(settings, userId) {
  if (!isSupabaseConfigured || !supabase) {
    console.log('[Sync] syncSettingsToCloud: Supabase not configured');
    return { success: false, error: 'Supabase not configured' };
  }

  if (!isOnline()) {
    console.log('[Sync] syncSettingsToCloud: Offline, queuing for later');
    updateSyncState({
      pendingChanges: [...syncState.pendingChanges, { type: 'settings', data: settings }],
    });
    return { success: true }; // Queued successfully
  }

  console.log(`[Sync] syncSettingsToCloud: Syncing settings for user ${userId}`);

  try {
    setSyncStatus('syncing');

    const { error } = await supabase
      .from('user_settings')
      .upsert({
        user_id: userId,
        settings,
        updated_at: new Date().toISOString(),
      }, {
        onConflict: 'user_id',
      });

    if (error) {
      console.error('[Sync] syncSettingsToCloud error:', error);
      setSyncStatus('error', error.message);
      return { success: false, error: error.message };
    }

    console.log('[Sync] syncSettingsToCloud: Success');
    setSyncStatus('synced');
    return { success: true };
  } catch (err) {
    console.error('[Sync] syncSettingsToCloud exception:', err);
    setSyncStatus('error', err.message);
    return { success: false, error: err.message };
  }
}

/**
 * Load settings from cloud
 * @param {string} userId - User ID
 * @returns {Promise<{settings: Object|null, error?: string}>}
 */
export async function loadSettingsFromCloud(userId) {
  if (!isSupabaseConfigured || !supabase) {
    console.log('[Sync] loadSettingsFromCloud: Supabase not configured');
    return { settings: null, error: 'Supabase not configured' };
  }

  console.log(`[Sync] loadSettingsFromCloud: Loading for user ${userId}`);

  try {
    setSyncStatus('syncing');

    const { data, error } = await supabase
      .from('user_settings')
      .select('settings')
      .eq('user_id', userId)
      .single();

    if (error && error.code !== 'PGRST116') {
      // PGRST116 = no rows returned (not an error for new users)
      console.error('[Sync] loadSettingsFromCloud error:', error);
      setSyncStatus('error', error.message);
      return { settings: null, error: error.message };
    }

    console.log('[Sync] loadSettingsFromCloud: Got settings:', data?.settings ? 'yes' : 'none');
    setSyncStatus('synced');
    return { settings: data?.settings || null };
  } catch (err) {
    console.error('[Sync] loadSettingsFromCloud exception:', err);
    setSyncStatus('error', err.message);
    return { settings: null, error: err.message };
  }
}

// ============================================
// Custom Texts Sync Functions
// ============================================

/**
 * Sync custom texts to cloud
 * @param {Array} texts - Array of text entries
 * @param {string} userId - User ID
 * @returns {Promise<{success: boolean, error?: string}>}
 */
export async function syncCustomTextsToCloud(texts, userId) {
  if (!isSupabaseConfigured || !supabase) {
    console.log('[Sync] syncCustomTextsToCloud: Supabase not configured');
    return { success: false, error: 'Supabase not configured' };
  }

  if (!isOnline()) {
    console.log('[Sync] syncCustomTextsToCloud: Offline, queuing for later');
    updateSyncState({
      pendingChanges: [...syncState.pendingChanges, { type: 'texts', data: texts }],
    });
    return { success: true };
  }

  console.log(`[Sync] syncCustomTextsToCloud: Processing ${texts.length} texts for user ${userId}`);

  try {
    setSyncStatus('syncing');

    // Validate and transform texts to match database schema
    const validTexts = texts.filter((t) => {
      // Skip invalid entries
      if (!t || typeof t.text !== 'string') return false;
      return true;
    });

    // Separate texts with existing IDs (updates) from new texts (inserts)
    const textsWithId = [];
    const newTexts = [];

    for (const t of validTexts) {
      const textContent = t.text.trim();
      if (!textContent) continue; // Skip empty texts

      // Handle both cloud format (createdAt string) and local format (timestamp number)
      let createdAt;
      if (t.createdAt) {
        createdAt = t.createdAt;
      } else if (t.timestamp) {
        createdAt = new Date(t.timestamp).toISOString();
      } else {
        createdAt = new Date().toISOString();
      }

      // Validate mode/reference_text consistency (two-way normalization)
      let mode = t.mode || 'normal';
      let referenceText = t.referenceText || null;

      // If mode is 'reference' but referenceText is empty, coerce to 'normal'
      if (mode === 'reference' && (!referenceText || !referenceText.trim())) {
        console.warn('[Sync] Text has mode=reference but empty referenceText, coercing to normal mode');
        mode = 'normal';
        referenceText = null;
      }
      // If mode is 'normal' but referenceText exists, clear it to maintain consistency
      if (mode === 'normal' && referenceText && referenceText.trim()) {
        console.warn('[Sync] Text has mode=normal but non-empty referenceText, clearing referenceText');
        referenceText = null;
      }

      // Validate text length (Supabase text columns typically support up to 1MB, but let's be reasonable)
      const MAX_TEXT_LENGTH = 100000; // 100KB reasonable limit
      if (textContent.length > MAX_TEXT_LENGTH) {
        console.warn(`[Sync] Skipping text exceeding max length (${textContent.length} > ${MAX_TEXT_LENGTH})`);
        continue;
      }
      if (referenceText && referenceText.length > MAX_TEXT_LENGTH) {
        console.warn(`[Sync] Skipping text with referenceText exceeding max length`);
        continue;
      }

      const dbText = {
        user_id: userId,
        text: textContent,
        mode: mode,
        reference_text: referenceText,
        word_count: textContent.split(/\s+/).length,
        created_at: createdAt,
        updated_at: new Date().toISOString(),
      };

      if (t.id && isUUID(t.id)) {
        // Has valid database UUID - can upsert
        textsWithId.push({ ...dbText, id: t.id });
      } else {
        // No ID or local timestamp ID - insert as new
        newTexts.push(dbText);
      }
    }

    const errors = [];

    console.log(`[Sync] syncCustomTextsToCloud: ${textsWithId.length} texts with UUID, ${newTexts.length} new texts`);

    // Upsert texts that have IDs
    if (textsWithId.length > 0) {
      console.log('[Sync] Upserting texts with existing UUIDs...');
      const { error } = await supabase
        .from('custom_texts')
        .upsert(textsWithId, {
          onConflict: 'id',
          ignoreDuplicates: false,
        });
      if (error) {
        console.error('[Sync] Upsert error:', error);
        errors.push(error.message);
      } else {
        console.log('[Sync] Upsert successful');
      }
    }

    // Insert new texts and get back the generated IDs
    let insertedTexts = [];
    if (newTexts.length > 0) {
      console.log('[Sync] Inserting new texts...');
      const { data, error } = await supabase
        .from('custom_texts')
        .insert(newTexts)
        .select('id, text, mode, reference_text, word_count, created_at, updated_at');
      if (error) {
        console.error('[Sync] Insert error:', error);
        errors.push(error.message);
      } else if (data) {
        console.log(`[Sync] Insert successful, got ${data.length} IDs back`);
        insertedTexts = data;
      }
    }

    if (errors.length > 0) {
      setSyncStatus('error', errors.join('; '));
      return { success: false, error: errors.join('; ') };
    }

    setSyncStatus('synced');

    // Return inserted texts so caller can update local storage with DB IDs
    return { success: true, insertedTexts };
  } catch (err) {
    setSyncStatus('error', err.message);
    return { success: false, error: err.message };
  }
}

/**
 * Load custom texts from cloud
 * @param {string} userId - User ID
 * @returns {Promise<{texts: Array|null, error?: string}>}
 */
export async function loadCustomTextsFromCloud(userId) {
  if (!isSupabaseConfigured || !supabase) {
    console.log('[Sync] loadCustomTextsFromCloud: Supabase not configured');
    return { texts: null, error: 'Supabase not configured' };
  }

  console.log(`[Sync] loadCustomTextsFromCloud: Loading for user ${userId}`);

  try {
    setSyncStatus('syncing');

    const { data, error } = await supabase
      .from('custom_texts')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('[Sync] loadCustomTextsFromCloud error:', error);
      setSyncStatus('error', error.message);
      return { texts: null, error: error.message };
    }

    console.log(`[Sync] loadCustomTextsFromCloud: Got ${data?.length || 0} texts from cloud`);

    // Transform to app format
    const texts = (data || []).map((t) => ({
      id: t.id,
      text: t.text,
      mode: t.mode,
      referenceText: t.reference_text,
      wordCount: t.word_count,
      createdAt: t.created_at,
      updatedAt: t.updated_at,
    }));

    setSyncStatus('synced');
    return { texts };
  } catch (err) {
    console.error('[Sync] loadCustomTextsFromCloud exception:', err);
    setSyncStatus('error', err.message);
    return { texts: null, error: err.message };
  }
}

/**
 * Direct delete (internal) - used by processPendingChanges, skips offline check
 * @param {string} textId - UUID of the text to delete
 * @param {string} userId - User ID
 * @returns {Promise<{success: boolean, error?: string}>}
 */
async function deleteCustomTextFromCloudDirect(textId, userId) {
  if (!isSupabaseConfigured || !supabase) {
    return { success: false, error: 'Supabase not configured' };
  }

  if (!isUUID(textId)) {
    return { success: true }; // Not a cloud text
  }

  try {
    const { error } = await supabase
      .from('custom_texts')
      .delete()
      .eq('id', textId)
      .eq('user_id', userId);

    if (error) {
      console.error('[Sync] deleteCustomTextFromCloudDirect error:', error);
      return { success: false, error: error.message };
    }
    return { success: true };
  } catch (err) {
    console.error('[Sync] deleteCustomTextFromCloudDirect exception:', err);
    return { success: false, error: err.message };
  }
}

/**
 * Direct clear all (internal) - used by processPendingChanges, skips offline check
 * @param {string} userId - User ID
 * @returns {Promise<{success: boolean, error?: string}>}
 */
async function clearAllCustomTextsFromCloudDirect(userId) {
  if (!isSupabaseConfigured || !supabase) {
    return { success: false, error: 'Supabase not configured' };
  }

  try {
    const { error } = await supabase
      .from('custom_texts')
      .delete()
      .eq('user_id', userId);

    if (error) {
      console.error('[Sync] clearAllCustomTextsFromCloudDirect error:', error);
      return { success: false, error: error.message };
    }
    return { success: true };
  } catch (err) {
    console.error('[Sync] clearAllCustomTextsFromCloudDirect exception:', err);
    return { success: false, error: err.message };
  }
}

/**
 * Delete a custom text from cloud
 * @param {string} textId - UUID of the text to delete
 * @param {string} userId - User ID (for RLS validation)
 * @returns {Promise<{success: boolean, error?: string}>}
 */
export async function deleteCustomTextFromCloud(textId, userId) {
  if (!isSupabaseConfigured || !supabase) {
    console.log('[Sync] deleteCustomTextFromCloud: Supabase not configured');
    return { success: false, error: 'Supabase not configured' };
  }

  // Handle local-only texts (non-UUID): remove from pending inserts if queued offline
  if (!isUUID(textId)) {
    // Check if there's a pending insert containing this text
    const pendingTexts = syncState.pendingChanges.filter(c => c.type === 'texts');
    let foundAndRemoved = false;

    const updatedPending = syncState.pendingChanges.map(change => {
      if (change.type === 'texts' && Array.isArray(change.data)) {
        // Filter out the deleted text from the pending insert
        const filteredData = change.data.filter(t => t.id !== textId);
        if (filteredData.length < change.data.length) {
          foundAndRemoved = true;
          console.log('[Sync] deleteCustomTextFromCloud: Removed local text from pending insert queue');
        }
        // Return null if all texts removed, otherwise return filtered change
        return filteredData.length > 0 ? { ...change, data: filteredData } : null;
      }
      return change;
    }).filter(Boolean); // Remove null entries

    if (foundAndRemoved) {
      updateSyncState({ pendingChanges: updatedPending });
    } else {
      console.log('[Sync] deleteCustomTextFromCloud: Not a cloud ID and not in pending queue, skipping');
    }
    return { success: true }; // Not a cloud text, nothing to delete from cloud
  }

  if (!isOnline()) {
    console.log('[Sync] deleteCustomTextFromCloud: Offline, queuing for later');
    updateSyncState({
      pendingChanges: [...syncState.pendingChanges, { type: 'delete', data: { id: textId } }],
    });
    return { success: true };
  }

  console.log(`[Sync] deleteCustomTextFromCloud: Deleting text ${textId}`);

  try {
    setSyncStatus('syncing');

    const { error } = await supabase
      .from('custom_texts')
      .delete()
      .eq('id', textId)
      .eq('user_id', userId);

    if (error) {
      console.error('[Sync] deleteCustomTextFromCloud error:', error);
      setSyncStatus('error', error.message);
      return { success: false, error: error.message };
    }

    console.log('[Sync] deleteCustomTextFromCloud: Success');
    setSyncStatus('synced');
    return { success: true };
  } catch (err) {
    console.error('[Sync] deleteCustomTextFromCloud exception:', err);
    setSyncStatus('error', err.message);
    return { success: false, error: err.message };
  }
}

/**
 * Clear all custom texts from cloud for a user
 * @param {string} userId - User ID
 * @returns {Promise<{success: boolean, error?: string}>}
 */
export async function clearAllCustomTextsFromCloud(userId) {
  if (!isSupabaseConfigured || !supabase) {
    console.log('[Sync] clearAllCustomTextsFromCloud: Supabase not configured');
    return { success: false, error: 'Supabase not configured' };
  }

  if (!isOnline()) {
    console.log('[Sync] clearAllCustomTextsFromCloud: Offline, queuing for later');
    updateSyncState({
      pendingChanges: [...syncState.pendingChanges, { type: 'clearAll', data: {} }],
    });
    return { success: true };
  }

  console.log(`[Sync] clearAllCustomTextsFromCloud: Clearing all texts for user ${userId}`);

  try {
    setSyncStatus('syncing');

    const { error } = await supabase
      .from('custom_texts')
      .delete()
      .eq('user_id', userId);

    if (error) {
      console.error('[Sync] clearAllCustomTextsFromCloud error:', error);
      setSyncStatus('error', error.message);
      return { success: false, error: error.message };
    }

    console.log('[Sync] clearAllCustomTextsFromCloud: Success');
    setSyncStatus('synced');
    return { success: true };
  } catch (err) {
    console.error('[Sync] clearAllCustomTextsFromCloud exception:', err);
    setSyncStatus('error', err.message);
    return { success: false, error: err.message };
  }
}

// ============================================
// Migration Functions
// ============================================

/**
 * Migrate local data to cloud on first sign-in
 * @param {string} userId - User ID
 * @param {Object} localSettings - Local settings from localStorage
 * @param {Array} localTexts - Local texts from localStorage
 * @returns {Promise<{success: boolean, error?: string, insertedTexts?: Array}>}
 */
export async function migrateLocalToCloud(userId, localSettings, localTexts) {
  if (!isSupabaseConfigured || !supabase) {
    return { success: false, error: 'Supabase not configured' };
  }

  try {
    setSyncStatus('syncing');
    const errors = [];
    let insertedTexts = [];

    // Sync settings if they exist
    if (localSettings && Object.keys(localSettings).length > 0) {
      const settingsResult = await syncSettingsToCloud(localSettings, userId);
      if (!settingsResult.success) {
        errors.push(`Settings: ${settingsResult.error}`);
      }
    }

    // Sync texts if they exist
    if (localTexts && localTexts.length > 0) {
      const textsResult = await syncCustomTextsToCloud(localTexts, userId);
      if (!textsResult.success) {
        errors.push(`Texts: ${textsResult.error}`);
      } else if (textsResult.insertedTexts) {
        insertedTexts = textsResult.insertedTexts;
      }
    }

    if (errors.length > 0) {
      const errorMsg = errors.join('; ');
      setSyncStatus('error', errorMsg);
      return { success: false, error: errorMsg };
    }

    setSyncStatus('synced');
    return { success: true, insertedTexts };
  } catch (err) {
    setSyncStatus('error', err.message);
    return { success: false, error: err.message };
  }
}

/**
 * Check if cloud has existing data for user
 * @param {string} userId - User ID
 * @returns {Promise<{hasSettings: boolean, hasTexts: boolean, textsCount: number, error?: string}>}
 */
export async function checkCloudData(userId) {
  if (!isSupabaseConfigured || !supabase) {
    console.log('[Sync] checkCloudData: Supabase not configured');
    return { hasSettings: false, hasTexts: false, textsCount: 0 };
  }

  try {
    // Use count-only queries to minimize data transfer
    const [settingsResult, textsResult] = await Promise.all([
      supabase.from('user_settings').select('user_id', { count: 'exact', head: true }).eq('user_id', userId),
      supabase.from('custom_texts').select('id', { count: 'exact', head: true }).eq('user_id', userId),
    ]);

    // Log any errors from the queries
    if (settingsResult.error && settingsResult.error.code !== 'PGRST116') {
      console.error('[Sync] checkCloudData settings query error:', settingsResult.error);
    }
    if (textsResult.error) {
      console.error('[Sync] checkCloudData texts query error:', textsResult.error);
    }

    return {
      hasSettings: !settingsResult.error && (settingsResult.count || 0) > 0,
      hasTexts: !textsResult.error && (textsResult.count || 0) > 0,
      textsCount: textsResult.count || 0,
    };
  } catch (err) {
    console.error('[Sync] checkCloudData exception:', err);
    return { hasSettings: false, hasTexts: false, textsCount: 0, error: err.message };
  }
}

/**
 * Clear local cache (call on sign out)
 * Note: This just clears sync-related state, not user preferences
 */
export function clearLocalCache() {
  resetSyncState();
}
