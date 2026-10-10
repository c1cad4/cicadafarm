/* Optional local inference: download only after an explicit user click. */
const RobotMind={engine:null,worker:null,busy:false,history:[],epoch:0,
 status(text){const el=document.getElementById('aiStatus');if(el)el.textContent=text;},
 async load(){
  if(this.busy||this.engine)return;
  if(!navigator.gpu){this.status('WebGPU unavailable. Project guide remains available.');return;}
  this.busy=true;const epoch=++this.epoch;const watchdog=setTimeout(()=>{if(epoch===this.epoch){this.stop();this.status('Model loading timed out. Retry on a faster connection; project guide active.');}},180000);this.status('Loading local AI… model download may take several minutes.');
  try{
   const {CreateWebWorkerMLCEngine}=await import('https://cdn.jsdelivr.net/npm/@mlc-ai/web-llm@0.2.85/lib/index.js');
   if(epoch!==this.epoch)return;
   this.worker=new Worker('assets/ai-worker.js',{type:'module'});
   this.worker.addEventListener('error',event=>{this.status('AI worker failed. Press STOP AI and retry.');console.warn('AI worker:',event.message);});
   const engine=await CreateWebWorkerMLCEngine(this.worker,'SmolLM2-135M-Instruct-q0f16-MLC',{initProgressCallback:p=>this.status(p.text)}, {context_window_size:2048});
   if(epoch!==this.epoch)return;
   this.engine=engine;this.status('Local AI ready · SmolLM2 135M · answers may be inaccurate');
  }catch(e){if(epoch===this.epoch){this.worker?.terminate();this.worker=null;console.warn('Robotcyb AI load:',e);this.status('AI unavailable: '+String(e?.message||e).slice(0,180)+'. Project guide active.');}}
  finally{clearTimeout(watchdog);if(epoch===this.epoch)this.busy=false;}
 },
 stop(){this.epoch++;this.worker?.terminate();this.worker=null;this.engine=null;this.busy=false;this.history=[];this.status('AI stopped · project guide active');},
 async reply(q){
  if(this.busy)return 'Please wait for the current AI task, or press STOP AI.';
  if(!this.engine)return this.guide(q);
  this.busy=true;const epoch=this.epoch;
  try{
   this.history.push({role:'user',content:q.slice(0,1500)});this.history=this.history.slice(-6);if(this.history[0]?.role==='assistant')this.history.shift();
   const result=await this.engine.chat.completions.create({messages:[{role:'system',content:'You are Robotcyb, a concise friendly farm companion. CicadaFarm and https://robotcyb.ai are one ecosystem. Farm has 12 hives, garden, orchard, lake and animals. Site is a demo, not live telemetry. Camera is device preview. No payments are connected. Solana token contract: 9QLCEL7Xo9VTwgBeAYU1PWX7JJ8joKxQCYw3msjUpump. Do not invent prices or claim live data. Answer in the user language.'},...this.history],max_tokens:180,temperature:0.6});
   if(epoch!==this.epoch)return 'AI stopped.';
   const answer=result.choices[0]?.message?.content||this.guide(q);this.history.push({role:'assistant',content:answer});return answer;
  }catch(e){return 'Local AI encountered a problem. '+this.guide(q);}
  finally{if(epoch===this.epoch)this.busy=false;}
 },
 guide(q){
  const ru=/[а-яё]/i.test(q);let text;
  if(/token|токен|цена|price|contract/i.test(q))text=ru?'Токен CicadaFarm в сети Solana. Адрес: 9QLCEL7Xo9VTwgBeAYU1PWX7JJ8joKxQCYw3msjUpump. Открой TOKEN для контракта и ссылок. Цена и ликвидность берутся из GeckoTerminal. Если market cap не подтверждён, показана отдельно FDV.':'Open TOKEN for the Solana contract and direct market links. Live price and liquidity come from GeckoTerminal. Verified market cap may be unavailable; FDV is separate.';
  else if(/bee|hive|honey|пчел|пчёл|улей|м[её]д/i.test(q))text=ru?'В Bee Land показаны 12 ульев. Раздел HIVES описывает аренду на один или два года; бронирование и оплата пока не подключены.':'Bee Land shows 12 hives. HIVES describes one- and two-year rentals; booking and payments are not connected.';
  else if(/camera|video|камер|видео/i.test(q))text=ru?'CAMERAS открывает предпросмотр камеры твоего устройства после разрешения. Камеры самой фермы пока не подключены.':'CAMERAS previews your device camera after permission. Farm camera streams are not connected yet.';
  else if(/season|сезон|зим|лет|весн|осен/i.test(q))text=ru?'Кнопка change season переключает весну, лето, осень и зиму. SOUND включает атмосферу сезона.':'Use change season to switch spring, summer, autumn and winter. SOUND controls seasonal ambience.';
  else if(/recipe|knowledge|рецепт|знани/i.test(q))text=ru?'В KNOWLEDGE можно сохранить свои знания и рецепты в этом браузере. Опиши, что хочешь приготовить, после загрузки ИИ.':'KNOWLEDGE stores your notes and recipes in this browser. Load the AI to discuss ingredients and ideas.';
  else if(/robot|проект|робот/i.test(q))text=ru?'Robotcyb и CicadaFarm — один проект. Светящийся портал наверху ведёт на https://robotcyb.ai/.':'Robotcyb and CicadaFarm are one project. The glowing portal above leads to https://robotcyb.ai/.';
  else text=ru?'Я локальный справочник CicadaFarm: знаю о токене, ульях, камерах, знаниях и сезонах. Для свободного разговора нажми LOAD SMALL AI.':'I am the CicadaFarm project guide. Ask about tokens, hives, cameras, knowledge or seasons. Choose LOAD SMALL AI for open conversation.';
  return text;
 }
};
let ambienceNodes=[];
function stopSeasonSound(){ambienceNodes.forEach(n=>{try{n.stop?.();n.disconnect();}catch{}});ambienceNodes=[];}
function startSeasonSound(){
 stopSeasonSound();if(!soundEnabled||!farmEntered||document.hidden)return;ensureFarmAudio();if(!audioCtx)return;
 const ctx=audioCtx,now=ctx.currentTime;
 const buffer=ctx.createBuffer(1,ctx.sampleRate*3,ctx.sampleRate);const data=buffer.getChannelData(0);let soft=0;
 for(let i=0;i<data.length;i++){soft=(soft+Math.random()*0.08-0.04)*.98;data[i]=soft;}
 const noise=ctx.createBufferSource();noise.buffer=buffer;noise.loop=true;
 const filter=ctx.createBiquadFilter();filter.type='lowpass';filter.frequency.value=[1800,850,1100,400][currentSeason];
 const gain=ctx.createGain();gain.gain.setValueAtTime(0,now);gain.gain.linearRampToValueAtTime([.10,.05,.12,.15][currentSeason],now+1.5);
 noise.connect(filter).connect(gain).connect(ctx.destination);noise.start();
 const pulse=ctx.createOscillator(),depth=ctx.createGain();pulse.frequency.value=[.24,.12,.18,.08][currentSeason];depth.gain.value=.012;pulse.connect(depth).connect(gain.gain);pulse.start();
 ambienceNodes.push(noise,filter,gain,pulse,depth);
 // A quiet suspended chord, softly detuned like distant orbiting signals.
 const padGain=ctx.createGain(),padFilter=ctx.createBiquadFilter();padFilter.type='lowpass';padFilter.frequency.value=550;
 padGain.gain.setValueAtTime(0,now);padGain.gain.linearRampToValueAtTime(.012,now+3);
 padFilter.connect(padGain).connect(ctx.destination);
 const notes=[[130.81,196,293.66],[110,164.81,246.94],[98,146.83,220],[87.31,130.81,196]][currentSeason];
 notes.forEach((frequency,i)=>{const tone=ctx.createOscillator();tone.type='sine';tone.frequency.value=frequency;tone.detune.value=(i-1)*4;tone.connect(padFilter);tone.start();ambienceNodes.push(tone);});
 const orbit=ctx.createOscillator(),orbitDepth=ctx.createGain();orbit.frequency.value=.065;orbitDepth.gain.value=.003;orbit.connect(orbitDepth).connect(padGain.gain);orbit.start();ambienceNodes.push(padGain,padFilter,orbit,orbitDepth);

 if(currentSeason===0||currentSeason===1){const bird=ctx.createOscillator(),birdGain=ctx.createGain(),lfo=ctx.createOscillator(),sweep=ctx.createGain();bird.frequency.value=currentSeason===0?1800:3200;lfo.frequency.value=currentSeason===0?2.3:8;sweep.gain.value=180;birdGain.gain.value=.001;lfo.connect(sweep).connect(bird.frequency);bird.connect(birdGain).connect(ctx.destination);bird.start();lfo.start();ambienceNodes.push(bird,birdGain,lfo,sweep);}
}
function openRobotPortal(event){
 if(event.ctrlKey||event.metaKey||event.shiftKey||event.altKey)return;
 event.preventDefault();const portal=document.getElementById('portalTransition');portal.classList.add('active');
 if(soundEnabled)startEntryTone();setTimeout(()=>location.assign('https://robotcyb.ai/'),reducedMotion?0:900);
}
window.addEventListener('pagehide',()=>{stopSeasonSound();RobotMind.stop();});
window.addEventListener('pageshow',()=>document.getElementById('portalTransition').classList.remove('active'));
