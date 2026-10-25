import test from 'node:test';
import assert from 'node:assert/strict';
import {takeMemoPaymentRecovery} from '../lib/memocasting-payment-recovery.mjs';
import {memoAnalyticsPage} from '../lib/memocasting-analytics.mjs';
const token='r1_00000000-0000-4000-8000-000000000001_mhkt4w00_'+'ab'.repeat(32);
test('recovery fragment is removed before use; capabilities never reach analytics or an HTTP query',()=>{
 let replacement;
 const value=takeMemoPaymentRecovery({hash:'#resume='+token,pathname:'/cart',search:''},{replaceState:(_state,_title,url)=>{replacement=url;}});
 assert.equal(value,token);assert.equal(replacement,'/cart');
 assert.throws(()=>takeMemoPaymentRecovery({hash:'#resume=bad',pathname:'/cart',search:''},{replaceState:()=>{}}),/forbidden/);
 assert.equal(takeMemoPaymentRecovery({hash:'#other'},{replaceState:()=>{throw Error('no mutation');}}),undefined);
 const page=memoAnalyticsPage({id:'G-ABCDEFGH',language:'lt',path:'/cart',title:'Krepšelis',track:false},{href:'https://memocasting.lt/cart#resume='+token},{runtime:true});
 assert(!JSON.stringify(page).includes(token));
});
