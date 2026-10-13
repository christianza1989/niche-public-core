import test from 'node:test';import assert from 'node:assert/strict';
import {referralPreferences} from '../lib/phonebridger-referral-choice.mjs';
import {referralRedirect,checkoutAttribution,affiliateTerms} from '../lib/phonebridger-affiliate.mjs';
import {database,request} from './helpers/phonebridger-db.mjs';
const token='f'.repeat(32),click='e'.repeat(32),base='https://phonebridger.com';
function setup(){const DB=database();DB.sql.prepare('INSERT INTO affiliate_terms VALUES (?,?,?)').run(affiliateTerms.version,JSON.stringify(affiliateTerms),Date.now());DB.sql.prepare("INSERT INTO creator_partners VALUES ('partner','other','TESTCODE','approved',?,?)").run(affiliateTerms.version,Date.now());DB.sql.prepare('INSERT INTO affiliate_links VALUES (?,?,?,1,?)').run(token,'partner','Fixture',Date.now());return {DB,AUTH_RATE_SECRET:'unit-choice',PLAYGROUND:'1',AFFILIATE_SANDBOX:'1'};}
const post=(path,choice,headers={})=>new Request(base+path,{method:'POST',headers:{Origin:base,'Content-Type':'application/x-www-form-urlencoded',...headers},body:'choice='+choice});
test('referral choice is explicit, decline leaves no click and withdrawal clears both legacy cookies',async()=>{
 const env=setup();const first=await referralRedirect(request('/r/'+token),env,token);assert.equal(first.status,200);assert.match(await first.text(),/Continue without tracking/);assert.equal(first.headers.get('set-cookie'),null);
 const decline=await referralRedirect(post('/r/'+token,'deny'),env,token);assert.equal(decline.status,302);assert.ok(decline.headers.getSetCookie().some(x=>x.startsWith('pb_ref=;')&&x.endsWith('Max-Age=0')));assert.equal(env.DB.sql.prepare('SELECT COUNT(*) n FROM affiliate_clicks').get().n,0);
 const allow=await referralRedirect(post('/r/'+token,'allow'),env,token);assert.equal(allow.status,302);assert.equal(allow.headers.getSetCookie().length,3);assert.equal(env.DB.sql.prepare('SELECT COUNT(*) n FROM affiliate_clicks').get().n,1);
 const withdraw=await referralPreferences(post('/referral-preferences','deny'));assert.equal(withdraw.status,303);assert.equal(withdraw.headers.get('location'),'/privacy');assert.equal(withdraw.headers.getSetCookie().length,3);
});
test('origin, payload and privacy signals cannot silently authorize referral tracking',async()=>{
 const env=setup();assert.equal((await referralRedirect(post('/r/'+token,'allow',{Origin:'https://attacker.invalid'}),env,token)).status,403);
 assert.equal((await referralPreferences(post('/referral-preferences','allow&choice=deny'))).status,400);assert.equal((await referralPreferences(post('/referral-preferences','x'.repeat(300)))).status,413);
 for(const signal of ['DNT','Sec-GPC']){const r=await referralRedirect(post('/r/'+token,'allow',{[signal]:'1'}),env,token);assert.equal(r.status,302);assert.ok(r.headers.getSetCookie().some(x=>x.startsWith('pb_ref_choice=deny')));}
 assert.equal(env.DB.sql.prepare('SELECT COUNT(*) n FROM affiliate_clicks').get().n,0);
});
test('unconsented and withdrawn legacy cookies cannot attribute checkout, while an entered code still works',async()=>{
 const env=setup(),db=env.DB;db.sql.prepare('INSERT INTO affiliate_clicks VALUES (?,?,?,?)').run(click,token,'visitor',Date.now());
 for(const cookie of ['pb_ref='+click,'pb_ref_choice=deny; pb_ref='+click])assert.equal(await checkoutAttribution(request('/shop',undefined,{Cookie:cookie}),env,db,{id:'buyer'},undefined,2900,'usd'),null);
 const consent='pb_ref_choice=allow; pb_ref='+click;assert.equal((await checkoutAttribution(request('/shop',undefined,{Cookie:consent}),env,db,{id:'buyer'},undefined,2900,'usd')).partnerId,'partner');
 assert.equal(await checkoutAttribution(request('/shop',undefined,{Cookie:consent,DNT:'1'}),env,db,{id:'buyer'},undefined,2900,'usd'),null);
 assert.equal((await checkoutAttribution(request('/shop',undefined,{Cookie:'pb_ref_choice=deny'}),env,db,{id:'buyer'},'TESTCODE',2900,'usd')).discount,145);
});
