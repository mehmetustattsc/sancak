// Kural testleri: kendi birliğinden geçme, saldırı sonrası ilerleme yok, atlı takibi, kule, ticaret, general gücü
const fs = require('fs'); const assert = require('assert'); const E = require('../src/engine.js');
const M = JSON.parse(fs.readFileSync(__dirname + '/../src/maps.json', 'utf8')); E.setMaps(M);
const gens = [{ id: 'demirpence', name: 'Demir Pençe', spec: 'kilic', skill: 'kalkan', xp: 0 }];
function fresh() { const G = E.newGame({ era: 0, level: 0, player: 'sari', generals: gens, seed: 3 }); G.units = []; G.log.length = 0; return G; }
function add(G, f, type, ci) { const u = { id: G.nextId++, f, type, c: ci, hp: 100, lvl: 1, mp: E.UT[type].mv, acted: false, kills: 0, gen: 0, emb: 0 }; G.units.push(u); return u; }
function line(G) { // kendi topraklarında düz üç hücre: a - b - c
  for (const a of G.cells) { if (!a.t || a.f !== G.player || a.mt) continue;
    for (const j of a.nb) { const b = G.cells[j]; if (!b.t || b.f !== G.player || b.mt) continue;
      for (const k of b.nb) { const c = G.cells[k]; if (k === a.i || !c.t || c.f !== G.player || c.mt || a.nb.includes(k)) continue; return [a, b, c]; } } }
}
let G = fresh(); const P = G.player;
// 1) kendi birliğinin içinden geçme
let [a, b, c] = line(G);
let atli = add(G, P, 'atli', a.i); add(G, P, 'kilic', b.i);
let r = E.reach(G, atli);
assert(r[b.i] && r[b.i].pass, 'kendi birliğinin hücresi geçiş olmalı');
assert(r[c.i] && !r[c.i].pass, 'arkasındaki hücreye gidilebilmeli');
assert(E.moveUnit(G, atli, b.i) === null, 'dolu hücrede durulamaz');
assert(E.moveUnit(G, atli, c.i), 'içinden geçerek gidebilmeli');
console.log('✓ kendi birliğinin içinden geçme');
// 2) saldırı sonrası ilerleme yok + 3) atlı takibi
G = fresh(); [a, b, c] = line(G);
atli = add(G, P, 'atli', a.i); const enemyF = G.factions.findIndex((f, i) => i !== P);
let foe = add(G, enemyF, 'okcu', b.i); foe.hp = 5;
E.attack(G, atli, foe, null);
assert.strictEqual(atli.c, a.i, 'saldıran yerinde kalmalı');
assert(!G.units.includes(foe), 'düşman yok olmalı');
assert.strictEqual(atli.mp, 1, 'atlı takip hareketi kazanmalı');
assert(!E.canAttack(G, atli, add(G, enemyF, 'kilic', c.i)), 'takipte ikinci saldırı yok');
const r2 = E.reach(G, atli); assert(r2[b.i], 'takipte boşalan hücreye gidebilmeli');
let kil = add(G, P, 'kilic', G.cells.find(x => x.t && x.f === P && !G.units.some(u => u.c === x.i) && x.nb.includes(a.i)).i);
foe = G.units.find(u => u.c === c.i); foe.hp = 5;
E.attack(G, kil, foe, null); assert.strictEqual(kil.mp, 0, 'kılıçlı takip almaz');
console.log('✓ saldıran yerinde kalır, atlı takibi');
// 4) kule
G = fresh();
const land = G.cells.find(x => x.t === 1 && x.f === P);
const f = G.factions[P]; f.gold = 500; f.iron = 5;
const t = E.buildTower(G, land.i, P);
assert(t && t.build === 2, 'inşaat 2 tur');
const land2 = G.cells.find(x => x.t === 1 && x.f === P && x.i !== land.i);
assert(!E.buildTower(G, land2.i, P), 'turda bir kule');
const farm = G.cells.find(x => x.t === 2 && x.f === P); assert(!farm || !E.towerInfo(G, farm, P).ok, 'tarlaya kule olmaz');
const att = add(G, enemyF, 'kilic', land.nb.find(j => G.cells[j].t && !G.units.some(u => u.c === j)));
let pr = E.predict(G, att, t); assert.strictEqual(pr.back, 0, 'inşaat karşılık vermez');
E.attack(G, att, t, null); const hpAfter = t.hp; assert(hpAfter < 100 && hpAfter > 0, 'inşaat hasar alıp ayakta kalmalı');
assert(!E.canAttack(G, t, att), 'kule saldıramaz');
// iki tur ilerlet (oyuncu turu başlangıçları)
for (let k = 0; k < 2; k++) { do { E.endTurn(G); } while (G.cur !== P); }
assert.strictEqual(t.build, 0, '2 tur sonra kule tamam');
assert(t.hp >= hpAfter, 'hasarlı kule azalan canla başlar');
att.acted = false; pr = E.predict(G, att, t); assert(pr.back > 0, 'tamamlanan kule karşılık verir');
console.log('✓ kule');
// 5) ticaret
G = fresh(); const F = G.factions[P]; F.gold = 100; F.food = 30; F.iron = 0;
assert(E.trade(G, P, 'sellFood')); assert.strictEqual(F.food, 20); assert.strictEqual(F.gold, 112);
assert(E.trade(G, P, 'buyIron')); assert.strictEqual(F.iron, 2);
assert(E.trade(G, P, 'buyFood'));
assert(!E.trade(G, P, 'sellFood'), 'tur başına 3 takas');
console.log('✓ ticaret');
// 6) general gücü
G = fresh(); [a, b, c] = line(G);
const k1 = add(G, P, 'kilic', a.i), e1 = add(G, enemyF, 'kilic', b.i);
const base = E.predict(G, k1, e1).dmg;
E.assignGeneral(G, P, 'demirpence', k1.id);
const withGen = E.predict(G, k1, e1).dmg;
console.log('  general etkisi: hasar', base.toFixed(1), '->', withGen.toFixed(1));
assert(withGen > base * 1.2, 'general belirgin fark yaratmalı');
console.log('✓ general');
// 7) kalede asker
G = fresh(); const cas = G.cells.find(x => x.t === 4 && x.f === P);
if (cas) {
  G.factions[P].gold = 500; G.factions[P].iron = 9;
  assert(E.recruitInfo(G, cas, 'kilic').ok, 'kalede kılıçlı alınmalı');
  cas.lv = 1; assert(!E.recruitInfo(G, cas, 'atli').ok, 'düşük kalede atlı yok');
  cas.lv = 3; assert(E.recruitInfo(G, cas, 'atli').ok, '3. seviye kalede atlı');
  console.log('✓ kalede asker');
}
console.log('KURAL TESTLERİ TAMAM');
