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
      expect(engine.typedText).toBe('');
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
      engine.processKeystroke('X'); // Wrong
      engine.processKeystroke('H'); // Correct
      
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
  });
});