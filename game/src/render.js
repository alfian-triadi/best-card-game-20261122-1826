// DOM rendering for Ember & Tide: builds card elements and paints the table from
// the engine state. Rendering never mutates game rules; it only shows them.
import { ELEMENTS, MAX_FIELD } from './config.js';

const $ = (id) => document.getElementById(id);

/** A card's DOM element. `where` is 'hand' or 'field'; `opts` adds classes/state. */
export function cardElement(card, where, opts = {}) {
  const el = ELEMENTS[card.element];
  const div = document.createElement('div');
  div.className = `card ${where === 'field' ? 'on-field' : ''} ${opts.extraClass ?? ''}`.trim();
  div.style.setProperty('--el', el.color);
  div.style.setProperty('--el-dark', el.dark);
  div.style.setProperty('--el-light', el.light);
  div.dataset.uid = String(card.uid);
  div.dataset.defId = card.defId;
  const stats = card.kind === 'creature'
    ? `<div class="stats"><span class="atk">⚔ ${card.attack}</span><span class="hp">♥ ${card.health}</span></div>`
    : `<div class="effect">${card.effect}</div>`;
  div.innerHTML = `
    <div class="cost">${card.cost}</div>
    <div class="elem" title="${el.name}">${el.symbol}</div>
    <div class="art">${el.symbol}</div>
    <div class="name">${card.name}</div>
    <div class="text">${card.text}</div>
    ${stats}`;
  if (opts.onClick) div.addEventListener('click', (event) => opts.onClick(event, card));
  return div;
}

function cardBack(mini = false) {
  const div = document.createElement('div');
  div.className = `card-back${mini ? ' mini' : ''}`;
  div.textContent = '✦';
  return div;
}

function paintField(container, field, opts) {
  container.innerHTML = '';
  for (let slot = 0; slot < MAX_FIELD; slot += 1) {
    const creature = field[slot];
    if (creature) {
      const el = cardElement(creature, 'field', {
        onClick: opts.onFieldClick ? (event) => opts.onFieldClick(event, slot) : undefined,
      });
      if (opts.targetable?.(slot)) el.classList.add('targetable');
      container.appendChild(el);
    } else {
      const empty = document.createElement('div');
      empty.className = 'slot';
      if (opts.targetable?.(slot)) empty.classList.add('targetable');
      empty.textContent = '— empty —';
      if (opts.onEmptyClick) empty.addEventListener('click', () => opts.onEmptyClick(slot));
      container.appendChild(empty);
    }
  }
}

function paintLife(element, life) {
  element.querySelector('.num').textContent = String(life);
  element.classList.toggle('low', life <= 10);
}

function paintMana(container, mana, maxMana) {
  container.innerHTML = '';
  const label = document.createElement('span');
  label.textContent = 'Mana ';
  container.appendChild(label);
  for (let i = 0; i < maxMana; i += 1) {
    const pip = document.createElement('span');
    pip.className = `mana-pip${i < mana ? '' : ' spent'}`;
    container.appendChild(pip);
  }
  const num = document.createElement('span');
  num.textContent = ` ${mana}/${maxMana}`;
  container.appendChild(num);
}

/**
 * Paint the whole table from `game` plus the UI's transient state:
 * ui.selected (hand index or null), ui.targeting ('bolt' when a bolt is armed).
 */
