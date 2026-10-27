/* מהי נגזרת: אינטראקציות. ללא תלות חיצונית. */
(function(){
'use strict';
var NS='http://www.w3.org/2000/svg';
function el(n,a,p){var e=document.createElementNS(NS,n);if(a)for(var k in a)e.setAttribute(k,a[k]);if(p)p.appendChild(e);return e}
function $(s,r){return (r||document).querySelector(s)}
function $$(s,r){return Array.prototype.slice.call((r||document).querySelectorAll(s))}
var MINUS='−';
function fmt(v,d){
  if(!isFinite(v))return '—';
  var s=(Math.round(v*Math.pow(10,d))/Math.pow(10,d)).toFixed(d);
  if(s.indexOf('.')>=0)s=s.replace(/0+$/,'').replace(/\.$/,'');
  if(s==='-0'||s==='')s='0';
  return s.replace('-',MINUS);
}
function parseNum(s){
  s=String(s).replace(/[−–‒]/g,'-').replace(/,/g,'.').replace(/\s+/g,'');
  if(!s)return NaN;
  if(s.indexOf('/')>0){var p=s.split('/');var a=Number(p[0]),b=Number(p[1]);return b?a/b:NaN}
  return Number(s);
}
var reduce=window.matchMedia&&matchMedia('(prefers-reduced-motion:reduce)').matches;

/* ---------- plot helper ---------- */
var uid=0;
function Plot(svg,o){
  var W=o.W,H=o.H,pl=o.pl==null?40:o.pl,pr=o.pr==null?14:o.pr,pt=o.pt==null?12:o.pt,pb=o.pb==null?26:o.pb;
  svg.setAttribute('viewBox','0 0 '+W+' '+H);
  while(svg.firstChild)svg.removeChild(svg.firstChild);
  var id='clip'+(++uid);
  var defs=el('defs',null,svg);
  var cp=el('clipPath',{id:id},defs);
  var P={svg:svg,o:o,W:W,H:H};
  P.X=function(x){return pl+(x-o.xmin)/(o.xmax-o.xmin)*(W-pl-pr)};
  P.Y=function(y){return H-pb-(y-o.ymin)/(o.ymax-o.ymin)*(H-pt-pb)};
  P.ix=function(px){return o.xmin+(px-pl)/(W-pl-pr)*(o.xmax-o.xmin)};
  P.iy=function(py){return o.ymin+(H-pb-py)/(H-pt-pb)*(o.ymax-o.ymin)};
  el('rect',{x:pl,y:pt,width:W-pl-pr,height:H-pt-pb},cp);
  var g=el('g',null,svg);
  if(!o.nogrid){
    var gx=o.gx||1,gy=o.gy||1,lx=o.lx||gx,ly=o.ly||gy,x,y;
    for(x=Math.ceil(o.xmin/gx)*gx;x<=o.xmax+1e-9;x+=gx){
      el('line',{x1:P.X(x),x2:P.X(x),y1:pt,y2:H-pb,'class':'svg-grid'},g);
      if(Math.abs(x/lx-Math.round(x/lx))<1e-6&&Math.abs(x)>1e-9){var t=el('text',{x:P.X(x),y:H-pb+15,'class':'svg-tk'},g);t.textContent=fmt(x,2)}
    }
    for(y=Math.ceil(o.ymin/gy)*gy;y<=o.ymax+1e-9;y+=gy){
      el('line',{x1:pl,x2:W-pr,y1:P.Y(y),y2:P.Y(y),'class':'svg-grid'},g);
      if(Math.abs(y/ly-Math.round(y/ly))<1e-6&&Math.abs(y)>1e-9){var t2=el('text',{x:pl-6,y:P.Y(y)+4,'class':'svg-tk',style:'text-anchor:end'},g);t2.textContent=fmt(y,2)}
    }
    if(o.xmin<0&&o.xmax>0)el('line',{x1:P.X(0),x2:P.X(0),y1:pt,y2:H-pb,'class':'svg-ax'},g);
    if(o.ymin<0&&o.ymax>0)el('line',{x1:pl,x2:W-pr,y1:P.Y(0),y2:P.Y(0),'class':'svg-ax'},g);
  }
  P.clip=el('g',{'clip-path':'url(#'+id+')'},svg);
  P.top=el('g',null,svg);
  P.path=function(fn,x0,x1,n,cls,parent){
    var d='',i,x,y;n=n||160;
    for(i=0;i<=n;i++){x=x0+(x1-x0)*i/n;y=fn(x);d+=(i?'L':'M')+P.X(x).toFixed(1)+' '+P.Y(y).toFixed(1)}
    return el('path',{d:d,'class':cls},parent||P.clip);
  };
  P.line=function(x0,y0,m,cls,parent){
    var xa=o.xmin-1,xb=o.xmax+1;
    return el('line',{x1:P.X(xa),y1:P.Y(y0+m*(xa-x0)),x2:P.X(xb),y2:P.Y(y0+m*(xb-x0)),'class':cls},parent||P.clip);
  };
  P.setLine=function(e,x0,y0,m){
    var xa=o.xmin-1,xb=o.xmax+1;
    e.setAttribute('x1',P.X(xa));e.setAttribute('y1',P.Y(y0+m*(xa-x0)));e.setAttribute('x2',P.X(xb));e.setAttribute('y2',P.Y(y0+m*(xb-x0)));
  };
  P.pt=function(e){var p=svg.createSVGPoint();p.x=e.clientX;p.y=e.clientY;var q=p.matrixTransform(svg.getScreenCTM().inverse());return {x:q.x,y:q.y}};
  return P;
}
function text(parent,x,y,str,cls){var t=el('text',{x:x,y:y,'class':cls||'svg-lab'},parent);t.textContent=str;return t}

/* ---------- progress ---------- */
var stages=$$('.stage');
function refresh(){
  var done=0;
  stages.forEach(function(s){
    var ok=!$('.chk:not(.ok)',s);
    s.classList.toggle('done',ok);
    var a=$('.stagenav a[href="#'+s.id+'"]');if(a)a.classList.toggle('done',ok);
    if(ok)done++;
  });
  var fill=$('#prog-fill'),txt=$('#prog-txt'),pr=$('#prog');
  var pct=Math.round(done/stages.length*100);
  if(fill)fill.style.width=pct+'%';
  if(txt)txt.textContent=done+' מתוך '+stages.length+' שלבים הושלמו';
  if(pr)pr.setAttribute('aria-valuenow',pct);
}
function pass(node){node.classList.add('ok');refresh()}

/* ---------- generic multiple choice ---------- */
$$('.mc').forEach(function(m){
  var c=+m.getAttribute('data-c'),opts=$$('.opt',m),fb=$('.fb',m),exp=$('.mc-exp',m);
  opts.forEach(function(b,i){
    b.addEventListener('click',function(){
      if(m.classList.contains('ok'))return;
      if(i===c){
        b.classList.add('ok');opts.forEach(function(x){x.disabled=true});
        if(fb){fb.textContent='נכון';fb.className='fb ok'}
        if(exp)exp.hidden=false;
        var rv=m.getAttribute('data-reveal');if(rv){var r=$(rv);if(r)r.hidden=false}
        pass(m);
      }else{
        b.classList.add('no');b.disabled=true;
        if(fb){fb.textContent='לא מדויק, נסו שוב';fb.className='fb no'}
      }
    });
  });
});

/* ---------- generic typed answer ---------- */
function typed(box,keys,onok){
  var inp=$('input',box),btn=$('.btn',box),fb=$('.fb',box);
  function go(){
    var v=parseNum(inp.value);
    if(isNaN(v)){fb.textContent='הקלידו מספר';fb.className='fb no';return}
    var ok=keys.some(function(k){return Math.abs(v-k)<1e-6});
    inp.classList.toggle('right',ok);inp.classList.toggle('wrong',!ok);
    if(ok){fb.textContent='נכון';fb.className='fb ok';if(!box.classList.contains('ok')){pass(box);if(onok)onok()}}
    else{fb.textContent='לא מדויק, בדקו שוב';fb.className='fb no'}
  }
  btn.addEventListener('click',go);
  inp.addEventListener('keydown',function(e){if(e.key==='Enter')go()});
}

/* ============================================================
   שלב 1: שיפוע חותך שמתקרב
   ============================================================ */
function f1(x){return x*x*x-3*x}
(function(){
  var svg=$('#v1');if(!svg)return;
  var A=2,fa=f1(A),h=1,tanOn=false;
  var P=Plot(svg,{xmin:-2.2,xmax:3.4,ymin:-4,ymax:20,W:640,H:380,gx:1,gy:4});
  P.path(f1,-2.2,3.4,200,'svg-curve');
  var tan=P.line(A,fa,9,'svg-tan dash');tan.style.display='none';
  var sec=P.line(A,fa,1,'svg-sec');
  var legH=el('line',{'class':'svg-leg'},P.top),legV=el('line',{'class':'svg-leg'},P.top);
  var lh=text(P.top,0,0,'h','svg-lab sm'),lv=text(P.top,0,0,'Δy','svg-lab sm');
  var pA=el('circle',{cx:P.X(A),cy:P.Y(fa),r:7,'class':'svg-ptA'},P.top);
  text(P.top,P.X(A)-14,P.Y(fa)+22,'A');
  var pB=el('circle',{r:8,'class':'svg-ptB drag'},P.top);
  var lB=text(P.top,0,0,'B');
  var hit=el('circle',{r:22,'class':'svg-hit drag'},P.top);
  var sl=$('#h1s'),oh=$('#h1'),ody=$('#dy1'),om=$('#m1');
  function set(nh){
    h=Math.max(-1,Math.min(1,nh));
    var x=A+h,y=f1(x),near=Math.abs(h)<0.001;
    pB.setAttribute('cx',P.X(x));pB.setAttribute('cy',P.Y(y));hit.setAttribute('cx',P.X(x));hit.setAttribute('cy',P.Y(y));
    lB.setAttribute('x',P.X(x)+(h>=0?16:-16));lB.setAttribute('y',P.Y(y)-12);
    sec.style.display=near?'none':'';
    [legH,legV,lh,lv].forEach(function(n){n.style.display=near?'none':''});
    if(!near){
      var m=(y-fa)/h;P.setLine(sec,A,fa,m);
      legH.setAttribute('x1',P.X(A));legH.setAttribute('y1',P.Y(fa));legH.setAttribute('x2',P.X(x));legH.setAttribute('y2',P.Y(fa));
      legV.setAttribute('x1',P.X(x));legV.setAttribute('y1',P.Y(fa));legV.setAttribute('x2',P.X(x));legV.setAttribute('y2',P.Y(y));
      lh.setAttribute('x',(P.X(A)+P.X(x))/2);lh.setAttribute('y',P.Y(fa)+(y>fa?16:-8));
      lv.setAttribute('x',P.X(x)+(h>=0?18:-18));lv.setAttribute('y',(P.Y(fa)+P.Y(y))/2);
      oh.textContent=fmt(h,3);ody.textContent=fmt(y-fa,4);om.textContent=fmt(m,4);
    }else{oh.textContent='0';ody.textContent='—';om.textContent='—'}
    sl.value=h;
  }
  sl.addEventListener('input',function(){stopAnim();set(+sl.value)});
  var drag=false;
  function mv(e){var p=P.pt(e);set(P.ix(p.x)-A)}
  [hit,pB].forEach(function(n){n.addEventListener('pointerdown',function(e){drag=true;stopAnim();n.setPointerCapture&&n.setPointerCapture(e.pointerId);mv(e);e.preventDefault()})});
  svg.addEventListener('pointermove',function(e){if(drag)mv(e)});
  window.addEventListener('pointerup',function(){drag=false});
  var anim=0;
  function stopAnim(){if(anim){cancelAnimationFrame(anim);anim=0}}
  $('#h1go').addEventListener('click',function(){
    stopAnim();
    if(Math.abs(h)<0.01)h=0.6;
    var sgn=h>0?1:-1,cur=Math.abs(h);
    (function step(){
      cur*=reduce?0.5:0.955;
      if(cur<0.002){cur=0.002}
      set(sgn*cur);
      if(cur>0.002)anim=requestAnimationFrame(step);else anim=0;
    })();
  });
  $('#h1flip').addEventListener('click',function(){stopAnim();set(-h||0.5)});
  typed($('#g1box'),[9],function(){
    tan.style.display='';tanOn=true;
    $('#g1note').hidden=false;
  });
  set(1);
})();

/* ============================================================
   שלב 2: טבלת התכנסות משני הצדדים
   ============================================================ */
(function(){
  var tb=$('#t2 tbody');if(!tb)return;
  var hs=[1,0.5,0.1,0.01,0.001],k=0,btn=$('#t2go'),done=$('#t2done');
  function sl(h){return (f1(2+h)-f1(2))/h}
  btn.addEventListener('click',function(){
    if(k>=hs.length)return;
    var h=hs[k++],tr=document.createElement('tr');tr.className='new';
    tr.innerHTML='<td class="num pos">'+fmt(h,4)+'</td><td class="num pos">'+fmt(sl(h),6)+'</td><td class="num neg">'+MINUS+fmt(h,4)+'</td><td class="num neg">'+fmt(sl(-h),6)+'</td>';
    tb.appendChild(tr);
    if(k>=hs.length){btn.disabled=true;done.hidden=false}
  });
})();

/* ============================================================
   שלב 3: הנגזרת של x^2 לפי ההגדרה
   ============================================================ */
(function(){
  var tbl=$('#st3');if(!tbl)return;
  var rows=$$('tbody tr',tbl);
  rows.forEach(function(tr,idx){
    var c=+tr.getAttribute('data-c');
    $$('.opt',tr).forEach(function(b,i){
      b.addEventListener('click',function(){
        if(tr.classList.contains('solved'))return;
        if(i===c){
          $('.claim',tr).innerHTML=b.innerHTML;tr.classList.add('solved');
          var nx=rows[idx+1];
          if(nx){
            nx.classList.remove('locked');
            if(nx.hasAttribute('data-auto')){nx.classList.add('solved');$('#g3box').hidden=false}
          }
        }else{b.classList.add('no');setTimeout(function(){b.classList.remove('no')},600)}
      });
    });
  });
  typed($('#g3box'),[6]);
})();

/* ============================================================
   שלב 4: מיקרוסקופ: חלון שמצטמצם סביב A
   ============================================================ */
(function(){
  var svg=$('#v4');if(!svg)return;
  function f(x){return x*x}
  var a=1,zk=0;
  var as=$('#a4'),zs=$('#z4');
  function draw(){
    var w=2*Math.pow(2,-zk),m=2*a,ya=f(a),hh=w*Math.max(Math.abs(m),0.8)*1.3;
    var P=Plot(svg,{xmin:a-w,xmax:a+w,ymin:ya-hh,ymax:ya+hh,W:640,H:360,nogrid:true,pl:10,pr:10,pt:10,pb:10});
    el('rect',{x:10,y:10,width:620,height:340,fill:'none',stroke:'var(--line)'},P.top);
    el('line',{x1:P.X(a),x2:P.X(a),y1:10,y2:350,'class':'svg-grid'},P.top);
    el('line',{x1:10,x2:630,y1:P.Y(ya),y2:P.Y(ya),'class':'svg-grid'},P.top);
    P.path(f,a-w,a+w,240,'svg-curve');
    P.line(a,ya,m,'svg-tan dash');
    var xb=a+w,yb=f(xb),sec=(yb-ya)/w;
    P.line(a,ya,sec,'svg-sec');
    el('circle',{cx:P.X(a),cy:P.Y(ya),r:6,'class':'svg-ptA'},P.top);
    el('circle',{cx:P.X(xb),cy:P.Y(yb),r:7,'class':'svg-ptB'},P.top);
    text(P.top,P.X(a)-14,P.Y(ya)+22,'A');
    $('#w4').textContent=fmt(w,4);$('#s4v').textContent=fmt(sec,4);$('#m4').textContent=fmt(m,2);
    $('#d4').textContent=fmt(sec-m,4);
    var n=$('#n4');
    n.textContent=w>0.5?'החלון גדול: הגרף עדיין מתעקם, והחותך רחוק מהמשיק.':(w>0.05?'הגרף כבר נראה כמעט ישר, והחותך קרוב למשיק.':'החותך והמשיק כמעט חופפים.');
  }
  as.addEventListener('input',function(){a=+as.value;draw()});
  zs.addEventListener('input',function(){zk=+zs.value;draw()});
  draw();
})();

/* ============================================================
   שלב 5: נקודת שבר (אתגר)
   ============================================================ */
(function(){
  var svg=$('#v5');if(!svg)return;
  var P=Plot(svg,{xmin:-2,xmax:2,ymin:-0.4,ymax:2.2,W:640,H:300,gx:1,gy:1});
  P.path(function(x){return Math.abs(x)},-2,2,2,'svg-curve');
  var sec=P.line(0,0,1,'svg-sec');
  var pA=el('circle',{cx:P.X(0),cy:P.Y(0),r:7,'class':'svg-ptA'},P.top);
  var pB=el('circle',{r:8,'class':'svg-ptB drag'},P.top),hit=el('circle',{r:22,'class':'svg-hit drag'},P.top);
  text(P.top,P.X(0)-14,P.Y(0)+22,'A');
  var sl=$('#h5s'),oh=$('#h5'),om=$('#m5'),oR=$('#r5'),oL=$('#l5'),h=1;
  function set(nh){
    h=Math.max(-1.8,Math.min(1.8,nh));if(Math.abs(h)<0.05)h=h<0?-0.05:0.05;
    var x=h,y=Math.abs(h),m=y/h;
    pB.setAttribute('cx',P.X(x));pB.setAttribute('cy',P.Y(y));hit.setAttribute('cx',P.X(x));hit.setAttribute('cy',P.Y(y));
    P.setLine(sec,0,0,m);
    oh.textContent=fmt(h,2);om.textContent=fmt(m,0);
    if(h>0)oR.textContent=fmt(m,0);else oL.textContent=fmt(m,0);
    sl.value=h;
  }
  sl.addEventListener('input',function(){set(+sl.value)});
  var drag=false;
  function mv(e){var p=P.pt(e);set(P.ix(p.x))}
  [hit,pB].forEach(function(n){n.addEventListener('pointerdown',function(e){drag=true;n.setPointerCapture&&n.setPointerCapture(e.pointerId);mv(e);e.preventDefault()})});
  svg.addEventListener('pointermove',function(e){if(drag)mv(e)});
  window.addEventListener('pointerup',function(){drag=false});
  set(1);
})();

/* ============================================================
   תוצר: משיפועי משיקים לגרף הנגזרת
   ============================================================ */
(function(){
  var s1=$('#v6a'),s2=$('#v6b');if(!s1||!s2)return;
  var X=[-2,-1,0,1,2];
  function dfn(x){return 3*x*x-3}
  var P1=Plot(s1,{xmin:-2.5,xmax:2.5,ymin:-8,ymax:10,W:640,H:330,gx:0.5,gy:2,lx:1,ly:2});
  P1.path(f1,-2.5,2.5,160,'svg-curve');
  X.forEach(function(x){
    var y=f1(x),m=dfn(x),d=0.5;
    el('line',{x1:P1.X(x-d),y1:P1.Y(y-m*d),x2:P1.X(x+d),y2:P1.Y(y+m*d),'class':'svg-tan',style:'stroke-width:3.4'},P1.clip);
    el('circle',{cx:P1.X(x),cy:P1.Y(y),r:5.5,'class':'svg-ptA'},P1.top);
  });
  var P2=Plot(s2,{xmin:-2.5,xmax:2.5,ymin:-5,ymax:10,W:640,H:300,gx:0.5,gy:1,lx:1,ly:2});
  var curve2=P2.path(dfn,-2.5,2.5,160,'svg-curve');curve2.style.display='none';
  var vals=X.map(function(){return null}),pts=[],ins=$$('#pg input');
  function pos(i){var v=vals[i];return v==null?0:v}
  X.forEach(function(x,i){
    var guide=el('line',{x1:P2.X(x),x2:P2.X(x),y1:P2.Y(-5),y2:P2.Y(10),'class':'svg-grid',style:'stroke-dasharray:3 4'},P2.top);
    var c=el('circle',{cx:P2.X(x),cy:P2.Y(0),r:9,'class':'svg-ptP drag',style:'opacity:.45'},P2.top);
    var h=el('circle',{cx:P2.X(x),cy:P2.Y(0),r:22,'class':'svg-hit drag'},P2.top);
    var drag=false;
    function upd(v){
      vals[i]=Math.max(-5,Math.min(10,v));
      c.setAttribute('cy',P2.Y(vals[i]));h.setAttribute('cy',P2.Y(vals[i]));c.style.opacity=1;
      ins[i].value=fmt(Math.round(vals[i]*10)/10,1);
      ins[i].classList.remove('right','wrong');
    }
    h.addEventListener('pointerdown',function(e){drag=true;h.setPointerCapture&&h.setPointerCapture(e.pointerId);upd(P2.iy(P2.pt(e).y));e.preventDefault()});
    h.addEventListener('pointermove',function(e){if(drag)upd(P2.iy(P2.pt(e).y))});
    h.addEventListener('pointerup',function(){drag=false});
    pts.push({c:c,h:h,upd:upd});
    ins[i].addEventListener('input',function(){var v=parseNum(ins[i].value);if(!isNaN(v)){var vv=Math.max(-5,Math.min(10,v));vals[i]=vv;c.setAttribute('cy',P2.Y(vv));h.setAttribute('cy',P2.Y(vv));c.style.opacity=1;ins[i].classList.remove('right','wrong')}})
  });
  var fb=$('#pfb'),box=$('#pbox');
  $('#pgo').addEventListener('click',function(){
    var ok=0,i;
    for(i=0;i<X.length;i++){
      var v=vals[i];if(v==null){ins[i].classList.add('wrong');continue}
      var good=Math.abs(v-dfn(X[i]))<=0.75;
      ins[i].classList.toggle('right',good);ins[i].classList.toggle('wrong',!good);
      if(good){ok++;pts[i].c.setAttribute('class','svg-ptok drag')}
    }
    if(ok===X.length){
      fb.textContent='כל הנקודות נכונות';fb.className='fb ok';
      curve2.style.display='';$('#pdone').hidden=false;
      if(!box.classList.contains('ok'))pass(box);
    }else{fb.textContent=ok+' מתוך '+X.length+' נכונות. בדקו שוב את שיפוע המשיק בנקודות האדומות';fb.className='fb no'}
  });
})();

/* ---------- self check ---------- */
$$('.sc-item input').forEach(function(i){i.addEventListener('change',function(){})});

refresh();
})();
