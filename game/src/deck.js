// Deck building: a fresh 24-card deck from the decklist, shuffled with the game's RNG.
import { CARD_DEFS, DECKLIST } from './config.js';
import { shuffle } from './rng.js';

export const CARD_BY_ID = new Map(CARD_DEFS.map((card) => [card.id, card]));

let nextUid = 1;

/** One physical copy of a card definition, with its own uid and live health. */
export function makeCard(defId) {
  const def = CARD_BY_ID.get(defId);
  return {
    uid: nextUid,
    defId: def.id,
    kind: def.kind,
    name: def.name,
    element: def.element,
    cost: def.cost,
    attack: def.attack ?? 0,
    health: def.health ?? 0,
    maxHealth: def.health ?? 0,
    text: def.text,
    effect: def.effect ?? '',
  };
}

export function buildDeck(rand) {
  const ids = [];
  for (const [defId, count] of DECKLIST) {
    for (let i = 0; i < count; i += 1) ids.push(defId);
  }
  return shuffle(ids, rand).map((defId) => {
    const card = makeCard(defId);
    nextUid += 1;
    card.uid = nextUid;
    return card;
  });
}
