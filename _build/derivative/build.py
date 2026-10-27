# -*- coding: utf-8 -*-
"""Builds class10/calc/derivative/definition/index.html ("מהי נגזרת").
CSS/JS של העמוד נערכים ידנית ב-definition/assets/defn.css ו-defn.js.
ה-assets המשותפים (katex, style.css, calc.css, hero.js) מועתקים מ-calc/polynomial/assets."""
import os, sys, time, shutil
HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, os.path.join(HERE, '..', 'calc'))
import lib

ROOT = os.path.join(HERE, '..', '..')
OUT = os.path.join(ROOT, 'class10', 'calc', 'derivative', 'definition')
SRC = os.path.join(ROOT, 'class10', 'calc', 'polynomial', 'assets')
V = str(int(time.time()))[-8:]

for name in ('katex.min.css', 'style.css', 'calc.css', 'hero.js'):
    shutil.copy(os.path.join(SRC, name), os.path.join(OUT, 'assets', name))
if not os.path.isdir(os.path.join(OUT, 'assets', 'fonts')):
    shutil.copytree(os.path.join(SRC, 'fonts'), os.path.join(OUT, 'assets', 'fonts'))

def M(tex):          # inline math
    return lib.md('$\\displaystyle %s$' % tex, inline=True)
def T(s):            # hebrew text with $math$
    return lib.md(s, inline=True)
def D(tex):          # display math
    return lib.md('$$%s$$' % tex)

# ---------------- stage 3 data: (claim-correct, [options], correct-index, reason)
S3 = [
 ('f(a+h)-f(a)=(a+h)^2-a^2',
  ['f(a+h)-f(a)=(a+h)^2+a^2', 'f(a+h)-f(a)=(a+h)^2-a^2', 'f(a+h)-f(a)=a^2+h^2-a^2'], 1,
  'הצבה בפונקציה $f(x)=x^2$'),
 ('(a+h)^2-a^2=a^2+2ah+h^2-a^2',
  ['(a+h)^2-a^2=a^2+h^2-a^2', '(a+h)^2-a^2=a^2+2h-a^2', '(a+h)^2-a^2=a^2+2ah+h^2-a^2'], 2,
  'נוסחת הכפל המקוצר: ריבוע סכום'),
 ('a^2+2ah+h^2-a^2=2ah+h^2',
  ['a^2+2ah+h^2-a^2=h^2', 'a^2+2ah+h^2-a^2=2ah+h^2', 'a^2+2ah+h^2-a^2=2ah-h^2'], 1,
  'חיסור איברים מנוגדים: $a^2-a^2=0$'),
 ('\\dfrac{f(a+h)-f(a)}{h}=\\dfrac{2ah+h^2}{h}',
  ['\\dfrac{f(a+h)-f(a)}{h}=\\dfrac{2ah+h^2}{a}', '\\dfrac{f(a+h)-f(a)}{h}=2ah+h', '\\dfrac{f(a+h)-f(a)}{h}=\\dfrac{2ah+h^2}{h}'], 2,
  'הצבת טענה 3 במנת ההפרשים, כש־$h$ שונה מ־0'),
 ('\\dfrac{2ah+h^2}{h}=2a+h',
  ['\\dfrac{2ah+h^2}{h}=2a+h', '\\dfrac{2ah+h^2}{h}=2a+h^2', '\\dfrac{2ah+h^2}{h}=2ah+1'], 0,
  'הוצאת $h$ כגורם משותף וצמצום, כש־$h$ שונה מ־0'),
 ('\\lim_{h\\to 0}(2a+h)=2a',
  ['\\lim_{h\\to 0}(2a+h)=0', '\\lim_{h\\to 0}(2a+h)=2a', '\\lim_{h\\to 0}(2a+h)=2a+h'], 1,
  'כאשר $h\\to 0$ האיבר $h$ שואף ל־0'),
]
rows3 = ''
for i, (good, opts, c, why) in enumerate(S3, 1):
    locked = '' if i == 1 else ' locked'
    ob = ''.join('<button type="button" class="opt">%s</button>' % M(o) for o in opts)
    rows3 += ('<tr class="%s" data-c="%d"><td class="no">%d</td><td class="claim"><div class="opts">%s</div></td><td class="why">%s</td></tr>\n'
              % (locked.strip(), c, i, ob, T(why)))
