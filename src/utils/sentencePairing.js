/**
 * Sentence pairing for Reference Mode
 *
 * Splits reference and typing texts into sentences on CJK + Western
 * terminal punctuation, then zips them into aligned pairs so the UI
 * can render each reference sentence directly above its typing target
 * (similar to how IPA sits above each word).
 */

const SENTENCE_SPLIT_REGEX = /([^。！？.!?]*[。！？.!?]+|[^。！？.!?]+$)/g;

// Capitalized abbreviations whose trailing period is part of the token, not a
// sentence boundary. Kept case-sensitive so common lowercase words ("no.",
// "co.") at a real sentence end are NOT mistaken for abbreviations.
const ABBREVIATIONS = [
  'Mr', 'Mrs', 'Ms', 'Messrs', 'Dr', 'Prof', 'Sr', 'Jr', 'St', 'Capt', 'Gen',
  'Sen', 'Gov', 'Rev', 'Lt', 'Col', 'Mt', 'Inc', 'Ltd', 'Corp', 'Jan', 'Feb',
  'Mar', 'Apr', 'Jun', 'Jul', 'Aug', 'Sep', 'Sept', 'Oct', 'Nov', 'Dec',
];
const ABBREV_RE = new RegExp(`^(?:${ABBREVIATIONS.join('|')})\\.$`);
// Dotted initialisms / Latin abbreviations: U.S., U.S.A., e.g., i.e., a.m., p.m.
const INITIALISM_RE = /^(?:[A-Za-z]\.){2,}$/;
const TERMINAL_PUNCT_REGEX = /[。！？.!?]+$/;

// Spans whose internal . ! ? must be masked before sentence splitting so the
// splitter doesn't break inside URLs, emails, decimals, initialisms, or
// abbreviations. Case-sensitive (abbreviations are capitalized; URLs/emails
// are lowercase) to avoid masking lowercase sentence-final words.
const PROTECT_RE = new RegExp(
  [
    'https?:\\/\\/[^\\s]+', // URLs
    '[^\\s@]+@[^\\s@]+\\.[^\\s@]+', // emails
    '\\bwww\\.[^\\s]+', // www domains
    '\\d+(?:\\.\\d+)+', // decimals / versions (3.14, 1.2.3, v1.2.3)
    '(?:[A-Za-z]\\.){2,}', // U.S., e.g., a.m.
    `\\b(?:${ABBREVIATIONS.join('|')})\\.`, // Mr. Dr. Inc. ...
  ].join('|'),
  'g'
);
// Private-use sentinels (U+E000..E002) — never appear in real text — used to
// mask protected punctuation across the split, then restored afterward.
const MASK_DOT = String.fromCharCode(0xE000);
const MASK_BANG = String.fromCharCode(0xE001);
const MASK_Q = String.fromCharCode(0xE002);
const UNMASK_RE = /[]/g;
const UNMASK_MAP = { [MASK_DOT]: '.', [MASK_BANG]: '!', [MASK_Q]: '?' };

function maskProtected(text) {
  return text.replace(PROTECT_RE, (m) =>
    m.replace(/\./g, MASK_DOT).replace(/!/g, MASK_BANG).replace(/\?/g, MASK_Q)
  );
}
function unmaskProtected(text) {
  return text.replace(UNMASK_RE, (c) => UNMASK_MAP[c]);
}

// Whether a word token genuinely ends a sentence — false for abbreviations,
// decimals, and dotted initialisms whose trailing period is internal. Shared by
// groupWordsBySentence so the word-side boundaries stay consistent with the
// char-level splitSentences boundaries (otherwise the two desync and produce
// silently misaligned reference groups).
function endsSentence(token) {
  if (!TERMINAL_PUNCT_REGEX.test(token)) return false; // no terminal punct
  if (ABBREV_RE.test(token)) return false; // "Mr." "Dr."
  if (INITIALISM_RE.test(token)) return false; // "U.S." "e.g."
  return true;
}

export function splitSentences(text) {
  if (typeof text !== 'string' || text.length === 0) return [];
  const matches = maskProtected(text).match(SENTENCE_SPLIT_REGEX) || [];
  return matches
    .map((s) => unmaskProtected(s).trim())
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

/**
 * Group a flat word list into sentence-sized buckets, splitting at any word
 * that genuinely ends a sentence. Uses the same endsSentence() predicate as the
 * char-level splitSentences so the two stay aligned (abbreviations, decimals,
 * and initialisms don't create spurious boundaries on one side only).
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
    if (endsSentence(word)) {
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
  const sentenceExact = alignBySentencesExact(referenceText, engineWords);

  // When both strict strategies succeed, prefer whichever gives finer
  // alignment (more groups). Paragraph wins only when sentence-strict fails
  // — e.g. translation merges or splits sentences unevenly within paragraphs.
  if (paragraph && sentenceExact) {
    return sentenceExact.length >= paragraph.length ? sentenceExact : paragraph;
  }
  if (paragraph) return paragraph;
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
