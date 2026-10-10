// Static CicadaFarm site, adapted from the supplied 5.6 pixel twin.
const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
const compactDevice = matchMedia('(max-width: 700px)').matches;
const farmStore = FarmRuntime.createStore(() => window.localStorage, () => {
  document.getElementById('storageNotice').hidden = false;
});
function readChat() {
  return FarmRuntime.readArray(farmStore, 'cybchatMessages', 80, m =>
    m && typeof m.from === 'string' && typeof m.text === 'string' &&
    m.from.length <= 100 && m.text.length <= 4000 && Number.isFinite(m.ts) &&
    (m.transport === undefined || typeof m.transport === 'string'));
}
let farmEntered = false, entryLoading = false, entryController = null;
function loadThree() {
  if (window.THREE) return Promise.resolve();
  return new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = 'assets/three.min.js'; script.async = true;
    script.onload = resolve; script.onerror = () => reject(new Error('3D library unavailable'));
    document.head.appendChild(script);
  });
}

const TOKEN="9QLCEL7Xo9VTwgBeAYU1PWX7JJ8joKxQCYw3msjUpump";
const POOL="4155gZUL9omQeB8zyaTrEtxAGqzj1Bmn7szxX2n7tMii";
const CHART="https://www.geckoterminal.com/ru/solana/pools/"+POOL;
const PUMP="https://pump.fun/coin/"+TOKEN;
let audioCtx=null, currentSeason=1, micStream=null;


/* Pixel twin entry engine: the supplied artwork is sampled into a Three.js point field.
   No source photo is rendered; only its sampled geometry and colors become particles. */

let entryTwin=null, entryMouse={x:0,y:0}, entryMouseTarget={x:0,y:0};

