/* ===== Sancak motor: sıra tabanlı kurallar, savaş, ekonomi, yapay zekâ (DOM yok) ===== */
var MAPS = (typeof __MAPS__ !== 'undefined') ? __MAPS__ : [];
var SQ3 = Math.sqrt(3);

var FACTIONS = {
  mavi:    { name: 'Mavi',    col: '#2f6fd6', dark: '#173f86', flag: 'cross' },
  siyah:   { name: 'Siyah',   col: '#3d3d44', dark: '#151518', flag: 'eagle' },
  kirmizi: { name: 'Kızıl',   col: '#c8322f', dark: '#7c1715', flag: 'saltire' },
  sari:    { name: 'Sarı',    col: '#d9a91c', dark: '#7f5f05', flag: 'band' },
  turkuaz: { name: 'Turkuaz', col: '#1a9c97', dark: '#0d5f5c', flag: 'circle' },
  yesil:   { name: 'Yeşil',   col: '#3c9a3c', dark: '#1d5a1d', flag: 'tri' },
  bordo:   { name: 'Bordo',   col: '#8c2042', dark: '#4f0f24', flag: 'chev' },
  turuncu: { name: 'Turuncu', col: '#e07b22', dark: '#86430a', flag: 'star' },
  mor:     { name: 'Mor',     col: '#7a3fb0', dark: '#45206a', flag: 'stripes' },
  kahve:   { name: 'Toprak',  col: '#8a5a2b', dark: '#4c2f12', flag: 'diag' },
  buz:     { name: 'Buz',     col: '#7fbde0', dark: '#3e7fa3', flag: 'nordic' }
};
var NEUTRAL_COL = '#a9a395';

var ERAS = [
  { id: 'orta', name: 'Orta Çağ', years: '1100 – 1450', suffix: 'Krallık', ready: true,
    blurb: 'Kale duvarları, şövalye hücumları ve ok yağmurları.',
    land: ['kilic', 'okcu', 'atli'],
    ranks: ['Yiğit', 'Sancaktar', 'Komutan', 'Beylerbeyi', 'Serdar'] },
  { id: 'yakin', name: 'Yakın Çağ', years: '1850 – 1920', suffix: 'İmparatorluk', ready: false,
    blurb: 'Siperler, makineli tüfekler ve ilk zırhlı araçlar.',
    land: ['piyade', 'makineli', 'zirhli'],
    ranks: ['Albay', 'Tuğgeneral', 'Tümgeneral', 'Korgeneral', 'Mareşal'] },
  { id: 'modern', name: 'Modern Çağ', years: '1990 – bugün', suffix: 'Cumhuriyet', ready: false,
    blurb: 'Tank tümenleri, taarruz helikopterleri ve hava gücü.',
    land: ['mpiyade', 'tank', 'heli'],
    ranks: ['Albay', 'Tuğgeneral', 'Tümgeneral', 'Korgeneral', 'Orgeneral'] }
];

/* birlikler: atk/def taban değerler, mv hareket, rng menzil, cost altın/demir */
var UT = {
  kilic:   { name: 'Kılıçlı',  atk: 28, def: 32, mv: 1, rng: 1, cost: { g: 30, i: 0 }, beats: 'atli', desc: 'Kalkan duvarı. Atlı hücumunu durdurur, sağlam savunur.' },
  okcu:    { name: 'Okçu',     atk: 30, def: 20, mv: 1, rng: 2, cost: { g: 30, i: 0 }, beats: 'kilic', desc: '2 hücre uzağa ok atar. Uzaktan vurunca karşılık almaz.' },
  atli:    { name: 'Atlı',     atk: 36, def: 30, mv: 2, rng: 1, cost: { g: 50, i: 2 }, beats: 'okcu', req: 'smith', pursue: true, desc: '2 hücre gider, düşman hattında durmaz. Düşmanı yok ederse 1 hücre daha ilerler. Demirci ister.' },
  kule:    { name: 'Kule',     atk: 24, def: 40, mv: 0, rng: 1, cost: { g: 40, i: 1 }, tower: true, desc: 'Boş araziye kurulur, 2 turda biter. Saldırmaz ama saldırana karşılık verir.' },
  kadirga: { name: 'Kadırga',  atk: 32, def: 26, mv: 3, rng: 2, cost: { g: 60, i: 2 }, naval: true, req: 'port', desc: 'Savaş gemisi. 2 hücre uzağa atış yapar; uzaktan vurunca karşılık almaz. Nakliyeleri batırır, kıyıyı vurur. Liman ister.' }
};
var ADV = 1.5;
var TRANSPORT = { name: 'Nakliye', def: 8, mv: 2 };

var CITY_INCOME = [0, 8, 12, 17, 23, 30, 38];
var CITY_COST = [0, 0, 35, 60, 90, 130, 180];      // seviyeye çıkmak için altın
var CITY_IRON = [0, 0, 0, 0, 1, 2, 4];
var CASTLE_DEF = [0, 0.3, 0.5, 0.7, 0.9];
var CASTLE_COST = [0, 0, 50, 90, 140];
var CASTLE_IRON = [0, 0, 0, 1, 2];
var SMITH_COST = [0, 50, 90, 140];
var SMITH_IRON = [0, 0, 2, 4];
var FARM_FOOD = [0, 2, 5];
var FARM_COST = 20;
var PORT_COST = [0, 50, 80];
var PORT_IRON = [0, 0, 2];
var TOWER_TURNS = 2;
/* Karargâh: madalyayla kalıcı geliştirmeler (sadece oyuncuya) */
var UPGRADES = [
  { id: 'kilic', kind: 'unit', name: 'Kılıçlı eğitimi', max: 5, cost: [30, 50, 80, 120, 170], per: 0.06 },
  { id: 'okcu', kind: 'unit', name: 'Okçu eğitimi', max: 5, cost: [30, 50, 80, 120, 170], per: 0.06 },
  { id: 'atli', kind: 'unit', name: 'Atlı eğitimi', max: 5, cost: [30, 50, 80, 120, 170], per: 0.06 },
  { id: 'kadirga', kind: 'unit', name: 'Donanma', max: 5, cost: [30, 50, 80, 120, 170], per: 0.06 },
  { id: 'kule', kind: 'unit', name: 'Kule ustaları', max: 5, cost: [25, 40, 60, 90, 130], per: 0.08 },
  { id: 'hazine', kind: 'eco', name: 'Hazine', max: 3, cost: [40, 80, 140], per: 0.10 },
  { id: 'tarim', kind: 'eco', name: 'Tarım', max: 2, cost: [40, 90], per: 1 },
  { id: 'baslangic', kind: 'eco', name: 'Savaş sandığı', max: 3, cost: [30, 60, 100], per: 40 }
];
function upg(G, fi, id) { var f = fi >= 0 ? G.factions[fi] : null; return f && f.upg && f.upg[id] || 0; }
function armyCap(G, fi) {
  var n = 2;
  G.cells.forEach(function (c) { if (c.f === fi) { if (c.t === 3) n += 2; if (c.t === 4) n += 1; } });
  return n;
}
function armySize(G, fi) { return G.units.filter(function (u) { return u.f === fi && !UT[u.type].tower; }).length; }
/* başkentte ticaret: tur başına en fazla 3 takas */
var TRADES = [
  { id: 'sellFood', give: { food: 10 }, get: { gold: 12 }, name: 'Gıda sat' },
  { id: 'buyFood',  give: { gold: 18 }, get: { food: 10 }, name: 'Gıda al' },
  { id: 'buyIron',  give: { gold: 25 }, get: { iron: 2 },  name: 'Demir al' },
  { id: 'sellIron', give: { iron: 2 },  get: { gold: 14 }, name: 'Demir sat' }
];
var TRADE_MAX = 3;

