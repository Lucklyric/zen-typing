import { useEffect, useRef } from 'react';

const SettingsMenu = ({
  isOpen,
  onClose,
  theme,
  dictationMode,
  onDictationToggle,
  showIPA,
  onIPAToggle,
  soundEnabled,
  onSoundToggle,
  themePreference,
  onThemeChange,
  focusMode,
  onFocusModeToggle,
  onShowShortcuts,
  triggerRef
}) => {
  const menuRef = useRef(null);

  // Handle click outside to close menu
  useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target) &&
          triggerRef?.current && !triggerRef.current.contains(event.target)) {
        onClose();
      }
    };

    const handleEscape = (event) => {
      if (event.key === 'Escape') {
        onClose();
        // Return focus to trigger button
        triggerRef?.current?.focus();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleEscape);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [isOpen, onClose, triggerRef]);

  // Focus trap for accessibility
  useEffect(() => {
    if (isOpen && menuRef.current) {
      const focusableElements = menuRef.current.querySelectorAll(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      );
      if (focusableElements.length > 0) {
        focusableElements[0].focus();
      }
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const menuItemClass = theme === 'geek'
    ? 'flex items-center justify-between w-full px-4 py-3 text-left font-mono text-green-400 hover:bg-green-900/30 transition-colors'
    : 'flex items-center justify-between w-full px-4 py-3 text-left text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors';

  const toggleClass = (isActive) => theme === 'geek'
    ? `w-10 h-6 rounded-full transition-colors ${isActive ? 'bg-green-400' : 'bg-green-900/50 border border-green-500/30'}`
    : `w-10 h-6 rounded-full transition-colors ${isActive ? 'bg-indigo-500' : 'bg-gray-300 dark:bg-gray-600'}`;

  const toggleDotClass = (isActive) => `absolute top-1 w-4 h-4 rounded-full transition-transform bg-white shadow-sm ${isActive ? 'translate-x-5' : 'translate-x-1'}`;

  const dividerClass = theme === 'geek'
    ? 'border-t border-green-500/30 my-1'
    : 'border-t border-gray-200 dark:border-gray-700 my-1';

  return (
    <div
      ref={menuRef}
      role="menu"
      aria-orientation="vertical"
      className={`absolute right-0 top-full mt-2 w-64 rounded-lg shadow-xl z-50 overflow-hidden max-h-[70vh] overflow-y-auto ${
        theme === 'geek'
          ? 'bg-black border border-green-500/30 shadow-green-500/20 custom-scrollbar-geek'
          : theme === 'cyber'
          ? 'bg-black/90 border border-cyan-500/30 shadow-cyan-500/20 custom-scrollbar-cyber backdrop-blur-sm'
          : 'bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 custom-scrollbar'
      }`}
    >
      {/* Mobile-only toggles - IPA and Sound */}
      <div className="md:hidden">
        {/* IPA Toggle */}
        <button
          role="menuitem"
          onClick={onIPAToggle}
          className={menuItemClass}
        >
          <span className="flex items-center gap-2">
            <span>{theme === 'geek' ? (showIPA ? '[+]' : '[ ]') : (showIPA ? '🔤' : '🔡')}</span>
            <span>{theme === 'geek' ? 'IPA' : 'IPA Display'}</span>
          </span>
          <div className={`relative ${toggleClass(showIPA)}`}>
            <div className={toggleDotClass(showIPA)} />
          </div>
        </button>

        {/* Sound Toggle */}
        <button
          role="menuitem"
          onClick={onSoundToggle}
          className={menuItemClass}
        >
          <span className="flex items-center gap-2">
            <span>{theme === 'geek' ? (soundEnabled ? '[♪]' : '[x]') : (soundEnabled ? '🔊' : '🔇')}</span>
            <span>{theme === 'geek' ? 'SOUND' : 'Sound'}</span>
          </span>
          <div className={`relative ${toggleClass(soundEnabled)}`}>
            <div className={toggleDotClass(soundEnabled)} />
          </div>
        </button>

        <div className={dividerClass} />
      </div>

      {/* Dictation Toggle */}
      <button
        role="menuitem"
        onClick={onDictationToggle}
        className={menuItemClass}
      >
        <span className="flex items-center gap-2">
          <span>{theme === 'geek' ? (dictationMode ? '[●]' : '[○]') : (dictationMode ? '👁️' : '👁️‍🗨️')}</span>
          <span>{theme === 'geek' ? 'DICTATION' : 'Dictation Mode'}</span>
        </span>
        <div className={`relative ${toggleClass(dictationMode)}`}>
          <div className={toggleDotClass(dictationMode)} />
        </div>
      </button>

      <div className={dividerClass} />

      {/* Theme Selection */}
      <div className={`px-4 py-2 ${theme === 'geek' ? 'text-green-400/70 font-mono text-xs' : theme === 'cyber' ? 'text-cyan-400/70 font-mono text-xs' : 'text-gray-500 dark:text-gray-400 text-xs uppercase tracking-wide'}`}>
        {theme === 'geek' ? '// THEME.SELECT' : theme === 'cyber' ? '>> VISUAL_MODE' : 'Theme'}
      </div>
      <div className="px-2 pb-2">
        {['light', 'dark', 'system', 'geek', 'cyber'].map((option) => (
          <button
            key={option}
            role="menuitemradio"
            aria-checked={themePreference === option}
            onClick={() => onThemeChange(option)}
            className={`w-full px-3 py-2 rounded text-left transition-colors ${
              theme === 'geek'
                ? `font-mono ${themePreference === option ? 'bg-green-900/50 text-green-400 border border-green-400' : 'text-green-400/70 hover:bg-green-900/30'}`
                : theme === 'cyber'
                ? `font-mono ${themePreference === option ? 'bg-cyan-900/30 text-cyan-400 border border-cyan-400 shadow-[0_0_10px_rgba(0,243,255,0.3)]' : 'text-cyan-600 hover:bg-cyan-900/20 hover:text-cyan-400'}`
                : `${themePreference === option ? 'bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-400' : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'}`
            }`}
          >
            <span className="flex items-center gap-2">
              {themePreference === option && (
                <span>{theme === 'geek' ? '[*]' : '✓'}</span>
              )}
              <span className={themePreference !== option ? 'ml-5' : ''}>
                {theme === 'geek' ? option.toUpperCase() : option.charAt(0).toUpperCase() + option.slice(1)}
              </span>
            </span>
          </button>
        ))}
      </div>

      <div className={dividerClass} />

      {/* Focus Mode Toggle - added by US6 */}
      {onFocusModeToggle && (
        <button
          role="menuitem"
          onClick={onFocusModeToggle}
          className={menuItemClass}
        >
          <span className="flex items-center gap-2">
            <span>{theme === 'geek' ? '[F]' : '🎯'}</span>
            <span>{theme === 'geek' ? 'FOCUS.MODE' : 'Focus Mode'}</span>
          </span>
          <div className={`relative ${toggleClass(focusMode)}`}>
            <div className={toggleDotClass(focusMode)} />
          </div>
        </button>
      )}

      {/* Keyboard Shortcuts Link */}
      {onShowShortcuts && (
        <button
          role="menuitem"
          onClick={() => {
            onShowShortcuts();
            onClose();
          }}
          className={menuItemClass}
        >
          <span className="flex items-center gap-2">
            <span>{theme === 'geek' ? '[?]' : '⌨️'}</span>
            <span>{theme === 'geek' ? 'SHORTCUTS' : 'Keyboard Shortcuts'}</span>
          </span>
          <span className={theme === 'geek' ? 'text-green-400/50' : 'text-gray-400'}>→</span>
        </button>
      )}
    </div>
  );
};

export default SettingsMenu;
