# -*- coding: utf-8 -*-
"""בוחן "פולינום: חלק א וחלק ב" (class10/calc/polynomial-quiz/). ניסיון אחד לכל סעיף, משוב מיידי, ציון, טעות נגררת וקוד תוצאה.
בנייה: python3 build_quiz.py   (assets: quiz/quiz.js ו-quiz/quiz.css ידניים; השאר מועתקים מ-pre-analysis-source/assets)"""
import os, sys, time, shutil
HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
import lib
from lib import md

ROOT = os.path.join(HERE, '..', '..', 'class10', 'calc')
OUT = os.path.join(ROOT, 'polynomial-quiz')
SRC = os.path.join(ROOT, 'pre-analysis-source', 'assets')
os.makedirs(os.path.join(OUT, 'assets'), exist_ok=True)
for f in ['style.css', 'calc.css', 'katex.min.css', 'hero.js']:
    shutil.copy(os.path.join(SRC, f), os.path.join(OUT, 'assets', f))
shutil.rmtree(os.path.join(OUT, 'assets', 'fonts'), ignore_errors=True)
shutil.copytree(os.path.join(SRC, 'fonts'), os.path.join(OUT, 'assets', 'fonts'))
for f in ['quiz.js', 'quiz.css']:
    shutil.copy(os.path.join(HERE, 'quiz', f), os.path.join(OUT, 'assets', f))

ENDS4 = ['שני הקצוות למעלה', 'שני הקצוות למטה', 'שמאל למטה וימין למעלה', 'שמאל למעלה וימין למטה']
STEM = r'נתון הפולינום $f(x)=x^4-kx^2$, כאשר $k$ מספר ממשי, והגרף שלו עובר דרך הנקודה $(3;45)$.'

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
 ('k', 'B', 8, 'num', r'**א.** מצאו את $k$.', None, '4',
  r'הצבת $(3;45)$: $81-9k=45$, ולכן $k=4$.'),
 ('b', 'B', 8, 'mc', r'**ב.** כמה נקודות אפס יש ל-$f$ (לפי ה-$k$ שמצאתם)?', ['1', '2', '3', '4'], None,
  r'$f(x)=x^2(x^2-4)=x^2(x-2)(x+2)$: שלוש נקודות אפס: $-2$, $0$ וגם $2$.'),
 ('c', 'B', 8, 'mc', r'**ג.** בנקודה $x=0$ הגרף של $f$:', ['חותך את ציר ה-$x$', 'משיק לציר ה-$x$', 'חותך בצורת מגלשה'], None,
  r'$x=0$ הוא שורש בריבוי זוגי, ולכן הגרף משיק לציר ושם הסימן אינו מתחלף.'),
 ('d', 'B', 10, 'mc', r'**ד.** באילו תחומים $f(x)<0$?',
  [r'$x<-\sqrt{k}$ וגם $x>\sqrt{k}$', r'$-\sqrt{k}<x<0$ וגם $0<x<\sqrt{k}$', r'$-\sqrt{k}<x<\sqrt{k}$', r'$f$ אינו שלילי לעולם'], None,
  r'הקצה השמאלי למעלה, ולכן הסימן חיובי משמאל לשורש הקטן ביותר, $-2$. בשורש $-2$ הריבוי אי-זוגי והסימן מתחלף לשלילי. בשורש $0$ הריבוי זוגי והסימן נשאר שלילי. בשורש $2$ הסימן מתחלף לחיובי. לכן $f<0$ בתחום $-2<x<0$ וגם בתחום $0<x<2$. התשובה השלישית שגויה, כי $f(0)=0$ ואינו שלילי.'),
 ('e', 'B', 8, 'mc', r'**ה.** הקצוות של $f$:', ENDS4, None,
  r'האיבר המוביל $x^4$: מעלה זוגית ומקדם חיובי, ולכן שני הקצוות למעלה.'),
 ('f', 'B', 8, 'mc', r'**ו.** הפונקציה $f$ היא:', ['זוגית', 'אי-זוגית', 'לא זוגית ולא אי-זוגית'], None,
  r'$f(-x)=(-x)^4-k(-x)^2=x^4-kx^2=f(x)$: כל החזקות זוגיות.'),
 ('g', 'B', 10, 'mc', r'**ז.** כמה נקודות קיצון מקומיות יש ל-$f$?', ['1', '2', '3', '4'], None,
  r'הגרף יורד מהקצה השמאלי עד מינימום מקומי בין השורש $-2$ לשורש $0$, עולה עד הראשית (מקסימום מקומי), יורד שוב עד מינימום מקומי בין השורש $0$ לשורש $2$ ועולה: שלוש נקודות קיצון מקומיות.'),
 ('h', 'B', 10, 'num', r'**ח.** מהו הערך הקטן ביותר של $f$?', None, None,
  r'$f(x)=x^4-4x^2=(x^2-2)^2-4\ge-4$, עם שוויון כאשר $x^2=2$. הערך הקטן ביותר הוא $-4$.'),
 ('i', 'B', 10, 'mc', r'**ט.** כמה פתרונות יש למשוואה $f(x)=-5$?', ['0', '2', '3', '4'], None,
  r'$-5$ קטן מהערך הקטן ביותר של הפונקציה ($-4$), ולכן הגרף אינו מגיע לגובה $-5$: אין פתרונות.'),
]

bank = '<div id="stem">%s</div>\n' % md(STEM, inline=True)
for (id_, sec, pts, typ, q, opts, c, why) in ITEMS:
    bank += '<div class="qi" data-id="%s" data-sec="%s" data-pts="%d" data-type="%s"%s>' % (id_, sec, pts, typ, (' data-c="%s"' % c) if c is not None else '')
    bank += '<div class="qq">%s</div>' % md(q, inline=True)
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
    <p>חלק א: חזקות, פולינום וקצוות. חלק ב: חקירה מלאה. ניסיון אחד לכל סעיף, עם משוב מיידי.</p>
  </div>
</section>
<main id="main" class="content quiz-main" tabindex="-1">
<div id="quiz" aria-live="polite"></div>
<div id="bank" hidden>
{bank}</div>
</main>
<div class="foot">מתמטיקה · לכל בעיה יש פתרון, להנות מהאתגר</div>
</div>
<script src="assets/quiz.js?v={V}"></script>
<script src="assets/hero.js?v={V}"></script>
</body>
</html>
'''
page = lib.render_all(page)
open(os.path.join(OUT, 'index.html'), 'w', encoding='utf8').write(page)
print('built quiz', len(page), 'bytes;', len(lib.TEX), 'formulas')
