import {DatabaseSync} from 'node:sqlite';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
export const token='a'.repeat(64),otherToken='c'.repeat(64);
export const digest=v=>createHash('sha256').update(v).digest('hex');
export function database(){
 const sql=new DatabaseSync(':memory:');
 for(const file of ['schema.sql','commerce-schema.sql','commerce-operations.sql','account-schema.sql'])sql.exec(readFileSync(new URL('../../deploy/phonebridger/'+file,import.meta.url),'utf8'));
 for(const [id,email,t] of [['buyer','buyer@example.invalid',token],['other','other@example.invalid',otherToken]]){
  sql.prepare('INSERT INTO customer_users VALUES (?,?,?,?,?)').run(id,email,'unused','unused','2026-10-07');sql.prepare('INSERT INTO customer_sessions VALUES (?,?,?)').run(digest(t),id,Date.now()+3600000);
 }
 const wrap=(statement,values=[])=>({sql:statement,values,bind(...args){return wrap(statement,args);},async first(){return sql.prepare(statement).get(...values)||null;},async all(){return {results:sql.prepare(statement).all(...values)};},async run(){const r=sql.prepare(statement).run(...values);return {...r,meta:{changes:Number(r.changes)}};}});
 return {sql,prepare:s=>wrap(s),async batch(statements){sql.exec('BEGIN');try{const result=statements.map(s=>{const r=sql.prepare(s.sql).run(...s.values);return {...r,meta:{changes:Number(r.changes)}};});sql.exec('COMMIT');return result;}catch(e){sql.exec('ROLLBACK');throw e;}}};
}
export const request=(path,data,headers={})=>new Request('https://phonebridger.test'+path,{method:data===undefined?'GET':'POST',headers:{Origin:'https://phonebridger.test',Cookie:'__Host-pb_session='+token,...(data===undefined?{}:{'Content-Type':'application/json'}),...headers},body:data===undefined?undefined:JSON.stringify(data)});
export function order(db,change={}){
 const o={id:'b'.repeat(32),user_id:'buyer',email:'buyer@example.invalid',holders:0,finish:'none',policy_version:'test-v1',currency:'usd',subtotal:2900,shipping:0,status:'paid',fulfilment:'fulfilled',created_at:Date.now()-1000,expires_at:Date.now()+7200000,session_id:'cs_test_unit',paid_at:Date.now(),...change};
 const keys=Object.keys(o);db.sql.prepare(`INSERT INTO commerce_orders (${keys.join(',')}) VALUES (${keys.map(()=>'?').join(',')})`).run(...keys.map(k=>o[k]));return o;
}
