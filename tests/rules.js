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
const far = add(G, enemyF, 'kilic', c.i);
assert(!E.canAttack(G, atli, far), 'menzil dışına saldırı yok');
const adj = G.cells[a.i].nb.find(j => G.cells[j].t && !G.units.some(u => u.c === j));
const foe2 = add(G, enemyF, 'okcu', adj); foe2.hp = 5;
assert(E.canAttack(G, atli, foe2), 'atlı öldürdükten sonra yeniden saldırabilmeli');
E.attack(G, atli, foe2, null); assert(!G.units.includes(foe2) && !atli.acted && atli.mp >= 1, 'zincir sürmeli');
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
// 8) nakliyeden karaya saldırı
G = fresh();
const coast = G.cells.find(x => x.t && x.nb.some(j => G.cells[j].t === 0));
const seaC = coast.nb.find(j => G.cells[j].t === 0);
const boat = add(G, P, 'kilic', seaC); boat.emb = 1;
const shore = add(G, enemyF, 'okcu', coast.i);
assert(E.canAttack(G, boat, shore), 'nakliyeden karaya saldırılabilmeli');
const landK = Object.assign({}, boat, { emb: 0 });
const pe = E.predict(G, boat, shore);
console.log('  çıkarma hasarı', pe.dmg.toFixed(1));
E.attack(G, boat, shore, null); assert(boat.emb === 1, 'gemide kalmalı');
console.log('✓ nakliyeden saldırı');
// 9) ordu sınırı
G = fresh(); G.factions[P].gold = 9999; G.factions[P].iron = 99;
const cap = E.armyCap(G, P); let made = 0;
for (let t = 0; t < 30 && made < cap + 3; t++) { for (const c of G.cells.filter(x => x.t === 3 && x.f === P)) { G.factions[P].recruited = {}; if (E.recruit(G, c.i, 'kilic')) made++; } }
assert(E.armySize(G, P) <= cap, 'ordu sınırı aşılmamalı');
console.log('✓ ordu sınırı', cap);
// 10) kadırga uzaktan atış
G = fresh();
let shipCell = null, tgtCell = null;
for (const sc of G.cells.filter(x => x.t === 0)) {
  const t2 = G.cells.find(x => x.t && !sc.nb.includes(x.i) && sc.nb.some(j => G.cells[j].nb.includes(x.i)) );
  if (t2) { shipCell = sc; tgtCell = t2; break; }
}
const ship = add(G, P, 'kadirga', shipCell.i), archerT = add(G, enemyF, 'kilic', tgtCell.i);
assert(E.canAttack(G, ship, archerT), 'kadırga 2 hücre uzağa atabilmeli');
assert.strictEqual(E.predict(G, ship, archerT).back, 0, 'kılıçlı uzaktaki gemiye karşılık veremez');
console.log('✓ kadırga uzaktan atış');
// 11) moral: kıskaç ve çevrili
G = fresh();
const mid = G.cells.find(x => x.t && !x.mt && x.nb.length === 6 && x.nb.every(j => G.cells[j].t));
const me = add(G, P, 'kilic', mid.i);
const byDir = {}; for (const j of mid.nb) { const o = G.cells[j]; byDir[((Math.round(Math.atan2(o.y - mid.y, o.x - mid.x) / (Math.PI / 3)) % 6) + 6) % 6] = j; }
assert.strictEqual(E.morale(G, me), null, 'tek başına moral tam');
add(G, enemyF, 'kilic', byDir[0]); assert.strictEqual(E.morale(G, me), null, 'tek düşman kıskaç değil');
add(G, enemyF, 'kilic', byDir[1]); assert.strictEqual(E.morale(G, me), null, 'yan yana iki düşman kıskaç değil');
add(G, enemyF, 'okcu', byDir[3]); assert.strictEqual(E.morale(G, me), 'kiskac', 'karşılıklı iki düşman kıskaç');
const dmgK = E.predict(G, G.units.find(u => u.c === byDir[0]), me).dmg;
add(G, enemyF, 'kilic', byDir[4]); assert.strictEqual(E.morale(G, me), 'agir', 'iki kıskaç ağır');
add(G, enemyF, 'kilic', byDir[2]); add(G, enemyF, 'kilic', byDir[5]); assert.strictEqual(E.morale(G, me), 'cevrili', 'her yön düşman: çevrili');
const dmgC = E.predict(G, G.units.find(u => u.c === byDir[0]), me).dmg;
console.log('  kıskaçta alınan hasar', dmgK.toFixed(1), '· çevriliyken', dmgC.toFixed(1));
assert(dmgC > dmgK, 'çevrili birlik daha çok hasar almalı');
console.log('✓ moral');
// 12) diplomasi
G = fresh();
E.makeAlly(G, P, enemyF);
assert(E.isAlly(G, P, enemyF), 'ittifak kurulmalı');
[a, b, c] = line(G);
const mineU = add(G, P, 'kilic', a.i), allyU = add(G, enemyF, 'kilic', b.i);
assert(!E.canAttack(G, mineU, allyU), 'müttefike saldırılamaz');
assert(E.reach(G, mineU)[b.i] && E.reach(G, mineU)[b.i].pass, 'müttefik birliğinin içinden geçilir');
assert.strictEqual(E.morale(G, mineU), null, 'müttefik kıskaç yapmaz');
// ihanet: müttefikin boş şehrine girmek
const allyCity = G.cells.find(x => x.t === 3 && x.f === enemyF && !x.cap);
G.units = G.units.filter(u => u.c !== allyCity.i);
const nbC = allyCity.nb.find(j => G.cells[j].t); G.units = G.units.filter(u => u.c !== nbC);
const trait = add(G, P, 'kilic', nbC);
assert(E.moveUnit(G, trait, allyCity.i), 'müttefik şehrine girilebilmeli');
assert.strictEqual(allyCity.f, P, 'şehir alınmalı');
assert(!E.isAlly(G, P, enemyF), 'ittifak bozulmalı');
assert(G.distrust[P] > G.turn, 'ihanet eden güvenilmez olmalı');
// süre: 10 tur sonra biter
G = fresh(); E.makeAlly(G, P, enemyF); G.turn += 10; assert(E.isAlly(G, P, enemyF), '10. turda hâlâ müttefik'); G.turn += 1; assert(!E.isAlly(G, P, enemyF), '11. turda bitmeli');
// en fazla 2 müttefik
G = fresh(); const others = G.factions.map((f, i) => i).filter(i => i !== P);
E.makeAlly(G, P, others[0]); E.makeAlly(G, P, others[1]);
assert(!E.proposeDeal(G, P, others[2], { give: { gold: 50 }, get: {}, ally: true }).ok, 'üçüncü ittifak olmaz');
// şehir satın alma
G = fresh(); G.factions[P].gold = 999;
const buy = G.cells.find(x => x.t === 3 && x.f === enemyF && !x.cap);
const low = E.proposeDeal(G, P, enemyF, { give: { gold: 10 }, get: { cells: [buy.i] } });
const high = E.proposeDeal(G, P, enemyF, { give: { gold: 400 }, get: { cells: [buy.i] } });
assert(!low.ok && high.ok, 'ucuza şehir verilmez, iyi fiyata verilir');
E.applyDeal(G, P, enemyF, { give: { gold: 400 }, get: { cells: [buy.i] } });
assert.strictEqual(buy.f, P, 'şehir devredilmeli'); assert(!G.units.some(u => u.c === buy.i && u.f === enemyF), 'eski sahibin askeri çekilmeli');
const capE = G.cells.find(x => x.cap && x.f === enemyF);
assert(!E.proposeDeal(G, P, enemyF, { give: { gold: 999 }, get: { cells: [capE.i] } }).ok, 'başkent satılmaz');
console.log('✓ diplomasi');
// 13) bağlı krallık
G = fresh(); G.factions[P].gold = 2000;
const weak = enemyF;
assert(!E.annexInfo(G, P, weak).ok, 'güçlü ülke katılmaz');
G.cells.forEach(c => { if (c.f === weak && c.t === 3 && !c.cap) c.f = P; });
G.units = G.units.filter(u => u.f !== weak || G.cells[u.c].cap);
G.recentLoss = []; G.recentLoss[weak] = G.turn;
const ai = E.annexInfo(G, P, weak);
console.log('  ilhak bedeli', ai.cost, ai.why);
assert(ai.ok, 'zayıf ülke katılmalı: ' + ai.why);
const capW = G.cells.find(c => c.cap && c.f === weak);
assert(E.annex(G, P, weak), 'ilhak olmalı');
assert(capW.f === P && !G.factions[weak].alive && !G.units.some(u => u.f === weak), 'her şey oyuncuya geçmeli');
console.log('✓ bağlı krallık');
console.log('KURAL TESTLERİ TAMAM');
