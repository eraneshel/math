/* figs.js — function-graph figures for the linear-function booklet.
   <figure class="fig" data-fig='{"xr":[-3,5],"yr":[-4,6],"lines":[{"m":2,"b":1,"name":"f"}],"pts":[{"x":0,"y":1,"t":"A"}]}'> */
(function () {
  'use strict';
  var NS = 'http://www.w3.org/2000/svg';
  function el(name, attrs, parent) {
    var e = document.createElementNS(NS, name);
    for (var k in attrs) if (attrs.hasOwnProperty(k)) e.setAttribute(k, attrs[k]);
    if (parent) parent.appendChild(e);
    return e;
  }
  function txt(parent, x, y, s, cls, anchor) {
    var t = el('text', { x: x, y: y, 'class': cls || 'svg-txt' }, parent);
    if (anchor) t.setAttribute('text-anchor', anchor);
    t.textContent = s; return t;
  }
  function fmt(v) { return String(v).replace('-', '−'); }

  /* clip the segment p0-p1 to the rectangle (Liang-Barsky) */
  function clip(x0, y0, x1, y1, r) {
    var t0 = 0, t1 = 1, dx = x1 - x0, dy = y1 - y0;
    var P = [-dx, dx, -dy, dy], Q = [x0 - r.x0, r.x1 - x0, y0 - r.y0, r.y1 - y0];
    for (var i = 0; i < 4; i++) {
      if (P[i] === 0) { if (Q[i] < 0) return null; }
      else {
        var t = Q[i] / P[i];
        if (P[i] < 0) { if (t > t1) return null; if (t > t0) t0 = t; }
        else { if (t < t0) return null; if (t < t1) t1 = t; }
      }
    }
    return [x0 + t0 * dx, y0 + t0 * dy, x0 + t1 * dx, y0 + t1 * dy];
  }

  var OFF = { tr: [9, -9, 'start'], tl: [-9, -9, 'end'], br: [9, 17, 'start'], bl: [-9, 17, 'end'], t: [0, -11, 'middle'], b: [0, 20, 'middle'], r: [11, 5, 'start'], l: [-11, 5, 'end'] };

  function plot(spec, host) {
    var xr = spec.xr, yr = spec.yr, xs = xr[1] - xr[0], ys = yr[1] - yr[0];
    var ML = 30, MR = 24, MT = 22, MB = 30;
    var u = Math.min(520 / xs, 340 / ys, 56);
    var PW = xs * u, PH = ys * u, W = ML + PW + MR, H = MT + PH + MB;
    var sx = function (x) { return ML + (x - xr[0]) * u; };
    var sy = function (y) { return MT + (yr[1] - y) * u; };
    var svg = el('svg', { viewBox: '0 0 ' + W.toFixed(1) + ' ' + H.toFixed(1), width: W.toFixed(0), height: H.toFixed(0), 'class': 'plot', role: 'img', 'aria-label': spec.alt || 'גרף של פונקציה' });
    var rect = { x0: xr[0], x1: xr[1], y0: yr[0], y1: yr[1] };
    var i;
    /* grid */
    if (spec.grid !== false) {
      for (i = Math.ceil(xr[0]); i <= xr[1]; i++) el('line', { x1: sx(i), y1: sy(yr[0]), x2: sx(i), y2: sy(yr[1]), 'class': 'svg-grid' }, svg);
      for (i = Math.ceil(yr[0]); i <= yr[1]; i++) el('line', { x1: sx(xr[0]), y1: sy(i), x2: sx(xr[1]), y2: sy(i), 'class': 'svg-grid' }, svg);
    }
    /* polygons (shaded regions) */
    (spec.polys || []).forEach(function (p) {
      el('polygon', { points: p.p.map(function (q) { return sx(q[0]).toFixed(1) + ',' + sy(q[1]).toFixed(1); }).join(' '), 'class': 'svg-poly ' + (p.cls || '') }, svg);
    });
    /* axis highlights */
    (spec.hl || []).forEach(function (h) {
      var a = Math.max(h.x1, xr[0]), b = Math.min(h.x2, xr[1]);
      el('line', { x1: sx(a), y1: sy(0), x2: sx(b), y2: sy(0), 'class': 'svg-hl ' + (h.cls || 'sel') }, svg);
    });
    /* axes */
    var ax0 = sy(0), ay0 = sx(0);
    el('line', { x1: sx(xr[0]), y1: ax0, x2: sx(xr[1]) + 8, y2: ax0, 'class': 'svg-axis' }, svg);
    el('line', { x1: ay0, y1: sy(yr[0]), x2: ay0, y2: sy(yr[1]) - 8, 'class': 'svg-axis' }, svg);
    el('path', { d: 'M' + (sx(xr[1]) + 14) + ' ' + ax0 + 'l-9 -4.5v9z', 'class': 'svg-arrow' }, svg);
    el('path', { d: 'M' + ay0 + ' ' + (sy(yr[1]) - 14) + 'l-4.5 9h9z', 'class': 'svg-arrow' }, svg);
    txt(svg, sx(xr[1]) + 12, ax0 + 22, 'x', 'svg-axname');
    txt(svg, ay0 - 14, sy(yr[1]) - 8, 'y', 'svg-axname');
    /* ticks + labels */
    var step = spec.step || 1;
    for (i = Math.ceil(xr[0] / step) * step; i <= xr[1]; i += step) {
      if (i === 0) continue;
      if (spec.ticks !== false) el('line', { x1: sx(i), y1: ax0 - 4, x2: sx(i), y2: ax0 + 4, 'class': 'svg-tick' }, svg);
      if (spec.nums !== false) txt(svg, sx(i), ax0 + 19, fmt(i), 'svg-num');
    }
    for (i = Math.ceil(yr[0] / step) * step; i <= yr[1]; i += step) {
      if (i === 0) continue;
      if (spec.ticks !== false) el('line', { x1: ay0 - 4, y1: sy(i), x2: ay0 + 4, y2: sy(i), 'class': 'svg-tick' }, svg);
      if (spec.nums !== false) txt(svg, ay0 - 9, sy(i) + 5, fmt(i), 'svg-num', 'end');
    }
    txt(svg, ay0 - 9, ax0 + 19, 'O', 'svg-num', 'end');
    /* vertical lines / segments */
    (spec.vlines || []).forEach(function (v) {
      el('line', { x1: sx(v.x), y1: sy(yr[0]), x2: sx(v.x), y2: sy(yr[1]), 'class': 'svg-seg' + (v.dash === false ? '' : ' dash') }, svg);
    });
    (spec.segs || []).forEach(function (s) {
      el('line', { x1: sx(s.x1), y1: sy(s.y1), x2: sx(s.x2), y2: sy(s.y2), 'class': 'svg-seg' + (s.dash ? ' dash' : '') + (s.cls ? ' ' + s.cls : '') }, svg);
    });
    /* lines */
    (spec.lines || []).forEach(function (L) {
      var c = clip(rect.x0, L.m * rect.x0 + L.b, rect.x1, L.m * rect.x1 + L.b, rect);
      if (L.x1 !== undefined) c = clip(L.x1, L.m * L.x1 + L.b, L.x2, L.m * L.x2 + L.b, rect);
      if (!c) return;
      el('line', { x1: sx(c[0]), y1: sy(c[1]), x2: sx(c[2]), y2: sy(c[3]), 'class': 'svg-line l' + (L.cls || 0) + (L.dash ? ' dash' : '') }, svg);
      if (L.name) {
        var nx = L.nx !== undefined ? L.nx : xr[1] - 0.6, ny = L.m * nx + L.b;
        var px = sx(nx), py = sy(ny), side = L.side || 1;
        txt(svg, px + (L.dx !== undefined ? L.dx : 0), py + (L.dy !== undefined ? L.dy : (side > 0 ? -12 : 20)), L.name, 'svg-name l' + (L.cls || 0));
      }
    });
    /* points */
    (spec.pts || []).forEach(function (p) {
      el('circle', { cx: sx(p.x), cy: sy(p.y), r: p.open ? 4.6 : 4.4, 'class': 'svg-pt' + (p.open ? ' open' : '') + (p.cls ? ' ' + p.cls : '') }, svg);
      if (p.t) { var o = OFF[p.pos || 'tr']; txt(svg, sx(p.x) + o[0], sy(p.y) + o[1], p.t, 'svg-plab', o[2]); }
    });
    host.appendChild(svg);
  }

  function render(fig) {
    var host = fig.querySelector('.fig-svg'); if (!host) return;
    var spec; try { spec = JSON.parse(fig.getAttribute('data-fig')); } catch (e) { return; }
    host.innerHTML = '';
    plot(spec, host);
  }
  window.Figs = { renderAll: function (root) { Array.prototype.forEach.call((root || document).querySelectorAll('.fig[data-fig]'), render); } };
})();
