#!/usr/bin/env python3
"""Port the executive dashboards prototype into the Madar design.

Reads the downloaded prototype (index.html, *.js, *.css, flags/) from SRC and writes exec/ for the
Madar shell:
  exec/dashboards.css   the prototype CSS, scoped under .ex-root, every colour mapped onto the Madar
                        palette tokens (--x-*) by role (text, fill, border), fonts moved to Tajawal/Cairo
  exec/js/*.js          the prototype scripts, colours mapped the same way, rebranded to Madar
  exec/markup.js        the executive page markup (filters, journey, sections) as a template
  exec/i18n-data.js     the English dictionary (rebranded keys)
  exec/flags/*.png      flag images

Usage: python3 tools/port-dashboards.py SRC OUT
"""
import colorsys, json, os, re, shutil, sys

SRC, OUT = sys.argv[1], sys.argv[2]
EX = os.path.join(OUT, 'exec')
os.makedirs(os.path.join(EX, 'js'), exist_ok=True)

# ------------------------------------------------------------------ colours
HEX = re.compile(r'#(?:[0-9a-fA-F]{8}|[0-9a-fA-F]{6}|[0-9a-fA-F]{3})(?![0-9a-fA-F])')

def rgb(h):
    h = h[1:]
    if len(h) == 3:
        h = ''.join(c * 2 for c in h)
    a = int(h[6:8], 16) / 255 if len(h) == 8 else 1.0
    return int(h[0:2], 16), int(h[2:4], 16), int(h[4:6], 16), a

def fam(r, g, b):
    h, l, s = colorsys.rgb_to_hls(r / 255, g / 255, b / 255)
    hue = h * 360
    if l > .985:
        return 'white', l, s, hue
    if s < .12 or (l > .9 and s < .2):
        return 'neutral', l, s, hue
    if 265 <= hue <= 335:
        return 'purple', l, s, hue
    if 25 <= hue < 62:
        return 'gold', l, s, hue
    if 62 <= hue < 180:
        return ('neutral' if s < .2 else 'green'), l, s, hue
    if 180 <= hue < 265:
        return ('neutral' if s < .2 else 'blue'), l, s, hue
    return 'red', l, s, hue

def pct(v):
    return max(1, min(100, round(v * 100)))

def tint(tok, l, base_l):
    """a light colour = a share of the token over the surface"""
    p = (1 - l) / max(.05, (1 - base_l))
    if p >= .97:
        return f'var({tok})'
    return f'color-mix(in srgb,var({tok}) {pct(p)}%,var(--x-surface))'

FAMTOK = {'gold': ('--x-c2', .58), 'green': ('--x-ok', .32), 'red': ('--x-bad', .5), 'blue': ('--x-info', .42)}

def map_hex(h, role, ctx=None):
    r, g, b, a = rgb(h)
    f, l, s, hue = fam(r, g, b)
    out = None
    if role == 'text':
        if f == 'white':
            out = 'var(--x-pill-ink)' if ctx == 'onpill' else '#fff'
        elif f in ('purple', 'neutral'):
            if l < .3:
                out = 'var(--x-text)'
            elif l < .5:
                out = 'color-mix(in srgb,var(--x-text) 45%,var(--x-muted))'
            elif l < .7:
                out = 'var(--x-muted)'
            else:
                out = 'color-mix(in srgb,var(--x-muted) 62%,var(--x-surface))'
        elif f == 'gold':
            out = 'var(--x-warn)' if l < .42 else 'var(--x-accent)'
        elif f == 'green':
            out = 'var(--x-ok)'
        elif f == 'red':
            out = 'var(--x-bad)'
        else:
            out = 'var(--x-info)'
    elif role in ('bg', 'graphic', 'border'):
        if f == 'white':
            out = 'var(--x-surface)'
        elif l >= .8:   # tints
            if f in ('purple', 'neutral'):
                out = tint('--x-tint', l, .2) if (f == 'neutral' or s < .25) else tint('--x-mid', l, .34)
            else:
                tok, bl = FAMTOK[f]
                out = tint(tok, l, bl)
        else:
            if f in ('purple', 'neutral'):
                if l < .4:
                    out = 'var(--x-c1)'
                else:
                    out = tint('--x-c1', l, .34) if s >= .12 else tint('--x-c3', l, .45)
            else:
                tok, bl = FAMTOK[f]
                out = f'var({tok})' if l <= bl + .1 else tint(tok, l, bl)
    else:
        out = h
    if a < 1:
        if role == 'shadow':
            out = 'var(--x-shadow)'
        out = f'color-mix(in srgb,{out} {pct(a)}%,transparent)'
    return out

