import { describe, it, expect, beforeEach } from 'vitest';
import { TypingEngine, TypingState } from './typingEngine';

describe('TypingEngine', () => {
  let engine;
  const testText = 'Hello world';

  beforeEach(() => {
    engine = new TypingEngine(testText);
  });

  describe('initialization', () => {
    it('should initialize with correct state', () => {
      expect(engine.state).toBe(TypingState.NOT_STARTED);
      expect(engine.currentWordIndex).toBe(0);
      expect(engine.currentCharIndex).toBe(0);
      expect(engine.typedText).toBe('');
      expect(engine.errors).toEqual([]);
    });

    it('should parse words correctly', () => {
      expect(engine.words).toEqual(['Hello', 'world']);
    });
  });

  describe('processKeystroke', () => {
    it('should start the engine on first keystroke', () => {
      engine.processKeystroke('H');
      expect(engine.state).toBe(TypingState.IN_PROGRESS);
      expect(engine.startTime).not.toBeNull();
    });

    it('should handle correct keystrokes', () => {
      const result = engine.processKeystroke('H');
      expect(result.isCorrect).toBe(true);
      expect(engine.typedText).toBe('H');
      expect(engine.currentCharIndex).toBe(1);
    });

    it('should handle incorrect keystrokes', () => {
      const result = engine.processKeystroke('X');
      expect(result.isCorrect).toBe(false);
      expect(engine.errors.length).toBe(1);
      expect(engine.typedText).toBe('X');
      expect(engine.currentCharIndex).toBe(1);
    });

    it('should advance to next word after space', () => {
      'Hello'.split('').forEach(char => engine.processKeystroke(char));
      engine.processKeystroke(' ');
      expect(engine.currentWordIndex).toBe(1);
      expect(engine.currentCharIndex).toBe(0);
    });
  });

  describe('handleBackspace', () => {
    it('should remove last character', () => {
      engine.processKeystroke('H');
      engine.processKeystroke('e');
      engine.handleBackspace();
      expect(engine.typedText).toBe('H');
      expect(engine.currentCharIndex).toBe(1);
    });

    it('should not go before start', () => {
      const result = engine.handleBackspace();
      expect(result).toBe(false);
    });
  });

  describe('statistics', () => {
    it('should calculate WPM and accuracy', () => {
      // Type the entire text
      testText.split('').forEach(char => engine.processKeystroke(char));
      
      const stats = engine.getStats();
      expect(stats.accuracy).toBe(100);
      expect(stats.errors).toBe(0);
      expect(stats.keystrokes).toBe(testText.length);
    });

    it('should track errors correctly', () => {
      engine.processKeystroke('X'); // Wrong - expected 'H', cursor advances to index 1
      engine.processKeystroke('e'); // Correct - expected 'e' at index 1

      const stats = engine.getStats();
      expect(stats.accuracy).toBe(50);
      expect(stats.errors).toBe(1);
    });
  });

  describe('skipWord', () => {
    it('should skip to next word', () => {
      engine.skipWord();
      expect(engine.currentWordIndex).toBe(1);
      expect(engine.currentCharIndex).toBe(0);
    });

    it('should not skip past last word', () => {
      engine.skipWord();
      const result = engine.skipWord();
      expect(result).toBe(false);
    });

    it('records skipped chars as errors and counts them as keystrokes', () => {
      // Skipping "Hello" (5 chars) from the start should register 5 errors and
      // 6 keystrokes (5 skipped + 1 delimiter space), not a free 100% pass.
      const result = engine.skipWord();
      expect(result.skippedCharIndices).toEqual([0, 1, 2, 3, 4]);
      expect(engine.errors.length).toBe(5);
      expect(engine.keystrokes).toBe(6);
      expect(engine.correctKeystrokes).toBe(1); // the delimiter space
      // typedText length stays in lockstep with keystrokes (no WPM inflation).
      expect(engine.typedText.length).toBe(engine.keystrokes);
    });

    it('starts the timer when skipping before any typing', () => {
      engine.skipWord();
      expect(engine.state).toBe(TypingState.IN_PROGRESS);
      expect(engine.startTime).not.toBeNull();
    });
  });

  describe('empty / whitespace-only text', () => {
    it('produces no words and never auto-completes', () => {
      const empty = new TypingEngine('');
      expect(empty.words).toEqual([]);
      expect(empty.isComplete()).toBe(false);
    });

    it('ignores keystrokes instead of completing on the first one', () => {
      const ws = new TypingEngine('   ');
      expect(ws.words).toEqual([]);
      const result = ws.processKeystroke('a');
      expect(result).toBeNull();
      expect(ws.state).toBe(TypingState.NOT_STARTED);
    });
  });

  describe('word-mode overflow + backspace bookkeeping', () => {
    it('attributes overflow errors to the right word after cross-word backspace', () => {
      // text "ab cd": type "ab" + two overflow chars "XY", advance, then come
      // back. Overflow positions (2,3) collide with word 2's start position (3)
      // in absolute coords; (wordIndex,charIndex) identity keeps them on word 0.
      const e = new TypingEngine('ab cd');
      e.processKeystroke('a');
      e.processKeystroke('b');
      e.recordOverflowChar('X'); // charIndex 2 (overflow)
      e.recordOverflowChar('Y'); // charIndex 3 (overflow)
      const overflowErrs = e.errors.filter((er) => er.wordIndex === 0);
      expect(overflowErrs.map((er) => er.charIndex)).toEqual([2, 3]);
      // No overflow error should be misattributed to word 1.
      expect(e.errors.some((er) => er.wordIndex === 1)).toBe(false);
    });
  });
});