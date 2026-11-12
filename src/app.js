import {
  CONSONANTS,
  CONSONANT_COMBOS,
  VOWELS,
  VOWEL_COMBOS,
  WORDS,
  nextWord,
  playableWords,
} from './words.js';
import { TIMER_CHOICES, describeSelection, restoreState } from './state.js';

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
const CLOCK_TICK_MS = 250;
const NO_WORDS_ERROR = 'Mit diesen Buchstaben passt noch kein Wort. Wähle weitere Buchstaben.';

let known = new Set();
let minutes = 5;
let spinning = false;
let timers = [];
// Timed session: 'off' (no timer), 'ready' (clock not started), 'running', 'over' (time up, last word on screen), 'done' (summary).
let phase = 'off';
let rounds = 0;
let endsAt = 0;
let clockId = null;
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
  minutes = state.minutes;
  return state.saved;
}

function save() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ known: [...known], minutes }));
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

function buildSegments(container, choices, getValue, setValue, label = String) {
  const refresh = () => {
    container.querySelectorAll('.segment').forEach((button) => {
      const checked = Number(button.dataset.value) === getValue();
      button.setAttribute('aria-checked', String(checked));
      button.tabIndex = checked ? 0 : -1;
    });
  };
  const select = (n, { focus = false } = {}) => {
    setValue(n);
    refresh();
    if (focus) container.querySelector('.segment[tabindex="0"]').focus();
  };
  for (const n of choices) {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'segment';
    button.textContent = label(n);
    button.dataset.value = String(n);
    button.setAttribute('role', 'radio');
    button.addEventListener('click', () => select(n));
    button.addEventListener('keydown', (event) => {
      const step = { ArrowRight: 1, ArrowDown: 1, ArrowLeft: -1, ArrowUp: -1 }[event.key];
      if (!step) return;
      event.preventDefault();
      const next = (choices.indexOf(n) + step + choices.length) % choices.length;
      select(choices[next], { focus: true });
    });
    container.append(button);
  }
  refresh();
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

function formatClock(ms) {
  const seconds = Math.ceil(Math.max(0, ms) / 1000);
  return `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, '0')}`;
}

function wordsText(n) {
  return `${n} ${n === 1 ? 'Wort' : 'Wörter'}`;
}

function renderClock(ms) {
  $('#clock').textContent = formatClock(ms);
}

function renderCount() {
  // The word on screen is still being read, so it only counts once the next one starts.
  $('#read-count').textContent = wordsText(Math.max(0, rounds - 1));
}

function stopClock() {
  clearInterval(clockId);
  clockId = null;
}

function resetSession() {
  cancelSpin();
  stopClock();
  phase = minutes ? 'ready' : 'off';
  rounds = 0;
  $('#done').hidden = true;
  $('#reels').hidden = false;
  $('#reels').replaceChildren();
  $('#result').textContent = '';
  $('#start').hidden = false;
  $('#start').textContent = 'START';
  $('#prompt').hidden = false;
  $('#prompt').textContent = minutes ? 'Drücke START. Dann läuft die Zeit.' : 'Drücke START und lies das Wort.';
  $('#timer-bar').hidden = !minutes;
  if (minutes) {
    renderClock(minutes * 60000);
    renderCount();
  }
}

function startClock() {
  phase = 'running';
  endsAt = Date.now() + minutes * 60000;
  clockId = setInterval(tick, CLOCK_TICK_MS);
  tick();
}

function tick() {
  const left = endsAt - Date.now();
  renderClock(left);
  if (left <= 0) timeOver();
}

function timeOver() {
  stopClock();
  phase = 'over';
  if (!spinning) {
    showOver();
    announce('Die Zeit ist um.');
  }
}

function showOver() {
  $('#start').textContent = 'Fertig';
  $('#prompt').textContent = 'Die Zeit ist um. Lies das letzte Wort.';
}

function showResult() {
  phase = 'done';
  $('#reels').hidden = true;
  $('#start').hidden = true;
  $('#prompt').hidden = true;
  $('#timer-bar').hidden = true;
  $('#done-count').textContent = `${wordsText(rounds)} gelesen`;
  $('#done').hidden = false;
  announce(`Geschafft! ${wordsText(rounds)} gelesen`);
  $('#done-title').focus();
}

function onStart() {
  if (spinning) return;
  if (phase === 'running') tick();
  if (phase === 'over') {
    showResult();
    return;
  }
  if (phase === 'done') return;
  if (phase === 'ready') startClock();
  spin();
}

function spin(animate = true) {
  if (spinning) return;
  const pool = playableWords(known);
  const word = nextWord(pool, seen);
  if (!word) return;
  if (phase === 'running') {
    rounds += 1;
    renderCount();
  }

  const span = showWord(word);
  const prompt = $('#prompt');
  const finish = () => {
    cancelSpin();
    span.classList.remove('spinning');
    span.textContent = word;
    fitReels();
    announce(phase === 'over' ? `${word}. Die Zeit ist um.` : word);
    prompt.textContent = 'Lies das Wort. Bereit für das nächste?';
    if (phase === 'over') showOver();
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
  resetSession();
  if (!minutes) spin(false);
  $('#start').focus();
}

function showSetup() {
  cancelSpin();
  stopClock();
  phase = 'off';
  $('#play').hidden = true;
  $('#setup').hidden = false;
  $('#setup h1').focus();
}

function init() {
  $('#load-error').hidden = true;
  const hasSavedConfig = load();
  buildTiles();
  buildSegments($('#minutes'), TIMER_CHOICES, () => minutes, (n) => (minutes = n), (n) => (n === 0 ? 'aus' : String(n)));
  refreshCount();
  $('#go').addEventListener('click', showPlay);
  $('#start').addEventListener('click', onStart);
  $('#again').addEventListener('click', () => {
    resetSession();
    $('#start').focus();
  });
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