export function render(game, ui, handlers) {
  paintLife($('you-life'), game.you.life);
  paintLife($('foe-life'), game.foe.life);
  $('turn-label').textContent = `Turn ${game.turn} — ${game.active === 'you' ? 'Your move' : "Sable's move"}`;
  paintMana($('mana'), game.you.mana, game.you.maxMana);
  $('foe-hand-count').textContent = `${game.foe.hand.length} cards in hand`;
  $('foe-deck-count').textContent = `Deck ${game.foe.deck.length}`;
  $('you-deck-count').textContent = `Deck ${game.you.deck.length}`;

  const boltArmed = ui.targeting === 'bolt';
  paintField($('foe-field'), game.foe.field, {
    targetable: boltArmed ? (slot) => game.foe.field[slot] !== null : undefined,
    onFieldClick: boltArmed ? (event, slot) => handlers.onTarget({ who: 'foe', slot }) : undefined,
  });
  paintField($('you-field'), game.you.field, {
    targetable: boltArmed ? (slot) => game.you.field[slot] !== null : undefined,
    onFieldClick: boltArmed ? (event, slot) => handlers.onTarget({ who: 'you', slot }) : undefined,
  });

  // Opponent's hand shows as face-down backs; your hand shows the real cards.
  const foeHand = $('foe-hand');
  foeHand.innerHTML = '';
  for (let i = 0; i < game.foe.hand.length; i += 1) foeHand.appendChild(cardBack(true));

  const hand = $('hand');
  hand.innerHTML = '';
  game.you.hand.forEach((card, index) => {
    const playable = game.phase === 'play' && game.active === 'you' && card.cost <= game.you.mana
      && (card.kind !== 'creature' || game.you.field.includes(null));
    const el = cardElement(card, 'hand', {
      extraClass: `${playable ? 'playable' : 'cant'}${ui.selected === index ? ' selected' : ''}${ui.justDealt?.has(card.uid) ? ' dealt' : ''}`,
      onClick: () => handlers.onHandCard(index),
    });
    hand.appendChild(el);
  });

  const endBtn = $('end-turn-btn');
  endBtn.disabled = !(game.phase === 'play' && game.active === 'you');
  $('hint').textContent = boltArmed
    ? 'Surge Bolt armed — click an enemy creature, one of your creatures, or a life total to strike it.'
    : ui.selected !== null && ui.selected !== undefined
      ? 'Click the card again to play it, or press another number key to choose a different card.'
      : '';

  const log = $('log');
  log.innerHTML = '';
  for (const line of game.log.slice(-3).reverse()) {
    const div = document.createElement('div');
    div.textContent = line;
    log.appendChild(div);
  }
  $('status').textContent = `Turn ${game.turn}. Your life ${game.you.life}, Sable's life ${game.foe.life}. ${game.log[game.log.length - 1] ?? ''}`;
}

export function showTitle() {
  $('title-screen').classList.remove('hidden');
  $('end-screen').classList.add('hidden');
}

export function showEnd(game) {
  const win = game.winner === 'you';
  const title = $('end-title');
  title.textContent = win ? '★ VICTORY ★' : 'DEFEAT';
  title.className = win ? 'win' : 'lose';
  $('end-sub').textContent = win
    ? 'The currents bow to you. Sable’s tide has ebbed.'
    : 'The tide takes the table this time. Shuffle up and try again.';
  $('end-stats').innerHTML =
    `Turns played: <b>${game.stats.turnsPlayed}</b> &nbsp;·&nbsp; Cards played: <b>${game.stats.cardsPlayed}</b><br>` +
    `Your life: <b>${game.you.life}</b> &nbsp;·&nbsp; Sable's life: <b>${game.foe.life}</b>`;
  $('end-screen').classList.remove('hidden');
  $('title-screen').classList.add('hidden');
}

/** A floating "-3" or "+6" over a screen position, for battle feedback. */
export function floatText(x, y, text, kind = 'damage') {
  const div = document.createElement('div');
  div.className = `dmg-float${kind === 'heal' ? ' heal' : ''}`;
  div.textContent = text;
  div.style.left = `${x}px`;
  div.style.top = `${y}px`;
  document.body.appendChild(div);
  window.setTimeout(() => div.remove(), 950);
}

/** Screen position of a life total, for floating damage numbers. */
export function lifePosition(who) {
  const el = $(who === 'you' ? 'you-life' : 'foe-life');
  const rect = el.getBoundingClientRect();
  return { x: rect.left + rect.width / 2 - 10, y: rect.top - 6 };
}
