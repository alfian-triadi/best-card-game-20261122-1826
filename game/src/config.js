// Ember & Tide — Duel of the Four Currents: constants and card catalogue.
// Four original elements in a beating cycle: Ember > Leaf > Stone > Tide > Ember.
// An attacker whose element beats its target's deals +2 damage.
export const ELEMENTS = {
  ember: { name: 'Ember', symbol: '▲', color: '#e8481f', dark: '#8f1d05', light: '#ffd9c9' },
  tide: { name: 'Tide', symbol: '●', color: '#1f7fe8', dark: '#0a3d7a', light: '#cfe6ff' },
  leaf: { name: 'Leaf', symbol: '◆', color: '#2fae4e', dark: '#0f5c24', light: '#cdf2d4' },
  stone: { name: 'Stone', symbol: '■', color: '#8a7a5c', dark: '#4d4130', light: '#efe6d2' },
};

export const BEATS = { ember: 'leaf', leaf: 'stone', stone: 'tide', tide: 'ember' };

export const START_LIFE = 30;
export const START_HAND = 4;
export const MAX_HAND = 7;
export const MAX_FIELD = 4;
export const BASE_MANA = 3;
export const MAX_MANA = 6;
export const DECK_SIZE = 24;

// Creatures: id, name, element, cost, attack, health. Spells: kind 'bolt' | 'mend' | 'draw'.
export const CARD_DEFS = [
  // Ember creatures — swift, hard-hitting.
  { id: 'cinder-pup', kind: 'creature', name: 'Cinder Pup', element: 'ember', cost: 1, attack: 2, health: 2, text: 'A spark that learned to bite.' },
  { id: 'flame-imp', kind: 'creature', name: 'Flame Imp', element: 'ember', cost: 2, attack: 3, health: 3, text: 'Juggles live coals for fun.' },
  { id: 'ember-drake', kind: 'creature', name: 'Ember Drake', element: 'ember', cost: 3, attack: 5, health: 4, text: 'Its wings leave smoke trails.' },
  { id: 'ash-phoenix', kind: 'creature', name: 'Ash Phoenix', element: 'ember', cost: 3, attack: 4, health: 6, text: 'Burns out, rises, repeats.' },
  // Leaf creatures — sturdy growers.
  { id: 'thorn-sprout', kind: 'creature', name: 'Thorn Sprout', element: 'leaf', cost: 1, attack: 1, health: 3, text: 'Small, sharp, everywhere.' },
  { id: 'vine-lurker', kind: 'creature', name: 'Vine Lurker', element: 'leaf', cost: 2, attack: 3, health: 4, text: 'Waits under the moss.' },
  { id: 'bramble-stag', kind: 'creature', name: 'Bramble Stag', element: 'leaf', cost: 3, attack: 4, health: 5, text: 'Antlers of living briar.' },
  { id: 'grove-ancient', kind: 'creature', name: 'Grove Ancient', element: 'leaf', cost: 3, attack: 3, health: 7, text: 'Older than the river.' },
  // Stone creatures — slow, heavy, hard to move.
  { id: 'pebble-golem', kind: 'creature', name: 'Pebble Golem', element: 'stone', cost: 1, attack: 2, health: 3, text: 'A rock with opinions.' },
  { id: 'boulder-hound', kind: 'creature', name: 'Boulder Hound', element: 'stone', cost: 2, attack: 3, health: 4, text: 'Fetches mountains.' },
  { id: 'granite-titan', kind: 'creature', name: 'Granite Titan', element: 'stone', cost: 3, attack: 4, health: 6, text: 'The hill stood up.' },
  { id: 'crystal-warden', kind: 'creature', name: 'Crystal Warden', element: 'stone', cost: 3, attack: 3, health: 7, text: 'Guards the deep veins.' },
  // Tide creatures — slippery and sharp.
  { id: 'ripple-eel', kind: 'creature', name: 'Ripple Eel', element: 'tide', cost: 1, attack: 2, health: 2, text: 'Gone before you blink.' },
  { id: 'mist-heron', kind: 'creature', name: 'Mist Heron', element: 'tide', cost: 2, attack: 2, health: 5, text: 'Stands where the fog is.' },
  { id: 'coral-serpent', kind: 'creature', name: 'Coral Serpent', element: 'tide', cost: 2, attack: 4, health: 3, text: 'A reef that bites back.' },
  { id: 'tide-leviathan', kind: 'creature', name: 'Tide Leviathan', element: 'tide', cost: 3, attack: 5, health: 5, text: 'The whole sea, in one wave.' },
  // Spells.
  { id: 'surge-bolt', kind: 'bolt', name: 'Surge Bolt', element: 'tide', cost: 2, text: 'Deal 3 damage to any creature or rival.', effect: 'Deal 3 damage to any target.' },
  { id: 'ember-mend', kind: 'mend', name: 'Ember Mend', element: 'ember', cost: 2, text: 'Warm light knits wounds shut.', effect: 'Restore 6 life.' },
  { id: 'leaf-lore', kind: 'draw', name: 'Leaf Lore', element: 'leaf', cost: 1, text: 'The grove whispers its secrets.', effect: 'Draw 2 cards.' },
];

// How many copies of each card go in a 24-card deck.
export const DECKLIST = [
  ['cinder-pup', 2], ['flame-imp', 1], ['ember-drake', 1], ['ash-phoenix', 1],
  ['thorn-sprout', 2], ['vine-lurker', 1], ['bramble-stag', 1], ['grove-ancient', 1],
  ['pebble-golem', 2], ['boulder-hound', 1], ['granite-titan', 1], ['crystal-warden', 1],
  ['ripple-eel', 2], ['mist-heron', 1], ['coral-serpent', 1], ['tide-leviathan', 1],
  ['surge-bolt', 2], ['ember-mend', 2], ['leaf-lore', 1],
];

export const AI_NAME = 'Sable, Tidecaller of the Deep';
export const PLAYER_NAME = 'You, Ember Warden';
