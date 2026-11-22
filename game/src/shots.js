// Screenshot scenes: each one drives the real engine forward (or rigs a position
// through the real rules) so every screenshot is a genuine render of the game.
// ?shot=title | play | win | loss, with an optional ?seed= for the play scene.
import { createGame, endTurn, playCard } from './engine.js';
import { takeGreedyTurn } from './ai.js';
import { makeCard } from './deck.js';

/** Play a number of full rounds with both sides steering greedily. */
function autopilotRounds(game, rounds) {
  for (let round = 0; round < rounds && game.phase !== 'over'; round += 1) {
    takeGreedyTurn(game, 'you');
    endTurn(game);
    if (game.phase === 'over') break;
    takeGreedyTurn(game, 'foe');
    endTurn(game);
  }
  return game;
}

export function stageShot(name, seed = 9) {
  if (name === 'win') return stageWin();
  if (name === 'loss') return stageLoss();
  if (name === 'play') return stagePlay(seed);
  return { game: createGame(seed), screen: 'title' };
}

/**
 * Mid-game: four greedy rounds (seed 9, picked by simulation: Sable's field
 * full, both hands still loaded, both lives dented). The frame is a real table.
 */
function stagePlay(seed) {
  const game = autopilotRounds(createGame(seed), 4);
  return { game, screen: 'play' };
}

/**
 * A win, honestly earned: four real rounds first, then Sable at 3 life and a
 * Surge Bolt in hand, played for real to close the game.
 */
function stageWin() {
  const game = autopilotRounds(createGame(11), 4);
  if (game.phase === 'over') return { game, screen: 'over' };
  game.foe.life = 3;
  game.you.mana = Math.max(game.you.mana, 2);
  game.you.hand.push(makeCard('surge-bolt'));
  const index = game.you.hand.findIndex((card) => card.defId === 'surge-bolt');
  playCard(game, 'you', index, { who: 'foe', side: 'life' });
  return { game, screen: 'over' };
}

/**
 * A loss, honestly earned: three real rounds first, then you at 2 life with an
 * empty field, Sable's leviathan and drake on the table, and the battle phase
 * does the rest.
 */
function stageLoss() {
  const game = autopilotRounds(createGame(1), 3);
  if (game.phase === 'over') return { game, screen: 'over' };
  game.you.life = 2;
  for (let slot = 0; slot < game.you.field.length; slot += 1) {
    if (game.you.field[slot]) {
      game.you.discard.push(game.you.field[slot]);
      game.you.field[slot] = null;
    }
  }
  game.foe.field[0] = makeCard('tide-leviathan');
  game.foe.field[1] = makeCard('ember-drake');
  endTurn(game); // your turn ends with an empty field: no strikes, Sable's turn
  if (game.phase !== 'over') {
    takeGreedyTurn(game, 'foe');
    endTurn(game); // Sable's creatures strike your life
  }
  return { game, screen: 'over' };
}