var GENERALS = [
  { id: 'demirpence', era: 0, name: 'Demir Pençe', epithet: 'Kılıçların efendisi', spec: 'kilic', skill: 'kalkan', unlock: 0,
    look: { skin: '#e2b48c', hair: '#3b2a1e', beard: 2, hat: 'helm' } },
  { id: 'kartalgoz', era: 0, name: 'Kartalgöz', epithet: 'Okçular onu izler', spec: 'okcu', skill: 'isabet', unlock: 2,
    look: { skin: '#c99872', hair: '#1d1712', beard: 1, hat: 'hood' } },
  { id: 'ruzgaratli', era: 0, name: 'Rüzgâr Atlı', epithet: 'Bozkırdan gelen', spec: 'atli', skill: 'akinci', unlock: 4,
    look: { skin: '#d8a77c', hair: '#5a3b22', beard: 3, hat: 'kalpak' } },
  { id: 'kalebaba', era: 0, name: 'Kale Baba', epithet: 'Hiçbir sur düşmedi', spec: 'kale', skill: 'kusatma', unlock: 6,
    look: { skin: '#e9c19e', hair: '#bdbdbd', beard: 3, hat: 'crown' } },
  { id: 'celikbiyik', era: 1, name: 'Çelik Bıyık', epithet: 'Siperlerin babası', spec: 'piyade', skill: 'kalkan', unlock: 0, look: { skin: '#e4b893', hair: '#2b2118', beard: 1, hat: 'kepi' } },
  { id: 'topcukurt', era: 1, name: 'Topçu Kurt', epithet: 'Ateş hattının sesi', spec: 'makineli', skill: 'isabet', unlock: 3, look: { skin: '#cf9c76', hair: '#45362a', beard: 2, hat: 'pickel' } },
  { id: 'gok', era: 1, name: 'Gök Süvari', epithet: 'Zırhlı kolun öncüsü', spec: 'zirhli', skill: 'akinci', unlock: 5, look: { skin: '#dcae88', hair: '#6b4a2c', beard: 0, hat: 'cap' } },
  { id: 'sistilkisi', era: 1, name: 'Sis Tilkisi', epithet: 'Haberi önce o alır', spec: 'kale', skill: 'kusatma', unlock: 6, look: { skin: '#efc9a6', hair: '#a8a8a8', beard: 1, hat: 'bicorne' } },
  { id: 'demirduvar', era: 2, name: 'Demir Duvar', epithet: 'Paletlerin komutanı', spec: 'tank', skill: 'kalkan', unlock: 0, look: { skin: '#d9a982', hair: '#2a2420', beard: 0, hat: 'beret' } },
  { id: 'gecesahini', era: 2, name: 'Gece Şahini', epithet: 'Rotorların sesi', spec: 'heli', skill: 'akinci', unlock: 3, look: { skin: '#b9875f', hair: '#16120f', beard: 1, hat: 'pilot' } },
  { id: 'sessizkurt', era: 2, name: 'Sessiz Kurt', epithet: 'Görünmeyen birlik', spec: 'mpiyade', skill: 'isabet', unlock: 5, look: { skin: '#e6bb95', hair: '#4a3626', beard: 2, hat: 'helmetm' } },
  { id: 'firtina', era: 2, name: 'Fırtına', epithet: 'Lojistiğin ustası', spec: 'kale', skill: 'kusatma', unlock: 6, look: { skin: '#d2a07a', hair: '#9a9a9a', beard: 1, hat: 'peaked' } }
];
var SKILLS = {
  kalkan:  { name: 'Kalkan Duvarı', desc: 'Birlik %25 daha az hasar alır.' },
  isabet:  { name: 'İsabetli Atış', desc: 'Okçu ise menzil +1; diğer birliklerde saldırı +%10.' },
  akinci:  { name: 'Akıncı', desc: 'Birlik her tur +1 hücre fazla hareket eder.' },
  kusatma: { name: 'Kuşatma Ustası', desc: 'Şehir ve kalede savunma +%30; şehir ve kaleye saldırı +%25.' }
};
var ENEMY_GENS = [
  { name: 'Kızıl Baron', spec: 'atli', look: { skin: '#e3b28a', hair: '#7a2e1a', beard: 2, hat: 'helm' } },
  { name: 'Yaşlı Kont', spec: 'kilic', look: { skin: '#ecc7a3', hair: '#cfcfcf', beard: 3, hat: 'crown' } },
  { name: 'Kara Şövalye', spec: 'kilic', look: { skin: '#c79a74', hair: '#1b1612', beard: 1, hat: 'helm' } },
  { name: 'Demir Dük', spec: 'atli', look: { skin: '#dcae88', hair: '#3e2b1f', beard: 0, hat: 'kalpak' } },
  { name: 'Gri Kurt', spec: 'okcu', look: { skin: '#cf9e78', hair: '#7a7a7a', beard: 2, hat: 'hood' } },
  { name: 'Aslan Yürek', spec: 'kilic', look: { skin: '#e8bd96', hair: '#b5732e', beard: 2, hat: 'helm' } }
];
var RANK_XP = [0, 120, 320, 650, 1100];
function rankOf(xp) { var r = 1; for (var i = 1; i < RANK_XP.length; i++) if (xp >= RANK_XP[i]) r = i + 1; return r; }

/* sefer ayarları */
var LEVELS = [
  { map: 0, par: 30, limit: 60, aiEco: 0.8, grace: 3 },
  { map: 1, par: 38, limit: 70, aiEco: 0.85, grace: 3 }
];

function rng(seed) { var s = seed >>> 0 || 1; return function () { s ^= s << 13; s >>>= 0; s ^= s >> 17; s ^= s << 5; s >>>= 0; return s / 4294967296; }; }
function hexXY(q, r) { return { x: SQ3 * (q + 0.5 * (r & 1)), y: 1.5 * r }; }
function neighOff(q, r) { return (r & 1) ? [[1, 0], [-1, 0], [0, -1], [1, -1], [0, 1], [1, 1]] : [[1, 0], [-1, 0], [-1, -1], [0, -1], [-1, 1], [0, 1]]; }
function cubeOf(q, r) { var x = q - (r - (r & 1)) / 2; return [x, -x - r, r]; }
function hd(a, b) { var A = cubeOf(a.q, a.r), B = cubeOf(b.q, b.r); return Math.max(Math.abs(A[0] - B[0]), Math.abs(A[1] - B[1]), Math.abs(A[2] - B[2])); }

