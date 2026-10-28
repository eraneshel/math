# -*- coding: utf-8 -*-
import json, os, sys, time
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import lib
import shutil
from content import CH, FORMULAS_HTML, P

ROOT = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', '..', 'class10', 'calc')
MODE = os.environ.get('MODE', 'source')
SRC = os.path.join(ROOT, 'pre-analysis-source')
if MODE == 'source':
    CH = [c for c in CH if c is not P]
    OUT = SRC
    KEYJS = ''
    T_TITLE, T_K, T_H1, T_P, T_CRUMB = ('פונקציות פולינום · חוברת עבודה אישית', 'חוברת עבודה אישית · כיתה י׳ · 5 יחידות', 'פונקציות <em>פולינום</em>',
        'קדם אנליזה · חזקות, אפסים וריבוי · מהבסיס ועד רמת בגרות', 'קדם אנליזה (מקור)')
else:
    P.id = 'ch1'
    CH = [P]
    OUT = os.path.join(ROOT, 'polynomial')
    KEYJS = "window.BOOKLET_KEY='poly-path-v1';\n"
    T_TITLE, T_K, T_H1, T_P, T_CRUMB = ('פולינום', 'כיתה י׳ · 5 יחידות', '<em>פולינום</em>',
        'משימות רחבות: כל נושאי הפונקציות בכל משימה, ברמה שעולה', 'פולינום')
    os.makedirs(os.path.join(OUT, 'assets'), exist_ok=True)
    for f in os.listdir(os.path.join(SRC, 'assets')):
        if f == 'meta.js':
            continue
        src_f = os.path.join(SRC, 'assets', f); dst_f = os.path.join(OUT, 'assets', f)
        if os.path.isdir(src_f):
            shutil.rmtree(dst_f, ignore_errors=True); shutil.copytree(src_f, dst_f)
        else:
            shutil.copy(src_f, dst_f)
V = str(int(time.time()))[-8:]

meta = [c.meta() for c in CH]
for m, c in zip(meta, CH):
    if c.kind == 'front' and c.id != 'intro':
        m['sections'] = [{'id': i, 'title': t} for i, t in c.secs]

hero_fig = ('<svg viewBox="-14 -6 280 228" width="100%"><g fill="none" stroke-linecap="round" stroke-linejoin="round">'
            '<path d="M30 190V20M30 190H250" stroke="#fff" stroke-opacity=".6" stroke-width="2"/>'
            '<path d="M24 26l6-10 6 10M240 184l10 6-10 6" stroke="#fff" stroke-opacity=".6" stroke-width="2"/>'
            '<path d="M30 150C80 40 110 40 140 110S190 190 230 60" stroke="#fff" stroke-width="4.5"/><path d="M30 60C90 190 120 190 150 110S200 30 230 150" stroke="#ffc83d" stroke-width="4.5"/>'
            '<circle cx="146" cy="130" r="7" fill="#5eead4"/><path d="M146 130V190M146 130H30" stroke="#5eead4" stroke-width="2" stroke-dasharray="6 6"/>'
            '<text x="146" y="214" fill="#ffc83d" font-family="Rubik" font-weight="700" font-size="19" text-anchor="middle" direction="ltr" style="direction:ltr;unicode-bidi:bidi-override">y = a(x−p)²(x−q)</text>'
            '</g></svg>')

body = ''.join(c.html() for c in CH)

