import { describe, it, expect } from 'vitest';
import {
  splitSentences,
  pairSentences,
  groupWordsBySentence,
  splitParagraphs,
  pairParagraphs,
  groupWordsByParagraph,
  mergeAdjacentByLength,
  buildAlignedGroups,
} from './sentencePairing';

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

describe('splitParagraphs', () => {
  it('splits on single and multiple newlines', () => {
    expect(splitParagraphs('A\nB\n\nC')).toEqual(['A', 'B', 'C']);
  });

  it('trims and drops empty paragraphs', () => {
    expect(splitParagraphs('  hello  \n\n   \nworld')).toEqual([
      'hello',
      'world',
    ]);
  });

  it('handles empty or non-string input', () => {
    expect(splitParagraphs('')).toEqual([]);
    expect(splitParagraphs(null)).toEqual([]);
  });
});

describe('pairParagraphs', () => {
  it('pairs equal-count paragraphs even when inner sentence counts differ', () => {
    const ref = 'W：大家好。我是 William。\nA：我是 Alvin。';
    const typ = "W: Hi. I'm William. Nice to meet you.\nA: I'm Alvin.";
    const pairs = pairParagraphs(ref, typ);
    expect(pairs).toHaveLength(2);
    expect(pairs[0].reference).toContain('William');
    expect(pairs[1].reference).toContain('Alvin');
  });

  it('returns null when paragraph counts differ', () => {
    expect(pairParagraphs('A\nB\nC', 'X\nY')).toBeNull();
  });
});

describe('groupWordsByParagraph', () => {
  it('groups words per paragraph preserving engine-split order', () => {
    const text = "Hello world.\nFoo bar baz.\nFinal line.";
    expect(groupWordsByParagraph(text)).toEqual([
      ['Hello', 'world.'],
      ['Foo', 'bar', 'baz.'],
      ['Final', 'line.'],
    ]);
  });
});

describe('mergeAdjacentByLength', () => {
  it('returns null when items are fewer than target buckets', () => {
    expect(mergeAdjacentByLength(['a', 'b'], 3, (s) => s.length)).toBeNull();
  });

  it('wraps each item when counts already match', () => {
    expect(mergeAdjacentByLength(['a', 'b'], 2, (s) => s.length)).toEqual([
      ['a'],
      ['b'],
    ]);
  });

  it('merges adjacent items roughly by length when counts differ', () => {
    const items = ['aa', 'bb', 'ccccc', 'd'];
    const buckets = mergeAdjacentByLength(items, 2, (s) => s.length);
    expect(buckets).toHaveLength(2);
    expect(buckets[0].concat(buckets[1])).toEqual(items);
  });

  it('guarantees each bucket gets at least one item', () => {
    const items = ['aaaaaaaa', 'b', 'c'];
    const buckets = mergeAdjacentByLength(items, 3, (s) => s.length);
    expect(buckets).toEqual([['aaaaaaaa'], ['b'], ['c']]);
  });
});

describe('buildAlignedGroups', () => {
  it('prefers finer sentence alignment when both paragraph and sentence strict match', () => {
    const ref = '你好。我是 W。\nA：我是 A。';
    const typ = "Hi. I'm W.\nA: I'm A.";
    const engineWords = ['Hi.', "I'm", 'W.', 'A:', "I'm", 'A.'];
    const groups = buildAlignedGroups(ref, typ, engineWords);
    // Sentence-strict yields 3 groups; paragraph yields 2. Finer wins.
    expect(groups).toHaveLength(3);
  });

  it('uses paragraph alignment when sentence-strict count differs but paragraphs match', () => {
    // 5 paragraphs each; Chinese has 1 sentence per paragraph, English has
    // 2 sentences in the last paragraph (sentence counts differ → sentence
    // strict fails, paragraph strict succeeds).
    const ref = 'A。\nB。\nC。\nD。\nE。';
    const typ = 'A.\nB.\nC.\nD.\nE. F.';
    const engineWords = ['A.', 'B.', 'C.', 'D.', 'E.', 'F.'];
    const groups = buildAlignedGroups(ref, typ, engineWords);
    expect(groups).toHaveLength(5);
    expect(groups[4].words).toEqual(['E.', 'F.']);
  });

  it('falls back to exact sentence alignment when paragraph counts differ', () => {
    // 2 reference paragraphs (one sentence each) vs 1 typing paragraph (two sentences).
    // Paragraph counts differ → fallback to sentence, which is 2↔2.
    const ref = '你好。\n再见。';
    const typ = 'Hi. Bye.';
    const engineWords = ['Hi.', 'Bye.'];
    const groups = buildAlignedGroups(ref, typ, engineWords);
    expect(groups).toHaveLength(2);
    expect(groups[0].words).toEqual(['Hi.']);
    expect(groups[1].words).toEqual(['Bye.']);
  });

  it('falls back to fuzzy when neither paragraph nor sentence counts match', () => {
    // 1 Chinese sentence ↔ 2 English sentences. Fuzzy merges English down to 1.
    const ref = '我们提出了一个问题：如果快速增长的加密资金流入产生收入的资产会怎样？';
    const typ = 'We asked one question. What if crypto dollars flowed in?';
    const engineWords = typ.split(/\s+/);
    const groups = buildAlignedGroups(ref, typ, engineWords);
    expect(groups).toHaveLength(1);
    expect(groups[0].words).toEqual(engineWords);
  });

  it('returns null when referenceText is empty', () => {
    expect(buildAlignedGroups('', 'hello', ['hello'])).toBeNull();
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
