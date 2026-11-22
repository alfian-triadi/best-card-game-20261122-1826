// Synthesised sound effects with WebAudio: no audio files, nothing fetched.
// The context is created on the first user gesture; everything is a short
// oscillator envelope. Mute is a plain flag the UI toggles.
let context = null;
let muted = false;

export function setMuted(value) {
  muted = value;
}

export function isMuted() {
  return muted;
}

function audio() {
  if (muted) return null;
  try {
    if (!context) context = new (window.AudioContext || window.webkitAudioContext)();
    if (context.state === 'suspended') void context.resume();
    return context;
  } catch {
    return null;
  }
}

function tone(freq, dur, type, gain, when = 0, slideTo = 0) {
  const ctx = audio();
  if (!ctx) return;
  const t0 = ctx.currentTime + when;
  const osc = ctx.createOscillator();
  const amp = ctx.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, t0);
  if (slideTo) osc.frequency.exponentialRampToValueAtTime(slideTo, t0 + dur);
  amp.gain.setValueAtTime(0.0001, t0);
  amp.gain.exponentialRampToValueAtTime(gain, t0 + 0.01);
  amp.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
  osc.connect(amp).connect(ctx.destination);
  osc.start(t0);
  osc.stop(t0 + dur + 0.05);
}

export const sfx = {
  click() { tone(660, 0.06, 'triangle', 0.08); },
  playCard() { tone(392, 0.12, 'triangle', 0.14, 0, 587); },
  attack() { tone(160, 0.18, 'sawtooth', 0.12, 0, 70); },
  hurt() { tone(220, 0.25, 'square', 0.07, 0, 110); },
  heal() { tone(523, 0.2, 'sine', 0.1, 0, 784); },
  draw() { tone(880, 0.07, 'sine', 0.06); },
  turn() { tone(440, 0.09, 'triangle', 0.08, 0, 554); },
  win() {
    [523, 659, 784, 1047].forEach((f, i) => tone(f, 0.35, 'triangle', 0.12, i * 0.13));
  },
  lose() {
    [392, 330, 262, 196].forEach((f, i) => tone(f, 0.4, 'sawtooth', 0.07, i * 0.16));
  },
};
