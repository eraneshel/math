# -*- coding: utf-8 -*-
"""Builds class10/calc/derivative/machine/index.html ("מכונת הגבול": נגזרת בנקודה לפי ההגדרה).
שלבים (STAGES): approach (מקרבים ונועלים), algebra (הוכחה אלגברית; given1=שורה 1 נתונה), data (קופסה שחורה: מנות מתוך נתונים),
boss (מצאו את הטעות), bridge (גשר לכללי גזירה). הלוגיקה ב-machine/assets/machine.js (ידני). משתף assets עם definition/."""
import os, sys, time, json
from math import comb
HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, os.path.join(HERE, '..', 'calc'))
import lib

ROOT = os.path.join(HERE, '..', '..')
OUT = os.path.join(ROOT, 'class10', 'calc', 'derivative', 'machine')
V = str(int(time.time()))[-8:]
SH = '../definition/assets/'

def M(tex): return lib.md('$\\displaystyle %s$' % tex, inline=True)
def T(s): return lib.md(s, inline=True)
def hint(txt): return '<details class="hint"><summary>רמז</summary><span>%s</span></details>' % T(txt)

# מקדמי פולינום מהנמוך לגבוה
STAGES = [
    dict(kind='approach', c=[0, 3, 1], a=2, title='מקרבים ונועלים', nav='מקרבים'),
    dict(kind='algebra', c=[0, 3, 1], a=2, title='מוכיחים בחישוב', nav='מוכיחים'),
    dict(kind='data', c=[0, -3, 0, 1], a=2, hs=[0.5, 0.1, -0.5, -0.1], title='קופסה שחורה: מתוך נתונים', nav='נתונים'),
    dict(kind='algebra', c=[0, 0, 1, 1], a=-1, given1=True, title='מוכיחים בעצמכם', nav='בעצמכם'),
    dict(kind='boss', title='מצאו את הטעות', nav='אתגר'),
    dict(kind='bridge', title='גשר לכללי גזירה', nav='גשר'),
]

def ptex(c, var='x'):
    out = ''
    order = range(len(c)) if var == 'h' else range(len(c) - 1, -1, -1)
    for k in order:
        v = c[k]
        if v == 0: continue
        mag = abs(v)
        if k == 0: body = str(mag)
        else:
            co = '' if mag == 1 else str(mag)
            body = co + var + ('' if k == 1 else '^{%d}' % k)
        out += (('-' if v < 0 else ('+' if out else '')) + body)
    return out or '0'

def shift(c, a):
    res = [0] * len(c)
    for k, ck in enumerate(c):
        for j in range(k + 1):
            res[j] += ck * comb(k, j) * a ** (k - j)
    return res

def val(c, x): return sum(ck * x ** k for k, ck in enumerate(c))
def dval(c, x): return sum(k * ck * x ** (k - 1) for k, ck in enumerate(c) if k)
def num(v):
    s = ('%.6f' % v).rstrip('0').rstrip('.')
    return s.replace('-', '-')

nav = ''.join('<a href="#s%d"><b>%d</b>%s</a>' % (i, i, s['nav']) for i, s in enumerate(STAGES, 1))

def kf(cls, label, extra='', mode='num', var='h', dec=False):
    return ('<div class="row-in chk %s kp" data-mode="%s" data-var="%s"%s%s><span class="q">%s</span><div class="kfield"></div>'
            '<button type="button" class="btn small">בדיקה</button><span class="fb" aria-live="polite"></span></div>') % (
                cls, mode, var, ' data-dec="1"' if dec else '', extra, label)

def pf(cls, label, extra=''):
    return ('<div class="row-in chk %s pl"%s><span class="q">%s</span><button type="button" class="pm" aria-label="הפיכת סימן">±</button>'
            '<input type="text" class="pfield num" inputmode="decimal" autocomplete="off" enterkeyhint="done" aria-label="ערך">'
            '<button type="button" class="btn small">בדיקה</button><span class="fb" aria-live="polite"></span></div>') % (cls, extra, label)

