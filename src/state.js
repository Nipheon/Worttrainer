import { CONSONANTS, CONSONANT_COMBOS, VOWELS, VOWEL_COMBOS, WORDS, playableWords } from './words.js';

export const TIMER_CHOICES = [0, 2, 3, 5, 7, 10];
export const DEFAULT_MINUTES = 5;
export const DEFAULT_KNOWN = ['a', 'e', 'i', 'o', 'u', 'd', 'l', 'm', 'n', 'r', 's', 't', 'ie', 'ei', 'au'];

const ALL_UNITS = new Set([...VOWELS, ...VOWEL_COMBOS, ...CONSONANTS, ...CONSONANT_COMBOS]);

export function restoreState(raw) {
  const state = { saved: false, known: new Set(DEFAULT_KNOWN), minutes: DEFAULT_MINUTES };
  let saved;
  try {
    saved = JSON.parse(raw);
  } catch {
    return state;
  }
  if (!saved || typeof saved !== 'object') return state;
  if (TIMER_CHOICES.includes(saved.minutes)) state.minutes = saved.minutes;
  if (!Array.isArray(saved.known)) return state;
  state.saved = true;
  state.known = new Set(saved.known.filter((unit) => typeof unit === 'string' && ALL_UNITS.has(unit)));
  return state;
}

export function describeSelection(known) {
  const units = [...known].sort((a, b) => a.localeCompare(b, 'de'));
  const count = playableWords(known).length;
  return `Bekannt: ${units.join(', ')} · ${count} von ${WORDS.length} Wörtern`;
}
