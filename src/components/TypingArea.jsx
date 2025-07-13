import React, { useState, useEffect, useRef } from 'react';
import WordDisplay from './WordDisplay';
import { TypingEngine, TypingState } from '../utils/typingEngine';
import { getIPA } from '../data/cmuIpaDict';
import { audioManager } from '../utils/audioManager';

const TypingArea = ({ text, onComplete, showIPA = false, dictationMode = false }) => {
  const [engine] = useState(() => new TypingEngine(text));
  const [currentWordIndex, setCurrentWordIndex] = useState(0);
  const [currentCharIndex, setCurrentCharIndex] = useState(0);
  const [wordTypedChars, setWordTypedChars] = useState({});
  const [wordErrors, setWordErrors] = useState({});
  const [stats, setStats] = useState(null);
  const inputRef = useRef(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const handleKeyDown = (e) => {
    e.preventDefault();

    if (engine.state === TypingState.COMPLETED) {
      return;
    }

    // Check for keyboard shortcuts and don't process them as typing input
    if ((e.ctrlKey || e.metaKey)) {
      // Let the shortcuts pass through but don't process as typing
      return;
    }

    if (e.key === 'Backspace') {
      const prevWordIndex = engine.currentWordIndex;
      const prevCharIndex = engine.currentCharIndex;
      
      if (engine.handleBackspace()) {
        // Play backspace sound
        audioManager.playBackspace();
        
        setCurrentWordIndex(engine.currentWordIndex);
        setCurrentCharIndex(engine.currentCharIndex);
        
        // Update typed characters - handle going back to previous word
        if (engine.currentWordIndex !== prevWordIndex) {
          // We went back to previous word - set typed chars to what was actually typed
          const currentTypedText = engine.typedText;
          let currentPos = 0;
          const newWordTypedChars = {};
          
          // Rebuild word typed chars from engine's typed text
          for (let i = 0; i <= engine.currentWordIndex; i++) {
            const word = engine.words[i];
            if (i < engine.currentWordIndex) {
              // Complete previous words
              const wordLength = word.length + 1; // +1 for space
              newWordTypedChars[i] = currentTypedText.slice(currentPos, currentPos + wordLength);
              currentPos += wordLength;
            } else {
              // Current word (partial)
              newWordTypedChars[i] = currentTypedText.slice(currentPos);
            }
          }
          
          setWordTypedChars(prev => ({
            ...prev,
            ...newWordTypedChars,
            [prevWordIndex]: '' // Clear the word we left
          }));
          
          // Clear errors for the word we left
          setWordErrors(prev => ({
            ...prev,
            [prevWordIndex]: []
          }));
        } else {
          // Still in same word - remove last character
          setWordTypedChars(prev => ({
            ...prev,
            [engine.currentWordIndex]: (prev[engine.currentWordIndex] || '').slice(0, -1)
          }));
          
          // Remove errors at or after the current position
          setWordErrors(prev => ({
            ...prev,
            [engine.currentWordIndex]: (prev[engine.currentWordIndex] || [])
              .filter(err => err.charIndex < engine.currentCharIndex)
          }));
        }
      }
      return;
    }

    if (e.key === 'Escape') {
      engine.reset();
      setCurrentWordIndex(0);
      setCurrentCharIndex(0);
      setWordTypedChars({});
      setWordErrors({});
      setStats(null);
      return;
    }

    if (e.ctrlKey && e.key === 'ArrowRight') {
      if (engine.skipWord()) {
        setCurrentWordIndex(engine.currentWordIndex);
        setCurrentCharIndex(0);
      }
      return;
    }

    if (e.key.length === 1) {
      const prevWordIndex = engine.currentWordIndex;
      const prevCharIndex = engine.currentCharIndex;
      const result = engine.processKeystroke(e.key);
      
      if (result) {
        setCurrentWordIndex(engine.currentWordIndex);
        setCurrentCharIndex(engine.currentCharIndex);

        // Play appropriate sound based on key and correctness
        if (e.key === ' ') {
          audioManager.playSpacebar(result.isCorrect);
        } else {
          audioManager.playKeystroke(result.isCorrect);
        }

        // Always update typed characters since cursor advances
        if (prevWordIndex !== engine.currentWordIndex) {
          // Moved to next word (either space was correct or incorrect)
          setWordTypedChars(prev => ({
            ...prev,
            [prevWordIndex]: (prev[prevWordIndex] || '') + e.key // Add the typed character (space)
          }));
        } else {
          // Still in same word
          setWordTypedChars(prev => ({
            ...prev,
            [engine.currentWordIndex]: (prev[engine.currentWordIndex] || '') + e.key
          }));
        }

        // Track error if incorrect
        if (!result.isCorrect) {
          let errorWordIndex = prevWordIndex;
          let errorCharIndex = prevCharIndex;
          
          setWordErrors(prev => ({
            ...prev,
            [errorWordIndex]: [
              ...(prev[errorWordIndex] || []).filter(err => err.charIndex !== errorCharIndex),
              { charIndex: errorCharIndex }
            ]
          }));
        } else {
          // Clear error at this position if it was corrected
          let errorWordIndex = prevWordIndex;
          let errorCharIndex = prevCharIndex;
          
          setWordErrors(prev => ({
            ...prev,
            [errorWordIndex]: (prev[errorWordIndex] || []).filter(err => err.charIndex !== errorCharIndex)
          }));
        }

        if (result.isComplete) {
          // Play completion sound
          audioManager.playCompletion();
          
          const finalStats = engine.getStats();
          setStats(finalStats);
          if (onComplete) {
            onComplete(finalStats);
          }
        }
      }
    }
  };

  const words = engine.words;
  const currentWord = engine.getCurrentWord();

  // Calculate progress
  const totalChars = words.join(' ').length;
  const typedChars = wordTypedChars[currentWordIndex]?.length || 0;
  const completedChars = words.slice(0, currentWordIndex).join(' ').length + 
                        (currentWordIndex > 0 ? currentWordIndex : 0); // Add spaces
  const progress = ((completedChars + typedChars) / totalChars) * 100;

  return (
    <div className="w-full">
      {/* Progress Bar */}
      <div className="mb-4">
        <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
          <div 
            className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 transition-all duration-300 ease-out"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>
      
      <div 
        className="cursor-text p-6 md:p-8 rounded-xl bg-gradient-to-br from-gray-50 to-white dark:from-gray-800 dark:to-gray-850 border border-gray-200 dark:border-gray-700"
        onClick={() => inputRef.current?.focus()}
      >
        <div className="text-center mb-8">
          {stats ? (
            <div className="space-y-4 animate-scale-in">
              <div className="flex items-center justify-center mb-4">
                <div className="w-20 h-20 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center">
                  <svg className="w-10 h-10 text-green-600 dark:text-green-400" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"/>
                  </svg>
                </div>
              </div>
              <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100">Excellent Work!</h2>
              <div className="flex justify-center gap-4 md:gap-8 mt-6">
                <div className="bg-indigo-50 dark:bg-indigo-900/20 rounded-xl p-4">
                  <div className="text-3xl font-bold text-indigo-600 dark:text-indigo-400">{stats.netWPM}</div>
                  <div className="text-xs text-gray-600 dark:text-gray-400 mt-1">WPM</div>
                </div>
                <div className="bg-green-50 dark:bg-green-900/20 rounded-xl p-4">
                  <div className="text-3xl font-bold text-green-600 dark:text-green-400">{stats.accuracy}%</div>
                  <div className="text-xs text-gray-600 dark:text-gray-400 mt-1">Accuracy</div>
                </div>
                <div className="bg-purple-50 dark:bg-purple-900/20 rounded-xl p-4">
                  <div className="text-3xl font-bold text-purple-600 dark:text-purple-400">{stats.duration}s</div>
                  <div className="text-xs text-gray-600 dark:text-gray-400 mt-1">Time</div>
                </div>
              </div>
              <button
                className="mt-6 px-8 py-3 bg-gradient-to-r from-indigo-500 to-purple-500 text-white rounded-lg font-medium hover:from-indigo-600 hover:to-purple-600 transform hover:scale-105 transition-all duration-200 shadow-lg"
                onClick={() => {
                  engine.reset();
                  setCurrentWordIndex(0);
                  setCurrentCharIndex(0);
                  setWordTypedChars({});
                  setWordErrors({});
                  setStats(null);
                }}
              >
                Practice Again
              </button>
            </div>
          ) : (
            <>
              <div className="flex flex-wrap leading-relaxed items-start font-mono">
                {words.map((word, wordIndex) => (
                  <WordDisplay
                    key={wordIndex}
                    word={word}
                    ipa={getIPA(word)}
                    currentCharIndex={wordIndex === currentWordIndex ? currentCharIndex : 0}
                    isCurrentWord={wordIndex === currentWordIndex}
                    isCompleted={wordIndex < currentWordIndex}
                    typedChars={wordTypedChars[wordIndex] || ''}
                    errors={wordErrors[wordIndex] || []}
                    showIPA={showIPA}
                    dictationMode={dictationMode}
                    showSpace={wordIndex < words.length - 1} // Show space for all words except the last
                  />
                ))}
              </div>
              
            </>
          )}
        </div>

        {/* Mobile-friendly typing hint */}
        {!stats && (
          <div className="mt-6 text-center text-sm text-gray-500 dark:text-gray-400">
            <p className="hidden md:block">Start typing to begin • Backspace to correct</p>
            <p className="md:hidden">Tap here and start typing</p>
          </div>
        )}
        
        <input
          ref={inputRef}
          type="text"
          className="sr-only"
          onKeyDown={handleKeyDown}
          tabIndex={0}
          aria-label="Typing input"
        />
      </div>
    </div>
  );
};

export default TypingArea;