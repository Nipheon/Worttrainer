import { CONSONANTS, CONSONANT_COMBOS, VOWELS, VOWEL_COMBOS, WORDS, playableWords } from './words.js';

export const DEFAULT_KNOWN = ['a', 'e', 'i', 'o', 'u', 'd', 'l', 'm', 'n', 'r', 's', 't'];

const ALL_UNITS = new Set([...VOWELS, ...VOWEL_COMBOS, ...CONSONANTS, ...CONSONANT_COMBOS]);

export function restoreState(raw) {
  const state = { saved: false, known: new Set(DEFAULT_KNOWN) };
  let saved;
  try {
    saved = JSON.parse(raw);
  } catch {
    return state;
  }
  if (!saved || typeof saved !== 'object' || !Array.isArray(saved.known)) return state;
  state.saved = true;
  state.known = new Set(saved.known.filter((unit) => typeof unit === 'string' && ALL_UNITS.has(unit)));
  return state;
}

export function describeSelection(known) {
  const units = [...known].sort((a, b) => a.localeCompare(b, 'de'));
  const count = playableWords(known).length;
  return `Bekannt: ${units.join(', ')} · ${count} von ${WORDS.length} Wörtern`;
}
