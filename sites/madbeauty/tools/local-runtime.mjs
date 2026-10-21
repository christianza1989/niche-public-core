import {readFile} from 'node:fs/promises';
import path from 'node:path';
import {createHash,randomBytes} from 'node:crypto';
import {Miniflare} from 'miniflare';
export const site=path.resolve(import.meta.dirname,'..');
const editions={main:{folder:'production-20261013',sha:'384825934db64e4824cfd42517f88d08d89f867f0d03698a640a3755e5ef3833',origin:'https://madbeauty.lt'},trial:{folder:'trial-20261013',sha:'d6821bdc0b303b064a9a4156926274694f9509c0ebb83bb088f2d135e7a781e6',origin:'https://bandymas.madbeauty.lt'}};
const mime={'.webp':'image/webp','.png':'image/png','.jpg':'image/jpeg','.ico':'image/vnd.microsoft.icon','.svg':'image/svg+xml','.mjs':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.woff2':'font/woff2','.ttf':'font/ttf','.json':'application/json; charset=utf-8','.html':'text/html; charset=utf-8'};
export async function localRuntime({trial=false}={}){
 const edition=editions[trial?'trial':'main'],release=path.join(site,'releases',edition.folder),script=await readFile(path.join(release,'worker.mjs'),'utf8');
 if(createHash('sha256').update(script).digest('hex')!==edition.sha)throw Error('Accepted worker hash mismatch');
 const mails=[];
 const objects=trial?{PLATFORM:{className:'TemporaryTestPlatform',useSQLite:true},COMMUNITY:{className:'MadbeautyCommunity',useSQLite:true}}:{PLATFORM:{className:'MadbeautyPlatform',useSQLite:true},ORGANIZATION_STAGING:{className:'MadbeautyOrganizationStaging',useSQLite:true},COMMUNITY:{className:'MadbeautyCommunity',useSQLite:true}};
 const runtime=new Miniflare({modules:true,script,compatibilityDate:'2026-05-22',compatibilityFlags:['nodejs_compat'],images:{binding:'IMAGES'},durableObjects:objects,bindings:{APP_ORIGIN:edition.origin,RELEASE_MODE:trial?'temporary-live-test':'production',COMMUNITY_ENABLED:'true',FACEBOOK_LOGIN_ENABLED:'false',OPERATOR_EMAIL:'operator@example.test',RETENTION_POLICY_VERSION:'madbeauty-2026-10-10-v1',SESSION_SECRET:randomBytes(32).toString('hex'),...(trial?{TRIAL_EXPIRES_AT:new Date(Date.now()+86400000).toISOString()}: {})},serviceBindings:{
  ASSETS:async request=>{
   const base=path.join(release,'assets'),file=path.resolve(base,'.'+decodeURIComponent(new URL(request.url).pathname));
   if(!file.startsWith(base+path.sep))return new Response('Not found',{status:404});
   try{return new Response(await readFile(file),{headers:{'Content-Type':mime[path.extname(file)]||'application/octet-stream'}});}catch(e){if(e.code!=='ENOENT'&&e.code!=='EISDIR')throw e;return new Response('Not found',{status:404});}
  },
  MAIL_TRANSPORT:async request=>{mails.push(await request.json());return new Response('Captured locally');}
 }});
 return {runtime,origin:edition.origin,mails,release,async fetch(route,options){return runtime.dispatchFetch(new URL(route,edition.origin),options);},async close(){await runtime.dispose();}};
}
