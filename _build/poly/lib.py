# -*- coding: utf-8 -*-
"""Tiny DSL for building the class-10 self-study booklet (same markup as class11/normal)."""
import re, json, html, subprocess, textwrap, os
import markdown as _md

HERE = os.path.dirname(os.path.abspath(__file__))
TEX = []          # [{tex, display}]
ATTR = []         # explanation html (with tokens) for data-e attributes
LETTERS = ['א','ב','ג','ד','ה','ו','ז','ח','ט','י','כ','ל']

def _tok(i): return '⟦T%d⟧' % i
def _atok(i): return '⟦E%d⟧' % i

MATH = re.compile(r'\$\$(.+?)\$\$|\$(.+?)\$', re.S)
def math_tokens(s):
    def rep(m):
        disp = m.group(1) is not None
        TEX.append({'tex': (m.group(1) if disp else m.group(2)).strip(), 'display': disp})
        return ('\n\n' + _tok(len(TEX)-1) + '\n\n') if disp else _tok(len(TEX)-1)
    return MATH.sub(rep, s)

def md(s, inline=False):
    s = textwrap.dedent(s).strip('\n')
    s = re.sub(r'\(\$([^$\n]+)\$\)', r'$(\1)$', s)  # parentheses stay inside the LTR math unit, so they never split from it at a line break
    s = math_tokens(s)
    out = _md.markdown(s, extensions=['tables', 'sane_lists'])
    if inline:
        out = re.sub(r'^<p>(.*)</p>$', r'\1', out, flags=re.S)
    return out

def tbl(s):
    return '<div class="tbl">' + md(s) + '</div>'

def hint(text, label='רמז'):
    if isinstance(text, (list, tuple)):
        names = ['רמז 1: כיוון', 'רמז 2: צעד הבא', 'רמז 3: כמעט הפתרון']
        return '<span class="hints">' + ''.join(hint(t, names[k] if k < 3 else 'רמז %d' % (k + 1)) for k, t in enumerate(text)) + '</span>'
    return '<details class="hint"><summary>%s</summary><span>%s</span></details>' % (label, md(text, inline=True))

def _plain(t):
    return t.replace('\\cdot', '·').replace('\\ne', '≠').replace('$', '')

def fig(spec, caption=None):
    if isinstance(spec.get('goalHint'), str):
        spec = dict(spec, goalHint=_plain(spec['goalHint']))
    j = html.escape(json.dumps(spec, ensure_ascii=False, separators=(',', ':')), quote=True)
    cap = '<figcaption>%s</figcaption>' % md(caption, inline=True) if caption else ''
    return '<figure class="fig" data-fig="%s"><div class="fig-svg"></div>%s</figure>' % (j, cap)

def A(s):
    """answer helper: keys are strings so that decimals keep their precision"""
    return str(s)

INPUT = '<input type="text" inputmode="decimal" dir="ltr" autocomplete="off" spellcheck="false" placeholder="?">'

INPUT_T = '<input type="text" inputmode="text" dir="ltr" style="text-align:left" autocomplete="off" spellcheck="false" placeholder="?">'
SYM = '<span class="sym" aria-label="סימנים">' + ''.join('<button type="button" data-ins="%s"%s>%s</button>' % (a, (' dir="ltr"' if b in ('&lt;', '&gt;', '≤', '≥', '≠', 'x') else ''), b) for a, b in [('<', '&lt;'), ('>', '&gt;'), ('≤', '≤'), ('≥', '≥'), ('≠', '≠'), ('x', 'x'), (' או ', 'או'), ('לכל x ', 'לכל x'), ('לאף x ', 'לאף x')]) + '</span>'

