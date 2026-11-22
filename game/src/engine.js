// Pure game engine: no DOM, no sound, no timers — so the rules can be simulated
// headlessly and the browser UI is a thin shell over the same functions.
// A state holds two sides ('you' and 'foe'), each with life, mana, deck, hand,
// field (array of creature cards or null per slot) and discard pile.
import {
  BEATS, BASE_MANA, MAX_FIELD, MAX_HAND, MAX_MANA, START_HAND, START_LIFE,
} from './config.js';
import { buildDeck } from './deck.js';
import { mulberry32 } from './rng.js';

export function newSide(rand) {
  return {
    life: START_LIFE,
    mana: BASE_MANA,
    maxMana: BASE_MANA,
    deck: buildDeck(rand),
    hand: [],
    field: Array(MAX_FIELD).fill(null),
    discard: [],
  };
}

export function createGame(seed) {
  const rand = mulberry32(seed);
  const game = {
    seed,
    turn: 1,
    phase: 'play', // 'play' | 'battle' | 'over'
    active: 'you',
    winner: null,
    log: [],
    stats: { cardsPlayed: 0, damageDealt: 0, turnsPlayed: 0 },
    you: newSide(rand),
    foe: newSide(rand),
  };
  drawCards(game, 'you', START_HAND);
  drawCards(game, 'foe', START_HAND);
  pushLog(game, 'The duel begins. Ember and Tide meet at the table.');
  return game;
}

export function pushLog(game, text) {
  game.log.push(text);
  if (game.log.length > 40) game.log.shift();
}

export function drawCards(game, side, count) {
  const s = game[side];
  for (let i = 0; i < count; i += 1) {
    if (s.hand.length >= MAX_HAND) return;
    if (s.deck.length === 0) {
      if (s.discard.length === 0) return;
      s.deck = s.discard;
      s.discard = [];
    }
    s.hand.push(s.deck.pop());
  }
}

export function manaForTurn(turn) {
  return Math.min(MAX_MANA, BASE_MANA + Math.floor((turn - 1) / 2));
}

/** Begin a side's turn: refill mana, draw one card. */
export function startTurn(game, side) {
  game.active = side;
  game.phase = 'play';
  const s = game[side];
  s.maxMana = manaForTurn(game.turn);
  s.mana = s.maxMana;
  drawCards(game, side, 1);
}

/** Damage a creature or a side's life. Returns true when something died / game ended. */
export function dealDamage(game, target, amount, sourceName) {
  if (target.side === 'life') {
    const s = game[target.who];
    s.life = Math.max(0, s.life - amount);
    if (target.who === 'foe') game.stats.damageDealt += amount;
    pushLog(game, `${sourceName} deals ${amount} damage to ${target.who === 'you' ? 'you' : 'Sable'}.`);
    if (s.life <= 0) endGame(game, target.who === 'foe' ? 'you' : 'foe');
    return true;
  }
  const s = game[target.who];
  const creature = s.field[target.slot];
  if (!creature) return false;
  creature.health -= amount;
  pushLog(game, `${sourceName} hits ${creature.name} for ${amount}.`);
  return true;
}

export function endGame(game, winner) {
  game.phase = 'over';
  game.winner = winner;
  pushLog(game, winner === 'you' ? 'Victory! The currents bow to you.' : 'Defeat. The tide takes the table.');
}

/** Remove creatures at 0 health or less from both fields, into their discard piles. */
export function sweepDead(game) {
  for (const who of ['you', 'foe']) {
    const s = game[who];
    for (let slot = 0; slot < MAX_FIELD; slot += 1) {
      const creature = s.field[slot];
      if (creature && creature.health <= 0) {
        pushLog(game, `${creature.name} is swept from the table.`);
        s.discard.push(creature);
        s.field[slot] = null;
      }
    }
  }
}

function advantageBonus(attacker, defender) {
  return BEATS[attacker.element] === defender.element ? 2 : 0;
}

