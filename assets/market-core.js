/* Fixed USD prices, exact SPL-token quotes. No floating-point token arithmetic. */
(function(root){
'use strict';
const config={recipient:'AHBz386tP36ZrABN7STzxV66u1f7CwnaqrFBnevb4ff8',contact:'https://t.me/robot_cyb',mint:'9QLCEL7Xo9VTwgBeAYU1PWX7JJ8joKxQCYw3msjUpump',decimals:6,pool:'4155gZUL9omQeB8zyaTrEtxAGqzj1Bmn7szxX2n7tMii',rpc:'https://solana-rpc.publicnode.com'};
const products={
 tea:{name:'IVAN TEA',icon:'🌿',unit:'kg',stock:50,cents:3000,sizes:[50,100,250,1000],labels:['50 g','100 g','250 g','1 kg']},
 nuts:{name:'CEDAR NUTS',icon:'🌰',unit:'kg',stock:300,cents:5000,sizes:[250,500,1000],labels:['250 g','500 g','1 kg']},
 honey:{name:'FARM HONEY',icon:'🍯',unit:'L',stock:100,cents:12000,sizes:[250,500,1000],labels:['250 ml','500 ml','1 L']},
 eggs:{name:'FARM EGGS',icon:'🥚',unit:'eggs',stock:100,cents:100,sizes:[6000,10000,20000],labels:['6 eggs','10 eggs','20 eggs']},
 hive2:{name:'HIVE · 2 YEARS',icon:'🐝',unit:'rental',stock:4,cents:500000,sizes:[1000],labels:['2 years']},
 hive3:{name:'HIVE · 3 YEARS',icon:'🐝',unit:'rental',stock:4,cents:1000000,sizes:[1000],labels:['3 years']}
};
function fraction(s){if(!/^\d+(\.\d+)?$/.test(String(s)))throw Error('Invalid price');const [a,b='']=String(s).split('.');return [BigInt(a+b),10n**BigInt(b.length)];}
function quote(cents,price){if(!Number.isSafeInteger(cents)||cents<=0)throw Error('Invalid total');const [n,d]=fraction(price);if(n<=0n)throw Error('No price');const top=BigInt(cents)*d*10n**BigInt(config.decimals),bottom=100n*n;return (top+bottom-1n)/bottom;}
function amount(raw){const s=BigInt(raw).toString().padStart(config.decimals+1,'0');return s.slice(0,-config.decimals)+'.'+s.slice(-config.decimals);}
function total(items){return items.reduce((sum,i)=>{const p=products[i.id];if(!p||p.cents===null||!p.sizes.includes(i.size)||!Number.isInteger(i.qty)||i.qty<1||i.qty>1000)throw Error('Invalid cart');return sum+p.cents*i.size*i.qty/1000;},0);}
function validStock(items){if(items.filter(i=>i.id.startsWith('hive')).reduce((s,i)=>s+i.qty,0)>4)return false;for(const id of new Set(items.map(i=>i.id))){const p=products[id];if(!p||p.cents===null||p.stock===null||p.stock===0)return false;const used=items.filter(i=>i.id===id).reduce((s,i)=>s+i.size*i.qty,0);if(used>p.stock*1000)return false;}return true;}
function verify(tx,order){if(!tx||!tx.meta||tx.meta.err||!tx.blockTime||tx.blockTime*1000<order.created-60000||tx.blockTime*1000>order.expires) return false;
 const instructions=[...(tx.transaction?.message?.instructions||[]),...(tx.meta.innerInstructions||[]).flatMap(x=>x.instructions||[])];
 if(!instructions.some(i=>i.program==='spl-memo'&&i.parsed===order.id))return false;
 const balance=list=>(list||[]).filter(b=>b.mint===config.mint&&b.owner===config.recipient&&b.uiTokenAmount.decimals===config.decimals).reduce((n,b)=>n+BigInt(b.uiTokenAmount.amount),0n);
 return balance(tx.meta.postTokenBalances)-balance(tx.meta.preTokenBalances)>=BigInt(order.raw);
}
const api={config,products,quote,amount,total,validStock,verify};if(typeof module==='object')module.exports=api;else root.FarmMarket=api;
})(typeof window==='object'?window:globalThis);
