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

export function normalizeText(text) {
  return text.split('').map(normalizeCharacter).join('');
}

// Check if two characters should be considered equal for typing
export function charactersMatch(typed, expected) {
  // Direct match
  if (typed === expected) return true;
  
  // Check if typed character matches normalized version
  if (typed === normalizeCharacter(expected)) return true;
  
  // Allow typing period for ellipsis (will need special handling in the engine)
  if (expected === '…' && typed === '.') return true;
  
  return false;
}