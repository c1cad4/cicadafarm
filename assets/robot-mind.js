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
   const engine=await Promise.race([workerError,CreateWebWorkerMLCEngine(this.worker,'Qwen2.5-0.5B-Instruct-q4f16_1-MLC',{initProgressCallback:p=>this.status('Loading local AI… '+Math.round(Math.max(0,Math.min(1,p.progress||0))*100)+'%')}, {context_window_size:2048})]);
   if(epoch!==this.epoch)return;
   this.engine=engine;this.status('Local AI ready · Qwen 0.5B · answers may be inaccurate');
  }catch(e){if(epoch===this.epoch){this.worker?.terminate();this.worker=null;console.warn('Robotcyb AI load:',e);this.status('AI unavailable. Project guide active.');}}
  finally{clearTimeout(watchdog);if(epoch===this.epoch)this.busy=false;}
 },
 stop(){this.epoch++;this.worker?.terminate();this.worker=null;this.engine=null;this.busy=false;this.history=[];this.status('AI stopped · project guide active');},
 factual(q,options={}){
  const ru=/[а-яё]/i.test(q);
  if(/token|токен|contract|контракт|price|цена|капитал|liquidity|ликвид|代币|价格|合约|流动性/i.test(q)){
   if(/cicadafarm|цикад|ферм/i.test(q))return this.guide(q);
   if(/robotcyb|робот/i.test(q)||options.project==='robotcyb')return ru?'Токен ROBOTCYB в Solana: 8WZiguAp8NyFnwm8Z97k6sCbSRCWaW1YYXKeCTpupump. Ссылки на рынок и проверку токена находятся на robotcyb.ai. CicadaFarm — отдельный токен той же экосистемы.':'ROBOTCYB Solana contract: 8WZiguAp8NyFnwm8Z97k6sCbSRCWaW1YYXKeCTpupump. Market and security links are on robotcyb.ai. CicadaFarm has a separate token in the same ecosystem.';
   return this.guide(q);
  }
  if(/camera|камер|season|сезон|hive|улей|уль|knowledge|знани|摄像头|季节|蜂箱|知识/i.test(q))return this.guide(q);
  if(/robotcyb|cicadafarm|робот|цикад|ecosystem|экосистем|проект|project|link|ссылк/i.test(q))return ru?'Robotcyb и CicadaFarm — одна экосистема: robotcyb.ai — космический интерфейс проекта, c1cad4.github.io/cicadafarm/ — интерактивная ферма. Неоновые порталы связывают оба сайта. У каждого свой токен.':'Robotcyb and CicadaFarm are one ecosystem: robotcyb.ai is the cosmic project interface; c1cad4.github.io/cicadafarm/ is the interactive farm. Neon portals connect both sites. Each has its own token.';
  return null;
 },
 async reply(q,options={}){
  const fact=this.factual(q,options);if(fact)return /[\u3400-\u9fff]/.test(q)||window.FarmI18n?.language==='zh-CN'?this.guide(q):fact;
  if(!this.engine)return options.fallback||this.guide(q);
  if(this.busy&&(/[\u3400-\u9fff]/.test(q)||window.FarmI18n?.language==='zh-CN'))return '我仍在回答上一个问题。';
  if(this.busy)return /[а-яё]/i.test(q)?'Я ещё отвечаю на предыдущий вопрос.':'I am still answering the previous question.';
  this.busy=true;const epoch=this.epoch;let replyTimeout;
  try{
   this.history.push({role:'user',content:q.slice(0,1500)});this.history=this.history.slice(-6);if(this.history[0]?.role==='assistant')this.history.shift();
   const result=await Promise.race([new Promise((_,reject)=>{replyTimeout=setTimeout(()=>reject(new Error('Generation timed out')),45000)}),this.engine.chat.completions.create({messages:[{role:'system',content:'You are Robotcyb, a concise friendly farm companion. CicadaFarm and https://robotcyb.ai are one ecosystem. Farm has 12 hives, garden, orchard, lake and animals. Site is a demo, not live telemetry. Camera is device preview. MARKET supports CICADAFARM Solana Pay transfers, chain checks and downloadable receipts; farm manually confirms inventory and delivery. Two distinct Solana tokens: CicadaFarm contract 9QLCEL7Xo9VTwgBeAYU1PWX7JJ8joKxQCYw3msjUpump; ROBOTCYB contract 8WZiguAp8NyFnwm8Z97k6sCbSRCWaW1YYXKeCTpupump. Never confuse their contracts. Do not invent prices or claim live data. Never invent website buttons, integrations or live functions. Keep replies to 2-3 sentences. Answer in the user language (English, Russian or Simplified Chinese).'+(options.mode?' Current mode: '+options.mode+'. Tone examples are metaphors, never claims about website features: '+(options.examples||[]).join(' '):'')},...this.history],max_tokens:110,temperature:0.4})]);
   if(epoch!==this.epoch)return 'AI stopped.';
   const answer=result.choices[0]?.message?.content||this.guide(q);this.history.push({role:'assistant',content:answer});return answer;
  }catch(e){this.stop();return options.fallback||this.guide(q);}
  finally{clearTimeout(replyTimeout);if(epoch===this.epoch)this.busy=false;}
 },
 guide(q){
  const chinese=/[\u3400-\u9fff]/.test(q)||window.FarmI18n?.language==='zh-CN';
  if(chinese){
   if(/token|токен|price|цена|contract|代币|价格|合约/i.test(q)&&/robotcyb/i.test(q)&&!/cicadafarm/i.test(q))return 'ROBOTCYB 的 Solana 代币合约：8WZiguAp8NyFnwm8Z97k6sCbSRCWaW1YYXKeCTpupump。市场与安全链接位于 robotcyb.ai。CicadaFarm 是同一生态系统中的另一个独立代币。';
   if(/token|токен|price|цена|contract|代币|价格|合约/i.test(q))return 'CicadaFarm 的 Solana 代币合约：9QLCEL7Xo9VTwgBeAYU1PWX7JJ8joKxQCYw3msjUpump。打开代币菜单查看 GeckoTerminal 价格与流动性。已确认市值可能不可用；FDV 单独显示。';
   if(/bee|hive|honey|улей|м[её]д|蜂箱|蜂蜜/i.test(q))return '现有四个蜂箱可供租赁：两年 $5000，三年 $10000，按汇率使用 CICADAFARM 付款。蜂蜜价格为每升 $120；运费另计。请将收据发送给 @robot_cyb，由农场确认订单。';
   if(/camera|video|камер|摄像头|视频/i.test(q))return '摄像头菜单可在您授权后预览设备摄像头。农场摄像头视频流尚未接入。';
   if(/season|сезон|季节|冬|夏|春|秋/i.test(q))return '切换季节按钮可切换春、夏、秋、冬。声音按钮控制季节氛围音。农场贡献页面的天气数据为示例，并非实时天气报告。';
   if(/recipe|knowledge|знани|知识|食谱/i.test(q))return '知识菜单可将笔记与食谱保存在此浏览器中。AI 加载完成后，可讨论食材与创意。';
   return '我是 CicadaFarm 项目助手。CicadaFarm 与 https://robotcyb.ai 属于同一生态系统，由星空传送门连接。您可以询问商店、蜂箱、代币、季节及摄像头。AI 会在后台自动加载。';
  }
  const ru=/[а-яё]/i.test(q);let text;
  if(/token|токен|цена|price|contract/i.test(q))text=ru?'Токен CicadaFarm в сети Solana. Адрес: 9QLCEL7Xo9VTwgBeAYU1PWX7JJ8joKxQCYw3msjUpump. Открой TOKEN для контракта и ссылок. Цена и ликвидность берутся из GeckoTerminal. Если market cap не подтверждён, показана отдельно FDV.':'CicadaFarm Solana contract: 9QLCEL7Xo9VTwgBeAYU1PWX7JJ8joKxQCYw3msjUpump. Open TOKEN for direct market links. Live price and liquidity come from GeckoTerminal. Verified market cap may be unavailable; FDV is separate.';
  else if(/bee|hive|honey|пчел|пчёл|улей|м[её]д/i.test(q))text=ru?'В Bee Land показаны 12 ульев. Доступны 4 улья: аренда на 2 года — $5000, на 3 года — $10000, оплата в CICADAFARM по курсу. В MARKET мёд стоит $120 за литр; доставка оплачивается отдельно. Чек отправляется @robot_cyb для подтверждения заказа.':'Bee Land shows 12 hives. Four hives are available: two years $5000 or three years $10000, paid in CICADAFARM at the current rate. Honey costs $120/L; shipping is separate. Send your receipt to @robot_cyb for farm confirmation.';
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
