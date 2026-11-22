// Mouse and keyboard input: selecting and playing hand cards, arming a bolt,
// picking its target, ending the turn, and the title / end-screen shortcuts.
// Input never touches the rules directly; it calls the controller's callbacks.
import { sfx } from './sound.js';

export function bindInput(handlers) {
  const $ = (id) => document.getElementById(id);

  $('end-turn-btn').addEventListener('click', () => handlers.onEndTurn());
  $('start-btn').addEventListener('click', () => handlers.onStart());
  $('again-btn').addEventListener('click', () => handlers.onStart());
  $('mute-btn').addEventListener('click', () => handlers.onMute());
  $('foe-life').addEventListener('click', () => handlers.onLifeTarget('foe'));
  $('you-life').addEventListener('click', () => handlers.onLifeTarget('you'));

  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') {
      handlers.onCancel();
      return;
    }
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      handlers.onConfirm();
      return;
    }
    if (event.key >= '1' && event.key <= '9') {
      handlers.onHandCard(Number(event.key) - 1);
      return;
    }
    if (event.key === 'm' || event.key === 'M') handlers.onMute();
  });

  // Clicking the table background (not a card) cancels an armed bolt / selection.
  $('app').addEventListener('click', (event) => {
    if (event.target.id === 'app' || event.target.classList.contains('field')) {
      handlers.onCancel();
    }
  });
}

/** What a hand-card click means, given the current UI state. */
export function handCardAction(game, ui, index) {
  const card = game.you.hand[index];
  if (!card) return { action: 'none' };
  if (ui.targeting === 'bolt') return { action: 'cancel-targeting' };
  if (ui.selected === index) {
    if (card.kind === 'bolt') return { action: 'arm-bolt', index };
    return { action: 'play', index };
  }
  return { action: 'select', index };
}

export function clickSound() {
  sfx.click();
}
