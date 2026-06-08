// Character normalization mappings
const characterMap = {
  // Smart quotes to straight quotes
  '\u2018': "'", // Left single quotation mark
  '\u2019': "'", // Right single quotation mark
  '\u201C': '"', // Left double quotation mark
  '\u201D': '"', // Right double quotation mark
  
  // Ellipsis
  '\u2026': '...', // Horizontal ellipsis
  
  // Dashes
  '\u2013': '-', // En dash
  '\u2014': '-', // Em dash
  
  // Other common replacements
  '\u00A0': ' ', // Non-breaking space to regular space
};

export function normalizeCharacter(char) {
  return characterMap[char] || char;
}

// NOTE: there is intentionally no `normalizeText` helper. Text passed to
// TypingEngine MUST stay un-normalized at the string level — the engine's
// word-splitting and position tracking depend on the raw character count, and
// some mappings (e.g. '…' -> '...') change length. Normalize per-character at
// compare time via charactersMatch instead.

// Check if two characters should be considered equal for typing
export function charactersMatch(typed, expected) {
  // Direct match
  if (typed === expected) return true;

  // Normalize BOTH sides so matching is symmetric: a user typing a straight
  // quote/dash/space against a curly/em/nbsp expected char matches, and vice
  // versa (e.g. typing a non-breaking space against a regular space).
  if (normalizeCharacter(typed) === normalizeCharacter(expected)) return true;

  // Allow typing a single period for an ellipsis char (one keystroke advances
  // past the whole '…'). Kept as an explicit branch because normalizeCharacter
  // expands '…' to the 3-char '...', which never equals a single typed char.
  if (expected === '…' && typed === '.') return true;

  return false;
}