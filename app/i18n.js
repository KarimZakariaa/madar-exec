/* MAD-HSD-570 · Madar site · Arabic for the approved boards · Mustafa Saad · 8 Nov 2026
   Forked from the Modeef layer (saudia/app/i18n.js, MAD-HSD-527). The boards are written in English. In Arabic this layer
   swaps every visible label, placeholder, tooltip and default field text for its Arabic (app/i18n-ar.js, window.MADAR_AR)
   as the page draws, and puts the English back when you switch again. Numbers are kept: a label is looked up with each
   number written as {n}. Lookup order for one text:
     1. the whole text                      4. "N of M <label>"
     2. "Label: value" (label translated, the value is translated on its own or kept)
     3. each part between " · ", " › ", " → ", " — "
     5. phrases inside the text, longest first (index by first word), then single terms; unknown names and codes stay.
        If an ordinary English word would be left over, the text stays English (no word salad): add it to tools/i18n-madar.
   Keys may also hold {x} for any text inside a sentence (see templ below).
   Never translated: avatar initials (1–3 capitals on their own), anything inside [data-no-tr], the shell menu (it has its own Arabic).
   "AM" / "PM" become "ص" / "م". */
(function () {
  var A = window.MADAR_AR || { seg: {}, words: {} }, SEG = A.seg, WORDS = A.words;
  // MAD-HSD-618 · performance: app/i18n-ar.js (1.7 MB) is loaded only for Arabic. index.html writes it in when the saved language
  // is Arabic; in English it comes on demand (load) or once the page is idle, and the indexes are rebuilt when it arrives.
  function dict() { var d = window.MADAR_AR; if (d && d !== A) { A = d; SEG = d.seg; WORDS = d.words; PH = null; TPL = null; VOCAB = null; KEEPW = null; } }
  var arQ = null, arFail = false;   /* a failed load does not retry in a loop: Arabic then shows the shell's own Arabic only */
  function load(cb) {
    if (window.MADAR_AR) { dict(); if (cb) cb(); return; }
    if (!arQ) { arQ = []; var s = document.createElement('script'); s.src = 'app/i18n-ar.js';
      s.onload = function () { dict(); var q = arQ; arQ = null; q.forEach(function (f) { try { f(); } catch (e) { console.error(e); } }); };
      s.onerror = function () { arFail = true; var q = arQ; arQ = null; s.remove(); q.forEach(function (f) { try { f(); } catch (e) { console.error(e); } }); };
      document.head.appendChild(s); }
    if (cb) arQ.push(cb);
  }
  if (!window.MADAR_AR) {   // English: fetch it ahead of need (a language control, the Alt key, a search box), or when idle
    var soon = function (e) { var t = e.target; if (e.type === 'keydown' ? (e.altKey || (t && /^(INPUT|TEXTAREA)$/.test(t.tagName))) : (t && t.closest && t.closest('[data-md="lang"], [data-ln], input[type="search"], md-qs'))) { off(); load(); } };
    var evs = ['pointerover', 'focusin', 'keydown'], off = function () { evs.forEach(function (n) { document.removeEventListener(n, soon, true); }); };
    evs.forEach(function (n) { document.addEventListener(n, soon, true); });
    window.addEventListener('load', function () { setTimeout(function () { (window.requestIdleCallback || setTimeout)(function () { off(); load(); }); }, 8000); });
  }
  var NUM = /\d[\d,.:]*/g, LATIN = /[A-Za-z]/, SEP = /(\s+(?:·|›|→|—|–|\|)\s+)/;
  var on = false, orig = new WeakMap(), mine = new WeakMap(), origAttr = new WeakMap(), origVal = new WeakMap();
  var FLIP = { '→': '←', '←': '→', '▸': '◂', '◂': '▸' }, AMPM = { AM: 'ص', PM: 'م' };   // ‹ › « » mirror by themselves in right-to-left text; arrows do not

  // ---- phrase index (for text built in code by joining labels and values): first word → phrases, longest first ----
  var PH = null, NUMW = /^\d[\d,.:]*$/;
  function core(w) { var m = w.match(/^([(\["“'«]*)(.*?)([)\]"”'».,:;!?،؛]*)$/); return m ? [m[1], m[2], m[3]] : ['', w, '']; }
  function wre(w) { return w.indexOf('{n}') < 0 ? null : new RegExp('^' + w.replace(/[.*+?^$()|[\]\\]/g, '\\$&').split('{n}').join('\\d[\\d,.:]*') + '$'); }
  function index() {
    PH = {};
    Object.keys(SEG).forEach(function (k) {
      var ws = k.split(/\s+/); if (ws.length < 2 || ws.length > 14) return;
      var c = ws.map(function (w) { return core(w)[1]; }), f = c[0].indexOf('{n}') >= 0 ? '{n}' : c[0].toLowerCase();
      (PH[f] = PH[f] || []).push({ w: c, re: c.map(wre), v: SEG[k], lastP: core(ws[ws.length - 1])[2] });
    });
    Object.keys(PH).forEach(function (f) { PH[f].sort(function (a, b) { return b.w.length - a.w.length; }); });
  }
  function wordEq(kw, re, tok) { return re ? re.test(tok) : kw === tok; }
  function phrases(t) {
    if (!PH) index();
    var toks = t.split(/\s+/), out = [], hit = false, i = 0;
    while (i < toks.length) {
      var c0 = core(toks[i]), f = c0[1].toLowerCase(), cands = (PH[f] || []).concat(NUMW.test(c0[1]) ? (PH['{n}'] || []) : []), done = false;
      for (var j = 0; j < cands.length && !done; j++) {
        var P = cands[j], n = P.w.length; if (i + n > toks.length) continue; var ok = true, nums = [];
        for (var q = 0; q < n && ok; q++) {
          var cq = core(toks[i + q]); if (q < n - 1 && cq[2] && !/^[.,:]$/.test(cq[2]) ) ok = false;
          if (ok && !wordEq(P.w[q], P.re[q], cq[1]) && !(q === 0 && !P.re[0] && P.w[0].toLowerCase() === cq[1].toLowerCase())) ok = false;
          if (ok && P.re[q]) (cq[1].match(NUM) || []).forEach(function (x) { nums.push(x); });
        }
        if (!ok) continue;
        var k = 0, v = P.v.replace(/\{n\}/g, function () { return nums[k++] || ''; });
        var last = core(toks[i + n - 1]), trail = last[2] && last[2] !== P.lastP ? last[2] : '';
        out.push(c0[0] + v + trail); i += n; hit = true; done = true;
      }
      if (done) continue;
      // a run of 2+ capitalised words that is not in the dictionary is a name (a company, a hotel): keep it whole, unless every
      // word is a known name word (people's names translate word by word)
      if (/^[A-Z][a-z]/.test(c0[1])) {
        var j = i, allNames = true;
        while (j < toks.length) { var cj = core(toks[j]); if (!/^[A-Z][A-Za-z'’-]*$/.test(cj[1]) || (j > i && cj[0])) break; if (WORDS[cj[1]] == null && !(/^Al-/.test(cj[1]) && WORDS[cj[1].slice(3)] != null)) allNames = false; j++; if (cj[2]) break; }
        if (j - i >= 2 && !allNames) {
          if (!VOCAB) vocab(); var run = toks.slice(i, j).map(function (x) { return core(x)[1]; }), unknown = run.some(function (w) { return !VOCAB[w.toLowerCase()] && WORDS[w] == null; });
          if (unknown || (run.length >= 3 && WORDS[run[0]] != null)) { out.push(toks.slice(i, j).join(' ')); i = j; continue; }   // a name ("Al Noor Hajj Services", "Kudai Grand"); "New Group" is interface text and translates
        }
      }
      var w = toks[i], cw = core(w), x = cw[1];
      if (!LATIN.test(x)) out.push(w);
      else if (AMPM[x]) { out.push(cw[0] + AMPM[x] + cw[2]); hit = true; }
      else if (SEG[x] != null && x.length > 3) { out.push(cw[0] + SEG[x] + cw[2]); hit = true; }
      else if (/^[A-Z]/.test(x) && WORDS[x] != null) { out.push(cw[0] + WORDS[x] + cw[2]); hit = true; }
      else if (/^[a-z]/.test(x) && x.length > 3 && SEG[x[0].toUpperCase() + x.slice(1)] != null && toks.length <= 6) { out.push(cw[0] + SEG[x[0].toUpperCase() + x.slice(1)] + cw[2]); hit = true; }   // "employee" in a short label
      else if (/^Al-/.test(x) && WORDS[x.slice(3)] != null) { out.push(cw[0] + 'ال' + WORDS[x.slice(3)] + cw[2]); hit = true; }
      else if (/^[a-z]{2,}$/.test(x.replace(/['’.-]/g, '')) && !/@|\//.test(x)) return null;   // an English word is left: no word salad, keep the English (add the sentence to tools/i18n-madar)
      else out.push(w);   // names and codes stay
      i++;
    }
    return hit ? out.join(' ') : null;
  }

  // templates: a dictionary key may hold {x} = any text (a name, a place, a date), translated on its own or kept as it is.
  // Example key "Dear {x}, you were {n} minutes late on {x}." The parts are filled in the same order in the Arabic.
  var TPL = null, XSEP = /\s(?:·|›|→|—|–|\|)\s/;
  function shortX(g) { return /^[\d\s,.:\/–+%#-]+$/.test(g) || g.split(/\s+/).length <= 3 || /^(?:[A-Z0-9\u0600-\u06FF][^\s]*(?:\s+|$))+$/.test(g); }
  function templ(t) {
    if (!TPL) { TPL = [];
      Object.keys(SEG).forEach(function (k) { if (k.indexOf('{x}') < 0) return;
        var lit = k.replace(/\{[nx]\}/g, '').length;
        var rx = '^' + k.split(/(\{[nx]\})/).map(function (p) { return p === '{n}' ? '(\\d+(?:[,.:]\\d+)*)' : p === '{x}' ? '(.+?)' : p.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); }).join('') + '$';
        var short = k.replace(/\{[nx]\}/g, ' ').trim().split(/\s+/).filter(Boolean).length <= 2;   // MAD-HSD-631 · "{x} beds", "Add {x}": a short value only
        try { TPL.push({ re: new RegExp(rx), v: SEG[k], kinds: (k.match(/\{[nx]\}/g) || []), lit: lit, short: short }); } catch (e) {} });
      TPL.sort(function (a, b) { return b.lit - a.lit; }); }
    for (var i = 0; i < TPL.length; i++) {
      var m = TPL[i].re.exec(t); if (!m) continue;
      var ns = [], xs = [];
      var okT = true;   // a {x} part must translate, or be a name or code (no ordinary English word), else this template does not apply
      // MAD-HSD-631 · it never holds a separator (the text is split there instead), and a short template takes only what translates, a number, a name or a few words
      TPL[i].kinds.forEach(function (k, j) { var g = m[j + 1]; if (k === '{x}' && XSEP.test(g)) okT = false; if (k === '{n}') ns.push(g); else { var x = okT ? tr(g, 1) : null; if (x == null && TPL[i].short && !shortX(g)) okT = false; if (x == null && /(^|[^A-Za-z])[a-z]{3,}/.test(g.replace(/https?:\/\/\S+|[\w-]+(?:\.[\w-]+)+(?:\/\S*)?/g, ''))) okT = false; xs.push(x == null ? g : x); } });
      if (!okT) continue;
      var a = 0, b = 0; return TPL[i].v.replace(/\{n\}/g, function () { return ns[a++] || ''; }).replace(/\{x\}/g, function () { return xs[b++] || ''; });
    }
    return null;
  }
  var NUM2 = /\d+(?:[,.:]\d+)*/g;   // a number without the punctuation after it ("12," "2027.")
  function one(t) {
    var nums = t.match(NUM) || [], key = t.replace(NUM, '{n}'), v = SEG[key];
    if (v == null) { nums = t.match(NUM2) || []; key = t.replace(NUM2, '{n}'); v = SEG[key]; }
    if (v == null) return null;
    var i = 0; return v.replace(/\{n\}/g, function () { return nums[i++] || ''; });
  }
  function words(t) {
    var ws = t.split(/(\s+)/), hit = false;
    for (var i = 0; i < ws.length; i++) {
      var w = ws[i]; if (!w.trim() || !LATIN.test(w)) continue;
      var m = w.match(/^([(\[]?)(.*?)([)\],.:;،؛]?)$/), c = m[2];
      var al = /^Al-/.test(c) ? c.slice(3) : null;
      if (AMPM[c]) { ws[i] = m[1] + AMPM[c] + m[3]; hit = true; }
      else if (WORDS[c] != null) { ws[i] = m[1] + WORDS[c] + m[3]; hit = true; }
      else if (al && WORDS[al] != null) { ws[i] = m[1] + 'ال' + WORDS[al] + m[3]; hit = true; }
      else if (/^[A-Z]{1,4}-?\d*[A-Z]?$|^[A-Z]{1,4}-\d+$|^\d/.test(c)) continue;   // codes stay
      else return null;
    }
    return hit ? ws.join('').replace(/\s{2,}/g, ' ').trim() : null;
  }
  // never half-translated: a result that still holds an English word of the interface (a word of the dictionary's English
  // side that the Arabic side does not keep, like "New" or "contracts") is dropped, and the English stays whole.
  // Names and codes are not dictionary words, so they may stay inside Arabic text.
  var VOCAB = null, KEEPW = null;
  function vocab() {
    VOCAB = {}; KEEPW = {};
    Object.keys(SEG).forEach(function (k) { (k.match(/[A-Za-z][A-Za-z'’-]+/g) || []).forEach(function (w) { VOCAB[w.toLowerCase()] = 1; }); (String(SEG[k]).match(/[A-Za-z][A-Za-z'’-]+/g) || []).forEach(function (w) { KEEPW[w.toLowerCase()] = 1; }); });
    Object.keys(WORDS).forEach(function (w) { delete VOCAB[w.toLowerCase()]; });   // name words: they stay when untranslated
  }
  function halfDone(r) {
    if (!/[\u0600-\u06FF]/.test(r)) return false; if (!VOCAB) vocab();
    var ws = r.replace(/https?:\/\/\S+|[\w-]+(?:\.[\w-]+)+\/\S*/g, ' ').replace(/[\w.-]+\.(?:xlsx?|csv|pdf|docx?|pptx?|png|jpe?g|zip|txt)\b/gi, ' ').replace(/\{[^{}]*\}/g, ' ').replace(/[A-Za-z0-9]*(?:_[A-Za-z0-9]+|[a-z][A-Z])[A-Za-z0-9_]*/g, ' ').match(/[A-Za-z][A-Za-z'’-]+/g) || [];   // Create_PilgrimsPermissions, camelCase and {Word} are codes
    for (var i = 0; i < ws.length; i++) { var w = ws[i], lw = w.toLowerCase(); if (/^[A-Z0-9-]{2,6}$/.test(w) || KEEPW[lw] || !VOCAB[lw]) continue; return true; }
    return false;
  }
  function tr(text, deep) {
    if (!deep) dict(); var r = tr0(text, deep);
    if (r != null && !deep && halfDone(r)) return null;
    if (r != null && !deep && /[؀-ۿ]/.test(r)) r = r.replace(/, (?=\S)/g, '، ').replace(/; (?=\S)/g, '؛ ');   // Arabic comma and semicolon (not inside 1,520)
    return r;
  }
  // MAD-HSD-631 · Arabic number–noun agreement after a number, whichever form the dictionary wrote:
  //   1 and 0: singular · 2: dual (the number goes; nominative only where it starts a part) · 3–10: plural · 11–99: singular (accusative, tanween)
  //   100 and up follow their last two digits (…00, …01, …02: singular; …03–…10: plural; …11–…99: accusative singular)
  //   noun: [every form to recognise, singular, dual (nominative), dual (accusative / genitive), plural, 11–99]
  var NOUN = [
    [['غرفتان', 'غرفتين', 'غرفة', 'غرف'], 'غرفة', 'غرفتان', 'غرفتين', 'غرف', 'غرفة'],
    [['سريران', 'سريرين', 'سريرًا', 'سريرا', 'سرير', 'أسرّة', 'أسرة'], 'سرير', 'سريران', 'سريرين', 'أسرّة', 'سريرًا'],
    [['فندقان', 'فندقين', 'فندقًا', 'فندقا', 'فندق', 'فنادق'], 'فندق', 'فندقان', 'فندقين', 'فنادق', 'فندقًا'],
    [['ليلتان', 'ليلتين', 'ليلة', 'ليالٍ', 'ليالي', 'ليال'], 'ليلة', 'ليلتان', 'ليلتين', 'ليالٍ', 'ليلة'],
    [['حاجّان', 'حاجّين', 'حاجان', 'حاجين', 'حاجًا', 'حاجا', 'حاج', 'حجاج'], 'حاج', 'حاجّان', 'حاجّين', 'حجاج', 'حاجًا'],
    [['ساعتان', 'ساعتين', 'ساعات', 'ساعة'], 'ساعة', 'ساعتان', 'ساعتين', 'ساعات', 'ساعة'],
    [['يومان', 'يومين', 'يومًا', 'يوما', 'أيام', 'يوم'], 'يوم', 'يومان', 'يومين', 'أيام', 'يومًا'],
    [['دقيقتان', 'دقيقتين', 'دقائق', 'دقيقة'], 'دقيقة', 'دقيقتان', 'دقيقتين', 'دقائق', 'دقيقة'],
    [['أسبوعان', 'أسبوعين', 'أسبوعًا', 'أسابيع', 'أسبوع'], 'أسبوع', 'أسبوعان', 'أسبوعين', 'أسابيع', 'أسبوعًا'],
    [['شهران', 'شهرين', 'شهرًا', 'أشهر', 'شهور', 'شهر'], 'شهر', 'شهران', 'شهرين', 'أشهر', 'شهرًا'],
    [['حقلان', 'حقلين', 'حقلًا', 'حقول', 'حقل'], 'حقل', 'حقلان', 'حقلين', 'حقول', 'حقلًا'],
    [['وجبتان', 'وجبتين', 'وجبات', 'وجبة'], 'وجبة', 'وجبتان', 'وجبتين', 'وجبات', 'وجبة'],
    [['حقيبتان', 'حقيبتين', 'حقائب', 'حقيبة'], 'حقيبة', 'حقيبتان', 'حقيبتين', 'حقائب', 'حقيبة'],
    [['خيمتان', 'خيمتين', 'خيام', 'خيمة'], 'خيمة', 'خيمتان', 'خيمتين', 'خيام', 'خيمة'],
    [['مخيمان', 'مخيمين', 'مخيمًا', 'مخيمات', 'مخيم'], 'مخيم', 'مخيمان', 'مخيمين', 'مخيمات', 'مخيمًا'],
    [['حافلتان', 'حافلتين', 'حافلات', 'حافلة'], 'حافلة', 'حافلتان', 'حافلتين', 'حافلات', 'حافلة'],
    [['رحلتان', 'رحلتين', 'رحلات', 'رحلة'], 'رحلة', 'رحلتان', 'رحلتين', 'رحلات', 'رحلة'],
    [['زيارتان', 'زيارتين', 'زيارات', 'زيارة'], 'زيارة', 'زيارتان', 'زيارتين', 'زيارات', 'زيارة'],
    [['صفان', 'صفين', 'صفًا', 'صفوف', 'صف'], 'صف', 'صفان', 'صفين', 'صفوف', 'صفًا'],
    [['موظفان', 'موظفَين', 'موظفًا', 'موظفين', 'موظف'], 'موظف', 'موظفان', 'موظفَين', 'موظفين', 'موظفًا'],
    [['مهمتان', 'مهمتين', 'مهام', 'مهمة'], 'مهمة', 'مهمتان', 'مهمتين', 'مهام', 'مهمة'],
    [['رسالتان', 'رسالتين', 'رسائل', 'رسالة'], 'رسالة', 'رسالتان', 'رسالتين', 'رسائل', 'رسالة'],
    [['طلبان', 'طلبين', 'طلبًا', 'طلبات', 'طلب'], 'طلب', 'طلبان', 'طلبين', 'طلبات', 'طلبًا'],
    [['مجموعتان', 'مجموعتين', 'مجموعات', 'مجموعة'], 'مجموعة', 'مجموعتان', 'مجموعتين', 'مجموعات', 'مجموعة'],
    [['صالتان', 'صالتين', 'صالات', 'صالة'], 'صالة', 'صالتان', 'صالتين', 'صالات', 'صالة'],
    [['عمودان', 'عمودين', 'عمودًا', 'أعمدة', 'عمود'], 'عمود', 'عمودان', 'عمودين', 'أعمدة', 'عمودًا'],
    [['شركتان', 'شركتين', 'شركات', 'شركة'], 'شركة', 'شركتان', 'شركتين', 'شركات', 'شركة'],
    [['موقعان', 'موقعين', 'موقعًا', 'مواقع', 'موقع'], 'موقع', 'موقعان', 'موقعين', 'مواقع', 'موقعًا'],
    [['حرفان', 'حرفين', 'حرفًا', 'أحرف', 'حرف'], 'حرف', 'حرفان', 'حرفين', 'أحرف', 'حرفًا'],
    [['صفحتان', 'صفحتين', 'صفحات', 'صفحة'], 'صفحة', 'صفحتان', 'صفحتين', 'صفحات', 'صفحة'],
    [['مركزان', 'مركزين', 'مركزًا', 'مراكز', 'مركز'], 'مركز', 'مركزان', 'مركزين', 'مراكز', 'مركزًا']
  ];
  var NOUNF = {}, HUMAN = { 'حاج': 1, 'موظف': 1 };
  // adjectives that follow a counted noun agree with the form it takes (سريرًا فارغًا, سريران شاغران, 3 أسرّة شاغرة, 3 حجاج مسكّنون)
  var ADJ = ['فارغ', 'شاغر', 'مشغول', 'مستخدم', 'محجوز', 'منتظر', 'مسكّن', 'مفتوح', 'متأخر', 'متاح', 'مكتمل', 'جديد', 'مسجل', 'محجوب', 'نشط', 'مغلق', 'مُقيَّم', 'مقيَّم'], ADJF = {};
  var NOUNRE = (function () { var all = [], adj = []; NOUN.forEach(function (x) { x[0].forEach(function (f) { NOUNF[f] = x; all.push(f); }); });
    ADJ.forEach(function (a) { ['تان', 'تين', 'ون', 'ين', 'ان', 'ًا', 'ة', ''].forEach(function (e) { ADJF[a + e] = a; adj.push(a + e); }); });
    var by = function (a, b) { return b.length - a.length; }; all.sort(by); adj.sort(by);
    return new RegExp('(^|[^\\d,.:/\\u0660-\\u0669])(\\d{1,3}(?:,\\d{3})+|\\d+) (' + all.join('|') + ')(?: (' + adj.join('|') + '))?(?![\\u0621-\\u065F\\u0670\\u0640])', 'g'); })();
  var IDL = /^(?:مخيم|طابق|غرفة|خيمة|سرير|ليلة|صالة|رحلة|حافلة|مربع|شارع|بوابة|قسم|صف|عيادة|مجموعة|منطقة|برج|مسار|موقع|مركز|بند|صفحة|رقم|مرحلة|باقة|مبنى|جناح|ساحة|مقعد|نقطة|طاولة|نافذة|حقيبة|وجبة|حاج|موظف|طلب|رسالة|مهمة|يوم|أسبوع|شهر|فندق|نسخة|إصدار|موسم|جولة|دفعة|قافلة|فوج|مخطط)$/;
  var DUALOK = /^(?:في|من|إلى|على|عن|مع|أو|و|ثم|كما|ما|لا|لم|قبل|بعد|منذ|خلال|حتى|فقط)$/;
  var DUALN = /(?:^|[·،,:;(|›→←—–-])\s*$/;   // the dual is nominative (غرفتان) where it starts the text or a part, else accusative / genitive (غرفتين, as after في, من, منذ or an adjective)
  function agree(r) {
    return r.replace(NOUNRE, function (m, pre, num, w, a, at, all) { var x = NOUNF[w], n = +num.replace(/,/g, ''), k = n >= 100 ? n % 100 : n, before = all.slice(0, at + pre.length);
      if (/\/\s*$/.test(before)) return m;   // "3 / 2 beds": a share, not a count
      var pw = (before.match(/([ء-يـ]+)\s*$/) || [])[1]; if (pw && IDL.test(pw.replace(/^و?(?:ال)?/, ''))) return m;   // "مخيم 9 صالة": a number that names a place, not a count
      var fem = /ة$/.test(x[1]), s = a ? ADJF[a] : null, f, e;
      if (n === 2 && !s) { var nx = (all.slice(at + m.length).match(/^ ([ء-يً-ٟـ]+)/) || [])[1]; if (nx && !DUALOK.test(nx)) return m; }   // "2 صف باقة": a noun that leads into another word stays as written
      if (n === 2) { var nom = DUALN.test(before); f = nom ? x[2] : x[3]; e = fem ? (nom ? 'تان' : 'تين') : (nom ? 'ان' : 'ين'); return pre + f + (s ? ' ' + s + e : ''); }
      if (k <= 2) { f = x[1]; e = fem ? 'ة' : ''; }
      else if (k <= 10) { f = x[4]; e = HUMAN[x[1]] ? 'ون' : 'ة'; }
      else { f = x[5]; e = fem ? 'ة' : 'ًا'; }
      return pre + num + ' ' + f + (s ? ' ' + s + e : ''); });
  }
  var GRAM = [['إلى المشرفون والمرشدون', 'إلى المشرفين والمرشدين'], ['إلى المشرفون', 'إلى المشرفين'], ['إلى المرشدون', 'إلى المرشدين'], ['إلى الموظفون', 'إلى الموظفين'], ['والمرشدون', 'والمرشدين']];
  function polish(r) {
    r = agree(r);
    for (var i = 0; i < GRAM.length; i++) if (r.indexOf(GRAM[i][0]) >= 0 && (i === 4 ? /إلى [^ ]+ والمرشدون/.test(r) : true)) r = r.split(GRAM[i][0]).join(GRAM[i][1]);
    return r;
  }
  function tr0(text, deep) {
    var tt = text.replace(/\s+/g, ' ').trim();
    if (/…$/.test(tt) && tt.length > 2) { var cut = tr0(tt.slice(0, -1), deep); return cut == null ? null : cut + '…'; }   // "Aisha…" (a cut name or label)
    var res = tr1(text, deep); return res == null || deep ? res : polish(res);
  }
  function tr1(text, deep) {
    var t = text.replace(/\s+/g, ' ').trim(); if (!t || !LATIN.test(t)) return null;
    if (/^[A-Z]{1,3}$/.test(t) && !AMPM[t]) return null;                      // initials
    var r = one(t); if (r != null) return r;
    if (AMPM[t]) return AMPM[t];
    r = templ(t); if (r != null) return r;
    var lm = t.match(/^(\d[\d,]*(?:–\d[\d,]*)?) of (\d[\d,]*) (.+)$/);
    if (lm) { var rest = tr(lm[3], 1); if (rest != null) return lm[1] + ' من ' + lm[2] + ' ' + rest; }
    var pm = t.match(/^([^:]{1,48}?):\s+(.+)$/);                               // "Label: value"
    if (pm) { var lab = one(pm[1] + ':'), lab2 = lab == null ? one(pm[1]) : null;
      if (lab != null || lab2 != null) { var val = tr(pm[2], 1); return (lab != null ? lab.replace(/:\s*$/, '') : lab2) + ': ' + (val != null ? val : pm[2]); } }
    var parts = t.split(SEP);
    if (parts.length > 1) {
      var any = false;
      for (var i = 0; i < parts.length; i++) {
        if (i % 2) { parts[i] = parts[i].replace(/[→←]/, function (c) { return FLIP[c]; }); continue; }
        var p = parts[i]; if (!LATIN.test(p)) continue;
        var x = tr(p, 1);
        if (x != null) { parts[i] = x; any = true; }
      }
      if (any) return parts.join('');
    }
    var w = words(t); if (w != null) return w;
    return phrases(t);
  }

  var LRI = '\u2066', PDI = '\u2069', ARAB = /[\u0600-\u06FF]/, RUN = /[+#]?[A-Za-z0-9](?:[A-Za-z0-9.:\/_@#+\-–]|,(?=\d))*(?:[ ][+#]?[A-Za-z0-9](?:[A-Za-z0-9.:\/_@#+\-–]|,(?=\d))*)*/g, FILE = /[\w\u0600-\u06FF-]+\.(?:xlsx?|csv|pdf|docx?|pptx?|png|jpe?g|zip|txt)\b|\([‎‏]?\.?[A-Za-z0-9]+\)/g;
  function iso(t) { if (!ARAB.test(t) || t.indexOf(LRI) >= 0 || t.indexOf('\u2067') >= 0) return t; var keep = []; t = t.replace(FILE, function (m) { keep.push(m); return '\uE000' + (keep.length - 1) + '\uE001'; });   // file names and (.xlsx) read left to right as one piece
    return t.replace(RUN, function (m) { return /[A-Za-z]|\d.*[-\/:.]\d|^\+|^\(/.test(m) || /\d[ ]\d/.test(m) ? LRI + m + PDI : m; }).replace(/\uE000(\d+)\uE001/g, function (_, i) { var m = keep[+i], a = m.match(/^([\u0600-\u06FF][\u0600-\u06FF_ ]*[-_]?)([A-Za-z0-9].*)$/); return a ? '\u2067' + a[1] + LRI + a[2] + PDI + PDI : LRI + m + PDI; }); }   /* an Arabic file name reads right to left: the Arabic word, then the date and extension as one left-to-right piece */
  var GLYPH = /^\s*[«‹›»]\s*$/;
  var ENLAB = /^\s*(english( name| title| text| description)?|name \(english\)|en)\s*:?\s*$/i;
  function engText(el) { if (!el) return ''; var tn = el.firstChild; return (tn && tn.nodeType === 3 && orig.get(tn)) || (el.getAttribute && el.getAttribute('data-en-label')) || el.textContent || ''; }
  function englishSlot(el) {   // the element is the value of an English field: its label sits just before it, or labels the field
    if (!el || !el.previousElementSibling && !el.closest) return false;
    var prev = el.previousElementSibling; if (prev && ENLAB.test(engText(prev))) return true;
    var lab = el.closest && el.closest('label'); if (lab && lab.firstElementChild && lab.firstElementChild !== el && ENLAB.test(engText(lab.firstElementChild))) return true;
    var a = origAttr.get(el); return !!((a && ENLAB.test(a['aria-label'] || '')) || ENLAB.test(el.getAttribute && el.getAttribute('aria-label') || ''));
  }
  function noTr(pe) { return pe && pe.closest && pe.closest('[data-no-tr], .side, .splash, [data-md="lang"]'); }
  function doText(n) {
    var cur = n.nodeValue, pe = n.parentNode;
    if (pe && pe.closest && pe.closest('[data-md]')) {            // the language button offers the other language
      if (pe.closest('[data-md="lang"]') && cur.trim() && cur.trim() !== 'English' && !/^EN$/.test(cur.trim())) n.nodeValue = 'English';
      return;
    }
    if (noTr(pe)) return;
    if (USER[cur.trim()]) return;   // the user's own text
    if (/^\s*[A-Za-z]\s*$/.test(cur) && pe && pe.getBoundingClientRect && pe.getBoundingClientRect().width <= 32) { pe.setAttribute('aria-hidden', 'true'); pe.setAttribute('data-no-tr', ''); return; }   // a one-letter icon (the info "i" in a round badge)
    if (pe && englishSlot(pe)) { if (pe.setAttribute && !pe.hasAttribute('lang')) pe.setAttribute('lang', 'en'); return; }   // stays English; keeps the page direction (aligned like its label)
    if (mine.get(n) === cur) return;                               // our own Arabic
    if (/^[\s←→▸◂⌕]+$/.test(cur) && /[←→▸◂]/.test(cur)) { var fl = cur.replace(/[←→▸◂]/g, function (c) { return FLIP[c]; }); orig.set(n, cur); mine.set(n, fl); n.nodeValue = fl; return; }
    // a lone "AM" / "PM" is a time only inside a picker control; elsewhere it is someone's initials
    var a = /^\s*(AM|PM)\s*$/.test(cur) && !(pe && pe.closest && pe.closest('button, [role="option"], [role="radio"], select, option')) ? null : tr(cur);
    orig.set(n, cur);
    if (a == null) {
      mine.delete(n);
      if (GLYPH.test(cur) && pe && pe.setAttribute) pe.setAttribute('data-md-glyph', '');   // « ‹ › » point the reading way (CSS makes them mirror)
      var w = iso(cur); if (w !== cur) { mine.set(n, w); n.nodeValue = w; }
      return;
    }
    if (pe && pe.setAttribute && ENLAB.test(cur)) pe.setAttribute('data-en-label', cur.trim());
    var lead = cur.match(/^\s*/)[0], trail = cur.match(/\s*$/)[0], v = lead + iso(a) + trail;
    mine.set(n, v); n.nodeValue = v;
  }
  var ATTRS = ['placeholder', 'title', 'aria-label'];
  function doEl(el) {
    if (el.getAttribute && el.getAttribute('data-md') === 'lang') { if (!el.querySelector('svg') && el.textContent !== 'English') el.textContent = 'English'; return; }
    if (el.closest && el.closest('.side, .splash, [data-md="lang"]')) return;
    var keepData = noTr(el);   // [data-no-tr] keeps its data (text, field values); tooltips and labels on it still translate
    for (var i = 0; i < ATTRS.length; i++) {
      var k = ATTRS[i], v = el.getAttribute && el.getAttribute(k); if (!v) continue;
      var o = origAttr.get(el) || {}; if (o['_' + k] === v) continue;
      var a = tr(v); if (a == null) continue;
      a = iso(a); o[k] = v; o['_' + k] = a; origAttr.set(el, o); el.setAttribute(k, a); if (k === 'title') el.setAttribute('data-en-title', v);
    }
    if (keepData) return;
    if ((el.tagName === 'TEXTAREA' || (el.tagName === 'INPUT' && /^(text|search|email|tel|url|number|)$/.test(el.type || ''))) && !el.hasAttribute('dir')) { el.setAttribute('dir', 'auto'); el.setAttribute('data-md-dir', ''); }
    // default text in fields (for example a message template); not while someone types in it
    if ((el.tagName === 'TEXTAREA' || (el.tagName === 'INPUT' && /^(text|search|)$/.test(el.type || ''))) && el.value && LATIN.test(el.value) && (document.activeElement !== el || !el.__mdTyped)) {
      if (englishSlot(el)) return;
      var ov = origVal.get(el); if (ov && ov[1] === el.value) return;
      // a field's own data (an English name next to an Arabic name field) stays: only a whole known text is translated ("Open all day")
      var tv = el.tagName === 'TEXTAREA' ? el.value.split('\n').map(function (ln) { var x = tr(ln); return x == null ? ln : x; }).join('\n') : (one(el.value.replace(/\s+/g, ' ').trim()) || templ(el.value.replace(/\s+/g, ' ').trim()));
      if (tv != null && tv !== el.value) { origVal.set(el, [el.value, tv]); el.value = tv; try { el.dispatchEvent(new Event('input', { bubbles: true })); el.dispatchEvent(new Event('change', { bubbles: true })); } catch (e) {} }
    }
  }
  function walk(root) {
    if (root.nodeType === 3) { doText(root); return; }
    if (root.nodeType !== 1 || /^(SCRIPT|STYLE)$/.test(root.tagName)) return;
    if (root.closest && root.closest('.side, .splash')) return;
    doEl(root);
    var w = document.createTreeWalker(root, NodeFilter.SHOW_ELEMENT | NodeFilter.SHOW_TEXT), n;
    while ((n = w.nextNode())) {
      if (n.nodeType === 3) { var pe = n.parentNode; if (pe && !/^(SCRIPT|STYLE)$/.test(pe.tagName)) doText(n); }
      else doEl(n);
    }
  }
  var mo = new MutationObserver(function (recs) {
    if (!on) return;
    for (var i = 0; i < recs.length; i++) {
      var r = recs[i];
      if (r.type === 'characterData') doText(r.target);
      else if (r.type === 'attributes') doEl(r.target);
      else for (var j = 0; j < r.addedNodes.length; j++) walk(r.addedNodes[j]);
    }
  });
  function restore(root) {
    var w = document.createTreeWalker(root, NodeFilter.SHOW_ELEMENT | NodeFilter.SHOW_TEXT), n;
    while ((n = w.nextNode())) {
      if (n.nodeType === 3) { if (mine.get(n) === n.nodeValue && orig.has(n)) { n.nodeValue = orig.get(n); mine.delete(n); } }
      else {
        if (n.getAttribute('data-md') === 'lang' && !n.querySelector('svg')) n.textContent = 'العربية';
        var ov = origVal.get(n); if (ov && n.value === ov[1]) { n.value = ov[0]; origVal.delete(n); }
        if (n.hasAttribute('data-md-dir')) { n.removeAttribute('dir'); n.removeAttribute('data-md-dir'); }
        if (n.hasAttribute('data-md-glyph')) n.removeAttribute('data-md-glyph');
        var o = origAttr.get(n); if (!o) continue;
        ATTRS.forEach(function (k) { if (o[k] != null && n.getAttribute(k) === o['_' + k]) n.setAttribute(k, o[k]); });
        origAttr.delete(n);
      }
    }
  }
  function apply(l) {
    var want = l === 'ar'; dict();
    document.documentElement.style.setProperty('--dirx', want ? '-1' : '1');
    if (want === on) return;
    on = want; var root = document.querySelector('.stage-wrap') || document.body;
    if (on) { walk(root); mo.observe(root, { childList: true, subtree: true, characterData: true, attributes: true, attributeFilter: ATTRS.concat(['value']) }); }
    else { mo.disconnect(); restore(root); }
  }
  var USER = {}; document.addEventListener('input', function (e) { if (e.target && e.isTrusted) { e.target.__mdTyped = true; var v = String(e.target.value || '').trim(); if (v.length > 1 && LATIN.test(v)) USER[v] = 1; } }, true);   // the user's own text is never translated
  window.MADAR_I18N = { apply: apply, tr: tr, agree: agree, halfDone: function (t) { dict(); return halfDone(t); }, load: load, ready: function () { return !!window.MADAR_AR || arFail; } };
})();
