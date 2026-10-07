// Explicit marked operator self-test, isolated mail-enabled loopback only.
import assert from 'node:assert/strict';
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {readdirSync} from 'node:fs';
import {DatabaseSync} from 'node:sqlite';
import {spawnSync} from 'node:child_process';
const base='http://127.0.0.1:8797',siteId='roletaiklaipedoje',source='/gidai/matmenys-uzklausai',marker=`ROLETai SELF-TEST ${crypto.randomUUID()}`;
const home=await fetch(base);assert.equal(home.status,200);assert.ok((await home.text()).includes('href="https://roletaiklaipedoje.lt/"'));
const settings=JSON.parse(await readFile('config/niche-network.json'));assert.equal(settings.mailRecipientsBySite?.[siteId]||settings.defaultEmail,'info@pinet.lt');
const dir='.wrangler/state/v3/d1/miniflare-D1DatabaseObject',files=readdirSync(dir).filter(f=>f.endsWith('.sqlite')&&f!=='metadata.sqlite');assert.equal(files.length,1);
const db=new DatabaseSync(`${dir}/${files[0]}`);let id;
await mkdir('output/mail',{recursive:true});
try{
  const response=await fetch(base+'/uzklausa',{method:'POST',headers:{origin:base,referer:base+source},body:new URLSearchParams({name:marker,email:'info@pinet.lt',message:marker+'. Savininko roletai svetainės D1 / SMTP / INBOX techninė patikra. Tai nėra kliento užklausa, roletų užsakymas ar partnerio kontaktas.',consent:'yes',website:''})});
  assert.equal(response.status,200);const text=await response.text();
  const lead=db.prepare('SELECT id,site_id,source_path,status,consent_at FROM niche_leads WHERE name=? AND site_id=?').get(marker,siteId);assert.ok(lead);id=lead.id;
  assert.equal(lead.source_path,source);assert.equal(lead.status,'notified');assert.ok(lead.consent_at);assert.ok(text.includes('perduota operatoriaus pašto serveriui'));
  await writeFile('output/mail/hostinger-smtp-verification.json',JSON.stringify({date:new Date().toISOString(),testId:id,smtpAccepted:true,source:'Actual Worker form persisted notified status; only this operator self-test.'},null,2));
  const partial={date:new Date().toISOString(),siteId,sourcePath:source,leadId:id,messageId:`<${id}@pinet.lt>`,recipient:'info@pinet.lt',synthetic:true,durableStored:true,consentTimestampStored:true,smtpAccepted:true,ownInboxReceived:false,syntheticLeadRemoved:false};
  await writeFile('output/audits/roletai/mail-local.json',JSON.stringify(partial,null,2));
  const probe=spawnSync(process.execPath,['scripts/verify-hostinger-inbox.mjs',id],{encoding:'utf8',windowsHide:true,timeout:20000});assert.equal(probe.status,0,'Matching own INBOX search must succeed; preserve this ID for read-only follow-up, never automatically resend');
  const inbox=JSON.parse(await readFile('output/mail/hostinger-inbox-verification.json'));assert.equal(inbox.testId,id);assert.equal(inbox.received,true);
  const report={date:new Date().toISOString(),siteId,sourcePath:source,leadId:id,messageId:`<${id}@pinet.lt>`,recipient:'info@pinet.lt',synthetic:true,durableStored:true,consentTimestampStored:true,smtpAccepted:true,ownInboxReceived:true,tlsVerified:inbox.tlsVerified,imapAuthenticated:inbox.imapAuthenticated,onlyMatchingHeaderSearch:true,syntheticLeadRemoved:true};
  await writeFile('output/audits/roletai/mail-local.json',JSON.stringify(report,null,2));console.log(JSON.stringify(report));
}finally{if(id)db.prepare('DELETE FROM niche_leads WHERE id=? AND name=? AND site_id=?').run(id,marker,siteId);else db.prepare('DELETE FROM niche_leads WHERE name=? AND site_id=?').run(marker,siteId);assert.equal(db.prepare('SELECT COUNT(*) AS n FROM niche_leads WHERE name=? AND site_id=?').get(marker,siteId).n,0);db.close();if(id){const report=JSON.parse(await readFile('output/audits/roletai/mail-local.json'));if(report.leadId===id){report.syntheticLeadRemoved=true;await writeFile('output/audits/roletai/mail-local.json',JSON.stringify(report,null,2));}}}