/* ============================ Oyun ============================ */
function newGame(o) {
  // o: { era, level, player (faction id), generals: [{id, xp}], seed }
  var L = LEVELS[o.level], M = MAPS[L.map], R = rng(o.seed || 7);
  var G = { v: 2, era: o.era, level: o.level, mapIdx: L.map, turn: 1, cur: 0, over: 0, seed: (o.seed || 7) | 0, nextId: 1,
    par: L.par, limit: L.limit, grace: L.grace, navy: M.navy, cells: [], units: [], factions: [], log: [], stats: { kills: 0, lost: 0, cities: 0 } };
  var fidx = {};
  G.factions = M.factions.map(function (id, i) {
    fidx[id] = i;
    var me = id === o.player, up = me ? (o.upgrades || {}) : {};
    return { id: id, gold: 100 + 40 * (up.baslangic || 0), food: 8, iron: 3, alive: true, isPlayer: me, generals: [], eco: me ? 1 + 0.1 * (up.hazine || 0) : L.aiEco, recruited: {}, upg: up };
  });
  M.cells.forEach(function (c, i) {
    var p = hexXY(c[0], c[1]);
    var cell = { i: i, q: c[0], r: c[1], x: p.x, y: p.y, t: c[2], nb: [] };
    if (c[2]) {
      cell.f = c[3] === 'n' ? -1 : fidx[c[3]]; cell.mt = c[4]; cell.lv = c[5]; cell.nm = c[6] || ''; cell.cap = c[7] || 0;
      cell.smith = 0; cell.port = 0;
    } else { cell.f = -1; }
    G.cells.push(cell);
  });
  var byQR = {}; G.cells.forEach(function (c) { byQR[c.q + ',' + c.r] = c.i; });
  G.cells.forEach(function (c) {
    neighOff(c.q, c.r).forEach(function (d) { var j = byQR[(c.q + d[0]) + ',' + (c.r + d[1])]; if (j !== undefined) c.nb.push(j); });
  });
  G.cells.forEach(function (c) { if (c.t) c.coast = c.nb.some(function (j) { return G.cells[j].t === 0; }) ? 1 : 0; });
  // başlangıç binaları: başkentte demirci 1; denizli haritada kıyı başkentinde liman 1
  G.cells.forEach(function (c) {
    if (c.cap && c.f >= 0) { c.smith = 1; if (G.navy && c.coast) c.port = 1; }
  });
  // başlangıç birlikleri
  G.cells.forEach(function (c) {
    if (c.t === 3 && c.cap) { addUnit(G, c.f, 'kilic', c.i, 1); var n = freeNear(G, c, R); if (n >= 0) addUnit(G, c.f, 'okcu', n, 1); }
    else if (c.t === 3) addUnit(G, c.f, R() < 0.5 ? 'kilic' : 'okcu', c.i, 1);
    else if (c.t === 4) addUnit(G, c.f, c.f < 0 ? 'kilic' : 'okcu', c.i, 1);
  });
  // generaller
  var pi = -1;
  G.factions.forEach(function (f, fi) {
    if (f.isPlayer) {
      pi = fi;
      (o.generals || []).forEach(function (g) { f.generals.push({ id: g.id, name: g.name, spec: g.spec, skill: g.skill, xp: g.xp || 0, rank: rankOf(g.xp || 0), unit: 0, rest: 0, look: g.look, gained: 0 }); });
    } else {
      var eg = ENEMY_GENS[(fi + G.seed) % ENEMY_GENS.length];
      var rank = 1 + o.level + (R() < 0.4 ? 1 : 0);
      f.generals.push({ id: 'ai' + fi, name: eg.name, spec: eg.spec, skill: null, xp: RANK_XP[rank - 1], rank: rank, unit: 0, rest: 0, look: eg.look, gained: 0 });
    }
  });
  G.player = pi;
  // yapay zekâ generalleri başkentteki birliğe
  G.factions.forEach(function (f, fi) {
    if (f.isPlayer) return;
    var u = G.units.filter(function (u) { return u.f === fi; }).sort(function (a, b) { return (G.cells[b.c].cap) - (G.cells[a.c].cap); })[0];
    if (u) { f.generals[0].unit = u.id; u.gen = f.generals[0].id; }
  });
  G.cur = pi >= 0 ? pi : 0;
  startTurn(G, G.cur, true);
  return G;
}
function freeNear(G, c, R) {
  var opts = c.nb.filter(function (j) { var n = G.cells[j]; return n.t && n.f === c.f && !unitAt(G, j); });
  return opts.length ? opts[Math.floor(R() * opts.length)] : -1;
}
function addUnit(G, f, type, ci, lvl) {
  var u = { id: G.nextId++, f: f, type: type, c: ci, hp: 100, lvl: lvl || 1, mp: 0, acted: true, kills: 0, gen: 0, emb: 0 };
  G.units.push(u); return u;
}
function unitAt(G, ci) { for (var i = 0; i < G.units.length; i++) if (G.units[i].c === ci) return G.units[i]; return null; }
function unitById(G, id) { for (var i = 0; i < G.units.length; i++) if (G.units[i].id === id) return G.units[i]; return null; }
function genOf(G, u) { if (!u || !u.gen || u.f < 0) return null; var gs = G.factions[u.f].generals; for (var i = 0; i < gs.length; i++) if (gs[i].id === u.gen) return gs[i]; return null; }
function isNaval(u) { return UT[u.type].naval; }
function unitMv(G, u) {
  if (u.emb) return TRANSPORT.mv + (G.cells[u.c] && portBonus(G, u) ? 1 : 0);
  var g = genOf(G, u); return UT[u.type].mv + (g && g.skill === 'akinci' ? 1 : 0);
}
function portBonus(G, u) { return 0; }
function unitRange(G, u) {
  var g = genOf(G, u); var r = UT[u.type].rng;
  if (r > 1 && g && g.skill === 'isabet') r++;
  return r;
}