def head(k, title, tag=''):
    return ('<section class="stage" id="s%d" aria-labelledby="s%dt"><h2 id="s%dt"><span class="n">%d</span>%s%s'
            '<span class="stars" id="mst%d" aria-label="כוכבי דיוק"><i>★</i><i>★</i><i>★</i></span></h2>') % (k, k, k, k, title, tag, k)

def viz(k):
    return '<div class="viz mviz"><svg id="mv%d" role="img" aria-label="גרף"></svg></div>' % k

def approach(k, S):
    c, a = S['c'], S['a']
    fa = val(c, a)
    intro = '<p class="lvl">%s</p><p>%s</p>' % (
        T("$f(x)=%s$, והנקודה A היא $(%d,\\,%d)$" % (ptex(c), a, fa)),
        T("לחצו על קירוב כדי להזיז את B אל A. הטבלה מראה לאן מתייצב שיפוע החותך AB. הזינו את שיפוע המשיק ב־A ונעלו אותו."))
    return (head(k, S['title']) + intro + viz(k) +
            '<div class="ctl"><button type="button" class="btn small" id="near%d">קירוב: קרבו את B</button><span class="fb" id="nfb%d" aria-live="polite"></span></div>' % (k, k) +
            '<div class="tw"><table class="dtab mlog" id="log%d"><thead><tr><th>%s</th><th>%s</th></tr></thead><tbody></tbody></table></div>' % (k, T("$h$"), T("שיפוע החותך AB")) +
            kf('mlock', M("f'(%d)=" % a), ' data-lock="1"') + '</section>')

def algebra(k, S):
    c, a = S['c'], S['a']
    sh = shift(c, a); g1 = [0] + sh[1:]; g2 = sh[1:]; d = dval(c, a)
    lab = [M("f(%d+h)-f(%d)=" % (a, a)), M("\\dfrac{f(%d+h)-f(%d)}{h}=" % (a, a)), M("f'(%d)=" % a)]
    sol = [T("$f(%d+h)-f(%d)=%s$" % (a, a, ptex(g1, 'h'))), T("$%s$, כש־$h$ שונה מ־0." % ptex(g2, 'h')),
           T("$f'(%d)=\\lim_{h\\to 0}\\left(%s\\right)=%d$" % (a, ptex(g2, 'h'), d))]
    hints = ["פתחו סוגריים: $f(%d+h)=%s$." % (a, ptex(sh, 'h')),
             "הוציאו את $h$ כגורם משותף במונה וצמצמו.",
             "כש־$h$ שואף ל־0, כל איבר שמכיל את $h$ שואף ל־0."]
    rows = ''
    for r in range(3):
        if r == 0 and S.get('given1'):
            rows += '<div class="qrow mr given" data-r="1"><div class="sol">%s</div></div>' % sol[0]
            continue
        hid = '' if (r == 0 or (r == 1 and S.get('given1'))) else ' hidden'
        rows += ('<div class="qrow mr" data-r="%d"%s>' % (r + 1, hid) +
                 kf('mrow', lab[r], ' data-r="%d"' % (r + 1), 'num' if r == 2 else 'expr') +
                 hint(hints[r]) + '<div class="sol" hidden>%s</div></div>' % sol[r])
    if S.get('given1'):
        intro = T("$f(x)=%s$, והנקודה A היא $(%d,\\,%d)$. השורה הראשונה נתונה. השלימו את ההוכחה." % (ptex(c), a, val(c, a)))
    else:
        intro = T("$f(x)=%s$, והנקודה A היא $(%d,\\,%d)$. נוכיח אלגברית את השיפוע שננעל. הזינו כל ביטוי בכפתורי התווים." % (ptex(c), a, val(c, a)))
    return head(k, S['title']) + '<p class="lvl">%s</p><div class="malg">%s</div><p class="win" id="win%d" hidden>השלב הושלם</p></section>' % (intro, rows, k)

