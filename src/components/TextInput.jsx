import React, { useState } from 'react';

const TextInput = ({ onTextSubmit }) => {
  const [text, setText] = useState('');
  const [isOpen, setIsOpen] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (text.trim()) {
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
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
        >
          Add Custom Text
        </button>
      ) : (
        <form onSubmit={handleSubmit} className="animate-slide-up">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
            <h3 className="text-lg font-semibold mb-4">Add Your Own Text</h3>
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Paste or type your English paragraph here..."
              className="w-full h-32 p-3 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              maxLength={5000}
              autoFocus
            />
            <div className="flex justify-between items-center mt-4">
              <span className="text-sm text-gray-500">
                {text.length}/5000 characters
              </span>
              <div className="space-x-2">
                <button
                  type="button"
                  onClick={() => {
                    setIsOpen(false);
                    setText('');
                  }}
                  className="px-4 py-2 text-gray-600 hover:text-gray-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!text.trim()}
                  className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed"
                >
                  Start Typing
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