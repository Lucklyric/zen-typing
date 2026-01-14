const SETTINGS_KEY = 'zen-typing-settings';

// Valid theme preference values
const VALID_THEME_PREFERENCES = ['light', 'dark', 'system', 'geek', 'cyber'];

// Default settings
const DEFAULT_SETTINGS = {
  theme: 'normal', // 'normal' or 'geek' - legacy, kept for compatibility
  themePreference: 'system', // 'light' | 'dark' | 'system' | 'geek'
  themeExplicitlySet: false, // boolean - tracks if user has explicitly set theme
  focusMode: false, // boolean - whether focus mode is active
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

// Validate themePreference value
const validateThemePreference = (value) => {
  return VALID_THEME_PREFERENCES.includes(value) ? value : 'system';
};

// Migrate settings from old format to new format
const migrateSettings = (settings) => {
  // If old 'theme' exists but no 'themePreference', migrate
  if (settings.theme && !settings.themePreference) {
    if (settings.theme === 'geek') {
      settings.themePreference = 'geek';
    } else {
      // Normal theme users get system detection
      settings.themePreference = 'system';
    }
    settings.themeExplicitlySet = true; // They had a setting
  }

  // Validate themePreference
  if (settings.themePreference) {
    settings.themePreference = validateThemePreference(settings.themePreference);
  }

  return settings;
};

export const settingsStorage = {
  // Check if settings have been explicitly stored (not just defaults)
  hasStoredSettings() {
    try {
      return localStorage.getItem(SETTINGS_KEY) !== null;
    } catch {
      return false;
    }
  },

  // Get all settings or a specific setting
  get(key = null) {
    try {
      const stored = localStorage.getItem(SETTINGS_KEY);
      const settings = stored ? JSON.parse(stored) : DEFAULT_SETTINGS;

      // Merge with defaults to ensure all keys exist
      let merged = { ...DEFAULT_SETTINGS, ...settings };

      // Apply migration for existing users
      merged = migrateSettings(merged);

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