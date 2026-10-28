/* מכונת הגבול: שלבי תרגול לחישוב נגזרת בנקודה לפי ההגדרה. נשען על window.DF */
(function(){
'use strict';
var DF=window.DF;if(!DF||!DF.parseExpr)return;
var $=DF.$,$$=DF.$$,el=DF.el,fmt=DF.fmt,pass=DF.pass,Plot=DF.Plot,text=DF.text,parseExpr=DF.parseExpr,same=DF.same;
var LV=JSON.parse($('#lv').textContent);
var HS=[1,0.5,0.1,0.01,0.001];
var reduce=window.matchMedia&&window.matchMedia('(prefers-reduced-motion:reduce)').matches;

function niceStep(r){var e=Math.pow(10,Math.floor(Math.log(r/6)/Math.LN10)),m=r/6/e;return (m<1.5?1:m<3.5?2:m<7.5?5:10)*e}

LV.forEach(function(L,idx){
  var k=idx+1,c=L.c,a=L.a;
  function f(x){var s=0;for(var i=0;i<c.length;i++)s+=c[i]*Math.pow(x,i);return s}
  function fp(x){var s=0;for(var i=1;i<c.length;i++)s+=i*c[i]*Math.pow(x,i-1);return s}
  var fa=f(a),ans=fp(a);
  var stage=$('#s'+k);
  /* גרף */
  var x0=a-2.2,x1=a+2.4,ymin=Infinity,ymax=-Infinity,i;
  for(i=0;i<=60;i++){var yy=f(x0+(x1-x0)*i/60);ymin=Math.min(ymin,yy);ymax=Math.max(ymax,yy)}
  var pad=(ymax-ymin)*0.12||1;ymin-=pad;ymax+=pad;
  var gy=niceStep(ymax-ymin);
  var P=Plot($('#mv'+k),{xmin:x0,xmax:x1,ymin:ymin,ymax:ymax,W:640,H:340,gx:1,gy:gy,lx:1,ly:gy});
  P.path(f,x0,x1,200,'svg-curve');
  var tan=P.line(a,fa,ans,'svg-tan dash');tan.style.display='none';
  var sec=P.line(a,fa,0,'svg-sec');
  var hCur=2;
  el('circle',{cx:P.X(a),cy:P.Y(fa),r:7,'class':'svg-ptA'},P.top);
  var tA=text(P.top,P.X(a)-14,P.Y(fa)-12,'A');
  var B=el('circle',{r:7,'class':'svg-ptB'},P.top);
  var tB=text(P.top,0,0,'B');
  function place(h){
    hCur=h;var q=(f(a+h)-fa)/h;
    P.setLine(sec,a,fa,q);
    var bx=P.X(a+h),by=P.Y(f(a+h));
    B.setAttribute('cx',bx);B.setAttribute('cy',by);
    tB.setAttribute('x',bx+14);tB.setAttribute('y',by-12);
  }
  place(hCur);
  function animateTo(h1){
    if(reduce){place(h1);return}
    var h0=hCur,t0=null;
    function stp(ts){if(t0===null)t0=ts;var p=Math.min(1,(ts-t0)/450),e=1-Math.pow(1-p,3);place(h0+(h1-h0)*e);if(p<1)requestAnimationFrame(stp)}
    requestAnimationFrame(stp);
  }
  /* כוכבים וחגיגה */
  var stars=$$('#mst'+k+' i'),starsOn=0;
  function setStars(n){
    for(var j=starsOn;j<n;j++){stars[j].classList.add('on','pop');(function(s){setTimeout(function(){s.classList.remove('pop')},700)})(stars[j])}
    starsOn=Math.max(starsOn,n);
  }
  var viz=$('#mv'+k).parentNode,bu=$('#bu'+k);
  function burst(){
    viz.classList.remove('flash');void viz.offsetWidth;viz.classList.add('flash');
    if(reduce)return;
    var cols=['#ffc83d','#5eead4','#ff5c8a','#fff'];
    var cx=P.X(a)/P.W*100,cy=P.Y(fa)/P.H*100;
    for(var j=0;j<22;j++){
      var d=document.createElement('span');d.className='dot';
      var ang=Math.random()*6.283,r=40+Math.random()*90;
      d.style.left=cx+'%';d.style.top=cy+'%';
      d.style.setProperty('--dx',Math.cos(ang)*r+'px');d.style.setProperty('--dy',Math.sin(ang)*r+'px');
      d.style.setProperty('--c1',cols[j%4]);
      bu.appendChild(d);
      (function(n){setTimeout(function(){if(n.parentNode)n.parentNode.removeChild(n)},1000)})(d);
    }
  }
  /* מונה טעויות ורמזים */
  var wrong=0,hinted=false;
  $$('details.hint',stage).forEach(function(d){d.addEventListener('toggle',function(){if(d.open)hinted=true})});
  /* קירוב */
  var hi=-1,near=$('#near'+k),log=$('#log'+k+' tbody');
  near.addEventListener('click',function(){
    if(hi>=HS.length-1)return;
    hi++;var h=HS[hi],q=(f(a+h)-fa)/h;
    animateTo(h);
    var tr=document.createElement('tr');tr.className='new';
    tr.innerHTML='<td class="num">'+fmt(h,3)+'</td><td class="num">'+fmt(q,4)+'</td>';
    log.appendChild(tr);
    if(hi>=HS.length-1){near.disabled=true;$('#nfb'+k).textContent='B קרוב מאוד ל־A'}
  });
  /* נעילת שיפוע */
  var lock=$('.mlock',stage),alg=$('#alg'+k);
  (function(){
    var inp=$('input',lock),btn=$('.btn',lock),fb=$('.fb',lock);
    function go(){
      if(lock.classList.contains('ok'))return;
      var g=parseExpr(inp.value),v=g?g(0):NaN;
      if(isNaN(v)){fb.textContent='הקלידו מספר';fb.className='fb no';return}
      if(Math.abs(v-ans)<1e-9){
        inp.classList.add('right');inp.classList.remove('wrong');fb.textContent='ננעל!';fb.className='fb ok';
        tan.style.display='';animateTo(0.001);setStars(1);burst();alg.hidden=false;pass(lock);
      }else{
        wrong++;inp.classList.add('wrong');fb.className='fb no';
        fb.textContent=Math.abs(v-ans)<0.05?'קרוב מאוד. לאיזה מספר מתייצבת המנה?':'לא מדויק. קרבו את B עוד והסתכלו בטבלה';
      }
    }
    btn.addEventListener('click',go);inp.addEventListener('keydown',function(e){if(e.key==='Enter')go()});
  })();
  /* הוכחה אלגברית: ביטוי ב-h, נבדק בהצבת ערכים */
  function g1(h){return f(a+h)-fa}
  var T3=[g1,function(h){return g1(h)/h},function(){return ans}];
  var rowsEl=$$('.qrow.mr',stage);
  function solved(box,ri){
    $('.sol',rowsEl[ri]).hidden=false;
    if(rowsEl[ri+1])rowsEl[ri+1].hidden=false;
    if(ri===2){
      setStars(2);if(!hinted&&wrong<=1)setStars(3);
      burst();$('#win'+k).hidden=false;
    }
  }
  $$('.mrow',stage).forEach(function(box,ri){
    if(box.classList.contains('tb')){
      DF.termBox(box,T3[ri],function(b){solved(b,ri)},function(){wrong++});
      return;
    }
    var inp=$('input',box),btn=$('.btn',box),fb=$('.fb',box);
    function go(){
      if(box.classList.contains('ok'))return;
      var g=parseExpr(inp.value),v=g?g(0):NaN;
      if(isNaN(v)){fb.textContent='הקלידו מספר';fb.className='fb no';inp.classList.add('wrong');return}
      var ok=Math.abs(v-ans)<1e-9;
      inp.classList.toggle('right',ok);inp.classList.toggle('wrong',!ok);
      if(ok){fb.textContent='נכון';fb.className='fb ok';pass(box);solved(box,ri)}
      else{wrong++;fb.textContent='לא מדויק, בדקו שוב';fb.className='fb no'}
    }
    btn.addEventListener('click',go);inp.addEventListener('keydown',function(e){if(e.key==='Enter')go()});
  });
});

/* נעילת שלבים: הבא נפתח אחרי שהקודם הושלם */
DF.hooks.push(function(stages){
  stages.forEach(function(s,i){
    s.classList.toggle('locked',i>0&&!stages[i-1].classList.contains('done'));
  });
});
DF.refresh();
})();
