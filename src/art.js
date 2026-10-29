/* ===== Sancak çizimler: birlik figürleri, bayraklar, portreler, simgeler ===== */
var ART = (function () {
  'use strict';
  function shade(hex, f) {
    var n = parseInt(hex.slice(1), 16), r = n >> 16, g = (n >> 8) & 255, b = n & 255;
    if (f > 0) { r += (255 - r) * f; g += (255 - g) * f; b += (255 - b) * f; } else { r *= 1 + f; g *= 1 + f; b *= 1 + f; }
    return '#' + [r, g, b].map(function (v) { return ('0' + Math.round(v).toString(16)).slice(-2); }).join('');
  }
  var OUT = '#1b1410';
  /* 64x64 birlik figürleri; C = ülke rengi, D = koyu ton, L = açık ton */
  var FIG = {
    kilic: function (C, D, L) {
      return '<ellipse cx="32" cy="58" rx="17" ry="4.5" fill="rgba(0,0,0,.35)"/>' +
        // bacaklar
        '<path d="M25 44h6v13h-6zM33 44h6v13h-6z" fill="#4a3a2c" stroke="' + OUT + '" stroke-width="1.5"/>' +
        '<path d="M23.5 56h8v3h-8zM32.5 56h8v3h-8z" fill="#2a1f17"/>' +
        // gövde (zincir zırh + tunik)
        '<path d="M21 26q11-6 22 0l2 20H19z" fill="#9aa0a6" stroke="' + OUT + '" stroke-width="1.5"/>' +
        '<path d="M22 30h20l1.5 16h-23z" fill="' + C + '" stroke="' + OUT + '" stroke-width="1.5"/>' +
        '<path d="M32 30v16" stroke="' + D + '" stroke-width="2"/>' +
        '<path d="M21 40h22" stroke="#6b4a2a" stroke-width="2.5"/>' +
        // kılıç kolu ve kılıç
        '<path d="M43 28l7-6" stroke="#9aa0a6" stroke-width="5" stroke-linecap="round"/>' +
        '<path d="M49 23 58 5" stroke="#dfe4e8" stroke-width="3.2" stroke-linecap="round"/><path d="M49 23 58 5" stroke="#8e969d" stroke-width="1"/>' +
        '<path d="M45.5 20.5l7.5 4" stroke="#c9a24a" stroke-width="3" stroke-linecap="round"/><circle cx="48" cy="25" r="2" fill="#c9a24a"/>' +
        // baş ve miğfer
        '<circle cx="32" cy="18" r="7" fill="#e2b48c" stroke="' + OUT + '" stroke-width="1.5"/>' +
        '<path d="M24.5 18q0-10 7.5-10t7.5 10z" fill="#aab1b8" stroke="' + OUT + '" stroke-width="1.5"/>' +
        '<path d="M31 10h2v12h-2z" fill="#7d858c"/>' +
        // kalkan
        '<path d="M10 25h18v10q0 12-9 18q-9-6-9-18z" fill="' + C + '" stroke="' + OUT + '" stroke-width="2"/>' +
        '<path d="M19 26v26M11 33h16" stroke="' + L + '" stroke-width="3"/>' +
        '<path d="M10 25h18" stroke="#c9a24a" stroke-width="2"/>';
    },
    okcu: function (C, D, L) {
      return '<ellipse cx="32" cy="58" rx="16" ry="4.5" fill="rgba(0,0,0,.35)"/>' +
        '<path d="M26 44h5v13h-5zM34 44h5v13h-5z" fill="#4d3b26" stroke="' + OUT + '" stroke-width="1.5"/>' +
        '<path d="M24.5 56h7.5v3h-7.5zM33 56h7.5v3h-7.5z" fill="#2a1f17"/>' +
        // tunik
        '<path d="M22 27q10-5 20 0l3 19H19z" fill="' + C + '" stroke="' + OUT + '" stroke-width="1.5"/>' +
        '<path d="M23 38h18" stroke="#6b4a2a" stroke-width="2.5"/>' +
        '<path d="M38 28l-3 17" stroke="' + D + '" stroke-width="2"/>' +
        // sadak
        '<path d="M37 22l7-3 5 18-6 2z" fill="#7a4e26" stroke="' + OUT + '" stroke-width="1.3"/>' +
        '<path d="M42 18l3-6M44.5 18.5l4-5M47 19l4-4" stroke="#e8dcc0" stroke-width="1.6" stroke-linecap="round"/>' +
        // yay
        '<path d="M13 9q-12 22 0 42" fill="none" stroke="#6b3f1a" stroke-width="3.2" stroke-linecap="round"/>' +
        '<path d="M13 9l14 21L13 51" fill="none" stroke="#efe6d2" stroke-width="1"/>' +
        '<path d="M8 30h22" stroke="#d8cfb8" stroke-width="1.8"/><path d="M5 30l5-2.5v5z" fill="#9aa0a6"/>' +
        '<path d="M26 30l4-1.5" stroke="#e2b48c" stroke-width="4" stroke-linecap="round"/>' +
        // baş ve kukuleta
        '<circle cx="32" cy="19" r="6.5" fill="#d8a77c" stroke="' + OUT + '" stroke-width="1.5"/>' +
        '<path d="M24 23q-1-15 8-15t8 15q-3-8-8-8t-8 8z" fill="' + D + '" stroke="' + OUT + '" stroke-width="1.5"/>';
    },
    atli: function (C, D, L) {
      return '<ellipse cx="32" cy="58" rx="24" ry="4.5" fill="rgba(0,0,0,.35)"/>' +
        // at
        '<path d="M14 40q0-8 10-9h17q8 0 11-7l3-6 5 2-1 8q-1 7-6 11l-1 6h-4l-1-5H24l-2 6h-4l-1-6q-3-2-3-0z" fill="#7b4a26" stroke="' + OUT + '" stroke-width="1.6"/>' +
        '<path d="M18 46l-2 11M23 46l1 11M45 46l2 11M49 44l4 12" stroke="#5b3518" stroke-width="3.4" stroke-linecap="round"/>' +
        '<path d="M14.5 57h3M22 57h3.5M45 57h3.5M51.5 56h3.5" stroke="#1d1410" stroke-width="2.4"/>' +
        '<path d="M12 37q-6 4-4 12" fill="none" stroke="#3a2412" stroke-width="3" stroke-linecap="round"/>' +
        '<path d="M53 18l3-5 2 6" fill="#5b3518"/><circle cx="57" cy="22" r="1" fill="#000"/>' +
        // örtü
        '<path d="M21 31h22l2 12H19z" fill="' + C + '" stroke="' + OUT + '" stroke-width="1.5"/>' +
        '<path d="M19 43h26" stroke="#c9a24a" stroke-width="2"/>' +
        '<path d="M23 34h18" stroke="' + L + '" stroke-width="2"/>' +
        // binici
        '<path d="M27 32q-1-11 5-13 6 1 5 13z" fill="#9aa0a6" stroke="' + OUT + '" stroke-width="1.5"/>' +
        '<path d="M28 27h9v5h-9z" fill="' + C + '"/>' +
        '<circle cx="32" cy="14" r="5.5" fill="#e2b48c" stroke="' + OUT + '" stroke-width="1.4"/>' +
        '<path d="M26.5 14q0-8 5.5-8t5.5 8z" fill="#aab1b8" stroke="' + OUT + '" stroke-width="1.4"/>' +
        // mızrak ve flama
        '<path d="M22 32 60 4" stroke="#8a6234" stroke-width="2.4" stroke-linecap="round"/>' +
        '<path d="M57 6l5-4-1.5 5z" fill="#c9cfd4"/>' +
        '<path d="M50 9.5l-1 8 9-4z" fill="' + C + '" stroke="' + OUT + '" stroke-width="1"/>';
    },
    kadirga: function (C, D, L) {
      return '<ellipse cx="32" cy="57" rx="27" ry="4" fill="rgba(0,0,0,.3)"/>' +
        '<path d="M4 40h56l-6 12H12z" fill="#6b4220" stroke="' + OUT + '" stroke-width="1.8"/>' +
        '<path d="M6 44h52" stroke="' + C + '" stroke-width="3"/>' +
        '<path d="M14 52l-3 6M20 52l-3 6M26 52l-3 6M32 52l-3 6M38 52l-3 6M44 52l-3 6M50 52l-3 6" stroke="#c9b08a" stroke-width="1.6"/>' +
        '<path d="M60 40l3-4" stroke="#6b4220" stroke-width="3"/>' +
        '<path d="M31 40V6" stroke="#4b2f17" stroke-width="2.6"/>' +
        '<path d="M31 8q-17 10-15 28h15z" fill="#f1e7d2" stroke="' + OUT + '" stroke-width="1.5"/>' +
        '<path d="M31 8q-12 12-9 28" fill="none" stroke="' + C + '" stroke-width="4"/>' +
        '<path d="M31 6l9 3-9 3z" fill="' + C + '" stroke="' + OUT + '" stroke-width="1"/>';
    },
    kule: function (C, D, L) {
      return '<ellipse cx="32" cy="58" rx="18" ry="4.5" fill="rgba(0,0,0,.35)"/>' +
        '<path d="M18 57l3-34h22l3 34z" fill="#cfc4ad" stroke="' + OUT + '" stroke-width="2"/>' +
        '<path d="M15 23h34v-8h-5v4h-5v-4h-4v4h-6v-4h-4v4h-5v-4h-5z" fill="#ddd3bd" stroke="' + OUT + '" stroke-width="2" stroke-linejoin="round"/>' +
        '<path d="M20 33h24M19.5 43h25M24 23v34M32 33v24M40 23v34" stroke="rgba(60,45,30,.35)" stroke-width="1.2"/>' +
        '<path d="M28 57V48q4-5 8 0v9z" fill="#3a2a1c"/>' +
        '<path d="M30 31h4v7h-4z" fill="#2b2015"/>' +
        '<path d="M32 15V2" stroke="#4b2f17" stroke-width="2"/>' +
        '<path d="M32 3l13 4-13 4z" fill="' + C + '" stroke="' + OUT + '" stroke-width="1"/>';
    },
    insaat: function (C, D, L) {
      return '<ellipse cx="32" cy="58" rx="20" ry="4.5" fill="rgba(0,0,0,.3)"/>' +
        '<path d="M18 57l2-18h24l2 18z" fill="#cfc4ad" stroke="' + OUT + '" stroke-width="2"/>' +
        '<path d="M20 47h24" stroke="rgba(60,45,30,.4)" stroke-width="1.2"/>' +
        '<path d="M14 57V18M50 57V18M14 26h36M14 40h36M14 26l36 14M50 26L14 40" stroke="#9a6b38" stroke-width="2.4" stroke-linecap="round"/>' +
        '<path d="M14 18h36" stroke="#9a6b38" stroke-width="2.4"/>' +
        '<path d="M44 18V8h8" stroke="#6b4a2a" stroke-width="2"/><path d="M52 8v8" stroke="#555" stroke-width="1.2"/><rect x="49.5" y="16" width="5" height="4" fill="#9aa0a6"/>' +
        '<path d="M14 18l-2-6 6 3z" fill="' + C + '" stroke="' + OUT + '" stroke-width="1"/>';
    },
    nakliye: function (C, D, L) {
      return '<ellipse cx="32" cy="57" rx="22" ry="4" fill="rgba(0,0,0,.3)"/>' +
        '<path d="M10 42h44q-3 12-10 13H20q-7-1-10-13z" fill="#7a4d26" stroke="' + OUT + '" stroke-width="1.8"/>' +
        '<path d="M12 46h40" stroke="#4b2f17" stroke-width="1.5"/>' +
        '<path d="M32 42V10" stroke="#4b2f17" stroke-width="2.6"/>' +
        '<path d="M18 13h28v22H18z" fill="#f1e7d2" stroke="' + OUT + '" stroke-width="1.5"/>' +
        '<path d="M18 21h28v6H18z" fill="' + C + '"/>' +
        '<path d="M32 10l8 2.5-8 2.5z" fill="' + C + '"/>';
    }
  };
  var IMG = {};
  function figSVG(type, col) {
    var C = col, D = shade(col, -0.35), L = shade(col, 0.55);
    return '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" width="128" height="128">' + FIG[type](C, D, L) + '</svg>';
  }
  function figImg(type, col) {
    var k = type + col;
    if (!IMG[k]) { var im = new Image(); im.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(figSVG(type, col)); IMG[k] = im; }
    return IMG[k];
  }
  function figInline(type, col) { return figSVG(type, col).replace('width="128" height="128"', 'class="fig"'); }

  function flag(fid, cls) {
    var F = FACTIONS[fid]; if (!F) return '';
    var c = F.col, d = F.dark, w = '#f3ecdc', p;
    switch (F.flag) {
      case 'cross': p = '<rect width="30" height="20" fill="' + c + '"/><path d="M0 10h30M15 0v20" stroke="' + w + '" stroke-width="4"/>'; break;
      case 'eagle': p = '<rect width="30" height="20" fill="#e9dfc8"/><path d="M15 4 19 9 25 7 21 13H9L5 7l6 2z" fill="' + c + '"/><rect y="16" width="30" height="4" fill="' + c + '"/>'; break;
      case 'saltire': p = '<rect width="30" height="20" fill="' + c + '"/><path d="M0 0 30 20M30 0 0 20" stroke="' + w + '" stroke-width="3"/>'; break;
      case 'band': p = '<rect width="30" height="20" fill="' + c + '"/><path d="M0 0h30v4H0zM0 16h30v4H0z" fill="' + d + '"/><path d="M15 6l4 4-4 4-4-4z" fill="' + w + '"/>'; break;
      case 'circle': p = '<rect width="30" height="20" fill="' + c + '"/><circle cx="11" cy="10" r="5" fill="' + w + '"/><circle cx="11" cy="10" r="2.4" fill="' + d + '"/>'; break;
      case 'tri': p = '<rect width="30" height="20" fill="' + w + '"/><rect width="10" height="20" fill="' + c + '"/><rect x="20" width="10" height="20" fill="' + d + '"/>'; break;
      case 'chev': p = '<rect width="30" height="20" fill="' + c + '"/><path d="M0 0 13 10 0 20z" fill="' + w + '"/><path d="M0 4 8 10 0 16z" fill="' + d + '"/>'; break;
      case 'star': p = '<rect width="30" height="20" fill="' + c + '"/><path d="m15 4 1.8 3.8 4.2.5-3.1 2.9.8 4.1L15 13.3l-3.7 2 .8-4.1-3.1-2.9 4.2-.5z" fill="' + w + '"/>'; break;
      case 'stripes': p = '<rect width="30" height="20" fill="' + w + '"/><rect y="6.7" width="30" height="6.6" fill="' + c + '"/><rect y="13.3" width="30" height="6.7" fill="' + d + '"/>'; break;
      case 'diag': p = '<rect width="30" height="20" fill="' + c + '"/><path d="M0 20 30 0V8L12 20z" fill="#e2c46a"/>'; break;
      case 'nordic': p = '<rect width="30" height="20" fill="' + c + '"/><path d="M0 10h30M11 0v20" stroke="' + d + '" stroke-width="4"/><path d="M0 10h30M11 0v20" stroke="' + w + '" stroke-width="1.5"/>'; break;
      default: p = '<rect width="30" height="20" fill="' + c + '"/>';
    }
    return '<svg class="' + (cls || 'fl') + '" viewBox="0 0 30 20" aria-hidden="true">' + p + '</svg>';
  }
  var SPEC = {
    kilic: { col: '#3f6fb5', name: 'Kılıçlı', icon: '<path d="M12 2.5l1.6 2.4v9.6h-3.2V4.9zM7 14.5h10M12 14.5v5M9.5 20.5h5" fill="#fff" stroke="#fff" stroke-width="1.6" stroke-linecap="round"/>' },
    okcu:  { col: '#3d8a3a', name: 'Okçu',    icon: '<path d="M8 3C15 7 15 17 8 21M8 3v18M4 12h15M16 9l3 3-3 3" fill="none" stroke="#fff" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"/>' },
    atli:  { col: '#a5482b', name: 'Atlı',    icon: '<path d="M7 21l1.2-6.4C6.2 12.6 6.4 8.6 9.2 6.4L10.8 3l1.4 2.9c3.4.1 6.2 3 6.4 6.5l-3 1.2-2-2-.2 3.6 3 5.8z" fill="#fff"/>' },
    kale:  { col: '#7d6d4c', name: 'Şehir ve kale', icon: '<path d="M3 21V9h3v3h3V9h2v3h2V9h2v3h3V9h3v12z" fill="#fff"/>' }
  };
  function specInfo(sp) { return SPEC[sp] || { col: '#666', name: sp || '', icon: '' }; }
  /* ana menü arka planı: alacakaranlıkta kale, dağlar ve sancaklar */
  function scene() {
    return '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 800" preserveAspectRatio="xMidYMid slice">' +
      '<defs><linearGradient id="sky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#0d1622"/><stop offset=".38" stop-color="#2a3346"/><stop offset=".52" stop-color="#8a5a3c"/><stop offset=".62" stop-color="#e0a458"/></linearGradient>' +
      '<radialGradient id="sun" cx="50%" cy="50%" r="50%"><stop offset="0" stop-color="#ffe2a0"/><stop offset=".4" stop-color="#f3b45c" stop-opacity=".9"/><stop offset="1" stop-color="#f3b45c" stop-opacity="0"/></radialGradient></defs>' +
      '<rect width="400" height="800" fill="url(#sky)"/>' +
      '<circle cx="275" cy="468" r="120" fill="url(#sun)"/><circle cx="275" cy="476" r="26" fill="#ffe3a6" opacity=".9"/>' +
      '<g fill="#f6e7c8" opacity=".55"><circle cx="40" cy="60" r="1"/><circle cx="120" cy="30" r="1.3"/><circle cx="210" cy="80" r="1"/><circle cx="330" cy="45" r="1.2"/><circle cx="370" cy="130" r=".9"/><circle cx="80" cy="160" r=".9"/><circle cx="300" cy="190" r="1"/><circle cx="170" cy="200" r=".8"/></g>' +
      '<path d="M0 560l60-70 40 30 70-90 60 70 50-40 60 60 60-50v370H0z" fill="#3a3448"/>' +
      '<path d="M0 600l50-40 60 35 60-55 70 50 60-30 100 45v395H0z" fill="#2c2838"/>' +
      // tepe ve kale
      '<path d="M120 640q80-70 200-40l80 20v180H0V680z" fill="#1e1b26"/>' +
      '<g fill="#15131b">' +
      '<path d="M196 596v-58h14v-10h8v10h8v-10h8v10h14v58z"/>' +
      '<path d="M226 528v-46h6v-6h4v6h6v46z"/><path d="M232 476l-8-14h16z"/>' +
      '<path d="M178 600v-40h10v-6h6v6h4v40zM254 600v-36h10v-6h6v6h6v36z"/>' +
      '<path d="M170 604h120v14H170z"/></g>' +
      '<path d="M234 462v-26" stroke="#15131b" stroke-width="2"/><path d="M234 437l20 6-20 6z" fill="#b2392f"/>' +
      '<g fill="#f0c36a" opacity=".8"><rect x="212" y="560" width="3" height="5"/><rect x="232" y="500" width="2.5" height="4"/><rect x="200" y="570" width="3" height="5"/><rect x="262" y="578" width="2.5" height="4"/></g>' +
      // ön plan: mızraklar ve sancaklar
      '<path d="M0 720q100-30 200-10t200-20v110H0z" fill="#100e14"/>' +
      '<g stroke="#100e14" stroke-width="3">' +
      '<path d="M30 760V610M60 765V630M92 770V600M330 765V615M362 770V635M300 772V640"/></g>' +
      '<path d="M92 602l34 10-34 12z" fill="#8f1d18"/><path d="M330 617l30 9-30 10z" fill="#1e4f8f"/><path d="M30 612l26 8-26 9z" fill="#c9a24a"/>' +
      '</svg>';
  }
  var PN = 0;
  function portrait(g, era, opt) {
    var L = g.look || { skin: '#ddb08a', hair: '#333', beard: 1, hat: 'helm' }, id = 'p' + (PN++), sp = specInfo(g.spec);
    var bgc = ['#3b2d20', '#26313d', '#24302a'][era || 0];
    var cape = shade(sp.col, -0.35), skinD = shade(L.skin, -0.22), skinL = shade(L.skin, 0.12), hairD = shade(L.hair, -0.25);
    var s = '<svg viewBox="0 0 100 100" aria-hidden="true"><defs>' +
      '<radialGradient id="' + id + 'b" cx="50%" cy="38%" r="70%"><stop offset="0" stop-color="' + shade(bgc, 0.25) + '"/><stop offset="1" stop-color="' + shade(bgc, -0.35) + '"/></radialGradient>' +
      '<linearGradient id="' + id + 's" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#e4e8ec"/><stop offset=".5" stop-color="#9aa3ab"/><stop offset="1" stop-color="#4f575e"/></linearGradient>' +
      '<linearGradient id="' + id + 'k" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="' + skinL + '"/><stop offset="1" stop-color="' + skinD + '"/></linearGradient>' +
      '<linearGradient id="' + id + 'h" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="' + L.hair + '"/><stop offset="1" stop-color="' + hairD + '"/></linearGradient>' +
      '</defs><rect width="100" height="100" fill="url(#' + id + 'b)"/>' +
      // sancak arka planı (uzmanlık rengi)
      '<path d="M62 0h26v46l-13-8-13 8z" fill="' + sp.col + '" opacity=".55"/>' +
      '<path d="M0 100l3-24q18-14 47-15 29 1 47 15l3 24z" fill="' + cape + '"/>' +
      // zırh
      '<path d="M21 100q2-20 29-24 27 4 29 24z" fill="url(#' + id + 's)" stroke="#2a2f34" stroke-width="1.2"/>' +
      '<path d="M50 77v23" stroke="#3a4046" stroke-width="1.4"/>' +
      '<path d="M30 92q20-6 40 0" fill="none" stroke="#c9a24a" stroke-width="1.6"/>' +
      '<ellipse cx="22" cy="81" rx="17" ry="10" fill="url(#' + id + 's)" stroke="#2a2f34" stroke-width="1.2"/>' +
      '<ellipse cx="78" cy="81" rx="17" ry="10" fill="url(#' + id + 's)" stroke="#2a2f34" stroke-width="1.2"/>' +
      '<path d="M7 83q15-8 30 0M63 83q15-8 30 0" fill="none" stroke="#c9a24a" stroke-width="1.6"/>' +
      '<path d="M44 58h12v14H44z" fill="' + skinD + '"/>' +
      '<path d="M37 70q13 9 26 0v6q-13 9-26 0z" fill="url(#' + id + 's)" stroke="#2a2f34" stroke-width="1"/>' +
      // nişan
      '<path d="M63 86l3 6 3-6z" fill="#b2392f"/><circle cx="66" cy="93" r="3.4" fill="#e3c25c" stroke="#7a5a12" stroke-width=".8"/>' +
      // baş
      '<ellipse cx="33.5" cy="46" rx="2.6" ry="4" fill="' + skinD + '"/><ellipse cx="66.5" cy="46" rx="2.6" ry="4" fill="' + skinD + '"/>' +
      '<path d="M34 40q0-15 16-16 16 1 16 16l-1 12q-4 13-15 15-11-2-15-15z" fill="url(#' + id + 'k)"/>' +
      '<path d="M36 50q2 9 8 13M64 50q-2 9-8 13" fill="none" stroke="rgba(0,0,0,.12)" stroke-width="2"/>';
    if (L.hat !== 'helm' && L.hat !== 'hood' && L.hat !== 'helmetm' && L.hat !== 'pilot') s += '<path d="M34 42q-2-16 16-17 18 1 16 17-3-8-5-9-11 3-22 0-3 1-5 9z" fill="url(#' + id + 'h)"/>';
    // kaşlar, gözler
    s += '<path d="M37 41.5l9 1.6M63 41.5l-9 1.6" stroke="' + hairD + '" stroke-width="2.6" stroke-linecap="round"/>' +
      '<path d="M38 44.5q4-1.5 7 .5M62 44.5q-4-1.5-7 .5" fill="none" stroke="rgba(0,0,0,.25)" stroke-width="1"/>' +
      '<ellipse cx="41.5" cy="46.5" rx="3" ry="1.5" fill="#efe6d6"/><ellipse cx="58.5" cy="46.5" rx="3" ry="1.5" fill="#efe6d6"/>' +
      '<circle cx="42" cy="46.6" r="1.25" fill="#20160f"/><circle cx="58" cy="46.6" r="1.25" fill="#20160f"/>' +
      '<path d="M50 45l-2.2 9q2.2 1.6 4.4 0" fill="none" stroke="' + skinD + '" stroke-width="1.3" stroke-linejoin="round"/>' +
      '<path d="M45 60q5 1.2 10 0" fill="none" stroke="#5e3324" stroke-width="1.5" stroke-linecap="round"/>';
    if (L.scar) s += '<path d="M60 40l4 10" stroke="#a0574a" stroke-width="1.2"/>';
    var must = '<path d="M41 57.5q9-4.5 18 0-5 1.8-9 .4-4 1.4-9-.4z" fill="url(#' + id + 'h)"/>';
    if (L.beard === 1) s += must;
    if (L.beard === 2) s += '<path d="M35 50q1 14 15 18 14-4 15-18-3 10-15 10-12 0-15-10z" fill="url(#' + id + 'h)"/>' + must;
    if (L.beard === 3) s += '<path d="M34 47q-1 25 16 32 17-7 16-32-4 12-16 12-12 0-16-12z" fill="url(#' + id + 'h)"/><path d="M44 66q6 5 12 0" stroke="' + hairD + '" stroke-width="1" fill="none"/>' + must;
    var h = L.hat;
    if (h === 'helm') s += '<path d="M31 43q-1-24 19-25 20 1 19 25l-3-2q-2-13-16-14-14 1-16 14z" fill="url(#' + id + 's)" stroke="#2a2f34" stroke-width="1"/>' +
      '<path d="M48.6 26.5h2.8v20h-2.8z" fill="#7d858c" stroke="#2a2f34" stroke-width=".6"/><path d="M33 34q17-5 34 0" fill="none" stroke="#c9a24a" stroke-width="1.4"/>' +
      '<path d="M50 18q5-13 22-11-11 4-16 13z" fill="#b2392f" stroke="#5a1410" stroke-width=".8"/>';
    if (h === 'hood') s += '<path d="M27 58q-5-38 23-40 28 2 23 40-3-25-23-27-20 2-23 27z" fill="#33502a" stroke="#1a2a15" stroke-width="1"/><path d="M30 50q2-18 20-20" fill="none" stroke="#4d7040" stroke-width="1.5"/>';
    if (h === 'kalpak') s += '<path d="M31 35q0-22 19-22t19 22z" fill="#3a2a1d"/><path d="M31 33h38v6H31z" fill="#57402c"/><path d="M35 22q5-4 8 0M47 19q5-4 8 0M58 23q4-3 7 1" stroke="#5a4532" stroke-width="1.4" fill="none"/>';
    if (h === 'crown') s += '<path d="M33 31l2-13 7 7 8-11 8 11 7-7 2 13z" fill="#e0b84a" stroke="#7a5a12" stroke-width="1"/><circle cx="50" cy="24" r="1.8" fill="#b2392f"/><circle cx="40" cy="27" r="1.3" fill="#2f6fd6"/><circle cx="60" cy="27" r="1.3" fill="#2f6fd6"/>';
    if (h === 'kepi') s += '<path d="M34 33l2-14h28l2 14z" fill="#8c2b2b"/><path d="M30 33h40" stroke="#1b1b1b" stroke-width="3.4" stroke-linecap="round"/><path d="M36 25h28" stroke="#d9b04f" stroke-width="1.6"/>';
    if (h === 'pickel') s += '<path d="M31 36q0-20 19-20t19 20z" fill="#2d2d2d"/><path d="M50 16V7" stroke="#c9a24a" stroke-width="3"/><path d="M29 36h42" stroke="#111" stroke-width="3"/><circle cx="50" cy="27" r="3" fill="#c9a24a"/>';
    if (h === 'cap') s += '<path d="M31 34q2-17 19-17t19 17z" fill="#5b5640"/><path d="M30 34h26q-8 5-26 0z" fill="#2c2a20"/>';
    if (h === 'bicorne') s += '<path d="M18 34q15-20 32-18 17-2 32 18-32-7-64 0z" fill="#1f1f24"/><circle cx="50" cy="24" r="3" fill="#c9a24a"/>';
    if (h === 'beret') s += '<path d="M29 34q2-17 23-16 17 1 19 12-15-3-42 4z" fill="#7a1f24"/><circle cx="38" cy="27" r="2.4" fill="#d9b04f"/>';
    if (h === 'pilot') s += '<path d="M30 45q-2-27 20-27t20 27h-5q-2-17-15-17t-15 17z" fill="#55606a"/><rect x="36" y="28" width="28" height="8" rx="4" fill="#1e2a33" stroke="#9aa1a8"/>';
    if (h === 'helmetm') s += '<path d="M29 42q0-24 21-24t21 24q-10-5-21-5t-21 5z" fill="#5d6a46" stroke="#2f3624" stroke-width="1"/>';
    if (h === 'peaked') s += '<path d="M33 34l2-15h30l2 15z" fill="#3b4c3a"/><path d="M29 34h42q-5 5-21 5t-21-5z" fill="#1b1b1b"/><path d="M40 26h20" stroke="#d9b04f" stroke-width="2"/>';
    // uzmanlık rozeti
    if (!opt || !opt.nobadge) s += '<circle cx="84" cy="84" r="13" fill="' + sp.col + '" stroke="#f3ecdc" stroke-width="2.4"/><g transform="translate(73.5 73.5) scale(.875)">' + sp.icon + '</g>';
    return s + '</svg>';
  }
  var PIMG = {};
  function portraitImg(g, era) {
    var k = (g.id || g.name);
    if (!PIMG[k]) { var im = new Image(); im.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(portrait(g, era, { nobadge: true }).replace('<svg ', '<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100" ')); PIMG[k] = im; }
    return PIMG[k];
  }
  /* bina simgeleri (canvas), parşömen tonlarında */
  var BIMG = {};
  function cityIcon(lv) {
    var t = Math.min(6, lv);
    var towers = [[22, 30, 8, 14]], s = '';
    // seviye arttıkça kuleler ve yükseklik artar
    var spec = [
      [[18, 28, 28, 18]],
      [[14, 30, 36, 16], [26, 22, 12, 24]],
      [[10, 30, 44, 16], [16, 22, 10, 24], [36, 20, 12, 26]],
      [[8, 30, 48, 16], [12, 20, 10, 26], [27, 16, 10, 30], [42, 22, 10, 24]],
      [[6, 30, 52, 16], [9, 20, 10, 26], [21, 14, 9, 32], [34, 18, 10, 28], [46, 22, 10, 24]],
      [[4, 30, 56, 16], [7, 18, 10, 28], [19, 12, 8, 34], [29, 6, 6, 40], [37, 14, 9, 32], [48, 20, 10, 26]]
    ][t - 1];
    spec.forEach(function (b) {
      s += '<rect x="' + b[0] + '" y="' + b[1] + '" width="' + b[2] + '" height="' + b[3] + '" fill="#efe5cf" stroke="#2b2015" stroke-width="1.6"/>';
      if (b[2] <= 12) s += '<path d="M' + (b[0] - 1) + ' ' + b[1] + 'l' + (b[2] / 2 + 1) + ' -7 ' + (b[2] / 2 + 1) + ' 7z" fill="#b5523a" stroke="#2b2015" stroke-width="1.4"/>';
      for (var y = b[1] + 5; y < b[1] + b[3] - 3; y += 7) for (var x = b[0] + 3; x < b[0] + b[2] - 2; x += 6) s += '<rect x="' + x + '" y="' + y + '" width="2.4" height="3" fill="#5a4630"/>';
    });
    return '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 48" width="128" height="96">' + s + '</svg>';
  }
  function castleIcon(lv) {
    var s = '<path d="M8 46V20h6v4h5v-4h6v4h5v-4h6v4h5v-4h6v4h5v-4h6v26z" fill="#d7cfbe" stroke="#2b2015" stroke-width="1.8"/>' +
      '<path d="M26 46V34q6-6 12 0v12z" fill="#3a2a1c"/>';
    if (lv >= 2) s += '<path d="M2 46V12h5v3h4v-3h5v34z M48 46V12h5v3h4v-3h5v34z" fill="#cfc6b2" stroke="#2b2015" stroke-width="1.8"/>';
    if (lv >= 3) s += '<path d="M24 20V6h4v3h3V6h2v3h3V6h4v14z" fill="#c8bea8" stroke="#2b2015" stroke-width="1.6"/><path d="M32 6V0" stroke="#2b2015" stroke-width="1.4"/><path d="M32 0l7 2-7 2z" fill="#c8322f"/>';
    if (lv >= 4) s += '<path d="M8 46h48" stroke="#c9a24a" stroke-width="3"/>';
    return '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 48" width="128" height="96">' + s + '</svg>';
  }
  function bImg(kind, lv) {
    var k = kind + lv;
    if (!BIMG[k]) { var im = new Image(); im.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(kind === 'city' ? cityIcon(lv) : castleIcon(lv)); BIMG[k] = im; }
    return BIMG[k];
  }
  var UI = {
    coin: '<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="9" fill="#d9b04f" stroke="#7a5a12" stroke-width="1.5"/><path d="M9 9.5h6M9 14.5h6M12 7v10" stroke="#7a5a12" stroke-width="1.6" stroke-linecap="round"/></svg>',
    food: '<svg viewBox="0 0 24 24"><path d="M12 22V8" stroke="#a7822f" stroke-width="1.8"/><path d="M12 9c-3-1-4-4-3-6 3 1 4 3 3 6zM12 9c3-1 4-4 3-6-3 1-4 3-3 6zM12 14c-3-1-4.5-4-3.5-6 3 1 4.5 3 3.5 6zM12 14c3-1 4.5-4 3.5-6-3 1-4.5 3-3.5 6zM12 19c-3-1-4.5-4-3.5-6 3 1 4.5 3 3.5 6zM12 19c3-1 4.5-4 3.5-6-3 1-4.5 3-3.5 6z" fill="#e3c25c"/></svg>',
    iron: '<svg viewBox="0 0 24 24"><path d="M3 15l4-7h10l4 7z" fill="#8d99a3" stroke="#3c444b" stroke-width="1.4"/><path d="M3 15h18v4H3z" fill="#6d7880" stroke="#3c444b" stroke-width="1.4"/><path d="M8 10h8" stroke="#c3ccd3" stroke-width="1.2"/></svg>',
    medal: '<svg viewBox="0 0 24 24"><path d="M7 2h4l2 6H9zM13 2h4l-2 6h-4z" fill="#b2392f"/><circle cx="12" cy="15" r="6.5" fill="#d9b04f" stroke="#7a5a12" stroke-width="1.4"/><path d="m12 11.3 1.1 2.3 2.5.3-1.8 1.7.5 2.5-2.3-1.2-2.3 1.2.5-2.5-1.8-1.7 2.5-.3z" fill="#7a5a12"/></svg>',
    back: '<svg viewBox="0 0 24 24"><path d="M15 5 8 12l7 7" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/></svg>',
    pause: '<svg viewBox="0 0 24 24"><path d="M8 5v14M16 5v14" stroke="currentColor" stroke-width="2.6" stroke-linecap="round"/></svg>',
    lock: '<svg class="lock" viewBox="0 0 24 24"><rect x="5" y="10.5" width="14" height="10" rx="2" fill="currentColor"/><path d="M8 10.5V8a4 4 0 0 1 8 0v2.5" fill="none" stroke="currentColor" stroke-width="2"/></svg>',
    hourglass: '<svg viewBox="0 0 24 24"><path d="M6 3h12M6 21h12M7 3c0 5 10 6 10 9s-10 4-10 9M17 3c0 5-10 6-10 9s10 4 10 9" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round"/></svg>',
    ff: '<svg viewBox="0 0 24 24"><path d="M3 6l8 6-8 6zM12 6l8 6-8 6z" fill="currentColor"/></svg>',
    skip: '<svg viewBox="0 0 24 24"><path d="M4 6l9 6-9 6zM17 6h3v12h-3z" fill="currentColor"/></svg>',
    bow: '<svg viewBox="0 0 24 24"><path d="M6 3c9 4 9 14 0 18M6 3v18M3 12h17M17 9l3 3-3 3" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>',
    skull: '<svg viewBox="0 0 24 24"><path d="M12 3c-5 0-8 3.5-8 8 0 2.6 1.3 4.3 3 5.3V20h10v-3.7c1.7-1 3-2.7 3-5.3 0-4.5-3-8-8-8z" fill="currentColor"/><circle cx="9" cy="11.5" r="2" fill="#1b2128"/><circle cx="15" cy="11.5" r="2" fill="#1b2128"/></svg>',
    genplus: '<svg viewBox="0 0 24 24"><circle cx="10" cy="8" r="4" fill="none" stroke="currentColor" stroke-width="2"/><path d="M3 21c.8-4 3.6-6 7-6 1.6 0 3 .4 4.2 1.2" fill="none" stroke="currentColor" stroke-width="2"/><path d="M18 14v7M14.5 17.5h7" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"/></svg>',
    scale: '<svg viewBox="0 0 24 24"><path d="M12 3v18M7 21h10M4 7h16M4 7l-2.5 6h5zM20 7l-2.5 6h5z" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"/></svg>',
    mount: '<svg viewBox="0 0 24 24"><path d="M2 19 9 7l4 6 2-3 7 9z" fill="currentColor"/></svg>',
    flag: '<svg viewBox="0 0 24 24"><path d="M5 21V3M5 4h11l-2 4 2 4H5" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linejoin="round"/></svg>',
    undo: '<svg viewBox="0 0 24 24"><path d="M9 7H4V2" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/><path d="M4.5 7.5A8 8 0 1 1 6 18" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"/></svg>',
    fit: '<svg viewBox="0 0 24 24"><path d="M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>',
    next: '<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="3.5" fill="currentColor"/><path d="M12 2v4M12 18v4M2 12h4M18 12h4" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>',
    sword: '<svg viewBox="0 0 24 24"><path d="M4 20 18 6l2-3-3 2L3 19zM6 14l4 4M3 21l3-3" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>',
    shield: '<svg viewBox="0 0 24 24"><path d="M12 3l7 3v5c0 5-3 8-7 10-4-2-7-5-7-10V6z" fill="none" stroke="currentColor" stroke-width="2"/></svg>',
    boot: '<svg viewBox="0 0 24 24"><path d="M7 3h6v9l6 3v4H5v-4l2-3z" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/></svg>',
    anchor: '<svg viewBox="0 0 24 24"><circle cx="12" cy="5" r="2" fill="none" stroke="currentColor" stroke-width="2"/><path d="M12 7v14M8 11h8M4 14q1 7 8 7 7 0 8-7" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>',
    hammer: '<svg viewBox="0 0 24 24"><path d="M5 9l5-5 4 4-2 2 8 8-2 2-8-8-2 2z" fill="currentColor"/></svg>',
    wheat: '<svg viewBox="0 0 24 24"><path d="M12 22V8" stroke="currentColor" stroke-width="1.8"/><path d="M12 10c-3-1-4-4-3-6 3 1 4 3 3 6zM12 10c3-1 4-4 3-6-3 1-4 3-3 6zM12 15c-3-1-4-4-3-6 3 1 4 3 3 6zM12 15c3-1 4-4 3-6-3 1-4 3-3 6z" fill="currentColor"/></svg>',
    castle: '<svg viewBox="0 0 24 24"><path d="M3 21V9h3v3h3V9h2v3h2V9h2v3h3V9h3v12z" fill="currentColor"/></svg>',
    city: '<svg viewBox="0 0 24 24"><path d="M3 21V11h5V6h6v5h7v10z" fill="currentColor"/></svg>'
  };
  return { fig: figImg, figInline: figInline, flag: flag, portrait: portrait, portraitImg: portraitImg, specInfo: specInfo, scene: scene, bImg: bImg, UI: UI, shade: shade };
})();
