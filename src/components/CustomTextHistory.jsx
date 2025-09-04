import { useState, useEffect } from 'react';
import { customTextStorage } from '../utils/customTextStorage';

function CustomTextHistory({ onSelectText, isVisible, theme = 'normal' }) {
  const [history, setHistory] = useState([]);
  const [filteredHistory, setFilteredHistory] = useState([]);
  const [expandedItems, setExpandedItems] = useState(new Set());
  const [filter, setFilter] = useState('all'); // 'all', 'normal', 'reference'
  const [importStatus, setImportStatus] = useState(null);

  // Load history on mount and when visibility changes
  useEffect(() => {
    if (isVisible) {
      loadHistory();
    }
  }, [isVisible]);

  const loadHistory = () => {
    const texts = customTextStorage.getAll();
    setHistory(texts);
    applyFilter(texts, filter);
  };

  const applyFilter = (texts, currentFilter) => {
    let filtered;
    switch (currentFilter) {
      case 'normal':
        filtered = texts.filter(item => item.mode === 'normal');
        break;
      case 'reference':
        filtered = texts.filter(item => item.mode === 'reference');
        break;
      default:
        filtered = texts;
        break;
    }
    setFilteredHistory(filtered);
  };

  const handleFilterChange = (newFilter) => {
    setFilter(newFilter);
    applyFilter(history, newFilter);
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
        setFilteredHistory([]);
        setExpandedItems(new Set());
      }
    }
  };

  const handleExport = () => {
    try {
      const exportData = customTextStorage.exportAll();
      if (exportData) {
        const blob = new Blob([JSON.stringify(exportData, null, 2)], {
          type: 'application/json'
        });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `zen-typing-custom-texts-${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        
        setImportStatus({ type: 'success', message: `Exported ${exportData.items.length} texts successfully` });
        setTimeout(() => setImportStatus(null), 3000);
      }
    } catch (error) {
      console.error('Export failed:', error);
      setImportStatus({ type: 'error', message: 'Export failed. Please try again.' });
      setTimeout(() => setImportStatus(null), 3000);
    }
  };

  const handleImport = (event) => {
    const file = event.target.files[0];
    if (!file) return;

    // Reset file input
    event.target.value = '';

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const jsonData = JSON.parse(e.target.result);
        const result = customTextStorage.importAll(jsonData);
        
        if (result.errors.length > 0) {
          console.warn('Import warnings:', result.errors);
        }
        
        const message = `Imported: ${result.imported}, Skipped: ${result.skipped}${
          result.errors.length > 0 ? `, Errors: ${result.errors.length}` : ''
        }`;
        
        setImportStatus({ 
          type: result.imported > 0 ? 'success' : 'warning', 
          message 
        });
        
        if (result.imported > 0) {
          loadHistory();
        }
        
        setTimeout(() => setImportStatus(null), 5000);
      } catch (error) {
        console.error('Import failed:', error);
        setImportStatus({ type: 'error', message: 'Invalid JSON file. Please check the file format.' });
        setTimeout(() => setImportStatus(null), 3000);
      }
    };
    
    reader.readAsText(file);
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
    <div className={`rounded-lg shadow-lg p-4 mb-6 ${
      theme === 'geek'
        ? 'bg-black border border-green-500/30'
        : 'bg-white dark:bg-gray-800'
    }`}>
      <div className="mb-4">
        <div className="flex justify-between items-center mb-3">
          <h3 className={`text-lg font-semibold ${
            theme === 'geek'
              ? 'text-green-400 font-mono'
              : 'text-gray-800 dark:text-gray-200'
          }`}>
            {theme === 'geek' ? '> TEXT.HISTORY.LOG' : 'Custom Text History'}
          </h3>
          <div className="flex items-center gap-2">
            {/* Export Button */}
            <button
              onClick={handleExport}
              disabled={history.length === 0}
              className={`text-sm px-3 py-1.5 transition-colors ${
                theme === 'geek'
                  ? 'font-mono border border-green-500/30 text-green-400/70 hover:text-green-400 hover:border-green-400 disabled:text-green-400/30 disabled:border-green-500/20'
                  : 'bg-blue-100 text-blue-700 rounded hover:bg-blue-200 disabled:bg-gray-100 disabled:text-gray-400 dark:bg-blue-900/30 dark:text-blue-400 dark:hover:bg-blue-900/50'
              } disabled:cursor-not-allowed`}
              title="Export all texts to JSON"
            >
              {theme === 'geek' ? '[EXPORT]' : '📤 Export'}
            </button>
            
            {/* Import Button */}
            <label className={`text-sm px-3 py-1.5 cursor-pointer transition-colors ${
              theme === 'geek'
                ? 'font-mono border border-green-500/30 text-green-400/70 hover:text-green-400 hover:border-green-400'
                : 'bg-green-100 text-green-700 rounded hover:bg-green-200 dark:bg-green-900/30 dark:text-green-400 dark:hover:bg-green-900/50'
            }`} title="Import texts from JSON">
              <input
                type="file"
                accept=".json"
                onChange={handleImport}
                className="hidden"
              />
              {theme === 'geek' ? '[IMPORT]' : '📥 Import'}
            </label>
            
            {/* Clear All Button */}
            {history.length > 0 && (
              <button
                onClick={handleClearAll}
                className={`text-sm px-3 py-1.5 transition-colors ${
                  theme === 'geek'
                    ? 'text-red-400 hover:text-red-300 font-mono border border-red-500/30 hover:border-red-400'
                    : 'text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 bg-red-100 hover:bg-red-200 rounded dark:bg-red-900/30 dark:hover:bg-red-900/50'
                }`}
              >
                {theme === 'geek' ? '[DEL.ALL]' : '🗑️ Clear All'}
              </button>
            )}
          </div>
        </div>
        
        {/* Filter Controls */}
        <div className="flex items-center gap-2 mb-3">
          <span className={`text-sm ${
            theme === 'geek'
              ? 'text-green-400/70 font-mono'
              : 'text-gray-600 dark:text-gray-400'
          }`}>
            {theme === 'geek' ? '> filter:' : 'Filter:'}
          </span>
          <div className={`flex rounded-lg p-1 ${
            theme === 'geek'
              ? 'border border-green-500/30'
              : 'bg-gray-100 dark:bg-gray-700'
          }`}>
            {['all', 'normal', 'reference'].map(filterOption => (
              <button
                key={filterOption}
                onClick={() => handleFilterChange(filterOption)}
                className={`px-3 py-1 text-xs rounded transition-all ${
                  theme === 'geek'
                    ? `font-mono ${
                        filter === filterOption
                          ? 'bg-green-900/50 border border-green-400 text-green-400'
                          : 'text-green-400/60 hover:text-green-400 hover:bg-green-900/30'
                      }`
                    : `${
                        filter === filterOption
                          ? 'bg-white dark:bg-gray-600 text-gray-900 dark:text-white shadow-sm'
                          : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                      }`
                }`}
              >
                {theme === 'geek' 
                  ? filterOption.toUpperCase() 
                  : filterOption.charAt(0).toUpperCase() + filterOption.slice(1)
                } ({filterOption === 'all' ? history.length : history.filter(item => item.mode === filterOption).length})
              </button>
            ))}
          </div>
        </div>
        
        {/* Import/Export Status */}
        {importStatus && (
          <div className={`text-sm p-3 rounded-lg mb-3 ${
            importStatus.type === 'success' 
              ? (theme === 'geek' ? 'bg-green-900/30 border border-green-500/30 text-green-400' : 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400')
              : importStatus.type === 'error'
              ? (theme === 'geek' ? 'bg-red-900/30 border border-red-500/30 text-red-400' : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400') 
              : (theme === 'geek' ? 'bg-yellow-900/30 border border-yellow-500/30 text-yellow-400' : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400')
          }`}>
            {theme === 'geek' ? `// ${importStatus.message}` : importStatus.message}
          </div>
        )}
      </div>

      {filteredHistory.length === 0 ? (
        <p className={`text-center py-8 ${
          theme === 'geek'
            ? 'text-green-400/60 font-mono'
            : 'text-gray-500 dark:text-gray-400'
        }`}>
          {history.length === 0
            ? (theme === 'geek' 
                ? '// no.custom.texts.found -> add.text.above()' 
                : 'No custom texts yet. Start typing above!')
            : (theme === 'geek'
                ? `// no.texts.match.filter[${filter.toUpperCase()}]`
                : `No texts match the current filter (${filter})`)
          }
        </p>
      ) : (
        <div className={`space-y-2 max-h-96 overflow-y-auto ${
          theme === 'geek' ? 'custom-scrollbar-geek' : 'custom-scrollbar'
        }`}>
          {filteredHistory.map((item) => {
            const isExpanded = expandedItems.has(item.id);
            const preview = item.text.length > 100 
              ? item.text.substring(0, 100) + '...' 
              : item.text;
            
            return (
              <div
                key={item.id}
                className={`border rounded-lg p-3 transition-colors ${
                  theme === 'geek'
                    ? 'border-green-500/30 hover:bg-green-900/10 hover:border-green-500/50'
                    : 'border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700'
                }`}
              >
                <div className="flex justify-between items-start gap-2">
                  <div className="flex-1 min-w-0">
                    <button
                      onClick={() => toggleExpanded(item.id)}
                      className="w-full text-left"
                    >
                      <p className={`break-words ${
                        theme === 'geek'
                          ? 'text-green-400 font-mono'
                          : 'text-gray-800 dark:text-gray-200'
                      }`}>
                        {theme === 'geek' && !isExpanded ? `// ${preview}` : (isExpanded ? item.text : preview)}
                      </p>
                    </button>
                    <div className={`flex items-center gap-4 mt-2 text-sm ${
                      theme === 'geek'
                        ? 'text-green-400/60 font-mono'
                        : 'text-gray-500 dark:text-gray-400'
                    }`}>
                      <span>
                        {theme === 'geek' 
                          ? `[${formatDate(item.timestamp)}]` 
                          : formatDate(item.timestamp)
                        }
                      </span>
                      <span>
                        {theme === 'geek' 
                          ? `{${item.wordCount}.words}` 
                          : `${item.wordCount} words`
                        }
                      </span>
                      {/* Mode Badge */}
                      <span className={`px-2 py-0.5 text-xs rounded ${
                        theme === 'geek'
                          ? `font-mono border ${
                              item.mode === 'reference' 
                                ? 'border-blue-500/50 text-blue-400 bg-blue-900/20' 
                                : 'border-green-500/50 text-green-400 bg-green-900/20'
                            }`
                          : `${
                              item.mode === 'reference'
                                ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
                                : 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300'
                            }`
                      }`}>
                        {theme === 'geek' 
                          ? `[${item.mode.toUpperCase()}]` 
                          : item.mode === 'reference' ? 'REF' : 'NORM'
                        }
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <button
                      onClick={() => onSelectText(item)}
                      className={`px-3 py-1 text-sm ${
                        theme === 'geek'
                          ? 'bg-green-500 text-black border border-green-400 hover:bg-green-400 font-mono'
                          : 'bg-indigo-500 text-white rounded hover:bg-indigo-600'
                      }`}
                    >
                      {theme === 'geek' ? '[USE]' : 'Use'}
                    </button>
                    <button
                      onClick={(e) => handleDelete(item.id, e)}
                      className={`p-1 ${
                        theme === 'geek'
                          ? 'text-green-400/60 hover:text-red-400'
                          : 'text-gray-400 hover:text-red-600 dark:hover:text-red-400'
                      }`}
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