/* ---------- ekonomi ---------- */
function income(G, fi) {
  var g = 0, food = 0, iron = 0, up = 0;
  G.cells.forEach(function (c) {
    if (c.f !== fi || !c.t) return;
    if (c.t === 3) { g += CITY_INCOME[c.lv]; food += 1; iron += c.smith; g += c.port * 2; }
    if (c.t === 2) food += FARM_FOOD[c.lv] + upg(G, fi, 'tarim');
  });
  G.units.forEach(function (u) { if (u.f === fi && !UT[u.type].tower) up += 1; });
  var e = G.factions[fi].eco;
  return { g: Math.round(g * e), food: food, iron: iron, up: up };
}
function startTurn(G, fi, first) {
  var f = G.factions[fi];
  f.recruited = {}; f.trades = 0; f.towerBuilt = 0;
  if (!first) {
    var inc = income(G, fi);
    f.gold += inc.g; f.iron += inc.iron; f.food += inc.food - inc.up;
    if (f.food < 0) {
      f.food = 0;
      G.units.forEach(function (u) { if (u.f === fi) u.hp = Math.max(1, u.hp - 8); });
      G.log.push({ t: 'starve', f: fi });
    }
  }
  G.units.forEach(function (u) {
    if (u.f !== fi) return;
    var c = G.cells[u.c];
    if (u.build && !first) {
      u.build--;
      if (!u.build) G.log.push({ t: 'tower', u: u.id, c: u.c, f: fi });
    } else if (!first && !u.emb && c.f === fi) {
      var heal = c.t === 3 ? 15 + 3 * c.lv : c.t === 4 ? 18 : 6;
      if (genOf(G, u)) heal += 10;
      u.hp = Math.min(100, u.hp + heal);
    }
    u.mp = unitMv(G, u); u.acted = !!UT[u.type].tower; u.moved = false; u.chase = 0;
  });
  f.generals.forEach(function (g) { if (g.rest && g.rest <= G.turn) g.rest = 0; });
}
function endTurn(G) {
  // sıradaki yaşayan ülke
  var n = G.factions.length, i = G.cur;
  for (var k = 0; k < n; k++) {
    i = (i + 1) % n;
    if (i === (G.player >= 0 ? G.player : 0)) G.turn++;
    if (G.factions[i].alive) break;
  }
  G.cur = i;
  if (G.player >= 0 && G.turn > G.limit && !G.over && !G.endless) { G.over = -2; return; }
  startTurn(G, i);
}

/* ---------- hareket ---------- */
function enemyAdj(G, ci, fi) {
  var c = G.cells[ci];
  for (var k = 0; k < c.nb.length; k++) { var u = unitAt(G, c.nb[k]); if (u && u.f !== fi) return true; }
  return false;
}
/* ulaşılabilir hücreler: {ci: {cost, prev}} */
function reach(G, u) {
  var res = {}, start = u.c, fi = u.f, naval = isNaval(u);
  res[start] = { cost: 0, prev: -1, emb: u.emb };
  if (u.mp <= 0) return res;
  var q = [start];
  while (q.length) {
    q.sort(function (a, b) { return res[a].cost - res[b].cost; });
    var ci = q.shift(), cur = res[ci], c = G.cells[ci];
    if (cur.stop) continue;
    for (var k = 0; k < c.nb.length; k++) {
      var j = c.nb[k], n = G.cells[j];
      var other = unitAt(G, j), pass = false;
      if (other && other.id !== u.id) {
        if (other.f !== fi) continue;
        pass = true; // kendi birliğinin içinden geçilebilir ama orada durulamaz
      }
      var cost, emb = cur.emb, stop = false;
      if (naval) {
        if (n.t === 0) cost = 1;
        else if (n.t === 3 && n.f === fi && n.port) { cost = 1; stop = true; }
        else continue;
      } else if (!cur.emb) {
        if (n.t === 0) {
          // denize sadece limanlı kendi şehrinden binilir
          if (!(c.t === 3 && c.f === fi && c.port) || !G.navy || pass) continue;
          cost = u.mp; emb = 1; stop = true;
          if (ci !== start) continue; // binmek bütün hareketi kullanır ve turun başında olur
        } else {
          cost = n.mt ? 2 : 1;
          if (n.mt && cur.cost + cost > u.mp && cur.cost < u.mp) cost = u.mp - cur.cost; // dağa girmek hareketi bitirir
          if (enemyAdj(G, j, fi) && !UT[u.type].pursue) stop = true;
        }
      } else {
        // gemideyken
        if (n.t === 0) cost = 1;
        else { cost = 99; emb = 0; stop = true; if (other) continue; } // karaya çıkış
      }
      var nc = cur.cost + (cost === 99 ? 0 : cost);
      if (cost !== 99 && nc > u.mp) continue;
      if (cost === 99 && cur.cost >= u.mp && ci !== start) { /* hareket kalmadıysa yine de inebilir */ }
      if (pass && stop) continue;
      if (!res[j] || res[j].cost > nc) { res[j] = { cost: cost === 99 ? 999 : nc, prev: ci, emb: emb, stop: stop, pass: pass }; if (!stop) q.push(j); }
    }
  }
  return res;
}
function pathTo(res, ci) { var p = [ci]; while (res[p[0]].prev >= 0) p.unshift(res[p[0]].prev); return p; }

function moveUnit(G, u, ci) {
  var res = reach(G, u);
  if (!res[ci] || res[ci].pass || ci === u.c || unitAt(G, ci)) return null;
  var path = pathTo(res, ci), from = u.c;
  var r = res[ci];
  // yol üzerindeki ele geçirmeler
  for (var k = 1; k < path.length; k++) {
    var c = G.cells[path[k]];
    if (c.t && c.f !== u.f && !isNaval(u) && !(res[path[k]].emb) && !res[path[k]].pass) capture(G, c, u.f);
  }
  u.c = ci;
  u.emb = r.emb ? 1 : 0;
  u.mp = r.cost >= 999 || r.stop ? 0 : Math.max(0, u.mp - r.cost);
  if (r.emb && !res[from].emb) u.mp = 0;
  u.moved = true;
  G.log.push({ t: 'move', u: u.id, path: path, f: u.f, emb: u.emb });
  return path;
}
function capture(G, c, fi) {
  var from = c.f;
  if (from === fi) return;
  c.f = fi;
  if (c.t === 3) { c.lv = Math.max(1, c.lv - 1); c.smith = Math.min(c.smith, Math.max(0, c.lv - 1)); }
  if (c.t === 2 && c.lv > 1) c.lv = 1;
  if (c.t === 4 && c.lv > 1) c.lv--;
  if (fi === G.player && c.t === 3) G.stats.cities++;
  G.log.push({ t: 'capture', c: c.i, from: from, to: fi });
  checkElim(G, from);
  checkWin(G);
}
var WIN_SHARE = 0.6; // şehirlerin %60'ı ya da bütün rakiplerin yıkılması
function cityShare(G, fi) {
  var all = 0, mine = 0;
  G.cells.forEach(function (c) { if (c.t === 3) { all++; if (c.f === fi) mine++; } });
  return { all: all, mine: mine, need: Math.ceil(all * WIN_SHARE) };
}
function checkWin(G) {
  if (G.over || G.player < 0 || G.endless) return; // fetih modunda %60 yetmez, herkes yıkılmalı
  var s = cityShare(G, G.player);
  if (s.mine >= s.need) G.over = 1;
}
function checkElim(G, fi) {
  if (fi < 0) return;
  var f = G.factions[fi];
  if (!f.alive) return;
  var has = G.cells.some(function (c) { return c.t === 3 && c.f === fi; });
  if (has) return;
  f.alive = false;
  G.units = G.units.filter(function (u) { return u.f !== fi; });
  G.cells.forEach(function (c) { if (c.f === fi) c.f = -1; });
  G.log.push({ t: 'elim', f: fi });
  if (fi === G.player) G.over = -1;
  else if (G.player >= 0 && G.factions.every(function (x, i) { return i === G.player || !x.alive; })) G.over = 1;
}

