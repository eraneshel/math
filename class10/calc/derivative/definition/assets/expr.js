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
/* שדה הזנה במקלדת מובנית בדף (בלי מקלדת מערכת): ספרות, משתנה, ^, +, −, מחיקה */
var openKF=null;
function keyField(box){
  if(box._kf)return box._kf;
  var mode=box.getAttribute('data-mode')||'num',vr=box.getAttribute('data-var')||'x';
  var fld=$('.kfield',box),s='',panel=null,enter=null;
  fld.setAttribute('tabindex','0');fld.setAttribute('role','textbox');fld.setAttribute('aria-label','תשובה');
  function render(){
    if(!s){fld.innerHTML='<span class="ph">לחצו להזנה</span>';return}
    fld.innerHTML=s.replace(/\^(\d*)/g,function(m,d){return d?'<sup>'+d+'</sup>':'<sup class="ph">□</sup>'}).replace(/-/g,'−');
  }
  function press(k){
    if(k==='del'){s=s.slice(0,-1)}
    else{
      if(s.length>=24)return;
      if(k==='^'&&(!s||/[+\-^]$/.test(s)))return;
      if(mode==='num'&&k==='-'){s=s.charAt(0)==='-'?s.slice(1):'-'+s;render();return}
      s+=k;
    }
    render();fld.classList.remove('right','wrong');
  }
  function build(){
    var keys=mode==='expr'?['7','8','9','4','5','6','1','2','3','0',vr,'^','+','-','del']:['7','8','9','4','5','6','1','2','3','-','0','del'];
    panel=document.createElement('div');panel.className='kpad kp-'+mode;panel.hidden=true;
    keys.forEach(function(k){
      var b=document.createElement('button');b.type='button';b.className='key'+(k==='del'?' del':'');b.setAttribute('data-k',k);
      b.textContent=k==='del'?'⌫':k==='-'?'−':k==='^'?'חזקה ▫':k;
      b.addEventListener('click',function(){press(k);fld.focus()});
      panel.appendChild(b);
    });
    box.appendChild(panel);
  }
  function open(){
    if(box.classList.contains('ok'))return;
    if(openKF&&openKF!==api)openKF.close();
    if(!panel)build();
    panel.hidden=false;fld.classList.add('open');openKF=api;
  }
  function close(){if(panel)panel.hidden=true;fld.classList.remove('open');if(openKF===api)openKF=null}
  fld.addEventListener('click',function(){if(panel&&!panel.hidden)close();else open()});
  fld.addEventListener('keydown',function(e){
    var k=e.key;
    if(k==='Enter'){if(enter)enter();e.preventDefault();return}
    if(k==='Backspace'){press('del');e.preventDefault();return}
    if(k===' '){open();e.preventDefault();return}
    if(/^\d$/.test(k)||k==='^'||k==='+'||k==='-'){press(k);e.preventDefault();return}
    if(mode==='expr'&&(k==='x'||k==='h'||k==='X'||k==='H')){press(vr);e.preventDefault()}
  });
  var api={
    val:function(){return s},
    mark:function(ok){fld.classList.toggle('right',ok===true);fld.classList.toggle('wrong',ok===false)},
    onEnter:function(f){enter=f},
    open:open,close:close
  };
  render();box._kf=api;return api;
}

/* ביטוי עם שני איברים באותה חזקה אינו מצומצם */
function dupPower(norm){
  var seen={},parts=norm.replace(/-/g,'+-').split('+').filter(Boolean),i,m,e;
  for(i=0;i<parts.length;i++){
    m=/^-?(\d*)(x)?(?:\^(\d+))?$/.exec(parts[i]);
    if(!m)return false;
    e=m[2]?(m[3]?+m[3]:1):0;
    if(seen[e])return true;seen[e]=1;
  }
  return false;
}

/* תיבת תשובה: מספר (data-mode=num) או ביטוי (expr), נבדקים בהצבת ערכים */
function answerBox(box,fn,onok,onwrong){
  var kf=keyField(box),btn=$('.btn',box),fb=$('.fb',box),vr=box.getAttribute('data-var')||'x',mode=box.getAttribute('data-mode')||'num';
  function bad(msg){fb.textContent=msg;fb.className='fb no';kf.mark(false);if(onwrong)onwrong()}
  function go(){
    if(box.classList.contains('ok'))return;
    var raw=kf.val();
    if(!raw){bad(mode==='num'?'הזינו מספר':'הזינו ביטוי');return}
    var norm=vr==='h'?raw.replace(/h/g,'x'):raw,g=parseExpr(norm);
    if(!g){bad(mode==='num'?'הזינו מספר':'הביטוי לא שלם');return}
    if(mode==='expr'&&dupPower(norm)){bad('יש שני איברים עם אותה חזקה. אחדו אותם');return}
    var ok=same(g,fn);
    kf.mark(ok);
    if(ok){fb.textContent='נכון';fb.className='fb ok';kf.close();pass(box);if(onok)onok(box)}
    else bad('לא מדויק, בדקו שוב');
  }
  btn.addEventListener('click',go);kf.onEnter(go);
}

DF.keyField=keyField;DF.parseExpr=parseExpr;DF.same=same;DF.answerBox=answerBox;
})();
