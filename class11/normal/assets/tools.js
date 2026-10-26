/* tools.js — z calculator, table lookup (both directions), bell drawing */
(function () {
  'use strict';
  var ZT = window.ZTABLE || {};
  var MINUS = '−';

  function r2(v) { return Math.round((v + (v >= 0 ? 1e-9 : -1e-9)) * 100) / 100; }
  function key(z) {
    var s = r2(z).toFixed(2);
    if (s === '-0.00') s = '0.00';
    return s;
  }
  function areaLeft(z) { var k = key(z); return k in ZT ? ZT[k] : null; }
  function inv(area) {
    var best = null, k;
    for (k in ZT) {
      if (k === '-0.00') continue;
      var d = Math.abs(ZT[k] - area), z = parseFloat(k);
      if (best === null || d < best.d - 1e-12 || (Math.abs(d - best.d) < 1e-12 && Math.abs(z) < Math.abs(best.z))) best = { d: d, z: z };
    }
    return best.z;
  }
  function num(v) {
    v = String(v == null ? '' : v).trim().replace(/−/g, '-').replace(',', '.');
    if (v === '' || !/^-?\d+(\.\d+)?$/.test(v)) return NaN;
    return parseFloat(v);
  }
  function show(v, d) {
    var s = (Math.round(v * Math.pow(10, d)) / Math.pow(10, d)).toFixed(d);
    if (/^-0\.?0*$/.test(s)) s = s.replace('-', '');
    return s.replace('-', MINUS);
  }
  function ltr(s) { return '<bdi>' + s + '</bdi>'; }

  /* ---- highlight in the appendix table ---- */
  function clearHl() {
    var t = document.querySelector('.ztable'); if (!t) return;
    ['hl-cell', 'hl-line', 'hl-row', 'hl-col'].forEach(function (c) {
      Array.prototype.forEach.call(t.querySelectorAll('.' + c), function (e) { e.classList.remove(c); });
    });
  }
  function highlight(z) {
    clearHl();
    var k = key(z), td = document.querySelector('.ztable td[data-z="' + k + '"]');
    if (!td) return null;
    td.classList.add('hl-cell');
    var tr = td.parentNode; tr.classList.add('hl-row');
    var col = td.getAttribute('data-col'), head = document.querySelectorAll('.ztable thead th')[+col + 1];
    if (head) head.classList.add('hl-col');
    return td;
  }

  /* ---- UI helpers ---- */
  function field(id, label, ph) {
    return '<label class="field"><span>' + label + '</span><input type="text" inputmode="decimal" autocomplete="off" id="' + id + '" placeholder="' + (ph || '') + '"></label>';
  }
  function gotoAppendix(z) {
    var dlg = document.getElementById('dlg-tools'); if (dlg && dlg.open) dlg.close();
    if (window.BookApp) window.BookApp.go('appendix');
    setTimeout(function () {
      var td = highlight(z); if (td && td.scrollIntoView) td.scrollIntoView({ block: 'center' });
    }, 60);
  }

  /* ---- calculator ---- */
  function initCalc() {
    var p = document.getElementById('pane-calc');
    p.innerHTML = '<p class="muted">מלאו בדיוק שלושה מתוך ארבעת השדות. השדה הרביעי יחושב.</p>' +
      '<div class="tool-grid">' + field('c-x', 'x (ערך הנתון)', '78') + field('c-m', 'x̄ (ממוצע)', '70') + field('c-s', 'S (סטיית תקן)', '4') + field('c-z', 'z (ציון תקן)', '') + '</div>' +
      '<div class="tool-out" id="c-out" aria-live="polite"></div>' +
      '<div class="row"><button type="button" class="btn small ghost" id="c-clear">נקה</button></div>';
    var ids = ['c-x', 'c-m', 'c-s', 'c-z'];
    function upd() {
      var v = ids.map(function (i) { return document.getElementById(i).value.trim(); });
      var filled = v.filter(function (s) { return s !== ''; }).length;
      var out = document.getElementById('c-out');
      if (filled < 3) { out.textContent = 'מלאו שלושה שדות.'; return; }
      if (filled > 3) { out.textContent = 'מלאו רק שלושה שדות. השאירו ריק את השדה שרוצים לחשב.'; return; }
      var n = v.map(num), bad = false;
      v.forEach(function (s, i) { if (s !== '' && isNaN(n[i])) bad = true; });
      if (bad) { out.textContent = 'יש להזין מספרים בלבד.'; return; }
      var x = n[0], m = n[1], s = n[2], z = n[3], html;
      if (v[3] === '') {
        if (s <= 0) { out.textContent = 'סטיית התקן חייבת להיות חיובית.'; return; }
        z = (x - m) / s;
        html = 'z = (x − x̄) ÷ S = (' + ltr(show(x, 4).replace(/\.?0+$/, '')) + ' − ' + ltr(show(m, 4).replace(/\.?0+$/, '')) + ') ÷ ' + ltr(show(s, 4).replace(/\.?0+$/, '')) + ' = <span class="big">' + ltr(show(z, 2).replace(/(\.\d*?)0+$/, '$1').replace(/\.$/, '')) + '</span>';
      } else if (v[0] === '') {
        x = m + z * s; html = 'x = x̄ + z·S = <span class="big">' + ltr(show(x, 4).replace(/(\.\d*?)0+$/, '$1').replace(/\.$/, '')) + '</span>';
      } else if (v[1] === '') {
        m = x - z * s; html = 'x̄ = x − z·S = <span class="big">' + ltr(show(m, 4).replace(/(\.\d*?)0+$/, '$1').replace(/\.$/, '')) + '</span>';
      } else {
        if (z === 0) { out.textContent = 'כש-z = 0 אי אפשר לחשב את S.'; return; }
        s = (x - m) / z;
        if (s <= 0) { out.textContent = 'התקבלה סטיית תקן שאינה חיובית. בדקו את הנתונים.'; return; }
        html = 'S = (x − x̄) ÷ z = <span class="big">' + ltr(show(s, 4).replace(/(\.\d*?)0+$/, '$1').replace(/\.$/, '')) + '</span>';
      }
      out.innerHTML = html;
    }
    ids.forEach(function (i) { document.getElementById(i).addEventListener('input', upd); });
    document.getElementById('c-clear').addEventListener('click', function () { ids.forEach(function (i) { document.getElementById(i).value = ''; }); upd(); });
    upd();
  }

  /* ---- table lookup ---- */
  function initTable() {
    var p = document.getElementById('pane-table');
    p.innerHTML =
      '<fieldset class="tl"><legend><strong>מ-z לשטח</strong></legend><div class="row">' + field('t-z', 'z (עד שתי ספרות אחרי הנקודה)', '-1.53') + '</div><div class="tool-out" id="t-out1" aria-live="polite"></div></fieldset>' +
      '<fieldset class="tl"><legend><strong>משטח ל-z</strong></legend><div class="row">' + field('t-a', 'שטח (בין 0 ל-1)', '0.2') +
      '<div class="radios" role="radiogroup" aria-label="סוג השטח"><label class="chk"><input type="radio" name="t-side" value="left" checked> שטח משמאל</label><label class="chk"><input type="radio" name="t-side" value="right"> שטח מימין</label></div></div>' +
      '<div class="tool-out" id="t-out2" aria-live="polite"></div></fieldset>' +
      '<p class="muted">הטבלה הרשמית נותנת את השטח משמאל ל-z. שטח מימין הוא 1 פחות השטח משמאל.</p>';
    var tz = document.getElementById('t-z'), ta = document.getElementById('t-a'), o1 = document.getElementById('t-out1'), o2 = document.getElementById('t-out2');
    function u1() {
      var z = num(tz.value);
      if (tz.value.trim() === '') { o1.textContent = ''; return; }
      if (isNaN(z)) { o1.textContent = 'יש להזין מספר.'; return; }
      if (z < -3 || z > 3) { o1.textContent = 'הטבלה מכסה את z בין ' + MINUS + '3 ל-3.'; return; }
      var a = areaLeft(z);
      o1.innerHTML = 'שטח משמאל ל-z = ' + ltr(show(z, 2)) + ': <span class="big">' + ltr(a.toFixed(4)) + '</span><br>שטח מימין: ' + ltr((1 - a).toFixed(4)) +
        '<div class="row"><button type="button" class="btn small ghost" id="t-show">הצג בטבלה</button></div>';
      document.getElementById('t-show').addEventListener('click', function () { gotoAppendix(z); });
    }
    function u2() {
      var a = num(ta.value);
      if (ta.value.trim() === '') { o2.textContent = ''; return; }
      if (isNaN(a) || a <= 0 || a >= 1) { o2.textContent = 'יש להזין שטח בין 0 ל-1.'; return; }
      var right = document.querySelector('input[name="t-side"]:checked').value === 'right';
      var left = right ? 1 - a : a, z = inv(left), got = ZT[key(z)];
      o2.innerHTML = 'התא הקרוב ביותר בטבלה: ' + ltr(got.toFixed(4)) + '<br>z ≈ <span class="big">' + ltr(show(z, 2)) + '</span>' +
        '<div class="row"><button type="button" class="btn small ghost" id="t-show2">הצג בטבלה</button></div>';
      document.getElementById('t-show2').addEventListener('click', function () { gotoAppendix(z); });
    }
    tz.addEventListener('input', u1); ta.addEventListener('input', u2);
    Array.prototype.forEach.call(document.querySelectorAll('input[name="t-side"]'), function (r) { r.addEventListener('change', u2); });
  }

  /* ---- bell drawing ---- */
  function initBell() {
    var p = document.getElementById('pane-bell');
    p.innerHTML = '<p class="muted">הזינו ממוצע וסטיית תקן. אפשר להוסיף גבולות לצביעת שטח (השאירו ריק לאחד מהם לצביעת זנב).</p>' +
      '<div class="tool-grid">' + field('b-m', 'x̄ (ממוצע)', '70') + field('b-s', 'S (סטיית תקן)', '10') + field('b-a', 'גבול תחתון', '60') + field('b-b', 'גבול עליון', '85') + '</div>' +
      '<div class="tool-out" id="b-out"></div>';
    var ids = ['b-m', 'b-s', 'b-a', 'b-b'];
    function upd() {
      var out = document.getElementById('b-out');
      var m = num(document.getElementById('b-m').value), s = num(document.getElementById('b-s').value);
      var av = document.getElementById('b-a').value.trim(), bv = document.getElementById('b-b').value.trim();
      var a = num(av), b = num(bv);
      out.innerHTML = '';
      if (isNaN(m) || isNaN(s) || s <= 0) { out.textContent = 'הזינו ממוצע וסטיית תקן חיובית.'; return; }
      var lo = av === '' ? m - 4 * s : a, hi = bv === '' ? m + 4 * s : b;
      if ((av !== '' && isNaN(a)) || (bv !== '' && isNaN(b))) { out.textContent = 'הגבולות חייבים להיות מספרים.'; return; }
      if (lo >= hi) { out.textContent = 'הגבול התחתון חייב להיות קטן מהעליון.'; return; }
      var F = window.Figs, shades = (av === '' && bv === '') ? [] : [[lo, hi]];
      var ticks = [{ x: m, label: F.fmt(m), bold: true }];
      if (av !== '') ticks.push({ x: a, label: F.fmt(a) });
      if (bv !== '') ticks.push({ x: b, label: F.fmt(b) });
      var svg = F.newSvg('פעמון נורמלי, ממוצע ' + m + ', סטיית תקן ' + s);
      F.drawBells(svg, [{ m: m, s: s }], { shades: shades, ticks: ticks, meanTick: m });
      var wrap = document.createElement('figure'); wrap.className = 'fig'; var d = document.createElement('div'); d.className = 'fig-svg'; d.appendChild(svg); wrap.appendChild(d);
      out.appendChild(wrap);
      if (shades.length) {
        var za = (lo - m) / s, zb = (hi - m) / s, pa = av === '' ? 0 : areaLeft(za), pb = bv === '' ? 1 : areaLeft(zb);
        if (pa !== null && pb !== null && Math.abs(za) <= 3 && Math.abs(zb) <= 3 || (av === '' && Math.abs(zb) <= 3) || (bv === '' && Math.abs(za) <= 3)) {
          var pp = document.createElement('p');
          pp.innerHTML = 'השטח המוצלל (לפי הטבלה): ' + ltr((pb - pa).toFixed(4));
          out.appendChild(pp);
        }
      }
    }
    ids.forEach(function (i) { document.getElementById(i).addEventListener('input', upd); });
    upd();
  }

  function init() {
    initCalc(); initTable(); initBell();
    var tabs = Array.prototype.slice.call(document.querySelectorAll('.tabs .tab'));
    function select(t) {
      tabs.forEach(function (x) {
        var on = x === t;
        x.setAttribute('aria-selected', on ? 'true' : 'false'); x.tabIndex = on ? 0 : -1;
        document.getElementById(x.getAttribute('aria-controls')).hidden = !on;
      });
    }
    tabs.forEach(function (t, i) {
      t.addEventListener('click', function () { select(t); });
      t.addEventListener('keydown', function (e) {
        var n = null;
        if (e.key === 'ArrowLeft') n = tabs[(i + 1) % tabs.length];       // RTL: left = next
        else if (e.key === 'ArrowRight') n = tabs[(i - 1 + tabs.length) % tabs.length];
        if (n) { e.preventDefault(); select(n); n.focus(); }
      });
    });
  }
  window.Tools = { init: init, key: key, areaLeft: areaLeft, inv: inv, highlight: highlight, clearHl: clearHl };
})();
