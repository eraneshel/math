# -*- coding: utf-8 -*-
"""Builds class10/calc/derivative/rules/index.html ("כללי גזירה": הקניה עצמית).
משתף assets עם definition/ (katex, style, calc, defn.css, defn.js, hero.js). הלוגיקה ב-rules/assets/rules.js (ידני)."""
import os, sys, time
HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, os.path.join(HERE, '..', 'calc'))
import lib

ROOT = os.path.join(HERE, '..', '..')
OUT = os.path.join(ROOT, 'class10', 'calc', 'derivative', 'rules')
V = str(int(time.time()))[-8:]
SH = '../definition/assets/'

def M(tex): return lib.md('$\\displaystyle %s$' % tex, inline=True)
def T(s): return lib.md(s, inline=True)
def D(tex): return lib.md('$$%s$$' % tex)
def brk(tex):
    d = 0
    for i, ch in enumerate(tex):
        if ch == '{': d += 1
        elif ch == '}': d -= 1
        elif ch == '=' and d == 0:
            return '{%s}={%s}' % (tex[:i], tex[i+1:])
    return tex

def hint(txt): return '<details class="hint"><summary>רמז</summary><span>%s</span></details>' % T(txt)

def ans(t, label, ph='?', nxt=None, sol=None, hidden=False):
    extra = (' data-next="%s"' % nxt if nxt else '') + (' data-sol="%s"' % sol if sol else '')
    return ('<div class="row-in chk ans" data-t="%s"%s%s><span class="q">%s</span><input type="text" class="wide" autocomplete="off" spellcheck="false" dir="ltr" placeholder="%s" aria-label="תשובה">'
            '<button type="button" class="btn small">בדיקה</button><span class="fb" aria-live="polite"></span></div>') % (t, extra, ' hidden' if hidden else '', label, ph)

titles = ['גלו: נגזרת של חזקה', 'הכללים ודוגמה', 'נסו בעצמכם', 'משוואת משיק']
nav = ''.join('<a href="#s%d"><b>%d</b>%s</a>' % (i, i, t.split(': ')[-1]) for i, t in enumerate(titles, 1))

def row(i, why, claim):
    return ('<tr%s><td class="no">%d</td><td class="why"><span class="wl">נימוק</span> %s</td><td class="claim">%s</td></tr>\n'
            % ('', i, T(why), M(brk(claim))))

ex2 = (row(1, 'נגזרת של סכום והפרש: גוזרים כל איבר בנפרד', "f'(x)=(3x^4)'-(5x^2)'+(2x)'-(7)'")
       + row(2, 'מקדם קבוע וכלל החזקה. נגזרת של קבוע היא 0', "f'(x)=3\\cdot 4x^3-5\\cdot 2x+2\\cdot 1-0")
       + row(3, 'חישוב', "f'(x)=12x^3-10x+2"))

