# Notes for Claude

Owner: Mehmet (Germany). Talk to him in **Turkish**. He loves European War 4 and Medieval: Total War; this game takes them as reference
but must stay simple on a phone (no nested menus) and must never be pay-to-win (every unlock is earned and explained in-game).

## Architecture
- `src/engine.js`: all rules + AI. Plain JSON state `G` (saved to localStorage as-is, so keep it serialisable: no functions, no cycles).
  Globals are shared with the UI in the browser; `module.exports` for Node tests. AI is a generator `aiTurn(G, fi, R)` yielding after
  each action so the UI can animate `G.log` events.
- `src/ui.js`: canvas map + DOM panels. `tapCell` is the single input entry point. Events in `G.log` are played by `playLog`.
- `src/art.js`: SVG art drawn by code (unit figures per faction colour, flags, portraits, city/castle icons).
- `tools/build.py` inlines everything into `web/index.html` (+ PWA files from `public/`). `web/` and `dist/` are build output (gitignored).
- Countries are colours, generals have invented names — keep it that way (no real flags/people).
  Exception (owner's decision): `LEGENDS` in engine.js are famous historical commanders (Selahaddin, Cengiz, Napolyon, Fatih,
  Barbaros, Hannibal, İskender, Timur), unlocked by earned achievements and usable in every era. Atatürk is deliberately excluded.
- Max 4 generals per battle (player chooses in setup); legends rest 5 turns when wounded, normal generals 3.

## Workflow
- After rule changes run `node tests/sim.js 4` and look at win rates per faction; `npm test` must pass.
- After UI changes run `python3 tests/smoke.py <shots-dir>` and look at the screenshots at 390×844.
- Commit to `main` only when tests pass; CI deploys to GitHub Pages.
