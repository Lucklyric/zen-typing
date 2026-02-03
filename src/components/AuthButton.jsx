/**
 * AuthButton - Magic Link Authentication Button
 *
 * Compact button for header that handles sign-in/sign-out with inline email input.
 */
import { useState } from 'react';

export default function AuthButton({
  theme,
  user,
  authState = 'idle',
  authError = null,
  onSignIn,
  onSignOut,
  onCancel,
}) {
  const [email, setEmail] = useState('');
  const [showEmailInput, setShowEmailInput] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (email.trim()) {
      onSignIn(email.trim());
      setEmail('');
      setShowEmailInput(false);
    }
  };

  const handleCancel = () => {
    setShowEmailInput(false);
    setEmail('');
    // Also reset parent auth state if in awaiting/error state
    if (onCancel && (authState === 'awaiting' || authState === 'error')) {
      onCancel();
    }
  };

  // Signed in state - show truncated email + sign out
  if (user) {
    const userEmail = user.email || 'User';
    const displayEmail = userEmail.length > 12
      ? userEmail.slice(0, 10) + '…'
      : userEmail;

    return (
      <button
        onClick={onSignOut}
        type="button"
        className={`flex items-center gap-2 px-3 py-2 min-h-[44px] text-sm font-medium transition-all ${
          theme === 'geek'
            ? 'font-mono border bg-green-900/30 border-green-500/50 text-green-400 hover:border-green-400 hover:bg-green-900/50'
            : theme === 'cyber'
            ? 'font-mono border bg-cyan-900/20 border-cyan-500/50 text-cyan-400 hover:border-cyan-400 hover:shadow-[0_0_10px_rgba(0,243,255,0.3)]'
            : 'rounded-lg bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
        }`}
        title={`Signed in as ${userEmail}. Click to sign out.`}
      >
        <span>
          {theme === 'geek' ? '[●]' : theme === 'cyber' ? '◉' : '👤'}
        </span>
        <span className="hidden sm:inline max-w-[100px] truncate">
          {theme === 'geek' ? displayEmail.toUpperCase() : displayEmail}
        </span>
        <span className={`text-xs opacity-60 ${theme === 'geek' || theme === 'cyber' ? 'font-mono' : ''}`}>
          {theme === 'geek' ? '[OUT]' : theme === 'cyber' ? '<OUT>' : 'Out'}
        </span>
      </button>
    );
  }

  // Awaiting magic link state
  if (authState === 'awaiting') {
    return (
      <div className={`flex items-center gap-2 px-3 py-2 min-h-[44px] text-sm ${
        theme === 'geek'
          ? 'font-mono border border-yellow-500/50 bg-yellow-900/20 text-yellow-400'
          : theme === 'cyber'
          ? 'font-mono border border-fuchsia-500/50 bg-fuchsia-900/20 text-fuchsia-400 animate-pulse'
          : 'rounded-lg bg-amber-50 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400'
      }`}>
        <span>
          {theme === 'geek' ? '[📧]' : theme === 'cyber' ? '📡' : '📧'}
        </span>
        <span className="hidden sm:inline">
          {theme === 'geek' ? 'CHECK.EMAIL' : theme === 'cyber' ? 'CHECK_INBOX' : 'Check Email'}
        </span>
        <button
          onClick={handleCancel}
          className={`ml-1 opacity-60 hover:opacity-100 ${
            theme === 'geek' || theme === 'cyber' ? 'font-mono' : ''
          }`}
          title="Cancel"
        >
          {theme === 'geek' ? '[X]' : theme === 'cyber' ? '×' : '✕'}
        </button>
      </div>
    );
  }

  // Error state
  if (authState === 'error') {
    return (
      <div className={`flex items-center gap-2 px-3 py-2 min-h-[44px] text-sm ${
        theme === 'geek'
          ? 'font-mono border border-red-500/50 bg-red-900/20 text-red-400'
          : theme === 'cyber'
          ? 'font-mono border border-fuchsia-500/50 bg-fuchsia-900/20 text-fuchsia-400'
          : 'rounded-lg bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-400'
      }`}>
        <span>
          {theme === 'geek' ? '[!]' : theme === 'cyber' ? '⚠' : '⚠️'}
        </span>
        <span className="max-w-[100px] sm:max-w-[120px] truncate" title={authError || 'Auth error'}>
          {authError
            ? (theme === 'geek' ? authError.toUpperCase().slice(0, 10) : authError.slice(0, 12))
            : (theme === 'geek' ? 'ERROR' : theme === 'cyber' ? 'ERR' : 'Error')
          }
        </span>
        <button
          onClick={handleCancel}
          className={`ml-1 opacity-60 hover:opacity-100 ${
            theme === 'geek' || theme === 'cyber' ? 'font-mono' : ''
          }`}
          title="Dismiss"
        >
          {theme === 'geek' ? '[X]' : theme === 'cyber' ? '×' : '✕'}
        </button>
      </div>
    );
  }

  // Loading state
  if (authState === 'loading') {
    return (
      <div className={`flex items-center gap-2 px-3 py-2 min-h-[44px] text-sm ${
        theme === 'geek'
          ? 'font-mono border border-green-500/30 bg-black/50 text-green-400'
          : theme === 'cyber'
          ? 'font-mono border border-cyan-500/30 bg-black/50 text-cyan-400'
          : 'rounded-lg bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400'
      }`}>
        <span className={`${theme === 'cyber' ? 'animate-spin' : 'animate-pulse'}`}>
          {theme === 'geek' ? '[...]' : theme === 'cyber' ? '◎' : '⏳'}
        </span>
        <span className="hidden sm:inline">
          {theme === 'geek' ? 'SENDING...' : theme === 'cyber' ? 'TRANSMIT' : 'Sending...'}
        </span>
      </div>
    );
  }

  // Email input expanded state
  if (showEmailInput) {
    return (
      <form
        onSubmit={handleSubmit}
        className={`flex items-center gap-1 min-h-[44px] ${
          theme === 'geek' || theme === 'cyber' ? 'font-mono' : ''
        }`}
      >
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder={theme === 'geek' ? 'email@...' : theme === 'cyber' ? 'USER@DOMAIN' : 'you@email.com'}
          autoFocus
          className={`w-36 sm:w-44 px-2 py-1.5 text-sm transition-all ${
            theme === 'geek'
              ? 'bg-black border border-green-500/50 text-green-400 placeholder:text-green-400/40 focus:border-green-400 focus:outline-none'
              : theme === 'cyber'
              ? 'bg-black/80 border border-cyan-500/50 text-cyan-400 placeholder:text-cyan-400/40 focus:border-cyan-400 focus:outline-none focus:shadow-[0_0_10px_rgba(0,243,255,0.3)]'
              : 'rounded-lg bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500'
          }`}
        />
        <button
          type="submit"
          disabled={!email.trim()}
          className={`px-2 py-1.5 text-sm font-medium transition-all ${
            theme === 'geek'
              ? 'border border-green-500/50 text-green-400 hover:bg-green-900/30 hover:border-green-400 disabled:opacity-40 disabled:hover:bg-transparent disabled:hover:border-green-500/50'
              : theme === 'cyber'
              ? 'border border-cyan-500/50 text-cyan-400 hover:bg-cyan-900/30 hover:border-cyan-400 hover:shadow-[0_0_8px_rgba(0,243,255,0.3)] disabled:opacity-40'
              : 'rounded-lg bg-indigo-500 text-white hover:bg-indigo-600 disabled:opacity-40 disabled:hover:bg-indigo-500'
          }`}
        >
          {theme === 'geek' ? '[GO]' : theme === 'cyber' ? '→' : 'Go'}
        </button>
        <button
          type="button"
          onClick={handleCancel}
          className={`px-1.5 py-1.5 text-sm opacity-60 hover:opacity-100 ${
            theme === 'geek'
              ? 'text-green-400'
              : theme === 'cyber'
              ? 'text-cyan-400'
              : 'text-gray-500 dark:text-gray-400'
          }`}
          title="Cancel"
        >
          {theme === 'geek' ? '[X]' : theme === 'cyber' ? '×' : '✕'}
        </button>
      </form>
    );
  }

  // Default: Sign In button
  return (
    <button
      onClick={() => setShowEmailInput(true)}
      type="button"
      className={`flex items-center gap-2 px-3 py-2 min-h-[44px] text-sm font-medium transition-all ${
        theme === 'geek'
          ? 'font-mono border bg-black/50 border-green-500/30 text-green-400/70 hover:border-green-400 hover:text-green-400 hover:bg-green-900/20'
          : theme === 'cyber'
          ? 'font-mono border bg-black/50 border-cyan-500/30 text-cyan-400/70 hover:border-cyan-400 hover:text-cyan-400 hover:shadow-[0_0_10px_rgba(0,243,255,0.2)]'
          : 'rounded-lg bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
      }`}
      title="Sign in with Magic Link"
    >
      <span>
        {theme === 'geek' ? '[○]' : theme === 'cyber' ? '○' : '🔗'}
      </span>
      <span className="hidden sm:inline">
        {theme === 'geek' ? 'SIGN.IN' : theme === 'cyber' ? 'AUTH' : 'Sign In'}
      </span>
    </button>
  );
}
