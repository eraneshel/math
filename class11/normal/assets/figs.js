/* figs.js — all figures are SVG generated in code (no images, no chart library) */
(function () {
  'use strict';
  var NS = 'http://www.w3.org/2000/svg';
  var W = 600, H = 320, X0 = 40, X1 = 560, YB = 262, YT = 44;
  var MINUS = '−';

  function el(name, attrs, parent) {
    var e = document.createElementNS(NS, name);
    for (var k in attrs) if (attrs.hasOwnProperty(k)) e.setAttribute(k, attrs[k]);
    if (parent) parent.appendChild(e);
    return e;
  }
  function txt(parent, x, y, s, cls) {
    var t = el('text', { x: x, y: y, 'class': 'svg-txt ' + (cls || '') }, parent);
    t.textContent = s; return t;
  }
  function fmt(v) {
    var s = (Math.round(v * 1000) / 1000).toString();
    return s.replace('-', MINUS);
  }
  function pdf(x, m, s) { return Math.exp(-0.5 * Math.pow((x - m) / s, 2)) / (s * Math.sqrt(2 * Math.PI)); }
  function newSvg(label, vb) {
    var svg = el('svg', { viewBox: vb || ('0 0 ' + W + ' ' + H), role: 'img', 'aria-label': label, preserveAspectRatio: 'xMidYMid meet' });
    el('title', {}, svg).textContent = label;
    return svg;
  }

  /* ---- normal bell(s) on a numeric axis ---- */
  function drawBells(svg, curves, opt) {
    var xmin = Infinity, xmax = -Infinity, peak = 0, i;
    for (i = 0; i < curves.length; i++) {
      xmin = Math.min(xmin, curves[i].m - 3.6 * curves[i].s);
      xmax = Math.max(xmax, curves[i].m + 3.6 * curves[i].s);
      peak = Math.max(peak, pdf(curves[i].m, curves[i].m, curves[i].s));
    }
    var sx = function (x) { return X0 + (x - xmin) / (xmax - xmin) * (X1 - X0); };
    var sy = function (v) { return YB - (v / peak) * (YB - YT - 12); };
    function path(c, from, to, close) {
      var N = 160, d = '', a = Math.max(from, c.m - 3.6 * c.s), b = Math.min(to, c.m + 3.6 * c.s), k;
      for (k = 0; k <= N; k++) {
        var x = a + (b - a) * k / N;
        d += (k ? 'L' : 'M') + sx(x).toFixed(1) + ' ' + sy(pdf(x, c.m, c.s)).toFixed(1);
      }
      if (close) d += 'L' + sx(b).toFixed(1) + ' ' + YB + 'L' + sx(a).toFixed(1) + ' ' + YB + 'Z';
      return d;
    }
    var c0 = curves[0];
    if (opt.shades) for (i = 0; i < opt.shades.length; i++) {
      el('path', { d: path(c0, opt.shades[i][0], opt.shades[i][1], true), 'class': 'svg-shade' }, svg);
    }
    if (curves.length === 1) el('path', { d: path(c0, -1e9, 1e9, true), 'class': 'svg-fill' }, svg);
    el('line', { x1: X0 - 10, y1: YB, x2: X1 + 10, y2: YB, 'class': 'svg-axis' }, svg);
    var styles = opt.styles || [];
    for (i = 0; i < curves.length; i++) {
      var p = el('path', { d: path(curves[i], -1e9, 1e9, false), 'class': 'svg-curve' }, svg);
      if (styles[i]) { p.setAttribute('stroke-dasharray', styles[i].dash); p.style.stroke = styles[i].color; }
    }
    // ticks
    var ticks = opt.ticks || [], meanTick = opt.meanTick;
    for (i = 0; i < ticks.length; i++) {
      var tx = sx(ticks[i].x);
      el('line', { x1: tx, y1: YB, x2: tx, y2: YB + 9, 'class': 'svg-tick' }, svg);
      txt(svg, tx, YB + 32, ticks[i].label, ticks[i].bold ? 'lg' : '');
    }
    if (meanTick !== undefined) el('line', { x1: sx(meanTick), y1: sy(pdf(meanTick, c0.m, c0.s)), x2: sx(meanTick), y2: YB, 'class': 'svg-mean' }, svg);
    return { sx: sx, sy: sy, xmin: xmin, xmax: xmax };
  }

  var PALETTE = [{ color: '#1d4e89', dash: '' }, { color: '#d97706', dash: '9 6' }, { color: '#7c3aed', dash: '2 6' }, { color: '#0f766e', dash: '14 5 3 5' }];

  function figNormal(spec) {
    var m = +(spec.mean || 0), s = +(spec.sd || 1);
    var standard = (m === 0 && s === 1);
    var ticks = [{ x: m, label: standard ? '0' : fmt(m), bold: true }], shades = [];
    if (spec.shade) {
      var ab = spec.shade.split(':').map(Number);
      var lo = standard ? ab[0] : ab[0], hi = standard ? ab[1] : ab[1];
      shades.push([m + (standard ? lo * s : lo - m) * 1 + (standard ? 0 : 0), m + (standard ? hi * s : hi - m)]);
      if (!standard) { shades[0] = [lo, hi]; }
      ticks.push({ x: shades[0][0], label: fmt(standard ? lo : lo) }, { x: shades[0][1], label: fmt(standard ? hi : hi) });
    }
    if (spec.tails) {
      var a = +spec.tails;
      shades.push([m - 4 * s, m - a * s], [m + a * s, m + 4 * s]);
      ticks.push({ x: m - a * s, label: MINUS + 'z' }, { x: m + a * s, label: 'z' });
    }
    var svg = newSvg('פעמון נורמלי, ממוצע ' + m + ', סטיית תקן ' + s + (spec.shade ? ', שטח מוצלל בין ' + spec.shade.replace(':', ' ל-') : '') + (spec.tails ? ', שני זנבות מוצללים' : ''));
    drawBells(svg, [{ m: m, s: s }], { shades: shades, ticks: ticks, meanTick: m });
    return svg;
  }

  function figLabeled(spec) {
    var m = +spec.mean, s = +spec.sd;
    var vals = (spec.axis || '').split(',').map(Number);
    var ticks = vals.map(function (v) { return { x: v, label: fmt(v), bold: v === m }; });
    var svg = newSvg('פעמון נורמלי, ממוצע ' + m + ', סטיית תקן ' + s + ', ציר ערכים: ' + vals.join(', '));
    drawBells(svg, [{ m: m, s: s }], { ticks: ticks, meanTick: m });
    return svg;
  }

  function figMulti(spec) {
    var curves = (spec.curves || '').split(';').map(function (t) {
      var p = t.split(':'), q = p[1].split(',');
      return { name: p[0], m: +q[0], s: +q[1] };
    });
    var svg = newSvg('כמה פעמונים נורמליים על אותו ציר: ' + curves.map(function (c) { return c.name + ' ממוצע ' + c.m + ' סטיית תקן ' + c.s; }).join('; '));
    var means = [], k;
    curves.forEach(function (c) { if (means.indexOf(c.m) < 0) means.push(c.m); });
    drawBells(svg, curves, { styles: PALETTE, ticks: means.map(function (v) { return { x: v, label: fmt(v), bold: true }; }) });
    // legend
    curves.forEach(function (c, i) {
      var y = 26 + i * 26, x = 50;
      var ln = el('line', { x1: x, y1: y, x2: x + 44, y2: y, 'stroke-width': 4 }, svg);
      ln.style.stroke = PALETTE[i].color; if (PALETTE[i].dash) ln.setAttribute('stroke-dasharray', PALETTE[i].dash);
      var t = el('text', { x: x + 54, y: y + 7, 'class': 'svg-legend-txt', 'text-anchor': 'start' }, svg);
      t.textContent = c.name + ': ' + fmt(c.m) + ', ' + fmt(c.s);
    });
    return svg;
  }

  /* ---- skew / U shapes (panels) ---- */
  var PW = 300, PH = 200, PX0 = 20, PX1 = 280, PYB = 168, PYT = 26;
  function gammaPts(k, left) {
    var N = 140, pts = [], maxv = 0, i, xmax = 9;
    for (i = 0; i <= N; i++) { var x = xmax * i / N; var v = i === 0 ? 0 : Math.pow(x, k - 1) * Math.exp(-x); pts.push([x, v]); if (v > maxv) maxv = v; }
    // median
    var tot = 0, cum = [], j;
    for (j = 1; j <= N; j++) { tot += (pts[j][1] + pts[j - 1][1]) / 2; cum.push(tot); }
    var med = 0; for (j = 0; j < cum.length; j++) { if (cum[j] >= tot / 2) { med = pts[j + 1][0]; break; } }
    var mode = (k - 1), mean = k;
    var out = { pts: pts.map(function (p) { return [left ? xmax - p[0] : p[0], p[1] / maxv]; }), xmax: xmax, mode: left ? xmax - mode : mode, med: left ? xmax - med : med, mean: left ? xmax - mean : mean };
    if (left) out.pts.reverse();
    return out;
  }
  function panelSvg(type, marks, label) {
    var svg = newSvg(label, '0 0 ' + PW + ' ' + PH);
    var sx, curve = [], marksX = null, i;
    if (type === 'skew_right' || type === 'skew_left') {
      var g = gammaPts(2.6, type === 'skew_left');
      sx = function (x) { return PX0 + x / g.xmax * (PX1 - PX0); };
      curve = g.pts.map(function (p) { return [sx(p[0]), PYB - p[1] * (PYB - PYT)]; });
      marksX = [['ש', g.mode], ['ח', g.med], ['מ', g.mean]];
    } else if (type === 'u_shape') {
      sx = function (x) { return PX0 + x * (PX1 - PX0); };
      for (i = 0; i <= 100; i++) { var x = i / 100, v = 0.12 + 0.88 * Math.pow(2 * x - 1, 2); curve.push([sx(x), PYB - v * (PYB - PYT)]); }
    } else {
      sx = function (x) { return PX0 + (x + 3.6) / 7.2 * (PX1 - PX0); };
      for (i = 0; i <= 120; i++) { var xx = -3.6 + 7.2 * i / 120; curve.push([sx(xx), PYB - Math.exp(-xx * xx / 2) * (PYB - PYT)]); }
      marksX = [['ש,ח,מ', 0]];
    }
    var d = curve.map(function (p, k) { return (k ? 'L' : 'M') + p[0].toFixed(1) + ' ' + p[1].toFixed(1); }).join('');
    el('path', { d: d + 'L' + curve[curve.length - 1][0].toFixed(1) + ' ' + PYB + 'L' + curve[0][0].toFixed(1) + ' ' + PYB + 'Z', 'class': 'svg-fill' }, svg);
    el('line', { x1: PX0 - 6, y1: PYB, x2: PX1 + 6, y2: PYB, 'class': 'svg-axis' }, svg);
    el('path', { d: d, 'class': 'svg-curve' }, svg);
    if (marks && marksX) {
      var lab = marksX.map(function (mk) { return { t: mk[0], x: sx(mk[1]) }; }).sort(function (a, b) { return a.x - b.x; });
      var lx = lab.map(function (l) { return l.x; });
      for (i = 1; i < lx.length; i++) if (lx[i] - lx[i - 1] < 26) lx[i] = lx[i - 1] + 26;
      var shift = lab.length > 1 ? (lab[Math.floor(lab.length / 2)].x - lx[Math.floor(lab.length / 2)]) : 0;
      lab.forEach(function (l, k) {
        el('line', { x1: l.x, y1: PYT - 4, x2: l.x, y2: PYB, 'class': 'svg-mean' }, svg);
        var t = txt(svg, lx[k] + shift, 16, l.t, 'lg'); t.setAttribute('text-anchor', 'middle');
      });
    }
    return svg;
  }
  var PANEL_NAMES = { normal: 'התפלגות סימטרית', skew_right: 'עקומה עם זנב ארוך ימינה', skew_left: 'עקומה עם זנב ארוך שמאלה', u_shape: 'עקומה בצורת U' };

  function figPanels(spec, host, marks) {
    var wrap = document.createElement('div'); wrap.className = 'panels';
    (spec.panels || '').split(';').forEach(function (p) {
      var q = p.split(':'), name = q[0], type = q[1];
      var box = document.createElement('div'); box.className = 'panel';
      var ti = document.createElement('div'); ti.className = 'panel-title'; ti.textContent = name; box.appendChild(ti);
      box.appendChild(panelSvg(type, marks, name + ': ' + PANEL_NAMES[type]));
      if (marks && type !== 'u_shape') {
        var key = document.createElement('div'); key.className = 'panel-key';
        key.textContent = type === 'normal' ? 'ש=שכיח, ח=חציון, מ=ממוצע: כולם באותו מקום' : 'ש = שכיח · ח = חציון · מ = ממוצע';
        box.appendChild(key);
      }
      wrap.appendChild(box);
    });
    host.appendChild(wrap);
  }

  /* ---- interactive: fill the 7 axis values ---- */
  var HEB = 'אבגדהו';
  function parseNum(v) {
    v = String(v).trim().replace(/−/g, '-').replace(',', '.');
    if (v === '' || !/^-?\d+(\.\d+)?$/.test(v)) return NaN;
    return parseFloat(v);
  }
  function figAxisFill(spec, host) {
    var items = (spec.items || '').split(';').map(function (t) {
      var i = t.indexOf(':'), id = t.slice(0, i), o = {};
      t.slice(i + 1).split(',').forEach(function (kv) { var a = kv.split('='); o[a[0]] = parseFloat(a[1]); });
      return { id: id, mean: o.mean, sd: o.sd };
    });
    var wrap = document.createElement('div'); wrap.className = 'af';
    items.forEach(function (it, n) {
      var correct = []; for (var k = -3; k <= 3; k++) correct.push(Math.round((it.mean + k * it.sd) * 1e6) / 1e6);
      var box = document.createElement('div'); box.className = 'af-item';
      box.innerHTML = '<div class="af-lab">סעיף ' + HEB[n] + ': מלאו את שבעת הערכים על הציר</div>';
      var row = document.createElement('div'); row.className = 'af-row';
      var inputs = [];
      for (var j = 0; j < 7; j++) {
        var inp = document.createElement('input'); inp.type = 'text'; inp.inputMode = 'decimal'; inp.autocomplete = 'off';
        inp.setAttribute('aria-label', 'סעיף ' + HEB[n] + ', ערך ' + (j + 1) + ' מתוך 7 על הציר'); row.appendChild(inp); inputs.push(inp);
      }
      box.appendChild(row);
      var keys = document.createElement('div'); keys.className = 'af-k';
      ['−3S', '−2S', '−S', 'x̄', '+S', '+2S', '+3S'].forEach(function (t) { var s = document.createElement('span'); s.textContent = t; keys.appendChild(s); });
      box.appendChild(keys);
      var ctl = document.createElement('div'); ctl.className = 'af-ctl';
      var b1 = document.createElement('button'); b1.type = 'button'; b1.className = 'btn small'; b1.textContent = 'בדוק';
      var b2 = document.createElement('button'); b2.type = 'button'; b2.className = 'btn small ghost'; b2.textContent = 'הצג תשובה';
      var msg = document.createElement('span'); msg.className = 'af-msg'; msg.setAttribute('aria-live', 'polite');
      ctl.appendChild(b1); ctl.appendChild(b2); ctl.appendChild(msg); box.appendChild(ctl);
      var ans = document.createElement('div'); ans.className = 'af-correct'; ans.hidden = true; box.appendChild(ans);
      b1.addEventListener('click', function () {
        var ok = 0, filled = 0;
        inputs.forEach(function (inp, q) {
          inp.classList.remove('right', 'wrong');
          var v = parseNum(inp.value);
          if (inp.value.trim() === '') return;
          filled++;
          if (!isNaN(v) && Math.abs(v - correct[q]) < 1e-6) { inp.classList.add('right'); ok++; } else inp.classList.add('wrong');
        });
        msg.textContent = filled === 0 ? 'מלאו ערכים ולחצו שוב' : (ok === 7 ? 'כל הערכים נכונים' : ok + ' מתוך 7 נכונים');
      });
      b2.addEventListener('click', function () {
        ans.hidden = !ans.hidden;
        ans.textContent = ans.hidden ? '' : correct.map(function (v) { return fmt(v); }).join(' , ');
        b2.textContent = ans.hidden ? 'הצג תשובה' : 'הסתר תשובה';
      });
      wrap.appendChild(box);
    });
    host.appendChild(wrap);
  }

  function renderFig(fig) {
    var spec; try { spec = JSON.parse(fig.getAttribute('data-fig')); } catch (e) { return; }
    var host = fig.querySelector('.fig-svg'); host.innerHTML = '';
    var t = spec.type;
    if (t === 'normal') host.appendChild(figNormal(spec));
    else if (t === 'normal_labeled') host.appendChild(figLabeled(spec));
    else if (t === 'multi') host.appendChild(figMulti(spec));
    else if (t === 'panel') figPanels(spec, host, !spec.inExercise);
    else if (t === 'skew_right' || t === 'skew_left' || t === 'u_shape') host.appendChild(panelSvg(t, !spec.inExercise && t !== 'u_shape', PANEL_NAMES[t]));
    else if (t === 'axis_fill') figAxisFill(spec, host);
    else host.textContent = '[איור לא נתמך: ' + t + ']';
  }
  function renderAll(root) {
    var list = (root || document).querySelectorAll('.fig');
    for (var i = 0; i < list.length; i++) renderFig(list[i]);
  }
  window.Figs = { renderAll: renderAll, renderFig: renderFig, drawBells: drawBells, newSvg: newSvg, el: el, txt: txt, fmt: fmt, pdf: pdf, parseNum: parseNum };
})();
