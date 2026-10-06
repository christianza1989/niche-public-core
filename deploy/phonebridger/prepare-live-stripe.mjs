// Run only after the owner has authorized the private live key for this Worker.
// Never accepts keys in arguments, logs provider payloads or enables the shop.
import {readFile,writeFile} from 'node:fs/promises';
import {spawn} from 'node:child_process';
import Stripe from 'stripe';
const directory='.sites-runtime/phonebridger-production/';
const accountId='acct_1QMlRkL0g8f3vxfN',url='https://phonebridger.com/api/shop/webhook';
const events=['checkout.session.completed','checkout.session.async_payment_succeeded','checkout.session.async_payment_failed','checkout.session.expired','charge.refunded','charge.dispute.created'];
const operation=process.argv[2];
if(!['prepare','upload'].includes(operation))throw Error('Use prepare or upload; credentials must already be in private runtime files.');
async function optional(file){try{return await readFile(directory+file,'utf8');}catch(error){if(error.code==='ENOENT')return null;throw error;}}
try{
 const config=JSON.parse(await readFile('deploy/phonebridger/wrangler.jsonc','utf8'));
 if(config.name!=='phonebridger'||config.account_id!=='d102163f74a45ab6d33bca786ce281ec'||config.d1_databases[0]?.database_id!=='03b08a79-d7d5-4b91-a3ca-1cb9e06f59af')throw Error('Production destination differs from the authorized target.');
 const key=(await readFile(directory+'stripe-live-key.txt','utf8')).trim();
 if(!/^rk_live_[A-Za-z0-9]+$/.test(key))throw Error('Supply the restricted live key, not a publishable or sandbox key.');
 const stripe=new Stripe(key,{maxNetworkRetries:1,timeout:15000});
 const account=await stripe.accounts.retrieve(accountId);
 if(account.id!==accountId||account.charges_enabled!==true)throw Error('The exact merchant is not enabled for charges.');
 const endpoints=await stripe.webhookEndpoints.list({limit:100});
 let endpoint=endpoints.data.find(e=>e.url===url);
 const record=JSON.parse(await optional('stripe-live-endpoint.json')||'null');
 let signingSecret=(await optional('stripe-live-webhook-secret.txt'))?.trim();
 if(operation==='prepare'){
  if(!endpoint){
   if(record||endpoints.has_more)throw Error('Endpoint identity needs read-only reconciliation before creation.');
   endpoint=await stripe.webhookEndpoints.create({url,enabled_events:events,api_version:Stripe.API_VERSION,description:'PhoneBridger production purchase events',metadata:{integration:'phonebridger'}},{idempotencyKey:'phonebridger-production-webhook-20261006'});
   if(endpoint.livemode!==true||endpoint.url!==url||!endpoint.secret)throw Error('Created endpoint needs reconciliation; do not recreate blindly.');
   signingSecret=endpoint.secret;
   await writeFile(directory+'stripe-live-webhook-secret.txt',signingSecret+'\n',{flag:'wx'});
   await writeFile(directory+'stripe-live-endpoint.json',JSON.stringify({id:endpoint.id,url,account:accountId,apiVersion:endpoint.api_version})+'\n',{flag:'wx'});
  }else if(!record||record.id!==endpoint.id||!signingSecret)throw Error('Existing endpoint signing secret must be recovered privately; it is not returned by list.');
 }
 if(!endpoint||endpoint.status!=='enabled'||endpoint.livemode!==true||endpoint.api_version!==Stripe.API_VERSION||events.some(event=>!endpoint.enabled_events.includes(event)))throw Error('Live endpoint configuration is incomplete.');
 const saved=JSON.parse(await readFile(directory+'stripe-live-endpoint.json','utf8'));
 if(saved.id!==endpoint.id||saved.account!==accountId||saved.url!==url||!/^whsec_[A-Za-z0-9]+$/.test(signingSecret||''))throw Error('Private signing secret and endpoint record do not match the target.');
 if(operation==='upload')for(const [name,value]of [['STRIPE_RESTRICTED_KEY',key],['STRIPE_WEBHOOK_SECRET',signingSecret]]){
  await new Promise((resolve,reject)=>{const child=spawn(process.execPath,['node_modules/wrangler/bin/wrangler.js','secret','put',name,'--config','deploy/phonebridger/wrangler.jsonc'],{stdio:['pipe','ignore','ignore']});child.stdin.end(value);child.once('error',reject);child.once('exit',code=>code===0?resolve():reject(Error('Protected secret upload failed. Inspect deployment status before retrying.')));});
 }
 console.log(JSON.stringify({operation,exactMerchant:true,chargesEnabled:true,payoutsEnabled:account.payouts_enabled===true,endpointVerified:true,shopActivated:false}));
}catch(error){
 // Do not print a Stripe request, raw response or credential-bearing error.
 console.error(JSON.stringify({status:'FAILED',category:error.type||error.code||'precondition',message:error.type?'Stripe rejected the operation; check the required restricted permissions.':error.message}));process.exitCode=1;
}