rows3 += ('<tr class="locked" data-auto="1"><td class="no">7</td><td class="claim">%s</td><td class="why">%s</td></tr>\n'
          % (M("f'(a)=2a"), T('הגדרת הנגזרת וטענות 4, 5, 6')))

FUN = [('f(x)=x^3-3x', 'x³ − 3x'), ('f(x)=x^4-2x^2', 'x⁴ − 2x²'), ('f(x)=x^2-2x', 'x² − 2x')]
chips = ''.join('<button type="button" aria-pressed="%s">%s</button>' % ('true' if i == 0 else 'false', M(t)) for i, (t, _) in enumerate(FUN))
fforms = ''.join('<span class="fform"%s>%s</span>' % ('' if i == 0 else ' hidden', M(t)) for i, (t, _) in enumerate(FUN))

def mc(q, opts, c, exp, reveal=None, extra=''):
    ob = ''.join('<button type="button" class="opt">%s</button>' % T(o) for o in opts)
    rv = ' data-reveal="%s"' % reveal if reveal else ''
    return ('<div class="mc chk" data-c="%d"%s%s><div class="mc-q">%s</div><div class="opts">%s</div>'
            '<span class="fb" aria-live="polite"></span><div class="mc-exp" hidden>%s</div></div>') % (c, rv, extra, T(q), ob, T(exp))

hero_fig = ('<svg viewBox="-14 -6 280 228" width="100%"><g fill="none" stroke-linecap="round" stroke-linejoin="round">'
            '<path d="M30 190V20M30 190H250" stroke="#fff" stroke-opacity=".6" stroke-width="2"/>'
            '<path d="M24 26l6-10 6 10M240 184l10 6-10 6" stroke="#fff" stroke-opacity=".6" stroke-width="2"/>'
            '<path d="M40 175C80 175 110 40 150 70S205 150 235 40" stroke="#fff" stroke-width="4.5"/>'
            '<path d="M62 190L232 18" stroke="#ffc83d" stroke-width="3.5" stroke-dasharray="1 0"/>'
            '<path d="M95 142L232 62" stroke="#5eead4" stroke-width="2.5" stroke-dasharray="6 6"/>'
            '<circle cx="138" cy="110" r="7" fill="#5eead4"/><circle cx="196" cy="108" r="6" fill="#ffc83d"/>'
            '<text x="146" y="214" fill="#ffc83d" font-family="Rubik" font-weight="700" font-size="17" text-anchor="middle" direction="ltr" style="direction:ltr;unicode-bidi:bidi-override">f′(a) = lim Δy/Δx</text>'
            '</g></svg>')

stage_titles = ['שיפוע חותך שמתקרב', 'משני הצדדים', 'ההגדרה בפעולה', 'מיקרוסקופ', 'אתגר: נקודה בלי נגזרת', 'תוצר: מהמשיקים לנגזרת']
nav = ''.join('<a href="#s%d"><b>%d</b>%s</a>' % (i, i, t.replace('אתגר: ', '')) for i, t in enumerate(stage_titles, 1))

stage1 = f'''
<section class="stage" id="s1" aria-labelledby="s1t"><h2 id="s1t"><span class="n">1</span>{stage_titles[0]}</h2>
<p>{T("על הגרף של $f(x)=x^3-3x$ הנקודה A נקבעת ב־$x=2$. גררו את הנקודה B לאורך הגרף, או הזיזו את המחוון, והתבוננו בשיפוע הישר AB.")}</p>
<div class="viz"><svg id="v1" role="img" aria-label="גרף הפונקציה עם נקודה קבועה A ונקודה נעה B וישר חותך"></svg></div>
<div class="ctl"><label for="h1s">מיקום B</label><input type="range" id="h1s" min="-1" max="1" step="0.01" value="1"><button type="button" class="btn small" id="h1go">קרבו את B אל A</button><button type="button" class="btn small ghost" id="h1flip">עברו לצד השני</button></div>
<div class="ro"><div><small>{T("הפרש ה־$x$: $h$")}</small><span class="v" id="h1">1</span></div><div><small>{T("הפרש הערכים: $\\Delta y$")}</small><span class="v" id="dy1">—</span></div><div class="big"><small>שיפוע הישר AB</small><span class="v" id="m1">—</span></div></div>
<p><strong>שאלה.</strong> כשהנקודה B מתקרבת ל־A מכל צד, שיפוע הישר AB שואף למספר. איזה מספר?</p>
<div class="row-in chk typed" id="g1box"><input type="text" inputmode="decimal" autocomplete="off" spellcheck="false" placeholder="?" aria-label="התשובה"><button type="button" class="btn small">בדיקה</button><span class="fb" aria-live="polite"></span></div>
<p id="g1note" hidden><strong>זהו שיפוע המשיק בנקודה A.</strong> המשיק הוא הישר דרך A ששיפועו הוא הערך שאליו שואפים שיפועי החותכים. הוא מסומן עכשיו בגרף.</p>
</section>'''

