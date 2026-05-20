/**
 * BaseCore Character System
 * ⬡ Base Entity — SVG katmanlı, animasyonlu maskot
 *
 * Seviye eşikleri (kümülatif XP):
 *   Lv2:  5K   Lv3:  15K  Lv4:  40K  Lv5:  90K
 *   Lv6:  190K Lv7:  340K Lv8:  590K Lv9:  1.09M Lv10: 2.09M
 */

const CHAR = (() => {

  // ── XP eşikleri (lv1'den lv10'a geçiş için kümülatif) ──
  const XP_THRESHOLDS = [0, 5000, 15000, 40000, 90000, 190000, 340000, 590000, 1090000, 2090000];

  // ── Seviye isimleri ──
  const LEVEL_NAMES = [
    'Genesis',      // 1
    'Awakened',     // 2
    'Sentient',     // 3
    'Pioneer',      // 4
    'Ascendant',    // 5
    'Sovereign',    // 6
    'Celestial',    // 7
    'Eternal',      // 8
    'Transcendent', // 9
    'Base God',     // 10
  ];

  // ── Katman açıklamaları ──
  const LAYER_NAMES = [
    'Core Hex',      // Lv1 — always visible
    'Inner Glow',    // Lv2
    'Eyes',          // Lv3
    'Hat',           // Lv4
    'Arms',          // Lv5
    'Wings',         // Lv6
    'Chain',         // Lv7
    'Aura Rings',    // Lv8
    'Blue Flames',   // Lv9
    'Crown + God',   // Lv10
  ];

  // ── SVG Builder ──
  function buildSVG(level, size = 120, animate = true) {
    const cx = size / 2;
    const cy = size / 2;
    const R  = size * 0.36; // hex yarıçapı

    // Hex noktaları
    function hexPoints(cx, cy, r, rotation = 0) {
      let pts = '';
      for (let i = 0; i < 6; i++) {
        const a = (Math.PI / 3) * i + rotation;
        pts += `${cx + r * Math.cos(a)},${cy + r * Math.sin(a)} `;
      }
      return pts.trim();
    }

    const animAttr = animate ? '' : '';

    let svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${size} ${size}" width="${size}" height="${size}" style="overflow:visible">
  <defs>
    <!-- Ana mavi gradient -->
    <radialGradient id="cg-body" cx="40%" cy="35%" r="65%">
      <stop offset="0%"   stop-color="#60a5fa"/>
      <stop offset="40%"  stop-color="#2563eb"/>
      <stop offset="100%" stop-color="#1e3a8a"/>
    </radialGradient>
    <!-- God Mode gradient -->
    <radialGradient id="cg-god" cx="40%" cy="35%" r="65%">
      <stop offset="0%"   stop-color="#ffffff"/>
      <stop offset="25%"  stop-color="#bfdbfe"/>
      <stop offset="60%"  stop-color="#3b82f6"/>
      <stop offset="100%" stop-color="#1d4ed8"/>
    </radialGradient>
    <!-- Glow filter -->
    <filter id="cf-glow" x="-40%" y="-40%" width="180%" height="180%">
      <feGaussianBlur stdDeviation="3" result="blur"/>
      <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
    </filter>
    <!-- Strong glow -->
    <filter id="cf-glow2" x="-60%" y="-60%" width="220%" height="220%">
      <feGaussianBlur stdDeviation="6" result="blur"/>
      <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
    </filter>
    <!-- God glow -->
    <filter id="cf-godglow" x="-80%" y="-80%" width="260%" height="260%">
      <feGaussianBlur stdDeviation="10" result="blur"/>
      <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
    </filter>
    <!-- Wing gradient -->
    <linearGradient id="cg-wing" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%"   stop-color="#93c5fd" stop-opacity="0.9"/>
      <stop offset="100%" stop-color="#1d4ed8" stop-opacity="0.4"/>
    </linearGradient>
    <!-- Flame gradient -->
    <linearGradient id="cg-flame" x1="0%" y1="100%" x2="0%" y2="0%">
      <stop offset="0%"   stop-color="#1e3a8a"/>
      <stop offset="50%"  stop-color="#3b82f6"/>
      <stop offset="100%" stop-color="#bfdbfe" stop-opacity="0"/>
    </linearGradient>
    <!-- Crown gradient -->
    <linearGradient id="cg-crown" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%"   stop-color="#fde68a"/>
      <stop offset="50%"  stop-color="#f59e0b"/>
      <stop offset="100%" stop-color="#b45309"/>
    </linearGradient>
    <!-- Aura gradient -->
    <radialGradient id="cg-aura" cx="50%" cy="50%" r="50%">
      <stop offset="60%"  stop-color="#3b82f6" stop-opacity="0"/>
      <stop offset="100%" stop-color="#60a5fa" stop-opacity="0.35"/>
    </radialGradient>
  </defs>\n`;

    // ════════════════════════════════════════════
    // KATMAN 9: Aura rings (Lv8+) — arka planda
    // ════════════════════════════════════════════
    if (level >= 8) {
      svg += `  <!-- Aura Rings -->
  <g opacity="0.7">
    <polygon points="${hexPoints(cx, cy, R * 1.55)}" fill="none" stroke="#3b82f6" stroke-width="1.2" stroke-opacity="0.4">
      ${animate ? `<animateTransform attributeName="transform" type="rotate" from="0 ${cx} ${cy}" to="360 ${cx} ${cy}" dur="12s" repeatCount="indefinite"/>` : ''}
    </polygon>
    <polygon points="${hexPoints(cx, cy, R * 1.75)}" fill="none" stroke="#60a5fa" stroke-width="0.8" stroke-opacity="0.25">
      ${animate ? `<animateTransform attributeName="transform" type="rotate" from="360 ${cx} ${cy}" to="0 ${cx} ${cy}" dur="18s" repeatCount="indefinite"/>` : ''}
    </polygon>
    <polygon points="${hexPoints(cx, cy, R * 2.0)}" fill="none" stroke="#93c5fd" stroke-width="0.5" stroke-opacity="0.15">
      ${animate ? `<animateTransform attributeName="transform" type="rotate" from="0 ${cx} ${cy}" to="360 ${cx} ${cy}" dur="24s" repeatCount="indefinite"/>` : ''}
    </polygon>
  </g>\n`;
    }

    // ════════════════════════════════════════════
    // KATMAN 8: Kanatlar (Lv6+)
    // ════════════════════════════════════════════
    if (level >= 6) {
      const wy = cy + R * 0.1;
      svg += `  <!-- Wings -->
  <g filter="url(#cf-glow)" opacity="${level >= 7 ? '0.95' : '0.8'}">
    <!-- Left wing -->
    <path d="M${cx - R * 0.3},${wy} Q${cx - R * 1.6},${wy - R * 0.8} ${cx - R * 1.9},${wy + R * 0.5} Q${cx - R * 1.2},${wy + R * 0.3} ${cx - R * 0.3},${wy + R * 0.4} Z"
      fill="url(#cg-wing)" stroke="#93c5fd" stroke-width="0.8" stroke-opacity="0.6">
      ${animate ? `<animateTransform attributeName="transform" type="translate" values="0,0;-3,-2;0,0" dur="3s" repeatCount="indefinite"/>` : ''}
    </path>
    <!-- Right wing -->
    <path d="M${cx + R * 0.3},${wy} Q${cx + R * 1.6},${wy - R * 0.8} ${cx + R * 1.9},${wy + R * 0.5} Q${cx + R * 1.2},${wy + R * 0.3} ${cx + R * 0.3},${wy + R * 0.4} Z"
      fill="url(#cg-wing)" stroke="#93c5fd" stroke-width="0.8" stroke-opacity="0.6">
      ${animate ? `<animateTransform attributeName="transform" type="translate" values="0,0;3,-2;0,0" dur="3s" repeatCount="indefinite"/>` : ''}
    </path>
  </g>\n`;
    }

    // ════════════════════════════════════════════
    // KATMAN 7: Ateş (Lv9+)
    // ════════════════════════════════════════════
    if (level >= 9) {
      const fy = cy + R * 0.85;
      svg += `  <!-- Blue Flames -->
  <g>
    <ellipse cx="${cx - R * 0.35}" cy="${fy + R * 0.2}" rx="${R * 0.18}" ry="${R * 0.45}" fill="url(#cg-flame)" opacity="0.9">
      ${animate ? `<animate attributeName="ry" values="${R*0.45};${R*0.6};${R*0.45}" dur="1.2s" repeatCount="indefinite"/>
      <animate attributeName="opacity" values="0.9;0.6;0.9" dur="1.2s" repeatCount="indefinite"/>` : ''}
    </ellipse>
    <ellipse cx="${cx}" cy="${fy + R * 0.15}" rx="${R * 0.22}" ry="${R * 0.55}" fill="url(#cg-flame)" opacity="0.95">
      ${animate ? `<animate attributeName="ry" values="${R*0.55};${R*0.72};${R*0.55}" dur="1s" repeatCount="indefinite"/>
      <animate attributeName="opacity" values="0.95;0.65;0.95" dur="1s" repeatCount="indefinite"/>` : ''}
    </ellipse>
    <ellipse cx="${cx + R * 0.35}" cy="${fy + R * 0.2}" rx="${R * 0.18}" ry="${R * 0.45}" fill="url(#cg-flame)" opacity="0.9">
      ${animate ? `<animate attributeName="ry" values="${R*0.45};${R*0.58};${R*0.45}" dur="1.4s" repeatCount="indefinite"/>
      <animate attributeName="opacity" values="0.9;0.6;0.9" dur="1.4s" repeatCount="indefinite"/>` : ''}
    </ellipse>
  </g>\n`;
    }

    // ════════════════════════════════════════════
    // KATMAN 1: Ana hex gövde (her zaman)
    // ════════════════════════════════════════════
    const bodyFill = level >= 10 ? 'url(#cg-god)' : level >= 2 ? 'url(#cg-body)' : 'none';
    const bodyStroke = level >= 10 ? '#bfdbfe' : '#3b82f6';
    const bodyStrokeW = level >= 10 ? 2 : 1.5;
    const bodyFilter = level >= 10 ? 'filter="url(#cf-godglow)"' : level >= 5 ? 'filter="url(#cf-glow)"' : '';

    svg += `  <!-- Body Hex -->
  <polygon points="${hexPoints(cx, cy, R)}"
    fill="${bodyFill}"
    stroke="${bodyStroke}"
    stroke-width="${bodyStrokeW}"
    ${bodyFilter}>
    ${animate && level >= 1 ? `<animateTransform attributeName="transform" type="scale" values="1 1;1.02 1.02;1 1" additive="sum" dur="4s" repeatCount="indefinite" calcMode="spline" keySplines="0.4 0 0.6 1;0.4 0 0.6 1"/>` : ''}
  </polygon>\n`;

    // Lv1 — outline pulse
    if (level === 1) {
      svg += `  <polygon points="${hexPoints(cx, cy, R)}" fill="none" stroke="#60a5fa" stroke-width="2" opacity="0.5">
    ${animate ? `<animate attributeName="opacity" values="0.5;1;0.5" dur="2s" repeatCount="indefinite"/>
    <animate attributeName="stroke-width" values="2;3.5;2" dur="2s" repeatCount="indefinite"/>` : ''}
  </polygon>\n`;
    }

    // Lv2+ inner glow
    if (level >= 2) {
      svg += `  <polygon points="${hexPoints(cx, cy, R * 0.72)}"
    fill="#1e40af" fill-opacity="0.5" stroke="#60a5fa" stroke-width="0.8" stroke-opacity="0.6">
  </polygon>
  <polygon points="${hexPoints(cx, cy, R * 0.42)}"
    fill="#93c5fd" fill-opacity="${level >= 10 ? '0.9' : '0.35'}">
    ${animate ? `<animate attributeName="fill-opacity" values="${level>=10?'0.9':'0.35'};${level>=10?'1':'0.55'};${level>=10?'0.9':'0.35'}" dur="2.5s" repeatCount="indefinite"/>` : ''}
  </polygon>\n`;
    }

    // ════════════════════════════════════════════
    // KATMAN 3: Gözler (Lv3+)
    // ════════════════════════════════════════════
    if (level >= 3) {
      const ey = cy - R * 0.12;
      const ex1 = cx - R * 0.28;
      const ex2 = cx + R * 0.28;
      const er  = R * 0.1;
      svg += `  <!-- Eyes -->
  <g filter="url(#cf-glow)">
    <circle cx="${ex1}" cy="${ey}" r="${er}" fill="#bfdbfe">
      ${animate ? `<animate attributeName="r" values="${er};${er*1.3};${er}" dur="3s" repeatCount="indefinite"/>` : ''}
    </circle>
    <circle cx="${ex2}" cy="${ey}" r="${er}" fill="#bfdbfe">
      ${animate ? `<animate attributeName="r" values="${er};${er*1.3};${er}" dur="3s" repeatCount="indefinite"/>` : ''}
    </circle>
    <circle cx="${ex1 - er*0.2}" cy="${ey - er*0.2}" r="${er*0.35}" fill="white" opacity="0.8"/>
    <circle cx="${ex2 - er*0.2}" cy="${ey - er*0.2}" r="${er*0.35}" fill="white" opacity="0.8"/>
  </g>\n`;
    }

    // ════════════════════════════════════════════
    // KATMAN 5: Kollar (Lv5+)
    // ════════════════════════════════════════════
    if (level >= 5) {
      const ay = cy + R * 0.1;
      svg += `  <!-- Arms -->
  <g stroke="#60a5fa" stroke-width="${R * 0.1}" stroke-linecap="round" fill="none" opacity="0.9">
    <!-- Left arm -->
    <line x1="${cx - R * 0.82}" y1="${ay}" x2="${cx - R * 1.35}" y2="${ay + R * 0.45}">
      ${animate ? `<animateTransform attributeName="transform" type="rotate" values="-8 ${cx - R * 0.82} ${ay};8 ${cx - R * 0.82} ${ay};-8 ${cx - R * 0.82} ${ay}" dur="3s" repeatCount="indefinite"/>` : ''}
    </line>
    <!-- Right arm -->
    <line x1="${cx + R * 0.82}" y1="${ay}" x2="${cx + R * 1.35}" y2="${ay + R * 0.45}">
      ${animate ? `<animateTransform attributeName="transform" type="rotate" values="8 ${cx + R * 0.82} ${ay};-8 ${cx + R * 0.82} ${ay};8 ${cx + R * 0.82} ${ay}" dur="3s" repeatCount="indefinite"/>` : ''}
    </line>
    <!-- Left hand -->
    <circle cx="${cx - R * 1.38}" cy="${ay + R * 0.48}" r="${R * 0.1}" fill="#60a5fa" stroke="none"/>
    <!-- Right hand -->
    <circle cx="${cx + R * 1.38}" cy="${ay + R * 0.48}" r="${R * 0.1}" fill="#60a5fa" stroke="none"/>
  </g>\n`;
    }

    // ════════════════════════════════════════════
    // KATMAN 6: Zincir (Lv7+)
    // ════════════════════════════════════════════
    if (level >= 7) {
      const chy = cy + R * 0.55;
      svg += `  <!-- Chain -->
  <g opacity="0.85">
    <ellipse cx="${cx}" cy="${chy}" rx="${R * 0.35}" ry="${R * 0.07}" fill="none" stroke="#93c5fd" stroke-width="1.8"/>
    <rect x="${cx - R * 0.08}" y="${chy - R * 0.22}" width="${R * 0.16}" height="${R * 0.2}" rx="2" fill="#60a5fa" stroke="#bfdbfe" stroke-width="0.8"/>
    <polygon points="${cx},${chy - R * 0.28} ${cx - R*0.1},${chy - R * 0.16} ${cx + R*0.1},${chy - R * 0.16}" fill="#fde68a" stroke="#f59e0b" stroke-width="0.5"/>
  </g>\n`;
    }

    // ════════════════════════════════════════════
    // KATMAN 4: Şapka (Lv4+)
    // ════════════════════════════════════════════
    if (level >= 4 && level < 10) {
      const hty = cy - R * 0.78;
      const hbr = R * 0.45;
      svg += `  <!-- Hat -->
  <g>
    <!-- Hat brim -->
    <ellipse cx="${cx}" cy="${hty + R * 0.15}" rx="${hbr}" ry="${R * 0.1}" fill="#1e3a8a" stroke="#3b82f6" stroke-width="1"/>
    <!-- Hat body -->
    <rect x="${cx - hbr * 0.65}" y="${hty - R * 0.35}" width="${hbr * 1.3}" height="${R * 0.52}" rx="3" fill="#1e40af" stroke="#3b82f6" stroke-width="0.8"/>
    <!-- Hat band -->
    <rect x="${cx - hbr * 0.65}" y="${hty - R * 0.02}" width="${hbr * 1.3}" height="${R * 0.1}" rx="1" fill="#2563eb"/>
    <!-- Hat mini hex -->
    <polygon points="${hexPoints(cx, hty - R * 0.18, R * 0.14)}" fill="#60a5fa" stroke="#93c5fd" stroke-width="0.6"/>
  </g>\n`;
    }

    // ════════════════════════════════════════════
    // KATMAN 10: Taç + God Mode (Lv10)
    // ════════════════════════════════════════════
    if (level >= 10) {
      const cty = cy - R * 0.88;
      svg += `  <!-- Crown -->
  <g filter="url(#cf-glow2)">
    <!-- Crown base -->
    <rect x="${cx - R * 0.52}" y="${cty + R * 0.05}" width="${R * 1.04}" height="${R * 0.32}" rx="3"
      fill="url(#cg-crown)" stroke="#fde68a" stroke-width="0.8"/>
    <!-- Crown teeth -->
    <polygon points="${cx - R*0.52},${cty + R*0.05} ${cx - R*0.38},${cty - R*0.25} ${cx - R*0.24},${cty + R*0.05}"
      fill="url(#cg-crown)" stroke="#fde68a" stroke-width="0.5"/>
    <polygon points="${cx - R*0.14},${cty + R*0.05} ${cx},${cty - R*0.38} ${cx + R*0.14},${cty + R*0.05}"
      fill="url(#cg-crown)" stroke="#fde68a" stroke-width="0.5"/>
    <polygon points="${cx + R*0.24},${cty + R*0.05} ${cx + R*0.38},${cty - R*0.25} ${cx + R*0.52},${cty + R*0.05}"
      fill="url(#cg-crown)" stroke="#fde68a" stroke-width="0.5"/>
    <!-- Crown gems -->
    <circle cx="${cx - R*0.31}" cy="${cty + R*0.22}" r="${R*0.07}" fill="#bfdbfe">
      ${animate ? `<animate attributeName="fill" values="#bfdbfe;#ffffff;#bfdbfe" dur="1.5s" repeatCount="indefinite"/>` : ''}
    </circle>
    <circle cx="${cx}" cy="${cty + R*0.22}" r="${R*0.09}" fill="#60a5fa">
      ${animate ? `<animate attributeName="fill" values="#60a5fa;#ffffff;#60a5fa" dur="1.2s" repeatCount="indefinite"/>` : ''}
    </circle>
    <circle cx="${cx + R*0.31}" cy="${cty + R*0.22}" r="${R*0.07}" fill="#bfdbfe">
      ${animate ? `<animate attributeName="fill" values="#bfdbfe;#ffffff;#bfdbfe" dur="1.8s" repeatCount="indefinite"/>` : ''}
    </circle>
  </g>
  <!-- God mode outer glow pulse -->
  <polygon points="${hexPoints(cx, cy, R * 1.15)}" fill="url(#cg-aura)" stroke="#60a5fa" stroke-width="0.5" stroke-opacity="0.4">
    ${animate ? `<animate attributeName="stroke-opacity" values="0.4;0.9;0.4" dur="2s" repeatCount="indefinite"/>
    <animate attributeName="fill-opacity" values="1;1.5;1" dur="2s" repeatCount="indefinite"/>` : ''}
  </polygon>
  <!-- God mode particles -->
  ${[...Array(8)].map((_, i) => {
    const a = (Math.PI * 2 / 8) * i;
    const px = cx + Math.cos(a) * R * 1.35;
    const py = cy + Math.sin(a) * R * 1.35;
    return `<circle cx="${px}" cy="${py}" r="${R * 0.05}" fill="#bfdbfe" opacity="0.8">
    ${animate ? `<animate attributeName="opacity" values="0.8;0.2;0.8" dur="${1.5 + i * 0.25}s" repeatCount="indefinite"/>
    <animate attributeName="r" values="${R*0.05};${R*0.09};${R*0.05}" dur="${1.5 + i * 0.25}s" repeatCount="indefinite"/>` : ''}
  </circle>`;
  }).join('\n  ')}\n`;
    }

    svg += `</svg>`;
    return svg;
  }

  // ── Seviye hesapla ──
  function getLevel(xp) {
    for (let i = XP_THRESHOLDS.length - 1; i >= 0; i--) {
      if (xp >= XP_THRESHOLDS[i]) return i + 1;
    }
    return 1;
  }

  function getProgress(xp) {
    const lv   = getLevel(xp);
    if (lv >= 10) return { pct: 100, cur: xp, needed: 0, next: 0 };
    const cur  = XP_THRESHOLDS[lv - 1];
    const next = XP_THRESHOLDS[lv];
    const pct  = Math.min(100, ((xp - cur) / (next - cur)) * 100);
    return { pct, cur: xp - cur, needed: next - cur, next };
  }

  // ── Widget oluştur / güncelle ──
  function renderWidget(xp) {
    const lv   = getLevel(xp);
    const name = LEVEL_NAMES[lv - 1];
    const prog = getProgress(xp);

    const el = document.getElementById('char-widget');
    if (!el) return;

    // Widget stilini güncelle — dikey, merkezi, büyük
    el.style.cssText = `
      background:linear-gradient(160deg,rgba(30,58,138,.28),rgba(37,99,235,.12),rgba(15,23,42,.8));
      border:1px solid rgba(96,165,250,.38);border-radius:22px;
      padding:22px 20px 16px;margin-bottom:20px;
      display:flex;flex-direction:column;align-items:center;
      position:relative;overflow:hidden;cursor:pointer;
      box-shadow:0 0 48px rgba(37,99,235,.18),0 8px 32px rgba(0,0,0,.35);
      transition:all .3s;
    `;

    el.innerHTML = `
      <!-- Üst glow çizgisi -->
      <div style="position:absolute;top:0;left:0;right:0;height:1px;
        background:linear-gradient(90deg,transparent,rgba(96,165,250,.7),rgba(147,197,253,.5),transparent);"></div>

      <!-- Arka radyal glow -->
      <div style="position:absolute;inset:0;
        background:radial-gradient(ellipse at 50% 0%,rgba(37,99,235,.14),transparent 65%);
        pointer-events:none;"></div>

      <!-- Karakter — büyük, merkezi -->
      <div style="position:relative;margin-bottom:14px;filter:drop-shadow(0 8px 24px rgba(37,99,235,.5));">
        ${buildSVG(lv, 120, true)}
        <!-- Gölge -->
        <div style="position:absolute;bottom:-10px;left:50%;transform:translateX(-50%);
          width:90px;height:14px;background:radial-gradient(ellipse,rgba(37,99,235,.5),transparent);
          filter:blur(6px);"></div>
      </div>

      <!-- İsim + Level badge -->
      <div style="display:flex;align-items:center;gap:8px;margin-bottom:4px;z-index:1;">
        <span style="font-size:17px;font-weight:900;color:#fff;">Base Entity</span>
        <span style="background:rgba(37,99,235,.25);border:1px solid rgba(96,165,250,.4);
          border-radius:20px;padding:2px 10px;font-size:11px;font-weight:800;
          color:#93c5fd;font-family:var(--mono);">LV ${lv}</span>
      </div>

      <!-- Evolution ismi -->
      <div style="font-size:12px;color:#93c5fd;font-weight:700;margin-bottom:12px;z-index:1;">${name}</div>

      <!-- XP Bar -->
      <div style="width:100%;background:rgba(255,255,255,.07);border-radius:8px;
        height:6px;overflow:hidden;margin-bottom:5px;z-index:1;">
        <div id="cw-bar" style="height:100%;border-radius:8px;
          background:linear-gradient(90deg,#1d4ed8,#3b82f6,#93c5fd);
          width:0%;transition:width 1.4s cubic-bezier(.34,1.56,.64,1);"></div>
      </div>

      <!-- XP label -->
      <div style="font-size:10px;color:rgba(255,255,255,.4);font-family:var(--mono);margin-bottom:8px;z-index:1;">
        ${lv >= 10 ? '⬡ MAX LEVEL — Base God' : `${fmtXP(prog.cur)} / ${fmtXP(prog.needed)} XP → ${LEVEL_NAMES[lv]}`}
      </div>

      <!-- Tap hint -->
      <div style="font-size:10px;color:rgba(96,165,250,.4);letter-spacing:.8px;
        text-transform:uppercase;z-index:1;">Tap to view evolution ›</div>
    `;

    setTimeout(() => {
      const bar = document.getElementById('cw-bar');
      if (bar) bar.style.width = prog.pct + '%';
    }, 100);
  }

  // ── Modal ──
  function openModal() {
    const xp   = typeof BC !== 'undefined' ? BC.xp : 0;
    const lv   = getLevel(xp);
    const name = LEVEL_NAMES[lv - 1];
    const prog = getProgress(xp);

    let modal = document.getElementById('char-modal-overlay');
    if (!modal) {
      modal = document.createElement('div');
      modal.id = 'char-modal-overlay';
      modal.style.cssText = `
        position:fixed;inset:0;z-index:850;
        background:rgba(0,0,0,.88);backdrop-filter:blur(22px);
        display:flex;align-items:flex-end;justify-content:center;
        animation:cmFadeIn .25s ease;
      `;
      modal.addEventListener('click', (e) => { if (e.target === modal) closeModal(); });
      document.body.appendChild(modal);

      if (!document.getElementById('char-modal-styles')) {
        const st = document.createElement('style');
        st.id = 'char-modal-styles';
        st.textContent = `
          @keyframes cmFadeIn{from{opacity:0}to{opacity:1}}
          @keyframes cmSlideUp{from{transform:translateY(100%)}to{transform:translateY(0)}}
          @keyframes cmLvUp{0%{transform:scale(1)}40%{transform:scale(1.15)}70%{transform:scale(.95)}100%{transform:scale(1)}}
          .cm-evo-done   {opacity:.45;}
          .cm-evo-current{border-color:rgba(37,99,235,.5)!important;background:rgba(37,99,235,.1)!important;box-shadow:0 0 20px rgba(37,99,235,.15);}
          .cm-evo-locked {opacity:.22;}
          #char-modal-card::-webkit-scrollbar{width:0}
        `;
        document.head.appendChild(st);
      }
    }

    // Evolution listesi
    const evoItems = XP_THRESHOLDS.map((thresh, i) => {
      const lvNum  = i + 1;
      const evName = LEVEL_NAMES[i];
      const layerN = LAYER_NAMES[i];
      const isDone    = lv > lvNum;
      const isCurrent = lv === lvNum;
      const isLocked  = lv < lvNum;
      const cls = isDone ? 'cm-evo-done' : isCurrent ? 'cm-evo-current' : 'cm-evo-locked';

      return `
        <div style="display:flex;align-items:center;gap:12px;padding:12px 14px;border-radius:14px;border:1px solid var(--border);background:var(--card);transition:all .2s;margin-bottom:8px;" class="${cls}">
          <div style="width:44px;height:44px;flex-shrink:0;">
            ${buildSVG(lvNum, 44, isCurrent)}
          </div>
          <div style="flex:1;min-width:0;">
            <div style="display:flex;align-items:center;gap:6px;margin-bottom:2px;">
              <span style="font-size:13px;font-weight:800;">${evName}</span>
              <span style="font-size:9px;font-family:var(--mono);background:rgba(255,255,255,.06);border-radius:8px;padding:1px 6px;color:var(--muted);">LV${lvNum}</span>
              ${isCurrent ? `<span style="font-size:9px;font-weight:800;text-transform:uppercase;letter-spacing:.5px;background:rgba(37,99,235,.15);border:1px solid rgba(37,99,235,.3);color:#60a5fa;border-radius:8px;padding:1px 7px;">CURRENT</span>` : ''}
            </div>
            <div style="font-size:11px;color:var(--muted);font-family:var(--mono);">
              ${lvNum === 1 ? 'Starting form' : `Unlocks: ${layerN}`}
            </div>
            <div style="font-size:10px;color:var(--muted);margin-top:2px;">
              ${lvNum === 1 ? '0 XP' : `${(thresh/1000).toFixed(0)}K XP total`}
            </div>
          </div>
          <div style="font-size:20px;flex-shrink:0;">
            ${isDone ? '✅' : isCurrent ? '⚡' : '🔒'}
          </div>
        </div>
      `;
    }).join('');

    modal.innerHTML = `
      <div id="char-modal-card" style="
        background:var(--surface);border:1px solid var(--border2);
        border-radius:28px 28px 0 0;width:100%;max-width:480px;
        max-height:90vh;overflow-y:auto;padding:10px 0 48px;
        animation:cmSlideUp .35s cubic-bezier(.34,1.56,.64,1);
      ">
        <!-- Handle -->
        <div style="padding:0 20px"><div style="width:40px;height:4px;background:rgba(255,255,255,.14);border-radius:10px;margin:0 auto 18px;"></div></div>

        <!-- Close -->
        <div style="position:absolute;top:18px;right:20px;width:32px;height:32px;border-radius:50%;background:rgba(255,255,255,.07);display:flex;align-items:center;justify-content:center;cursor:pointer;font-size:16px;" onclick="CHAR.closeModal()">✕</div>

        <!-- Hero -->
        <div style="text-align:center;padding:0 24px 20px;border-bottom:1px solid var(--border);">
          <div style="display:inline-block;animation:cmLvUp 0.6s ease;">
            ${buildSVG(lv, 130, true)}
          </div>
          <div style="font-size:22px;font-weight:900;margin-top:8px;margin-bottom:4px;">Base Entity</div>
          <div style="display:inline-flex;align-items:center;gap:6px;background:rgba(37,99,235,.1);border:1px solid rgba(37,99,235,.25);border-radius:20px;padding:5px 14px;font-size:12px;font-weight:800;color:#60a5fa;margin-bottom:14px;">
            ⚡ Level ${lv} · ${name}
          </div>
          <div style="background:rgba(255,255,255,.06);border-radius:10px;height:8px;overflow:hidden;margin-bottom:6px;">
            <div style="height:100%;border-radius:10px;background:linear-gradient(90deg,#1d4ed8,#3b82f6,#93c5fd);width:${prog.pct}%;transition:width 1.4s cubic-bezier(.34,1.56,.64,1);"></div>
          </div>
          <div style="font-size:12px;color:var(--text2);font-family:var(--mono);">
            ${lv >= 10 ? '⬡ MAX — Base God achieved' : `${fmtXP(prog.cur)} / ${fmtXP(prog.needed)} XP to ${LEVEL_NAMES[lv]}`}
          </div>
        </div>

        <!-- Stats -->
        <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:10px;padding:16px 20px;border-bottom:1px solid var(--border);">
          <div style="background:var(--card);border:1px solid var(--border);border-radius:12px;padding:12px;text-align:center;">
            <div style="font-size:20px;font-weight:900;color:#60a5fa;">${fmtXP(xp)}</div>
            <div style="font-size:10px;color:var(--muted);font-family:var(--mono);text-transform:uppercase;margin-top:3px;">Total XP</div>
          </div>
          <div style="background:var(--card);border:1px solid var(--border);border-radius:12px;padding:12px;text-align:center;">
            <div style="font-size:20px;font-weight:900;color:#fbbf24;">${lv}</div>
            <div style="font-size:10px;color:var(--muted);font-family:var(--mono);text-transform:uppercase;margin-top:3px;">Level</div>
          </div>
          <div style="background:var(--card);border:1px solid var(--border);border-radius:12px;padding:12px;text-align:center;">
            <div style="font-size:20px;font-weight:900;color:#34d399;">${10 - lv}</div>
            <div style="font-size:10px;color:var(--muted);font-family:var(--mono);text-transform:uppercase;margin-top:3px;">To God</div>
          </div>
        </div>

        <!-- Evolution Path -->
        <div style="font-size:11px;font-weight:800;text-transform:uppercase;letter-spacing:1px;color:var(--muted);padding:16px 20px 10px;">Evolution Path</div>
        <div style="padding:0 20px;">
          ${evoItems}
        </div>
      </div>
    `;

    document.body.appendChild(modal);
  }

  function closeModal() {
    const m = document.getElementById('char-modal-overlay');
    if (m) {
      m.style.animation = 'cmFadeIn .2s ease reverse';
      setTimeout(() => m.remove(), 200);
    }
  }

  // ── Public API ──
  return {
    getLevel,
    getProgress,
    renderWidget,
    openModal,
    closeModal,
    buildSVG,
    XP_THRESHOLDS,
    LEVEL_NAMES,
    LAYER_NAMES,
  };
})();

// ════════════════════════════════════════════════════════════════
// REWARD BOX SYSTEM
// Her seviye atlamasında kutu ödülü verilir
// ════════════════════════════════════════════════════════════════

const BOXES = {
  common:    { name: 'Common Box',     color: '#94a3b8', light: '#cbd5e1', dark: '#475569', shine: '#e2e8f0', levels: [2,3] },
  uncommon:  { name: 'Uncommon Box',   color: '#22c55e', light: '#86efac', dark: '#15803d', shine: '#dcfce7', levels: [4,5] },
  rare:      { name: 'Rare Box',       color: '#3b82f6', light: '#93c5fd', dark: '#1d4ed8', shine: '#dbeafe', levels: [6,7] },
  ultraRare: { name: 'Ultra Rare Box', color: '#a855f7', light: '#d8b4fe', dark: '#7e22ce', shine: '#f3e8ff', levels: [8,9] },
  legendary: { name: 'Legendary Box',  color: '#f59e0b', light: '#fde68a', dark: '#b45309', shine: '#fffbeb', levels: [10]  },
};

// Seviyeye göre kutu tipini döndür
function getBoxForLevel(level) {
  for (const [type, box] of Object.entries(BOXES)) {
    if (box.levels.includes(level)) return { type, ...box };
  }
  return null;
}

// 3D kutu SVG — gerçekçi perspektif kutu
function buildBoxSVG(type, size = 80, animate = true) {
  const box  = BOXES[type];
  if (!box) return '';

  const s    = size;
  const cx   = s / 2;

  // Kutu boyutları (izometrik perspektif)
  const bw   = s * 0.62;  // kutu genişliği
  const bh   = s * 0.52;  // kutu yüksekliği
  const dep  = s * 0.18;  // derinlik (üst kapak)
  const bx   = cx - bw/2;
  const by   = s * 0.28;

  // Renk varyantları
  const c1   = box.color;
  const c2   = box.light;
  const c3   = box.dark;
  const cs   = box.shine;

  // Üst yüz (kapak) — parallelogram
  const topPts = `${bx},${by} ${bx+bw},${by} ${bx+bw+dep},${by-dep} ${bx+dep},${by-dep}`;
  // Sağ yan yüz
  const rightPts = `${bx+bw},${by} ${bx+bw},${by+bh} ${bx+bw+dep},${by+bh-dep} ${bx+bw+dep},${by-dep}`;
  // Ön yüz
  const frontPts = `${bx},${by} ${bx+bw},${by} ${bx+bw},${by+bh} ${bx},${by+bh}`;

  // Şerit (ön)
  const ribbon1x1 = bx, ribbon1y1 = by + bh*0.4, ribbon1x2 = bx+bw, ribbon1y2 = by + bh*0.4;
  const ribbon1x1b = bx, ribbon1y1b = by + bh*0.6, ribbon1x2b = bx+bw, ribbon1y2b = by + bh*0.6;

  // Yay (üst kapakta)
  const bowCx = cx + dep/2;
  const bowCy = by - dep/2;

  let svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${s} ${s}" width="${size}" height="${size}" style="overflow:visible;filter:drop-shadow(0 4px 12px ${c3}66)">
  <defs>
    <linearGradient id="bg-front-${type}" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%"   stop-color="${c2}"/>
      <stop offset="50%"  stop-color="${c1}"/>
      <stop offset="100%" stop-color="${c3}"/>
    </linearGradient>
    <linearGradient id="bg-top-${type}" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%"   stop-color="${cs}"/>
      <stop offset="40%"  stop-color="${c2}"/>
      <stop offset="100%" stop-color="${c1}"/>
    </linearGradient>
    <linearGradient id="bg-right-${type}" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%"   stop-color="${c1}"/>
      <stop offset="100%" stop-color="${c3}"/>
    </linearGradient>
    <linearGradient id="bg-ribbon-${type}" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%"   stop-color="${cs}"/>
      <stop offset="100%" stop-color="${c2}"/>
    </linearGradient>
    <filter id="bf-glow-${type}" x="-30%" y="-30%" width="160%" height="160%">
      <feGaussianBlur stdDeviation="2.5" result="blur"/>
      <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
    </filter>
  </defs>
`;

  // Ön yüz (ana gövde)
  svg += `  <polygon points="${frontPts}" fill="url(#bg-front-${type})" stroke="${c3}" stroke-width="0.8"/>
`;

  // Sağ yan yüz (gölge)
  svg += `  <polygon points="${rightPts}" fill="${c3}" stroke="${c3}" stroke-width="0.5" opacity="0.85"/>
`;

  // Üst kapak
  svg += `  <polygon points="${topPts}" fill="url(#bg-top-${type})" stroke="${c2}" stroke-width="0.8"/>
`;

  // Ön yüz parlama (sol üst köşe)
  svg += `  <polygon points="${bx},${by} ${bx+bw*0.45},${by} ${bx+bw*0.35},${by+bh*0.5} ${bx},${by+bh*0.4}"
    fill="white" opacity="0.12"/>
`;

  // Dikey şerit (ön)
  const svx = cx - s*0.04;
  svg += `  <rect x="${svx}" y="${by}" width="${s*0.08}" height="${bh}"
    fill="url(#bg-ribbon-${type})" opacity="0.9"/>
`;

  // Yatay şerit (ön)
  svg += `  <rect x="${bx}" y="${by + bh*0.42}" width="${bw}" height="${bh*0.16}"
    fill="url(#bg-ribbon-${type})" opacity="0.9"/>
`;

  // Üst kapak şeridi
  const ux1 = cx + dep/2 - s*0.04, uy1 = by - dep;
  svg += `  <polygon points="${ux1},${uy1} ${ux1+s*0.08},${uy1} ${ux1+s*0.08+dep*0.5},${uy1+dep*0.5} ${ux1+dep*0.5},${uy1+dep*0.5}"
    fill="${c2}" opacity="0.85"/>
`;

  // Yay (fiyonk)
  const bowR = s * 0.1;
  svg += `  <g filter="url(#bf-glow-${type})">
    <path d="M${bowCx},${bowCy} Q${bowCx-bowR*1.4},${bowCy-bowR*1.6} ${bowCx-bowR*0.3},${bowCy-bowR*0.2}"
      fill="none" stroke="${cs}" stroke-width="${s*0.025}" stroke-linecap="round"/>
    <path d="M${bowCx},${bowCy} Q${bowCx+bowR*1.4},${bowCy-bowR*1.6} ${bowCx+bowR*0.3},${bowCy-bowR*0.2}"
      fill="none" stroke="${cs}" stroke-width="${s*0.025}" stroke-linecap="round"/>
    <circle cx="${bowCx}" cy="${bowCy}" r="${s*0.04}" fill="${cs}"/>
  </g>
`;

  // Legendary için özel altın parıltılar
  if (type === 'legendary' && animate) {
    const stars = [[bx+bw*0.2, by+bh*0.2], [bx+bw*0.75, by+bh*0.35], [bx+bw*0.5, by+bh*0.7]];
    stars.forEach(([sx, sy], i) => {
      svg += `  <text x="${sx}" y="${sy}" text-anchor="middle" font-size="${s*0.14}" opacity="0.9">✦
    <animate attributeName="opacity" values="0.9;0.2;0.9" dur="${1.2+i*0.4}s" repeatCount="indefinite"/>
    <animateTransform attributeName="transform" type="scale" values="1 1;1.3 1.3;1 1" additive="sum" dur="${1.2+i*0.4}s" repeatCount="indefinite"/>
  </text>
`;
    });
  }

  // Ultra Rare için mor parıltı
  if (type === 'ultraRare' && animate) {
    svg += `  <polygon points="${frontPts}" fill="#a855f7" opacity="0">
    <animate attributeName="opacity" values="0;0.08;0" dur="2s" repeatCount="indefinite"/>
  </polygon>
`;
  }

  // Float animasyonu (tüm kutular)
  if (animate) {
    svg += `  <animateTransform xmlns="http://www.w3.org/2000/svg" href="#box-group-${type}"
    attributeName="transform" type="translate"
    values="0,0;0,-4;0,0" dur="2.5s" repeatCount="indefinite"/>
`;
  }

  svg += `</svg>`;
  return svg;
}

// Seviye atlaması — kutu kazan
function awardLevelBox(level) {
  const boxInfo = getBoxForLevel(level);
  if (!boxInfo) return;

  // localStorage'a kaydet
  const addr = typeof BC !== 'undefined' ? BC.addr : null;
  if (!addr) return;

  const key     = 'bc_boxes_' + addr;
  const current = JSON.parse(localStorage.getItem(key) || '[]');
  current.push({
    type:      boxInfo.type,
    name:      boxInfo.name,
    level,
    earnedAt:  new Date().toISOString(),
    opened:    false,
  });
  localStorage.setItem(key, JSON.stringify(current));

  // Bildirim göster
  showBoxEarnedNotif(boxInfo, level);
}

// Kutu kazandı bildirimi
function showBoxEarnedNotif(boxInfo, level) {
  const existing = document.getElementById('box-earned-notif');
  if (existing) existing.remove();

  const el = document.createElement('div');
  el.id    = 'box-earned-notif';
  el.style.cssText = `
    position:fixed;bottom:90px;left:50%;transform:translateX(-50%);
    z-index:950;background:rgba(10,10,20,.95);
    border:1px solid ${boxInfo.color}55;border-radius:20px;
    padding:14px 20px;display:flex;align-items:center;gap:14px;
    box-shadow:0 0 40px ${boxInfo.color}33,0 8px 32px rgba(0,0,0,.5);
    backdrop-filter:blur(16px);max-width:320px;width:90%;
    animation:boxNotifIn .5s cubic-bezier(.34,1.56,.64,1) forwards;
  `;

  el.innerHTML = `
    <div style="width:52px;height:52px;flex-shrink:0;">
      ${buildBoxSVG(boxInfo.type, 52, false)}
    </div>
    <div style="flex:1;">
      <div style="font-size:11px;font-weight:700;color:${boxInfo.color};text-transform:uppercase;letter-spacing:.5px;margin-bottom:3px;">Level ${level} Reward!</div>
      <div style="font-size:15px;font-weight:900;color:#fff;">${boxInfo.name}</div>
      <div style="font-size:11px;color:rgba(255,255,255,.5);margin-top:2px;">Added to your Wheel page</div>
    </div>
    <div style="font-size:20px;cursor:pointer;opacity:.5;" onclick="this.parentElement.remove()">✕</div>
  `;

  if (!document.getElementById('box-notif-style')) {
    const st = document.createElement('style');
    st.id = 'box-notif-style';
    st.textContent = `
      @keyframes boxNotifIn {
        from { opacity:0; transform:translateX(-50%) translateY(20px) scale(.9); }
        to   { opacity:1; transform:translateX(-50%) translateY(0)     scale(1); }
      }
    `;
    document.head.appendChild(st);
  }

  document.body.appendChild(el);
  setTimeout(() => { if (el.isConnected) el.remove(); }, 5000);
}

// Kutularım (wheel sayfası için)
function getMyBoxes() {
  const addr = typeof BC !== 'undefined' ? BC.addr : null;
  if (!addr) return [];
  return JSON.parse(localStorage.getItem('bc_boxes_' + addr) || '[]');
}

// CHAR objesine box fonksiyonlarını ekle
Object.assign(CHAR, {
  getBoxForLevel,
  buildBoxSVG,
  awardLevelBox,
  getMyBoxes,
  BOXES,
});