/* ---------- savaş ---------- */
function stat(G, u, kind, vs, cell, attacking) {
  var T = UT[u.type];
  var base = u.emb ? (kind === 'atk' ? T.atk * 0.6 : TRANSPORT.def) : T[kind];
  if (u.build && kind === 'def') base *= 0.5; // inşaat yarı savunmalı
  var m = (1 + 0.15 * (u.lvl - 1)) * (1 + (u.type === 'kule' ? 0.08 : 0.06) * upg(G, u.f, u.type));
  if (!u.emb && vs && !vs.emb && T.beats === vs.type) m *= ADV;
  var g = genOf(G, u);
  if (g) {
    m *= genMul(g);
    if (g.spec === u.type) m *= specMul(g);
    if (g.skill === 'isabet' && kind === 'atk' && T.rng < 2) m *= 1.1;
    if (g.skill === 'kusatma' && cell && (cell.t === 3 || cell.t === 4)) m *= kind === 'def' && !attacking ? 1.3 : (kind === 'atk' && attacking ? 1.25 : 1);
    if (g.spec === 'kale' && cell && (cell.t === 3 || cell.t === 4)) m *= specMul(g);
  }
  m *= 0.45 + 0.55 * u.hp / 100;
  return base * m;
}
function genMul(g) { return 1.25 + 0.05 * g.rank; }   // 1. rütbe +%30 … 5. rütbe +%50
function specMul(g) { return 1.15 + 0.05 * g.rank; }  // uzmanlık ek +%20 … +%40
function terrainMul(G, c, u) {
  if (u.emb || isNaval(u) || c.t === 0) return 1;
  var m = 1;
  if (c.mt) m *= 1.3;
  if (c.t === 3) m *= 1 + 0.08 * c.lv;
  if (c.t === 4) m *= 1 + CASTLE_DEF[c.lv];
  return m;
}
function canAttack(G, a, d) {
  if (!d || d.f === a.f || a.acted || UT[a.type].tower) return false;
  var ca = G.cells[a.c], cd = G.cells[d.c], dist = hd(ca, cd);
  if (dist < 1 || dist > unitRange(G, a)) return false;
  var ranged = UT[a.type].rng > 1;
  // kara yakın dövüş birliği gemiye saldıramaz; nakliyedeki birlik sadece karaya çıkarma saldırısı yapar
  if ((isNaval(d) || d.emb) && !isNaval(a) && !ranged) return false;
  if (a.emb && !cd.t) return false;
  return true;
}
function predict(G, a, d) {
  var ca = G.cells[a.c], cd = G.cells[d.c], dist = hd(ca, cd);
  var A = stat(G, a, 'atk', d, cd, true);
  var D = stat(G, d, 'def', a, cd, false) * terrainMul(G, cd, d);
  var dmg = 24 * Math.pow(A / Math.max(1, D), 0.7) * (dist > 1 ? 0.85 : 1);
  var gd = genOf(G, d); if (gd && gd.skill === 'kalkan') dmg *= 0.75;
  dmg = Math.max(4, dmg);
  var left = d.hp - dmg, back = 0;
  if (left > 0) {
    var canBack = !d.emb && !d.build && (dist <= unitRange(G, d)) && !(isNaval(a) && !isNaval(d) && UT[d.type].rng < 2) && !((isNaval(d)) && !isNaval(a) && false);
    if (dist > 1 && UT[d.type].rng < 2) canBack = false;
    if (canBack) {
      var dd = Object.assign({}, d, { hp: left });
      var A2 = stat(G, dd, 'atk', a, ca, true);
      // nakliyeden saldıran birlik kendi savunmasının %70'iyle karşılık yer
      var D2 = a.emb ? stat(G, Object.assign({}, a, { emb: 0 }), 'def', d, ca, false) * 0.7 : stat(G, a, 'def', d, ca, false) * terrainMul(G, ca, a);
      back = 24 * 0.6 * Math.pow(A2 / Math.max(1, D2), 0.7);
      var ga = genOf(G, a); if (ga && ga.skill === 'kalkan') back *= 0.75;
      back = Math.max(2, back);
    }
  }
  return { dmg: dmg, back: back, kill: left <= 0, die: left > 0 && a.hp - back <= 0 };
}
function attack(G, a, d, R) {
  var p = predict(G, a, d), r = R ? (0.9 + 0.2 * R()) : 1;
  var dmg = Math.round(p.dmg * r), back = Math.round(p.back * (R ? (0.9 + 0.2 * R()) : 1));
  var ca = G.cells[a.c], cd = G.cells[d.c];
  d.hp -= dmg;
  var killD = d.hp <= 0, killA = false;
  if (killD) back = 0;
  else if (back) { a.hp -= back; killA = a.hp <= 0; }
  a.acted = true; a.mp = 0;
  var ga = genOf(G, a), gdd = genOf(G, d);
  if (ga) ga.gained += 5;
  var ev = { t: 'attack', a: a.id, d: d.id, ac: a.c, dc: d.c, dmg: dmg, back: back, killD: killD, killA: killA, af: a.f, df: d.f, ranged: hd(ca, cd) > 1, naval: isNaval(a), atype: a.type, dtype: d.type, aemb: a.emb, demb: d.emb, ahp: a.hp, dhp: d.hp };
  G.log.push(ev);
  if (killD) { removeUnit(G, d); a.kills++; if (ga) ga.gained += 15; if (a.kills % 2 === 0 && a.lvl < 3) a.lvl++; if (a.f === G.player) G.stats.kills++; }
  if (killA) removeUnit(G, a);
  // atlı takibi: düşmanı yok eden atlı 1 hücre daha hareket edebilir (saldıramaz)
  if (killD && !killA && UT[a.type].pursue && !a.emb) { a.acted = false; a.mp = Math.max(a.mp, 1); a.chase = (a.chase || 0) + 1; G.log.push({ t: 'chase', u: a.id, c: a.c }); }
  return ev;
}
function removeUnit(G, u) {
  G.units = G.units.filter(function (x) { return x.id !== u.id; });
  var g = genOf(G, u);
  if (g) { g.unit = 0; g.rest = G.turn + 3; G.log.push({ t: 'wounded', f: u.f, gen: g.id, c: u.c }); }
  if (UT[u.type].tower) G.log.push({ t: 'towerDown', c: u.c, f: u.f });
  if (u.f === G.player) G.stats.lost++;
}