ROLE_OF_PROP = {}
def role_of(prop):
    p = prop.strip().lower()
    if p in ('color', '-webkit-text-fill-color', 'caret-color', 'accent-color'):
        return 'text'
    if p.startswith('background'):
        return 'bg'
    if p == 'box-shadow' or p == 'text-shadow' or p == 'filter':
        return 'shadow'
    if p.startswith('border') or p.startswith('outline') or p in ('text-decoration-color', 'column-rule', 'column-rule-color'):
        return 'border'
    if p in ('fill', 'stroke', 'stop-color', 'flood-color'):
        return 'graphic'
    if p.startswith('--'):
        return 'bg'
    return 'bg'

def map_value(prop, val, ctx=None):
    role = role_of(prop)
    if role == 'shadow':
        def sh(m):
            r, g, b, a = rgb(m.group(0))
            f, l, s, hue = fam(r, g, b)
            if f == 'white':
                return f'color-mix(in srgb,var(--x-surface) {pct(a)}%,transparent)'
            if l > .6:
                return map_hex(m.group(0), 'border')
            return f'color-mix(in srgb,var(--x-shadow) {pct(a)}%,transparent)' if a < 1 else map_hex(m.group(0), 'bg')
        val = HEX.sub(sh, val)
        return re.sub(r'\bwhite\b', 'var(--x-surface)', val)
    val = HEX.sub(lambda m: map_hex(m.group(0), role, ctx), val)
    if role == 'text':
        val = re.sub(r'\bwhite\b', 'var(--x-pill-ink)' if ctx == 'onpill' else '#fff', val)
    else:
        val = re.sub(r'\bwhite\b', 'var(--x-surface)', val)
    return val

# ------------------------------------------------------------------ CSS parsing
def parse(css):
    """-> list of nodes: ('rule', selector, decls) | ('at', prelude, children|None, raw)"""
    css = re.sub(r'/\*.*?\*/', '', css, flags=re.S)
    i, n, out = 0, len(css), []
    def block(i):
        depth, j, q = 0, i, None
        while j < n:
            c = css[j]
            if q:
                if c == q and css[j - 1] != '\\':
                    q = None
            elif c in '"\'':
                q = c
            elif c == '{':
                depth += 1
            elif c == '}':
                depth -= 1
                if depth == 0:
                    return j
            j += 1
        return n - 1
    while i < n:
        while i < n and css[i] in ' \n\t\r;':
            i += 1
        if i >= n:
            break
        j = css.find('{', i)
        semi = css.find(';', i)
        if css[i] == '@' and (j < 0 or (semi >= 0 and semi < j)):
            out.append(('at', css[i:semi].strip(), None, css[i:semi + 1]))
            i = semi + 1
            continue
        if j < 0:
            break
        pre = css[i:j].strip()
        end = block(j)
        body = css[j + 1:end]
        if pre.startswith('@'):
            if re.match(r'@(media|supports|layer|container)', pre):
                out.append(('at', pre, parse(body), None))
            else:
                out.append(('at', pre, None, pre + '{' + body + '}'))
        else:
            out.append(('rule', pre, body))
        i = end + 1
    return out

def decls(body):
    res, cur, q, depth = [], '', None, 0
    for c in body:
        if q:
            cur += c
            if c == q:
                q = None
            continue
        if c in '"\'':
            q = c
        elif c == '(':
            depth += 1
        elif c == ')':
            depth -= 1
        if c == ';' and depth == 0:
            res.append(cur)
            cur = ''
        else:
            cur += c
    if cur.strip():
        res.append(cur)
    out = []
    for d in res:
        if ':' in d:
            p, v = d.split(':', 1)
            out.append((p.strip(), v.strip()))
    return out

