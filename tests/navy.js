const fs = require('fs'); const E = require('../src/engine.js');
const M = JSON.parse(fs.readFileSync(__dirname + '/../src/maps.json', 'utf8')); E.setMaps(M);
let emb=0, ships=0, shipAtk=0, landings=0;
for (let s=1;s<=4;s++){
  const G = E.newGame({ era: 0, level: 1, player: 'turuncu', generals: [], seed: s });
  const R=E.rng(s);
  while(!G.over && G.turn<45){ E.runAI(G,G.cur,R);
    G.log.forEach(e=>{ if(e.t==='move'&&e.emb) emb++; if(e.t==='recruit'&&G.units.find(u=>u.id===e.u&&u.type==='kadirga')) ships++; if(e.t==='attack'&&e.naval) shipAtk++;
      if(e.t==='move'&&!e.emb&&G.cells[e.path[0]].t===0) landings++; });
    G.log.length=0; E.endTurn(G); }
  console.log('seed',s,'over',G.over,'turn',G.turn, G.factions.map((f,i)=>f.id+':'+(f.alive?G.cells.filter(c=>c.t===3&&c.f===i).length:'X')).join(' '));
}
console.log({emb,ships,shipAtk,landings});
