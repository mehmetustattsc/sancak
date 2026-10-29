/* ===== Sancak ses: efektler ve müzik tamamen kodla üretilir (dosya yok) =====
   Efektler gürültü ve kısmi seslerle sentezlenir; ud Karplus-Strong ile çalınır.
   Ana menü: Re Dorian, ağır ud arpejleri ve ney. Savaş: Hicaz, davul, ud ve bordon. */
var AUDIO = (function () {
  'use strict';
  var AC = null, master, sfxBus, musBus, NOISE = null, enabled = { sfx: true, music: true };
  var BUF = {};
  var MUS_VOL = 0.2;   // müzik arka planda kalsın, efektlerin önüne geçmesin
  function ctx() {
    if (AC) return AC;
    var C = window.AudioContext || window.webkitAudioContext; if (!C) return null;
    AC = new C();
    master = AC.createGain(); master.gain.value = 0.9;
    var comp = AC.createDynamicsCompressor(); comp.threshold.value = -14; comp.ratio.value = 4;
    master.connect(comp); comp.connect(AC.destination);
    sfxBus = AC.createGain(); sfxBus.gain.value = enabled.sfx ? 1 : 0; sfxBus.connect(master);
    musBus = AC.createGain(); musBus.gain.value = 0; musBus.connect(master);
    // salon yankısı (sentetik)
    var conv = AC.createConvolver(), len = AC.sampleRate * 1.8, ir = AC.createBuffer(2, len, AC.sampleRate);
    for (var ch = 0; ch < 2; ch++) { var d = ir.getChannelData(ch); for (var i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, 3); }
    conv.buffer = ir; var wet = AC.createGain(); wet.gain.value = 0.22; conv.connect(wet); wet.connect(master);
    AUDIO.verb = conv;
    var nb = AC.createBuffer(1, AC.sampleRate * 2, AC.sampleRate), nd = nb.getChannelData(0);
    for (var k = 0; k < nd.length; k++) nd[k] = Math.random() * 2 - 1;
    NOISE = nb;
    return AC;
  }
  function now() { return AC.currentTime; }
  /* temel parçalar */
  function env(g, t, a, peak, dec, sus) {
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(peak, t + a);
    g.gain.exponentialRampToValueAtTime(Math.max(0.0001, sus || 0.0001), t + a + dec);
  }
  function noise(t, dur, type, freq, q, peak, dec, out, freqEnd) {
    var s = AC.createBufferSource(); s.buffer = NOISE; s.loop = true;
    var f = AC.createBiquadFilter(); f.type = type; f.frequency.setValueAtTime(freq, t); if (q) f.Q.value = q;
    if (freqEnd) f.frequency.exponentialRampToValueAtTime(freqEnd, t + dur);
    var g = AC.createGain(); env(g, t, 0.004, peak, dec);
    s.connect(f); f.connect(g); g.connect(out || sfxBus);
    s.start(t, Math.random() * 1.5); s.stop(t + dur + 0.05);
    return g;
  }
  function tone(t, freq, dur, type, peak, out, freqEnd, attack) {
    var o = AC.createOscillator(); o.type = type || 'sine'; o.frequency.setValueAtTime(freq, t);
    if (freqEnd) o.frequency.exponentialRampToValueAtTime(freqEnd, t + dur);
    var g = AC.createGain(); env(g, t, attack || 0.005, peak, dur);
    o.connect(g); g.connect(out || sfxBus); o.start(t); o.stop(t + dur + 0.05);
    return g;
  }
  function send(node, amt) { var g = AC.createGain(); g.gain.value = amt; node.connect(g); g.connect(AUDIO.verb); }

  /* ---------- efektler ---------- */
  var FX = {
    // ahşap tık: menü dokunuşu
    tap: function (t) { noise(t, 0.04, 'bandpass', 1800, 4, 0.18, 0.03); tone(t, 900, 0.03, 'triangle', 0.04); },
    sel: function (t) { noise(t, 0.05, 'bandpass', 2400, 6, 0.2, 0.04); tone(t, 1250, 0.05, 'triangle', 0.035); },
    // asker adımı: iki sıra asker, rap rap
    step: function (t) {
      for (var i = 0; i < 2; i++) {
        var tt = t + i * 0.16;
        noise(tt, 0.09, 'lowpass', 260, 0.7, 0.85, 0.08);
        noise(tt + 0.012, 0.03, 'bandpass', 2600, 2, 0.09, 0.02);          // zırh şıkırtısı
        noise(tt + 0.025, 0.08, 'lowpass', 320, 0.7, 0.5, 0.07);           // arkadaki sıra
      }
    },
    // dörtnala at: tak-ta-dak
    gallop: function (t) {
      [0, 0.075, 0.15, 0.32, 0.395, 0.47].forEach(function (d, i) {
        var tt = t + d, a = i % 3 === 2 ? 0.55 : 0.4;
        noise(tt, 0.06, 'bandpass', 700 + (i % 3) * 120, 3, a, 0.05);
        tone(tt, 160 + (i % 3) * 30, 0.05, 'sine', a * 0.5);
      });
      noise(t, 0.6, 'lowpass', 180, 0.5, 0.12, 0.55);                       // toprak gümbürtüsü
    },
    // kürek ve dalga
    row: function (t) { noise(t, 0.5, 'bandpass', 500, 0.8, 0.22, 0.45, null, 260); noise(t + 0.35, 0.45, 'bandpass', 420, 0.8, 0.18, 0.4, null, 240); },
    // kılıç şakırtısı: savrulma vızıltısı, çelik çarpması, uzun ve titreşen çınlama, kayan bıçak sürtünmesi
    clash: function (t, heavy) {
      var n = heavy ? 3 : 2;
      for (var k = 0; k < n; k++) {
        var tt = t + 0.13 + k * (0.22 + Math.random() * 0.08), base = 780 + Math.random() * 260, v = k === n - 1 ? 1 : 0.8;
        noise(tt - 0.13, 0.14, 'bandpass', 900, 1.2, 0.13 * v, 0.12, null, 3800);          // kılıç havayı yarar
        noise(tt, 0.025, 'bandpass', 5200, 0.8, 0.45 * v, 0.02);                           // çarpma anı
        tone(tt, 260, 0.06, 'triangle', 0.12 * v);                                         // kabzaya gelen darbe
        // çelik çubuk kipleri (uyumsuz): her biri iki yakın frekans, birbirini dövüp titreşir
        [1, 2.76, 5.40, 8.93].forEach(function (r, i) {
          var f = base * r; if (f > 9000) return;
          var dec = 1.1 / (1 + i * 0.55), amp = 0.16 * v / (1 + i * 0.5);
          [-1, 1].forEach(function (sg) { var g = tone(tt, f + sg * (2 + i * 1.5), dec, 'sine', amp * 0.55, null, null, 0.002); send(g, 0.55); });
          // aynı kipte çınlayan gürültü: saf bip değil, gerçek metal dokusu
          var s = AC.createBufferSource(); s.buffer = NOISE; s.loop = true;
          var bp = AC.createBiquadFilter(); bp.type = 'bandpass'; bp.frequency.value = f; bp.Q.value = 60;
          var g2 = AC.createGain(); env(g2, tt, 0.002, amp * 5, dec * 0.8);
          s.connect(bp); bp.connect(g2); g2.connect(sfxBus); send(g2, 0.5); s.start(tt, Math.random()); s.stop(tt + dec + 0.1);
        });
        // bıçak bıçağa kayar: kısa sürtünme
        noise(tt + 0.03, 0.22, 'bandpass', 4200, 4, 0.07 * v, 0.2, null, 2600);
      }
      if (heavy) noise(t + 0.68, 0.3, 'lowpass', 220, 0.6, 0.45, 0.26);                  // kalkana gelen gümbürtü
    },
    // ok: vızıltı ve saplanma
    arrow: function (t) {
      for (var k = 0; k < 3; k++) { var tt = t + k * 0.05; noise(tt, 0.28, 'bandpass', 3800, 2.5, 0.16, 0.26, null, 900); }
      tone(t + 0.02, 330, 0.06, 'triangle', 0.08);                       // yay kirişi
      noise(t + 0.34, 0.08, 'lowpass', 600, 1, 0.35, 0.07);               // saplanma
      tone(t + 0.34, 140, 0.08, 'sine', 0.2);
    },
    // top ateşi: gemiden saldırı
    cannon: function (t) {
      var g = noise(t, 1.6, 'lowpass', 900, 0.7, 1.0, 1.4, null, 60); send(g, 0.7);
      tone(t, 85, 0.9, 'sine', 0.9, null, 32);
      noise(t, 0.08, 'highpass', 1500, 0.5, 0.5, 0.07);
      for (var i = 0; i < 6; i++) noise(t + 0.15 + Math.random() * 0.6, 0.03, 'bandpass', 2500, 3, 0.12, 0.02);   // çatırtı
    },
    // ağır darbe ve düşüş
    kill: function (t) {
      FX.clash(t, true);
      noise(t + 0.75, 0.5, 'lowpass', 160, 0.6, 0.6, 0.45);
      tone(t + 0.75, 70, 0.4, 'sine', 0.5, null, 40);
    },
    // çekiç ve örs
    build: function (t) {
      [0, 0.22, 0.44].forEach(function (d) {
        var tt = t + d; noise(tt, 0.04, 'highpass', 2500, 0.7, 0.35, 0.03);
        [2650, 3980, 5600].forEach(function (f, i) { var g = tone(tt, f, 0.25, 'sine', 0.06 / (i + 1)); send(g, 0.4); });
        tone(tt, 180, 0.08, 'sine', 0.25);
      });
    },
    coin: function (t) {
      [0, 0.09].forEach(function (d, k) { [3150, 4720, 6300].forEach(function (f, i) { tone(t + d, f * (1 + k * 0.06), 0.3, 'sine', 0.07 / (i + 1)); }); });
    },
    // savaş borusu: tur başlangıcı
    horn: function (t) {
      var o1 = AC.createOscillator(), o2 = AC.createOscillator(), f = AC.createBiquadFilter(), g = AC.createGain();
      o1.type = o2.type = 'sawtooth'; o1.frequency.value = 110; o2.frequency.value = 110.6;
      o1.frequency.setValueAtTime(98, t); o1.frequency.linearRampToValueAtTime(110, t + 0.18);
      f.type = 'lowpass'; f.frequency.setValueAtTime(300, t); f.frequency.linearRampToValueAtTime(1100, t + 0.25); f.frequency.linearRampToValueAtTime(600, t + 1.1);
      g.gain.setValueAtTime(0.0001, t); g.gain.linearRampToValueAtTime(0.28, t + 0.15); g.gain.setValueAtTime(0.28, t + 0.8); g.gain.exponentialRampToValueAtTime(0.0001, t + 1.3);
      o1.connect(f); o2.connect(f); f.connect(g); g.connect(sfxBus); send(g, 0.8);
      o1.start(t); o2.start(t); o1.stop(t + 1.4); o2.stop(t + 1.4);
    },
    // şehir alındı: boru fanfarı
    fanfare: function (t) {
      [[293.7, 0, 0.18], [440, 0.2, 0.18], [587.3, 0.4, 0.5], [440, 0.95, 0.15], [587.3, 1.12, 0.7]].forEach(function (n) {
        var o = AC.createOscillator(), f = AC.createBiquadFilter(), g = AC.createGain();
        o.type = 'sawtooth'; o.frequency.value = n[0]; f.type = 'lowpass'; f.frequency.value = 1600; f.Q.value = 2;
        g.gain.setValueAtTime(0.0001, t + n[1]); g.gain.linearRampToValueAtTime(0.13, t + n[1] + 0.04); g.gain.setValueAtTime(0.12, t + n[1] + n[2]); g.gain.exponentialRampToValueAtTime(0.0001, t + n[1] + n[2] + 0.15);
        o.connect(f); f.connect(g); g.connect(sfxBus); send(g, 0.6); o.start(t + n[1]); o.stop(t + n[1] + n[2] + 0.2);
      });
    },
    lost: function (t) { FX.horn(t); tone(t + 0.2, 82, 1.2, 'sawtooth', 0.06, null, 70); },
    win: function (t) { FX.fanfare(t); FX.drumroll(t + 1.8); },
    lose: function (t) { [196, 174.6, 155.6, 146.8].forEach(function (f, i) { pluckAt(t + i * 0.45, f, 0.5, sfxBus); }); FX.drum(t + 1.8, true); },
    drum: function (t, big) { tone(t, big ? 70 : 90, 0.5, 'sine', big ? 0.7 : 0.5, sfxBus, 45); noise(t, 0.12, 'lowpass', 300, 0.6, 0.3, 0.1); },
    drumroll: function (t) { for (var i = 0; i < 10; i++) FX.drum(t + i * 0.06, i === 9); }
  };

  /* ---------- ud (Karplus-Strong) ---------- */
  function pluckBuf(freq) {
    var key = Math.round(freq * 10);
    if (BUF[key]) return BUF[key];
    var sr = AC.sampleRate, len = Math.floor(sr * 2.2), b = AC.createBuffer(1, len, sr), d = b.getChannelData(0);
    var N = Math.max(2, Math.round(sr / freq)), ring = new Float32Array(N);
    for (var i = 0; i < N; i++) ring[i] = (Math.random() * 2 - 1) * (i < N * 0.5 ? 1 : 0.6);
    var p = 0, decay = 0.4985 + Math.min(0.0012, freq / 600000);
    for (var j = 0; j < len; j++) {
      var a = ring[p], nx = ring[(p + 1) % N];
      d[j] = a;
      ring[p] = (a + nx) * decay;
      p = (p + 1) % N;
    }
    BUF[key] = b; return b;
  }
  function pluckAt(t, freq, vol, out) {
    var s = AC.createBufferSource(); s.buffer = pluckBuf(freq);
    var f = AC.createBiquadFilter(); f.type = 'lowpass'; f.frequency.value = 2600;
    var body = AC.createBiquadFilter(); body.type = 'peaking'; body.frequency.value = 220; body.gain.value = 6; body.Q.value = 1.2;
    var g = AC.createGain(); g.gain.value = vol;
    s.connect(f); f.connect(body); body.connect(g); g.connect(out || musBus); send(g, 0.35);
    s.start(t); s.stop(t + 2.2);
  }
  /* ney: soluklu flüt */
  function neyAt(t, freq, dur, vol) {
    var o = AC.createOscillator(), g = AC.createGain(), vib = AC.createOscillator(), vg = AC.createGain();
    o.type = 'triangle'; o.frequency.value = freq; vib.frequency.value = 5; vg.gain.value = freq * 0.012;
    vib.connect(vg); vg.connect(o.frequency);
    g.gain.setValueAtTime(0.0001, t); g.gain.linearRampToValueAtTime(vol, t + 0.18); g.gain.setValueAtTime(vol * 0.85, t + dur - 0.1); g.gain.linearRampToValueAtTime(0.0001, t + dur + 0.25);
    var f = AC.createBiquadFilter(); f.type = 'lowpass'; f.frequency.value = 1800;
    o.connect(f); f.connect(g); g.connect(musBus); send(g, 0.8);
    var br = noise(t, dur + 0.2, 'bandpass', freq * 2, 3, vol * 0.25, dur + 0.15, musBus);
    o.start(t); vib.start(t); o.stop(t + dur + 0.3); vib.stop(t + dur + 0.3);
  }
  /* davul: düm ve tek */
  function dum(t, v) { tone(t, 75, 0.45, 'sine', 0.55 * v, musBus, 48); noise(t, 0.1, 'lowpass', 260, 0.6, 0.25 * v, 0.09, musBus); }
  function tek(t, v) { noise(t, 0.06, 'bandpass', 1900, 2, 0.28 * v, 0.05, musBus); tone(t, 340, 0.05, 'triangle', 0.08 * v, musBus); }
  /* bordon: kök ve beşli */
  var drone = null;
  function startDrone(root, vol) {
    stopDrone();
    var t = now(), nodes = [], g = AC.createGain(), f = AC.createBiquadFilter();
    f.type = 'lowpass'; f.frequency.value = 420; g.gain.setValueAtTime(0.0001, t); g.gain.linearRampToValueAtTime(vol, t + 3);
    [root, root * 1.5, root * 2.003].forEach(function (fr, i) { var o = AC.createOscillator(); o.type = i === 2 ? 'triangle' : 'sawtooth'; o.frequency.value = fr; o.connect(f); o.start(t); nodes.push(o); });
    var lfo = AC.createOscillator(), lg = AC.createGain(); lfo.frequency.value = 0.07; lg.gain.value = 140; lfo.connect(lg); lg.connect(f.frequency); lfo.start(t); nodes.push(lfo);
    f.connect(g); g.connect(musBus); send(g, 0.5);
    drone = { nodes: nodes, g: g };
  }
  function stopDrone() {
    if (!drone) return; var t = now(), d = drone; drone = null;
    d.g.gain.cancelScheduledValues(t); d.g.gain.setValueAtTime(d.g.gain.value, t); d.g.gain.linearRampToValueAtTime(0.0001, t + 1.5);
    setTimeout(function () { d.nodes.forEach(function (n) { try { n.stop(); } catch (e) {} }); }, 1700);
  }

  /* ---------- müzik bestecisi ---------- */
  var THEMES = {
    // Ana menü: Re Dorian, ağır ve geniş
    menu: { root: 146.83, scale: [0, 2, 3, 5, 7, 9, 10], bpm: 66, drone: 0.05, drum: null,
      motifs: [[0, 2, 4, 2, 0, -1], [4, 3, 2, 0, 1, 2], [0, 4, 7, 6, 4, 2], [2, 3, 4, 5, 4, 2, 0]], ney: true },
    // Savaş: Mi Hicaz, davullu ve gergin
    battle: { root: 164.81, scale: [0, 1, 4, 5, 7, 8, 10], bpm: 92, drone: 0.045, drum: 'sofyan',
      motifs: [[0, 1, 2, 1, 0, 1, 2, 3], [4, 3, 2, 1, 2, 1, 0], [0, 2, 4, 3, 2, 1, 0, 0], [2, 3, 4, 5, 4, 3, 2, 1]], ney: false }
  };
  var mus = { theme: null, nextT: 0, beat: 0, timer: 0, bar: 0, motif: 0 };
  function note(th, deg, oct) {
    var n = th.scale.length, o = Math.floor(deg / n), i = ((deg % n) + n) % n;
    return th.root * Math.pow(2, (th.scale[i] + 12 * (o + (oct || 0))) / 12);
  }
  function schedule() {
    if (!mus.theme || !AC) return;
    var th = THEMES[mus.theme], spb = 60 / th.bpm / 2; // sekizlik
    while (mus.nextT < now() + 0.5) {
      var t = mus.nextT, b = mus.beat % 16;
      if (b === 0) { mus.bar++; mus.motif = Math.floor(Math.random() * th.motifs.length); }
      var m = th.motifs[mus.motif];
      // ud: motif notaları her sekizlikte ya da çeyrekte
      var step = th.bpm > 80 ? 1 : 2;
      if (b % step === 0) {
        var deg = m[(b / step) % m.length];
        if (deg !== undefined) pluckAt(t, note(th, deg, 0), 0.36 + (b % 4 === 0 ? 0.1 : 0));
        if (b % 8 === 0) pluckAt(t, note(th, 0, -1), 0.3);   // bas teli
      }
      // savaş davulu: düm-tek-tek-düm-tek
      if (th.drum && mus.bar > 1) {
        var pat = { 0: 'D', 4: 't', 6: 't', 8: 'D', 10: 'D', 12: 't' };
        if (pat[b] === 'D') dum(t, 1); else if (pat[b] === 't') tek(t, 0.8);
      }
      // ney: menüde her iki ölçüde bir uzun cümle
      if (th.ney && b === 0 && mus.bar % 2 === 0) {
        var phrase = th.motifs[(mus.bar / 2) % th.motifs.length];
        for (var k = 0; k < 3; k++) neyAt(t + k * spb * 4, note(th, phrase[k * 2] + 7, 0), spb * 4 - 0.05, 0.05);
      }
      mus.nextT += spb; mus.beat++;
    }
  }
  function playTheme(name) {
    if (!ctx()) return;
    if (mus.theme === name) return;
    var t = now();
    musBus.gain.cancelScheduledValues(t); musBus.gain.setValueAtTime(musBus.gain.value, t);
    if (!enabled.music) { mus.theme = name; return; }
    musBus.gain.linearRampToValueAtTime(0.0001, t + 0.6);
    setTimeout(function () {
      mus.theme = name; mus.beat = 0; mus.bar = 0; mus.nextT = now() + 0.1;
      var th = THEMES[name]; startDrone(th.root / 2, th.drone);
      var t2 = now(); musBus.gain.cancelScheduledValues(t2); musBus.gain.setValueAtTime(0.0001, t2); musBus.gain.linearRampToValueAtTime(MUS_VOL, t2 + 2);
    }, 650);
    if (!mus.timer) mus.timer = setInterval(schedule, 120);
  }
  function setMusic(on) {
    enabled.music = on; if (!AC) return;
    var t = now(); musBus.gain.cancelScheduledValues(t); musBus.gain.setValueAtTime(musBus.gain.value, t);
    musBus.gain.linearRampToValueAtTime(on ? MUS_VOL : 0.0001, t + 0.5);
    if (on && mus.theme && !drone) { var th = THEMES[mus.theme]; startDrone(th.root / 2, th.drone); mus.nextT = now() + 0.1; }
    if (!on) stopDrone();
  }
  function setSfx(on) { enabled.sfx = on; if (sfxBus) sfxBus.gain.value = on ? 1 : 0; }
  function play(name, delay, arg) {
    if (!enabled.sfx || !ctx()) return;
    if (AC.state === 'suspended') AC.resume();
    try { FX[name](now() + 0.01 + (delay || 0), arg); } catch (e) {}
  }
  // ilk dokunuşta sesi aç (tarayıcı kuralı)
  function unlock() { if (ctx() && AC.state === 'suspended') AC.resume(); }
  ['pointerdown', 'keydown', 'touchstart'].forEach(function (ev) { window.addEventListener(ev, unlock, { passive: true }); });
  document.addEventListener('visibilitychange', function () { if (!AC) return; if (document.hidden) AC.suspend(); else AC.resume(); });

  return { play: play, playTheme: playTheme, setMusic: setMusic, setSfx: setSfx, verb: null, _fx: FX };
})();
