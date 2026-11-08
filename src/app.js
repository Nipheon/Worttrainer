import {
  CONSONANTS,
  CONSONANT_COMBOS,
  VOWELS,
  VOWEL_COMBOS,
  WORDS,
  nextWord,
  playableWords,
} from './words.js';
import { describeSelection, restoreState } from './state.js';

const STORAGE_KEY = 'worttrainer.v1';
const GROUPS = {
  vowels: VOWELS,
  vowelCombos: VOWEL_COMBOS,
  consonants: CONSONANTS,
  consonantCombos: CONSONANT_COMBOS,
};
const SPIN_MS = 600;
const TICK_MS = 70;
const ANNOUNCE_DELAY_MS = 60;
const NO_WORDS_ERROR = 'Mit diesen Buchstaben passt noch kein Wort. Wähle weitere Buchstaben.';

let known = new Set();
let spinning = false;
let timers = [];
const seen = new Set();

const $ = (selector) => document.querySelector(selector);
const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

function load() {
  let raw = null;
  try {
    raw = localStorage.getItem(STORAGE_KEY);
  } catch {
    // storage unavailable
  }
  const state = restoreState(raw);
  known = state.known;
  return state.saved;
}

function save() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ known: [...known] }));
  } catch {
    // storage unavailable
  }
}

function announce(text) {
  const result = $('#result');
  result.textContent = '';
  setTimeout(() => {
    result.textContent = text;
  }, ANNOUNCE_DELAY_MS);
}

function refreshCount() {
  const count = playableWords(known).length;
  $('#count').textContent = `Damit passen ${count} von ${WORDS.length} Wörtern.`;
}

function showSetupError() {
  const error = $('#setup-error');
  error.hidden = false;
  error.textContent = '';
  setTimeout(() => {
    error.textContent = NO_WORDS_ERROR;
  }, ANNOUNCE_DELAY_MS);
}

function buildTiles() {
  for (const [group, units] of Object.entries(GROUPS)) {
    const container = $(`[data-group="${group}"]`);
    for (const unit of units) {
      const tile = document.createElement('button');
      tile.type = 'button';
      tile.className = 'tile';
      tile.textContent = unit;
      tile.setAttribute('aria-pressed', String(known.has(unit)));
      tile.addEventListener('click', () => {
        if (known.has(unit)) known.delete(unit);
        else known.add(unit);
        tile.setAttribute('aria-pressed', String(known.has(unit)));
        $('#setup-error').hidden = true;
        refreshCount();
      });
      container.append(tile);
    }
  }
}

const FIT_MAX_REM = 6;
const FIT_MIN_REM = 1;
const FIT_MARGIN = 0.98;
const FIT_PASSES = 5;

function fitReels() {
  const field = $('#reels');
  const spans = [...field.children];
  if (spans.length === 0) return;
  const style = getComputedStyle(field);
  const avail = field.clientWidth - parseFloat(style.paddingLeft) - parseFloat(style.paddingRight);
  if (avail <= 0) return;
  const rem = parseFloat(getComputedStyle(document.documentElement).fontSize);
  const measure = () => spans.reduce((sum, span) => sum + span.getBoundingClientRect().width, 0);
  let size = FIT_MAX_REM * rem;
  field.style.setProperty('--syllable-size', `${size}px`);
  // Glyph widths are not always linear in font size (hinting), so measure again after resizing.
  for (let pass = 0; pass < FIT_PASSES; pass += 1) {
    const textWidth = measure();
    if (textWidth <= avail) break;
    size = Math.max(FIT_MIN_REM * rem, (size * avail * FIT_MARGIN) / textWidth);
    field.style.setProperty('--syllable-size', `${size}px`);
  }
}

function showWord(text) {
  const span = document.createElement('span');
  span.className = 'syllable';
  span.textContent = text;
  $('#reels').replaceChildren(span);
  fitReels();
  return span;
}

function cancelSpin() {
  timers.forEach(({ id, repeating }) => (repeating ? clearInterval(id) : clearTimeout(id)));
  timers = [];
  spinning = false;
  $('#start').removeAttribute('aria-disabled');
}

function spin(animate = true) {
  if (spinning) return;
  const pool = playableWords(known);
  const word = nextWord(pool, seen);
  if (!word) return;

  const span = showWord(word);
  const prompt = $('#prompt');
  const finish = () => {
    cancelSpin();
    span.classList.remove('spinning');
    span.textContent = word;
    fitReels();
    announce(word);
    prompt.textContent = 'Lies das Wort. Bereit für das nächste?';
  };

  if (reducedMotion || !animate) {
    finish();
    return;
  }

  spinning = true;
  $('#start').setAttribute('aria-disabled', 'true');
  prompt.textContent = 'Die Walze dreht sich …';
  span.classList.add('spinning');
  const randomWord = () => WORDS[Math.floor(Math.random() * WORDS.length)];
  span.textContent = randomWord();
  fitReels();
  timers.push({
    repeating: true,
    id: setInterval(() => {
      span.textContent = randomWord();
      fitReels();
    }, TICK_MS),
  });
  timers.push({ repeating: false, id: setTimeout(finish, SPIN_MS) });
}

function showPlay() {
  if (playableWords(known).length === 0) {
    showSetupError();
    return;
  }
  save();
  cancelSpin();
  $('#setup').hidden = true;
  $('#play').hidden = false;
  $('#summary').textContent = describeSelection(known);
  spin(false);
  $('#start').focus();
}

function showSetup() {
  cancelSpin();
  $('#play').hidden = true;
  $('#setup').hidden = false;
  $('#setup h1').focus();
}

function init() {
  $('#load-error').hidden = true;
  const hasSavedConfig = load();
  buildTiles();
  refreshCount();
  $('#go').addEventListener('click', showPlay);
  $('#start').addEventListener('click', () => spin());
  $('#back').addEventListener('click', showSetup);
  let reelsWidth = 0;
  new ResizeObserver(() => {
    const width = $('#reels').clientWidth;
    if (width === reelsWidth || spinning) return;
    reelsWidth = width;
    fitReels();
  }).observe($('#reels'));
  document.fonts.addEventListener('loadingdone', fitReels);
  if (hasSavedConfig && playableWords(known).length > 0) showPlay();
  else $('#setup').hidden = false;
}

init();