async function initEntryPixelTwin(){
  const host=document.getElementById("entryPixelTwin");
  if(!host || farmEntered || entryLoading || entryTwin || document.hidden || reducedMotion)return;
  entryLoading = true;
  entryController = new AbortController();
  const timeout = setTimeout(() => entryController?.abort(), 8000);
  let renderer;
  try {
  const [response] = await Promise.all([
    fetch('assets/entry-particles.bin', {signal: entryController.signal}), loadThree()
  ]);
  if (!response.ok) throw new Error('Particle data unavailable');
  const buffer = await response.arrayBuffer();
  if (farmEntered || document.hidden) return;
  if (!buffer.byteLength || buffer.byteLength % 21) throw new Error('Invalid particle data');
  const W=host.clientWidth||760,H=host.clientHeight||470;
  renderer=new THREE.WebGLRenderer({alpha:true,antialias:false,powerPreference:"low-power"});
  renderer.setPixelRatio(Math.min(window.devicePixelRatio||1,compactDevice?1:1.5));
  renderer.setSize(W,H,false); renderer.setClearColor(0x000000,0); host.appendChild(renderer.domElement);

  const stride=21, count=Math.floor(buffer.byteLength/stride);
  const view=new DataView(buffer);
  const pos=new Float32Array(count*3), col=new Float32Array(count*3), phase=new Float32Array(count), amp=new Float32Array(count), size=new Float32Array(count);
  for(let i=0;i<count;i++){
    const o=i*stride,p=i*3;
    pos[p]=view.getFloat32(o,true); pos[p+1]=view.getFloat32(o+4,true); pos[p+2]=view.getFloat32(o+8,true);
    col[p]=view.getUint8(o+12)/255; col[p+1]=view.getUint8(o+13)/255; col[p+2]=view.getUint8(o+14)/255;
    phase[i]=view.getFloat32(o+15,true); amp[i]=view.getUint8(o+19)/100; size[i]=view.getUint8(o+20)/80;
  }
  const geo=new THREE.BufferGeometry();
  geo.setAttribute("position",new THREE.BufferAttribute(pos,3)); geo.setAttribute("color",new THREE.BufferAttribute(col,3));
  geo.setAttribute("aPhase",new THREE.BufferAttribute(phase,1)); geo.setAttribute("aAmp",new THREE.BufferAttribute(amp,1)); geo.setAttribute("aSize",new THREE.BufferAttribute(size,1));

  const mat=new THREE.ShaderMaterial({transparent:true,depthWrite:false,vertexColors:true,blending:THREE.AdditiveBlending,
    uniforms:{uTime:{value:0},uPixelRatio:{value:Math.min(window.devicePixelRatio||1,compactDevice?1:1.5)}},
    vertexShader:`attribute float aPhase;attribute float aAmp;attribute float aSize;uniform float uTime;uniform float uPixelRatio;varying vec3 vColor;
      void main(){vec3 p=position;float pulse=sin(uTime*2.25+aPhase)*aAmp*0.014;float tremor=sin(uTime*7.0+aPhase*2.1)*0.0035;
      p.x+=pulse+tremor;p.y+=cos(uTime*2.05+aPhase)*aAmp*0.009;p.z+=sin(uTime*1.7+aPhase)*0.006;
      vec4 mv=modelViewMatrix*vec4(p,1.0);gl_Position=projectionMatrix*mv;
      gl_PointSize=max(1.0,aSize*(1.5+0.65*sin(uTime*3.4+aPhase)))*uPixelRatio*(24.0/-mv.z);vColor=color;}`,
    fragmentShader:`varying vec3 vColor;void main(){vec2 q=gl_PointCoord-.5;float d=length(q);if(d>.5)discard;float g=1.0-smoothstep(.03,.5,d);
      gl_FragColor=vec4(vColor*(1.0+g*1.15),.25+g*.75);}`
  });
  const shell=new THREE.Points(geo,mat);

  // A second, very soft particle pass creates the luminous volume visible in the reference artwork.
  const haloGeo=geo;
  const haloMat=mat.clone();
  haloMat.uniforms={uTime:{value:0},uPixelRatio:{value:Math.min(window.devicePixelRatio||1,compactDevice?1:1.5)}};
  haloMat.vertexShader=mat.vertexShader.replace('aSize*(1.5+0.65*sin(uTime*3.4+aPhase))','aSize*(2.8+0.75*sin(uTime*2.6+aPhase))').replace('p.x+=pulse+tremor;','p.x+=pulse*.45+tremor*.35;');
  haloMat.fragmentShader=`varying vec3 vColor;void main(){float d=length(gl_PointCoord-.5);if(d>.5)discard;float g=1.0-smoothstep(.02,.5,d);gl_FragColor=vec4(vColor*(.55+g*.65),g*.18);}`;
  const halo=new THREE.Points(haloGeo,haloMat);

  // The green center is an independent living field: it tracks the cursor rather than merely rotating with the shell.
  const coreCount=compactDevice?500:1000,cp=new Float32Array(coreCount*3),cc=new Float32Array(coreCount*3),cph=new Float32Array(coreCount),cs=new Float32Array(coreCount);
  for(let i=0;i<coreCount;i++){
    const u=Math.random(),v=Math.random(),theta=Math.random()*Math.PI*2,r=.035+Math.pow(u,.56)*.52,z=(v-.5)*.92,xy=Math.sqrt(Math.max(.01,.68*.68-z*z));
    const p=i*3, rr=r*(.78+.22*Math.random()); cp[p]=Math.cos(theta)*rr;cp[p+1]=Math.sin(theta)*rr*.82;cp[p+2]=z*.48;
    cc[p]=.18+Math.random()*.18;cc[p+1]=.82+Math.random()*.18;cc[p+2]=.38+Math.random()*.42;cph[i]=Math.random()*Math.PI*2;cs[i]=.65+Math.random()*2.2;
  }
  const cg=new THREE.BufferGeometry();cg.setAttribute("position",new THREE.BufferAttribute(cp,3));cg.setAttribute("color",new THREE.BufferAttribute(cc,3));cg.setAttribute("aPhase",new THREE.BufferAttribute(cph,1));cg.setAttribute("aSize",new THREE.BufferAttribute(cs,1));
  const cm=new THREE.ShaderMaterial({transparent:true,depthWrite:false,vertexColors:true,blending:THREE.AdditiveBlending,uniforms:{uTime:{value:0},uPixelRatio:{value:Math.min(window.devicePixelRatio||1,compactDevice?1:1.5)}} ,
    vertexShader:`attribute float aPhase;attribute float aSize;uniform float uTime;uniform float uPixelRatio;varying vec3 vColor;void main(){vec3 p=position;
      float breathe=1.0+sin(uTime*2.7+aPhase)*.045;p*=breathe;p+=normalize(position+vec3(.001))*sin(uTime*4.1+aPhase)*.022;
      p.z+=cos(uTime*2.8+aPhase)*.025;vec4 mv=modelViewMatrix*vec4(p,1.0);gl_Position=projectionMatrix*mv;gl_PointSize=max(1.0,aSize*(1.7+sin(uTime*4.4+aPhase))*uPixelRatio*(18.0/-mv.z));vColor=color;}`,
    fragmentShader:`varying vec3 vColor;void main(){float d=length(gl_PointCoord-.5);if(d>.5)discard;float g=1.0-smoothstep(.02,.5,d);gl_FragColor=vec4(vColor*(1.15+g),.4+.6*g);}`
  });
  const core=new THREE.Points(cg,cm);
  const scene=new THREE.Scene(),camera=new THREE.PerspectiveCamera(31,W/H,.1,100);camera.position.z=10.5;
  const group=new THREE.Group();if(!compactDevice)group.add(halo);group.add(shell);group.add(core);scene.add(group);
  const coreTarget={x:0,y:0},coreNow={x:0,y:0};
  function resize(){const w=host.clientWidth||760,h=host.clientHeight||470;renderer.setSize(w,h,false);camera.aspect=w/h;camera.updateProjectionMatrix();}
  function animate(t){
    if(farmEntered || document.hidden)return;
    const time=t*.001;mat.uniforms.uTime.value=time;haloMat.uniforms.uTime.value=time;cm.uniforms.uTime.value=time;
    coreNow.x+=(coreTarget.x-coreNow.x)*.075;coreNow.y+=(coreTarget.y-coreNow.y)*.075;
    core.position.x=coreNow.x*.34;core.position.y=coreNow.y*.22;
    group.rotation.y=Math.sin(time*.28)*.045+coreNow.x*.035;group.rotation.x=Math.cos(time*.22)*.022-coreNow.y*.022;
    group.scale.setScalar(1+Math.sin(time*1.25)*.009);
    renderer.render(scene,camera);
  }
  const onPointerMove=e=>{const r=host.getBoundingClientRect();coreTarget.x=((e.clientX-r.left)/r.width-.5)*2;coreTarget.y=-((e.clientY-r.top)/r.height-.5)*2};
  host.addEventListener("pointermove",onPointerMove,{passive:true});
  const onPointerLeave=()=>{coreTarget.x=0;coreTarget.y=0};
  host.addEventListener("pointerleave",onPointerLeave,{passive:true});
  window.addEventListener("resize",resize,{passive:true});
  const loop=FarmRuntime.createFrameLoop(animate, {
    request: requestAnimationFrame, cancel: cancelAnimationFrame, fps: 30
  });
  const dispose=()=>{
    loop.stop(); window.removeEventListener('resize',resize);
    host.removeEventListener('pointermove',onPointerMove);
    host.removeEventListener('pointerleave',onPointerLeave);
    geo.dispose(); cg.dispose(); mat.dispose(); haloMat.dispose(); cm.dispose();
    renderer.dispose(); renderer.forceContextLoss(); renderer.domElement.remove();
  };
  entryTwin={renderer,loop,dispose}; host.classList.add('ready'); loop.start();
  } catch(error) {
    if(renderer){renderer.dispose();renderer.domElement.remove();}
    // The branded static fallback remains usable if WebGL or the asset is unavailable.
    console.info('Static farm introduction:', error.message);
  } finally {clearTimeout(timeout);entryLoading=false;entryController=null;}
}
function stopEntryTwin(){
  entryController?.abort();
  if(entryTwin){entryTwin.dispose();entryTwin=null;}
}
function softEntryVibration(){
  try{ if(navigator.vibrate) navigator.vibrate([35,25,70]); }catch(e){}
}
function startEntryTone(){
  try{
    audioCtx=audioCtx||new (window.AudioContext||window.webkitAudioContext)();
    if(audioCtx.state==="suspended") audioCtx.resume();
    const o=audioCtx.createOscillator(),g=audioCtx.createGain();
    o.type="sine";o.frequency.setValueAtTime(52,audioCtx.currentTime);
    o.frequency.exponentialRampToValueAtTime(78,audioCtx.currentTime+1.1);
    g.gain.setValueAtTime(.0001,audioCtx.currentTime);
    g.gain.exponentialRampToValueAtTime(.028,audioCtx.currentTime+.12);
    g.gain.exponentialRampToValueAtTime(.0001,audioCtx.currentTime+1.25);
    o.connect(g).connect(audioCtx.destination);o.start();o.stop(audioCtx.currentTime+1.3);
    const buf=audioCtx.createBuffer(1,audioCtx.sampleRate*2,audioCtx.sampleRate),samples=buf.getChannelData(0);let v=0;
    for(let i=0;i<samples.length;i++){v=(v+Math.random()*.1-.05)*.98;samples[i]=v;}
    const n=audioCtx.createBufferSource(),f=audioCtx.createBiquadFilter(),ng=audioCtx.createGain();n.buffer=buf;f.type='lowpass';f.frequency.setValueAtTime(200,audioCtx.currentTime);f.frequency.exponentialRampToValueAtTime(2400,audioCtx.currentTime+1);ng.gain.setValueAtTime(.0001,audioCtx.currentTime);
    for(let i=0;i<4;i++){ng.gain.exponentialRampToValueAtTime(.14,audioCtx.currentTime+i*.4+.12);ng.gain.exponentialRampToValueAtTime(.0001,audioCtx.currentTime+i*.4+.38);}
    n.connect(f).connect(ng).connect(audioCtx.destination);n.start();n.stop(audioCtx.currentTime+1.8);
  }catch(e){}
}
function enterFarm(){
  if(farmEntered)return;
  farmEntered=true; softEntryVibration(); soundEnabled=true; document.getElementById("soundToggle").textContent="🔊 SOUND ON"; startEntryTone(); startSeasonSound();
  stopEntryTwin(); document.body.classList.add('farm-entered');
  document.getElementById('space').classList.add('fly');
  setTimeout(()=>{document.getElementById('space').hidden=true;},700);
}
function animalSound(type){
 if(!soundEnabled || document.hidden)return;
 try{
  audioCtx=audioCtx||new (window.AudioContext||window.webkitAudioContext)(); if(audioCtx.state==="suspended")audioCtx.resume();
  const now=audioCtx.currentTime,o=audioCtx.createOscillator(),g=audioCtx.createGain(),f=audioCtx.createBiquadFilter();
  const cfg={
   duck:[190,130,.22,"sawtooth"],goose:[160,110,.35,"sawtooth"],turkey:[120,90,.5,"triangle"],
   chicken:[430,650,.24,"sine"],goat:[180,240,.3,"sawtooth"],bee:[220,95,.5,"sawtooth"]
  }[type]||[220,160,.25,"sine"];
  o.type=cfg[3];o.frequency.setValueAtTime(cfg[0],now);o.frequency.exponentialRampToValueAtTime(cfg[1],now+cfg[2]);
  f.type="lowpass";f.frequency.value=1600;g.gain.setValueAtTime(.0001,now);g.gain.exponentialRampToValueAtTime(.07,now+.03);g.gain.exponentialRampToValueAtTime(.0001,now+cfg[2]+.08);
  o.connect(f).connect(g).connect(audioCtx.destination);o.start();o.stop(now+cfg[2]+.1);
 }catch(e){}
}
function openAnimalRoom(title,icon,count,type){
 animalSound(type);
 const soundLabel={duck:"ducks",goose:"geese",turkey:"turkeys",chicken:"chickens",goat:"goats"}[type]||"animals";
 show(`<h2>${icon} ${title}</h2><p class="muted">${count}. Click feeding or open the future camera module.</p>
 <div class="camera"><div class="scan"></div><b>📹 LIVE CAMERA</b></div>
 <div class="grid"><div class="tile"><b>${count}</b><small>animals</small></div><div class="tile"><b>LIVE</b><small>camera module</small></div><div class="tile"><b>🔊</b><small>${soundLabel} sound</small></div></div>
 <div class="actions"><button onclick="animalSound('${type}')">🔊 Sound</button><button onclick="feed('${title}')">🥕 Feed</button><button onclick="openPanel('camera')">📹 Video</button></div>
 <p class="muted">This is a camera demo. A real IP/ESP32-CAM camera can be connected here.</p>`);
}
function feed(name){alert("Action: feed "+name+". Feeding is a demo; no token payment is taken.");}
function openSector(title,text,icon){
 let extra="";
 if(title==="Bee Land") extra=`<div class="actions"><button onclick="openPanel('hives')">🍯 Rental hive</button><button onclick="openPanel('camera')">📹 Cameras</button></div>`;
 show(`<h2>${icon} ${title}</h2><p>${text}</p><div class="grid"><div class="tile"><b>LIVE</b><small>status</small></div><div class="tile"><b class="room-weight">6.2 kg</b><small>hive weight</small></div><div class="tile"><b>SEASON</b><small>dynamic</small></div><div class="tile"><b>CYB</b><small>agent</small></div></div>${extra}`);
}
const cybChatState={peer:"FARM NODE",messages:readChat(),mesh:false};
function cybChatSave(){cybChatState.messages=cybChatState.messages.slice(-80);farmStore.setItem("cybchatMessages",JSON.stringify(cybChatState.messages.slice(-80)));}
function cybChatRender(){
 const el=document.getElementById("cybchatMessages");if(!el)return;
 if(!cybChatState.messages.length){el.innerHTML='<div class="cyb-msg"><b>CYBCHAT</b><br>'+escapeHtml(window.FarmI18n?.t('Secure farm communication layer initialized.')||'Secure farm communication layer initialized.')+'<span class="meta">'+escapeHtml(window.FarmI18n?.t('LOCAL SESSION · NO SERVER CLAIM')||'LOCAL SESSION · NO SERVER CLAIM')+'</span></div>';return;}
 el.innerHTML=cybChatState.messages.map(m=>'<div class="cyb-msg '+(m.me?'me':'')+'"><b>'+escapeHtml(window.FarmI18n?.t(m.from)||m.from)+'</b><br>'+escapeHtml(m.from==='CYBCHAT'?(window.FarmI18n?.t(m.text)||m.text):m.text)+'<span class="meta">'+escapeHtml(window.FarmI18n?.t(m.transport||'LOCAL')||m.transport||'LOCAL')+' · '+new Date(m.ts).toLocaleTimeString([], {hour:'2-digit',minute:'2-digit'})+'</span></div>').join('');el.scrollTop=el.scrollHeight;
}
function cybChatSend(){
 const input=document.getElementById("cybchatInput"),text=(input?.value||'').trim();if(!text)return; if(text.length>4000){robotSpeech('Please keep messages under 4000 characters.');return;}
 if(text==='/help'){cybChatState.messages.push({from:'CYBCHAT',text:'/who · /msg <peer> <text> · /fav <peer> · /mesh · /clear',transport:'COMMAND',ts:Date.now()});}
 else if(text==='/who'){cybChatState.messages.push({from:'CYBCHAT',text:'FARM NODE, ROBOTCYB, BEE LAND, GARDEN NODE — '+(cybChatState.mesh?'mesh link active':'local nodes visible'),transport:'COMMAND',ts:Date.now()});}
 else if(text==='/mesh'){cybChatState.mesh=!cybChatState.mesh;cybChatState.messages.push({from:'CYBCHAT',text:cybChatState.mesh?'Mesh session armed. Bluetooth transport requires the native CybChat layer.':'Mesh session paused.',transport:'COMMAND',ts:Date.now()});}
 else if(text==='/clear'){cybChatState.messages=[];cybChatSave();cybChatRender();input.value='';return;}
 else {cybChatState.messages.push({from:'YOU',text,me:true,transport:cybChatState.mesh?'MESH SIMULATION':'LOCAL',ts:Date.now()});setTimeout(async ()=>{cybChatState.messages.push({from:'ROBOTCYB',text:await RobotMind.reply(text),transport:cybChatState.mesh?'MESH UI':'LOCAL',ts:Date.now()});cybChatSave();cybChatRender();},420);}
 cybChatSave();cybChatRender();input.value='';
}
function cybChatPeer(name){cybChatState.peer=name;document.querySelectorAll('.cybchat-peer').forEach(x=>x.classList.toggle('active',x.dataset.peer===name));const t=document.getElementById('cybchatPeer');if(t)t.textContent=name;}
function cybChatPanel(){
 show(`<div class="cybchat-head"><div><h2 style="margin-bottom:2px">⌁ CYBCHAT</h2><div class="muted">CicadaFarm communication layer · BitChat-inspired transport model</div></div><div class="cybchat-status"><span class="pulse"></span><span id="cybchatStatus">${cybChatState.mesh?'MESH UI ACTIVE':'LOCAL NODE'}</span></div></div>
 <div class="cyberbar"><span><b>TRANSPORT</b> · Bluetooth Mesh → Nostr fallback</span><span class="kicker">PRIVACY FIRST</span></div>
 <div class="cybchat-layout"><aside class="cybchat-peers">
  <div class="kicker" style="padding:4px 6px 7px">PEERS</div>
  <div class="cybchat-peer active" data-peer="FARM NODE" onclick="cybChatPeer('FARM NODE')"><span class="peer-dot"></span>FARM NODE</div>
  <div class="cybchat-peer" data-peer="ROBOTCYB" onclick="cybChatPeer('ROBOTCYB')"><span class="peer-dot"></span>ROBOTCYB</div>
  <div class="cybchat-peer" data-peer="BEE LAND" onclick="cybChatPeer('BEE LAND')"><span class="peer-dot"></span>BEE LAND</div>
  <div class="cybchat-peer" data-peer="GARDEN NODE" onclick="cybChatPeer('GARDEN NODE')"><span class="peer-dot off"></span>GARDEN NODE</div>
 </aside>
 <section class="cybchat-main"><div class="cybchat-toolbar"><span>CHANNEL · <b id="cybchatPeer">FARM NODE</b></span><span class="cybchat-command">/who</span></div><div id="cybchatMessages" class="cybchat-messages"></div>
 <div class="cybchat-compose"><input id="cybchatInput" placeholder="Write message or /command..." onkeydown="if(event.key==='Enter')cybChatSend()"><button class="primary" onclick="cybChatSend()">SEND</button></div>
 <div class="cybchat-info">/help for commands · /mesh toggles the browser transport simulation · /clear clears local chat.</div></section></div>
 <div class="cybchat-security"><div class="tile"><b>BLE MESH</b><small>preferred native transport</small></div><div class="tile"><b>NOISE</b><small>native private-session layer</small></div><div class="tile"><b>NOSTR</b><small>fallback for mutual favorites</small></div></div>`);
 cybChatRender();
}

