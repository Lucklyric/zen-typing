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
  dictationMode = false,
  showSpace = false,
  spaceError = false
}) => {
  const renderChar = (char, index) => {
    // Check if this character has an error
    const hasError = errors.some(err => err.charIndex === index);
    
    // Check if this character has been typed
    const isTyped = index < typedChars.length;
    const isCurrentChar = isCurrentWord && index === currentCharIndex;
    
    // Determine what character to display
    let displayChar = char;
    
    // Determine what character to display
    if (isCompleted && index < typedChars.length) {
      displayChar = typedChars[index];
    } else if (isTyped) {
      displayChar = typedChars[index];
    } else if (dictationMode && !isTyped && !isCompleted) {
      // In dictation mode, hide untyped characters
      displayChar = '_'; // Show underscore for untyped characters
    }
    
    // Special case for dictation mode hint: if first char has error, show the actual character
    if (dictationMode && index === 0 && hasError && isCurrentWord && !isCompleted) {
      displayChar = char; // Show the actual first character as a hint
    }
    
    // Make spaces visible when they're wrong
    if (displayChar === ' ' && hasError) {
      displayChar = '·'; // Middle dot to represent space
    }
    
    // Show visual hint for special characters
    if (hasError && isTyped) {
      // For smart quotes, show what was typed
      if ((char === '\u2018' || char === '\u2019') && typedChars[index] === "'") {
        displayChar = typedChars[index];
      } else if ((char === '\u201C' || char === '\u201D') && typedChars[index] === '"') {
        displayChar = typedChars[index];
      }
    }

    // Determine the visual state
    let textColor = 'text-gray-700 dark:text-gray-300'; // untyped
    let bgColor = '';
    let textDecoration = '';

    if (isCompleted) {
      if (hasError) {
        textColor = 'text-red-400 dark:text-red-500';
        textDecoration = 'underline decoration-red-400 dark:decoration-red-500 decoration-2 underline-offset-2';
      } else {
        textColor = 'text-gray-400 dark:text-gray-500';
      }
    } else if (isCurrentChar) {
      textColor = 'text-gray-900 dark:text-gray-100';
      bgColor = 'bg-blue-100 dark:bg-blue-900';
    } else if (isTyped) {
      if (hasError) {
        textColor = 'text-red-500 dark:text-red-400';
        textDecoration = 'underline decoration-red-500 dark:decoration-red-400 decoration-2 underline-offset-2';
      } else {
        textColor = 'text-green-600 dark:text-green-400';
      }
    } else if (dictationMode && !isTyped) {
      // In dictation mode, make hidden characters slightly visible
      textColor = 'text-gray-400 dark:text-gray-600';
    }
    
    // Special styling for dictation mode hint
    if (dictationMode && index === 0 && hasError && isCurrentWord && !isCompleted && displayChar === char) {
      textColor = 'text-amber-600 dark:text-amber-400';
      bgColor = 'bg-amber-50 dark:bg-amber-900/20';
      textDecoration = ''; // Remove any error underline for the hint
    }

    // Add special animation class for hint
    const isHint = dictationMode && index === 0 && hasError && isCurrentWord && !isCompleted && displayChar === char;
    
    // Use fixed-width spans with consistent sizing
    return (
      <span 
        key={index} 
        className={`
          inline-block w-[0.6em] text-center
          ${textColor} ${bgColor} ${textDecoration}
          transition-all duration-150
          ${isHint ? 'animate-pulse rounded' : ''}
        `}
        style={{ fontFamily: 'monospace' }}
      >
        {displayChar}
      </span>
    );
  };

  const renderSpace = () => {
    const isCurrentSpace = isCurrentWord && currentCharIndex === word.length;
    const spaceTyped = typedChars.length > word.length;
    const hasSpaceError = errors.some(err => err.charIndex === word.length) || spaceError;
    
    // Get what was actually typed for the space position
    const typedSpaceChar = typedChars.length > word.length ? typedChars[word.length] : '';
    const isSpaceCharCorrect = typedSpaceChar === ' ';
    
    let textColor = 'text-gray-700 dark:text-gray-300';
    let bgColor = '';
    let displayChar = '\u00A0'; // nbsp by default
    
    if (isCompleted && hasSpaceError) {
      textColor = 'text-red-400 dark:text-red-500';
      if (typedSpaceChar && typedSpaceChar !== ' ') {
        displayChar = typedSpaceChar; // Show the wrong character
      }
    } else if (isCurrentSpace) {
      textColor = 'text-gray-900 dark:text-gray-100';
      bgColor = 'bg-blue-100 dark:bg-blue-900';
    } else if (spaceTyped) {
      if (hasSpaceError || !isSpaceCharCorrect) {
        textColor = 'text-red-500 dark:text-red-400';
        if (typedSpaceChar && typedSpaceChar !== ' ') {
          displayChar = typedSpaceChar; // Show the wrong character
        }
      } else {
        textColor = 'text-green-600 dark:text-green-400';
      }
    }
    
    // Always render a fixed-width space container
    return (
      <span 
        className={`
          inline-block w-[0.6em] h-[1.2em] text-center
          ${textColor} ${bgColor}
          transition-all duration-150
        `}
        style={{ fontFamily: 'monospace' }}
      >
        {displayChar}
      </span>
    );
  };

  return (
    <div className="inline-block align-top mb-6">
      <div className="relative">
        <div className="text-xl leading-relaxed" style={{ fontFamily: 'monospace' }}>
          {word.split('').map(renderChar)}
          {showSpace && renderSpace()}
        </div>
      </div>
      {showIPA && (
        <div className="text-xs mt-2 text-center">
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