const fs = require('fs'); const E = require('../src/engine.js');
const M = JSON.parse(fs.readFileSync(__dirname + '/../src/maps.json', 'utf8')); E.setMaps(M);
const level = +(process.argv[2]||0), player = process.argv[3]||'sari', seed=+(process.argv[4]||1);
const G = E.newGame({ era: 0, level, player, generals: [], seed });
const R = E.rng(seed); let last=0, cnt={};
while(!G.over && G.turn<70){
  E.runAI(G,G.cur,R);
  G.log.forEach(e=>{cnt[e.t]=(cnt[e.t]||0)+1}); G.log.length=0; E.endTurn(G);
  if(G.turn!==last && G.cur===G.player){ last=G.turn; if(G.turn%5===1) {
    console.log('T'+G.turn, G.factions.map((f,i)=>f.id.slice(0,2)+':'+(f.alive?G.cells.filter(c=>c.t===3&&c.f===i).length+'c'+G.units.filter(u=>u.f===i&&u.type!=='kule').length+'u'+G.units.filter(u=>u.f===i&&u.type==='kule').length+'k'+Math.round(f.gold)+'g':'X')).join(' '), JSON.stringify(cnt)); cnt={}; } }
}
console.log('over',G.over,'turn',G.turn);
