# -*- coding: utf-8 -*-
"""בוחן "פולינום: חלק א וחלק ב" (class10/calc/polynomial-quiz/). ניסיון אחד לכל סעיף, משוב מיידי, ציון, טעות נגררת וקוד תוצאה.
בנייה: python3 build_quiz.py   (assets: quiz/quiz.js ו-quiz/quiz.css ידניים; השאר מועתקים מ-pre-analysis-source/assets)"""
import os, sys, time, shutil
HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
import lib
from lib import md
from content import _sketch

ROOT = os.path.join(HERE, '..', '..', 'class10', 'calc')
OUT = os.path.join(ROOT, 'polynomial-quiz')
SRC = os.path.join(ROOT, 'pre-analysis-source', 'assets')
os.makedirs(os.path.join(OUT, 'assets'), exist_ok=True)
for f in ['style.css', 'calc.css', 'katex.min.css', 'hero.js', 'figs.js']:
    shutil.copy(os.path.join(SRC, f), os.path.join(OUT, 'assets', f))
shutil.rmtree(os.path.join(OUT, 'assets', 'fonts'), ignore_errors=True)
shutil.copytree(os.path.join(SRC, 'fonts'), os.path.join(OUT, 'assets', 'fonts'))
for f in ['quiz.js', 'quiz.css']:
    shutil.copy(os.path.join(HERE, 'quiz', f), os.path.join(OUT, 'assets', f))

ENDS4 = ['שני הקצוות למעלה', 'שני הקצוות למטה', 'שמאל למטה וימין למעלה', 'שמאל למעלה וימין למטה']
STEM = r'נתון הפולינום $f(x)=a\cdot(x+1)(x-2)^2(x-4)$, כאשר $a$ מספר ממשי, והגרף שלו עובר דרך הנקודה $(1;-12)$.'
SK = _sketch([-1.5, 4.5], [-40, 80], ['pow(x,4)', 'pow(x,3)', 'pow(x,2)', 'x', '1'], [2, -14, 24, 8, -32], '', 'שרטוט הגרף של הפולינום מנקודות', 20, name='f',
             intro='הזינו נקודות של הגרף בטבלה (x ו-y) או גררו אותן בשרטוט. אחר כך ציירו בציור חופשי קו דרך הנקודות, משמאל לימין. נבדקות עד 8 נקודות.')

SK = SK.replace('&quot;free&quot;:true', '&quot;free&quot;:true,&quot;rawStroke&quot;:true')
assert 'rawStroke' in SK

# id, section, pts, type, question, options, correct (None = computed in quiz.js), why
ITEMS = [
 ('a1', 'A', 5, 'mc', r'הקצוות של $f(x)=-2x^4+x$:', ENDS4, 1,
  r'האיבר המוביל $-2x^4$: מעלה זוגית ומקדם שלילי, ולכן שני הקצוות למטה.'),
 ('a2', 'A', 5, 'num', r'מהו המקדם המוביל של $g(x)=(x-1)(2x+3)(4-x)$?', None, '-2',
  r'האיבר המוביל הוא מכפלת האיברים המובילים של הגורמים: $x\cdot2x\cdot(-x)=-2x^3$ (שימו לב: $4-x$ כולל $-x$).'),
 ('a3', 'A', 5, 'mc', r'מהו $\lim_{x\to-\infty}(-0.5x^5)$?', [r'$\infty$', r'$-\infty$', r'$0$', 'אין גבול'], 0,
  r'$x^5$ שלילי כש-$x$ שלילי וגדול בערכו המוחלט, והמקדם $-0.5$ הופך את הסימן: הערכים חיוביים וגדולים. למשל $(-10)^5\cdot(-0.5)=50000$.'),
 ('a4', 'A', 5, 'mc', r'דליה: "לכל פולינום ממעלה רביעית יש לפחות נקודת אפס אחת". מה נכון?',
  ['דליה צודקת', r'דליה אינה צודקת, למשל $x^4+1$', r'דליה אינה צודקת, למשל $x^3$'], 1,
  r'דוגמה נגדית: $x^4+1$ חיובי לכל $x$, ולכן אין לו נקודות אפס. פולינום ממעלה זוגית יכול להישאר כולו מעל ציר ה-$x$.'),
 ('p', 'B', 12, 'num', r'**א.** מצאו את $a$.', None, '2',
  r'הצבת $(1;-12)$: $a\cdot2\cdot1^2\cdot(-3)=-12$, כלומר $-6a=-12$, ולכן $a=2$.'),
 ('b', 'B', 10, 'mc', r'**ב.** כמה נקודות אפס יש ל-$f$?', ['2', '3', '4', '5'], 1,
  r'כל גורם מתאפס בנקודה אחת: $x=-1$, $x=2$ ו-$x=4$. שלוש נקודות אפס ($2$ בריבוי $2$).'),
 ('c', 'B', 10, 'mc', r'**ג.** בנקודה $x=2$ הגרף של $f$:', ['חותך את ציר ה-$x$', 'משיק לציר ה-$x$', 'חותך בצורת מגלשה'], 1,
  r'$x=2$ הוא שורש בריבוי זוגי ($2$), ולכן הגרף משיק לציר ושם הסימן אינו מתחלף.'),
 ('d', 'B', 12, 'mc', r'**ד.** באילו תחומים $f(x)>0$?',
  [r'$x<-1$ וגם $x>4$', r'$-1<x<4$, פרט לנקודה $x=2$', r'$-1<x<2$ וגם $x>4$', r'$f$ חיובי לכל $x$ פרט לנקודות האפס'], None,
  r'$a=2$ חיובי ומעלה $4$, ולכן הקצה השמאלי למעלה והסימן חיובי משמאל ל-$-1$. ב-$-1$ הריבוי אי-זוגי והסימן מתחלף לשלילי. ב-$2$ הריבוי זוגי והסימן נשאר שלילי. ב-$4$ הריבוי אי-זוגי והסימן מתחלף לחיובי. לכן $f(x)>0$ כאשר $x<-1$ וגם $x>4$.'),
 ('e', 'B', 8, 'mc', r'**ה.** הקצוות של $f$:', ENDS4, None,
  r'האיבר המוביל $a x^4$ (מעלה $4$): כש-$a$ חיובי שני הקצוות למעלה, וכש-$a$ שלילי שני הקצוות למטה. כאן $a=2$.'),
 ('f', 'B', 6, 'mc', r'**ו.** הפונקציה $f$ היא:', ['זוגית', 'אי-זוגית', 'לא זוגית ולא אי-זוגית'], 2,
  r'$f(-1)=0$ אבל $f(1)=-12$: לא שווים (לא זוגית) ולא הפוכים (לא אי-זוגית).'),
 ('s', 'B', 12, 'sketch', r'**ז.** שרטטו את הגרף של $f$ (עם ה-$a$ שמצאתם): סמנו את נקודות האפס, את נקודת החיתוך עם ציר ה-$y$ ונקודה נוספת על הגרף, וציירו קו חלק דרכן.', None, None,
  r'נקודות האפס: $x=-1$, $x=2$, $x=4$. החיתוך עם ציר ה-$y$ הוא $f(0)=-32$. נקודה נוספת, למשל $f(1)=-12$ או $f(3)=-8$. הגרף משיק לציר ה-$x$ בנקודה $x=2$, והקצוות למעלה. נוסחת הפולינום: $f(x)=2x^4-14x^3+24x^2+8x-32$'),
 ('z', 'C', 10, 'mc', r'**אתגר.** נתון $q(x)=x^m(x-3)^n$, כאשר $m$ וגם $n$ מספרים טבעיים, והפולינום ממעלה חמישית. הגרף של $q$ משיק לציר ה-$x$ בראשית, חותך אותו בנקודה $x=3$ ועובר דרך הנקודה $(4;16)$. מהי הנוסחה של $q$?',
  [r'$x^2(x-3)^3$', r'$x^4(x-3)$', r'$x^3(x-3)^2$', r'$x(x-3)^4$'], 0,
  r'מעלה חמישית: $m+n=5$. משיק בראשית: $m$ זוגי. חותך ב-$3$: $n$ אי-זוגי. נשארו $(m;n)=(2;3)$ או $(4;1)$. הצבת $(4;16)$: $4^m\cdot1^n=16$, ולכן $m=2$ ו-$n=3$. ($x^4(x-3)$ מקיים את התנאים הראשונים, אבל $q(4)=256$.)'),
]

