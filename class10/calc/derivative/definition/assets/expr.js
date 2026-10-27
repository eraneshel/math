/* קורא ביטויים אלגבריים בטוח + תיבות תשובה. משותף לעמודי rules ו-missions. נטען אחרי defn.js */
(function(){
'use strict';
var DF=window.DF;if(!DF)return;
var $=DF.$,pass=DF.pass;

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

/* תיבה של שני מספרים (קבוצה, בלי חשיבות לסדר) */
function setBox(box,vals,onok){
  var ins=Array.prototype.slice.call(box.querySelectorAll('input')),btn=$('.btn',box),fb=$('.fb',box);
  function go(){
    var v=ins.map(function(i){var g=parseExpr(i.value);return g?g(0):NaN});
    if(v.some(isNaN)){fb.textContent='הקלידו מספרים בכל התיבות';fb.className='fb no';return}
    var a=v.slice().sort(function(x,y){return x-y}),b=vals.slice().sort(function(x,y){return x-y});
    var ok=a.length===b.length&&a.every(function(x,i){return Math.abs(x-b[i])<1e-6});
    ins.forEach(function(i){i.classList.toggle('right',ok);i.classList.toggle('wrong',!ok)});
    if(ok){fb.textContent='נכון';fb.className='fb ok';if(!box.classList.contains('ok')){pass(box);if(onok)onok(box)}}
    else{fb.textContent='לא מדויק, בדקו שוב';fb.className='fb no'}
  }
  btn.addEventListener('click',go);
  ins.forEach(function(i){i.addEventListener('keydown',function(e){if(e.key==='Enter')go()})});
}
DF.parseExpr=parseExpr;DF.same=same;DF.answerBox=answerBox;DF.setBox=setBox;
})();
