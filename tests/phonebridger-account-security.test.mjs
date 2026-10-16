import test from 'node:test';
import assert from 'node:assert/strict';
import {randomBytes} from 'node:crypto';
import {accountSecurity,emailVerified,securityDeletionStatements} from '../lib/phonebridger-account-security.mjs';
import {queueAccountMail,deliverAccountMail,serviceMailMaintenance} from '../lib/phonebridger-notifications.mjs';
import {accountWorkspace} from '../lib/phonebridger-account-workspace.mjs';
import {customerAccount} from '../lib/customer-accounts.mjs';
import {database,request,digest,token,otherToken} from './helpers/phonebridger-db.mjs';
const envOf=DB=>({DB,AUTH_RATE_SECRET:'unit-account-security',HOSTINGER_MAIL_API_KEY:'fixture',HOSTINGER_MAILBOX_ID:'fixture',LEAD_RECIPIENT:'support@example.invalid',COMMERCE_OPERATOR_SECRET:'unit-operator'});
const api=(action,data,headers)=>request('/api/account/'+action,data,headers);
function insertToken(db,purpose='reset',expires=Date.now()+60000){const value=randomBytes(32).toString('hex');db.sql.prepare('INSERT INTO account_security_tokens VALUES (?,?,?,?,NULL,?)').run(digest(value),'buyer',purpose,expires,Date.now());return value;}
test('reset requests are enumeration safe, rate bounded and never return or persist a clear token',async()=>{
 const db=database(),env=envOf(db),a=await accountSecurity(api('request-reset',{email:'buyer@example.invalid'}),env,'request-reset'),b=await accountSecurity(api('request-reset',{email:'absent@example.invalid'}),env,'request-reset');assert.equal(a.status,200);assert.deepEqual(await a.json(),await b.json());
 const record=db.sql.prepare('SELECT * FROM account_mail_outbox').get();assert.ok(record.payload);assert.doesNotMatch(record.payload,/buyer@example|token=/);assert.match(db.sql.prepare('SELECT digest FROM account_security_tokens').get().digest,/^[a-f0-9]{64}$/);
 for(let i=0;i<5;i++)await accountSecurity(api('request-reset',{email:'buyer@example.invalid'}),env,'request-reset');assert.equal(db.sql.prepare('SELECT COUNT(*) AS n FROM account_security_tokens').get().n,3);
 assert.equal((await accountSecurity(api('request-reset',{email:'buyer@example.invalid'},{Origin:'https://attacker.invalid'}),env,'request-reset')).status,403);
});
test('single use reset revokes every session and every older recovery token and keeps the password derivation',async()=>{
 const db=database(),env=envOf(db),old=insertToken(db),fresh=insertToken(db);
 const results=await Promise.all([accountSecurity(api('reset-password',{token:fresh,password:'new-pass'}),env,'reset-password'),accountSecurity(api('reset-password',{token:fresh,password:'racing-pass'}),env,'reset-password')]);assert.deepEqual(results.map(r=>r.status).sort(),[200,400]);
 assert.equal(db.sql.prepare("SELECT COUNT(*) AS n FROM customer_sessions WHERE user_id='buyer'").get().n,0);assert.equal((await accountSecurity(api('reset-password',{token:old,password:'old-link-pass'}),env,'reset-password')).status,400);
 const u=db.sql.prepare("SELECT * FROM customer_users WHERE id='buyer'").get();assert.equal(u.password_hash.length,128);assert.equal(u.salt.length,32);
 const winning=(results[0].status===200?'new-pass':'racing-pass');assert.equal((await customerAccount(api('login',{email:u.email,password:winning}),env,'login',{minimumPasswordLength:6})).status,200);
});
test('expired and wrong-purpose tokens cannot reset a password or verify an email',async()=>{
 const db=database(),env=envOf(db);for(const value of [insertToken(db,'reset',Date.now()-1),insertToken(db,'verify')])assert.equal((await accountSecurity(api('reset-password',{token:value,password:'123456'}),env,'reset-password')).status,400);
 assert.equal((await accountSecurity(api('verify-email',{token:insertToken(db,'reset')}),env,'verify-email')).status,400);assert.equal((await accountSecurity(api('reset-password',{token:insertToken(db),password:'12345'}),env,'reset-password')).status,400);
});
test('verification binds the saved identity, needs an explicit token submission and is single use',async()=>{
 const db=database(),env=envOf(db),value=insertToken(db,'verify');assert.equal(await emailVerified(db,{id:'buyer',email:'buyer@example.invalid'}),false);
 assert.equal((await accountSecurity(api('verify-email',{token:value}),env,'verify-email')).status,200);assert.equal(await emailVerified(db,{id:'buyer',email:'buyer@example.invalid'}),true);assert.equal(await emailVerified(db,{id:'other',email:'buyer@example.invalid'}),false);
 assert.equal((await accountSecurity(api('verify-email',{token:value}),env,'verify-email')).status,400);
 assert.equal((await accountSecurity(api('request-verification',{}, {Cookie:''}),env,'request-verification')).status,401);
});
test('mail claim is unique under concurrent sends and an ambiguous response is never retried',async()=>{
 const db=database(),env=envOf(db),id=await queueAccountMail(db,env,{kind:'test',message:{to:'unit@example.invalid',subject:'Fixture',text:'secret-token'}});let calls=0;
 const sender=async(_env,m)=>{calls++;assert.equal(m.text,'secret-token');throw Error('Ambiguous network failure');};await Promise.all([deliverAccountMail(db,env,id,sender),deliverAccountMail(db,env,id,sender)]);await deliverAccountMail(db,env,id,sender);assert.equal(calls,1);
 const row=db.sql.prepare('SELECT * FROM account_mail_outbox WHERE id=?').get(id);assert.equal(row.status,'unknown');assert.equal(row.payload,null);
});
test('expired mail is discarded and missing mail credentials do not mark delivery complete',async()=>{
 const db=database(),env=envOf(db),id=await queueAccountMail(db,env,{kind:'test',message:{to:'unit@example.invalid',subject:'Fixture',text:'Fixture'},expiresAt:Date.now()-1});assert.equal(await deliverAccountMail(db,{...env,HOSTINGER_MAIL_API_KEY:null},id),false);await serviceMailMaintenance({...env,HOSTINGER_MAIL_API_KEY:null});assert.equal(db.sql.prepare('SELECT status,payload FROM account_mail_outbox WHERE id=?').get(id).status,'expired');
});
test('account deletion atomically disables outstanding security links, queued mail and creator access',async()=>{
 const db=database(),env=envOf(db),email='delete-fixture@example.invalid',password='delete-fixture';
 const r=await customerAccount(api('register',{email,password},{Cookie:''}),env,'register',{minimumPasswordLength:6}),cookie=r.headers.get('set-cookie').split(';')[0],user=db.sql.prepare('SELECT id FROM customer_users WHERE email=?').get(email);
 db.sql.prepare("INSERT INTO creator_partners VALUES ('delete-partner',?,'DELETECODE','approved',NULL,?)").run(user.id,Date.now());db.sql.prepare('INSERT INTO account_security_tokens VALUES (?,?,?,?,NULL,?)').run(digest('delete-token'),user.id,'reset',Date.now()+60000,Date.now());
 const id=await queueAccountMail(db,env,{userId:user.id,kind:'test',message:{to:email,subject:'Fixture',text:'Fixture'}});
 await accountWorkspace(request('/api/workspace/profile',{name:'Disposable personal profile',setup:[],notifications:false},{Cookie:cookie}),env,'profile');
 assert.equal((await customerAccount(api('delete',{email,password},{Cookie:cookie}),env,'delete',{deleteExtra:securityDeletionStatements})).status,200);
 assert.equal(db.sql.prepare('SELECT COUNT(*) n FROM account_security_tokens WHERE user_id=?').get(user.id).n,0);assert.equal(db.sql.prepare('SELECT status FROM account_mail_outbox WHERE id=?').get(id).status,'expired');assert.equal(db.sql.prepare("SELECT status FROM creator_partners WHERE id='delete-partner'").get().status,'suspended');
 assert.equal(db.sql.prepare('SELECT COUNT(*) n FROM account_profiles WHERE user_id=?').get(user.id).n,0);
});
test('support notification is idempotent; reply mail respects verified email and explicit preference',async()=>{
 const db=database(),env=envOf(db),d={subject:'Unit support',message:'This is a saved support fixture.',requestId:crypto.randomUUID()};
 for(let i=0;i<2;i++)assert.equal((await accountWorkspace(request('/api/workspace/support',d),env,'support')).status,201);assert.equal(db.sql.prepare('SELECT COUNT(*) n FROM account_mail_outbox').get().n,1);
 assert.equal((await accountWorkspace(request('/api/workspace/profile',{name:'',setup:[],notifications:true}),env,'profile')).status,409);
 db.sql.prepare('INSERT INTO account_email_verifications VALUES (?,?,?)').run('buyer','buyer@example.invalid',Date.now());assert.equal((await accountWorkspace(request('/api/workspace/profile',{name:'',setup:[],notifications:true}),env,'profile')).status,200);
 const ticket=db.sql.prepare('SELECT id FROM support_tickets').get().id;
 const reply=()=>accountWorkspace(request('/api/workspace/operator',{action:'reply',ticketId:ticket,message:'Reviewed unit fixture',status:'resolved'},{Authorization:'Bearer unit-operator'}),env,'operator');assert.equal((await reply()).status,201);assert.equal(db.sql.prepare("SELECT COUNT(*) n FROM account_mail_outbox WHERE kind='support-reply'").get().n,1);
 await accountWorkspace(request('/api/workspace/profile',{name:'',setup:[],notifications:false}),env,'profile');await reply();assert.equal(db.sql.prepare("SELECT COUNT(*) n FROM account_mail_outbox WHERE kind='support-reply'").get().n,1);
 const summary=await(await accountWorkspace(request('/api/workspace/summary'),env,'summary')).json();assert.equal(summary.user.emailVerified,true);assert.equal(summary.capabilities.recovery,true);
 const other=await(await accountWorkspace(request('/api/workspace/support',undefined,{Cookie:'__Host-pb_session='+otherToken}),env,'support')).json();assert.equal(other.tickets.length,0);
});
