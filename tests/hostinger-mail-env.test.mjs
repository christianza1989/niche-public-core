import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdir,mkdtemp,writeFile,rm} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import path from 'node:path';
import {unstable_getVarsForDev} from 'wrangler';
import {serializeHostingerMailEnv,parseHostingerMailEnv} from '../scripts/hostinger-mail-env.mjs';

test('literal credentials survive the actual installed Wrangler env loader',async()=>{
 const parent=fileURLToPath(new URL('../.sites-runtime/',import.meta.url));
 await mkdir(parent,{recursive:true});
 const temp=await mkdtemp(path.join(parent,'mail-env-'));
 assert.equal(path.dirname(path.resolve(temp)),path.resolve(parent),'Only remove the test directory inside this workspace');
 const target=path.join(temp,'.dev.vars.hostinger'),config=path.join(temp,'wrangler.json');
 const passwords=['plain-test-value','A$LEAD_SMTP_USER${LEAD_SMTP_USER}Z','two\\backslashes\\n\\r\\$value','spaces # = : ; ąčę','single\'anddouble"quotes','literal`and double"',"`'ordinary\\path"];
 try{
  // Demonstrate the old JSON writer's real failure, rather than mirroring a serializer.
  await writeFile(target,'LEAD_SMTP_USER="fixture@example.invalid"\nLEAD_SMTP_PASSWORD="A$LEAD_SMTP_USER"\n');
  assert.notEqual(unstable_getVarsForDev(config,[target],{},undefined,true).LEAD_SMTP_PASSWORD.value,'A$LEAD_SMTP_USER');
  for(const password of passwords){
   const expected={LEAD_SMTP_ENABLED:'1',LEAD_SMTP_USER:'fixture@example.invalid',LEAD_SMTP_PASSWORD:password};
   const raw=serializeHostingerMailEnv(expected);
   assert.deepEqual(parseHostingerMailEnv(raw),expected);
   await writeFile(target,raw);
   const loaded=unstable_getVarsForDev(config,[target],{},undefined,true);
   for(const key of Object.keys(expected))assert.equal(loaded[key].value,expected[key],key+' must remain literal');
  }
 }finally{await rm(temp,{recursive:true,force:true});}
});
test('historical files remain readable and malformed secrets fail without value disclosure',()=>{
 const expected={LEAD_SMTP_ENABLED:'1',LEAD_SMTP_USER:'fixture@example.invalid',LEAD_SMTP_PASSWORD:'legacy$literal\\path'};
 const old=Object.entries(expected).map(([key,value])=>key+'='+JSON.stringify(value)).join('\n');
 assert.deepEqual(parseHostingerMailEnv(old),expected);
 for(const password of ['line\nbreak','line\rbreak','zero\x00byte','`\'"'])assert.throws(()=>serializeHostingerMailEnv({...expected,LEAD_SMTP_PASSWORD:password}),/values suppressed/);
 for(const raw of ['LEAD_SMTP_PASSWORD="private-broken',serializeHostingerMailEnv(expected)+'LEAD_SMTP_PASSWORD=`extra`\n',serializeHostingerMailEnv(expected)+'UNEXPECTED=`private`\n'])assert.throws(()=>parseHostingerMailEnv(raw),error=>!error.message.includes('private')&&/values suppressed/.test(error.message));
});
