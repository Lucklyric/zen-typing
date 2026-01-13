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
  theme = 'normal',
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
    let textColor, bgColor = '', textDecoration = '';
    
    if (theme === 'geek') {
      // Ultrathink terminal theme colors
      textColor = 'text-green-400/60'; // untyped (dimmed)

      if (isCompleted) {
        if (hasError) {
          textColor = 'text-orange-400'; // Better visibility than red on dark bg
          textDecoration = 'underline decoration-orange-400 decoration-2 underline-offset-2';
        } else {
          textColor = 'text-emerald-400/40';
        }
      } else if (isCurrentChar) {
        textColor = 'text-green-950';
        bgColor = 'bg-green-400 ring-2 ring-green-300 shadow-[0_0_10px_#4ade80]'; // Solid cursor with glow
      } else if (isTyped) {
        if (hasError) {
          textColor = 'text-orange-400'; // Better visibility than red on dark bg
          textDecoration = 'underline decoration-orange-400 decoration-2 underline-offset-2';
        } else {
          textColor = 'text-emerald-400';
        }
      } else if (dictationMode && !isTyped) {
        textColor = 'text-green-400/30';
      }

      // Special styling for dictation mode hint
      if (dictationMode && index === 0 && hasError && isCurrentWord && !isCompleted && displayChar === char) {
        textColor = 'text-yellow-400';
        bgColor = 'bg-yellow-400/20';
        textDecoration = '';
      }
    } else if (theme === 'cyber') {
      // Cyberpunk Neon Theme
      textColor = 'text-cyan-600/70'; // untyped (visible but dimmed for WCAG contrast)

      if (isCompleted) {
        if (hasError) {
          textColor = 'text-fuchsia-500 animate-glitch';
          textDecoration = 'line-through decoration-fuchsia-500';
        } else {
          textColor = 'text-cyan-700/50';
        }
      } else if (isCurrentChar) {
        textColor = 'text-cyan-950 font-bold';
        bgColor = 'bg-cyan-400 shadow-cyber animate-cyber-cursor'; // Color-shifting glow cursor
      } else if (isTyped) {
        if (hasError) {
          textColor = 'text-fuchsia-500 text-shadow-neon-pink';
          // Optional: Add glitch effect only to recent errors? keeping it simple for now
        } else {
          textColor = 'text-cyan-400 text-shadow-neon';
        }
      } else if (dictationMode && !isTyped) {
        textColor = 'text-cyan-600/40';
      }

      // Special styling for dictation mode hint
      if (dictationMode && index === 0 && hasError && isCurrentWord && !isCompleted && displayChar === char) {
        textColor = 'text-yellow-400';
        bgColor = 'bg-yellow-400/20';
        textDecoration = '';
      }
    } else {
      // Normal theme colors - WCAG AA compliant
      textColor = 'text-gray-700 dark:text-gray-300'; // untyped

      if (isCompleted) {
        if (hasError) {
          textColor = 'text-red-700 dark:text-red-400';
          textDecoration = 'underline decoration-red-700 dark:decoration-red-400 decoration-2 underline-offset-2';
        } else {
          textColor = 'text-gray-400 dark:text-gray-500';
        }
      } else if (isCurrentChar) {
        textColor = 'text-blue-900 dark:text-blue-100';
        bgColor = 'bg-blue-100 dark:bg-blue-700/90 ring-2 ring-blue-400 dark:ring-blue-500 ring-inset border-l-2 border-blue-500'; // Enhanced visibility cursor
      } else if (isTyped) {
        if (hasError) {
          textColor = 'text-red-700 dark:text-red-400';
          textDecoration = 'underline decoration-red-700 dark:decoration-red-400 decoration-2 underline-offset-2';
        } else {
          textColor = 'text-emerald-700 dark:text-emerald-400'; // WCAG AA compliant green
        }
      } else if (dictationMode && !isTyped) {
        textColor = 'text-gray-400 dark:text-gray-600';
      }

      // Special styling for dictation mode hint
      if (dictationMode && index === 0 && hasError && isCurrentWord && !isCompleted && displayChar === char) {
        textColor = 'text-amber-600 dark:text-amber-400';
        bgColor = 'bg-amber-50 dark:bg-amber-900/20';
        textDecoration = '';
      }
    }

    // Add special animation class for hint
    const isHint = dictationMode && index === 0 && hasError && isCurrentWord && !isCompleted && displayChar === char;
    
    // Use fixed-width spans with consistent sizing
    return (
      <span
        key={index}
        className={`
          inline-block w-[0.65em] text-center
          ${textColor} ${bgColor} ${textDecoration}
          transition-all duration-150 caret-transition
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
    
    let textColor, bgColor = '';
    let displayChar = '\u00A0'; // nbsp by default
    
    if (theme === 'geek') {
      // Ultrathink terminal theme for spaces
      textColor = 'text-green-400/60';

      if (isCompleted && hasSpaceError) {
        textColor = 'text-orange-400';
        if (typedSpaceChar && typedSpaceChar !== ' ') {
          displayChar = typedSpaceChar;
        }
      } else if (isCurrentSpace) {
        textColor = 'text-green-950';
        bgColor = 'bg-green-400 ring-2 ring-green-300 shadow-[0_0_10px_#4ade80]'; // Solid cursor with glow
      } else if (spaceTyped) {
        if (hasSpaceError || !isSpaceCharCorrect) {
          textColor = 'text-orange-400';
          if (typedSpaceChar && typedSpaceChar !== ' ') {
            displayChar = typedSpaceChar;
          }
        } else {
          textColor = 'text-emerald-400';
        }
      }
    } else if (theme === 'cyber') {
      // Cyber theme for spaces
      textColor = 'text-cyan-600/70';

      if (isCompleted && hasSpaceError) {
        textColor = 'text-fuchsia-500 animate-glitch';
        if (typedSpaceChar && typedSpaceChar !== ' ') {
          displayChar = typedSpaceChar;
        }
      } else if (isCurrentSpace) {
        textColor = 'text-cyan-950';
        bgColor = 'bg-cyan-400 shadow-cyber animate-cyber-cursor'; // Color-shifting glow cursor
      } else if (spaceTyped) {
        if (hasSpaceError || !isSpaceCharCorrect) {
          textColor = 'text-fuchsia-500 text-shadow-neon-pink';
          if (typedSpaceChar && typedSpaceChar !== ' ') {
            displayChar = typedSpaceChar;
          }
        } else {
          textColor = 'text-cyan-400 text-shadow-neon';
        }
      }
    } else {
      // Normal theme for spaces - WCAG AA compliant
      textColor = 'text-gray-700 dark:text-gray-300';

      if (isCompleted && hasSpaceError) {
        textColor = 'text-red-700 dark:text-red-400';
        if (typedSpaceChar && typedSpaceChar !== ' ') {
          displayChar = typedSpaceChar;
        }
      } else if (isCurrentSpace) {
        textColor = 'text-blue-900 dark:text-blue-100';
        bgColor = 'bg-blue-100 dark:bg-blue-700/90 ring-2 ring-blue-400 dark:ring-blue-500 ring-inset border-l-2 border-blue-500'; // Enhanced visibility cursor
      } else if (spaceTyped) {
        if (hasSpaceError || !isSpaceCharCorrect) {
          textColor = 'text-red-700 dark:text-red-400';
          if (typedSpaceChar && typedSpaceChar !== ' ') {
            displayChar = typedSpaceChar;
          }
        } else {
          textColor = 'text-emerald-700 dark:text-emerald-400';
        }
      }
    }
    
    // Always render a fixed-width space container
    return (
      <span
        className={`
          inline-block w-[0.65em] h-[1.2em] text-center
          ${textColor} ${bgColor}
          transition-all duration-150 caret-transition
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
            <span className={
              theme === 'geek' 
                ? 'text-green-400/80 font-mono' 
                : theme === 'cyber'
                ? 'text-cyan-400 font-mono text-shadow-neon'
                : 'text-indigo-600 dark:text-indigo-400'
            }>
              {theme === 'geek' ? `[${ipa}]` : theme === 'cyber' ? `<${ipa}>` : `/${ipa}/`}
            </span>
          ) : (
            <span className={
              theme === 'geek' 
                ? 'text-green-400/40 font-mono' 
                : theme === 'cyber'
                ? 'text-cyan-600/50 font-mono'
                : 'text-gray-400 dark:text-gray-500 italic'
            }>
              {theme === 'geek' ? '[no.ipa]' : theme === 'cyber' ? 'N/A' : '/no IPA/'}
            </span>
          )}
        </div>
      )}
    </div>
  );
};

export default WordDisplay;