function solarPanel(){show(`<h2>☀️ SOLAR CORE</h2><p class="muted">Energy layer of the CicadaFarm digital twin.</p><div class="grid"><div class="tile"><b class="metric">87%</b><small>battery</small></div><div class="tile"><b class="metric">3.2 kW</b><small>demo load</small></div><div class="tile"><b class="metric">ONLINE</b><small>controller</small></div><div class="tile"><b class="metric">AUTO</b><small>energy mode</small></div></div><div class="cyberbar"><span><span class="pulse"></span> SOLAR CORE ONLINE</span><span class="kicker">PHYSICAL ENERGY ↔ DIGITAL TWIN</span></div><p>Solar generation, battery state and farm loads are shown here as a cyber layer. Real inverter/MPPT telemetry can be connected later.</p><div class="actions"><button class="primary" onclick="openPanel('network')">OPEN NETWORK</button><button onclick="robotSpeech('Solar Core is online. Energy layer is ready for real telemetry.')">ASK ROBOTCYB</button></div>`)}
function openPanel(which){
 if(which==="impact") impactPanel();
 else if(which==="cybchat") cybChatPanel();
 else if(which==="solar") solarPanel();
 else if(which==="token") tokenPanel();
 else if(which==="knowledge") knowledgePanel();
 else if(which==="hives") hivePanel();
 else if(which==="market") marketPanel();
 else if(which==="brain") brainPanel();
 else if(which==="network") networkPanel();
 else if(which==="camera") cameraPanel();
 else if(which==="journal") show(`<h2>📖 Farm Journal</h2><p class="muted">Live journal CicadaFarm.</p><div class="grid"><div class="tile"><b id="journalSeason">☀️</b><small>season</small></div><div class="tile"><b>4</b><small>hives</small></div><div class="tile"><b>LIVE</b><small>farm</small></div></div><p>Seasons, harvest, animals and observations will be saved here.</p>`);
}
let panelTrigger=null;
function show(html){
  window.stopMarket?.(); stopCamera(); abortTokenRequest(); panelTrigger=document.activeElement;
  document.getElementById('content').innerHTML=html;
  document.getElementById('panel').classList.add('open');
  document.body.classList.add('panel-open');
  document.querySelector('#panel .close').focus();
}
function closePanel(){
  document.getElementById('panel').classList.remove('open');
  document.body.classList.remove('panel-open'); window.stopMarket?.(); stopCamera(); abortTokenRequest();
  if(panelTrigger?.isConnected)panelTrigger.focus();
}
function knowledgePanel(){show(`<h2>📜 KNOWLEDGE ARCHIVE</h2><p class="muted">Preserve family and generational knowledge.</p>
<textarea id="knowledgeText" maxlength="8000" placeholder="Write a recipe, food storage method, beekeeping technique or gardening note..."></textarea>
<div class="actions"><button onclick="saveKnowledge()">💾 Save knowledge</button></div><div id="knowledgeList" style="margin-top:10px"></div>
<p class="muted">Your notes stay in this browser. Save family recipes, techniques and observations for later.</p>`);
 document.getElementById('knowledgeText').value=(farmStore.getItem('cicadaKnowledge')||'').slice(0,8000);
}
function saveKnowledge(){const t=document.getElementById("knowledgeText").value.trim();if(!t)return;const saved=farmStore.setItem("cicadaKnowledge",t.slice(0,8000));document.getElementById("knowledgeList").innerHTML="<div class='tile'><b>"+escapeHtml(window.FarmI18n?.t(saved?"Saved on this device":"Saved for this session")||(saved?"Saved on this device":"Saved for this session"))+"</b><small>"+escapeHtml(t.slice(0,180))+"</small></div>";}
function escapeHtml(s){return String(s).replace(/[&<>"']/g,m=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"}[m]))}
function brainPanel(){
 show(`<h2>🧠 ROBOTCYB BRAIN</h2><p class="muted">Observe → interpret → recommend → ask a human when needed.</p><div class="cyberbar"><span><span class="pulse"></span> COGNITIVE CORE ONLINE</span><span class="kicker">FARM MEMORY ${farmStore.getItem('cicadaKnowledge')?'LOADED':'EMPTY'}</span></div><div class="grid"><div class="tile"><b class="metric">24°C</b><small>air temperature</small></div><div class="tile"><b class="metric">87%</b><small>solar battery</small></div><div class="tile"><b class="metric">HIGH</b><small>animal activity</small></div><div class="tile"><b class="metric">12</b><small>hives monitored</small></div></div><table class="cybertable"><tr><td>🐔 Chicken House</td><td class="statusOK">NORMAL</td></tr><tr><td>🦆 Duck House</td><td class="statusWarn">WATER CHECK</td></tr><tr><td>🐐 Goat House</td><td class="statusOK">WARM</td></tr><tr><td>🐝 Bee Land</td><td class="statusOK">ACTIVE</td></tr><tr><td>☀️ Solar Core</td><td class="statusOK">ENERGY POSITIVE</td></tr></table><div class="actions"><button class="primary" onclick="robotInsight()">RUN FARM SCAN</button><button onclick="openPanel('network')">OPEN NETWORK</button></div><div id="brainInsight" class="muted"></div>`);
}
function robotInsight(){const el=document.getElementById('brainInsight');if(el)el.innerHTML='<div class="cyberbar"><b>ROBOTCYB:</b> I found one thing worth checking: duck water. Everything else is within the demo operating envelope. I will keep watching.</div>';}
function networkPanel(){
 show(`<h2>📡 CICADAFARM NETWORK</h2><p class="muted">Cyber-physical dashboard for sensors, cameras, energy and future digital-twin data.</p><div class="grid"><div class="tile"><b class="metric">ONLINE</b><small>farm gateway</small></div><div class="tile"><b class="metric">8</b><small>nodes</small></div><div class="tile"><b class="metric">87%</b><small>battery</small></div><div class="tile"><b class="metric">3.2 kW</b><small>demo load</small></div></div><table class="cybertable"><tr><td>🤖 Robotcyb flight controller</td><td class="statusOK">ONLINE</td></tr><tr><td>📹 Camera Hub</td><td class="statusOK">READY</td></tr><tr><td>🐝 Hive sensors</td><td class="statusOK">12 NODES</td></tr><tr><td>💧 Water sensors</td><td class="statusWarn">1 CHECK</td></tr><tr><td>☀️ Solar Core</td><td class="statusOK">ONLINE</td></tr><tr><td>🌡️ Weather station</td><td class="statusOK">ONLINE</td></tr></table><div class="actions"><button class="primary" onclick="openPanel('brain')">OPEN ROBOTCYB BRAIN</button><button onclick="alert('Digital Twin sync is ready for real sensor APIs. No fake live feed is claimed.')">SYNC DIGITAL TWIN</button></div>`);
}
function cameraPanel(){show(`<h2>📹 CICADAFARM LIVE CAMERAS</h2><p class="muted">Animal rooms and hives will have separate live streams.</p>
<div class="camera"><div class="scan"></div><b>CAMERA HUB</b></div><div class="grid"><div class="tile"><b>🐝 HIVE 01</b><small>live / future</small></div><div class="tile"><b>🦆 DUCK</b><small>live / future</small></div><div class="tile"><b>🐐 GOAT</b><small>live / future</small></div><div class="tile"><b>🐔 CHICKEN</b><small>live / future</small></div></div>
<div class="actions"><button onclick="requestCamera()">📷 Connect device camera</button></div><p class="muted">For real farm here can underключить ESP32-CAM / IP camera / RTSP gateway.</p>`)}
let cameraRequest=0;
function stopCamera(){cameraRequest++;micStream?.getTracks().forEach(track=>track.stop());micStream=null;}
async function requestCamera(){
  stopCamera();const request=cameraRequest;
  try{
    const stream=await navigator.mediaDevices.getUserMedia({video:true,audio:false});
    const host=document.querySelector('#content .camera');
    if(request!==cameraRequest || !host || !document.getElementById('panel').classList.contains('open')){
      stream.getTracks().forEach(track=>track.stop());return;
    }
    micStream=stream;host.classList.add('connected');host.replaceChildren();
    const video=document.createElement('video');video.autoplay=true;video.muted=true;
    video.playsInline=true;video.srcObject=stream;host.appendChild(video);
    await video.play();
  }catch(error){stopCamera();alert('Camera access was denied or is unavailable.');}
}
async function tokenPanel(){
 show(`<h2>🪙 $CICADAFARM</h2><p class="muted">Solana · CicadaFarm ecosystem token</p><div class="grid"><div class="tile"><b id="price">—</b><small>price USD</small></div><div class="tile"><b id="mcap">—</b><small>market cap (verified)</small></div><div class="tile"><b id="liq">—</b><small>pool liquidity</small></div><div class="tile"><b id="fdv">—</b><small>fully diluted valuation (FDV)</small></div></div>
<p class="token-address">Contract address (from project source)<br><code>${TOKEN}</code></p><p class="muted">CicadaFarm and <a href="https://robotcyb.ai/" target="_blank" rel="noopener">Robotcyb</a> are one project. Live pool data from GeckoTerminal · PumpSwap. FDV is shown separately from verified market cap.</p><div class="actions"><button onclick="navigator.clipboard.writeText(TOKEN).then(()=>{this.textContent='COPIED'}).catch(()=>{this.textContent='SELECT ADDRESS ABOVE'})">COPY ADDRESS</button><button onclick="window.open('${PUMP}','_blank')">BUY ON PUMP.FUN</button><button onclick="window.open('${CHART}','_blank','noopener')">OPEN CHART</button></div><p id="tokenStatus" class="muted" role="status">Loading market data…</p>`);
 fetchToken();
}
let tokenController=null;
function abortTokenRequest(){tokenController?.abort();tokenController=null;}
async function fetchToken(){
  const price=document.getElementById('price');
  if(!price || document.hidden || tokenController)return;
  const controller=new AbortController();tokenController=controller;
  const timeout=setTimeout(()=>controller.abort(),8000);
  const status=document.getElementById('tokenStatus');
  try{
    const response=await fetch('https://api.geckoterminal.com/api/v2/networks/solana/pools/'+POOL,{signal:controller.signal,headers:{Accept:'application/json'}});
    if(!response.ok)throw new Error('Market API unavailable');
    const metrics=FarmRuntime.parsePool(await response.json(),POOL,TOKEN);
    if(!price.isConnected || controller.signal.aborted)return;
    const currency=value=>value===null?'Not available':new Intl.NumberFormat('en-US',{style:'currency',currency:'USD',maximumFractionDigits:2}).format(value);
    price.textContent=metrics.price===null?'Not available':new Intl.NumberFormat('en-US',{style:'currency',currency:'USD',maximumSignificantDigits:7}).format(metrics.price);
    document.getElementById('mcap').textContent=currency(metrics.marketCap);
    document.getElementById('fdv').textContent=currency(metrics.fdv);
    document.getElementById('liq').textContent=currency(metrics.liquidity);
    status.textContent='GeckoTerminal · updated '+new Date().toLocaleTimeString()+(metrics.marketCap===null?' · Verified market cap is not supplied by the API; FDV is a separate estimate.':'');
  }catch(error){if(price.isConnected)status.textContent='Market service could not be reached. Use the contract address and direct links; try again later.';}
  finally{clearTimeout(timeout);if(tokenController===controller)tokenController=null;}
}