stage1 = f'''
<section class="stage" id="s1" aria-labelledby="s1t"><h2 id="s1t"><span class="n">1</span>{titles[0]}</h2>
<p>בעמוד הקודם חישבנו נגזרת לפי ההגדרה. כאן נחפש כלל שחוסך את החישוב. בטבלה מוצג שיפוע המשיק לגרף של כמה פונקציות, בנקודות {T("$x=1,2,3$")}.</p>
<table class="dtab" id="slopes"><thead><tr><th>{T("$f(x)$")}</th><th>{T("$x=1$")}</th><th>{T("$x=2$")}</th><th>{T("$x=3$")}</th></tr></thead><tbody>
<tr data-k="5"><th>{M("5")}</th><td class="num s"></td><td class="num s"></td><td class="num s"></td></tr>
<tr data-k="x"><th>{M("x")}</th><td class="num s"></td><td class="num s"></td><td class="num s"></td></tr>
<tr data-k="x2"><th>{M("x^2")}</th><td class="num s"></td><td class="num s"></td><td class="num s"></td></tr>
<tr data-k="x3"><th>{M("x^3")}</th><td class="num s"></td><td class="num s"></td><td class="num s"></td></tr>
<tr data-k="x4"><th>{M("x^4")}</th><td class="num s"></td><td class="num s"></td><td class="num s"></td></tr>
</tbody></table>
<p>{T("לדוגמה, השיפועים של $x^2$ הם 2, 4, 6, כלומר $f'(x)=2x$. עכשיו אתם:")}</p>
<div class="qrow"><div class="fx">{T("מהי $f'(x)$ עבור $f(x)=x^4$?")}</div>{hint("השוו את השורות של x², x³ ו־x⁴. מה קורה למעריך, ומה קורה למקדם?")}
{ans("q1", M("f'(x)="), "4x^3", nxt="#q2box")}</div>
<div class="qrow" id="q2box" hidden><div class="fx">{T("בדקו את ההשערה: מהי $f'(x)$ עבור $f(x)=x^5$?")}</div>
{ans("q2", M("f'(x)="), "5x^4")}</div>
<p class="muted">{T("כתבו חזקה עם ^, למשל x^3, ומקדם צמוד, למשל 4x^3.")}</p>
<details class="hint"><summary>למה זה נכון לכל n?</summary><span>{T("לפי נוסחת הבינום, $(a+h)^n=a^n+n\\,a^{n-1}h+\\dots+h^n$. לכן $\\dfrac{(a+h)^n-a^n}{h}=n\\,a^{n-1}+(\\text{איברים עם }h)$, וכש־$h\\to 0$ נשאר $n\\,a^{n-1}$.")}</span></details>
</section>'''

stage2 = f'''
<section class="stage" id="s2" aria-labelledby="s2t"><h2 id="s2t"><span class="n">2</span>{titles[1]}</h2>
<div class="def-box"><h3>כללי הגזירה</h3>
<p>{T("חזקה: $(x^n)'=n\\cdot x^{n-1}$. בפרט $(x)'=1$.")}</p>
<p>{T("קבוע: $(c)'=0$.")}</p>
<p>{T("מקדם קבוע: $(c\\cdot f(x))'=c\\cdot f'(x)$.")}</p>
<p>{T("סכום והפרש: $(f(x)\\pm g(x))'=f'(x)\\pm g'(x)$.")}</p></div>
<p>{T("דוגמה: גוזרים את $f(x)=3x^4-5x^2+2x-7$. לחצו כדי לחשוף כל שורה.")}</p>
<div class="tw"><table class="steps3" id="ex2"><tbody>
{ex2}</tbody></table></div>
<div class="ctl"><button type="button" class="btn small" id="ex2go">הצג שורה הבאה</button><button type="button" class="btn small chk" id="ok2" hidden>הבנתי, נמשיך</button></div>
</section>'''

def q(n, fx, t, sol, hint_txt, nxt=None):
    hid = ' hidden' if n > 1 else ''
    nx = nxt or ''
    return (f'<div class="qrow" id="p{n}box"{hid}><div class="fx">{T("%d) גזרו: %s" % (n, fx))}</div>{hint(hint_txt)}'
            + ans(t, M("f'(x)="), "?", nxt=nx or None, sol='#sol%d' % n)
            + f'<button type="button" class="btn small ghost showsol" data-for="#sol{n}">הצגת פתרון</button><div class="sol" id="sol{n}" hidden>{T(sol)}</div></div>')

