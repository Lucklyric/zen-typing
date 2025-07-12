#!/usr/bin/env node

/**
 * Convert CMU IPA dictionary from TSV format to JavaScript format
 * Input: cmudict-0.7b-ipa.txt (tab-separated: WORD\tIPA)
 * Output: src/data/cmuIpaDict.js (JavaScript object)
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const INPUT_FILE = path.join(__dirname, '..', 'cmudict-0.7b-ipa.txt');
const OUTPUT_FILE = path.join(__dirname, '..', 'src', 'data', 'cmuIpaDict.js');

function parseCmuDict() {
  console.log('Reading CMU IPA dictionary...');
  const content = fs.readFileSync(INPUT_FILE, 'utf-8');
  const lines = content.split('\n').filter(line => line.trim());
  
  const dict = {};
  let processed = 0;
  let skipped = 0;
  
  for (const line of lines) {
    const [word, ipa] = line.split('\t');
    
    if (!word || !ipa) {
      skipped++;
      continue;
    }
    
    // Convert to lowercase for consistency
    const normalizedWord = word.toLowerCase();
    
    // Skip words with special characters (punctuation marks, etc.)
    if (normalizedWord.includes('"') || normalizedWord.includes('!') || 
        normalizedWord.includes('#') || normalizedWord.includes('%') ||
        normalizedWord.includes('&') || normalizedWord.includes("'")) {
      skipped++;
      continue;
    }
    
    // Handle multiple pronunciations (separated by commas)
    const pronunciations = ipa.split(', ').map(p => p.trim());
    
    // Store the first (most common) pronunciation
    dict[normalizedWord] = pronunciations[0];
    
    processed++;
  }
  
  console.log(`Processed: ${processed} words`);
  console.log(`Skipped: ${skipped} entries`);
  console.log(`Total words in dictionary: ${Object.keys(dict).length}`);
  
  return dict;
}

function generateJavaScript(dict) {
  console.log('Generating JavaScript file...');
  
  const header = `// CMU Pronouncing Dictionary in IPA format
// Generated from CMU Dictionary version 0.7b
// Source: https://github.com/menelik3/cmudict-ipa
// License: MIT
// Contains ${Object.keys(dict).length} American English word pronunciations

export const cmuIpaDict = `;

  const footer = `;

// Function to get IPA pronunciation for a word
export function getIPA(word) {
  if (!word) return null;
  const normalized = word.toLowerCase().replace(/[.,!?;:'"]/g, '');
  return cmuIpaDict[normalized] || null;
}

// Get dictionary size
export function getDictSize() {
  return Object.keys(cmuIpaDict).length;
}
`;

  const dictString = JSON.stringify(dict, null, 2);
  return header + dictString + footer;
}

function main() {
  try {
    // Ensure output directory exists
    const outputDir = path.dirname(OUTPUT_FILE);
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }
    
    // Parse dictionary
    const dict = parseCmuDict();
    
    // Generate JavaScript
    const jsContent = generateJavaScript(dict);
    
    // Write to file
    fs.writeFileSync(OUTPUT_FILE, jsContent, 'utf-8');
    
    console.log(`✅ Dictionary successfully generated: ${OUTPUT_FILE}`);
    console.log(`📊 File size: ${(fs.statSync(OUTPUT_FILE).size / 1024 / 1024).toFixed(2)} MB`);
    
    // Test a few words
    console.log('\n🧪 Testing some words:');
    const testWords = ['the', 'this', 'one', 'from', 'when', 'hello', 'world'];
    for (const word of testWords) {
      console.log(`  ${word} → ${dict[word] || 'NOT FOUND'}`);
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

main();