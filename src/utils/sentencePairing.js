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