/**
 * Battle phase: every creature attacks the creature opposite it, or the rival's
 * life when the slot is empty. All strikes land at once, then the dead are swept.
 * Returns a list of strike descriptions for animation and sound.
 */
export function battlePhase(game, attackerSide) {
  const defenderSide = attackerSide === 'you' ? 'foe' : 'you';
  const atk = game[attackerSide];
  const def = game[defenderSide];
  const strikes = [];
  for (let slot = 0; slot < MAX_FIELD; slot += 1) {
    const creature = atk.field[slot];
    if (!creature) continue;
    const target = def.field[slot];
    const bonus = target ? advantageBonus(creature, target) : 0;
    const damage = creature.attack + bonus;
    strikes.push({
      from: { who: attackerSide, slot },
      to: target ? { who: defenderSide, slot } : { who: defenderSide, side: 'life' },
      damage,
      advantage: bonus > 0,
      name: creature.name,
    });
  }
  for (const strike of strikes) {
    dealDamage(game, strike.to, strike.damage, strike.name + (strike.advantage ? ' (elemental edge!)' : ''));
    if (game.phase === 'over') break;
  }
  sweepDead(game);
  return strikes;
}

export function canPlay(game, side, handIndex) {
  const s = game[side];
  const card = s.hand[handIndex];
  if (!card || game.phase !== 'play' || game.active !== side) return false;
  if (card.cost > s.mana) return false;
  if (card.kind === 'creature' && !s.field.includes(null)) return false;
  return true;
}

/**
 * Play a card from hand. Creatures take the first empty field slot; spells need a
 * target for 'bolt' ({who, slot} creature or {who, side:'life'}), others resolve at once.
 * Returns { ok, error? }.
 */
export function playCard(game, side, handIndex, target) {
  if (!canPlay(game, side, handIndex)) return { ok: false, error: 'cannot play that card now' };
  const s = game[side];
  const card = s.hand[handIndex];
  s.mana -= card.cost;
  s.hand.splice(handIndex, 1);
  game.stats.cardsPlayed += 1;
  if (card.kind === 'creature') {
    const slot = s.field.indexOf(null);
    s.field[slot] = card;
    pushLog(game, `${side === 'you' ? 'You play' : 'Sable plays'} ${card.name} (${card.attack}/${card.health}).`);
    return { ok: true, played: card, slot };
  }
  if (card.kind === 'bolt') {
    if (!target) return { ok: false, error: 'Surge Bolt needs a target' };
    s.discard.push(card);
    dealDamage(game, target, 3, card.name);
    return { ok: true, played: card };
  }
  if (card.kind === 'mend') {
    s.discard.push(card);
    s.life = Math.min(START_LIFE, s.life + 6);
    pushLog(game, `${side === 'you' ? 'You mend' : 'Sable mends'} 6 life with Ember Mend.`);
    return { ok: true, played: card };
  }
  if (card.kind === 'draw') {
    s.discard.push(card);
    drawCards(game, side, 2);
    pushLog(game, `${side === 'you' ? 'You draw' : 'Sable draws'} 2 cards with Leaf Lore.`);
    return { ok: true, played: card };
  }
  return { ok: false, error: 'unknown card' };
}

/** End the active side's turn: battle, then hand over to the other side. */
export function endTurn(game) {
  if (game.phase !== 'play') return { ok: false };
  const side = game.active;
  game.phase = 'battle';
  const strikes = battlePhase(game, side);
  if (game.phase === 'over') return { ok: true, strikes };
  const next = side === 'you' ? 'foe' : 'you';
  if (next === 'you') {
    game.turn += 1;
    game.stats.turnsPlayed += 1;
  }
  startTurn(game, next);
  pushLog(game, next === 'you' ? 'Your turn.' : "Sable's turn.");
  return { ok: true, strikes };
}

export function isOver(game) {
  return game.phase === 'over';
}
