import React, { useState } from 'react';
import { customTextStorage } from '../utils/customTextStorage';

const TextInput = ({ onTextSubmit, theme = 'normal' }) => {
  const [text, setText] = useState('');
  const [referenceText, setReferenceText] = useState('');
  const [isOpen, setIsOpen] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    const trimmedText = text.trim();
    const trimmedRefText = referenceText.trim();
    
    if (trimmedText) {
      if (trimmedRefText) {
        // Has reference text - create reference entry
        const entry = {
          text: trimmedText,
          referenceText: trimmedRefText,
          mode: 'reference'
        };
        customTextStorage.add(entry);
        onTextSubmit(entry);
      } else {
        // No reference text - create normal entry
        const entry = {
          text: trimmedText,
          mode: 'normal'
        };
        customTextStorage.add(entry);
        onTextSubmit(entry);
      }
      setText('');
      setReferenceText('');
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
            
            {/* Mode indicator */}
            <div className={`mb-4 text-sm ${
              theme === 'geek'
                ? 'text-green-400/70 font-mono'
                : 'text-gray-600 dark:text-gray-400'
            }`}>
              {theme === 'geek' 
                ? '// reference.text.optional: leave.empty.for.normal.mode'
                : 'Add optional reference text to create split-view practice'
              }
            </div>
            {/* Always show both textareas */}
            <div className="space-y-4">
              <div>
                <label className={`block text-sm font-medium mb-2 ${
                  theme === 'geek'
                    ? 'text-green-400 font-mono'
                    : 'text-gray-700 dark:text-gray-300'
                }`}>
                  {theme === 'geek' ? '[REF] reference.text (optional)' : 'Reference Text (Optional)'}
                </label>
                <textarea
                  value={referenceText}
                  onChange={(e) => setReferenceText(e.target.value)}
                  placeholder={theme === 'geek' 
                    ? '// optional.reference.material.here...' 
                    : 'Optional reference material to display alongside typing...'
                  }
                  className={`w-full h-32 p-3 border focus:outline-none focus:ring-2 resize-none overflow-y-auto ${
                    theme === 'geek'
                      ? 'border-green-500/30 bg-black text-green-400 font-mono focus:ring-green-400 focus:border-green-400 placeholder-green-400/40 custom-scrollbar-geek'
                      : 'border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded-md focus:ring-blue-500 custom-scrollbar'
                  }`}
                  maxLength={25000}
                />
              </div>
              <div>
                <label className={`block text-sm font-medium mb-2 ${
                  theme === 'geek'
                    ? 'text-green-400 font-mono'
                    : 'text-gray-700 dark:text-gray-300'
                }`}>
                  {theme === 'geek' ? '[TYP] typing.text (required)' : 'Typing Text (Required)'}
                </label>
                <textarea
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  placeholder={theme === 'geek' 
                    ? '// paste.your.english.text.here...' 
                    : 'Paste or type your English paragraph here...'
                  }
                  className={`w-full h-40 p-3 border focus:outline-none focus:ring-2 resize-none overflow-y-auto ${
                    theme === 'geek'
                      ? 'border-green-500/30 bg-black text-green-400 font-mono focus:ring-green-400 focus:border-green-400 placeholder-green-400/40 custom-scrollbar-geek'
                      : 'border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded-md focus:ring-blue-500 custom-scrollbar'
                  }`}
                  maxLength={25000}
                  autoFocus
                />
              </div>
            </div>
            <div className="flex justify-between items-center mt-4">
              <div className={`text-sm space-y-1 ${
                theme === 'geek'
                  ? 'text-green-400/60 font-mono'
                  : 'text-gray-500'
              }`}>
                {(() => {
                  const refWordCount = referenceText.trim().split(/\s+/).filter(word => word.length > 0).length;
                  const typWordCount = text.trim().split(/\s+/).filter(word => word.length > 0).length;
                  return theme === 'geek' ? (
                    <div>
                      <div>// ref: {referenceText.length.toLocaleString()}/25K chars | {refWordCount.toLocaleString()} words</div>
                      <div>// typ: {text.length.toLocaleString()}/25K chars | {typWordCount.toLocaleString()} words</div>
                    </div>
                  ) : (
                    <div>
                      <div>Reference: {referenceText.length.toLocaleString()}/25,000 characters ({refWordCount.toLocaleString()} words)</div>
                      <div>Typing: {text.length.toLocaleString()}/25,000 characters ({typWordCount.toLocaleString()} words)</div>
                    </div>
                  );
                })()}
              </div>
              <div className="space-x-2">
                <button
                  type="button"
                  onClick={() => {
                    setIsOpen(false);
                    setText('');
                    setReferenceText('');
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
                  {theme === 'geek' 
                    ? '[EXEC] START.TYPING'
                    : 'Start Typing'
                  }
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