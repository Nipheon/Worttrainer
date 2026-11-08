import assert from 'node:assert/strict';
import { WORDS, nextWord, playableWords, units } from '../src/words.js';
import { DEFAULT_KNOWN } from '../src/state.js';

assert.ok(WORDS.length >= 100, 'at least 100 words');
assert.equal(new Set(WORDS.map((w) => w.toLowerCase())).size, WORDS.length, 'no duplicates');
for (const word of WORDS) {
  assert.ok(units(word), `${word} splits into known units`);
  assert.ok(word.length <= 6, `${word} is short`);
}

assert.deepEqual(units('Schule'), ['sch', 'u', 'l', 'e']);
assert.deepEqual(units('die'), ['d', 'ie']);
assert.deepEqual(units('auch'), ['au', 'ch']);
assert.deepEqual(units('Maus'), ['m', 'au', 's']);
assert.deepEqual(units('heute'), ['h', 'eu', 't', 'e']);
assert.equal(units('xyz'), null);

assert.deepEqual(playableWords(new Set(['m', 'a'])), ['am', 'Mama']);
assert.deepEqual(playableWords(new Set()), []);
assert.ok(playableWords(new Set(DEFAULT_KNOWN)).length >= 8, 'defaults give a playable pool');
assert.ok(playableWords(new Set(DEFAULT_KNOWN)).includes('Oma'));
for (const word of ['die', 'ein', 'nein', 'aus']) {
  assert.ok(playableWords(new Set(DEFAULT_KNOWN)).includes(word), `${word} is playable with the defaults`);
}

const pool = ['a', 'b', 'c'];
const seen = new Set();
const first = [nextWord(pool, seen), nextWord(pool, seen), nextWord(pool, seen)];
assert.equal(new Set(first).size, 3, 'no repeat until pool is used up');
assert.ok(pool.includes(nextWord(pool, seen)), 'pool resets after exhaustion');
assert.equal(nextWord([], new Set()), null, 'empty pool gives null');
assert.equal(nextWord(['x'], new Set(['x'])), 'x', 'single word repeats instead of failing');

console.log('words tests passed');