stage3 = f'''
<section class="stage" id="s3" aria-labelledby="s3t"><h2 id="s3t"><span class="n">3</span>{titles[2]}</h2>
<p>{T("גזרו והקלידו את $f'(x)$ בצורה פשוטה. הדף בודק אם הביטוי שהקלדתם שווה לנגזרת הנכונה.")}</p>
{q(1, "$f(x)=x^5-3x$", "p1", "גוזרים כל איבר: $(x^5)'=5x^4$ ו־$(3x)'=3$. לכן $f'(x)=5x^4-3$.", "גוזרים כל איבר בנפרד.", "#p2box")}
{q(2, "$f(x)=2x^3+4x^2-x+9$", "p2", "$f'(x)=2\\cdot 3x^2+4\\cdot 2x-1+0=6x^2+8x-1$.", "מקדם קבוע נשאר, האיבר החופשי נגזרתו 0.", "#p3box")}
{q(3, "$f(x)=(x-2)(x+3)$", "p3", "קודם פותחים סוגריים: $f(x)=x^2+x-6$. אחר כך $f'(x)=2x+1$.", "פתחו סוגריים לפני הגזירה.", "#p4box")}
{q(4, "$f(x)=\\dfrac{x^4}{2}-\\dfrac{x^3}{3}$", "p4", "המקדמים הם $\\frac12$ ו־$\\frac13$: $f'(x)=\\frac12\\cdot 4x^3-\\frac13\\cdot 3x^2=2x^3-x^2$.", "אפשר לכתוב בקלדה x^4/2 או 1/2x^4.")}
</section>'''

stage4 = f'''
<section class="stage" id="s4" aria-labelledby="s4t"><h2 id="s4t"><span class="n">4</span>{titles[3]}</h2>
<div class="def-box"><h3>משיק בנקודה</h3><p>{T("המשיק לגרף של $f$ בנקודה $x=a$ עובר דרך $(a,\\,f(a))$ ושיפועו $f'(a)$:")}</p>{D("y-f(a)=f'(a)\\,(x-a)")}</div>
<p>{T("נתונה $f(x)=x^3-3x$. מצאו את משוואת המשיק לגרף בנקודה A שבה $x=2$. פתרו לפי הסדר.")}</p>
<div class="viz"><svg id="v4" role="img" aria-label="גרף הפונקציה והנקודה A, ומשיק שמופיע אחרי הפתרון"></svg></div>
<p class="cap" id="cap4" hidden>זה המשיק שמצאתם: הישר שנוגע בגרף ב־A ושיפועו שווה לנגזרת.</p>
<div class="qrow">{T("א) חשבו $f(2)$.")}{ans("t2", M("f(2)="), "?", nxt="#t3box")}</div>
<div class="qrow" id="t3box" hidden>{T("ב) מצאו את $f'(x)$.")}{ans("t3", M("f'(x)="), "?", nxt="#t4box")}</div>
<div class="qrow" id="t4box" hidden>{T("ג) חשבו את $f'(2)$, שיפוע המשיק.")}{ans("t4", M("f'(2)="), "?", nxt="#t5box")}</div>
<div class="qrow" id="t5box" hidden>{T("ד) כתבו את משוואת המשיק בצורה $y=\\dots$")}{hint("הציבו בנוסחה: y − f(2) = f′(2)(x − 2), ופשטו.")}{ans("t5", M("y="), "9x+1")}</div>
</section>'''

sc = ''.join('<label class="sc-item"><input type="checkbox"><span>%s</span></label>' % T(t) for t in [
    'אני יודע/ת לגזור חזקה, קבוע ומקדם קבוע.',
    'אני יודע/ת לגזור סכום והפרש של איברים, ולפתוח סוגריים לפני הגזירה כשצריך.',
    'אני יודע/ת לכתוב משוואת משיק בנקודה נתונה.'])