/* ---------- inşa ve asker alma ---------- */
function canPay(f, g, i) { return f.gold >= g && f.iron >= (i || 0); }
function pay(f, g, i) { f.gold -= g; f.iron -= (i || 0); }
function upgradeInfo(G, c, what) {
  // {cost:{g,i}, ok:bool, why:string, next:lv}
  var f = G.factions[c.f];
  if (what === 'city') { if (c.lv >= 6) return null; return mk(CITY_COST[c.lv + 1], CITY_IRON[c.lv + 1], c.lv + 1); }
  if (what === 'castle') { if (c.lv >= 4) return null; return mk(CASTLE_COST[c.lv + 1], CASTLE_IRON[c.lv + 1], c.lv + 1); }
  if (what === 'farm') { if (c.lv >= 2) return null; return mk(FARM_COST, 0, 2); }
  if (what === 'smith') {
    if (c.smith >= 3) return null;
    var r = mk(SMITH_COST[c.smith + 1], SMITH_IRON[c.smith + 1], c.smith + 1);
    if (c.lv < c.smith + 2) { r.ok = false; r.why = 'Şehir seviyesi ' + (c.smith + 2) + ' olmalı'; }
    return r;
  }
  if (what === 'port') {
    if (!G.navy || !c.coast || c.port >= 2) return null;
    var p = mk(PORT_COST[c.port + 1], PORT_IRON[c.port + 1], c.port + 1);
    if (c.port === 1 && c.lv < 3) { p.ok = false; p.why = 'Şehir seviyesi 3 olmalı'; }
    return p;
  }
  return null;
  function mk(g, i, nx) { var ok = canPay(f, g, i); return { g: g, i: i, ok: ok, why: ok ? '' : 'Yetersiz kaynak', next: nx }; }
}
function upgrade(G, ci, what) {
  var c = G.cells[ci], f = G.factions[c.f], u = upgradeInfo(G, c, what);
  if (!u || !u.ok) return false;
  pay(f, u.g, u.i);
  if (what === 'smith') c.smith++; else if (what === 'port') c.port++; else c.lv++;
  G.log.push({ t: 'build', c: ci, what: what, f: c.f });
  return true;
}
function recruitInfo(G, c, type) {
  var f = G.factions[c.f], T = UT[type];
  var r = { g: T.cost.g, i: T.cost.i, ok: true, why: '' };
  if (c.t !== 3 && c.t !== 4) { r.ok = false; r.why = 'Şehirde ya da kalede'; return r; }
  if (c.t === 4 && T.naval) { r.ok = false; r.why = 'Kalede gemi olmaz'; return r; }
  if (T.req === 'smith' && c.t === 3 && c.smith < 1) { r.ok = false; r.why = 'Demirci gerekir'; }
  if (T.req === 'smith' && c.t === 4 && c.lv < 3) { r.ok = false; r.why = 'Kale seviyesi 3 olmalı'; }
  if (T.req === 'port' && c.port < 1) { r.ok = false; r.why = 'Liman gerekir'; }
  if (T.naval && !G.navy) { r.ok = false; r.why = 'Bu haritada deniz yok'; }
  r.at = spawnCell(G, c, T.naval);
  if (r.at < 0) { r.ok = false; r.why = r.why || (T.naval ? 'Liman dolu' : 'Şehir ve çevresi dolu'); }
  if (f.recruited[c.i]) { r.ok = false; r.why = r.why || 'Bu tur asker alındı'; }
  if (armySize(G, c.f) >= armyCap(G, c.f)) { r.ok = false; r.why = r.why || 'Ordu sınırı dolu'; }
  if (r.ok && !canPay(f, r.g, r.i)) { r.ok = false; r.why = 'Yetersiz kaynak'; }
  return r;
}
/* yeni birlik şehrin içine, doluysa bitişik boş kendi hücresine (gemi: şehir ya da bitişik deniz) */
function spawnCell(G, c, naval) {
  if (!unitAt(G, c.i)) return c.i;
  for (var k = 0; k < c.nb.length; k++) {
    var n = G.cells[c.nb[k]];
    if (unitAt(G, n.i)) continue;
    if (naval ? n.t === 0 : (n.t && n.f === c.f)) return n.i;
  }
  return -1;
}
function recruit(G, ci, type) {
  var c = G.cells[ci], f = G.factions[c.f], r = recruitInfo(G, c, type);
  if (!r.ok) return null;
  pay(f, r.g, r.i);
  var lvl = UT[type].naval ? (c.port >= 2 ? 2 : 1) : (c.smith >= 3 ? 3 : c.smith >= 2 ? 2 : 1);
  var u = addUnit(G, c.f, type, r.at, lvl);
  f.recruited[ci] = 1;
  G.log.push({ t: 'recruit', u: u.id, c: ci, f: c.f });
  return u;
}
function assignGeneral(G, fi, gid, uid) {
  var f = G.factions[fi], g = f.generals.filter(function (x) { return x.id === gid; })[0], u = unitById(G, uid);
  if (!g || !u || u.f !== fi || g.unit || g.rest || u.gen || UT[u.type].tower) return false;
  g.unit = u.id; u.gen = g.id;
  G.log.push({ t: 'assign', f: fi, gen: gid, u: uid });
  return true;
}
function recallGeneral(G, fi, uid) {
  var u = unitById(G, uid), g = genOf(G, u);
  if (!g) return false;
  u.gen = 0; g.unit = 0; g.rest = G.turn + 1;
  return true;
}
function towerInfo(G, c, fi) {
  var f = G.factions[fi], T = UT.kule, r = { g: T.cost.g, i: T.cost.i, ok: true, why: '' };
  if (c.t !== 1 || c.f !== fi) { r.ok = false; r.why = 'Sadece kendi boş arazinde'; return r; }
  if (unitAt(G, c.i)) { r.ok = false; r.why = 'Hücre dolu'; }
  else if (f.towerBuilt) { r.ok = false; r.why = 'Her tur bir kule'; }
  else if (!canPay(f, r.g, r.i)) { r.ok = false; r.why = 'Yetersiz kaynak'; }
  return r;
}
function buildTower(G, ci, fi) {
  var c = G.cells[ci], r = towerInfo(G, c, fi);
  if (!r.ok) return null;
  pay(G.factions[fi], r.g, r.i);
  var u = addUnit(G, fi, 'kule', ci, 1);
  u.build = TOWER_TURNS; u.hp = 100;
  G.factions[fi].towerBuilt = 1;
  G.log.push({ t: 'recruit', u: u.id, c: ci, f: fi, tower: 1 });
  return u;
}
function tradeInfo(G, fi, id) {
  var f = G.factions[fi], t = TRADES.filter(function (x) { return x.id === id; })[0], ok = true, why = '';
  var hasCap = G.cells.some(function (c) { return c.cap && c.f === fi; });
  if (!hasCap) { ok = false; why = 'Başkent gerekir'; }
  else if ((f.trades || 0) >= TRADE_MAX) { ok = false; why = 'Bu tur takas hakkı bitti'; }
  else if ((t.give.gold || 0) > f.gold || (t.give.food || 0) > f.food || (t.give.iron || 0) > f.iron) { ok = false; why = 'Yetersiz kaynak'; }
  return { t: t, ok: ok, why: why };
}
function trade(G, fi, id) {
  var r = tradeInfo(G, fi, id); if (!r.ok) return false;
  var f = G.factions[fi], t = r.t;
  f.gold += (t.get.gold || 0) - (t.give.gold || 0);
  f.food += (t.get.food || 0) - (t.give.food || 0);
  f.iron += (t.get.iron || 0) - (t.give.iron || 0);
  f.trades = (f.trades || 0) + 1;
  G.log.push({ t: 'trade', f: fi, id: id });
  return true;
}
function freeGenerals(G, fi) { return G.factions[fi].generals.filter(function (g) { return !g.unit && !g.rest; }); }
function starsFor(G) { return G.turn <= G.par ? 3 : G.turn <= Math.round(G.par * 1.4) ? 2 : 1; }

