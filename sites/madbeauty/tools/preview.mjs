import {createServer} from 'node:http';
import {localRuntime} from './local-runtime.mjs';
const trial=process.argv.includes('--trial'),port=Number(process.env.MADBEAUTY_PREVIEW_PORT||8950),app=await localRuntime({trial});
if(!Number.isSafeInteger(port)||port<1024||port>65535)throw Error('Invalid local preview port');
const localOrigin='http://127.0.0.1:'+port;
const server=createServer(async(request,response)=>{
 try{
  if(request.headers.host!=='127.0.0.1:'+port){response.writeHead(421);response.end();return;}
  const chunks=[];let size=0;for await(const chunk of request){size+=chunk.length;if(size>12*1024*1024){response.writeHead(413);response.end();return;}chunks.push(chunk);}
  if(request.url==='/__local_mailbox'){response.writeHead(200,{'Content-Type':'application/json','Cache-Control':'no-store','X-Robots-Tag':'noindex'});response.end(JSON.stringify(app.mails));return;}
  const body=Buffer.concat(chunks),headers={...request.headers};if(headers.origin===localOrigin)headers.origin=app.origin;
  const result=await app.fetch(request.url,{method:request.method,headers,...body.length?{body}: {}});
  response.writeHead(result.status,{...Object.fromEntries(result.headers),'X-Robots-Tag':'noindex, nofollow','Cache-Control':'no-store'});response.end(Buffer.from(await result.arrayBuffer()));
 }catch(error){console.error(error.message);response.writeHead(500);response.end('Local preview error');}
});
server.listen(port,'127.0.0.1',()=>console.log(JSON.stringify({origin:localOrigin,edition:trial?'fictional trial with local expiry override':'accepted production snapshot',database:'isolated ephemeral local SQLite',mail:'captured only at /__local_mailbox',facebook:'disabled',liveWrites:0})));
let closing=false;async function close(){if(closing)return;closing=true;server.close();await app.close();process.exit(0);}
process.on('SIGINT',close);process.on('SIGTERM',close);
