/* קורא ביטויים אלגבריים בטוח + תיבות תשובה. משותף לעמודי rules ו-missions. נטען אחרי defn.js */
(function(){
'use strict';
var DF=window.DF;if(!DF)return;
var $=DF.$,$$=DF.$$,pass=DF.pass;

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

/* כפתור ± ליד שדה מספר (במקלדות בטלפון אין מינוס) */
document.addEventListener('click',function(e){
  var b=e.target;if(!b.classList||!b.classList.contains('pm'))return;
  var inp=b.nextElementSibling;while(inp&&inp.tagName!=='INPUT')inp=inp.nextElementSibling;
  if(!inp)return;
  inp.value=inp.value.charAt(0)==='-'?inp.value.slice(1):'-'+inp.value;
  inp.focus();
});

/* בונה איברים: [±][מקדם]·x^[חזקה] + ... + [איבר חופשי]. בלי הקלדת נוסחאות (טלפון) */
function termBox(box,fn,onok,onwrong){
  var vr=box.getAttribute('data-var')||'x',body=$('.tbody',box),fb=$('.fb',box),btn=$('.btn',box);
  body.innerHTML='<span class="tl"></span><button type="button" class="btn small ghost tadd">+ איבר</button>'+
    '<span class="tk"><span class="tp">+</span><button type="button" class="pm" aria-label="הפיכת סימן">±</button><input class="tf" type="text" inputmode="decimal" autocomplete="off" spellcheck="false" placeholder="איבר חופשי" aria-label="איבר חופשי"></span>';
  var tl=$('.tl',body),add=$('.tadd',body),n=0;
  function addTerm(){
    if(n>=5)return;n++;
    var t=document.createElement('span');t.className='term';
    t.innerHTML=(n>1?'<span class="tp">+</span>':'')+'<button type="button" class="pm" aria-label="הפיכת סימן">±</button>'+
      '<input class="tc" type="text" inputmode="decimal" autocomplete="off" spellcheck="false" placeholder="מקדם" aria-label="מקדם">'+
      '<span class="tv">'+vr+'</span><span class="tx">^</span>'+
      '<input class="te" type="text" inputmode="numeric" autocomplete="off" spellcheck="false" placeholder="חזקה" aria-label="חזקה">'+
      (n>1?'<button type="button" class="tdel" aria-label="מחיקת איבר">✕</button>':'');
    tl.appendChild(t);
    var d=$('.tdel',t);if(d)d.addEventListener('click',function(){tl.removeChild(t);n--;add.hidden=false});
    if(n>=5)add.hidden=true;
  }
  add.addEventListener('click',addTerm);addTerm();
  function bad(msg){fb.textContent=msg;fb.className='fb no';if(onwrong)onwrong()}
  function num(str){var g=parseExpr(str);var v=g?g(0):NaN;return v}
  function go(){
    if(box.classList.contains('ok'))return;
    var T=[],seen={},k=0,ks=$('.tf',body).value.trim(),i,ts=$$('.term',tl),err='';
    for(i=0;i<ts.length;i++){
      var cs=$('.tc',ts[i]).value.trim(),es=$('.te',ts[i]).value.trim();
      if(!cs&&!es)continue;
      var c=num(cs),e=Number(es);
      if(!cs||!es||isNaN(c)||!/^\d+$/.test(es)||e<1){err='בכל איבר מלאו מקדם וחזקה (מספר שלם, 1 ומעלה). איבר בלי '+vr+' כתבו בשדה האיבר החופשי';break}
      if(seen[e]){err='יש שני איברים עם אותה חזקה. אחדו אותם';break}
      seen[e]=1;T.push([c,e]);
    }
    if(!err){
      if(ks){k=num(ks);if(isNaN(k))err='באיבר החופשי כתבו מספר'}
      else if(!T.length)err='הוסיפו איבר'
    }
    if(err){bad(err);return}
    var g=function(x){var s=k;for(var j=0;j<T.length;j++)s+=T[j][0]*Math.pow(x,T[j][1]);return s};
    var ok=same(g,fn);
    $$('input',body).forEach(function(q){q.classList.toggle('right',ok);q.classList.toggle('wrong',!ok)});
    if(ok){fb.textContent='נכון';fb.className='fb ok';pass(box);if(onok)onok(box)}
    else bad('לא מדויק, בדקו שוב');
  }
  btn.addEventListener('click',go);
  body.addEventListener('keydown',function(e){if(e.key==='Enter'&&e.target.tagName==='INPUT')go()});
}
DF.termBox=termBox;DF.parseExpr=parseExpr;DF.same=same;DF.answerBox=answerBox;DF.setBox=setBox;
})();