def data(k, S):
    c, a, hs = S['c'], S['a'], S['hs']
    fa = val(c, a)
    ans = num(dval(c, a))
    lab = M("\\lim_{\\Delta x\\to 0}\\dfrac{\\Delta y}{\\Delta x}=")
    limrow = '<tr class="limrow" id="lim%d"><td colspan="3">%s<div class="limcap">%s</div></td></tr>' % (k, pf('mlock2', lab, ' data-ans="%s"' % ans), T("הגבול"))
    parts = {}
    for sd, sign, grp in (('r', '+', 'מימין לנקודה A'), ('l', '-', 'משמאל לנקודה A')):
        part = '<tr class="grp"><th colspan="3">%s</th></tr>' % T("%s: $\\Delta x\\to 0^{%s}$" % (grp, sign))
        rs = []
        for n, h in enumerate(hs, 1):
            if (h > 0) != (sd == 'r'):
                continue
            x = a + h; y = val(c, x)
            q = (y - fa) / h
            rs.append('<tr><td class="num"><b>B%d</b><button type="button" class="tri" data-i="%d">בגרף</button></td><td class="num">%s</td><td class="qc">%s</td></tr>' % (
                n, n - 1, num(h), pf('mq', '', ' data-q="%s" data-side="%s"' % (repr(round(q, 9)), sd))))
        if sd == 'l':
            rs.reverse()
        parts[sd] = part + ''.join(rs)
    rows = parts['r'] + limrow + parts['l']
    intro = T("בקופסה שחורה פונקציה שנוסחתה חסויה. נמדדו ערכים משני צדי הנקודה A, והנקודות B1 עד B4 מסומנות בגרף. המרחק האופקי בין A ל־B נקרא $h$, והוא גם $\\Delta x$ (כלומר $h$ ו־$\\Delta x$ הם אותו מספר). לחיצה על נקודה B בגרף (או על הכפתור בגרף בטבלה) מציגה את המשולש בין A ל־B עם Δx ו־Δy. חשבו את שיפוע החותך AB בכל שורה. החץ $\\Delta x\\to 0$ אומר ש־$\\Delta x$ מתקרב ל־0, והסימן $0^{+}$ או $0^{-}$ אומר מאיזה צד. כשהשיפועים משני הצדדים מתקרבים לאותו מספר, המספר הזה הוא הגבול, ונכתב בסימון $\\lim$.")
    return (head(k, S['title']) + '<p class="lvl">%s</p><p>%s</p>' % (T("הנקודה A היא $(%s,\\,%s)$" % (num(a), num(fa))), intro) + viz(k) +
            '<div class="tw"><table class="dtab mdata" id="dt%d"><thead><tr><th>%s</th><th>%s</th><th>%s</th></tr></thead><tbody>%s</tbody></table></div>' % (
                k, T("נקודה"), T("$h=\\Delta x$"), T("$\\dfrac{\\Delta y}{\\Delta x}$"), rows) +
            '<div id="drev%d" hidden><p class="win">%s</p><p class="win" style="direction:ltr;text-align:center">%s</p><p class="win">%s</p></div>' % (k, T("הגבול מימין והגבול משמאל שווים, והערך המשותף הוא שיפוע המשיק ב־A, כלומר הנגזרת בנקודה:"), M("f'(%s)=%s" % (num(a), ans)), T("הפונקציה בקופסה הייתה $f(x)=%s$." % ptex(c))) +
            '</section>')

def brk(tex):
    d = 0
    for i, ch in enumerate(tex):
        if ch == '{': d += 1
        elif ch == '}': d -= 1
        elif ch == '=' and d == 0:
            return '{%s}={%s}' % (tex[:i], tex[i+1:])
    return tex

def mc(q, opts, c, exp='', reveal=None):
    ob = ''.join('<button type="button" class="opt">%s</button>' % o for o in opts)
    rv = ' data-reveal="%s"' % reveal if reveal else ''
    return ('<div class="mc chk" data-c="%d"%s><div class="mc-q">%s</div><div class="opts">%s</div>'
            '<span class="fb" aria-live="polite"></span>%s</div>') % (c, rv, q, ob, ('<div class="mc-exp" hidden>%s</div>' % exp) if exp else '')

