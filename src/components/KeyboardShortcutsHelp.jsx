import { useEffect, useRef } from 'react';

const KeyboardShortcutsHelp = ({ isOpen, onClose, theme }) => {
  const modalRef = useRef(null);
  const closeButtonRef = useRef(null);

  // Handle escape key and focus trap
  useEffect(() => {
    if (!isOpen) return;

    const handleEscape = (event) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('keydown', handleEscape);

    // Focus the close button when modal opens
    closeButtonRef.current?.focus();

    // Prevent body scroll when modal is open
    document.body.style.overflow = 'hidden';

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = '';
    };
  }, [isOpen, onClose]);

  // Handle click outside to close
  const handleBackdropClick = (event) => {
    if (event.target === event.currentTarget) {
      onClose();
    }
  };

  if (!isOpen) return null;

  const isMac = typeof navigator !== 'undefined' && navigator.platform.toUpperCase().indexOf('MAC') >= 0;
  const modKey = isMac ? '⌘' : 'Ctrl';

  const shortcuts = [
    {
      category: theme === 'geek' ? '// GENERAL' : 'General',
      items: [
        { keys: `${modKey}+I`, action: theme === 'geek' ? 'TOGGLE.IPA' : 'Toggle IPA pronunciation' },
        { keys: `${modKey}+S`, action: theme === 'geek' ? 'TOGGLE.SOUND' : 'Toggle sound effects' },
        { keys: `${modKey}+D`, action: theme === 'geek' ? 'TOGGLE.DICTATION' : 'Toggle dictation mode' },
        { keys: `${modKey}+T`, action: theme === 'geek' ? 'TOGGLE.THEME' : 'Toggle theme' },
        { keys: `${modKey}+H`, action: theme === 'geek' ? 'TOGGLE.HISTORY' : 'Toggle history panel' },
      ]
    },
    {
      category: theme === 'geek' ? '// TYPING' : 'Typing',
      items: [
        { keys: 'Escape', action: theme === 'geek' ? 'RESET.SESSION' : 'Reset current session' },
        { keys: `${modKey}+→`, action: theme === 'geek' ? 'SKIP.WORD' : 'Skip current word' },
        { keys: 'Backspace', action: theme === 'geek' ? 'DELETE.CHAR' : 'Delete last character' },
      ]
    },
    {
      category: theme === 'geek' ? '// FOCUS.MODE' : 'Focus Mode',
      items: [
        { keys: `${modKey}+Shift+F`, action: theme === 'geek' ? 'TOGGLE.FOCUS' : 'Enter/exit focus mode' },
        { keys: 'Escape', action: theme === 'geek' ? 'EXIT.FOCUS' : 'Exit focus mode (when active)' },
      ]
    }
  ];

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
      onClick={handleBackdropClick}
      role="dialog"
      aria-modal="true"
      aria-labelledby="shortcuts-title"
    >
      <div
        ref={modalRef}
        className={`w-full max-w-md rounded-xl shadow-2xl overflow-hidden animate-scale-in ${
          theme === 'geek'
            ? 'bg-black border border-green-500/50 shadow-green-500/20'
            : 'bg-white dark:bg-gray-800'
        }`}
      >
        {/* Header */}
        <div className={`flex items-center justify-between px-6 py-4 border-b ${
          theme === 'geek'
            ? 'border-green-500/30'
            : 'border-gray-200 dark:border-gray-700'
        }`}>
          <h2
            id="shortcuts-title"
            className={`text-lg font-semibold ${
              theme === 'geek'
                ? 'text-green-400 font-mono'
                : 'text-gray-900 dark:text-gray-100'
            }`}
          >
            {theme === 'geek' ? '> KEYBOARD.SHORTCUTS' : 'Keyboard Shortcuts'}
          </h2>
          <button
            ref={closeButtonRef}
            onClick={onClose}
            className={`p-2 rounded-lg transition-colors min-w-[44px] min-h-[44px] flex items-center justify-center ${
              theme === 'geek'
                ? 'text-green-400/70 hover:text-green-400 hover:bg-green-900/30'
                : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700'
            }`}
            aria-label="Close"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="px-6 py-4 max-h-[60vh] overflow-y-auto">
          {shortcuts.map((section, sectionIndex) => (
            <div key={sectionIndex} className={sectionIndex > 0 ? 'mt-6' : ''}>
              <h3 className={`text-xs uppercase tracking-wider mb-3 ${
                theme === 'geek'
                  ? 'text-green-400/70 font-mono'
                  : 'text-gray-500 dark:text-gray-400 font-medium'
              }`}>
                {section.category}
              </h3>
              <div className="space-y-2">
                {section.items.map((item, itemIndex) => (
                  <div
                    key={itemIndex}
                    className={`flex items-center justify-between py-2 px-3 rounded-lg ${
                      theme === 'geek'
                        ? 'bg-green-900/10'
                        : 'bg-gray-50 dark:bg-gray-700/50'
                    }`}
                  >
                    <span className={theme === 'geek'
                      ? 'text-green-400/80 font-mono text-sm'
                      : 'text-gray-600 dark:text-gray-300 text-sm'
                    }>
                      {item.action}
                    </span>
                    <kbd className={`px-2 py-1 text-xs rounded font-mono ${
                      theme === 'geek'
                        ? 'bg-green-900/30 text-green-400 border border-green-500/30'
                        : 'bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-300'
                    }`}>
                      {item.keys}
                    </kbd>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className={`px-6 py-4 border-t text-center text-sm ${
          theme === 'geek'
            ? 'border-green-500/30 text-green-400/60 font-mono'
            : 'border-gray-200 dark:border-gray-700 text-gray-500 dark:text-gray-400'
        }`}>
          {theme === 'geek' ? '// press.escape || click.outside -> close.modal' : 'Press Escape or click outside to close'}
        </div>
      </div>
    </div>
  );
};

export default KeyboardShortcutsHelp;