/* ============================ Yapay zekâ ============================ */
/* hedefe uzaklık haritası (kara + liman üzerinden deniz) */
function distMap(G, fi, targets, naval) {
  var D = {}, q = [];
  targets.forEach(function (t) { D[t] = 0; q.push(t); });
  while (q.length) {
    q.sort(function (a, b) { return D[a] - D[b]; });
    var ci = q.shift(), c = G.cells[ci];
    for (var k = 0; k < c.nb.length; k++) {
      var j = c.nb[k], n = G.cells[j], w;
      if (naval) { if (n.t !== 0 && !(n.t === 3 && n.f === fi && n.port)) continue; w = 1; }
      else {
        if (n.t === 0) { if (!G.navy) continue; w = 0.6; }
        else w = n.mt ? 2 : 1;
        if (n.t === 0 && c.t !== 0 && c.t) w += 0; // inişte ek maliyet yok
        if (c.t === 0 && n.t && !(n.t === 3 && n.f === fi && n.port)) w += 0; // kıyıya çıkış
        if (n.t && c.t === 0) w += 0;
        if (n.t === 0 && c.t && !(c.t === 3 && c.f === fi && c.port)) w += 6; // limansız binmek zor
      }
      var nd = D[ci] + w;
      if (D[j] === undefined || nd < D[j]) { D[j] = nd; q.push(j); }
    }
  }
  return D;
}

function* aiTurn(G, fi, R) {
  var f = G.factions[fi];
  R = R || Math.random;
  // 1) ekonomi
  aiEconomy(G, fi);
  yield 'eco';
  // 2) generaller
  freeGenerals(G, fi).forEach(function (g) {
    var best = null;
    G.units.forEach(function (u) { if (u.f === fi && !u.gen && !u.emb && (!best || (u.type === g.spec) - (best.type === g.spec) > 0 || u.hp > best.hp)) best = u; });
    if (best) assignGeneral(G, fi, g.id, best.id);
  });
  // 3) birlikler
  var units = G.units.filter(function (u) { return u.f === fi; });
  // hedefler
  var tgtCities = G.cells.filter(function (c) { return c.t === 3 && c.f !== fi; }).map(function (c) { return c.i; });
  var castles = G.cells.filter(function (c) { return c.t === 4 && c.f !== fi; }).map(function (c) { return c.i; });
  var DM = distMap(G, fi, tgtCities.concat(castles), false);
  var DMn = G.navy ? distMap(G, fi, G.units.filter(function (u) { return u.f !== fi && (u.emb || isNaval(u) || G.cells[u.c].coast); }).map(function (u) { return u.c; }), true) : {};
  units.sort(function (a, b) { return (DM[a.c] || 99) - (DM[b.c] || 99); });
  for (var k = 0; k < units.length; k++) {
    var u = units[k];
    if (!unitById(G, u.id) || G.over) continue;
    var did = aiUnit(G, u, DM, DMn, R);
    if (did) yield did;
  }
}
function aiEconomy(G, fi) {
  var f = G.factions[fi], inc = income(G, fi);
  var cities = G.cells.filter(function (c) { return c.t === 3 && c.f === fi; });
  var castles = G.cells.filter(function (c) { return c.t === 4 && c.f === fi; });
  var myUnits = G.units.filter(function (u) { return u.f === fi && !UT[u.type].tower; }).length;
  var foodNet = inc.food - inc.up;
  var threatened = function (c) { return G.units.some(function (u) { return u.f !== fi && u.f >= 0 && hd(G.cells[u.c], c) <= 2; }); };
  // asker: yiyecek ve sınır dahilinde
  var cap = armyCap(G, fi);
  var order = cities.concat(castles.filter(threatened)).sort(function (a, b) { return threatened(b) - threatened(a) || b.lv - a.lv; });
  order.forEach(function (c) {
    if (myUnits >= cap) return;
    if (foodNet < 0 && f.food < 3 && !threatened(c)) return;
    var near = { kilic: 0, okcu: 0, atli: 0 };
    G.units.forEach(function (u) { if (u.f !== fi && u.f >= 0 && hd(G.cells[u.c], c) <= 4 && near[u.type] !== undefined) near[u.type]++; });
    var want = near.atli > near.okcu && near.atli > near.kilic ? 'kilic' : near.kilic > near.okcu ? 'okcu' : (c.smith ? 'atli' : 'kilic');
    if (!recruitInfo(G, c, want).ok) want = recruitInfo(G, c, 'kilic').ok ? 'kilic' : 'okcu';
    var keep = threatened(c) ? 0 : 10;
    if (recruitInfo(G, c, want).ok && f.gold - UT[want].cost.g >= keep) { recruit(G, c.i, want); myUnits++; foodNet--; }
  });
  // gemi: denizli haritada ara sıra
  if (G.navy && f.gold > 120) {
    var ports = cities.filter(function (c) { return c.port; });
    var ships = G.units.filter(function (u) { return u.f === fi && isNaval(u); }).length;
    if (ports.length && ships < 1) { var pc = ports[0]; if (recruitInfo(G, pc, 'kadirga').ok) recruit(G, pc.i, 'kadirga'); }
  }
  // ticaret
  if (foodNet < 0 && f.food + foodNet < 2) { trade(G, fi, 'buyFood'); }
  if (f.food > 40 && f.gold < 40) trade(G, fi, 'sellFood');
  if (f.iron < 2 && f.gold > 160) trade(G, fi, 'buyIron');
  // kule: tehdit altındaki şehre komşu boş araziye
  if (f.gold > 90 && !f.towerBuilt) {
    var spot = null;
    G.cells.forEach(function (c) {
      if (c.t !== 1 || c.f !== fi || unitAt(G, c.i)) return;
      var nearCity = c.nb.some(function (j) { var n = G.cells[j]; return n.f === fi && (n.t === 3 || n.t === 4); });
      var front = G.units.some(function (u) { return u.f !== fi && u.f >= 0 && hd(G.cells[u.c], c) <= 2; });
      if (nearCity && front && (!spot || c.mt > spot.mt)) spot = c;
    });
    if (spot) buildTower(G, spot.i, fi);
  }
  // yiyecek: tarla geliştir
  if (foodNet < 1) {
    G.cells.forEach(function (c) { if (c.f === fi && c.t === 2 && c.lv < 2 && f.gold >= FARM_COST + 10) upgrade(G, c.i, 'farm'); });
  }
  // başkent ve şehirler
  cities.sort(function (a, b) { return b.cap - a.cap || b.lv - a.lv; });
  cities.forEach(function (c) {
    var ui = upgradeInfo(G, c, 'city');
    if (ui && ui.ok && f.gold - ui.g >= 40 && c.lv < 5) upgrade(G, c.i, 'city');
    var si = upgradeInfo(G, c, 'smith');
    if (c.cap && si && si.ok && f.gold - si.g >= 40) upgrade(G, c.i, 'smith');
    if (G.navy && c.coast && !c.port && f.gold > 120 && !cities.some(function (x) { return x.port; })) upgrade(G, c.i, 'port');
  });
  G.cells.forEach(function (c) {
    if (c.f === fi && c.t === 4 && threatened(c)) { var ci = upgradeInfo(G, c, 'castle'); if (ci && ci.ok && f.gold - ci.g >= 20) upgrade(G, c.i, 'castle'); }
  });
}
function aiUnit(G, u, DM, DMn, R) {
  var fi = u.f, c0 = G.cells[u.c];
  if (UT[u.type].tower) return null;
  var res = reach(G, u);
  // önce boş düşman şehri / kalesi: içeri gir
  var grab = takeEmpty(G, u, res);
  if (grab !== null) {
    moveUnit(G, u, grab);
    res = reach(G, u); c0 = G.cells[u.c];
    var t2 = null;
    G.units.forEach(function (e) { if (canAttack(G, u, e)) { var p = predict(G, u, e); var v = p.dmg - p.back; if (!t2 || v > t2.v) t2 = { v: v, e: e }; } });
    if (t2 && t2.v > 0) attack(G, u, t2.e, R);
    return 'move';
  }
  // savunma: tehdit altındaki şehirde tek birlik ise yerinde kal ve sadece saldır
  var hold = (c0.t === 3 || c0.t === 4) && c0.f === fi && G.units.some(function (e) { return e.f !== fi && e.f >= 0 && !e.emb && hd(G.cells[e.c], c0) <= (c0.cap ? 3 : 2); }) && u.hp > 20;
  var best = null;
  var cand = hold ? [u.c] : Object.keys(res).map(Number);
  var enemies = G.units.filter(function (e) { return e.f !== fi; });
  cand.forEach(function (ci) {
    if (ci !== u.c && unitAt(G, ci)) return;
    var r = res[ci]; if (!r) return;
    if (r.emb && !u.emb) return; // saldırı adayı olarak gemi binişini sayma
    var save = u.c, saveEmb = u.emb; u.c = ci; u.emb = r.emb ? 1 : 0;
    enemies.forEach(function (e) {
      if (!canAttack(G, Object.assign({}, u, { acted: false }), e)) return;
      var p = predict(G, u, e);
      var ec = G.cells[e.c];
      var val = p.dmg * (e.f < 0 ? 0.7 : UT[e.type].tower ? 0.6 : 1) - p.back * 1.1 + (p.kill ? 35 + (ec.t === 3 ? 45 : ec.t === 4 ? 25 : 0) : 0) - (p.die ? 60 : 0);
      if (e.f === G.player && G.turn < G.grace) return;
      if (genOf(G, e)) val += 8;
      val -= r.cost * 0.5;
      if (!best || val > best.val) best = { val: val, ci: ci, e: e };
    });
    u.c = save; u.emb = saveEmb;
  });
  if (best && best.val > 6) {
    if (best.ci !== u.c) moveUnit(G, u, best.ci);
    var e = unitById(G, best.e.id);
    if (e && canAttack(G, u, e)) attack(G, u, e, R);
    // atlı zinciri: öldürdükçe yeniden saldır
    for (var z = 0; z < 6 && unitById(G, u.id) && !u.acted; z++) {
      var nx = null;
      G.units.forEach(function (e2) { if (canAttack(G, u, e2)) { var p2 = predict(G, u, e2); var v2 = p2.dmg - p2.back * 1.2 + (p2.kill ? 30 : 0) - (p2.die ? 60 : 0); if (!nx || v2 > nx.v) nx = { v: v2, e: e2 }; } });
      if (!nx || nx.v < 8) break;
      attack(G, u, nx.e, R);
    }
    // atlı takibi: boşalan şehre gir
    if (unitById(G, u.id) && u.chase && u.mp > 0) { var g2 = takeEmpty(G, u, reach(G, u)); if (g2 !== null) moveUnit(G, u, g2); }
    return 'attack';
  }
  if (hold) return null;
  // zayıf birlik: kendi şehrine çekil
  if (u.hp < 40 && !u.emb && !isNaval(u)) {
    var safe = null;
    Object.keys(res).map(Number).forEach(function (ci) { var c = G.cells[ci]; if ((ci === u.c || !unitAt(G, ci)) && c.f === fi && (c.t === 3 || c.t === 4) && (!safe || res[ci].cost < res[safe].cost)) safe = ci; });
    if (safe !== null && safe !== u.c) { moveUnit(G, u, safe); return 'move'; }
    if (safe === u.c) return null;
  }
  // ilerle
  var D = isNaval(u) ? DMn : DM;
  var bestM = null, here = D[u.c] !== undefined ? D[u.c] : 999;
  Object.keys(res).map(Number).forEach(function (ci) {
    if (ci === u.c || unitAt(G, ci)) return;
    var d = D[ci] !== undefined ? D[ci] : 999;
    var c = G.cells[ci];
    var sc = d - (c.t && c.f !== fi ? 0.6 : 0) - (c.t === 3 && c.f !== fi ? 3 : 0) + (R() * 0.3);
    if (!isNaval(u) && !res[ci].emb && enemyAdj(G, ci, fi) && u.hp < 60) sc += 1.5;
    if (!bestM || sc < bestM.sc) bestM = { sc: sc, ci: ci };
  });
  // şehri boş bırakma: başkentteyse ve başka koruyucu yoksa bekle
  if (c0.t === 3 && c0.cap && c0.f === fi && G.units.filter(function (x) { return x.f === fi && hd(G.cells[x.c], c0) <= 1; }).length <= 1 && R() < 0.7) return null;
  if (bestM && bestM.sc < here - 0.1) { moveUnit(G, u, bestM.ci); return 'move'; }
  return null;
}