stage2 = f'''
<section class="stage" id="s2" aria-labelledby="s2t"><h2 id="s2t"><span class="n">2</span>{stage_titles[1]}</h2>
<p>{T("בשלב 1 התקרבתם אל A מכל צד. עכשיו נכתוב את שיפועי החותכים בטבלה, עבור $h$ קטן יותר ויותר, מימין ומשמאל ל־A.")}</p>
<table class="dtab" id="t2"><thead><tr><th colspan="2">{T("B מימין ל־A, $h>0$")}</th><th colspan="2">{T("B משמאל ל־A, $h<0$")}</th></tr><tr><th>{T("$h$")}</th><th>שיפוע AB</th><th>{T("$h$")}</th><th>שיפוע AB</th></tr></thead><tbody></tbody></table>
<div class="ctl"><button type="button" class="btn small" id="t2go">הוסיפו שורה</button></div>
<div id="t2done" hidden>
{mc("מה קורה לשיפועי החותכים משני הצדדים כש־$|h|$ קטן?", ["הם גדלים בלי הגבלה", "מימין הם שואפים ל־9 ומשמאל ל־0", "משני הצדדים הם שואפים לאותו מספר, 9", "הם נשארים קבועים"], 2, "כאשר $h$ שואף ל־0 משני הצדדים, שיפוע החותך שואף לאותו ערך. לכן קיים גבול, והוא שיפוע המשיק.", reveal="#def")}
</div>
<div class="def-box" id="def" hidden><h3>הגדרה: נגזרת בנקודה</h3>
<p>{T("הנגזרת של הפונקציה $f$ בנקודה $x=a$ היא הגבול של מנת ההפרשים, אם הוא קיים:")}</p>
{D("f'(a)=\\lim_{h\\to 0}\\dfrac{f(a+h)-f(a)}{h}")}
<p>{T("באופן שקול: $\\displaystyle f'(a)=\\lim_{x\\to a}\\dfrac{f(x)-f(a)}{x-a}$.")}</p>
<p>{T("הערך $f'(a)$ הוא שיפוע המשיק לגרף בנקודה שבה $x=a$. בדוגמה: $f'(2)=9$.")}</p></div>
</section>'''

stage3 = f'''
<section class="stage" id="s3" aria-labelledby="s3t"><h2 id="s3t"><span class="n">3</span>{stage_titles[2]}</h2>
<p>{T("נחשב לפי ההגדרה את הנגזרת של $f(x)=x^2$ בנקודה כללית $x=a$. בכל שורה בחרו את הטענה שמתאימה לנימוק.")}</p>
<div class="tw"><table class="steps3" id="st3"><thead><tr><th>מס׳</th><th>טענה</th><th>נימוק</th></tr></thead><tbody>
{rows3}</tbody></table></div>
<div class="row-in chk typed" id="g3box" hidden><span>{T("לפי התוצאה, מהו $f'(3)$?")}</span><input type="text" inputmode="decimal" autocomplete="off" spellcheck="false" placeholder="?" aria-label="התשובה"><button type="button" class="btn small">בדיקה</button><span class="fb" aria-live="polite"></span></div>
</section>'''

