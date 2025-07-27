const STORAGE_KEY = 'zen-typing-custom-texts';
const MAX_HISTORY_ITEMS = 50;
const MAX_TEXT_LENGTH = 25000; // 5K words ~ 25K characters
const STORAGE_SIZE_LIMIT = 5 * 1024 * 1024; // 5MB localStorage limit

export const customTextStorage = {
  // Get all custom texts from localStorage
  getAll() {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch (error) {
      console.error('Failed to load custom texts:', error);
      return [];
    }
  },

  // Add a new custom text
  add(text) {
    if (!text || text.trim().length === 0) return;
    
    const trimmedText = text.trim();
    
    // Check text length
    if (trimmedText.length > MAX_TEXT_LENGTH) {
      console.warn(`Text exceeds maximum length of ${MAX_TEXT_LENGTH} characters`);
      return null;
    }
    
    const texts = this.getAll();
    
    // Remove duplicate if exists
    const filtered = texts.filter(item => item.text !== trimmedText);
    
    // Add new text at the beginning
    const newItem = {
      id: Date.now().toString(),
      text: trimmedText,
      timestamp: Date.now(),
      wordCount: trimmedText.split(/\s+/).filter(word => word.length > 0).length,
      charCount: trimmedText.length
    };
    
    const updated = [newItem, ...filtered];
    
    // Keep only the most recent items
    const trimmed = updated.slice(0, MAX_HISTORY_ITEMS);
    
    // Check storage size before saving
    try {
      const dataSize = new Blob([JSON.stringify(trimmed)]).size;
      if (dataSize > STORAGE_SIZE_LIMIT) {
        // Remove oldest items until size is acceptable
        while (trimmed.length > 1 && new Blob([JSON.stringify(trimmed)]).size > STORAGE_SIZE_LIMIT) {
          trimmed.pop();
        }
      }
      
      localStorage.setItem(STORAGE_KEY, JSON.stringify(trimmed));
      return newItem;
    } catch (error) {
      console.error('Failed to save custom text:', error);
      // If quota exceeded, try to save with fewer items
      if (error.name === 'QuotaExceededError') {
        const reduced = trimmed.slice(0, Math.floor(trimmed.length / 2));
        try {
          localStorage.setItem(STORAGE_KEY, JSON.stringify(reduced));
          return newItem;
        } catch (secondError) {
          console.error('Failed to save even with reduced history:', secondError);
          return null;
        }
      }
      return null;
    }
  },

  // Remove a custom text by id
  remove(id) {
    const texts = this.getAll();
    const filtered = texts.filter(item => item.id !== id);
    
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
      return true;
    } catch (error) {
      console.error('Failed to remove custom text:', error);
      return false;
    }
  },

  // Clear all custom texts
  clearAll() {
    try {
      localStorage.removeItem(STORAGE_KEY);
      return true;
    } catch (error) {
      console.error('Failed to clear custom texts:', error);
      return false;
    }
  }
};