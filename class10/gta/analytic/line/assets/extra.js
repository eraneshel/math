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
