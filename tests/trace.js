const fs = require('fs'); const E = require('../src/engine.js');
const M = JSON.parse(fs.readFileSync(__dirname + '/../src/maps.json', 'utf8')); E.setMaps(M);
const level = +(process.argv[2]||0), player = process.argv[3]||'sari', seed=+(process.argv[4]||1);
const gens = E.GENERALS.filter(g => g.era === 0 && g.unlock === 0).map(g => Object.assign({}, g, { xp: 0 }));
const G = E.newGame({ era: 0, level, player, generals: gens, seed });
const R = E.rng(seed);
let lastTurn=0, counts={};
while(!G.over && G.turn<60){
  E.runAI(G,G.cur,R);
  G.log.forEach(e=>{counts[e.t]=(counts[e.t]||0)+1});
  G.log.length=0;
  E.endTurn(G);
  if(G.turn!==lastTurn && G.cur===G.player){ lastTurn=G.turn;
    if(G.turn%3===1) console.log('T'+G.turn, G.factions.map((f,i)=>f.id[0]+f.id[1]+':'+(f.alive?G.cells.filter(c=>c.t===3&&c.f===i).length+'c'+G.units.filter(u=>u.f===i).length+'u'+Math.round(f.gold)+'g'+f.food+'f':'X')).join(' '), JSON.stringify(counts)); counts={};}
}
console.log('over',G.over,'turn',G.turn);
