/* ===== Sancak arayüz ===== */
(function () {
'use strict';
var $ = function (s, r) { return (r || document).querySelector(s); };
var esc = function (s) { return String(s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); };
var I = ART.UI;

/* ---------------- kayıt ---------------- */
var SAVE_KEY = 'sancak-v2';
var GAME_KEY = 'sancak-v2-game';
var save = { medals: 0, stars: {}, gx: {}, sound: true, tut: false, speed: 1 };
function load(k) { try { var r = localStorage.getItem(k); return r ? JSON.parse(r) : null; } catch (e) { return null; } }
function store(k, v) { try { if (v === null) localStorage.removeItem(k); else localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} }
(function () { var o = load(SAVE_KEY); if (o) for (var k in o) save[k] = o[k]; })();
function persist() { store(SAVE_KEY, save); }
function eraStars(e) { var n = 0; for (var l = 0; l < LEVELS.length; l++) n += save.stars[e + '-' + l] || 0; return n; }
function genXP(id) { return save.gx[id] || 0; }
function genUnlocked(g) { return eraStars(g.era) >= g.unlock; }
function levelUnlocked(e, l) { return l === 0 || (save.stars[e + '-' + (l - 1)] || 0) > 0; }
function factionName(G, fi) { return fi < 0 ? 'Tarafsız' : FACTIONS[G.factions[fi].id].name + ' ' + ERAS[G.era].suffix; }
function fname(fid, e) { return FACTIONS[fid].name + ' ' + ERAS[e].suffix; }
function insignia(r) { var s = ''; for (var i = 0; i < 5; i++) s += i < r ? '★' : '☆'; return s; }

/* ---------------- ses ---------------- */
var AC = null;
function tone(f, d, type, vol, slide, delay) {
  if (!save.sound) return;
  try {
    if (!AC) AC = new (window.AudioContext || window.webkitAudioContext)();
    var t = AC.currentTime + (delay || 0), o = AC.createOscillator(), g = AC.createGain();
    o.type = type || 'triangle'; o.frequency.setValueAtTime(f, t);
    if (slide) o.frequency.exponentialRampToValueAtTime(slide, t + d);
    g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(vol || 0.1, t + 0.01); g.gain.exponentialRampToValueAtTime(0.0001, t + d);
    o.connect(g); g.connect(AC.destination); o.start(t); o.stop(t + d + 0.02);
  } catch (e) {}
}
function noise(d, vol, delay) {
  if (!save.sound) return;
  try {
    if (!AC) AC = new (window.AudioContext || window.webkitAudioContext)();
    var len = Math.floor(AC.sampleRate * d), b = AC.createBuffer(1, len, AC.sampleRate), x = b.getChannelData(0);
    for (var i = 0; i < len; i++) x[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, 2);
    var s = AC.createBufferSource(), g = AC.createGain(), f = AC.createBiquadFilter();
    f.type = 'lowpass'; f.frequency.value = 1400; s.buffer = b; g.gain.value = vol || 0.15;
    s.connect(f); f.connect(g); g.connect(AC.destination); s.start(AC.currentTime + (delay || 0));
  } catch (e) {}
}
var SFX = {
  tap: function () { tone(520, 0.05, 'triangle', 0.05); },
  sel: function () { tone(660, 0.06, 'triangle', 0.06); },
  step: function () { tone(180, 0.05, 'square', 0.03); },
  hit: function () { noise(0.18, 0.2); tone(140, 0.12, 'sawtooth', 0.05, 90); },
  arrow: function () { tone(1200, 0.12, 'sine', 0.04, 500); noise(0.08, 0.06, 0.1); },
  kill: function () { noise(0.35, 0.22); tone(110, 0.3, 'sawtooth', 0.06, 60); },
  coin: function () { tone(880, 0.07, 'square', 0.04); tone(1320, 0.1, 'square', 0.04, 0, 0.06); },
  build: function () { tone(300, 0.08, 'square', 0.05); tone(300, 0.08, 'square', 0.05, 0, 0.12); tone(450, 0.15, 'triangle', 0.07, 0, 0.24); },
  city: function () { [392, 494, 587].forEach(function (f, i) { tone(f, 0.18, 'triangle', 0.09, 0, i * 0.1); }); },
  lost: function () { tone(220, 0.35, 'sawtooth', 0.06, 110); },
  turn: function () { tone(440, 0.12, 'triangle', 0.07); tone(660, 0.18, 'triangle', 0.07, 0, 0.1); },
  win: function () { [523, 659, 784, 1046].forEach(function (f, i) { tone(f, 0.3, 'triangle', 0.11, 0, i * 0.14); }); },
  lose: function () { [392, 330, 262, 196].forEach(function (f, i) { tone(f, 0.35, 'sawtooth', 0.05, 0, i * 0.18); }); }
};

/* ---------------- ekranlar ---------------- */
var cur = 'home';
function show(id) {
  ['home', 'era', 'hq', 'gen', 'help', 'set'].forEach(function (s) { $('#scr-' + s).hidden = s !== id; });
  $('#tabbar').hidden = false; $('#scr-battle').hidden = true;
  cur = id;
  document.querySelectorAll('#tabbar button').forEach(function (b) { b.classList.toggle('on', b.dataset.go === id || (id === 'era' && b.dataset.go === 'home')); });
  if (id === 'home') renderHome();
  if (id === 'gen') renderGenerals();
  if (id === 'hq') renderHQ();
  if (id === 'set') renderSettings();
  $('#scr-' + id).scrollTop = 0;
}
document.querySelectorAll('#tabbar button').forEach(function (b) { b.onclick = function () { SFX.tap(); show(b.dataset.go); }; });
function medalsPill() { return '<span class="pill">' + I.medal + '<span>' + save.medals + '</span></span>'; }

function hexPath(c, x, y, r) {
  c.beginPath();
  for (var k = 0; k < 6; k++) { var a = Math.PI / 180 * (60 * k - 30); var px = x + r * Math.cos(a), py = y + r * Math.sin(a); k ? c.lineTo(px, py) : c.moveTo(px, py); }
  c.closePath();
}
function drawMini(cv, mi, owners) {
  var M = MAPS[mi], dpr = Math.min(2, window.devicePixelRatio || 1);
  var W = cv.clientWidth || 84, Ht = cv.clientHeight || 64;
  cv.width = W * dpr; cv.height = Ht * dpr;
  var c = cv.getContext('2d'); c.setTransform(dpr, 0, 0, dpr, 0, 0);
  var xs = M.cells.map(function (h) { return hexXY(h[0], h[1]); });
  var minx = Infinity, maxx = -Infinity, miny = Infinity, maxy = -Infinity;
  xs.forEach(function (p) { minx = Math.min(minx, p.x); maxx = Math.max(maxx, p.x); miny = Math.min(miny, p.y); maxy = Math.max(maxy, p.y); });
  minx--; maxx++; miny--; maxy++;
  var s = Math.min(W / (maxx - minx), Ht / (maxy - miny)), ox = (W - (maxx - minx) * s) / 2 - minx * s, oy = (Ht - (maxy - miny) * s) / 2 - miny * s;
  M.cells.forEach(function (h, i) {
    var p = xs[i];
    if (!h[2]) c.fillStyle = '#244a66';
    else { var f = owners ? owners[i] : h[3]; c.fillStyle = f === 'n' || !FACTIONS[f] ? NEUTRAL_COL : FACTIONS[f].col; }
    hexPath(c, p.x * s + ox, p.y * s + oy, s * 0.98); c.fill();
    if (h[2] === 3) { c.fillStyle = '#f3ecdc'; c.fillRect(p.x * s + ox - s * 0.35, p.y * s + oy - s * 0.35, s * 0.7, s * 0.7); }
  });
}

/* ---------------- ANA SAYFA ---------------- */
(function () { var bg = document.getElementById('bgScene'); if (bg) bg.innerHTML = ART.scene(); })();
var heroAnim = null;
function renderHome() {
  var el = $('#scr-home .wrap');
  var g = load(GAME_KEY);
  el.innerHTML =
    '<div class="topbar"><span class="brand">SANCAK</span>' + medalsPill() + '</div>' +
    '<div class="hero"><div class="hscene">' + ART.scene().replace('xMidYMid slice', 'xMidYMax slice') + '</div><canvas id="heroCv" class="heromap"></canvas><div class="title"><h1>Sancak</h1><p class="sub">Avrupa haritasında sıra tabanlı strateji. Şehirlerini büyüt, ordunu kur, generallerinle fethet.</p></div></div>' +
    (g && !g.over ? '<button class="resume" id="resume"><span>' + ART.flag(g.factions[g.player].id) + '</span><span style="min-width:0;flex:1"><b>Kaldığın yerden devam et</b><br><span class="muted">' + MAPS[g.mapIdx].name + ' · Tur ' + g.turn + ' · ' + fname(g.factions[g.player].id, g.era) + '</span></span><span class="go">▶</span></button>' : '') +
    '<div class="eyebrow">Çağ seç</div>' +
    '<div class="eras">' + ERAS.map(function (E, i) {
      var st = eraStars(i), max = LEVELS.length * 3;
      return '<button class="era' + (E.ready ? '' : ' soon') + '" data-era="' + i + '"><div><div class="nm">' + E.name + '</div><div class="yr">' + E.years + '</div></div>' +
        '<div class="units">' + E.land.map(function (u) { return '<span class="uchip">' + (UT[u] ? ART.figInline(u, '#8a7c63') : '<span class="q">?</span>') + '</span>'; }).join('') + '</div>' +
        '<p class="bl">' + E.blurb + '</p>' +
        (E.ready ? '<div class="prog"><div class="bar"><i style="width:' + Math.round(st / max * 100) + '%"></i></div><span class="stars">★ ' + st + ' / ' + max + '</span></div>' : '<div class="prog"><span class="soonb">Yakında</span></div>') + '</button>';
    }).join('') + '</div>';
  el.querySelectorAll('.era').forEach(function (b) { b.onclick = function () {
    var e = +b.dataset.era;
    if (!ERAS[e].ready) { toast(ERAS[e].name + ' yakında geliyor. Önce Orta Çağ dengesini oturtalım.'); return; }
    SFX.tap(); openEra(e);
  }; });
  if ($('#resume')) $('#resume').onclick = function () { SFX.tap(); resumeGame(g); };
  startHero();
}
function startHero() {
  var cv = $('#heroCv'); if (!cv) return;
  var M = MAPS[1], owners = M.cells.map(function (h) { return h[2] ? h[3] : null; });
  var R = rng(42), last = 0;
  var land = M.cells.map(function (h, i) { return h[2] ? i : -1; }).filter(function (i) { return i >= 0; });
  var by = {}; M.cells.forEach(function (h, i) { by[h[0] + ',' + h[1]] = i; });
  if (heroAnim) cancelAnimationFrame(heroAnim);
  function frame(now) {
    if (!document.body.contains(cv) || cur !== 'home') { heroAnim = null; return; }
    if (now - last > 320) {
      last = now;
      var i = land[Math.floor(R() * land.length)], h = M.cells[i];
      var nb = neighOff(h[0], h[1]).map(function (d) { return by[(h[0] + d[0]) + ',' + (h[1] + d[1])]; }).filter(function (j) { return j !== undefined && M.cells[j][2] && owners[j] !== owners[i]; });
      if (nb.length) owners[i] = owners[nb[Math.floor(R() * nb.length)]];
      drawMini(cv, 1, owners);
    }
    heroAnim = requestAnimationFrame(frame);
  }
  drawMini(cv, 1, owners);
  heroAnim = requestAnimationFrame(frame);
}

/* ---------------- ÇAĞ / SEFERLER ---------------- */
var curEra = 0;
function openEra(e) {
  curEra = e; var E = ERAS[e];
  show('era');
  var el = $('#scr-era .wrap');
  el.innerHTML = '<div class="topbar"><button class="back" id="eraBack" aria-label="Geri">' + I.back + '</button>' +
    '<div style="flex:1;min-width:0"><div class="eyebrow">' + E.years + '</div><h2>' + E.name + '</h2></div>' + medalsPill() + '</div>' +
    '<div class="tri3">' + E.land.map(function (t) {
      var T = UT[t];
      return '<div class="tcard"><div class="tfig">' + ART.figInline(t, '#3c6fb4') + '</div><div class="tn">' + T.name + '</div><div class="tb">→ ' + UT[T.beats].name + '’yı yener</div>' +
        '<div class="tst"><span>' + I.sword + T.atk + '</span><span>' + I.shield + T.def + '</span><span>' + I.boot + T.mv + '</span></div></div>';
    }).join('') + '</div>' +
    '<div class="eyebrow">Seferler</div><div class="levels">' + LEVELS.map(function (L, l) {
      var M = MAPS[L.map], st = save.stars[e + '-' + l] || 0, un = levelUnlocked(e, l);
      var nc = M.cells.filter(function (c) { return c[2] === 3; }).length, nk = M.cells.filter(function (c) { return c[2] === 4; }).length;
      return '<button class="lvl' + (un ? '' : ' locked') + '" data-l="' + l + '"><canvas></canvas><div><div class="nm">' + M.name + '</div>' +
        '<div class="meta">' + M.factions.length + ' ülke · ' + nc + ' şehir · ' + nk + ' kale' + (M.navy ? ' · deniz' : '') + '</div>' +
        '<div class="meta">★★★ ' + L.par + ' turda · sınır ' + L.limit + ' tur</div></div>' +
        (un ? '<div class="st">' + [1, 2, 3].map(function (k) { return k <= st ? '<b>★</b>' : '★'; }).join('') + '</div>' : I.lock) + '</button>';
    }).join('') + '<div class="lvl soon"><div class="ph">?</div><div><div class="nm">Batı Avrupa, Balkanlar, Doğu Cephesi…</div><div class="meta">Denge oturunca eklenecek</div></div></div></div>';
  $('#eraBack').onclick = function () { SFX.tap(); show('home'); };
  el.querySelectorAll('.lvl[data-l]').forEach(function (b) {
    drawMini(b.querySelector('canvas'), LEVELS[+b.dataset.l].map);
    b.onclick = function () {
      if (b.classList.contains('locked')) { toast('Önce bir önceki seferi kazan.'); return; }
      SFX.tap(); openSetup(e, +b.dataset.l);
    };
  });
}

/* ---------------- KURULUM ---------------- */
function openSetup(e, l) {
  var L = LEVELS[l], M = MAPS[L.map];
  var land = M.cells.filter(function (c) { return c[2]; });
  var sel = M.factions.slice().sort(function (a, b) { return cnt(b) - cnt(a); })[0];
  function cnt(f) { return land.filter(function (c) { return c[3] === f; }).length; }
  function diff(n) { return n >= 15 ? 'Kolay' : n >= 9 ? 'Orta' : 'Zor'; }
  var gens = GENERALS.filter(function (g) { return g.era === e; });
  function draw() {
    modal('<div><div class="eyebrow">' + ERAS[e].name + ' · Sefer ' + (l + 1) + '</div><h2>' + M.name + '</h2></div>' +
      '<div class="eyebrow">Ülkeni seç</div><div class="choices">' + M.factions.map(function (fid) {
        var n = cnt(fid), c = land.filter(function (x) { return x[3] === fid && x[2] === 3; }).length;
        var cap = land.filter(function (x) { return x[3] === fid && x[7]; })[0];
        return '<button class="choice' + (sel === fid ? ' on' : '') + '" data-f="' + fid + '">' + ART.flag(fid) + '<div style="min-width:0"><div class="t">' + fname(fid, e) + '</div>' +
          '<div class="s">' + (cap ? esc(cap[6]) + ' · ' : '') + n + ' bölge · ' + c + ' şehir · <span class="diff-' + diff(n) + '">' + diff(n) + '</span></div></div></button>';
      }).join('') + '</div>' +
      '<div class="eyebrow">Yanındaki generaller</div><div class="choices">' + gens.map(function (g) {
        var un = genUnlocked(g), r = rankOf(genXP(g.id));
        return '<div class="choice' + (un ? ' on' : '') + '"' + (un ? '' : ' style="opacity:.45"') + '><span class="por">' + ART.portrait(g, e) + '</span><div style="min-width:0"><div class="t">' + g.name + '</div>' +
          '<div class="s">' + (un ? ERAS[e].ranks[r - 1] + ' ' + insignia(r) : '★ ' + g.unlock + ' yıldızla açılır') + '</div></div></div>';
      }).join('') + '</div>' +
      '<div class="goals"><span>Hedef: <b>şehirlerin %60’ını al</b> ya da bütün rakipleri yık</span><span>★★★ <b>' + L.par + '</b> tur</span><span>★★ <b>' + Math.round(L.par * 1.4) + '</b> tur</span><span>Sınır <b>' + L.limit + '</b> tur</span></div>' +
      '<div class="row"><button class="btn ghost" id="sCancel">Vazgeç</button><button class="btn" id="sGo">Sefere çık</button></div>');
    document.querySelectorAll('[data-f]').forEach(function (b) { b.onclick = function () { SFX.tap(); sel = b.dataset.f; draw(); }; });
    $('#sCancel').onclick = closeModal;
    $('#sGo').onclick = function () { SFX.tap(); closeModal(); startGame(e, l, sel); };
  }
  draw();
}

/* ---------------- modal / bildirim ---------------- */
function modal(html, cls) { var m = $('#modal'); m.innerHTML = '<div class="mbox ' + (cls || '') + '">' + html + '</div>'; m.hidden = false; }
function closeModal() { $('#modal').hidden = true; $('#modal').innerHTML = ''; }
$('#modal').addEventListener('click', function (ev) { if (ev.target.id === 'modal' && !B) closeModal(); });
var toastT = 0;
function toast(t) { var el = $('#toast'); el.textContent = t; el.hidden = false; el.style.opacity = 1; clearTimeout(toastT); toastT = setTimeout(function () { el.style.opacity = 0; setTimeout(function () { el.hidden = true; }, 300); }, 2000); }

/* ---------------- KARARGÂH ---------------- */
function upLv(id) { return (save.upg && save.upg[id]) || 0; }
function upEffect(u, lv) {
  if (u.kind === 'unit') return 'Saldırı ve savunma +%' + Math.round(u.per * 100 * lv);
  if (u.id === 'hazine') return 'Altın geliri +%' + Math.round(u.per * 100 * lv);
  if (u.id === 'tarim') return 'Her tarla +' + lv + ' gıda';
  if (u.id === 'baslangic') return 'Sefere +' + (u.per * lv) + ' altınla başla';
  return '';
}
function renderHQ() {
  var el = $('#scr-hq .wrap');
  function card(u) {
    var lv = upLv(u.id), max = lv >= u.max, cost = max ? 0 : u.cost[lv];
    var pips = ''; for (var i = 0; i < u.max; i++) pips += '<i class="' + (i < lv ? 'on' : '') + '"></i>';
    var art = u.kind === 'unit' ? '<span class="hqfig">' + ART.figInline(u.id === 'kule' ? 'kule' : u.id, '#3c6fb4') + '</span>' :
      '<span class="hqfig ico">' + (u.id === 'hazine' ? I.coin : u.id === 'tarim' ? I.food : I.medal) + '</span>';
    return '<div class="hq">' + art + '<div class="hqm"><b>' + u.name + '</b><span class="pips">' + pips + '</span>' +
      '<span class="muted">' + (lv ? 'Şimdi: ' + upEffect(u, lv) : 'Henüz geliştirilmedi') + '</span>' +
      (max ? '<span class="good">En üst seviye</span>' : '<span class="nx">Sonraki: ' + upEffect(u, lv + 1) + '</span>') + '</div>' +
      (max ? '' : '<button class="btn small" data-hq="' + u.id + '"' + (save.medals < cost ? ' disabled' : '') + '>' + I.medal + cost + '</button>') + '</div>';
  }
  el.innerHTML = '<div class="topbar"><h2>Karargâh</h2>' + medalsPill() + '</div>' +
    '<p class="muted">Seferlerden kazandığın madalyalarla ordunu kalıcı olarak geliştir. Geliştirmeler sadece senin birliklerine işler; rakip krallıklar bunları kullanmaz.</p>' +
    '<div class="eyebrow">Birlikler</div><div class="hqs">' + UPGRADES.filter(function (u) { return u.kind === 'unit'; }).map(card).join('') + '</div>' +
    '<div class="eyebrow">Hazine ve erzak</div><div class="hqs">' + UPGRADES.filter(function (u) { return u.kind === 'eco'; }).map(card).join('') + '</div>' +
    '<div class="card"><h3>Madalya nasıl kazanılır?</h3><p class="muted">Zafer: 20 + yıldız başına 10 + seferin zorluğu. Bir seferde ilk kez aldığın her yıldız için +10. Yenilgide bile 10 madalya. Generallerini Generaller sekmesinden madalyayla eğitebilirsin.</p></div>';
  el.querySelectorAll('[data-hq]').forEach(function (b) { b.onclick = function () {
    var u = UPGRADES.filter(function (x) { return x.id === b.dataset.hq; })[0], lv = upLv(u.id);
    if (lv >= u.max || save.medals < u.cost[lv]) return;
    save.medals -= u.cost[lv]; save.upg = save.upg || {}; save.upg[u.id] = lv + 1; persist(); SFX.build();
    toast(u.name + ' seviye ' + (lv + 1) + ': ' + upEffect(u, lv + 1));
    renderHQ();
  }; });
}

/* ---------------- GENERALLER ---------------- */
var genEra = 0;
function genBonusText(g, r, era) {
  var gg = { rank: r }, a = Math.round((genMul(gg) - 1) * 100), b = Math.round((specMul(gg) - 1) * 100);
  var s = 'Atandığı birliğin saldırı ve savunması +%' + a + ', her tur +10 iyileşme';
  if (UT[g.spec]) s += '; ' + UT[g.spec].name + ' birliğinde ek +%' + b;
  else if (g.spec === 'kale') s += '; şehir ve kalede ek +%' + b;
  else s += '; kendi birlik türünde ek +%' + b;
  return s;
}
function renderGenerals() {
  var el = $('#scr-gen .wrap'), E = ERAS[genEra];
  el.innerHTML = '<div class="topbar"><h2>Generaller</h2>' + medalsPill() + '</div>' +
    '<p class="muted">Generalini savaşta bir birliğe ata. Her generalin genel bir bonusu, kendi birlik türünde ek bonusu ve bir yeteneği var. Birliği yok olursa general 3 tur yaralı kalır.</p>' +
    '<div class="tabs">' + ERAS.map(function (x, i) { return '<button data-e="' + i + '" class="' + (i === genEra ? 'on' : '') + '">' + x.name + '</button>'; }).join('') + '</div>' +
    (E.ready ? '' : '<div class="card"><p class="muted">' + E.name + ' yakında. Generaller hazır, birlikler geliyor.</p></div>') +
    '<div class="gens">' + GENERALS.filter(function (g) { return g.era === genEra; }).map(function (g) {
      var un = genUnlocked(g) && E.ready, xp = genXP(g.id), r = rankOf(xp);
      var next = RANK_XP[r] || null, prev = RANK_XP[r - 1];
      var pct = next ? Math.round((xp - prev) / (next - prev) * 100) : 100;
      var sp = UT[g.spec] ? UT[g.spec].name : g.spec === 'kale' ? 'Şehir ve kale' : '—';
      return '<div class="gen' + (un ? '' : ' locked') + '"><div class="por">' + ART.portrait(g, g.era) + '</div><div style="min-width:0">' +
        '<div class="nm">' + g.name + '</div><div class="ep">' + g.epithet + '</div>' +
        '<div class="rk"><span>' + E.ranks[r - 1] + '</span><span class="ins">' + insignia(r) + '</span></div></div>' +
        '<div class="info"><div class="specrow"><span class="spec" style="--sc:' + ART.specInfo(g.spec).col + '"><svg viewBox="0 0 24 24">' + ART.specInfo(g.spec).icon + '</svg>' + sp + ' uzmanı</span></div>' +
        '<div><span class="k">Bonus</span>' + genBonusText(g, r) + '</div>' +
        '<div><span class="k">Yetenek</span><b>' + SKILLS[g.skill].name + '</b>: ' + SKILLS[g.skill].desc + '</div>' +
        (un ? '<div class="xp"><div class="bar"><i style="width:' + pct + '%"></i></div><span>' + (next ? xp + ' / ' + next + ' TP' : 'En yüksek rütbe') + '</span></div>' +
          (next ? '<div class="row"><button class="btn small ghost" data-train="' + g.id + '"' + (save.medals < 25 ? ' disabled' : '') + '>' + I.medal.replace('<svg', '<svg width="18" height="18"') + ' 25 madalya ile eğit (+50 TP)</button></div>' : '')
          : (E.ready ? '<div class="xp">' + I.lock + '<span>' + E.name + ' seferlerinde toplam ★ ' + g.unlock + ' yıldıza ulaşınca açılır (şu an ' + eraStars(g.era) + ')</span></div>' : '')) +
        '</div></div>';
    }).join('') + '</div>' +
    '<div class="card"><h3>Rütbeler</h3><p class="muted">' + E.ranks.map(function (n, i) { return n + ' (' + RANK_XP[i] + ' TP)'; }).join(' → ') + '</p>' +
    '<p class="muted">Savaşta her saldırı 5 TP, her yok edilen düşman 15 TP getirir. Zaferde savaşan her general +40 TP alır.</p></div>';
  el.querySelectorAll('[data-e]').forEach(function (b) { b.onclick = function () { SFX.tap(); genEra = +b.dataset.e; renderGenerals(); }; });
  el.querySelectorAll('[data-train]').forEach(function (b) { b.onclick = function () {
    if (save.medals < 25) return;
    var id = b.dataset.train, r0 = rankOf(genXP(id));
    save.medals -= 25; save.gx[id] = genXP(id) + 50; persist(); SFX.build();
    var r1 = rankOf(save.gx[id]), g = GENERALS.filter(function (x) { return x.id === id; })[0];
    toast(r1 > r0 ? g.name + ' terfi etti: ' + ERAS[g.era].ranks[r1 - 1] : g.name + ' +50 TP');
    renderGenerals();
  }; });
}

/* ---------------- REHBER / AYARLAR ---------------- */
function renderHelp() {
  $('#scr-help .wrap').innerHTML = '<div class="topbar"><h2>Rehber</h2></div>' +
    '<div class="card"><h3>Tur nasıl oynanır</h3><ol>' +
    '<li><b>Birliğine dokun.</b> Gidebileceği hücreler açık renkle, saldırabileceği düşmanlar kırmızı halkayla görünür.</li>' +
    '<li>Açık hücreye dokun: birlik yürür. Kırmızı halkaya dokun: savaş tahmini çıkar, <b>Saldır</b>’a bas.</li>' +
    '<li>Her birlik bir turda bir kez yürür ve bir kez saldırır. Önce yürüyüp sonra saldırabilirsin; saldırı hareketi bitirir.</li>' +
    '<li>Şehrine dokun: asker al, şehri, demirciyi ve limanı geliştir. Tarlaya ve kaleye dokunarak onları da geliştirirsin.</li>' +
    '<li>Yanlış hamleyi sol alttaki <b>geri al</b> düğmesiyle geri çekebilirsin (yürüme, asker, bina, ticaret, general). Saldırılar geri alınmaz.</li>' +
    '<li>Hamlelerin bitince <b>Devam et</b>. Rakipler sırayla oynar; izleyebilir, hızlandırabilir ya da atlayabilirsin.</li></ol></div>' +
    '<div class="card"><h3>Kaynaklar</h3><ul>' +
    '<li><b>Altın:</b> şehirlerden gelir, seviye arttıkça artar. Asker ve binalar altınla alınır.</li>' +
    '<li><b>Gıda:</b> tarlalar ve şehirler üretir. Her birlik tur başına 1 gıda yer. Gıda biterse bütün birlikler her tur 8 can kaybeder.</li>' +
    '<li><b>Demir:</b> demirciden gelir. Atlı ve gemiler demir ister.</li>' +
    '<li><b>Ordu sınırı:</b> 2 + şehir başına 2 + kale başına 1 birlik (kuleler sayılmaz). Sınır dolunca altını binalara harca: şehir geliştirmek kendini 5–8 turda öder.</li></ul></div>' +
    '<div class="card"><h3>Yapılar</h3><ul>' +
    '<li><b>Şehir (6 seviye):</b> gelir, savunma ve iyileşme artar. Ele geçirilen şehir 1 seviye düşer.</li>' +
    '<li><b>Demirci (3 seviye):</b> demir üretir. 1. seviye atlıyı açar; 2. ve 3. seviyede yeni birlikler daha tecrübeli doğar.</li>' +
    '<li><b>Kale (4 seviye):</b> içindeki birliğin savunması %30’dan %90’a kadar artar. Kalede kılıçlı ve okçu alınır; 3. seviyeden itibaren atlı da.</li>' +
    '<li><b>Tarla (2 seviye):</b> 2 ya da 4 gıda. Düşman alırsa 1. seviyeye düşer.</li>' +
    '<li><b>Liman (2 seviye, denizli haritalar):</b> kadırga yapar. Kara birliği limandan denize çıkınca nakliyeye biner; nakliye savunmasızdır.</li></ul></div>' +
    '<div class="card"><h3>Savaş</h3><ul>' +
    '<li>Kılıçlı atlıyı, atlı okçuyu, okçu kılıçlıyı yener: avantajlı taraf <b>1,5 kat</b> güçlü.</li>' +
    '<li>Okçu ve kadırga 2 hücre uzaktan atar; uzaktan vurulan karşılık veremez (okçu ve kadırga hariç). Yakın dövüşte savunan karşılık verir.</li>' +
    '<li>Dağ +%30, şehir seviye başına +%8, kale +%30–90 savunma verir. Yaralı birlik daha zayıf vurur.</li>' +
    '<li>Saldıran birlik yerinde kalır. Boşalan hücreye başka bir birliğini sürüp oradan saldırmaya devam edebilirsin. İki düşman öldüren birlik tecrübe kazanır.</li>' +
    '<li><b>Atlı</b> 2 hücre gider ve düşman yanından geçerken durmaz. Saldırıp düşmanı yok ederse yeniden saldırabilir ve 1 hücre daha ilerleyebilir; gücü yettikçe zincirleme devam eder.</li>' +
    '<li><b>Nakliyedeki birlik</b> kıyıdaki düşmana çıkarma saldırısı yapabilir: gücünün %60’ıyla vurur, karşılığı kendi savunmasının %70’iyle yer, gemide kalır.</li>' +
    '<li>Kendi birliklerinin içinden geçebilirsin, ama dolu hücrede duramazsın.</li>' +
    '<li><b>Moral:</b> karşılıklı iki yanında düşman olan birlik kıskaçtadır (−%20). İki kıskaç ya da 4 düşman ağır kıskaç (−%30). Her yanı düşman ya da geçilmez olan birlik çevrilidir (−%45). Kayıp hem saldırıya hem savunmaya işler; haritada kırmızı işaretle görünür.</li></ul></div>' +
    '<div class="card"><h3>Diplomasi</h3><ul>' +
    '<li>İki durum var: <b>savaş</b> ya da <b>ittifak</b>. İttifak ' + ALLY_TURNS + ' tur sürer; aynı anda en fazla ' + MAX_ALLIES + ' müttefik olur.</li>' +
    '<li>Müttefike saldırılamaz, onun birliklerinin ve topraklarının içinden geçilir, seni kıskaca almaz.</li>' +
    '<li>Müttefikin boş şehrine ya da kalesine girersen orayı alırsın ama ittifak bozulur ve ' + DISTRUST_TURNS + ' tur kimse seninle ittifak kurmaz.</li>' +
    '<li>Üstteki el sıkışma simgesinden pazarlık masasını aç: altın, gıda, demir, şehir ve kale takası; ittifak karşılığında bir şey ver ya da iste. Başkent verilemez; şehir çevresindeki arazisiyle devredilir.</li>' +
    '<li><b>Bağlı krallık:</b> gücü seninkinin %40’ından az, en fazla 2 şehri kalmış ya da yeni şehir kaybetmiş ülkeyi altın karşılığında bütünüyle krallığına katabilirsin. Listede taç işaretiyle görünür.</li>' +
    '<li>Şehirlerin %35’ini geçersen rakipler sana karşı birleşmeye başlar. Müttefik şehirleri zafer için sayılmaz.</li></ul></div>' +
    '<div class="card"><h3>Kule</h3><p>Her tur kendi boş arazine bir kule kurabilirsin (tarla, şehir ve kaleye olmaz). Kule 2 turda biter; inşaat sırasında savunması yarıdır ve karşılık veremez. Hasar alan inşaat bitince kule o canla başlar. Kule saldırmaz ama saldırana karşılık verir. Yıkılırsa arazi boşalır.</p></div>' +
    '<div class="card"><h3>Ticaret</h3><p>Başkentinde her tur en fazla 3 takas: 10 gıda → 12 altın, 18 altın → 10 gıda, 25 altın → 2 demir, 2 demir → 14 altın.</p></div>' +
    '<div class="card"><h3>Kazanmak</h3><p>Haritadaki şehirlerin %60’ını ele geçir (üstteki şehir sayacı) ya da bütün rakipleri yık. Zaferden sonra istersen tur sınırı olmadan bütün haritayı fethetmeye devam edebilirsin; tam fetih ek madalya getirir. Bütün şehirlerini kaybeden ülke yıkılır. Tur sınırını geçersen sefer kaybedilir. Yıldızlar kaç turda bitirdiğine göre verilir.</p></div>';
}
function renderSettings() {
  $('#scr-set .wrap').innerHTML = '<div class="topbar"><h2>Ayarlar</h2></div>' +
    '<div class="card"><div class="setrow"><div><h3>Ses</h3><p class="muted">Savaş sesleri ve melodiler</p></div><button class="switch' + (save.sound ? ' on' : '') + '" id="swSound" aria-label="Ses"></button></div></div>' +
    '<div class="card"><div class="setrow"><div><h3>Eğitim ipuçları</h3><p class="muted">İlk seferdeki ipuçlarını yeniden göster</p></div><button class="btn small ghost" id="tutAgain">Sıfırla</button></div></div>' +
    '<div class="card"><h3>İlerlemeyi sil</h3><p class="muted">Yıldızlar, madalyalar, general rütbeleri ve yarım kalan sefer silinir.</p><div class="row" id="resetRow"><button class="btn small ghost" id="resetBtn">İlerlemeyi sil</button></div></div>' +
    '<p class="muted" style="text-align:center">Sancak · sürüm 0.7 · Harita verisi: Natural Earth (kamu malı)</p>';
  $('#swSound').onclick = function () { save.sound = !save.sound; persist(); renderSettings(); SFX.tap(); };
  $('#tutAgain').onclick = function () { save.tut = false; persist(); toast('İpuçları bir sonraki seferde görünecek.'); };
  $('#resetBtn').onclick = function () {
    $('#resetRow').innerHTML = '<span class="muted" style="align-self:center">Emin misin?</span><button class="btn small ghost" id="rNo">Hayır</button><button class="btn small" id="rYes">Evet, sil</button>';
    $('#rNo').onclick = renderSettings;
    $('#rYes').onclick = function () { save = { medals: 0, stars: {}, gx: {}, sound: save.sound, tut: false, speed: 1 }; persist(); store(GAME_KEY, null); toast('İlerleme silindi.'); renderSettings(); };
  };
}

/* ======================= SAVAŞ ======================= */
var B = null; // { G, sel, view, reach, targets, preview, anim:[], phase:'player'|'ai'|'done', cam }
var cv = $('#cv'), ctx = cv.getContext('2d');
var W = 0, H = 0, DPR = 1, dirty = true;
function resize() {
  DPR = Math.min(2.5, window.devicePixelRatio || 1);
  var r = cv.getBoundingClientRect();
  W = r.width; H = r.height;
  cv.width = Math.round(W * DPR); cv.height = Math.round(H * DPR);
  if (B) { fitBounds(B); if (!B.camSet) { focusHome(B); B.camSet = true; } clampCam(B); }
  dirty = true;
}
window.addEventListener('resize', resize);

function startGame(e, l, fid) {
  var gens = GENERALS.filter(function (g) { return g.era === e && genUnlocked(g); }).map(function (g) {
    return { id: g.id, name: g.name, spec: g.spec, skill: g.skill, xp: genXP(g.id), look: g.look };
  });
  var G = newGame({ era: e, level: l, player: fid, generals: gens, upgrades: Object.assign({}, save.upg || {}), seed: (Date.now() & 0x7fffffff) | 1 });
  enterBattle(G);
}
function resumeGame(G) { enterBattle(G); }
function enterBattle(G) {
  B = { G: G, undo: [], sel: 0, view: null, reach: null, targets: [], preview: null, anim: [], phase: 'player', fast: 1, skip: false, tut: (!save.tut && G.level === 0 && G.turn === 1) ? 1 : 0 };
  $('#tabbar').hidden = true;
  ['home', 'era', 'hq', 'gen', 'help', 'set'].forEach(function (s) { $('#scr-' + s).hidden = true; });
  $('#scr-battle').hidden = false;
  G.log.length = 0;
  buildHud();
  resize();
  if (G.cur !== G.player) runAI(); else { banner('Tur ' + G.turn + ' · Senin sıran', 1200); persistGame(); }
  renderPanel();
  requestAnimationFrame(loop);
}
function persistGame() { if (B && !B.G.over) store(GAME_KEY, B.G); }

/* ---------- kamera ---------- */
var SIDE_MQ = window.matchMedia ? window.matchMedia('(orientation: landscape) and (max-height: 600px)') : { matches: false };
function isSide() { return SIDE_MQ.matches; }
function sideW() { var e = $('#panel'); return isSide() && e && !e.hidden ? e.getBoundingClientRect().width + 8 : 0; }
function fitBounds(b) {
  var minx = Infinity, maxx = -Infinity, miny = Infinity, maxy = -Infinity;
  b.G.cells.forEach(function (c) { if (!c.t && !c.nb.some(function (j) { return b.G.cells[j].t; })) return; minx = Math.min(minx, c.x); maxx = Math.max(maxx, c.x); miny = Math.min(miny, c.y); maxy = Math.max(maxy, c.y); });
  b.bounds = { minx: minx - 1, maxx: maxx + 1, miny: miny - 1, maxy: maxy + 1 };
  var top = topH(), bot = botH(), avH = Math.max(80, H - top - bot), avW = Math.max(120, W - sideW());
  b.fit = Math.min(avW / (b.bounds.maxx - b.bounds.minx), avH / (b.bounds.maxy - b.bounds.miny));
  b.oy = top + avH / 2; b.ox = avW / 2; b.aw = avW;
}
function topH() { var e = $('.hud-top'); return e ? e.getBoundingClientRect().height + 4 : 50; }
function botH() {
  var a = $('#actbar'), e = $('#panel'), h = a && !a.hidden ? a.getBoundingClientRect().height + 6 : 0;
  if (!isSide() && e && !e.hidden) h += e.getBoundingClientRect().height;
  return h;
}
function focusHome(b) {
  var G = b.G, cap = G.cells.filter(function (c) { return c.cap && c.f === G.player; })[0] || G.cells.filter(function (c) { return c.f === G.player; })[0];
  b.cam = { s: Math.max(b.fit, Math.min(42, b.fit * (isSide() ? 1.8 : 2.6))), x: cap ? cap.x : 0, y: cap ? cap.y : 0 };
}
function w2s(x, y) { return { x: (x - B.cam.x) * B.cam.s + B.ox, y: (y - B.cam.y) * B.cam.s + B.oy }; }
function s2w(x, y) { return { x: (x - B.ox) / B.cam.s + B.cam.x, y: (y - B.oy) / B.cam.s + B.cam.y }; }
function clampCam(b) {
  var bd = b.bounds;
  b.cam.s = Math.max(b.fit * 0.95, Math.min(64, b.cam.s));
  var hw = b.aw / 2 / b.cam.s, hh = (H - topH() - botH()) / 2 / b.cam.s;
  var cx = (bd.minx + bd.maxx) / 2, cy = (bd.miny + bd.maxy) / 2;
  b.cam.x = hw * 2 >= bd.maxx - bd.minx ? cx : Math.max(bd.minx + hw, Math.min(bd.maxx - hw, b.cam.x));
  b.cam.y = hh * 2 >= bd.maxy - bd.miny ? cy : Math.max(bd.miny + hh, Math.min(bd.maxy - hh, b.cam.y));
}
function cellAt(sx, sy) {
  var p = s2w(sx, sy), best = -1, bd = 1.0;
  B.G.cells.forEach(function (c) { var d = Math.hypot(c.x - p.x, c.y - p.y); if (d < bd) { bd = d; best = c.i; } });
  return best;
}
function ensureVisible(ci) {
  var c = B.G.cells[ci], p = w2s(c.x, c.y);
  if (p.x < 30 || p.x > B.aw - 30 || p.y < topH() + 20 || p.y > H - botH() - 20) { B.camT = { x: c.x, y: c.y, t: 0 }; }
}

/* ---------- üst bilgi: sadece simgeler ve sayılar ---------- */
function buildHud() {
  var G = B.G, f = G.factions[G.player];
  $('#hud').innerHTML =
    '<div class="hud-top"><button class="hbtn sm" id="hPause" aria-label="Menü">' + I.pause + '</button><button class="hbtn sm" id="hDip" aria-label="Diplomasi">' + I.handshake + '</button>' +
    '<button class="res" id="hRes" aria-label="Kaynaklar">' + ART.flag(f.id, 'f') +
    '<span id="rG">' + I.coin + '<b></b></span><span id="rF">' + I.food + '<b></b></span><span id="rI">' + I.iron + '<b></b></span>' +
    '<span id="rA">' + I.sword + '<b></b></span><span id="rC">' + I.city + '<b></b></span><span id="rT">' + I.hourglass + '<b></b></span></button></div>' +
    '<div id="aiBar" class="aibar" hidden><span id="aiWho"></span><button class="hbtn" id="aiFast" aria-label="Hızlı">' + I.ff + '</button><button class="hbtn" id="aiSkip" aria-label="Atla">' + I.skip + '</button></div>' +
    '<div id="actbar" class="actbar"><button class="hbtn" id="pUndo" aria-label="Geri al">' + I.undo + '</button>' +
    '<button class="hbtn" id="pNext" aria-label="Sıradaki birlik">' + I.next + '<em id="pLeft"></em></button>' +
    '<button class="hbtn" id="hFit" aria-label="Haritayı sığdır">' + I.fit + '</button><span class="sp"></span>' +
    '<button class="btn endturn" id="pEnd"></button></div>' +
    '<div id="hBanner" class="banner" hidden></div><div id="hTip" class="tip" hidden></div>';
  $('#hPause').onclick = pauseMenu;
  $('#hDip').onclick = function () { if (B.phase === 'player') { SFX.tap(); dipMenu(); } };
  $('#hRes').onclick = resInfo;
  $('#hFit').onclick = function () { SFX.tap(); if (B.cam.s > B.fit * 1.1) { B.cam.s = B.fit; B.cam.x = (B.bounds.minx + B.bounds.maxx) / 2; B.cam.y = (B.bounds.miny + B.bounds.maxy) / 2; } else focusHome(B); clampCam(B); dirty = true; };
  $('#aiFast').onclick = function () { B.fast = B.fast === 1 ? 3 : 1; this.classList.toggle('on', B.fast > 1); };
  $('#aiSkip').onclick = function () { B.skip = true; };
  $('#pUndo').onclick = undoLast;
  $('#pNext').onclick = function () { SFX.tap(); nextUnit(); };
  $('#pEnd').onclick = function () {
    var G = B.G, left = G.units.filter(function (u) { return u.f === G.player && hasMoves(u); }).length;
    if (left && !B.confirmEnd) { B.confirmEnd = true; SFX.tap(); updateActbar(); clearTimeout(B.confirmT); B.confirmT = setTimeout(function () { if (B) { B.confirmEnd = false; updateActbar(); } }, 3000); return; }
    B.confirmEnd = false; endPlayerTurn();
  };
  updateHud();
  if (B.tut) showTip();
}
function updateHud() {
  var G = B.G, f = G.factions[G.player], inc = income(G, G.player), cs = cityShare(G, G.player);
  var set = function (id, txt, warn) { var e = $(id); e.querySelector('b').textContent = txt; e.classList.toggle('warn', !!warn); };
  set('#rG', Math.floor(f.gold));
  set('#rF', Math.floor(f.food), f.food + inc.food - inc.up < 0);
  set('#rI', Math.floor(f.iron));
  set('#rA', armySize(G, G.player) + '/' + armyCap(G, G.player));
  set('#rC', cs.mine + '/' + (G.endless ? cs.all : cs.need));
  set('#rT', G.turn, !G.endless && G.limit - G.turn < 5);
  updateActbar();
}
function updateActbar() {
  if (!B) return;
  var G = B.G, bar = $('#actbar'); if (!bar) return;
  bar.hidden = B.phase !== 'player';
  var left = G.units.filter(function (u) { return u.f === G.player && hasMoves(u); }).length;
  $('#pLeft').textContent = left || ''; $('#pLeft').hidden = !left;
  $('#pUndo').disabled = !B.undo.length;
  var e = $('#pEnd');
  e.classList.toggle('warn', !!B.confirmEnd);
  e.innerHTML = B.confirmEnd ? 'Bitir? <em>' + left + '</em>' : 'Devam et';
}
function resInfo() {
  SFX.tap();
  var G = B.G, f = G.factions[G.player], inc = income(G, G.player), cs = cityShare(G, G.player);
  var sg = function (n) { return (n >= 0 ? '+' : '') + n; };
  modal('<div class="chd">' + ART.flag(f.id) + '<b>' + factionName(G, G.player) + '</b></div>' +
    '<div class="rinfo">' +
    '<div>' + I.coin + '<span>Altın</span><b>' + Math.floor(f.gold) + '</b><i>' + sg(inc.g) + ' / tur</i></div>' +
    '<div>' + I.food + '<span>Gıda</span><b>' + Math.floor(f.food) + '</b><i class="' + (inc.food - inc.up < 0 ? 'bad' : '') + '">' + sg(inc.food - inc.up) + ' / tur</i></div>' +
    '<div>' + I.iron + '<span>Demir</span><b>' + Math.floor(f.iron) + '</b><i>' + sg(inc.iron) + ' / tur</i></div>' +
    '<div>' + I.sword + '<span>Ordu</span><b>' + armySize(G, G.player) + '</b><i>sınır ' + armyCap(G, G.player) + '</i></div>' +
    '<div>' + I.city + '<span>Şehir</span><b>' + cs.mine + '</b><i>' + (G.endless ? 'fetih: bütün rakipleri yık' : 'zafer için ' + cs.need) + '</i></div>' +
    '<div>' + I.hourglass + '<span>Tur</span><b>' + G.turn + '</b><i>' + (G.endless ? 'sınır yok' : 'sınır ' + G.limit + ' · ★★★ ' + G.par) + '</i></div></div>' +
    '<div class="row"><button class="btn" id="rOk">Tamam</button></div>');
  $('#rOk').onclick = closeModal;
}
var bannerT = 0;
function banner(t, ms) { var el = $('#hBanner'); el.textContent = t; el.hidden = false; clearTimeout(bannerT); bannerT = setTimeout(function () { el.hidden = true; }, ms || 1400); }
var TIPS = [
  'Hoş geldin komutan! Parlak halkalı birlikler senin. Birine dokun.',
  'Açık hücrelere yürür, <b>kırmızı halkalı</b> düşmana saldırırsın.',
  'Kartta <b>general</b> simgesine dokunup generalini ata: birlik güçlenir.',
  '<b>Şehrine dokun</b>: asker al, şehri geliştir. Üstteki şeride dokunursan kaynak ayrıntıları açılır.',
  'Hamlelerin bitince sağ alttaki <b>Devam et</b>. Sol alttaki ok son hamleyi geri alır.'
];
function showTip() {
  var el = $('#hTip');
  if (!B || !B.tut || B.tut > TIPS.length) { el.hidden = true; return; }
  el.hidden = false;
  el.innerHTML = '<span>' + TIPS[B.tut - 1] + '</span><button id="tipNext">' + (B.tut < TIPS.length ? '›' : '✓') + '</button>';
  $('#tipNext').onclick = function () { B.tut++; if (B.tut > TIPS.length) { save.tut = true; persist(); } showTip(); };
}

/* ---------- seçim paneli (yalnız bir şey seçiliyken) ---------- */
function panelHTML() {
  var G = B.G;
  if (B.preview) return previewHTML();
  if (B.sel) return unitHTML(unitById(G, B.sel));
  if (B.view !== null && B.view !== undefined) return cellHTML(G.cells[B.view]);
  return '';
}
function hasMoves(u) { return !UT[u.type].tower && (u.mp > 0 || (!u.acted && hasTarget(u))); }
function hasTarget(u) { var G = B.G; return G.units.some(function (e) { return canAttack(G, u, e); }); }
function statChips(G, u) {
  return '<span>' + I.sword + Math.round(stat(G, Object.assign({}, u, { hp: 100 }), 'atk', null, G.cells[u.c], true)) + '</span>' +
    '<span>' + I.shield + Math.round(stat(G, Object.assign({}, u, { hp: 100 }), 'def', null, G.cells[u.c], false) * terrainMul(G, G.cells[u.c], u)) + '</span>' +
    (UT[u.type].tower ? '' : '<span>' + I.boot + (u.mp > 0 ? u.mp : 0) + '/' + unitMv(G, u) + '</span>') + (unitRange(G, u) > 1 ? '<span>' + I.bow + unitRange(G, u) + '</span>' : '');
}
function unitName(u) { return u.emb ? UT[u.type].name : u.build ? 'İnşaat' : UT[u.type].name; }
function figType(u) { return u.emb ? 'nakliye' : u.type === 'kule' ? (u.build ? 'insaat' : 'kule') : u.type; }
function hpBar(hp, to) {
  var c = hp > 60 ? '#6dbb6f' : hp > 30 ? '#e0b322' : '#d0453a';
  return '<div class="hpb"><i style="width:' + Math.max(0, hp) + '%;background:' + c + '"></i>' + (to !== undefined ? '<u style="left:' + Math.max(0, to) + '%;width:' + Math.max(0, hp - Math.max(0, to)) + '%"></u>' : '') + '<span>' + Math.max(0, Math.round(hp)) + (to !== undefined ? ' → ' + Math.max(0, Math.round(to)) : '') + '</span></div>';
}
function unitHTML(u) {
  var G = B.G; if (!u) return '';
  var mine = u.f === G.player, g = genOf(G, u), col = u.f < 0 ? NEUTRAL_COL : FACTIONS[G.factions[u.f].id].col;
  var tags = '';
  if (u.emb) tags += '<span class="tag">' + I.anchor + '</span>';
  if (u.build) tags += '<span class="tag">' + I.hammer + u.build + '</span>';
  if (u.chase && u.mp > 0) tags += '<span class="tag good">' + I.boot + '+1</span>';
  var mk = morale(G, u);
  if (mk) tags += '<span class="tag bad" title="' + MORALE[mk].name + '">' + I.pincer + '−' + Math.round((1 - MORALE[mk].m) * 100) + '%</span>';
  var s = '<div class="ucard"><div class="ufig' + (mine && !hasMoves(u) && !UT[u.type].tower ? ' done' : '') + '">' + ART.figInline(figType(u), col) + '</div><div class="umain">' +
    '<div class="uh"><b>' + unitName(u) + '</b><span class="ulv">' + '▲'.repeat(u.lvl) + '</span>' + tags + (mine || u.f < 0 ? '' : ART.flag(G.factions[u.f].id, 'fl mini')) + '</div>' +
    hpBar(u.hp) + '<div class="ust">' + statChips(G, u) + '</div></div>';
  // sağdaki eylem simgeleri
  var acts = '';
  if (g) {
    var isSpec = g.spec === u.type || (g.spec === 'kale' && G.cells[u.c].t >= 3);
    acts += '<button class="gbtn' + (isSpec ? ' spec' : '') + '" id="uGen" aria-label="General">' + ART.portrait(g, G.era) + '<em>+' + Math.round((genMul(g) * (isSpec ? specMul(g) : 1) - 1) * 100) + '%</em></button>';
  } else if (mine && !UT[u.type].tower && freeGenerals(G, G.player).length) {
    acts += '<button class="ibtn gold" id="uAssign" aria-label="General ata">' + I.genplus + '</button>';
  }
  if (mine) {
    var c = G.cells[u.c];
    if (c.f === G.player && c.t >= 2) acts += '<button class="ibtn" id="uCell" aria-label="Yapı">' + (c.t === 3 ? I.city : c.t === 4 ? I.castle : I.wheat) + '</button>';
    if (hasMoves(u)) acts += '<button class="ibtn" id="uWait" aria-label="Beklet">' + I.hourglass + '</button>';
  }
  return s + (acts ? '<div class="uacts">' + acts + '</div>' : '') + '</div>';
}
function previewHTML() {
  var G = B.G, a = unitById(G, B.sel), d = unitById(G, B.preview);
  if (!a || !d) { B.preview = null; return ''; }
  var p = predict(G, a, d);
  var colA = FACTIONS[G.factions[a.f].id].col, colD = d.f < 0 ? NEUTRAL_COL : FACTIONS[G.factions[d.f].id].col;
  var tags = '';
  if (UT[a.type].beats === d.type && !a.emb) tags += '<span class="tag good">×1,5</span>';
  if (UT[d.type].beats === a.type && !d.emb) tags += '<span class="tag bad">×1,5</span>';
  if (terrainMul(G, G.cells[d.c], d) > 1.01) tags += '<span class="tag">' + I.shield + '×' + terrainMul(G, G.cells[d.c], d).toFixed(1).replace('.', ',') + '</span>';
  if (p.die) tags += '<span class="tag bad">' + I.skull + '</span>';
  var md = morale(G, d), ma = morale(G, a);
  if (md) tags += '<span class="tag good">' + I.pincer + '−' + Math.round((1 - MORALE[md].m) * 100) + '%</span>';
  if (ma) tags += '<span class="tag bad">' + I.pincer + '−' + Math.round((1 - MORALE[ma].m) * 100) + '%</span>';
  return '<div class="pv"><div class="pvs"><div class="ufig sm">' + ART.figInline(figType(a), colA) + '</div>' + hpBar(a.hp, a.hp - p.back) + '</div>' +
    '<div class="vs">' + I.sword + tags + '</div>' +
    '<div class="pvs"><div class="ufig sm">' + ART.figInline(figType(d), colD) + '</div>' + hpBar(d.hp, d.hp - p.dmg) + '</div>' +
    '<div class="pvb"><button class="ibtn" id="pvNo" aria-label="Vazgeç">✕</button><button class="btn" id="pvGo">' + I.sword + ' Saldır</button></div></div>';
}
function resTag(o) { return (o.gold ? I.coin + o.gold : '') + (o.food ? I.food + o.food : '') + (o.iron ? I.iron + o.iron : ''); }
function costTag(g, i) { return '<span class="cost">' + I.coin + g + (i ? ' ' + I.iron + i : '') + '</span>'; }
function tile(attr, icon, title, cost, info) {
  // devre dışı karo dokununca sebebini söyler
  return '<button class="tile' + (info.ok ? '' : ' off') + '" ' + attr + (info.ok ? '' : ' data-why="' + esc(info.why) + '"') + '>' + icon + '<span class="tt">' + title + '</span>' + cost + '</button>';
}
function cellHTML(c) {
  var G = B.G, f = c.f, mine = f === G.player && c.t;
  if (!c.t) return '<div class="chd">' + I.anchor + '<b>Deniz</b></div>';
  var kindIcon = c.t === 3 ? I.city : c.t === 4 ? I.castle : c.t === 2 ? I.wheat : c.mt ? I.mount : I.flag;
  var facts = '';
  if (c.t === 3) facts += '<span>' + I.coin + '+' + Math.round((CITY_INCOME[c.lv] + c.port * 2) * (G.factions[f] ? G.factions[f].eco : 1)) + '</span>' + (c.smith ? '<span>' + I.hammer + c.smith + '</span>' : '') + (c.port ? '<span>' + I.anchor + c.port + '</span>' : '') + '<span>' + I.shield + '+' + (8 * c.lv) + '%</span>';
  if (c.t === 4) facts += '<span>' + I.shield + '+' + Math.round(CASTLE_DEF[c.lv] * 100) + '%</span>';
  if (c.t === 2) facts += '<span>' + I.food + '+' + FARM_FOOD[c.lv] + '</span>';
  if (c.mt) facts += '<span>' + I.mount + '+30%</span>';
  var s = '<div class="chd">' + (f >= 0 ? ART.flag(G.factions[f].id) : '') + kindIcon + '<b>' + (c.nm ? esc(c.nm) : (c.t === 1 ? (c.mt ? 'Dağ' : 'Arazi') : c.t === 2 ? 'Tarla' : '')) + '</b>' + (c.t >= 2 ? '<span class="lvtag">' + c.lv + '</span>' : '') + '<span class="facts">' + facts + '</span></div>';
  if (!mine) return s;
  var cols = FACTIONS[G.factions[f].id].col, tiles = [];
  if (c.t === 3 || c.t === 4) {
    var types = c.t === 3 ? ['kilic', 'okcu', 'atli'].concat(G.navy ? ['kadirga'] : []) : ['kilic', 'okcu', 'atli'];
    types.forEach(function (t) { var r = recruitInfo(G, c, t); tiles.push(tile('data-rec="' + t + '"', '<span class="rf">' + ART.figInline(t, cols) + '</span>', UT[t].name, costTag(r.g, r.i), r)); });
  }
  function up(what, icon, label, info) { if (info) tiles.push(tile('data-up="' + what + '"', '<span class="ri">' + icon + '</span>', label + ' ' + info.next, costTag(info.g, info.i), info)); }
  if (c.t === 3) {
    up('city', I.city, 'Şehir', upgradeInfo(G, c, 'city'));
    up('smith', I.hammer, 'Demirci', upgradeInfo(G, c, 'smith'));
    up('port', I.anchor, 'Liman', upgradeInfo(G, c, 'port'));
  }
  if (c.t === 4) up('castle', I.castle, 'Kale', upgradeInfo(G, c, 'castle'));
  if (c.t === 2) up('farm', I.wheat, 'Sulama', upgradeInfo(G, c, 'farm'));
  if (c.t === 1 && !unitAt(G, c.i)) { var ti = towerInfo(G, c, f); tiles.push(tile('data-tower="1"', '<span class="rf">' + ART.figInline('kule', cols) + '</span>', 'Kule', costTag(ti.g, ti.i), ti)); }
  if (tiles.length) s += '<div class="tiles">' + tiles.join('') + '</div>';
  if (c.t === 3 && c.cap) {
    s += '<div class="trades"><span class="tl">' + I.scale + '<em>' + (TRADE_MAX - (G.factions[f].trades || 0)) + '</em></span>' + TRADES.map(function (t) {
      var r = tradeInfo(G, f, t.id);
      return '<button class="trb' + (r.ok ? '' : ' off') + '" data-tr="' + t.id + '"' + (r.ok ? '' : ' data-why="' + esc(r.why) + '"') + '>' + resTag(t.give) + '<span class="ar">›</span>' + resTag(t.get) + '</button>';
    }).join('') + '</div>';
  }
  return s;
}
var UP_FX = { city: 'Gelir ve savunma arttı', smith: 'Demirci geliştirildi', port: 'Liman geliştirildi', castle: 'Kale güçlendi', farm: 'Tarla sulandı' };
function renderPanel() {
  var el = $('#panel');
  var html = B && B.phase === 'player' ? panelHTML() : '';
  el.hidden = !html;
  el.innerHTML = html;
  if (B) updateActbar();
  if (!B || !html) { if (B) { fitBounds(B); clampCam(B); dirty = true; } return; }
  var G = B.G;
  el.querySelectorAll('[data-why]').forEach(function (b) { b.onclick = function (ev) { ev.stopPropagation(); toast(b.dataset.why); }; });
  if ($('#pvNo')) $('#pvNo').onclick = function () { B.preview = null; renderPanel(); dirty = true; };
  if ($('#pvGo')) $('#pvGo').onclick = doAttack;
  if ($('#uWait')) $('#uWait').onclick = function () { var u = unitById(G, B.sel); if (u) act(function () { u.acted = true; u.mp = 0; return true; }); deselect(); nextUnit(true); };
  if ($('#uCell')) $('#uCell').onclick = function () { var u = unitById(G, B.sel); B.view = u.c; B.sel = 0; B.reach = null; B.targets = []; renderPanel(); dirty = true; };
  if ($('#uAssign')) $('#uAssign').onclick = assignMenu;
  if ($('#uGen')) $('#uGen').onclick = genMenu;
  el.querySelectorAll('[data-up]:not(.off)').forEach(function (b) { b.onclick = function () {
    var what = b.dataset.up;
    if (act(function () { return upgrade(G, B.view, what); })) { SFX.build(); fx({ k: 'text', c: B.view, txt: UP_FX[what], col: '#e8c977' }); updateHud(); renderPanel(); dirty = true; }
  }; });
  el.querySelectorAll('[data-tr]:not(.off)').forEach(function (b) { b.onclick = function () {
    if (act(function () { return trade(G, G.player, b.dataset.tr); })) { SFX.coin(); G.log.length = 0; updateHud(); renderPanel(); }
  }; });
  el.querySelectorAll('[data-tower]:not(.off)').forEach(function (b) { b.onclick = function () {
    var u = act(function () { return buildTower(G, B.view, G.player); });
    if (u) { SFX.build(); G.log.length = 0; fx({ k: 'ring', c: u.c, col: '#e8c977' }); updateHud(); renderPanel(); dirty = true; }
  }; });
  el.querySelectorAll('[data-rec]:not(.off)').forEach(function (b) { b.onclick = function () {
    var u = act(function () { return recruit(G, B.view, b.dataset.rec); });
    if (u) { SFX.coin(); fx({ k: 'ring', c: u.c, col: '#e8c977' }); updateHud(); renderPanel(); dirty = true; G.log.length = 0; }
  }; });
  fitBounds(B); clampCam(B); dirty = true;
}
/* ---------- diplomasi ---------- */
function relTag(G, fi) {
  if (isAlly(G, G.player, fi)) return '<span class="tag good">' + I.handshake + allyLeft(G, G.player, fi) + '</span>';
  return '<span class="tag bad">' + I.sword + '</span>';
}
function dipMenu() {
  var G = B.G, P = G.player, pp = power(G, P);
  var rows = G.factions.map(function (f, fi) {
    if (fi === P || !f.alive) return '';
    var cities = G.cells.filter(function (c) { return c.t === 3 && c.f === fi; }).length, rel = power(G, fi) / pp;
    return '<button class="drow" data-fi="' + fi + '">' + ART.flag(f.id) + '<span class="dn">' + factionName(G, fi) + '</span>' +
      '<span class="dm"><span>' + I.city + cities + '</span><span class="pw"><i style="width:' + Math.min(100, Math.round(rel * 50)) + '%"></i></span></span>' + relTag(G, fi) +
      (G.distrust[fi] > G.turn ? '<span class="tag bad" title="İhanet etti">!</span>' : '') + (annexInfo(G, P, fi).ok || /altın/.test(annexInfo(G, P, fi).why) ? '<span class="tag gold">' + I.crown + '</span>' : '') + '</button>';
  }).join('');
  modal('<div class="topbar"><h2>Diplomasi</h2><span class="tag ' + (allyCount(G, P) >= MAX_ALLIES ? 'bad' : '') + '">' + I.handshake + allyCount(G, P) + '/' + MAX_ALLIES + '</span></div>' +
    (G.distrust[P] > G.turn ? '<p class="bad">İhanetin yüzünden ' + (G.distrust[P] - G.turn) + ' tur kimse ittifak kurmaz.</p>' : '') +
    '<div class="drows">' + rows + '</div><p class="muted small">Çubuk, ülkenin gücünün seninkine oranı. Bir ülkeye dokun: pazarlık masası açılır.</p>' +
    '<div class="row"><button class="btn ghost" id="dClose">Kapat</button></div>');
  $('#dClose').onclick = closeModal;
  document.querySelectorAll('[data-fi]').forEach(function (b) { b.onclick = function () { SFX.tap(); dealTable(+b.dataset.fi); }; });
}
function dealTable(fi, preset) {
  var G = B.G, P = G.player;
  var deal = preset || { give: { gold: 0, food: 0, iron: 0, cells: [] }, get: { gold: 0, food: 0, iron: 0, cells: [] }, ally: !isAlly(G, P, fi) };
  var STEP = { gold: 10, food: 10, iron: 1 };
  function side(key, owner) {
    var b = deal[key], f = G.factions[owner];
    var res = ['gold', 'food', 'iron'].map(function (r) {
      var icon = r === 'gold' ? I.coin : r === 'food' ? I.food : I.iron;
      return '<div class="stp">' + icon + '<button data-k="' + key + '" data-r="' + r + '" data-d="-1">−</button><b>' + (b[r] || 0) + '</b><button data-k="' + key + '" data-r="' + r + '" data-d="1">+</button><i>/' + Math.floor(f[r]) + '</i></div>';
    }).join('');
    var cells = G.cells.filter(function (c) { return tradable(G, c, owner); }).map(function (c) {
      var on = b.cells.indexOf(c.i) >= 0;
      return '<button class="cchip' + (on ? ' on' : '') + '" data-k="' + key + '" data-c="' + c.i + '">' + (c.t === 3 ? I.city : I.castle) + esc(c.nm || (c.t === 3 ? 'Şehir' : 'Kale')) + '<em>' + c.lv + '</em></button>';
    }).join('');
    return res + (cells ? '<div class="cchips">' + cells + '</div>' : '<p class="muted small">Verilebilecek şehir yok</p>');
  }
  function draw() {
    var r = proposeDeal(G, P, fi, deal), ally = isAlly(G, P, fi);
    modal('<div class="topbar"><button class="back" id="tBack" aria-label="Geri">' + I.back + '</button><div class="dh">' + ART.flag(G.factions[fi].id) + '<b>' + factionName(G, fi) + '</b></div>' + relTag(G, fi) + '</div>' +
      '<label class="atog' + (deal.ally ? ' on' : '') + '" id="tAlly">' + I.handshake + '<span>' + (ally ? 'İttifakı uzat (' + ALLY_TURNS + ' tur)' : 'İttifak kur (' + ALLY_TURNS + ' tur)') + '</span><i></i></label>' +
      annexHTML(fi) +
      '<div class="dcols"><div class="dcol"><div class="eyebrow">Sen verirsin</div>' + side('give', P) + '</div>' +
      '<div class="dcol"><div class="eyebrow">O verir</div>' + side('get', fi) + '</div></div>' +
      '<div class="verdict ' + (r.ok ? 'good' : 'bad') + '">' + (r.ok ? '✓ Kabul eder' : '✕ ' + esc(r.why || 'Kabul etmez')) + '</div>' +
      '<div class="row"><button class="btn ghost" id="tClear">Temizle</button><button class="btn" id="tGo"' + (r.ok ? '' : ' disabled') + '>Teklif et</button></div>', 'deal');
    $('#tBack').onclick = function () { dipMenu(); };
    $('#tAlly').onclick = function () { deal.ally = !deal.ally; draw(); };
    if ($('#tAnnex')) $('#tAnnex').onclick = function () {
      if (!annexInfo(G, P, fi).ok) return;
      act(function () { return annex(G, P, fi); }); B.undo = [];
      closeModal(); SFX.win();
      playLog(function () { updateHud(); renderPanel(); checkOver(); }); dirty = true;
    };
    $('#tClear').onclick = function () { dealTable(fi); };
    document.querySelectorAll('.stp button').forEach(function (b) { b.onclick = function () {
      var k = b.dataset.k, rr2 = b.dataset.r, owner = k === 'give' ? P : fi, max = Math.floor(G.factions[owner][rr2]);
      deal[k][rr2] = Math.max(0, Math.min(max, (deal[k][rr2] || 0) + STEP[rr2] * (+b.dataset.d)));
      SFX.tap(); draw();
    }; });
    document.querySelectorAll('.cchip').forEach(function (b) { b.onclick = function () {
      var arr = deal[b.dataset.k].cells, ci = +b.dataset.c, i = arr.indexOf(ci);
      if (i >= 0) arr.splice(i, 1); else arr.push(ci); SFX.tap(); draw();
    }; });
    $('#tGo').onclick = function () {
      var r2 = proposeDeal(G, P, fi, deal); if (!r2.ok) return;
      act(function () { applyDeal(G, P, fi, deal); return true; });
      B.undo = []; // anlaşmalar geri alınmaz
      closeModal(); SFX.city();
      playLog(function () { updateHud(); renderPanel(); checkOver(); });
      dirty = true;
    };
  }
  draw();
}
function annexHTML(fi) {
  var G = B.G, a = annexInfo(G, G.player, fi);
  return '<button class="annex' + (a.ok ? '' : ' off') + '" id="tAnnex"' + (a.ok ? '' : ' disabled') + '>' + I.crown +
    '<span><b>Bağlı krallık yap</b><i>' + (a.ok ? a.cities + ' şehir ve ' + a.units + ' birlik krallığına katılır' : esc(a.why)) + '</i></span>' + costTag(a.cost) + '</button>';
}
function offerPopup() {
  var G = B.G, o = aiOffer(G, Math.random);
  if (!o) return;
  var g = o.deal.give;
  modal('<div class="dh">' + ART.flag(G.factions[o.from].id) + '<b>' + factionName(G, o.from) + '</b></div>' +
    '<p>İttifak teklif ediyor (' + ALLY_TURNS + ' tur)' + (g.gold ? ' ve karşılığında <b>' + I.coin + g.gold + ' altın</b> veriyor.' : '.') + '</p>' +
    '<div class="row"><button class="btn ghost" id="oNo">Reddet</button><button class="btn" id="oYes">' + I.handshake + ' Kabul et</button></div>');
  $('#oNo').onclick = closeModal;
  $('#oYes').onclick = function () {
    closeModal(); applyDeal(G, o.from, G.player, o.deal); B.undo = [];
    playLog(function () { updateHud(); renderPanel(); }); dirty = true;
  };
}
function genMenu() {
  var G = B.G, u = unitById(G, B.sel), g = genOf(G, u); if (!g) return;
  var mine = u.f === G.player, si = ART.specInfo(g.spec), isSpec = g.spec === u.type || (g.spec === 'kale' && G.cells[u.c].t >= 3);
  modal('<div class="gm"><span class="gmp">' + ART.portrait(g, G.era) + '</span><div><h3>' + esc(g.name) + '</h3><div class="muted">' + ERAS[G.era].ranks[g.rank - 1] + ' ' + insignia(g.rank) + '</div>' +
    '<span class="spec sm" style="--sc:' + si.col + '"><svg viewBox="0 0 24 24">' + si.icon + '</svg>' + si.name + '</span></div></div>' +
    '<div class="rinfo"><div>' + I.sword + '<span>Güç</span><b>+' + Math.round((genMul(g) - 1) * 100) + '%</b><i>' + (isSpec ? 'uzman: +' + Math.round((specMul(g) - 1) * 100) + '% daha' : 'uzmanlık dışı') + '</i></div>' +
    (g.skill ? '<div>' + I.medal + '<span>' + SKILLS[g.skill].name + '</span><i style="grid-column:2/-1">' + SKILLS[g.skill].desc + '</i></div>' : '') + '</div>' +
    '<div class="row">' + (mine ? '<button class="btn ghost" id="gRecall">Geri çağır</button>' : '') + '<button class="btn" id="gOk">Tamam</button></div>');
  $('#gOk').onclick = closeModal;
  if ($('#gRecall')) $('#gRecall').onclick = function () { closeModal(); if (act(function () { return recallGeneral(G, G.player, u.id); })) { toast('General geri çağrıldı'); selectUnit(u); } };
}
function assignMenu() {
  var G = B.G, u = unitById(G, B.sel), free = freeGenerals(G, G.player);
  modal('<h3>General ata: ' + unitName(u) + '</h3><div class="choices">' + free.map(function (g) {
    var spec = g.spec === u.type || (g.spec === 'kale' && (G.cells[u.c].t >= 3)), si = ART.specInfo(g.spec);
    return '<button class="choice" data-g="' + g.id + '"><span class="por">' + ART.portrait(g, G.era) + '</span><div style="min-width:0"><div class="t">' + esc(g.name) + '</div>' +
      '<div class="s">' + ERAS[G.era].ranks[g.rank - 1] + ' · ' + SKILLS[g.skill].name + '</div><div class="s"><span class="spec sm" style="--sc:' + si.col + '"><svg viewBox="0 0 24 24">' + si.icon + '</svg>' + si.name + '</span>' + (spec ? ' <span class="good">✓ bu birliğe uygun</span>' : '') + '</div></div></button>';
  }).join('') + '</div><div class="row"><button class="btn ghost" id="aNo">Vazgeç</button></div>');
  $('#aNo').onclick = closeModal;
  document.querySelectorAll('[data-g]').forEach(function (b) { b.onclick = function () {
    if (act(function () { return assignGeneral(G, G.player, b.dataset.g, u.id); })) { SFX.city(); closeModal(); fx({ k: 'ring', c: u.c, col: '#e8c977' }); selectUnit(unitById(G, u.id)); if (B.tut === 3) { B.tut = 4; showTip(); } }
  }; });
}

/* ---------- seçim ve emirler ---------- */
function selectUnit(u) {
  if (u && u.f === B.G.player) B.lastAct = u.c;
  var G = B.G;
  B.sel = u.id; B.view = null; B.preview = null;
  B.reach = (u.f === G.player && u.mp > 0) ? reach(G, u) : null;
  B.targets = (u.f === G.player && !u.acted) ? G.units.filter(function (e) { return canAttack(G, u, e); }).map(function (e) { return e.id; }) : [];
  renderPanel(); dirty = true;
  if (B.tut === 1 && u.f === G.player) { B.tut = 2; showTip(); }
}
function deselect() { B.sel = 0; B.view = null; B.reach = null; B.targets = []; B.preview = null; renderPanel(); dirty = true; }
function nextUnit(silentIfNone) {
  var G = B.G;
  var list = G.units.filter(function (u) { return u.f === G.player && hasMoves(u); });
  if (!list.length) { if (!silentIfNone) toast('Hamle bekleyen birlik yok. Devam et’e basabilirsin.'); deselect(); return; }
  var i = list.findIndex(function (u) { return u.id === B.sel; });
  var u = list[(i + 1) % list.length];
  selectUnit(u); B.camT = { x: G.cells[u.c].x, y: G.cells[u.c].y, t: 0 };
}
function tapCell(ci) {
  var G = B.G, c = G.cells[ci], u = unitAt(G, ci);
  if (B.phase !== 'player') return;
  var sel = B.sel ? unitById(G, B.sel) : null;
  // saldırı hedefi
  if (sel && u && B.targets.indexOf(u.id) >= 0) {
    if (B.preview === u.id) { doAttack(); return; }
    B.preview = u.id; SFX.sel(); renderPanel(); dirty = true; return;
  }
  // hareket
  if (sel && B.reach && B.reach[ci] && ci !== sel.c && !u) {
    if (!B.betrayOk && (c.t === 3 || c.t === 4) && isAlly(G, G.player, c.f)) {
      modal('<h3>İttifak bozulacak</h3><p class="muted">' + esc(c.nm || 'Bu yer') + ' müttefikin ' + factionName(G, c.f) + '’a ait. Girersen şehri alırsın ama ittifak biter ve diğer ülkeler ' + DISTRUST_TURNS + ' tur sana güvenmez.</p>' +
        '<div class="row"><button class="btn ghost" id="bNo">Vazgeç</button><button class="btn warnb" id="bYes">İhanet et</button></div>');
      $('#bNo').onclick = closeModal;
      $('#bYes').onclick = function () { closeModal(); B.betrayOk = true; tapCell(ci); B.betrayOk = false; };
      return;
    }
    var path = act(function () { return moveUnit(G, sel, ci); });
    if (path) B.lastAct = ci;
    if (path) {
      SFX.step();
      playLog(function () { selectUnit(unitById(G, sel.id)); updateHud(); checkOver(); });
      B.reach = null; B.targets = []; B.preview = null; renderPanel();
      if (B.tut === 2) { B.tut = 3; showTip(); }
    }
    return;
  }
  if (u) { SFX.sel(); selectUnit(u); return; }
  SFX.tap();
  B.sel = 0; B.reach = null; B.targets = []; B.preview = null; B.view = ci;
  if (B.tut === 4 && c.t === 3 && c.f === G.player) { B.tut = 5; showTip(); }
  renderPanel(); dirty = true;
}
function doAttack() {
  var G = B.G, a = unitById(G, B.sel), d = unitById(G, B.preview);
  if (!a || !d || !canAttack(G, a, d)) return;
  B.lastAct = a.c;
  attack(G, a, d, Math.random);
  if (B.undo.length) toast('Saldırılar geri alınamaz; önceki hamleler de kilitlendi.');
  B.undo = [];
  B.preview = null; B.reach = null; B.targets = [];
  playLog(function () {
    var a2 = unitById(G, a.id);
    if (a2) selectUnit(a2); else deselect();
    updateHud(); checkOver();
  });
  renderPanel();
}

/* ---------- animasyon ---------- */
var FX = [];
function fx(o) { o.t0 = performance.now(); o.dur = o.dur || (o.k === 'text' ? 1100 : 600); FX.push(o); dirty = true; }
var playing = null;
/* G.log'daki olayları sırayla oynatır */
function playLog(done) {
  var G = B.G, evs = G.log.slice(); G.log.length = 0;
  var i = 0;
  function nextEv() {
    if (!B) return;
    if (i >= evs.length) { playing = null; if (done) done(); return; }
    var e = evs[i++], sp = B.phase === 'ai' ? B.fast : 1.6;
    if (B.skip) { applyFxQuick(e); nextEv(); return; }
    var d = animEvent(e, sp);
    setTimeout(nextEv, d);
  }
  playing = true;
  nextEv();
}
function applyFxQuick(e) { /* atlamada görsel yok */ }
function animEvent(e, sp) {
  var G = B.G, d = 0;
  if (e.t === 'move') {
    var per = 200 / sp;
    B.anim.push({ k: 'move', u: e.u, path: e.path, t0: performance.now(), dur: per * (e.path.length - 1) });
    if (B.phase === 'ai') ensureVisible(e.path[e.path.length - 1]);
    d = per * (e.path.length - 1) + 40;
    for (var s = 1; s < e.path.length; s++) setTimeout(SFX.step, per * s);
  } else if (e.t === 'attack') {
    if (B.phase === 'ai') ensureVisible(e.dc);
    var dur = 650 / sp;
    B.anim.push({ k: 'atk', e: e, t0: performance.now(), dur: dur });
    if (e.ranged) SFX.arrow(); else SFX.hit();
    setTimeout(function () {
      fx({ k: 'text', c: e.dc, txt: '−' + e.dmg, col: '#ff8a6a' });
      if (e.back) fx({ k: 'text', c: e.ac, txt: '−' + e.back, col: '#ff8a6a' });
      if (e.killD || e.killA) { SFX.kill(); fx({ k: 'boom', c: e.killD ? e.dc : e.ac }); }
    }, dur * 0.55);
    d = dur + 150 / sp;
  } else if (e.t === 'capture') {
    var c = G.cells[e.c];
    fx({ k: 'ring', c: e.c, col: e.to >= 0 ? FACTIONS[G.factions[e.to].id].col : '#ccc' });
    if (c.t === 3) {
      if (e.to === G.player) { SFX.city(); fx({ k: 'text', c: e.c, txt: (c.nm || 'Şehir') + ' alındı!', col: '#e8c977' }); d = 500 / sp; }
      else if (e.from === G.player) { SFX.lost(); toast((c.nm || 'Bir şehrin') + ' düştü!'); d = 500 / sp; }
    }
  } else if (e.t === 'recruit') {
    if (B.phase === 'ai') { fx({ k: 'ring', c: e.c, col: '#fff' }); d = 120 / sp; }
  } else if (e.t === 'build') {
    if (B.phase === 'ai' && e.f !== G.player) d = 40;
  } else if (e.t === 'chase') {
    fx({ k: 'text', c: e.c, txt: 'Takip!', col: '#ffe9a8' }); d = 250 / sp;
  } else if (e.t === 'tower') {
    fx({ k: 'ring', c: e.c, col: '#e8c977' }); if (e.f === G.player) { fx({ k: 'text', c: e.c, txt: 'Kule tamam', col: '#e8c977' }); SFX.build(); }
  } else if (e.t === 'towerDown') {
    if (e.f === G.player) toast('Bir kulen yıkıldı.');
  } else if (e.t === 'ally') {
    if (e.a === G.player || e.b === G.player) { SFX.city(); toast(factionName(G, e.a === G.player ? e.b : e.a) + ' ile ittifak kuruldu (' + ALLY_TURNS + ' tur)'); }
    else toast(factionName(G, e.a) + ' ve ' + factionName(G, e.b) + ' ittifak kurdu');
    d = 500 / sp;
  } else if (e.t === 'betray') {
    SFX.lost(); toast(e.a === G.player ? 'İttifakı bozdun: ' + factionName(G, e.b) + ' artık düşman' : factionName(G, e.a) + ' ihanet etti!'); d = 700 / sp;
  } else if (e.t === 'allyEnd') {
    if (e.a === G.player || e.b === G.player) toast(factionName(G, e.a === G.player ? e.b : e.a) + ' ile ittifak süresi doldu');
  } else if (e.t === 'annex') {
    var capA = G.cells.filter(function (c) { return c.cap && c.f === e.a; });
    capA.forEach(function (c) { fx({ k: 'ring', c: c.i, col: '#e8c977' }); });
    toast(e.a === G.player ? FACTIONS[G.factions[e.b].id].name + ' artık senin bağlı krallığın' : factionName(G, e.b) + ' ' + factionName(G, e.a) + '’a katıldı');
    d = 700 / sp;
  } else if (e.t === 'cede') {
    fx({ k: 'ring', c: e.c, col: e.to >= 0 ? FACTIONS[G.factions[e.to].id].col : '#ccc' });
    if (G.cells[e.c].nm) fx({ k: 'text', c: e.c, txt: G.cells[e.c].nm, col: '#fff' });
    d = 300 / sp;
  } else if (e.t === 'elim') {
    toast(factionName(G, e.f) + ' yıkıldı!'); d = 700 / sp;
  } else if (e.t === 'wounded') {
    var gg = G.factions[e.f].generals.filter(function (x) { return x.id === e.gen; })[0];
    if (gg && e.f === G.player) toast(gg.name + ' yaralandı, 3 tur dinlenecek.');
  } else if (e.t === 'starve') {
    if (e.f === G.player) toast('Gıda bitti! Birliklerin aç, her tur can kaybediyor.');
  }
  dirty = true;
  return d;
}

/* ---------- tur akışı ---------- */
/* geri alma: saldırı dışındaki her hamleden önce durum saklanır */
function act(fn) {
  var snap = JSON.stringify(B.G);
  var r = fn();
  if (r) {
    B.undo.push(snap); if (B.undo.length > 30) B.undo.shift();
    var su = B.sel ? unitById(B.G, B.sel) : null;
    if (B.view !== null && B.view !== undefined) B.lastAct = B.view; else if (su) B.lastAct = su.c;
  }
  return r;
}
function undoLast() {
  if (!B || B.phase !== 'player' || playing || !B.undo.length) return;
  B.G = JSON.parse(B.undo.pop()); B.G.log = [];
  SFX.tap(); B.anim = []; FX = [];
  B.sel = 0; B.view = null; B.reach = null; B.targets = []; B.preview = null; B.confirmEnd = false;
  updateHud(); renderPanel(); dirty = true;
  toast('Son hamle geri alındı');
}
function endPlayerTurn() {
  if (B) B.camMem = { x: B.cam.x, y: B.cam.y, s: B.cam.s };
  var G = B.G;
  B.undo = [];
  if (B.phase !== 'player' || playing) return;
  SFX.tap();
  deselect();
  endTurn(G);
  if (checkOver()) return;
  runAI();
}
function runAI() {
  var G = B.G;
  B.phase = 'ai'; B.skip = false; renderPanel();
  $('#aiBar').hidden = false;
  $('#aiFast').classList.toggle('on', B.fast > 1);
  var it = null;
  function nextFaction() {
    if (!B || checkOver()) return;
    if (G.cur === G.player) {
      B.phase = 'player'; B.skip = false; $('#aiBar').hidden = true;
      // kamerayı oyuncunun son hamlesinin olduğu yere geri getir
      var lc = B.lastAct !== undefined ? G.cells[B.lastAct] : null;
      if (B.camMem) B.cam.s = B.camMem.s;
      if (lc) B.camT = { x: lc.x, y: lc.y }; else if (B.camMem) B.camT = { x: B.camMem.x, y: B.camMem.y };
      G.log.length = 0;
      SFX.turn(); banner('Tur ' + G.turn + ' · Senin sıran', 1300);
      setTimeout(function () { if (B && B.phase === 'player') offerPopup(); }, 900);
      updateHud(); persistGame(); renderPanel(); dirty = true;
      return;
    }
    $('#aiWho').innerHTML = ART.flag(G.factions[G.cur].id) + '<span>' + esc(factionName(G, G.cur)) + ' oynuyor…</span>';
    it = aiTurn(G, G.cur, Math.random);
    step();
  }
  function step() {
    if (!B) return;
    var r = it.next();
    if (r.done || G.over) {
      endTurn(G); G.log.length = 0;
      if (B.skip) { nextFaction(); } else setTimeout(nextFaction, 120 / B.fast);
      return;
    }
    if (B.skip) { G.log.length = 0; step(); return; }
    playLog(function () { setTimeout(step, 60 / B.fast); });
  }
  nextFaction();
}
function checkOver() {
  var G = B.G;
  if (!G.over || B.phase === 'done') return !!G.over && B.phase === 'done';
  B.phase = 'done'; $('#aiBar').hidden = true; renderPanel();
  setTimeout(function () { finish(G.over === 1, G.over === -2); }, 600);
  return true;
}
function pauseMenu() {
  SFX.tap();
  var G = B.G;
  modal('<h2>Sefer menüsü</h2><p class="muted">' + MAPS[G.mapIdx].name + ' · Tur ' + G.turn + ' / ' + G.limit + '</p>' +
    '<div class="card mini"><b>Ülkeler</b>' + G.factions.map(function (f, i) {
      var cities = G.cells.filter(function (c) { return c.t === 3 && c.f === i; }).length, units = G.units.filter(function (u) { return u.f === i; }).length;
      return '<div class="frow' + (f.alive ? '' : ' dead') + '">' + ART.flag(f.id) + '<span>' + factionName(G, i) + (i === G.player ? ' (sen)' : '') + '</span><span class="muted">' + (f.alive ? cities + ' şehir · ' + units + ' birlik' : 'yıkıldı') + '</span></div>';
    }).join('') + '</div>' +
    '<div class="row"><button class="btn" id="pRes">Devam et</button></div><div class="row"><button class="btn ghost" id="pRe">Yeniden başla</button><button class="btn ghost" id="pQuit">Kaydet ve çık</button></div>');
  $('#pRes').onclick = closeModal;
  $('#pRe').onclick = function () { closeModal(); var e = G.era, l = G.level, f = G.factions[G.player].id; store(GAME_KEY, null); B = null; startGame(e, l, f); };
  $('#pQuit').onclick = function () { closeModal(); if (B.phase === 'player') persistGame(); var e = G.era; B = null; $('#scr-battle').hidden = true; openEra(e); };
}
function finish(win, timeout) {
  var G = B.G, key = G.era + '-' + G.level, prev = save.stars[key] || 0;
  var full = win && !!G.endless; // %60 zaferinden sonra bütün haritayı fethetti
  var st = win ? (full ? G.stars0 : starsFor(G)) : 0;
  var medals = full ? 30 + 10 * G.level : win ? 20 + 10 * st + 10 * G.level : (G.endless ? 0 : 10);
  if (win && !full && st > prev) { medals += 10 * (st - prev); save.stars[key] = st; }
  var canGoOn = win && !full && G.factions.some(function (f, i) { return i !== G.player && f.alive; });
  var before = eraStars(G.era) - (win && st > prev ? st - prev : 0);
  var gens = G.factions[G.player].generals, ups = [];
  gens.forEach(function (g) {
    var add = g.gained + (win && g.gained > 0 ? 40 : 0);
    g.gained = 0;
    var r0 = rankOf(genXP(g.id)); save.gx[g.id] = genXP(g.id) + add; var r1 = rankOf(save.gx[g.id]);
    g.add = add; if (r1 > r0) ups.push(g.name + ' terfi etti: ' + ERAS[G.era].ranks[r1 - 1] + ' ' + insignia(r1));
  });
  var newGens = GENERALS.filter(function (x) { return x.era === G.era && x.unlock > before && x.unlock <= eraStars(G.era); });
  save.medals += medals; persist(); store(GAME_KEY, null);
  (win ? SFX.win : SFX.lose)();
  var hasNext = G.level + 1 < LEVELS.length;
  modal('<div class="result">' +
    '<div class="eyebrow">' + MAPS[G.mapIdx].name + ' · ' + G.turn + '. tur</div>' +
    '<h2 class="' + (win ? 'w' : 'l') + '">' + (full ? 'TAM FETİH' : win ? 'ZAFER' : 'YENİLGİ') + '</h2>' +
    (full ? '<p class="muted">Haritadaki bütün ülkeler senin sancağın altında.</p>' : '') +
    (win ? '<div class="big">' + [1, 2, 3].map(function (k) { return k <= st ? '<b>★</b>' : '★'; }).join('') + '</div>' :
      '<p class="muted">' + (timeout ? 'Tur sınırı doldu. Daha hızlı ilerlemek için asker üretimini artır ve zayıf komşuya yüklen.' : 'Bütün şehirlerini kaybettin. Şehirlerini boş bırakma, kaleleri ve dağları savunmada kullan.') + '</p>') +
    '<div class="rewards"><span class="pill">' + I.medal + '+' + medals + ' madalya</span></div>' +
    '<div class="gsum">' + gens.map(function (g) { return '<div class="gline"><span class="gp">' + ART.portrait(g, G.era) + '</span><span>' + esc(g.name) + '</span><b>+' + g.add + ' TP</b></div>'; }).join('') + '</div>' +
    '<p class="muted">Yok edilen düşman: ' + G.stats.kills + ' · alınan şehir: ' + G.stats.cities + ' · kaybedilen birlik: ' + G.stats.lost + '</p>' +
    ups.map(function (t) { return '<div class="rankup">' + t + '</div>'; }).join('') +
    newGens.map(function (x) { return '<div class="rankup">Yeni general açıldı: ' + x.name + '</div>'; }).join('') +
    (canGoOn ? '<div class="row"><button class="btn" id="rCont">Haritayı fethetmeye devam et</button></div>' : '') +
    '<div class="row">' + (win && hasNext ? '<button class="btn' + (canGoOn ? ' ghost' : '') + '" id="rNext">Sonraki sefer</button>' : '<button class="btn" id="rAgain">' + (win ? 'Tekrar oyna' : 'Tekrar dene') + '</button>') + '</div>' +
    '<div class="row"><button class="btn ghost" id="rMenu">Seferler</button>' + (win && hasNext ? '<button class="btn ghost" id="rAgain">Tekrar</button>' : '') + '</div></div>');
  var x = { e: G.era, l: G.level, f: G.factions[G.player].id };
  if ($('#rNext')) $('#rNext').onclick = function () { closeModal(); B = null; $('#scr-battle').hidden = true; openEra(x.e); openSetup(x.e, x.l + 1); };
  $('#rAgain').onclick = function () { closeModal(); B = null; startGame(x.e, x.l, x.f); };
  if ($('#rCont')) $('#rCont').onclick = function () {
    // ödüller verildi; tur sınırı kalkar, bütün rakipler yıkılınca sefer biter
    closeModal(); G.endless = true; G.stars0 = st; G.over = 0;
    B.phase = G.cur === G.player ? 'player' : 'ai';
    updateHud(); renderPanel(); dirty = true; persistGame();
    banner('Fetih sürüyor: bütün rakipleri yık', 1800);
    if (B.phase === 'ai') runAI();
  };
  $('#rMenu').onclick = function () { closeModal(); B = null; $('#scr-battle').hidden = true; openEra(x.e); };
}

/* ---------- dokunma ---------- */
var ptrs = {}, gest = null;
cv.addEventListener('pointerdown', function (ev) {
  if (!B) return;
  cv.setPointerCapture(ev.pointerId);
  var r = cv.getBoundingClientRect(), x = ev.clientX - r.left, y = ev.clientY - r.top;
  ptrs[ev.pointerId] = { x: x, y: y, x0: x, y0: y };
  var ids = Object.keys(ptrs);
  if (ids.length === 2) {
    var a = ptrs[ids[0]], c = ptrs[ids[1]];
    gest = { k: 'pinch', d: Math.hypot(a.x - c.x, a.y - c.y), mx: (a.x + c.x) / 2, my: (a.y + c.y) / 2, s: B.cam.s, cx: B.cam.x, cy: B.cam.y };
  } else gest = { k: 'pan', cx: B.cam.x, cy: B.cam.y, moved: false };
});
cv.addEventListener('pointermove', function (ev) {
  var p = ptrs[ev.pointerId]; if (!p || !B || !gest) return;
  var r = cv.getBoundingClientRect(); p.x = ev.clientX - r.left; p.y = ev.clientY - r.top;
  if (gest.k === 'pinch') {
    var ids = Object.keys(ptrs); if (ids.length < 2) return;
    var a = ptrs[ids[0]], c = ptrs[ids[1]];
    var d = Math.hypot(a.x - c.x, a.y - c.y), mx = (a.x + c.x) / 2, my = (a.y + c.y) / 2;
    var wx = (gest.mx - B.ox) / gest.s + gest.cx, wy = (gest.my - B.oy) / gest.s + gest.cy;
    B.cam.s = gest.s * d / gest.d; clampCam(B);
    B.cam.x = wx - (mx - B.ox) / B.cam.s; B.cam.y = wy - (my - B.oy) / B.cam.s; clampCam(B); dirty = true; return;
  }
  if (Math.hypot(p.x - p.x0, p.y - p.y0) > 9) gest.moved = true;
  if (gest.moved) { B.cam.x = gest.cx - (p.x - p.x0) / B.cam.s; B.cam.y = gest.cy - (p.y - p.y0) / B.cam.s; clampCam(B); B.camT = null; dirty = true; }
});
function up(ev) {
  var p = ptrs[ev.pointerId]; delete ptrs[ev.pointerId];
  if (!B || !p || !gest) return;
  if (gest.k === 'pinch') { if (!Object.keys(ptrs).length) gest = null; return; }
  if (!gest.moved && !playing) { var ci = cellAt(p.x, p.y); if (ci >= 0) tapCell(ci); else deselect(); }
  gest = null;
}
cv.addEventListener('pointerup', up);
cv.addEventListener('pointercancel', function (ev) { delete ptrs[ev.pointerId]; gest = null; });
cv.addEventListener('wheel', function (ev) {
  if (!B) return; ev.preventDefault();
  var r = cv.getBoundingClientRect(), x = ev.clientX - r.left, y = ev.clientY - r.top, w = s2w(x, y);
  B.cam.s *= ev.deltaY < 0 ? 1.12 : 0.89; clampCam(B);
  B.cam.x = w.x - (x - B.ox) / B.cam.s; B.cam.y = w.y - (y - B.oy) / B.cam.s; clampCam(B); dirty = true;
}, { passive: false });

/* ---------- çizim ---------- */
var SHC = {};
function sh(c, f) { var k = c + f; return SHC[k] || (SHC[k] = ART.shade(c, f)); }
function landCol(G, c) { return c.f < 0 ? NEUTRAL_COL : FACTIONS[G.factions[c.f].id].col; }
function rr(x, y, w, h, r) { ctx.beginPath(); ctx.moveTo(x + r, y); ctx.arcTo(x + w, y, x + w, y + h, r); ctx.arcTo(x + w, y + h, x, y + h, r); ctx.arcTo(x, y + h, x, y, r); ctx.arcTo(x, y, x + w, y, r); ctx.closePath(); }
function unitDrawPos(u, now) {
  var G = B.G, c = G.cells[u.c];
  for (var i = 0; i < B.anim.length; i++) {
    var a = B.anim[i];
    if (a.k === 'move' && a.u === u.id) {
      var n = a.path.length - 1; if (n < 1) break;
      var k = Math.max(0, Math.min(1, (now - a.t0) / Math.max(1, a.dur))), f = k * n, s = Math.min(n - 1, Math.floor(f)), t = f - s;
      var A = G.cells[a.path[s]], Bc = G.cells[a.path[s + 1]];
      return { x: A.x + (Bc.x - A.x) * t, y: A.y + (Bc.y - A.y) * t, sea: (t < 0.5 ? A : Bc).t === 0 };
    }
  }
  return { x: c.x, y: c.y, sea: c.t === 0 };
}
function render(now) {
  var G = B.G, s = B.cam.s;
  ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
  // deniz zemini
  var g = ctx.createLinearGradient(0, 0, 0, H); g.addColorStop(0, '#1d4560'); g.addColorStop(1, '#0f2638');
  ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
  var vis = [];
  G.cells.forEach(function (c) {
    var p = w2s(c.x, c.y);
    if (p.x < -s * 1.2 || p.x > W + s * 1.2 || p.y < -s * 1.2 || p.y > H + s * 1.2) return;
    vis.push([c, p]);
  });
  // hücreler
  vis.forEach(function (v) {
    var c = v[0], p = v[1];
    hexPath(ctx, p.x, p.y, s * 1.005);
    if (!c.t) {
      ctx.fillStyle = (c.q + c.r) % 2 ? '#22506d' : '#235370'; ctx.fill();
      if (s > 18) { ctx.strokeStyle = 'rgba(190,225,245,.18)'; ctx.lineWidth = 1.2; ctx.beginPath(); ctx.moveTo(p.x - s * 0.35, p.y); ctx.quadraticCurveTo(p.x - s * 0.17, p.y - s * 0.12, p.x, p.y); ctx.quadraticCurveTo(p.x + s * 0.17, p.y + s * 0.12, p.x + s * 0.35, p.y); ctx.stroke(); }
      return;
    }
    var col = landCol(G, c);
    var gr = ctx.createLinearGradient(p.x, p.y - s, p.x, p.y + s);
    gr.addColorStop(0, sh(col, 0.42)); gr.addColorStop(1, sh(col, 0.22));
    ctx.fillStyle = gr; ctx.fill();
    if (c.mt) drawMountain(p.x, p.y, s);
    if (c.t === 2) drawFarm(p.x, p.y, s, c.lv);
  });
  // ince ızgara ve sınırlar
  vis.forEach(function (v) {
    var c = v[0], p = v[1];
    if (!c.t) return;
    for (var k = 0; k < 6; k++) {
      var a1 = Math.PI / 180 * (60 * k - 30), a2 = Math.PI / 180 * (60 * k + 30);
      var mx = p.x + s * 0.87 * Math.cos(Math.PI / 180 * 60 * k), my = p.y + s * 0.87 * Math.sin(Math.PI / 180 * 60 * k);
      var n = null;
      for (var z = 0; z < c.nb.length; z++) { var o = G.cells[c.nb[z]]; var q = w2s(o.x, o.y); if (Math.hypot(q.x - (2 * mx - p.x), q.y - (2 * my - p.y)) < s * 0.3) { n = o; break; } }
      var x1 = p.x + s * Math.cos(a1), y1 = p.y + s * Math.sin(a1), x2 = p.x + s * Math.cos(a2), y2 = p.y + s * Math.sin(a2);
      if (!n || !n.t) { ctx.strokeStyle = '#efe3c4'; ctx.lineWidth = Math.max(1.5, s * 0.07); }
      else if (n.f !== c.f) { if (n.i < c.i) continue; ctx.strokeStyle = 'rgba(20,14,10,.9)'; ctx.lineWidth = Math.max(2, s * 0.09); }
      else { if (n.i < c.i) continue; ctx.strokeStyle = 'rgba(0,0,0,.13)'; ctx.lineWidth = 1; }
      ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.stroke();
    }
  });
  // vurgular
  if (B.reach && B.phase === 'player') {
    Object.keys(B.reach).forEach(function (k) {
      var ci = +k, c = G.cells[ci]; if (ci === unitById(G, B.sel).c) return;
      if (unitAt(G, ci)) return;
      var p = w2s(c.x, c.y);
      hexPath(ctx, p.x, p.y, s * 0.92);
      ctx.fillStyle = c.t ? 'rgba(255,250,230,.42)' : 'rgba(200,235,255,.32)'; ctx.fill();
      ctx.strokeStyle = 'rgba(255,255,255,.85)'; ctx.lineWidth = 1.5; ctx.stroke();
      ctx.beginPath(); ctx.arc(p.x, p.y, Math.max(3, s * 0.1), 0, 7); ctx.fillStyle = 'rgba(255,255,255,.9)'; ctx.fill();
      if (B.reach[ci].emb && G.cells[ci].t === 0) { ctx.fillStyle = 'rgba(20,40,60,.7)'; ctx.font = '700 ' + Math.max(10, s * 0.32) + 'px "Barlow Condensed", sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText('BİN', p.x, p.y); }
    });
  }
  if (B.view !== null && B.view !== undefined) { var vc = G.cells[B.view], vp = w2s(vc.x, vc.y); hexPath(ctx, vp.x, vp.y, s * 0.9); ctx.strokeStyle = '#e8c977'; ctx.lineWidth = 3; ctx.stroke(); }
  // yapılar
  vis.forEach(function (v) {
    var c = v[0], p = v[1];
    if (c.t === 3 || c.t === 4) {
      var im = ART.bImg(c.t === 3 ? 'city' : 'castle', c.lv), wd = s * (c.t === 3 ? 1.25 : 1.05), ht = wd * 0.75;
      var occupied = !!unitAt(G, c.i);
      var by = occupied ? p.y - s * 0.95 : p.y - ht * 0.55;
      if (im.complete) ctx.drawImage(im, p.x - wd / 2, by, wd, ht);
      if (c.cap) { ctx.fillStyle = '#e8c977'; ctx.strokeStyle = '#4b360c'; ctx.lineWidth = 1.2; star(p.x + wd * 0.42, by + ht * 0.15, s * 0.16); }
      // seviye ve bina rozetleri
      var bx = p.x - s * 0.62, byy = p.y + s * 0.5;
      badge(bx, byy, s, String(c.lv), c.t === 3 ? '#f1e7d2' : '#d7cfbe');
      if (c.smith) badge(bx + s * 0.34, byy, s, '⚒', '#c3ccd3');
      if (c.port) badge(bx + s * (c.smith ? 0.68 : 0.34), byy, s, '⚓', '#a9d0ea');
      if (c.nm && s > 22 && !occupied) label(c.nm, p.x, p.y + s * 0.62, s);
      if (c.nm && s > 22 && occupied) label(c.nm, p.x, by - s * 0.02, s, true);
    }
  });
  // hedefler
  if (B.targets.length && B.phase === 'player') {
    B.targets.forEach(function (id) {
      var u = unitById(G, id); if (!u) return; var p = w2s(G.cells[u.c].x, G.cells[u.c].y);
      ctx.beginPath(); ctx.arc(p.x, p.y, s * 0.8, 0, 7); ctx.strokeStyle = B.preview === id ? '#ffdf6b' : '#ff4a3d'; ctx.lineWidth = Math.max(3, s * 0.1); ctx.setLineDash([s * 0.25, s * 0.12]); ctx.stroke(); ctx.setLineDash([]);
    });
  }
  // birlikler
  var units = G.units.slice().sort(function (a, b) { return G.cells[a.c].y - G.cells[b.c].y; });
  // saldırıda ölenleri hayalet olarak çiz
  B.anim.forEach(function (a) {
    if (a.k !== 'atk') return;
    var e = a.e;
    if (e.killD && !unitById(G, e.d)) units.push({ id: -e.d, f: e.df, type: e.dtype, c: e.dc, hp: 0, lvl: 1, emb: e.demb, ghost: a });
    if (e.killA && !unitById(G, e.a)) units.push({ id: -e.a, f: e.af, type: e.atype, c: e.ac, hp: 0, lvl: 1, emb: e.aemb, ghost: a });
  });
  units.forEach(function (u) { drawUnit(u, now); });
  // efektler
  FX = FX.filter(function (f) { return now - f.t0 < f.dur; });
  FX.forEach(function (f) {
    var k = Math.max(0, (now - f.t0) / f.dur), c = G.cells[f.c], p = w2s(c.x, c.y);
    if (f.k === 'ring') { ctx.beginPath(); ctx.arc(p.x, p.y, s * (0.4 + k * 0.9), 0, 7); ctx.strokeStyle = f.col; ctx.globalAlpha = 1 - k; ctx.lineWidth = 3; ctx.stroke(); ctx.globalAlpha = 1; }
    if (f.k === 'boom') { for (var q = 0; q < 8; q++) { var an = q * 0.8; ctx.beginPath(); ctx.arc(p.x + Math.cos(an) * s * k * 0.7, p.y + Math.sin(an) * s * k * 0.7, s * 0.2 * (1 - k), 0, 7); ctx.fillStyle = q % 2 ? '#ffb347' : '#ff6b3d'; ctx.fill(); } }
    if (f.k === 'text') { ctx.globalAlpha = Math.min(1, 2 - 2 * k); ctx.font = '700 ' + Math.max(15, s * 0.42) + 'px "Barlow Condensed", sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.lineWidth = 3; ctx.strokeStyle = 'rgba(0,0,0,.7)'; ctx.strokeText(f.txt, p.x, p.y - s * 0.7 - k * s * 0.7); ctx.fillStyle = f.col; ctx.fillText(f.txt, p.x, p.y - s * 0.7 - k * s * 0.7); ctx.globalAlpha = 1; }
  });
  // oklar / çarpışma
  B.anim.forEach(function (a) {
    if (a.k !== 'atk') return;
    var k = Math.max(0, Math.min(1, (now - a.t0) / a.dur)), e = a.e, A = G.cells[e.ac], D = G.cells[e.dc];
    if (e.ranged || e.naval) {
      var t = Math.min(1, k / 0.55), x = A.x + (D.x - A.x) * t, y = A.y + (D.y - A.y) * t - Math.sin(t * Math.PI) * 0.9, p = w2s(x, y);
      if (k < 0.55) { ctx.fillStyle = '#f3ecdc'; ctx.beginPath(); ctx.arc(p.x, p.y, Math.max(2.5, s * 0.07), 0, 7); ctx.fill(); }
    }
  });
  B.anim = B.anim.filter(function (a) { return now - a.t0 < a.dur; });
}
function star(x, y, r) { ctx.beginPath(); for (var i = 0; i < 10; i++) { var a = -Math.PI / 2 + i * Math.PI / 5, rr2 = i % 2 ? r * 0.45 : r; i ? ctx.lineTo(x + rr2 * Math.cos(a), y + rr2 * Math.sin(a)) : ctx.moveTo(x + rr2 * Math.cos(a), y + rr2 * Math.sin(a)); } ctx.closePath(); ctx.fill(); ctx.stroke(); }
function badge(x, y, s, t, col) {
  var r = Math.max(6, s * 0.17);
  ctx.beginPath(); ctx.arc(x, y, r, 0, 7); ctx.fillStyle = col; ctx.fill(); ctx.strokeStyle = '#2b2015'; ctx.lineWidth = 1.2; ctx.stroke();
  ctx.fillStyle = '#2b2015'; ctx.font = '700 ' + (r * 1.35) + 'px "Barlow Condensed", sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(t, x, y + 0.5);
}
function label(t, x, y, s, top) {
  ctx.font = '600 ' + Math.max(10, s * 0.26) + 'px "Alegreya Sans", sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = top ? 'bottom' : 'top';
  ctx.lineWidth = 3; ctx.strokeStyle = 'rgba(30,22,14,.75)'; ctx.strokeText(t, x, y); ctx.fillStyle = '#fbf3df'; ctx.fillText(t, x, y);
}
function drawMountain(x, y, s) {
  ctx.fillStyle = 'rgba(70,60,50,.35)';
  ctx.beginPath(); ctx.moveTo(x - s * 0.7, y + s * 0.45); ctx.lineTo(x - s * 0.25, y - s * 0.35); ctx.lineTo(x + s * 0.05, y + s * 0.1); ctx.lineTo(x + s * 0.3, y - s * 0.2); ctx.lineTo(x + s * 0.7, y + s * 0.45); ctx.closePath(); ctx.fill();
  ctx.fillStyle = 'rgba(255,255,255,.55)';
  ctx.beginPath(); ctx.moveTo(x - s * 0.36, y - s * 0.16); ctx.lineTo(x - s * 0.25, y - s * 0.35); ctx.lineTo(x - s * 0.13, y - s * 0.16); ctx.closePath(); ctx.fill();
}
function drawFarm(x, y, s, lv) {
  ctx.save(); hexPath(ctx, x, y, s * 0.82); ctx.clip();
  ctx.fillStyle = lv > 1 ? 'rgba(126,170,60,.55)' : 'rgba(214,180,80,.5)'; ctx.fillRect(x - s, y - s, s * 2, s * 2);
  ctx.strokeStyle = lv > 1 ? 'rgba(70,110,30,.6)' : 'rgba(150,110,30,.55)'; ctx.lineWidth = Math.max(1, s * 0.05);
  for (var i = -4; i <= 4; i++) { ctx.beginPath(); ctx.moveTo(x - s + i * s * 0.25, y + s); ctx.lineTo(x + i * s * 0.25 + s * 0.4, y - s); ctx.stroke(); }
  if (lv > 1) { ctx.strokeStyle = 'rgba(90,170,220,.9)'; ctx.lineWidth = Math.max(1.5, s * 0.07); ctx.beginPath(); ctx.moveTo(x - s, y + s * 0.1); ctx.bezierCurveTo(x - s * 0.3, y - s * 0.2, x + s * 0.2, y + s * 0.4, x + s, y); ctx.stroke(); }
  ctx.restore();
}
function drawUnit(u, now) {
  var G = B.G, s = B.cam.s, pos = u.ghost ? { x: G.cells[u.c].x, y: G.cells[u.c].y } : unitDrawPos(u, now);
  var p = w2s(pos.x, pos.y);
  if (p.x < -s * 2 || p.x > W + s * 2 || p.y < -s * 2 || p.y > H + s * 2) return;
  var col = u.f < 0 ? NEUTRAL_COL : FACTIONS[G.factions[u.f].id].col;
  var cell = G.cells[u.c], onBuild = !u.ghost && (cell.t === 3 || cell.t === 4) && !B.anim.some(function (a) { return a.k === 'move' && a.u === u.id; });
  var size = s * (onBuild ? 1.4 : 1.65), cy = p.y + (onBuild ? s * 0.22 : 0);
  var alpha = 1, dx = 0;
  if (u.ghost) { var k = Math.max(0, Math.min(1, (now - u.ghost.t0) / u.ghost.dur)); alpha = k < 0.55 ? 1 : 1 - (k - 0.55) / 0.45; }
  B.anim.forEach(function (a) {
    if (a.k !== 'atk') return; var k = Math.max(0, Math.min(1, (now - a.t0) / a.dur));
    if ((a.e.a === u.id || -a.e.a === u.id) && !a.e.ranged && !a.e.naval) { var A = G.cells[a.e.ac], D = G.cells[a.e.dc]; var lunge = Math.sin(Math.min(1, k / 0.6) * Math.PI) * 0.35; pos = { x: A.x + (D.x - A.x) * lunge, y: A.y + (D.y - A.y) * lunge }; p = w2s(pos.x, pos.y); cy = p.y + (onBuild ? s * 0.2 : 0); }
    if ((a.e.d === u.id || -a.e.d === u.id) && k > 0.5 && k < 0.8) dx = Math.sin(k * 60) * s * 0.06;
  });
  var mine = u.f === G.player, done = mine && !u.ghost && B.phase === 'player' && !UT[u.type].tower && !hasMoves(u);
  ctx.globalAlpha = alpha;
  if (B.sel === u.id) { ctx.beginPath(); ctx.ellipse(p.x, cy + size * 0.38, size * 0.42, size * 0.13, 0, 0, 7); ctx.fillStyle = 'rgba(255,223,107,.55)'; ctx.fill(); ctx.strokeStyle = '#ffdf6b'; ctx.lineWidth = 2; ctx.stroke(); }
  else if (mine && !done && B.phase === 'player') { ctx.beginPath(); ctx.ellipse(p.x, cy + size * 0.38, size * 0.38, size * 0.11, 0, 0, 7); ctx.strokeStyle = 'rgba(255,240,190,.9)'; ctx.lineWidth = 2; ctx.stroke(); }
  var type = figType(u), im = ART.fig(type, col);
  if (done) ctx.filter = 'saturate(.35) brightness(.85)';
  if (im.complete) ctx.drawImage(im, p.x - size / 2 + dx, cy - size * 0.58, size, size);
  ctx.filter = 'none';
  if (!u.ghost) {
    // can çubuğu
    var bw = s * 0.95, bh = Math.max(4, s * 0.12), bx = p.x - bw / 2, by = cy + size * 0.42;
    rr(bx - 1, by - 1, bw + 2, bh + 2, bh / 2); ctx.fillStyle = 'rgba(15,10,6,.85)'; ctx.fill();
    var hp = Math.max(0, u.hp) / 100;
    rr(bx, by, bw * hp, bh, bh / 2); ctx.fillStyle = hp > 0.6 ? '#6dcf6a' : hp > 0.3 ? '#e8c03a' : '#e2503f'; ctx.fill();
    var mk2 = morale(G, u);
    if (mk2) {
      var mr = Math.max(7, s * 0.2), mx = bx - mr - 2, my = by + bh / 2;
      ctx.beginPath(); ctx.arc(mx, my, mr, 0, 7); ctx.fillStyle = mk2 === 'cevrili' ? '#b3261e' : '#d9534a'; ctx.fill(); ctx.strokeStyle = '#fff'; ctx.lineWidth = 1.5; ctx.stroke();
      ctx.strokeStyle = '#fff'; ctx.lineWidth = Math.max(1.5, mr * 0.28); ctx.beginPath();
      ctx.moveTo(mx - mr * 0.55, my - mr * 0.45); ctx.lineTo(mx - mr * 0.1, my); ctx.lineTo(mx - mr * 0.55, my + mr * 0.45);
      ctx.moveTo(mx + mr * 0.55, my - mr * 0.45); ctx.lineTo(mx + mr * 0.1, my); ctx.lineTo(mx + mr * 0.55, my + mr * 0.45); ctx.stroke();
    }
    // renk şeridi (sahiplik)
    rr(bx - 1, by + bh + 1.5, bw + 2, Math.max(2.5, s * 0.06), 2); ctx.fillStyle = col; ctx.fill();
    if (isAlly(G, G.player, u.f)) { ctx.strokeStyle = '#7ee08a'; ctx.lineWidth = 1.5; ctx.stroke(); var hx = bx + bw + 4, hy = by + bh / 2, hr = Math.max(6, s * 0.16); ctx.beginPath(); ctx.arc(hx + hr, hy, hr, 0, 7); ctx.fillStyle = '#2f7a3a'; ctx.fill(); ctx.strokeStyle = '#fff'; ctx.lineWidth = 1.2; ctx.stroke(); ctx.fillStyle = '#fff'; ctx.font = '700 ' + (hr * 1.3) + 'px sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText('✓', hx + hr, hy + 0.5); }
    if (u.build) { ctx.fillStyle = '#ffe9a8'; ctx.font = '700 ' + Math.max(10, s * 0.3) + 'px "Barlow Condensed", sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'bottom'; ctx.lineWidth = 3; ctx.strokeStyle = 'rgba(0,0,0,.7)'; ctx.strokeText(u.build + ' tur', p.x, cy - size * 0.5); ctx.fillText(u.build + ' tur', p.x, cy - size * 0.5); }
    // seviye
    if (u.lvl > 1 && !UT[u.type].tower) { ctx.fillStyle = '#e8c977'; ctx.font = '700 ' + Math.max(9, s * 0.24) + 'px "Barlow Condensed", sans-serif'; ctx.textAlign = 'left'; ctx.textBaseline = 'middle'; ctx.fillText('▲'.repeat(u.lvl - 1), bx + bw + 3, by + bh / 2); }
    // general
    var g = genOf(G, u);
    if (g) {
      var gr = Math.max(8, s * 0.27), gx = p.x - size * 0.36, gy = cy - size * 0.42, pim = ART.portraitImg(g, G.era);
      ctx.save(); ctx.beginPath(); ctx.arc(gx, gy, gr, 0, 7); ctx.clip(); if (pim.complete) ctx.drawImage(pim, gx - gr, gy - gr, gr * 2, gr * 2); ctx.restore();
      ctx.beginPath(); ctx.arc(gx, gy, gr, 0, 7); ctx.strokeStyle = '#e8c977'; ctx.lineWidth = 2; ctx.stroke();
      ctx.fillStyle = '#e8c977'; ctx.font = '700 ' + Math.max(8, gr * 0.75) + 'px "Barlow Condensed", sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'top';
      ctx.fillText('★'.repeat(g.rank), gx, gy + gr + 1);
    }
  }
  ctx.globalAlpha = 1;
}
function loop(now) {
  if (!B) return;
  if (B.camT) {
    var t = B.camT; B.cam.x += (t.x - B.cam.x) * 0.18; B.cam.y += (t.y - B.cam.y) * 0.18; clampCam(B);
    if (Math.hypot(t.x - B.cam.x, t.y - B.cam.y) < 0.05) B.camT = null;
    dirty = true;
  }
  if (dirty || B.anim.length || FX.length) { render(now); dirty = !!(B.anim.length || FX.length); }
  requestAnimationFrame(loop);
}
// figürler yüklenince yeniden çiz
['kilic', 'okcu', 'atli', 'kadirga', 'nakliye', 'kule', 'insaat'].forEach(function (t) { Object.keys(FACTIONS).concat(['n']).forEach(function (f) { var im = ART.fig(t, f === 'n' ? NEUTRAL_COL : FACTIONS[f].col); im.onload = function () { dirty = true; }; }); });
for (var lv = 1; lv <= 6; lv++) { ART.bImg('city', lv).onload = function () { dirty = true; }; if (lv <= 4) ART.bImg('castle', lv).onload = function () { dirty = true; }; }

/* ---------- açılış ---------- */
renderHelp();
show('home');
if (document.fonts && document.fonts.ready) document.fonts.ready.then(function () { dirty = true; if (cur === 'home') renderHome(); });
window.__sancak = { clamp: function () { clampCam(B); }, save: function () { return save; }, B: function () { return B; }, startGame: startGame, openEra: openEra, show: show, endPlayerTurn: endPlayerTurn, tapCell: tapCell };
})();
