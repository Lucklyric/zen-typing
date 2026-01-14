/**
 * SyncStatus - Minimal Sync State Indicator
 *
 * Tiny indicator showing sync state. Nearly invisible when synced.
 * Click to force sync when not syncing.
 */
export default function SyncStatus({
  theme,
  status = 'synced',
  errorMessage,
  onRetry,
  onForceSync
}) {
  // Synced state: clickable to force sync
  if (status === 'synced') {
    return (
      <button
        onClick={onForceSync}
        disabled={!onForceSync}
        className={`flex items-center justify-center w-6 h-6 transition-all group ${
          theme === 'geek'
            ? 'text-green-500/60 hover:text-green-400 disabled:cursor-default'
            : theme === 'cyber'
            ? 'text-cyan-500/60 hover:text-cyan-400 disabled:cursor-default'
            : 'text-green-500/60 dark:text-green-400/60 hover:text-green-600 dark:hover:text-green-300 disabled:cursor-default'
        }`}
        title={onForceSync ? "Synced - click to force sync" : "All data synced"}
        role="status"
        aria-label="Sync status: synced. Click to force sync."
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
    );
  }

  // Syncing state: animated indicator
  if (status === 'syncing') {
    return (
      <div
        className={`flex items-center justify-center w-6 h-6 ${
          theme === 'geek'
            ? 'text-green-400'
            : theme === 'cyber'
            ? 'text-cyan-400'
            : 'text-blue-500 dark:text-blue-400'
        }`}
        title="Syncing..."
        role="status"
        aria-label="Sync status: syncing"
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

  // Error state: attention-grabbing with retry option
  if (status === 'error') {
    return (
      <button
        onClick={onRetry}
        disabled={!onRetry}
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
    );
  }

  return null;
}