hero_fig = ('<svg viewBox="-14 -6 280 228" width="100%"><g fill="none" stroke-linecap="round" stroke-linejoin="round">'
            '<path d="M30 190V20M30 190H250" stroke="#fff" stroke-opacity=".6" stroke-width="2"/>'
            '<path d="M24 26l6-10 6 10M240 184l10 6-10 6" stroke="#fff" stroke-opacity=".6" stroke-width="2"/>'
            '<path d="M40 175C80 175 110 40 150 70S205 150 235 40" stroke="#fff" stroke-width="4.5"/>'
            '<circle cx="150" cy="70" r="7" fill="#5eead4"/><path d="M92 112L208 28" stroke="#5eead4" stroke-width="3" stroke-dasharray="6 6"/>'
            '<text x="146" y="214" fill="#ffc83d" font-family="Rubik" font-weight="700" font-size="19" text-anchor="middle" direction="ltr" style="direction:ltr;unicode-bidi:bidi-override">(xⁿ)′ = n·xⁿ⁻¹</text>'
            '</g></svg>')

page = f'''<!doctype html>
<html lang="he" dir="rtl" data-theme="auto">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="robots" content="noindex,nofollow">
<meta name="color-scheme" content="light dark">
<title>כללי גזירה</title>
<link rel="stylesheet" href="{SH}katex.min.css?v={V}">
<link rel="stylesheet" href="{SH}style.css?v={V}">
<link rel="stylesheet" href="{SH}calc.css?v={V}">
<link rel="stylesheet" href="{SH}defn.css?v={V}">
</head>
<body>
<div class="wrap">
<section class="hero">
  <svg class="deco" viewBox="0 0 600 120" preserveAspectRatio="none" aria-hidden="true"><defs><linearGradient id="dg"><stop offset="0" stop-color="#67e8f9" stop-opacity="0"/><stop offset=".5" stop-color="#a7f3d0"/><stop offset="1" stop-color="#c4b5fd" stop-opacity="0"/></linearGradient></defs><path class="wv" d="M0 90C100 90 140 30 300 60S500 20 600 30" fill="none" stroke="url(#dg)" stroke-width="2.5"/><path class="wv2" d="M0 110C120 100 200 60 320 80S520 50 600 60" fill="none" stroke="url(#dg)" stroke-width="1.5" opacity=".6"/></svg>
  <div class="t">
    <div class="crumb"><a href="../../../../" target="_top">בית</a> › <a href="../../../" target="_top">כיתה י׳</a> › <a href="../../" target="_top">חשבון דיפרנציאלי ואינטגרלי</a> › <a href="../" target="_top">נגזרת</a> › כללי גזירה</div>
    <span class="k">כיתה י׳ · 5 יחידות</span>
    <h1>כללי <em>גזירה</em></h1>
    <p>מגלים בעצמם, לומדים את הכללים, ומתרגלים</p>
  </div>
  <div class="hero-fig" aria-hidden="true">{hero_fig}</div>
</section>
<div class="top" id="topbar">
  <div class="top-row"><div class="stagenav">{nav}</div></div>
  <div class="prog" role="progressbar" aria-valuemin="0" aria-valuemax="100" aria-valuenow="0" aria-label="התקדמות בעמוד" id="prog"><div class="prog-fill" id="prog-fill"></div><span class="prog-txt" id="prog-txt"></span></div>
</div>
<main class="dmain" id="main">
<p class="dintro">{T("חישוב נגזרת לפי ההגדרה ארוך. כאן נגלה כלל שחוסך אותו, נלמד אותו, ונשתמש בו לגזירת פולינומים ולמציאת משיק.")}</p>
{stage1}{stage2}{stage3}{stage4}
<fieldset class="selfcheck"><legend>בדיקה עצמית</legend>{sc}</fieldset>
</main>
<div class="foot">מתמטיקה · לכל בעיה יש פתרון, להנות מהאתגר</div>
</div>
<script src="{SH}defn.js?v={V}"></script>
<script src="assets/rules.js?v={V}"></script>
<script src="{SH}hero.js?v={V}"></script>
</body>
</html>
'''
page = lib.render_all(page)
open(os.path.join(OUT, 'index.html'), 'w', encoding='utf8').write(page)
print('built', len(page), 'bytes;', len(lib.TEX), 'formulas')