function takeEmpty(G, u, res) {
  if (isNaval(u)) return null;
  var best = null;
  Object.keys(res).map(Number).forEach(function (ci) {
    var c = G.cells[ci], r = res[ci];
    if (ci === u.c || r.pass || r.emb || unitAt(G, ci) || c.f === u.f) return;
    if (c.t !== 3 && c.t !== 4) return;
    var sc = (c.t === 3 ? 10 : 5) + (c.cap ? 5 : 0) - r.cost;
    if (!best || sc > best.sc) best = { sc: sc, ci: ci };
  });
  return best ? best.ci : null;
}
/* oyuncunun yerine yapay zekâ (testler için) */
function runAI(G, fi, R) { var it = aiTurn(G, fi, R); while (!it.next().done) { } }

if (typeof module !== 'undefined') module.exports = {
  setMaps: function (m) { MAPS = m; }, newGame: newGame, endTurn: endTurn, runAI: runAI, aiTurn: aiTurn, reach: reach, moveUnit: moveUnit,
  attack: attack, canAttack: canAttack, predict: predict, recruit: recruit, upgrade: upgrade, upgradeInfo: upgradeInfo, recruitInfo: recruitInfo,
  assignGeneral: assignGeneral, income: income, armyCap: armyCap, armySize: armySize, UPGRADES: UPGRADES, cityShare: cityShare, buildTower: buildTower, trade: trade, tradeInfo: tradeInfo, towerInfo: towerInfo, unitAt: unitAt, GENERALS: GENERALS, LEVELS: LEVELS, UT: UT, starsFor: starsFor, rng: rng
};
