/* Shared star portal. Canvas work exists only for the short transition. */
(() => {
 'use strict';
 const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
 let frame = null, active = false, navigation = null;
 const overlay = document.createElement('div');
 overlay.id = 'ecosystemTransit'; overlay.setAttribute('aria-hidden','true');
 overlay.innerHTML = '<canvas></canvas><div class="transit-label"><small>ONE ECOSYSTEM · TWO WORLDS</small><strong></strong><span>crossing the star field</span></div>';
 document.body.appendChild(overlay);
 const canvas = overlay.querySelector('canvas'), label = overlay.querySelector('strong');
 function reset(){cancelAnimationFrame(frame);frame=null;clearTimeout(navigation);navigation=null;active=false;overlay.classList.remove('active','arrival');overlay.setAttribute('aria-hidden','true');}
 function journey(title, arrival=false){
  active=true;label.textContent=title;overlay.classList.toggle('arrival',arrival);overlay.classList.add('active');overlay.setAttribute('aria-hidden','false');
  const ctx=canvas.getContext('2d');if(!ctx)return;
  const width=innerWidth,height=innerHeight,dpr=Math.min(devicePixelRatio||1,1.5);
  canvas.width=width*dpr;canvas.height=height*dpr;ctx.scale(dpr,dpr);
  const radius=Math.hypot(width,height)*.65;
  const stars=Array.from({length:width<700?260:480},(_,i)=>({angle:Math.random()*Math.PI*2,depth:Math.random(),size:.45+Math.random()*1.4,hue:[155,185,215,270,310,42][i%6],offset:Math.random()*4}));
  let start=null,last=-Infinity;
  function draw(time){
   if(start===null)start=time;const elapsed=time-start,progress=Math.min(elapsed/(arrival?900:1800),1);
   if(time-last>=32){last=time;ctx.fillStyle='rgba(1,4,13,.30)';ctx.fillRect(0,0,width,height);ctx.save();ctx.translate(width/2,height/2);
    ctx.globalCompositeOperation='lighter';
    for(const star of stars){
     const travel=(star.depth+elapsed*.00024)%1,r=(.035+travel*travel)*radius*(arrival?1.25:1-progress*.30);
     const angle=star.angle+elapsed*.00013+star.offset*travel*.13;
     const x=Math.cos(angle)*r,y=Math.sin(angle)*r;
     ctx.strokeStyle=`hsla(${star.hue},100%,72%,${.2+travel*.65})`;ctx.lineWidth=star.size;
     ctx.beginPath();ctx.moveTo(x,y);const streak=1+progress*progress*.22;ctx.lineTo(x*streak,y*streak);ctx.stroke();
     ctx.fillStyle=`hsla(${star.hue},100%,78%,${.4+travel*.5})`;ctx.beginPath();ctx.arc(x,y,star.size*(.5+travel),0,Math.PI*2);ctx.fill();
    }
    for(let ring=0;ring<3;ring++){const r=(Math.min(width,height)*(.14+ring*.04))*(1+progress*.65);ctx.lineWidth=.7;ctx.strokeStyle=`hsla(${170+ring*55},100%,70%,${.45*(1-progress*.7)})`;ctx.beginPath();ctx.ellipse(0,0,r,r*.72,elapsed*.0003,0,Math.PI*2);ctx.stroke();}
    ctx.restore();
   }
   if(progress<1)frame=requestAnimationFrame(draw);
  }
  frame=requestAnimationFrame(draw);
 }
 document.addEventListener('click',event=>{
  const link=event.target.closest?.('a[data-star-portal]');if(!link||event.defaultPrevented||event.button!==0||event.metaKey||event.ctrlKey||event.shiftKey||event.altKey||link.target==='_blank')return;
  if(reduced)return;
  event.preventDefault();if(active)return;
  try{if(typeof soundEnabled!=='undefined'&&soundEnabled&&typeof startEntryTone==='function')startEntryTone();}catch{}
  journey(link.dataset.world||link.textContent.trim());
  navigation=setTimeout(()=>location.assign(link.href),1800);
 });
 window.addEventListener('pagehide',reset);
 document.addEventListener('visibilitychange',()=>{if(document.hidden&&active){cancelAnimationFrame(frame);frame=null;}});
 window.addEventListener('pageshow',()=>{
  reset();const url=new URL(location.href);
  if(url.searchParams.has('from')){
   const from=url.searchParams.get('from');if(from!=='robotcyb'&&from!=='cicadafarm')return;
   url.searchParams.delete('from');url.searchParams.delete('portalv');history.replaceState(null,'',url);
   if(!reduced){journey(from==='robotcyb'?'CICADAFARM':'ROBOTCYB',true);navigation=setTimeout(reset,950);}
  }
 });
})();
