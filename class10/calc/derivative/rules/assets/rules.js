/* כללי גזירה: הקניה עצמית. נשען על window.DF מ-definition/assets/defn.js */
(function(){
'use strict';
var DF=window.DF;if(!DF)return;
var $=DF.$,$$=DF.$$,el=DF.el,fmt=DF.fmt,pass=DF.pass,Plot=DF.Plot,text=DF.text;

/* ---------- קורא ביטויים אלגבריים בטוח ---------- */
function tokenize(s){
  s=String(s).replace(/[−–‒]/g,'-').replace(/[×·⋅]/g,'*').replace(/÷/g,'/')
    .replace(/²/g,'^2').replace(/³/g,'^3').replace(/⁴/g,'^4').replace(/⁵/g,'^5').replace(/⁶/g,'^6')
    .replace(/,/g,'.').replace(/\s+/g,'').replace(/X/g,'x');
  s=s.replace(/^(?:f|y|g)?(?:'|′)?(?:\(x\))?=/i,'');
  var out=[],i=0,m;
  while(i<s.length){
    var c=s[i];
    if(/[0-9.]/.test(c)){m=/^[0-9]*\.?[0-9]+|^[0-9]+\.?/.exec(s.slice(i));if(!m)return null;out.push({t:'n',v:parseFloat(m[0])});i+=m[0].length}
    else if(c==='x'){out.push({t:'x'});i++}
    else if('+-*/^()'.indexOf(c)>=0){out.push({t:c});i++}
    else return null;
  }
  return out;
}
function parseExpr(s){
  var tk=tokenize(s);if(!tk||!tk.length)return null;
  var p=0;
  function peek(){return tk[p]?tk[p].t:null}
  function expr(){
    var l=term();if(!l)return null;
    while(peek()==='+'||peek()==='-'){
      var op=tk[p++].t,r=term();if(!r)return null;
      l=(function(a,b,o){return o==='+'?function(x){return a(x)+b(x)}:function(x){return a(x)-b(x)}})(l,r,op);
    }
    return l;
  }
  function term(){
    var l=unary();if(!l)return null;
    for(;;){
      var k=peek();
      if(k==='*'||k==='/'){p++;var r=unary();if(!r)return null;l=(function(a,b,o){return o==='*'?function(x){return a(x)*b(x)}:function(x){return a(x)/b(x)}})(l,r,k)}
      else if(k==='x'||k==='('||k==='n'){var r2=unary();if(!r2)return null;l=(function(a,b){return function(x){return a(x)*b(x)}})(l,r2)}
      else break;
    }
    return l;
  }
  function unary(){
    if(peek()==='-'){p++;var u=unary();if(!u)return null;return function(x){return -u(x)}}
    if(peek()==='+'){p++;return unary()}
    return power();
  }
  function power(){
    var b=atom();if(!b)return null;
    if(peek()==='^'){p++;var e=unary();if(!e)return null;return function(x){return Math.pow(b(x),e(x))}}
    return b;
  }
  function atom(){
    var k=peek();
    if(k==='n'){var v=tk[p++].v;return function(){return v}}
    if(k==='x'){p++;return function(x){return x}}
    if(k==='('){p++;var e=expr();if(!e||peek()!==')')return null;p++;return e}
    return null;
  }
  var f=expr();
  if(!f||p!==tk.length)return null;
  return f;
}
var PTS=[-2.3,-1.1,-0.6,0.7,1.9,3.1];
function same(f,g){
  return PTS.every(function(x){var a=f(x),b=g(x);return isFinite(a)&&Math.abs(a-b)<=1e-6*Math.max(1,Math.abs(b))});
}

/* ---------- תיבת תשובה (ביטוי או מספר) ---------- */
function answerBox(box,fn,onok){
  var inp=$('input',box),btn=$('.btn',box),fb=$('.fb',box);
  function go(){
    var g=parseExpr(inp.value);
    if(!g){fb.textContent='לא הצלחתי לקרוא את הביטוי. כתבו למשל 3x^2-6x';fb.className='fb no';inp.classList.add('wrong');return}
    var ok=same(g,fn);
    inp.classList.toggle('right',ok);inp.classList.toggle('wrong',!ok);
    if(ok){fb.textContent='נכון';fb.className='fb ok';if(!box.classList.contains('ok')){pass(box);if(onok)onok(box)}}
    else{fb.textContent='לא מדויק, בדקו שוב';fb.className='fb no'}
  }
  btn.addEventListener('click',go);
  inp.addEventListener('keydown',function(e){if(e.key==='Enter')go()});
}
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
