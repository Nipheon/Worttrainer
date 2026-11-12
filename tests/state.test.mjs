import assert from 'node:assert/strict';
import { DEFAULT_KNOWN, describeSelection, restoreState } from '../src/state.js';
import { WORDS } from '../src/words.js';

const empty = restoreState(null);
assert.equal(empty.saved, false);
assert.deepEqual([...empty.known].sort(), [...DEFAULT_KNOWN].sort());

assert.equal(restoreState('not json').saved, false);
assert.equal(restoreState('42').saved, false);
assert.equal(restoreState('null').known.size, DEFAULT_KNOWN.length);
assert.equal(restoreState(JSON.stringify({ known: 'ab' })).saved, false, 'known must be a list');

const good = restoreState(JSON.stringify({ known: ['a', 'm', 'sch'] }));
assert.equal(good.saved, true);
assert.deepEqual([...good.known].sort(), ['a', 'm', 'sch']);

const dirty = restoreState(JSON.stringify({ known: [1, null, 'xyz', 'a', {}, 'ei'] }));
assert.deepEqual([...dirty.known].sort(), ['a', 'ei'], 'only known units survive');

assert.equal(restoreState(JSON.stringify({ known: [] })).known.size, 0, 'saved empty selection is kept');

assert.equal(describeSelection(new Set(['m', 'a'])), `Bekannt: a, m · 2 von ${WORDS.length} Wörtern`);

assert.equal(empty.minutes, 5, 'timer defaults to 5 minutes');
for (const minutes of [0, 2, 3, 5, 7, 10]) {
  assert.equal(restoreState(JSON.stringify({ known: ['a'], minutes })).minutes, minutes);
}
assert.equal(restoreState(JSON.stringify({ known: ['a'], minutes: 4 })).minutes, 5, 'unknown minutes fall back');
assert.equal(restoreState(JSON.stringify({ known: ['a'], minutes: '3' })).minutes, 5, 'non-number minutes fall back');
assert.equal(restoreState(JSON.stringify({ known: ['a'] })).minutes, 5, 'old saved config gets the default timer');
assert.equal(restoreState(JSON.stringify({ minutes: 7 })).minutes, 7, 'minutes are kept even without a known list');
assert.equal(restoreState(JSON.stringify({ minutes: 7 })).saved, false, 'minutes alone is not a saved configuration');

console.log('state tests passed');
