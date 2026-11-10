/* MAD-EXEC · Madar executive dashboards (اللوحات التنفيذية)
   The executive dashboard and its 22 module dashboards, drawn in the Madar stage under the menu group "Executive dashboards".
   One page, built on the first visit and kept alive between visits (its scripts run once): app.js calls
   MADAR_EXEC.prepare(stage) then MADAR_EXEC.show(id, stage) for #/ex and #/ex/<module>.
   Header, tabs and cards follow the Madar dashboard (glass header, pill tabs, double-frame cards); colours come from the
   Madar palette tokens in exec/exec.css, so light, dark and every palette apply. English comes from the dashboards'
   own dictionary (exec/i18n-data.js) and follows the shell's language button. */
(function () {
  'use strict';
  var MK = window.MADAR_EXEC_MARKUP, BASE = window.MADAR_EXEC_BASE || 'exec/';
  var CAT = MK.catalog;                          // [id, Arabic name, icon]
  var root = null, prepared = null, ready = false, curId = null, blank = false;
  var LANG = function () { return window.MADAR_SHELL ? window.MADAR_SHELL.lang() : (document.documentElement.lang === 'en' ? 'en' : 'ar'); };
  var DICT = function () { return window.I18N_DICT || {}; };
  var entry = function (id) { return CAT.filter(function (r) { return r[0] === id; })[0] || null; };
  var esc = function (s) { return String(s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); };
  var tx = function (ar, en) { return LANG() === 'ar' ? ar : en; };

  // ---------------------------------------------------------------- the dashboards' English (live, no reload)
  var I = (function () {
    var NUM = /[0-9٠-٩]+(?:[.,:\-\/][0-9٠-٩]+)*/g, AR = /[؀-ۿ]/, cache = new Map(), L = 'ar';
    function seg(s) {
      var m = s.match(/^(\s*)([\s\S]*?)(\s*)$/), core = m[2]; if (!core || !AR.test(core)) return s;
      var nums = core.match(NUM) || [], key = core.replace(NUM, '{}'), e = DICT()[key];
      if (!e || !e[L]) return s; var i = 0; return m[1] + e[L].replace(/\{\}/g, function () { return nums[i++] != null ? nums[i - 1] : '{}'; }) + m[3];
    }
    function part(p) {   // a whole label first, then its parts joined by + or /
      var t = seg(p); if (t !== p) return t;
      if (p.indexOf(' + ') > 0) return p.split(' + ').map(part).join(' + ');
      if (p.indexOf(' / ') > 0) return p.split(' / ').map(part).join(' / ');
      return p;
    }
    function tr(s) { if (L === 'ar' || !AR.test(s)) return s; var r = cache.get(s); if (r !== undefined) return r; r = s.split(' · ').map(part).join(' · '); if (cache.size > 6000) cache.clear(); cache.set(s, r); return r; }
    var orig = new WeakMap(), ATTR = ['placeholder', 'title', 'aria-label', 'alt'], origAttr = new WeakMap(), busy = false, mo = null;
    function node(n) {
      if (n.nodeType === 3) {
        var p = n.parentElement; if (p && (p.tagName === 'SCRIPT' || p.tagName === 'STYLE' || p.closest('[data-x-own]'))) return;
        var o = orig.get(n); if (o === undefined || (n.nodeValue !== o.out && n.nodeValue !== o.src)) { o = { src: n.nodeValue }; orig.set(n, o); }
        var out = tr(o.src); o.out = out; if (n.nodeValue !== out) n.nodeValue = out;
      } else if (n.nodeType === 1) {
        if (n.tagName === 'SCRIPT' || n.tagName === 'STYLE' || n.hasAttribute('data-x-own')) return;
        for (var k = 0; k < ATTR.length; k++) {
          var a = ATTR[k], v = n.getAttribute(a), m = origAttr.get(n);
          if (!(v && AR.test(v)) && !(m && m[a] !== undefined)) continue;
          if (!m) { m = {}; origAttr.set(n, m); }
          if (m[a] === undefined || (v !== m[a + '_o'] && v !== m[a])) m[a] = v;
          var out2 = tr(m[a]); m[a + '_o'] = out2; if (v !== out2) n.setAttribute(a, out2);
        }
        n.childNodes.forEach(node);
      }
    }
    function run(el) { busy = true; try { node(el); } finally { busy = false; } }
    function set(l, el) {
      var nl = l === 'ar' ? 'ar' : 'en'; if (nl === L && (nl === 'ar' || mo)) return; L = nl; cache.clear();
      if (!el) return; run(el);
      if (mo) { mo.disconnect(); mo = null; }
      if (L !== 'ar') {
        mo = new MutationObserver(function (ms) { if (busy) return; busy = true; try { ms.forEach(function (m) { if (m.type === 'childList') m.addedNodes.forEach(node); else if (m.type === 'characterData') node(m.target); else node(m.target); }); } finally { busy = false; } });
        mo.observe(el, { childList: true, subtree: true, characterData: true, attributes: true, attributeFilter: ATTR });
      }
    }
    return { tr: tr, set: set, lang: function () { return L; } };
  })();
  // what the dashboards' scripts read (access.js); the language itself is the shell's
  window.I18N = { lang: 'ar', LANGS: { ar: 'العربية', en: 'English' }, tr: function (s) { return I.tr(s); }, set: function (l) { if (window.MADAR_SHELL) window.MADAR_SHELL.setLang(l); } };

  // ---------------------------------------------------------------- icons (Madar line icons, 24 grid)
  var P = {
    moon: 'M20 14.5A8 8 0 0 1 9.5 4a8 8 0 1 0 10.5 10.5', bell: 'M6 8a6 6 0 1 1 12 0c0 7 3 9 3 9H3s3-2 3-9M10 21h4',
    chev: 'M6 9l6 6 6-6', check: 'M5 12l4 4 10-10', shield: 'M12 3l8 3v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6z', pin: 'M12 21s-7-6.2-7-12a7 7 0 0 1 14 0c0 5.8-7 12-7 12M12 11.5a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5',
    user: 'M20 21v-1a5 5 0 0 0-5-5H9a5 5 0 0 0-5 5v1M12 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8', flag: 'M5 22V3m0 1c5-4 9 4 15 0v10c-6 4-10-4-15 0'
  };
  var ic = function (k, s) { return '<svg width="' + (s || 18) + '" height="' + (s || 18) + '" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="' + P[k] + '"></path></svg>'; };

  // ---------------------------------------------------------------- access (who is signed in and which administration)
  function access() { return window.Access || null; }
  function whoText() {
    var A = access(); if (!A) return { role: tx('مدير الإدارة', 'Department manager'), scope: '' };
    var st = A.st, sc = A.SCOPES[st.scope] ? A.SCOPES[st.scope].n : '';
    var role = st.role === 'org' ? tx('منظم', 'Organizer') + ' · ' + I.tr(st.nation) : tx('مدير الإدارة', 'Department manager');
    if (st.role === 'org' && LANG() === 'ar') role = 'منظم · ' + st.nation;
    return { role: role, scope: LANG() === 'ar' ? sc : I.tr(sc) };
  }
  function popHtml() {
    var A = access(); if (!A) return '';
    var st = A.st, L = LANG() === 'ar';
    var opt = function (name, val, on, label, sub) {
      return '<label class="x-opt' + (on ? ' on' : '') + '"><input type="radio" name="' + name + '" value="' + val + '"' + (on ? ' checked' : '') + '><span class="x-rd">' + (on ? ic('check', 13) : '') + '</span><span class="x-ot"><b>' + esc(label) + '</b>' + (sub ? '<small>' + esc(sub) + '</small>' : '') + '</span></label>';
    };
    var scopes = Object.keys(A.SCOPES).map(function (k) { return opt('xs', k, st.scope === k, L ? A.SCOPES[k].n : I.tr(A.SCOPES[k].n)); }).join('');
    var roles = opt('xr', 'mgr', st.role !== 'org', L ? 'مدير الإدارة' : 'Department manager', L ? 'كل الجنسيات ضمن نطاق الإدارة' : 'Every nationality in the administration') +
      opt('xr', 'org', st.role === 'org', L ? 'منظم' : 'Organizer', L ? 'جنسية واحدة فقط' : 'One nationality only');
    var nats = '<label class="x-sel"><span>' + (L ? 'جنسية المنظم' : 'Organizer nationality') + '</span><select id="xNat"' + (st.role === 'org' ? '' : ' disabled') + '>' +
      A.NATS.map(function (n) { return '<option value="' + esc(n) + '"' + (n === st.nation ? ' selected' : '') + '>' + esc(L ? n : I.tr(n)) + '</option>'; }).join('') + '</select></label>';
    return '<div class="x-pop-h"><span class="x-av">MS</span><span><b>' + (L ? 'مصطفى سعد' : 'Mustafa Saad') + '</b><small>' + (L ? 'عرض اللوحات بصلاحيات' : 'View the dashboards as') + '</small></span></div>' +
      '<div class="x-pop-s"><div class="x-pop-l">' + ic('pin', 14) + (L ? 'نطاق الإدارة' : 'Administration scope') + '</div>' + scopes + '</div>' +
      '<div class="x-pop-s"><div class="x-pop-l">' + ic('user', 14) + (L ? 'الدخول كـ' : 'Sign in as') + '</div>' + roles + nats + '</div>' +
      '<div class="x-pop-f">' + (L ? 'يُعاد تحميل اللوحة بالصلاحيات المختارة.' : 'The board reloads with the chosen access.') + '</div>';
  }
  function bindPop() {
    var pop = root.querySelector('#xPop'), me = root.querySelector('#xMe'), A = access(); if (!A) return;
    var apply = function () {
      var s = pop.querySelector('input[name="xs"]:checked'), r = pop.querySelector('input[name="xr"]:checked'), n = pop.querySelector('#xNat');
      var next = { scope: s ? s.value : A.st.scope, role: r ? r.value : A.st.role, nation: n ? n.value : A.st.nation };
      if (next.scope === A.st.scope && next.role === A.st.role && next.nation === A.st.nation) return;
      try { localStorage.setItem('madarExecAccess', JSON.stringify(next)); } catch (e) {}
      location.reload();
    };
    pop.onchange = function (e) { if (e.target.name === 'xr') { var n = pop.querySelector('#xNat'); if (n) n.disabled = e.target.value !== 'org'; if (e.target.value === 'org') { n.focus(); } } apply(); };
    me.onclick = function (e) { e.stopPropagation(); var open = pop.hidden; pop.hidden = !open; me.setAttribute('aria-expanded', String(open)); if (open) { pop.innerHTML = popHtml(); var f = pop.querySelector('input:checked'); if (f) f.focus(); } };
    document.addEventListener('click', function (e) { if (!pop.hidden && !e.target.closest('#xPop, #xMe')) { pop.hidden = true; me.setAttribute('aria-expanded', 'false'); } });
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && !pop.hidden) { pop.hidden = true; me.setAttribute('aria-expanded', 'false'); me.focus(); } });
  }

  // ---------------------------------------------------------------- the page
  var SECTIONS = [['journey', 'رحلة الحاج', 'Pilgrim journey'], ['preparation', 'الاستعداد المسبق', 'Advance preparation'], ['performance', 'مؤشرات التشغيل', 'Operating indicators'],
    ['requestWidgets', 'الطلبات والوقوعات', 'Requests and incidents'], ['holy', 'المشاعر المقدسة', 'Holy sites'], ['centers', 'مراكز الضيافة', 'Hospitality centers']];
  function build() {
    root = document.createElement('div');
    root.className = 'ex-root';
    root.setAttribute('data-md-keep', '');        // the shell's fit / grow passes leave the dashboards' layout alone
    root.setAttribute('data-md-dark-raw', '');    // dark mode comes from the tokens (exec/exec.css), not from the shell's colour pass
    root.setAttribute('data-no-tr', '');          // the shell's English→Arabic pass skips it (the dashboards are Arabic, English below)
    root.innerHTML =
      '<div class="ex-wrap">' +
        '<header class="x-head">' +
          '<div class="x-tt"><h1 id="xTitle" data-x-own></h1><div class="x-crumb" id="xCrumb"><a href="#/hm" id="xcHome" data-x-own></a><i>/</i><a href="#/ex" id="xcGroup" data-x-own></a><i>/</i>' +
          '<span id="xcMod" data-x-own></span><b id="breadcrumbCity"></b><em id="xcSeason" data-x-own></em></div></div>' +
          '<div class="x-tools" data-x-own>' +
            '<button type="button" data-md="lang" class="x-ib x-lang" id="xLang"></button>' +
            '<button type="button" data-md="theme" class="x-ib" id="xTheme">' + ic('moon') + '</button>' +
            '<button type="button" class="x-ib" id="xBell">' + ic('bell') + '</button>' +
            '<div class="x-who"><button type="button" class="x-me" id="xMe" aria-haspopup="dialog" aria-expanded="false" aria-controls="xPop"><span class="x-av">MS</span><span class="x-mt"><b id="xRole"></b><small id="xScope"></small></span><span class="x-chev">' + ic('chev', 15) + '</span></button>' +
            '<div class="x-pop" id="xPop" role="dialog" data-x-own hidden></div></div>' +
          '</div>' +
        '</header>' +
        '<nav class="x-tabs" id="xTabs" data-x-own></nav>' +
        '<div class="ex-main">' + MK.overview + '<div class="page" id="modulePage" hidden></div></div>' +
      '</div>' + MK.dialog;
    // the executive heading keeps its print / export, with the indicators' help next to them
    pane();
    var tools = root.querySelector('#overview .headtools');
    if (tools) tools.insertAdjacentHTML('afterbegin', '<button class="btn" id="help" aria-label="عن البيانات والمؤشرات" title="عن البيانات والمؤشرات"><span data-icon="info"></span>تعريف المؤشرات</button>');
  }
  // ---------------------------------------------------------------- the detail popup = a Madar side pane
  // (as the notifications and record panes: end side, full height, glass frame, title on the glass, the content on a white card
  // that scrolls). The dashboards still fill #detailBody and call showModal(); the eyebrow, title and status chips they put first
  // are lifted into the pane header.
  var X = 'M6 6l12 12M18 6L6 18';
  function pane() {
    var dlg = root.querySelector('#detail'), close = dlg.querySelector('.close'), body = dlg.querySelector('#detailBody');
    dlg.classList.add('x-pane'); dlg.setAttribute('aria-labelledby', 'xPaneTitle');
    var head = document.createElement('div'); head.className = 'x-pane-head';
    head.innerHTML = '<div class="x-pane-tt" id="xPaneTT"></div>';
    close.classList.add('x-pane-x'); close.innerHTML = '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" aria-hidden="true"><path d="' + X + '"></path></svg>';
    head.appendChild(close);
    var card = document.createElement('div'); card.className = 'x-pane-card';
    while (dlg.firstChild) dlg.removeChild(dlg.firstChild);
    card.appendChild(body); dlg.appendChild(head); dlg.appendChild(card);
    var CHIP = 'span[class*="Status"],span[class*="status"],.saType,.pill,.smallTag,[class*="Tag"],[class*="Badge"]';
    function lift(fresh) {
      var tt = head.querySelector('#xPaneTT'), kids = [], n = body.firstElementChild, seenTitle = false;
      var chipBox = function (el) { return el.children.length > 0 && el.children.length === el.childNodes.length && [].every.call(el.children, function (c) { return c.matches(CHIP); }); };
      while (n && (n.matches('.eyebrow, h2') || (seenTitle && (n.matches(CHIP) || chipBox(n))))) { if (n.tagName === 'H2') seenTitle = true; kids.push(n); n = n.nextElementSibling; }
      if (!kids.length) { if (fresh) tt.innerHTML = ''; return; }
      tt.innerHTML = '';
      var chips = kids.filter(function (k) { return !k.matches('.eyebrow, h2'); });
      kids.forEach(function (k) { if (chips.indexOf(k) < 0) tt.appendChild(k); });
      if (chips.length) {   // a box that only holds chips gives its chips
        var row = document.createElement('div'); row.className = 'x-pane-chips';
        chips.forEach(function (c) { if (c.matches(CHIP)) row.appendChild(c); else while (c.firstElementChild) row.appendChild(c.firstElementChild); });
        tt.appendChild(row);
      }
      var h2 = tt.querySelector('h2'); if (h2) h2.id = 'xPaneTitle';
      body.scrollTop = 0;
      // wide content (a table of many columns) gets a wider pane
      var cols = 0; body.querySelectorAll('table tr:first-child').forEach(function (r) { cols = Math.max(cols, r.children.length); });
      dlg.classList.toggle('x-wide', cols > 4);
    }
    new MutationObserver(function () { lift(false); }).observe(body, { childList: true });
    var show = dlg.showModal;
    dlg.showModal = function () { lift(true); dlg.classList.remove('x-out'); return show.apply(this, arguments); };
  }
  function load(src) {
    return new Promise(function (res, rej) { var s = document.createElement('script'); s.src = BASE + src; s.async = false; s.onload = res; s.onerror = function () { rej(new Error('Could not load ' + BASE + src)); }; document.body.appendChild(s); });
  }
  function attach(stage) {
    if (root.parentNode === stage && stage.firstChild === root && stage.childNodes.length === 1) return;
    if (stage.firstChild && stage.firstChild !== root) {
      // the Madar page that was there is unmounted the runtime's way (its own clean-up runs), then the dashboards come back
      if (window.MadarDC) { if (!blank) { window.MadarDC.define('ex/Blank', '<div></div>', function (DCLogic) { return class extends DCLogic { renderVals() { return {}; } }; }); blank = true; } window.MadarDC.mount('ex/Blank', stage, {}); }
      while (stage.firstChild) stage.removeChild(stage.firstChild);
    }
    stage.appendChild(root);
  }
  function prepare(stage) {
    if (prepared) { attach(stage); return prepared; }
    build(); attach(stage);
    var chain = Promise.resolve();
    ['i18n-data.js'].concat(MK.scripts.map(function (f) { return 'js/' + f; })).forEach(function (f) { chain = chain.then(function () { return load(f); }); });
    prepared = chain.then(function () {
      ready = true; bindPop(); tabs(); I.set(LANG(), root); header(curId || '');
      root.addEventListener('click', function () { setTimeout(hideTabs, 0); });   // a city filter can hide a section (the holy sites are Makkah only)
      window.addEventListener('madar:lang', function () { I.set(LANG(), root); header(curId || ''); tabs(); });
    });
    return prepared;
  }

  // ---------------------------------------------------------------- header and section tabs
  function header(id) {
    var e = entry(id), L = LANG() === 'ar', who = whoText();
    var t = root.querySelector('#xTitle'), c = root.querySelector('#xCrumb');
    t.textContent = title(id);
    root.querySelector('#xcHome').textContent = L ? 'الرئيسية' : 'Home';
    root.querySelector('#xcGroup').textContent = L ? 'اللوحات التنفيذية' : 'Executive dashboards';
    var mod = root.querySelector('#xcMod'); mod.textContent = e ? (L ? e[1] : I.tr(e[1])) : ''; mod.hidden = !e;
    root.querySelector('#breadcrumbCity').hidden = !!e;
    root.querySelector('#xcSeason').textContent = L ? 'موسم 1447 · بيانات تجريبية' : 'Season 1447 · Sample data';
    c.setAttribute('aria-label', L ? 'مسار الصفحة' : 'Breadcrumb');
    var lb = root.querySelector('#xLang'); lb.textContent = L ? 'English' : 'العربية';   /* the shell's wording for the language button */ lb.setAttribute('aria-label', L ? 'التبديل إلى الإنجليزية' : 'Switch to Arabic'); lb.title = lb.getAttribute('aria-label');
    var th = root.querySelector('#xTheme'); th.setAttribute('aria-label', L ? 'تبديل الوضع الداكن' : 'Toggle dark mode'); th.title = th.getAttribute('aria-label');
    var bl = root.querySelector('#xBell'); bl.setAttribute('aria-label', L ? 'الإشعارات' : 'Notifications');
    root.querySelector('#xRole').textContent = who.role; root.querySelector('#xScope').textContent = who.scope;
    root.querySelector('#xMe').setAttribute('aria-label', (L ? 'صلاحيات العرض: ' : 'View access: ') + who.role + ' · ' + who.scope);
  }
  var tabObs = null;
  function tabs() {
    var nav = root.querySelector('#xTabs'), L = LANG() === 'ar';
    nav.setAttribute('aria-label', L ? 'أقسام اللوحة' : 'Board sections');
    nav.innerHTML = SECTIONS.map(function (s, i) { return '<a href="#/ex" data-sec="' + s[0] + '"' + (i === 0 ? ' aria-current="true"' : '') + '>' + (L ? s[1] : s[2]) + '</a>'; }).join('');
    nav.onclick = function (e) {
      var a = e.target.closest('[data-sec]'); if (!a) return; e.preventDefault();
      var el = root.querySelector('#' + a.getAttribute('data-sec')); if (!el) return;
      var box = root.closest('.stage-wrap') || document.scrollingElement, top = el.getBoundingClientRect().top - box.getBoundingClientRect().top + box.scrollTop - 86;
      box.scrollTo({ top: Math.max(0, top), behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' });
      mark(a.getAttribute('data-sec'));
    };
    var box = root.closest('.stage-wrap');
    if (box && !tabObs) {
      tabObs = function () {
        if (curId) return; var best = null, y = box.getBoundingClientRect().top + 140;
        SECTIONS.forEach(function (s) { var el = root.querySelector('#' + s[0]); if (!el || !el.offsetParent) return; if (el.getBoundingClientRect().top <= y) best = s[0]; });
        mark(best || SECTIONS[0][0]);
      };
      box.addEventListener('scroll', function () { if (!root.isConnected) return; clearTimeout(tabObs._t); tabObs._t = setTimeout(tabObs, 60); }, { passive: true });
    }
    hideTabs();
  }
  function mark(sec) { root.querySelectorAll('#xTabs [data-sec]').forEach(function (a) { if (a.getAttribute('data-sec') === sec) a.setAttribute('aria-current', 'true'); else a.removeAttribute('aria-current'); }); }
  function hideTabs() { if (curId) return; root.querySelectorAll('#xTabs [data-sec]').forEach(function (a) { var el = root.querySelector('#' + a.getAttribute('data-sec')); a.hidden = !el || el.hidden || el.getClientRects().length === 0; }); }

  // ---------------------------------------------------------------- routes (#/ex = executive, #/ex/<module> = a module dashboard)
  var MOUNT = { tickets: 'mountTicketsDashboard', tasks: 'mountTasksDashboard', agreements: 'mountAgreementsDashboard', contractors: 'mountContractorsDashboard',
    contracts: 'mountServiceContractsDashboard', 'emergency-stock': 'mountEmergencyStockDashboard', camps: 'mountCampsDashboard', housing: 'mountHousingDashboard',
    'templates-surveys': 'mountSurveysDashboard', minutes: 'mountMinutesDashboard', 'hospitality-expenses': 'mountExpensesDashboard', catering: 'mountCateringDashboard' };
  function show(id, stage) {
    attach(stage);
    var A = access(), e = entry(id);
    if (e && A && A.moduleHidden(e[0])) { location.replace('#/ex'); return; }
    var ov = root.querySelector('#overview'), mp = root.querySelector('#modulePage'), nav = root.querySelector('#xTabs');
    curId = e ? e[0] : '';
    root.setAttribute('data-ex', curId || 'executive');
    if (!e) {
      ov.hidden = false; mp.hidden = true; mp.innerHTML = ''; nav.hidden = false;
      if (typeof window.renderAll === 'function') window.renderAll(); else if (typeof renderAll === 'function') renderAll();   // eslint-disable-line no-undef
    } else {
      ov.hidden = true; mp.hidden = false; nav.hidden = true;
      var fn = MOUNT[e[0]];
      if (fn && typeof window[fn] === 'function') window[fn](mp);
      else if (window.kitModules && window.kitModules[e[0]]) window.kitModules[e[0]](mp);
      else mp.innerHTML = '<div class="modulePageHeading"><h1>' + esc(e[1]) + '</h1></div>';
      if (A && A.banner(e[0])) mp.insertAdjacentHTML('afterbegin', A.banner(e[0]));
      var h1 = mp.querySelector('h1'); if (h1) { h1.tabIndex = -1; }
    }
    header(curId); hideTabs();
    var box = root.closest('.stage-wrap'); if (box && stage.__exLast !== curId) box.scrollTop = 0; stage.__exLast = curId;
  }
  function title(id) { var e = entry(id), ar = e ? e[1] : 'لوحة القيادة التنفيذية'; return LANG() === 'ar' ? ar : ((DICT()[ar] || {}).en || ar); }

  window.MADAR_EXEC = {
    prepare: prepare, show: show, title: title,
    isShown: function (stage) { return ready && root.parentNode === stage && root.isConnected && stage.firstChild === root; },
    root: function () { return root; }
  };
})();
