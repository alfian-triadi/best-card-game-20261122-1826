// Opponent brain: Sable the Tidecaller plays by readable rules —
// spend mana on the strongest creatures first, bolt a fragile threat or finish
// a low-life rival, mend when hurt, draw when the hand runs dry. The same
// greedy pilot steers either side for screenshot staging and simulation.
import { canPlay, playCard } from './engine.js';

/** Pick the best bolt target: a creature the bolt can kill, else the rival's life. */
export function chooseBoltTarget(game, side) {
  const foe = side === 'you' ? 'foe' : 'you';
  const field = game[foe].field;
  for (let slot = 0; slot < field.length; slot += 1) {
    const creature = field[slot];
    if (creature && creature.health <= 3) return { who: foe, slot };
  }
  if (game[foe].life <= 3) return { who: foe, side: 'life' };
  for (let slot = 0; slot < field.length; slot += 1) {
    if (field[slot]) return { who: foe, slot };
  }
  return { who: foe, side: 'life' };
}

/**
 * One greedy move for `side`: returns true when it played a card. Priority:
 * bolt a killable threat, mend when badly hurt, draw when hand is small,
 * then the biggest affordable creature.
 */
export function greedyMove(game, side) {
  const s = game[side];
  const foe = side === 'you' ? 'foe' : 'you';
  // Bolt first when it removes a creature or wins the game.
  for (let i = 0; i < s.hand.length; i += 1) {
    const card = s.hand[i];
    if (card.kind === 'bolt' && card.cost <= s.mana) {
      const target = chooseBoltTarget(game, side);
      const creature = target.slot !== undefined ? game[foe].field[target.slot] : null;
      if ((creature && creature.health <= 3) || game[foe].life <= 3) {
        return playCard(game, side, i, target).ok;
      }
    }
  }
  // Mend when hurt.
  for (let i = 0; i < s.hand.length; i += 1) {
    const card = s.hand[i];
    if (card.kind === 'mend' && card.cost <= s.mana && s.life <= 18) {
      return playCard(game, side, i).ok;
    }
  }
  // Draw when the hand is thin.
  for (let i = 0; i < s.hand.length; i += 1) {
    const card = s.hand[i];
    if (card.kind === 'draw' && card.cost <= s.mana && s.hand.length <= 3) {
      return playCard(game, side, i).ok;
    }
  }
  // Biggest affordable creature.
  let best = -1;
  for (let i = 0; i < s.hand.length; i += 1) {
    const card = s.hand[i];
    if (card.kind === 'creature' && canPlay(game, side, i)) {
      if (best === -1 || card.attack > s.hand[best].attack) best = i;
    }
  }
  if (best !== -1) return playCard(game, side, best).ok;
  // Leftover bolt at anything, leftover mend/draw when nothing else fits.
  for (let i = 0; i < s.hand.length; i += 1) {
    const card = s.hand[i];
    if (card.kind === 'bolt' && card.cost <= s.mana) {
      return playCard(game, side, i, chooseBoltTarget(game, side)).ok;
    }
    if ((card.kind === 'mend' || card.kind === 'draw') && card.cost <= s.mana) {
      return playCard(game, side, i).ok;
    }
  }
  return false;
}

/** Play greedily until no move is left, then end the turn. */
export function takeGreedyTurn(game, side) {
  let guard = 0;
  while (greedyMove(game, side) && guard < 12) guard += 1;
}
