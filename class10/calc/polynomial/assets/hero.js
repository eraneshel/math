/* hero particles — same effect as class10 */

(function(){
if(matchMedia('(prefers-reduced-motion:reduce)').matches)return;
var SYM=['∑','π','√','∞','∠','Δ','θ','x²','½','≈','⊥','∥','α','%'],COL=['#67e8f9','#5eead4','#a7f3d0','#c4b5fd','#ffffff','#a5b4fc','#f0abfc'];
document.querySelectorAll('.hero').forEach(function(h){
var c=document.createElement('canvas');c.className='hfx';h.insertBefore(c,h.firstChild);
var x=c.getContext('2d'),W,H,D=Math.min(devicePixelRatio||1,2),P=[],vis=true,mx=-999,my=-999,raf;
function rs(){var r=h.getBoundingClientRect();W=r.width;H=r.height;c.width=W*D;c.height=H*D;x.setTransform(D,0,0,D,0,0)}
rs();addEventListener('resize',rs);
function mk(px,py,sp,burst){var a=Math.random()*6.283,v=sp*(.3+Math.random());
return{x:px,y:py,vx:Math.cos(a)*v,vy:Math.sin(a)*v,s:burst?(Math.random()<.5?'':SYM[Math.random()*SYM.length|0]):SYM[Math.random()*SYM.length|0],k:Math.random()*3|0,z:burst?6+Math.random()*12:10+Math.random()*22,c:COL[Math.random()*COL.length|0],r:Math.random()*6.28,vr:(Math.random()-.5)*.08,l:burst?1:2,d:burst?.012+Math.random()*.012:0,t:Math.random()*6.28}}
function boom(px,py,n,sp){for(var i=0;i<n;i++)P.push(mk(px,py,sp,true))}
function amb(){for(var i=0;i<Math.min(26,W/36|0);i++){var p=mk(Math.random()*W,Math.random()*H,.35,false);p.l=1;P.push(p)}}
amb();
function sock(){['shock','shock s2'].forEach(function(cl){var s=document.createElement('div');s.className=cl;h.appendChild(s);setTimeout(function(){s.remove()},2200)})}
setTimeout(function(){boom(W*.22,H*.5,70,9);boom(W*.75,H*.5,70,9);sock()},150);
setInterval(function(){if(vis&&!document.hidden)boom(W*(.1+Math.random()*.8),H*(.15+Math.random()*.6),26,6)},4200);
h.addEventListener('pointerdown',function(e){var r=h.getBoundingClientRect();boom(e.clientX-r.left,e.clientY-r.top,60,10);sock()});
h.addEventListener('pointermove',function(e){var r=h.getBoundingClientRect();mx=e.clientX-r.left;my=e.clientY-r.top});
h.addEventListener('pointerleave',function(){mx=my=-999});
if(window.IntersectionObserver)new IntersectionObserver(function(en){vis=en[0].isIntersecting;if(vis&&!raf)loop()}).observe(h);
function drawShape(p){x.beginPath();if(p.k==0){x.arc(0,0,p.z*.35,0,6.283)}else if(p.k==1){var r=p.z*.5;x.moveTo(0,-r);x.lineTo(r*.87,r*.5);x.lineTo(-r*.87,r*.5);x.closePath()}else{var q=p.z*.4;x.rect(-q,-q,2*q,2*q)}x.stroke()}
function loop(){raf=0;if(!vis)return;x.clearRect(0,0,W,H);
for(var i=P.length-1;i>=0;i--){var p=P[i];
if(mx>-900){var dx=p.x-mx,dy=p.y-my,d2=dx*dx+dy*dy;if(d2<14000){var f=(1-d2/14000)*1.4,d=Math.sqrt(d2)||1;p.vx+=dx/d*f;p.vy+=dy/d*f}}
p.x+=p.vx;p.y+=p.vy;p.r+=p.vr;p.t+=.03;
if(p.d){p.vx*=.965;p.vy*=.965;p.vy+=.03;p.l-=p.d;if(p.l<=0){P.splice(i,1);continue}}
else{p.vx*=.985;p.vy*=.985;p.vx+=Math.cos(p.t)*.004;p.vy+=Math.sin(p.t*.8)*.004;if(p.x<-30)p.x=W+30;if(p.x>W+30)p.x=-30;if(p.y<-30)p.y=H+30;if(p.y>H+30)p.y=-30}
var a=p.d?Math.min(1,p.l*1.4):.28+.16*Math.sin(p.t*2);
x.save();x.translate(p.x,p.y);x.rotate(p.r);x.globalAlpha=a;x.shadowColor=p.c;x.shadowBlur=p.d?14:8;x.fillStyle=x.strokeStyle=p.c;x.lineWidth=1.6;
if(p.s){x.font='700 '+p.z+'px "STIX Two Text","Frank Ruhl Libre",serif';x.textAlign='center';x.textBaseline='middle';x.fillText(p.s,0,0)}else drawShape(p);
x.restore()}
raf=requestAnimationFrame(loop)}
loop()})
})();