def split_sel(s):
    parts, cur, depth = [], '', 0
    for c in s:
        if c in '([':
            depth += 1
        elif c in ')]':
            depth -= 1
        if c == ',' and depth == 0:
            parts.append(cur.strip())
            cur = ''
        else:
            cur += c
    if cur.strip():
        parts.append(cur.strip())
    return parts

ROOT = '.ex-root'
def scope_one(s):
    if re.match(r'html\[data-lang', s):
        return None
    m = re.match(r'^(\[dir=["\']?(?:ltr|rtl)["\']?\])\s*(.*)$', s)
    pre = ''
    if m:
        pre, s = m.group(1) + ' ', m.group(2)
        s = re.sub(r'^(html|body)\b\s*', '', s)
        if not s:
            return pre + ROOT
    if re.match(r'^(:root|html|body)$', s):
        return pre + ROOT
    s2 = re.sub(r'^(:root|html|body)\b\s*', '', s)
    if s2 != s:
        return pre + ROOT + ' ' + s2 if s2 else pre + ROOT
    if s == '*':
        return pre + ROOT + ' *'
    return pre + ROOT + ' ' + s

FONT_SANS = 'Tajawal,system-ui,sans-serif'
def px_up(m):
    v = float(m.group(1))
    nv = v + 1 if v <= 13 else v
    return (('%g' % nv) + 'px')

def fonts(prop, val, sel):
    p = prop.lower()
    if p == 'font-family':
        return 'Cairo,' + FONT_SANS if 'cairo' in val.lower() else FONT_SANS
    if p == 'font':
        val = re.sub(r"'?Almarai'?(\s*,\s*[^;]*)?$", FONT_SANS, val)
        val = re.sub(r"\bArial\b", FONT_SANS, val)
        val = re.sub(r"(\d+(?:\.\d+)?)px", px_up, val, count=1)
        return val
    if p == 'font-size':
        return re.sub(r"(\d+(?:\.\d+)?)px", px_up, val)
    return val

def font_of(ds):
    size, weight = None, None
    for p, v in ds:
        pl = p.lower()
        if pl == 'font-size':
            m = re.search(r'(\d+(?:\.\d+)?)px', v); size = float(m.group(1)) if m else size
        elif pl == 'font-weight':
            weight = v
        elif pl == 'font':
            m = re.search(r'(\d+(?:\.\d+)?)px', v); size = float(m.group(1)) if m else size
            w = re.match(r'\s*(\d{3}|bold)\b', v); weight = w.group(1) if w else weight
    return size, weight

def transform(nodes, varmap, media=False):
    out = []
    for nd in nodes:
        if nd[0] == 'at':
            kind, pre, kids, raw = nd
            if pre.startswith('@font-face') or (raw and raw.startswith('@font-face')):
                continue
            if kids is None:
                if raw and not raw.startswith('@import') and not raw.startswith('@charset'):
                    out.append(raw)
                continue
            inner = transform(kids, varmap, True)
            if inner:
                out.append(pre + '{' + inner + '}')
            continue
        _, sel, body = nd
        sels = [x for x in (scope_one(s) for s in split_sel(sel)) if x]
        if not sels:
            continue
        ds = decls(body)
        # resolve the prototype's own colour variables, then map by property
        res = []
        for p, v in ds:
            if p.startswith('--') and HEX.fullmatch(v.strip() or 'x'):
                continue    # the old colour variables are replaced by tokens (see exec.css)
            v = re.sub(r'var\((--[\w-]+)\)', lambda m: varmap.get(m.group(1), m.group(0)), v)
            res.append((p, v))
        bgdark = any(role_of(p) == 'bg' and re.search(r'var\(--x-c1\)|var\(--x-ok\)|var\(--x-bad\)|var\(--x-c2\)',
                     map_value(p, v)) and not re.search(r'color-mix', map_value(p, v)) for p, v in res)
        nd2 = []
        for p, v in res:
            v2 = map_value(p, v, 'onpill' if bgdark else None)
            v2 = fonts(p, v2, sel)
            nd2.append((p, v2))
        size, weight = font_of(res)
        heading = re.search(r'(^|[\s,>])h[1-3]\b', sel)
        if (size and size >= 17) or heading:
            if not any(p.lower() in ('font-family',) for p, _ in nd2):
                fam_ = 'Cairo,' + FONT_SANS
                fixed = []
                for p, v in nd2:
                    if p.lower() == 'font':
                        v = v.replace(FONT_SANS, fam_)
                    fixed.append((p, v))
                nd2 = fixed
                if not any(p.lower() == 'font' for p, _ in nd2):
                    nd2.append(('font-family', fam_))
        out.append(','.join(sels) + '{' + ';'.join(f'{p}:{v}' for p, v in nd2) + '}')
    return ''.join(out)

