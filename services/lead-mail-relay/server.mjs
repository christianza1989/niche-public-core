import express from 'express';
import {createServer} from 'node:http';
import {connect} from 'node:tls';
import {Readable,Writable} from 'node:stream';
import mysql from 'mysql2/promise';
import {smtpSession} from '../../lib/smtp-protocol.mjs';
import {createLeadMailRelay} from './relay.mjs';
let poolPromise;
async function database(){
 if(!poolPromise)poolPromise=(async()=>{
  for(const key of ['DB_HOST','DB_NAME','DB_USER','DB_PASSWORD'])if(!process.env[key])throw Error('configuration_missing');
  const pool=mysql.createPool({host:process.env.DB_HOST,port:Number(process.env.DB_PORT||3306),database:process.env.DB_NAME,user:process.env.DB_USER,password:process.env.DB_PASSWORD,connectionLimit:2,connectTimeout:10000});
  await pool.execute("CREATE TABLE IF NOT EXISTS lead_mail_messages(environment VARCHAR(20) NOT NULL,store_id VARCHAR(100) NOT NULL,id VARCHAR(220) NOT NULL,fingerprint CHAR(64) NOT NULL,sender VARCHAR(320) NOT NULL,recipient VARCHAR(320) NOT NULL,status VARCHAR(20) NOT NULL,reference VARCHAR(500),created_at BIGINT NOT NULL,PRIMARY KEY(environment,store_id,id)) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin");
  return pool;
 })().catch(error=>{poolPromise=null;throw error;});
 return poolPromise;
}
const ledger={
 async get(environment,storeId,id){const [rows]=await(await database()).execute('SELECT * FROM lead_mail_messages WHERE environment=? AND store_id=? AND id=?',[environment,storeId,id]);return rows[0]||null;},
 async claim(message,hash){const [result]=await(await database()).execute("INSERT IGNORE INTO lead_mail_messages(environment,store_id,id,fingerprint,sender,recipient,status,reference,created_at) VALUES(?,?,?,?,?,?,'unknown',NULL,?)",[message.environment,message.storeId,message.id,hash,message.from,message.to,Date.now()]);return{claimed:result.affectedRows===1,row:await this.get(message.environment,message.storeId,message.id)};},
 async accept(message,hash,reference){await(await database()).execute("UPDATE lead_mail_messages SET status='accepted',reference=? WHERE environment=? AND store_id=? AND id=? AND fingerprint=? AND status='unknown'",[reference,message.environment,message.storeId,message.id,hash]);return this.get(message.environment,message.storeId,message.id);}
};
async function smtp(message){
 if(!process.env.RELAY_SMTP_USER||!process.env.RELAY_SMTP_PASSWORD)throw Error('configuration_missing');
 const socket=connect({host:'smtp.hostinger.com',port:465,servername:'smtp.hostinger.com',rejectUnauthorized:true});
 socket.on('error',()=>{});
 await smtpSession({readable:Readable.toWeb(socket),writable:Writable.toWeb(socket),close:async()=>socket.destroy()},{user:process.env.RELAY_SMTP_USER,password:process.env.RELAY_SMTP_PASSWORD,timeoutMs:12000},message);
 return{reference:message?`smtp-accepted:${message.messageId}`:null};
}
const relay=createLeadMailRelay({clients:JSON.parse(process.env.RELAY_CLIENTS_JSON||'[]'),from:process.env.RELAY_SMTP_USER,ledger,send:smtp,checkTransport:async()=>{await database();await smtp(null);return{ready:true,stage:'authenticated'};}});
const app=express();app.disable('x-powered-by');
app.use(async(req,res)=>{
 try{
  const request=new Request(new URL(req.url,'https://kontaktuforma.lt'),{method:req.method,headers:req.headers,...(['GET','HEAD'].includes(req.method)?{}:{body:Readable.toWeb(req),duplex:'half'})});
  const result=await relay(request);res.writeHead(result.status,Object.fromEntries(result.headers));res.end(await result.text());
 }catch{res.writeHead(503,{'content-type':'application/json','cache-control':'no-store','x-robots-tag':'noindex, nofollow'});res.end('{"error":"mail_operation_unavailable"}');}
});
const server=createServer({maxHeaderSize:8192},app);server.requestTimeout=30000;server.headersTimeout=10000;
server.listen(Number(process.env.PORT||3000),'0.0.0.0');
