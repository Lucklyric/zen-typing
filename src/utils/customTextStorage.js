const STORAGE_KEY = 'zen-typing-custom-texts';
const MAX_HISTORY_ITEMS = 50;

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
    
    const texts = this.getAll();
    
    // Remove duplicate if exists
    const filtered = texts.filter(item => item.text !== text.trim());
    
    // Add new text at the beginning
    const newItem = {
      id: Date.now().toString(),
      text: text.trim(),
      timestamp: Date.now(),
      wordCount: text.trim().split(/\s+/).length
    };
    
    const updated = [newItem, ...filtered];
    
    // Keep only the most recent items
    const trimmed = updated.slice(0, MAX_HISTORY_ITEMS);
    
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(trimmed));
      return newItem;
    } catch (error) {
      console.error('Failed to save custom text:', error);
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