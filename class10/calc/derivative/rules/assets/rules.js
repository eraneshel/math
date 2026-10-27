/* כללי גזירה: הקניה עצמית. נשען על window.DF מ-definition/assets/defn.js */
(function(){
'use strict';
var DF=window.DF;if(!DF)return;
var $=DF.$,$$=DF.$$,el=DF.el,fmt=DF.fmt,pass=DF.pass,Plot=DF.Plot,text=DF.text;

var answerBox=DF.answerBox;
var T={
  d2:function(x){return 2*x},
  d3:function(x){return 3*x*x},
  d4:function(x){return 4*Math.pow(x,3)},
  q2:function(x){return 5*Math.pow(x,4)},
  p1:function(x){return 5*Math.pow(x,4)-3},
  p2:function(x){return 6*x*x+8*x-1},
  p3:function(x){return 2*x+1},
  p4:function(x){return 2*Math.pow(x,3)-x*x},
  t2:function(){return 2},
  t3:function(x){return 3*x*x-3},
  t4:function(){return 9},
  t5:function(x){return 9*x-16}
};
$$('.ans[data-t]').forEach(function(b){
  answerBox(b,T[b.getAttribute('data-t')],function(){
    var nx=b.getAttribute('data-next');if(nx){var n=$(nx);if(n)n.hidden=false}
    var sol=b.getAttribute('data-sol');if(sol){var s=$(sol);if(s)s.hidden=false;var sb=$('.showsol[data-for="'+sol+'"]');if(sb)sb.hidden=true}
    if(b.getAttribute('data-t')==='t5')drawTangent();
    if(/^d\d$/.test(b.getAttribute('data-t'))&&$$('.ans[data-t^="d"]').every(function(x){return x.classList.contains('ok')})){var q=$('#q2box');if(q)q.hidden=false}
  });
});
/* פתרון מלא אחרי ניסיון */
$$('.showsol').forEach(function(btn){btn.addEventListener('click',function(){var s=$(btn.getAttribute('data-for'));if(s)s.hidden=false;btn.hidden=true})});

/* ---------- שלב 1: משיק ← טבלה ---------- */
(function(){
  var svg=$('#v1');if(!svg)return;
  var n=2,a=1,filled={},R={2:[10,2.5],3:[30,2.5],4:[90,2.5]};
  function slope(n,a){return n*Math.pow(a,n-1)}
  function draw(){
    svg.innerHTML='';
    var ym=R[n][0],P=Plot(svg,{xmin:-0.5,xmax:3.6,ymin:-ym*0.08,ymax:ym,W:640,H:340,gx:1,gy:ym/5,lx:1,ly:ym/5});
    P.path(function(x){return Math.pow(x,n)},-0.5,3.6,200,'svg-curve');
    var m=slope(n,a),y=Math.pow(a,n);
    P.line(a,y,m,'svg-tan');
    el('circle',{cx:P.X(a),cy:P.Y(y),r:7,'class':'svg-ptA'},P.top);
    $('#sl1').textContent=fmt(m,0);
    $('#add1fb').textContent='';
  }
  $$('#fch button').forEach(function(b){b.addEventListener('click',function(){
    n=+b.getAttribute('data-n');$$('#fch button').forEach(function(o){o.setAttribute('aria-pressed',o===b)});draw()})});
  $$('#xch button').forEach(function(b){b.addEventListener('click',function(){
    a=+b.getAttribute('data-a');$$('#xch button').forEach(function(o){o.setAttribute('aria-pressed',o===b)});draw()})});
  $('#add1').addEventListener('click',function(){
    var td=$('#slopes tr[data-n="'+n+'"] td[data-a="'+a+'"]');
    td.textContent=fmt(slope(n,a),0);td.classList.add('filled');
    filled[n+'_'+a]=1;
    var row=$('#slopes tr[data-n="'+n+'"]');
    if([1,2,3].every(function(k){return filled[n+'_'+k]})){
      var l=$('.lockd',row);if(l)l.hidden=true;$('.ans',row).hidden=false}
    $('#add1fb').textContent='נוסף';
  });
  draw();
})();

/* ---------- שלב 2: חשיפת צעדים ---------- */
(function(){
  var rows=$$('#ex2 tbody tr');if(!rows.length)return;
  var k=1,btn=$('#ex2go'),ok=$('#ok2');
  rows.forEach(function(r,i){r.hidden=i>=1});
  btn.addEventListener('click',function(){
    if(k<rows.length){rows[k++].hidden=false}
    if(k>=rows.length){btn.hidden=true;ok.hidden=false}
  });
  ok.addEventListener('click',function(){pass(ok);ok.disabled=true;ok.textContent='נמשיך'});
})();

/* ---------- שלב 4: גרף משיק ---------- */
var drawTangent=function(){};
(function(){
  var svg=$('#v4');if(!svg)return;
  function f(x){return x*x*x-3*x}
  var P=Plot(svg,{xmin:-2.5,xmax:3,ymin:-5,ymax:14,W:640,H:360,gx:1,gy:2,lx:1,ly:4});
  P.path(f,-2.5,3,200,'svg-curve');
  el('circle',{cx:P.X(2),cy:P.Y(2),r:7,'class':'svg-ptA'},P.top);
  text(P.top,P.X(2)-18,P.Y(2)+22,'A');
  drawTangent=function(){
    if($('#tan4'))return;
    var l=P.line(2,2,9,'svg-tan');l.setAttribute('id','tan4');
    $('#cap4').hidden=false;
  };
})();

/* ---------- נעילת שלבים: הבא נפתח אחרי הקודם ---------- */
DF.hooks.push(function(stages){
  stages.forEach(function(s,i){
    var lock=i>0&&!stages[i-1].classList.contains('done');
    s.classList.toggle('locked',lock);
  });
});
DF.refresh();
})();
