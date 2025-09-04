import React from 'react';

const ReferenceDisplay = ({ text, theme = 'normal', className = '' }) => {
  if (!text) {
    const emptyStateClasses = theme === 'geek' 
      ? 'bg-black border-green-500/30 font-mono text-green-400' 
      : 'bg-gradient-to-br from-gray-50 to-white dark:from-gray-800 dark:to-gray-850 border-gray-200 dark:border-gray-700 text-gray-800 dark:text-gray-200';
    
    return (
      <div className={`h-full rounded-l-xl border-r ${emptyStateClasses} ${className}`}>
        <div className="h-full flex items-center justify-center p-8">
          <div className={`text-center ${
            theme === 'geek' 
              ? 'text-green-400/60' 
              : 'text-gray-400 dark:text-gray-500'
          }`}>
            <div className="text-4xl mb-4">📖</div>
            <div className="text-sm font-medium mb-2">
              {theme === 'geek' ? '// no.reference.loaded' : 'No Reference Text'}
            </div>
            <div className="text-xs opacity-75 max-w-xs">
              {theme === 'geek' 
                ? '// add.reference.text.in.custom.tab.to.see.here' 
                : 'Add reference text in the Custom tab to see it displayed here alongside your typing practice'
              }
            </div>
          </div>
        </div>
      </div>
    );
  }

  const themeClasses = theme === 'geek' 
    ? 'bg-black border-green-500/30 font-mono text-green-400 custom-scrollbar-geek' 
    : 'bg-gradient-to-br from-gray-50 to-white dark:from-gray-800 dark:to-gray-850 border-gray-200 dark:border-gray-700 text-gray-800 dark:text-gray-200 custom-scrollbar';

  return (
    <div className={`h-full overflow-y-auto border-r ${themeClasses} ${className}`}>
      <div className="p-6 md:p-8 h-full">
        {/* Header */}
        <div className={`text-sm font-semibold mb-4 pb-3 border-b ${
          theme === 'geek' 
            ? 'text-green-400 border-green-400/30' 
            : 'text-gray-700 dark:text-gray-300 border-gray-300 dark:border-gray-600'
        }`}>
          📖 Reference Text
        </div>
        
        {/* Content */}
        <div className={`
          text-base leading-relaxed whitespace-pre-wrap
          ${theme === 'geek' 
            ? 'text-green-300 font-mono' 
            : 'text-gray-700 dark:text-gray-300 font-serif'
          }
          selection:bg-blue-200 dark:selection:bg-blue-800
          selection:text-blue-900 dark:selection:text-blue-100
        `}>
          {text}
        </div>
      </div>
    </div>
  );
};

export default ReferenceDisplay;