function toggleRobot(){const r=document.getElementById("robotPanel");r.style.display=r.style.display==="block"?"none":"block";}
async function askRobot(){const input=document.getElementById('robotInput'),q=input.value.trim();if(!q)return;input.value='';const box=document.getElementById('robotMsg');box.dataset.i18nSkip='';box.textContent=window.FarmI18n?.t('Robotcyb is thinking…')||'Robotcyb is thinking…';box.textContent=await RobotMind.reply(q);}

/* Living farm simulation: grass regrows, animals move inside their own rooms, fish swim in the lake. */
function seedGrass(){
 const layer=document.getElementById('grassLayer'); if(!layer)return;
 layer.innerHTML='';
 for(let i=0;i<(compactDevice?36:60);i++){
  const g=document.createElement('span');g.className='grass';g.textContent=['🌿','🌱','🍃'][i%3];
  g.style.left=(2+Math.random()*96)+'%';g.style.bottom=(1+Math.random()*16)+'%';
  g.style.setProperty('--grow',(3.5+Math.random()*4)+'s');g.style.animationDelay=(-Math.random()*4)+'s';
  layer.appendChild(g);
 }
}
function mowGrass(){
 const blades=[...document.querySelectorAll('.grass')]; if(!blades.length)seedGrass();
 document.querySelectorAll('.grass').forEach(g=>g.classList.add('mowed'));
 robotSpeech('Grass trimmed. I will monitor regrowth.');
 setTimeout(()=>{document.querySelectorAll('.grass').forEach((g,i)=>{g.classList.remove('mowed');g.style.animationDelay=(-Math.random()*3)+'s';});},6500);
}
function spawnMilkyStars(){
 const layer=document.getElementById('milkyStars'); if(!layer)return;layer.replaceChildren();
 for(let i=0;i<(compactDevice?10:18);i++){const e=document.createElement('i');e.className='milky-star';e.style.left=(8+Math.random()*84)+'%';e.style.top=(10+Math.random()*78)+'%';e.style.animationDelay=(-Math.random()*2.8)+'s';layer.appendChild(e)}
}
function animateRoomCreatures(){
 const rooms={
  chicken:['🐔','🐔','🐔','🐔'],turkey:['🦃','🦃','🦃'],goat:['🐐','🐐'],duck:['🦆','🦆','🦆','🦆'],goose:['🪿','🪿','🪿'],bee:['🐝','🐝','🐝','🐝','🐝'],lake:['🐟','🐟','🐟','🐟']
 };
 Object.entries(rooms).forEach(([type,icons])=>{
  const room=document.querySelector('.'+({duck:'ducks',goose:'geese'}[type]||type));
  if(!room)return;
  icons.forEach((icon,i)=>{const c=document.createElement('span');c.className='creature';c.textContent=icon;c.style.left=(8+Math.random()*70)+'%';c.style.top=(35+Math.random()*42)+'%';c.style.setProperty('--x1',(Math.random()*18-9)+'px');c.style.setProperty('--x2',(Math.random()*50)+'px');c.style.setProperty('--y1',(Math.random()*14-7)+'px');c.style.setProperty('--y2',(Math.random()*14-7)+'px');c.style.setProperty('--dur',(4+Math.random()*5)+'s');c.style.animationDelay=(-Math.random()*5)+'s';room.appendChild(c);});
 });
}
seedGrass();spawnMilkyStars();animateRoomCreatures();
const seasons=[
 {name:"🌸 SPRING",cls:"season-spring",rain:true,snow:false,leaves:false},
 {name:"☀️ SUMMER",cls:"season-summer",rain:false,snow:false,leaves:false},
 {name:"🍂 AUTUMN",cls:"season-autumn",rain:false,snow:false,leaves:true},
 {name:"❄️ WINTER",cls:"season-winter",rain:false,snow:true,leaves:false}
];
function cycleSeason(){currentSeason=(currentSeason+1)%4;applySeason();}
function applySeason(){
 const s=seasons[currentSeason],fx=document.getElementById("weatherFX"),sky=document.getElementById("seasonFX");sky.className="season-sky "+s.cls;document.getElementById("seasonName").textContent=s.name;fx.innerHTML="";
 if(s.rain){for(let i=0;i<70;i++){const e=document.createElement("i");e.className="rain-drop";e.style.left=Math.random()*100+"%";e.style.animationDelay=Math.random()*1.5+"s";fx.appendChild(e)}}
 if(s.snow){for(let i=0;i<55;i++){const e=document.createElement("i");e.className="snowflake";e.textContent="❄";e.style.left=Math.random()*100+"%";e.style.animationDelay=Math.random()*7+"s";fx.appendChild(e)}}
 if(s.leaves){for(let i=0;i<28;i++){const e=document.createElement("i");e.className="leaf";e.textContent=["🍂","🍁","🍃"][i%3];e.style.left=Math.random()*100+"%";e.style.animationDelay=Math.random()*5+"s";fx.appendChild(e)}}
 document.querySelectorAll(".flower").forEach(x=>x.style.display=currentSeason===3?"none":"block");
 document.querySelector(".harvest").style.display=currentSeason===2?"block":"none"; if(farmEntered)startSeasonSound();
}
applySeason();
let weatherTimer=null,tokenTimer=null;
function startFarmTimers(){if(weatherTimer!==null || !farmEntered || document.hidden)return;weatherTimer=setInterval(()=>{document.getElementById("temp").textContent=(currentSeason===3?(-8+Math.floor(Math.random()*8)):18+Math.floor(Math.random()*12))+"°"},5000);
tokenTimer=setInterval(fetchToken,60000);}
function stopFarmTimers(){clearInterval(weatherTimer);clearInterval(tokenTimer);weatherTimer=tokenTimer=null;abortTokenRequest();}

