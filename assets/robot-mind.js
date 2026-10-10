/* Shared local AI: background warm-up, off-thread generation and usable fallback. */
const RobotMind={engine:null,worker:null,busy:false,history:[],epoch:0,statusText:"AI warming up in the background…",
 status(text){this.statusText=text;document.querySelectorAll('[data-ai-status],#aiStatus').forEach(el=>el.textContent=text);},
 async load(){
  if(this.busy||this.engine)return;
  if(!navigator.gpu){this.status('WebGPU unavailable. Project guide remains available.');return;}
  this.busy=true;const epoch=++this.epoch;const watchdog=setTimeout(()=>{if(epoch===this.epoch){this.stop();this.status('Model loading timed out. Retry on a faster connection; project guide active.');}},300000);this.status('Loading local AI… model download may take several minutes.');
  try{
   this.status('Checking your graphics device…');
   const adapter=await navigator.gpu.requestAdapter();if(!adapter)throw new Error('No WebGPU adapter available');
   if(epoch!==this.epoch)return;this.status('Loading AI runtime in the background…');
   const {CreateWebWorkerMLCEngine}=await import('https://cdn.jsdelivr.net/npm/@mlc-ai/web-llm@0.2.85/lib/index.js');
   if(epoch!==this.epoch)return;
   this.worker=new Worker('assets/ai-worker.js?v=20261010-ecosystem',{type:'module'});
   const workerError=new Promise((_,reject)=>this.worker.addEventListener('error',event=>reject(new Error(event.message||'AI worker failed')),{once:true}));
   const engine=await Promise.race([workerError,CreateWebWorkerMLCEngine(this.worker,'Qwen2.5-0.5B-Instruct-q4f16_1-MLC',{initProgressCallback:p=>this.status(p.text)}, {context_window_size:2048})]);
   if(epoch!==this.epoch)return;
   this.engine=engine;this.status('Local AI ready · Qwen 0.5B · answers may be inaccurate');
  }catch(e){if(epoch===this.epoch){this.worker?.terminate();this.worker=null;console.warn('Robotcyb AI load:',e);this.status('AI unavailable: '+String(e?.message||e).slice(0,180)+'. Project guide active.');}}
  finally{clearTimeout(watchdog);if(epoch===this.epoch)this.busy=false;}
 },
 stop(){this.epoch++;this.worker?.terminate();this.worker=null;this.engine=null;this.busy=false;this.history=[];this.status('AI stopped · project guide active');},
 factual(q,options={}){
  const ru=/[а-яё]/i.test(q);
  if(/token|токен|contract|контракт|price|цена|капитал|liquidity|ликвид/i.test(q)){
   if(/cicadafarm|цикад|ферм/i.test(q))return this.guide(q);
   if(/robotcyb|робот/i.test(q)||options.project==='robotcyb')return ru?'Токен ROBOTCYB в Solana: 8WZiguAp8NyFnwm8Z97k6sCbSRCWaW1YYXKeCTpupump. Ссылки на рынок и проверку токена находятся на robotcyb.ai. CicadaFarm — отдельный токен той же экосистемы.':'ROBOTCYB Solana contract: 8WZiguAp8NyFnwm8Z97k6sCbSRCWaW1YYXKeCTpupump. Market and security links are on robotcyb.ai. CicadaFarm has a separate token in the same ecosystem.';
   return this.guide(q);
  }
  if(/camera|камер|season|сезон|hive|улей|уль|knowledge|знани/i.test(q))return this.guide(q);
  if(/robotcyb|cicadafarm|робот|цикад|ecosystem|экосистем|проект|project|link|ссылк/i.test(q))return ru?'Robotcyb и CicadaFarm — одна экосистема: robotcyb.ai — космический интерфейс проекта, c1cad4.github.io/cicadafarm/ — интерактивная ферма. Неоновые порталы связывают оба сайта. У каждого свой токен.':'Robotcyb and CicadaFarm are one ecosystem: robotcyb.ai is the cosmic project interface; c1cad4.github.io/cicadafarm/ is the interactive farm. Neon portals connect both sites. Each has its own token.';
  return null;
 },
 async reply(q,options={}){
  const fact=this.factual(q,options);if(fact)return fact;
  if(!this.engine)return options.fallback||this.guide(q);
  if(this.busy)return /[а-яё]/i.test(q)?'Я ещё отвечаю на предыдущий вопрос.':'I am still answering the previous question.';
  this.busy=true;const epoch=this.epoch;let replyTimeout;
  try{
   this.history.push({role:'user',content:q.slice(0,1500)});this.history=this.history.slice(-6);if(this.history[0]?.role==='assistant')this.history.shift();
   const result=await Promise.race([new Promise((_,reject)=>{replyTimeout=setTimeout(()=>reject(new Error('Generation timed out')),45000)}),this.engine.chat.completions.create({messages:[{role:'system',content:'You are Robotcyb, a concise friendly farm companion. CicadaFarm and https://robotcyb.ai are one ecosystem. Farm has 12 hives, garden, orchard, lake and animals. Site is a demo, not live telemetry. Camera is device preview. No payments are connected. Two distinct Solana tokens: CicadaFarm contract 9QLCEL7Xo9VTwgBeAYU1PWX7JJ8joKxQCYw3msjUpump; ROBOTCYB contract 8WZiguAp8NyFnwm8Z97k6sCbSRCWaW1YYXKeCTpupump. Never confuse their contracts. Do not invent prices or claim live data. Never invent website buttons, integrations or live functions. Keep replies to 2-3 sentences. Answer in the user language.'+(options.mode?' Current mode: '+options.mode+'. Tone examples are metaphors, never claims about website features: '+(options.examples||[]).join(' '):'')},...this.history],max_tokens:110,temperature:0.4})]);
   if(epoch!==this.epoch)return 'AI stopped.';
   const answer=result.choices[0]?.message?.content||this.guide(q);this.history.push({role:'assistant',content:answer});return answer;
  }catch(e){this.stop();return options.fallback||this.guide(q);}
  finally{clearTimeout(replyTimeout);if(epoch===this.epoch)this.busy=false;}
 },
 guide(q){
  const ru=/[а-яё]/i.test(q);let text;
  if(/token|токен|цена|price|contract/i.test(q))text=ru?'Токен CicadaFarm в сети Solana. Адрес: 9QLCEL7Xo9VTwgBeAYU1PWX7JJ8joKxQCYw3msjUpump. Открой TOKEN для контракта и ссылок. Цена и ликвидность берутся из GeckoTerminal. Если market cap не подтверждён, показана отдельно FDV.':'CicadaFarm Solana contract: 9QLCEL7Xo9VTwgBeAYU1PWX7JJ8joKxQCYw3msjUpump. Open TOKEN for direct market links. Live price and liquidity come from GeckoTerminal. Verified market cap may be unavailable; FDV is separate.';
  else if(/bee|hive|honey|пчел|пчёл|улей|м[её]д/i.test(q))text=ru?'В Bee Land показаны 12 ульев. Раздел HIVES описывает аренду на один или два года; бронирование и оплата пока не подключены.':'Bee Land shows 12 hives. HIVES describes one- and two-year rentals; booking and payments are not connected.';
  else if(/camera|video|камер|видео/i.test(q))text=ru?'CAMERAS открывает предпросмотр камеры твоего устройства после разрешения. Камеры самой фермы пока не подключены.':'CAMERAS previews your device camera after permission. Farm camera streams are not connected yet.';
  else if(/season|сезон|зим|лет|весн|осен/i.test(q))text=ru?'Кнопка change season переключает весну, лето, осень и зиму. SOUND включает атмосферу сезона.':'Use change season to switch spring, summer, autumn and winter. SOUND controls seasonal ambience.';
  else if(/recipe|knowledge|рецепт|знани/i.test(q))text=ru?'В KNOWLEDGE можно сохранить свои знания и рецепты в этом браузере. Опиши, что хочешь приготовить, после загрузки ИИ.':'KNOWLEDGE stores your notes and recipes in this browser. Load the AI to discuss ingredients and ideas.';
  else if(/robot|проект|робот/i.test(q))text=ru?'Robotcyb и CicadaFarm — один проект. Светящийся портал наверху ведёт на https://robotcyb.ai/.':'Robotcyb and CicadaFarm are one project. The glowing portal above leads to https://robotcyb.ai/.';
  else text=ru?'Я локальный справочник CicadaFarm: знаю о токене, ульях, камерах, знаниях и сезонах. ИИ загружается в фоне; после загрузки можно свободно общаться.':'I am the CicadaFarm project guide. Ask about tokens, hives, cameras, knowledge or seasons. The AI warms up automatically for open conversation.';
  return text;
 }
};

function scheduleRobotAI(){
 const begin=()=>{if(document.hidden){document.addEventListener('visibilitychange',()=>{if(!document.hidden)RobotMind.load();},{once:true});return;}RobotMind.load();};
 if('requestIdleCallback' in window)window.requestIdleCallback(begin,{timeout:1800});else setTimeout(begin,700);
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',scheduleRobotAI,{once:true});else scheduleRobotAI();
window.addEventListener('pagehide',()=>RobotMind.stop());
window.addEventListener('pageshow',event=>{if(event.persisted)scheduleRobotAI();});