stage4 = f'''
<section class="stage" id="s4" aria-labelledby="s4t"><h2 id="s4t"><span class="n">4</span>{stage_titles[3]}</h2>
<p>הגדילו את הגרף סביב הנקודה. כשמתקרבים מספיק, הגרף נראה כמעט כמו ישר, וזה המשיק.</p>
<div class="chips" id="fchips" role="group" aria-label="בחירת פונקציה">{chips}</div>
<div class="viz"><svg id="v4" role="img" aria-label="חלון מוגדל סביב נקודה על גרף, עם המשיק"></svg></div>
<div class="ctl"><label for="a4">נקודה {T("$x=a$")}</label><input type="range" id="a4" min="-2" max="2.2" step="0.05" value="1.5"></div>
<div class="ctl"><label for="z4">הגדלה</label><input type="range" id="z4" min="0" max="7" step="0.05" value="0"><label class="chk-inline"><input type="checkbox" id="tg4" checked> הצגת המשיק</label></div>
<div class="ro"><div><small>הנקודה</small><span class="v" id="a4v">1.5</span></div><div><small>רוחב החלון</small><span class="v" id="w4">4</span></div><div><small>הגדלה</small><span class="v" id="zv4">×1</span></div><div><small>שיפוע המשיק</small><span class="v" id="m4">3.75</span></div><div class="big"><small>הפער המרבי בין הגרף למשיק, באחוזים מגובה החלון</small><span class="v" id="g4">—</span></div></div>
<p class="muted">הפונקציה שנבחרה: {fforms}</p>
{mc("קרוב מאוד לנקודה, הגרף כמעט חופף ל־", ["לישר החותך הראשון שבחרנו", "למשיק בנקודה", "לציר ה־$x$", "לישר ששיפועו 1"], 1, "ככל שמגדילים, הפער בין הגרף למשיק קטן. זו הסיבה ש־$f'(a)$, שיפוע המשיק, מתאר את קצב השינוי של הפונקציה ליד $a$.")}
</section>'''

stage5 = f'''
<section class="stage" id="s5" aria-labelledby="s5t"><h2 id="s5t"><span class="n">5</span>{stage_titles[4]}<span class="dtag">אתגר</span></h2>
<p>{T("נתונה $f(x)=|x|$ והנקודה A ב־$x=0$. גררו את B לימין ולשמאל והשוו את שיפועי החותכים.")}</p>
<div class="viz"><svg id="v5" role="img" aria-label="גרף ערך מוחלט עם ישר חותך דרך הראשית"></svg></div>
<div class="ctl"><label for="h5s">מיקום B</label><input type="range" id="h5s" min="-1.8" max="1.8" step="0.05" value="1"></div>
<div class="ro"><div><small>{T("$h$")}</small><span class="v" id="h5">1</span></div><div><small>שיפוע AB</small><span class="v" id="m5">1</span></div><div class="big"><small>מימין ל־A</small><span class="v" id="r5">—</span></div><div class="big"><small>משמאל ל־A</small><span class="v" id="l5">—</span></div></div>
{mc("האם קיימת נגזרת של $f(x)=|x|$ ב־$x=0$?", ["כן, והיא 0", "כן, והיא 1", "לא, כי הגבול מימין והגבול משמאל שונים", "לא, כי הפונקציה אינה מוגדרת ב־0"], 2, "מימין שיפוע החותך הוא 1, משמאל הוא $-1$. אין גבול אחד, ולכן אין נגזרת. בגרף זו נקודת שבר, ואין בה משיק.")}
</section>'''

pin = ''.join('<label>%s<input type="text" inputmode="decimal" autocomplete="off" spellcheck="false" aria-label="שיפוע בנקודה x=%s"></label>' % (M('x=%s' % t), t) for t in ('-2', '-1', '0', '1', '2'))
stage6 = f'''
<section class="stage" id="s6" aria-labelledby="s6t"><h2 id="s6t"><span class="n">6</span>{stage_titles[5]}</h2>
<p>{T("בגרף העליון מסומנים משיקים לגרף של $f(x)=x^3-3x$ בחמש נקודות. קראו את השיפוע של כל משיק, והציבו בגרף התחתון נקודה בגובה השיפוע, מעל ה־$x$ המתאים. אפשר לגרור או להקליד.")}</p>
<div class="viz"><svg id="v6a" role="img" aria-label="גרף הפונקציה עם חמישה משיקים"></svg></div>
<div class="viz"><svg id="v6b" role="img" aria-label="מישור לסימון שיפועי המשיקים"></svg></div>
<div class="pgrid" id="pg">{pin}</div>
<div class="row-in chk" id="pbox"><button type="button" class="btn" id="pgo">בדיקה</button><span class="fb" id="pfb" aria-live="polite"></span></div>
<div id="pdone" hidden>
<div class="def-box"><h3>הנקודות יוצרות גרף של פונקציה חדשה</h3><p>זו <strong>פונקציית הנגזרת</strong>: לכל {T("$x$")} היא נותנת את שיפוע המשיק לגרף של {T("$f$")}. כאן {T("$f'(x)=3x^2-3$")}. את הכללים לחישוב הנגזרת נלמד במשימות הבאות.</p></div>
{mc("באילו נקודות ערך הנגזרת הוא 0, ומה קורה שם לגרף של $f$?", ["$x=-2$ ו־$x=2$, ושם הגרף חותך את הציר", "$x=-1$ ו־$x=1$, ושם למשיק יש שיפוע אפס: הגרף עובר משיא לשפל ולהפך", "$x=0$ בלבד, ושם יש נקודת שבר", "בכל הנקודות"], 1, "משיק אופקי פירושו $f'(x)=0$. בנקודות כאלה הפונקציה עוברת מעלייה לירידה או להפך, ולכן שם נחפש קיצון.")}
</div>
</section>'''

