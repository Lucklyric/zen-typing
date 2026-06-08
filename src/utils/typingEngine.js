import { charactersMatch } from './characterNormalization';

export const TypingState = {
  NOT_STARTED: 'NOT_STARTED',
  IN_PROGRESS: 'IN_PROGRESS',
  PAUSED: 'PAUSED',
  COMPLETED: 'COMPLETED'
};

export class TypingEngine {
  constructor(text) {
    this.originalText = text;
    // Empty / whitespace-only text must yield NO words. (''.split(/\s+/) returns
    // [''] — a single empty "word" — which would make isComplete() true from the
    // start and complete the engine on the first keystroke.)
    const trimmed = (text || '').trim();
    this.words = trimmed.length > 0 ? trimmed.split(/\s+/) : [];
    this.currentWordIndex = 0;
    this.currentCharIndex = 0;
    this.typedText = '';
    this.errors = [];
    this.startTime = null;
    this.endTime = null;
    this.state = TypingState.NOT_STARTED;
    this.keystrokes = 0;
    this.correctKeystrokes = 0;
    // Stack of { typed, restore } captured when crossing forward into the next
    // word. `typed` is the actual char count this word occupies in `typedText`
    // (including any skip-padding or overflow); `restore` is the cursor
    // position to return the user to on cross-word backspace.
    this.wordEndCharIndices = [];
  }

  getCurrentWord() {
    return this.words[this.currentWordIndex] || '';
  }

  getCurrentChar() {
    const word = this.getCurrentWord();
    return word[this.currentCharIndex] || '';
  }

  getExpectedChar() {
    const currentWord = this.getCurrentWord();
    
    if (this.currentCharIndex < currentWord.length) {
      return currentWord[this.currentCharIndex];
    } else if (this.currentCharIndex === currentWord.length && this.currentWordIndex < this.words.length - 1) {
      return ' ';
    } else {
      return '';
    }
  }

  getAbsolutePosition() {
    let position = 0;
    for (let i = 0; i < this.currentWordIndex; i++) {
      position += this.words[i].length + 1; // +1 for space
    }
    position += this.currentCharIndex;
    return position;
  }

  processKeystroke(key) {
    // Nothing to type — don't start or advance on empty/whitespace text.
    if (this.words.length === 0) return null;

    if (this.state === TypingState.NOT_STARTED) {
      this.start();
    }

    if (this.state !== TypingState.IN_PROGRESS) {
      return null;
    }

    this.keystrokes++;
    const currentWord = this.getCurrentWord();
    
    // Determine expected character
    let expectedChar;
    if (this.currentCharIndex < currentWord.length) {
      // We're within a word
      expectedChar = currentWord[this.currentCharIndex];
    } else if (this.currentCharIndex === currentWord.length && this.currentWordIndex < this.words.length - 1) {
      // We're at the end of a word (not the last word), expect space
      expectedChar = ' ';
    } else {
      // We're at the end of the last word
      expectedChar = '';
    }
    
    const isCorrect = charactersMatch(key, expectedChar);

    if (isCorrect) {
      this.correctKeystrokes++;
    } else {
      // Record the error. Keep `position` for legacy consumers, but also tag it
      // with (wordIndex, charIndex) — the position-free identity that survives
      // overflow-char/next-word position collisions.
      this.errors.push({
        position: this.getAbsolutePosition(),
        wordIndex: this.currentWordIndex,
        charIndex: this.currentCharIndex,
        expected: expectedChar,
        typed: key,
        timestamp: Date.now()
      });
    }

    // Always advance cursor and add to typed text (whether correct or incorrect)
    this.typedText += key;
    
    if (this.currentCharIndex < currentWord.length) {
      // Moving within the word
      this.currentCharIndex++;
    } else if (this.currentWordIndex < this.words.length - 1) {
      // Move to next word (whether space was correct or not)
      this.wordEndCharIndices.push({ typed: this.currentCharIndex, restore: this.currentCharIndex });
      this.currentWordIndex++;
      this.currentCharIndex = 0;
    } else {
      // At end of last word
      this.currentCharIndex++;
    }

    if (this.isComplete()) {
      this.complete();
    }

    return {
      isCorrect,
      position: this.getAbsolutePosition(),
      isComplete: this.state === TypingState.COMPLETED
    };
  }