# ------------------------------------------------------------------ sources
idx = open(os.path.join(SRC, 'index.html'), encoding='utf-8').read()
styles = re.findall(r'<style>(.*?)</style>', idx, re.S)
head_css, tail_css = styles[0], styles[1:]
links = re.findall(r'<link rel="stylesheet" href="([^"]+)"', idx)
css_all = head_css + '\n' + '\n'.join(open(os.path.join(SRC, l), encoding='utf-8').read() for l in links) + '\n' + '\n'.join(tail_css)
nodes = parse(css_all)

varmap = {}
def collect(nodes):
    for nd in nodes:
        if nd[0] == 'rule':
            for p, v in decls(nd[2]):
                if p.startswith('--') and HEX.fullmatch(v.strip()):
                    varmap[p] = v.strip()
        elif nd[2]:
            collect(nd[2])
collect(nodes)
open(os.path.join(EX, 'dashboards.css'), 'w', encoding='utf-8').write(
    '/* Generated by tools/port-dashboards.py from the executive dashboards prototype. Do not edit: change the tool or exec/exec.css. */\n'
    + transform(nodes, varmap))

# ------------------------------------------------------------------ JS
BRAND = [
    ('بوابة الوفادة · إكرام الضيف', 'مدار'), ('بوابة الوفادة', 'مدار'), ('إكرام الضيف', 'مدار'),
    ('wifadahAccess', 'madarExecAccess'), ('wifadahLang', 'madarExecLang'),
    ('wifadah-executive.csv', 'madar-executive.csv'), ('wifadah-', 'madar-'),
    ('Info@arbhaj.com', 'info@madar.sa'),
]

def js_role(s, i):
    back = s[max(0, i - 90):i]
    tag_open = back.rfind('<')
    tag_close = back.rfind('>')
    in_tag = tag_open > tag_close
    tail = back[-40:]
    if re.search(r'(?:^|[;"\s{])color\s*:\s*[\'"]?$', tail) or re.search(r'[\s{;"]color:\s*\$\{[^}]*$', tail):
        return 'text'
    if re.search(r'background(?:-color)?\s*:[^;"]*$', tail) or 'gradient(' in tail[-30:]:
        return 'bg'
    if in_tag:
        tag = back[tag_open:]
        attr = re.search(r'(\w[\w-]*)\s*=\s*["\']?[^"\'=]*$', tag)
        a = attr.group(1).lower() if attr else ''
        if a == 'fill' and re.match(r'<text\b', tag):
            return 'text'
        if a == 'stroke':
            return 'border' if True else 'graphic'
        if a in ('fill', 'stop-color'):
            return 'graphic'
        if a == 'style':
            seg = tag[tag.rfind('style'):]
            if re.search(r'(?:^|[;"\s])color\s*:[^;]*$', seg) and not re.search(r'background[^;]*$', seg):
                return 'text'
            if re.search(r'border[^;]*$', seg):
                return 'border'
            return 'bg'
    if re.search(r'border[\w-]*\s*:[^;]*$', tail):
        return 'border'
    if re.search(r'fill\s*[:=]\s*[\'"]?$', tail):
        return 'graphic'
    return 'graphic'

FIXES = [   # the page is detached while another Madar page is shown: guard the observers that look it up
    ("if(document.querySelector('#overview').hidden)return;", "if(!document.querySelector('#overview')||document.querySelector('#overview').hidden)return;"),
]

