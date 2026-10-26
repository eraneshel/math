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
  function partsOf(box) { return box._parts || $$('.part', box); }
  function typedInputs(box) { return box._parts ? box._parts.map(function (p) { return $('input', p); }) : $$('input', box); }
  function typedValues(box) {
    var ins = typedInputs(box);
    if (ins.length > 1) return ins.map(function (i) { var g = parseTyped(i.value); return g.length ? g[0] : null; });
    return parseTyped(ins[0].value);
  }
  function typedFilled(box) { return typedInputs(box).some(function (i) { return i.value.trim() !== ''; }); }
  function checkTyped(box) {
    var key = JSON.parse(box.getAttribute('data-key')), got = typedValues(box), ins = typedInputs(box), multi = ins.length > 1;
    var fb = $('.fb', box); fb.className = 'fb';
    ins.forEach(function (i) { i.classList.remove('right', 'wrong'); });
    if (!typedFilled(box)) { fb.textContent = 'הקלידו תשובה ואז לחצו בדיקה.'; return null; }
    var ok = 0;
    key.forEach(function (k, i) {
      var good = got[i] !== null && got[i] !== undefined && matches(got[i], k);
      if (good) ok++;
      if (multi) { if (ins[i].value.trim()) ins[i].classList.add(good ? 'right' : 'wrong'); }
    });
    var all = ok === key.length && got.length === key.length;
    if (!multi) ins[0].classList.add(all ? 'right' : 'wrong');
    fb.classList.add(all ? 'ok' : 'no');
    fb.textContent = all ? 'נכון! ✓' : (key.length > 1 ? ok + ' מתוך ' + key.length + ' נכונות. תקנו את המסומנות באדום.' : 'עדיין לא. נסו שוב או פתחו רמז.');
    return all;
  }
  function checkPart(box, idx) {
    var key = JSON.parse(box.getAttribute('data-key')), part = partsOf(box)[idx], inp = $('input', part), fb = $('.fb', part);
    inp.classList.remove('right', 'wrong'); fb.className = 'fb';
    var g = parseTyped(inp.value);
    if (!g.length) { fb.textContent = 'הקלידו תשובה.'; return null; }
    var ok = matches(g[0], key[idx]);
    inp.classList.add(ok ? 'right' : 'wrong'); fb.classList.add(ok ? 'ok' : 'no'); fb.textContent = ok ? 'נכון ✓' : 'לא נכון, נסו שוב';
    return ok;
  }
  function inlineParts() {
    $$('.typed.multi').forEach(function (box) {
      var card = box.closest('.ex'); if (!card) return;
      var ul = $('.ex-body > ul', card), parts = $$('.part', box);
      if (!ul) return;
      var lis = Array.prototype.slice.call(ul.children).filter(function (n) { return n.tagName === 'LI'; });
      if (!lis.length || lis.length !== parts.length) return;
      box._parts = parts; parts.forEach(function (p, i) { p.classList.add('inline'); lis[i].appendChild(p); });
      box.hidden = true;
    });
  }
  function addNegButtons() {
    $$('.typed input[type="text"], .part.inline input[type="text"]').forEach(function (inp) {
      if (inp.parentNode.classList.contains('negwrap')) return;
      var w = document.createElement('span'); w.className = 'negwrap';
      inp.parentNode.insertBefore(w, inp); w.appendChild(inp);
      var b = document.createElement('button'); b.type = 'button'; b.className = 'neg'; b.textContent = '\u00b1'; b.setAttribute('aria-label', 'הפוך סימן (מינוס)');
      b.addEventListener('click', function () {
        var v = inp.value.replace(/^\s+/, '');
        inp.value = /^[-\u2212]/.test(v) ? v.replace(/^[-\u2212]\s*/, '') : '-' + v;
        inp.dispatchEvent(new Event('input', { bubbles: true })); inp.focus();
      });
      w.appendChild(b);
    });
  }
  function initTyped() {
    inlineParts();
    addNegButtons();
    $$('.typed').forEach(function (box) {
      var id = box.getAttribute('data-typed'), multi = box.classList.contains('multi'), ins = typedInputs(box);
      var saved = state.myAnswers[id];
      if (saved) { if (multi) { try { JSON.parse(saved).forEach(function (v, i) { if (ins[i]) ins[i].value = v; }); } catch (e) { } } else ins[0].value = saved; }
      var persist = function () {
        var v = multi ? JSON.stringify(ins.map(function (i) { return i.value; })) : ins[0].value;
        if (ins.some(function (i) { return i.value; })) state.myAnswers[id] = v; else delete state.myAnswers[id]; save();
      };
      if (multi) {
        var okParts = {};
        partsOf(box).forEach(function (part, idx) {
          var inp = $('input', part);
          var run = function () {
            var r = checkPart(box, idx); if (r === null) return;
            okParts[idx] = !!r;
            var all = ins.length && ins.every(function (x, k) { return okParts[k]; });
            if (all) setDone(id, 'ok');
          };
          inp.addEventListener('input', function () { persist(); okParts[idx] = false; inp.classList.remove('right', 'wrong'); $('.fb', part).textContent = ''; });
          inp.addEventListener('keydown', function (e) { if (e.key === 'Enter') { e.preventDefault(); run(); } });
          $('.chk', part).addEventListener('click', run);
        });
        if (ins.length > 1) {
          var L = ['\u05d0', '\u05d1', '\u05d2', '\u05d3', '\u05d4', '\u05d5', '\u05d6', '\u05d7', '\u05d8', '\u05d9'];
          var wrap = document.createElement('div'); wrap.className = 'chkall';
          wrap.innerHTML = '<button type="button" class="btn chkall-b">בדוק הכל</button><div class="chkall-s" aria-live="polite"></div><button type="button" class="btn chkall-n" hidden>המשך \u2190</button>';
          var anchor = box._parts ? $('.ex-body > ul', box.closest('.ex')) : box;
          anchor.parentNode.insertBefore(wrap, anchor.nextSibling);
          var sum = $('.chkall-s', wrap), nxt = $('.chkall-n', wrap);
          $('.chkall-b', wrap).addEventListener('click', function () {
            var key = JSON.parse(box.getAttribute('data-key')), bad = [], miss = 0, good = 0;
            partsOf(box).forEach(function (part, i) {
              var inp = $('input', part), fb = $('.fb', part);
              inp.classList.remove('right', 'wrong'); fb.className = 'fb';
              var g = parseTyped(inp.value);
              if (!g.length) { miss++; bad.push(L[i]); fb.className = 'fb'; fb.textContent = 'חסר'; return; }
              var ok = matches(g[0], key[i]); okParts[i] = ok;
              inp.classList.add(ok ? 'right' : 'wrong'); fb.classList.add(ok ? 'ok' : 'no'); fb.textContent = ok ? '\u2713' : '\u2717';
              if (ok) good++; else bad.push(L[i]);
            });
            var n = key.length;
            if (good === n) { sum.className = 'chkall-s ok'; sum.textContent = 'כל ' + n + ' הסעיפים נכונים. כל הכבוד!'; nxt.hidden = false; setDone(id, 'ok'); }
            else { sum.className = 'chkall-s no'; nxt.hidden = true; sum.textContent = good + ' מתוך ' + n + ' נכונים. ' + (bad.length === 1 ? 'נשאר לתקן את סעיף ' : 'נשאר לתקן את סעיפים ') + bad.join(', ') + (miss ? ' (' + miss + ' ללא תשובה)' : '') + '.'; }
          });
          nxt.addEventListener('click', function () { var nc = nextCard(box.closest('.ex')); if (nc) nc.scrollIntoView({ behavior: 'smooth', block: 'start' }); });
        }
        return;
      }
      var btn = $('.chk', box);
      ins[0].addEventListener('input', function () { persist(); ins[0].classList.remove('right', 'wrong'); });
      var run1 = function () {
        var r = checkTyped(box); if (r === null) return;
        if (box.closest('.ex').classList.contains('diag-item')) return;
        if (r) setDone(id, 'ok');
      };
      btn.addEventListener('click', run1);
      ins[0].addEventListener('keydown', function (e) { if (e.key === 'Enter') { e.preventDefault(); run1(); } });
    });
  }

  function nextCard(card) {
    var all = $$('.ex'), i = all.indexOf(card);
    return i >= 0 ? all[i + 1] : null;
  }
  function initMC() {
    $$('.mc').forEach(function (box) {
      var id = box.getAttribute('data-mc'), qs = $$('.mc-q', box), ok = {}, sel = [];
      try { sel = JSON.parse(state.myAnswers[id] || '[]'); } catch (e) { sel = []; }
      var persist = function () { var any = sel.some(function (v) { return v !== null && v !== undefined; }); if (any) state.myAnswers[id] = JSON.stringify(sel); else delete state.myAnswers[id]; save(); };
      qs.forEach(function (q, i) {
        var radios = $$('input', q), fb = $('.fb', q), ex = $('.mc-exp', q), c = +q.getAttribute('data-c');
        if (sel[i] !== null && sel[i] !== undefined && radios[sel[i]]) radios[sel[i]].checked = true;
        radios.forEach(function (r, k) { r.addEventListener('change', function () { sel[i] = k; persist(); ok[i] = false; fb.className = 'fb'; fb.textContent = ''; ex.hidden = true; $$('.mc-o', q).forEach(function (l) { l.classList.remove('right', 'wrong'); }); }); });
        $('.mc-chk', q).addEventListener('click', function () {
          var k = radios.findIndex(function (r) { return r.checked; });
          $$('.mc-o', q).forEach(function (l) { l.classList.remove('right', 'wrong'); });
          if (k < 0) { fb.className = 'fb'; fb.textContent = 'בחרו תשובה.'; return; }
          var good = k === c; ok[i] = good;
          $$('.mc-o', q)[k].classList.add(good ? 'right' : 'wrong');
          fb.className = 'fb ' + (good ? 'ok' : 'no'); fb.textContent = good ? 'נכון ✓' : 'לא נכון, נסו שוב';
          if (good) { ex.innerHTML = q.getAttribute('data-e'); ex.hidden = false; } else ex.hidden = true;
          if (qs.every(function (_, j) { return ok[j]; })) setDone(id, 'ok');
        });
      });
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
    $$('.diag-item').forEach(function (it) {
      var b = $('.show-d', it), box = $('.d-ans', it); if (!b) return;
      b.addEventListener('click', function () { var o = box.hidden; box.hidden = !o; b.setAttribute('aria-expanded', o ? 'true' : 'false'); b.textContent = o ? 'הסתר תשובה' : 'הצג תשובה'; });
      if (TEACHER) box.hidden = false;
    });
    var fin = $('.finish-diag');
    if (fin) fin.addEventListener('click', function () {
      var items = $$('.diag-item'), n = 0, blank = 0, r = $('#route'), msg, wrong = [];
      items.forEach(function (it) {
        var inp = $('.typed', it), st = $('.ex-state', it);
        if (!inp || !typedFilled(inp)) { blank++; wrong.push(it); if (st) { st.className = 'ex-state'; st.textContent = 'לא נענתה'; } return; }
        var ok = checkTyped(inp);
        if (ok) n++; else wrong.push(it);
        if (st) { st.className = 'ex-state ' + (ok ? 'st-ok' : 'st-retry'); st.textContent = ok ? 'נכון ✓' : 'לא נכון'; }
      });
      var links = wrong.map(function (it) { return '<a href="#ch0/' + it.getAttribute('data-sec') + '">סעיף ' + it.getAttribute('data-secn') + '</a>'; });
      var uniq = links.filter(function (x, i) { return links.indexOf(x) === i; });
      if (n >= 8) msg = 'מצוין. אתם מוכנים לעבור ל<a href="#ch1">פרק 1</a>.';
      else if (n >= 6) msg = 'כמעט. חזרו על: ' + uniq.join(', ') + ', ואז עברו ל<a href="#ch1">פרק 1</a>.';
      else msg = 'כדאי לחזור על פרק 0 מהסעיפים הבאים: ' + uniq.join(', ') + ', ואז לפתור את המבחן שוב.';
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
    if (id !== 'mistakes' && !(opts && opts.initial && !location.hash)) { state.last = location.hash.replace(/^#/, '') || id; save(); }
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

  /* ---------- next-step bar ---------- */
  function initNextBar() {
    var bar = document.createElement('div'); bar.className = 'nextbar'; bar.hidden = true;
    bar.innerHTML = '<button type="button" class="btn nextbar-b"></button>';
    document.body.appendChild(bar);
    var b = $('.nextbar-b', bar);
    function update() {
      var el = $('.chapter.active'); if (!el || el.id === 'mistakes' || el.id === 'appendix') { bar.hidden = true; return; }
      var todo = $$('.ex', el).filter(function (c) { return !c.classList.contains('diag-item') && state.done[c.getAttribute('data-id')] !== 'ok'; });
      var nextCh = chapterEls().filter(function (c, i, a) { return a[i - 1] === el; })[0];
      bar.hidden = false;
      if (todo.length) { b.textContent = 'הצעד הבא: תרגיל ' + (todo[0].getAttribute('data-id') || ''); b._t = function () { todo[0].scrollIntoView({ behavior: 'smooth', block: 'start' }); }; }
      else if (nextCh) { b.textContent = $$('.ex', el).length ? 'סיימתם את הפרק. לפרק הבא \u2190' : 'מתחילים: לפרק הראשון \u2190'; b._t = function () { go(nextCh.id); }; }
      else { bar.hidden = true; }
    }
    b.addEventListener('click', function () { if (b._t) b._t(); });
    window.addEventListener('hashchange', function () { setTimeout(update, 50); });
    document.addEventListener('click', function () { setTimeout(update, 120); });
    document.addEventListener('input', function () { setTimeout(update, 120); });
    setTimeout(update, 200);
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
    initCards(); initTyped(); initMC(); initSelfCheck(); initDiag(); initTheme(); initPrint(); initDialogs(); initNextBar();
    if (window.Tools) window.Tools.init();
    $('#btn-menu').addEventListener('click', function () {
      var t = $('#toc'), o = !t.classList.contains('open'); t.classList.toggle('open', o); this.setAttribute('aria-expanded', o ? 'true' : 'false');
    });
    $('#btn-continue').addEventListener('click', function () { if (state.last) location.hash = '#' + state.last; else go(META[0].id); });
    $('#btn-mistakes').addEventListener('click', function () { go('mistakes'); });
    if (TEACHER) { var n = $('#notice'); n.hidden = false; n.textContent = 'מצב מורה: כל התשובות והפתרונות פתוחים, וההתקדמות אינה נשמרת.'; }
    updateProgress(); renderMistakes();
    window.addEventListener('hashchange', function () { route(); });
    var tick = null;
    window.addEventListener('scroll', function () {
      if (tick || TEACHER) return;
      tick = setTimeout(function () {
        tick = null;
        var ch = document.querySelector('.chapter.active'); if (!ch || ch.id === 'mistakes') return;
        var cards = $$('.ex[data-id]', ch), hit = null;
        for (var i = 0; i < cards.length; i++) { var r = cards[i].getBoundingClientRect(); if (r.bottom > 120) { hit = cards[i]; break; } }
        if (hit && window.scrollY > 200) { state.last = ch.id + '/ex-' + hit.getAttribute('data-id'); save(); }
      }, 400);
    }, { passive: true });
    if (!location.hash && state.last && !TEACHER) { /* stay on the intro; the continue button is available */ }
    route({ initial: true });
    if (TEACHER) { var nn = $('#notice'); nn.hidden = false; }
  }
  window.BookApp = { go: go, state: state };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot); else boot();
})();
