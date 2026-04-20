import { describe, it, expect } from 'vitest';
import { splitSentences, pairSentences, groupWordsBySentence } from './sentencePairing';

describe('splitSentences', () => {
  it('splits Chinese sentences on 。！？', () => {
    expect(splitSentences('你好。今天天气真好！我们去公园吗？')).toEqual([
      '你好。',
      '今天天气真好！',
      '我们去公园吗？',
    ]);
  });

  it('splits English sentences on .!?', () => {
    expect(splitSentences('Hello. How are you! Fine?')).toEqual([
      'Hello.',
      'How are you!',
      'Fine?',
    ]);
  });

  it('keeps a trailing fragment without terminal punctuation', () => {
    expect(splitSentences('Hello. World')).toEqual(['Hello.', 'World']);
  });

  it('handles empty and whitespace-only input', () => {
    expect(splitSentences('')).toEqual([]);
    expect(splitSentences('   ')).toEqual([]);
    expect(splitSentences(null)).toEqual([]);
    expect(splitSentences(undefined)).toEqual([]);
  });

  it('collapses runs of punctuation as one sentence ending', () => {
    expect(splitSentences('Wait?! Really.')).toEqual(['Wait?!', 'Really.']);
  });
});

describe('groupWordsBySentence', () => {
  it('groups words that end with terminal punctuation', () => {
    expect(groupWordsBySentence(['Hello.', 'World', 'is', 'good.'])).toEqual([
      ['Hello.'],
      ['World', 'is', 'good.'],
    ]);
  });

  it('handles trailing words without terminal punctuation', () => {
    expect(groupWordsBySentence(['Hello.', 'World'])).toEqual([
      ['Hello.'],
      ['World'],
    ]);
  });

  it('returns empty for empty input', () => {
    expect(groupWordsBySentence([])).toEqual([]);
    expect(groupWordsBySentence(null)).toEqual([]);
  });
});

describe('pairSentences', () => {
  it('zips equal-length sentence lists', () => {
    const pairs = pairSentences('你好。今天很好。', 'Hello. Today is good.');
    expect(pairs).toEqual([
      { reference: '你好。', typing: 'Hello.' },
      { reference: '今天很好。', typing: 'Today is good.' },
    ]);
  });

  it('returns null when counts differ', () => {
    expect(pairSentences('你好。今天。', 'Hello.')).toBeNull();
  });

  it('returns null when either side is empty', () => {
    expect(pairSentences('', 'Hello.')).toBeNull();
    expect(pairSentences('你好。', '')).toBeNull();
  });
});
