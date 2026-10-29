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
  function fmt3(v) { v = Math.round(v * 1000) / 1000; if (Object.is(v, -0)) v = 0; return String(v).replace('-', '−'); }
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
    if (spec.gallery) return buildGallery(fig, host, spec);
    host.innerHTML = '';
    var old = fig.querySelectorAll('.fig-ctl, .fig-read'); Array.prototype.forEach.call(old, function (n) { n.parentNode.removeChild(n); });

    var xr = spec.xr, yr = spec.yr, xs = xr[1] - xr[0], ys = yr[1] - yr[0];
    var ML = 34, MR = 36, MT = 22, MB = 30;
    var ux, uy;
    if (spec.eq === false || (spec.curves && spec.eq !== true)) { ux = Math.min(500 / xs, 90); uy = 300 / ys; }
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

    /* ---------- expression engine (curves, readouts, goals) ---------- */
    var cur = spec.curves || [], calc = spec.calc || [], SC = null, CC = [], fcache = {};
    function scope() {
      var S = {};
      Object.keys(Pm).forEach(function (k) { S[k] = Pm[k]; });
      drags.forEach(function (d) { S[d.id + 'x'] = D[d.id].x; S[d.id + 'y'] = D[d.id].y; });
      for (var fk = 0; fk < 6; fk++) S['C' + fk] = (fitC && fitC[fk]) || 0;
      S.F = cf; S.isEven = function (i) { return parity(i, 1); }; S.isOdd = function (i) { return parity(i, -1); };
      S.abs = Math.abs; S.sqrt = Math.sqrt; S.min = Math.min; S.max = Math.max; S.pow = Math.pow; S.round = Math.round; S.floor = Math.floor; S.PI = Math.PI;
      S.nroots = function (i) { return realRoots(i).length; };
      S.ncross = function (i, k) { return ncount(function (x) { return cf(i, x) - k; }); };
      S.nint = function (i, j) { return ncount(function (x) { return cf(i, x) - cf(j, x); }); };
      S.nturn = function (i) { return nturn(i); };
      S.solved = !!(spec.goal && spec.goal.drag && okDrag(spec.goal)); S.sign = Math.sign; S.rem = function (a, b) { return ((a % b) + b) % b; };
      return S;
    }
    function evx(e, x, S) {
      var f = fcache[e];
      if (!f) { try { f = fcache[e] = new Function('x', 'S', 'with(S){return (' + String(e).replace(/\^/g, '**') + ');}'); } catch (er) { f = fcache[e] = function () { return NaN; }; } }
      return f(x, S || SC || (SC = scope()));
    }
    function coefsOf(i) {
      if (CC[i]) return CC[i];
      var c = cur[i].poly.map(function (e) { return typeof e === 'number' ? e : evx(e, 0, SC); }); return (CC[i] = c);
    }
    function cf(i, x) {
      var c = cur[i]; if (!SC) SC = scope();
      if (c.poly) { var k = coefsOf(i), v = 0; for (var q = 0; q < k.length; q++) v = v * x + k[q]; return v; }
      return evx(c.f, x, SC);
    }
    function parity(i, sgn) {
      for (var q = 1; q <= 24; q++) { var t = q * 0.37; var a = cf(i, t), b = cf(i, -t); if (!isFinite(a) || !isFinite(b)) return false; if (Math.abs(a - sgn * b) > 1e-6 * (1 + Math.abs(a))) return false; }
      return true;
    }
    function ncount(g) {
      var N = 2400, cnt = 0, prev = null, a1 = null, a2 = null, q, x, v;
      for (q = 0; q <= N; q++) {
        x = xr[0] + xs * q / N; v = g(x);
        if (!isFinite(v)) { prev = null; a1 = a2 = null; continue; }
        if (Math.abs(v) < 1e-9) { cnt++; prev = 0; a1 = a2 = null; continue; }
        if (prev === 0) { prev = v; a2 = null; a1 = v; continue; }
        if (prev !== null && ((prev < 0 && v > 0) || (prev > 0 && v < 0))) cnt++;
        else if (a1 !== null && a2 !== null && Math.abs(a1) <= Math.abs(a2) && Math.abs(a1) <= Math.abs(v) && Math.abs(a1) < 1e-3 && ((a2 > 0) === (v > 0)) && ((a1 > 0) === (v > 0))) cnt++;
        a2 = a1; a1 = v; prev = v;
      }
      return cnt;
    }
    function nturn(i) {
      var N = 2400, c = 0, lastS = 0, q, d, sg, p0 = cf(i, xr[0]);
      for (q = 1; q <= N; q++) { var v = cf(i, xr[0] + xs * q / N); d = v - p0; p0 = v; if (!isFinite(d) || Math.abs(d) < 1e-12) continue; sg = d > 0 ? 1 : -1; if (lastS && sg !== lastS) c++; lastS = sg; }
      return c;
    }
    function okDrag(g) { return Object.keys(g.drag).every(function (id) { var c = g.drag[id]; return D[id] && (!('x' in c) || Math.abs(D[id].x - c.x) < 0.06) && (!('y' in c) || Math.abs(D[id].y - c.y) < 0.06); }); }
    function refresh() { SC = scope(); CC = []; }
    function realRoots(i) {
      var k = coefsOf(i).slice(); while (k.length > 1 && Math.abs(k[0]) < 1e-12) k.shift();
      var n = k.length - 1; if (n < 1) return [];
      var a = k.map(function (v) { return v / k[0]; }), z = [], q, j, it;
      for (q = 0; q < n; q++) { var ang = 0.4 + 2 * Math.PI * q / n, rr = 1 + Math.max.apply(null, a.slice(1).map(Math.abs)); z.push([rr * Math.cos(ang) * 0.7, rr * Math.sin(ang) * 0.7]); }
      function pv(w) { var re = 1, im = 0; for (var t = 1; t <= n; t++) { var nr = re * w[0] - im * w[1] + a[t], ni = re * w[1] + im * w[0]; re = nr; im = ni; } return [re, im]; }
      for (it = 0; it < 600; it++) {
        for (q = 0; q < n; q++) {
          var p = pv(z[q]), dr = 1, di = 0;
          for (j = 0; j < n; j++) if (j !== q) { var xr_ = z[q][0] - z[j][0], xi_ = z[q][1] - z[j][1], nr = dr * xr_ - di * xi_, ni = dr * xi_ + di * xr_; dr = nr; di = ni; }
          var den = dr * dr + di * di; if (den < 1e-30) continue;
          z[q] = [z[q][0] - (p[0] * dr + p[1] * di) / den, z[q][1] - (p[1] * dr - p[0] * di) / den];
        }
      }
      var re = z.filter(function (w) { return Math.abs(w[1]) < 2e-3 * (1 + Math.abs(w[0])); }).map(function (w) { return w[0]; }).sort(function (u, v) { return u - v; });
      var out = [];
      re.forEach(function (r) { var l = out[out.length - 1]; if (l && Math.abs(l.x - r) < 0.02) { l.m++; l.x = (l.x * (l.m - 1) + r) / l.m; } else out.push({ x: r, m: 1 }); });
      return out;
    }

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
    var clipId = 'cl' + Math.random().toString(36).slice(2, 8);
    var defs = el('defs', {}, svg); var cp = el('clipPath', { id: clipId }, defs); el('rect', { x: ML, y: MT, width: PW, height: PH }, cp);
    var gSb = el('g', {}, gDyn);
    var gCur = el('g', { 'clip-path': 'url(#' + clipId + ')' }, gDyn);
    var sbList = spec.signband === undefined ? [] : [].concat(spec.signband);
    var sbEls = sbList.map(function (i0) { return { i: i0, pos: el('path', { 'class': 'svg-sb pos' }, gSb), neg: el('path', { 'class': 'svg-sb neg' }, gSb) }; });
    var vsegEl = null, vdotA = null, vdotB = null, triEl = null;
    if (spec.tri) triEl = el('polygon', { 'class': 'svg-poly shade' }, gDyn);
    if (spec.vseg) {
      vsegEl = el('line', { 'class': 'svg-seg thick' }, gDyn);
      vdotA = el('circle', { r: 4, 'class': 'svg-pt' }, gDyn); vdotB = el('circle', { r: 4, 'class': 'svg-pt' }, gDyn);
    }
    var riseEls = null;
    if (spec.rise) riseEls = { run: el('line', { 'class': 'svg-seg thick run' }, gDyn), up: el('line', { 'class': 'svg-seg thick rise' }, gDyn), end: el('circle', { r: 5, 'class': 'svg-pt' }, gDyn), lr: el('text', { 'class': 'svg-plab run' }, gDyn), lu: el('text', { 'class': 'svg-plab rise' }, gDyn) };
    var lineEls = (spec.lines || []).map(function (L, idx) {
      var e = el('line', { 'class': 'svg-line l' + (L.cls || 0) + (L.dash ? ' dash' : '') }, gDyn);
      var n = null;
      if (L.name) n = el('text', { 'class': 'svg-name l' + (L.cls || 0) }, gDyn), n.textContent = L.name;
      return { e: e, n: n, L: L };
    });
    var curEls = cur.map(function (C, idx) {
      var e = el('path', { 'class': 'svg-line svg-curve l' + (C.cls || 0) + (C.dash ? ' dash' : '') + (C.ghost ? ' ghost' : '') }, gCur);
      var n = null; if (C.name) { n = el('text', { 'class': 'svg-name l' + (C.cls || 0) }, gDyn); n.textContent = C.name; }
      return { e: e, n: n, C: C };
    });
    var cptEls = (spec.cpts || []).map(function (P) {
      var c = el('circle', { r: 5, 'class': 'svg-pt' + (P.cls ? ' ' + P.cls : '') }, gDyn), l = P.t ? el('text', { 'class': 'svg-plab' }, gDyn) : null; if (l) l.textContent = P.t;
      return { c: c, l: l, P: P };
    });
    var calcEls = {};
    calc.forEach(function (c) {
      var ce = el('circle', { r: 5.4, 'class': 'svg-pt calc' }, gDyn), cl = c.t ? el('text', { 'class': 'svg-plab' }, gDyn) : null; if (cl) cl.textContent = c.t;
      calcEls[c.id] = { c: ce, lab: cl }; D[c.id] = { x: 0, y: 0 };
    });
    var feet = (spec.foot || []).map(function (f) {
      return { f: f, s: el('line', { 'class': 'svg-seg dash' }, gDyn), p: el('circle', { r: 3.6, 'class': 'svg-pt' }, gDyn) };
    });

    /* ---------- free anonymous points (sketch products) ---------- */
    var lastStroke = [], keepElRef = null, freeMode = !!(spec.sk && spec.sk.free), FP = [], gFree = freeMode ? el('g', {}, gDyn) : null, fpRows = null, fpBody = null;
    function fpBasis() { return spec.sk.basis.map(function (e) { var f = null; try { f = new Function('x', 'with(Math){return (' + String(e).replace(/\^/g, '**') + ');}'); } catch (er) { f = function () { return NaN; }; } return f; }); }
    function fpTouched() { return FP.filter(function (q) { return q.touched; }); }
    /* key points that must be present (within a narrow tolerance): sk.need = [[x,y],...] */
    function needTol() { return 0.06; }
    function needMiss() { var N = (spec.sk && spec.sk.need) || [], T = fpTouched(); return N.filter(function (n) { return !T.some(function (q) { return Math.abs(q.x - n[0]) <= needTol() && Math.abs(q.y - n[1]) <= needTol(); }); }); }
    function nMinPts() { var K0 = spec.sk; return Math.max(K0.basis.length, (K0.need || []).length); }
    /* least squares fit of the basis to the entered points; null when the points do not determine the curve */
    function doFit() {
      if (!freeMode) return null;
      var B = fpBasis(), n = B.length, pts = fpTouched(); if (pts.length < n) return null;
      var A = [], r, c, k, i2;
      for (r = 0; r < n; r++) { A.push([]); for (c = 0; c <= n; c++) A[r].push(0); }
      pts.forEach(function (q) { var v = B.map(function (f) { return f(q.x); }); for (r = 0; r < n; r++) { for (c = 0; c < n; c++) A[r][c] += v[r] * v[c]; A[r][n] += v[r] * q.y; } });
      for (i2 = 0; i2 < n; i2++) {
        var pv = i2; for (r = i2 + 1; r < n; r++) if (Math.abs(A[r][i2]) > Math.abs(A[pv][i2])) pv = r;
        if (Math.abs(A[pv][i2]) < 1e-9) return null;
        var tmp = A[i2]; A[i2] = A[pv]; A[pv] = tmp;
        for (r = 0; r < n; r++) if (r !== i2) { var m = A[r][i2] / A[i2][i2]; for (c = i2; c <= n; c++) A[r][c] -= m * A[i2][c]; }
      }
      var co = A.map(function (row, ix) { return row[n] / row[ix]; }), res = 0;
      pts.forEach(function (q) { var v = 0; for (k = 0; k < n; k++) v += co[k] * B[k](q.x); res = Math.max(res, Math.abs(v - q.y)); });
      return { c: co, res: res };
    }

    var fpSeq = 0;
    function numInput(ph) {
      var w = document.createElement('span'); w.className = 'negwrap';
      var sg = document.createElement('button'); sg.type = 'button'; sg.className = 'sk-sg'; sg.textContent = '±'; sg.setAttribute('aria-label', 'הפוך סימן');
      var i = document.createElement('input'); i.type = 'text'; i.setAttribute('inputmode', 'decimal'); i.setAttribute('dir', 'ltr'); i.placeholder = ph || '?'; i.autocomplete = 'off';
      sg.addEventListener('click', function () { var v = i.value.trim(); i.value = v.charAt(0) === '-' ? v.slice(1) : (v ? '-' + v : '-'); i.dispatchEvent(new Event('input', { bubbles: true })); i.focus(); });
      w.appendChild(sg); w.appendChild(i); return { w: w, i: i };
    }
    function numOf(i) { var t = String(i.value).replace(',', '.').replace('−', '-').trim(); if (!t || t === '-' || t === '.') return NaN; var v = Number(t); return isFinite(v) ? v : NaN; }
    function fpAdd(x, y) {
      var q = { x: 0, y: 0, touched: false }, n = FP.length;
      if (x === null || x === undefined) { q.x = r2(xr[0] + xs * (0.1 + 0.15 * (n % 6))); q.y = r2(yr[1] - 0.12 * ys); }
      else { q.x = r2(x); q.y = r2(y); q.touched = true; }
      q.g = el('g', {}, gFree);
      q.c = el('circle', { r: 8, 'class': 'svg-fp', tabindex: 0, role: 'slider', 'aria-label': 'נקודה (גררו או השתמשו בחצים)' }, q.g);
      q.lab = el('text', { 'class': 'svg-plab live' }, q.g);
      q.hit = el('circle', { r: 26, 'class': 'svg-fphit' }, q.g);
      var act = false;
      function mv(nx, ny) {
        q.x = r2(Math.max(xr[0] + 0.1, Math.min(xr[1] - 0.1, Math.round(nx * 4) / 4))); q.y = r2(Math.max(yr[0] + 0.1, Math.min(yr[1] - 0.1, Math.round(ny * 4) / 4)));
        q.touched = true; update(); fireChange();
      }
      q.hit.addEventListener('pointerdown', function (ev) { act = true; try { q.hit.setPointerCapture(ev.pointerId); } catch (e) { } q.c.classList.add('on'); ev.preventDefault(); });
      q.hit.addEventListener('pointermove', function (ev) { if (!act) return; var d = toData(ev); mv(d.x, d.y); });
      var stop = function () { act = false; q.c.classList.remove('on'); };
      q.hit.addEventListener('pointerup', stop); q.hit.addEventListener('pointercancel', stop);
      ['touchstart', 'touchmove'].forEach(function (tn) { q.hit.addEventListener(tn, function (ev) { ev.preventDefault(); }, { passive: false }); });
      q.c.addEventListener('keydown', function (ev) {
        var dx = 0, dy = 0; if (ev.key === 'ArrowRight') dx = 0.25; else if (ev.key === 'ArrowLeft') dx = -0.25; else if (ev.key === 'ArrowUp') dy = 0.25; else if (ev.key === 'ArrowDown') dy = -0.25; else return;
        ev.preventDefault(); mv(q.x + dx, q.y + dy);
      });
      var row = document.createElement('div'); row.className = 'sk-row';
      var ix = numInput('x'), iy = numInput('y'), del = document.createElement('button');
      del.type = 'button'; del.className = 'sk-del'; del.textContent = '✕'; del.setAttribute('aria-label', 'מחק נקודה');
      function typed() { var vx = numOf(ix.i), vy = numOf(iy.i); if (isFinite(vx) && isFinite(vy)) { q.x = r2(vx); q.y = r2(vy); q.touched = true; update(); fireChange(); } }
      ix.i.addEventListener('input', typed); iy.i.addEventListener('input', typed);
      del.addEventListener('click', function () { q.g.remove(); row.remove(); FP.splice(FP.indexOf(q), 1); update(); fireChange(); });
      row.appendChild(ix.w); row.appendChild(iy.w); row.appendChild(del);
      q.row = row; q.ix = ix.i; q.iy = iy.i;
      if (fpBody) fpBody.appendChild(row);
      FP.push(q); update(); fireChange();
      return q;
    }
    function fpRender() {
      FP.forEach(function (q) {
        var vis = q.x >= xr[0] - 1e-9 && q.x <= xr[1] + 1e-9 && q.y >= yr[0] - 1e-9 && q.y <= yr[1] + 1e-9;
        q.g.style.display = vis ? '' : 'none';
        q.c.setAttribute('cx', sx(q.x)); q.c.setAttribute('cy', sy(q.y)); q.hit.setAttribute('cx', sx(q.x)); q.hit.setAttribute('cy', sy(q.y));
        q.c.classList.toggle('idle', !q.touched);
        q.lab.textContent = q.touched ? '(' + fmt3(q.x) + ' ; ' + fmt3(q.y) + ')' : '';
        q.lab.setAttribute('x', sx(q.x) + 12); q.lab.setAttribute('y', sy(q.y) - 12); q.lab.setAttribute('text-anchor', q.x > xr[1] - 0.25 * xs ? 'end' : 'start');
        if (q.touched) { if (document.activeElement !== q.ix) q.ix.value = String(q.x); if (document.activeElement !== q.iy) q.iy.value = String(q.y); }
      });
      skStatus();
    }
    var skStatEl = null, skStatTimer = null;
    /* live status line of a sketch product: how many points / key points were entered */
    function skStatus() {
      if (!skStatEl || !freeMode) return;
      var K0 = spec.sk, N = K0.need || [], nt = fpTouched().length, nb = nMinPts(), miss = needMiss().length, rdy = !!doFit() && !miss, t;
      if (rdy) t = N.length ? 'הנקודות מדויקות. אפשר ללחוץ "העבר גרף", או לצייר קו דרכן בציור חופשי.' : 'הוזנו מספיק נקודות. אפשר ללחוץ "העבר גרף", או לצייר קו דרכן בציור חופשי.';
      else {
        t = 'הוזנו ' + nt + ' נקודות' + (nt < nb ? ' (נדרשות לפחות ' + nb + ')' : '');
        if (N.length) t += '. נקודות מפתח: ' + (N.length - miss) + ' מתוך ' + N.length + (miss && K0.needMsg ? '. ' + K0.needMsg : '');
      }
      skStatEl.textContent = t; skStatEl.className = 'sk-st' + (rdy ? ' ok' : '');
    }
    function fpClear() { FP.forEach(function (q) { q.g.remove(); }); FP = []; if (fpBody) fpBody.innerHTML = ''; }
    var dragEls = {};
    var curveHidden = !!spec.hideCurve, prov = {}, fitC = [];
    drags.forEach(function (d) {
      if (d.fixed) {
        var fc = el('circle', { r: 5, 'class': 'svg-pt' }, gDyn);
        var fl = (d.t || d.coords) ? el('text', { 'class': 'svg-plab' + (d.coords ? ' live' : '') }, gDyn) : null; if (fl && d.t) fl.textContent = d.t;
        dragEls[d.id] = { c: fc, lab: fl }; return;
      }
      var c = el('circle', { r: 9, 'class': 'svg-drag', tabindex: 0, role: 'slider', 'aria-label': 'נקודה ' + (d.t || d.id) + ' (גררו או השתמשו בחצים)' }, gDyn);
      var lab = (d.t || d.coords) ? el('text', { 'class': 'svg-plab' + (d.coords ? ' live' : '') }, gDyn) : null; if (lab && d.t) lab.textContent = d.t;
      var hit = el('circle', { r: 66, 'class': 'svg-hit' }, gDyn);
      dragEls[d.id] = { c: c, lab: lab, h: hit };
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
      if (o.k === 'rise') {
        var hq = lineOf(spec.lines[spec.rise.line || 0]), hdx = val(spec.rise.dx);
        return L('Δy = m·Δx = ' + fmt(hq.m) + '·' + (hdx < 0 ? '(' + fmt(hdx) + ')' : fmt(hdx)) + ' = ' + fmt(hq.m * hdx));
      }
      if (o.k === 'tpl') return (o.pre ? o.pre + ' ' : '') + L(String(o.tpl).replace(/\{([^}]+)\}/g, function (m, e) { var v = evx(e, 0); return typeof v === 'number' ? fmt(v) : String(v); }));
      if (o.k === 'say') {
        for (var ci = 0; ci < o.cases.length; ci++) if (evx(o.cases[ci]['if'], 0)) return (o.pre ? o.pre + ' ' : '') + String(o.cases[ci].t).replace(/\{([^}]+)\}/g, function (m, e) { return L(fmt(evx(e, 0))); });
        return o.pre || '';
      }
      if (o.k === 'roots') {
        var rts = realRoots(o.curve || 0), cnt = rts.reduce(function (a, r) { return a + r.m; }, 0);
        if (!rts.length) return (o.pre || 'אפסים') + ': אין אפסים ממשיים';
        return (o.pre || 'אפסים') + ': ' + L('x = ' + rts.map(function (r) { return fmt(r.x) + (r.m > 1 ? ' (×' + r.m + ')' : ''); }).join(' ; '));
      }
      if (o.k === 'tbl') {
        var fm = function (v) { return !isFinite(v) ? '—' : Math.abs(v) >= 1e7 ? v.toExponential(2).replace('e+', '·10^').replace('-', '−') : fmt(v); };
        var th = '<table class="rd-tbl" dir="ltr"><tr><th>x</th>' + o.xs.map(function (xx) { return '<td>' + fmt(xx) + '</td>'; }).join('') + '</tr>';
        o.rows.forEach(function (rw) { th += '<tr><th>' + String(rw.name).replace(/\{([^}]+)\}/g, function (m, e) { return fmt(evx(e, 0)); }) + '</th>' + o.xs.map(function (xx) { return '<td>' + fm(cf(rw.i, xx)) + '</td>'; }).join('') + '</tr>'; });
        return th + '</table>';
      }
      if (o.k === 'len') { var t = vsegInfo(); return 'אורך הקטע: ' + L(fmt(t.len)); }
      if (o.k === 'cmp') { var t2 = vsegInfo(); var a = t2.ya, b = t2.yb; var rel = Math.abs(a - b) < 0.005 ? '=' : (a > b ? '>' : '<'); var nm = spec.cmpNames || ['f', 'g']; return L(nm[0] + '(' + (spec.vseg.x || 'x') + ') ' + rel + ' ' + nm[1] + '(' + (spec.vseg.x || 'x') + ')'); }
      if (o.k === 'sign') { var yy = D[o.id].y; return yy > 0.005 ? L('y > 0') + ': הפונקציה חיובית' : yy < -0.005 ? L('y < 0') + ': הפונקציה שלילית' : L('y = 0') + ': אפס הפונקציה'; }
      return '';
    }
    var readEls = readout.map(function (o) { var s = document.createElement('span'); s.className = 'rd' + (o.k === 'tbl' ? ' rd-wide' : ''); readBox.appendChild(s); return { s: s, o: o }; });

    function vsegInfo() {
      var v = spec.vseg, x = val(v.x), a = yOn(spec.lines[v.between[0]], x), b = yOn(spec.lines[v.between[1]], x);
      return { x: x, ya: a, yb: b, len: Math.abs(a - b) };
    }

    function drawCurves() {
      if (typeof syncSk === 'function') syncSk();
      if (freeMode) fpRender();
      if (freeMode && !curveHidden) { var ft0 = doFit(); if (ft0) { fitC = ft0.c; SC = scope(); CC = []; } }
      curEls.forEach(function (o, i) {
        var N = 420, d = '', pen = false, q, x, y, big = 3 * ys + Math.abs(yr[0]) + Math.abs(yr[1]);
        var hid = (curveHidden && !o.C.ghost) || o.C.hide || (o.C.showIf && !evx(o.C.showIf, 0));
        o.e.style.display = hid ? 'none' : ''; if (hid) { if (o.n) o.n.style.display = 'none'; return; }
        for (q = 0; q <= N; q++) {
          x = xr[0] + xs * q / N; y = cf(i, x);
          if (!isFinite(y) || (o.C.dom && (x < o.C.dom[0] - 1e-9 || x > o.C.dom[1] + 1e-9))) { pen = false; continue; }
          y = Math.max(-big, Math.min(big, y));
          d += (pen ? 'L' : 'M') + sx(x).toFixed(1) + ' ' + sy(y).toFixed(1); pen = true;
        }
        o.e.setAttribute('d', d);
        if (o.n) {
          var nx = o.C.nx !== undefined ? o.C.nx : xr[1] - 0.6, ny = cf(i, nx), tries = 0;
          if (!(ny >= yr[0] + 0.5 && ny <= yr[1] - 0.5)) {
            var best = null, bd = 1e9;
            for (q = 0; q <= 200; q++) { x = xr[0] + 0.3 + (xs - 0.6) * q / 200; y = cf(i, x); if (y >= yr[0] + 0.6 && y <= yr[1] - 0.6 && Math.abs(x - nx) < bd) { bd = Math.abs(x - nx); best = x; } }
            if (best === null) { o.n.style.display = 'none'; return; } nx = best; ny = cf(i, nx);
          }
          o.n.style.display = ''; o.n.setAttribute('x', sx(nx) + (o.C.dx || 0)); o.n.setAttribute('y', sy(ny) + (o.C.dy !== undefined ? o.C.dy : -12));
        }
      });
      sbEls.forEach(function (o) {
        var N = 600, dp = '', dn = '', run = null, q, x, v, y0 = sy(0);
        function flush(end) { if (!run) return; var seg = 'M' + sx(run.a).toFixed(1) + ' ' + y0.toFixed(1) + 'H' + sx(end).toFixed(1); if (run.s > 0) dp += seg; else dn += seg; run = null; }
        for (q = 0; q <= N; q++) {
          x = xr[0] + xs * q / N; v = cf(o.i, x); var sg = !isFinite(v) || Math.abs(v) < 1e-9 ? 0 : (v > 0 ? 1 : -1);
          if (run && run.s !== sg) flush(x);
          if (!run && sg !== 0) run = { a: x, s: sg };
        }
        flush(xr[1]); o.pos.setAttribute('d', dp); o.neg.setAttribute('d', dn);
      });
      cptEls.forEach(function (o) {
        var px = typeof o.P.x === 'number' ? o.P.x : evx(o.P.x), py = o.P.y !== undefined ? (typeof o.P.y === 'number' ? o.P.y : evx(o.P.y)) : cf(o.P.curve || 0, px);
        var vis = isFinite(py) && px >= xr[0] && px <= xr[1] && py >= yr[0] - 0.01 && py <= yr[1] + 0.01;
        o.c.style.display = vis ? '' : 'none'; if (o.l) o.l.style.display = vis ? '' : 'none';
        if (!vis) return;
        o.c.setAttribute('cx', sx(px)); o.c.setAttribute('cy', sy(py));
        if (o.l) { var oo = OFF[o.P.pos || 'tr']; o.l.setAttribute('x', sx(px) + oo[0] + (oo[2] === 'start' ? 6 : oo[2] === 'end' ? -6 : 0)); o.l.setAttribute('y', sy(py) + oo[1]); o.l.setAttribute('text-anchor', oo[2]); }
      });
    }
    function update() {
      refresh();
      drags.forEach(function (d) { if (d.onc !== undefined) { var p0 = D[d.id]; if (d.follow && D[d.follow]) p0.x = D[d.follow].x; var yy = cf(d.onc, p0.x); if (isFinite(yy)) p0.y = yy; refresh(); } });
      drawCurves();
      drags.forEach(function (d) {
        if (d.on === undefined || d.lock) return;
        var Ld = spec.lines[d.on]; if (!Ld || Ld.thru) return;
        var q0 = lineOf(Ld); if (q0.vert) return;
        var p0 = D[d.id], yy = q0.m * p0.x + q0.b, lo = yr[0] + 0.3, hi = yr[1] - 0.3;
        if (q0.m !== 0 && (yy < lo || yy > hi)) { yy = Math.max(lo, Math.min(hi, yy)); p0.x = (yy - q0.b) / q0.m; }
        p0.y = yy;
      });
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
      if (riseEls) { var qd = dragDef[spec.rise.id]; if (qd) qd.pos = val(spec.rise.dx) >= 0 ? 'tl' : 'tr';
        var rq = lineOf(spec.lines[spec.rise.line || 0]), rp = D[spec.rise.id], rdx = val(spec.rise.dx), rdy = rq.m * rdx, rx2 = rp.x + rdx, ry2 = rp.y + rdy;
        riseEls.run.setAttribute('x1', sx(rp.x)); riseEls.run.setAttribute('y1', sy(rp.y)); riseEls.run.setAttribute('x2', sx(rx2)); riseEls.run.setAttribute('y2', sy(rp.y));
        riseEls.up.setAttribute('x1', sx(rx2)); riseEls.up.setAttribute('y1', sy(rp.y)); riseEls.up.setAttribute('x2', sx(rx2)); riseEls.up.setAttribute('y2', sy(ry2));
        riseEls.end.setAttribute('cx', sx(rx2)); riseEls.end.setAttribute('cy', sy(ry2));
        riseEls.lr.textContent = 'Δx = ' + fmt(rdx); riseEls.lr.setAttribute('x', sx(rp.x + rdx / 2)); riseEls.lr.setAttribute('y', sy(rp.y) + (rdy >= 0 ? 24 : -12)); riseEls.lr.setAttribute('text-anchor', 'middle');
        riseEls.lu.textContent = 'Δy = ' + fmt(rdy); riseEls.lu.setAttribute('x', sx(rx2) + (rdx >= 0 ? 8 : -8)); riseEls.lu.setAttribute('y', sy(rp.y + rdy / 2) + 5); riseEls.lu.setAttribute('text-anchor', rdx >= 0 ? 'start' : 'end');
      }
      drags.forEach(function (d) {
        var p = D[d.id], e = dragEls[d.id];
        e.c.setAttribute('cx', sx(p.x)); e.c.setAttribute('cy', sy(p.y));
        if (e.h) { e.h.setAttribute('cx', sx(p.x)); e.h.setAttribute('cy', sy(p.y)); }
        if (e.lab && d.coords) e.lab.textContent = '(' + fmt3(p.x) + ' ; ' + fmt3(p.y) + ')';
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
    /* continuous drag that "sticks" to integers and halves when the finger passes close to them */
    function magnet(v, d) { var m = Math.round(v * 2) / 2, tol = (Math.abs(m - Math.round(m)) < 1e-9 ? 0.028 : 0.016) * (xr[1] - xr[0]); return Math.abs(v - m) <= tol ? m : v; }
    function place(d, x, y) {
      var p = D[d.id];
      if (d.lock === 'y') { p.x = Math.max(d.min !== undefined ? d.min : xr[0] + 0.3, Math.min(d.max !== undefined ? d.max : xr[1] - 0.3, snapv(x, d.snap))); p.y = d.y; }
      else if (d.lock === 'x') { p.y = Math.max(d.min !== undefined ? d.min : yr[0] + 0.3, Math.min(d.max !== undefined ? d.max : yr[1] - 0.3, snapv(y, d.snap))); p.x = d.x; }
      else if (d.onc !== undefined) {
        refresh(); var xc = Math.max(d.min !== undefined ? d.min : xr[0] + 0.2, Math.min(d.max !== undefined ? d.max : xr[1] - 0.2, d.coords ? magnet(x, d) : snapv(x, d.snap))), yc = cf(d.onc, xc);
        if (!isFinite(yc) || yc > yr[1] - 0.2 || yc < yr[0] + 0.2) { return; }
        p.x = xc; p.y = yc;
      }
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
      var c = dragEls[d.id].c, h = dragEls[d.id].h || c, active = false;
      h.addEventListener('pointerdown', function (ev) { active = true; try { h.setPointerCapture(ev.pointerId); } catch (e) { } c.classList.add('on'); ev.preventDefault(); });
      h.addEventListener('pointermove', function (ev) { if (!active) return; var q = toData(ev); place(d, q.x, q.y); prov[d.id] = true; update(); fireChange(); });
      var stop = function () { active = false; c.classList.remove('on'); };
      ['touchstart', 'touchmove'].forEach(function (tn) { h.addEventListener(tn, function (ev) { ev.preventDefault(); }, { passive: false }); });
      h.addEventListener('pointerup', stop); h.addEventListener('pointercancel', stop);
      c.addEventListener('keydown', function (ev) {
        var s = d.snap || 0.5, dx = 0, dy = 0;
        if (ev.key === 'ArrowRight') dx = s; else if (ev.key === 'ArrowLeft') dx = -s; else if (ev.key === 'ArrowUp') dy = s; else if (ev.key === 'ArrowDown') dy = -s; else return;
        ev.preventDefault(); var p = D[d.id]; place(d, p.x + dx, p.y + dy); prov[d.id] = true; update(); fireChange();
      });
      if (d.on !== undefined || d.onc !== undefined || d.lock) place(d, D[d.id].x, D[d.id].y);
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
      drags.forEach(function (d) { D[d.id] = { x: d.x, y: d.y }; if (d.on !== undefined || d.onc !== undefined || d.lock) place(d, d.x, d.y); });
      prov = {}; curveHidden = !!spec.hideCurve; if (freeMode) fpClear(); if (skBox) skBox.querySelectorAll('input').forEach(function (i3) { i3.value = ''; });
      update(); fireChange(true);
    });

    host.appendChild(svg);
    if (readEls.length) host.appendChild(readBox);
    var tools = document.createElement('div'); tools.className = 'fig-ctl-row';
    if (ctl) tools.appendChild(ctl);
    if (ctl || drags.length) { tools.appendChild(rst); host.appendChild(tools); }

    /* ---------- sketch panel: the same data can be entered in several ways ---------- */
    var skBox = null, skRows = {};
    function skRaw(id, c, v) {
      var dd = dragDef[id], p = D[id]; if (!dd || !isFinite(v)) return;
      if (c === 'x' && dd.lock !== 'x') p.x = Math.max(dd.min !== undefined ? dd.min : xr[0] + 0.2, Math.min(dd.max !== undefined ? dd.max : xr[1] - 0.2, v));
      else if (c === 'y' && dd.lock !== 'y') p.y = Math.max(dd.min !== undefined ? dd.min : yr[0] + 0.3, Math.min(dd.max !== undefined ? dd.max : yr[1] - 0.3, v));
      p.x = r2(p.x); p.y = r2(p.y); prov[id] = true; update(); fireChange();
    }
    function syncSk() {
      if (!skBox) return;
      Object.keys(skRows).forEach(function (id) { var r = skRows[id]; if (document.activeElement !== r.i) r.i.value = prov[id] ? String(D[id][r.c]) : ''; });
    }
    if (spec.sk && freeMode) {
      var K = spec.sk; skBox = document.createElement('div'); skBox.className = 'sk';
      var mk = function (tag, cls, txt) { var e2 = document.createElement(tag); if (cls) e2.className = cls; if (txt) e2.textContent = txt; return e2; };
      var nmin = nMinPts();
      skBox.appendChild(mk('div', 'sk-t', K.intro || ('בנו את הגרף מנקודות. ' + (nmin === 1 ? 'נדרשת לפחות נקודה אחת.' : 'נדרשות לפחות ' + nmin + ' נקודות.') + ' כשיש מספיק נקודות מופיע הכפתור "העבר גרף".')));
      skStatEl = mk('div', 'sk-st'); skStatEl.setAttribute('aria-live', 'polite'); skBox.appendChild(skStatEl);
      var bt = mk('div', 'sk-w'); bt.appendChild(mk('div', 'sk-wh', 'טבלת ערכים'));
      bt.appendChild(mk('div', 'sk-wd', 'מוסיפים נקודה ומקלידים את x ואת y שלה, או גוררים אותה בשרטוט (נקודה שלא הוזנה מוצגת כעיגול ריק).'));
      var hd = mk('div', 'sk-head'); hd.appendChild(mk('span', 'sk-hc', 'x')); hd.appendChild(mk('span', 'sk-hc', 'y')); hd.appendChild(mk('span', 'sk-hs')); bt.appendChild(hd);
      fpBody = mk('div', 'sk-tbl'); bt.appendChild(fpBody);
      var addb = mk('button', 'btn small sk-go', 'הוסף נקודה'); addb.type = 'button'; addb.addEventListener('click', function () { fpAdd(null, null); });
      bt.appendChild(addb); skBox.appendChild(bt);
      if (K.alg) {
        var b3 = mk('div', 'sk-w'); b3.appendChild(mk('div', 'sk-wh', 'ביטוי אלגברי')); b3.appendChild(mk('div', 'sk-wd', K.algHead || ''));
        var av = {};
        K.alg.forEach(function (a) {
          var lb2 = mk('label', 'sk-r'); lb2.appendChild(mk('span', 'sk-l', a.lab + ' ='));
          var ni = numInput('?'); lb2.appendChild(ni.w); b3.appendChild(lb2); av[a.k] = ni.i;
        });
        var ab = mk('button', 'btn small sk-go', 'הצבה בשרטוט'); ab.type = 'button';
        ab.addEventListener('click', function () {
          var keys = Object.keys(av), vals = keys.map(function (k) { return numOf(av[k]); });
          if (vals.some(function (v) { return !isFinite(v); })) return;
          var out = [];
          for (var ai = 0; ai < K.algPts.length; ai++) {
            var fn = Function.apply(null, keys.concat(['pow', 'abs', 'sqrt', 'return (' + K.algPts[ai] + ');']));
            var pt = fn.apply(null, vals.concat([Math.pow, Math.abs, Math.sqrt])); if (!pt || !isFinite(pt[0]) || !isFinite(pt[1])) return; out.push(pt);
          }
          fpClear(); out.forEach(function (pt) { fpAdd(pt[0], pt[1]); });
        });
        b3.appendChild(ab); skBox.appendChild(b3);
      }
      /* freehand drawing: a stroke through all the entered points (and close to the right shape) draws the graph */
      var bd = mk('div', 'sk-w'); bd.appendChild(mk('div', 'sk-wh', 'ציור חופשי'));
      bd.appendChild(mk('div', 'sk-wd', K.rawStroke ? 'אחרי שהוזנו הנקודות, ציירו באצבע או בעט קו דרכן, משמאל לימין. אפשר לצייר מחדש, והקו האחרון הוא שנשמר.' : 'אחרי שהוזנו הנקודות, אפשר לצייר באצבע או בעט קו דרכן, משמאל לימין. אם הקו עובר בכל הנקודות והצורה נכונה, הגרף מצויר.'));
      var drawBtn = mk('button', 'btn small ghost sk-draw', 'ציור חופשי'); drawBtn.type = 'button'; drawBtn.setAttribute('aria-pressed', 'false'); bd.appendChild(drawBtn);
      if (K.rawStroke) { var clrB = mk('button', 'btn small ghost sk-clr', 'מחיקת הקו'); clrB.type = 'button'; clrB.addEventListener('click', function () { keepEl.setAttribute('d', ''); strokeEl.setAttribute('d', ''); lastStroke = []; fireChange(); }); bd.appendChild(clrB); }
      skBox.appendChild(bd);
      var gDraw = el('g', { 'class': 'svg-drawg' }, svg), ov = el('rect', { x: ML, y: MT, width: PW, height: PH, 'class': 'svg-draw' }, gDraw), strokeEl = el('path', { 'class': 'svg-stroke', d: '' }, gDraw);
      gDraw.style.display = 'none'; svg.insertBefore(gDraw, gDyn); /* שכבת הציור מתחת לנקודות: גרירת נקודה תמיד מזיזה אותה */
      var stroke = [], drawing = false, drawOn = false, keepEl = el('path', { 'class': 'svg-stroke keep', d: '' }, svg); svg.insertBefore(keepEl, gDyn); lastStroke = [];
      function pathOf(arr) { return arr.map(function (z, i) { return (i ? 'L' : 'M') + sx(z.x).toFixed(1) + ' ' + sy(z.y).toFixed(1); }).join(' '); }
      function setDraw(on) { drawOn = on; gDraw.style.display = on ? '' : 'none'; svg.classList.toggle('drawing', on); drawBtn.setAttribute('aria-pressed', on ? 'true' : 'false'); drawBtn.textContent = on ? 'חזרה להזנת נקודות' : 'ציור חופשי'; strokeEl.setAttribute('d', ''); }
      function addPt(ev) { var q = toData(ev); stroke.push(q); strokeEl.setAttribute('d', stroke.map(function (z, i) { return (i ? 'L' : 'M') + sx(z.x).toFixed(1) + ' ' + sy(z.y).toFixed(1); }).join(' ')); }
      function sq(v) { return v * v; }
      function judge() {
        var T = fpTouched(), ft = doFit();
        if (!ft || needMiss().length) return 'קודם הזינו את כל נקודות המפתח, ואחר כך צרו קו דרכן.';
        if (stroke.length < 8) return 'הקו קצר מדי. צרו קו משמאל לימין דרך כל הנקודות.';
        var mnx = Infinity, mxx = -Infinity; stroke.forEach(function (z) { mnx = Math.min(mnx, z.x); mxx = Math.max(mxx, z.x); });
        if (mxx - mnx < 0.6 * xs) return 'הקו צריך לעבור על רוב הגרף, משמאל לימין.';
        var dense = [], i2, j2;
        for (i2 = 1; i2 < stroke.length; i2++) for (j2 = 0; j2 < 12; j2++) dense.push({ x: stroke[i2 - 1].x + (stroke[i2].x - stroke[i2 - 1].x) * j2 / 12, y: stroke[i2 - 1].y + (stroke[i2].y - stroke[i2 - 1].y) * j2 / 12 });
        function nd(a, b) { return Math.sqrt(sq((a.x - b.x) / (0.05 * xs)) + sq((a.y - b.y) / (0.05 * ys))); }
        for (i2 = 0; i2 < T.length; i2++) { var best = Infinity; for (j2 = 0; j2 < dense.length; j2++) best = Math.min(best, nd(dense[j2], T[i2])); if (best > 1) return 'הקו לא עבר דרך כל הנקודות. נסו שוב.'; }
        var B = fpBasis(), curve = [], k2;
        for (k2 = 0; k2 <= 400; k2++) { var cx = xr[0] + xs * k2 / 400, cy = 0, b2; for (b2 = 0; b2 < B.length; b2++) cy += ft.c[b2] * B[b2](cx); if (isFinite(cy) && cy >= yr[0] && cy <= yr[1]) curve.push({ x: cx, y: cy }); }
        var inside = 0, near = 0;
        dense.forEach(function (z) { if (z.x < xr[0] || z.x > xr[1] || z.y < yr[0] || z.y > yr[1]) return; inside++; var m = Infinity; for (var c3 = 0; c3 < curve.length; c3++) { m = Math.min(m, nd(z, curve[c3])); if (m <= 1.8) break; } if (m <= 1.8) near++; });
        if (!inside || near / inside < 0.9) return 'הקו עובר דרך הנקודות, אבל צורת הגרף בין הנקודות אינה נכונה. נסו שוב.';
        return 'ok';
      }
      function endStroke() {
        if (!drawing) return; drawing = false;
        if (K.rawStroke) { strokeEl.setAttribute('d', ''); if (stroke.length >= 5) { lastStroke = stroke.slice(); keepEl.setAttribute('d', pathOf(lastStroke)); fireChange(); } return; }
        var r = judge();
        if (r === 'ok') { setDraw(false); var cardE = fig.closest('.ex'), bE = cardE && cardE.querySelector('.act-chk'); if (bE) bE.click(); return; }
        if (skStatEl) { skStatEl.textContent = r; skStatEl.className = 'sk-st no'; clearTimeout(skStatTimer); skStatTimer = setTimeout(skStatus, 4000); }
        setTimeout(function () { if (!drawing) strokeEl.setAttribute('d', ''); }, 1200);
      }
      drawBtn.addEventListener('click', function () { setDraw(!drawOn); });
      ov.addEventListener('pointerdown', function (ev) { drawing = true; stroke = []; if (K.rawStroke) { keepEl.setAttribute('d', ''); lastStroke = []; } try { ov.setPointerCapture(ev.pointerId); } catch (e) { } addPt(ev); ev.preventDefault(); });
      ov.addEventListener('pointermove', function (ev) { if (drawing) addPt(ev); });
      ov.addEventListener('pointerup', endStroke);
      ov.addEventListener('pointercancel', function () { drawing = false; strokeEl.setAttribute('d', ''); });
      ['touchstart', 'touchmove'].forEach(function (tn) { ov.addEventListener(tn, function (ev) { ev.preventDefault(); }, { passive: false }); });
      host.appendChild(skBox);
    } else if (spec.sk) {
      var K = spec.sk; skBox = document.createElement('div'); skBox.className = 'sk';
      var mk = function (tag, cls, txt) { var e2 = document.createElement(tag); if (cls) e2.className = cls; if (txt) e2.textContent = txt; return e2; };
      skBox.appendChild(mk('div', 'sk-t', 'מזינים את הנתונים באחת הדרכים, או משלבים ביניהן. כשכל הנתונים הוזנו מופיע הכפתור "העבר גרף".'));
      var b1 = mk('div', 'sk-w'); b1.appendChild(mk('div', 'sk-wh', '1. גרירה')); b1.appendChild(mk('div', 'sk-wd', 'גוררים את הנקודות בשרטוט.')); skBox.appendChild(b1);
      var b2 = mk('div', 'sk-w'); b2.appendChild(mk('div', 'sk-wh', '2. טבלת נקודות'));
      K.pts.forEach(function (q) {
        var lb = mk('label', 'sk-r'); lb.appendChild(mk('span', 'sk-l', q.lab + ' · ' + q.c + ' ='));
        var i4 = document.createElement('input'); i4.type = 'text'; i4.setAttribute('inputmode', 'decimal'); i4.setAttribute('dir', 'ltr'); i4.placeholder = '?'; i4.autocomplete = 'off';
        i4.addEventListener('change', function () { var v = parseFloat(i4.value.replace(',', '.')); if (isFinite(v)) skRaw(q.id, q.c, v); });
        lb.appendChild(i4); b2.appendChild(lb); skRows[q.id] = { i: i4, c: q.c };
      });
      skBox.appendChild(b2);
      if (K.alg) {
        var b3 = mk('div', 'sk-w'); b3.appendChild(mk('div', 'sk-wh', '3. ביטוי אלגברי')); b3.appendChild(mk('div', 'sk-wd', K.algHead || ''));
        var av = {};
        K.alg.forEach(function (a) {
          var lb2 = mk('label', 'sk-r'); lb2.appendChild(mk('span', 'sk-l', a.lab + ' ='));
          var i5 = document.createElement('input'); i5.type = 'text'; i5.setAttribute('inputmode', 'decimal'); i5.setAttribute('dir', 'ltr'); i5.placeholder = '?'; i5.autocomplete = 'off';
          lb2.appendChild(i5); b3.appendChild(lb2); av[a.k] = i5;
        });
        var ab = mk('button', 'btn small sk-go', 'הצבה בשרטוט'); ab.type = 'button';
        ab.addEventListener('click', function () {
          var keys = Object.keys(av), vals = keys.map(function (k) { return parseFloat(av[k].value.replace(',', '.')); });
          if (vals.some(function (v) { return !isFinite(v); })) return;
          Object.keys(K.map).forEach(function (id) {
            var fn = Function.apply(null, keys.concat(['pow', 'abs', 'sqrt', 'return (' + K.map[id] + ');']));
            var v = fn.apply(null, vals.concat([Math.pow, Math.abs, Math.sqrt]));
            var q = K.pts.filter(function (z) { return z.id === id; })[0]; if (q) skRaw(id, q.c, v);
          });
        });
        b3.appendChild(ab); skBox.appendChild(b3);
      }
      host.appendChild(skBox);
    }
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
      if (g.fit) { var ft = doFit(); if (!ft || needMiss().length || ft.res > (g.fit.res || 0.15)) return false; return ft.c.every(function (v, i) { return Math.abs(v - g.fit.target[i]) <= (g.fit.tol || 0.08) * Math.max(1, Math.abs(g.fit.target[i])); }); }
      if (g.expr) { refresh(); return !!evx(g.expr, 0); }
      if (g.curve) { refresh(); var gc = g.curve, tol = gc.tol || 0.03 * ys, mx = 0; for (var ti = 0; ti <= 80; ti++) { var tx = xr[0] + xs * ti / 80, d1 = cf(gc.i || 0, tx) - evx(gc.target, tx); if (isFinite(d1)) mx = Math.max(mx, Math.abs(d1)); } return mx <= tol; }
      if (g.line) { var q = lineOf(spec.lines[g.line.i || 0]); if (q.vert) return false; return Math.abs(q.m - g.line.m) < 0.06 && Math.abs(q.b - g.line.b) < 0.06; }
      if (g.dist) return Math.abs(distTo(g.dist.id, g.dist.line || 0) - g.dist.eq) < (g.dist.tol || 0.06);
      if (g.drag) return Object.keys(g.drag).every(function (id) { var c = g.drag[id]; return (!('x' in c) || Math.abs(D[id].x - c.x) < 0.06) && (!('y' in c) || Math.abs(D[id].y - c.y) < 0.06); });
      return false;
    }
    var changeCbs = [];
    function fireChange(reset) { fig.dispatchEvent(new CustomEvent('figchange', { bubbles: true, detail: { reset: !!reset } })); }
    fig._api = {
      check: function () { refresh(); return ok(spec.goal); },
      reveal: function (part) { var g = layerG[part]; if (g) g.classList.remove('is-hidden'); },
      hide: function (part) { var g = layerG[part]; if (g) g.classList.add('is-hidden'); },
      setParam: function (k, v) { Pm[k] = v; var i2 = fig.querySelector('input[data-param="' + k + '"]'); if (i2) { i2.value = v; i2.nextSibling.textContent = fmt(v); } update(); },
      setDrag: function (id, x, y) { place(dragDef[id], x, y); prov[id] = true; update(); fireChange(); },
      state: function () { return { params: JSON.parse(JSON.stringify(Pm)), drags: JSON.parse(JSON.stringify(D)) }; },
      addPoint: function (x, y) { return fpAdd(x, y); },
      stroke: function () { return lastStroke.map(function (q) { return [q.x, q.y]; }); },
      setStroke: function (arr) { lastStroke = arr.map(function (q) { return { x: q[0], y: q[1] }; }); var kp = svg.querySelector('.svg-stroke.keep'); if (kp) kp.setAttribute('d', lastStroke.map(function (z, i) { return (i ? 'L' : 'M') + sx(z.x).toFixed(1) + ' ' + sy(z.y).toFixed(1); }).join(' ')); },
      points: function () { return freeMode ? fpTouched().map(function (q) { return [q.x, q.y]; }) : []; },
      isDrawn: function () { return !curveHidden; },
      px: function (x, y) { var b = svg.getBoundingClientRect(), k = b.width / W; return { x: b.left + sx(x) * k, y: b.top + sy(y) * k }; },
      ready: function () { if (freeMode) return !!doFit() && !needMiss().length; return !spec.sk || spec.sk.pts.every(function (q) { return prov[q.id]; }); },
      missing: function () { if (freeMode) { var nt = fpTouched().length, nb = nMinPts(); if (nt < nb) return ['נקודות: הוזנו ' + nt + ', נדרשות לפחות ' + nb]; if (needMiss().length) return [spec.sk.needMsg || 'חסרות נקודות מפתח של הגרף (הנקודות צריכות להיות מדויקות)']; return ['הנקודות אינן קובעות גרף. החליפו או הוסיפו נקודה בערך x אחר']; } return spec.sk ? spec.sk.pts.filter(function (q) { return !prov[q.id]; }).map(function (q) { return q.lab; }) : []; },
      drawGraph: function () { var ft1 = doFit(); if (ft1) fitC = ft1.c; curveHidden = false; update(); },
      hasGoal: !!spec.goal, hint: spec.goalHint || ''
    };
  }


  /* ---------- gallery: choose the matching graph ---------- */
  function buildGallery(fig, host, spec) {
    host.innerHTML = '';
    var old = fig.querySelectorAll('.fig-ctl, .fig-read, .fig-ctl-row'); Array.prototype.forEach.call(old, function (n) { n.parentNode.removeChild(n); });
    var G = spec.gallery, XR = G.xr || [-4, 4], YR = G.yr || [-6, 6], W = 230, H = 176, M = 12, sel = -1;
    var wrap = document.createElement('div'); wrap.className = 'gal'; wrap.setAttribute('role', 'radiogroup'); wrap.setAttribute('aria-label', spec.alt || 'בחרו גרף');
    var panels = [];
    function fnOf(e) { try { return new Function('x', 'with(Math){return (' + String(e).replace(/\^/g, '**') + ');}'); } catch (er) { console.error('bad curve', e); return function () { return NaN; }; } }
    G.panels.forEach(function (P, idx) {
      var xr = P.xr || XR, yr = P.yr || YR, sxx = function (x) { return M + (x - xr[0]) / (xr[1] - xr[0]) * (W - 2 * M); }, syy = function (y) { return M + (yr[1] - y) / (yr[1] - yr[0]) * (H - 2 * M); };
      var box = document.createElement('div'); box.className = 'gal-p'; box.tabIndex = 0; box.setAttribute('role', 'radio'); box.setAttribute('aria-checked', 'false');
      var svg = el('svg', { viewBox: '0 0 ' + W + ' ' + H, width: W, height: H, 'class': 'plot gal-svg', role: 'img', 'aria-label': 'גרף ' + (G.labels ? G.labels[idx] : idx + 1) }, box);
      var cpid = 'g' + Math.random().toString(36).slice(2, 8), cp = el('clipPath', { id: cpid }, el('defs', {}, svg)); el('rect', { x: M, y: M, width: W - 2 * M, height: H - 2 * M }, cp);
      el('line', { x1: M, y1: syy(0), x2: W - M, y2: syy(0), 'class': 'svg-axis' }, svg); el('line', { x1: sxx(0), y1: H - M, x2: sxx(0), y2: M, 'class': 'svg-axis' }, svg);
      el('path', { d: 'M' + (W - M + 6) + ' ' + syy(0) + 'l-8 -4v8z', 'class': 'svg-arrow' }, svg); el('path', { d: 'M' + sxx(0) + ' ' + (M - 6) + 'l-4 8h8z', 'class': 'svg-arrow' }, svg);
      txt(svg, W - 4, syy(0) + 16, 'x', 'svg-axname', 'end'); txt(svg, sxx(0) - 9, M + 4, 'y', 'svg-axname', 'end');
      (P.curves || [{ f: P.f, cls: 0 }]).forEach(function (C) {
        var f = fnOf(C.f), d = '', pen = false, N = 260, q, x, y, big = 4 * (yr[1] - yr[0]);
        for (q = 0; q <= N; q++) { x = xr[0] + (xr[1] - xr[0]) * q / N; y = f(x); if (!isFinite(y)) { pen = false; continue; } y = Math.max(-big, Math.min(big, y)); d += (pen ? 'L' : 'M') + sxx(x).toFixed(1) + ' ' + syy(y).toFixed(1); pen = true; }
        el('path', { d: d, 'class': 'svg-line svg-curve l' + (C.cls || 0) + (C.dash ? ' dash' : ''), 'clip-path': 'url(#' + cpid + ')' }, svg);
      });
      (P.pts || []).forEach(function (p) { el('circle', { cx: sxx(p[0]), cy: syy(p[1]), r: 3.6, 'class': 'svg-pt' }, svg); });
      var lb = document.createElement('div'); lb.className = 'gal-l'; lb.textContent = G.labels ? G.labels[idx] : '(' + (idx + 1) + ')'; box.appendChild(lb);
      function pick() { sel = idx; panels.forEach(function (p2, j) { p2.classList.toggle('sel', j === idx); p2.setAttribute('aria-checked', j === idx ? 'true' : 'false'); }); fig.dispatchEvent(new CustomEvent('figchange', { bubbles: true, detail: { reset: false } })); }
      box.addEventListener('click', pick);
      box.addEventListener('keydown', function (ev) { if (ev.key === 'Enter' || ev.key === ' ') { ev.preventDefault(); pick(); } });
      panels.push(box); wrap.appendChild(box);
    });
    host.appendChild(wrap);
    var rst = document.createElement('button'); rst.type = 'button'; rst.className = 'btn small ghost fig-reset'; rst.textContent = 'איפוס';
    rst.addEventListener('click', function () { sel = -1; panels.forEach(function (p2) { p2.classList.remove('sel'); p2.setAttribute('aria-checked', 'false'); }); fig.dispatchEvent(new CustomEvent('figchange', { bubbles: true, detail: { reset: true } })); });
    var tools = document.createElement('div'); tools.className = 'fig-ctl-row'; tools.appendChild(rst); host.appendChild(tools);
    var layerG = {};
    fig._api = {
      check: function () { return spec.goal && spec.goal.pick !== undefined && sel === spec.goal.pick; },
      reveal: function () { }, hide: function () { }, setParam: function () { }, setDrag: function () { },
      setPick: function (i) { panels[i].click(); },
      state: function () { return { pick: sel }; },
      hasGoal: !!spec.goal, hint: spec.goalHint || ''
    };
  }

  window.Figs = {
    renderAll: function (root) { Array.prototype.forEach.call((root || document).querySelectorAll('.fig[data-fig]'), build); },
    api: function (fig) { return fig && fig._api; },
    reveal: function (fig, part) { if (fig && fig._api) fig._api.reveal(part); }
  };
})();
