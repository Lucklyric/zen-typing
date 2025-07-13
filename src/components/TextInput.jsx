import React, { useState } from 'react';
import { customTextStorage } from '../utils/customTextStorage';

const TextInput = ({ onTextSubmit, theme = 'normal' }) => {
  const [text, setText] = useState('');
  const [isOpen, setIsOpen] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (text.trim()) {
      // Save to history
      customTextStorage.add(text.trim());
      onTextSubmit(text.trim());
      setText('');
      setIsOpen(false);
    }
  };

  return (
    <div className="mb-8">
      {!isOpen ? (
        <button
          onClick={() => setIsOpen(true)}
          className={`px-4 py-2 transition-colors ${
            theme === 'geek'
              ? 'bg-green-500 text-black border border-green-400 hover:bg-green-400 font-mono'
              : 'bg-blue-500 text-white rounded hover:bg-blue-600'
          }`}
        >
          {theme === 'geek' ? '[+] ADD.CUSTOM.TEXT' : 'Add Custom Text'}
        </button>
      ) : (
        <form onSubmit={handleSubmit} className="animate-slide-up">
          <div className={`rounded-lg shadow-lg p-6 ${
            theme === 'geek'
              ? 'bg-black border border-green-500/30'
              : 'bg-white dark:bg-gray-800'
          }`}>
            <h3 className={`text-lg font-semibold mb-4 ${
              theme === 'geek'
                ? 'text-green-400 font-mono'
                : 'text-gray-800 dark:text-gray-200'
            }`}>
              {theme === 'geek' ? '> INPUT.CUSTOM.TEXT' : 'Add Your Own Text'}
            </h3>
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder={theme === 'geek' 
                ? '// paste.your.english.text.here...' 
                : 'Paste or type your English paragraph here...'
              }
              className={`w-full h-32 p-3 border focus:outline-none focus:ring-2 ${
                theme === 'geek'
                  ? 'border-green-500/30 bg-black text-green-400 font-mono focus:ring-green-400 focus:border-green-400 placeholder-green-400/40'
                  : 'border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded-md focus:ring-blue-500'
              }`}
              maxLength={5000}
              autoFocus
            />
            <div className="flex justify-between items-center mt-4">
              <span className={`text-sm ${
                theme === 'geek'
                  ? 'text-green-400/60 font-mono'
                  : 'text-gray-500'
              }`}>
                {theme === 'geek' 
                  ? `// chars: ${text.length}/5000` 
                  : `${text.length}/5000 characters`
                }
              </span>
              <div className="space-x-2">
                <button
                  type="button"
                  onClick={() => {
                    setIsOpen(false);
                    setText('');
                  }}
                  className={`px-4 py-2 ${
                    theme === 'geek'
                      ? 'text-green-400/70 hover:text-green-400 font-mono border border-green-500/30 hover:border-green-400'
                      : 'text-gray-600 hover:text-gray-800'
                  }`}
                >
                  {theme === 'geek' ? '[ESC]' : 'Cancel'}
                </button>
                <button
                  type="submit"
                  disabled={!text.trim()}
                  className={`px-4 py-2 ${
                    theme === 'geek'
                      ? 'bg-green-500 text-black border border-green-400 hover:bg-green-400 disabled:bg-green-900/20 disabled:text-green-400/30 disabled:border-green-500/20 font-mono'
                      : 'bg-blue-500 text-white rounded hover:bg-blue-600 disabled:bg-gray-300'
                  } disabled:cursor-not-allowed`}
                >
                  {theme === 'geek' ? '[EXEC] START.TYPING' : 'Start Typing'}
                </button>
              </div>
            </div>
          </div>
        </form>
      )}
    </div>
  );
};

export default TextInput;