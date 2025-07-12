import React, { useState, useEffect, useRef } from 'react';
import WordDisplay from './WordDisplay';
import { TypingEngine, TypingState } from '../utils/typingEngine';
import { getIPA } from '../data/cmuIpaDict';
import { audioManager } from '../utils/audioManager';

const TypingArea = ({ text, onComplete, showIPA = false }) => {
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
          // We went back to previous word
          setWordTypedChars(prev => ({
            ...prev,
            [engine.currentWordIndex]: engine.getCurrentWord(),
            [prevWordIndex]: ''
          }));
          // Clear errors for the word we left
          setWordErrors(prev => ({
            ...prev,
            [prevWordIndex]: []
          }));
        } else {
          // Still in same word
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
              ...(prev[errorWordIndex] || []),
              { charIndex: errorCharIndex }
            ]
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

  return (
    <div className="w-full max-w-4xl mx-auto p-8">
      <div 
        className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-8 cursor-text"
        onClick={() => inputRef.current?.focus()}
      >
        <div className="text-center mb-8">
          {stats ? (
            <div className="space-y-2 animate-fade-in">
              <h2 className="text-3xl font-bold text-green-600">Complete!</h2>
              <div className="flex justify-center gap-8 mt-4">
                <div>
                  <div className="text-2xl font-bold">{stats.netWPM}</div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">WPM</div>
                </div>
                <div>
                  <div className="text-2xl font-bold">{stats.accuracy}%</div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">Accuracy</div>
                </div>
                <div>
                  <div className="text-2xl font-bold">{stats.duration}s</div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">Time</div>
                </div>
              </div>
              <button
                className="mt-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
                onClick={() => {
                  engine.reset();
                  setCurrentWordIndex(0);
                  setCurrentCharIndex(0);
                  setWordTypedChars({});
                  setWordErrors({});
                  setStats(null);
                }}
              >
                Try Again
              </button>
            </div>
          ) : (
            <>
              <div className="flex flex-wrap leading-relaxed items-start">
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
                    showSpace={wordIndex < words.length - 1} // Show space for all words except the last
                  />
                ))}
              </div>
              
              {engine.state === TypingState.IN_PROGRESS && (
                <div className="mt-8 text-sm text-gray-600 dark:text-gray-400">
                  <div className="flex justify-center gap-8">
                    <span>Press <kbd className="px-2 py-1 bg-gray-200 dark:bg-gray-700 rounded">Esc</kbd> to reset</span>
                    <span>Press <kbd className="px-2 py-1 bg-gray-200 dark:bg-gray-700 rounded">Ctrl+→</kbd> to skip word</span>
                  </div>
                </div>
              )}
            </>
          )}
        </div>

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