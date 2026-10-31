import{validHostedInquiry}from'../lib/content-hosted-preview.mjs';
export function contentProductionConfig(target,admissions,pkg){
 const admission=admissions[target.siteId];
 if(!pkg||pkg.siteId!==target.siteId||pkg.canonicalHost!==target.canonicalHost||admission?.scope!=='production'||admission.testOnly===true||!admission.packageSha256)throw Error('Production config requires exact production-admitted content; a review receipt cannot activate a domain');
 if(!/^(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z]{2,63}$/.test(target.canonicalHost)||!/^[a-f0-9]{32}$/.test(target.accountId)||!/^[a-z0-9-]{1,63}$/.test(target.workerName)||target.workerName.endsWith('-preview'))throw Error('Invalid production host/account/worker');
 if(!/^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/.test(target.inquiryDatabaseId||'')||target.inquiryDatabaseId==='00000000-0000-4000-8000-000000000000'||!/^AC[A-Za-z0-9]{1,158}$/.test(target.mailboxId||'')||!/^\d{1,10}$/.test(target.rateLimitNamespaceId||''))throw Error('Production requires a real isolated DB, mailbox and rate namespace');
 if(!validHostedInquiry({transport:'hostinger-api',sender:target.sender,recipient:target.recipient})||target.recipient!==pkg.site.contact.email)throw Error('Production contact recipient and authenticated sender must be explicit');
 return{name:target.workerName,account_id:target.accountId,compatibility_date:'2026-10-31',workers_dev:false,preview_urls:false,routes:[{pattern:target.canonicalHost,custom_domain:true},{pattern:'www.'+target.canonicalHost,custom_domain:true}],
  vars:{VOICE_WIDGET_ENABLED:'0',LEAD_EMAIL_ENABLED:'0',LEAD_SMTP_ENABLED:'0',LEAD_HOSTINGER_ENABLED:'1',LEAD_HOSTINGER_SITE_ID:target.siteId,LEAD_HOSTINGER_SENDER:target.sender,LEAD_HOSTINGER_MAILBOX_ID:target.mailboxId,LEAD_INQUIRY_GUARD_ENABLED:'1',LEAD_INQUIRY_GUARD_SITE_ID:target.siteId,LEAD_INQUIRY_GUARD_HOST:target.canonicalHost},
  d1_databases:[{binding:'DB',database_name:target.siteId+'-inquiries',database_id:target.inquiryDatabaseId}],r2_buckets:[],send_email:[],services:[],ratelimits:[{name:'INQUIRY_RATE_LIMIT',namespace_id:target.rateLimitNamespaceId,simple:{limit:10,period:60}}],
  assets:{binding:'ASSETS',run_worker_first:['/content-assets/*','/images/*','/signaturepads/*','/wp-content/uploads/*','/favicon.svg','/favicon.ico']},observability:{enabled:true,traces:{enabled:true}}};
}
