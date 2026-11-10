/* MAD-HSD-504 · Madar design site: menu, routing and page loading · Mustafa Saad
   MAD-HSD-570 · English and Arabic (right to left), light and dark, the page scrolls with no scroll boxes inside, menu drawer on
   phones. Language and theme follow the shell code of the Modeef site (MAD-HSD-525), with Madar branding and colours.
   Routes:
     #/signin[/old]           sign in (System v2.1: New design | Old design)
     #/sys/<screen>           a system screen: profile, denied, nf, err, exp, pick, forgot
     #/hm[/dash]              Home: New home | Dashboard
     #/<ns>[/<list>[/<A-G>]]  a page, optionally on one list and one layout tab */
(function () {
  var P = window.MADAR_PAGES, M = window.MADAR_MENU;
  var app = document.getElementById('app'), stage = document.getElementById('stage'), menuEl = document.getElementById('menu'),
      loading = document.getElementById('loading');
  var LET = 'ABCDEFG', loaded = {}, current = '', BRAND = 'Madar';
  var IC = function (d, s) { return '<svg class="ic" width="' + (s || 19) + '" height="' + (s || 19) + '" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="' + d + '"></path></svg>'; };
  var CHEV = '<svg class="chev" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M9 6l6 6-6 6"></path></svg>';
  var esc = function (s) { return String(s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); };
  // MAD-HSD-592 · null-safe listeners: a shell element that is missing (a brief app.js / index.html mismatch) is skipped and logged
  // once; it never stops the board from drawing
  var MISS = {};
  function on(name, el, ev, fn, opt) {
    if (el && el.addEventListener) { el.addEventListener(ev, fn, opt); return; }
    if (!MISS[name]) { MISS[name] = 1; try { console.warn('Madar shell: element "' + name + '" is missing; its ' + ev + ' handler is skipped.'); } catch (e) {} }
  }
  var narrow = function () { return window.innerWidth < 1680; }, phone = function () { return window.innerWidth <= 900; };
  var parts = function (h) { return (h || '').replace(/^#\/?/, '').split('/'); };
  // boards that draw their own D1 Arabic / dark (the colour layer leaves them alone)
  var NATIVE = []; Object.keys(P).forEach(function (k) { (P[k].native || []).forEach(function (n) { NATIVE.push(n); }); });
  NATIVE.push('sys/D1Login'); window.MADAR_NATIVE = NATIVE;

  // ---------- language and theme (remembered in this browser) ----------
  var store = function (k, v) { try { if (v === undefined) return localStorage.getItem(k); localStorage.setItem(k, v); } catch (e) { return null; } };
  var LANG = store('madar-lang') === 'en' ? 'en' : 'ar',   /* MAD-EXEC · Arabic first */ THEME = store('madar-theme') === 'dark' ? 'dark' : 'light';
  function nativeSync() {   // D1 boards and the Home / sign-in wrappers draw from the site language and theme
    var w = mounted(); if (!w) return; var L = w.__logic, n = w.__dcName, ns = n.split('/')[0];
    if (n === 'sys/Interactive') L.setState({ lang: LANG });
    else if (n === 'hm/Interactive' || n === 'sys/SignIn') { L.setState({ _s: LANG + THEME + PALK }); var si = stage.querySelector('[data-dc-comp="sys/Interactive"]'); if (si && si.__logic) si.__logic.setState({ lang: LANG }); }
    else if (P[ns] && !P[ns].nativeAr && L.forceUpdate && !w.querySelector('.dbx-host')) L.forceUpdate();   // boards that fill their own host (dashboards) must not be re-rendered
    if (P[ns] && P[ns].nativeAr) L.setState({ lang: LANG, mode: THEME, palette: PALK });   // MAD-HSD-575 · the user's palette (D1 boards)
  }
  function setTheme(t) {
    THEME = t; document.documentElement.setAttribute('data-theme', t); store('madar-theme', t);
    if (window.MADAR_COLOR) window.MADAR_COLOR.setDark(t === 'dark');
    nativeSync(); renderUM();
  }
  function toggleTheme() { setTheme(THEME === 'dark' ? 'light' : 'dark'); }
  function setLang(l) {
    if (l === 'ar' && window.MADAR_I18N && window.MADAR_I18N.ready && !window.MADAR_I18N.ready()) { window.MADAR_I18N.load(function () { setLang(l); }); return; }   // MAD-HSD-618 · the Arabic dictionary loads on demand
    LANG = l; store('madar-lang', l);
    document.documentElement.lang = l; document.documentElement.dir = l === 'ar' ? 'rtl' : 'ltr';
    renderMenu();
    document.querySelectorAll('[data-ar]').forEach(function (el) { if (el.dataset.en == null) el.dataset.en = el.textContent; el.textContent = l === 'ar' ? el.dataset.ar : el.dataset.en; });
    document.querySelectorAll('[data-ar-title]').forEach(function (el) { if (el.dataset.enTitle == null) el.dataset.enTitle = el.title; el.title = l === 'ar' ? el.getAttribute('data-ar-title') : el.dataset.enTitle; el.setAttribute('aria-label', el.title); });
    document.querySelectorAll('.corner [data-md="lang"]').forEach(function (b) { b.textContent = l === 'ar' ? 'English' : 'العربية'; });
    if (window.MADAR_I18N) window.MADAR_I18N.apply(l);
    if (window.MADAR_CHIPRESET) setTimeout(window.MADAR_CHIPRESET, 200);
    nativeSync();
    var w = mounted(); if (w) document.title = titleOf(w.__dcName.split('/')[0]) + ' · ' + BRAND;
    try { window.dispatchEvent(new CustomEvent('madar:lang', { detail: l })); } catch (e) {}   // MAD-EXEC · the executive dashboards follow the language
  }
  window.MADAR_SHELL = { lang: function () { return LANG; }, theme: function () { return THEME; }, setLang: setLang, toggleTheme: toggleTheme, mark: function () { markActive(); },
    palette: function () { return PALK; }, palettes: function () { return PALS; }, setPalette: function (k) { setPalette(k); }, search: function () { qpOpen(); } };
  document.addEventListener('click', function (e) {
    var b = e.target.closest('[data-md="theme"], [data-md="lang"]'); if (!b) return;   // (data-md="bell" is the notifications bell, below)
    e.preventDefault(); e.stopPropagation();
    if (b.getAttribute('data-md') === 'theme') toggleTheme(); else setLang(LANG === 'ar' ? 'en' : 'ar');
  }, true);

  // ---------- menu: the approved icon rail with its fly-out (engine boards, notes/engine.md) ----------
  // One shared rail for every page: icons = menu groups; pointing at the rail (or focusing it) opens the 940px fly-out.
  // MAD-HSD-575 · the fly-out: logo, "Find a page or tab" search (/), recent pages, every group in two columns with its pages and
  // lists (count badges), keyboard hints and the real counts. Typing filters groups, pages and lists; ↑ ↓ move, ← → change column,
  // Enter opens, Esc clears then closes. On phones the same content is a drawer (Expand menu / ☰).
  var trx = function (s) { var t = LANG === 'ar' && window.MADAR_I18N ? window.MADAR_I18N.tr(s) : null; return t == null ? s : t; };
  var arOf = function (s) { var t = window.MADAR_I18N ? window.MADAR_I18N.tr(s) : null; return t == null ? '' : t; };
  var tx = function (en, ar) { return LANG === 'ar' ? ar : en; };
  var norm = function (s) { return String(s || '').toLowerCase().replace(/[ً-ْـ]/g, '').replace(/[أإآ]/g, 'ا').replace(/ة/g, 'ه').replace(/ى/g, 'ي'); };
  // MAD-HSD-594 · the forms of a search word: without ال, and its singular/plural (Arabic table, English -s/-ies)
  var STEMS = [['فندق', 'فنادق'], ['حاج', 'حجاج'], ['رحله', 'رحلات'], ['مخيم', 'مخيمات'], ['موظف', 'موظفين'], ['موظف', 'موظفون'], ['طلب', 'طلبات'], ['باقه', 'باقات'], ['مجموعه', 'مجموعات'], ['حافله', 'حافلات'], ['خيمه', 'خيام'], ['صاله', 'صالات'], ['مهمه', 'مهام'], ['عياده', 'عيادات'], ['رساله', 'رسائل'], ['تقرير', 'تقارير'], ['شركه', 'شركات'], ['مستخدم', 'مستخدمين'], ['وجبه', 'وجبات'], ['حقيبه', 'حقائب']];
  function qForms(q) {
    if (!q) return [q]; var out = [q], add = function (v) { if (v && v.length > 1 && out.indexOf(v) < 0) out.push(v); };
    out.slice().forEach(function (v) { if (/^ال/.test(v) && v.length > 3) add(v.slice(2)); });
    out.slice().forEach(function (v) { STEMS.forEach(function (p) { if (v === p[0]) add(p[1]); else if (v === p[1]) add(p[0]); }); });
    out.slice().forEach(function (v) { if (!/^[a-z][a-z ]*$/.test(v) || v.length < 3) return; if (/ies$/.test(v)) add(v.slice(0, -3) + 'y'); else if (/s$/.test(v)) add(v.slice(0, -1)); else { add(v + 's'); if (/y$/.test(v)) add(v.slice(0, -1) + 'ies'); } });
    return out;
  }
  function hl(s, q) {   // the matched part of a label in bold
    s = String(s); if (!q) return esc(s); var n = norm(s); if (n.length !== s.length) return esc(s); var i = n.indexOf(q); if (i < 0) return esc(s);
    return esc(s.slice(0, i)) + '<mark>' + esc(s.slice(i, i + q.length)) + '</mark>' + esc(s.slice(i + q.length));
  }
  // MAD-HSD-589 · no medical cross anywhere: the medical group shows a hospital building (the path shared with the boards)
  var CROSS = 'M10 3h4v7h7v4h-7v7h-4v-7H3v-4h7z', HOSPITAL = 'M3 21h18M5 21V7l7-4 7 4v14M9 21v-4h6v4M8.5 10h1M14.5 10h1M8.5 13.5h1M14.5 13.5h1';
  var BADGE = { '#/rq': '99+', '#/iss': '6' };   // open items waiting (sample)
  var ICO = {
    clock: 'M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18M12 7v5l3 2', search: 'M11 18a7 7 0 1 0 0-14 7 7 0 0 0 0 14M20 20l-4-4',
    swap: 'M7 4L3 8l4 4M3 8h14M17 20l4-4-4-4M21 16H7', globe: 'M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18M3 12h18M12 3a14 14 0 0 1 0 18M12 3a14 14 0 0 0 0 18',
    out: 'M15 4h4a1 1 0 0 1 1 1v14a1 1 0 0 1-1 1h-4M10 17l5-5-5-5M15 12H3', sun: 'M12 16a4 4 0 1 0 0-8 4 4 0 0 0 0 8M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4',
    moon: 'M20 14.5A8 8 0 0 1 9.5 4a8 8 0 1 0 10.5 10.5', user: 'M20 21v-1a5 5 0 0 0-5-5H9a5 5 0 0 0-5 5v1M12 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8',
    plane: 'M2 16l20-6L2 4l4 6zM6 10h8', bus: 'M5 17V6a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v11zM5 11h14M7.5 20v-3M16.5 20v-3',
    route: 'M6 19a2 2 0 1 0 0-4 2 2 0 0 0 0 4M18 9a2 2 0 1 0 0-4 2 2 0 0 0 0 4M6 15V9a3 3 0 0 1 3-3h7M18 9v6a3 3 0 0 1-3 3H8', hotel: 'M4 21V4h11v17M15 9h5v12M8 8h3M8 12h3M8 16h3M2 21h20',
    layout: 'M4 4h16v16H4zM4 10h16M10 10v10'
  };
  function groupItems(g) {
    if (g.items) return g.items.map(function (it) { return { fam: LANG === 'ar' && it.ar ? it.ar : it.label, k: norm(it.label + ' ' + (it.ar || '')), route: it.route, ents: [] }; });
    return g.fams.filter(function (ns) { return P[ns]; }).map(function (ns) {
      var f = P[ns], far = f.ar || arOf(f.page);
      return { fam: LANG === 'ar' ? (f.ar || trx(f.page)) : f.page, k: norm(f.page + ' ' + far), route: '#/' + ns, ns: ns, ents: f.ents.length > 1 && !f.home ? f.ents.map(function (e) { return { label: LANG === 'ar' ? (e.ar || trx(e.tab)) : e.tab, k: norm(e.tab + ' ' + (e.ar || arOf(e.tab))), route: '#/' + ns + '/' + e.key }; }) : [] };
    });
  }
  var railEl = document.getElementById('rail-icons'), rail = document.querySelector('.side .rail'), fly = document.querySelector('.side .rail-fly'),
      flyQ = document.getElementById('fly-q'), flyRecent = document.getElementById('fly-recent'), flyFoot = document.getElementById('fly-foot');
  var MODEL = [], ROUTES = {}, INDEX = [], NLINKS = 0;
  function buildModel() {
    MODEL = []; ROUTES = {}; INDEX = []; NLINKS = 0;
    M.forEach(function (g) {
      var items = groupItems(g); if (!items.length) return;
      var G = { id: g.id, icon: g.icon === CROSS ? HOSPITAL : g.icon, label: LANG === 'ar' ? g.ar : g.en, k: norm(g.en + ' ' + g.ar), items: items }; MODEL.push(G);
      items.forEach(function (it) {
        NLINKS += 1 + it.ents.length;
        ROUTES[it.route] = { t: it.fam, sub: G.label, icon: G.icon };
        INDEX.push({ t: it.fam, sub: G.label, icon: G.icon, route: it.route, k: it.k, k2: G.k });
        it.ents.forEach(function (e) { ROUTES[e.route] = { t: e.label, sub: it.fam, icon: G.icon }; INDEX.push({ t: e.label, sub: it.fam + ' · ' + G.label, icon: G.icon, route: e.route, k: e.k, k2: it.k + ' ' + G.k }); });
        var f = it.ns && P[it.ns];   // the layout tabs A–G of a page are tabs too
        if (f && f.layouts && f.layouts.length > 1) f.layouts.forEach(function (lay, i) {
          var L = LET[i], ar = arOf(lay), name = LANG === 'ar' ? (ar || 'التخطيط ' + L) : lay;
          INDEX.push({ t: L + ' · ' + name, sub: it.fam + ' · ' + G.label, icon: ICO.layout, route: '#/' + it.ns + '/' + (f.ents[0] ? f.ents[0].key : '-') + '/' + L, k: norm(lay + ' ' + ar), k2: it.k, lay: 1 });
        });
      });
    });
  }
  function routeKey(h) { var p = parts(h); var a = '#/' + p.slice(0, 2).join('/'), b = '#/' + p[0]; return ROUTES[a] ? a : ROUTES[b] ? b : null; }
  // recent pages (newest first), kept in this browser from route()
  function recents() { try { return JSON.parse(store('madar-recent') || '[]').filter(function (r) { return ROUTES[r]; }); } catch (e) { return []; } }
  function pushRecent(h) {
    if (!MODEL.length) buildModel(); var k = routeKey(h); if (!k) return;
    var r = recents().filter(function (x) { return x !== k; }); r.unshift(k); store('madar-recent', JSON.stringify(r.slice(0, 8))); drawRecent();
  }
  function link(it, cls, q) {
    var b = BADGE[it.route]; return '<a href="' + it.route + '" role="menuitem" data-r="' + it.route + '" class="' + cls + '"><span>' + hl(it.fam || it.label, q) + '</span>' + (b ? '<em class="md-badge">' + b + '</em>' : '') + '</a>';
  }
  var kb = null;   // the item the arrow keys are on
  // MAD-HSD-590 · Compact menu (main pages only) / Detailed menu (pages with their lists, the default); remembered in this browser.
  // Searching in the compact menu still shows a matching list under its page.
  var COMPACT = store('madar-menu-mode') === 'compact', flyMode = document.getElementById('fly-mode');
  function drawMode() {
    if (!flyMode) return;
    var B = [['compact', 'M4 6h16M4 12h16M4 18h16', tx('Compact menu', 'قائمة مختصرة')], ['detailed', 'M4 5h16M9 9.5h11M9 14h11M4 18.5h16', tx('Detailed menu', 'قائمة مفصّلة')]];
    flyMode.setAttribute('aria-label', tx('Menu view', 'عرض القائمة'));
    flyMode.innerHTML = B.map(function (b) { var on = (b[0] === 'compact') === COMPACT; return '<button type="button" role="radio" aria-checked="' + on + '" data-mode="' + b[0] + '" aria-label="' + b[2] + '" title="' + b[2] + '"' + (on ? ' class="on"' : '') + '>' + IC(b[1], 17) + '</button>'; }).join('');
  }
  function setMode(c) { COMPACT = c; store('madar-menu-mode', c ? 'compact' : 'detailed'); drawMode(); drawFly(); drawFoot(); var b = flyMode.querySelector('[data-mode="' + (c ? 'compact' : 'detailed') + '"]'); if (b) b.focus(); }
  on('flyMode', flyMode, 'click', function (e) { var b = e.target.closest('[data-mode]'); if (b) setMode(b.getAttribute('data-mode') === 'compact'); });
  on('flyMode', flyMode, 'keydown', function (e) { if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') { e.preventDefault(); e.stopPropagation(); setMode(!COMPACT); } });
  function drawFoot() {
    if (!flyFoot) return;
    var K = function (k) { return '<kbd>' + k + '</kbd>'; }, n = COMPACT ? MODEL.reduce(function (a, G) { return a + G.items.length; }, 0) : NLINKS;
    flyFoot.innerHTML = '<span class="md-keys">' + K('↑') + K('↓') + ' ' + tx('navigate', 'تنقّل') + ' · ' + K('←') + K('→') + ' · ' + K('Enter') + ' ' + tx('open', 'فتح') + ' · ' + K('Esc') + ' ' + tx('close', 'إغلاق') + ' · ' + K('/') + ' ' + tx('search', 'بحث') + '</span>' +
      '<span class="md-cnt">' + tx(MODEL.length + ' groups · ' + n + ' pages', (window.MADAR_I18N && window.MADAR_I18N.agree ? window.MADAR_I18N.agree : String)(MODEL.length + ' مجموعات · ' + n + ' صفحات')) + '</span>';
  }
  function setKb(a, scroll) { if (kb) kb.classList.remove('kb'); kb = a || null; if (kb) { kb.classList.add('kb'); if (scroll) kb.scrollIntoView({ block: 'nearest' }); } }
  function drawFly() {
    if (!menuEl || !flyQ) return;
    var q = norm(flyQ.value.trim()), shown = [], total = 0, QV = qForms(q), has = function (k) { return QV.some(function (v) { return k.indexOf(v) >= 0; }); };
    MODEL.forEach(function (G) {
      var gm = q && has(G.k), html = '', n = 0;
      G.items.forEach(function (it) {
        var pm = !q || gm || has(it.k), ents = it.ents.filter(function (e) { return q ? (COMPACT ? has(e.k) : pm || has(e.k)) : !COMPACT; });
        if (!pm && !ents.length) return;
        html += link(it, 'fly-p', q) + ents.map(function (e) { return link(e, 'fly-e', q); }).join(''); n += 1 + ents.length;
      });
      if (!n) return; total += n + 2;
      shown.push('<div class="fly-g" data-g="' + G.id + '"><div class="fly-gh">' + IC(G.icon, 17) + '<b>' + hl(G.label, q) + '</b></div>' + html + '</div>');
      shown[shown.length - 1] = { h: shown[shown.length - 1], w: n + 2 };
    });
    var cols = ['', ''], acc = 0;   // two columns, in menu order, balanced by height
    shown.forEach(function (s) { cols[acc + s.w / 2 <= total / 2 || !cols[0] ? 0 : 1] += s.h; acc += s.w; });
    setKb(null);
    menuEl.innerHTML = shown.length ? '<div class="md-fcol">' + cols[0] + '</div><div class="md-fcol">' + cols[1] + '</div>'
      : '<div class="md-fnone">' + esc(tx('No page or tab matches “' + flyQ.value.trim() + '”.', 'لا توجد صفحة أو تبويب يطابق «' + flyQ.value.trim() + '».')) + '</div>';
    markActive();
    if (q) setKb(menuEl.querySelector('a[data-r]'));
  }
  function drawRecent() {
    if (!flyRecent) return;
    var r = recents().filter(function (x) { return x !== routeKey(location.hash || ''); }).slice(0, 5);
    flyRecent.innerHTML = r.map(function (k) { return '<a class="md-chip" href="' + k + '" data-r="' + k + '">' + IC(ICO.clock, 14) + '<span>' + esc(ROUTES[k].t) + '</span></a>'; }).join('');
    flyRecent.hidden = !r.length;
  }
  function renderMenu() {
    buildModel();
    if (railEl) railEl.innerHTML = MODEL.map(function (G) { return '<a href="' + G.items[0].route + '" data-g="' + G.id + '" aria-label="' + esc(G.label) + '" title="' + esc(G.label) + '">' + IC(G.icon) + '</a>'; }).join('');
    if (flyQ) { flyQ.placeholder = tx('Find a page or tab', 'ابحث عن صفحة أو تبويب'); flyQ.setAttribute('aria-label', flyQ.placeholder); }
    drawMode(); drawFoot();
    drawFly(); drawRecent();
    renderUM(); qpText(); pills(); if (nt && ntBox && !nt.hidden) { ntDraw(); ntPlace(); }
  }
  function markActive() {
    var pp = parts(location.hash || ''), ns = pp[0], ent = pp[1], f = P[ns], gid = null;
    document.querySelectorAll('#menu a[data-r]').forEach(function (a) {
      var r = parts(a.getAttribute('data-r')), on = r[0] === ns && (r.length === 1 ? !(ent && a.classList.contains('fly-e')) && !(f && f.home && ent) : r[1] === ent);
      if (r[0] === ns && r.length > 1 && f && f.home) on = r[1] === ent;
      a.classList.toggle('on', !!on); if (on) gid = a.closest('.fly-g').getAttribute('data-g');
    });
    if (!gid) { var G = MODEL.filter(function (G) { return G.items.some(function (it) { return parts(it.route)[0] === ns; }); })[0]; if (G) gid = G.id; }
    document.querySelectorAll('#menu .fly-g').forEach(function (g) { g.classList.toggle('cur', g.getAttribute('data-g') === gid); });
    document.querySelectorAll('#rail-icons a').forEach(function (a) { a.classList.toggle('cur', a.getAttribute('data-g') === gid); });
  }
  function go(h) { if (location.hash === h) route(); else location.hash = h; }
  function flyIsOpen() { return phone() ? app.classList.contains('drawer') : !!fly && getComputedStyle(fly).visibility === 'visible'; }
  function closeFly() {
    if (flyQ && flyQ.value) { flyQ.value = ''; drawFly(); }
    if (rail) rail.classList.add('md-flyx'); drawer(false);
    if (document.activeElement && document.activeElement.closest('.side')) document.activeElement.blur();
  }
  on('rail', rail, 'mouseleave', function () { rail.classList.remove('md-flyx'); });
  on('rail', rail, 'focusin', function (e) { if (!e.target.closest('.me-wrap')) rail.classList.remove('md-flyx'); });
  on('flyQ', flyQ, 'input', drawFly);
  on('fly', fly, 'keydown', function (e) {
    var k = e.key, L = [].slice.call(menuEl.querySelectorAll('a[data-r]')), i = kb ? L.indexOf(kb) : -1;
    if (e.target.closest('#fly-mode') && e.key !== 'Escape') return;   // the view switch keeps its own keys
    if (k === 'Escape') { e.preventDefault(); e.stopPropagation(); if (flyQ.value) { flyQ.value = ''; drawFly(); flyQ.focus(); } else closeFly(); return; }
    if (!L.length) return;
    if (k === 'ArrowDown' || k === 'ArrowUp') { e.preventDefault(); setKb(L[k === 'ArrowDown' ? (i + 1) % L.length : (i <= 0 ? L.length - 1 : i - 1)], true); }
    else if ((k === 'ArrowLeft' || k === 'ArrowRight') && kb) {
      e.preventDefault(); var cols = [].slice.call(menuEl.querySelectorAll('.md-fcol')), c = cols.indexOf(kb.closest('.md-fcol'));
      var d = (k === 'ArrowRight' ? 1 : -1) * (LANG === 'ar' ? -1 : 1), to = cols[c + d]; if (!to) return;
      var y = kb.getBoundingClientRect().top, best = null, bd = 1e9;
      to.querySelectorAll('a[data-r]').forEach(function (a) { var dd = Math.abs(a.getBoundingClientRect().top - y); if (dd < bd) { bd = dd; best = a; } });
      if (best) setKb(best, true);
    }
    else if (k === 'Enter' && kb) { e.preventDefault(); var h = kb.getAttribute('data-r'); closeFly(); go(h); }
  });
  on('menuEl', menuEl, 'mousemove', function (e) { var a = e.target.closest('a[data-r]'); if (a && a !== kb && kb) setKb(a); });
  on('flyRecent', flyRecent, 'click', function (e) { var a = e.target.closest('a[data-r]'); if (!a) return; e.preventDefault(); var h = a.getAttribute('data-r'); closeFly(); go(h); });

  // ---------- MAD-HSD-575 · user-tile menu: who, working in, palette (D1 palettes), mode, language, sign out ----------
  var PALS = [
    { k: 'sand', en: 'Sand Gold', ar: 'ذهب الرمال', deep: '#3A2C17', mid: '#8A6424', a: '#E0AE4A', c: '#EC9364', b: '#CC86AD', silk: ['#7A5219', '#9C4F2C', '#6B3760'] },
    { k: 'haram', en: 'Haram Green', ar: 'أخضر الحرم', deep: '#0E3B30', mid: '#17654F', a: '#44C7A5', c: '#40B0C2', b: '#E3B651', silk: ['#0B5E52', '#16697C', '#7E6118'] },
    { k: 'night', en: 'Night Sky', ar: 'سماء الليل', deep: '#0F2140', mid: '#22487A', a: '#4FB3E8', c: '#8C8FE6', b: '#D4AE5E', silk: ['#0F4C81', '#2E3F8C', '#5A3E86'] },
    { k: 'sage', en: 'Sage Copper', ar: 'مريمية ونحاس', deep: '#22312A', mid: '#46624F', a: '#8FC4A0', c: '#6FB0AE', b: '#D99A62', silk: ['#2F5D4A', '#3A6466', '#87522D'] },
    { k: 'maroon', en: 'Royal Maroon', ar: 'عنّابي ملكي', deep: '#3B1020', mid: '#7A2140', a: '#F08A6A', c: '#E8B45A', b: '#C76BB0', silk: ['#6E1A36', '#8E3A2E', '#5C2A6E'] },
    { k: 'ocean', en: 'Zamzam Ocean', ar: 'محيط زمزم', deep: '#062F3F', mid: '#0D5C78', a: '#3FD0E0', c: '#5AA8F0', b: '#8C8CF2', silk: ['#0A5C73', '#1C5FA0', '#3E3F9C'] },
    { k: 'dusk', en: 'Desert Dusk', ar: 'غسق الصحراء', deep: '#2B1E3A', mid: '#5B3F7A', a: '#F2B35E', c: '#E98AA0', b: '#8F7CE8', silk: ['#8A4A2A', '#7A2F5A', '#45307E'] },
    { k: 'masar', en: 'Masar', ar: 'مسار', deep: '#004851', mid: '#07646E', a: '#65D7D2', c: '#7DA8D2', b: '#9578D3', silk: ['#0E6F79', '#2A6E98', '#57479F'] }
  ];
  var PALK = store('madar-palette'); if (!PALS.some(function (p) { return p.k === PALK; })) PALK = 'sand';
  var palOf = function (k) { return PALS.filter(function (p) { return p.k === k; })[0] || PALS[0]; };
  var ME = { en: 'Mustafa Saad', ar: 'مصطفى سعد', role: 'Operations manager', roleAr: 'مدير العمليات', co: 'Al-Bait Hajj Company', coAr: 'شركة البيت للحج', se: 'Hajj 1448', seAr: 'حج 1448' };
  var pop = document.getElementById('pop'), meBtn = document.getElementById('me');
  function applyPalette() {
    var p = palOf(PALK), s = document.documentElement.style;
    document.documentElement.setAttribute('data-palette', PALK);
    s.setProperty('--md-grad', 'linear-gradient(90deg, ' + p.a + ', ' + p.c + ', ' + p.b + ')');
    s.setProperty('--md-silk', 'linear-gradient(90deg, ' + p.silk[0] + ' 0%, ' + p.silk[1] + ' 52%, ' + p.silk[2] + ' 100%)');
    s.setProperty('--md-pa', p.a); s.setProperty('--md-pc', p.c); s.setProperty('--md-pb', p.b); s.setProperty('--md-pdeep', p.deep); s.setProperty('--md-pmid', p.mid);
  }
  function setPalette(k) {
    PALK = palOf(k).k; store('madar-palette', PALK); applyPalette();
    if (window.MADAR_COLOR && window.MADAR_COLOR.setPalette) window.MADAR_COLOR.setPalette(PALK, palOf(PALK));   // hook in md-color.js (pipeline)
    nativeSync(); renderUM();
  }
  // ---------- MAD-HSD-596 · display settings ('madar-display'), applied to every page through classes and variables on <html> ----------
  var UDKEY = 'madar-display', OSRM = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
  var UTOG = ['nograd', 'border', 'ul', 'bold', 'focus', 'solid'], ULEV = { std: [], more: ['border', 'ul', 'focus'], high: UTOG.slice() };
  var UDEF = { anim: true, splashT: 0, rm: !!OSRM, text: 'm', density: 'comfy', nums: 'latin', cal: 'greg', level: 'std', target: 'aa', nograd: false, border: false, ul: false, bold: false, focus: false, solid: false };
  var U = Object.assign({}, UDEF); try { Object.assign(U, JSON.parse(store(UDKEY) || '{}')); } catch (e) {}
  function udSave() { store(UDKEY, JSON.stringify(U)); }
  var hx = function (h) { var n = parseInt(h.slice(1, 7), 16); return [n >> 16 & 255, n >> 8 & 255, n & 255]; };
  var toHex = function (a) { return '#' + a.map(function (v) { var s = Math.round(v).toString(16); return s.length < 2 ? '0' + s : s; }).join(''); };
  var mixH = function (x, y, f) { var A = hx(x), B = hx(y); return toHex(A.map(function (v, i) { return v * (1 - f) + B[i] * f; })); };
  var lumC = function (c) { var f = function (v) { v /= 255; return v <= .03928 ? v / 12.92 : Math.pow((v + .055) / 1.055, 2.4); }; return .2126 * f(c[0]) + .7152 * f(c[1]) + .0722 * f(c[2]); };
  var ratioC = function (a, b) { var L1 = lumC(a), L2 = lumC(b); return (Math.max(L1, L2) + .05) / (Math.min(L1, L2) + .05); };
  function reachH(col, bg, target, to) { var f = 0, c = col; while (ratioC(hx(c), hx(bg)) < target && f < 1) { f += .02; c = mixH(col, to, f); } return c; }
  function udApply() {
    var de = document.documentElement, s = de.style, p = palOf(PALK), dark = THEME === 'dark', rm = U.rm;
    // the loading screen: the sign-in aurora in the palette colours
    var s0 = mixH(p.silk[0], p.a, .5), s1 = mixH(p.silk[1], p.c, .45), s2 = mixH(p.silk[2], p.b, .4);
    if (dark) { s0 = mixH(s0, '#0E0B06', .38); s1 = mixH(s1, '#0E0B06', .38); s2 = mixH(s2, '#0E0B06', .38); }
    var fold = mixH(p.deep, '#000000', .35);
    s.setProperty('--silk-bright', 'linear-gradient(90deg,' + s0 + ' 0%,' + s1 + ' 52%,' + s2 + ' 100%)');
    s.setProperty('--silkL1', 'radial-gradient(38% 26% at 28% 62%,' + p.a + 'BF,transparent 70%),radial-gradient(34% 24% at 72% 34%,' + p.b + 'BF,transparent 70%),radial-gradient(30% 20% at 58% 78%,' + p.c + 'A6,transparent 70%),radial-gradient(70% 14% at 50% 52%,' + fold + '8C,transparent 72%)');
    s.setProperty('--silkL2', 'radial-gradient(90% 16% at 50% 46%,#FFFFFF42,transparent 62%),radial-gradient(80% 12% at 50% 66%,' + fold + '61,transparent 64%)');
    s.setProperty('--spt', (U.anim && !rm ? U.splashT / 100 : 0).toFixed(2));
    // contrast: More / High, AA / AAA (shell tokens; the page colours follow through md-color, see MADAR_COLOR.setContrast)
    var lv = U.level, aaa = lv !== 'std' && U.target === 'aaa';
    ['--ink', '--muted', '--accent', '--red', '--ud-link'].forEach(function (v) { s.removeProperty(v); });
    if (lv !== 'std') {
      var card = dark ? (lv === 'high' ? '#000000' : '#1A140A') : '#FFFFFF', to = dark ? '#FFFFFF' : '#000000', tg = aaa ? 7 : 4.5;
      var base = dark ? { ink: '#EEF3F2', muted: '#C4C0B9', accent: p.a, red: '#F07A7A' } : { ink: '#2C2111', muted: '#666056', accent: PALK === 'sand' ? '#8A6424' : p.mid, red: '#B23434' };
      if (!dark && aaa) { base.muted = '#5E584F'; base.red = '#8B2929'; if (PALK === 'sand') base.accent = '#73531E'; }
      if (lv === 'high') base.ink = dark ? '#FFFFFF' : '#14100A';
      Object.keys(base).forEach(function (k) { s.setProperty('--' + k, reachH(base[k], card, tg, to)); });
      s.setProperty('--ud-on', lv === 'high' ? reachH(dark ? p.a : p.deep, dark ? '#000000' : '#FFFFFF', 10, to) : (dark ? p.a : p.deep));
    }
    var C = { 'ud-rm': rm, 'ud-noanim': !U.anim || rm, 'ud-see': U.anim && !rm && U.splashT > 0, 'ud-more': lv === 'more', 'ud-high': lv === 'high', 'ud-aaa': aaa, 'ud-compact': U.density === 'compact' };
    UTOG.forEach(function (k) { C['ud-' + k] = !!U[k]; });
    Object.keys(C).forEach(function (k) { de.classList.toggle(k, !!C[k]); });
    de.setAttribute('data-ud-text', U.text);
    if (window.MADAR_COLOR && window.MADAR_COLOR.setContrast) window.MADAR_COLOR.setContrast({ level: lv, target: aaa ? 'aaa' : 'aa', toggles: UTOG.filter(function (k) { return U[k]; }) });   // hook in md-color.js (pipeline)
    udNums();
  }
  // numbers in Arabic-Indic digits and Hijri dates (Umm al-Qura) in the text of the page, when chosen
  var AI = '٠١٢٣٤٥٦٧٨٩', MON_EN = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'], MON_AR = ['يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو', 'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'];
  var udOrig = new WeakMap(), udMine = new WeakMap(), udT = 0;
  function hijri(d, m, y) { try { var dt = new Date(+y, m, +d); return new Intl.DateTimeFormat((LANG === 'ar' ? 'ar-SA' : 'en-GB') + '-u-ca-islamic-umalqura-nu-latn', { day: 'numeric', month: 'long', year: 'numeric' }).format(dt).replace(/\s*(AH|هـ)$/, '') + (LANG === 'ar' ? ' هـ' : ' AH'); } catch (e) { return null; } }
  function udText(v) {
    var o = v;
    if (U.cal === 'hijri') {
      o = o.replace(/\b(\d{1,2}) (January|February|March|April|May|June|July|August|September|October|November|December|Jan|Feb|Mar|Apr|Jun|Jul|Aug|Sep|Oct|Nov|Dec) (\d{4})\b/g, function (m0, d, mo, y) { var i = MON_EN.findIndex(function (x) { return x.indexOf(mo) === 0; }); var h = hijri(d, i, y); return h || m0; });
      o = o.replace(/(\d{1,2}) (يناير|فبراير|مارس|أبريل|مايو|يونيو|يوليو|أغسطس|سبتمبر|أكتوبر|نوفمبر|ديسمبر) (\d{4})/g, function (m0, d, mo, y) { var h = hijri(d, MON_AR.indexOf(mo), y); return h || m0; });
    }
    if (LANG === 'ar' && U.nums === 'arab' && !/[A-Za-z]/.test(o)) o = o.replace(/[0-9]/g, function (d) { return AI[d]; }).replace(/%/g, '٪');
    return o;
  }
  function udWalk(root) {
    var on = U.cal === 'hijri' || (LANG === 'ar' && U.nums === 'arab'), tw = document.createTreeWalker(root, NodeFilter.SHOW_TEXT), n;
    while ((n = tw.nextNode())) {
      var pe = n.parentElement; if (!pe || pe.closest('input, textarea, script, style, [data-no-tr], [dir="ltr"], kbd')) continue;
      var cur = n.nodeValue;
      if (udMine.get(n) === cur) { if (!on) { n.nodeValue = udOrig.get(n); udMine.delete(n); } continue; }
      if (!on || !/[0-9]/.test(cur)) continue;
      var v = udText(cur); if (v !== cur) { udOrig.set(n, cur); udMine.set(n, v); n.nodeValue = v; }
    }
  }
  function udNums() { if (!udT) udT = setTimeout(function () { udT = 0; udWalk(stage); var q = document.querySelector('.md-up-box'); if (q) udWalk(q); }, 60); }
  new MutationObserver(function () { if (U.cal === 'hijri' || (LANG === 'ar' && U.nums === 'arab')) udNums(); }).observe(stage, { childList: true, subtree: true, characterData: true });

  // ---------- MAD-HSD-596 · the user pane: a double-glass side pane on the start side (a full-width sheet on phones) ----------
  var upBox = document.getElementById('up-box'), upTop = 0;
  function upSeg(k, opts, vals, cur, label) {
    return '<span class="md-up-ms" role="radiogroup" aria-label="' + esc(label) + '">' + opts.map(function (o, i) { var on = cur === vals[i]; return '<button type="button" role="radio" data-' + k + '="' + vals[i] + '" aria-checked="' + on + '"' + (on ? ' class="on"' : '') + '>' + o + '</button>'; }).join('') + '</span>';
  }
  function upSw(k, label, hint, extra, dis) { return '<div class="md-up-row' + (dis ? ' dis' : '') + '"><span class="md-up-lb"><b>' + esc(label) + '</b><small>' + esc(hint) + (extra || '') + '</small></span><button type="button" class="md-up-sw" role="switch" data-k="' + k + '" aria-checked="' + !!U[k] + '"' + (dis ? ' disabled' : '') + ' aria-label="' + esc(label) + '"></button></div>'; }
  function upRow(label, hint, ctl) { return '<div class="md-up-row"><span class="md-up-lb"><b>' + esc(label) + '</b><small>' + esc(hint) + '</small></span>' + ctl + '</div>'; }
  function renderUM() {
    psApply(); if (psPop && !psPop.hidden) psDraw(); udApply();   // MAD-HSD-593/596 · pane settings and display follow theme, language and palette
    if (!pop || !meBtn || !upBox) return;
    var p = palOf(PALK), I = function (d) { return '<svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="' + d + '"></path></svg>'; };
    var off = !U.anim || U.rm, why = !U.anim ? tx('Off: the animated loading screen is off', 'متوقفة: شاشة التحميل المتحركة مطفأة') : U.rm ? tx('Off while Reduce motion is on', 'متوقفة أثناء تفعيل تقليل الحركة') : '';
    var custom = UTOG.some(function (k) { return !!U[k] !== (ULEV[U.level].indexOf(k) >= 0); });
    var TG = { nograd: [tx('Remove gradients and aurora', 'إزالة التدرّجات والشفق'), tx('Solid surfaces behind all text', 'أسطح مصمتة خلف كل النصوص')], border: [tx('Stronger borders and dividers', 'حدود وفواصل أقوى'), tx('1.5–2px and darker', 'بسماكة 1.5–2px وأغمق')], ul: [tx('Underline links', 'وضع خط تحت الروابط'), tx('Links never rely on colour alone', 'لا تعتمد الروابط على اللون وحده')], bold: [tx('Bolder text', 'نص أعرض'), tx('One weight up', 'وزن واحد أثقل')], focus: [tx('Visible focus ring', 'إطار تركيز واضح'), tx('A thick outline on the focused control', 'إطار سميك حول العنصر المحدد')], solid: [tx('Solid panes', 'لوحات مصمتة'), tx('Glass off: opaque frame and card, no blur', 'بدون زجاج: إطار وبطاقة معتمان وبدون تمويه')] };
    upBox.setAttribute('aria-label', tx('User menu', 'قائمة المستخدم'));
    var keep = upBox.querySelector('.md-up-card'); upTop = keep ? keep.scrollTop : upTop;
    upBox.innerHTML =
      '<div class="md-up-head"><button type="button" class="md-up-who" data-go="#/sys/profile" title="' + tx('My profile', 'ملفي الشخصي') + '"><span class="md-up-av" data-no-tr>MS</span><span class="md-up-ht"><b id="up-h">' + tx(ME.en, ME.ar) + '</b><small>' + tx(ME.role, ME.roleAr) + '</small></span></button>' +
        '<button type="button" class="md-up-x" data-close="1" aria-label="' + tx('Close', 'إغلاق') + '" title="' + tx('Close', 'إغلاق') + '">×</button></div>' +
      '<div class="md-up-card">' +
        '<div class="md-up-lbl">' + tx('Working in now', 'تعمل الآن في') + '</div>' +
        '<div class="md-up-co"><span><b>' + tx(ME.co, ME.coAr) + '</b><small>' + tx(ME.se, ME.seAr) + '</small></span><button type="button" class="md-up-b" data-go="#/sys/pick">' + I(ICO.swap) + tx('Change', 'تغيير') + '</button></div>' +
        '<div class="md-up-lbl">' + tx('Palette', 'لوحة الألوان') + '<i>' + tx(p.en, p.ar) + '</i></div>' +
        '<div class="md-up-sws" role="radiogroup" aria-label="' + tx('Palette', 'لوحة الألوان') + '">' + PALS.map(function (o) { return '<button type="button" role="radio" aria-checked="' + (o.k === PALK) + '" data-pal="' + o.k + '" title="' + tx(o.en, o.ar) + '" aria-label="' + tx(o.en, o.ar) + '"' + (o.k === PALK ? ' class="on"' : '') + ' style="background: linear-gradient(135deg, ' + o.a + ', ' + o.c + ', ' + o.b + ')"></button>'; }).join('') + '</div>' +
        '<div class="md-up-lbl">' + tx('Mode', 'الوضع') + '</div>' + upSeg('th', [I(ICO.sun) + ' ' + tx('Light', 'فاتح'), I(ICO.moon) + ' ' + tx('Dark', 'داكن')], ['light', 'dark'], THEME, tx('Mode', 'الوضع')).replace('md-up-ms', 'md-up-ms wide') +
        '<div class="md-up-lbl">' + tx('Language', 'اللغة') + '</div>' + upSeg('ln', ['English', 'العربية'], ['en', 'ar'], LANG, tx('Language', 'اللغة')).replace('md-up-ms', 'md-up-ms wide') +
        '<div class="md-up-lbl sect">' + tx('Display & motion', 'العرض والحركة') + '</div>' +
        upSw('anim', tx('Animated loading screen', 'شاشة تحميل متحركة'), tx('The sign-in aurora behind the logo', 'شفق تسجيل الدخول خلف الشعار'), ' · <button type="button" class="md-up-lnk" data-preview="1">' + tx('Preview', 'معاينة') + '</button>') +
        '<div class="md-up-sl' + (off ? ' dis' : '') + '"><div class="md-up-top"><b>' + tx('Loading screen transparency', 'شفافية شاشة التحميل') + '</b><output id="up-spv">' + U.splashT + '%</output></div>' +
          '<small>' + tx('0% is solid, as today. Higher lets the page show through; the logo stays fully visible', '0% مصمتة كما اليوم. كلما زادت ظهرت الصفحة من خلفها ويبقى الشعار واضحًا تمامًا') + (why ? ' · <span class="why">' + why + '</span>' : '') + '</small>' +
          '<input type="range" id="up-spt" min="0" max="80" step="5" value="' + U.splashT + '"' + (off ? ' disabled' : '') + ' aria-label="' + tx('Loading screen transparency', 'شفافية شاشة التحميل') + '">' +
          '<div class="md-up-ends"><span>' + tx('0% · solid', '0% · مصمتة') + '</span><button type="button" class="md-up-lnk" data-sppre="1"' + (off ? ' disabled' : '') + '>' + tx('Preview', 'معاينة') + '</button><span>80%</span></div></div>' +
        upSw('rm', tx('Reduce motion', 'تقليل الحركة'), tx('Holds all animations: splash, panes, aurora, buttons', 'يوقف كل الحركات: شاشة البداية واللوحات والشفق والأزرار'), OSRM ? ' · <span class="md-up-os">' + tx('On in your system settings', 'مفعّل في إعدادات نظامك') + '</span>' : '') +
        upRow(tx('Text size', 'حجم النص'), tx('Scales the page text', 'يكبّر أو يصغّر نص الصفحة'), upSeg('tx', [tx('S', 'ص'), tx('M', 'م'), tx('L', 'ك')], ['s', 'm', 'l'], U.text, tx('Text size', 'حجم النص'))) +
        upRow(tx('Density', 'الكثافة'), tx('Tighter cards and lists', 'بطاقات وقوائم أكثر إحكامًا'), upSeg('dn', [tx('Comfortable', 'مريح'), tx('Compact', 'مضغوط')], ['comfy', 'compact'], U.density, tx('Density', 'الكثافة'))) +
        (LANG === 'ar' ? upRow('الأرقام في العربية', 'أرقام لاتينية أو عربية هندية عندما تكون اللغة العربية', upSeg('nm', ['012', '٠١٢'], ['latin', 'arab'], U.nums, 'الأرقام في العربية')) : '') +
        upRow(tx('Dates', 'التواريخ'), tx('Hajj work runs on Hijri dates (Umm al-Qura)', 'أعمال الحج تسير بالتاريخ الهجري (أم القرى)'), upSeg('cl', [tx('Gregorian', 'ميلادي'), tx('Hijri', 'هجري')], ['greg', 'hijri'], U.cal, tx('Dates', 'التواريخ'))) +
        '<div class="md-up-lbl sect">' + tx('Contrast', 'التباين') + (custom ? ' <span class="md-up-cust">' + tx('Custom', 'مخصص') + '</span>' : '') + '</div>' +
        '<div class="md-up-row"><span class="md-up-lb"><b>' + tx('Contrast level', 'درجة التباين') + '</b><small>' + tx('More and High add borders, underlines, focus rings and solid surfaces', '«أعلى» و«عالٍ» يضيفان حدودًا وخطوطًا تحت الروابط وإطار تركيز وأسطحًا مصمتة') + '</small></span></div>' +
        upSeg('lv', [tx('Standard', 'قياسي'), tx('More', 'أعلى'), tx('High', 'عالٍ')], ['std', 'more', 'high'], U.level, tx('Contrast level', 'درجة التباين')).replace('md-up-ms', 'md-up-ms wide') +
        (U.level !== 'std' ? '<div class="md-up-row"><span class="md-up-lb"><b>' + tx('Contrast standard', 'مستوى التباين') + '</b><small>' + tx('AA keeps today’s colours, which already pass. AAA moves every text colour to at least 7:1 and borders to 3:1', 'AA يُبقي الألوان التي تجتاز أصلًا. AAA يرفع كل نص إلى 7:1 على الأقل والحدود إلى 3:1') + '</small></span></div>' +
          upSeg('tg', ['AA (4.5:1)', 'AAA (7:1)'], ['aa', 'aaa'], U.target, tx('Contrast standard', 'مستوى التباين')).replace('md-up-ms', 'md-up-ms wide') : '') +
        UTOG.map(function (k) { return upSw(k, TG[k][0], TG[k][1]); }).join('') +
        '<div class="md-up-row"><span class="md-up-lb"><b>' + tx('Keyboard shortcuts', 'اختصارات لوحة المفاتيح') + '</b><small>' + tx('Press ? anywhere', 'اضغط ? في أي مكان') + ' · <kbd>?</kbd></small></span><button type="button" class="md-up-b" data-kb="1">' + tx('Show', 'عرض') + '</button></div>' +
      '</div>' +
      '<div class="md-up-foot"><button type="button" class="md-up-b" data-go="#/sys/profile">' + tx('Profile', 'الملف الشخصي') + '</button><button type="button" class="md-up-b out" data-go="#/signin">' + I(ICO.out) + ' ' + tx('Sign out', 'تسجيل الخروج') + '</button></div>';
    var cd = upBox.querySelector('.md-up-card'); if (cd) cd.scrollTop = upTop;
    meBtn.setAttribute('aria-label', tx(ME.en, ME.ar)); meBtn.title = tx(ME.en, ME.ar);
    if (LANG === 'ar' && U.nums === 'arab') udWalk(upBox);
  }
  var upBack = null;
  function umOpen(on) {
    if (!pop || !meBtn) return; var was = !pop.hidden;
    if (on === was) return;
    meBtn.setAttribute('aria-expanded', String(on));
    if (on) { upBack = document.activeElement; drawer(false); pop.hidden = false; renderUM(); void pop.offsetWidth; pop.classList.add('on'); var f = upBox.querySelector('.md-up-x'); if (f) f.focus(); }
    else { pop.classList.remove('on'); setTimeout(function () { if (!pop.classList.contains('on')) pop.hidden = true; }, 220); if (upBack && upBack.focus && document.contains(upBack) && !upBack.closest('#pop')) upBack.focus(); }
  }
  on('meBtn', meBtn, 'click', function () { umOpen(pop.hidden); });
  on('#up-back', document.getElementById('up-back'), 'click', function () { umOpen(false); });
  on('upBox', upBox, 'click', function (e) {
    var b = e.target.closest('button'); if (!b || b.disabled) return;
    if (b.hasAttribute('data-close')) umOpen(false);
    else if (b.hasAttribute('data-go')) { umOpen(false); go(b.getAttribute('data-go')); }
    else if (b.hasAttribute('data-pal')) setPalette(b.getAttribute('data-pal'));
    else if (b.hasAttribute('data-th')) setTheme(b.getAttribute('data-th'));
    else if (b.hasAttribute('data-ln')) { if (b.getAttribute('data-ln') !== LANG) setLang(b.getAttribute('data-ln')); }
    else if (b.hasAttribute('data-kb')) kbOpen(true);
    else if (b.hasAttribute('data-preview')) busyPreview(false);
    else if (b.hasAttribute('data-sppre')) busyPreview(true);
    else if (b.classList.contains('md-up-sw')) { var k = b.getAttribute('data-k'); U[k] = !U[k]; udSave(); renderUM(); if (k === 'anim' && U.anim) busyPreview(false); }
    else { var M = { tx: 'text', dn: 'density', nm: 'nums', cl: 'cal', tg: 'target' }; for (var a in M) if (b.hasAttribute('data-' + a)) { U[M[a]] = b.getAttribute('data-' + a); udSave(); renderUM(); }
      if (b.hasAttribute('data-lv')) { U.level = b.getAttribute('data-lv'); UTOG.forEach(function (k) { U[k] = ULEV[U.level].indexOf(k) >= 0; }); udSave(); renderUM(); } }
    var same = b.getAttribute('data-k') || ''; var nb = same && upBox.querySelector('[data-k="' + same + '"]'); if (nb) nb.focus();
  });
  on('upBox', upBox, 'input', function (e) {
    if (e.target.id !== 'up-spt') return; U.splashT = +e.target.value; var o = document.getElementById('up-spv'); if (o) o.textContent = U.splashT + '%';
    document.documentElement.style.setProperty('--spt', (U.splashT / 100).toFixed(2)); document.documentElement.classList.toggle('ud-see', U.splashT > 0);
    busyPreview(true, true);
  });
  on('upBox', upBox, 'change', function (e) { if (e.target.id === 'up-spt') { udSave(); udApply(); } });
  on('upBox', upBox, 'keydown', function (e) {
    if (e.key === 'Escape') { e.stopPropagation(); umOpen(false); return; }
    if (e.key === 'Tab') { var F = [].slice.call(upBox.querySelectorAll('button:not([disabled]), input:not([disabled])')).filter(function (x) { return x.getClientRects().length; }), i = F.indexOf(document.activeElement); if (!F.length) return; e.preventDefault(); F[(i + (e.shiftKey ? F.length - 1 : 1) + F.length) % F.length].focus(); }
  });
  // the loading screen preview (and the live preview of its transparency: held while the slider moves)
  var pvT = 0;
  function busyPreview(see, hold) {
    var l = loading; if (!l) return; clearTimeout(pvT); clearTimeout(busy._t);
    if (!hold || !l.classList.contains('on')) { l.className = 'splash'; void l.offsetWidth; l.className = 'splash on quick pv'; }
    pvT = setTimeout(function () { l.classList.add('out'); busy._t = setTimeout(function () { l.className = 'splash'; }, 820); }, hold ? 1300 : 900);
  }

  // ---------- MAD-HSD-596 · keyboard shortcuts (by key position, so the Arabic layout works; letters never fire while typing) ----------
  var MAC = /Mac|iPhone|iPad/.test(navigator.platform), kbEl = document.getElementById('md-kb'), toastEl = document.getElementById('md-toast');
  var SC = [['search', 'gen', 'Ctrl+K | /', '⌘+K | /'], ['help', 'gen', '?', '?'], ['user', 'gen', 'Alt+U', '⌥+U'], ['close', 'gen', 'Esc', 'Esc'],
    ['home', 'go', 'G H', 'G H'], ['pil', 'go', 'G P', 'G P'], ['tasks', 'go', 'G T', 'G T'], ['emp', 'go', 'G E', 'G E'], ['bus', 'go', 'G B', 'G B'], ['set', 'go', 'G S', 'G S'],
    ['nw', 'page', 'N', 'N'], ['filt', 'page', 'F', 'F'], ['exp', 'page', 'E', 'E'], ['prn', 'page', 'P', 'P'], ['ptab', 'page', '[ | ]', '[ | ]'], ['ntab', 'page', 'Alt+1…9', '⌥+1…9'],
    ['jk', 'list', 'J | K', 'J | K'], ['open', 'list', 'Enter', 'Return'], ['pw', 'pane', 'Alt+[ | Alt+]', '⌥+[ | ⌥+]'], ['ps', 'pane', 'Ctrl+.', '⌘+.'], ['lang', 'disp', 'Alt+L', '⌥+L'], ['theme', 'disp', 'Alt+T', '⌥+T']];
  var SCL = { search: ['Quick search', 'البحث السريع'], help: ['Show shortcuts', 'عرض الاختصارات'], user: ['Open the user pane', 'فتح لوحة المستخدم'], close: ['Close the pane or menu', 'إغلاق اللوحة أو القائمة'],
    home: ['Home', 'الرئيسية'], pil: ['Pilgrims', 'الحجاج'], tasks: ['Tasks', 'المهام'], emp: ['Employees', 'الموظفون'], bus: ['Buses', 'الحافلات'], set: ['Settings', 'الإعدادات'],
    nw: ['New record on this page', 'سجل جديد في هذه الصفحة'], filt: ['Focus the filters', 'الانتقال إلى التصفية'], exp: ['Export', 'تصدير'], prn: ['Print', 'طباعة'], ptab: ['Previous / next layout tab', 'تبويب التخطيط السابق / التالي'], ntab: ['Layout tab 1…9', 'تبويب التخطيط 1…9'],
    jk: ['Next / previous row', 'الصف التالي / السابق'], open: ['Open the row', 'فتح الصف'], pw: ['Pane narrower / wider', 'تضييق / توسيع اللوحة'], ps: ['Pane settings', 'إعدادات اللوحة'], lang: ['Switch language', 'تبديل اللغة'], theme: ['Switch light / dark', 'فاتح / داكن'] };
  var SCG = { gen: ['General', 'عام'], go: ['Go to', 'انتقال إلى'], page: ['On a page', 'في الصفحة'], list: ['Lists', 'القوائم'], pane: ['Panes', 'اللوحات'], disp: ['Display', 'العرض'] };
  function keysHTML(s) { return s.split(' | ').map(function (part) { return part.split(' ').map(function (seq, i, a) { return seq.split('+').map(function (k) { return '<kbd>' + esc(k) + '</kbd>'; }).join('+') + (i < a.length - 1 ? ' <span>' + tx('then', 'ثم') + '</span> ' : ''); }).join(''); }).join(' <span>/</span> '); }
  function kbDraw() {
    if (!kbEl) return; var L = LANG === 'ar' ? 1 : 0;
    kbEl.setAttribute('aria-label', tx('Keyboard shortcuts', 'اختصارات لوحة المفاتيح'));
    kbEl.innerHTML = '<div class="md-kb-hd"><h4 id="kb-h">⌨ ' + tx('Keyboard shortcuts', 'اختصارات لوحة المفاتيح') + '</h4>' + upSeg('plat', [tx('Windows', 'ويندوز'), tx('Mac', 'ماك')], ['win', 'mac'], MAC ? 'mac' : 'win', tx('Keyboard', 'لوحة المفاتيح')) +
      '<button type="button" class="md-up-x" data-kbclose="1" aria-label="' + tx('Close', 'إغلاق') + '">×</button></div>' +
      '<div class="md-kb-cols">' + ['gen', 'go', 'page', 'list', 'pane', 'disp'].map(function (g) { return '<div class="md-kb-grp"><h5>' + SCG[g][L] + '</h5>' + SC.filter(function (s) { return s[1] === g; }).map(function (s) { return '<div class="md-kb-k"><span>' + SCL[s[0]][L] + '</span><span class="md-kb-ks">' + keysHTML(MAC ? s[3] : s[2]) + '</span></div>'; }).join('') + '</div>'; }).join('') + '</div>' +
      '<div class="md-kb-note">' + tx('Keys are matched by their position, so they work the same on the Arabic keyboard. Single-letter keys never fire while you type in a field.', 'تُطابق المفاتيح بموضعها، فتعمل بالطريقة نفسها على لوحة المفاتيح العربية. مفاتيح الحرف الواحد لا تعمل أثناء الكتابة في حقل.') + '</div>';
  }
  var kbBack = null;
  function kbOpen(on) {
    if (!kbEl) return; if (on) { kbBack = document.activeElement; kbDraw(); kbEl.hidden = false; var x = kbEl.querySelector('[data-kbclose]'); if (x) x.focus(); }
    else { kbEl.hidden = true; if (kbBack && kbBack.focus && document.contains(kbBack)) kbBack.focus(); }
  }
  on('#md-kb', kbEl, 'click', function (e) { var b = e.target.closest('button'); if (!b) return; if (b.hasAttribute('data-kbclose')) kbOpen(false); else if (b.hasAttribute('data-plat')) { MAC = b.getAttribute('data-plat') === 'mac'; kbDraw(); } });
  document.addEventListener('click', function (e) { if (kbEl && !kbEl.hidden && !kbEl.contains(e.target) && !e.target.closest('[data-kb]')) kbOpen(false); }, true);   // an outside click closes the list
  // MAD-HSD-600 · a page switch tab that is already showing (sign in "New design", Home "New home"): it says so, with a small pulse
  document.addEventListener('click', function (e) {
    var b = e.target.closest && e.target.closest('#stage .v2cmp button[aria-pressed="true"]'); if (!b) return;
    e.preventDefault(); e.stopPropagation(); b.classList.remove('md-pulse'); void b.offsetWidth; b.classList.add('md-pulse');
    toast('', tx('Already showing: ', 'معروض الآن: ') + b.textContent.trim());
  }, true);
  function toast(keys, msg) { if (!toastEl) return; toastEl.innerHTML = (keys ? keysHTML(keys) + ' ' : '') + esc(msg); toastEl.classList.add('on'); clearTimeout(toast.t); toast.t = setTimeout(function () { toastEl.classList.remove('on'); }, 1800); }
  var GO = { KeyH: ['#/hm', 'home'], KeyP: ['#/pg', 'pil'], KeyT: ['#/tsk', 'tasks'], KeyE: ['#/em', 'emp'], KeyB: ['#/ft/bus', 'bus'], KeyS: ['#/pf', 'set'] }, gWait = 0, kRow = -1;
  var vis = function (el) { var r = el.getBoundingClientRect(); return r.width > 0 && r.height > 0; };
  function btnByText(re) { return [].slice.call(stage.querySelectorAll('button, a')).filter(function (b) { return vis(b) && !b.disabled && !b.closest('[data-md-pane], aside, [role="dialog"]') && re.test((b.textContent || '').trim()); })[0]; }
  function pageRows() {   // the board's record roots ([data-md-row]); else table rows; else the row around each "Open …" button
    var D = [].slice.call(stage.querySelectorAll('[data-md-row]')).filter(function (r) { return vis(r) && !r.closest('[data-md-pane]'); }); if (D.length) return D;
    var R = [].slice.call(stage.querySelectorAll('tbody tr')).filter(function (r) { return vis(r) && !r.closest('[data-md-pane]'); });
    if (R.length) return R;
    var W = stage.getBoundingClientRect().width * .55;
    return [].slice.call(stage.querySelectorAll('button[title^="Open"], button[data-en-title^="Open"]')).filter(function (b) { return vis(b) && !b.closest('[data-md-pane]'); }).map(function (b) {
      for (var x = b.parentElement; x && x !== stage; x = x.parentElement) { if (x.getBoundingClientRect().width >= W) return x; } return b; }).filter(function (x, i, a) { return a.indexOf(x) === i; });
  }
  function layoutStep(n, abs) {
    var pp = parts(location.hash), f = P[pp[0]]; if (!f || !f.layouts || f.layouts.length < 2) return false;
    var cur = LET.indexOf(pp[2] || 'A'), nx = abs ? n : (cur + n + f.layouts.length) % f.layouts.length; if (nx < 0 || nx >= f.layouts.length) return false;
    go('#/' + pp[0] + '/' + (pp[1] || (f.ents[0] ? f.ents[0].key : '-')) + '/' + LET[nx]); toast(abs ? (MAC ? '⌥+' : 'Alt+') + (nx + 1) : (n > 0 ? ']' : '['), LET[nx] + ' · ' + (LANG === 'ar' ? (arOf(f.layouts[nx]) || f.layouts[nx]) : f.layouts[nx])); return true;
  }
  document.addEventListener('keydown', function (e) {
    if (e.defaultPrevented || e.isComposing) return;
    var c = e.code, mod = e.ctrlKey || e.metaKey, ae = document.activeElement, typingNow = ae && (ae.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(ae.tagName)), L = LANG === 'ar' ? 1 : 0;
    if (c === 'Escape' && kbEl && !kbEl.hidden) { e.preventDefault(); kbOpen(false); return; }
    if (mod && !e.altKey && c === 'Period') { e.preventDefault(); var o = psPanes()[0], g = o && o.grp.querySelector('md-pg'); if (g) psOpen(g); else toast(MAC ? '⌘+.' : 'Ctrl+.', tx('Open a side pane first', 'افتح لوحة جانبية أولًا')); return; }
    if (e.altKey && !mod) {
      if (c === 'KeyU') { e.preventDefault(); umOpen(pop.hidden); return; }
      if (c === 'KeyL') { e.preventDefault(); var nl = LANG === 'ar' ? 'en' : 'ar'; setLang(nl); toast(MAC ? '⌥+L' : 'Alt+L', SCL.lang[nl === 'ar' ? 1 : 0]); return; }
      if (c === 'KeyT') { e.preventDefault(); toggleTheme(); toast(MAC ? '⌥+T' : 'Alt+T', SCL.theme[L]); return; }
      var d = /^Digit([1-9])$/.exec(c); if (d && !typingNow) { if (layoutStep(+d[1] - 1, true)) e.preventDefault(); return; }
      return;
    }
    if (mod || typingNow) return;
    if (gWait && GO[c]) { e.preventDefault(); gWait = 0; go(GO[c][0]); toast('G ' + c.slice(3), SCL[GO[c][1]][L]); return; }
    gWait = 0;
    if (c === 'Slash' && e.shiftKey) { e.preventDefault(); kbOpen(kbEl.hidden); return; }
    if (app.classList.contains('full')) return;
    if (c === 'KeyG' && !e.shiftKey) { gWait = 1; setTimeout(function () { gWait = 0; }, 1500); toast('G', tx('Go to…', 'انتقال إلى…')); return; }
    if (c === 'KeyN') { var nb = [].slice.call(stage.querySelectorAll('[data-md-new]')).filter(vis)[0] || btnByText(/^\+\s|^New\b|^Add\b|جديد|^إضافة/); if (nb) { e.preventDefault(); nb.click(); toast('N', nb.textContent.trim()); } return; }
    if (c === 'KeyE') { var eb = btnByText(/^(Export|Excel|تصدير|إكسل)/); if (eb) { e.preventDefault(); eb.click(); toast('E', eb.textContent.trim()); } return; }
    if (c === 'KeyP') { var pb = btnByText(/^(Print|طباعة)/); if (pb) { e.preventDefault(); pb.click(); toast('P', pb.textContent.trim()); } return; }
    if (c === 'KeyF') { var fi = [].slice.call(stage.querySelectorAll('[data-md-filter] input, [data-md-filter] select')).filter(vis)[0] || [].slice.call(stage.querySelectorAll('[data-md-filter] button')).filter(vis)[0] || [].slice.call(stage.querySelectorAll('input[type="search"], input[type="text"], input:not([type]), select')).filter(function (x) { return vis(x) && !x.closest('header, [data-md-pane], aside'); })[0]; if (fi) { e.preventDefault(); fi.focus(); toast('F', SCL.filt[L]); } return; }
    if (c === 'BracketLeft' || c === 'BracketRight') { if (layoutStep(c === 'BracketRight' ? 1 : -1)) e.preventDefault(); return; }
    if (c === 'KeyJ' || c === 'KeyK') { var R = pageRows(); if (!R.length) return; e.preventDefault(); stage.querySelectorAll('[data-md-kbrow]').forEach(function (x) { x.removeAttribute('data-md-kbrow'); }); kRow = Math.max(0, Math.min(R.length - 1, kRow + (c === 'KeyJ' ? 1 : -1))); R[kRow].setAttribute('data-md-kbrow', ''); R[kRow].scrollIntoView({ block: 'nearest' }); return; }
    if (c === 'Enter' && kRow >= 0 && !(ae && ae.closest && ae.closest('button, a, [role="button"]'))) { var row = stage.querySelector('[data-md-kbrow]'); if (row) { e.preventDefault(); var ob = (row.hasAttribute('data-md-row') && !row.querySelector('button[title^="Open"], button[data-en-title^="Open"]') ? row : null) || row.querySelector('button[title^="Open"], button[data-en-title^="Open"], a') || row; ob.click(); toast('Enter', SCL.open[L]); } }
  });

  // ---------- MAD-HSD-575 · quick search: the header pill (Ctrl K or /) opens a centred dialog over the blurred page ----------
  // Pages and tabs first (pages, lists, layout tabs), then pilgrims, then records (flights, trips, buses, hotels): the sample data
  // of the dashboards (window.DBX), loaded the first time the dialog opens.
  var qp = document.getElementById('qp'), qpQ = document.getElementById('qp-q'), qpList = document.getElementById('qp-list'), qpFoot = document.getElementById('qp-foot'),
      qpRows = [], qpSel = 0, qpBack = null, DATA = null, dataP = null;
  var CITYAR = { Makkah: 'مكة المكرمة', Madinah: 'المدينة المنورة', Jeddah: 'جدة' };
  function ensureData() {
    if (dataP) return dataP;
    dataP = (window.DBX && window.DBX.ready ? Promise.resolve() : load('dbv')).then(function () {
      var X = window.DBX, D = { pil: [], rec: [] }; DATA = D; if (!X || !X.DS || !X.L) return;
      var L = X.L, DS = X.DS, hm = function (h) { var m = Math.round((h % 24) * 60); return ('0' + Math.floor(m / 60)).slice(-2) + ':' + ('0' + m % 60).slice(-2); };
      var cells = (DS.pil && DS.pil.cells) || [], step = Math.max(1, Math.floor(cells.length / 500));
      for (var i = 0; i < cells.length; i += step) { var c = cells[i]; try { var p = X.synth('pil', { co: L.CO[c.co].name, nat: c.nat, city: c.city, pkg: c.pkg }, i);
        D.pil.push({ t: p.name, sub: p.id + ' · ' + p.group + ' · ' + p.hotel, k: norm(p.name + ' ' + p.id + ' ' + p.passport + ' ' + p.group), icon: ICO.user, route: '#/pg' }); } catch (e) {} }
      ((DS.flt && DS.flt.cells) || []).forEach(function (f) { D.rec.push({ t: f.id, en: 'Flight · ' + f.dir + ' · ' + f.ap + ' · ' + hm(f.sch), ar: 'رحلة طيران · ' + (f.dir === 'Arrival' ? 'وصول' : 'مغادرة') + ' · ' + f.ap + ' · ' + hm(f.sch), k: norm(f.id + ' ' + f.ap + ' ' + f.airline + ' flight رحله طيران'), icon: ICO.plane, route: '#/fl/xfl' }); });
      ((DS.bus && DS.bus.cells) || []).forEach(function (b) { D.rec.push({ t: b.id, en: 'Bus · ' + b.plate + ' · ' + b.oper, ar: 'حافلة · ' + b.plate + ' · ' + b.oper, k: norm(b.id + ' ' + b.plate + ' ' + b.oper + ' ' + b.driver + ' bus حافله'), icon: ICO.bus, route: '#/ft/bus' }); });
      ((DS.trp && DS.trp.cells) || []).slice(0, 500).forEach(function (t) { D.rec.push({ t: t.id, en: 'Trip · ' + t.bus + ' · ' + hm(t.start), ar: 'رحلة نقل · ' + t.bus + ' · ' + hm(t.start), k: norm(t.id + ' ' + t.bus + ' ' + t.route + ' trip رحله نقل'), icon: ICO.route, route: '#/ft/trip' }); });
      Object.keys(L.HOT || {}).forEach(function (city) { L.HOT[city].forEach(function (h) { D.rec.push({ t: h, en: 'Hotel · ' + city, ar: 'فندق · ' + (CITYAR[city] || city), k: norm(h + ' ' + city + ' ' + (CITYAR[city] || '') + ' hotel فندق'), icon: ICO.hotel, route: '#/hp/hotel' }); }); });
    }).catch(function () { DATA = { pil: [], rec: [] }; });
    return dataP;
  }
  function score(r, q) { var t = norm(r.t); if (t.indexOf(q) === 0) return 4; if ((' ' + t).indexOf(' ' + q) >= 0) return 3; if (t.indexOf(q) >= 0) return 2; if (r.k && r.k.indexOf(q) >= 0) return 1.5; if (r.k2 && r.k2.indexOf(q) >= 0) return 1; return 0; }
  function find(list, q, n) { var out = []; list.forEach(function (r, i) { var s = score(r, q); if (s) out.push({ r: r, s: s - (r.lay ? 0.6 : 0), i: i }); }); out.sort(function (a, b) { return b.s - a.s || a.i - b.i; }); return out.slice(0, n).map(function (x) { return x.r; }); }
  function searches() { try { return JSON.parse(store('madar-searches') || '[]'); } catch (e) { return []; } }
  function qpText() {
    if (!qp || !qpQ || !qpFoot) return;
    qpQ.placeholder = tx('Search pages, pilgrims, trips, buses and hotels…', 'ابحث في الصفحات والحجاج والرحلات والحافلات والفنادق…');
    qpQ.setAttribute('aria-label', qpQ.placeholder);
    var K = function (k) { return '<kbd>' + k + '</kbd>'; };
    qpFoot.innerHTML = '<span class="md-keys">' + K('↑') + K('↓') + ' ' + tx('navigate', 'تنقّل') + ' · ' + K('↵') + ' ' + tx('open', 'فتح') + ' · ' + K('Tab') + ' ' + tx('next section', 'القسم التالي') + ' · ' + K('Esc') + ' ' + tx('close', 'إغلاق') + '</span>' +
      '<span class="md-qco">' + tx(ME.co + ' · ' + ME.se, ME.coAr + ' · ' + ME.seAr) + '</span>';
    if (!qp.hidden) qpDraw();
  }
  function row(r, sec) { r.sec = sec; qpRows.push(r); var i = qpRows.length - 1;
    return '<div class="md-qr" role="option" id="qp-r' + i + '" data-i="' + i + '"><span class="md-qi">' + IC(r.icon, 18) + '</span><span class="md-qt"><b>' + hl(r.t, r.q) + '</b><small>' + esc(r.sub) + '</small></span><span class="md-qo">' + tx('Open', 'فتح') + ' ↵</span></div>'; }
  function qpDraw() {
    if (!qpList || !qpQ) return;
    var raw = qpQ.value.trim(), q = norm(raw), h = '', sec = 0; qpRows = [];
    var head = function (t) { sec++; return '<div class="md-qh">' + esc(t) + '</div>'; };
    if (!q) {
      var rc = recents();
      if (rc.length) h += head(tx('Recent pages', 'الصفحات الأخيرة')) + rc.slice(0, 6).map(function (k) { var R = ROUTES[k]; return row({ t: R.t, sub: R.sub, icon: R.icon, route: k }, sec); }).join('');
      var ss = searches();
      h += ss.length ? '<div class="md-qss">' + ss.map(function (s) { return '<button type="button" class="md-chip" data-s="' + esc(s) + '">' + IC(ICO.search, 14) + '<span>' + esc(s) + '</span></button>'; }).join('') + '</div>'
        : '<div class="md-qnone">' + tx('No recent searches yet.', 'لا توجد عمليات بحث أخيرة بعد.') + '</div>';
      h += '<div class="md-qtip">' + tx('Type to search. Pages and tabs first, then pilgrims, then records.', 'اكتب للبحث. الصفحات والتبويبات أولاً، ثم الحجاج، ثم السجلات.') + '</div>';
    } else {
      var pg = find(INDEX, q, 8), pl = DATA ? find(DATA.pil, q, 5) : [], rec = DATA ? find(DATA.rec, q, 6) : [];
      if (pg.length) h += head(tx('Pages and tabs', 'الصفحات والتبويبات')) + pg.map(function (r) { return row({ t: r.t, sub: r.sub, icon: r.icon, route: r.route, q: q }, sec); }).join('');
      if (pl.length) h += head(tx('Pilgrims', 'الحجاج')) + pl.map(function (r) { return row({ t: r.t, sub: r.sub, icon: r.icon, route: r.route, q: q }, sec); }).join('');
      if (rec.length) h += head(tx('Records', 'السجلات')) + rec.map(function (r) { return row({ t: r.t, sub: tx(r.en, r.ar), icon: r.icon, route: r.route, q: q }, sec); }).join('');
      if (!DATA) h += '<div class="md-qnone">' + tx('Looking in pilgrims and records…', 'جارٍ البحث في الحجاج والسجلات…') + '</div>';
      else if (!qpRows.length) h += '<div class="md-qnone">' + esc(tx('Nothing matches “' + raw + '”.', 'لا توجد نتائج تطابق «' + raw + '».')) + '</div>';
    }
    qpList.innerHTML = h; qpSel = 0; qpMark(false);
  }
  function qpMark(scroll) {
    qpList.querySelectorAll('.md-qr').forEach(function (el) { var on = +el.getAttribute('data-i') === qpSel; el.classList.toggle('on', on); el.setAttribute('aria-selected', String(on)); if (on && scroll) el.scrollIntoView({ block: 'nearest' }); });
    if (qpRows.length) qpQ.setAttribute('aria-activedescendant', 'qp-r' + qpSel); else qpQ.removeAttribute('aria-activedescendant');
  }
  function qpOpenRow(i) {
    var r = qpRows[i]; if (!r) return; var raw = qpQ.value.trim();
    if (raw) store('madar-searches', JSON.stringify([raw].concat(searches().filter(function (s) { return s !== raw; })).slice(0, 6)));
    qpClose(true); go(r.route);
  }
  function qpOpen() {
    if (!qp || !qpQ || !qpList) return;
    if (app.classList.contains('full') || !qp.hidden) return;
    qpBack = document.activeElement; umOpen(false); drawer(false);
    qp.hidden = false; qpQ.value = ''; qpText(); qpDraw(); void qp.offsetWidth; qp.classList.add('on'); qpQ.focus();
    ensureData().then(function () { if (!qp.hidden && qpQ.value.trim()) qpDraw(); });
  }
  function qpClose(nav) {
    if (!qp) return;
    qp.classList.remove('on'); setTimeout(function () { if (!qp.classList.contains('on')) qp.hidden = true; }, 180);
    if (!nav && qpBack && qpBack.focus && document.contains(qpBack)) qpBack.focus(); else if (document.activeElement) document.activeElement.blur();
  }
  on('qpQ', qpQ, 'input', function () { qpDraw(); if (qpQ.value.trim() && !DATA) ensureData().then(function () { if (!qp.hidden) qpDraw(); }); });
  on('qpQ', qpQ, 'keydown', function (e) {
    var k = e.key, n = qpRows.length;
    if (k === 'Escape') { e.preventDefault(); e.stopPropagation(); if (qpQ.value) { qpQ.value = ''; qpDraw(); } else qpClose(); }
    else if (k === 'ArrowDown' || k === 'ArrowUp') { e.preventDefault(); if (n) { qpSel = (qpSel + (k === 'ArrowDown' ? 1 : n - 1)) % n; qpMark(true); } }
    else if (k === 'Enter') { e.preventDefault(); qpOpenRow(qpSel); }
    else if (k === 'Tab') { e.preventDefault(); if (!n) return; var s = qpRows[qpSel].sec, f = -1, i;
      if (!e.shiftKey) { for (i = qpSel + 1; i < n; i++) if (qpRows[i].sec !== s) { f = i; break; } if (f < 0) f = 0; }
      else { var ps = -1; for (i = qpSel - 1; i >= 0; i--) if (qpRows[i].sec !== s) { ps = qpRows[i].sec; break; } if (ps < 0) ps = qpRows[n - 1].sec; for (i = 0; i < n; i++) if (qpRows[i].sec === ps) { f = i; break; } }
      qpSel = f; qpMark(true); }
  });
  on('qpList', qpList, 'mousemove', function (e) { var r = e.target.closest('.md-qr'); if (r && +r.getAttribute('data-i') !== qpSel) { qpSel = +r.getAttribute('data-i'); qpMark(false); } });
  on('qpList', qpList, 'click', function (e) {
    var r = e.target.closest('.md-qr'); if (r) { qpOpenRow(+r.getAttribute('data-i')); return; }
    var s = e.target.closest('[data-s]'); if (s) { qpQ.value = s.getAttribute('data-s'); qpQ.focus(); qpDraw(); ensureData().then(function () { if (!qp.hidden) qpDraw(); }); }
  });
  on('#qp-back', document.getElementById('qp-back'), 'click', function () { qpClose(); });
  on('#qp-esc', document.getElementById('qp-esc'), 'click', function () { qpClose(); });
  var typing = function (el) { return el && (el.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(el.tagName)); };
  document.addEventListener('keydown', function (e) {
    if ((e.ctrlKey || e.metaKey) && !e.altKey && (e.key === 'k' || e.key === 'K' || e.code === 'KeyK')) { if (!qp) return; e.preventDefault(); if (qp.hidden) qpOpen(); else qpQ.focus(); return; }
    if ((e.code === 'Slash' || e.key === '/') && !e.shiftKey && !e.ctrlKey && !e.metaKey && !e.altKey && !typing(e.target) && qp && qp.hidden) {   // by key position: the Arabic layout too
      e.preventDefault(); if (flyIsOpen() && flyQ) { if (rail) rail.classList.remove('md-flyx'); flyQ.focus(); } else qpOpen();
    }
  });
  // the header pill: added next to the board's language button (the shell's own element, so the board's renderer replaces it,
  // never reuses it; it is put back at once)
  function pillHtml() {
    return '<svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><path d="' + ICO.search + '"></path></svg>' +
      '<span class="md-qs-t"><span class="md-qs-l">' + tx('Search pages, pilgrims, trips, buses and hotels…', 'ابحث في الصفحات والحجاج والرحلات والحافلات والفنادق…') + '</span><span class="md-qs-s">' + tx('Search pages, pilgrims, trips…', 'ابحث في الصفحات والحجاج والرحلات…') + '</span></span><kbd dir="ltr" data-no-tr title="' + tx('Keyboard shortcut', 'اختصار لوحة المفاتيح') + '">Ctrl K</kbd>';
  }
  function qsFit() {   // MAD-HSD-599 · the long hint only when it fits whole
    stage.querySelectorAll('md-qs').forEach(function (el) { var t = el.querySelector('.md-qs-t'), l = el.querySelector('.md-qs-l'); if (!t || !l) return;
      el.classList.remove('short'); var r = document.createRange(); r.selectNodeContents(l); var need = r.getBoundingClientRect().width; el.classList.toggle('short', need > t.clientWidth + 1); });
  }
  window.addEventListener('resize', function () { clearTimeout(qsFit._t); qsFit._t = setTimeout(qsFit, 120); });
  function pills() {
    stage.querySelectorAll('md-qs').forEach(function (el) { if (el.getAttribute('data-l') !== LANG) { el.setAttribute('data-l', LANG); el.setAttribute('aria-label', tx('Quick search', 'بحث سريع')); el.title = tx('Quick search', 'بحث سريع'); el.setAttribute('aria-keyshortcuts', 'Control+K'); el.setAttribute('data-key', 'Ctrl K'); el.innerHTML = pillHtml(); } }); qsFit();
  }
  function injectPill() {
    if (app.classList.contains('full')) return;
    var lang = stage.querySelector('[data-md="lang"]'); if (!lang || !lang.parentElement) return;
    var host = lang.parentElement; if (host.lastElementChild && host.lastElementChild.localName === 'md-qs') return;
    stage.querySelectorAll('md-qs').forEach(function (x) { x.remove(); });
    var el = document.createElement('md-qs'); el.className = 'md-qs'; el.setAttribute('role', 'button'); el.tabIndex = 0; el.setAttribute('data-no-tr', ''); el.setAttribute('aria-haspopup', 'dialog');
    el.setAttribute('data-l', LANG); el.setAttribute('aria-label', tx('Quick search', 'بحث سريع')); el.title = tx('Quick search', 'بحث سريع'); el.setAttribute('aria-keyshortcuts', 'Control+K'); el.setAttribute('data-key', 'Ctrl K'); el.innerHTML = pillHtml(); host.appendChild(el); qsFit(); setTimeout(qsFit, 400);
  }
  new MutationObserver(function () { injectPill(); markMenuBtn(); }).observe(stage, { childList: true, subtree: true });
  // the board's "Expand menu" button opens the shell menu: marked as a shell control (data-md="menu"), like lang, theme and bell
  function markMenuBtn() { stage.querySelectorAll(EXPAND).forEach(function (b) { if (!b.hasAttribute('data-md')) b.setAttribute('data-md', 'menu'); }); }
  // ---------- MAD-HSD-579 · notifications: one shared panel for the bell of every board (System v2.1, e/Home-Notifications) ----------
  // A board bell that does nothing itself (no click handler of its own) opens it; the bell gets the unread badge. Tabs All / Unread /
  // Assigned to me, grouped by day, unread marked, icon by type, Mark all as read, Open all notifications; an item opens its page.
  var NICO = { alert: 'M12 3l10 18H2zM12 10v5M12 18h.01', plane: 'M2 16l20-7-3-3-7 3-5-4-2 1 3 5-4 2-2-1-1 1 3 3z', task: 'M9 4h6v3H9zM6 6h12v15H6zM9 13l2 2 4-4',
    bed: 'M3 18V7M3 13h18v5M21 18v-3a3 3 0 0 0-3-3h-7v1M7 12a2 2 0 1 0 0-4 2 2 0 0 0 0 4', msg: 'M4 4h16v12H8l-4 4z', bus: 'M5 17V6a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v11zM5 11h14M7.5 20v-3M16.5 20v-3',
    key: 'M8 15a4 4 0 1 1 3.5-6H21v3h-2v3h-3v-3h-4.5A4 4 0 0 1 8 15z', gear: 'M12 3v3M12 18v3M3 12h3M18 12h3M5.6 5.6l2.1 2.1M16.3 16.3l2.1 2.1M5.6 18.4l2.1-2.1M16.3 7.7l2.1-2.1M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6' };
  var NOTI = [
    { id: 'n1', ty: 'bad', icon: 'alert', route: '#/iss', unread: true, today: true, mine: false,
      en: ['SOS from pilgrim Huda Mansour', 'Camp 14, Mina · fainted near tent 6. Medical team on the way.', '2 min ago', 'Issues and SOS'],
      ar: ['استغاثة من الحاجة Huda Mansour', 'المخيم 14، منى · أُغمي عليها قرب الخيمة 6. الفريق الطبي في الطريق.', 'قبل دقيقتين', 'البلاغات والاستغاثة'] },
    { id: 'n2', ty: 'info', icon: 'plane', route: '#/fl', unread: true, today: true, mine: false,
      en: ['Flight SV 806 lands 40 minutes late', '312 pilgrims · new arrival 04:20 at Jeddah North Terminal. Buses R2 and R3 told.', '18 min ago', 'Arrivals'],
      ar: ['تهبط الرحلة SV 806 متأخرة 40 دقيقة', '312 حاجًا · الوصول الجديد 04:20 في الصالة الشمالية بجدة. أُبلغت الحافلتان R2 وR3.', 'قبل 18 دقيقة', 'الوصول والمغادرة'] },
    { id: 'n3', ty: 'gold', icon: 'task', route: '#/tsk', unread: true, today: true, mine: true,
      en: ['Task assigned to you by Khalid Nasser', 'Check Mena camp 22 beds before Thursday.', '1 hour ago', 'Tasks'],
      ar: ['مهمة أسندها إليك Khalid Nasser', 'افحص أسرّة مخيم منى 22 قبل يوم الخميس.', 'قبل ساعة', 'المهام'] },
    { id: 'n4', ty: 'ok', icon: 'bed', route: '#/ih', unread: true, today: true, mine: false,
      en: ['Housing import finished', '1,246 pilgrims housed in Makkah hotels · 18 rows need a look.', '2 hours ago', 'Import housing'],
      ar: ['اكتمل استيراد التسكين', 'تسكين 1,246 حاجًا في فنادق مكة · 18 صفًا تحتاج إلى مراجعة.', 'قبل ساعتين', 'استيراد التسكين'] },
    { id: 'n5', ty: 'neu', icon: 'msg', route: '#/rq', unread: true, today: true, mine: false,
      en: ['Room change request R-20931 approved', 'Abdullah Al-Harbi · Makkah Hilton rooms 1412 and 1414.', '3 hours ago', 'Pilgrim requests'],
      ar: ['اعتُمد طلب تغيير الغرفة R-20931', 'Abdullah Al-Harbi · الغرفتان 1412 و1414 في Makkah Hilton.', 'قبل 3 ساعات', 'طلبات الحجاج'] },
    { id: 'n6', ty: 'neu', icon: 'bus', route: '#/ft/bus', unread: false, today: false, mine: false,
      en: ['Bus 17 back in service', 'Route R5 Aziziyah to Haram · driver Bilal Saleh.', 'Yesterday 21:40', 'Fleet and trips'],
      ar: ['عادت الحافلة 17 إلى الخدمة', 'المسار R5 من العزيزية إلى الحرم · السائق Bilal Saleh.', 'أمس 21:40', 'الأسطول والرحلات'] },
    { id: 'n7', ty: 'neu', icon: 'key', route: '#/us', unread: false, today: false, mine: true,
      en: ['Your access request was approved', 'Hotel plans · Edit, by Khalid Nasser.', 'Yesterday 16:05', 'Users'],
      ar: ['اعتُمد طلب الصلاحية الخاص بك', 'خطط الفنادق · تعديل، من Khalid Nasser.', 'أمس 16:05', 'المستخدمون'] }
  ];
  var nt = document.getElementById('nt'), ntBox = document.getElementById('nt-box'), ntTab = 0, ntBell = null, ntW = '';
  function ntRead() { try { return JSON.parse(store('madar-noti-read') || '{}'); } catch (e) { return {}; } }
  function ntUnread() { var r = ntRead(); return NOTI.filter(function (n) { return n.unread && !r[n.id]; }).length; }
  function ntLabel() { var u = ntUnread(); return tx('Notifications, ' + u + ' unread', 'الإشعارات، ' + u + ' غير مقروءة'); }
  function isBell(b) {
    if (!b || b.onclick || b.hasAttribute('data-h')) return false;   // a bell the board answers itself
    var l = b.getAttribute('aria-label') || b.getAttribute('title') || '';
    if (/^(Notifications|الإشعارات)$/.test(l.trim())) return true;
    var own = (b.textContent || '').replace(b.querySelector('md-nb') ? b.querySelector('md-nb').textContent : '', '').trim();   // an icon button only, never a row or card that shows a bell
    return !own && !!b.querySelector(':scope > svg path[d^="M6 8a6 6 0 1 1 12 0"]');
  }
  function setA(el, k, v) { if (el.getAttribute(k) !== v) el.setAttribute(k, v); }   // MAD-HSD-618 · no write (and no style invalidation or observer run) when the value is already right
  function ntBadges() {   // the unread count on every bell (the shell's own element, put back when the board redraws the button)
    if (!nt) return;
    var u = ntUnread();
    stage.querySelectorAll('button:has(> svg path[d^="M6 8a6 6 0 1 1 12 0"]), button[aria-label="Notifications"], button[aria-label="الإشعارات"]').forEach(function (b) {
      if (!isBell(b)) return;
      var nb = b.lastElementChild && b.lastElementChild.localName === 'md-nb' ? b.lastElementChild : null;
      if (!nb) { nb = document.createElement('md-nb'); nb.setAttribute('aria-hidden', 'true'); nb.setAttribute('data-no-tr', ''); b.appendChild(nb); }
      if (nb.textContent !== String(u)) nb.textContent = u; if (nb.hidden !== !u) nb.hidden = !u;
      setA(b, 'data-md-bell', ''); setA(b, 'data-md', 'bell'); setA(b, 'aria-haspopup', 'dialog');   /* a shell control (like lang and theme): not a board control */ setA(b, 'aria-expanded', String(!nt.hidden && ntBell === b));
    });
  }
  function ntDraw() {
    var r = ntRead(), u = ntUnread(), L = LANG === 'ar' ? 'ar' : 'en', last = null;
    var I = function (d, s) { return '<svg width="' + (s || 18) + '" height="' + (s || 18) + '" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="' + d + '"></path></svg>'; };
    var list = NOTI.filter(function (n) { var un = n.unread && !r[n.id]; return ntTab === 0 || (ntTab === 1 && un) || (ntTab === 2 && n.mine); });
    var tabs = [[tx('All', 'الكل'), 0], [tx('Unread · ', 'غير المقروءة · ') + u, 1], [tx('Assigned to me', 'المسندة إليّ'), 2]];
    ntBox.setAttribute('aria-label', tx('Notifications', 'الإشعارات'));
    // MAD-HSD-591 · the engine side pane, 1:1: header (icon tile, title, width presets, ×) with the tabs, the inner glass card, the footer
    var WB = [['third', 'M15 6h5v12h-5z', tx('Pane width: one third of the screen', 'عرض اللوحة: ثلث الشاشة')], ['two', 'M9.3 6H20v12H9.3z', tx('Pane width: two thirds of the screen', 'عرض اللوحة: ثلثا الشاشة')], ['seven', 'M6 6h14v12H6z', tx('Pane width: seven eighths of the screen', 'عرض اللوحة: سبعة أثمان الشاشة')]];
    ntBox.innerHTML =
      '<div class="md-nt-head"><div class="md-nt-hrow"><span class="md-nt-hic" aria-hidden="true">' + I('M6 8a6 6 0 1 1 12 0c0 7 3 9 3 9H3s3-2 3-9M10 21h4', 20) + '</span>' +
        '<div class="md-nt-ht"><h2 id="nt-h">' + tx('Notifications', 'الإشعارات') + '</h2><div>' + (u ? tx(u + ' unread', u + ' غير مقروءة') : tx('All read', 'كلها مقروءة')) + '</div></div>' +
        '<span class="md-nt-w" role="group" aria-label="' + tx('Pane width', 'عرض اللوحة') + '">' + WB.map(function (w) { return '<button type="button" data-w="' + w[0] + '" aria-pressed="' + (ntW === w[0]) + '" aria-label="' + w[2] + '" title="' + w[2] + '"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linejoin="round" aria-hidden="true"><path d="M3 5h18v14H3z"></path><path d="' + w[1] + '" fill="currentColor" stroke="none"></path></svg></button>'; }).join('') + '</span>' +
        '<button type="button" class="md-nt-x" data-nt="close" aria-label="' + tx('Close panel', 'إغلاق اللوحة') + '" title="' + tx('Close panel', 'إغلاق اللوحة') + '">×</button></div>' +
        '<div class="md-nt-tabs" role="tablist" aria-label="' + tx('Show', 'عرض') + '">' + tabs.map(function (t) { var on = ntTab === t[1]; return '<button type="button" role="tab" aria-selected="' + on + '"' + (on ? ' class="on"' : '') + ' data-tab="' + t[1] + '">' + esc(t[0]) + '</button>'; }).join('') + '</div></div>' +
      '<div class="md-nt-card">' +
      '<div class="md-nt-list">' + (list.length ? list.map(function (n) {
        var un = n.unread && !r[n.id], d = n.today ? tx('Today', 'اليوم') : tx('Earlier', 'سابقًا'), h = d !== last ? '<div class="md-nt-day">' + d + '</div>' : ''; last = d; var T = n[L];
        return h + '<button type="button" class="md-nt-it' + (un ? ' un' : '') + '" data-id="' + n.id + '"><span class="md-nt-ic t-' + n.ty + '">' + I(NICO[n.icon]) + '</span>' +
          '<span class="md-nt-tx"><b>' + esc(T[0]) + '</b><span>' + esc(T[1]) + '</span><small>' + esc(T[2]) + ' · ' + esc(T[3]) + '</small></span>' +
          (un ? '<i class="md-nt-dot" aria-label="' + tx('Unread', 'غير مقروء') + '"></i>' : '') + '</button>';
      }).join('') : '<div class="md-nt-none">' + tx('You\'re all caught up.', 'لا جديد، اطّلعت على كل شيء.') + '</div>') + '</div>' +
      '</div><div class="md-nt-foot"><button type="button" class="md-nt-open" data-nt="open">' + tx('Open all notifications', 'فتح كل الإشعارات') + '</button>' +
      '<button type="button" class="md-nt-all" data-nt="readall"' + (u ? '' : ' disabled') + '>' + tx('Mark all as read', 'تعليم الكل كمقروء') + '</button>' +
      '<button type="button" class="md-nt-set" data-nt="settings" aria-label="' + tx('Notification settings', 'إعدادات الإشعارات') + '" title="' + tx('Notification settings', 'إعدادات الإشعارات') + '">' + I(NICO.gear) + '</button></div>';
    ntBadges(); psSoon();
  }
  function ntPlace() { if (nt) nt.setAttribute('data-w', ntW); }   // MAD-HSD-588 · a side pane: its width preset (default, one third, two thirds)
  function ntFoc() { return [].slice.call(ntBox.querySelectorAll('button:not([disabled])')).filter(function (b) { return b.getClientRects().length; }); }   // focusable (the width presets are hidden on small windows)
  function ntOpen(bell) {
    if (!nt || !ntBox) return;
    if (!nt.hidden && ntBell === bell) { ntClose(); return; }
    umOpen(false); drawer(false); ntBell = bell || null; ntTab = 0;
    nt.hidden = false; ntDraw(); ntPlace(); void nt.offsetWidth; nt.classList.add('on'); burgerSoon();
    var f = ntFoc()[0]; if (f) f.focus();
  }
  function ntClose(nav) {
    if (!nt) return;
    nt.classList.remove('on'); var b = ntBell; ntBell = null; ntBadges(); burgerSoon();
    setTimeout(function () { if (!nt.classList.contains('on')) nt.hidden = true; }, 200);
    if (!nav && b && document.contains(b)) b.focus();
  }
  stage.addEventListener('click', function (e) {
    var b = e.target.closest('button'); if (!b || !isBell(b)) return;
    e.preventDefault(); e.stopPropagation(); ntOpen(b);
  }, true);
  on('ntBox', ntBox, 'click', function (e) {
    var b = e.target.closest('button'); if (!b) return; var r = ntRead();
    if (b.hasAttribute('data-tab')) { ntTab = +b.getAttribute('data-tab'); ntDraw(); var t = ntBox.querySelector('[data-tab="' + ntTab + '"]'); if (t) t.focus(); }
    else if (b.getAttribute('data-nt') === 'close') ntClose();
    else if (b.hasAttribute('data-w')) { ntW = ntW === b.getAttribute('data-w') ? '' : b.getAttribute('data-w'); ntPlace(); ntDraw(); var wb = ntBox.querySelector('[data-w="' + b.getAttribute('data-w') + '"]'); if (wb) wb.focus(); }
    else if (b.getAttribute('data-nt') === 'readall') { NOTI.forEach(function (n) { r[n.id] = true; }); store('madar-noti-read', JSON.stringify(r)); ntDraw(); var a = ntBox.querySelector('[data-tab="0"]'); if (a) a.focus(); }
    else if (b.getAttribute('data-nt') === 'open' || b.getAttribute('data-nt') === 'settings') { ntClose(true); go('#/msg'); }
    else if (b.hasAttribute('data-id')) { var id = b.getAttribute('data-id'), n = NOTI.filter(function (x) { return x.id === id; })[0]; r[id] = true; store('madar-noti-read', JSON.stringify(r)); ntClose(true); if (n) go(n.route); }
  });
  on('ntBox', ntBox, 'keydown', function (e) {
    if (e.key === 'Escape') { e.preventDefault(); e.stopPropagation(); ntClose(); return; }
    if (e.key === 'Tab') {   // focus stays in the panel
      var F = ntFoc(), i = F.indexOf(document.activeElement); if (!F.length) return;
      e.preventDefault(); F[(i + (e.shiftKey ? F.length - 1 : 1) + F.length) % F.length].focus();
    }
    if ((e.key === 'ArrowLeft' || e.key === 'ArrowRight') && e.target.getAttribute('role') === 'tab') {
      e.preventDefault(); var d = (e.key === 'ArrowRight' ? 1 : -1) * (LANG === 'ar' ? -1 : 1); ntTab = (ntTab + d + 3) % 3; ntDraw(); ntBox.querySelector('[data-tab="' + ntTab + '"]').focus();
    }
  });
  on('#nt-back', document.getElementById('nt-back'), 'click', function () { ntClose(); });
  window.addEventListener('resize', function () { if (!nt.hidden) ntPlace(); });
  on('.stage-wrap', document.querySelector('.stage-wrap'), 'scroll', function () { if (!nt.hidden) ntPlace(); }, { passive: true });
  new MutationObserver(function () { ntBadges(); }).observe(stage, { childList: true, subtree: true });
  // ---------- MAD-HSD-593 · pane settings (approved prototype proto/pane-settings.html): one ⚙ in every side pane's width pill ----------
  // The settings are saved on this device and apply to every side pane (engine aside.panel, D1 .dw, restored .dw.kp, dashboards,
  // notifications) through classes and CSS variables on <html>. A pane is any fixed box of the page that holds the width pill;
  // the dimmed layer behind it is any fixed box of the page that covers the window.
  var PSKEY = 'madar-pane-settings', PSDEF = { blur: true, glass: 28, scroll: false, tint: false, dock: false, outside: true, remember: false, still: false, compact: false, pos: 'end' };
  var PS = Object.assign({}, PSDEF); try { Object.assign(PS, JSON.parse(store(PSKEY) || '{}')); } catch (e) {}
  var psPop = document.getElementById('mp-pop'), psGear = null, psSeen = new WeakSet();
  var PSI = { gear: '<svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 7h10M18 7h2M4 17h4M12 17h8"></path><circle cx="16" cy="7" r="2.2"></circle><circle cx="10" cy="17" r="2.2"></circle></svg>' };
  var WGRP = '[role="group"]:has(> button svg path[d^="M15 6h5"]), [role="group"]:has(> dc-g > button svg path[d^="M15 6h5"]), [role="group"]:has(button svg path[d="M3 5h18v14H3zM15 5v14"]), [role="group"][aria-label="Pane width"], [role="group"][aria-label="عرض اللوحة"], [role="group"]:has(button svg rect[x="15"][y="6"]), .md-nt-w';
  function psSave() { store(PSKEY, JSON.stringify(PS)); }
  function rgbaH(h, a) { var n = parseInt(h.slice(1), 16); return 'rgba(' + (n >> 16 & 255) + ',' + (n >> 8 & 255) + ',' + (n & 255) + ',' + (+a).toFixed(3) + ')'; }
  function psFloat() { return PS.pos === 'float'; }
  function psApply() {   // classes and variables on <html>; the glass maths is the prototype's (28 = today's exact values)
    var de = document.documentElement, s = de.style, g = PS.glass, dark = THEME === 'dark', p = palOf(PALK), dir = LANG === 'ar' ? '270deg' : '90deg', f, fb, card, cardA;
    if (!dark) {
      var top = Math.max(0, 1 - g / 100), bot = top * (0.55 / 0.72); cardA = Math.min(1, Math.max(.8, 1 - .03 * g / 28));
      f = 'linear-gradient(180deg,rgba(255,255,255,' + top.toFixed(3) + '),rgba(255,255,255,' + bot.toFixed(3) + '))'; fb = 'rgba(255,255,255,' + Math.min(.95, .55 + top * .5).toFixed(3) + ')'; card = 'rgba(255,255,255,' + cardA.toFixed(3) + ')';
      if (PS.tint) { f = 'linear-gradient(' + dir + ',' + rgbaH(p.a, .30) + ',' + rgbaH(p.c, .20) + ' 55%,' + rgbaH(p.b, .28) + '),' + f; card = 'linear-gradient(' + dir + ',' + rgbaH(p.a, .07) + ',transparent 70%),' + card; fb = rgbaH(p.a, .55); }
    } else {
      var wTop = g <= 28 ? .13 : .13 * (1 - (g - 28) / 72 * .85), wBot = wTop * (.10 / .13), base = g < 28 ? (28 - g) / 28 * .9 : 0; cardA = Math.min(1, Math.max(.8, 1 - .03 * g / 28));
      f = 'linear-gradient(180deg,rgba(255,255,255,' + wTop.toFixed(3) + '),rgba(255,255,255,' + wBot.toFixed(3) + ')),rgba(26,20,10,' + base.toFixed(3) + ')'; fb = '#1A140AE6'; card = 'rgba(26,20,10,' + cardA.toFixed(3) + ')';
      if (PS.tint) { f = 'linear-gradient(' + dir + ',' + rgbaH(p.mid, .55) + ',' + rgbaH(p.deep, .35) + '),' + f; card = 'linear-gradient(' + dir + ',' + rgbaH(p.a, .08) + ',transparent 70%),' + card; fb = rgbaH(p.a, .30); }
    }
    s.setProperty('--mp-f', f); s.setProperty('--mp-fb', fb); s.setProperty('--mp-card', card);
    var C = { 'mp-glass': g !== PSDEF.glass || PS.tint, 'mp-noblur': !PS.blur, 'mp-scroll': PS.scroll && !(PS.dock && !psFloat()), 'mp-dock': PS.dock && !psFloat(), 'mp-still': PS.still, 'mp-compact': PS.compact, 'mp-pos-start': PS.pos === 'start', 'mp-pos-float': psFloat() };
    Object.keys(C).forEach(function (k) { de.classList.toggle(k, !!C[k]); });
    psDock(); if (typeof pfRestore === 'function') pfRestore();
  }
  function psPanes() {   // the open panes of the page (and the notifications pane)
    var out = [];
    stage.querySelectorAll(WGRP).forEach(function (g) {
      for (var x = g.parentElement; x && x !== stage; x = x.parentElement) { var cs = getComputedStyle(x); if (cs.position === 'fixed' && x.getBoundingClientRect().width > 200) { out.push({ pane: x, grp: g }); break; } }
    });
    if (nt && !nt.hidden && ntBox) { var gg = ntBox.querySelector('.md-nt-w'); if (gg) out.push({ pane: ntBox, grp: gg }); }
    // MAD-HSD-597 · panes without a width pill (only ×): found by their close button; the shell adds the pill (⅓ ⅔ ⅞ | ⚙)
    stage.querySelectorAll('button[aria-label="Close panel"], button[aria-label="إغلاق اللوحة"], button[aria-label="Close"], button[aria-label="إغلاق"]').forEach(function (xb) {
      var r0 = xb.getBoundingClientRect(); if (!r0.width || r0.width > 80) return;
      for (var x = xb.parentElement; x && x !== stage; x = x.parentElement) {
        var cs = getComputedStyle(x); if (cs.position !== 'fixed') continue;
        var R = x.getBoundingClientRect(); if (R.width < 260 || R.width > innerWidth - 20 || R.height < innerHeight * .5) break;
        if (out.some(function (o) { return o.pane === x; }) || x.querySelector(WGRP)) break;
        var host = xb.parentElement, pw = host.querySelector(':scope > md-pw');
        if (!pw) { pw = document.createElement('md-pw'); pw.setAttribute('role', 'group'); pw.setAttribute('data-no-tr', ''); pw.setAttribute('aria-label', tx('Pane width', 'عرض اللوحة'));
          pw.innerHTML = [['third', 'M15 6h5v12h-5z', tx('Pane width: one third of the screen', 'عرض اللوحة: ثلث الشاشة')], ['two', 'M9.3 6H20v12H9.3z', tx('Pane width: two thirds of the screen', 'عرض اللوحة: ثلثا الشاشة')], ['seven', 'M6 6h14v12H6z', tx('Pane width: seven eighths of the screen', 'عرض اللوحة: سبعة أثمان الشاشة')]].map(function (w) {
            return '<md-pwb role="button" tabindex="0" data-w="' + w[0] + '" aria-pressed="' + (x.getAttribute('data-md-pw') === w[0]) + '" title="' + w[2] + '" aria-label="' + w[2] + '"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linejoin="round" aria-hidden="true"><path d="M3 5h18v14H3z"></path><path d="' + w[1] + '" fill="currentColor" stroke="none"></path></svg></md-pwb>'; }).join('');
          host.appendChild(pw); }
        xb.setAttribute('data-md-x', '');
        out.push({ pane: x, grp: pw }); break;
      }
    });
    return out;
  }
  function pwSet(b) {   // a width preset of a shell-added pill
    var pane = b.parentElement; while (pane && getComputedStyle(pane).position !== 'fixed') pane = pane.parentElement; if (!pane) return;
    var w = pane.getAttribute('data-md-pw') === b.getAttribute('data-w') ? '' : b.getAttribute('data-w');
    if (w) pane.setAttribute('data-md-pw', w); else pane.removeAttribute('data-md-pw');
    b.parentElement.querySelectorAll('md-pwb').forEach(function (x) { x.setAttribute('aria-pressed', String(x.getAttribute('data-w') === w)); });
    setTimeout(psDock, 400);
  }
  document.addEventListener('click', function (e) { var b = e.target.closest && e.target.closest('md-pwb'); if (b) { e.preventDefault(); e.stopPropagation(); pwSet(b); psRemember(b.parentElement); } }, true);
  document.addEventListener('keydown', function (e) { var b = e.target.closest && e.target.closest('md-pwb'); if (b && (e.key === 'Enter' || e.key === ' ')) { e.preventDefault(); pwSet(b); } }, true);
  // MAD-HSD-597 · a flat pane (opaque, no blur) gets the double-glass standard: frosted frame and an inner card
  function psFlat(pane) {
    if (pane.hasAttribute('data-md-flat') || pane.hasAttribute('data-md-glassok') || pane === ntBox) return;
    var cs = getComputedStyle(pane), m = /rgba?\(([^)]+)\)/.exec(cs.backgroundColor), a = m ? (m[1].split(',')[3] == null ? 1 : +m[1].split(',')[3]) : 0;
    if (/blur/.test(cs.backdropFilter || cs.webkitBackdropFilter || '') || (a < .9 && cs.backgroundImage === 'none')) { pane.setAttribute('data-md-glassok', ''); return; }
    pane.setAttribute('data-md-flat', '');
    if (!pane.querySelector('[data-md-pcard]')) {   // the body becomes the inner card: the tallest part between the header and the footer
      var kids = [].slice.call(pane.children), best = null, bh = 0, xb = pane.querySelector('[data-md-x], md-pg');
      for (var i = 0; i < kids.length; i++) { var k = kids[i]; if (getComputedStyle(k).display === 'contents') { kids = kids.concat([].slice.call(k.children)); continue; } var h = k.getBoundingClientRect().height; if (h > bh && !(xb && k.contains(xb))) { best = k; bh = h; } }
      if (best && bh > Math.max(120, pane.getBoundingClientRect().height * .45)) { best.setAttribute('data-md-pcard', ''); best.setAttribute('data-md-cardadd', ''); }
      else pane.setAttribute('data-md-cardbg', '');   // the body is several parts: a card drawn behind them (md-pcard, below)
    }
  }
  function psCardBg(pane) {   // the inner card behind a body made of several parts: from under the header to above the footer
    if (!pane.hasAttribute('data-md-cardbg')) return;
    var R = pane.getBoundingClientRect(), kids = [].slice.call(pane.children), flat = [];
    for (var i = 0; i < kids.length; i++) { var k = kids[i]; if (k.localName === 'md-pcard') continue; if (getComputedStyle(k).display === 'contents') { kids = kids.concat([].slice.call(k.children)); continue; } var r = k.getBoundingClientRect(); if (r.height) flat.push({ k: k, r: r }); }
    if (!flat.length) return; flat.sort(function (a, b) { return a.r.top - b.r.top; });
    var head = flat.filter(function (o) { return o.k.querySelector('[data-md-x], md-pg, md-pw'); })[0], top = head ? head.r.bottom - R.top + 4 : 12;
    var last = flat[flat.length - 1], foot = last.k.querySelector('button') && last.r.height < 110 && last !== head ? last : null, bottom = foot ? R.bottom - foot.r.top + 6 : 12;
    var c = pane.querySelector(':scope > md-pcard'); if (!c) { c = document.createElement('md-pcard'); c.setAttribute('aria-hidden', 'true'); pane.appendChild(c); }
    var st = 'top:' + Math.round(top) + 'px;bottom:' + Math.round(bottom) + 'px'; if (c.getAttribute('style') !== st) c.setAttribute('style', st);
  }
  function psCard(pane) {   // the inner glass card: the biggest direct child with its own background
    var best = null, bh = 0, H = pane.getBoundingClientRect().height, kids = [].slice.call(pane.children);
    for (var i = 0; i < kids.length; i++) { var k = kids[i], cs = getComputedStyle(k); if (cs.display === 'contents') { kids = kids.concat([].slice.call(k.children)); continue; }
      var m = /rgba?\(([^)]+)\)/.exec(cs.backgroundColor), a = m ? (m[1].split(',')[3] == null ? 1 : +m[1].split(',')[3]) : 0, h = k.getBoundingClientRect().height;
      if (a > .5 && h > H * .4 && h > bh) { best = k; bh = h; } }
    return best;
  }
  var psT = 0;
  function psScan() {
    psT = 0;
    var list = psPanes(), open = false;
    list.forEach(function (o) {
      var pane = o.pane, g = o.grp; open = true;
      if (!pane.hasAttribute('data-md-pane')) pane.setAttribute('data-md-pane', '');
      if (!psSeen.has(pane)) { psSeen.add(pane); var c = psCard(pane); if (c) c.setAttribute('data-md-pcard', ''); if (PS.remember) psRecall(g); }
      psFlat(pane); psCardBg(pane);
      if (!(g.lastElementChild && g.lastElementChild.localName === 'md-pg')) {   // the ⚙ (the shell's own element, after a divider)
        g.querySelectorAll('md-pg, md-pgd').forEach(function (x) { x.remove(); });
        var d = document.createElement('md-pgd'); d.setAttribute('aria-hidden', 'true'); g.appendChild(d);
        var b = document.createElement('md-pg'); b.setAttribute('role', 'button'); b.tabIndex = 0; b.setAttribute('data-no-tr', ''); b.setAttribute('aria-haspopup', 'dialog');
        b.setAttribute('aria-expanded', 'false'); b.title = tx('Pane settings', 'إعدادات اللوحة'); b.setAttribute('aria-label', b.title); b.innerHTML = PSI.gear; g.appendChild(b);
      }
      // the dimmed layer: a fixed box of the page that covers the window, next to the pane
      var par = pane.parentElement; for (var up = 0; par && up < 3; up++, par = par.parentElement) {
        [].forEach.call(par.children, function (x) { if (x === pane || x.hasAttribute('data-md-scrim') || x.contains(pane)) return; var r = x.getBoundingClientRect(), cs = getComputedStyle(x); if (/fixed|absolute/.test(cs.position) && +cs.zIndex >= 10 && r.width >= innerWidth * .6 && r.height >= innerHeight * .8 && !x.children.length) x.setAttribute('data-md-scrim', ''); });
      }
    });
    if (nt && ntBox) { ntBox.setAttribute('data-md-pane', ''); var nb = document.getElementById('nt-back'); if (nb) nb.setAttribute('data-md-scrim', ''); }
    document.documentElement.classList.toggle('mp-open', open);
    psDock(); pfHeads(); if (open && psFloat()) pfRestore();
    if (psGear && !document.contains(psGear)) {   // the board redrew its pill: the popover stays, on the new gear
      var ng = list.length ? list[0].grp.querySelector('md-pg') : null;
      if (ng) { psGear = ng; ng.setAttribute('aria-expanded', 'true'); } else psClose();
    }
  }
  function psSoon() { if (!psT) psT = requestAnimationFrame(psScan); }
  function psDock() {   // dock: the page narrows by the open pane's width (wide windows, not floating)
    var de = document.documentElement, w = 0;
    if (PS.dock && !psFloat() && window.innerWidth > 820) { var o = psPanes()[0]; if (o) w = Math.round(o.pane.getBoundingClientRect().width) + 16; }
    if (de.style.getPropertyValue('--mp-dockw') === w + 'px') return;
    de.style.setProperty('--mp-dockw', w + 'px'); de.classList.toggle('mp-docked', !!w);
    setTimeout(function () { window.dispatchEvent(new Event('resize')); }, 380);   // the page re-fits to its new width
  }
  function psNs() { return parts(location.hash)[0] || ''; }
  function psWBtns(g) { return [].slice.call(g.querySelectorAll('button, md-pwb')).filter(function (b) { return !b.closest('md-pg'); }).slice(0, 3); }
  function psRecall(g) {
    var m = {}; try { m = JSON.parse(store('madar-pane-width') || '{}'); } catch (e) {}
    var i = m[psNs()], B = psWBtns(g); if (i == null || i < 0 || !B[i] || B[i].getAttribute('aria-pressed') === 'true') return;
    setTimeout(function () { B[i].click(); }, 30);
  }
  function psRemember(g) {
    if (!PS.remember) return;
    setTimeout(function () { var B = psWBtns(g), i = -1; B.forEach(function (b, j) { if (b.getAttribute('aria-pressed') === 'true') i = j; }); var m = {}; try { m = JSON.parse(store('madar-pane-width') || '{}'); } catch (e) {} m[psNs()] = i; store('madar-pane-width', JSON.stringify(m)); }, 80);
  }
  function psStep(dir) {   // Alt+[ and Alt+]: default → ⅓ → ⅔ → ⅞
    var o = psPanes()[0]; if (!o) return false; var B = psWBtns(o.grp), i = -1; B.forEach(function (b, j) { if (b.getAttribute('aria-pressed') === 'true') i = j; });
    var n = Math.max(-1, Math.min(B.length - 1, i + dir)); if (n === i) return true;
    if (n === -1) B[i].click(); else B[n].click(); return true;
  }
  // the popover
  function psRow(k, label, hint, dis, why) {
    return '<div class="mp-row' + (dis ? ' dis' : '') + '"><span class="mp-lb"><b>' + esc(label) + '</b><small>' + esc(dis && why ? why : hint) + '</small></span>' +
      '<button type="button" class="mp-sw" role="switch" data-k="' + k + '" aria-checked="' + (!!PS[k] && !dis) + '"' + (dis ? ' disabled' : '') + ' aria-label="' + esc(label) + '"></button></div>';
  }
  function psDraw() {
    if (!psPop) return;
    var fl = psFloat(), dockOn = PS.dock && !fl, noBack = (PS.scroll && !dockOn) || dockOn;
    var P3 = [['end', tx('End', 'النهاية')], ['start', tx('Start', 'البداية')], ['float', tx('Floating', 'عائم')]];
    psPop.setAttribute('aria-label', tx('Pane settings', 'إعدادات اللوحة'));
    psPop.innerHTML =
      '<h4>' + PSI.gear + ' ' + tx('Pane settings', 'إعدادات اللوحة') + '</h4><p class="mp-sub">' + tx('For every side pane · saved on this device', 'لكل اللوحات الجانبية · تُحفظ على هذا الجهاز') + '</p>' +
      '<div class="mp-sec">' + tx('Look', 'المظهر') + '</div>' +
      '<div class="mp-sl"><div class="mp-top"><b>' + tx('Glass transparency', 'شفافية الزجاج') + '</b><output id="mp-gv">' + PS.glass + '%</output></div>' +
        '<input type="range" id="mp-glass" min="0" max="90" step="1" value="' + PS.glass + '" aria-label="' + tx('Glass transparency', 'شفافية الزجاج') + '">' +
        '<div class="mp-ends"><span>' + tx('Solid', 'معتم') + '</span><button type="button" data-gdef="1">' + tx('Default', 'الافتراضي') + ' · 28%</button><span>' + tx('Clear', 'شفاف') + '</span></div></div>' +
      psRow('tint', tx('Colour the glass', 'تلوين الزجاج'), tx('Tints the pane with the palette colours', 'يصبغ اللوحة بألوان لوحة الألوان الحالية')) +
      '<div class="mp-row mp-posrow"><span class="mp-lb"><b>' + tx('Pane position', 'موضع اللوحة') + '</b><small>' + tx('Floating: a card with margins, centred', 'عائم: بطاقة بهوامش في الوسط') + '</small></span>' +
        '<span class="mp-ms" role="radiogroup" aria-label="' + tx('Pane position', 'موضع اللوحة') + '">' + P3.map(function (x) { var on = PS.pos === x[0]; return '<button type="button" role="radio" aria-checked="' + on + '" data-pos="' + x[0] + '"' + (on ? ' class="on"' : '') + '>' + esc(x[1]) + '</button>'; }).join('') + '</span></div>' +
      '<div class="mp-sec">' + tx('Page behind the pane', 'الصفحة خلف اللوحة') + '</div>' +
      psRow('blur', tx('Blur the page behind', 'تمويه الصفحة خلف اللوحة'), tx('Off: the page stays sharp, only dimmed', 'عند الإيقاف: تبقى الصفحة واضحة مع تعتيم فقط'), noBack, tx('Not used while the page scrolls or the pane is docked', 'غير مستخدم أثناء تمرير الصفحة أو تثبيت اللوحة')) +
      psRow('scroll', tx('Scroll the page while the pane is open', 'تمرير الصفحة واللوحة مفتوحة'), tx('No dim; the page stays clickable, and clicking a row opens it here', 'بدون تعتيم، وتبقى الصفحة قابلة للنقر؛ النقر على صف يفتحه هنا'), dockOn, tx('Not used while the pane is docked', 'غير مستخدم أثناء تثبيت اللوحة')) +
      '<div class="mp-sec">' + tx('More', 'المزيد') + '</div>' +
      psRow('dock', tx('Dock beside the page', 'تثبيت اللوحة بجانب الصفحة'), tx('The page narrows to make room; nothing is covered (wide screens)', 'تضيق الصفحة لتفسح المجال ولا يُغطّى شيء (الشاشات العريضة)'), fl, tx('Not used while the pane is floating', 'غير مستخدم أثناء تعويم اللوحة')) +
      psRow('outside', tx('Close when clicking outside', 'الإغلاق عند النقر خارج اللوحة'), tx('Off: only × or Esc closes, so a half-filled form is safe', 'عند الإيقاف: يُغلق فقط بـ × أو Esc، فلا يضيع نموذج غير مكتمل'), noBack, tx('Not used while the page scrolls or the pane is docked', 'غير مستخدم أثناء تمرير الصفحة أو تثبيت اللوحة')) +
      psRow('remember', tx('Remember the width on each page', 'تذكّر العرض في كل صفحة'), tx('Reopens at the width you last chose here', 'تُفتح بآخر عرض اخترته في هذه الصفحة')) +
      psRow('still', tx('Reduce motion', 'تقليل الحركة'), tx('The pane appears without sliding', 'تظهر اللوحة بدون انزلاق')) +
      psRow('compact', tx('Compact', 'مضغوط'), tx('Tighter spacing to see more fields', 'مسافات أقل لرؤية حقول أكثر')) +
      '<div class="mp-kbd">' + tx('Shortcuts:', 'اختصارات:') + ' <kbd>Esc</kbd> ' + tx('close', 'إغلاق') + ' · <kbd>Alt</kbd>+<kbd>[</kbd> <kbd>]</kbd> ' + tx('change width', 'تغيير العرض') + '</div>' +
      '<div class="mp-ft"><small>✓ ' + tx('Saved on this device', 'محفوظة على هذا الجهاز') + '</small><button type="button" class="mp-b" data-reset="1">↺ ' + tx('Reset to defaults', 'استعادة الافتراضي') + '</button></div>';
  }
  function psPlace() {
    if (!psPop || !psGear) return; var pane = psGear.closest('[data-md-pane]'); if (!pane) return;
    var R = pane.getBoundingClientRect(), G = psGear.getBoundingClientRect(), W = Math.min(384, R.width - 24), top = G.bottom + 10, st = psPop.style;
    if (window.innerWidth <= 600) { st.left = (R.left + 12) + 'px'; st.width = (R.width - 24) + 'px'; }
    else { st.width = W + 'px'; st.left = (LANG === 'ar' ? R.left + 14 : R.right - 14 - W) + 'px'; }
    st.top = top + 'px'; st.maxHeight = Math.max(200, R.bottom - top - 14) + 'px';
  }
  function psOpen(gear) {
    if (!psPop) return; if (psGear === gear && !psPop.hidden) { psClose(); return; }
    psGear = gear; gear.setAttribute('aria-expanded', 'true'); psDraw(); psPop.hidden = false; psPlace();
    psPop.classList.remove('anim'); void psPop.offsetWidth; psPop.classList.add('anim');
    var f = psPop.querySelector('input, button:not([disabled])'); if (f) f.focus();
  }
  function psClose(back) {
    if (!psPop || psPop.hidden) return; psPop.hidden = true;
    if (psGear) { psGear.setAttribute('aria-expanded', 'false'); if (back && document.contains(psGear)) psGear.focus(); } psGear = null;
  }
  function psSet(k, v) {
    PS[k] = v; if (k === 'dock' && v) PS.scroll = false; if (k === 'pos' && v === 'float') PS.dock = false;
    psSave(); psApply(); psDraw(); psPlace();
  }
  document.addEventListener('click', function (e) {   // the ⚙ (in page panes and the notifications pane)
    var g = e.target.closest('md-pg'); if (g) { e.preventDefault(); e.stopPropagation(); psOpen(g); return; }
    if (psPop && !psPop.hidden && !e.target.closest('#mp-pop')) psClose();
  }, true);
  document.addEventListener('keydown', function (e) {
    var g = e.target.closest && e.target.closest('md-pg');
    if (g && (e.key === 'Enter' || e.key === ' ')) { e.preventDefault(); psOpen(g); return; }
    if (e.key === 'Escape' && psPop && !psPop.hidden) { e.preventDefault(); e.stopPropagation(); psClose(true); return; }
    if (e.altKey && (e.key === '[' || e.key === ']' || e.code === 'BracketLeft' || e.code === 'BracketRight')) { if (psStep(e.key === ']' || e.code === 'BracketRight' ? 1 : -1)) e.preventDefault(); }
  }, true);
  on('#mp-pop', psPop, 'click', function (e) {
    var b = e.target.closest('button'); if (!b || b.disabled) return;
    if (b.classList.contains('mp-sw')) { var k = b.getAttribute('data-k'); psSet(k, !PS[k]); var nb = psPop.querySelector('[data-k="' + k + '"]'); if (nb) nb.focus(); }
    else if (b.hasAttribute('data-pos')) { psSet('pos', b.getAttribute('data-pos')); var pb = psPop.querySelector('[data-pos="' + PS.pos + '"]'); if (pb) pb.focus(); }
    else if (b.hasAttribute('data-gdef')) { psSet('glass', PSDEF.glass); }
    else if (b.hasAttribute('data-reset')) { PS = Object.assign({}, PSDEF); psSave(); psApply(); psDraw(); psPlace(); }
  });
  on('#mp-pop', psPop, 'input', function (e) { if (e.target.id === 'mp-glass') { PS.glass = +e.target.value; var o = document.getElementById('mp-gv'); if (o) o.textContent = PS.glass + '%'; psApply(); } });
  on('#mp-pop', psPop, 'change', function (e) { if (e.target.id === 'mp-glass') psSave(); });
  // the dimmed layer: no closing on an outside click when the user turned it off
  document.addEventListener('click', function (e) {
    if (PS.outside) return; var s = e.target.closest('[data-md-scrim]'); if (!s) return;
    e.preventDefault(); e.stopPropagation();
  }, true);
  // a width button: remembered for this page (when on); the dock follows the new width
  document.addEventListener('click', function (e) {
    var g = e.target.closest(WGRP); if (!g || e.target.closest('md-pg')) return;
    psRemember(g); setTimeout(psDock, 400); setTimeout(function () { if (psGear) psPlace(); }, 400);
  });
  new MutationObserver(function () { psSoon(); }).observe(stage, { childList: true, subtree: true });
  if (nt) new MutationObserver(function () { psSoon(); }).observe(nt, { attributes: true, attributeFilter: ['hidden'] });
  window.addEventListener('resize', function () { psDock(); if (psGear) psPlace(); });
  // floating: the pane is dragged by its header (mouse and touch), kept 8px inside the window; the last place is saved as a share of
  // the window (start offset, so Arabic mirrors); double-click recentres; arrow keys on the focused header nudge it 8px (Shift ×5)
  var PFKEY = 'madar-pane-float', pfDrag = null;
  function pfOn() { return psFloat() && window.innerWidth > 820; }
  function pfPane() { var o = psPanes()[0]; return o ? o.pane : null; }
  function pfHead(pane, y) { var R = pane.getBoundingClientRect(); return y - R.top < 64; }
  function pfSet(start, top, pane, save) {
    var R = pane ? pane.getBoundingClientRect() : { width: 580, height: window.innerHeight - 96 };
    start = Math.max(8, Math.min(window.innerWidth - R.width - 8, start)); top = Math.max(8, Math.min(window.innerHeight - R.height - 8, top));
    var s = document.documentElement.style; s.setProperty('--mp-fx', Math.round(start) + 'px'); s.setProperty('--mp-fy', Math.round(top) + 'px');
    document.documentElement.classList.add('mp-fpos');
    if (save) store(PFKEY, JSON.stringify({ s: +(start / window.innerWidth * 100).toFixed(2), t: +(top / window.innerHeight * 100).toFixed(2) }));
    if (psGear) psPlace();
  }
  function pfRestore() {
    var v = null; try { v = JSON.parse(store(PFKEY) || 'null'); } catch (e) {}
    if (!v || !pfOn()) { document.documentElement.classList.remove('mp-fpos'); return; }
    pfSet(v.s / 100 * window.innerWidth, v.t / 100 * window.innerHeight, pfPane(), false);
  }
  function pfStartOf(R) { return LANG === 'ar' ? window.innerWidth - R.right : R.left; }
  document.addEventListener('pointerdown', function (e) {
    if (!pfOn() || e.button > 0) return; var pane = e.target.closest('[data-md-pane]'); if (!pane || !pfHead(pane, e.clientY)) return;
    if (e.target.closest('button, a, input, select, textarea, [role="tab"], [role="group"], md-pg, [contenteditable]')) return;
    var R = pane.getBoundingClientRect(); pfDrag = { pane: pane, x: e.clientX, y: e.clientY, s: pfStartOf(R), t: R.top, moved: false };
    document.documentElement.classList.add('mp-dragging'); e.preventDefault();
  }, true);
  document.addEventListener('pointermove', function (e) {
    if (pfDrag) { var dx = (e.clientX - pfDrag.x) * (LANG === 'ar' ? -1 : 1), dy = e.clientY - pfDrag.y; if (Math.abs(dx) + Math.abs(dy) > 2) pfDrag.moved = true; pfSet(pfDrag.s + dx, pfDrag.t + dy, pfDrag.pane, false); return; }
    if (!pfOn()) { document.documentElement.classList.remove('mp-grab'); return; }
    var pane = e.target.closest && e.target.closest('[data-md-pane]');
    document.documentElement.classList.toggle('mp-grab', !!pane && pfHead(pane, e.clientY) && !e.target.closest('button, a, input, select, textarea, [role="tab"], [role="group"], md-pg'));
  }, { passive: true });
  document.addEventListener('pointerup', function () {
    if (!pfDrag) return; var R = pfDrag.pane.getBoundingClientRect(); if (pfDrag.moved) pfSet(pfStartOf(R), R.top, pfDrag.pane, true);
    pfDrag = null; document.documentElement.classList.remove('mp-dragging');
  });
  document.addEventListener('dblclick', function (e) {
    if (!pfOn()) return; var pane = e.target.closest('[data-md-pane]'); if (!pane || !pfHead(pane, e.clientY) || e.target.closest('button, a, input, [role="tab"], md-pg')) return;
    var R = pane.getBoundingClientRect(); pfSet((window.innerWidth - R.width) / 2, (window.innerHeight - R.height) / 2, pane, true);
  });
  document.addEventListener('keydown', function (e) {
    var h = e.target.closest && e.target.closest('[data-md-phead]'); if (!h || !pfOn() || !/^Arrow/.test(e.key)) return;
    var pane = h.closest('[data-md-pane]'); if (!pane) return; e.preventDefault();
    var d = e.shiftKey ? 40 : 8, R = pane.getBoundingClientRect(), s = pfStartOf(R), t = R.top, phys = e.key === 'ArrowLeft' ? -1 : e.key === 'ArrowRight' ? 1 : 0;
    s += phys * d * (LANG === 'ar' ? -1 : 1); if (e.key === 'ArrowUp') t -= d; if (e.key === 'ArrowDown') t += d;
    pfSet(s, t, pane, true);
  });
  function pfHeads() {   // the header of a floating pane can take focus (for the arrow keys)
    psPanes().forEach(function (o) { var h = o.pane.firstElementChild; while (h && getComputedStyle(h).display === 'contents') h = h.firstElementChild;
      if (h && !h.hasAttribute('data-md-phead')) { h.setAttribute('data-md-phead', ''); } if (h) { if (pfOn()) { h.tabIndex = 0; h.setAttribute('aria-label', tx('Move the pane with the arrow keys', 'حرّك اللوحة بمفاتيح الأسهم')); } else if (h.getAttribute('tabindex') === '0' && h.hasAttribute('aria-label') && /arrow|الأسهم/.test(h.getAttribute('aria-label'))) { h.removeAttribute('tabindex'); h.removeAttribute('aria-label'); } } });
  }
  window.addEventListener('resize', pfRestore);
  // MAD-HSD-578 · phones: the ☰ button steps aside while a side pane, sheet or dialog of the page lies under it (it would sit on
  // the pane's bottom buttons). Whatever is at the button's spot below it is checked; a fixed box of the page there hides it.
  var burger = document.getElementById('burger'), burT = 0;
  function burgerCheck() {
    if (!burger) return;
    burT = 0; if (getComputedStyle(burger).display === 'none') { burger.classList.remove('md-covered'); return; }
    var r = burger.getBoundingClientRect(), x = r.left + r.width / 2, y = r.top + r.height / 2, cov = false;
    var under = document.elementsFromPoint(x, y).filter(function (e) { return e !== burger && !burger.contains(e); })[0];
    for (var e = under; e && e !== stage && stage.contains(e); e = e.parentElement) { if (getComputedStyle(e).position === 'fixed') { cov = true; break; } }
    burger.classList.toggle('md-covered', cov || !!(nt && !nt.hidden));
  }
  function burgerSoon() { if (!burT) burT = setTimeout(burgerCheck, 60); clearTimeout(burgerSoon._t); burgerSoon._t = setTimeout(burgerCheck, 450); }   // again once a pane has slid in
  new MutationObserver(burgerSoon).observe(stage, { childList: true, subtree: true, attributes: true, attributeFilter: ['style', 'class'] });
  window.addEventListener('resize', burgerSoon);
  stage.addEventListener('click', function (e) { if (e.target.closest('md-qs')) { e.preventDefault(); qpOpen(); } });
  stage.addEventListener('keydown', function (e) { if ((e.key === 'Enter' || e.key === ' ') && e.target.localName === 'md-qs') { e.preventDefault(); qpOpen(); } });
  // phones: the menu is a drawer (the page header's "Expand menu" button, or ☰ on pages without one)
  function drawer(on) { app.classList.toggle('drawer', on); }
  on('#burger', document.getElementById('burger'), 'click', function () { drawer(!app.classList.contains('drawer')); });
  on('#scrim', document.getElementById('scrim'), 'click', function () { drawer(false); });
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape') { paneEsc(); drawer(false); umOpen(false); if (document.activeElement && document.activeElement.closest('.side')) document.activeElement.blur(); } });
  // MAD-HSD-595 · Esc closes an open side pane of the page through its own × (boards that do not listen to Esc themselves)
  function paneEsc() {
    var x = [].slice.call(stage.querySelectorAll('button[aria-label="Close panel"], button[aria-label="إغلاق اللوحة"]')).filter(function (b) { var r = b.getBoundingClientRect(); return r.width > 0 && r.width < 120; })[0];
    if (x && !(qp && !qp.hidden) && !(psPop && !psPop.hidden)) setTimeout(function () { if (document.contains(x)) x.click(); }, 0);
  }
  var EXPAND = 'button[aria-label="Expand menu"], button:has(svg path[d="M4 5h16v14H4zM9 5v14M15 10l-2 2 2 2"])';
  stage.addEventListener('click', function (e) {
    if (e.target.closest(EXPAND)) { e.preventDefault(); e.stopPropagation(); if (phone()) drawer(true); else { var a = document.querySelector('#rail-icons a'); if (a) a.focus(); } }
  }, true);
  on('menuEl', menuEl, 'click', function (e) { var a = e.target.closest('a[data-r]'); if (!a) return; drawer(false); rail.classList.add('md-flyx');   /* closes at once, until the pointer leaves the rail */ if (flyQ.value) { flyQ.value = ''; drawFly(); } setTimeout(function () { if (document.activeElement) document.activeElement.blur(); }, 0); });

  // ---------- pages ----------
  // MAD-HSD-618 · an engine page (pages-data: engine) needs the shared engine first (app/pages/_engine.js, loaded once and cached):
  // both files download together and run in order (async = false)
  var engineP = null;
  function script(src, fail, ordered) {
    return new Promise(function (res, rej) {
      var s = document.createElement('script'); s.src = src; if (ordered) s.async = false; s.onload = res;
      s.onerror = function () { fail(); rej(new Error('Could not load ' + src)); };
      document.body.appendChild(s);
    });
  }
  function load(ns) {
    if (loaded[ns]) return loaded[ns];
    var eng = P[ns] && P[ns].engine ? (engineP = engineP || script((window.MADAR_REMOTE || '') /* MAD-EXEC · the other Madar pages from the live design site */ + 'app/pages/_engine.js', function () { engineP = null; }, true)) : null;
    loaded[ns] = Promise.all([eng, script((window.MADAR_REMOTE || '') + 'app/pages/' + ns + '.js', function () { delete loaded[ns]; }, !!eng)]).catch(function (e) { delete loaded[ns]; throw e; });
    return loaded[ns];
  }
  var raf2 = function (fn) { requestAnimationFrame(function () { requestAnimationFrame(fn); }); };
  // splash (the first-wave intro): full = logo drawn in .96 s + tag, exit from 1.5 s; quick = logo .3 s, exit from .25 s.
  // The page is drawn only after the logo has finished drawing, so the animation never stutters.
  var shownAt = 0, minMs = 0, firstPage = true;
  function busy(on, full) {
    clearTimeout(busy._t);
    if (on) {
      minMs = full ? 1500 : 450; shownAt = Date.now();
      loading.className = 'splash'; void loading.offsetWidth;          // restart the animations
      loading.className = 'splash on ' + (full ? 'full' : 'quick');
      return full ? 1120 : 320;                                         // time the logo needs to draw
    }
    var wait = Math.max(0, minMs - (Date.now() - shownAt));
    busy._t = setTimeout(function () { loading.classList.add('out'); busy._t = setTimeout(function () { loading.className = 'splash'; }, 820); }, wait);
  }
  // MAD-EXEC · the executive dashboards: one page kept alive between visits (exec/exec-shell.js), shown under the usual splash
  function showEx(id) {
    var token = current = location.hash, EX = window.MADAR_EXEC; drawer(false); app.classList.remove('full');
    if (!EX) { stage.innerHTML = '<div class="err"><b>exec/exec-shell.js is missing</b></div>'; return; }
    if (EX.isShown(stage)) { EX.show(id, stage); document.title = EX.title(id) + ' · ' + BRAND; return; }
    var drawMs = busy(true, firstPage), t0 = Date.now(); firstPage = false;
    raf2(function () {
      EX.prepare(stage).then(function () {
        if (token !== current) return;
        setTimeout(function () {
          if (token !== current) return;
          EX.show(id, stage); document.title = EX.title(id) + ' · ' + BRAND;
          stage.parentNode.scrollTop = 0; raf2(function () { busy(false); });
        }, Math.max(30, drawMs - (Date.now() - t0)));
      }).catch(function (err) { busy(false); stage.innerHTML = '<div class="err"><b>' + esc(err.message) + '</b></div>'; });
    });
  }
  function mounted() { var w = stage.firstChild; return w && w.__dcName && w.__logic ? w : null; }
  function titleOf(ns) { if (ns === 'sys') return LANG === 'ar' ? 'تسجيل الدخول' : 'Sign in'; var f = P[ns]; return f ? (LANG === 'ar' && f.ar ? f.ar : f.page) : ''; }
  function show(name, preset, full) {
    var ns = name.split('/')[0], token = current = location.hash, w = mounted();
    drawer(false);
    // same page: switch the list, layout or screen in place, with the page's own skeleton
    if (w && w.__dcName === name) {
      var L = w.__logic;
      if (name === 'sys/Interactive') { if (preset.scr && L.goScr && L.state.scr !== preset.scr) L.goScr(preset.scr); }
      else if (name === 'hm/Interactive') { L.setState({ t: preset.dash ? 1 : 0 }); }
      else if (name === 'sys/SignIn') { L.setState({ t: preset.old ? 1 : 0 }); }
      else if (P[ns] && P[ns].d1) {
        var lp = window.MADAR_PRESET || {};
        if (P[ns].ents.length > 1 && ((preset.ent || '') !== (lp.ent || '') || (preset.layout || '') !== (lp.layout || ''))) { window.MADAR_PRESET = preset; while (stage.firstChild) stage.removeChild(stage.firstChild); MadarDC.mount(name, stage, {}); nativeSync(); }
      }
      else if (L.load && ((preset.ent && preset.ent !== L.state.ent) || (preset.layout || 'A') !== L.state.layout)) {
        L.load('loading', { ent: preset.ent || L.state.ent, layout: preset.layout || 'A', fv: {}, fd: {}, fpTab: 0, selIds: [], cs: null, g: '', st: '', q: '', lim: 25, pg: 0, sel: null, tp: null, pane: null, sort: 'new' }, 450);
      }
      app.classList.toggle('full', !!full); document.title = titleOf(ns) + ' · ' + BRAND; return;
    }
    var afterSignIn = /^#\/?sys|^#\/?signin|^$/.test(lastHash) && !full;
    app.classList.toggle('full', !!full);
    var drawMs = busy(true, firstPage || afterSignIn), t0 = Date.now(); firstPage = false;
    raf2(function () {
      load(ns).then(function () {
        if (token !== current) return;
        setTimeout(function () {
          if (token !== current) return;
          window.MADAR_PRESET = preset;
          MadarDC.mount(name, stage, {});
          nativeSync();
          stage.parentNode.scrollTop = 0; stage.parentNode.scrollLeft = LANG === 'ar' ? stage.parentNode.scrollWidth : 0;
          document.title = titleOf(ns) + ' · ' + BRAND;
          raf2(function () { busy(false); });
        }, Math.max(30, drawMs - (Date.now() - t0)));
      }).catch(function (err) {
        busy(false);
        stage.innerHTML = '<div class="err"><b>' + esc(err.message) + '</b><p>Run <code>python tools/build-madar.py ' + esc(ns) + '</code> to build the page.</p></div>';
      });
    });
  }
  // keep the address and the menu in step when lists or layout tabs are switched inside a page
  stage.addEventListener('click', function () {
    setTimeout(function () {
      var w = mounted(); if (!w) return; var ns = w.__dcName.split('/')[0]; if (!P[ns] || P[ns].d1 || !w.__logic.state.ent) return;
      var st = w.__logic.state, h = '#/' + ns + '/' + st.ent + (st.layout && st.layout !== 'A' ? '/' + st.layout : '');
      if (h !== location.hash) { current = h; history.replaceState(null, '', h); markActive(); }
    }, 60);
  });

  // MAD-HSD-569 (as in Modeef) · lists and tables show all their rows and the page scrolls (no scroll box inside the board).
  // Every vertical scroll box on the page (not in a side pane) grows to its content, and the flex boxes around it grow with it.
  var growT = 0;
  function isPane(el) { var a = el.closest('aside, .dw, [role="dialog"], .kp, .panel, .sx-pane, .mx-pane'); return a && getComputedStyle(a).position === 'fixed'; }
  function grow() {
    growT = 0; var root = stage.firstElementChild; if (!root || root.hasAttribute('data-md-keep')) return;   // MAD-EXEC · the dashboards keep their own layout
    var all = stage.querySelectorAll('*');
    for (var i = 0; i < all.length; i++) {
      var el = all[i];
      if (el.scrollHeight <= el.clientHeight + 4 || isPane(el)) continue;
      var cs = getComputedStyle(el);   // MAD-HSD-618 · read only for the few boxes that overflow (the order of pure reads does not change the result)
      if (el.closest('[data-md-keep], .md-keep')) continue;   // restored work areas that keep their designed height and inner scroll
      if (/auto|scroll/.test(cs.overflowY)) { if (!/ 0px$/.test(cs.flex) && /(^|;)\s*(max-)?height:\s*[\d.]+px/.test(el.getAttribute('style') || '')) continue; }   // a scroll box with a designed fixed height keeps it; a squeezed flex box grows
      // MAD-HSD-570 · also a box whose content spills out of it (flex 1 1 0 columns once rows wrap on small windows): it grows too
      else if ((el.clientHeight < 40 && !/ 0px$/.test(cs.flex)) || el.matches('.ah') || /absolute|fixed/.test(cs.position) || cs.aspectRatio !== 'auto' || /^(IMG|svg|CANVAS|TEXTAREA|SELECT|BUTTON)$/i.test(el.tagName) || el.closest('#stage [dir="ltr"]:not(.ah):not(.app):not(.mh):not(.ch):not(.fh), svg, button')) continue;
      if (el.closest('nav, .menu, select, textarea')) continue;
      el.style.setProperty('overflow-y', 'visible', 'important'); el.style.setProperty('max-height', 'none', 'important');
      var pf = el.parentElement; while (pf && getComputedStyle(pf).display === 'contents') pf = pf.parentElement; if (!(pf && /flex/.test(getComputedStyle(pf).display) && /row/.test(getComputedStyle(pf).flexDirection))) el.style.setProperty('flex', '0 0 auto', 'important');   /* in a row it keeps its own flex: a content-sized basis made boards wider than the window */   /* in a row keep its width */ el.style.setProperty('height', 'auto', 'important'); el.setAttribute('data-md-grown', '1');
      for (var x = el.parentElement; x && x !== stage; x = x.parentElement) {
        var c = getComputedStyle(x); if (c.position === 'fixed') break; if (c.display === 'contents') continue;
        if (x.style.getPropertyValue('height') !== 'auto') x.style.setProperty('height', 'auto', 'important');
        if (c.maxHeight !== 'none') x.style.setProperty('max-height', 'none', 'important');
        var fp = x.parentElement; while (fp && getComputedStyle(fp).display === 'contents') fp = fp.parentElement;
        if (/ 0px$/.test(c.flex) && c.flexGrow !== '0' && fp && /column/.test(getComputedStyle(fp).flexDirection) && /flex/.test(getComputedStyle(fp).display)) x.style.setProperty('flex', '1 0 auto', 'important');
        if (/hidden|auto/.test(c.overflowY) && x.parentElement !== stage) x.style.setProperty('overflow-y', 'visible', 'important');
      }
    }
  }
  // MAD-HSD-570 · the page never scrolls sideways: on windows narrower than a board's design, a grid that does not fit stacks
  // (one column) and a row that does not fit wraps. Tables (inside their .scroll box), maps and the time pickers keep their shape.
  window.MADAR_FIT = function () { fit(); grow(); };
  // a child in the flow sticks out of the box (decorative absolute or aria-hidden pieces that bleed on purpose do not count)
  function spills(el) {
    var R = el.getBoundingClientRect(), kids = Array.prototype.slice.call(el.children);
    for (var i = 0; i < kids.length; i++) {
      var k = kids[i], cs = getComputedStyle(k);
      if (cs.display === 'contents') { kids = kids.concat(Array.prototype.slice.call(k.children)); continue; }
      if (/absolute|fixed/.test(cs.position) || k.getAttribute('aria-hidden') === 'true' || cs.display === 'none') continue;
      var r = k.getBoundingClientRect(); if (r.width && (r.right > R.right + 2 || r.left < R.left - 2)) return true;
    }
    return false;
  }
  function cardGrids() {
    if (window.innerWidth > 900) return;
    stage.querySelectorAll('*').forEach(function (el) {
      var cs = getComputedStyle(el); if (cs.display !== 'grid') return;   // MAD-HSD-618 · the cheap test first: only grids go on to the selector tests
      if (el.hasAttribute('data-md-fit') || el.closest('[data-md-keep], .md-keep, [data-md-nofit], .scroll:has(.thead)') || isPane(el)) return;
      var tr = cs.gridTemplateColumns.split(' ').map(parseFloat).filter(function (x) { return x > 0; }); if (tr.length < 3 || tr.length > 6) return;
      var kids = Array.prototype.filter.call(el.children, function (k) { return getComputedStyle(k).display !== 'none'; }); if (!kids.length || kids.length > tr.length * 3) return;
      if (Math.min.apply(null, tr) >= 110) return;
      el.setAttribute('data-md-fit', el.clientWidth >= 300 ? 'grid2' : 'grid');
    });
  }
  function fit() {
    if (stage.firstElementChild && stage.firstElementChild.hasAttribute('data-md-keep')) return;   // MAD-EXEC
    cardGrids();
    var all = stage.querySelectorAll('*');
    for (var i = 0; i < all.length; i++) {
      var el = all[i]; if (el.hasAttribute('data-md-fit') || el.scrollWidth <= el.clientWidth + 2 || el.clientWidth < 40) continue;   // MAD-HSD-618 · size first, then the selector tests
      if (el.closest('[data-md-keep], .md-keep, [data-md-nofit]') || !spills(el)) continue;
      if (el.closest('.scroll:has(.thead), #stage [dir="ltr"]:not(.ah):not(.app):not(.mh):not(.ch):not(.fh), svg, [role="tablist"], .md-titlerow>:has([role="tab"])') || isPane(el)) continue;
      var cs = getComputedStyle(el);
      if (/auto|scroll/.test(cs.overflowX)) continue;
      if (cs.display === 'grid' && cs.gridTemplateColumns.split(' ').length > 1) el.setAttribute('data-md-fit', 'grid');
      else if (/flex/.test(cs.display) && cs.flexDirection === 'row' && cs.flexWrap === 'nowrap') el.setAttribute('data-md-fit', 'wrap');
    }
  }
  // MAD-HSD-570 · quick-filter chips (engine boards, .md-chips): as many as fit on one row; the board puts the rest behind "+N more"
  // and always keeps the selected chip. One step per pass: one more chip while the row has room, one less when it wraps.
  // MAD-HSD-618 · the chip steps run back to back before the page is painted: each step of chipFit re-renders the board, the render
  // comes back here (the stage observer) and the next step follows in the same task, with fit() and grow() first, as fitSoon runs them.
  // Same decisions and the same end state as before, one paint instead of one per step. Rows that need no step are left to fitSoon.
  var chipRun = 0, chipRunT = 0;
  function chipWant() {
    var want = false;
    stage.querySelectorAll('.md-chips').forEach(function (row) {
      var comp = row.closest('[data-dc-comp]'), L = comp && comp.__logic; if (want || !L || !L.forceUpdate) return;
      var kids = Array.prototype.filter.call(row.querySelectorAll('button, input'), function (b) { return b.offsetParent && b.closest('.md-chips') === row; });
      if (!kids.length) return; var t0 = kids[0].offsetTop, wrapped = kids.some(function (b) { return b.offsetTop > t0 + 6; });
      var n = L._chipFit != null ? L._chipFit : 5;
      if (wrapped && n > 1) want = true;
      else if (!wrapped && (L._chipMax == null || n + 1 < L._chipMax) && kids.some(function (b) { return getComputedStyle(b).borderTopStyle === 'dashed'; })) want = true;
    });
    return want;
  }
  function chipSettle() {
    if (!stage.querySelector('.md-chips') || chipRun > 12) return;
    if (!chipRunT) chipRunT = setTimeout(function () { chipRunT = 0; chipRun = 0; }, 0);
    if (!chipWant()) return;
    chipRun++; fit(); if (!app.classList.contains('full')) grow(); chipFit();
  }
  function chipFit() {
    stage.querySelectorAll('.md-chips').forEach(function (row) {
      var comp = row.closest('[data-dc-comp]'), L = comp && comp.__logic; if (!L || !L.forceUpdate) return;
      var kids = Array.prototype.filter.call(row.querySelectorAll('button, input'), function (b) { return b.offsetParent && b.closest('.md-chips') === row; });
      if (!kids.length) return; var t0 = kids[0].offsetTop, wrapped = kids.some(function (b) { return b.offsetTop > t0 + 6; });
      var hasMore = kids.some(function (b) { return getComputedStyle(b).borderTopStyle === 'dashed'; });   // the '+N more' chip (dashed, in any language)
      var n = L._chipFit != null ? L._chipFit : 5;
      if (wrapped && n > 1) { L._chipMax = n; L._chipFit = n - 1; L.forceUpdate(); }
      else if (!wrapped && hasMore && (L._chipMax == null || n + 1 < L._chipMax)) { L._chipFit = n + 1; L.forceUpdate(); }
    });
  }
  // MAD-HSD-570 · tabs option 2: ⋯ folds the title row's secondary buttons on phones; the selected layout tab stays in view
  function titleRow() {
    stage.querySelectorAll('.md-titlerow').forEach(function (row) {
      var secs = Array.prototype.filter.call(row.querySelectorAll('button'), function (b) { return !b.classList.contains('pri') && b.getAttribute('role') !== 'tab' && !b.classList.contains('md-more-btn') && !b.closest('[role="tablist"], :has(> [role="tab"]), .md-lists'); });
      var more = row.querySelector(':scope > .md-more-btn');
      if (secs.length && !more) {
        more = document.createElement('button'); more.type = 'button'; more.className = 'md-more-btn'; more.textContent = '⋯';
        more.setAttribute('aria-label', LANG === 'ar' ? 'إجراءات أخرى' : 'More actions'); more.title = more.getAttribute('aria-label');
        var pri = row.querySelector('button.pri'); var at = pri ? (pri.closest('.md-titlerow > *') || pri) : null;
        if (at && at.parentNode === row) row.insertBefore(more, at); else row.appendChild(more);
        more.addEventListener('click', function (e) {
          e.stopPropagation(); var old = row.querySelector('.md-more-pop'); if (old) { old.remove(); return; }
          var pop = document.createElement('div'); pop.className = 'md-more-pop'; pop.setAttribute('role', 'menu');
          secs.forEach(function (b) { var it = document.createElement('button'); it.type = 'button'; it.setAttribute('role', 'menuitem'); it.textContent = b.textContent.trim(); it.addEventListener('click', function () { pop.remove(); b.click(); }); pop.appendChild(it); });
          row.style.position = row.style.position || 'relative'; pop.style.top = (more.offsetTop + more.offsetHeight + 6) + 'px';
          pop.style.insetInlineEnd = '0px'; row.appendChild(pop);
          setTimeout(function () { document.addEventListener('click', function off() { pop.remove(); document.removeEventListener('click', off); }); }, 0);
        });
      } else if (!secs.length && more) more.remove();
      var pri2 = row.querySelector('button.pri'); if (pri2 && !pri2.getAttribute('aria-label')) { pri2.setAttribute('aria-label', pri2.textContent.trim()); pri2.title = pri2.textContent.trim(); }
      var sel = row.querySelector('[role="tab"][aria-selected="true"]'); if (sel && sel.parentElement && sel.parentElement.scrollWidth > sel.parentElement.clientWidth) { var box = sel.closest(':has(> [role="tab"]), :has(> dc-g > [role="tab"])') || sel.parentElement; var r = sel.getBoundingClientRect(), q = box.getBoundingClientRect(); if (r.left < q.left || r.right > q.right) box.scrollLeft += (r.left + r.width / 2) - (q.left + q.width / 2); }
    });
  }
  // MAD-HSD-570 · list sub-tabs (option 5): pills at the end of the layout-tabs row, or one fixed chip when there are 5+ lists,
  // the window is 820px or less, or the pills would wrap. Decided once per width and language (resize and language reset it).
  var listMode = {};   /* chip or pills, decided once per page, width and language: the template re-render resets the class, so it is re-applied every time */
  function listFit(cachedOnly) {
    stage.querySelectorAll('.md-lists').forEach(function (box, i) {
      var seg = box.querySelector('.md-l-seg'); if (!seg) return; var key = location.hash.replace(/\/[A-Z]$/, '') + '|' + window.innerWidth + LANG + '|' + i;   /* one choice per page and list: the layout letter is not part of it */
      if (!(key in listMode)) { if (cachedOnly && !(window.innerWidth <= 820)) return;   // MAD-HSD-618 · decisions that need no measuring are made before the first paint
        var n = seg.querySelectorAll('[role="tab"]').length; box.classList.remove('md-chipmode');
        var chip = window.innerWidth <= 820;   /* MAD-HSD-632 · pills whenever they fit (no fixed 5+ rule); the chip only on small windows or when the pills would wrap */
        if (!chip) { var row = box.parentElement, tabs = row && Array.prototype.filter.call(row.children, function (c) { return c !== box && c.querySelector && c.querySelector('[role="tab"]'); })[0];
          if (tabs && Math.abs(box.offsetTop - tabs.offsetTop) > 4) chip = true; if (seg.scrollWidth > seg.clientWidth + 1) chip = true; }
        listMode[key] = chip;
      }
      if (box.classList.contains('md-chipmode') !== listMode[key]) box.classList.toggle('md-chipmode', listMode[key]);
    });
  }
  new MutationObserver(function (ms) { var lf = false, cl = false; for (var i = 0; i < ms.length && !cl; i++) { var t = ms[i].target; if (ms[i].type === 'childList') lf = cl = true; else if (t.classList && t.classList.contains('md-lists')) lf = true; } if (lf) listFit(true); if (cl && stage.querySelector('.md-titlerow:not(:has(> .md-more-btn))')) titleRow(); if (cl) chipSettle(); }).observe(stage, { childList: true, subtree: true, attributes: true, attributeFilter: ['class'] });   /* re-apply before paint, so the list control never flashes; MAD-HSD-618 · and the title row's ⋯ is put back before paint (no shift on phones) */
  function chipReset() { listMode = {}; stage.querySelectorAll('.md-chips').forEach(function (row) { var c = row.closest('[data-dc-comp]'); if (c && c.__logic) c.__logic._chipMax = null; }); fitSoon(); }
  window.addEventListener('resize', chipReset);
  window.MADAR_CHIPRESET = chipReset;
  var fitT = 0; function fitSoon() { if (!fitT) fitT = setTimeout(function () { fitT = 0; fit(); if (!app.classList.contains('full')) grow(); chipFit(); titleRow(); listFit(); }, 120); }
  window.addEventListener('resize', function () { stage.querySelectorAll('[data-md-fit]:not([data-md-fit="keep"])').forEach(function (e) { e.removeAttribute('data-md-fit'); }); fitSoon(); });
  new MutationObserver(function () { if (!growT && !app.classList.contains('full')) growT = requestAnimationFrame(grow); fitSoon(); }).observe(stage, { childList: true, subtree: true, attributes: true, attributeFilter: ['style'] });

  var lastHash = '', nowHash = '';
  function route() {
    if (!location.hash || location.hash === '#' || location.hash === '#/') { location.replace('#/ex'); return; }   // MAD-EXEC · the site opens on the executive dashboards
    lastHash = nowHash; nowHash = location.hash || '';
    var p = parts(location.hash || '#/signin');
    if (p[0] === 'ex') { showEx(p[1] || ''); pushRecent(location.hash); markActive(); return; }
    if (p[0] === 'signin') { show('sys/SignIn', { scr: 'signin', lang: LANG, old: p[1] === 'old' }, true); return; }
    // MAD-HSD-595 · the signed-in system screens (My profile, Access denied, Not found, errors, session expired) sit in the site shell;
    // sign in, the company picker and the password reset keep their own full-screen design
    if (p[0] === 'sys') { var scr = p[1] || 'signin'; show('sys/Interactive', { scr: scr, lang: LANG }, /^(signin|pick|forgot)$/.test(scr)); if (!/^(signin|pick|forgot)$/.test(scr)) markActive(); return; }
    var f = P[p[0]];
    if (!f) { show('sys/Interactive', { scr: 'nf', lang: LANG }, false); return; }
    var pre = {};
    if (p[1] && f.ents.some(function (e) { return e.key === p[1]; })) pre.ent = p[1];
    if (f.home && p[1] === 'dash') pre.dash = true;
    if (p[2] && LET.indexOf(p[2]) >= 0 && LET.indexOf(p[2]) < f.layouts.length) pre.layout = p[2];
    show(p[0] + '/Interactive', pre, false);
    pushRecent(location.hash); markActive();   // MAD-HSD-575 · recent pages (fly-out chips, quick search)
  }
  window.MADAR_SITE = { href: function (h) { return h; }, go: function (h) { if (location.hash === h) route(); else location.hash = h; } };
  window.addEventListener('hashchange', route);
  if (window.MADAR_COLOR) { window.MADAR_COLOR.setDark(THEME === 'dark'); window.MADAR_COLOR.start(stage); }
  try { applyPalette(); setTheme(THEME); setLang(LANG); } catch (e) { try { console.error('Madar shell: menu, palette or language failed to draw; the page is drawn anyway.', e); } catch (x) {} }   // MAD-HSD-592
  route();
})();
