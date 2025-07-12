export const TypingState = {
  NOT_STARTED: 'NOT_STARTED',
  IN_PROGRESS: 'IN_PROGRESS',
  PAUSED: 'PAUSED',
  COMPLETED: 'COMPLETED'
};

export class TypingEngine {
  constructor(text) {
    this.originalText = text;
    this.words = text.trim().split(/\s+/);
    this.currentWordIndex = 0;
    this.currentCharIndex = 0;
    this.typedText = '';
    this.errors = [];
    this.startTime = null;
    this.endTime = null;
    this.state = TypingState.NOT_STARTED;
    this.keystrokes = 0;
    this.correctKeystrokes = 0;
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
    
    const isCorrect = key === expectedChar;

    if (isCorrect) {
      this.correctKeystrokes++;
    } else {
      // Record the error at current position
      this.errors.push({
        position: this.getAbsolutePosition(),
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

    // If we're at the beginning of a word (not the first word)
    if (this.currentCharIndex === 0 && this.currentWordIndex > 0) {
      // Go back to the space after the previous word
      this.currentWordIndex--;
      this.currentCharIndex = this.words[this.currentWordIndex].length;
      this.typedText = this.typedText.slice(0, -1);
      
      // Remove errors that are being deleted
      const currentPos = this.getAbsolutePosition();
      this.errors = this.errors.filter(err => err.position < currentPos);
      
      return true;
    }
    
    // If we're not at the beginning of the typing session
    if (this.currentCharIndex > 0) {
      this.currentCharIndex--;
      this.typedText = this.typedText.slice(0, -1);
      
      // Remove errors that are being deleted
      const currentPos = this.getAbsolutePosition();
      this.errors = this.errors.filter(err => err.position < currentPos);
      
      return true;
    }

    return false;
  }


  skipWord() {
    if (this.currentWordIndex < this.words.length - 1) {
      this.currentWordIndex++;
      this.currentCharIndex = 0;
      return true;
    }
    return false;
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
  }

  getStats() {
    const duration = (this.endTime || Date.now()) - this.startTime;
    const minutes = duration / 60000;
    const totalChars = this.typedText.length;
    const words = totalChars / 5; // Standard WPM calculation
    const grossWPM = words / minutes;
    const accuracy = (this.correctKeystrokes / this.keystrokes) * 100;
    const netWPM = (grossWPM * accuracy) / 100;

    return {
      grossWPM: Math.round(grossWPM),
      netWPM: Math.round(netWPM),
      accuracy: Math.round(accuracy * 10) / 10,
      duration: Math.round(duration / 1000),
      errors: this.errors.length,
      keystrokes: this.keystrokes
    };
  }
}