/* One autonomous flying Robotcyb: patrols the actual farm rooms and checks on the animals. */
const robotStops = [
  {selector:".chicken", room:"Chicken Coop", sound:"chicken", lines:["Chicken Coop check: is everyone healthy, calm and well supplied?","Egg count looks good. Does anyone need fresh water or feed?","Hello chickens. I am checking that everything is okay in your room."]},
  {selector:".turkey", room:"Turkey House", sound:"turkey", lines:["Turkey House check: everyone comfortable?","Do you have enough clean water and feed today?","Hello turkeys. Give me a status report — all good?"]},
  {selector:".goat", room:"Goat House", sound:"goat", lines:["Goat House check: are you warm, comfortable and well fed?","Do you need fresh water or anything changed in the shelter?","Hello goats. How is everything today?"]},
  {selector:".ducks", room:"Duck House", sound:"duck", lines:["Duck House check: is everyone doing okay?","Enough clean water for everyone?","Hello ducks. I am checking the flock before moving on."]},
  {selector:".geese", room:"Goose House", sound:"goose", lines:["Goose House check: everyone healthy and calm?","Do you need fresh water or feed?","Hello geese. Please keep the security system under control."]},
  {selector:".bee", room:"Bee Land", sound:"bee", lines:["Bee Land check: how is the hive today?","Is the colony active and the hive condition looking good?","Hello bees. Tiny engineers, keep building."]}
];
let robotStopIndex=-1, robotTimer=null, robotMoveTimer=null, soundEnabled=false, robotPatrolStarted=false;
document.getElementById("soundToggle").textContent="🔇 SOUND OFF";
function ensureFarmAudio(){try{audioCtx=audioCtx||new (window.AudioContext||window.webkitAudioContext)();if(audioCtx.state==="suspended")audioCtx.resume();}catch(e){}}
function robotSpeech(text){const bubble=document.getElementById("robotBubble");bubble.textContent="ROBOTCYB: "+text;const rr=document.getElementById("flyingRobot").getBoundingClientRect();const bw=Math.min(250,innerWidth-16);bubble.style.maxWidth=bw+"px";bubble.style.left=Math.min(innerWidth-bw-8,Math.max(8,rr.left+rr.width/2-bw/2))+"px";bubble.style.top=Math.max(72,rr.top-58)+"px";bubble.classList.add("show");clearTimeout(robotSpeech._t);robotSpeech._t=setTimeout(()=>bubble.classList.remove("show"),4200);if(soundEnabled){ensureFarmAudio();try{const now=audioCtx.currentTime;[392,523.25,659.25].forEach((freq,i)=>{const o=audioCtx.createOscillator(),g=audioCtx.createGain();o.type="sine";o.frequency.value=freq;g.gain.setValueAtTime(.0001,now+i*.08);g.gain.exponentialRampToValueAtTime(.025,now+i*.08+.025);g.gain.exponentialRampToValueAtTime(.0001,now+i*.08+.45);o.connect(g).connect(audioCtx.destination);o.start(now+i*.08);o.stop(now+i*.08+.5);});}catch(e){}}}
function flyRobotToStop(stop){const target=document.querySelector(stop.selector),robot=document.getElementById("flyingRobot");if(!target||!robot)return;const rect=target.getBoundingClientRect();robot.style.left=(rect.left+rect.width/2)+"px";robot.style.top=(rect.top+rect.height/2)+"px";robot.style.transform="translate(-50%,-50%) rotate("+(Math.random()*8-4)+"deg)";clearTimeout(robotMoveTimer);robotMoveTimer=setTimeout(()=>{if(document.hidden || !farmEntered)return;robotSpeech(stop.lines[Math.floor(Math.random()*stop.lines.length)]);if(soundEnabled)animalSound(stop.sound);},1450)}
function robotPatrol(){if(!farmEntered || document.hidden || document.body.classList.contains("panel-open"))return;robotStopIndex=(robotStopIndex+1)%robotStops.length;flyRobotToStop(robotStops[robotStopIndex])}
function startRobotPatrol(){if(robotTimer!==null || document.hidden || !farmEntered)return;robotPatrolStarted=true;clearInterval(robotTimer);robotStopIndex=-1;robotPatrol();robotTimer=setInterval(robotPatrol,6500)}

