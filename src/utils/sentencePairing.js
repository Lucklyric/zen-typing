/**
 * Sentence pairing for Reference Mode
 *
 * Splits reference and typing texts into sentences on CJK + Western
 * terminal punctuation, then zips them into aligned pairs so the UI
 * can render each reference sentence directly above its typing target
 * (similar to how IPA sits above each word).
 */

const SENTENCE_SPLIT_REGEX = /([^。！？.!?]*[。！？.!?]+|[^。！？.!?]+$)/g;

export function splitSentences(text) {
  if (typeof text !== 'string' || text.length === 0) return [];
  const matches = text.match(SENTENCE_SPLIT_REGEX) || [];
  return matches
    .map((s) => s.trim())
    .filter((s) => s.length > 0);
}

/**
 * Pair reference sentences with typing sentences by index.
 * Returns null when either side is empty or the counts don't match —
 * callers should fall back to the plain blob layout in that case.
 *
 * @param {string} referenceText
 * @param {string} typingText
 * @returns {Array<{reference: string, typing: string}> | null}
 */
export function pairSentences(referenceText, typingText) {
  const refs = splitSentences(referenceText);
  const typings = splitSentences(typingText);

  if (refs.length === 0 || typings.length === 0) return null;
  if (refs.length !== typings.length) return null;

  return refs.map((reference, i) => ({ reference, typing: typings[i] }));
}

const TERMINAL_PUNCT_REGEX = /[。！？.!?]+$/;

/**
 * Group a flat word list into sentence-sized buckets, splitting at any word
 * whose trailing characters are sentence-terminal punctuation.
 *
 * @param {string[]} words
 * @returns {string[][]} groups, each an array of words for one sentence
 */
export function groupWordsBySentence(words) {
  if (!Array.isArray(words) || words.length === 0) return [];

  const groups = [];
  let current = [];
  for (const word of words) {
    current.push(word);
    if (TERMINAL_PUNCT_REGEX.test(word)) {
      groups.push(current);
      current = [];
    }
  }
  if (current.length > 0) groups.push(current);
  return groups;
}

export function splitParagraphs(text) {
  if (typeof text !== 'string' || text.length === 0) return [];
  return text
    .split(/\r?\n+/)
    .map((p) => p.trim())
    .filter((p) => p.length > 0);
}

/**
 * Pair reference paragraphs with typing paragraphs by index.
 *
 * @param {string} referenceText
 * @param {string} typingText
 * @returns {Array<{reference: string, typing: string}> | null}
 */
export function pairParagraphs(referenceText, typingText) {
  const refs = splitParagraphs(referenceText);
  const typings = splitParagraphs(typingText);

  if (refs.length === 0 || typings.length === 0) return null;
  if (refs.length !== typings.length) return null;

  return refs.map((reference, i) => ({ reference, typing: typings[i] }));
}

/**
 * Group a typing text's words by paragraph. Words come from the text, split
 * on whitespace — same way the typing engine splits them — so the global
 * word indices line up with engine.words.
 *
 * @param {string} text
 * @returns {string[][]} groups, each an array of words for one paragraph
 */
export function groupWordsByParagraph(text) {
  return splitParagraphs(text).map((para) =>
    para.split(/\s+/).filter(Boolean)
  );
}

/**
 * Merge an array of items into exactly `targetCount` adjacent buckets, sized
 * by cumulative length. Used to reconcile sentence-count mismatches where
 * translation joins or splits sentences differently between source and
 * target languages.
 *
 * @template T
 * @param {T[]} items
 * @param {number} targetCount
 * @param {(item: T) => number} getLength
 * @returns {T[][] | null} null if items.length < targetCount
 */
