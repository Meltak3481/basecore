
// ═══════════════════════════════════════════════════════════════════════
// ── GLOBAL SOUND SYSTEM (Web Audio API — no files needed) ──
// All sounds generated procedurally. Works on all pages.
// Usage: SFX.play('click') / SFX.play('win') / SFX.play('spin') etc.
// ═══════════════════════════════════════════════════════════════════════
const SFX = (() => {
  let ctx = null;
  let enabled = true;

  // AudioContext — user gesture sonrası başlatılır
  function getCtx() {
    if (!ctx) {
      try {
        ctx = new (window.AudioContext || window.webkitAudioContext)();
      } catch(e) { return null; }
    }
    if (ctx.state === 'suspended') ctx.resume();
    return ctx;
  }

  // Temel ses çalıcı
  function tone(freq, type, vol, duration, startTime, fadeOut = true) {
    const c = getCtx();
    if (!c || !enabled) return;

    const osc  = c.createOscillator();
    const gain = c.createGain();
    osc.connect(gain);
    gain.connect(c.destination);

    osc.type      = type;
    osc.frequency.setValueAtTime(freq, startTime);
    gain.gain.setValueAtTime(vol, startTime);
    if (fadeOut) gain.gain.exponentialRampToValueAtTime(0.001, startTime + duration);

    osc.start(startTime);
    osc.stop(startTime + duration + 0.05);
  }

  // Gürültü (spin sesi için)
  function noise(vol, duration, startTime) {
    const c = getCtx();
    if (!c || !enabled) return;
    const bufSize = c.sampleRate * duration;
    const buf     = c.createBuffer(1, bufSize, c.sampleRate);
    const data    = buf.getChannelData(0);
    for (let i = 0; i < bufSize; i++) data[i] = (Math.random() * 2 - 1) * 0.3;

    const src    = c.createBufferSource();
    const filter = c.createBiquadFilter();
    const gain   = c.createGain();

    src.buffer = buf;
    filter.type      = 'bandpass';
    filter.frequency.value = 600;
    filter.Q.value   = 0.5;

    src.connect(filter);
    filter.connect(gain);
    gain.connect(c.destination);

    gain.gain.setValueAtTime(vol, startTime);
    gain.gain.exponentialRampToValueAtTime(0.001, startTime + duration);

    src.start(startTime);
    src.stop(startTime + duration);
  }

  // Ses tanımları
  const sounds = {

    // UI clicks
    click() {
      const c = getCtx(); if (!c) return;
      const t = c.currentTime;
      tone(800, 'sine', 0.12, 0.08, t);
    },

    // Cüzdan bağlandı
    connect() {
      const c = getCtx(); if (!c) return;
      const t = c.currentTime;
      tone(440, 'sine', 0.15, 0.12, t);
      tone(660, 'sine', 0.12, 0.15, t + 0.1);
      tone(880, 'sine', 0.10, 0.20, t + 0.22);
    },

    // XP kazandı
    xp() {
      const c = getCtx(); if (!c) return;
      const t = c.currentTime;
      tone(523, 'triangle', 0.12, 0.08, t);
      tone(659, 'triangle', 0.10, 0.10, t + 0.07);
      tone(784, 'triangle', 0.09, 0.15, t + 0.14);
    },

    // Küçük kazanç (coin flip, dice win)
    win() {
      const c = getCtx(); if (!c) return;
      const t = c.currentTime;
      [523, 659, 784, 1047].forEach((f, i) => {
        tone(f, 'triangle', 0.13 - i*0.02, 0.15, t + i * 0.09);
      });
    },

    // Büyük kazanç
    bigwin() {
      const c = getCtx(); if (!c) return;
      const t = c.currentTime;
      [392, 523, 659, 784, 1047, 1319].forEach((f, i) => {
        tone(f, 'triangle', 0.15 - i*0.02, 0.2, t + i * 0.08);
      });
      tone(1568, 'sine', 0.12, 0.5, t + 0.55);
    },

    // Kayıp
    lose() {
      const c = getCtx(); if (!c) return;
      const t = c.currentTime;
      tone(300, 'sawtooth', 0.1, 0.12, t);
      tone(220, 'sawtooth', 0.08, 0.15, t + 0.1);
      tone(160, 'sawtooth', 0.07, 0.25, t + 0.22);
    },

    // Çark dönüş tik-tak
    tick() {
      const c = getCtx(); if (!c) return;
      const t = c.currentTime;
      tone(1200, 'square', 0.05, 0.03, t);
    },

    // Çark dönüş (sürekli, frekans hızla düşer)
    spinStart() {
      const c = getCtx(); if (!c) return;
      const t = c.currentTime;
      noise(0.08, 0.4, t);
      tone(200, 'sawtooth', 0.06, 0.4, t);
    },

    spinEnd() {
      const c = getCtx(); if (!c) return;
      const t = c.currentTime;
      // Yavaşlama sesi
      tone(400, 'sine', 0.08, 0.15, t);
      tone(300, 'sine', 0.06, 0.2, t + 0.12);
      tone(220, 'sine', 0.05, 0.3, t + 0.28);
    },

    // Mystery box
    mystery() {
      const c = getCtx(); if (!c) return;
      const t = c.currentTime;
      // Majestik arpej
      [261, 329, 392, 523, 659, 784].forEach((f, i) => {
        tone(f, 'sine', 0.12, 0.25, t + i * 0.07);
      });
      tone(1047, 'sine', 0.15, 0.6, t + 0.5);
    },

    // Coin flip
    flip() {
      const c = getCtx(); if (!c) return;
      const t = c.currentTime;
      // Dönen para sesi
      for (let i = 0; i < 8; i++) {
        const freq = 800 + i * 40;
        const vol  = 0.06 - i * 0.005;
        tone(freq, 'square', vol, 0.04, t + i * 0.08);
      }
    },

    // Slot makinesi
    slots() {
      const c = getCtx(); if (!c) return;
      const t = c.currentTime;
      for (let i = 0; i < 6; i++) {
        noise(0.04, 0.06, t + i * 0.12);
      }
    },

    // Zar
    dice() {
      const c = getCtx(); if (!c) return;
      const t = c.currentTime;
      noise(0.1, 0.15, t);
      tone(300, 'square', 0.05, 0.08, t + 0.05);
    },

    // Crash başlangıç
    crashStart() {
      const c = getCtx(); if (!c) return;
      const t = c.currentTime;
      tone(100, 'sawtooth', 0.1, 0.3, t);
      tone(150, 'sine', 0.08, 0.3, t + 0.1);
    },

    // Crash patladı
    crashBoom() {
      const c = getCtx(); if (!c) return;
      const t = c.currentTime;
      noise(0.2, 0.5, t);
      tone(80, 'sawtooth', 0.15, 0.4, t);
      tone(50, 'sawtooth', 0.12, 0.6, t + 0.1);
    },

    // Cash out
    cashout() {
      const c = getCtx(); if (!c) return;
      const t = c.currentTime;
      [784, 1047, 1319].forEach((f, i) => {
        tone(f, 'sine', 0.13, 0.2, t + i * 0.1);
      });
    },

    // Plinko top düştü
    plink() {
      const c = getCtx(); if (!c) return;
      const t = c.currentTime;
      const f = 600 + Math.random() * 400;
      tone(f, 'sine', 0.08, 0.06, t);
    },

    // Roulette çark
    roulette() {
      const c = getCtx(); if (!c) return;
      const t = c.currentTime;
      noise(0.06, 1.2, t);
      for (let i = 0; i < 12; i++) {
        tone(1000 + i * 50, 'square', 0.03, 0.04, t + i * 0.1);
      }
    },

    // GM gönderildi
    gm() {
      const c = getCtx(); if (!c) return;
      const t = c.currentTime;
      tone(523, 'sine', 0.12, 0.15, t);
      tone(659, 'sine', 0.10, 0.18, t + 0.12);
      tone(784, 'sine', 0.09, 0.25, t + 0.26);
    },

    // Ödeme onaylandı
    payment() {
      const c = getCtx(); if (!c) return;
      const t = c.currentTime;
      [392, 523, 784, 1047].forEach((f, i) => {
        tone(f, 'sine', 0.12, 0.18, t + i * 0.1);
      });
    },

    // Hata
    error() {
      const c = getCtx(); if (!c) return;
      const t = c.currentTime;
      tone(200, 'square', 0.1, 0.1, t);
      tone(180, 'square', 0.08, 0.15, t + 0.08);
    },
  };

  return {
    play(name) {
      if (!enabled) return;
      try {
        if (sounds[name]) sounds[name]();
      } catch(e) {
        console.warn('[SFX] Error playing:', name, e);
      }
    },

    enable()  { enabled = true;  localStorage.setItem('bc_sfx', '1'); },
    disable() { enabled = false; localStorage.setItem('bc_sfx', '0'); },
    toggle()  { enabled ? this.disable() : this.enable(); return enabled; },
    isEnabled() { return enabled; },

    // Sayfa yüklenince localStorage'dan ayarı oku
    init() {
      const saved = localStorage.getItem('bc_sfx');
      enabled = saved !== '0'; // default: açık
    },
  };
})();

// Otomatik init
SFX.init();

// Tüm buton tıklamalarına hafif click sesi ekle (global)
document.addEventListener('click', (e) => {
  const el = e.target.closest('button, .game-card, .tab-item, .nav-connect, .cf-btn, .dp-btn');
  if (el && !el.disabled) SFX.play('click');
}, { passive: true });
