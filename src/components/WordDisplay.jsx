import React from 'react';

const WordDisplay = ({ 
  word, 
  ipa, 
  currentCharIndex, 
  isCurrentWord, 
  isCompleted,
  typedChars,
  errors,
  showIPA,
  showSpace = false,
  spaceError = false
}) => {
  const renderChar = (char, index) => {
    // Check if this character has an error
    const hasError = errors.some(err => err.charIndex === index);
    
    // For completed words with errors
    if (isCompleted) {
      // Show what was actually typed (could be wrong)
      const typedChar = index < typedChars.length ? typedChars[index] : char;
      return (
        <span 
          key={index} 
          className={
            hasError
              ? 'text-red-400 dark:text-red-500 bg-red-50 dark:bg-red-950 rounded px-0.5'
              : 'text-gray-400 dark:text-gray-500'
          }
        >
          {typedChar}
        </span>
      );
    }

    // Check if this character has been typed
    const isTyped = index < typedChars.length;
    const isCurrentChar = isCurrentWord && index === currentCharIndex;
    
    // For current character to be typed
    if (isCurrentChar) {
      return (
        <span key={index} className="text-gray-900 dark:text-gray-100 bg-blue-100 dark:bg-blue-900 rounded px-0.5">
          {char}
        </span>
      );
    }
    
    // For characters not yet typed
    if (!isTyped) {
      return (
        <span key={index} className="text-gray-700 dark:text-gray-300">
          {char}
        </span>
      );
    }

    // For typed characters - show what was actually typed
    const typedChar = typedChars[index];
    return (
      <span
        key={index}
        className={
          hasError 
            ? 'text-red-500 bg-red-100 dark:bg-red-900 rounded px-0.5' 
            : 'text-green-600 dark:text-green-400'
        }
      >
        {typedChar}
      </span>
    );
  };

  const renderSpace = () => {
    const isCurrentSpace = isCurrentWord && currentCharIndex === word.length;
    const spaceTyped = typedChars.length === word.length;
    const hasSpaceError = errors.some(err => err.charIndex === word.length) || spaceError;
    
    // For completed words with space error
    if (isCompleted && hasSpaceError) {
      return (
        <span className="w-2 inline-block bg-red-50 dark:bg-red-950 rounded mx-0.5"></span>
      );
    }
    
    if (isCompleted) {
      return <span className="w-2 inline-block"></span>;
    }
    
    // Highlight space if it's the current character to type
    if (isCurrentSpace) {
      return (
        <span className="w-3 inline-block bg-blue-100 dark:bg-blue-900 rounded mx-0.5 h-6" 
              style={{ verticalAlign: 'bottom' }}>
        </span>
      );
    }
    
    if (!spaceTyped) {
      return <span className="w-2 inline-block"></span>;
    }
    
    return (
      <span
        className={`w-2 inline-block ${
          hasSpaceError 
            ? 'bg-red-100 dark:bg-red-900 rounded mx-0.5' 
            : ''
        }`}
      >
      </span>
    );
  };

  return (
    <div className="inline-block align-top mr-3 mb-6">
      <div className="relative">
        <span className="text-xl font-mono">
          {word.split('').map(renderChar)}
          {showSpace && renderSpace()}
        </span>
      </div>
      {showIPA && (
        <div className="text-xs mt-2 font-mono text-center">
          {ipa ? (
            <span className="text-indigo-600 dark:text-indigo-400">/{ipa}/</span>
          ) : (
            <span className="text-gray-400 dark:text-gray-500 italic">/no IPA/</span>
          )}
        </div>
      )}
    </div>
  );
};

export default WordDisplay;