sc = ''.join('<label class="sc-item"><input type="checkbox"><span>%s</span></label>' % T(t) for t in [
    'אני יכול/ה להסביר מדוע שיפוע החותך הופך לשיפוע המשיק כש־B מתקרבת ל־A.',
    'אני יכול/ה לכתוב את הגדרת הנגזרת בנקודה כגבול של מנת ההפרשים.',
    'אני יכול/ה לגזור לפי ההגדרה את $f(x)=x^2$.',
    'אני יודע/ת מדוע בנקודת שבר אין נגזרת.'])

page = f'''<!doctype html>
<html lang="he" dir="rtl" data-theme="auto">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="robots" content="noindex,nofollow">
<meta name="color-scheme" content="light dark">
<title>מהי נגזרת</title>
<link rel="stylesheet" href="assets/katex.min.css?v={V}">
<link rel="stylesheet" href="assets/style.css?v={V}">
<link rel="stylesheet" href="assets/calc.css?v={V}">
<link rel="stylesheet" href="assets/defn.css?v={V}">
</head>
<body>
<div class="wrap">
<section class="hero">
  <svg class="deco" viewBox="0 0 600 120" preserveAspectRatio="none" aria-hidden="true"><defs><linearGradient id="dg"><stop offset="0" stop-color="#67e8f9" stop-opacity="0"/><stop offset=".5" stop-color="#a7f3d0"/><stop offset="1" stop-color="#c4b5fd" stop-opacity="0"/></linearGradient></defs><path class="wv" d="M0 90C100 90 140 30 300 60S500 20 600 30" fill="none" stroke="url(#dg)" stroke-width="2.5"/><path class="wv2" d="M0 110C120 100 200 60 320 80S520 50 600 60" fill="none" stroke="url(#dg)" stroke-width="1.5" opacity=".6"/></svg>
  <div class="t">
    <div class="crumb"><a href="../../../../" target="_top">בית</a> › <a href="../../../" target="_top">כיתה י׳</a> › <a href="../../" target="_top">חשבון דיפרנציאלי ואינטגרלי</a> › <a href="../" target="_top">נגזרת</a> › מהי נגזרת</div>
    <span class="k">כיתה י׳ · 5 יחידות</span>
    <h1>מהי <em>נגזרת</em></h1>
    <p>משיפוע חותך לשיפוע בנקודה: ההגדרה, בעשייה</p>
  </div>
  <div class="hero-fig" aria-hidden="true">{hero_fig}</div>
</section>
<div class="top" id="topbar">
  <div class="top-row"><div class="stagenav">{nav}</div></div>
  <div class="prog" role="progressbar" aria-valuemin="0" aria-valuemax="100" aria-valuenow="0" aria-label="התקדמות בעמוד" id="prog"><div class="prog-fill" id="prog-fill"></div><span class="prog-txt" id="prog-txt"></span></div>
</div>
<main class="dmain" id="main">
<p class="dintro">{T("מהו שיפוע של גרף **בנקודה אחת**? לשיפוע של קו ישר צריך שתי נקודות. כאן נראה איך שיפוע החותך הופך לשיפוע המשיק, ומזה נגיע להגדרת הנגזרת.")}</p>
{stage1}{stage2}{stage3}{stage4}{stage5}{stage6}
<fieldset class="selfcheck"><legend>בדיקה עצמית</legend>{sc}</fieldset>
</main>
<div class="foot">מתמטיקה · לכל בעיה יש פתרון, להנות מהאתגר</div>
</div>
<script src="assets/defn.js?v={V}"></script>
<script src="assets/hero.js?v={V}"></script>
</body>
</html>
'''
page = lib.render_all(page)
open(os.path.join(OUT, 'index.html'), 'w', encoding='utf8').write(page)
print('built', len(page), 'bytes;', len(lib.TEX), 'formulas')