  handleBackspace() {
    if (this.state !== TypingState.IN_PROGRESS) {
      return false;
    }

    // Word-mode skip-undo: if at the start of a word and the previous word has
    // trailing skip-padding errors (typed === ''), undo the whole skip-advance
    // (padding + the user's space) in one operation. This avoids forcing the
    // user to backspace once per padded char to get back to where they left off.
    if (this.currentCharIndex === 0 && this.currentWordIndex > 0) {
      const prevWordIndex = this.currentWordIndex - 1;
      const prevWord = this.words[prevWordIndex];
      let prevWordStart = 0;
      for (let i = 0; i < prevWordIndex; i++) {
        prevWordStart += this.words[i].length + 1;
      }
      const prevWordEnd = prevWordStart + prevWord.length;

      let skipCount = 0;
      for (let pos = prevWordEnd - 1; pos >= prevWordStart; pos--) {
        const hasSkipErr = this.errors.some(
          err => err.position === pos && err.typed === ''
        );
        if (!hasSkipErr) break;
        skipCount++;
      }

      if (skipCount > 0) {
        const popLength = skipCount + 1; // +1 for the user's space keystroke
        this.typedText = this.typedText.slice(0, -popLength);
        this.errors = this.errors.filter(err => !(
          err.position >= prevWordEnd - skipCount &&
          err.position < prevWordEnd &&
          err.typed === ''
        ));
        this.keystrokes = Math.max(0, this.keystrokes - popLength);
        // The user's space had been counted as correct; revert that.
        this.correctKeystrokes = Math.max(0, this.correctKeystrokes - 1);
        this.currentWordIndex = prevWordIndex;
        // Pop the saved pre-cross position; falls back to derived value if the
        // stack is empty (e.g. external state mutation).
        const entry = this.wordEndCharIndices.pop();
        this.currentCharIndex = entry !== undefined ? entry.restore : (prevWord.length - skipCount);
        return true;
      }
    }

    // If we're at the beginning of a word (not the first word)
    if (this.currentCharIndex === 0 && this.currentWordIndex > 0) {
      // Go back to the space after the previous word
      this.currentWordIndex--;
      // Restore the cross-forward position (handles overflow chars correctly).
      const entry = this.wordEndCharIndices.pop();
      this.currentCharIndex = entry !== undefined ? entry.restore : this.words[this.currentWordIndex].length;
      this.typedText = this.typedText.slice(0, -1);

      // Decrement keystroke counters for the deleted character
      if (this.keystrokes > 0) {
        this.keystrokes--;
        // Identify errors by (wordIndex, charIndex) rather than absolute position:
        // an overflow char can share an absolute position with the next word's
        // start, so position-based filtering could touch the wrong word's errors.
        const cwi = this.currentWordIndex;
        const cci = this.currentCharIndex;
        const hadErrorAtPos = this.errors.some(
          err => err.wordIndex === cwi && err.charIndex === cci
        );
        if (!hadErrorAtPos && this.correctKeystrokes > 0) {
          this.correctKeystrokes--;
        }
        // Remove errors at or after the cursor (the deleted char and any later).
        this.errors = this.errors.filter(
          err => err.wordIndex < cwi || (err.wordIndex === cwi && err.charIndex < cci)
        );
      }

      return true;
    }

    // If we're not at the beginning of the typing session
    if (this.currentCharIndex > 0) {
      this.currentCharIndex--;
      this.typedText = this.typedText.slice(0, -1);

      // Decrement keystroke counters for the deleted character
      if (this.keystrokes > 0) {
        this.keystrokes--;
        // Identify errors by (wordIndex, charIndex) rather than absolute position:
        // an overflow char can share an absolute position with the next word's
        // start, so position-based filtering could touch the wrong word's errors.
        const cwi = this.currentWordIndex;
        const cci = this.currentCharIndex;
        const hadErrorAtPos = this.errors.some(
          err => err.wordIndex === cwi && err.charIndex === cci
        );
        if (!hadErrorAtPos && this.correctKeystrokes > 0) {
          this.correctKeystrokes--;
        }
        // Remove errors at or after the cursor (the deleted char and any later).
        this.errors = this.errors.filter(
          err => err.wordIndex < cwi || (err.wordIndex === cwi && err.charIndex < cci)
        );
      }

      return true;
    }

    return false;
  }


  // Word-mode: pressing space when the current word is in overflow (chars
  // typed past `word.length`). Advances to the next word and counts the space
  // as a correct delimiter — without recording it as a wrong char at an
  // out-of-range absolute position.
  advanceFromOverflow() {
    if (this.state !== TypingState.IN_PROGRESS) return null;
    if (this.currentWordIndex >= this.words.length - 1) return null;

    this.typedText += ' ';
    this.keystrokes++;
    this.correctKeystrokes++;
    this.wordEndCharIndices.push({
      typed: this.currentCharIndex,
      restore: this.currentCharIndex
    });
    this.currentWordIndex++;
    this.currentCharIndex = 0;

    if (this.isComplete()) {
      this.complete();
    }

    return { isComplete: this.state === TypingState.COMPLETED };
  }

