/* app.js — routing, progress, exercise cards, diagnostic, mistakes, print, theme */
(function () {
  'use strict';
  var META = window.BOOKLET_META || [];
  var KEY = 'normal-booklet-v1';
  var TEACHER = /[?&]teacher=1\b/.test(location.search);
  var state = { done: {}, myAnswers: {}, selfCheck: {}, last: null };
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };

  function load() {
    if (TEACHER) return;
    try {
      var raw = localStorage.getItem(KEY);
      if (raw) { var o = JSON.parse(raw); state.done = o.done || {}; state.myAnswers = o.myAnswers || {}; state.selfCheck = o.selfCheck || {}; state.last = o.last || null; }
    } catch (e) { /* storage unavailable: keep in memory */ }
  }
  function save() {
    if (TEACHER) return;
    try { localStorage.setItem(KEY, JSON.stringify(state)); } catch (e) { /* ignore */ }
  }

  /* ---------- helpers ---------- */
  function chapterEls() { return $$('.chapter'); }
  function cardsOf(chId) { return $$('#' + chId + ' .ex[data-kind]:not(.diag-item)'); }
  function gradedOf(chId) { return cardsOf(chId).filter(function (c) { return c.getAttribute('data-kind') !== 'example'; }); }
  function chapterDone(chId) {
    var g = gradedOf(chId);
    if (!g.length) return false;
    return g.every(function (c) { return state.done[c.getAttribute('data-id')] === 'ok'; });
  }
  function chapterStat(chId) {
    var g = gradedOf(chId), ok = g.filter(function (c) { return state.done[c.getAttribute('data-id')] === 'ok'; }).length;
    return { ok: ok, total: g.length };
  }

  /* ---------- TOC ---------- */
  function buildToc() {
    var nav = $('#toc'), h = '<ul>';
    META.forEach(function (c) {
      h += '<li><a href="#' + c.id + '" data-ch="' + c.id + '"><span>' + c.title + '</span><span class="st" id="st-' + c.id + '"></span></a>';
      if (c.kind === 'chapter' && c.sections && c.sections.length) {
        h += '<ul>' + c.sections.map(function (s) { return '<li><a href="#' + c.id + '/' + s.id + '" data-sec="' + s.id + '"><span>' + s.title.replace(/\$[^$]*\$/g, '…') + '</span></a></li>'; }).join('') + '</ul>';
      }
      h += '</li>';
    });
    nav.innerHTML = h + '</ul>';
  }

  /* ---------- progress ---------- */
  function updateProgress() {
    var total = 0, ok = 0;
    META.forEach(function (c) {
      if (c.kind !== 'chapter') return;
      var s = chapterStat(c.id); total += s.total; ok += s.ok;
      var el = $('#st-' + c.id), a = $('#toc a[data-ch="' + c.id + '"]');
      if (el) el.textContent = s.total ? s.ok + '/' + s.total : '';
      if (a) a.classList.toggle('done-ch', s.total > 0 && s.ok === s.total);
      if (a) a.parentNode.classList.toggle('done-li', s.total > 0 && s.ok === s.total);
    });
    $$('#toc a.done-ch .st').forEach(function () { });
    var pct = total ? Math.round(ok / total * 100) : 0;
    var bar = $('#prog'); bar.setAttribute('aria-valuenow', pct);
    $('#prog-fill').style.width = pct + '%';
    $('#prog-txt').textContent = ok + ' מתוך ' + total + ' תרגילים (' + pct + '%)';
    var bad = Object.keys(state.done).filter(function (k) { return state.done[k] === 'retry'; });
    $('#mistakes-count').textContent = bad.length;
  }

  /* ---------- typed answers ---------- */
  function parseTyped(v) {
    v = String(v).replace(/\u2212/g, '-').replace(/%/g, ' ').replace(/(\d),(\d{3})(?!\d)/g, '$1$2').replace(/(\d),(\d)/g, '$1.$2').replace(/[;,·،]/g, ' ');
    var m = v.match(/(?<![\d.])-?\d+(\.\d+)?|(?<![\d])-?\.\d+/g);
    return m ? m.map(parseFloat) : [];
  }
  function matches(a, k) {
    var pct = /%$/.test(k), ks = k.replace('%', ''), b = parseFloat(ks), d = (ks.split('.')[1] || '').length;
    var tol = Math.max(Math.abs(b) * 0.005, Math.pow(10, -d) / 2 * 1.01);
    if (Math.abs(a - b) <= tol) return true;
    if (pct && Math.abs(a * 100 - b) <= tol) return true;
    return false;
  }
  function checkTyped(input) {
    var key = JSON.parse(input.getAttribute('data-key')), got = parseTyped(input.value);
    var fb = input.closest('.typed').querySelector('.fb');
    input.classList.remove('right', 'wrong'); fb.className = 'fb';
    if (!got.length) { fb.textContent = 'הקלידו תשובה ואז לחצו בדיקה.'; return null; }
    var ok = 0; key.forEach(function (k, i) { if (i < got.length && matches(got[i], k)) ok++; });
    var all = ok === key.length && got.length === key.length;
    if (all) { input.classList.add('right'); fb.classList.add('ok'); fb.textContent = 'נכון! ✓'; }
    else {
      input.classList.add('wrong'); fb.classList.add('no');
      fb.textContent = key.length > 1 ? (got.length !== key.length ? 'יש להקליד ' + key.length + ' תשובות לפי הסדר. ' : '') + ok + ' מתוך ' + key.length + ' נכונות. נסו שוב.' : 'עדיין לא. נסו שוב או פתחו רמז.';
    }
    return all;
  }
  function initTyped() {
    $$('input[data-typed]').forEach(function (inp) {
      var id = inp.getAttribute('data-typed'), btn = inp.closest('.typed').querySelector('.chk');
      if (state.myAnswers[id]) inp.value = state.myAnswers[id];
      inp.addEventListener('input', function () { if (inp.value) state.myAnswers[id] = inp.value; else delete state.myAnswers[id]; save(); inp.classList.remove('right', 'wrong'); });
      var run = function () {
        var r = checkTyped(inp); if (r === null) return;
        var card = inp.closest('.ex');
        if (card.classList.contains('diag-item')) { card.setAttribute('data-ok', r ? '1' : '0'); return; }
        if (r) setDone(id, 'ok');
      };
      btn.addEventListener('click', run);
      inp.addEventListener('keydown', function (e) { if (e.key === 'Enter') { e.preventDefault(); run(); } });
    });
  }

  /* ---------- card state ---------- */
  function paintCard(card) {
    var id = card.getAttribute('data-id'), v = state.done[id], st = $('.ex-state', card);
    card.classList.toggle('is-ok', v === 'ok'); card.classList.toggle('is-retry', v === 'retry');
    if (!st) return;
    st.className = 'ex-state' + (v === 'ok' ? ' st-ok' : v === 'retry' ? ' st-retry' : '');
    st.textContent = v === 'ok' ? (card.getAttribute('data-kind') === 'example' ? 'נקרא ✓' : 'נפתר ✓') : v === 'retry' ? 'לחזור לתרגיל' : '';
  }
  function setDone(id, v) {
    if (v === null) delete state.done[id]; else state.done[id] = v;
    save();
    $$('#main .ex[data-id="' + id + '"]').forEach(paintCard);
    updateProgress(); renderMistakes();
  }
  function initCards() {
    $$('.ex[data-id]').forEach(function (card) {
      var id = card.getAttribute('data-id');
      var ta = $('textarea[data-myans]', card);
      if (ta) {
        if (state.myAnswers[id]) ta.value = state.myAnswers[id];
        ta.addEventListener('input', function () { if (ta.value) state.myAnswers[id] = ta.value; else delete state.myAnswers[id]; save(); });
      }
      var ans = $('.ex-ans', card), bAns = $('.show-ans', card), bSol = $('.show-sol', card), sol = $('.ex-sol', card);
      if (bAns) bAns.addEventListener('click', function () {
        var open = ans.hidden; ans.hidden = !open; bAns.setAttribute('aria-expanded', open ? 'true' : 'false'); bAns.textContent = open ? 'הסתר תשובה' : 'הצג תשובה';
        if (!open) { sol.hidden = true; bSol.setAttribute('aria-expanded', 'false'); bSol.textContent = 'הצג פתרון מלא'; }
      });
      if (bSol) bSol.addEventListener('click', function () {
        var open = sol.hidden; sol.hidden = !open; bSol.setAttribute('aria-expanded', open ? 'true' : 'false'); bSol.textContent = open ? 'הסתר פתרון' : 'הצג פתרון מלא';
      });
      var good = $('.ex-mark .good', card), bad = $('.ex-mark .bad', card), okEx = $('.ok-ex', card);
      if (good) good.addEventListener('click', function () { setDone(id, 'ok'); });
      if (bad) bad.addEventListener('click', function () { setDone(id, 'retry'); });
      if (okEx) okEx.addEventListener('click', function () { setDone(id, state.done[id] === 'ok' ? null : 'ok'); });
      if (TEACHER && ans) { ans.hidden = false; if (sol) sol.hidden = false; }
      paintCard(card);
    });
  }

  /* ---------- self check ---------- */
  function initSelfCheck() {
    $$('input[data-sc]').forEach(function (cb) {
      var k = cb.getAttribute('data-sc');
      cb.checked = !!state.selfCheck[k];
      cb.addEventListener('change', function () { if (cb.checked) state.selfCheck[k] = 1; else delete state.selfCheck[k]; save(); });
    });
  }

  /* ---------- diagnostic ---------- */
  function initDiag() {
    var b = $('.show-diag-ans'); if (!b) return;
    var box = $('.diag-ans');
    b.addEventListener('click', function () { var o = box.hidden; box.hidden = !o; b.setAttribute('aria-expanded', o ? 'true' : 'false'); b.textContent = o ? 'הסתר תשובות' : 'הצג תשובות'; });
    if (TEACHER) box.hidden = false;
    var fin = $('.finish-diag');
    if (fin) fin.addEventListener('click', function () {
      var items = $$('.diag-item'), n = 0, blank = 0, r = $('#route'), msg;
      items.forEach(function (it) {
        var inp = $('input[data-typed]', it);
        if (inp && inp.value.trim() && !it.hasAttribute('data-ok')) checkTyped(inp) && it.setAttribute('data-ok', '1');
        if (inp && inp.value.trim() && it.getAttribute('data-ok') !== '1' && !it.hasAttribute('data-ok')) it.setAttribute('data-ok', '0');
        var st = $('.ex-state', it);
        if (!inp || !inp.value.trim()) { blank++; if (st) st.textContent = 'לא נענתה'; return; }
        var ok = checkTyped(inp); if (ok) n++;
        if (st) { st.className = 'ex-state ' + (ok ? 'st-ok' : 'st-retry'); st.textContent = ok ? 'נכון ✓' : 'לא נכון'; }
      });
      var has0 = !!$('#ch0');
      if (n >= 8) msg = 'מצוין. אפשר להתחיל ישר מ<a href="#ch1">פרק 1</a>.';
      else if (n >= 5) msg = has0 ? 'כדאי לעבור קודם על <a href="#ch0">פרק 0 (חזרה קצרה)</a>, ואז להמשיך לפרק 1.' : 'כדאי לחזור על הנושאים שטעיתם בהם, ואז להמשיך ל<a href="#ch1">פרק 1</a>.';
      else msg = has0 ? 'מומלץ להתחיל מ<a href="#ch0">פרק 0</a> ולעבור עליו במלואו, צעד אחר צעד.' : 'מומלץ לחזור על החומר הבסיסי עם המורה לפני שממשיכים ל<a href="#ch1">פרק 1</a>.';
      r.innerHTML = '<strong>' + n + ' מתוך ' + items.length + ' נכונות.</strong> ' + (blank ? '(' + blank + ' שאלות לא נענו) ' : '') + msg;
      state.diag = n; save();
    });
  }

  /* ---------- mistakes ---------- */
  function renderMistakes() {
    var box = $('#mistakes-list'); if (!box) return;
    var ids = Object.keys(state.done).filter(function (k) { return state.done[k] === 'retry'; });
    box.innerHTML = '';
    if (!ids.length) { box.innerHTML = '<p>אין תרגילים ברשימה. כל הכבוד.</p>'; return; }
    ids.forEach(function (id) {
      var src = $('#main .chapter:not(#mistakes) .ex[data-id="' + id + '"]'); if (!src) return;
      var item = document.createElement('div'); item.className = 'mistake';
      var body = $('.ex-body', src).cloneNode(true);
      item.innerHTML = '<h3><a href="#' + src.closest('.chapter').id + '/ex-' + id + '">תרגיל ' + id + '</a></h3>';
      item.appendChild(body);
      var b = document.createElement('button'); b.type = 'button'; b.className = 'btn small good'; b.textContent = 'פתרתי נכון עכשיו';
      b.addEventListener('click', function () { setDone(id, 'ok'); });
      item.appendChild(b);
      box.appendChild(item);
    });
    if (window.Figs) window.Figs.renderAll(box);
  }

  /* ---------- routing ---------- */
  var currentCh = null;
  function parseHash() {
    var h = decodeURIComponent(location.hash.replace(/^#/, ''));
    var p = h.split('/');
    return { ch: p[0] || META[0].id, target: p[1] || null };
  }
  function prevChapterOf(id) {
    var i = META.findIndex(function (c) { return c.id === id; });
    for (var k = i - 1; k >= 0; k--) if (META[k].kind === 'chapter') return META[k];
    return null;
  }
  function buildNavs() {
    META.forEach(function (c, i) {
      var nav = $('#' + c.id + ' .ch-nav'); if (!nav) return;
      var p = META[i - 1], n = META[i + 1];
      nav.innerHTML = (p ? '<a href="#' + p.id + '">→ ' + p.title + '</a>' : '<span></span>') + (n ? '<a href="#' + n.id + '">' + n.title + ' ←</a>' : '<span></span>');
    });
  }
  function showNotice(chId) {
    var n = $('#notice'), meta = META.filter(function (c) { return c.id === chId; })[0];
    n.hidden = true; n.innerHTML = '';
    if (!meta || meta.kind !== 'chapter' || TEACHER) return;
    var prev = prevChapterOf(chId);
    if (prev && gradedOf(prev.id).length && !chapterDone(prev.id)) {
      var s = chapterStat(prev.id);
      n.innerHTML = 'המלצה: כדאי לסיים קודם את <a href="#' + prev.id + '">' + prev.title + '</a> (' + s.ok + ' מתוך ' + s.total + ' תרגילים). אפשר להמשיך גם עכשיו.';
      n.hidden = false;
    }
  }
  function route(opts) {
    var r = parseHash(), id = r.ch;
    var el = document.getElementById(id);
    if (!el || !el.classList.contains('chapter')) { id = META[0].id; el = document.getElementById(id); }
    chapterEls().forEach(function (c) { var on = c === el; c.hidden = !on; c.classList.toggle('active', on); });
    $$('#toc a[data-ch]').forEach(function (a) { if (a.getAttribute('data-ch') === id) a.setAttribute('aria-current', 'page'); else a.removeAttribute('aria-current'); });
    showNotice(id);
    if (id !== 'mistakes') { state.last = location.hash.replace(/^#/, '') || id; save(); }
    if (id === 'mistakes') renderMistakes();
    if (id === 'appendix') { /* table highlight is cleared when entering normally */ if (!(opts && opts.keepHl) && window.Tools) window.Tools.clearHl(); }
    if (r.target) {
      var t = document.getElementById(r.target); if (t) { t.scrollIntoView(); if (t.classList.contains('ex')) { t.classList.add('flash'); setTimeout(function () { t.classList.remove('flash'); }, 1600); } }
      else window.scrollTo(0, 0);
    } else {
      window.scrollTo(0, 0);
      var h1 = $('.ch-title', el); if (h1 && !(opts && opts.initial)) h1.focus({ preventScroll: true });
    }
    $('#toc').classList.remove('open'); $('#btn-menu').setAttribute('aria-expanded', 'false');
    document.title = (META.filter(function (c) { return c.id === id; })[0] || { title: 'חוברת' }).title.replace(/\$[^$]*\$/g, '') + ' · התפלגות נורמלית';
  }
  function go(id) { if (location.hash === '#' + id) route({ keepHl: true }); else location.hash = '#' + id; }

  /* ---------- theme ---------- */
  function initTheme() {
    var b = $('#btn-theme'), root = document.documentElement, saved = null;
    try { saved = localStorage.getItem(KEY + '-theme'); } catch (e) { }
    if (saved === 'dark' || saved === 'light') root.setAttribute('data-theme', saved);
    function isDark() { var t = root.getAttribute('data-theme'); return t === 'dark' || (t === 'auto' && window.matchMedia && matchMedia('(prefers-color-scheme: dark)').matches); }
    function paint() { var d = isDark(); b.setAttribute('aria-pressed', d ? 'true' : 'false'); b.textContent = d ? 'מצב בהיר' : 'מצב כהה'; }
    b.addEventListener('click', function () {
      var next = isDark() ? 'light' : 'dark'; root.setAttribute('data-theme', next);
      try { localStorage.setItem(KEY + '-theme', next); } catch (e) { }
      paint();
    });
    paint();
  }

  /* ---------- print ---------- */
  function initPrint() {
    var dlg = $('#dlg-print');
    $('#btn-print').addEventListener('click', function () { dlg.showModal(); });
    function doPrint(all) {
      dlg.close();
      document.body.classList.toggle('print-sol', $('#print-sol').checked);
      var wasHidden = [];
      if (all) { document.body.classList.add('print-all'); chapterEls().forEach(function (c) { wasHidden.push([c, c.hidden]); if (c.id !== 'mistakes') c.hidden = false; }); }
      var done = function () {
        document.body.classList.remove('print-all', 'print-sol');
        wasHidden.forEach(function (p) { p[0].hidden = p[1]; });
        window.removeEventListener('afterprint', done);
      };
      window.addEventListener('afterprint', done);
      setTimeout(function () { window.print(); }, 50);
    }
    $('#print-chapter').addEventListener('click', function () { doPrint(false); });
    $('#print-all').addEventListener('click', function () { doPrint(true); });
  }

  function initDialogs() {
    $$('dialog').forEach(function (d) {
      $$('[data-close]', d).forEach(function (b) { b.addEventListener('click', function () { d.close(); }); });
      d.addEventListener('click', function (e) { if (e.target === d) d.close(); });
    });
    $('#btn-tools').addEventListener('click', function () { $('#dlg-tools').showModal(); });
  }

  /* ---------- boot ---------- */
  function boot() {
    load();
    buildToc(); buildNavs();
    if (window.Figs) window.Figs.renderAll(document);
    initCards(); initTyped(); initSelfCheck(); initDiag(); initTheme(); initPrint(); initDialogs();
    if (window.Tools) window.Tools.init();
    $('#btn-menu').addEventListener('click', function () {
      var t = $('#toc'), o = !t.classList.contains('open'); t.classList.toggle('open', o); this.setAttribute('aria-expanded', o ? 'true' : 'false');
    });
    $('#btn-continue').addEventListener('click', function () { if (state.last) location.hash = '#' + state.last; else go(META[0].id); });
    $('#btn-mistakes').addEventListener('click', function () { go('mistakes'); });
    if (TEACHER) { var n = $('#notice'); n.hidden = false; n.textContent = 'מצב מורה: כל התשובות והפתרונות פתוחים, וההתקדמות אינה נשמרת.'; }
    updateProgress(); renderMistakes();
    window.addEventListener('hashchange', function () { route(); });
    if (!location.hash && state.last && !TEACHER) { /* stay on the intro; the continue button is available */ }
    route({ initial: true });
    if (TEACHER) { var nn = $('#notice'); nn.hidden = false; }
  }
  window.BookApp = { go: go, state: state };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot); else boot();
})();
