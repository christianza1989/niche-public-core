import http from 'node:http';
import next from 'next';
import {readFile} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import mysql from 'mysql2/promise';
import {mysqlSettings} from '../db/hostinger-node-d1.mjs';
import {connect} from '../db/hostinger-node-sockets.mjs';
import {smtpSession} from '../lib/smtp-protocol.mjs';
import {hostingerPublicHost} from '../lib/niche-request-origin.mjs';
if(process.env.HOSTINGER_NODE_RUNTIME!=='1')throw Error('hostinger_node_target_required');
if(process.env.NICHE_DEV_SITE_ID)throw Error('hostinger_must_not_use_preview_override');
const pool=mysql.createPool(mysqlSettings(process.env));
try{await pool.query(await readFile(new URL('../db/hostinger-leads.sql',import.meta.url),'utf8'));await pool.execute('SELECT 1');console.log('hostinger_lead_database_ready');}
catch{console.error('hostinger_lead_database_unavailable');process.exitCode=1;}
finally{await pool.end();}
if(process.exitCode)process.exit(process.exitCode);
if(process.env.LEAD_SMTP_ENABLED==='1'||process.env.HOSTINGER_SMTP_PREFLIGHT==='1'){
 try{await smtpSession(connect({hostname:'smtp.hostinger.com',port:465},{secureTransport:'on'}),{user:process.env.LEAD_SMTP_USER,password:process.env.LEAD_SMTP_PASSWORD,timeoutMs:12000});console.log('hostinger_smtp_authenticated_no_message_sent');}
 catch{console.error('hostinger_smtp_authentication_unavailable');process.exit(1);}
}
const port=Number(process.env.PORT||3000);if(!Number.isInteger(port)||port<1||port>65535)throw Error('hostinger_port_invalid');
// NextURL normalizes loopback IPs to localhost. Match that internal origin while
// listening on every interface: otherwise an internal rewrite can self-proxy
// into the protected /niche route and turn every public page into404.
const built=JSON.parse(await readFile(new URL('../.next/required-server-files.json',import.meta.url),'utf8'));
const app=next({dev:false,hostname:'localhost',port,dir:fileURLToPath(new URL('..',import.meta.url)),conf:built.config});await app.prepare();
const handle=app.getRequestHandler();
const stageHost=process.env.HOSTINGER_STAGE_HOST||'',canonicalHost=process.env.HOSTINGER_CANONICAL_HOST||'';
if(!/^[a-z0-9][a-z0-9.-]*[a-z0-9]$/.test(canonicalHost)||stageHost&&!/^[a-z0-9-]+\.hostingersite\.com$/.test(stageHost))throw Error('hostinger_public_host_invalid');
const server=http.createServer((request,response)=>{
 const boundHost=hostingerPublicHost(request.headers.host,request.headers['x-forwarded-host'],canonicalHost,stageHost);
 if(!boundHost){response.writeHead(404,{'X-Robots-Tag':'noindex','Cache-Control':'no-store'});response.end('Not found');return;}
 if(boundHost==='www.'+canonicalHost){response.writeHead(308,{'Location':'https://'+canonicalHost+request.url,'Cache-Control':'no-store'});response.end();return;}
 request.headers.host=boundHost;
 if(stageHost&&boundHost===stageHost){
  response.setHeader('X-Robots-Tag','noindex, nofollow');
  request.headers.host=canonicalHost;
  if(request.headers.origin==='https://'+stageHost)request.headers.origin='https://'+canonicalHost;
  try{const ref=new URL(request.headers.referer||'');if(ref.origin==='https://'+stageHost){ref.hostname=canonicalHost;ref.port='';request.headers.referer=ref.href;}}catch{/* No invented attribution. */}
 }
 request.headers['x-forwarded-host']=request.headers.host;
 return handle(request,response);
});
server.on('upgrade',app.getUpgradeHandler());
server.listen(port,'0.0.0.0',()=>console.log('hostinger_core_ready'));
for(const signal of ['SIGTERM','SIGINT'])process.on(signal,()=>server.close(()=>{void app.close().finally(()=>process.exit(0));}));
