/* כללי גזירה: הקניה עצמית. נשען על window.DF מ-definition/assets/defn.js */
(function(){
'use strict';
var DF=window.DF;if(!DF)return;
var $=DF.$,$$=DF.$$,el=DF.el,fmt=DF.fmt,pass=DF.pass,Plot=DF.Plot,text=DF.text;

var answerBox=DF.answerBox;
var T={
  q1:function(x){return 4*Math.pow(x,3)},
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
  });
});
/* פתרון מלא אחרי ניסיון */
$$('.showsol').forEach(function(btn){btn.addEventListener('click',function(){var s=$(btn.getAttribute('data-for'));if(s)s.hidden=false;btn.hidden=true})});

/* ---------- שלב 1: טבלת שיפועים ---------- */
(function(){
  var tb=$('#slopes tbody');if(!tb)return;
  var F=[
    {k:'5',f:function(){return 5}},
    {k:'x',f:function(x){return x}},
    {k:'x2',f:function(x){return x*x}},
    {k:'x3',f:function(x){return x*x*x}},
    {k:'x4',f:function(x){return Math.pow(x,4)}}
  ];
  function slope(f,a){var h=1e-4;return (f(a+h)-f(a-h))/(2*h)}
  $$('tr[data-k]',tb).forEach(function(tr){
    var d=F.filter(function(o){return o.k===tr.getAttribute('data-k')})[0];
    $$('td.s',tr).forEach(function(td,i){td.textContent=fmt(slope(d.f,i+1),2)});
  });
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
