/* figs.js — dynamic function-graph figures for the linear-function booklet.
   <figure class="fig" data-fig='{...}'> spec (all keys optional):
     xr, yr            axis windows
     eq                false = independent x/y scale (default true)
     step, xstep, ystep, grid, nums, ticks
     params            {m:{min,max,step,val}, ...}  -> sliders
     lines             [{m,b,cls,name,nx,side,dx,dy,dash}]  m/b: number | param name ;  or {thru:['A','B']}
     drags             [{id,x,y,snap,t,pos,on:lineIndex,lock:'x'|'y',min,max}]
     vseg              {x:param|number, between:[i,j]}  vertical segment between two lines
     probe             true -> draggable point on the first line with live coordinates
     readout           [{k:'eq',line,name} | {k:'pt',id} | {k:'len'} | {k:'cmp'} | {k:'sign',id} | {k:'val',line,at,lab}]
     pts, segs, polys, hl, vlines, labs   static drawables
     layers            [{part:k, pts,segs,polys,hl,vlines,labs}] revealed when part k is solved
     goal              {params:{m:{eq|gt|lt}}} | {line:{i,m,b}} | {drag:{id:{x,y}}} | {any:[..]} | {all:[..]}
*/
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
  function r2(v) { return Math.round(v * 100) / 100; }
  function fmt(v) { v = r2(v); if (Object.is(v, -0)) v = 0; return String(v).replace('-', '−'); }

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

  /* "y = 2x + 1" style string */
  function eqStr(name, m, b) {
    m = r2(m); b = r2(b);
    var s = '';
    if (m === 0) s = fmt(b);
    else {
      s = (m === 1 ? '' : m === -1 ? '−' : fmt(m)) + 'x';
      if (b > 0) s += ' + ' + fmt(b); else if (b < 0) s += ' − ' + fmt(-b);
    }
    return name + ' = ' + s;
  }

  function build(fig) {
    var host = fig.querySelector('.fig-svg'); if (!host) return;
    var spec; try { spec = JSON.parse(fig.getAttribute('data-fig')); } catch (e) { return; }
    host.innerHTML = '';
    var old = fig.querySelectorAll('.fig-ctl, .fig-read'); Array.prototype.forEach.call(old, function (n) { n.parentNode.removeChild(n); });

    var xr = spec.xr, yr = spec.yr, xs = xr[1] - xr[0], ys = yr[1] - yr[0];
    var ML = 34, MR = 36, MT = 22, MB = 30;
    var ux, uy;
    if (spec.eq === false) { ux = 500 / xs; uy = 300 / ys; }
    else { ux = uy = Math.min(520 / xs, 340 / ys, 56); }
    var PW = xs * ux, PH = ys * uy, W = ML + PW + MR, H = MT + PH + MB;
    var sx = function (x) { return ML + (x - xr[0]) * ux; };
    var sy = function (y) { return MT + (yr[1] - y) * uy; };
    var svg = el('svg', { viewBox: '0 0 ' + W.toFixed(1) + ' ' + H.toFixed(1), width: W.toFixed(0), height: H.toFixed(0), 'class': 'plot', role: 'img', 'aria-label': spec.alt || 'גרף של פונקציה' });
    var rect = { x0: xr[0], x1: xr[1], y0: yr[0], y1: yr[1] };
    var i;

    /* ---------- state ---------- */
    var Pm = {}; var pdef = spec.params || {};
    Object.keys(pdef).forEach(function (k) { Pm[k] = pdef[k].val; });
    var D = {}; var drags = (spec.drags || []).slice();
    if (spec.probe && spec.lines && spec.lines.length) drags.push({ id: 'Q', on: 0, x: spec.probeX !== undefined ? spec.probeX : Math.round((xr[0] + xr[1]) / 2), snap: spec.probeSnap || 1, t: 'Q', pos: 'tr' });
    var readout = (spec.readout || []).slice();
    if (spec.probe && !spec.readout) readout.push({ k: 'pt', id: 'Q' });
    drags.forEach(function (d) { D[d.id] = { x: d.x, y: d.y }; });
    var dragDef = {}; drags.forEach(function (d) { dragDef[d.id] = d; });

    function val(v) { return typeof v === 'string' ? Pm[v] : v; }
    function lineOf(L) {
      if (L.thru) {
        var a = D[L.thru[0]], b = D[L.thru[1]];
        if (Math.abs(a.x - b.x) < 1e-9) return { vert: true, x: a.x };
        var m = (b.y - a.y) / (b.x - a.x); return { m: m, b: a.y - m * a.x };
      }
      if (L.perp !== undefined || L.par !== undefined) {
        var base = lineOf(spec.lines[L.perp !== undefined ? L.perp : L.par]), at = L.at, mm;
        if (L.perp !== undefined) {
          if (base.vert) return { m: 0, b: at[1] };
          if (Math.abs(base.m) < 1e-9) return { vert: true, x: at[0] };
          mm = -1 / base.m;
        } else { if (base.vert) return { vert: true, x: at[0] }; mm = base.m; }
        return { m: mm, b: at[1] - mm * at[0] };
      }
      if (L.tan !== undefined) {
        var ang = val(L.tan) * Math.PI / 180;
        if (Math.abs(Math.cos(ang)) < 1e-9) return { vert: true, x: L.at ? L.at[0] : 0 };
        var tm = Math.tan(ang); return { m: tm, b: L.at ? L.at[1] - tm * L.at[0] : (L.b ? val(L.b) : 0) };
      }
      var m2 = val(L.m); return { m: m2, b: L.at ? L.at[1] - m2 * L.at[0] : val(L.b) };
    }
    function distTo(id, li) {
      var q = lineOf(spec.lines[li]), p = D[id];
      return q.vert ? Math.abs(p.x - q.x) : Math.abs(q.m * p.x - p.y + q.b) / Math.sqrt(q.m * q.m + 1);
    }
    function footOf(id, li) {
      var q = lineOf(spec.lines[li]), p = D[id];
      if (q.vert) return { x: q.x, y: p.y };
      var t = (p.x + q.m * (p.y - q.b)) / (1 + q.m * q.m); return { x: t, y: q.m * t + q.b };
    }
    function yOn(L, x) { var o = lineOf(L); return o.vert ? NaN : o.m * x + o.b; }

    /* ---------- grid / axes ---------- */
    var xst = spec.xstep || spec.step || 1, yst = spec.ystep || spec.step || 1;
    if (spec.grid !== false) {
      for (i = Math.ceil(xr[0] / xst) * xst; i <= xr[1] + 1e-9; i += xst) el('line', { x1: sx(i), y1: sy(yr[0]), x2: sx(i), y2: sy(yr[1]), 'class': 'svg-grid' }, svg);
      for (i = Math.ceil(yr[0] / yst) * yst; i <= yr[1] + 1e-9; i += yst) el('line', { x1: sx(xr[0]), y1: sy(i), x2: sx(xr[1]), y2: sy(i), 'class': 'svg-grid' }, svg);
    }
    var gStatic = el('g', {}, svg);
    function drawItems(g, o) {
      (o.polys || []).forEach(function (p) {
        el('polygon', { points: p.p.map(function (q) { return sx(q[0]).toFixed(1) + ',' + sy(q[1]).toFixed(1); }).join(' '), 'class': 'svg-poly ' + (p.cls || '') }, g);
      });
      (o.hl || []).forEach(function (h) {
        var a = Math.max(h.x1, xr[0]), b = Math.min(h.x2, xr[1]);
        el('line', { x1: sx(a), y1: sy(0), x2: sx(b), y2: sy(0), 'class': 'svg-hl ' + (h.cls || 'sel') }, g);
      });
      (o.vlines || []).forEach(function (v) {
        el('line', { x1: sx(v.x), y1: sy(yr[0]), x2: sx(v.x), y2: sy(yr[1]), 'class': 'svg-seg' + (v.dash === false ? '' : ' dash') }, g);
      });
      (o.segs || []).forEach(function (s) {
        el('line', { x1: sx(s.x1), y1: sy(s.y1), x2: sx(s.x2), y2: sy(s.y2), 'class': 'svg-seg' + (s.dash ? ' dash' : '') + (s.cls ? ' ' + s.cls : '') }, g);
      });
      (o.pts || []).forEach(function (p) {
        el('circle', { cx: sx(p.x), cy: sy(p.y), r: p.open ? 4.6 : 4.4, 'class': 'svg-pt' + (p.open ? ' open' : '') + (p.cls ? ' ' + p.cls : '') }, g);
        if (p.t) { var oo = OFF[p.pos || 'tr']; txt(g, sx(p.x) + oo[0], sy(p.y) + oo[1], p.t, 'svg-plab', oo[2]); }
      });
      (o.labs || []).forEach(function (p) { var oo = OFF[p.pos || 'tr']; txt(g, sx(p.x) + oo[0], sy(p.y) + oo[1], p.t, 'svg-val' + (p.cls ? ' ' + p.cls : ''), oo[2]); });
    }
    drawItems(gStatic, spec);

    var ax0 = sy(0), ay0 = sx(0);
    el('line', { x1: sx(xr[0]), y1: ax0, x2: sx(xr[1]) + 8, y2: ax0, 'class': 'svg-axis' }, svg);
    el('line', { x1: ay0, y1: sy(yr[0]), x2: ay0, y2: sy(yr[1]) - 8, 'class': 'svg-axis' }, svg);
    el('path', { d: 'M' + (sx(xr[1]) + 14) + ' ' + ax0 + 'l-9 -4.5v9z', 'class': 'svg-arrow' }, svg);
    el('path', { d: 'M' + ay0 + ' ' + (sy(yr[1]) - 14) + 'l-4.5 9h9z', 'class': 'svg-arrow' }, svg);
    txt(svg, sx(xr[1]) + 24, ax0 + 5, spec.xname || 'x', 'svg-axname');
    txt(svg, ay0 - 14, sy(yr[1]) - 8, spec.yname || 'y', 'svg-axname');
    for (i = Math.ceil(xr[0] / xst) * xst; i <= xr[1] + 1e-9; i += xst) {
      if (Math.abs(i) < 1e-9) continue;
      if (spec.ticks !== false) el('line', { x1: sx(i), y1: ax0 - 4, x2: sx(i), y2: ax0 + 4, 'class': 'svg-tick' }, svg);
      if (spec.nums !== false) txt(svg, sx(i), ax0 + 19, fmt(i), 'svg-num');
    }
    for (i = Math.ceil(yr[0] / yst) * yst; i <= yr[1] + 1e-9; i += yst) {
      if (Math.abs(i) < 1e-9) continue;
      if (spec.ticks !== false) el('line', { x1: ay0 - 4, y1: sy(i), x2: ay0 + 4, y2: sy(i), 'class': 'svg-tick' }, svg);
      if (spec.nums !== false) txt(svg, ay0 - 9, sy(i) + 5, fmt(i), 'svg-num', 'end');
    }
    txt(svg, ay0 - 9, ax0 + 19, 'O', 'svg-num', 'end');

    /* ---------- reveal layers ---------- */
    var layerG = {};
    (spec.layers || []).forEach(function (L) {
      var g = el('g', { 'class': 'layer is-hidden', 'data-part': L.part }, svg); drawItems(g, L); layerG[L.part] = g;
    });

    /* ---------- dynamic: vseg, lines, drags ---------- */
    var gDyn = el('g', {}, svg);
    var vsegEl = null, vdotA = null, vdotB = null, triEl = null;
    if (spec.tri) triEl = el('polygon', { 'class': 'svg-poly shade' }, gDyn);
    if (spec.vseg) {
      vsegEl = el('line', { 'class': 'svg-seg thick' }, gDyn);
      vdotA = el('circle', { r: 4, 'class': 'svg-pt' }, gDyn); vdotB = el('circle', { r: 4, 'class': 'svg-pt' }, gDyn);
    }
    var lineEls = (spec.lines || []).map(function (L, idx) {
      var e = el('line', { 'class': 'svg-line l' + (L.cls || 0) + (L.dash ? ' dash' : '') }, gDyn);
      var n = null;
      if (L.name) n = el('text', { 'class': 'svg-name l' + (L.cls || 0) }, gDyn), n.textContent = L.name;
      return { e: e, n: n, L: L };
    });
    var calc = spec.calc || [], calcEls = {};
    calc.forEach(function (c) {
      var ce = el('circle', { r: 5.4, 'class': 'svg-pt calc' }, gDyn), cl = c.t ? el('text', { 'class': 'svg-plab' }, gDyn) : null; if (cl) cl.textContent = c.t;
      calcEls[c.id] = { c: ce, lab: cl }; D[c.id] = { x: 0, y: 0 };
    });
    var feet = (spec.foot || []).map(function (f) {
      return { f: f, s: el('line', { 'class': 'svg-seg dash' }, gDyn), p: el('circle', { r: 3.6, 'class': 'svg-pt' }, gDyn) };
    });
    var dragEls = {};
    drags.forEach(function (d) {
      if (d.fixed) {
        var fc = el('circle', { r: 5, 'class': 'svg-pt' }, gDyn);
        var fl = d.t ? el('text', { 'class': 'svg-plab' }, gDyn) : null; if (fl) fl.textContent = d.t;
        dragEls[d.id] = { c: fc, lab: fl }; return;
      }
      var c = el('circle', { r: 9, 'class': 'svg-drag', tabindex: 0, role: 'slider', 'aria-label': 'נקודה ' + (d.t || d.id) + ' (גררו או השתמשו בחצים)' }, gDyn);
      var lab = d.t ? el('text', { 'class': 'svg-plab' }, gDyn) : null; if (lab) lab.textContent = d.t;
      dragEls[d.id] = { c: c, lab: lab };
    });

    /* ---------- readouts ---------- */
    var readBox = document.createElement('div'); readBox.className = 'fig-read'; readBox.setAttribute('aria-live', 'polite');
    var calcDef = {}; (spec.calc || []).forEach(function (c) { calcDef[c.id] = c; });
    function L(x) { return '<bdi dir="ltr">' + x + '</bdi>'; }
    function readText(o) {
      if (o.k === 'eq') { var q = lineOf(spec.lines[o.line]); return q.vert ? 'הישר אנכי: ' + L('x = ' + fmt(q.x)) + ' (אינו פונקציה)' : L(eqStr(o.name || 'y', q.m, q.b)); }
      if (o.k === 'pt') { var p = D[o.id]; return L((o.name || (dragDef[o.id] && dragDef[o.id].t) || (calcDef[o.id] && calcDef[o.id].t) || o.id) + ' = (' + fmt(p.x) + ' ; ' + fmt(p.y) + ')'); }
      if (o.k === 'val') { var xv = o.at in Pm ? Pm[o.at] : (D[o.at] ? D[o.at].x : +o.at); return L((o.lab || 'y') + ' = ' + fmt(yOn(spec.lines[o.line], xv))); }
      if (o.k === 'icpt') {
        var iq = lineOf(spec.lines[o.line || 0]);
        return 'חיתוך עם ציר ' + L('x') + ': ' + (iq.m === 0 ? 'אין' : L('(' + fmt(-iq.b / iq.m) + ' ; 0)')) + ' · חיתוך עם ציר ' + L('y') + ': ' + L('(0 ; ' + fmt(iq.b) + ')');
      }
      if (o.k === 'area') {
        var aq = lineOf(spec.lines[o.line || 0]);
        return 'שטח המשולש: ' + L(aq.m === 0 ? '0' : fmt(Math.abs(aq.b / aq.m * aq.b) / 2));
      }
      if (o.k === 'dist') return 'מרחק מהישר: ' + L(fmt(distTo(o.id, o.line || 0)));
      if (o.k === 'slopes') {
        var s1 = lineOf(spec.lines[o.lines[0]]), s2 = lineOf(spec.lines[o.lines[1]]), pre = o.label ? o.label + ' ' + L(o.pair || '') + ': ' : '';
        if (s1.vert || s2.vert) return pre + 'אחד הישרים אנכי: אין לו שיפוע';
        return pre + L('m₁ = ' + fmt(s1.m) + '  ;  m₂ = ' + fmt(s2.m) + '  ;  m₁·m₂ = ' + fmt(s1.m * s2.m));
      }
      if (o.k === 'tan') {
        var tq = lineOf(spec.lines[o.line || 0]); if (tq.vert) return L('α = ' + fmt(Pm[o.param]) + '°') + ': ישר אנכי, אין שיפוע';
        return L('α = ' + fmt(Pm[o.param]) + '°  ;  m = tan α = ' + fmt(tq.m));
      }
      if (o.k === 'len') { var t = vsegInfo(); return 'אורך הקטע: ' + L(fmt(t.len)); }
      if (o.k === 'cmp') { var t2 = vsegInfo(); var a = t2.ya, b = t2.yb; var rel = Math.abs(a - b) < 0.005 ? '=' : (a > b ? '>' : '<'); var nm = spec.cmpNames || ['f', 'g']; return L(nm[0] + '(' + (spec.vseg.x || 'x') + ') ' + rel + ' ' + nm[1] + '(' + (spec.vseg.x || 'x') + ')'); }
      if (o.k === 'sign') { var yy = D[o.id].y; return yy > 0.005 ? L('y > 0') + ': הפונקציה חיובית' : yy < -0.005 ? L('y < 0') + ': הפונקציה שלילית' : L('y = 0') + ': אפס הפונקציה'; }
      return '';
    }
    var readEls = readout.map(function (o) { var s = document.createElement('span'); s.className = 'rd'; readBox.appendChild(s); return { s: s, o: o }; });

    function vsegInfo() {
      var v = spec.vseg, x = val(v.x), a = yOn(spec.lines[v.between[0]], x), b = yOn(spec.lines[v.between[1]], x);
      return { x: x, ya: a, yb: b, len: Math.abs(a - b) };
    }

    function update() {
      lineEls.forEach(function (o) {
        var q = lineOf(o.L), c;
        if (q.vert) c = clip(q.x, yr[0], q.x, yr[1], rect);
        else if (o.L.x1 !== undefined) c = clip(o.L.x1, q.m * o.L.x1 + q.b, o.L.x2, q.m * o.L.x2 + q.b, rect);
        else c = clip(rect.x0, q.m * rect.x0 + q.b, rect.x1, q.m * rect.x1 + q.b, rect);
        if (!c) { o.e.style.display = 'none'; if (o.n) o.n.style.display = 'none'; return; }
        o.e.style.display = ''; o.e.setAttribute('x1', sx(c[0])); o.e.setAttribute('y1', sy(c[1])); o.e.setAttribute('x2', sx(c[2])); o.e.setAttribute('y2', sy(c[3]));
        if (o.n && !q.vert) {
          var nx = o.L.nx !== undefined ? o.L.nx : xr[1] - 0.6, ny = q.m * nx + q.b;
          if (ny < yr[0] + 0.3 || ny > yr[1] - 0.3) { var nx2 = q.m ? (ny > yr[1] - 0.3 ? (yr[1] - 0.8 - q.b) / q.m : (yr[0] + 0.8 - q.b) / q.m) : nx; nx = Math.max(xr[0] + 0.4, Math.min(xr[1] - 0.4, nx2)); ny = q.m * nx + q.b; }
          o.n.style.display = '';
          o.n.setAttribute('x', sx(nx) + (o.L.dx !== undefined ? o.L.dx : 0)); o.n.setAttribute('y', sy(ny) + (o.L.dy !== undefined ? o.L.dy : ((o.L.side || 1) > 0 ? -12 : 20)));
        } else if (o.n) o.n.style.display = 'none';
      });
      if (triEl) {
        var tq = lineOf(spec.lines[spec.tri.line || 0]);
        if (!tq.vert && tq.m !== 0 && tq.b !== 0) {
          var tx0 = -tq.b / tq.m;
          triEl.setAttribute('points', [sx(0) + ',' + sy(0), sx(tx0) + ',' + sy(0), sx(0) + ',' + sy(tq.b)].join(' ')); triEl.style.display = '';
        } else triEl.style.display = 'none';
      }
      if (vsegEl) {
        var t = vsegInfo();
        vsegEl.setAttribute('x1', sx(t.x)); vsegEl.setAttribute('x2', sx(t.x)); vsegEl.setAttribute('y1', sy(t.ya)); vsegEl.setAttribute('y2', sy(t.yb));
        vdotA.setAttribute('cx', sx(t.x)); vdotA.setAttribute('cy', sy(t.ya)); vdotB.setAttribute('cx', sx(t.x)); vdotB.setAttribute('cy', sy(t.yb));
      }
      drags.forEach(function (d) {
        var p = D[d.id], e = dragEls[d.id];
        e.c.setAttribute('cx', sx(p.x)); e.c.setAttribute('cy', sy(p.y));
        if (e.lab) { var oo = OFF[d.pos || 'tr']; e.lab.setAttribute('x', sx(p.x) + oo[0] + (oo[2] === 'start' ? 6 : oo[2] === 'end' ? -6 : 0)); e.lab.setAttribute('y', sy(p.y) + oo[1]); e.lab.setAttribute('text-anchor', oo[2]); }
        e.c.setAttribute('aria-valuetext', '(' + fmt(p.x) + ' ; ' + fmt(p.y) + ')');
      });
      calc.forEach(function (c) {
        var A = D[c.mix[0]], B = D[c.mix[1]], k = val(c.k), n = val(c.n);
        D[c.id] = { x: (n * A.x + k * B.x) / (n + k), y: (n * A.y + k * B.y) / (n + k) };
        var e = calcEls[c.id], P = D[c.id]; e.c.setAttribute('cx', sx(P.x)); e.c.setAttribute('cy', sy(P.y));
        if (e.lab) { var o2 = OFF[c.pos || 'tr']; e.lab.setAttribute('x', sx(P.x) + o2[0] + (o2[2] === 'start' ? 6 : o2[2] === 'end' ? -6 : 0)); e.lab.setAttribute('y', sy(P.y) + o2[1]); e.lab.setAttribute('text-anchor', o2[2]); }
      });
      feet.forEach(function (o) {
        var P = D[o.f.id], F = footOf(o.f.id, o.f.line);
        o.s.setAttribute('x1', sx(P.x)); o.s.setAttribute('y1', sy(P.y)); o.s.setAttribute('x2', sx(F.x)); o.s.setAttribute('y2', sy(F.y));
        o.p.setAttribute('cx', sx(F.x)); o.p.setAttribute('cy', sy(F.y));
      });
      readEls.forEach(function (r) { r.s.innerHTML = readText(r.o); });
    }

    /* ---------- dragging ---------- */
    function snapv(v, s) { return s ? Math.round(v / s) * s : v; }
    function place(d, x, y) {
      var p = D[d.id];
      if (d.lock === 'y') { p.x = Math.max(d.min !== undefined ? d.min : xr[0] + 0.3, Math.min(d.max !== undefined ? d.max : xr[1] - 0.3, snapv(x, d.snap))); p.y = d.y; }
      else if (d.lock === 'x') { p.y = Math.max(d.min !== undefined ? d.min : yr[0] + 0.3, Math.min(d.max !== undefined ? d.max : yr[1] - 0.3, snapv(y, d.snap))); p.x = d.x; }
      else if (d.on !== undefined) {
        var L = spec.lines[d.on], xx = Math.max(xr[0] + 0.2, Math.min(xr[1] - 0.2, snapv(x, d.snap))), yy = yOn(L, xx);
        if (yy > yr[1] - 0.2 || yy < yr[0] + 0.2) { return; }
        p.x = xx; p.y = yy;
      } else {
        p.x = Math.max(xr[0] + 0.2, Math.min(xr[1] - 0.2, snapv(x, d.snap))); p.y = Math.max(yr[0] + 0.2, Math.min(yr[1] - 0.2, snapv(y, d.snap)));
      }
      p.x = r2(p.x); p.y = r2(p.y);
    }
    function toData(ev) {
      var b = svg.getBoundingClientRect(), k = W / b.width;
      return { x: xr[0] + ((ev.clientX - b.left) * k - ML) / ux, y: yr[1] - ((ev.clientY - b.top) * k - MT) / uy };
    }
    drags.forEach(function (d) {
      if (d.fixed) return;
      var c = dragEls[d.id].c, active = false;
      c.addEventListener('pointerdown', function (ev) { active = true; try { c.setPointerCapture(ev.pointerId); } catch (e) { } c.classList.add('on'); ev.preventDefault(); });
      c.addEventListener('pointermove', function (ev) { if (!active) return; var q = toData(ev); place(d, q.x, q.y); update(); fireChange(); });
      var stop = function () { active = false; c.classList.remove('on'); };
      c.addEventListener('pointerup', stop); c.addEventListener('pointercancel', stop);
      c.addEventListener('keydown', function (ev) {
        var s = d.snap || 0.5, dx = 0, dy = 0;
        if (ev.key === 'ArrowRight') dx = s; else if (ev.key === 'ArrowLeft') dx = -s; else if (ev.key === 'ArrowUp') dy = s; else if (ev.key === 'ArrowDown') dy = -s; else return;
        ev.preventDefault(); var p = D[d.id]; place(d, p.x + dx, p.y + dy); update(); fireChange();
      });
      if (d.on !== undefined || d.lock) place(d, D[d.id].x, D[d.id].y);
    });

    /* ---------- sliders ---------- */
    var ctl = null;
    if (Object.keys(pdef).length) {
      ctl = document.createElement('div'); ctl.className = 'fig-ctl';
      Object.keys(pdef).forEach(function (k) {
        var P = pdef[k]; if (P.hidden) return;
        var lab = document.createElement('label'); lab.className = 'sl';
        var nm = document.createElement('span'); nm.className = 'sl-n'; nm.textContent = P.label || k;
        var inp = document.createElement('input'); inp.type = 'range'; inp.min = P.min; inp.max = P.max; inp.step = P.step || 1; inp.value = P.val; inp.setAttribute('data-param', k); inp.setAttribute('aria-label', P.label || k);
        var out = document.createElement('output'); out.className = 'sl-v'; out.textContent = fmt(P.val);
        inp.addEventListener('input', function () { Pm[k] = parseFloat(inp.value); out.textContent = fmt(Pm[k]); update(); fireChange(); });
        lab.appendChild(nm); lab.appendChild(inp); lab.appendChild(out); ctl.appendChild(lab);
      });
    }
    var rst = document.createElement('button'); rst.type = 'button'; rst.className = 'btn small ghost fig-reset'; rst.textContent = 'איפוס';
    rst.addEventListener('click', function () {
      Object.keys(pdef).forEach(function (k) { Pm[k] = pdef[k].val; var i2 = fig.querySelector('input[data-param="' + k + '"]'); if (i2) { i2.value = pdef[k].val; i2.nextSibling.textContent = fmt(pdef[k].val); } });
      drags.forEach(function (d) { D[d.id] = { x: d.x, y: d.y }; if (d.on !== undefined || d.lock) place(d, d.x, d.y); });
      update(); fireChange(true);
    });

    host.appendChild(svg);
    if (readEls.length) host.appendChild(readBox);
    var tools = document.createElement('div'); tools.className = 'fig-ctl-row';
    if (ctl) tools.appendChild(ctl);
    if (ctl || drags.length) { tools.appendChild(rst); host.appendChild(tools); }
    update();

    /* ---------- goal + API ---------- */
    function cmp(v, c, tol) {
      if ('eq' in c && Math.abs(v - c.eq) > tol) return false;
      if ('gt' in c && !(v > c.gt)) return false;
      if ('lt' in c && !(v < c.lt)) return false;
      return true;
    }
    function ok(g) {
      if (!g) return false;
      if (g.any) return g.any.some(ok);
      if (g.all) return g.all.every(ok);
      if (g.params) return Object.keys(g.params).every(function (k) { return cmp(Pm[k], g.params[k], (pdef[k].step || 1) / 2 + 1e-9); });
      if (g.line) { var q = lineOf(spec.lines[g.line.i || 0]); if (q.vert) return false; return Math.abs(q.m - g.line.m) < 0.06 && Math.abs(q.b - g.line.b) < 0.06; }
      if (g.dist) return Math.abs(distTo(g.dist.id, g.dist.line || 0) - g.dist.eq) < (g.dist.tol || 0.06);
      if (g.drag) return Object.keys(g.drag).every(function (id) { var c = g.drag[id]; return (!('x' in c) || Math.abs(D[id].x - c.x) < 0.06) && (!('y' in c) || Math.abs(D[id].y - c.y) < 0.06); });
      return false;
    }
    var changeCbs = [];
    function fireChange(reset) { fig.dispatchEvent(new CustomEvent('figchange', { bubbles: true, detail: { reset: !!reset } })); }
    fig._api = {
      check: function () { return ok(spec.goal); },
      reveal: function (part) { var g = layerG[part]; if (g) g.classList.remove('is-hidden'); },
      hide: function (part) { var g = layerG[part]; if (g) g.classList.add('is-hidden'); },
      setParam: function (k, v) { Pm[k] = v; var i2 = fig.querySelector('input[data-param="' + k + '"]'); if (i2) { i2.value = v; i2.nextSibling.textContent = fmt(v); } update(); },
      setDrag: function (id, x, y) { place(dragDef[id], x, y); update(); },
      state: function () { return { params: JSON.parse(JSON.stringify(Pm)), drags: JSON.parse(JSON.stringify(D)) }; },
      hasGoal: !!spec.goal, hint: spec.goalHint || ''
    };
  }

  window.Figs = {
    renderAll: function (root) { Array.prototype.forEach.call((root || document).querySelectorAll('.fig[data-fig]'), build); },
    api: function (fig) { return fig && fig._api; },
    reveal: function (fig, part) { if (fig && fig._api) fig._api.reveal(part); }
  };
})();
