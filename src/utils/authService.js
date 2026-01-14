/**
 * Auth Service
 *
 * Handles Magic Link authentication, session management, and auth state.
 * Provides a clean API for auth operations throughout the app.
 */
import { supabase, isSupabaseConfigured } from './supabaseClient';

/**
 * Auth state type
 * @typedef {'idle' | 'loading' | 'awaiting' | 'error'} AuthState
 */

/**
 * Send Magic Link to email
 * @param {string} email - User's email address
 * @returns {Promise<{success: boolean, error?: string}>}
 */
export async function signInWithMagicLink(email) {
  if (!isSupabaseConfigured || !supabase) {
    return { success: false, error: 'Supabase not configured' };
  }

  try {
    // Build redirect URL for Magic Link
    // Handles both dev (localhost) and production (GitHub Pages)
    const redirectTo = window.location.origin + (import.meta.env.BASE_URL || '/');

    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: redirectTo,
      },
    });

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (err) {
    return { success: false, error: err.message || 'Failed to send magic link' };
  }
}

/**
 * Sign out current user
 * @returns {Promise<{success: boolean, error?: string}>}
 */
export async function signOut() {
  if (!isSupabaseConfigured || !supabase) {
    return { success: false, error: 'Supabase not configured' };
  }

  try {
    const { error } = await supabase.auth.signOut();

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (err) {
    return { success: false, error: err.message || 'Failed to sign out' };
  }
}

/**
 * Get current session
 * @returns {Promise<{session: object|null, error?: string}>}
 */
export async function getSession() {
  if (!isSupabaseConfigured || !supabase) {
    return { session: null };
  }

  try {
    const { data: { session }, error } = await supabase.auth.getSession();

    if (error) {
      return { session: null, error: error.message };
    }

    return { session };
  } catch (err) {
    return { session: null, error: err.message };
  }
}

/**
 * Get current user
 * @returns {Promise<{user: object|null, error?: string}>}
 */
export async function getUser() {
  if (!isSupabaseConfigured || !supabase) {
    return { user: null };
  }

  try {
    const { data: { user }, error } = await supabase.auth.getUser();

    if (error) {
      return { user: null, error: error.message };
    }

    return { user };
  } catch (err) {
    return { user: null, error: err.message };
  }
}

/**
 * Subscribe to auth state changes
 * @param {Function} callback - Called with (event, session) on auth changes
 * @returns {Function} Unsubscribe function
 */
export function onAuthStateChange(callback) {
  if (!isSupabaseConfigured || !supabase) {
    // Return no-op unsubscribe
    return () => {};
  }

  const { data: { subscription } } = supabase.auth.onAuthStateChange(callback);

  return () => subscription?.unsubscribe();
}

/**
 * Delete current user's account
 * Calls Edge Function which has service_role access
 * @returns {Promise<{success: boolean, error?: string}>}
 */
export async function deleteAccount() {
  if (!isSupabaseConfigured || !supabase) {
    return { success: false, error: 'Supabase not configured' };
  }

  try {
    const { data: { session } } = await supabase.auth.getSession();

    if (!session) {
      return { success: false, error: 'Not authenticated' };
    }

    // Call Edge Function with user's JWT
    const response = await supabase.functions.invoke('delete-user', {
      headers: {
        Authorization: `Bearer ${session.access_token}`,
      },
    });

    if (response.error) {
      return { success: false, error: response.error.message };
    }

    // Sign out locally after successful deletion
    await supabase.auth.signOut();

    return { success: true };
  } catch (err) {
    return { success: false, error: err.message || 'Failed to delete account' };
  }
}

/**
 * Refresh session token
 * @returns {Promise<{success: boolean, error?: string}>}
 */
export async function refreshSession() {
  if (!isSupabaseConfigured || !supabase) {
    return { success: false, error: 'Supabase not configured' };
  }

  try {
    const { error } = await supabase.auth.refreshSession();

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (err) {
    return { success: false, error: err.message || 'Failed to refresh session' };
  }
}
