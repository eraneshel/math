/* extra.js — success sound for correct answers (with mute toggle) */
(function () {
  'use strict';
  var KEY = 'calc-booklet-v1-sound', ctx = null, on = true;
  try { on = localStorage.getItem(KEY) !== 'off'; } catch (e) { }
  function chime() {
    if (!on) return;
    try {
      var AC = window.AudioContext || window.webkitAudioContext; if (!AC) return;
      ctx = ctx || new AC(); if (ctx.state === 'suspended') ctx.resume();
      var t = ctx.currentTime;
      [[659.25, 0], [880, 0.11], [1318.5, 0.22]].forEach(function (n) {
        var o = ctx.createOscillator(), g = ctx.createGain();
        o.type = 'sine'; o.frequency.value = n[0];
        g.gain.setValueAtTime(0.0001, t + n[1]); g.gain.exponentialRampToValueAtTime(0.16, t + n[1] + 0.02); g.gain.exponentialRampToValueAtTime(0.0001, t + n[1] + 0.32);
        o.connect(g); g.connect(ctx.destination); o.start(t + n[1]); o.stop(t + n[1] + 0.34);
      });
    } catch (e) { }
  }
  var bulk = false;
  document.addEventListener('click', function (e) {
    if (bulk) return;
    var b = e.target.closest && e.target.closest('.chk, .mc-chk'); if (!b) return;
    setTimeout(function () {
      var host = b.closest('.part, .typed, .mc-q'); if (!host) return;
      var fb = host.querySelector('.fb'); if (fb && fb.classList.contains('ok')) chime();
    }, 0);
  });
  document.addEventListener('keydown', function (e) {
    if (e.key !== 'Enter' || !e.target.matches || !e.target.matches('.typed input')) return;
    setTimeout(function () {
      var host = e.target.closest('.part, .typed'); var fb = host && host.querySelector('.fb'); if (fb && fb.classList.contains('ok')) chime();
    }, 0);
  });

  /* ---- active figure exercises + layer reveal ---- */
  function figOf(card) { var f = card.querySelector('.fig[data-fig]'); return f && f._api ? f : null; }
  function syncReveal(card) {
    var f = figOf(card); if (!f) return;
    var hosts = card.querySelectorAll('.part, .mc-q');
    if (!hosts.length) hosts = card.querySelectorAll('.typed');
    Array.prototype.forEach.call(hosts, function (h, i) {
      var fb = h.querySelector('.fb'); if (fb && fb.classList.contains('ok')) f._api.reveal(i + 1);
    });
  }
  document.addEventListener('click', function (e) {
    var b = e.target.closest && e.target.closest('.act-chk');
    if (b) {
      var card = b.closest('.ex'), f = figOf(card), fb = card.querySelector('.act-ctl .fb'); if (!f) return;
      fb.className = 'fb';
      if (f._api.check()) {
        fb.classList.add('ok'); fb.textContent = 'נכון ✓';
        var id = card.getAttribute('data-id');
        if (window.BookApp) window.BookApp.setDone(id, 'ok');
        f._api.reveal('act'); chime();
      } else { fb.classList.add('no'); fb.textContent = f._api.hint || 'עדיין לא. שנו את השרטוט ונסו שוב.'; }
      return;
    }
    var rs = e.target.closest && e.target.closest('.fig-reset');
    if (rs) {
      var rc = rs.closest('.ex'), rb = rc && rc.querySelector('.act-chk');
      if (rc && rb) {
        var rf = figOf(rc), rfb = rc.querySelector('.act-ctl .fb'), rid = rc.getAttribute('data-id');
        if (rfb) { rfb.className = 'fb'; rfb.textContent = ''; }
        if (rf && rf._api) rf._api.hide('act');
        if (window.BookApp && window.BookApp.state && window.BookApp.state.done && window.BookApp.state.done[rid]) window.BookApp.setDone(rid, null);
      }
      return;
    }
    var c = e.target.closest && e.target.closest('.chk, .mc-chk, .chk-all');
    if (c) { var card2 = c.closest('.ex'); if (card2) setTimeout(function () { syncReveal(card2); }, 10); }
  });
  document.addEventListener('keydown', function (e) {
    if (e.key !== 'Enter' || !e.target.matches || !e.target.matches('.typed input')) return;
    var card = e.target.closest('.ex'); if (card) setTimeout(function () { syncReveal(card); }, 10);
  });
  function checkAll(card, btns, fbs) {
    bulk = true;
    try { btns.forEach(function (x) { x.click(); }); } finally { bulk = false; }
    setTimeout(function () {
      var all = fbs().every(function (f) { return f.classList.contains('ok'); });
      if (all) chime();
    }, 0);
  }
  function addCheckAll() {
    Array.prototype.forEach.call(document.querySelectorAll('#main .typed.multi'), function (box) {
      var ctl = box.closest('.ex-ctl'); if (!ctl || ctl.querySelector('.chk-all')) return;
      var b = document.createElement('button'); b.type = 'button'; b.className = 'btn chk-all'; b.textContent = 'בדוק הכל';
      var parts = function () { return box._parts || Array.prototype.slice.call(box.querySelectorAll('.part')); };
      b.addEventListener('click', function () {
        checkAll(ctl, parts().map(function (p) { return p.querySelector('.chk'); }), function () { return parts().map(function (p) { return p.querySelector('.fb'); }); });
      });
      ctl.insertBefore(b, ctl.querySelector('.show-ans'));
    });
    Array.prototype.forEach.call(document.querySelectorAll('#main .mc'), function (box) {
      var qs = box.querySelectorAll('.mc-q'); if (qs.length < 2 || box.querySelector('.chk-all')) return;
      var row = document.createElement('div'); row.className = 'mc-row';
      var b = document.createElement('button'); b.type = 'button'; b.className = 'btn chk-all'; b.textContent = 'בדוק הכל';
      b.addEventListener('click', function () {
        checkAll(box, Array.prototype.map.call(qs, function (q) { return q.querySelector('.mc-chk'); }), function () { return Array.prototype.map.call(qs, function (q) { return q.querySelector('.fb'); }); });
      });
      row.appendChild(b); box.appendChild(row);
    });
  }
    /* ---- minus button for phones (decimal keypad has no minus) ---- */
  function addMinus() {
    Array.prototype.forEach.call(document.querySelectorAll('#main input[inputmode=decimal]'), function (inp) {
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
  function init() {
    addCheckAll(); addMinus();
    var b = document.getElementById('btn-sound'); if (!b) return;
    function paint() { b.setAttribute('aria-pressed', on ? 'true' : 'false'); b.textContent = on ? 'צליל: פועל' : 'צליל: כבוי'; }
    b.addEventListener('click', function () { on = !on; try { localStorage.setItem(KEY, on ? 'on' : 'off'); } catch (e) { } paint(); if (on) chime(); });
    paint();
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
})();

/* phones: a table with 3+ columns becomes one card per row, each cell labelled by its column head */
(function () {
  function run() {
    document.querySelectorAll('.tbl table, .md table').forEach(function (t) {
      if (t.classList.contains('ztable') || t.__rt) return;
      var hs = t.querySelectorAll('thead th'); if (hs.length < 3) return; if (/^\s*מס/.test(hs[0].textContent)) return;
      t.__rt = true; t.classList.add('rtab');
      t.querySelectorAll('tbody tr').forEach(function (tr) {
        Array.prototype.forEach.call(tr.children, function (td, i) {
          if (i === 0 || !hs[i] || !hs[i].innerHTML.trim()) return;
          var l = document.createElement('span'); l.className = 'cl'; l.innerHTML = hs[i].innerHTML; td.insertBefore(l, td.firstChild);
        });
      });
    });
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', run); else run();
})();

/* symbol buttons next to text answers: insert at the cursor */
document.addEventListener('click', function (e) {
  var b = e.target.closest && e.target.closest('.sym button'); if (!b) return;
  var part = b.closest('.part'), inp = part && part.querySelector('input'); if (!inp) return;
  var t = b.getAttribute('data-ins'), a = inp.selectionStart == null ? inp.value.length : inp.selectionStart, z = inp.selectionEnd == null ? a : inp.selectionEnd;
  inp.value = inp.value.slice(0, a) + t + inp.value.slice(z); var c = a + t.length;
  inp.focus(); try { inp.setSelectionRange(c, c); } catch (x) { } inp.dispatchEvent(new Event('input', { bubbles: true }));
});

/* prediction: commit before investigating, then revisit the guess against what was found */
(function () {
  var mem = {};
  function load(pid) { try { var v = localStorage.getItem('pred:' + pid); if (v) return JSON.parse(v); } catch (e) { } return mem[pid] || null; }
  function save(pid, o) { mem[pid] = o; try { localStorage.setItem('pred:' + pid, JSON.stringify(o)); } catch (e) { } }
  function lockUI(box, o) {
    box.querySelectorAll('fieldset.pq').forEach(function (fs) {
      var q = fs.getAttribute('data-q'), v = q === 'conf' ? o.c : o.a[+q];
      fs.querySelectorAll('input').forEach(function (i) { i.checked = String(i.value) === String(v); i.disabled = true; });
    });
    var b = box.querySelector('.pred-lock'); b.disabled = true; b.textContent = 'הניחוש נשמר';
    box.querySelector('.fb').textContent = 'נחזור אליו בשלב המסקנה.'; box.classList.add('locked');
  }
  function render(rv) {
    var pid = rv.getAttribute('data-pred'), o = load(pid), body = rv.querySelector('.rv-b');
    var items = Array.prototype.slice.call(rv.querySelectorAll('.rv-src > .rv-f'));
    if (!o) { body.innerHTML = '<p>לא ניחשתם בשלב הניחוש. חזרו אליו (בתחילת הסעיף) והטבלה תתמלא.</p>'; return; }
    var rows = '', wrong = 0;
    items.forEach(function (it, i) {
      var opts = Array.prototype.map.call(it.querySelectorAll('.o'), function (x) { return x.innerHTML; });
      var t = +it.getAttribute('data-t'), ok = o.a[i] === t; if (!ok) wrong++;
      rows += '<div class="rv-row ' + (ok ? 'ok' : 'no') + '"><div class="rv-q">' + it.querySelector('.q').innerHTML + '</div><div class="rv-g"><b>הניחוש שלכם:</b> ' + opts[o.a[i]] + ' <span class="rv-m">' + (ok ? '✓' : '✗') + '</span></div>' + (ok ? '' : '<div class="rv-t"><b>מה מצאנו:</b> ' + opts[t] + '</div>') + '<div class="rv-w">' + it.querySelector('.w').innerHTML + '</div></div>';
    });
    var msg;
    if (!wrong) msg = o.c === 0 ? 'כל הניחושים נכונים, ואמרתם שזה ניחוש. כנראה שאתם יודעים יותר ממה שחשבתם.' : 'כל הניחושים נכונים. עכשיו אפשר לנסח למה.';
    else if (o.c === 2) msg = 'טעיתם בביטחון גבוה. זה הרגע שבו לומדים הכי הרבה: מה בניחוש שלכם נשבר?';
    else msg = 'טעיתם בחלק מהניחושים, וזה בדיוק מה שהחקירה באה לבדוק.';
    body.innerHTML = rows + '<p class="rv-msg"><strong>' + msg + '</strong></p>';
  }
  function renderAll() { document.querySelectorAll('.revisit').forEach(render); }
  function init() {
    document.querySelectorAll('.pred').forEach(function (box) {
      var o = load(box.getAttribute('data-pred')); if (o) lockUI(box, o);
    });
    document.querySelectorAll('.revisit textarea').forEach(function (t) {
      var k = 'rvnote:' + t.getAttribute('data-rvnote'); try { t.value = localStorage.getItem(k) || ''; } catch (e) { }
      t.addEventListener('input', function () { try { localStorage.setItem(k, t.value); } catch (e) { } });
    });
    renderAll();
  }
  document.addEventListener('click', function (e) {
    var b = e.target.closest && e.target.closest('.pred-lock'); if (!b) return;
    var box = b.closest('.pred'), pid = box.getAttribute('data-pred'), a = [], c = null, miss = false;
    box.querySelectorAll('fieldset.pq').forEach(function (fs) {
      var ch = fs.querySelector('input:checked'); if (!ch) { miss = true; return; }
      if (fs.getAttribute('data-q') === 'conf') c = +ch.value; else a[+fs.getAttribute('data-q')] = +ch.value;
    });
    if (miss) { box.querySelector('.fb').textContent = 'ענו על כל השאלות ובחרו רמת ביטחון.'; return; }
    var o = { a: a, c: c }; save(pid, o); lockUI(box, o);
    var art = box.closest('.ex'); if (art && window.BookApp) window.BookApp.setDone(art.getAttribute('data-id'), 'ok');
    renderAll();
  });
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
})();