def _typed(id, keys, labels=None):
    k = html.escape(json.dumps([str(x) for x in keys], ensure_ascii=False), quote=True)
    if len(keys) == 1:
        return ('<div class="typed" data-typed="%s" data-key="%s"><label class="myans"><span>הקלידו את התשובה</span>%s</label>'
                '<button type="button" class="btn small chk">בדיקה</button><span class="fb" aria-live="polite"></span></div>') % (id, k, INPUT)
    parts = ''
    for i in range(len(keys)):
        lab = (labels[i] if labels else 'סעיף ' + LETTERS[i])
        txt = str(keys[i]).startswith('re:')
        parts += ('<div class="part"><label><span>%s</span>%s</label>%s<button type="button" class="btn small chk">בדוק</button>'
                  '<span class="fb" aria-live="polite"></span></div>') % (lab, INPUT_T if txt else INPUT, SYM if txt else '')
    return '<div class="typed multi" data-typed="%s" data-key="%s"><div class="parts">%s</div></div>' % (id, k, parts)

def _mc(id, qs, head='בחרו את התשובה הנכונה בכל סעיף'):
    out = '<div class="mc" data-mc="%s"><div class="mc-h">%s</div>' % (id, head)
    for i, q in enumerate(qs):
        ATTR.append(md(q['why'], inline=True))
        opts = ''
        for k, o in enumerate(q['opts']):
            opts += '<label class="mc-o"><input type="radio" name="mc-%s-%d" value="%d"><span>%s</span></label>' % (id, i, k, md(o, inline=True))
        lab = ('<b class="mc-l">%s</b> ' % q['label']) if q.get('label') else ''
        out += ('<fieldset class="mc-q" data-c="%d" data-e="%s"><legend>%s%s</legend><div class="mc-opts">%s</div>'
                '<div class="mc-row"><button type="button" class="btn small mc-chk">בדוק</button><span class="fb" aria-live="polite"></span></div>'
                '<div class="mc-exp" hidden></div></fieldset>') % (q['c'], _atok(len(ATTR)-1), lab, md(q['q'], inline=True), opts)
    return out + '</div>'

TAG = {'example': ('t-example', 'דוגמה'), 'guided': ('t-guided', 'מודרך'), 'solo': ('t-solo', 'עצמאי'), 'bagrut': ('t-bagrut', 'בגרות'),
       'quick': ('t-solo', 'תרגול מהיר')}

LEVELS = {'B1': 'קל', 'B2': 'קל', 'B3': 'קל', 'M1': 'בינוני', 'M2': 'בינוני', 'H1': 'מורכב', 'H2': 'מורכב', 'H3': 'מורכב', 'H4': 'מורכב'}

def ex(id, kind, body, keys=None, labels=None, mc=None, answer=None, solution=None, hint_text=None, star=False, act=False, raw_ctl=None):
    cls, name = TAG[kind]
    name = LEVELS.get(id, name)
    datakind = 'solo' if kind == 'quick' else kind
    head = '<header class="ex-h"><span class="ex-id">%s</span><span class="tag %s">%s</span><span class="ex-state" aria-live="polite"></span></header>' % (id, cls, name)
    b = md(body)
    if hint_text:
        b = re.sub(r'</p>\s*$', ' ' + hint(hint_text) + '</p>', b, count=1) if b.rstrip().endswith('</p>') else b + hint(hint_text)
    if kind == 'example':
        return ('<article class="ex example" id="ex-%s" data-id="%s" data-kind="example">%s<div class="ex-body">%s</div>'
                '<div class="ex-foot"><button type="button" class="btn small ok-ex">הבנתי</button></div></article>\n') % (id, id, head, b)
    if raw_ctl is not None:
        return ('<article class="ex" id="ex-%s" data-id="%s" data-kind="%s">%s<div class="ex-body">%s</div>'
                '<div class="ex-ctl">%s</div></article>\n') % (id, id, datakind, head, b, raw_ctl)
    if act:
        ctl = '<div class="act-ctl" data-act="%s"><button type="button" class="btn small act-chk">בדיקה</button><span class="fb" aria-live="polite"></span></div>' % id
    else:
        ctl = _mc(id, mc) if mc else _typed(id, keys, labels)
    ans = ''
    if answer or solution:
        ans = '<div class="ex-ans" hidden><div class="ans-box"><strong>תשובה:</strong> %s</div>' % md(answer or '')
        if solution:
            ans += ('<button type="button" class="btn ghost show-sol" aria-expanded="false">הצג פתרון מלא</button>'
                    '<div class="ex-sol" hidden>%s</div>') % solution
        ans += '<div class="ex-mark" role="group" aria-label="סימון התרגיל"><button type="button" class="btn small good">פתרתי נכון</button><button type="button" class="btn small bad">טעיתי</button></div></div>'
    return ('<article class="ex" id="ex-%s" data-id="%s" data-kind="%s">%s<div class="ex-body">%s</div>'
            '<div class="ex-ctl">%s<button type="button" class="btn show-ans" aria-expanded="false">הצג תשובה</button></div>%s</article>\n') % (
            id, id, datakind, head, b, ctl, ans)