def port_js(s):
    for a, b in FIXES:
        s = s.replace(a, b)
    s = s.replace('src="flags/', 'src="exec/flags/')
    for a, b in BRAND:
        s = s.replace(a, b)
    s = re.sub(r'font-family="Arial"', 'font-family="Tajawal"', s)
    s = re.sub(r"font-family:\s*Arial", 'font-family:Tajawal', s)
    def rep(m):
        h = m.group(0)
        role = js_role(s, m.start())
        return map_hex(h, role)
    return HEX.sub(rep, s)

SKIP = {'navigation.js', 'i18n.js', 'i18n-data.js'}
scripts = re.findall(r'<script src="([^"]+)"></script>', idx)
order = []
for f in scripts:
    if f in SKIP:
        continue
    src = open(os.path.join(SRC, f), encoding='utf-8').read()
    open(os.path.join(EX, 'js', f), 'w', encoding='utf-8').write(port_js(src))
    order.append(f)

# module catalogue (menu labels + icons) from navigation.js
nav = open(os.path.join(SRC, 'navigation.js'), encoding='utf-8').read()
cat = re.search(r'const moduleCatalog=(\[.*?\]);', nav, re.S).group(1)
catalog = json.loads(cat.replace("'", '"'))

# dictionary (Arabic -> en/bn/fr); rebrand the keys and values
d = open(os.path.join(SRC, 'i18n-data.js'), encoding='utf-8').read()
D = json.loads(d[d.find('{'):d.rfind('}') + 1])
D2 = {}
for k, v in D.items():
    k2 = k
    for a, b in BRAND[:3]:
        k2 = k2.replace(a, b)
    v2 = {}
    for lang, t in v.items():
        t = re.sub(r'Wifadah Portal|Wifadah Gateway|Al-Wifadah Portal|Wefada Portal|Wifada Portal', 'Madar', t)
        t = re.sub(r'Ikram Al-Dayf|Ekram Aldyf|Ikram al-Dayf', 'Madar', t)
        v2[lang] = t
    D2[k2] = v2
D2.setdefault('مدار', {'en': 'Madar', 'bn': 'Madar', 'fr': 'Madar'})
# a few labels the prototype's dictionary does not hold (Madar wording)
EXTRA = {
    'من الاستعداد المسبق إلى المغادرة؛ متابعة متصلة للحجاج والخدمات.': 'From advance preparation to departure: connected follow-up of pilgrims and services.',
    'نطاق العرض:': 'View scope:', '· مكة': '· Makkah', '· المدينة': '· Madinah',
    'البيانات المعروضة مقيّدة بهذا النطاق.': 'The data shown is limited to this scope.',
}
for k, v in EXTRA.items():
    D2.setdefault(k, {'en': v})
open(os.path.join(EX, 'i18n-data.js'), 'w', encoding='utf-8').write('window.I18N_DICT=' + json.dumps(D2, ensure_ascii=False, separators=(',', ':')) + ';')

# executive markup: the overview page and the dialog / toast
body = idx[idx.find('<div class="page" id="overview">'):idx.find('<div class="page" id="modulePage"')]
body = re.sub(r'<footer class="footer">.*?</footer>', '', body, flags=re.S)
for a, b in BRAND[:3]:
    body = body.replace(a, b)
body = HEX.sub(lambda m: map_hex(m.group(0), js_role(body, m.start())), body)
dialog = re.search(r'(<dialog id="detail">.*?</dialog><div class="toast"[^>]*></div>)', idx, re.S).group(1)
open(os.path.join(EX, 'markup.js'), 'w', encoding='utf-8').write(
    '/* Generated by tools/port-dashboards.py: the executive page markup. */\nwindow.MADAR_EXEC_MARKUP=' +
    json.dumps({'overview': body, 'dialog': dialog, 'catalog': catalog, 'scripts': order}, ensure_ascii=False) + ';')

# flags
fd = os.path.join(EX, 'flags'); os.makedirs(fd, exist_ok=True)
for f in os.listdir(os.path.join(SRC, 'flags')):
    shutil.copy(os.path.join(SRC, 'flags', f), os.path.join(fd, f))
print('ok', len(order), 'scripts,', len(catalog), 'modules,', len(D2), 'dictionary entries')