  // Word-mode: append a char beyond the current word's length without
  // auto-advancing. Returns the position info or null when not in progress.
  recordOverflowChar(key) {
    if (this.state === TypingState.NOT_STARTED) {
      this.start();
    }
    if (this.state !== TypingState.IN_PROGRESS) return null;

    this.keystrokes++;
    this.errors.push({
      position: this.getAbsolutePosition(),
      wordIndex: this.currentWordIndex,
      charIndex: this.currentCharIndex,
      expected: '',
      typed: key,
      timestamp: Date.now()
    });
    this.typedText += key;
    this.currentCharIndex++;
    return { isCorrect: false, position: this.getAbsolutePosition() };
  }

  // Word-mode: pressing space mid-word should jump to the next word and mark
  // any unfilled chars as errors. Returns the char indices skipped, or null.
  advanceWordWithSkip() {
    if (this.state === TypingState.NOT_STARTED) {
      this.start();
    }
    if (this.state !== TypingState.IN_PROGRESS) return null;
    if (this.currentWordIndex >= this.words.length - 1) return null;

    const currentWord = this.getCurrentWord();
    const startCharIndex = this.currentCharIndex;
    const skippedCharIndices = [];

    for (let i = startCharIndex; i < currentWord.length; i++) {
      this.errors.push({
        position: this.getAbsolutePosition(),
        wordIndex: this.currentWordIndex,
        charIndex: i,
        expected: currentWord[i],
        typed: '',
        timestamp: Date.now()
      });
      skippedCharIndices.push(i);
      this.typedText += ' ';
      this.currentCharIndex++;
      this.keystrokes++;
    }

    // Account for the user's space keystroke (correctly delimits the word).
    this.typedText += ' ';
    this.keystrokes++;
    this.correctKeystrokes++;
    // Skip-padded word occupies `currentWord.length` chars in typedText; the
    // user-visible restore position is the pre-skip char index.
    this.wordEndCharIndices.push({ typed: currentWord.length, restore: startCharIndex });
    this.currentWordIndex++;
    this.currentCharIndex = 0;

    if (this.isComplete()) {
      this.complete();
    }

    return {
      skippedCharIndices,
      isComplete: this.state === TypingState.COMPLETED
    };
  }

  // Skip the rest of the current word (Ctrl+Right). Delegates to
  // advanceWordWithSkip so it shares the exact same bookkeeping as a mid-word
  // space-skip: remaining chars are recorded as errors AND counted as keystrokes
  // (so WPM/accuracy aren't distorted), the timer starts if needed, and the
  // skipped indices are returned so the UI can mark them. Returns the skip
  // result object (truthy) on success, or false at the last word / when not
  // typeable.
  skipWord() {
    const result = this.advanceWordWithSkip();
    return result || false;
  }

  start() {
    this.state = TypingState.IN_PROGRESS;
    this.startTime = Date.now();
  }

  pause() {
    if (this.state === TypingState.IN_PROGRESS) {
      this.state = TypingState.PAUSED;
    }
  }

  resume() {
    if (this.state === TypingState.PAUSED) {
      this.state = TypingState.IN_PROGRESS;
    }
  }

  complete() {
    this.state = TypingState.COMPLETED;
    this.endTime = Date.now();
  }

  isComplete() {
    // No words (empty/whitespace text) → never auto-completes.
    if (this.words.length === 0) return false;
    return this.currentWordIndex === this.words.length - 1 &&
           this.currentCharIndex >= this.getCurrentWord().length;
  }

  reset() {
    this.currentWordIndex = 0;
    this.currentCharIndex = 0;
    this.typedText = '';
    this.errors = [];
    this.startTime = null;
    this.endTime = null;
    this.state = TypingState.NOT_STARTED;
    this.keystrokes = 0;
    this.correctKeystrokes = 0;
    this.wordEndCharIndices = [];
  }

  getStats() {
    if (!this.startTime || this.keystrokes === 0) {
      return {
        grossWPM: 0,
        netWPM: 0,
        accuracy: 100,
        duration: 0,
        errors: 0,
        keystrokes: 0
      };
    }

    const duration = (this.endTime || Date.now()) - this.startTime;
    const minutes = duration / 60000;
    const totalChars = this.typedText.length;
    const words = totalChars / 5; // Standard WPM calculation

    // Guard against division by zero
    const grossWPM = minutes > 0 ? words / minutes : 0;
    const accuracy = this.keystrokes > 0 ? (this.correctKeystrokes / this.keystrokes) * 100 : 100;
    const netWPM = minutes > 0 ? (grossWPM * accuracy) / 100 : 0;

    return {
      grossWPM: Math.round(grossWPM) || 0,
      netWPM: Math.round(netWPM) || 0,
      accuracy: Math.round(accuracy * 10) / 10,
      duration: Math.round(duration / 1000),
      errors: this.errors.length,
      keystrokes: this.keystrokes
    };
  }
}