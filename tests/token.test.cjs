const {test}=require('node:test');const assert=require('node:assert/strict');const {parsePool}=require('../assets/runtime.js');
const pool='pool-address',token='token-address';
function payload(attributes){return {data:{id:'solana_'+pool,attributes:{address:pool,...attributes},relationships:{base_token:{data:{id:'solana_'+token}}}}};}
test('real pool metrics preserve missing market cap separately from FDV',()=>{assert.deepEqual(parsePool(payload({base_token_price_usd:'0.000002594404044',market_cap_usd:null,fdv_usd:'2594.404044',reserve_in_usd:'2598.7745'}),pool,token),{price:.000002594404044,marketCap:null,fdv:2594.404044,liquidity:2598.7745});});
test('zero metrics remain zero; invalid or absent metrics are unavailable',()=>{assert.deepEqual(parsePool(payload({base_token_price_usd:'bad',market_cap_usd:'',reserve_in_usd:'0',fdv_usd:-1}),pool,token),{price:null,marketCap:null,liquidity:0,fdv:null});});
test('rejects data for a different token or pool',()=>{assert.throws(()=>parsePool(payload({}),pool,'another-token'));assert.throws(()=>parsePool(payload({}),'another-pool',token));});
