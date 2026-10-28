# -*- coding: utf-8 -*-
"""Builds class10/calc/derivative/machine/index.html ("מכונת הגבול": תרגול חישוב נגזרת לפי ההגדרה, בצורת משחק שלבים).
משתף assets עם definition/. הלוגיקה והעיצוב ב-machine/assets/machine.js ו-machine.css (ידני)."""
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

# שלבים: מקדמי הפולינום מהנמוך לגבוה, והנקודה a
LEVELS = [([0, 3, 1], 2), ([0, 0, 0, 1], 1), ([0, -1, 2], 3), ([0, -3, 0, 1], 2), ([0, 0, 0, 0, 1], 1), ([0, 0, 1, 1], -1)]

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

titles = ['שלב %d' % (i + 1) for i in range(len(LEVELS))]
NL = len(LEVELS)
nav_titles = titles + ['אתגר', 'גשר']
nav = ''.join('<a href="#s%d"><b>%d</b>%s</a>' % (i, i, t) for i, t in enumerate(nav_titles, 1))

def stage(k, c, a):
    sh = shift(c, a)
    g1 = [0] + sh[1:]
    g2 = sh[1:]
    fa = val(c, a); d = dval(c, a)
    fx = ptex(c, 'x')
    lab1 = M("f(%d+h)-f(%d)=" % (a, a))
    lab2 = M("\\dfrac{f(%d+h)-f(%d)}{h}=" % (a, a))
    lab3 = M("f'(%d)=" % a)
    first = (k == 1)
    intro = ''
    if first:
        intro = '<p>%s</p>' % T("לחצו על קירוב כדי להזיז את B אל A. הטבלה מראה לאן מתייצב שיפוע החותך. הזינו את שיפוע המשיק ב־A ונעלו אותו.")
    def inrow(cls, label, extra='', tb=False):
        return ('<div class="row-in chk %s kp" data-k="%d" data-mode="%s" data-var="h"%s><span class="q">%s</span><div class="kfield"></div>'
                '<button type="button" class="btn small">בדיקה</button><span class="fb" aria-live="polite"></span></div>') % (cls, k, 'expr' if tb else 'num', extra, label)
    rows = (
        '<div class="qrow mr" data-r="1">' + inrow('mrow', lab1, ' data-r="1"', True) + hint("פתחו סוגריים: $f(%d+h)=%s$." % (a, ptex(sh, 'h'))) +
        '<div class="sol" hidden>%s</div></div>' % T("$f(%d+h)-f(%d)=%s$" % (a, a, ptex(g1, 'h'))) +
        '<div class="qrow mr" data-r="2" hidden>' + inrow('mrow', lab2, ' data-r="2"', True) + hint("הוציאו את $h$ כגורם משותף במונה וצמצמו. כתבו ללא שבר.") +
        '<div class="sol" hidden>%s</div></div>' % T("$%s$, כש־$h$ שונה מ־0." % ptex(g2, 'h')) +
        '<div class="qrow mr" data-r="3" hidden>' + inrow('mrow', lab3, ' data-r="3"') + hint("כש־$h$ שואף ל־0, כל איבר שמכיל את $h$ שואף ל־0.") +
        '<div class="sol" hidden>%s</div></div>' % T("$f'(%d)=\\lim_{h\\to 0}\\left(%s\\right)=%d$" % (a, ptex(g2, 'h'), d))
    )
    return f'''
<section class="stage" id="s{k}" aria-labelledby="s{k}t"><h2 id="s{k}t"><span class="n">{k}</span>{titles[k-1]}<span class="stars" id="mst{k}" aria-label="כוכבי דיוק"><i>★</i><i>★</i><i>★</i></span></h2>
<p class="lvl">{T("$f(x)=%s$, והנקודה A היא $(%d,\\,%d)$" % (fx, a, fa))}</p>
{intro}
<div class="viz mviz"><svg id="mv{k}" role="img" aria-label="גרף הפונקציה, הנקודות A ו־B והישר AB"></svg><div class="burst" id="bu{k}" aria-hidden="true"></div></div>
<div class="ctl"><button type="button" class="btn small" id="near{k}">קירוב: קרבו את B</button><span class="fb" id="nfb{k}" aria-live="polite"></span></div>
<div class="tw"><table class="dtab mlog" id="log{k}"><thead><tr><th>{T("$h$")}</th><th>{T("שיפוע החותך AB")}</th></tr></thead><tbody></tbody></table></div>
{inrow('mlock', lab3.replace('f&#39;', "f'"), ' data-lock="1"')}
<div class="malg" id="alg{k}" hidden>
<p class="lead">{T("עכשיו מוכיחים. הזינו כל ביטוי בכפתורי התווים.")}</p>
{rows}
</div>
<p class="win" id="win{k}" hidden>השלב הושלם</p>
</section>'''


def brk(tex):
    d = 0
    for i, ch in enumerate(tex):
        if ch == '{': d += 1
        elif ch == '}': d -= 1
        elif ch == '=' and d == 0:
            return '{%s}={%s}' % (tex[:i], tex[i+1:])
    return tex