def numq(id_, label, ans, reveal=None, hidden=False):
    rv = ' data-reveal="%s"' % reveal if reveal else ''
    return ('<div class="row-in chk mnum kp" id="%s" data-mode="num" data-ans="%s"%s%s><span class="q">%s</span><div class="kfield"></div>'
            '<button type="button" class="btn small">בדיקה</button><span class="fb" aria-live="polite"></span></div>') % (id_, ans, rv, ' hidden' if hidden else '', label)

def boss(k, S):
    rows = ["f(3+h)-f(3)=(3+h)^2-2(3+h)-3", "f(3+h)-f(3)=9+6h+h^2-6+2h-3", "f(3+h)-f(3)=8h+h^2",
            "f'(3)=\\lim_{h\\to 0}\\dfrac{8h+h^2}{h}=\\lim_{h\\to 0}(8+h)=8"]
    bh = ''.join('<div class="brow"><b class="bn">%d</b><span class="fx">%s</span></div>' % (i + 1, M(brk(r))) for i, r in enumerate(rows))
    return (head(k, S['title'], '<span class="dtag">אתגר</span>') +
            '<p>%s</p><div class="boss">%s</div>' % (T("בפתרון הבא של $f'(3)$ עבור $f(x)=x^2-2x$ יש טעות אחת."), bh) +
            mc("באיזו שורה הטעות?", ["שורה 1", "שורה 2", "שורה 3", "שורה 4"], 1, T("בשורה 2 הוצב סימן שגוי: $-2(3+h)=-6-2h$."), "#bq2") +
            '<div id="bq2" hidden>%s</div>' % mc("מהי שורה 2 הנכונה?", [M("9+6h+h^2-6-2h+3"), M("9+3h+h^2-6-2h-3"), M("9+6h+h^2-6-2h-3")], 2, '', "#bq3") +
            '<div id="bq3" hidden>%s</div></section>' % numq("bnum", M("f'(3)="), 4))

def bridge(k, S):
    return ('<section class="stage" id="s%d" aria-labelledby="s%dt"><h2 id="s%dt"><span class="n">%d</span>%s</h2>' % (k, k, k, k, S['title']) +
            '<p>%s</p>' % T("חישבתם ש־$f(x)=x^2+3x$ משיקה ב־$x=2$ בשיפוע 7. ידוע ש־$x^2$ משיק ב־$x=2$ בשיפוע 4, והישר $3x$ בשיפוע 3.") +
            mc("מה הקשר בין המספרים 7, 4 ו־3?", ["אין קשר ביניהם", "4 + 3 = 7: הנגזרת של סכום היא סכום הנגזרות", "4 − 3 = 1, לא 7"], 1,
               T("כשגוזרים סכום, גוזרים כל איבר בנפרד. זה אחד מכללי הגזירה."), "#bgo") +
            '<div id="bgo" hidden><p class="win">%s</p><p><a class="btn" href="../rules/" target="_top">כללי גזירה ←</a></p></div></section>' % T("עכשיו נלמד את כל הכללים, כדי לא לחשב לפי ההגדרה בכל פעם."))

builders = {'approach': approach, 'algebra': algebra, 'data': data, 'boss': boss, 'bridge': bridge}
stages_html = ''.join(builders[S['kind']](i + 1, S) for i, S in enumerate(STAGES))
sp = []
for S in STAGES:
    d = {'kind': S['kind']}
    for key in ('c', 'a', 'hs'):
        if key in S: d[key] = S[key]
    if S['kind'] == 'data':
        d['pts'] = [{'h': h, 'x': S['a'] + h, 'y': val(S['c'], S['a'] + h)} for h in S['hs']]
    sp.append(d)
lv_json = json.dumps(sp)

