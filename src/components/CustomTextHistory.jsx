import { useState, useEffect } from 'react';
import { customTextStorage } from '../utils/customTextStorage';

function CustomTextHistory({ onSelectText, isVisible }) {
  const [history, setHistory] = useState([]);
  const [expandedItems, setExpandedItems] = useState(new Set());

  // Load history on mount and when visibility changes
  useEffect(() => {
    if (isVisible) {
      loadHistory();
    }
  }, [isVisible]);

  const loadHistory = () => {
    const texts = customTextStorage.getAll();
    setHistory(texts);
  };

  const handleDelete = (id, e) => {
    e.stopPropagation();
    if (customTextStorage.remove(id)) {
      loadHistory();
    }
  };

  const handleClearAll = () => {
    if (window.confirm('Are you sure you want to clear all custom text history?')) {
      if (customTextStorage.clearAll()) {
        setHistory([]);
        setExpandedItems(new Set());
      }
    }
  };

  const toggleExpanded = (id) => {
    const newExpanded = new Set(expandedItems);
    if (newExpanded.has(id)) {
      newExpanded.delete(id);
    } else {
      newExpanded.add(id);
    }
    setExpandedItems(newExpanded);
  };

  const formatDate = (timestamp) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInHours = (now - date) / (1000 * 60 * 60);
    
    if (diffInHours < 24) {
      return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
    } else if (diffInHours < 168) { // 7 days
      return date.toLocaleDateString('en-US', { weekday: 'short', hour: '2-digit', minute: '2-digit' });
    } else {
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    }
  };

  if (!isVisible) return null;

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-4 mb-6">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200">
          Custom Text History
        </h3>
        {history.length > 0 && (
          <button
            onClick={handleClearAll}
            className="text-sm text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
          >
            Clear All
          </button>
        )}
      </div>

      {history.length === 0 ? (
        <p className="text-gray-500 dark:text-gray-400 text-center py-8">
          No custom texts yet. Start typing above!
        </p>
      ) : (
        <div className="space-y-2 max-h-96 overflow-y-auto">
          {history.map((item) => {
            const isExpanded = expandedItems.has(item.id);
            const preview = item.text.length > 100 
              ? item.text.substring(0, 100) + '...' 
              : item.text;
            
            return (
              <div
                key={item.id}
                className="border border-gray-200 dark:border-gray-700 rounded-lg p-3 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              >
                <div className="flex justify-between items-start gap-2">
                  <div className="flex-1 min-w-0">
                    <button
                      onClick={() => toggleExpanded(item.id)}
                      className="w-full text-left"
                    >
                      <p className="text-gray-800 dark:text-gray-200 break-words">
                        {isExpanded ? item.text : preview}
                      </p>
                    </button>
                    <div className="flex items-center gap-4 mt-2 text-sm text-gray-500 dark:text-gray-400">
                      <span>{formatDate(item.timestamp)}</span>
                      <span>{item.wordCount} words</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <button
                      onClick={() => onSelectText(item.text)}
                      className="px-3 py-1 bg-indigo-500 text-white rounded hover:bg-indigo-600 text-sm"
                    >
                      Use
                    </button>
                    <button
                      onClick={(e) => handleDelete(item.id, e)}
                      className="p-1 text-gray-400 hover:text-red-600 dark:hover:text-red-400"
                      title="Delete"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default CustomTextHistory;