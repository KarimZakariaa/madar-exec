/* Madar design runtime — renders the Madar design components (template + logic)
   in any modern browser, with no dependencies. Updates the page in place on each
   state change, so CSS animations, inputs and timers behave as in the prototype. */
(function () {
  'use strict';
  var SVG_NS = 'http://www.w3.org/2000/svg';
  var REG = {};
  var VOID = /<(input|img|br|meta|link|hr|source|area|col|wbr)(\s[^<>]*?)?\s*(\/)?>/gi;

  function DCLogic() { this.props = {}; this.state = {}; }
  DCLogic.prototype.setState = function (o) {
    this.state = Object.assign({}, this.state, typeof o === 'function' ? o(this.state, this.props) : o);
    schedule(this);
  };
  DCLogic.prototype.forceUpdate = function () { schedule(this); };
  window.DCLogic = DCLogic;

  var queue = [];
  function schedule(logic) {
    if (!logic.__wrapper) return;
    if (queue.indexOf(logic) < 0) queue.push(logic);
    if (queue.length === 1) Promise.resolve().then(flush);
  }
  function flush() {
    var q = queue.slice(); queue.length = 0;
    q.forEach(function (l) { if (l.__wrapper && l.__wrapper.isConnected) renderComp(l.__wrapper); });
  }

  function define(name, template, logicFactory) {
    template = template.replace(/(<[a-z][^<>]*?\s)(checked|disabled|readonly|selected|autofocus|required|inert|multiple|hidden)(?=[\s\/>])/g, '$1$2=""');
    var xml = '<x-root>' + template.replace(VOID, function (m, tag, rest, slash) { return '<' + tag + (rest || '') + '/>'; }) + '</x-root>';
    var doc = new DOMParser().parseFromString(xml, 'application/xml');
    var err = doc.getElementsByTagName('parsererror')[0];
    if (err) { console.error('Madar template parse error in ' + name, err.textContent); }
    var root = doc.documentElement;
    var helmet = root.getElementsByTagName('helmet')[0];
    if (helmet) injectHelmet(name, helmet);
    REG[name] = { root: root, Logic: logicFactory(DCLogic) };
  }

  function injectHelmet(name, helmet) {
    Array.prototype.forEach.call(helmet.childNodes, function (n) {
      if (n.nodeType !== 1) return;
      var tag = n.localName;
      if (tag === 'style') {
        var st = document.createElement('style'); st.setAttribute('data-dc', name); st.textContent = n.textContent; document.head.appendChild(st);
      } else if (tag === 'link') {
        var href = n.getAttribute('href');
        if (document.querySelector('link[href="' + href + '"]')) return;
        var l = document.createElement('link');
        Array.prototype.forEach.call(n.attributes, function (a) { l.setAttribute(a.name, a.value); });
        document.head.appendChild(l);
      }
    });
  }

  // ---------- template evaluation ----------
  var WHOLE = /^\s*\{\{\s*([^{}]+?)\s*\}\}\s*$/;
  var PART = /\{\{\s*([^{}]+?)\s*\}\}/g;
  function lookup(path, scope) {
    if (path === 'true') return true;
    if (path === 'false') return false;
    if (path === 'null') return null;
    if (/^-?\d+(\.\d+)?$/.test(path)) return parseFloat(path);
    var parts = path.split('.'); var v = scope;
    for (var i = 0; i < parts.length; i++) { if (v == null) return undefined; v = v[parts[i]]; }
    return v;
  }
  function attrVal(str, scope) {
    var m = WHOLE.exec(str);
    if (m) return lookup(m[1], scope);
    if (str.indexOf('{{') < 0) return str;
    return str.replace(PART, function (_, p) { var v = lookup(p, scope); return v == null ? '' : String(v); });
  }
  function extend(scope, o) { var s = Object.create(scope); for (var k in o) s[k] = o[k]; return s; }
  function camel(s) { return s.replace(/-([a-z])/g, function (_, c) { return c.toUpperCase(); }); }

  // sc-if / sc-for render into an invisible wrapper so siblings never shift
  var G = { style: 'display:contents' };
  function renderNodes(nodes, scope, out) {
    out = out || [];
    for (var i = 0; i < nodes.length; i++) renderNode(nodes[i], scope, out);
    return out;
  }
  function renderNode(node, scope, out) {
    if (node.nodeType === 3) { out.push({ t: '#', v: attrVal(node.nodeValue, scope) }); return; }
    if (node.nodeType !== 1) return;
    var tag = node.localName;
    if (tag === 'helmet') return;
    if (tag === 'sc-if') {
      out.push({ t: 'dc-g', a: G, c: attrVal(node.getAttribute('value') || '', scope) ? renderNodes(node.childNodes, scope) : [] });
      return;
    }
    if (tag === 'sc-for') {
      var list = attrVal(node.getAttribute('list') || '', scope) || [];
      var as = node.getAttribute('as') || 'item';
      var items = [];
      for (var j = 0; j < list.length; j++) { var o = {}; o[as] = list[j]; o.$index = j; renderNodes(node.childNodes, extend(scope, o), items); }
      out.push({ t: 'dc-g', a: G, c: items });
      return;
    }
    var attrs = {};
    for (var a = 0; a < node.attributes.length; a++) {
      var at = node.attributes[a];
      if (at.name.indexOf('hint-') === 0) continue;
      attrs[at.name] = attrVal(at.value, scope);
    }
    if (tag === 'dc-import') {
      var props = {}; var nm = attrs.name;
      for (var k in attrs) if (k !== 'name') props[camel(k)] = attrs[k];
      out.push({ t: '@', name: nm, props: props });
      return;
    }
    out.push({ t: tag, a: attrs, c: renderNodes(node.childNodes, scope) });
  }

  // ---------- DOM patching ----------
  function create(v, ns) {
    if (v.t === '#') return document.createTextNode(v.v == null ? '' : String(v.v));
    if (v.t === '!') return document.createComment('');
    if (v.t === '@') return createComp(v);
    var nns = v.t === 'svg' ? SVG_NS : ns;
    var el = nns ? document.createElementNS(nns, v.t) : document.createElement(v.t);
    setAttrs(el, {}, v.a, true);
    var kids = v.c;
    for (var i = 0; i < kids.length; i++) el.appendChild(create(kids[i], nns));
    if (v.a.defaultValue != null && 'value' in el) el.value = v.a.defaultValue;
    return el;
  }
  function setAttrs(el, oldA, newA, isNew) {
    var k;
    for (k in oldA) if (!(k in newA)) {
      if (k.indexOf('on') === 0) el[k.toLowerCase()] = null; else el.removeAttribute(k === 'className' ? 'class' : k);
    }
    for (k in newA) {
      var v = newA[k];
      if (k.indexOf('on') === 0 && (typeof v === 'function' || v == null)) { el[k.toLowerCase()] = v || null; continue; }
      if (k === 'defaultValue') continue;
      if (k === 'checked') { el.checked = !!v; continue; }
      if (k === 'style') { var s = v == null ? '' : String(v); if (el.__style !== s) { el.style.cssText = s; el.__style = s; } continue; }
      if (v === false || v == null) { el.removeAttribute(k); continue; }
      var sv = String(v);
      if (isNew || oldA[k] !== v) {
        if (k === 'value' && el.tagName === 'INPUT') { if (isNew) el.setAttribute('value', sv); else if (el.value !== sv && document.activeElement !== el) el.value = sv; continue; }   // MAD-HSD-570 · rows reordered or removed by the page show their own values
        if (k === 'value' && el.tagName === 'TEXTAREA') { if (el.value !== sv && document.activeElement !== el) el.value = sv; else if (isNew) el.value = sv; continue; }
        el.setAttribute(k, sv);
      }
    }
  }
  function same(dom, v) {
    if (!dom) return false;
    if (v.t === '#') return dom.nodeType === 3;
    if (v.t === '!') return dom.nodeType === 8;
    if (v.t === '@') return dom.nodeType === 1 && dom.__dcName === v.name;
    return dom.nodeType === 1 && !dom.__dcName && dom.localName === v.t;
  }
  function patchChildren(parent, vs) {
    var ns = parent.namespaceURI === SVG_NS ? SVG_NS : null;
    for (var i = 0; i < vs.length; i++) {
      var v = vs[i]; var old = parent.childNodes[i];
      if (!old) parent.appendChild(create(v, ns));
      else if (same(old, v)) update(old, v);
      else { var n = create(v, ns); unmountTree(old); parent.replaceChild(n, old); }
    }
    while (parent.childNodes.length > vs.length) { var last = parent.lastChild; unmountTree(last); parent.removeChild(last); }
  }
  function update(dom, v) {
    if (v.t === '#') { var s = v.v == null ? '' : String(v.v); if (dom.nodeValue !== s) dom.nodeValue = s; return; }
    if (v.t === '!') return;
    if (v.t === '@') { dom.__logic.props = v.props; renderComp(dom); return; }
    setAttrs(dom, dom.__a || {}, v.a, false);
    dom.__a = v.a;
    patchChildren(dom, v.c);
  }
  function createComp(v) {
    var def = REG[v.name];
    var w = document.createElement('div');
    w.style.display = 'contents';
    w.setAttribute('data-dc-comp', v.name);
    w.__dcName = v.name;
    if (!def) { w.textContent = 'Missing component ' + v.name; return w; }
    var logic = new def.Logic();
    logic.props = v.props; logic.state = logic.state || {};
    logic.__wrapper = w; w.__logic = logic;
    renderComp(w);
    if (logic.componentDidMount) Promise.resolve().then(function () { logic.componentDidMount(); });
    return w;
  }
  function renderComp(w) {
    var logic = w.__logic; var def = REG[w.__dcName];
    var vals = logic.renderVals() || {};
    patchChildren(w, renderNodes(def.root.childNodes, vals));
  }
  function unmountTree(node) {
    if (!node || node.nodeType !== 1) return;
    var list = [node].concat(Array.prototype.slice.call(node.querySelectorAll('[data-dc-comp]')));
    list.forEach(function (w) { if (w.__logic) { if (w.__logic.componentWillUnmount) w.__logic.componentWillUnmount(); w.__logic.__wrapper = null; } });
  }
  // keep __a in sync for newly created elements
  var _create = create;
  create = function (v, ns) { var el = _create(v, ns); if (v.t !== '#' && v.t !== '!' && v.t !== '@') el.__a = v.a; return el; };

  function mount(name, el, props) {
    var w = el.firstChild;
    if (w && w.__dcName === name) { w.__logic.props = props || {}; renderComp(w); return w.__logic; }
    while (el.firstChild) { unmountTree(el.firstChild); el.removeChild(el.firstChild); }
    w = createComp({ t: '@', name: name, props: props || {} });
    el.appendChild(w);
    return w.__logic;
  }

  // MAD-HSD-618 · the shared engine (app/pages/_engine.js, window.MADAR_ENGINE): an engine page carries its template and logic as line
  // edits of the base [from, to, new lines or null], applied here exactly as tools/build-madar.py checked them at build time.
  function engine(v) {
    var E = window.MADAR_ENGINE;
    if (!E || E.v !== v) throw new Error('Madar: this page needs the shared engine ' + v + ' (app/pages/_engine.js is ' + (E ? E.v : 'missing') + '): rebuild with tools/build-madar.py');
    return E;
  }
  function edit(base, ops) {
    var L = base.split('\n'), out = [], at = 0;
    for (var i = 0; i < ops.length; i++) { var o = ops[i]; for (; at < o[0]; at++) out.push(L[at]); if (o[2] !== null) out.push(o[2]); at = o[1]; }
    for (; at < L.length; at++) out.push(L[at]);
    return out.join('\n');
  }
  function patch(v, ops) { return edit(engine(v).t, ops); }
  function engineLogic(v, ops) { return new Function('DCLogic', edit(engine(v).l, ops) + '\nreturn Component;'); }   // eslint-disable-line no-new-func

  window.MadarDC = { define: define, mount: mount, registry: REG, patch: patch, engineLogic: engineLogic };
})();
