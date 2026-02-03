import { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import TypingArea from './components/TypingArea';
import ReferenceWorkspace from './components/ReferenceWorkspace';
import ResizableContainer from './components/ResizableContainer';
import TextInput from './components/TextInput';
import CustomTextHistory from './components/CustomTextHistory';
import SessionStats from './components/SessionStats';
import Footer from './components/Footer';
import SettingsMenu from './components/SettingsMenu';
import KeyboardShortcutsHelp from './components/KeyboardShortcutsHelp';
import AuthButton from './components/AuthButton';
import SyncStatus from './components/SyncStatus';
import { sampleTexts } from './data/sampleTexts';
import { audioManager } from './utils/audioManager';
import { settingsStorage } from './utils/settingsStorage';
import { isSupabaseConfigured } from './utils/supabaseClient';
import {
  signInWithMagicLink,
  signOut as authSignOut,
  onAuthStateChange,
  getSession,
} from './utils/authService';
import {
  subscribeSyncState,
  initNetworkListeners,
  resetSyncState,
  processPendingChanges,
  setOnReconnectCallback,
  setSyncStatus as updateSyncServiceStatus,
  setCurrentUserId,
  migrateLocalToCloud,
  checkCloudData,
  loadSettingsFromCloud,
  loadCustomTextsFromCloud,
  syncCustomTextsToCloud,
  syncSettingsToCloud,
  deleteCustomTextFromCloud,
  clearAllCustomTextsFromCloud,
  clearPendingChanges,
  forceOverwriteRemoteWithLocal,
  forceUseRemoteData,
  cancelActiveSync,
} from './utils/syncService';
import { customTextStorage } from './utils/customTextStorage';

function App() {
  // Convert selectedText to selectedEntry object
  const [selectedEntry, setSelectedEntry] = useState({
    text: sampleTexts[0].text,
    mode: 'normal'
  });
  const [showIPA, setShowIPA] = useState(() => settingsStorage.get('showIPA'));
  const [soundEnabled, setSoundEnabled] = useState(() => settingsStorage.get('soundEnabled'));
  const [showHistory, setShowHistory] = useState(() => settingsStorage.get('showHistory'));
  const [dictationMode, setDictationMode] = useState(() => settingsStorage.get('dictationMode'));

  // Theme preference state (new system)
  const [themePreference, setThemePreference] = useState(() => settingsStorage.get('themePreference'));
  const [themeExplicitlySet, setThemeExplicitlySet] = useState(() => settingsStorage.get('themeExplicitlySet'));
  const [systemDarkMode, setSystemDarkMode] = useState(() =>
    typeof window !== 'undefined' && window.matchMedia('(prefers-color-scheme: dark)').matches
  );

  // Computed theme for rendering
  const theme = useMemo(() => {
    if (themePreference === 'cyber') return 'cyber';
    if (themePreference === 'geek') return 'geek';
    if (themePreference === 'dark') return 'dark';
    if (themePreference === 'system') {
      return systemDarkMode ? 'dark' : 'normal';
    }
    return 'normal'; // 'light'
  }, [themePreference, systemDarkMode]);

  const [completedSessions, setCompletedSessions] = useState([]);
  const [activeSection, setActiveSection] = useState(() => settingsStorage.get('activeSection'));
  
  // Reference Mode state
  const [splitRatio, setSplitRatio] = useState(() => settingsStorage.get('splitRatio'));
  const [centerAreaHeight, setCenterAreaHeight] = useState(() => settingsStorage.get('centerAreaHeight'));

  // Settings menu state
  const [settingsMenuOpen, setSettingsMenuOpen] = useState(false);
  const settingsButtonRef = useRef(null);

  // Keyboard shortcuts help modal state
  const [showShortcutsHelp, setShowShortcutsHelp] = useState(false);
  const shortcutsButtonRef = useRef(null);

  // Track typing progress for tab switch warning (US4)
  const [hasTypingProgress, setHasTypingProgress] = useState(false);
  const [pendingSection, setPendingSection] = useState(null);

  // Focus mode state
  const [focusMode, setFocusMode] = useState(() => settingsStorage.get('focusMode'));

  // Track window height for responsive layout
  const [windowHeight, setWindowHeight] = useState(window.innerHeight);

  // Auth state (Cloud Sync)
  const [user, setUser] = useState(null);
  const [authState, setAuthState] = useState('idle'); // 'idle' | 'loading' | 'awaiting' | 'error'
  const [authError, setAuthError] = useState(null);
  const activeUserIdRef = useRef(null); // Track active user to prevent race conditions

  // Sync state (Cloud Sync)
  const [syncStatus, setSyncStatus] = useState('synced'); // 'synced' | 'syncing' | 'offline' | 'error'
  const [historyRefreshKey, setHistoryRefreshKey] = useState(0); // Triggers CustomTextHistory refresh
  const [syncError, setSyncError] = useState(null);

  // Helper to apply cloud settings to local storage and React state
  const applyCloudSettings = useCallback((settings) => {
    if (!settings) return;
    Object.entries(settings).forEach(([key, value]) => {
      settingsStorage.set(key, value);
    });
    // Update React state for all settings
    if (settings.showIPA !== undefined) setShowIPA(settings.showIPA);
    if (settings.soundEnabled !== undefined) setSoundEnabled(settings.soundEnabled);
    if (settings.dictationMode !== undefined) setDictationMode(settings.dictationMode);
    if (settings.themePreference !== undefined) setThemePreference(settings.themePreference);
    if (settings.showHistory !== undefined) setShowHistory(settings.showHistory);
    if (settings.themeExplicitlySet !== undefined) setThemeExplicitlySet(settings.themeExplicitlySet);
    if (settings.activeSection !== undefined) setActiveSection(settings.activeSection);
    if (settings.splitRatio !== undefined) setSplitRatio(settings.splitRatio);
    if (settings.centerAreaHeight !== undefined) setCenterAreaHeight(settings.centerAreaHeight);
    if (settings.focusMode !== undefined) setFocusMode(settings.focusMode);
  }, []);

  // Window resize listener
  useEffect(() => {
    const handleResize = () => setWindowHeight(window.innerHeight);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // System dark mode preference listener
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handler = (e) => setSystemDarkMode(e.matches);
    mediaQuery.addEventListener('change', handler);
    return () => mediaQuery.removeEventListener('change', handler);
  }, []);

  // Auth state listener (Cloud Sync)
  useEffect(() => {
    if (!isSupabaseConfigured) return;

    // Get initial session
    getSession().then(({ session }) => {
      setUser(session?.user || null);
      activeUserIdRef.current = session?.user?.id || null;
    });

    // Subscribe to auth changes
    const unsubscribe = onAuthStateChange(async (event, session) => {
      const newUserId = session?.user?.id || null;
      setUser(session?.user || null);

      // Handle no-session events (sign out, user deleted, or initial load without user)
      if (!session?.user) {
        if (event === 'SIGNED_OUT' || event === 'USER_DELETED') {
          setAuthState('idle');
          // Clear sync state BEFORE nullifying user ID to ensure user-scoped pending changes are cleared
          resetSyncState();
          activeUserIdRef.current = null;
          setCurrentUserId(null);
          // Clear user data from localStorage to prevent cross-account data leakage
          const textsCleared = customTextStorage.clearAll();
          const settingsCleared = settingsStorage.clear();
          if (!textsCleared || !settingsCleared) {
            console.warn('[Sync] Sign-out: Failed to clear some local data');
          }
        } else {
          // No session (e.g., INITIAL_SESSION without user) - just clear user tracking without wiping data
          activeUserIdRef.current = null;
          setCurrentUserId(null);
        }
        return;
      }

      activeUserIdRef.current = newUserId;
      // Update sync service with current user ID for scoped storage
      setCurrentUserId(newUserId);

      // Trigger sync on SIGNED_IN (new sign-in) or INITIAL_SESSION (returning user)
      if (event === 'SIGNED_IN' || event === 'INITIAL_SESSION') {
        setAuthState('idle');

        // Trigger migration/sync
        const userId = session.user.id;
        console.log(`[Sync] ${event} detected, starting sync`);

        const cloudData = await checkCloudData(userId);
        // Bail out if user changed during async operation
        if (activeUserIdRef.current !== userId) {
          console.log('[Sync] User changed during sync, aborting');
          return;
        }
        console.log('[Sync] Cloud data check:', cloudData);

        // If cloud check failed (timeout, network error, etc.), skip migration to avoid data loss
        if (cloudData.error) {
          console.log('[Sync] Cloud data check failed, skipping migration:', cloudData.error);
          setSyncError(cloudData.error);
          updateSyncServiceStatus('error', cloudData.error);
          return;
        }

        const localTexts = customTextStorage.getAll();
        const hasStoredSettings = settingsStorage.hasStoredSettings();
        const localSettings = hasStoredSettings ? settingsStorage.get() : {};
        const hasLocalData = localTexts.length > 0 || hasStoredSettings;
        console.log('[Sync] Local data:', { textsCount: localTexts.length, hasStoredSettings });

        if (cloudData.hasSettings || cloudData.hasTexts) {
          console.log('[Sync] Cloud has data, loading from cloud...');
          // Cloud has data - load from cloud (cloud is source of truth)
          const [settingsResult, textsResult] = await Promise.all([
            loadSettingsFromCloud(userId),
            loadCustomTextsFromCloud(userId),
          ]);

          // Bail out if user changed during async operation
          if (activeUserIdRef.current !== userId) {
            console.log('[Sync] User changed during sync, aborting');
            return;
          }
          console.log('[Sync] Loaded from cloud:', { settings: settingsResult, texts: textsResult });

          // Check for cloud load errors - don't treat errors as empty data
          if (settingsResult.error || textsResult.error) {
            const errorMsg = settingsResult.error || textsResult.error || 'Failed to load cloud data';
            console.error('[Sync] Cloud load failed:', errorMsg);
            setSyncError(errorMsg);
            updateSyncServiceStatus('error', errorMsg);
            return;
          }

          const cloudTexts = textsResult.texts || [];
          let migrationResult = null;

          if (cloudTexts.length === 0 && localTexts.length > 0) {
            // Cloud has settings but no texts - migrate local texts to cloud
            console.log('[Sync] Cloud has settings but no texts, migrating local texts...');
            migrationResult = await syncCustomTextsToCloud(localTexts, userId);
            // Bail out if user changed
            if (activeUserIdRef.current !== userId) {
              console.log('[Sync] User changed during sync, aborting');
              return;
            }
            console.log('[Sync] Migration result:', migrationResult);
          }

          // Bail out if user changed before applying results
          if (activeUserIdRef.current !== userId) {
            console.log('[Sync] User changed during sync, aborting');
            return;
          }

          // Apply cloud texts to local BEFORE settings to avoid partial state
          if (cloudTexts.length > 0) {
            console.log('[Sync] Replacing local texts with cloud texts');
            const storageSuccess = customTextStorage.replaceAll(cloudTexts);
            if (!storageSuccess) {
              console.error('[Sync] Failed to save cloud texts locally');
              setSyncError('Failed to save data locally');
              updateSyncServiceStatus('error', 'Failed to save data locally');
              return;
            }
            setHistoryRefreshKey((k) => k + 1); // Trigger UI refresh
          } else if (migrationResult?.success && migrationResult.insertedTexts?.length > 0) {
            customTextStorage.updateWithDbIds(migrationResult.insertedTexts);
            setHistoryRefreshKey((k) => k + 1); // Trigger UI refresh
          }

          // Apply cloud settings to local only after texts storage succeeded
          applyCloudSettings(settingsResult.settings);

          // Clear any pending changes since cloud is now source of truth
          // This prevents stale offline changes from replaying on reconnect
          clearPendingChanges();
        } else if (hasLocalData) {
          // No cloud data but has local data - migrate local to cloud
          console.log('[Sync] No cloud data, migrating local data to cloud...');
          const migrateResult = await migrateLocalToCloud(userId, localSettings, localTexts);
          // Bail out if user changed
          if (activeUserIdRef.current !== userId) {
            console.log('[Sync] User changed during sync, aborting');
            return;
          }
          console.log('[Sync] Migration result:', migrateResult);
          // Update local storage with database IDs so future syncs work correctly
          if (migrateResult.success && migrateResult.insertedTexts) {
            customTextStorage.updateWithDbIds(migrateResult.insertedTexts);
            setHistoryRefreshKey((k) => k + 1); // Trigger UI refresh
          }
        } else {
          console.log('[Sync] No data to sync (no cloud data, no local data)');
        }
      }
    });

    return unsubscribe;
  }, [applyCloudSettings]);

  // Sync state listener (Cloud Sync)
  useEffect(() => {
    if (!isSupabaseConfigured) return;

    // Subscribe to sync state changes with re-render optimization
    const unsubscribe = subscribeSyncState((state) => {
      setSyncStatus((prev) => (prev === state.status ? prev : state.status));
      setSyncError((prev) => (prev === state.error ? prev : state.error));
    });

    // Initialize network listeners
    const cleanupNetwork = initNetworkListeners();

    return () => {
      unsubscribe();
      cleanupNetwork();
    };
  }, []);

  // Set up reconnect callback to process pending changes (Cloud Sync)
  useEffect(() => {
    if (!isSupabaseConfigured) return;

    setOnReconnectCallback(async () => {
      if (user) {
        const userId = user.id;
        const result = await processPendingChanges(userId);

        // Bail out if user changed during async operation (security: prevent cross-account data leakage)
        if (activeUserIdRef.current !== userId) {
          console.log('[Sync] Reconnect: User changed during pending changes processing, aborting');
          return;
        }

        // Always update local IDs with database UUIDs, even on partial failure
        // This prevents duplicate inserts for texts that succeeded
        if (result.insertedTexts?.length > 0) {
          customTextStorage.updateWithDbIds(result.insertedTexts);
          setHistoryRefreshKey((k) => k + 1); // Trigger UI refresh after ID update
        }
        if (result.success) {
          updateSyncServiceStatus('synced');
        } else if (result.offline) {
          // Still offline, keep status as offline
          updateSyncServiceStatus('offline');
        } else {
          updateSyncServiceStatus('error', result.error);
        }
      } else {
        updateSyncServiceStatus('synced');
      }
    });

    return () => setOnReconnectCallback(null);
  }, [user]);

  // Apply dark class to document based on computed theme
  useEffect(() => {
    const isDark = theme === 'dark' || (theme === 'geek') || (theme === 'cyber'); // geek and cyber are always dark-ish
    document.documentElement.classList.toggle('dark', isDark && theme !== 'geek' && theme !== 'cyber');
  }, [theme]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e) => {
      // Prevent repeat triggers from holding keys
      if (e.repeat) return;
      
      const key = e.key.toLowerCase();
      
      // Handle focus mode escape (even without modifier)
      if (key === 'escape' && focusMode) {
        e.preventDefault();
        e.stopPropagation();
        setFocusMode(false);
        return;
      }

      // Handle shortcuts first, regardless of focus state
      if (e.ctrlKey || e.metaKey) {
        // Ctrl/Cmd + Shift + F: Toggle focus mode
        if (key === 'f' && e.shiftKey) {
          e.preventDefault();
          e.stopPropagation();
          setFocusMode(prev => !prev);
          return;
        }
        // Ctrl/Cmd + I: Toggle IPA
        if (key === 'i') {
          e.preventDefault();
          e.stopPropagation();
          setShowIPA(prev => !prev);
          return;
        }
        // Ctrl/Cmd + S: Toggle sound
        if (key === 's') {
          e.preventDefault();
          e.stopPropagation();
          toggleSound();
          return;
        }
        // Ctrl/Cmd + H: Toggle history
        if (key === 'h') {
          e.preventDefault();
          e.stopPropagation();
          setShowHistory(prev => !prev);
          return;
        }
        // Ctrl/Cmd + D: Toggle dictation mode
        if (key === 'd') {
          e.preventDefault();
          e.stopPropagation();
          setDictationMode(prev => !prev);
          return;
        }
        // Ctrl/Cmd + T: Toggle theme (cycle through light/dark/system/geek/cyber)
        if (key === 't') {
          e.preventDefault();
          e.stopPropagation();
          setThemePreference(prev => {
            // Full cycle: light -> dark -> system -> geek -> cyber -> light
            if (prev === 'light') return 'dark';
            if (prev === 'dark') return 'system';
            if (prev === 'system') return 'geek';
            if (prev === 'geek') return 'cyber';
            return 'light';
          });
          setThemeExplicitlySet(true);
          return;
        }
      }
      
      // For non-shortcut keys, don't trigger when user is typing in form fields
      const el = document.activeElement;
      const tag = el?.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT' || el?.isContentEditable) return;
    };

    // Use capture phase to ensure shortcuts have priority over component handlers
    window.addEventListener('keydown', handleKeyDown, { capture: true });
    return () => window.removeEventListener('keydown', handleKeyDown, { capture: true });
  }, [focusMode]); // focusMode needed for escape key handler

  // Persist settings when they change
  useEffect(() => {
    settingsStorage.set('themePreference', themePreference);
    settingsStorage.set('themeExplicitlySet', themeExplicitlySet);
    // Also update legacy theme for backwards compatibility
    settingsStorage.set('theme', theme === 'geek' ? 'geek' : 'normal');
  }, [themePreference, themeExplicitlySet, theme]);

  useEffect(() => {
    settingsStorage.set('showIPA', showIPA);
  }, [showIPA]);

  useEffect(() => {
    settingsStorage.set('soundEnabled', soundEnabled);
    audioManager.setEnabled(soundEnabled);
  }, [soundEnabled]);

  useEffect(() => {
    settingsStorage.set('dictationMode', dictationMode);
  }, [dictationMode]);

  useEffect(() => {
    settingsStorage.set('showHistory', showHistory);
  }, [showHistory]);

  useEffect(() => {
    settingsStorage.set('activeSection', activeSection);
  }, [activeSection]);

  useEffect(() => {
    settingsStorage.set('focusMode', focusMode);
  }, [focusMode]);

  // Persist Reference Mode settings
  useEffect(() => {
    settingsStorage.set('splitRatio', splitRatio);
  }, [splitRatio]);

  useEffect(() => {
    settingsStorage.set('centerAreaHeight', centerAreaHeight);
  }, [centerAreaHeight]);

  // Sync settings to cloud when they change (debounced)
  useEffect(() => {
    if (!isSupabaseConfigured || !user) return;

    const userId = user.id;
    // Debounce to avoid rapid API calls
    const timeoutId = setTimeout(async () => {
      if (activeUserIdRef.current !== userId) {
        console.log('[Sync] Settings sync aborted due to user change');
        return;
      }
      const allSettings = settingsStorage.get();
      console.log('[Sync] Settings changed, syncing to cloud...');
      const result = await syncSettingsToCloud(allSettings, userId);

      // Bail out if user changed during async operation
      if (activeUserIdRef.current !== userId) {
        console.log('[Sync] Settings sync: User changed during operation, aborting');
        return;
      }

      if (!result.success) {
        console.error('[Sync] Settings sync failed:', result.error);
      }
    }, 1000); // 1 second debounce

    return () => clearTimeout(timeoutId);
  }, [user, themePreference, themeExplicitlySet, showIPA, soundEnabled, dictationMode, showHistory, activeSection, focusMode, splitRatio, centerAreaHeight]);

  const handleTextSelect = (textOrEntry) => {
    if (typeof textOrEntry === 'string') {
      // Legacy string format
      setSelectedEntry({
        text: textOrEntry,
        mode: 'normal'
      });
    } else {
      // New entry object format
      setSelectedEntry(textOrEntry);
    }
  };

  // Handle new custom text added - sync only the new entry to cloud
  const handleTextAdded = useCallback(async (savedEntry) => {
    if (!isSupabaseConfigured || !user) return;

    const userId = user.id;
    console.log('[Sync] New text added, syncing to cloud...');
    // Only sync the new entry, not all texts (avoids duplicates and improves perf)
    const result = await syncCustomTextsToCloud([savedEntry], userId);

    // Bail out if user changed during async operation
    if (activeUserIdRef.current !== userId) {
      console.log('[Sync] User changed during text add sync, aborting');
      return;
    }

    if (result.success && result.insertedTexts?.length > 0) {
      customTextStorage.updateWithDbIds(result.insertedTexts);
      setHistoryRefreshKey((k) => k + 1);
      console.log('[Sync] New text synced successfully');
    } else if (!result.success) {
      console.error('[Sync] Failed to sync new text:', result.error);
      setSyncError(result.error || 'Failed to sync new text');
      updateSyncServiceStatus('error', result.error || 'Failed to sync new text');
    }
  }, [user]);

  // Handle custom text deleted - sync deletion to cloud
  const handleTextDeleted = useCallback(async (textId) => {
    if (!isSupabaseConfigured || !user) return;

    const userId = user.id;
    console.log('[Sync] Text deleted, syncing to cloud...');
    const result = await deleteCustomTextFromCloud(textId, userId);

    // Bail out if user changed during async operation
    if (activeUserIdRef.current !== userId) {
      console.log('[Sync] User changed during text delete sync, aborting');
      return;
    }

    if (!result.success) {
      console.error('[Sync] Failed to sync text deletion:', result.error);
      setSyncError(result.error || 'Failed to sync text deletion');
      updateSyncServiceStatus('error', result.error || 'Failed to sync text deletion');
    } else {
      console.log('[Sync] Text deletion synced successfully');
    }
  }, [user]);

  // Handle clear all texts - sync to cloud
  const handleClearAllTexts = useCallback(async () => {
    if (!isSupabaseConfigured || !user) return;

    const userId = user.id;
    console.log('[Sync] Clearing all texts, syncing to cloud...');
    const result = await clearAllCustomTextsFromCloud(userId);

    // Bail out if user changed during async operation
    if (activeUserIdRef.current !== userId) {
      console.log('[Sync] User changed during clear all sync, aborting');
      return;
    }

    if (!result.success) {
      console.error('[Sync] Failed to sync clear all:', result.error);
      setSyncError(result.error || 'Failed to sync clear all');
      updateSyncServiceStatus('error', result.error || 'Failed to sync clear all');
    } else {
      console.log('[Sync] Clear all synced successfully');
    }
  }, [user]);

  const handleComplete = (stats) => {
    const wordCount = selectedEntry.text.trim().split(/\s+/).length;
    setCompletedSessions(prev => [...prev, {
      ...stats,
      timestamp: Date.now(),
      wordCount
    }]);
    setHasTypingProgress(false); // Reset progress on completion
  };

  // Handle typing progress updates (US4)
  const handleProgressChange = (position) => {
    setHasTypingProgress(position > 0);
  };

  // Handle tab switching with progress warning (US4)
  const handleSectionChange = (newSection) => {
    if (hasTypingProgress && newSection !== activeSection) {
      setPendingSection(newSection);
    } else {
      setActiveSection(newSection);
      setHasTypingProgress(false);
    }
  };

  const confirmSectionChange = () => {
    if (pendingSection) {
      setActiveSection(pendingSection);
      setHasTypingProgress(false);
      setPendingSection(null);
    }
  };

  const cancelSectionChange = () => {
    setPendingSection(null);
  };

  const toggleSound = () => {
    setSoundEnabled(prev => !prev);
  };

  // Auth handlers (Cloud Sync)
  const handleSignIn = useCallback(async (email) => {
    setAuthState('loading');
    setAuthError(null);

    const result = await signInWithMagicLink(email);

    if (result.success) {
      setAuthState('awaiting');
    } else {
      setAuthState('error');
      setAuthError(result.error);
    }
  }, []);

  const handleSignOut = useCallback(async () => {
    const result = await authSignOut();
    if (!result.success) {
      console.error('Sign out error:', result.error);
    }
  }, []);

  const handleAuthCancel = useCallback(() => {
    setAuthState('idle');
    setAuthError(null);
  }, []);

  const handleSyncRetry = useCallback(async () => {
    if (!user?.id) return;

    console.log('[Sync] Retry triggered by user');
    setSyncError(null); // Clear error state first
    const userId = user.id;

    // First try to process any pending changes
    const pendingResult = await processPendingChanges(userId);

    // Bail out if user changed during async operation
    if (activeUserIdRef.current !== userId) {
      console.log('[Sync] Retry: User changed during pending changes processing, aborting');
      return;
    }

    // Update local IDs from pending processing (if any texts were inserted)
    if (pendingResult.insertedTexts?.length > 0) {
      customTextStorage.updateWithDbIds(pendingResult.insertedTexts);
      setHistoryRefreshKey((k) => k + 1); // Trigger UI refresh after ID update
    }

    // Handle skipped result (another sync in progress) - don't start concurrent sync
    if (pendingResult.skipped) {
      console.log('[Sync] Retry: Pending processing skipped (sync already in progress)');
      // Don't start another sync to avoid concurrent operations
      return;
    }

    // Handle offline result explicitly
    if (pendingResult.offline) {
      console.log('[Sync] Retry: Device is offline');
      setSyncError('Device is offline');
      return;
    }

    // If pending succeeded, do a full sync
    if (pendingResult.success) {
      // Get current local data
      const localTexts = customTextStorage.getAll();
      const localSettings = settingsStorage.get();
      const userId = user.id;

      // Sync local settings to cloud
      const settingsResult = await syncSettingsToCloud(localSettings, userId);
      if (!settingsResult.success) {
        console.error('[Sync] Retry settings sync failed:', settingsResult.error);
        setSyncError(settingsResult.error || 'Settings sync failed');
        return;
      }

      // Bail out if user changed during async operation
      if (activeUserIdRef.current !== userId) {
        console.log('[Sync] Retry: User changed during settings sync, aborting');
        return;
      }

      // Sync local texts to cloud
      if (localTexts.length > 0) {
        const textsResult = await syncCustomTextsToCloud(localTexts, userId);
        if (textsResult.success && textsResult.insertedTexts?.length > 0) {
          customTextStorage.updateWithDbIds(textsResult.insertedTexts);
          setHistoryRefreshKey((k) => k + 1); // Trigger UI refresh after ID update
        } else if (!textsResult.success) {
          console.error('[Sync] Retry texts sync failed:', textsResult.error);
          setSyncError(textsResult.error || 'Texts sync failed');
          return;
        }
      }

      // Bail out if user changed during async operation
      if (activeUserIdRef.current !== userId) {
        console.log('[Sync] Retry: User changed during texts sync, aborting');
        return;
      }

      console.log('[Sync] Retry sync completed successfully');
    } else {
      console.error('[Sync] Retry pending changes failed:', pendingResult.error);
      setSyncError(pendingResult.error || 'Pending changes sync failed');
    }
  }, [user]);

  const handleForceSync = useCallback(async () => {
    if (!user?.id) return;

    console.log('[Sync] Force sync triggered by user');
    setSyncError(null); // Clear any previous error
    const userId = user.id;

    // Get current local data
    const localTexts = customTextStorage.getAll();
    const localSettings = settingsStorage.get();
    console.log(`[Sync] Force sync: ${localTexts.length} local texts, settings:`, Object.keys(localSettings).length);

    let pushSucceeded = true;
    let lastError = null;

    // Sync local settings to cloud
    const settingsSyncResult = await syncSettingsToCloud(localSettings, userId);
    console.log('[Sync] Force sync settings result:', settingsSyncResult);
    if (!settingsSyncResult.success) {
      console.error('[Sync] Force sync settings push failed, skipping pull');
      pushSucceeded = false;
      lastError = settingsSyncResult.error;
    }

    // Bail out if user changed during async operation (security: prevent cross-account data leakage)
    if (activeUserIdRef.current !== userId) {
      console.log('[Sync] Force sync: User changed during settings push, aborting');
      return;
    }

    // Sync local texts to cloud
    if (localTexts.length > 0) {
      const syncResult = await syncCustomTextsToCloud(localTexts, userId);
      console.log('[Sync] Force sync texts result:', syncResult);

      if (syncResult.success && syncResult.insertedTexts?.length > 0) {
        customTextStorage.updateWithDbIds(syncResult.insertedTexts);
        setHistoryRefreshKey((k) => k + 1); // Trigger UI refresh after ID update
      } else if (!syncResult.success) {
        console.error('[Sync] Force sync texts push failed, skipping pull');
        pushSucceeded = false;
        lastError = syncResult.error;
      }
    }

    // Bail out if user changed during async operation
    if (activeUserIdRef.current !== userId) {
      console.log('[Sync] Force sync: User changed during texts push, aborting');
      return;
    }

    // Only pull from cloud if push succeeded to avoid data loss
    if (!pushSucceeded) {
      console.warn('[Sync] Force sync: push failed, not pulling from cloud to avoid data loss');
      setSyncError(lastError || 'Sync push failed');
      return;
    }

    // Load settings from cloud and apply
    const cloudSettings = await loadSettingsFromCloud(userId);
    console.log('[Sync] Force sync cloud settings:', cloudSettings);

    // Check for cloud settings load error
    if (cloudSettings.error) {
      console.error('[Sync] Force sync: Failed to load cloud settings:', cloudSettings.error);
      setSyncError(cloudSettings.error);
      return;
    }

    // Bail out if user changed during async operation
    if (activeUserIdRef.current !== userId) {
      console.log('[Sync] Force sync: User changed during settings load, aborting');
      return;
    }

    // Load texts from cloud to ensure we have latest
    const cloudResult = await loadCustomTextsFromCloud(userId);
    console.log('[Sync] Force sync cloud texts:', cloudResult);

    // Check for cloud texts load error
    if (cloudResult.error) {
      console.error('[Sync] Force sync: Failed to load cloud texts:', cloudResult.error);
      setSyncError(cloudResult.error);
      return;
    }

    // Bail out if user changed during async operation
    if (activeUserIdRef.current !== userId) {
      console.log('[Sync] Force sync: User changed during texts load, aborting');
      return;
    }

    // Apply texts BEFORE settings to avoid partial state
    if (cloudResult.texts && cloudResult.texts.length > 0) {
      const storageSuccess = customTextStorage.replaceAll(cloudResult.texts);
      if (!storageSuccess) {
        console.error('[Sync] Force sync: Failed to save cloud texts locally');
        setSyncError('Failed to save data locally');
        updateSyncServiceStatus('error', 'Failed to save data locally');
        return;
      }
      setHistoryRefreshKey((k) => k + 1);
    }

    // Apply settings only after texts storage succeeded
    applyCloudSettings(cloudSettings.settings);

    // Clear pending changes only after successful force sync to prevent duplicates on reconnect
    clearPendingChanges();

    console.log('[Sync] Force sync complete');
  }, [user, applyCloudSettings]);

  // Force overwrite remote with local data (destructive)
  const handleForceOverwrite = useCallback(async () => {
    if (!user?.id) return;

    console.log('[Sync] Force overwrite remote triggered by user');
    const userId = user.id;

    // Get current local data
    const localTexts = customTextStorage.getAll();
    const localSettings = settingsStorage.get();
    console.log(`[Sync] Force overwrite: ${localTexts.length} local texts, settings keys: ${Object.keys(localSettings).length}`);

    const result = await forceOverwriteRemoteWithLocal(userId, localSettings, localTexts);

    // Bail out if user changed during async operation
    if (activeUserIdRef.current !== userId) {
      console.log('[Sync] Force overwrite: User changed during operation, aborting');
      return;
    }

    if (result.success) {
      console.log('[Sync] Force overwrite successful');
      setSyncError(null); // Clear any previous error
      // Update local text IDs with new DB IDs (with error handling)
      if (result.insertedTexts?.length > 0) {
        try {
          const storageSuccess = customTextStorage.replaceAll(result.insertedTexts.map(t => ({
            id: t.id,
            text: t.text,
            mode: t.mode,
            referenceText: t.reference_text,
            wordCount: t.word_count,
            createdAt: t.created_at,
            updatedAt: t.updated_at,
          })));
          if (!storageSuccess) {
            throw new Error('Failed to save data locally');
          }
          setHistoryRefreshKey((k) => k + 1);
        } catch (storageErr) {
          console.error('[Sync] Force overwrite storage error:', storageErr);
          setSyncError('Failed to save data locally');
          updateSyncServiceStatus('error', 'Failed to save data locally');
          throw new Error('Failed to save data locally'); // Keep modal open with actionError
        }
      }
    } else {
      console.error('[Sync] Force overwrite failed:', result.error);
      const errorMsg = result.error || 'Force overwrite failed';
      setSyncError(errorMsg); // Surface error to UI
      throw new Error(errorMsg); // Throw so SyncStatus modal can display actionError
    }
  }, [user]);

  // Force use remote data (overwrite local with cloud) - destructive to local
  const handleForceUseRemote = useCallback(async () => {
    if (!user?.id) return;

    console.log('[Sync] Force use remote triggered by user');
    const userId = user.id;

    const result = await forceUseRemoteData(userId);

    // Bail out if user changed during async operation
    if (activeUserIdRef.current !== userId) {
      console.log('[Sync] Force use remote: User changed during operation, aborting');
      return;
    }

    if (result.success) {
      console.log('[Sync] Force use remote successful');
      setSyncError(null); // Clear any previous error

      // Replace local texts with cloud texts BEFORE applying settings
      // This ensures we don't have partial state if storage fails
      try {
        let storageSuccess;
        if (result.texts && result.texts.length > 0) {
          storageSuccess = customTextStorage.replaceAll(result.texts);
        } else {
          // Cloud has no texts, clear local
          storageSuccess = customTextStorage.clearAll();
        }
        if (!storageSuccess) {
          throw new Error('Failed to save data locally');
        }
        setHistoryRefreshKey((k) => k + 1);
      } catch (storageErr) {
        console.error('[Sync] Force use remote storage error:', storageErr);
        setSyncError('Failed to save data locally');
        updateSyncServiceStatus('error', 'Failed to save data locally');
        throw new Error('Failed to save data locally'); // Keep modal open with actionError
      }

      // Apply settings from cloud only after texts storage succeeded
      applyCloudSettings(result.settings);
    } else {
      console.error('[Sync] Force use remote failed:', result.error);
      const errorMsg = result.error || 'Force use remote failed';
      setSyncError(errorMsg);
      throw new Error(errorMsg); // Throw so SyncStatus modal can display actionError
    }
  }, [user, applyCloudSettings]);

  // Cancel active sync operation (for timeout/hanging syncs)
  const handleCancelSync = useCallback(() => {
    console.log('[Sync] User requested sync cancellation');
    cancelActiveSync();
  }, []);

  // Discard pending changes and clear error state
  const handleDiscardPending = useCallback(() => {
    console.log('[Sync] User discarding pending changes');
    clearPendingChanges();
    updateSyncServiceStatus('synced');
    setSyncError(null);
  }, []);

  // Determine if we should show reference workspace based on whether entry has reference text
  const shouldShowReference = selectedEntry.referenceText && selectedEntry.referenceText.trim().length > 0;

  return (
    <div className={`min-h-screen flex flex-col ${
      theme === 'geek' 
        ? 'bg-black text-green-400 font-mono' 
        : theme === 'cyber'
        ? 'cyber-grid-bg text-cyan-400 font-mono overflow-x-hidden selection:bg-cyan-500/30 selection:text-cyan-100'
        : 'bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-950'
    }`}>
      {theme === 'cyber' && <div className="cyber-scanlines" />}
      {/* Fixed Header - hidden in focus mode */}
      <header className={`sticky top-0 z-50 backdrop-blur-md border-b focus-fade-out ${
        focusMode ? 'focus-mode-hidden' : ''
      } ${
        theme === 'geek'
          ? 'bg-black/90 border-green-500/30 shadow-lg shadow-green-500/10'
          : theme === 'cyber'
          ? 'bg-black/80 border-cyan-500/30 shadow-[0_0_15px_rgba(0,243,255,0.2)]'
          : 'bg-white/80 dark:bg-gray-900/80 border-gray-200 dark:border-gray-800'
      }`}>
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <img 
                src={`${import.meta.env.BASE_URL}favicon.png`}
                alt="Zen Typing Logo" 
                className={`w-10 h-10 ${theme === 'geek' ? 'filter brightness-0 invert hue-rotate-90' : theme === 'cyber' ? 'filter brightness-0 invert hue-rotate-180 drop-shadow-[0_0_5px_rgba(0,243,255,0.8)]' : ''}`}
              />
              <div>
                <h1 className={`text-2xl font-bold ${
                  theme === 'geek' 
                    ? 'text-green-400 font-mono tracking-wider' 
                    : theme === 'cyber'
                    ? 'text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-purple-500 font-mono tracking-wider text-shadow-cyber'
                    : 'text-gray-800 dark:text-gray-100'
                }`}>
                  {theme === 'geek' ? '> ZEN.TYPING' : theme === 'cyber' ? 'ZEN_TYPING_V2.0' : 'Zen Typing'}
                </h1>
                <p className={`text-xs ${
                  theme === 'geek' 
                    ? 'text-green-400/70 font-mono' 
                    : theme === 'cyber'
                    ? 'text-cyan-400/70 font-mono animate-pulse'
                    : 'text-gray-600 dark:text-gray-400'
                }`}>
                  {theme === 'geek' ? '// hack.your.typing.skills' : theme === 'cyber' ? '>> INITIATING NEURAL LINK...' : 'Master typing with pronunciation'}
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              {/* Desktop: IPA Toggle - hidden on mobile */}
              <button
                onClick={() => setShowIPA(!showIPA)}
                type="button"
                aria-pressed={showIPA}
                aria-label="Toggle IPA pronunciation display"
                className={`hidden md:flex items-center gap-2 px-4 py-2 min-w-[44px] min-h-[44px] text-sm font-medium transition-all ${
                  theme === 'geek'
                    ? `font-mono border ${
                        showIPA
                          ? 'bg-green-900/50 border-green-400 text-green-400 shadow-lg shadow-green-400/20'
                          : 'bg-black/50 border-green-500/30 text-green-400/70 hover:border-green-400 hover:text-green-400'
                      }`
                    : `rounded-lg ${
                        showIPA
                          ? 'bg-indigo-500 text-white shadow-lg shadow-indigo-500/20'
                          : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
                      }`
                }`}
                title="Toggle IPA (Ctrl+I)"
              >
                <span>{theme === 'geek' ? (showIPA ? '[+]' : '[ ]') : (showIPA ? '🔤' : '🔡')}</span>
                <span className="hidden lg:inline">{theme === 'geek' ? 'IPA' : 'IPA'}</span>
                <kbd className={`hidden lg:inline-block ml-1 px-1.5 py-0.5 text-xs rounded ${
                  theme === 'geek'
                    ? 'bg-green-500/20 text-green-400'
                    : 'bg-black/10 dark:bg-white/10'
                }`}>
                  {theme === 'geek' ? 'CTRL+I' : '⌘I'}
                </kbd>
              </button>

              {/* Desktop: Sound Toggle - hidden on mobile */}
              <button
                onClick={toggleSound}
                type="button"
                aria-pressed={soundEnabled}
                aria-label="Toggle typing sounds"
                className={`hidden md:flex items-center gap-2 px-4 py-2 min-w-[44px] min-h-[44px] text-sm font-medium transition-all ${
                  theme === 'geek'
                    ? `font-mono border ${
                        soundEnabled
                          ? 'bg-green-900/50 border-green-400 text-green-400 shadow-lg shadow-green-400/20'
                          : 'bg-black/50 border-green-500/30 text-green-400/70 hover:border-green-400 hover:text-green-400'
                      }`
                    : `rounded-lg ${
                        soundEnabled
                          ? 'bg-green-500 text-white shadow-lg shadow-green-500/20'
                          : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
                      }`
                }`}
                title="Toggle Sound (Ctrl+S)"
              >
                <span>{theme === 'geek' ? (soundEnabled ? '[♪]' : '[x]') : (soundEnabled ? '🔊' : '🔇')}</span>
                <span className="hidden lg:inline">Sound</span>
                <kbd className={`hidden lg:inline-block ml-1 px-1.5 py-0.5 text-xs rounded ${
                  theme === 'geek'
                    ? 'bg-green-500/20 text-green-400'
                    : 'bg-black/10 dark:bg-white/10'
                }`}>
                  {theme === 'geek' ? 'CTRL+S' : '⌘S'}
                </kbd>
              </button>

              {/* Desktop: Dictation Toggle - hidden on mobile, in settings menu */}
              <button
                onClick={() => setDictationMode(!dictationMode)}
                type="button"
                aria-pressed={dictationMode}
                aria-label="Toggle dictation mode - hides untyped text with first character hints"
                className={`hidden lg:flex items-center gap-2 px-4 py-2 min-w-[44px] min-h-[44px] text-sm font-medium transition-all ${
                  theme === 'geek'
                    ? `font-mono border ${
                        dictationMode
                          ? 'bg-green-900/50 border-green-400 text-green-400 shadow-lg shadow-green-400/20'
                          : 'bg-black/50 border-green-500/30 text-green-400/70 hover:border-green-400 hover:text-green-400'
                      }`
                    : `rounded-lg ${
                        dictationMode
                          ? 'bg-purple-500 text-white shadow-lg shadow-purple-500/20'
                          : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
                      }`
                }`}
                title="Toggle Dictation Mode (Ctrl+D)"
              >
                <span>{theme === 'geek' ? (dictationMode ? '[●]' : '[○]') : (dictationMode ? '👁️' : '👁️‍🗨️')}</span>
                <span className="hidden xl:inline">Dictation</span>
                <kbd className={`hidden xl:inline-block ml-1 px-1.5 py-0.5 text-xs rounded ${
                  theme === 'geek'
                    ? 'bg-green-500/20 text-green-400'
                    : 'bg-black/10 dark:bg-white/10'
                }`}>
                  {theme === 'geek' ? 'CTRL+D' : '⌘D'}
                </kbd>
              </button>

              {/* Desktop: Theme Toggle - hidden on mobile, in settings menu */}
              <button
                onClick={() => {
                  setThemePreference(prev => {
                    // Full cycle: light -> dark -> system -> geek -> cyber -> light
                    if (prev === 'light') return 'dark';
                    if (prev === 'dark') return 'system';
                    if (prev === 'system') return 'geek';
                    if (prev === 'geek') return 'cyber';
                    return 'light';
                  });
                  setThemeExplicitlySet(true);
                }}
                type="button"
                aria-pressed={theme === 'geek' || theme === 'cyber'}
                aria-label="Toggle between light, dark, geek, and cyber theme"
                className={`hidden lg:flex items-center gap-2 px-4 py-2 min-w-[44px] min-h-[44px] text-sm font-medium transition-all ${
                  theme === 'geek'
                    ? 'font-mono border bg-green-900/50 border-green-400 text-green-400 shadow-lg shadow-green-400/20'
                    : theme === 'cyber'
                    ? 'font-mono border bg-cyan-900/20 border-cyan-400 text-cyan-400 shadow-lg shadow-cyan-400/50 text-shadow-neon'
                    : theme === 'dark'
                    ? 'rounded-lg bg-gray-700 text-gray-100 hover:bg-gray-600'
                    : 'rounded-lg bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
                }`}
                title="Toggle Theme (Ctrl+T)"
              >
                <span>{theme === 'geek' ? '[T]' : theme === 'cyber' ? '<T>' : theme === 'dark' ? '🌙' : '☀️'}</span>
                <span className="hidden xl:inline">{theme === 'geek' ? 'GEEK' : theme === 'cyber' ? 'CYBER' : theme === 'dark' ? 'Dark' : 'Light'}</span>
                <kbd className={`hidden xl:inline-block ml-1 px-1.5 py-0.5 text-xs rounded ${
                  theme === 'geek'
                    ? 'bg-green-500/20 text-green-400'
                    : theme === 'cyber'
                    ? 'bg-cyan-500/20 text-cyan-300'
                    : 'bg-black/10 dark:bg-white/10'
                }`}>
                  {theme === 'geek' ? 'CTRL+T' : theme === 'cyber' ? 'CTRL+T' : '⌘T'}
                </kbd>
              </button>

              {/* Cloud Sync: Sync Status & Auth Button */}
              {isSupabaseConfigured && (
                <>
                  {user && (
                    <SyncStatus
                      theme={theme}
                      status={syncStatus}
                      errorMessage={syncError}
                      onRetry={handleSyncRetry}
                      onForceSync={handleForceSync}
                      onForceOverwrite={handleForceOverwrite}
                      onForceUseRemote={handleForceUseRemote}
                      onCancelSync={handleCancelSync}
                      onDiscardPending={handleDiscardPending}
                    />
                  )}
                  <AuthButton
                    theme={theme}
                    user={user}
                    authState={authState}
                    authError={authError}
                    onSignIn={handleSignIn}
                    onSignOut={handleSignOut}
                    onCancel={handleAuthCancel}
                  />
                </>
              )}

              {/* Keyboard Shortcuts "?" Button */}
              <button
                ref={shortcutsButtonRef}
                type="button"
                onClick={() => setShowShortcutsHelp(true)}
                aria-label="Show keyboard shortcuts"
                className={`hidden md:flex items-center justify-center min-w-[44px] min-h-[44px] text-sm font-medium transition-all ${
                  theme === 'geek'
                    ? 'font-mono border bg-black/50 border-green-500/30 text-green-400/70 hover:border-green-400 hover:text-green-400'
                    : 'rounded-lg bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
                }`}
                title="Keyboard shortcuts"
              >
                <span className={`text-lg font-bold ${theme === 'geek' ? 'font-mono' : ''}`}>?</span>
              </button>

              {/* Settings Gear Button - visible always, toggles menu */}
              <div className="relative">
                <button
                  ref={settingsButtonRef}
                  type="button"
                  onClick={() => setSettingsMenuOpen(prev => !prev)}
                  aria-label="Open settings menu"
                  aria-expanded={settingsMenuOpen}
                  aria-haspopup="true"
                  className={`flex items-center justify-center min-w-[44px] min-h-[44px] text-sm font-medium transition-all ${
                    theme === 'geek'
                      ? `font-mono border ${settingsMenuOpen ? 'bg-green-900/50 border-green-400 text-green-400' : 'bg-black/50 border-green-500/30 text-green-400/70 hover:border-green-400 hover:text-green-400'}`
                      : `rounded-lg ${settingsMenuOpen ? 'bg-gray-200 dark:bg-gray-700' : 'bg-gray-100 dark:bg-gray-800'} text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700`
                  }`}
                  title="Settings"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                </button>
                <SettingsMenu
                  isOpen={settingsMenuOpen}
                  onClose={() => setSettingsMenuOpen(false)}
                  theme={theme}
                  triggerRef={settingsButtonRef}
                  dictationMode={dictationMode}
                  onDictationToggle={() => setDictationMode(prev => !prev)}
                  showIPA={showIPA}
                  onIPAToggle={() => setShowIPA(prev => !prev)}
                  soundEnabled={soundEnabled}
                  onSoundToggle={toggleSound}
                  themePreference={themePreference}
                  onThemeChange={(pref) => {
                    setThemePreference(pref);
                    setThemeExplicitlySet(true);
                  }}
                  focusMode={focusMode}
                  onFocusModeToggle={() => {
                    setFocusMode(prev => !prev);
                    setSettingsMenuOpen(false);
                  }}
                  onShowShortcuts={() => setShowShortcutsHelp(true)}
                />
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="flex-1 flex flex-col overflow-hidden">
        <div className="container mx-auto px-4 flex-1 flex flex-col py-4">
          <div className="max-w-7xl mx-auto flex-1 flex flex-col gap-4 min-h-0">
            {/* Stats Dashboard - hidden in focus mode */}
            {completedSessions.length > 0 && !focusMode && (
              <div className="flex-shrink-0 focus-fade-out">
                <SessionStats completedSessions={completedSessions} theme={theme} />
              </div>
            )}
            
            
            {/* Main Typing Area */}
            <div className="flex-shrink-0">
              <ResizableContainer
                height={Math.min(centerAreaHeight, Math.floor(windowHeight * 0.6))}
                onHeightChange={(newHeight) => {
                  const maxH = Math.floor(windowHeight * 0.6);
                  setCenterAreaHeight(Math.min(newHeight, maxH));
                }}
                theme={theme}
                minHeight={Math.min(300, Math.floor(windowHeight * 0.35))}
                maxHeight={Math.floor(windowHeight * 0.6)}
              >
                {shouldShowReference ? (
                  <div className={`h-full rounded-2xl shadow-xl overflow-hidden ${
                    theme === 'geek'
                      ? 'bg-black border border-green-500/30 shadow-green-500/20'
                      : theme === 'cyber'
                      ? 'bg-black/40 border border-cyan-500/30 shadow-[0_0_20px_rgba(0,243,255,0.15)] backdrop-blur-sm'
                      : 'bg-white dark:bg-gray-800'
                  }`}>
                    <ReferenceWorkspace
                      key={`${selectedEntry.text}-${selectedEntry.referenceText}`}
                      referenceText={selectedEntry.referenceText}
                      typingText={selectedEntry.text}
                      onComplete={handleComplete}
                      onProgressChange={handleProgressChange}
                      showIPA={showIPA}
                      dictationMode={dictationMode}
                      theme={theme}
                      splitRatio={splitRatio}
                      onSplitRatioChange={setSplitRatio}
                      height={centerAreaHeight - 64} // Subtract padding
                    />
                  </div>
                ) : (
                  <div 
                    className={`h-full rounded-2xl shadow-xl overflow-hidden ${
                      theme === 'geek'
                        ? 'bg-black border border-green-500/30 shadow-green-500/20'
                        : theme === 'cyber'
                        ? 'bg-black/40 border border-cyan-500/30 shadow-[0_0_20px_rgba(0,243,255,0.15)] backdrop-blur-sm'
                        : 'bg-white dark:bg-gray-800'
                    }`}
                  >
                    <TypingArea
                      key={selectedEntry.text}
                      text={selectedEntry.text}
                      onComplete={handleComplete}
                      onProgressChange={handleProgressChange}
                      showIPA={showIPA}
                      dictationMode={dictationMode}
                      theme={theme}
                    />
                  </div>
                )}
              </ResizableContainer>
            </div>

            {/* Content Selection with Tabs - hidden in focus mode */}
            <div className={`flex-1 overflow-y-auto min-h-0 focus-fade-out ${
              focusMode ? 'focus-mode-hidden' : ''
            } ${
              theme === 'geek' ? 'custom-scrollbar-geek' : theme === 'cyber' ? 'custom-scrollbar-cyber' : 'custom-scrollbar'
            }`}>
          <div className={`rounded-2xl shadow-lg p-6 ${
            theme === 'geek'
              ? 'bg-black border border-green-500/30 shadow-green-500/20'
              : theme === 'cyber'
              ? 'bg-black/60 border border-cyan-500/30 shadow-[0_0_10px_rgba(0,243,255,0.1)] backdrop-blur-md'
              : 'bg-white dark:bg-gray-800'
          }`}>
            {/* Tab Navigation */}
            <div className={`flex space-x-1 mb-6 p-1 rounded-lg ${
              theme === 'geek'
                ? 'bg-green-900/20 border border-green-500/30'
                : theme === 'cyber'
                ? 'bg-cyan-900/10 border border-cyan-500/20'
                : 'bg-gray-100 dark:bg-gray-700'
            }`}>
              <button
                onClick={() => handleSectionChange('practice')}
                className={`flex-1 px-4 py-2 min-h-[44px] rounded-md transition-all ${
                  theme === 'geek'
                    ? `font-mono ${
                        activeSection === 'practice'
                          ? 'bg-green-900/50 border border-green-400 text-green-400 shadow-sm'
                          : 'text-green-400/70 hover:text-green-400 hover:bg-green-900/30'
                      }`
                    : theme === 'cyber'
                    ? `font-mono ${
                        activeSection === 'practice'
                          ? 'bg-cyan-500/20 border border-cyan-400 text-cyan-300 shadow-[0_0_10px_rgba(0,243,255,0.3)]'
                          : 'text-cyan-700 hover:text-cyan-400 hover:bg-cyan-900/30'
                      }`
                    : `font-medium ${
                        activeSection === 'practice'
                          ? 'bg-white dark:bg-gray-600 text-gray-900 dark:text-white shadow-sm'
                          : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                      }`
                }`}
              >
                {theme === 'geek' ? '[>] PRACTICE.TEMPLATES' : theme === 'cyber' ? '>> PRACTICE_MODULES' : 'Practice Templates'}
              </button>
              <button
                onClick={() => handleSectionChange('custom')}
                className={`flex-1 px-4 py-2 min-h-[44px] rounded-md transition-all ${
                  theme === 'geek'
                    ? `font-mono ${
                        activeSection === 'custom'
                          ? 'bg-green-900/50 border border-green-400 text-green-400 shadow-sm'
                          : 'text-green-400/70 hover:text-green-400 hover:bg-green-900/30'
                      }`
                    : theme === 'cyber'
                    ? `font-mono ${
                        activeSection === 'custom'
                          ? 'bg-cyan-500/20 border border-cyan-400 text-cyan-300 shadow-[0_0_10px_rgba(0,243,255,0.3)]'
                          : 'text-cyan-700 hover:text-cyan-400 hover:bg-cyan-900/30'
                      }`
                    : `font-medium ${
                        activeSection === 'custom'
                          ? 'bg-white dark:bg-gray-600 text-gray-900 dark:text-white shadow-sm'
                          : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                      }`
                }`}
              >
                {theme === 'geek' ? '[+] CUSTOM.TEXT' : theme === 'cyber' ? '>> CUSTOM_INPUT' : 'Custom Text'}
              </button>
            </div>

            {/* Tab Content */}
            <div className="transition-all duration-300">
              {activeSection === 'practice' ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {sampleTexts.map((text) => (
                    <button
                      key={text.id}
                      onClick={() => handleTextSelect(text.text)}
                      className={`group p-5 rounded-xl border transition-all duration-300 text-left transform hover:-translate-y-1 ${
                        theme === 'geek'
                          ? 'bg-black border-green-500/30 hover:border-green-400 hover:shadow-lg hover:shadow-green-400/20 font-mono'
                          : 'bg-gradient-to-br from-gray-50 to-white dark:from-gray-700 dark:to-gray-750 border-gray-200 dark:border-gray-600 hover:border-indigo-300 dark:hover:border-indigo-500 hover:shadow-lg'
                      }`}
                    >
                      <h3 className={`font-semibold transition-colors ${
                        theme === 'geek'
                          ? 'text-green-400 group-hover:text-green-300 font-mono'
                          : 'text-gray-800 dark:text-gray-200 group-hover:text-indigo-600 dark:group-hover:text-indigo-400'
                      }`}>
                        {theme === 'geek' ? `> ${text.title.toUpperCase()}` : text.title}
                      </h3>
                      <p className={`text-sm mt-2 line-clamp-2 ${
                        theme === 'geek'
                          ? 'text-green-400/70 font-mono'
                          : 'text-gray-600 dark:text-gray-400'
                      }`}>
                        {theme === 'geek' ? `// ${text.text}` : text.text}
                      </p>
                      <div className="flex gap-2 mt-3">
                        <span className={`text-xs px-2 py-1 font-medium ${
                          theme === 'geek'
                            ? `font-mono border ${
                                text.difficulty === 'easy' ? 'border-green-500/50 text-green-400 bg-green-900/20' :
                                text.difficulty === 'medium' ? 'border-yellow-500/50 text-yellow-400 bg-yellow-900/20' :
                                'border-red-500/50 text-red-400 bg-red-900/20'
                              }`
                            : `rounded-full ${
                                text.difficulty === 'easy' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' :
                                text.difficulty === 'medium' ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400' :
                                'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                              }`
                        }`}>
                          {theme === 'geek' ? `[${text.difficulty.toUpperCase()}]` : text.difficulty}
                        </span>
                        <span className={`text-xs px-2 py-1 ${
                          theme === 'geek'
                            ? 'font-mono border border-green-500/30 text-green-400/70 bg-green-900/10'
                            : 'bg-gray-100 dark:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-full'
                        }`}>
                          {theme === 'geek' ? `{${text.category.toUpperCase()}}` : text.category}
                        </span>
                      </div>
                    </button>
                  ))}
                </div>
              ) : (
                <div>
                  <div className="flex justify-between items-center mb-4">
                    <h3 className={`text-lg font-medium ${
                      theme === 'geek'
                        ? 'text-green-400 font-mono'
                        : 'text-gray-800 dark:text-gray-200'
                    }`}>
                      {theme === 'geek' ? '> CUSTOM.TEXT.INPUT' : 'Add Your Own Text'}
                    </h3>
                    <button
                      onClick={() => setShowHistory(!showHistory)}
                      className={`px-3 py-1.5 text-sm font-medium transition-all ${
                        theme === 'geek'
                          ? `font-mono border ${
                              showHistory 
                                ? 'bg-green-900/50 border-green-400 text-green-400' 
                                : 'bg-black/50 border-green-500/30 text-green-400/70 hover:border-green-400 hover:text-green-400'
                            }`
                          : `rounded-lg ${
                              showHistory 
                                ? 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400' 
                                : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                            }`
                      }`}
                    >
                      {theme === 'geek' 
                        ? (showHistory ? '[HIDE.LOG]' : '[SHOW.LOG]') 
                        : (showHistory ? '📂 History' : '📁 History')
                      }
                    </button>
                  </div>
                  <TextInput
                    onTextSubmit={handleTextSelect}
                    onTextAdded={handleTextAdded}
                    theme={theme}
                  />
                  <CustomTextHistory
                    isVisible={showHistory}
                    onSelectText={handleTextSelect}
                    onTextDeleted={handleTextDeleted}
                    onClearAll={handleClearAllTexts}
                    theme={theme}
                    refreshKey={historyRefreshKey}
                  />
                </div>
              )}
            </div>
          </div>

          {/* Recent Sessions - Minimalist Display */}
          {completedSessions.length > 0 && (
            <div className={`mt-8 rounded-xl shadow-sm p-6 ${
              theme === 'geek'
                ? 'bg-black border border-green-500/30'
                : theme === 'cyber'
                ? 'bg-black/60 border border-cyan-500/30 backdrop-blur-md'
                : 'bg-white dark:bg-gray-800'
            }`}>
              <h3 className={`text-sm font-medium mb-4 uppercase tracking-wide ${
                theme === 'geek'
                  ? 'text-green-400 font-mono'
                  : theme === 'cyber'
                  ? 'text-cyan-400 font-mono text-shadow-neon'
                  : 'text-gray-600 dark:text-gray-400'
              }`}>
                {theme === 'geek' ? '> SESSION.LOG' : theme === 'cyber' ? '>> SYSTEM_LOGS' : 'Recent Sessions'}
              </h3>
              <div className="space-y-3">
                {completedSessions.slice(-3).reverse().map((session) => (
                  <div 
                    key={session.timestamp} 
                    className={`flex items-center justify-between py-3 px-4 rounded-lg transition-colors ${
                      theme === 'geek'
                        ? 'bg-green-900/10 border border-green-500/20 hover:bg-green-900/20 hover:border-green-500/30'
                        : theme === 'cyber'
                        ? 'bg-cyan-900/10 border border-cyan-500/20 hover:bg-cyan-500/20 hover:border-cyan-400/50'
                        : 'bg-gray-50 dark:bg-gray-700/50 hover:bg-gray-100 dark:hover:bg-gray-700'
                    }`}
                  >
                    <div className="flex items-center gap-6">
                      <div className="text-center">
                        <div className={`text-2xl font-bold ${
                          theme === 'geek'
                            ? 'text-green-400 font-mono'
                            : theme === 'cyber'
                            ? 'text-cyan-300 font-mono text-shadow-neon'
                            : 'text-gray-900 dark:text-gray-100'
                        }`}>
                          {session.netWPM}
                        </div>
                        <div className={`text-xs ${
                          theme === 'geek'
                            ? 'text-green-400/70 font-mono'
                            : theme === 'cyber'
                            ? 'text-cyan-600 font-mono'
                            : 'text-gray-500 dark:text-gray-400'
                        }`}>
                          {theme === 'geek' ? 'WPM' : theme === 'cyber' ? 'SPEED_WPM' : 'WPM'}
                        </div>
                      </div>
                      <div className="text-center">
                        <div className={`text-2xl font-bold ${
                          theme === 'geek'
                            ? 'text-green-400 font-mono'
                            : theme === 'cyber'
                            ? 'text-cyan-300 font-mono text-shadow-neon'
                            : 'text-gray-900 dark:text-gray-100'
                        }`}>
                          {session.accuracy}%
                        </div>
                        <div className={`text-xs ${
                          theme === 'geek'
                            ? 'text-green-400/70 font-mono'
                            : theme === 'cyber'
                            ? 'text-cyan-600 font-mono'
                            : 'text-gray-500 dark:text-gray-400'
                        }`}>
                          {theme === 'geek' ? 'ACC' : theme === 'cyber' ? 'PRECISION' : 'Accuracy'}
                        </div>
                      </div>
                    </div>
                    <span className={`text-sm ${
                      theme === 'geek'
                        ? 'text-green-400/60 font-mono'
                        : theme === 'cyber'
                        ? 'text-cyan-700 font-mono'
                        : 'text-gray-500 dark:text-gray-400'
                    }`}>
                      {theme === 'geek' 
                        ? `[${new Date(session.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}]`
                        : theme === 'cyber'
                        ? `<${new Date(session.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}>`
                        : new Date(session.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                      }
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
            </div>
          </div>
        </div>
      </div>
      
      {/* Footer - hidden in focus mode */}
      <div className={`focus-fade-out ${focusMode ? 'focus-mode-hidden' : ''}`}>
        <Footer theme={theme} />
      </div>

      {/* Desktop keyboard shortcuts hint - hidden in focus mode */}
      {!focusMode && (
        <div
          className={`hidden lg:block fixed bottom-4 left-4 text-xs z-10 cursor-pointer ${
            theme === 'geek'
              ? 'text-green-400/40 font-mono hover:text-green-400/70'
              : 'text-gray-400 dark:text-gray-600 hover:text-gray-600 dark:hover:text-gray-400'
          }`}
          onClick={() => setShowShortcutsHelp(true)}
        >
          <kbd className={`px-1.5 py-0.5 rounded ${
            theme === 'geek'
              ? 'bg-green-900/20 border border-green-500/20'
              : 'bg-gray-100 dark:bg-gray-800'
          }`}>?</kbd>
          <span className="ml-1">{theme === 'geek' ? 'SHORTCUTS' : 'Shortcuts'}</span>
        </div>
      )}

      {/* Focus mode exit hint */}
      {focusMode && (
        <div
          className={`fixed bottom-4 left-1/2 -translate-x-1/2 text-sm z-10 animate-fade-in ${
            theme === 'geek'
              ? 'text-green-400/50 font-mono'
              : 'text-gray-400 dark:text-gray-500'
          }`}
        >
          <kbd className={`px-2 py-1 rounded mr-2 ${
            theme === 'geek'
              ? 'bg-green-900/30 border border-green-500/30'
              : 'bg-gray-100 dark:bg-gray-800'
          }`}>ESC</kbd>
          <span>{theme === 'geek' ? 'exit.focus.mode' : 'to exit focus mode'}</span>
        </div>
      )}

      {/* Keyboard Shortcuts Help Modal */}
      <KeyboardShortcutsHelp
        isOpen={showShortcutsHelp}
        onClose={() => {
          setShowShortcutsHelp(false);
          // Return focus to the shortcuts button if it exists
          shortcutsButtonRef.current?.focus();
        }}
        theme={theme}
      />

      {/* Progress Warning Modal (US4) */}
      {pendingSection && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className={`max-w-sm mx-4 p-6 rounded-xl shadow-2xl ${
            theme === 'geek'
              ? 'bg-black border border-green-500/50 shadow-green-500/20'
              : theme === 'cyber'
              ? 'bg-black/90 border border-cyan-500/50 shadow-cyan-500/30'
              : 'bg-white dark:bg-gray-800'
          }`}>
            <h3 className={`text-lg font-semibold mb-3 ${
              theme === 'geek'
                ? 'text-green-400 font-mono'
                : theme === 'cyber'
                ? 'text-cyan-400 font-mono'
                : 'text-gray-900 dark:text-gray-100'
            }`}>
              {theme === 'geek' ? '> WARNING.UNSAVED' : theme === 'cyber' ? '>> DATA_LOSS_WARNING' : 'Discard Progress?'}
            </h3>
            <p className={`mb-6 ${
              theme === 'geek'
                ? 'text-green-400/70 font-mono text-sm'
                : theme === 'cyber'
                ? 'text-cyan-600 font-mono text-sm'
                : 'text-gray-600 dark:text-gray-400'
            }`}>
              {theme === 'geek'
                ? '// current.session.progress will be lost'
                : theme === 'cyber'
                ? 'Current typing session will be terminated.'
                : 'You have an active typing session. Switching tabs will reset your progress.'}
            </p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={cancelSectionChange}
                className={`px-4 py-2 rounded-lg font-medium transition-all ${
                  theme === 'geek'
                    ? 'bg-green-900/30 border border-green-500/30 text-green-400 hover:bg-green-900/50 font-mono'
                    : theme === 'cyber'
                    ? 'bg-cyan-900/30 border border-cyan-500/30 text-cyan-400 hover:bg-cyan-900/50 font-mono'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                }`}
              >
                {theme === 'geek' ? '[CANCEL]' : theme === 'cyber' ? 'ABORT' : 'Cancel'}
              </button>
              <button
                onClick={confirmSectionChange}
                className={`px-4 py-2 rounded-lg font-medium transition-all ${
                  theme === 'geek'
                    ? 'bg-red-900/50 border border-red-500/50 text-red-400 hover:bg-red-900/70 font-mono'
                    : theme === 'cyber'
                    ? 'bg-fuchsia-900/50 border border-fuchsia-500/50 text-fuchsia-400 hover:bg-fuchsia-900/70 font-mono'
                    : 'bg-red-500 text-white hover:bg-red-600'
                }`}
              >
                {theme === 'geek' ? '[CONFIRM]' : theme === 'cyber' ? 'PROCEED' : 'Discard'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
