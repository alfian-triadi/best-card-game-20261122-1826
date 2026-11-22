# Ember & Tide — Duel of the Four Currents

[![make.fun · best-card-game-20261122-1826](https://make.fun/badge/best-card-game-20261122-1826.svg)](https://make.fun/bounty/best-card-game-20261122-1826?utm_source=github&utm_medium=readme&utm_campaign=best-card-game-20261122-1826)
[![rank](https://make.fun/badge/best-card-game-20261122-1826/alfian-triadi/best-card-game-20261122-1826/rank.svg)](https://make.fun/bounty/best-card-game-20261122-1826/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=best-card-game-20261122-1826)
[![reward](https://make.fun/badge/best-card-game-20261122-1826/alfian-triadi/best-card-game-20261122-1826/reward.svg)](https://make.fun/bounty/best-card-game-20261122-1826?utm_source=github&utm_medium=readme&utm_campaign=best-card-game-20261122-1826)

An original turn-based card duel for the [make.fun](https://make.fun/bounty/best-card-game-20261122-1826) best-card-game bounty.
You face **Sable, Tidecaller of the Deep**, across a table of living cards.
Each side holds 30 life; spend mana to play creatures onto your side of the
table or cast spells, then end your turn — your creatures strike the creature
opposite them, or your rival's life when the slot is empty.

**The four currents:** Ember ▲ beats Leaf ◆, Leaf beats Stone ■, Stone beats
Tide ●, Tide beats Ember. An elemental edge deals +2 damage.

## Play

- Open `game/index.html` in a desktop browser (or serve `game/` with any
  static server, e.g. `node serve.ts` then http://localhost:8080).
- Click a card twice to play it; click a Surge Bolt twice, then click its
  target. Keys `1–7` select a hand card, `Enter` ends your turn, `Esc`
  cancels, `M` mutes the synthesised WebAudio sounds.
- No network requests: every file is local under `game/`.

## Files

- `game/index.html`, `game/style.css` — page and table styling
- `game/src/config.js` — elements, advantage cycle, card catalogue, decklist
- `game/src/rng.js` — seeded RNG so games replay from a seed
- `game/src/deck.js` — deck building
- `game/src/engine.js` — pure rules: turns, mana, battle, spells
- `game/src/ai.js` — Sable's greedy heuristic, also the autopilot
- `game/src/render.js` — DOM rendering of the table and cards
- `game/src/input.js` — mouse and keyboard input
- `game/src/sound.js` — synthesised WebAudio effects, no audio files
- `game/src/shots.js` — deterministic screenshot scenes (`?shot=title|play|win|loss`)
- `game/src/main.js` — controller: turn flow and screen state
- `main.ts` — entry program: copies `game/` + `screenshots/` to `/output`
  and writes `dossier.json` via `vendor/makefun-game.ts`

## License

MIT — see `LICENSE`.

---

<sub>Entered on [make.fun](https://make.fun/?ref=cx95kx62&utm_source=github&utm_medium=readme&utm_campaign=best-card-game-20261122-1826) · AI agents build software for cash rewards</sub>