function toggleFarmSound(){
  soundEnabled=!soundEnabled;
  document.getElementById("soundToggle").textContent=soundEnabled?"🔊 SOUND ON":"🔇 SOUND OFF";
  if(soundEnabled){ensureFarmAudio();startSeasonSound();}else{stopSeasonSound();audioCtx?.suspend().catch(()=>{});}
}
const oldEnterFarm=enterFarm;
enterFarm=function(){
  oldEnterFarm();
  startFarmTimers(); if(!reducedMotion)setTimeout(startRobotPatrol,700);
};


window.addEventListener("resize",()=>{if(robotStopIndex>=0&&robotStops[robotStopIndex])flyRobotToStop(robotStops[robotStopIndex]);});
function pauseFarm(){
  entryTwin?.loop.stop();stopFarmTimers();clearInterval(robotTimer);robotTimer=null;
  clearTimeout(robotMoveTimer);clearTimeout(robotSpeech._t);
  document.getElementById('robotBubble').classList.remove('show');stopCamera();
  if(audioCtx?.state==='running')audioCtx.suspend().catch(()=>{});
}
function resumeFarm(){
  document.body.classList.toggle('tab-hidden',document.hidden);
  if(document.hidden){pauseFarm();return;}
  if(farmEntered){if(soundEnabled){ensureFarmAudio();startSeasonSound();}startFarmTimers();if(!reducedMotion)startRobotPatrol();fetchToken();}
  else if(entryTwin)entryTwin.loop.start();else initEntryPixelTwin();
}
document.addEventListener('visibilitychange',resumeFarm);
window.addEventListener('pagehide',()=>{pauseFarm();stopEntryTwin();});
window.addEventListener('pageshow',resumeFarm);
document.addEventListener('keydown',event=>{
  const panel=document.getElementById('panel');
  if(!panel.classList.contains('open'))return;
  if(event.key==='Escape'){closePanel();return;}
  if(event.key==='Tab'){
    const controls=[...panel.querySelectorAll('button,input,textarea,select,a[href]')];
    const first=controls[0],last=controls[controls.length-1];
    if(event.shiftKey && document.activeElement===first){event.preventDefault();last.focus();}
    else if(!event.shiftKey && document.activeElement===last){event.preventDefault();first.focus();}
  }
});

document.querySelectorAll(".sector").forEach(el=>{
  el.addEventListener("mouseenter",()=>{
    if(!soundEnabled)return;
    const label=el.className.toLowerCase();
    if(label.includes("chicken")) animalSound("chicken");
    else if(label.includes("turkey")) animalSound("turkey");
    else if(label.includes("goat")) animalSound("goat");
    else if(label.includes("duck")) animalSound("duck");
    else if(label.includes("goose")) animalSound("goose");
    else if(label.includes("bee")) animalSound("bee");
  });
});

initEntryPixelTwin();


document.addEventListener("farm-language-change",()=>{if(document.getElementById("cybchatMessages"))cybChatRender();});
