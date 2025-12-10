import { useState, useEffect, useRef } from 'react';
import WordDisplay from './WordDisplay';
import { TypingEngine, TypingState } from '../utils/typingEngine';
import { audioManager } from '../utils/audioManager';

const TypingArea = ({ text, onComplete, showIPA = false, dictationMode = false, theme = 'normal' }) => {
  const [engine] = useState(() => new TypingEngine(text));
  const [currentWordIndex, setCurrentWordIndex] = useState(0);
  const [currentCharIndex, setCurrentCharIndex] = useState(0);
  const [wordTypedChars, setWordTypedChars] = useState({});
  const [wordErrors, setWordErrors] = useState({});
  const [stats, setStats] = useState(null);
  const [getIpaFn, setGetIpaFn] = useState(null);
  const [shakeWord, setShakeWord] = useState(null); // Track which word should shake
  const inputRef = useRef(null);
  const scrollContainerRef = useRef(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  // Lazy-load IPA dictionary when showIPA becomes true
  useEffect(() => {
    let cancelled = false;
    if (showIPA && !getIpaFn) {
      import('../data/cmuIpaDict')
        .then(({ getIPA }) => {
          if (!cancelled) setGetIpaFn(() => getIPA);
        })
        .catch(err => console.error('Failed to load IPA dictionary:', err));
    }
    return () => { cancelled = true; };
  }, [showIPA, getIpaFn]);

  // Auto-scroll to keep current word visible
  useEffect(() => {
    if (scrollContainerRef.current && currentWordIndex > 0) {
      const currentWordElement = scrollContainerRef.current.querySelector(`[data-word-index="${currentWordIndex}"]`);
      if (currentWordElement) {
        // Check if user prefers reduced motion
        const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        currentWordElement.scrollIntoView({ 
          behavior: prefersReducedMotion ? 'auto' : 'smooth', 
          block: 'center' 
        });
      }
    }
  }, [currentWordIndex]);

  const handleKeyDown = (e) => {
    if (engine.state === TypingState.COMPLETED) {
      return;
    }

    // Check for keyboard shortcuts and don't process them as typing input
    if ((e.ctrlKey || e.metaKey)) {
      // Handle Ctrl+ArrowRight for skip word
      if (e.key === 'ArrowRight') {
        e.preventDefault();
        if (engine.skipWord()) {
          setCurrentWordIndex(engine.currentWordIndex);
          setCurrentCharIndex(0);
        }
        return;
      }
      // Let other shortcuts pass through
      return;
    }

    e.preventDefault();

    if (e.key === 'Backspace') {
      const prevWordIndex = engine.currentWordIndex;

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
      setShakeWord(null);
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

          // Trigger shake animation for the error word
          setShakeWord(errorWordIndex);
          setTimeout(() => setShakeWord(null), 200); // Clear after animation duration
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

  // Calculate progress using engine's typedText for accuracy
  // Guard against division by zero for empty text
  const totalChars = Math.max(words.join(' ').length, 1);
  const progress = (engine.typedText.length / totalChars) * 100;

  return (
    <div className="w-full h-full flex flex-col">
      {/* Progress Bar */}
      <div className="mb-4 flex-shrink-0">
        <div 
          className={`h-2 rounded-full overflow-hidden ${
            theme === 'geek'
              ? 'bg-green-900/30 border border-green-500/20'
              : 'bg-gray-200 dark:bg-gray-700'
          }`}
          role="progressbar"
          aria-valuenow={Math.round(progress)}
          aria-valuemin="0"
          aria-valuemax="100"
          aria-label="Typing progress"
        >
          <div 
            className={`h-full transition-all duration-300 ease-out ${
              theme === 'geek'
                ? 'bg-green-400 shadow-lg shadow-green-400/50'
                : 'bg-gradient-to-r from-indigo-500 to-purple-500'
            }`}
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>
      
      <div
        className={`cursor-text p-6 md:p-8 h-full flex flex-col ${
          theme === 'geek'
            ? 'bg-black font-mono'
            : theme === 'cyber'
            ? 'bg-transparent font-mono'
            : 'bg-gradient-to-br from-gray-50 to-white dark:from-gray-800 dark:to-gray-850'
        }`}
        onClick={() => inputRef.current?.focus()}
      >
        <div className="flex-1 min-h-0 flex flex-col text-center overflow-hidden">
          {stats ? (
            <div className="space-y-4 animate-scale-in flex-1 flex flex-col justify-center" role="status">
              <div className="flex items-center justify-center mb-4">
                <div className={`w-20 h-20 rounded-full flex items-center justify-center ${
                  theme === 'geek'
                    ? 'bg-green-900/30 border border-green-400'
                    : theme === 'cyber'
                    ? 'bg-cyan-900/30 border-2 border-cyan-400 shadow-cyber animate-cyber-pulse'
                    : 'bg-green-100 dark:bg-green-900/30'
                }`}>
                  {theme === 'geek' ? (
                    <span className="text-2xl text-green-400 font-mono">[✓]</span>
                  ) : theme === 'cyber' ? (
                    <span className="text-3xl text-cyan-400 font-mono animate-cyber-glow">◆</span>
                  ) : (
                    <svg className="w-10 h-10 text-green-600 dark:text-green-400" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"/>
                    </svg>
                  )}
                </div>
              </div>
              <h2 className={`text-2xl font-bold ${
                theme === 'geek'
                  ? 'text-green-400 font-mono'
                  : theme === 'cyber'
                  ? 'text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-purple-500 to-cyan-400 font-mono animate-cyber-glow'
                  : 'text-gray-800 dark:text-gray-100'
              }`}>
                {theme === 'geek' ? '> MISSION.COMPLETE' : theme === 'cyber' ? '>> TRANSMISSION_COMPLETE <<' : 'Excellent Work!'}
              </h2>
              <div className="flex justify-center gap-4 md:gap-8 mt-6">
                <div className={`rounded-xl p-4 ${
                  theme === 'geek'
                    ? 'bg-green-900/20 border border-green-500/30 font-mono'
                    : theme === 'cyber'
                    ? 'bg-cyan-900/20 border border-cyan-500/50 font-mono shadow-[0_0_15px_rgba(0,243,255,0.2)]'
                    : 'bg-indigo-50 dark:bg-indigo-900/20'
                }`}>
                  <div className={`text-3xl font-bold ${
                    theme === 'geek'
                      ? 'text-green-400 font-mono'
                      : theme === 'cyber'
                      ? 'text-cyan-400 font-mono text-shadow-neon'
                      : 'text-indigo-600 dark:text-indigo-400'
                  }`}>{stats.netWPM}</div>
                  <div className={`text-xs mt-1 ${
                    theme === 'geek'
                      ? 'text-green-400/70 font-mono'
                      : theme === 'cyber'
                      ? 'text-cyan-600 font-mono'
                      : 'text-gray-600 dark:text-gray-400'
                  }`}>
                    {theme === 'geek' ? 'WPM.RATE' : theme === 'cyber' ? 'SPEED_WPM' : 'WPM'}
                  </div>
                </div>
                <div className={`rounded-xl p-4 ${
                  theme === 'geek'
                    ? 'bg-green-900/20 border border-green-500/30 font-mono'
                    : theme === 'cyber'
                    ? 'bg-fuchsia-900/20 border border-fuchsia-500/50 font-mono shadow-[0_0_15px_rgba(188,19,254,0.2)]'
                    : 'bg-green-50 dark:bg-green-900/20'
                }`}>
                  <div className={`text-3xl font-bold ${
                    theme === 'geek'
                      ? 'text-green-400 font-mono'
                      : theme === 'cyber'
                      ? 'text-fuchsia-400 font-mono text-shadow-neon-pink'
                      : 'text-green-600 dark:text-green-400'
                  }`}>{stats.accuracy}%</div>
                  <div className={`text-xs mt-1 ${
                    theme === 'geek'
                      ? 'text-green-400/70 font-mono'
                      : theme === 'cyber'
                      ? 'text-fuchsia-600 font-mono'
                      : 'text-gray-600 dark:text-gray-400'
                  }`}>
                    {theme === 'geek' ? 'ACCURACY.PCT' : theme === 'cyber' ? 'PRECISION' : 'Accuracy'}
                  </div>
                </div>
                <div className={`rounded-xl p-4 ${
                  theme === 'geek'
                    ? 'bg-green-900/20 border border-green-500/30 font-mono'
                    : theme === 'cyber'
                    ? 'bg-purple-900/20 border border-purple-500/50 font-mono shadow-[0_0_15px_rgba(168,85,247,0.2)]'
                    : 'bg-purple-50 dark:bg-purple-900/20'
                }`}>
                  <div className={`text-3xl font-bold ${
                    theme === 'geek'
                      ? 'text-green-400 font-mono'
                      : theme === 'cyber'
                      ? 'text-purple-400 font-mono'
                      : 'text-purple-600 dark:text-purple-400'
                  }`}>{stats.duration}s</div>
                  <div className={`text-xs mt-1 ${
                    theme === 'geek'
                      ? 'text-green-400/70 font-mono'
                      : theme === 'cyber'
                      ? 'text-purple-600 font-mono'
                      : 'text-gray-600 dark:text-gray-400'
                  }`}>
                    {theme === 'geek' ? 'TIME.SEC' : theme === 'cyber' ? 'ELAPSED' : 'Time'}
                  </div>
                </div>
              </div>
              <button
                className={`mt-6 px-8 py-3 rounded-lg font-medium transform hover:scale-105 transition-all duration-200 shadow-lg ${
                  theme === 'geek'
                    ? 'bg-green-500 text-black border border-green-400 hover:bg-green-400 font-mono'
                    : theme === 'cyber'
                    ? 'bg-gradient-to-r from-cyan-500 to-purple-500 text-white font-mono border border-cyan-400/50 hover:from-cyan-400 hover:to-purple-400 shadow-cyber'
                    : 'bg-gradient-to-r from-indigo-500 to-purple-500 text-white hover:from-indigo-600 hover:to-purple-600'
                }`}
                onClick={() => {
                  engine.reset();
                  setCurrentWordIndex(0);
                  setCurrentCharIndex(0);
                  setWordTypedChars({});
                  setWordErrors({});
                  setStats(null);
                  setShakeWord(null);
                  // Auto-focus the input to maintain typing flow
                  inputRef.current?.focus();
                }}
              >
                {theme === 'geek' ? '> RESTART.SESSION' : theme === 'cyber' ? '>> REINITIALIZE' : 'Practice Again'}
              </button>
            </div>
          ) : (
            <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
              {/* IPA Loading Indicator */}
              {showIPA && !getIpaFn && (
                <div className={`text-center py-2 text-sm flex-shrink-0 animate-pulse ${
                  theme === 'geek'
                    ? 'text-green-400/70 font-mono'
                    : theme === 'cyber'
                    ? 'text-cyan-400/70 font-mono text-shadow-neon'
                    : 'text-gray-500 dark:text-gray-400'
                }`}>
                  {theme === 'geek' ? '// loading.ipa.dictionary...' : theme === 'cyber' ? '>> LOADING_PHONETIC_DATABASE...' : 'Loading IPA dictionary...'}
                </div>
              )}
              <div
                ref={scrollContainerRef}
                className={`flex-1 overflow-y-auto px-1 ${
                  theme === 'geek' ? 'custom-scrollbar-geek' : theme === 'cyber' ? 'custom-scrollbar-cyber' : 'custom-scrollbar'
                }`}
              >
                <div className={`flex flex-wrap leading-loose tracking-wide items-start text-xl md:text-2xl lg:text-3xl ${
                  theme === 'geek' ? 'font-mono' : 'font-mono'
                }`}>
                  {words.map((word, wordIndex) => (
                    <div
                      key={wordIndex}
                      data-word-index={wordIndex}
                      className={shakeWord === wordIndex ? 'animate-shake' : ''}
                    >
                      <WordDisplay
                        word={word}
                        ipa={showIPA && getIpaFn ? getIpaFn(word) : null}
                        currentCharIndex={wordIndex === currentWordIndex ? currentCharIndex : 0}
                        isCurrentWord={wordIndex === currentWordIndex}
                        isCompleted={wordIndex < currentWordIndex}
                        typedChars={wordTypedChars[wordIndex] || ''}
                        errors={wordErrors[wordIndex] || []}
                        showIPA={showIPA}
                        dictationMode={dictationMode}
                        theme={theme}
                        showSpace={wordIndex < words.length - 1} // Show space for all words except the last
                      />
                    </div>
                  ))}
                </div>
              </div>
              
              {/* Mobile-friendly typing hint */}
              <div className={`mt-6 text-center text-sm flex-shrink-0 ${
                theme === 'geek'
                  ? 'text-green-400/70 font-mono'
                  : theme === 'cyber'
                  ? 'text-cyan-600 font-mono'
                  : 'text-gray-500 dark:text-gray-400'
              }`}>
                <p className="hidden md:block">
                  {theme === 'geek'
                    ? '// start.typing() -> begin.session | backspace() -> error.correct'
                    : theme === 'cyber'
                    ? '>> AWAITING_INPUT... | BACKSPACE = ERROR_CORRECTION'
                    : 'Start typing to begin • Backspace to correct'
                  }
                </p>
                <p className="md:hidden">
                  {theme === 'geek'
                    ? '// tap.screen -> init.session'
                    : theme === 'cyber'
                    ? '>> TAP_TO_INITIALIZE'
                    : 'Tap here and start typing'
                  }
                </p>
              </div>
            </div>
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
