/* MAD-HSD-570 · Madar dark mode for the approved boards, applied as the page draws · Mustafa Saad · 8 Nov 2026
   Forked from the Modeef colour layer (saudia/tools/sa-color.src.js, MAD-HSD-548). Light = the boards as designed (no change).
   Dark = the approved Madar D1 dark palette (Dark-1-Sand: deep #3A2C17, gold #E0AE4A, aurora #EC9364 / #CC86AD):
     page #0E0B06 · surface #1A140A · soft #211A0F · line #2E281E · border #3F3A31 · text #EEF3F2 · muted #C4C0B9 · accent #E0AE4A.
   Every colour the page draws (inline styles, SVG paint, the board's own CSS) goes through dark(): first the table of
   Madar colours below, then a rule (light surfaces and tints turn dark with their hue, dark text turns light,
   accents are lifted to read on dark). Shadows turn black. Boards that draw their own D1 dark (window.MADAR_NATIVE)
   and print previews keep their colours. */
(function () {
  // engine.md 2b (Madar D1 Dark-1-Sand, by role): page #0F0B06 · surface #1A140A · soft #231A0E · border #353027 · divider #2A2218 ·
  // text #EDEFEE · muted #C0BBB5 · accent #E0AE4A · gold tile #423317 · ok #5FD39A · warn #F2C14E · bad #FF8A8A · info #7DB5FF.
  // An 8-digit value (status tints) replaces the colour and its alpha.
  var T = {
    '#F5F4F3': '#0F0B06', '#FFFFFF': '#1A140A',
    '#F6F3ED': '#231A0E', '#F8F7F5': '#231A0E', '#F8F8F7': '#231A0E', '#F3EFE8': '#231A0E', '#F1EFEC': '#231A0E', '#F1ECE3': '#231A0E', '#EEE7DC': '#231A0E', '#F6F0E4': '#231A0E',
    '#FBFAF8': '#231A0E', '#F9F9F8': '#2E2418', '#F1F0EF': '#231A0E', '#EFEDEA': '#231A0E', '#FAF7F2': '#231A0E', '#FBF8F3': '#231A0E', '#FAF6EE': '#231A0E', '#EDE6DA': '#2E241A', '#ECE7DE': '#2E241A', '#F7F1E2': '#2E241A',
    '#DFDDDA': '#353027', '#E7E3DC': '#353027', '#E2DCD1': '#353027', '#E4E1DC': '#353027', '#E7E4DF': '#353027', '#E9E9EB': '#353027', '#D8D3CB': '#4A443B', '#D6CFC3': '#4A443B', '#DDD2C0': '#4A443B', '#E6DCCB': '#4A443B',
    '#EDECEA': '#2A2218', '#EFEBE4': '#2A2218', '#F1EDE6': '#2A2218',
    '#2C2111': '#EDEFEE', '#231A0E': '#EDEFEE', '#2B211A': '#EDEFEE', '#141414': '#EDEFEE', '#1C1C1E': '#EDEFEE',
    '#666056': '#C0BBB5', '#8A847A': '#8F8A82', '#9E978C': '#8F8A82', '#B5AFA6': '#6F6A62', '#A9A39A': '#6F6A62', '#BDB4A5': '#6F6A62', '#CFCBC4': '#5F5A54', '#CFC6B6': '#5F5A54',
    '#6B6257': '#A9A39A', '#4A443B': '#A9A39A', '#4F493F': '#A9A39A', '#7A6E5E': '#A9A39A', '#5A4A33': '#C9BFAE', '#6B4A12': '#C9BFAE',
    '#3A2C17': '#E0AE4A', '#8A6424': '#E0AE4A', '#000000': '#000000', '#1E1A14': '#1E1A14', '#1E1A17': '#1E1A17',
    '#E0AE4A': '#E0AE4A', '#EC9364': '#EC9364', '#CC86AD': '#CC86AD', '#7FB8B0': '#7FB8B0', '#B39DDB': '#B39DDB', '#D9A066': '#D9A066', '#E8A0A0': '#E8A0A0', '#A8C686': '#A8C686', '#C9B37E': '#C9B37E', '#E3B5A4': '#E3B5A4',
    '#7A5219': '#7A5219', '#9C4F2C': '#9C4F2C', '#6B3760': '#6B3760', '#AD8032': '#AD8032', '#C06E45': '#C06E45', '#92577F': '#92577F',
    '#FBF6EA': '#423317', '#FBF0D5': '#423317', '#F6E7C6': '#423317', '#F6EBD3': '#423317', '#F6E3B8': '#423317', '#FFFCF6': '#2A2014', '#FFFDF7': '#2A2014', '#FFFDF8': '#2A2014', '#F4EBD6': '#33291A', '#F1E7D2': '#33291A', '#F1E6CF': '#33291A', '#EFE6D2': '#33291A', '#FBF5EA': '#33291A', '#F3E3C3': '#3A2E14',
    '#D9C9A8': '#5A4E3C', '#EAD9B0': '#5A4E3C', '#E9D9B8': '#5A4E3C', '#CDB98F': '#6B5A3A', '#D9CBB0': '#5A4E3C', '#E8D3A8': '#6B5A3A', '#D2BE98': '#6B5A3A', '#E3D3B5': '#4A3D24', '#C8C4BE': '#5A4E3C',
    '#B23434': '#FF8A8A', '#C2453D': '#FF8A8A', '#C2453A': '#FF8A8A', '#A23A30': '#FF8A8A', '#D9534F': '#FF8A8A',
    '#FBE4E4': '#FF8A8A22', '#FDF1F1': '#FF8A8A1A', '#FBEAE8': '#FF8A8A22', '#F3C9C9': '#FF8A8A55', '#E39A9A': '#FF8A8A55', '#EC9A9A': '#FF8A8A55',
    '#1A7A4C': '#5FD39A', '#3E9B66': '#5FD39A', '#10331F': '#5FD39A', '#1A5E3C': '#5FD39A', '#7DBF96': '#5FD39A55',
    '#E3F4EA': '#5FD39A22', '#D7EEDF': '#5FD39A22', '#DDF1E6': '#5FD39A22', '#EAF5EE': '#5FD39A1A', '#9CC5A1': '#5FD39A55',
    '#8A5E00': '#F2C14E', '#C9A24F': '#F2C14E', '#9C6B1E': '#F2C14E', '#5E4300': '#F2C14E', '#C2410C': '#EC9364', '#B2561C': '#EC9364',
    '#FBF1DC': '#F2C14E22', '#E8C98A': '#F2C14E55', '#E8C27A': '#F2C14E55',
    '#2160B0': '#7DB5FF', '#2F5F9E': '#7DB5FF', '#2F5E8F': '#7DB5FF', '#1F3B5C': '#7DB5FF', '#4D6A8C': '#7DB5FF',
    '#E2EDFB': '#7DB5FF22', '#DCEBF5': '#7DB5FF22', '#DCE8F5': '#7DB5FF22', '#EEF4FB': '#7DB5FF1A', '#D3E1F1': '#7DB5FF55', '#8FB3D9': '#7DB5FF55', '#CFDDE8': '#7DB5FF55',
    '#F6EEF6': '#2A1828', '#F4E3EE': '#2E1A2A', '#F7E1EE': '#2E1A2A'
  };
  // by property: solid status fills keep their colour, deep text turns light (not gold), white text stays white
  var BG = { '#B23434': '#B23434', '#1A7A4C': '#1A7A4C', '#C2453D': '#B23434', '#2C2111': '#2E241A', '#231A0E': '#2E241A', '#1E1A14': '#2E241A', '#141414': '#2E241A', '#1C1C1E': '#2E241A', '#2B211A': '#2E241A' }, TX = { '#3A2C17': '#EDEFEE', '#FFFFFF': '#FFFFFF' };   // ink fills (toasts, tooltips) stay dark
  function h2rgb(h) { return [0, 2, 4].map(function (i) { return parseInt(h.slice(1 + i, 3 + i), 16) / 255; }); }
  function rgb2h(r, g, b) { return '#' + [r, g, b].map(function (x) { var v = Math.max(0, Math.min(255, Math.round(x * 255))); return (v < 16 ? '0' : '') + v.toString(16); }).join('').toUpperCase(); }
  function toHls(r, g, b) { var mx = Math.max(r, g, b), mn = Math.min(r, g, b), l = (mn + mx) / 2, s, h; if (mn === mx) return [0, l, 0];
    s = l <= 0.5 ? (mx - mn) / (mx + mn) : (mx - mn) / (2 - mx - mn); var rc = (mx - r) / (mx - mn), gc = (mx - g) / (mx - mn), bc = (mx - b) / (mx - mn);
    h = r === mx ? bc - gc : g === mx ? 2 + rc - bc : 4 + gc - rc; h = ((h / 6) % 1 + 1) % 1; return [h, l, s]; }
  function v_(m1, m2, hue) { hue = ((hue % 1) + 1) % 1; if (hue < 1 / 6) return m1 + (m2 - m1) * hue * 6; if (hue < 0.5) return m2; if (hue < 2 / 3) return m1 + (m2 - m1) * (2 / 3 - hue) * 6; return m1; }
  function fromHls(h, l, s) { if (s === 0) return [l, l, l]; var m2 = l <= 0.5 ? l * (1 + s) : l + s - l * s, m1 = 2 * l - m2; return [v_(m1, m2, h + 1 / 3), v_(m1, m2, h), v_(m1, m2, h - 1 / 3)]; }
  function mk(deg, l, s) { var c = fromHls(((deg % 360) + 360) % 360 / 360, Math.max(0, Math.min(1, l)), Math.max(0, Math.min(1, s))); return rgb2h(c[0], c[1], c[2]); }
  function dark(h) { h = h.toUpperCase(); if (T[h]) return T[h]; var c = h2rgb(h), x = toHls(c[0], c[1], c[2]), deg = x[0] * 360, l = x[1], s = x[2];
    if (l > 0.8) return mk(s < 0.12 ? 38 : deg, 0.07 + (1 - l) * 0.9, Math.min(s, s < 0.12 ? 0.3 : 0.42));     // light surfaces and tints → dark, same hue (warm for greys)
    if (l < 0.3 && s < 0.6) return mk(s < 0.12 ? 40 : deg, 0.93 - l * 0.4, Math.min(s, 0.2));                      // dark text → light
    if (s < 0.25) return mk(deg, 0.35 + (1 - l) * 0.45, s);                                                          // mid greys: flip around the middle
    if (l > 0.6) return mk(deg, Math.max(0.2, 0.65 - (l - 0.58) * 1.6), Math.min(1, s * 0.92));   /* light tints come out darker than their full colour (keeps the order of heat maps and charts) */
    return mk(deg, Math.max(l, 0.55) + 0.1, Math.min(1, s * 0.92)); }                                                // accents: lifted to read on dark
  // ---- palettes (D1 PAL): Sand Gold is the design; another palette moves the brand colours, light and dark ----
  var PALS = {
    sand:  { deep: '#3A2C17', a: '#E0AE4A', c: '#EC9364', b: '#CC86AD', silk: ['#7A5219', '#9C4F2C', '#6B3760'] },
    haram: { deep: '#0E3B30', a: '#44C7A5', c: '#40B0C2', b: '#E3B651', silk: ['#0B5E52', '#16697C', '#7E6118'] },
    night: { deep: '#0F2140', a: '#4FB3E8', c: '#8C8FE6', b: '#D4AE5E', silk: ['#0F4C81', '#2E3F8C', '#5A3E86'] },
    sage:  { deep: '#22312A', a: '#8FC4A0', c: '#6FB0AE', b: '#D99A62', silk: ['#2F5D4A', '#3A6466', '#87522D'] },
    maroon: { deep: '#3B1020', a: '#F08A6A', c: '#E8B45A', b: '#C76BB0', silk: ['#6E1A36', '#8E3A2E', '#5C2A6E'] },
    ocean: { deep: '#062F3F', a: '#3FD0E0', c: '#5AA8F0', b: '#8C8CF2', silk: ['#0A5C73', '#1C5FA0', '#3E3F9C'] },
    dusk:  { deep: '#2B1E3A', a: '#F2B35E', c: '#E98AA0', b: '#8F7CE8', silk: ['#8A4A2A', '#7A2F5A', '#45307E'] },
    masar: { deep: '#004851', a: '#65D7D2', c: '#7DA8D2', b: '#9578D3', silk: ['#0E6F79', '#2A6E98', '#57479F'] }
  };
  var PKEY = 'sand', PL = null, PD = null, SER = null;   // SER: chart series colours of the engine (GX_AV) moved to the palette   // light and dark colour moves for the chosen palette (null = Sand Gold, no change)
  function mixh(x, y, t) { var p = h2rgb(x), q = h2rgb(y); return rgb2h(p[0] * (1 - t) + q[0] * t, p[1] * (1 - t) + q[1] * t, p[2] * (1 - t) + q[2] * t); }
  function buildPal(k, pal) {
    PKEY = k || 'sand'; var P = pal || PALS[PKEY] || PALS.sand, S = PALS.sand; if (PKEY === 'sand') { PL = PD = SER = null; return; }
    var mid = P.mid || mixh(P.deep, P.a, 0.45);
    PL = {}; PL[S.deep] = P.deep; PL['#8A6424'] = mid; PL[S.a] = P.a; PL[S.c] = P.c; PL[S.b] = P.b;
    S.silk.forEach(function (x, i) { PL[x] = P.silk[i]; });
    // categorical chart colours (series, legends, donuts, avatars): derived from the palette's trio; status reds and greens are not in this list
    SER = { '#7FB8B0': mixh(P.a, P.deep, 0.35), '#B39DDB': mixh(P.b, P.c, 0.5), '#D9A066': mixh(P.a, P.c, 0.5), '#E8A0A0': mixh(P.c, P.b, 0.5),
      '#A8C686': mixh(P.a, P.b, 0.5), '#C9B37E': mixh(P.a, '#FFFFFF', 0.3), '#E3B5A4': mixh(P.c, '#FFFFFF', 0.35), '#E0AE4A': P.a, '#EC9364': P.c, '#CC86AD': P.b };
    Object.keys(SER).forEach(function (x) { if (!PL[x]) PL[x] = SER[x]; }); PL['#2C2111'] = mixh(P.deep, '#000000', 0.25);
    ['#FBF6EA', '#FBF0D5', '#F6E7C6', '#F6EBD3', '#EAD9B0', '#D9C9A8', '#E9D9B8'].forEach(function (x) { var l = toHls.apply(null, h2rgb(x))[1]; PL[x] = mixh(P.a, '#FFFFFF', Math.min(0.95, l)); });
    var surf = mixh(P.deep, '#000000', 0.55);
    PD = { '#0F0B06': mixh(P.deep, '#000000', 0.76), '#1A140A': surf, '#231A0E': mixh(P.deep, '#000000', 0.45), '#2E2418': mixh(P.deep, '#000000', 0.35), '#2E241A': mixh(P.deep, '#000000', 0.35),
      '#353027': mixh(surf, '#FFFFFF', 0.12), '#2A2218': mixh(surf, '#FFFFFF', 0.07), '#E0AE4A': P.a, '#EC9364': P.c, '#CC86AD': P.b, '#423317': mixh(P.a, surf, 0.75), '#5A4E3C': mixh(P.a, surf, 0.6),
      '#6B5A3A': mixh(P.a, surf, 0.5), '#2A2014': mixh(P.a, surf, 0.85), '#33291A': mixh(P.a, surf, 0.8), '#3A2E14': mixh(P.a, surf, 0.75), '#4A3D24': mixh(P.a, surf, 0.7) };
    S.silk.forEach(function (x, i) { PD[x] = P.silk[i]; });
    var r = document.documentElement.style;   // the shell's own brand gradients follow (app.css: --md-grad, --md-silk, --md-silk-bright)
    r.setProperty('--md-grad', 'linear-gradient(90deg,' + P.a + ' 0%,' + P.c + ' 50%,' + P.b + ' 100%)');
    r.setProperty('--md-silk', 'linear-gradient(90deg,' + P.silk[0] + ' 0%,' + P.silk[1] + ' 52%,' + P.silk[2] + ' 100%)');
    r.setProperty('--md-silk-bright', 'linear-gradient(90deg,' + mixh(P.silk[0], P.a, 0.5) + ' 0%,' + mixh(P.silk[1], P.c, 0.45) + ' 52%,' + mixh(P.silk[2], P.b, 0.4) + ' 100%)');
  }

  // ---- MAD-HSD-606 · contrast (user pane: Standard / More / High, AA or AAA): text, links, borders and status colours of the boards ----
  // More: every text colour keeps its hue and is made darker (light) or lighter (dark) until it reads at 4.5:1 (AA) or 7:1 (AAA).
  // High: the curated high-contrast set (near-black on white, white on near-black). Borders reach 3:1 when "Stronger borders" is on.
  var CT = null;
  var ST_SRC = { red: ['#B23434', '#C2453D', '#C2453A', '#A23A30', '#D9534F'], green: ['#1A7A4C', '#3E9B66', '#1A5E3C', '#10331F'], amber: ['#8A5E00', '#C9A24F', '#9C6B1E', '#5E4300', '#C2410C', '#B2561C'], blue: ['#2160B0', '#2F5F9E', '#2F5E8F', '#1F3B5C', '#4D6A8C'], link: ['#8A6424'] }, ST_OF = {};
  Object.keys(ST_SRC).forEach(function (k) { ST_SRC[k].forEach(function (h) { ST_OF[h] = k; }); });
  var HCL = { red: '#8B2929', amber: '#6D4A00', green: '#145C39', blue: '#1B4E8F', sec: '#5E584F', ink: '#14100A', link: '#73531E' },
      HCD = { red: '#FFB3B3', amber: '#FFD37F', green: '#8EEBB9', blue: '#B0D2FF', sec: '#D9D4CC', ink: '#FFFFFF', link: '#F2CB7A' };
  function ratio(a, b) { var x = lum2(a), y = lum2(b); return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05); }
  function lum2(h) { var c = h2rgb(h).map(function (v) { return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); }); return 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2]; }
  function reach(h, ref, t) { if (ratio(h, ref) >= t) return h; var c = h2rgb(h), x = toHls(c[0], c[1], c[2]), up = lum2(ref) < 0.2, l = x[1];
    for (var i = 0; i < 100; i++) { l += up ? 0.01 : -0.01; if (l <= 0 || l >= 1) break; var o = mk(x[0] * 360, l, x[2]); if (ratio(o, ref) >= t) return o; } return up ? '#FFFFFF' : '#000000'; }
  function ctRef(dk, kind) { return dk ? (PD ? PD[kind === 'l' ? '#1A140A' : '#2E241A'] : (kind === 'l' ? '#1A140A' : '#2E241A')) : (kind === 'l' ? '#FFFFFF' : '#ECE7DE'); }   /* text is checked on the darkest common tint, so it reads on panels and pills too */
  function ctOut(h, kind, a, dk, src) {
    if (!CT || (a && parseInt(a, 16) < 230)) return h;
    if (kind === 'l') return CT.border ? reach(h, ctRef(dk, 'l'), 3) : h;
    if (kind === 'b') return CT.hi && dk && lum2(h) < 0.03 ? mixh(h, '#000000', 0.55) : h;   // High in dark: surfaces go near-black
    if (kind !== 't') return h;
    var c = h2rgb(h), x = toHls(c[0], c[1], c[2]), l = x[1], s = x[2];
    if (!dk && l > 0.82) return h;   // light text on a dark fill
    if (dk && l < 0.3) return CT.hi || CT.aaa ? '#0E0B06' : h;     /* dark text on a gold or light fill: near-black for High and AAA */
    var ref = ctRef(dk, 't'), st = ST_OF[src] || null;
    if (CT.hi) return reach(ctHi(h, s, l, dk, ref, st), ref, CT.aaa ? 7 : 4.5);
    return reach(h, ref, CT.aaa ? 7 : 4.5); }
  function ctHi(h, s, l, dk, ref, st) { var H = dk ? HCD : HCL;
      if (st === 'link') return PKEY === 'sand' ? H.link : reach(dk ? (PD && PD['#E0AE4A']) || h : PL['#8A6424'], ref, 7);
      if (st) return H[st];
      if (s < 0.25) return (dk ? l > 0.75 : l < 0.3) ? H.ink : (dk ? (l > 0.55 ? H.sec : h) : H.sec);
      return reach(h, ref, 7); }
  function solidOf(p) { return CT && CT.solid && p && p[0] === '#FFFFFF' && p[1] && parseInt(p[1], 16) >= 60 && parseInt(p[1], 16) < 255; }
  function palOut(o, light) { var M = light ? PL : PD; if (!M) return o; var h = o.slice(0, 7).toUpperCase(), x = M[h]; return x ? x + o.slice(7) : o; }
  var DARK = false, cache = {}, REV = {}, KEEP = '.rs-paper, .mdk-paper, [aria-label="Page preview"], [aria-label="معاينة الصفحة"]';
  function native() { var n = window.MADAR_NATIVE || []; return n.map(function (x) { return '[data-dc-comp="' + x + '"]'; }).join(', '); }
  function hex6(r, g, b) { return '#' + [r, g, b].map(function (v) { v = Math.round(v); return (v < 16 ? '0' : '') + v.toString(16); }).join('').toUpperCase(); }
  function parse(m) { var s = m.toLowerCase(), h, a = '';
    if (s === 'white') return ['#FFFFFF', '']; if (s === 'black') return ['#000000', ''];
    if (s[0] === '#') { var x = s.slice(1); if (x.length === 3 || x.length === 4) x = x.split('').map(function (c) { return c + c; }).join('');
      if (x.length !== 6 && x.length !== 8) return null; return ['#' + x.slice(0, 6).toUpperCase(), x.slice(6).toUpperCase()]; }
    var p = s.replace(/^rgba?\(|\)$/g, '').split(/[\s,\/]+/).filter(Boolean); if (p.length < 3) return null;
    var al = p.length > 3 ? (p[3].indexOf('%') > 0 ? parseFloat(p[3]) / 100 : parseFloat(p[3])) : 1;
    h = hex6(+p[0], +p[1], +p[2]); if (al < 1) a = hex6(Math.round(al * 255), 0, 0).slice(1, 3); return [h, a, al]; }
  function lum(h) { var c = h2rgb(h); return 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2]; }
  var OWN = null;   // colours this layer already wrote on the element being mapped (key '#RRGGBB' + alpha)
  function keyOf(m) { var p = parse(m); return p ? p[0] + (p[1] || '') : null; }
  function mapOne(m, shadow, lightOnly, kind) {
    if (!DARK && !PL && !CT) return m;
    if (OWN) { var ik = keyOf(m); if (ik && OWN[ik]) return m; var res = mapOne1(m, shadow, lightOnly, kind), ok = keyOf(res); if (ok && res !== m) OWN[ok] = m; return res; }
    return mapOne1(m, shadow, lightOnly, kind);
  }
  function mapOne1(m, shadow, lightOnly, kind) {
    if (shadow || lightOnly) return DARK ? mapOne0(m, shadow, lightOnly, kind) : m;
    var ck = (DARK ? 'D' : 'L') + (kind || 'c') + m; if (cache[ck]) return cache[ck]; var lp = parse(m); if (!lp) return (cache[ck] = m);
    if (kind === 'b' && solidOf(lp)) return (cache[ck] = DARK ? (PD ? PD['#1A140A'] : '#1A140A') : '#FFFFFF');   // "Solid surfaces": glass turns opaque
    if (!DARK) { var lo_ = PL ? palOut(lp[0], true) : lp[0]; return (cache[ck] = ctOut(lo_, kind, lp[1], false, lp[0]) + (lp[1] || '')); }
    var r = mapOne0(m, shadow, lightOnly, kind); if (!CT) return (cache[ck] = r); var rp = parse(r); if (!rp) return (cache[ck] = r);
    return (cache[ck] = ctOut(rp[0], kind, rp[1], true, lp[0]) + (rp[1] || '')); }
  function mapOne0(m, shadow, lightOnly, kind) {
    if (!DARK) return m; var k = (lightOnly ? 'o' : '') + (shadow ? 's' : kind || 'c') + m; if (cache[k]) return cache[k]; var p = parse(m); if (!p) return (cache[k] = m);
    var h = p[0], a = p[1], al = p[2] == null ? (a ? parseInt(a, 16) / 255 : 1) : p[2];
    if (lightOnly && (shadow || lum(h) < 0.6)) return (cache[k] = m);                                               // inside a board that draws its own dark: only its light leftovers
    if (shadow) return (cache[k] = h === '#FFFFFF' && al < 0.5 ? m : '#000000' + (a || 'AA'));                       // shadows and glows: black in dark
    if (al < 1 && h === '#000000') return (cache[k] = m);                                                              // black scrims stay
    if (h === '#FFFFFF' && al < 0.75 && kind !== 't') return (cache[k] = al < 0.15 ? m : '#FFFFFF' + hex6(Math.round(al * 0.18 * 255), 0, 0).slice(1, 3));   // white glass: faint glass
    if (SER && SER[h] && !shadow && kind !== 't') return (cache[k] = SER[h] + a);   // a chart series keeps its palette colour in dark
    if (REV[h + a]) return (cache[k] = m);                                                                             // already one of our dark colours
    var o = (kind === 'b' && BG[h]) || (kind === 't' && TX[h]) || dark(h); o = palOut(o.length > 7 ? o : o + a, false); if (o !== h + a && !T[o.slice(0, 7)] && !BG[o.slice(0, 7)]) REV[o] = 1; return (cache[k] = o); }   // never mark a colour that is itself a light source colour (white text stays white, but white surfaces still map)
  var RX = /(?<![\w(-])#[0-9a-fA-F]{3,8}\b|rgba?\([^)]*\)|(?<=[:\s,(])(?:white|black)\b/g, SH = /^(box-shadow|text-shadow|filter|-webkit-filter)$/i;
  function kindOf(prop) { prop = (prop || '').toLowerCase(); return /^(color|-webkit-text-fill-color|caret-color)$/.test(prop) ? 't' : /^background/.test(prop) ? 'b' : /^(border|outline)/.test(prop) ? 'l' : ''; }
  function mapVal(v, prop, lo, kind) { var sh = prop && SH.test(prop); kind = kind || kindOf(prop); return v.replace(RX, function (m) { return mapOne(m, sh, lo, kind); }); }
  function mapStyle(st, lo) {   // one inline style string, declaration by declaration
    if (!DARK && !PL && !CT) return st; var out = [], depth = 0, cur = '';
    for (var i = 0; i < st.length; i++) { var ch = st[i]; if (ch === '(') depth++; else if (ch === ')') depth--; if (ch === ';' && depth === 0) { out.push(cur); cur = ''; } else cur += ch; }
    if (cur.trim()) out.push(cur);
    var deepBg = DEEPBG(out.join(';'));   // a solid deep fill turns gold: its white text turns deep (as the D1 dark pills)
    return out.map(function (d) { var j = d.indexOf(':'); if (j < 0) return d; var pr = d.slice(0, j).trim(), v = d.slice(j + 1);
      if (DARK && deepBg && kindOf(pr) === 't' && WHITE.test(v)) return d.slice(0, j) + ': ' + onGold();
      return d.slice(0, j) + ':' + mapVal(v, pr, lo); }).join(';').replace(/$/, ''); }
  function contrastFix(st) {   // dark only: if the mapped fill and text are too close in lightness, the text goes dark or light
    if (!DARK) return st; var bg = st.match(/(?:^|;)\s*background(?:-color)?\s*:\s*(#[0-9a-fA-F]{6})(?![0-9a-fA-F])/), fg = st.match(/(?:^|;)\s*color\s*:\s*(#[0-9a-fA-F]{6})/);
    if (!bg || !fg) return st; var lb = lum(bg[1].toUpperCase()), lf = lum(fg[1].toUpperCase()), hi = Math.max(lb, lf) + 0.05, lo2 = Math.min(lb, lf) + 0.05;
    if (hi / lo2 >= 3) return st; var nf = lb > 0.4 ? '#1A140A' : '#F4F1EA'; return st.replace(fg[0], fg[0].replace(fg[1], nf)); }
  function onGold() { return CT && (CT.hi || CT.aaa) ? '#0E0B06' : '#3A2C17'; }   /* text on the gold fills in dark */
  var WHITE = /#fff(fff)?(ff)?\b|white|rgb\(255, 255, 255\)/i;
  function DEEPBG(st) { return /background(-color|-image)?\s*:[^;]*(#3A2C17(?![0-9a-f])|rgb\(58, 44, 23\))/i.test(st); }
  // ---- board CSS: one generated sheet with the dark rules, more specific than the board's own ----
  function cssRules(list, lo) { var t = '';
    Array.prototype.forEach.call(list, function (r) {
      if (r.type === 4 && r.cssRules) { if (/print/.test(r.media.mediaText) && !/screen/.test(r.media.mediaText)) return; var inner = cssRules(r.cssRules, lo); if (inner) t += '@media ' + r.media.mediaText + '{' + inner + '}'; return; }
      if (r.type === 1 && /md-dark|md-dark-raw|data-md-dark-raw/.test(r.selectorText || '')) return;
      if (r.type !== 1 || !r.style || (lo && !/std-|input|select|textarea/.test(r.selectorText))) return; var decl = '';
      var dbg = DARK && !lo && DEEPBG(r.style.cssText); for (var i = 0; i < r.style.length; i++) { var p = r.style[i], v = r.style.getPropertyValue(p); var nv = dbg && kindOf(p) === 't' && WHITE.test(v) ? onGold() : mapVal(v, p, lo); if (nv !== v) decl += p + ':' + nv + (r.style.getPropertyPriority(p) ? ' !important' : '') + ';'; }
      if (!decl) return;
      var sel = r.selectorText.split(',').map(function (x) { x = x.trim(); return /^(html|:root)\b/.test(x) ? x.replace(/^(html|:root)/, DARK ? 'html.md-dark' : 'html.md-pal') : (DARK ? 'html.md-dark' : 'html.md-pal') + ' #stage ' + offPaper(/^body\b/.test(x) ? x.replace(/^body\s*/, '') || '*' : x); }).join(',');
      t += sel + '{' + decl + '}'; });
    return t; }
  // MAD-HSD-610 · print paper keeps its light colours: the generated rules never reach inside it, and its text is dark ink
  function offPaper(x) { var k = ':not(:is(' + KEEP + ') *)', i = x.indexOf('::'); return i >= 0 ? x.slice(0, i) + k + x.slice(i) : x + k; }
  function buildCss(force) { var on = DARK || !!PL || !!CT; var st = document.getElementById('md-board-css'), nat = window.MADAR_NATIVE || [], list = document.querySelectorAll('style[data-dc]'), n = list.length;
    if (!force && st && +st.getAttribute('data-n') === n && st.getAttribute('data-t') === String(DARK) + PKEY + ctSig()) return; var t = '';
    if (on) Array.prototype.forEach.call(list, function (s) { try { t += cssRules(s.sheet.cssRules, nat.indexOf(s.getAttribute('data-dc')) >= 0); } catch (e) {} });
    if (!st) { st = document.createElement('style'); st.id = 'md-board-css'; document.head.appendChild(st); }
    if (DARK) t += 'html.md-dark #stage :is(' + KEEP + '){color:#2C2111;color-scheme:light}';
    st.textContent = t; st.setAttribute('data-n', n); st.setAttribute('data-t', String(DARK) + PKEY + ctSig()); }
  function ctSig() { return CT ? CT.sig : ''; }
  // ---- live DOM ----
  var ATTRS = ['style', 'fill', 'stroke', 'stop-color', 'flood-color'], ORIG = new WeakMap(), LAST = new WeakMap(), root = null, mo = null, NAT = '';
  // 0 = map, 1 = leave (print paper), 2 = only light leftovers (the standards kit parts inside a board that draws its own dark)
  function mode(el) { if (!el.closest) return 0; if (el.closest(KEEP) || el.closest('[data-md-dark-raw], .md-dark-raw')) return 1; if (NAT && el.closest(NAT)) return el.closest('[class*="std-"], input, select, textarea, label:has(> input), [role="search"]') ? 2 : 1; return 0; }
  function conv(v, at, md) { return md === 1 ? v : (at === 'style' ? contrastFix(mapStyle(v, md === 2)) : mapVal(' ' + v, null, md === 2).slice(1)); }
  var OWNS = new WeakMap();
  function doEl(el) { if (el.nodeType !== 1) return; var o = ORIG.get(el), l = LAST.get(el), sk = null;
    for (var i = 0; i < ATTRS.length; i++) { var at = ATTRS[i]; if (!el.hasAttribute(at)) continue; var v = el.getAttribute(at);
      if (l && l[at] === v) continue;
      if (!o) { o = {}; ORIG.set(el, o); } if (!l) { l = {}; LAST.set(el, l); }
      if (sk === null) sk = mode(el);
      var owns = OWNS.get(el); if (!owns) { owns = {}; OWNS.set(el, owns); } var prev = owns[at] || {};
      // the board's own colours: a value we wrote earlier (rewritten by the browser or by grow / fit) goes back to its source colours,
      // so the original never holds our dark colours (a palette or theme switch would map them a second time)
      var src = v.replace(RX, function (c) { var k = keyOf(c); return k && prev[k] && prev[k] !== 1 ? prev[k] : c; });
      o[at] = src; owns[at] = {};
      OWN = owns[at]; var nv = conv(src, at, sk); OWN = null;
      if (nv !== v) el.setAttribute(at, nv); l[at] = el.getAttribute(at); } }
  function sameDecl(a, b) { var A = (a.match(RX) || []).map(keyOf), B = (b.match(RX) || []).map(keyOf), n = 0; A.forEach(function (x) { if (B.indexOf(x) >= 0) n++; }); return A.length && n >= Math.min(A.length, B.length) * 0.5; }
  function walk(n) { if (n.nodeType !== 1) return; doEl(n); var all = n.querySelectorAll('*'); for (var i = 0; i < all.length; i++) doEl(all[i]); }
  function onMut(list) { var css = false; list.forEach(function (m) { if (m.type === 'attributes') doEl(m.target); else m.addedNodes.forEach(function (x) { if (x.nodeName === 'STYLE') css = true; walk(x); }); }); if (css) buildCss(); }
  function remapAll() { if (!root) return; NAT = native(); var all = root.querySelectorAll('*'); for (var i = 0; i < all.length; i++) { var el = all[i], o = ORIG.get(el); if (!o) continue; var sk = mode(el);
      var owns = {}; OWNS.set(el, owns); Object.keys(o).forEach(function (at) { var v = o[at]; owns[at] = {}; OWN = owns[at]; var nv = conv(v, at, sk); OWN = null; el.setAttribute(at, nv); LAST.get(el)[at] = el.getAttribute(at); }); } }
  function observe() { if (mo) mo.observe(root, { attributes: true, attributeFilter: ATTRS, childList: true, subtree: true }); }
  function start(el) { try { var SH_ = window.MADAR_SHELL, pk = SH_ && SH_.palette ? SH_.palette() : null; if (pk && pk !== 'sand') { var po = SH_.palettes ? (SH_.palettes() || []).filter(function (x) { return x.k === pk; })[0] : null; buildPal(pk, po); document.documentElement.classList.add('md-pal'); } } catch (e) {}
    root = el; NAT = native(); buildCss(true); walk(el);
    mo = new MutationObserver(onMut); observe();
    new MutationObserver(function () { buildCss(); }).observe(document.head, { childList: true }); }
  function setDark(d) { d = !!d; document.documentElement.classList.toggle('md-dark', d); if (d === DARK) return; DARK = d; if (mo) mo.disconnect(); remapAll(); buildCss(true); observe(); }
  function setPalette(k, pal) { buildPal(k, pal); cache = {}; REV = {}; document.documentElement.classList.toggle('md-pal', !!PL || !!CT); if (mo) mo.disconnect(); remapAll(); buildCss(true); observe(); }
  function setContrast(o) { o = o || {}; var lv = o.level || 'std', tg = o.toggles || [], n = lv === 'std' ? null : { level: lv, hi: lv === 'high', aaa: o.target === 'aaa', border: tg.indexOf('border') >= 0 || lv === 'high', solid: tg.indexOf('solid') >= 0 };
    if (n) n.sig = [n.level, n.aaa, n.border, n.solid].join('.'); if ((CT ? CT.sig : '') === (n ? n.sig : '')) return; CT = n; cache = {}; REV = {};
    document.documentElement.classList.toggle('md-pal', !!PL || !!CT); if (mo) mo.disconnect(); remapAll(); buildCss(true); observe(); }
  window.MADAR_COLOR = { setContrast: setContrast, contrast: function () { return CT; }, setPalette: setPalette, palettes: PALS, palette: function () { return PKEY; }, start: start, setDark: setDark, map: function (v) { return mapVal(v); }, dark: dark, refresh: function () { if (mo) mo.disconnect(); remapAll(); buildCss(true); observe(); } };
})();