bank = '<div id="stem">%s</div>\n' % md(STEM, inline=True)
for (id_, sec, pts, typ, q, opts, c, why) in ITEMS:
    bank += '<div class="qi" data-id="%s" data-sec="%s" data-pts="%d" data-type="%s"%s>' % (id_, sec, pts, typ, (' data-c="%s"' % c) if c is not None else '')
    bank += '<div class="qq">%s</div>' % md(q, inline=True)
    if typ == 'sketch':
        bank += '<div class="qfig">%s</div>' % SK
    for o in (opts or []):
        bank += '<div class="qo">%s</div>' % md(o, inline=True)
    bank += '<div class="qw">%s</div></div>\n' % md(why, inline=True)

V = str(int(time.time()))[-8:]
page = f'''<!doctype html>
<html lang="he" dir="rtl" data-theme="auto">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="robots" content="noindex,nofollow">
<meta name="color-scheme" content="light dark">
<title>בוחן פולינום - חלק א וחלק ב</title>
<link rel="stylesheet" href="assets/katex.min.css?v={V}">
<link rel="stylesheet" href="assets/style.css?v={V}">
<link rel="stylesheet" href="assets/calc.css?v={V}">
<link rel="stylesheet" href="assets/quiz.css?v={V}">
</head>
<body>
<div class="wrap">
<section class="hero">
  <svg class="deco" viewBox="0 0 600 120" preserveAspectRatio="none" aria-hidden="true"><defs><linearGradient id="dg"><stop offset="0" stop-color="#67e8f9" stop-opacity="0"/><stop offset=".5" stop-color="#a7f3d0"/><stop offset="1" stop-color="#c4b5fd" stop-opacity="0"/></linearGradient></defs><path class="wv" d="M0 90C100 90 140 30 300 60S500 20 600 30" fill="none" stroke="url(#dg)" stroke-width="2.5"/></svg>
  <div class="t">
    <span class="k">כיתה י׳ · 5 יחידות</span>
    <h1>בוחן <em>פולינום</em></h1>
    <p>חלק א: חזקות, פולינום וקצוות. חלק ב: חקירה ושרטוט. ובסוף שאלת אתגר.</p>
  </div>
</section>
<main id="main" class="content quiz-main" tabindex="-1">
<div id="quiz" aria-live="polite"></div>
<div id="bank" hidden>
{bank}</div>
</main>
<div class="foot">מתמטיקה · לכל בעיה יש פתרון, להנות מהאתגר</div>
</div>
<script src="assets/figs.js?v={V}"></script>
<script src="assets/quiz.js?v={V}"></script>
<script src="assets/hero.js?v={V}"></script>
</body>
</html>
'''
page = lib.render_all(page)
open(os.path.join(OUT, 'index.html'), 'w', encoding='utf8').write(page)
print('built quiz', len(page), 'bytes;', len(lib.TEX), 'formulas')