def mc(q, opts, c, exp='', reveal=None, extra=''):
    ob = ''.join('<button type="button" class="opt">%s</button>' % o for o in opts)
    rv = ' data-reveal="%s"' % reveal if reveal else ''
    return ('<div class="mc chk" data-c="%d"%s%s><div class="mc-q">%s</div><div class="opts">%s</div>'
            '<span class="fb" aria-live="polite"></span>%s</div>') % (c, rv, extra, q, ob, ('<div class="mc-exp" hidden>%s</div>' % exp) if exp else '')

def numq(id_, label, ans, reveal=None, hidden=False):
    rv = ' data-reveal="%s"' % reveal if reveal else ''
    return ('<div class="row-in chk mnum kp" id="%s" data-mode="num" data-ans="%s"%s%s><span class="q">%s</span><div class="kfield"></div>'
            '<button type="button" class="btn small">בדיקה</button><span class="fb" aria-live="polite"></span></div>') % (id_, ans, rv, ' hidden' if hidden else '', label)

boss_rows = ["f(3+h)-f(3)=(3+h)^2-2(3+h)-3",
             "f(3+h)-f(3)=9+6h+h^2-6+2h-3",
             "f(3+h)-f(3)=8h+h^2",
             "f'(3)=\\lim_{h\\to 0}\\dfrac{8h+h^2}{h}=\\lim_{h\\to 0}(8+h)=8"]
boss_html = ''.join('<div class="brow"><b class="bn">%d</b><span class="fx">%s</span></div>' % (i + 1, M(brk(r))) for i, r in enumerate(boss_rows))
boss = f'''
<section class="stage" id="s{NL+1}" aria-labelledby="s{NL+1}t"><h2 id="s{NL+1}t"><span class="n">{NL+1}</span>מצאו את הטעות<span class="dtag">אתגר</span></h2>
<p>{T("בפתרון הבא של $f'(3)$ עבור $f(x)=x^2-2x$ יש טעות אחת.")}</p>
<div class="boss">{boss_html}</div>
{mc("באיזו שורה הטעות?", ["שורה 1", "שורה 2", "שורה 3", "שורה 4"], 1, T("בשורה 2 הוצב סימן שגוי: $-2(3+h)=-6-2h$."), "#bq2")}
<div id="bq2" hidden>{mc("מהי שורה 2 הנכונה?", [M("9+6h+h^2-6-2h+3"), M("9+3h+h^2-6-2h-3"), M("9+6h+h^2-6-2h-3")], 2, "", "#bq3")}</div>
<div id="bq3" hidden>{numq("bnum", M("f'(3)="), 4)}</div>
</section>'''

bridge = f'''
<section class="stage" id="s{NL+2}" aria-labelledby="s{NL+2}t"><h2 id="s{NL+2}t"><span class="n">{NL+2}</span>גשר לכללי גזירה</h2>
<p>{T("בשלבים 2 ו־5 חישבתם נגזרת ב־$x=1$, והנה התוצאות יחד עם $x^2$ מעמוד ההגדרה:")}</p>
<div class="tw"><table class="dtab"><thead><tr><th>{T("$f(x)$")}</th><th>{T("$f'(1)$")}</th></tr></thead><tbody>
<tr><th>{M("x^2")}</th><td class="num">2</td></tr><tr><th>{M("x^3")}</th><td class="num">3</td></tr><tr><th>{M("x^4")}</th><td class="num">4</td></tr></tbody></table></div>
<p>{T("נחשו לפי התבנית. עבור $f(x)=x^5$:")}</p>
{numq("brg", M("f'(1)="), 5, "#bgo")}
<div id="bgo" hidden><p class="win">{T("בכללי גזירה נבדוק את התבנית הזו בכל נקודה.")}</p><p><a class="btn" href="../rules/" target="_top">כללי גזירה ←</a></p></div>
</section>'''

stages = ''.join(stage(i + 1, c, a) for i, (c, a) in enumerate(LEVELS)) + boss + bridge
lv_json = json.dumps([{'c': c, 'a': a} for c, a in LEVELS])

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
    <p>מקרבים, נועלים את השיפוע ומוכיחים</p>
  </div>
  <div class="hero-fig" aria-hidden="true">{hero_fig}</div>
</section>
<div class="top" id="topbar">
  <div class="top-row"><div class="stagenav">{nav}</div></div>
  <div class="prog" role="progressbar" aria-valuemin="0" aria-valuemax="100" aria-valuenow="0" aria-label="התקדמות בעמוד" id="prog"><div class="prog-fill" id="prog-fill"></div><span class="prog-txt" id="prog-txt"></span></div>
</div>
<main class="dmain" id="main">
<p class="dintro">{T("בכל שלב נתונה פונקציה ונקודה A. מקרבים את B אל A, נועלים את שיפוע המשיק ומוכיחים אותו לפי ההגדרה. הכוכבים מראים דיוק בשלב: ★ שיפוע נכון, ★★ הוכחה, ★★★ בלי רמזים ועם טעות אחת לכל היותר.")}</p>
{stages}
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
