// Yapay zekâ kendine karşı: her harita ve her ülke için oyuncu yerine bot oynar.
const fs = require('fs'); const E = require('../src/engine.js');
E.setMaps(JSON.parse(fs.readFileSync(__dirname + '/../src/maps.json', 'utf8')));
const M = JSON.parse(fs.readFileSync(__dirname + '/../src/maps.json', 'utf8'));
function play(level, player, seed, idle) {
  const gens = E.GENERALS.filter(g => g.era === 0 && g.unlock === 0).map(g => Object.assign({}, g, { xp: 0 }));
  const G = E.newGame({ era: 0, level, player, generals: gens, seed });
  const R = E.rng(seed * 31 + 5);
  let guard = 0;
  while (!G.over && guard++ < 5000) {
    if (G.cur !== G.player || !idle) E.runAI(G, G.cur, R);
    E.endTurn(G);
    G.log.length = 0;
  }
  return { over: G.over, turn: G.turn, units: G.units.length };
}
const N = +(process.argv[2] || 4);
for (let level = 0; level < E.LEVELS.length; level++) {
  const m = M[E.LEVELS[level].map];
  const out = m.factions.map(p => {
    let w = 0, ts = [], res = [];
    for (let s = 1; s <= N; s++) { const r = play(level, p, s); res.push(r.over); if (r.over === 1) { w++; ts.push(r.turn); } }
    return `${p} ${w}/${N}` + (ts.length ? ` ~${Math.round(ts.reduce((a, b) => a + b) / ts.length)}t` : '') + ` [${res.join(',')}]`;
  });
  const idle = play(level, m.factions[0], 1, true);
  console.log(m.name, '|', out.join('  '), '| idle:', idle.over, '@', idle.turn);
}
// CI kontrolü: çökme yok, her oyun biter, İber'de en az bir ülke kazanılabiliyor
if (process.env.CI_CHECK) {
  let wins = 0;
  for (const p of M[0].factions) for (let s = 1; s <= 2; s++) { const r = play(0, p, s); if (r.over === 1) wins++; if (!r.over) throw new Error('oyun bitmedi'); }
  if (!wins) throw new Error('İber Yarımadası hiç kazanılamadı');
  console.log('CI kontrolü tamam, kazanılan oyun:', wins);
}
