const test = require('node:test');
const assert = require('node:assert/strict');
const {createStore, readArray, createFrameLoop} = require('../assets/runtime.js');

test('blocked browser storage keeps the site usable with session data', () => {
  let notices=0;
  const store=createStore(()=>{throw new Error('SecurityError');},()=>notices++);
  assert.equal(store.getItem('cart'),null);
  assert.equal(store.setItem('cart','[]'),false);
  assert.equal(store.getItem('cart'),'[]');
  store.removeItem('cart');
  assert.equal(store.getItem('cart'),null);
  assert.equal(notices,1);
});

test('quota failure preserves the latest session value', () => {
  const store=createStore(()=>({getItem:()=> 'old',setItem(){throw new Error('QuotaExceededError');}}));
  assert.equal(store.getItem('note'),'old');
  assert.equal(store.setItem('note','new'),false);
  assert.equal(store.getItem('note'),'new');
});

test('malformed, oversized and wrongly shaped history cannot crash initialization', () => {
  for (const raw of ['{broken','null','{}','"text"','x'.repeat(256001)]) {
    assert.deepEqual(readArray({getItem:()=>raw},'chat',80,()=>true),[]);
  }
  const rows=readArray({getItem:()=>JSON.stringify([null,{text:1},{text:'a'},{text:'b'},{text:'c'}])},
    'chat',2,row=>row && typeof row.text==='string');
  assert.deepEqual(rows,[{text:'b'},{text:'c'}]);
});

test('one animation loop caps render work and cancels cleanly on pause', () => {
  const queue=new Map();let next=0,draws=0;
  const loop=createFrameLoop(()=>draws++,{
    request(fn){queue.set(++next,fn);return next;},cancel:id=>queue.delete(id),fps:30
  });
  loop.start();loop.start();assert.equal(queue.size,1);
  for(let frame=0;frame<60;frame++) {
    const [id,callback]=queue.entries().next().value;queue.delete(id);callback(frame*1000/60);
  }
  assert.equal(draws,30);
  loop.stop();assert.equal(queue.size,0);assert.equal(loop.running,false);
  loop.start();assert.equal(queue.size,1);loop.stop();
});
