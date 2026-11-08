export const VOWELS = ['a', 'e', 'i', 'o', 'u', 'ä', 'ö', 'ü'];
export const VOWEL_COMBOS = ['ei', 'au', 'eu', 'äu', 'ie'];
export const CONSONANTS = [
  'b', 'd', 'f', 'g', 'h', 'j', 'k', 'l', 'm', 'n', 'p', 'r', 's', 't', 'v', 'w', 'z',
];
export const CONSONANT_COMBOS = ['ch', 'sch', 'st', 'sp'];

export const WORDS = [
  // Artikel und Fürwörter
  'der', 'die', 'das', 'ein', 'eine', 'ich', 'du', 'er', 'sie', 'es', 'wir', 'ihr', 'mein', 'dein', 'mich', 'mir', 'dir',
  // Tunwörter
  'ist', 'bin', 'sind', 'hat', 'habe', 'war', 'kann', 'will', 'mag', 'geht', 'sagt', 'macht', 'kommt', 'sieht',
  'spielt', 'ruft', 'lacht', 'malt',
  // Kleine Wörter
  'und', 'oder', 'aber', 'auch', 'nicht', 'nein', 'ja', 'mit', 'von', 'zu', 'in', 'im', 'an', 'am', 'auf', 'aus',
  'bei', 'um', 'so', 'da', 'hier', 'dort', 'wo', 'was', 'wer', 'wie', 'noch', 'nur', 'schon', 'dann', 'jetzt',
  'heute', 'gern', 'sehr', 'viel', 'alle', 'alles', 'immer', 'wieder', 'mal',
  // Namenwörter
  'Mama', 'Papa', 'Oma', 'Opa', 'Kind', 'Hund', 'Katze', 'Haus', 'Ball', 'Auto', 'Baum', 'Schule', 'Tag', 'Sonne',
  'Mond', 'Maus',
  // Wiewörter
  'gut', 'klein', 'rot', 'neu', 'alt', 'lieb', 'toll', 'schön', 'lang',
  // Weitere häufige Wörter (Liste der 100 häufigsten Wörter, Grundwortschatz Baden-Württemberg)
  'ab', 'allein', 'als', 'also', 'bald', 'beide', 'beim', 'bis', 'bist', 'dem', 'den', 'denn', 'dich', 'dies', 'doch',
  'darf', 'durch', 'einige', 'einmal', 'etwas', 'euch', 'euer', 'eure', 'für', 'ganz', 'gegen', 'haben', 'hast',
  'hatte', 'ihm', 'ihn', 'ins', 'jede', 'kein', 'können', 'kannst', 'konnte', 'man', 'manch', 'mehr', 'mögen',
  'magst', 'mochte', 'müssen', 'muss', 'musst', 'nach', 'neben', 'nichts', 'nie', 'nun', 'ob', 'oft', 'ohne', 'sein',
  'seid', 'seit', 'sich', 'sogar', 'solch', 'sollen', 'soll', 'über', 'uns', 'unter', 'vom', 'vor', 'wann', 'waren',
  'warum', 'weg', 'wegen', 'weil', 'welche', 'wem', 'wen', 'wenig', 'wenn', 'werden', 'werde', 'wirst', 'wird',
  'wurde', 'wohl', 'wollen', 'willst', 'wollte', 'zum', 'zur', 'zwar',
];

const UNITS = [...VOWELS, ...VOWEL_COMBOS, ...CONSONANTS, ...CONSONANT_COMBOS].sort((a, b) => b.length - a.length);

export function units(word) {
  const lower = word.toLowerCase();
  const result = [];
  let i = 0;
  while (i < lower.length) {
    const unit = UNITS.find((u) => lower.startsWith(u, i));
    if (!unit) return null;
    result.push(unit);
    i += unit.length;
  }
  return result;
}

export function playableWords(known, words = WORDS) {
  return words.filter((word) => {
    const parts = units(word);
    return parts !== null && parts.every((u) => known.has(u));
  });
}

export function nextWord(pool, seen, rng = Math.random) {
  if (pool.length === 0) return null;
  let fresh = pool.filter((word) => !seen.has(word));
  if (fresh.length === 0) {
    seen.clear();
    fresh = pool;
  }
  const word = fresh[Math.floor(rng() * fresh.length)];
  seen.add(word);
  return word;
}
