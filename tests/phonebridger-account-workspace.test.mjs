import test from 'node:test';
import assert from 'node:assert/strict';
import {scryptSync} from 'node:crypto';
import {accountWorkspace,sanitizeDiagnostics} from '../lib/phonebridger-account-workspace.mjs';
import {database,request,order,otherToken,digest} from './helpers/phonebridger-db.mjs';
const envOf=DB=>({DB,AUTH_RATE_SECRET:'unit-rate-only'});
const req=(action,data,headers)=>request('/api/workspace/'+action,data,headers);
test('workspace requires the existing session and isolates orders, licences, tickets and settings',async()=>{
 const db=database(),env=envOf(db);order(db);const foreign=order(db,{id:'d'.repeat(32),user_id:'other',email:'secret@example.invalid',session_id:'cs_other'});
 db.sql.prepare("INSERT INTO commerce_entitlements VALUES (?,?,'active',?,?)").run(foreign.id,'other','PRIVATE',Date.now());
 assert.equal((await accountWorkspace(req('summary',undefined,{Cookie:''}),env,'summary')).status,401);
 const summary=await(await accountWorkspace(req('summary'),env,'summary',{windows:{filename:'accepted.zip',bytes:100,sha256:'sha'}})).json();assert.equal(summary.orders.length,1);assert.equal(summary.licences.length,0);assert.equal(summary.creator.approved,false);assert.equal(summary.capabilities.phoneStatus,false);assert.equal(summary.downloads.windows.url,'/downloads/windows');assert.ok(!JSON.stringify(summary).includes('PRIVATE'));assert.equal(summary.user.emailVerified,false);
 assert.equal((await accountWorkspace(req('support',{subject:'Refund request',message:'Please review this request.',orderId:foreign.id}),env,'support')).status,404);
 assert.equal((await accountWorkspace(req('profile',{name:'Other'},{Origin:'https://evil.invalid'}),env,'profile')).status,403);
 assert.equal((await accountWorkspace(req('profile',{name:'Alex',setup:['windows','pairing']}),env,'profile')).status,200);
 assert.equal((await accountWorkspace(req('profile',{name:'Alex',notifications:true}),env,'profile')).status,409);
 assert.equal((await(await accountWorkspace(req('summary'),env,'summary')).json()).profile.name,'Alex');
 assert.equal((await(await accountWorkspace(req('summary',undefined,{Cookie:'__Host-pb_session='+otherToken}),env,'summary')).json()).profile.name,'');
});
test('diagnostics require explicit attachment consent, are bounded and redacted server-side',async()=>{
 const db=database(),env=envOf(db),data={subject:'USB setup',message:'My phone is not appearing.',diagnostics:'token=private-token\nEmail: test@example.invalid\nC:\\Users\\Alex\\log.txt'};
 assert.equal((await accountWorkspace(req('support',data),env,'support')).status,400);
 const response=await accountWorkspace(req('support',{...data,diagnosticsConsent:true}),env,'support');assert.equal(response.status,201);assert.match((await response.json()).message,/saved/);
 const stored=db.sql.prepare('SELECT diagnostics FROM support_tickets').get();assert.ok(!stored.diagnostics.includes('private-token'));assert.ok(!stored.diagnostics.includes('test@example.invalid'));assert.ok(!stored.diagnostics.includes('Alex'));
 assert.equal((await accountWorkspace(req('support',{...data,diagnostics:'x'.repeat(9000),diagnosticsConsent:true}),env,'support')).status,400);
 assert.equal((await(await accountWorkspace(req('support',undefined,{Cookie:'__Host-pb_session='+otherToken}),env,'support')).json()).tickets.length,0);
 assert.ok(!sanitizeDiagnostics('Authorization: Bearer hidden\nsk_test_private').includes('hidden'));
});
test('support retries are idempotent and only the separate operator can reply',async()=>{
 const db=database(),env={...envOf(db),COMMERCE_OPERATOR_SECRET:'unit-operator'},d={subject:'Setup question',message:'Please help with the setup.',requestId:crypto.randomUUID()};
 const result=await(await accountWorkspace(req('support',d),env,'support')).json();assert.equal((await accountWorkspace(req('support',d),env,'support')).status,201);assert.equal(db.sql.prepare('SELECT COUNT(*) n FROM support_tickets').get().n,1);
 assert.equal((await accountWorkspace(req('support',{...d,message:'Another different message'}),env,'support')).status,409);
 const reply={action:'reply',ticketId:result.id,status:'in_progress',message:'Please check the Android permissions guide.'};
 assert.equal((await accountWorkspace(req('operator',reply),env,'operator')).status,401);assert.equal((await accountWorkspace(req('operator',reply,{Authorization:'Bearer unit-operator'}),env,'operator')).status,201);
 const own=await(await accountWorkspace(req('support'),env,'support')).json();assert.equal(own.replies.length,1);assert.equal(own.tickets[0].status,'in_progress');
 assert.equal((await(await accountWorkspace(req('support',undefined,{Cookie:'__Host-pb_session='+otherToken}),env,'support')).json()).replies.length,0);
});
test('password change preserves scrypt strength, revokes other sessions and never exposes hashes',async()=>{
 const db=database(),env=envOf(db),old='fixture old password',next='fixture new password';
 db.sql.prepare('UPDATE customer_users SET salt=?,password_hash=? WHERE id=?').run('unit-salt',scryptSync(old,'unit-salt',64,{N:32768,r:8,p:3,maxmem:67108864}).toString('hex'),'buyer');
 db.sql.prepare('INSERT INTO customer_sessions VALUES (?,?,?)').run(digest('d'.repeat(64)),'buyer',Date.now()+3600000);
 assert.equal((await accountWorkspace(req('password',{currentPassword:'wrong',newPassword:next}),env,'password')).status,401);
 assert.equal((await accountWorkspace(req('password',{currentPassword:old,newPassword:next}),env,'password')).status,200);
 const u=db.sql.prepare("SELECT * FROM customer_users WHERE id='buyer'").get();assert.equal(u.password_hash,scryptSync(next,u.salt,64,{N:32768,r:8,p:3,maxmem:67108864}).toString('hex'));
 assert.equal(db.sql.prepare("SELECT COUNT(*) n FROM customer_sessions WHERE user_id='buyer'").get().n,1);
 const summary=await(await accountWorkspace(req('summary'),env,'summary')).text();assert.ok(!summary.includes(u.password_hash));assert.ok(!summary.includes('digest'));
});
