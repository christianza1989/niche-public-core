import test from 'node:test';
import assert from 'node:assert/strict';
import {mysqlD1,mysqlSettings} from '../db/hostinger-node-d1.mjs';
import {connect} from '../db/hostinger-node-sockets.mjs';
import {EmailMessage} from '../db/hostinger-node-email.mjs';

test('Node lead statements preserve bound values and independent reuse',async()=>{
 const calls=[];const db=mysqlD1({async execute(sql,args){calls.push({sql,args});return[{affectedRows:1,insertId:0}];}});
 const base=db.prepare('INSERT INTO niche_leads (name,message) VALUES (?,?)');
 const hostile="O'Neil; DROP TABLE niche_leads; --";
 await Promise.all([base.bind('Žąsis',hostile).run(),base.bind('Kitas','Atskirai').run()]);
 assert.deepEqual(calls,[{sql:'INSERT INTO niche_leads (name,message) VALUES (?,?)',args:['Žąsis',hostile]},{sql:'INSERT INTO niche_leads (name,message) VALUES (?,?)',args:['Kitas','Atskirai']}]);
 assert.throws(()=>base.bind(undefined),/binding_invalid/);assert.throws(()=>base.bind(NaN),/binding_invalid/);
});
test('Node D1 result shapes cover canonical insert/update and reads',async()=>{
 let rows={affectedRows:1,insertId:7};const db=mysqlD1({async execute(){return[rows];}});
 assert.deepEqual((await db.prepare('UPDATE niche_leads SET status=?').bind('notified').run()).meta,{changes:1,last_row_id:7,rows_read:0,rows_written:1});
 rows=[{id:'test-id',name:'Vardas'}];assert.equal((await db.prepare('SELECT id,name FROM niche_leads').first()).name,'Vardas');assert.equal(await db.prepare('SELECT id FROM niche_leads').first('id'),'test-id');
 assert.deepEqual((await db.prepare('SELECT id,name FROM niche_leads').all()).results,rows);rows=[];assert.equal(await db.prepare('SELECT id FROM niche_leads').first(),null);
});
test('database error output excludes credentials and inquiry values',async()=>{
 const db=mysqlD1({async execute(){throw Object.assign(Error('password=private-value customer inquiry'),{code:'ER_ACCESS_DENIED_ERROR'});}});
 await assert.rejects(db.prepare('SELECT ?').bind('private inquiry').run(),error=>error.message==='node_database_ER_ACCESS_DENIED_ERROR');
});
test('Hostinger database configuration stays local, literal and single-statement',()=>{
 const env={DB_USER:'site',DB_PASSWORD:'literal$\\quote"',DB_NAME:'inquiries'};
 const settings=mysqlSettings(env);assert.equal(settings.host,'127.0.0.1');assert.equal(mysqlSettings({...env,DB_HOST:'localhost'}).host,'127.0.0.1');assert.equal(settings.password,env.DB_PASSWORD);assert.equal(settings.multipleStatements,false);assert.equal(settings.charset,'utf8mb4');
 const uri=mysqlSettings({DATABASE_URL:'mysql://site:p%24%5C%22@127.0.0.1:3306/inquiries'});assert.equal(uri.password,'p$\\"');
 assert.throws(()=>mysqlSettings({...env,DB_HOST:'srv-other.example'}),/must_be_local/);assert.throws(()=>mysqlSettings({...env,DB_PORT:'invalid'}),/port_invalid/);assert.throws(()=>mysqlSettings({}),/not_configured/);
});
test('Node sockets reject plaintext and do not claim native email support',()=>{
 assert.throws(()=>connect({hostname:'smtp.hostinger.com',port:465},{secureTransport:'off'}),/requires_tls/);
 assert.throws(()=>new EmailMessage(),/unavailable_on_node/);
});