hero_fig = ('<svg viewBox="-14 -6 280 228" width="100%"><g fill="none" stroke-linecap="round" stroke-linejoin="round">'
            '<path d="M30 190V20M30 190H250" stroke="#fff" stroke-opacity=".6" stroke-width="2"/>'
            '<path d="M24 26l6-10 6 10M240 184l10 6-10 6" stroke="#fff" stroke-opacity=".6" stroke-width="2"/>'
            '<path d="M40 175C80 175 110 40 150 70S205 150 235 40" stroke="#fff" stroke-width="4.5"/>'
            '<circle cx="150" cy="70" r="7" fill="#fff"/><circle cx="195" cy="118" r="7" fill="#ff5c8a"/>'
            '<path d="M92 112L208 28" stroke="#5eead4" stroke-width="3" stroke-dasharray="6 6"/>'
            '<text x="146" y="214" fill="#ffc83d" font-family="Rubik" font-weight="700" font-size="19" text-anchor="middle" direction="ltr" style="direction:ltr;unicode-bidi:bidi-override">h → 0</text>'
            '</g></svg>')

page = f'''<!doctype html>
<html lang="he" dir="rtl" data-theme="auto">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="robots" content="noindex,nofollow">
<meta name="color-scheme" content="light dark">
<title>מכונת הגבול</title>
<link rel="stylesheet" href="{SH}katex.min.css?v={V}">
<link rel="stylesheet" href="{SH}style.css?v={V}">
<link rel="stylesheet" href="{SH}calc.css?v={V}">
<link rel="stylesheet" href="{SH}defn.css?v={V}">
<link rel="stylesheet" href="assets/machine.css?v={V}">
</head>
<body>
<div class="wrap">
<section class="hero">
  <svg class="deco" viewBox="0 0 600 120" preserveAspectRatio="none" aria-hidden="true"><defs><linearGradient id="dg"><stop offset="0" stop-color="#67e8f9" stop-opacity="0"/><stop offset=".5" stop-color="#a7f3d0"/><stop offset="1" stop-color="#c4b5fd" stop-opacity="0"/></linearGradient></defs><path class="wv" d="M0 90C100 90 140 30 300 60S500 20 600 30" fill="none" stroke="url(#dg)" stroke-width="2.5"/><path class="wv2" d="M0 110C120 100 200 60 320 80S520 50 600 60" fill="none" stroke="url(#dg)" stroke-width="1.5" opacity=".6"/></svg>
  <div class="t">
    <div class="crumb"><a href="../../../../" target="_top">בית</a> › <a href="../../../" target="_top">כיתה י׳</a> › <a href="../../" target="_top">חשבון דיפרנציאלי ואינטגרלי</a> › <a href="../" target="_top">נגזרת</a> › מכונת הגבול</div>
    <span class="k">כיתה י׳ · 5 יחידות</span>
    <h1>מכונת <em>הגבול</em></h1>
    <p>מקרבים, מוכיחים, ומוצאים את השיפוע גם מתוך נתונים</p>
  </div>
  <div class="hero-fig" aria-hidden="true">{hero_fig}</div>
</section>
<div class="top" id="topbar">
  <div class="top-row"><div class="stagenav">{nav}</div></div>
  <div class="prog" role="progressbar" aria-valuemin="0" aria-valuemax="100" aria-valuenow="0" aria-label="התקדמות בעמוד" id="prog"><div class="prog-fill" id="prog-fill"></div><span class="prog-txt" id="prog-txt"></span></div>
</div>
<main class="dmain" id="main">
<p class="dintro">{T("שיפוע המשיק בנקודה הוא הגבול של שיפועי החותכים. בכל שלב מגלים אותו בדרך אחרת. הכוכבים מראים דיוק בשלב: ★ השלמה, ★★ טעות אחת לכל היותר, ★★★ בלי טעויות ובלי רמזים.")}</p>
{stages_html}
</main>
<div class="foot">מתמטיקה · לכל בעיה יש פתרון, להנות מהאתגר</div>
</div>
<script type="application/json" id="lv">{lv_json}</script>
<script src="{SH}defn.js?v={V}"></script>
<script src="{SH}expr.js?v={V}"></script>
<script src="assets/machine.js?v={V}"></script>
<script src="{SH}hero.js?v={V}"></script>
</body>
</html>
'''
page = lib.render_all(page)
open(os.path.join(OUT, 'index.html'), 'w', encoding='utf8').write(page)
print('built', len(page), 'bytes;', len(lib.TEX), 'formulas')