export function mergeAdjacentByLength(items, targetCount, getLength) {
  if (!Array.isArray(items) || targetCount <= 0) return null;
  if (items.length < targetCount) return null;
  if (items.length === targetCount) return items.map((i) => [i]);

  const lengths = items.map(getLength);
  const total = lengths.reduce((a, b) => a + b, 0) || 1;
  const bucketSize = total / targetCount;

  const buckets = [];
  let current = [];
  let currentLen = 0;

  for (let i = 0; i < items.length; i++) {
    current.push(items[i]);
    currentLen += lengths[i];
    const remainingItems = items.length - (i + 1);
    const remainingBuckets = targetCount - buckets.length - 1;
    const haveEnoughLeft = remainingItems >= remainingBuckets;
    const filledThisBucket = currentLen >= bucketSize;
    const mustCloseNow = remainingItems === remainingBuckets;
    const isLastBucket = buckets.length === targetCount - 1;

    if (!isLastBucket && (mustCloseNow || (filledThisBucket && haveEnoughLeft))) {
      buckets.push(current);
      current = [];
      currentLen = 0;
    }
  }
  if (current.length > 0) buckets.push(current);
  return buckets.length === targetCount ? buckets : null;
}

/**
 * Build display-ready aligned groups for Reference Mode. Tries, in order:
 *   1. Paragraph pairing (split on \n) — semantic and robust when both sides
 *      use matching paragraph structure.
 *   2. Exact sentence pairing (split on terminal punctuation).
 *   3. Fuzzy sentence pairing — merge adjacent sentences on the longer side
 *      by cumulative character-length ratio until counts match.
 *
 * @param {string} referenceText
 * @param {string} typingText - The original typing source (needed for paragraph splits)
 * @param {string[]} engineWords - The typing engine's word list
 * @returns {Array<{reference: string, words: string[], startIndex: number}> | null}
 */
export function buildAlignedGroups(referenceText, typingText, engineWords) {
  if (!referenceText || !Array.isArray(engineWords) || engineWords.length === 0) {
    return null;
  }

  const paragraph = alignByParagraphs(referenceText, typingText, engineWords);
  if (paragraph) return paragraph;

  const sentenceExact = alignBySentencesExact(referenceText, engineWords);
  if (sentenceExact) return sentenceExact;

  return alignBySentencesFuzzy(referenceText, engineWords);
}

function alignByParagraphs(referenceText, typingText, engineWords) {
  const refParas = splitParagraphs(referenceText);
  const typParas = splitParagraphs(typingText);
  if (refParas.length === 0 || typParas.length === 0) return null;
  if (refParas.length !== typParas.length) return null;

  const wordGroups = typParas.map((p) => p.split(/\s+/).filter(Boolean));
  const totalWords = wordGroups.reduce((s, g) => s + g.length, 0);
  // Sanity: if paragraph-split word count doesn't match engine's, bail out
  // so offsets stay consistent with the engine.
  if (totalWords !== engineWords.length) return null;

  let offset = 0;
  return refParas.map((reference, i) => {
    const group = wordGroups[i];
    const item = { reference, words: group, startIndex: offset };
    offset += group.length;
    return item;
  });
}

function alignBySentencesExact(referenceText, engineWords) {
  const refs = splitSentences(referenceText);
  const groups = groupWordsBySentence(engineWords);
  if (refs.length === 0 || groups.length === 0) return null;
  if (refs.length !== groups.length) return null;

  let offset = 0;
  return groups.map((groupWords, i) => {
    const item = { reference: refs[i], words: groupWords, startIndex: offset };
    offset += groupWords.length;
    return item;
  });
}

function alignBySentencesFuzzy(referenceText, engineWords) {
  const refs = splitSentences(referenceText);
  const groups = groupWordsBySentence(engineWords);
  if (refs.length === 0 || groups.length === 0) return null;

  const targetCount = Math.min(refs.length, groups.length);
  if (targetCount === 0) return null;

  const mergedRefs = mergeAdjacentByLength(refs, targetCount, (s) => s.length);
  const mergedGroups = mergeAdjacentByLength(
    groups,
    targetCount,
    (g) => g.join(' ').length
  );
  if (!mergedRefs || !mergedGroups) return null;

  let offset = 0;
  return mergedRefs.map((refChunk, i) => {
    const groupWords = mergedGroups[i].flat();
    const item = {
      reference: refChunk.join(' '),
      words: groupWords,
      startIndex: offset,
    };
    offset += groupWords.length;
    return item;
  });
}
