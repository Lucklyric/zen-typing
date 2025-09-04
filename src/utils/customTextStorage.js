const STORAGE_KEY = 'zen-typing-custom-texts';
const MAX_HISTORY_ITEMS = 50;
const MAX_TEXT_LENGTH = 25000; // 5K words ~ 25K characters
const STORAGE_SIZE_LIMIT = 5 * 1024 * 1024; // 5MB localStorage limit
const SCHEMA_VERSION = 2;

export const customTextStorage = {
  // Get all custom texts from localStorage with v2 migration
  getAll() {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      const texts = stored ? JSON.parse(stored) : [];
      
      // Migrate v1 items to v2 (add mode field)
      return texts.map(item => ({
        ...item,
        mode: item.mode || 'normal' // Default to normal mode for legacy items
      }));
    } catch (error) {
      console.error('Failed to load custom texts:', error);
      return [];
    }
  },

  // Add a new custom text (supports both string and object formats)
  add(textOrEntry) {
    // Handle both legacy string format and new object format
    let entry;
    if (typeof textOrEntry === 'string') {
      if (!textOrEntry || textOrEntry.trim().length === 0) return;
      entry = {
        text: textOrEntry.trim(),
        mode: 'normal'
      };
    } else {
      if (!textOrEntry || !textOrEntry.text || textOrEntry.text.trim().length === 0) return;
      entry = {
        text: textOrEntry.text.trim(),
        mode: textOrEntry.mode || 'normal',
        referenceText: textOrEntry.referenceText ? textOrEntry.referenceText.trim() : undefined
      };
    }
    
    // Validate text length
    if (entry.text.length > MAX_TEXT_LENGTH) {
      console.warn(`Text exceeds maximum length of ${MAX_TEXT_LENGTH} characters`);
      return null;
    }
    
    // Validate reference text length if present
    if (entry.referenceText && entry.referenceText.length > MAX_TEXT_LENGTH) {
      console.warn(`Reference text exceeds maximum length of ${MAX_TEXT_LENGTH} characters`);
      return null;
    }
    
    const texts = this.getAll();
    
    // Remove duplicate based on text + referenceText combination
    const duplicateKey = `${entry.text}|${entry.referenceText || ''}`;
    const filtered = texts.filter(item => {
      const itemKey = `${item.text}|${item.referenceText || ''}`;
      return itemKey !== duplicateKey;
    });
    
    // Create new item
    const newItem = {
      id: Date.now().toString(),
      text: entry.text,
      mode: entry.mode,
      referenceText: entry.referenceText,
      timestamp: Date.now(),
      wordCount: entry.text.split(/\s+/).filter(word => word.length > 0).length,
      charCount: entry.text.length
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
  },

  // Export all custom texts as JSON
  exportAll() {
    try {
      const texts = this.getAll();
      return {
        version: SCHEMA_VERSION,
        exportedAt: new Date().toISOString(),
        items: texts
      };
    } catch (error) {
      console.error('Failed to export custom texts:', error);
      return null;
    }
  },

  // Import custom texts from JSON
  importAll(jsonData) {
    try {
      let data;
      if (typeof jsonData === 'string') {
        data = JSON.parse(jsonData);
      } else {
        data = jsonData;
      }

      if (!data || !Array.isArray(data.items)) {
        throw new Error('Invalid JSON format');
      }

      const existingTexts = this.getAll();
      const results = { imported: 0, skipped: 0, errors: [] };
      
      // Create a set of existing text signatures for deduplication
      const existingSigs = new Set(existingTexts.map(item => 
        `${item.text}|${item.referenceText || ''}`
      ));

      const validItems = [];
      
      for (const item of data.items) {
        try {
          // Validate required fields
          if (!item.text || typeof item.text !== 'string') {
            results.errors.push('Invalid item: missing or invalid text field');
            continue;
          }

          const normalizedItem = {
            id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
            text: item.text.trim(),
            mode: item.mode || 'normal',
            referenceText: item.referenceText ? item.referenceText.trim() : undefined,
            timestamp: Date.now(),
            wordCount: item.text.trim().split(/\s+/).filter(word => word.length > 0).length,
            charCount: item.text.trim().length
          };

          // Check for duplicates
          const sig = `${normalizedItem.text}|${normalizedItem.referenceText || ''}`;
          if (existingSigs.has(sig)) {
            results.skipped++;
            continue;
          }

          // Validate text length
          if (normalizedItem.text.length > MAX_TEXT_LENGTH) {
            results.errors.push(`Text too long (${normalizedItem.text.length} chars)`);
            continue;
          }

          if (normalizedItem.referenceText && normalizedItem.referenceText.length > MAX_TEXT_LENGTH) {
            results.errors.push(`Reference text too long (${normalizedItem.referenceText.length} chars)`);
            continue;
          }

          validItems.push(normalizedItem);
          existingSigs.add(sig);
          results.imported++;
          
        } catch (itemError) {
          results.errors.push(`Error processing item: ${itemError.message}`);
        }
      }

      if (validItems.length > 0) {
        // Merge with existing texts, keeping total under limit
        const allTexts = [...validItems, ...existingTexts].slice(0, MAX_HISTORY_ITEMS);
        
        // Check storage size
        const dataSize = new Blob([JSON.stringify(allTexts)]).size;
        let finalTexts = allTexts;
        
        if (dataSize > STORAGE_SIZE_LIMIT) {
          // Remove oldest items until size is acceptable
          while (finalTexts.length > 1 && new Blob([JSON.stringify(finalTexts)]).size > STORAGE_SIZE_LIMIT) {
            finalTexts = finalTexts.slice(0, -1);
          }
        }

        localStorage.setItem(STORAGE_KEY, JSON.stringify(finalTexts));
      }

      return results;
      
    } catch (error) {
      console.error('Failed to import custom texts:', error);
      return { imported: 0, skipped: 0, errors: [`Import failed: ${error.message}`] };
    }
  }
};