def steps(rows):
    """row-by-row solution table: rows = [(claim, reason), ...]"""
    t = '| מס׳ | טענה | נימוק |\n|:--:|:--|:--|\n'
    for i, (c, r) in enumerate(rows, 1):
        t += '| %d | %s | %s |\n' % (i, c, r)
    return tbl(t)

def selfcheck(chid, items):
    out = '<fieldset class="selfcheck" data-ch="%s"><legend>בדיקה עצמית</legend>' % chid
    for i, t in enumerate(items):
        out += '<label class="sc-item"><input type="checkbox" data-sc="%s:%d"><span>%s</span></label>' % (chid, i, md(t, inline=True))
    return out + '</fieldset>\n'

class Chapter:
    def __init__(self, id, title, kind='chapter'):
        self.id, self.title, self.kind = id, title, kind
        self.secs = []     # (id, title)
        self.parts = []
        self.sc = None
    def sec(self, title):
        sid = '%s-s%d' % (self.id, len(self.secs) + 1)
        self.secs.append((sid, title))
        self.parts.append('<h2 id="%s">%s</h2>\n' % (sid, html.escape(title)))
    def add(self, h): self.parts.append(h)
    def text(self, s): self.parts.append('<div class="md">%s</div>\n' % md(s))
    def html(self):
        h = ('<section class="chapter" id="%s" data-chapter="%s" data-kind="%s" aria-labelledby="%s-t" hidden>'
             '<h1 class="ch-title" id="%s-t" tabindex="-1">%s</h1>\n') % (self.id, self.id, self.kind, self.id, self.id, html.escape(self.title))
        h += ''.join(self.parts)
        if self.sc: h += selfcheck(self.id, self.sc)
        return h + '<nav class="ch-nav" aria-label="מעבר בין פרקים"></nav></section>\n'
    def meta(self):
        return {'id': self.id, 'title': self.title, 'kind': self.kind,
                'sections': [{'id': i, 'title': t} for i, t in self.secs], 'hasSelfCheck': bool(self.sc)}

def render_all(text):
    """replace math tokens with KaTeX html via node"""
    if TEX:
        env = dict(os.environ, NODE_PATH='/home/claude/katex_env/node_modules')
        p = subprocess.run(['node', os.path.join(HERE, 'render_tex.js')], input=json.dumps(TEX), capture_output=True, text=True, env=env)
        if p.returncode: raise SystemExit(p.stderr)
        rendered = json.loads(p.stdout)
    else:
        rendered = []
    def sub(s):
        return re.sub(r'⟦T(\d+)⟧', lambda m: '<span class="math-expr%s" dir="ltr">%s</span>' % (' math-disp' if TEX[int(m.group(1))]['display'] else '', rendered[int(m.group(1))]), s)
    for i, a in enumerate(ATTR):
        text = text.replace(_atok(i), html.escape(sub(a), quote=True))
    return sub(text)
