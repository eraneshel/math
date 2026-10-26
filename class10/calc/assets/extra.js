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
  document.addEventListener('click', function (e) {
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
  function init() {
    var b = document.getElementById('btn-sound'); if (!b) return;
    function paint() { b.setAttribute('aria-pressed', on ? 'true' : 'false'); b.textContent = on ? 'צליל: פועל' : 'צליל: כבוי'; }
    b.addEventListener('click', function () { on = !on; try { localStorage.setItem(KEY, on ? 'on' : 'off'); } catch (e) { } paint(); if (on) chime(); });
    paint();
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
})();
