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
    return '<label class="field"><span>' + label + '</span><input type="text" inputmode="decimal" autocomplete="off" id="' + id + '" placeholder="' + (ph ? 'למשל ' + ph : '') + '"></label>';
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
    p.innerHTML = '<p class="calc-q"><strong>מה רוצים לחשב?</strong></p>' +
      '<div class="modes" role="radiogroup" aria-label="מה לחשב">' +
      '<label class="mode"><input type="radio" name="c-mode" value="z" checked><span>ציון תקן z</span></label>' +
      '<label class="mode"><input type="radio" name="c-mode" value="x"><span>ערך x</span></label>' +
      '<label class="mode"><input type="radio" name="c-mode" value="m"><span>ממוצע x̄</span></label>' +
      '<label class="mode"><input type="radio" name="c-mode" value="s"><span>סטיית תקן S</span></label></div>' +
      '<p class="muted" id="c-help"></p>' +
      '<div class="tool-grid">' + field('c-x', 'x (ערך הנתון)', '78') + field('c-m', 'x̄ (ממוצע)', '70') + field('c-s', 'S (סטיית תקן)', '4') + field('c-z', 'z (ציון תקן)', '') + '</div>' +
      '<div class="tool-out" id="c-out" aria-live="polite"></div>' +
      '<div class="row"><button type="button" class="btn small ghost" id="c-clear">נקה</button></div>';
    var ids = ['c-x', 'c-m', 'c-s', 'c-z'];
    var names = { z: 'c-z', x: 'c-x', m: 'c-m', s: 'c-s' };
    var B = function (t) { return '<bdi dir="ltr">' + t + '</bdi>'; };
    var helps = { z: 'מזינים את ' + B('x') + ' (הערך), את ' + B('x̄') + ' (הממוצע) ואת ' + B('S') + ' (סטיית התקן). התוצאה: ציון התקן.', x: 'מזינים את ' + B('x̄') + ' (הממוצע), את ' + B('S') + ' (סטיית התקן) ואת ' + B('z') + ' (ציון התקן). התוצאה: הערך.', m: 'מזינים את ' + B('x') + ' (הערך), את ' + B('S') + ' (סטיית התקן) ואת ' + B('z') + ' (ציון התקן). התוצאה: הממוצע.', s: 'מזינים את ' + B('x') + ' (הערך), את ' + B('x̄') + ' (הממוצע) ואת ' + B('z') + ' (ציון התקן). התוצאה: סטיית התקן.' };
    function setMode() {
      var mode = document.querySelector('input[name="c-mode"]:checked').value;
      Object.keys(names).forEach(function (k) {
        var inp = document.getElementById(names[k]), on = k === mode;
        inp.disabled = on; if (on) { inp.value = ''; inp.placeholder = 'יחושב'; } else inp.placeholder = inp.getAttribute('data-ph') || '';
        inp.closest('label').classList.toggle('calc-target', on);
      });
      document.getElementById('c-help').innerHTML = helps[mode];
      upd();
    }
    function upd() {
      var v = ids.map(function (i) { return document.getElementById(i).value.trim(); });
      var filled = v.filter(function (s) { return s !== ''; }).length;
      var out = document.getElementById('c-out');
      if (filled < 3) { out.textContent = 'מלאו את שלושת השדות הפתוחים.'; return; }
      if (filled > 3) { out.textContent = 'השדה המסומן "יחושב" צריך להישאר ריק.'; return; }
      var n = v.map(num), bad = false;
      v.forEach(function (s, i) { if (s !== '' && isNaN(n[i])) bad = true; });
      if (bad) { out.textContent = 'יש להזין מספרים בלבד.'; return; }
      var x = n[0], m = n[1], s = n[2], z = n[3], html;
      function f(v, d) { return show(v, d).replace(/(\.\d*?)0+$/, '$1').replace(/\.$/, ''); }
      function p(v, d) { var t = f(v, d); return v < 0 ? '(' + t + ')' : t; }
      function two(formula, subst, res) {
        return '<div class="calc-l1" dir="ltr">' + formula + '</div><div class="calc-l2" dir="ltr">' + subst + ' = <span class="big">' + res + '</span></div>';
      }
      if (v[3] === '') {
        if (s <= 0) { out.textContent = 'סטיית התקן חייבת להיות חיובית.'; return; }
        z = (x - m) / s;
        html = two('z = (x − x̄) ÷ S', 'z = (' + f(x, 4) + ' − ' + p(m, 4) + ') ÷ ' + f(s, 4), f(z, 2));
      } else if (v[0] === '') {
        x = m + z * s;
        html = two('x = x̄ + z · S', 'x = ' + f(m, 4) + ' + ' + p(z, 4) + ' · ' + f(s, 4), f(x, 4));
      } else if (v[1] === '') {
        m = x - z * s;
        html = two('x̄ = x − z · S', 'x̄ = ' + f(x, 4) + ' − ' + p(z, 4) + ' · ' + f(s, 4), f(m, 4));
      } else {
        if (z === 0) { out.textContent = 'כש-z = 0 אי אפשר לחשב את S.'; return; }
        s = (x - m) / z;
        if (s <= 0) { out.textContent = 'התקבלה סטיית תקן שאינה חיובית. בדקו את הנתונים.'; return; }
        html = two('S = (x − x̄) ÷ z', 'S = (' + f(x, 4) + ' − ' + p(m, 4) + ') ÷ ' + p(z, 4), f(s, 4));
      }
      out.innerHTML = html;
    }
    ids.forEach(function (i) { document.getElementById(i).addEventListener('input', upd); });
    document.getElementById('c-clear').addEventListener('click', function () { ids.forEach(function (i) { var e = document.getElementById(i); if (!e.disabled) e.value = ''; }); upd(); });
    ids.forEach(function (i) { var e = document.getElementById(i); e.setAttribute('data-ph', e.placeholder); });
    Array.prototype.forEach.call(document.querySelectorAll('input[name="c-mode"]'), function (r) { r.addEventListener('change', setMode); });
    setMode();
  }


  /* ---- mean and standard deviation from a list ---- */
  function initList() {
    var p = document.getElementById('pane-list');
    p.innerHTML = '<p class="muted">כתבו את הנתונים עם רווח או פסיק ביניהם. אם ערך חוזר כמה פעמים, כתבו אותו עם נקודתיים ושכיחות: <span dir="ltr" style="unicode-bidi:isolate;display:inline-block">5:3</span> פירושו שהערך 5 מופיע 3 פעמים.</p>' +
      '<label class="field"><span>הנתונים</span><textarea id="l-d" rows="3" inputmode="decimal" autocomplete="off" placeholder="למשל 4 6 8 10 12"></textarea></label>' +
      '<div class="tool-out" id="l-out" aria-live="polite"></div>' +
      '<div class="btn-row"><button type="button" class="btn small ghost" id="l-clear">נקה</button></div>';
    function f(v, d) { return show(v, d).replace(/(\.\d*?)0+$/, '$1').replace(/\.$/, ''); }
    function par(v) { return v < 0 ? '(' + f(v, 4) + ')' : f(v, 4); }
    function upd() {
      var out = document.getElementById('l-out'), raw = document.getElementById('l-d').value.trim();
      if (!raw) { out.textContent = 'כתבו את הנתונים.'; return; }
      var toks = raw.replace(/−/g, '-').split(/[\s,;]+/).filter(Boolean), xs = [], fs = [], bad = false;
      toks.forEach(function (t) {
        var a = t.split(':'), x = num(a[0]), fr = a.length > 1 ? num(a[1]) : 1;
        if (a.length > 2 || isNaN(x) || isNaN(fr) || fr <= 0 || fr !== Math.floor(fr)) bad = true; else { xs.push(x); fs.push(fr); }
      });
      if (bad) { out.textContent = 'כתבו מספרים בלבד. שכיחות היא מספר שלם חיובי.'; return; }
      var N = 0, sum = 0, i;
      for (i = 0; i < xs.length; i++) { N += fs[i]; sum += fs[i] * xs[i]; }
      if (N < 2) { out.textContent = 'צריך לפחות שני נתונים.'; return; }
      var m = sum / N, ss = 0;
      for (i = 0; i < xs.length; i++) ss += fs[i] * (xs[i] - m) * (xs[i] - m);
      var S = Math.sqrt(ss / N), lim = 12, hasF = fs.some(function (q) { return q > 1; });
      var terms = xs.slice(0, lim).map(function (x, k) { return hasF ? fs[k] + '·' + par(x) : par(x); }).join(' + ') + (xs.length > lim ? ' + …' : '');
      var h = '<div class="calc-l1" dir="ltr">N = ' + N + '</div>' +
        '<div class="calc-l1" dir="ltr">x̄ = ' + (hasF ? '(f₁x₁ + f₂x₂ + … ) ÷ N' : '(x₁ + x₂ + … + xₙ) ÷ N') + '</div>' +
        '<div class="calc-l2" dir="ltr">x̄ = (' + terms + ') ÷ ' + N + ' = <span class="big">' + f(m, 4) + '</span></div>' +
        '<div class="calc-l1" dir="ltr">S = √( (' + (hasF ? 'f₁(x₁ − x̄)² + …' : '(x₁ − x̄)² + …') + ') ÷ N )</div>' +
        '<div class="calc-l2" dir="ltr">S = √( ' + f(ss, 4) + ' ÷ ' + N + ' ) = √' + f(ss / N, 4) + ' = <span class="big">' + f(S, 2) + '</span></div>';
      h += '<div class="tbl"><table class="steps" dir="ltr"><thead><tr><th>x</th>' + (hasF ? '<th>f</th>' : '') + '<th>x − x̄</th><th>(x − x̄)²</th></tr></thead><tbody>';
      xs.slice(0, 15).forEach(function (x, k) {
        h += '<tr><td>' + f(x, 4) + '</td>' + (hasF ? '<td>' + fs[k] + '</td>' : '') + '<td>' + f(x - m, 4) + '</td><td>' + f((x - m) * (x - m), 4) + '</td></tr>';
      });
      h += '</tbody></table></div>' + (xs.length > 15 ? '<p class="muted">מוצגות 15 השורות הראשונות. החישוב כולל את כל הנתונים.</p>' : '') +
        '<p class="muted">בבחינה מעגלים את סטיית התקן לשתי ספרות אחרי הנקודה, ובודקים במחשבון שהתוצאה זהה.</p>';
      out.innerHTML = h;
    }
    document.getElementById('l-d').addEventListener('input', upd);
    document.getElementById('l-clear').addEventListener('click', function () { document.getElementById('l-d').value = ''; upd(); });
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
  function f2(v) { return show(v, 2).replace(/(\.\d*?)0+$/, '$1').replace(/\.$/, ''); }
  function initBell() {
    var p = document.getElementById('pane-bell');
    p.innerHTML = '<p class="calc-q"><strong>איזה שטח לצבוע בפעמון?</strong></p>' +
      '<div class="modes" role="radiogroup" aria-label="איזה שטח לצבוע">' +
      '<label class="mode"><input type="radio" name="b-mode" value="between" checked><span>בין שני ערכים</span></label>' +
      '<label class="mode"><input type="radio" name="b-mode" value="left"><span>משמאל לערך</span></label>' +
      '<label class="mode"><input type="radio" name="b-mode" value="right"><span>מימין לערך</span></label></div>' +
      '<p class="muted" id="b-help"></p>' +
      '<div class="tool-grid">' + field('b-m', 'x̄ (ממוצע)', '70') + field('b-s', 'S (סטיית תקן)', '10') + field('b-a', 'ערך תחתון', '60') + field('b-b', 'ערך עליון', '85') + '</div>' +
      '<div class="tool-out" id="b-out" aria-live="polite"></div>';
    var ids = ['b-m', 'b-s', 'b-a', 'b-b'];
    var helps = { between: 'הכלי מצייר פעמון ומצל את השטח בין שני ערכים, ומחשב אותו לפי הטבלה. מזינים ממוצע, סטיית תקן, ערך תחתון וערך עליון.', left: 'הכלי מצייר פעמון ומצל את השטח שמשמאל לערך (הערך העליון), ומחשב אותו לפי הטבלה. מזינים ממוצע, סטיית תקן וערך.', right: 'הכלי מצייר פעמון ומצל את השטח שמימין לערך (הערך התחתון), ומחשב אותו לפי הטבלה. מזינים ממוצע, סטיית תקן וערך.' };
    function mode() { return document.querySelector('input[name="b-mode"]:checked').value; }
    function setMode() {
      var md = mode(), la = document.getElementById('b-a'), lb = document.getElementById('b-b');
      var offA = md === 'left', offB = md === 'right';
      la.disabled = offA; lb.disabled = offB;
      if (offA) { la.value = ''; la.placeholder = 'לא בשימוש'; } else la.placeholder = 'למשל 60';
      if (offB) { lb.value = ''; lb.placeholder = 'לא בשימוש'; } else lb.placeholder = 'למשל 85';
      la.closest('label').classList.toggle('calc-target', offA); lb.closest('label').classList.toggle('calc-target', offB);
      document.getElementById('b-help').textContent = helps[md];
      upd();
    }
    function upd() {
      var out = document.getElementById('b-out'), md = mode();
      var m = num(document.getElementById('b-m').value), s = num(document.getElementById('b-s').value);
      var av = document.getElementById('b-a').value.trim(), bv = document.getElementById('b-b').value.trim();
      var a = num(av), b = num(bv);
      out.innerHTML = '';
      if (isNaN(m) || isNaN(s) || s <= 0) { out.textContent = 'הזינו ממוצע וסטיית תקן חיובית.'; return; }
      if (md === 'between' && (av === '' || bv === '')) { out.textContent = 'הזינו גם ערך תחתון וגם ערך עליון.'; return; }
      if (md === 'left' && bv === '') { out.textContent = 'הזינו את הערך.'; return; }
      if (md === 'right' && av === '') { out.textContent = 'הזינו את הערך.'; return; }
      if ((av !== '' && isNaN(a)) || (bv !== '' && isNaN(b))) { out.textContent = 'הערכים חייבים להיות מספרים.'; return; }
      if (md === 'between' && a >= b) { out.textContent = 'הערך התחתון חייב להיות קטן מהעליון.'; return; }
      var lo = md === 'left' ? m - 4 * s : a, hi = md === 'right' ? m + 4 * s : b;
      var F = window.Figs, shades = [[lo, hi]];
      var ticks = [{ x: m, label: F.fmt(m), bold: true }];
      if (md !== 'left') ticks.push({ x: a, label: F.fmt(a) });
      if (md !== 'right') ticks.push({ x: b, label: F.fmt(b) });
      var svg = F.newSvg('פעמון נורמלי, ממוצע ' + m + ', סטיית תקן ' + s);
      F.drawBells(svg, [{ m: m, s: s }], { shades: shades, ticks: ticks, meanTick: m });
      var wrap = document.createElement('figure'); wrap.className = 'fig'; var d = document.createElement('div'); d.className = 'fig-svg'; d.appendChild(svg); wrap.appendChild(d);
      out.appendChild(wrap);
      var za = (a - m) / s, zb = (b - m) / s, far = false;
      function cell(z) { var k = key(z); if (Math.abs(z) <= 3.09 && k in ZT) return ZT[k]; far = true; return z < 0 ? 0 : 1; }
      function L1(t) { return '<div class="calc-l1" dir="ltr">' + t + '</div>'; }
      function L2(t) { return '<div class="calc-l2" dir="ltr">' + t + '</div>'; }
      var h = '', area;
      if (md !== 'left') h += L1('z₁ = (' + f2(a) + ' − ' + f2(m) + ') ÷ ' + f2(s) + ' = ' + f2(za));
      if (md !== 'right') h += L1('z₂ = (' + f2(b) + ' − ' + f2(m) + ') ÷ ' + f2(s) + ' = ' + f2(zb));
      if (md === 'between') { var c1 = cell(za), c2 = cell(zb); area = c2 - c1; h += L1('שטח = P(z₂) − P(z₁)') + L2('שטח = ' + c2.toFixed(4) + ' − ' + c1.toFixed(4) + ' = <span class="big">' + area.toFixed(4) + '</span>'); }
      else if (md === 'left') { var c3 = cell(zb); area = c3; h += L1('שטח = P(z₂)') + L2('שטח = <span class="big">' + c3.toFixed(4) + '</span>'); }
      else { var c4 = cell(za); area = 1 - c4; h += L1('שטח = 1 − P(z₁)') + L2('שטח = 1 − ' + c4.toFixed(4) + ' = <span class="big">' + area.toFixed(4) + '</span>'); }
      h += '<p>כלומר <bdi dir="ltr">' + (Math.round(area * 1000) / 10) + '%</bdi> מהנתונים.' + (far ? ' אחד הערכים רחוק יותר מ-3 סטיות תקן מהממוצע, ומחוץ לטבלה, ולכן התוצאה בקירוב.' : '') + '</p>';
      var pp = document.createElement('div'); pp.innerHTML = h; out.appendChild(pp);
    }
    ids.forEach(function (i) { document.getElementById(i).addEventListener('input', upd); });
    Array.prototype.forEach.call(document.querySelectorAll('input[name="b-mode"]'), function (r) { r.addEventListener('change', setMode); });
    setMode();
  }

  function init() {
    initCalc(); initList(); initTable(); initBell();
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
