/* מכונת הגבול: נגזרת בנקודה לפי ההגדרה. שלבים: approach / algebra / data / boss / bridge. נשען על window.DF */
(function(){
'use strict';
var DF=window.DF;if(!DF||!DF.keyField)return;
var $=DF.$,$$=DF.$$,el=DF.el,fmt=DF.fmt,pass=DF.pass,Plot=DF.Plot,text=DF.text,parseExpr=DF.parseExpr;
var SP=JSON.parse($('#lv').textContent);
var HS=[1,0.5,0.1,0.01,0.001];
var reduce=window.matchMedia&&window.matchMedia('(prefers-reduced-motion:reduce)').matches;

function niceStep(r){var e=Math.pow(10,Math.floor(Math.log(r/6)/Math.LN10)),m=r/6/e;return (m<1.5?1:m<3.5?2:m<7.5?5:10)*e}
function poly(c){return {
  f:function(x){var s=0;for(var i=0;i<c.length;i++)s+=c[i]*Math.pow(x,i);return s},
  fp:function(x){var s=0;for(var i=1;i<c.length;i++)s+=i*c[i]*Math.pow(x,i-1);return s}}}
function numVal(kf){var g=parseExpr(kf.val());return g?g(0):NaN}

/* מצב לשלב: טעויות ורמזים. כוכבים נקבעים בסיום השלב */
function stateOf(stage){
  if(stage._S)return stage._S;
  var S=stage._S={wrong:0,hinted:false,awarded:false};
  $$('details.hint',stage).forEach(function(d){d.addEventListener('toggle',function(){if(d.open)S.hinted=true})});
  $$('.mc .opt',stage).forEach(function(b){b.addEventListener('click',function(){if(b.classList.contains('no'))S.wrong++})});
  return S;
}
function burstEl(stage,target){
  var box=$('.burst',stage);
  if(!box){box=document.createElement('div');box.className='burst';stage.appendChild(box)}
  if(reduce)return;
  var sr=stage.getBoundingClientRect(),tr=target.getBoundingClientRect();
  var cx=tr.left-sr.left+tr.width/2,cy=tr.top-sr.top+tr.height/2,cols=['#ffc83d','#5eead4','#ff5c8a','#fff'];
  for(var j=0;j<22;j++){
    var d=document.createElement('span');d.className='dot';
    var ang=Math.random()*6.283,r=40+Math.random()*90;
    d.style.left=cx+'px';d.style.top=cy+'px';
    d.style.setProperty('--dx',Math.cos(ang)*r+'px');d.style.setProperty('--dy',Math.sin(ang)*r+'px');
    d.style.setProperty('--c1',cols[j%4]);
    box.appendChild(d);
    (function(n){setTimeout(function(){if(n.parentNode)n.parentNode.removeChild(n)},1000)})(d);
  }
}
function flash(stage){var v=$('.mviz',stage);if(!v)return;v.classList.remove('flash');void v.offsetWidth;v.classList.add('flash')}

/* ---------- שלב: מקרבים ונועלים ---------- */
function approach(stage,k,sp){
  var S=stateOf(stage),c=sp.c,a=sp.a,P0=poly(c),f=P0.f,ans=P0.fp(a),fa=f(a);
  var x0=a-2.2,x1=a+2.4,ymin=Infinity,ymax=-Infinity,i;
  for(i=0;i<=60;i++){var yy=f(x0+(x1-x0)*i/60);ymin=Math.min(ymin,yy);ymax=Math.max(ymax,yy)}
  var pad=(ymax-ymin)*0.12||1;ymin-=pad;ymax+=pad;var gy=niceStep(ymax-ymin);
  var P=Plot($('#mv'+k),{xmin:x0,xmax:x1,ymin:ymin,ymax:ymax,W:640,H:340,gx:1,gy:gy,lx:1,ly:gy});
  P.path(f,x0,x1,200,'svg-curve');
  var tan=P.line(a,fa,ans,'svg-tan dash');tan.style.display='none';
  var sec=P.line(a,fa,0,'svg-sec'),hCur=2;
  var Ac=el('circle',{cx:P.X(a),cy:P.Y(fa),r:7,'class':'svg-ptA'},P.top);
  text(P.top,P.X(a)-14,P.Y(fa)-12,'A');
  var B=el('circle',{r:7,'class':'svg-ptB'},P.top),tB=text(P.top,0,0,'B');
  function place(h){
    hCur=h;var q=(f(a+h)-fa)/h;P.setLine(sec,a,fa,q);
    var bx=P.X(a+h),by=P.Y(f(a+h));B.setAttribute('cx',bx);B.setAttribute('cy',by);tB.setAttribute('x',bx+14);tB.setAttribute('y',by-12);
  }
  place(hCur);
  function animateTo(h1){
    if(reduce){place(h1);return}
    var h0=hCur,t0=null;
    function stp(ts){if(t0===null)t0=ts;var p=Math.min(1,(ts-t0)/450),e=1-Math.pow(1-p,3);place(h0+(h1-h0)*e);if(p<1)requestAnimationFrame(stp)}
    requestAnimationFrame(stp);
  }
  var hi=-1,near=$('#near'+k),log=$('#log'+k+' tbody');
  near.addEventListener('click',function(){
    if(hi>=HS.length-1)return;
    hi++;var h=HS[hi],q=(f(a+h)-fa)/h;animateTo(h);
    var tr=document.createElement('tr');tr.className='new';
    tr.innerHTML='<td class="num">'+fmt(h,3)+'</td><td class="num">'+fmt(q,4)+'</td>';log.appendChild(tr);
    if(hi>=HS.length-1){near.disabled=true;$('#nfb'+k).textContent='B קרוב מאוד ל־A'}
  });
  var lock=$('.mlock',stage),kf=DF.keyField(lock),btn=$('.btn',lock),fb=$('.fb',lock);
  function go(){
    if(lock.classList.contains('ok'))return;
    var v=numVal(kf);
    if(isNaN(v)){fb.textContent='הזינו מספר';fb.className='fb no';kf.mark(false);return}
    if(Math.abs(v-ans)<1e-9){
      kf.mark(true);kf.close();fb.textContent='ננעל!';fb.className='fb ok';
      tan.style.display='';animateTo(0.001);flash(stage);burstEl(stage,Ac);pass(lock);
    }else{
      S.wrong++;kf.mark(false);fb.className='fb no';
      fb.textContent=Math.abs(v-ans)<0.05?'קרוב מאוד. לאיזה מספר מתייצבת המנה?':'לא מדויק. קרבו את B עוד והסתכלו בטבלה';
    }
  }
  btn.addEventListener('click',go);kf.onEnter(go);
}

/* ---------- שלב: הוכחה אלגברית (3 שורות, שורה 1 יכולה להיות נתונה) ---------- */
function algebra(stage,k,sp){
  var S=stateOf(stage),c=sp.c,a=sp.a,P0=poly(c),f=P0.f,ans=P0.fp(a),fa=f(a);
  function g1(h){return f(a+h)-fa}
  var T3=[g1,function(h){return g1(h)/h},function(){return ans}];
  var rows=$$('.qrow.mr',stage);
  function row(ri){return rows.filter(function(r){return +r.getAttribute('data-r')===ri+1})[0]}
  function solved(ri){
    var r=row(ri),s=$('.sol',r);if(s)s.hidden=false;
    var nx=row(ri+1);if(nx)nx.hidden=false;
  }
  $$('.mrow',stage).forEach(function(box){
    var ri=+box.getAttribute('data-r')-1;
    if(box.getAttribute('data-mode')==='expr'){DF.answerBox(box,T3[ri],function(){solved(ri)},function(){S.wrong++});return}
    var kf=DF.keyField(box),btn=$('.btn',box),fb=$('.fb',box);
    function go(){
      if(box.classList.contains('ok'))return;
      var v=numVal(kf);
      if(isNaN(v)){fb.textContent='הזינו מספר';fb.className='fb no';kf.mark(false);return}
      var ok=Math.abs(v-ans)<1e-9;kf.mark(ok);
      if(ok){fb.textContent='נכון';fb.className='fb ok';kf.close();pass(box);solved(ri)}
      else{S.wrong++;fb.textContent='לא מדויק, בדקו שוב';fb.className='fb no'}
    }
    btn.addEventListener('click',go);kf.onEnter(go);
  });
}

/* ---------- שלב: קופסה שחורה, שיפוע חותך מתוך נתונים בלבד ---------- */
function dataStage(stage,k,sp){
  var S=stateOf(stage),c=sp.c,a=sp.a,P0=poly(c),f=P0.f,fa=f(a),ans=P0.fp(a),pts=sp.pts;
  var xs=pts.map(function(p){return p.x}).concat([a]),ys=pts.map(function(p){return p.y}).concat([fa]);
  var x0=Math.min.apply(null,xs)-0.3,x1=Math.max.apply(null,xs)+0.3,ymin=Math.min.apply(null,ys),ymax=Math.max.apply(null,ys),pad=(ymax-ymin)*0.18||1;
  ymin-=pad;ymax+=pad;var gy=niceStep(ymax-ymin);
  var P=Plot($('#mv'+k),{xmin:x0,xmax:x1,ymin:ymin,ymax:ymax,W:640,H:340,gx:0.5,gy:gy,lx:0.5,ly:gy});
  var Ac=el('circle',{cx:P.X(a),cy:P.Y(fa),r:7,'class':'svg-ptA'},P.top);text(P.top,P.X(a)-14,P.Y(fa)-12,'A');
  pts.forEach(function(p,i){
    el('circle',{cx:P.X(p.x),cy:P.Y(p.y),r:6,'class':'svg-ptB'},P.top);
    text(P.top,P.X(p.x)+(p.h<0?-16:16),P.Y(p.y)-10,'B'+(i+1));
  });
  var qs=$$('.mq',stage),done=0,fin=$('#dfin'+k),lock=$('.mlock2',stage);
  qs.forEach(function(box){
    var kf=DF.keyField(box),btn=$('.btn',box),fb=$('.fb',box),want=+box.getAttribute('data-q');
    function go(){
      if(box.classList.contains('ok'))return;
      var v=numVal(kf);
      if(isNaN(v)){fb.textContent='הזינו מספר';fb.className='fb no';kf.mark(false);return}
      var ok=Math.abs(v-want)<1e-6;kf.mark(ok);
      if(ok){fb.textContent='נכון';fb.className='fb ok';kf.close();pass(box);done++;if(done===qs.length)fin.hidden=false}
      else{S.wrong++;fb.textContent='לא מדויק. השתמשו ב־(y של B − y של A) ÷ h';fb.className='fb no'}
    }
    btn.addEventListener('click',go);kf.onEnter(go);
  });
  var kf=DF.keyField(lock),btn=$('.btn',lock),fb=$('.fb',lock);
  function go(){
    if(lock.classList.contains('ok'))return;
    var v=numVal(kf);
    if(isNaN(v)){fb.textContent='הזינו מספר';fb.className='fb no';kf.mark(false);return}
    if(Math.abs(v-ans)<1e-9){
      kf.mark(true);kf.close();fb.textContent='ננעל!';fb.className='fb ok';
      P.path(f,x0,x1,200,'svg-curve');var tn=P.line(a,fa,ans,'svg-tan dash');
      P.top.parentNode.appendChild(P.top);
      $('#drev'+k).hidden=false;flash(stage);burstEl(stage,Ac);pass(lock);
    }else{
      S.wrong++;kf.mark(false);fb.className='fb no';
      fb.textContent=Math.abs(v-ans)<0.5?'קרוב. לאיזה מספר שלם מתקרבות המנות משני הצדדים?':'לא מדויק. הסתכלו על המנות משני הצדדים';
    }
  }
  btn.addEventListener('click',go);kf.onEnter(go);
}

/* ---------- אתגר וגשר: שאלות מספר ובחירה ---------- */
function misc(stage){
  var S=stateOf(stage);
  $$('.mnum',stage).forEach(function(box){
    var kf=DF.keyField(box),btn=$('.btn',box),fb=$('.fb',box),ans=+box.getAttribute('data-ans');
    function go(){
      if(box.classList.contains('ok'))return;
      var v=numVal(kf);
      if(isNaN(v)){fb.textContent='הזינו מספר';fb.className='fb no';kf.mark(false);return}
      var ok=Math.abs(v-ans)<1e-9;kf.mark(ok);
      if(ok){fb.textContent='נכון';fb.className='fb ok';kf.close();var rv=box.getAttribute('data-reveal');if(rv){var r=$(rv);if(r)r.hidden=false}pass(box)}
      else{S.wrong++;fb.textContent='לא מדויק, בדקו שוב';fb.className='fb no'}
    }
    btn.addEventListener('click',go);kf.onEnter(go);
  });
}

SP.forEach(function(sp,idx){
  var k=idx+1,stage=$('#s'+k);if(!stage)return;
  var fn={approach:approach,algebra:algebra,data:dataStage}[sp.kind];
  if(fn)fn(stage,k,sp);else misc(stage);
  stateOf(stage);
});

/* כוכבים בסיום שלב: 1 השלמה, 2 עד טעות אחת, 3 בלי טעויות ובלי רמזים */
function awardStars(stage){
  var S=stage._S,box=$('.stars',stage);if(!S||S.awarded||!box)return;
  S.awarded=true;
  var n=1+(S.wrong<=1?1:0)+(S.wrong===0&&!S.hinted?1:0);
  $$('i',box).forEach(function(s,j){if(j<n){s.classList.add('on','pop');setTimeout(function(){s.classList.remove('pop')},700)}});
  burstEl(stage,box);
  var w=$('.win',stage);if(w&&!w.id.indexOf('win'))w.hidden=false;
}

DF.hooks.push(function(stages){
  stages.forEach(function(s,i){
    s.classList.toggle('locked',i>0&&!stages[i-1].classList.contains('done'));
    if(s.classList.contains('done'))awardStars(s);
  });
});
DF.refresh();
})();
