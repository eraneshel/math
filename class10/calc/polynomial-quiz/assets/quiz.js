/* בוחן פולינום: ניסיון אחד לכל סעיף, משוב מיידי, ציון, טעות נגררת (תשובה נגררת) וקוד תוצאה.
   FT_CREDIT: חלק הנקודות על סעיף שנכון לפי התשובה של התלמיד בסעיף א (1 = ציון מלא). ?teacher=1: בלי שמירה ועם כפתור איפוס. */
(function () {
  'use strict';
  var KEY = 'poly-quiz-v1', REF_K = 4, FT_CREDIT = 1;
  var ENDPOINT = ''; /* כתובת ה-Web App של Apps Script (apps_script.gs). ריק = ללא שליחה */
  var teacher = /[?&]teacher=1/.test(location.search);
  var root = document.getElementById('quiz');
  var bank = Array.prototype.map.call(document.querySelectorAll('#bank .qi'), function (n) {
    return {
      id: n.getAttribute('data-id'), sec: n.getAttribute('data-sec'), pts: +n.getAttribute('data-pts'), type: n.getAttribute('data-type'),
      c: n.getAttribute('data-c'), q: n.querySelector('.qq').innerHTML, why: n.querySelector('.qw').innerHTML,
      opts: Array.prototype.map.call(n.querySelectorAll('.qo'), function (o) { return o.innerHTML; })
    };
  });
  var stemEl = document.getElementById('stem'), STEM = stemEl ? stemEl.innerHTML : '';
  var S = load();
  function load() { if (teacher) return { name: '', ans: {} }; try { var v = JSON.parse(localStorage.getItem(KEY)); if (v && v.ans) return v; } catch (e) { } return { name: '', ans: {} }; }
  function sid() { if (!S.sid) S.sid = Math.random().toString(36).slice(2, 10); return S.sid; }
  function send() {
    if (!ENDPOINT || teacher) return;
    var ans = {}, tot = 0, n = 0;
    bank.forEach(function (it) { var a = S.ans[it.id]; if (a) { n++; tot += a.sec || 0; ans[it.id] = { ok: a.ok, v: a.v, sec: a.sec || 0 }; } });
    try { fetch(ENDPOINT, { method: 'POST', mode: 'no-cors', headers: { 'Content-Type': 'text/plain;charset=utf-8' }, body: JSON.stringify({ sid: sid(), name: S.name, score: total(), answered: n, totalSec: tot, ans: ans }) }); } catch (e) { }
  }
  function save() { if (teacher) return; try { localStorage.setItem(KEY, JSON.stringify(S)); } catch (e) { } }
  function el(tag, cls, html) { var e = document.createElement(tag); if (cls) e.className = cls; if (html !== undefined) e.innerHTML = html; return e; }
  function num(s) { s = String(s).replace(/−/g, '-').replace(',', '.').replace(/\s/g, ''); var v = parseFloat(s); return (s !== '' && isFinite(v) && /^-?\d*\.?\d+$/.test(s)) ? v : NaN; }
  function same(a, b) { return Math.abs(a - b) < 1e-6; }

  /* תשובה נכונה לפי ערך k (לסעיפי חקירה) */
  function expected(id, k) {
    switch (id) {
      case 'b': return k > 0 ? 2 : 0;                    /* אינדקס: 1,2,3,4 */
      case 'c': return 1;
      case 'd': return k > 0 ? 1 : 3;
      case 'e': return 0;
      case 'f': return 0;
      case 'g': return k > 0 ? 2 : 0;
      case 'h': return k > 0 ? -k * k / 4 : 0;
      case 'i': if (k <= 0) return 0; var m = -k * k / 4; return m < -5 - 1e-9 ? 3 : (Math.abs(m + 5) < 1e-9 ? 1 : 0);
    }
    return null;
  }
  var CHAIN = { b: 1, c: 1, d: 1, e: 1, f: 1, g: 1, h: 1, i: 1 };
  function kStudent() { var a = S.ans.k; if (!a) return null; var v = num(a.v); return isFinite(v) ? v : null; }

  function grade(it, v) {
    var ref, ft = null;
    if (it.id === 'k') ref = 4;
    else if (CHAIN[it.id]) { ref = expected(it.id, REF_K); var ks = kStudent(); if (ks !== null && !same(ks, REF_K)) ft = expected(it.id, ks); }
    else ref = it.type === 'num' ? num(it.c) : +it.c;
    var eq = it.type === 'num' ? same : function (a, b) { return a === b; };
    if (eq(v, ref)) return '1';
    if (ft !== null && eq(v, ft)) return 'F';
    return '0';
  }
  function pointsOf(it, ok) { return ok === '1' ? it.pts : (ok === 'F' ? Math.round(it.pts * FT_CREDIT) : 0); }

  function total() { var t = 0; bank.forEach(function (it) { var a = S.ans[it.id]; if (a) t += pointsOf(it, a.ok); }); return t; }
  function nextIndex() { for (var i = 0; i < bank.length; i++) if (!S.ans[bank[i].id]) return i; return bank.length; }

  function hash(s) { var h = 5381; for (var i = 0; i < s.length; i++) h = ((h << 5) + h + s.charCodeAt(i)) >>> 0; return h.toString(36); }
  function code() {
    var pat = bank.map(function (it) { var a = S.ans[it.id]; return a ? a.ok : '0'; }).join('');
    var base = total() + '-' + pat;
    return base + '-' + hash('poly1|' + (S.name || '') + '|' + base).slice(0, 3);
  }

  function screenName() {
    root.innerHTML = '';
    var c = el('div', 'qcard');
    c.appendChild(el('h2', '', 'לפני שמתחילים'));
    c.appendChild(el('div', 'qq', 'הבוחן כולל 13 סעיפים: חלק א (4 סעיפים) וחלק ב (חקירה מלאה, 9 סעיפים). <b>יש ניסיון אחד לכל סעיף</b>, ואחרי כל תשובה מופיע משוב והסבר. עובדים עם מחשבון, עט ומחברת. אם טעיתם בסעיף א בחלק ב, הסעיפים הבאים ייבדקו גם לפי התשובה שלכם (תשובה נגררת), ולא תיענשו פעמיים על אותה טעות.'));
    var inp = el('input', 'qname'); inp.type = 'text'; inp.placeholder = 'שם מלא'; inp.setAttribute('aria-label', 'שם מלא'); inp.value = S.name || '';
    c.appendChild(inp);
    var b = el('button', 'btn', 'התחלה'); b.type = 'button';
    b.addEventListener('click', function () { var n = inp.value.trim(); if (!n) { inp.focus(); return; } S.name = n; save(); screenItem(0); });
    c.appendChild(b); root.appendChild(c);
    if (teacher) { var tb = el('button', 'btn small ghost', 'איפוס (מורה)'); tb.type = 'button'; tb.addEventListener('click', function () { S = { name: '', ans: {} }; try { localStorage.removeItem(KEY); } catch (e) { } screenName(); }); c.appendChild(tb); }
  }

  function screenItem(i) {
    if (i >= bank.length) return screenResult();
    var it = bank[i], c = el('div', 'qcard'), done = S.ans[it.id];
    root.innerHTML = '';
    c.appendChild(el('div', 'qprog', 'סעיף ' + (i + 1) + ' מתוך ' + bank.length + ' · ' + it.pts + ' נקודות'));
    var bar = el('div', 'qbar'); var fill = el('i'); fill.style.width = (i / bank.length * 100) + '%'; bar.appendChild(fill); c.appendChild(bar);
    c.appendChild(el('div', 'qsec', it.sec === 'A' ? 'חלק א: חזקות, פולינום וקצוות' : 'חלק ב: חקירה מלאה'));
    if (it.sec === 'B') c.appendChild(el('div', 'qq qstem', '<b>נתון:</b> ' + STEM));
    c.appendChild(el('div', 'qq', it.q));
    var getV, wrap = el('div', 'qopts');
    if (it.type === 'mc') {
      it.opts.forEach(function (o, k) {
        var lab = el('label', 'mc-o'), r = document.createElement('input'); r.type = 'radio'; r.name = 'q'; r.value = k; lab.appendChild(r); lab.appendChild(el('span', '', o));
        r.addEventListener('change', function () { Array.prototype.forEach.call(wrap.children, function (x) { x.classList.remove('sel'); }); lab.classList.add('sel'); });
        wrap.appendChild(lab);
      });
      getV = function () { var r = wrap.querySelector('input:checked'); return r ? +r.value : null; };
      c.appendChild(wrap);
    } else {
      var nw = el('div', 'qnum'), ni = document.createElement('input'); ni.type = 'text'; ni.inputMode = 'decimal'; ni.setAttribute('dir', 'ltr'); ni.autocomplete = 'off'; ni.placeholder = '?';
      var sg = el('button', '', '±'); sg.type = 'button'; sg.setAttribute('aria-label', 'הפוך סימן');
      sg.addEventListener('click', function () { var s = ni.value.replace(/−/g, '-').trim(); ni.value = s.charAt(0) === '-' ? s.slice(1) : '-' + s; ni.focus(); });
      nw.appendChild(sg); nw.appendChild(ni); c.appendChild(nw);
      getV = function () { var v = num(ni.value); return isFinite(v) ? v : null; };
    }
    var t0 = Date.now();
    var row = el('div', 'qrow'), chk = el('button', 'btn', 'בדיקה'); chk.type = 'button'; row.appendChild(chk);
    var msg = el('span', 'qnote'); row.appendChild(msg); c.appendChild(row);
    var fbBox = el('div'); c.appendChild(fbBox);
    root.appendChild(c);
    function showFb(ok, raw) {
      var kind = ok === '1' ? 'ok' : (ok === 'F' ? 'ft' : 'no'), f = el('div', 'qfb ' + kind);
      var head = ok === '1' ? '✓ נכון' : (ok === 'F' ? '✓ נכון לפי התשובה שלכם בסעיף א (תשובה נגררת)' : '✗ לא נכון');
      f.innerHTML = '<b>' + head + ' · ' + pointsOf(it, ok) + ' מתוך ' + it.pts + '</b>' + (ok === 'F' ? 'קיבלתם את הנקודות כי הסעיף נפתר נכון לפי ה-k שמצאתם. הפתרון המלא (עבור k=4):<br>' : (ok === '0' ? 'ההסבר (עבור הפתרון הנכון):<br>' : '')) + it.why;
      fbBox.innerHTML = ''; fbBox.appendChild(f);
      var nb = el('button', 'btn', i + 1 < bank.length ? 'הסעיף הבא' : 'לציון'); nb.type = 'button'; nb.style.marginTop = '10px';
      nb.addEventListener('click', function () { screenItem(i + 1); window.scrollTo({ top: 0 }); });
      fbBox.appendChild(nb); chk.disabled = true; wrap.querySelectorAll && Array.prototype.forEach.call(wrap.querySelectorAll('input'), function (x) { x.disabled = true; });
      if (it.type === 'mc' && raw !== undefined) { var chosen = wrap.children[raw]; if (chosen) chosen.classList.add(ok === '0' ? 'no' : 'ok'); }
    }
    if (done) { showFb(done.ok, done.v); return; }
    chk.addEventListener('click', function () {
      var v = getV(); if (v === null) { msg.textContent = it.type === 'mc' ? 'בחרו תשובה.' : 'הזינו מספר.'; return; }
      var ok = grade(it, v); S.ans[it.id] = { v: v, ok: ok, sec: Math.round((Date.now() - t0) / 1000) }; save(); send(); msg.textContent = ''; showFb(ok, v);
    });
  }

  function screenResult() {
    root.innerHTML = '';
    var c = el('div', 'qcard'), t = total();
    c.appendChild(el('h2', '', S.name + ', סיימתם'));
    c.appendChild(el('div', 'qscore', t + ' / 100'));
    var ul = el('ul', 'qlist');
    bank.forEach(function (it, n) {
      var a = S.ans[it.id], ok = a ? a.ok : '0';
      var li = el('li', ''); li.appendChild(el('span', 'm', ok === '0' ? '✗' : '✓')); li.appendChild(el('span', '', 'סעיף ' + (n + 1) + (ok === 'F' ? ' (נגרר מסעיף א)' : '') + ' · ' + pointsOf(it, ok) + '/' + it.pts));
      ul.appendChild(li);
    });
    c.appendChild(ul);
    c.appendChild(el('p', 'qnote', 'הציון והמשוב נשארים אצלכם. מה שטעיתם בו, חזרו אליו בדף ההכנה.'));
    if (teacher) { var tb = el('button', 'btn small ghost', 'איפוס (מורה)'); tb.type = 'button'; tb.addEventListener('click', function () { S = { name: '', ans: {} }; try { localStorage.removeItem(KEY); } catch (e) { } screenName(); }); c.appendChild(tb); }
    root.appendChild(c);
  }

  var ni = nextIndex();
  if (!S.name) screenName(); else if (ni >= bank.length) screenResult(); else screenItem(ni);
  window.__quiz = { grade: grade, expected: expected, S: function () { return S; } };
})();
