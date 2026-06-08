import { describe, it, expect } from 'vitest';
import { charactersMatch, normalizeCharacter } from './characterNormalization';

const NBSP = String.fromCharCode(0x00a0);

describe('charactersMatch', () => {
  it('matches identical characters', () => {
    expect(charactersMatch('a', 'a')).toBe(true);
    expect(charactersMatch('a', 'b')).toBe(false);
  });

  it('stays case-sensitive (typing apps distinguish case)', () => {
    expect(charactersMatch('a', 'A')).toBe(false);
    expect(charactersMatch('A', 'a')).toBe(false);
  });

  it('matches a straight quote typed against a curly expected quote', () => {
    expect(charactersMatch("'", '‘')).toBe(true); // left single
    expect(charactersMatch("'", '’')).toBe(true); // right single
    expect(charactersMatch('"', '“')).toBe(true); // left double
    expect(charactersMatch('"', '”')).toBe(true); // right double
  });

  it('matches symmetrically when the curly char is the typed side', () => {
    // Regression: previously only the expected side was normalized.
    expect(charactersMatch('’', "'")).toBe(true);
    expect(charactersMatch('”', '"')).toBe(true);
  });

  it('matches a hyphen typed against en/em dashes (both directions)', () => {
    expect(charactersMatch('-', '–')).toBe(true);
    expect(charactersMatch('-', '—')).toBe(true);
    expect(charactersMatch('—', '-')).toBe(true);
  });

  it('matches a regular space typed against a non-breaking space (both directions)', () => {
    expect(charactersMatch(' ', NBSP)).toBe(true);
    expect(charactersMatch(NBSP, ' ')).toBe(true);
  });

  it('accepts a single period for an ellipsis char', () => {
    expect(charactersMatch('.', '…')).toBe(true);
  });

  it('matches case-insensitively only when ignoreCase is true', () => {
    expect(charactersMatch('a', 'A', true)).toBe(true);
    expect(charactersMatch('A', 'a', true)).toBe(true);
    // still distinguishes genuinely different letters
    expect(charactersMatch('a', 'B', true)).toBe(false);
    // default (omitted / false) stays case-sensitive
    expect(charactersMatch('a', 'A')).toBe(false);
    expect(charactersMatch('a', 'A', false)).toBe(false);
  });

  it('normalizeCharacter leaves ordinary chars untouched', () => {
    expect(normalizeCharacter('x')).toBe('x');
    expect(normalizeCharacter(' ')).toBe(' ');
  });
});
