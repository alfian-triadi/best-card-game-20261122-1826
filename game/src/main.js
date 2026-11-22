// Ember & Tide — controller: wires the engine, the renderer and input together,
// runs the turn flow (your move, battle, Sable's move) and stages screenshot
// scenes when the page is opened with ?shot=title|play|win|loss.
import { createGame, endTurn, isOver, playCard } from './engine.js';
import { greedyMove } from './ai.js';
import { bindInput, handCardAction } from './input.js';
import { floatText, lifePosition, render, showEnd, showTitle } from './render.js';
import { sfx, setMuted, isMuted } from './sound.js';
import { stageShot } from './shots.js';

const $ = (id) => document.getElementById(id);
const sleep = (ms) => new Promise((resolve) => window.setTimeout(resolve, ms));

let game = null;
let screen = 'title'; // 'title' | 'play' | 'over'
let busy = false;
const ui = { selected: null, targeting: null };
let seed = 7;

const params = new URLSearchParams(window.location.search);
if (params.has('seed')) seed = Number(params.get('seed')) || 7;

function paint() {
  render(game, ui, {
    onHandCard: (index) => handleHandCard(index),
    onTarget: (target) => handleTarget(target),
  });
}

function clearSelection() {
  ui.selected = null;
  ui.targeting = null;
}

function finishGame() {
  screen = 'over';
  paint();
  showEnd(game);
  if (game.winner === 'you') sfx.win();
  else sfx.lose();
}

function startGame() {
  seed = params.has('seed') ? seed : Math.floor(Math.random() * 100000) + 1;
  game = createGame(seed);
  screen = 'play';
  clearSelection();
  $('title-screen').classList.add('hidden');
  $('end-screen').classList.add('hidden');
  paint();
  sfx.turn();
}

function handleHandCard(index) {
  if (screen !== 'play' || busy || game.active !== 'you' || game.phase !== 'play') return;
  const action = handCardAction(game, ui, index);
  if (action.action === 'select') {
    ui.selected = action.index;
    ui.targeting = null;
    sfx.click();
  } else if (action.action === 'cancel-targeting') {
    clearSelection();
  } else if (action.action === 'arm-bolt') {
    ui.targeting = 'bolt';
    sfx.click();
  } else if (action.action === 'play') {
    const result = playCard(game, 'you', action.index);
    if (result.ok) {
      const card = result.played;
      if (card.kind === 'mend') sfx.heal();
      else if (card.kind === 'draw') sfx.draw();
      else sfx.playCard();
      clearSelection();
      if (isOver(game)) finishGame();
    }
  }
  paint();
}

function handleTarget(target) {
  if (screen !== 'play' || busy || ui.targeting !== 'bolt' || ui.selected === null) return;
  const result = playCard(game, 'you', ui.selected, target);
  if (result.ok) {
    sfx.playCard();
    clearSelection();
    if (isOver(game)) finishGame();
  }
  paint();
}

function handleLifeTarget(who) {
  if (ui.targeting === 'bolt') handleTarget({ who, side: 'life' });
}

/** Replay a battle's strikes on screen: flash the target, float the damage. */
async function animateStrikes(strikes, attackerSide) {
  for (const strike of strikes) {
    const defenderSide = attackerSide === 'you' ? 'foe' : 'you';
    if (strike.to.side === 'life') {
      const pos = lifePosition(defenderSide);
      floatText(pos.x, pos.y, `-${strike.damage}`);
      sfx.hurt();
    } else {
      const field = $(strike.to.who === 'foe' ? 'foe-field' : 'you-field');
      const slotEl = field.children[strike.to.slot];
      if (slotEl) {
        slotEl.classList.add('hit');
        const rect = slotEl.getBoundingClientRect();
        floatText(rect.left + rect.width / 2 - 12, rect.top + 8, `-${strike.damage}`);
        window.setTimeout(() => slotEl.classList.remove('hit'), 320);
      }
      sfx.attack();
    }
    paint();
    await sleep(300);
  }
}

async function aiTurn() {
  // Sable plays one card at a time so the table can be followed.
  let guard = 0;
  while (guard < 12) {
    guard += 1;
    const before = game.foe.hand.length;
    const moved = greedyMove(game, 'foe');
    if (!moved) break;
    if (game.foe.hand.length < before) sfx.playCard();
    paint();
    await sleep(550);
    if (isOver(game)) return;
  }
  const result = endTurn(game);
  paint();
  await animateStrikes(result.strikes ?? [], 'foe');
}

async function playerEndTurn() {
  if (screen !== 'play' || busy || game.active !== 'you' || game.phase !== 'play') return;
  busy = true;
  clearSelection();
  const result = endTurn(game);
  paint();
  await animateStrikes(result.strikes ?? [], 'you');
  if (isOver(game)) {
    finishGame();
    busy = false;
    return;
  }
  await sleep(400);
  await aiTurn();
  if (isOver(game)) {
    finishGame();
    busy = false;
    return;
  }
  paint();
  sfx.turn();
  busy = false;
}

bindInput({
  onStart: () => {
    if (screen === 'title' || screen === 'over') startGame();
  },
  onEndTurn: () => void playerEndTurn(),
  onHandCard: (index) => handleHandCard(index),
  onLifeTarget: (who) => handleLifeTarget(who),
  onCancel: () => {
    clearSelection();
    paint();
  },
  onConfirm: () => {
    if (screen === 'title' || screen === 'over') startGame();
    else void playerEndTurn();
  },
  onMute: () => {
    setMuted(!isMuted());
    $('mute-btn').textContent = isMuted() ? '♪ Muted' : '♪ Sound on';
  },
});

// Boot: a screenshot scene stages a fixed position; otherwise the title screen.
const shot = params.get('shot');
if (shot) {
  const staged = stageShot(shot, seed);
  game = staged.game;
  screen = staged.screen;
  if (screen === 'title') showTitle();
  else if (screen === 'over') {
    showEnd(game);
  } else {
    $('title-screen').classList.add('hidden');
    $('end-screen').classList.add('hidden');
  }
  paint();
} else {
  game = createGame(seed);
  screen = 'title';
  showTitle();
  paint();
}

// Test hook: the play-test reads state through here, never through the DOM alone.
window.__game = {
  get game() { return game; },
  get screen() { return screen; },
  get seed() { return seed; },
  get busy() { return busy; },
  get selected() { return ui.selected; },
  get targeting() { return ui.targeting; },
  start: startGame,
};
