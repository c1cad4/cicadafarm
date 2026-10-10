/* Local translation catalogue: no external translation service and no user-text rewriting. */
(function(){
'use strict';
const languages={en:0,ru:1,'zh-CN':2},catalogue=new Map();
for(const row of window.FarmTranslations)for(const source of row)catalogue.set(source,row);
const keys=[...catalogue.keys()].sort((a,b)=>b.length-a.length),escape=s=>s.replace(/[.*+?^${}()|[\]\\]/g,'\\$&');
const pattern=new RegExp('(?<![A-Za-zА-Яа-яЁё\\u3400-\\u9fff])('+keys.map(escape).join('|')+')(?![A-Za-zА-Яа-яЁё\\u3400-\\u9fff])','gu');
let lang='en';try{const requested=new URLSearchParams(location.search).get('lang');lang=requested in languages?requested:localStorage.getItem('cicadaLanguage')||'en';}catch{}if(!(lang in languages))lang='en';
const textSources=new WeakMap(),attributeSources=new WeakMap();
function translate(source){return String(source).replace(pattern,key=>catalogue.get(key)[languages[lang]]);}
function excluded(el){return !el||el.closest('script,style,code,pre,textarea,[data-i18n-skip],#cybchatMessages,#knowledgeList');}
function text(node){if(excluded(node.parentElement))return;const value=node.nodeValue;let saved=textSources.get(node);if(!saved||value!==saved.last)saved={source:value,last:value};const result=translate(saved.source);if(result!==value)node.nodeValue=result;saved.last=result;textSources.set(node,saved);}
const attributes=['aria-label','data-label','placeholder','title','alt'];
function element(el){if(excluded(el))return;let saved=attributeSources.get(el);if(!saved){saved=new Map();attributeSources.set(el,saved);}for(const attr of attributes){if(!el.hasAttribute(attr))continue;const value=el.getAttribute(attr);let item=saved.get(attr);if(!item||value!==item.last)item={source:value,last:value};const result=translate(item.source);if(result!==value)el.setAttribute(attr,result);item.last=result;saved.set(attr,item);}}
function apply(root=document.body){if(root.nodeType===Node.TEXT_NODE){text(root);return;}if(root.nodeType!==Node.ELEMENT_NODE)return;element(root);const walker=document.createTreeWalker(root,NodeFilter.SHOW_ELEMENT|NodeFilter.SHOW_TEXT);let node;while((node=walker.nextNode())){if(node.nodeType===Node.TEXT_NODE)text(node);else element(node);}}
function set(next){if(!(next in languages))return;lang=next;document.documentElement.lang=lang;try{localStorage.setItem('cicadaLanguage',lang);}catch{}document.querySelectorAll('[data-language]').forEach(select=>select.value=lang);document.title=translate('CicadaFarm — Living Farm');const query=new URL(location.href);if(query.searchParams.has('lang')){query.searchParams.set('lang',lang);history.replaceState(null,'',query);}document.querySelectorAll('.agent-version').forEach(a=>a.href='agents/'+({en:'',ru:'ru.html','zh-CN':'zh.html'}[lang]));apply();document.dispatchEvent(new CustomEvent('farm-language-change',{detail:lang}));}
window.FarmI18n={t:translate,set,get language(){return lang;},get locale(){return {en:'en-US',ru:'ru-RU','zh-CN':'zh-CN'}[lang];},apply};
const nativeAlert=window.alert.bind(window);window.alert=message=>nativeAlert(translate(message));
const observer=new MutationObserver(records=>{const roots=new Set();for(const record of records){if(record.type==='characterData')text(record.target);else if(record.type==='attributes')element(record.target);else record.addedNodes.forEach(node=>roots.add(node));}for(const root of roots)if(root.isConnected)apply(root);});
observer.observe(document.body,{subtree:true,childList:true,characterData:true,attributes:true,attributeFilter:attributes});
document.querySelectorAll('[data-language]').forEach(select=>select.addEventListener('change',()=>set(select.value)));set(lang);
})();
