import {sendHostingerMail} from './hostinger-transport.mjs';
export async function notifyStoredLead(env,id,now=Date.now()){
 if(env.LEAD_MAIL_RETRY_ENABLED!=='1'||!env.DB||!env.RELEASE_SITE_ID)return false;
 const job=await env.DB.prepare("UPDATE niche_lead_delivery SET state='sending',attempts=attempts+1,lease_until=? WHERE id=? AND site_id=? AND (state='pending' AND next_attempt_at<=? OR state='sending' AND lease_until<=?) RETURNING *").bind(now+60000,id,env.RELEASE_SITE_ID,now,now).first();
 if(!job){const current=await env.DB.prepare('SELECT state FROM niche_lead_delivery WHERE id=? AND site_id=?').bind(id,env.RELEASE_SITE_ID).first();return current?.state==='accepted';}
 const lead=await env.DB.prepare('SELECT * FROM niche_leads WHERE id=? AND site_id=?').bind(id,env.RELEASE_SITE_ID).first();
 if(!lead)return false;
 try{
  await sendHostingerMail(env,{id,to:job.recipient,replyTo:lead.email,subject:`[${job.canonical_host}] Poreikio užklausa ${id.slice(0,8)}`,text:`Nauja svetainės užklausa\nSvetainė: ${job.canonical_host}\nPuslapis: ${lead.source_path}\nUžklausos ID: ${id}\nVardas: ${lead.name}\nEl. paštas: ${lead.email}\n\nŽinutė:\n${lead.message}\n`});
  await env.DB.batch([env.DB.prepare("UPDATE niche_lead_delivery SET state='accepted',lease_until=0 WHERE id=? AND site_id=?").bind(id,env.RELEASE_SITE_ID),env.DB.prepare("UPDATE niche_leads SET status='notified' WHERE id=? AND site_id=?").bind(id,env.RELEASE_SITE_ID)]);return true;
 }catch{
  await env.DB.prepare('UPDATE niche_lead_delivery SET state=?,next_attempt_at=?,lease_until=0 WHERE id=? AND site_id=?').bind(job.attempts>=8?'failed':'pending',now+Math.min(21600000,900000*2**(job.attempts-1)),id,env.RELEASE_SITE_ID).run();return false;
 }
}
export async function maintainLeadDelivery(env,now=Date.now()){
 if(env.LEAD_MAIL_RETRY_ENABLED!=='1'||!env.DB||!env.RELEASE_SITE_ID)return;
 const jobs=await env.DB.prepare("SELECT id FROM niche_lead_delivery WHERE site_id=? AND ((state='pending' AND next_attempt_at<=?) OR (state='sending' AND lease_until<=?)) ORDER BY next_attempt_at LIMIT 5").bind(env.RELEASE_SITE_ID,now,now).all();
 for(const job of jobs.results)await notifyStoredLead(env,job.id,now);
 await env.DB.batch([env.DB.prepare('DELETE FROM niche_lead_delivery WHERE site_id=? AND id IN (SELECT id FROM niche_leads WHERE site_id=? AND created_at<?)').bind(env.RELEASE_SITE_ID,env.RELEASE_SITE_ID,now-180*86400000),env.DB.prepare('DELETE FROM niche_leads WHERE site_id=? AND created_at<?').bind(env.RELEASE_SITE_ID,now-180*86400000),env.DB.prepare('DELETE FROM niche_interest_daily WHERE site_id=? AND day<?').bind(env.RELEASE_SITE_ID,new Date(now-365*86400000).toISOString().slice(0,10))]);
}
