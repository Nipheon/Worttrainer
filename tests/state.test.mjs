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

console.log('state tests passed');
