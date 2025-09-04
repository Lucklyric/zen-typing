const SETTINGS_KEY = 'zen-typing-settings';

// Default settings
const DEFAULT_SETTINGS = {
  theme: 'normal', // 'normal' or 'geek'
  ipaDisplay: 'toggle', // 'toggle', 'hover', 'click', 'always' - future feature
  showIPA: false,
  dictationMode: false,
  showHistory: true,
  fontSize: 'medium', // 'small', 'medium', 'large'
  soundEnabled: true,
  showProgress: true,
  showTimer: true,
  keyboardLayout: 'qwerty',
  activeSection: 'practice', // 'practice' or 'templates'
  // Reference Mode settings
  typingMode: 'normal', // 'normal' or 'reference'
  splitRatio: 0.5, // Left panel ratio (0.2 - 0.8)
  autoSwitchReference: true, // Auto-switch to reference mode when selecting reference text
  centerAreaHeight: 500 // Center input area height in pixels (300 - 1000)
};

export const settingsStorage = {
  // Get all settings or a specific setting
  get(key = null) {
    try {
      const stored = localStorage.getItem(SETTINGS_KEY);
      const settings = stored ? JSON.parse(stored) : DEFAULT_SETTINGS;
      
      // Merge with defaults to ensure all keys exist
      const merged = { ...DEFAULT_SETTINGS, ...settings };
      
      if (key) {
        return merged[key] !== undefined ? merged[key] : DEFAULT_SETTINGS[key];
      }
      
      return merged;
    } catch (error) {
      console.error('Failed to load settings:', error);
      return key ? DEFAULT_SETTINGS[key] : DEFAULT_SETTINGS;
    }
  },

  // Set a specific setting or multiple settings
  set(keyOrSettings, value = undefined) {
    try {
      const currentSettings = this.get();
      let newSettings;
      
      if (typeof keyOrSettings === 'object') {
        // Setting multiple values
        newSettings = { ...currentSettings, ...keyOrSettings };
      } else {
        // Setting single value
        newSettings = { ...currentSettings, [keyOrSettings]: value };
      }
      
      localStorage.setItem(SETTINGS_KEY, JSON.stringify(newSettings));
      return true;
    } catch (error) {
      console.error('Failed to save settings:', error);
      return false;
    }
  },

  // Reset to default settings
  reset() {
    try {
      localStorage.setItem(SETTINGS_KEY, JSON.stringify(DEFAULT_SETTINGS));
      return true;
    } catch (error) {
      console.error('Failed to reset settings:', error);
      return false;
    }
  },

  // Clear all settings
  clear() {
    try {
      localStorage.removeItem(SETTINGS_KEY);
      return true;
    } catch (error) {
      console.error('Failed to clear settings:', error);
      return false;
    }
  }
};