page = f'''<!doctype html>
<html lang="he" dir="rtl" data-theme="auto">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="robots" content="noindex,nofollow">
<meta name="color-scheme" content="light dark">
<title>{T_TITLE}</title>
<link rel="stylesheet" href="assets/katex.min.css?v={V}">
<link rel="stylesheet" href="assets/style.css?v={V}">
<link rel="stylesheet" href="assets/calc.css?v={V}">
</head>
<body>
<a class="skip" href="#main">דלג לתוכן</a>
<div class="wrap">
<section class="hero">
  <svg class="deco" viewBox="0 0 600 120" preserveAspectRatio="none" aria-hidden="true"><defs><linearGradient id="dg"><stop offset="0" stop-color="#67e8f9" stop-opacity="0"/><stop offset=".5" stop-color="#a7f3d0"/><stop offset="1" stop-color="#c4b5fd" stop-opacity="0"/></linearGradient></defs><path class="wv" d="M0 90C100 90 140 30 300 60S500 20 600 30" fill="none" stroke="url(#dg)" stroke-width="2.5"/><path class="wv2" d="M0 110C120 100 200 60 320 80S520 50 600 60" fill="none" stroke="url(#dg)" stroke-width="1.5" opacity=".6"/></svg>
  <div class="t">
    <div class="crumb"><a href="../../../" target="_top">בית</a> › <a href="../../" target="_top">כיתה י׳</a> › <a href="../" target="_top">חשבון דיפרנציאלי ואינטגרלי</a> › {T_CRUMB}</div>
    <span class="k">{T_K}</span>
    <h1>{T_H1}</h1>
    <p>{T_P}</p>
  </div>
  <div class="hero-fig" aria-hidden="true">{hero_fig}</div>
</section>
<div class="top" id="topbar">
  <div class="top-row">
    <button type="button" class="btn small menu-btn" id="btn-menu" aria-expanded="false" aria-controls="toc">☰ תוכן</button>
    <div class="top-actions">
      <button type="button" class="btn small ghost" id="btn-continue">המשך מאיפה שעצרתי</button>
      <button type="button" class="btn small ghost" id="btn-mistakes">לחזור אליהם <span class="count" id="mistakes-count">0</span></button>
      <button type="button" class="btn small ghost" id="btn-tools">נוסחאות</button>
      <button type="button" class="btn small ghost" id="btn-sound" aria-pressed="true">צליל: פועל</button>
      <button type="button" class="btn small ghost" id="btn-print">הדפסה</button>
      <button type="button" class="btn small ghost" id="btn-theme" aria-pressed="false">מצב כהה</button>
    </div>
  </div>
  <div class="prog" role="progressbar" aria-valuemin="0" aria-valuemax="100" aria-valuenow="0" aria-label="התקדמות בתרגילים" id="prog"><div class="prog-fill" id="prog-fill"></div><span class="prog-txt" id="prog-txt"></span></div>
</div>
<div class="layout">
  <nav id="toc" class="toc" aria-label="תוכן החוברת"></nav>
  <main id="main" class="content" tabindex="-1">
    <div id="notice" class="notice" hidden></div>
{body}
    <section class="chapter" id="mistakes" data-chapter="mistakes" hidden aria-labelledby="mistakes-t">
      <h1 class="ch-title" id="mistakes-t" tabindex="-1">תרגילים לחזור אליהם</h1>
      <p class="muted">כאן מרוכזים התרגילים שסימנת "טעיתי". פתרו שוב, ובסיום סמנו "פתרתי נכון" כדי להסיר אותם מהרשימה.</p>
      <div id="mistakes-list"></div>
    </section>
  </main>
</div>
<div class="foot">מתמטיקה · לכל בעיה יש פתרון, להנות מהאתגר</div>
</div>
<dialog id="dlg-tools" class="dlg" aria-labelledby="tools-h">
  <div class="dlg-h"><h2 id="tools-h">נוסחאות</h2><button type="button" class="btn small ghost" data-close>סגירה</button></div>
  <div class="pane formulas">{FORMULAS_HTML}</div>
</dialog>
<dialog id="dlg-print" class="dlg small-dlg" aria-labelledby="print-h">
  <div class="dlg-h"><h2 id="print-h">הדפסה</h2><button type="button" class="btn small ghost" data-close>סגירה</button></div>
  <label class="chk"><input type="checkbox" id="print-sol"> כולל תשובות ופתרונות</label>
  <div class="dlg-actions">
    <button type="button" class="btn" id="print-chapter">הדפס את הפרק</button>
    <button type="button" class="btn" id="print-all">הדפס את כל החוברת</button>
  </div>
</dialog>
<script src="assets/meta.js?v={V}"></script>
<script src="assets/figs.js?v={V}"></script>
<script src="assets/app.js?v={V}"></script>
<script src="assets/extra.js?v={V}"></script>
<script src="assets/hero.js?v={V}"></script>
</body>
</html>
'''
page = lib.render_all(page)
sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), '..'))
from renumber import renumber
page, _ = renumber(page)
open(os.path.join(OUT, 'index.html'), 'w', encoding='utf8').write(page)
open(os.path.join(OUT, 'assets', 'meta.js'), 'w', encoding='utf8').write(KEYJS + 'window.BOOKLET_META=' + json.dumps(meta, ensure_ascii=False) + ';\n')
print('built', len(page), 'bytes;', len(lib.TEX), 'formulas')
