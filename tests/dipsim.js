// Kısır döngü kontrolü: oyuncu botun her ittifak teklifini kabul ederse oyunlar yine bitiyor mu?
const fs = require('fs'); const E = require('../src/engine.js');
const M = JSON.parse(fs.readFileSync(__dirname + '/../src/maps.json', 'utf8')); E.setMaps(M);
const UPG = { kilic: 3, okcu: 3, atli: 3, hazine: 2, baslangic: 1 };
let res = { win: 0, lose: 0, timeout: 0 }, allies = 0, coal = 0, betray = 0, turns = [];
for (let level = 0; level < 2; level++) for (const p of M[E.LEVELS[level].map].factions) for (let s = 1; s <= 2; s++) {
  const G = E.newGame({ era: 0, level, player: p, generals: [], seed: s * 7, upgrades: UPG });
  const R = E.rng(s * 13 + level);
  let guard = 0;
  while (!G.over && guard++ < 3000) {
    if (G.cur === G.player && !process.env.NOACCEPT) { const o = E.aiOffer(G, R); if (o) { E.applyDeal(G, o.from, G.player, o.deal); allies++; } }
    E.runAI(G, G.cur, R);
    G.log.forEach(e => { if (e.t === 'ally' && e.a !== G.player && e.b !== G.player) coal++; if (e.t === 'betray') betray++; });
    G.log.length = 0; E.endTurn(G);
  }
  if (G.over === 1) { res.win++; turns.push(G.turn); } else if (G.over === -2) res.timeout++; else res.lose++;
}
console.log(res, 'oyuncu ittifakı', allies, 'bot koalisyonu', coal, 'ihanet', betray, 'zafer turu ~', turns.length ? Math.round(turns.reduce((a, b) => a + b) / turns.length) : '-');
