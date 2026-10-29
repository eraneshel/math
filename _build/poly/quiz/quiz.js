/* בוחן פולינום (מבחן): בלי רמזים ובלי משוב בזמן הבוחן, עריכה חופשית של תשובות בלי הורדת ניקוד, מגבלת זמן.
   נמדד התוצר הסופי: ציון, טעות נגררת (נבדק לפי ה-k הסופי בסעיף א) וניתוח לכל סעיף אחרי ההגשה.
   QUIZ_MINUTES: אורך הבוחן. FT_CREDIT: חלק הנקודות על סעיף נכון לפי התשובה הסופית של התלמיד בסעיף א (1 = ציון מלא).
   ENDPOINT: כתובת ה-Web App של apps_script.gs (ריק = ללא שליחה). ?teacher=1: בלי שמירה, ללא נעילה אחרי הגשה. */
(function () {
  'use strict';
  var KEY = 'poly-quiz-v3', VER = 3, REF_A = 2, FT_CREDIT = 1, QUIZ_MINUTES = 30, BASE = [1, -7, 12, 4, -16];
  var ENDPOINT = '';
  var teacher = /[?&]teacher=1/.test(location.search);
  var root = document.getElementById('quiz');
  var bank = Array.prototype.map.call(document.querySelectorAll('#bank .qi'), function (n) {
    return {
      id: n.getAttribute('data-id'), sec: n.getAttribute('data-sec'), pts: +n.getAttribute('data-pts'), type: n.getAttribute('data-type'),
      c: n.getAttribute('data-c'), q: n.querySelector('.qq').innerHTML, fig: (n.querySelector('.qfig') || {}).innerHTML || '', why: n.querySelector('.qw').innerHTML,
      opts: Array.prototype.map.call(n.querySelectorAll('.qo'), function (o) { return o.innerHTML; })
    };
  });
  var stemEl = document.getElementById('stem'), STEM = stemEl ? stemEl.innerHTML : '';
  var S = load(), timer = null, sendT = null;
  function load() { if (teacher) return { name: '', ans: {} }; try { var v = JSON.parse(localStorage.getItem(KEY)); if (v && v.ans && v.ver === VER) return v; } catch (e) { } return { name: '', ans: {} }; }
  function save() { if (teacher) return; S.ver = VER; try { localStorage.setItem(KEY, JSON.stringify(S)); } catch (e) { } }
  function el(tag, cls, html) { var e = document.createElement(tag); if (cls) e.className = cls; if (html !== undefined) e.innerHTML = html; return e; }
  function num(s) { s = String(s).replace(/−/g, '-').replace(',', '.').replace(/\s/g, ''); var v = parseFloat(s); return (s !== '' && isFinite(v) && /^-?\d*\.?\d+$/.test(s)) ? v : NaN; }
  function same(a, b) { return Math.abs(a - b) < 1e-6; }

  /* תשובה נכונה לפי ערך a (סעיפי חקירה שתלויים בסימן של a) */
  function expected(id, a) {
    if (!a) return null;
    switch (id) {
      case 'd': return a > 0 ? 0 : 1;
      case 'e': return a > 0 ? 0 : 1;
    }
    return null;
  }
  var CHAIN = { d: 1, e: 1 };
  function kStudent() { var a = S.ans.p; if (!a || a.v === undefined || a.v === null) return null; var v = num(a.v); return isFinite(v) ? v : null; }
  /* שרטוט: התאמת פולינום מממעלה 4 לנקודות שהוזנו (ריבועים פחותים) */
  function fit4(pts) {
    var n = 5; if (!pts || pts.length < n) return null;
    var A = [], r, c, i, k;
    for (r = 0; r < n; r++) { A.push([]); for (c = 0; c <= n; c++) A[r].push(0); }
    pts.forEach(function (q) { var v = [Math.pow(q[0], 4), Math.pow(q[0], 3), q[0] * q[0], q[0], 1]; for (r = 0; r < n; r++) { for (c = 0; c < n; c++) A[r][c] += v[r] * v[c]; A[r][n] += v[r] * q[1]; } });
    for (i = 0; i < n; i++) {
      var pv = i; for (r = i + 1; r < n; r++) if (Math.abs(A[r][i]) > Math.abs(A[pv][i])) pv = r;
      if (Math.abs(A[pv][i]) < 1e-9) return null;
      var t = A[i]; A[i] = A[pv]; A[pv] = t;
      for (r = 0; r < n; r++) if (r !== i) { var m = A[r][i] / A[i][i]; for (c = i; c <= n; c++) A[r][c] -= m * A[i][c]; }
    }
    var co = []; for (i = 0; i < n; i++) co.push(A[i][n] / A[i][i]);
    var res = 0; pts.forEach(function (q) { var y = co[0] * Math.pow(q[0], 4) + co[1] * Math.pow(q[0], 3) + co[2] * q[0] * q[0] + co[3] * q[0] + co[4]; res = Math.max(res, Math.abs(y - q[1])); });
    return { c: co, res: res };
  }
  function matchBase(co, a) { return co.every(function (v, i) { var t = a * BASE[i]; return Math.abs(v - t) <= 0.08 * Math.max(1, Math.abs(t)); }); }
  function value(it) {
    var a = S.ans[it.id]; if (!a) return null;
    if (it.type === 'sketch') return (a.drawn && a.pts && fit4(a.pts)) ? 1 : null;
    if (a.v === undefined || a.v === null || a.v === '') return null;
    if (it.type === 'num') { var v = num(a.v); return isFinite(v) ? v : null; } return +a.v;
  }

  function grade(it) {
    var v = value(it); if (v === null) return '0';
    if (it.type === 'sketch') {
      var f = fit4(S.ans.s.pts); if (!f || f.res > 0.6) return '0';
      if (matchBase(f.c, REF_A)) return '1';
      var ks = kStudent(); if (ks !== null && ks !== 0 && !same(ks, REF_A) && matchBase(f.c, ks)) return 'F';
      return '0';
    }
    var ref, ft = null;
    if (CHAIN[it.id]) { ref = it.id === 'd' || it.id === 'e' ? 0 : null; var ks2 = kStudent(); if (ks2 !== null && !same(ks2, REF_A)) ft = expected(it.id, ks2); }
    else ref = it.type === 'num' ? num(it.c) : +it.c;
    var eq = it.type === 'num' ? same : function (a, b) { return a === b; };
    if (eq(v, ref)) return '1';
    if (ft !== null && eq(v, ft)) return 'F';
    return '0';
  }
  function pointsOf(it, ok) { return ok === '1' ? it.pts : (ok === 'F' ? Math.round(it.pts * FT_CREDIT) : 0); }
  function total() { var t = 0; bank.forEach(function (it) { t += pointsOf(it, grade(it)); }); return t; }
  function answered() { return bank.filter(function (it) { return value(it) !== null; }).length; }

  /* שליחה לגיליון */
  function status() { return S.submitted ? (S.timedOut ? 'פג זמן' : 'הוגש') : 'פתוח'; }
  function usedSec() { var end = S.endTs || Date.now(); return Math.max(0, Math.round((end - S.start) / 1000)); }
  function send() {
    if (!ENDPOINT || teacher || !S.start) return;
    var ans = {}; bank.forEach(function (it) { var a = S.ans[it.id] || {}; ans[it.id] = { ok: grade(it), v: (it.type === 'sketch' ? (a.pts ? a.pts.length + ' נקודות' + (a.drawn ? ', גרף' : '') : '') : (a.v === undefined || a.v === null ? '' : a.v)), edits: a.edits || 0 }; });
    try { fetch(ENDPOINT, { method: 'POST', mode: 'no-cors', headers: { 'Content-Type': 'text/plain;charset=utf-8' }, body: JSON.stringify({ sid: S.sid, name: S.name, status: status(), score: total(), answered: answered(), usedSec: usedSec(), ans: ans }) }); } catch (e) { }
  }
  function sendSoon() { clearTimeout(sendT); sendT = setTimeout(send, 2500); }

  function screenStart() {
    root.innerHTML = '';
    var c = el('div', 'qcard');
    c.appendChild(el('h2', '', 'לפני שמתחילים'));
    c.appendChild(el('div', 'qq', '<b>זמן הבוחן: ' + QUIZ_MINUTES + ' דקות.</b> הבוחן כולל 12 סעיפים: חלק א (4 סעיפים), חלק ב (חקירה ושרטוט הגרף מנקודות) ושאלת אתגר בסוף. אין רמזים ואין משוב בזמן הבוחן. אפשר לשנות תשובות ולחזור לכל סעיף עד ההגשה, ללא הורדת ניקוד. הציון נקבע לפי התשובות הסופיות. אם טעיתם בסעיף א בחלק ב, הסעיפים שתלויים בו ייבדקו גם לפי התשובה שלכם. מגישים בלחיצה על "הגשה", ואחרי ההגשה לא ניתן לשנות. עובדים עם מחשבון, עט ומחברת. כשהזמן נגמר, הבוחן מוגש אוטומטית.'));
    var inp = el('input', 'qname'); inp.type = 'text'; inp.placeholder = 'שם מלא'; inp.setAttribute('aria-label', 'שם מלא'); inp.value = S.name || '';
    c.appendChild(inp);
    var b = el('button', 'btn', 'התחלת הבוחן'); b.type = 'button';
    b.addEventListener('click', function () {
      var n = inp.value.trim(); if (!n) { inp.focus(); return; }
      S.name = n; S.sid = Math.random().toString(36).slice(2, 10); S.start = Date.now(); S.ans = {}; save(); send(); screenExam();
    });
    c.appendChild(b); root.appendChild(c);
  }

  function remainingMs() { return S.start + QUIZ_MINUTES * 60000 - Date.now(); }
  function fmt(ms) { var s = Math.max(0, Math.round(ms / 1000)), m = Math.floor(s / 60); s = s % 60; return (m < 10 ? '0' : '') + m + ':' + (s < 10 ? '0' : '') + s; }

  function screenExam() {
    root.innerHTML = '';
    var bar = el('div', 'qtimer'), tm = el('span', 'qt', ''), cnt = el('span', 'qcnt', ''), sb = el('button', 'btn small', 'הגשה'); sb.type = 'button';
    bar.appendChild(tm); bar.appendChild(cnt); bar.appendChild(sb); root.appendChild(bar);
    var confirmBox = el('div', 'qconfirm'); confirmBox.hidden = true; root.appendChild(confirmBox);
    function upd() {
      var r = remainingMs(); tm.textContent = fmt(r); tm.classList.toggle('low', r < 5 * 60000);
      cnt.textContent = 'נענו ' + answered() + ' מתוך ' + bank.length;
      if (r <= 0) { clearInterval(timer); finish(true); }
    }
    var lastSec = null;
    bank.forEach(function (it, n) {
      if (it.sec !== lastSec) {
        lastSec = it.sec;
        root.appendChild(el('h2', 'qsec-h', it.sec === 'A' ? 'חלק א: חזקות, פולינום וקצוות' : (it.sec === 'B' ? 'חלק ב: חקירה ושרטוט' : 'שאלת אתגר')));
        if (it.sec === 'B') root.appendChild(el('div', 'qcard qstem', '<b>נתון לכל הסעיפים בחלק ב:</b> ' + STEM));
      }
      var c = el('div', 'qcard'), a = S.ans[it.id] || {};
      c.appendChild(el('div', 'qprog', 'סעיף ' + (n + 1) + ' · ' + it.pts + ' נקודות'));
      c.appendChild(el('div', 'qq', it.q));
      if (it.type === 'sketch') {
        buildSketch(it, c);
      } else if (it.type === 'mc') {
        var wrap = el('div', 'qopts');
        it.opts.forEach(function (o, k) {
          var lab = el('label', 'mc-o'), r = document.createElement('input'); r.type = 'radio'; r.name = 'q-' + it.id; r.value = k;
          if (a.v !== undefined && a.v !== null && +a.v === k) { r.checked = true; lab.classList.add('sel'); }
          lab.appendChild(r); lab.appendChild(el('span', '', o));
          r.addEventListener('change', function () { Array.prototype.forEach.call(wrap.children, function (x) { x.classList.remove('sel'); }); lab.classList.add('sel'); record(it.id, k); });
          wrap.appendChild(lab);
        });
        c.appendChild(wrap);
        var clr = el('button', 'qclr', 'ניקוי תשובה'); clr.type = 'button';
        clr.addEventListener('click', function () { Array.prototype.forEach.call(wrap.querySelectorAll('input'), function (x) { x.checked = false; }); Array.prototype.forEach.call(wrap.children, function (x) { x.classList.remove('sel'); }); record(it.id, null); });
        c.appendChild(clr);
      } else {
        var nw = el('div', 'qnum'), ni = document.createElement('input'); ni.type = 'text'; ni.inputMode = 'decimal'; ni.setAttribute('dir', 'ltr'); ni.autocomplete = 'off'; ni.placeholder = '?';
        if (a.v !== undefined && a.v !== null) ni.value = a.v;
        var sg = el('button', '', '±'); sg.type = 'button'; sg.setAttribute('aria-label', 'הפוך סימן');
        sg.addEventListener('click', function () { var s = ni.value.replace(/−/g, '-').trim(); ni.value = s.charAt(0) === '-' ? s.slice(1) : '-' + s; record(it.id, ni.value); ni.focus(); });
        ni.addEventListener('change', function () { record(it.id, ni.value); });
        ni.addEventListener('blur', function () { record(it.id, ni.value); });
        nw.appendChild(sg); nw.appendChild(ni); c.appendChild(nw);
      }
      root.appendChild(c);
    });
    function buildSketch(it, c) {
      var ex = el('div', 'ex qsk'), holder = el('div', '', it.fig); ex.appendChild(holder);
      var b = el('button', 'btn act-chk', 'העבר גרף'); b.type = 'button'; b.hidden = true; ex.appendChild(b);
      c.appendChild(ex);
      if (window.Figs) window.Figs.renderAll(ex);
      var f = ex.querySelector('.fig'), api = f && f._api; if (!api) return;
      var a0 = S.ans.s || {};
      (a0.pts || []).forEach(function (q) { api.addPoint(q[0], q[1]); });
      if (a0.drawn) api.drawGraph();
      function sync() { b.hidden = !api.ready(); }
      function store(drawn) {
        var a = S.ans.s || { edits: 0 }, pts = api.points(), key = JSON.stringify(pts) + (drawn ? 'd' : '');
        if (a.key !== undefined && a.key !== key) a.edits = (a.edits || 0) + 1;
        a.key = key; a.pts = pts; a.drawn = drawn; S.ans.s = a; save(); sendSoon(); upd();
      }
      f.addEventListener('figchange', function (e) { sync(); store(!!S.ans.s && !!S.ans.s.drawn && !(e.detail && e.detail.reset)); });
      b.addEventListener('click', function () { api.drawGraph(); store(true); });
      sync();
    }
    function record(id, v) {
      var a = S.ans[id] || { edits: 0 }; if (String(a.v) !== String(v)) a.edits = (a.edits || 0) + 1;
      a.v = (v === '' ? null : v); S.ans[id] = a; save(); sendSoon(); upd();
    }
    sb.addEventListener('click', function () {
      var left = bank.length - answered();
      confirmBox.hidden = false; confirmBox.innerHTML = '';
      confirmBox.appendChild(el('div', '', '<b>להגיש את הבוחן?</b> ' + (left ? 'יש ' + left + ' סעיפים שלא נענו. ' : '') + 'אחרי ההגשה אי אפשר לשנות.'));
      var y = el('button', 'btn small', 'כן, להגיש'), n = el('button', 'btn small ghost', 'חזרה לבוחן'); y.type = n.type = 'button';
      y.addEventListener('click', function () { clearInterval(timer); finish(false); });
      n.addEventListener('click', function () { confirmBox.hidden = true; });
      confirmBox.appendChild(y); confirmBox.appendChild(n); confirmBox.scrollIntoView({ block: 'nearest' });
    });
    upd(); timer = setInterval(upd, 1000);
  }

  function finish(timedOut) {
    if (!S.submitted) { S.submitted = true; S.timedOut = !!timedOut; S.endTs = Math.min(Date.now(), S.start + QUIZ_MINUTES * 60000); save(); }
    clearTimeout(sendT); send(); screenResult(); window.scrollTo({ top: 0 });
  }

  function shownAnswer(it) {
    if (it.type === 'sketch') { var sa = S.ans.s; return (sa && sa.drawn && value(it) !== null) ? 'גרף שורטט מ-' + sa.pts.length + ' נקודות' : 'לא שורטט גרף'; }
    var v = value(it); if (v === null) return 'לא נענה';
    return it.type === 'mc' ? it.opts[v] : String(v);
  }
  function correctText(it) {
    if (it.type === 'sketch') return 'f(x)=2x⁴−14x³+24x²+8x−32';
    if (it.type === 'num') return String(it.c);
    var c = CHAIN[it.id] ? 0 : +it.c; return it.opts[c];
  }

  function screenResult() {
    root.innerHTML = '';
    var c = el('div', 'qcard'), t = total();
    c.appendChild(el('h2', '', S.name + ', הבוחן הוגש' + (S.timedOut ? ' (הזמן הסתיים)' : '')));
    c.appendChild(el('div', 'qscore', t + ' / 100'));
    c.appendChild(el('div', 'qnote', 'זמן עבודה: ' + fmt(usedSec() * 1000)));
    c.appendChild(el('div', 'qnote', 'נענו ' + answered() + ' מתוך ' + bank.length + ' סעיפים'));
    root.appendChild(c);
    root.appendChild(el('h2', 'qsec-h', 'ניתוח הסעיפים'));
    bank.forEach(function (it, n) {
      var ok = grade(it), d = el('details', 'qcard qres ' + (ok === '0' ? 'no' : (ok === 'F' ? 'ft' : 'ok')));
      d.open = ok === '0';
      d.appendChild(el('summary', '', '<span class="m">' + (ok === '0' ? '✗' : '✓') + '</span> סעיף ' + (n + 1) + (ok === 'F' ? ' (נכון לפי תשובתך בסעיף א)' : '') + ' · ' + pointsOf(it, ok) + '/' + it.pts));
      d.appendChild(el('div', 'qq', it.q));
      d.appendChild(el('div', 'qnote', '<b>התשובה שלכם:</b> ' + shownAnswer(it)));
      if (ok === '0') d.appendChild(el('div', 'qnote', '<b>התשובה הנכונה:</b> ' + correctText(it)));
      d.appendChild(el('div', 'qwhy', it.why));
      root.appendChild(d);
    });
    if (teacher) { var tb = el('button', 'btn small ghost', 'איפוס (מורה)'); tb.type = 'button'; tb.addEventListener('click', function () { S = { name: '', ans: {} }; try { localStorage.removeItem(KEY); } catch (e) { } screenStart(); }); root.appendChild(tb); }
  }

  if (!S.start) screenStart();
  else if (S.submitted) screenResult();
  else if (remainingMs() <= 0) finish(true);
  else screenExam();
  window.__quiz = { grade: grade, expected: expected, S: function () { return S; } };
})();
