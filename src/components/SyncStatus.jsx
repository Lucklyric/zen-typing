/**
 * SyncStatus - Minimal Sync State Indicator
 *
 * Tiny indicator showing sync state. Nearly invisible when synced.
 * Click to force sync when not syncing.
 */
import { useState, useRef, useEffect } from 'react';

export default function SyncStatus({
  theme,
  status = 'synced',
  errorMessage,
  onRetry,
  onForceSync,
  onForceOverwrite,
  onCancelSync,
  onDiscardPending
}) {
  const [showMenu, setShowMenu] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [showCancelDialog, setShowCancelDialog] = useState(false);
  const menuRef = useRef(null);
  const confirmRef = useRef(null);
  const cancelRef = useRef(null);

  // Close menu when clicking outside
  useEffect(() => {
    if (!showMenu && !showConfirm && !showCancelDialog) return;

    const handleClickOutside = (e) => {
      // Check if click is outside all dialogs
      const isOutsideMenu = menuRef.current && !menuRef.current.contains(e.target);
      const isOutsideConfirm = !confirmRef.current || !confirmRef.current.contains(e.target);
      const isOutsideCancel = !cancelRef.current || !cancelRef.current.contains(e.target);

      if (isOutsideMenu && isOutsideConfirm && isOutsideCancel) {
        setShowMenu(false);
        setShowConfirm(false);
        setShowCancelDialog(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showMenu, showConfirm, showCancelDialog]);

  const [isExecuting, setIsExecuting] = useState(false);

  const handleForceOverwrite = async () => {
    // Prevent double-clicks during execution
    if (isExecuting) return;

    setIsExecuting(true);
    setShowMenu(false);
    setShowConfirm(false);

    if (onForceOverwrite) {
      try {
        await onForceOverwrite();
      } finally {
        setIsExecuting(false);
      }
    } else {
      setIsExecuting(false);
    }
  };

  // Synced state: clickable to show sync options menu
  // Only show menu when status is 'synced' to prevent concurrent operations
  if (status === 'synced') {
    return (
      <div className="relative" ref={menuRef}>
        <button
          onClick={() => setShowMenu(!showMenu)}
          disabled={!onForceSync && !onForceOverwrite}
          aria-expanded={showMenu || showConfirm}
          aria-haspopup="menu"
          className={`flex items-center justify-center w-6 h-6 transition-all group ${
            theme === 'geek'
              ? 'text-green-500/60 hover:text-green-400 disabled:cursor-default'
              : theme === 'cyber'
              ? 'text-cyan-500/60 hover:text-cyan-400 disabled:cursor-default'
              : 'text-green-500/60 dark:text-green-400/60 hover:text-green-600 dark:hover:text-green-300 disabled:cursor-default'
          }`}
          title="Synced - click for sync options"
          role="status"
          aria-label="Sync status: synced. Click for sync options."
        >
          {/* Show checkmark by default, sync icon on hover */}
          <svg
            className="w-3.5 h-3.5 group-hover:hidden"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2.5}
              d="M5 13l4 4L19 7"
            />
          </svg>
          <svg
            className="w-4 h-4 hidden group-hover:block"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
            />
          </svg>
        </button>

        {/* Dropdown menu */}
        {showMenu && !showConfirm && (
          <div className={`absolute right-0 top-full mt-1 py-1 min-w-[160px] z-50 shadow-lg ${
            theme === 'geek'
              ? 'bg-black border border-green-500/50 text-green-400 font-mono text-sm'
              : theme === 'cyber'
              ? 'bg-black/95 border border-cyan-500/50 text-cyan-400 font-mono text-sm'
              : 'bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-sm'
          }`}>
            <button
              onClick={() => {
                setShowMenu(false);
                if (onForceSync) onForceSync();
              }}
              className={`w-full text-left px-3 py-3 sm:py-2 ${
                theme === 'geek'
                  ? 'hover:bg-green-900/30 active:bg-green-900/50'
                  : theme === 'cyber'
                  ? 'hover:bg-cyan-900/30 active:bg-cyan-900/50'
                  : 'hover:bg-gray-100 dark:hover:bg-gray-700 active:bg-gray-200 dark:active:bg-gray-600'
              }`}
            >
              {theme === 'geek' ? '[SYNC]' : theme === 'cyber' ? '⟳ SYNC' : '↻ Force Sync'}
            </button>
            {onForceOverwrite && (
              <button
                onClick={() => setShowConfirm(true)}
                className={`w-full text-left px-3 py-3 sm:py-2 ${
                  theme === 'geek'
                    ? 'hover:bg-red-900/30 active:bg-red-900/50 text-red-400'
                    : theme === 'cyber'
                    ? 'hover:bg-fuchsia-900/30 active:bg-fuchsia-900/50 text-fuchsia-400'
                    : 'hover:bg-red-50 dark:hover:bg-red-900/20 active:bg-red-100 dark:active:bg-red-900/30 text-red-600 dark:text-red-400'
                }`}
              >
                {theme === 'geek' ? '[OVERWRITE.REMOTE]' : theme === 'cyber' ? '⬆ OVERWRITE' : '⬆ Overwrite Remote'}
              </button>
            )}
          </div>
        )}

        {/* Confirmation dialog - fixed position on mobile for better visibility */}
        {showConfirm && (
          <div ref={confirmRef} className={`fixed sm:absolute inset-x-4 sm:inset-x-auto bottom-4 sm:bottom-auto sm:right-0 sm:top-full sm:mt-1 p-4 sm:p-3 sm:min-w-[240px] z-50 shadow-xl ${
            theme === 'geek'
              ? 'bg-black border border-red-500/50 text-green-400 font-mono text-sm'
              : theme === 'cyber'
              ? 'bg-black/95 border border-fuchsia-500/50 text-cyan-400 font-mono text-sm'
              : 'bg-white dark:bg-gray-800 border border-red-200 dark:border-red-700 rounded-lg text-sm'
          }`}>
            <p className={`mb-4 sm:mb-3 text-center sm:text-left ${
              theme === 'geek'
                ? 'text-red-400'
                : theme === 'cyber'
                ? 'text-fuchsia-400'
                : 'text-red-600 dark:text-red-400'
            }`}>
              {theme === 'geek'
                ? '⚠ THIS.WILL.DELETE.ALL.CLOUD.DATA'
                : theme === 'cyber'
                ? '⚠ WILL DELETE ALL CLOUD DATA'
                : '⚠ This will delete all cloud data and replace with local'}
            </p>
            <div className="flex gap-3 sm:gap-2">
              <button
                onClick={() => setShowConfirm(false)}
                className={`flex-1 px-3 py-3 sm:py-2 ${
                  theme === 'geek'
                    ? 'border border-green-500/50 hover:bg-green-900/30 active:bg-green-900/50'
                    : theme === 'cyber'
                    ? 'border border-cyan-500/50 hover:bg-cyan-900/30 active:bg-cyan-900/50'
                    : 'border border-gray-300 dark:border-gray-600 rounded hover:bg-gray-100 dark:hover:bg-gray-700 active:bg-gray-200 dark:active:bg-gray-600'
                }`}
              >
                {theme === 'geek' ? '[NO]' : theme === 'cyber' ? 'CANCEL' : 'Cancel'}
              </button>
              <button
                onClick={handleForceOverwrite}
                disabled={isExecuting}
                className={`flex-1 px-3 py-3 sm:py-2 font-medium transition-opacity ${
                  isExecuting ? 'opacity-50 cursor-not-allowed' : ''
                } ${
                  theme === 'geek'
                    ? 'border border-red-500/50 bg-red-900/30 hover:bg-red-900/50 active:bg-red-900/70 text-red-400'
                    : theme === 'cyber'
                    ? 'border border-fuchsia-500/50 bg-fuchsia-900/30 hover:bg-fuchsia-900/50 active:bg-fuchsia-900/70 text-fuchsia-400'
                    : 'border border-red-300 dark:border-red-600 rounded bg-red-500 hover:bg-red-600 active:bg-red-700 text-white'
                }`}
              >
                {isExecuting
                  ? (theme === 'geek' ? '[...]' : theme === 'cyber' ? '...' : 'Working...')
                  : (theme === 'geek' ? '[YES]' : theme === 'cyber' ? 'CONFIRM' : 'Overwrite')
                }
              </button>
            </div>
          </div>
        )}
      </div>
    );
  }

  // Syncing state: animated indicator (clickable to cancel)
  if (status === 'syncing') {
    return (
      <div className="relative" ref={cancelRef}>
        <button
          onClick={() => setShowCancelDialog(true)}
          disabled={!onCancelSync}
          className={`flex items-center justify-center w-6 h-6 transition-all ${
            onCancelSync ? 'cursor-pointer' : 'cursor-default'
          } ${
            theme === 'geek'
              ? 'text-green-400 hover:text-green-300'
              : theme === 'cyber'
              ? 'text-cyan-400 hover:text-cyan-300'
              : 'text-blue-500 dark:text-blue-400 hover:text-blue-600 dark:hover:text-blue-300'
          }`}
          title={onCancelSync ? "Syncing... Click to cancel" : "Syncing..."}
          role="status"
          aria-label={onCancelSync ? "Sync status: syncing. Click to cancel." : "Sync status: syncing"}
        >
          <svg
            className="w-4 h-4 animate-spin"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            style={{ animationDuration: '1.5s' }}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
            />
          </svg>
        </button>

        {/* Cancel confirmation dialog */}
        {showCancelDialog && (
          <div className={`fixed sm:absolute inset-x-4 sm:inset-x-auto bottom-4 sm:bottom-auto sm:right-0 sm:top-full sm:mt-1 p-4 sm:p-3 sm:min-w-[240px] z-50 shadow-xl ${
            theme === 'geek'
              ? 'bg-black border border-yellow-500/50 text-green-400 font-mono text-sm'
              : theme === 'cyber'
              ? 'bg-black/95 border border-yellow-500/50 text-cyan-400 font-mono text-sm'
              : 'bg-white dark:bg-gray-800 border border-yellow-200 dark:border-yellow-700 rounded-lg text-sm'
          }`}>
            <p className={`mb-4 sm:mb-3 text-center sm:text-left ${
              theme === 'geek'
                ? 'text-yellow-400'
                : theme === 'cyber'
                ? 'text-yellow-400'
                : 'text-yellow-600 dark:text-yellow-400'
            }`}>
              {theme === 'geek'
                ? '⚠ CANCEL.SYNC.IN.PROGRESS?'
                : theme === 'cyber'
                ? '⚠ CANCEL SYNC?'
                : '⚠ Cancel sync in progress?'}
            </p>
            <div className="flex gap-3 sm:gap-2">
              <button
                onClick={() => setShowCancelDialog(false)}
                className={`flex-1 px-3 py-3 sm:py-2 ${
                  theme === 'geek'
                    ? 'border border-green-500/50 hover:bg-green-900/30 active:bg-green-900/50'
                    : theme === 'cyber'
                    ? 'border border-cyan-500/50 hover:bg-cyan-900/30 active:bg-cyan-900/50'
                    : 'border border-gray-300 dark:border-gray-600 rounded hover:bg-gray-100 dark:hover:bg-gray-700 active:bg-gray-200 dark:active:bg-gray-600'
                }`}
              >
                {theme === 'geek' ? '[NO]' : theme === 'cyber' ? 'NO' : 'No'}
              </button>
              <button
                onClick={() => {
                  setShowCancelDialog(false);
                  if (onCancelSync) onCancelSync();
                }}
                className={`flex-1 px-3 py-3 sm:py-2 font-medium ${
                  theme === 'geek'
                    ? 'border border-yellow-500/50 bg-yellow-900/30 hover:bg-yellow-900/50 active:bg-yellow-900/70 text-yellow-400'
                    : theme === 'cyber'
                    ? 'border border-yellow-500/50 bg-yellow-900/30 hover:bg-yellow-900/50 active:bg-yellow-900/70 text-yellow-400'
                    : 'border border-yellow-300 dark:border-yellow-600 rounded bg-yellow-500 hover:bg-yellow-600 active:bg-yellow-700 text-white'
                }`}
              >
                {theme === 'geek' ? '[YES]' : theme === 'cyber' ? 'YES' : 'Cancel Sync'}
              </button>
            </div>
          </div>
        )}
      </div>
    );
  }

  // Offline state: clickable to retry pending changes
  if (status === 'offline') {
    return (
      <button
        onClick={onRetry}
        disabled={!onRetry}
        className={`flex items-center justify-center w-6 h-6 transition-all group ${
          theme === 'geek'
            ? 'text-green-400/40 hover:text-green-400 disabled:cursor-default'
            : theme === 'cyber'
            ? 'text-cyan-400/40 hover:text-cyan-400 disabled:cursor-default'
            : 'text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 disabled:cursor-default'
        }`}
        title={onRetry ? "Offline - click to retry pending changes" : "Offline - changes will sync when connected"}
        role="status"
        aria-label="Sync status: offline. Click to retry."
      >
        {/* Show offline icon by default, sync icon on hover */}
        <svg
          className="w-4 h-4 group-hover:hidden"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <circle cx="12" cy="12" r="3" strokeWidth={2} />
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M19.5 4.5l-15 15"
            opacity={0.5}
          />
        </svg>
        <svg
          className="w-4 h-4 hidden group-hover:block"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
          />
        </svg>
      </button>
    );
  }

  // Error state: attention-grabbing with retry/discard options for timeout/cancel
  if (status === 'error') {
    const isTimeoutOrCancel = errorMessage?.includes('timed out') || errorMessage?.includes('cancelled');

    return (
      <div className="relative" ref={menuRef}>
        <button
          onClick={() => {
            if (isTimeoutOrCancel && onDiscardPending) {
              setShowMenu(true); // Show retry/discard menu
            } else if (onRetry) {
              onRetry(); // Direct retry for other errors
            }
          }}
          disabled={!onRetry && !onDiscardPending}
          className={`flex items-center justify-center w-6 h-6 transition-all group ${
            theme === 'geek'
              ? 'text-red-400 hover:text-red-300 disabled:opacity-50 disabled:cursor-not-allowed'
              : theme === 'cyber'
              ? 'text-fuchsia-400 hover:text-fuchsia-300 hover:drop-shadow-[0_0_4px_rgba(188,19,254,0.6)] disabled:opacity-50 disabled:cursor-not-allowed'
              : 'text-red-500 hover:text-red-600 dark:text-red-400 dark:hover:text-red-300 disabled:opacity-50 disabled:cursor-not-allowed'
          }`}
          title={errorMessage || (onRetry ? 'Sync error - click to retry' : 'Sync error')}
          role="status"
          aria-label={`Sync error: ${errorMessage || 'unknown'}.${onRetry ? ' Click to retry.' : ''}`}
        >
          <svg
            className={`w-4 h-4 ${onRetry ? 'group-hover:animate-pulse' : ''}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2.5}
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
            />
          </svg>
        </button>

        {/* Retry/Discard menu for timeout/cancel errors */}
        {showMenu && isTimeoutOrCancel && (
          <div className={`absolute right-0 top-full mt-1 py-1 min-w-[160px] z-50 shadow-lg ${
            theme === 'geek'
              ? 'bg-black border border-red-500/50 text-green-400 font-mono text-sm'
              : theme === 'cyber'
              ? 'bg-black/95 border border-fuchsia-500/50 text-cyan-400 font-mono text-sm'
              : 'bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-sm'
          }`}>
            <button
              onClick={() => {
                setShowMenu(false);
                if (onRetry) onRetry();
              }}
              className={`w-full text-left px-3 py-3 sm:py-2 ${
                theme === 'geek'
                  ? 'hover:bg-green-900/30 active:bg-green-900/50'
                  : theme === 'cyber'
                  ? 'hover:bg-cyan-900/30 active:bg-cyan-900/50'
                  : 'hover:bg-gray-100 dark:hover:bg-gray-700 active:bg-gray-200 dark:active:bg-gray-600'
              }`}
            >
              {theme === 'geek' ? '[RETRY]' : theme === 'cyber' ? '⟳ RETRY' : '↻ Retry Sync'}
            </button>
            <button
              onClick={() => {
                setShowMenu(false);
                if (onDiscardPending) onDiscardPending();
              }}
              className={`w-full text-left px-3 py-3 sm:py-2 ${
                theme === 'geek'
                  ? 'hover:bg-red-900/30 active:bg-red-900/50 text-red-400'
                  : theme === 'cyber'
                  ? 'hover:bg-fuchsia-900/30 active:bg-fuchsia-900/50 text-fuchsia-400'
                  : 'hover:bg-red-50 dark:hover:bg-red-900/20 active:bg-red-100 dark:active:bg-red-900/30 text-red-600 dark:text-red-400'
              }`}
            >
              {theme === 'geek' ? '[DISCARD]' : theme === 'cyber' ? '✗ DISCARD' : '✗ Discard Changes'}
            </button>
          </div>
        )}
      </div>
    );
  }

  return null;
}
