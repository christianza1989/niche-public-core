import {validHostedPreviewHost,hostedPreviewAdmission} from '../lib/content-hosted-preview.mjs';

export function hostedContentPreviewConfig(config,admissions){
  const admission=hostedPreviewAdmission(admissions);
  if(!admission||config.siteId!==admission.siteId||config.previewHost!==admission.previewHost)throw Error('Hosting target must match the exact hosted-preview admission');
  if(!/^[a-f0-9]{32}$/.test(config.accountId)||!/^[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?$/.test(config.workerName)||!validHostedPreviewHost(config.previewHost)||!config.previewHost.startsWith(config.workerName+'.'))throw Error('Invalid hosted preview account/name/host');
  const inquiries=admission.scope==='hosted-inquiries';
  if(inquiries&&(!/^[a-f0-9-]{36}$/.test(config.inquiryDatabaseId||'')||config.inquiryDatabaseId==='00000000-0000-4000-8000-000000000000'||!/^AC[A-Za-z0-9]{1,158}$/.test(config.mailboxId||'')||!/^\d{1,10}$/.test(config.rateLimitNamespaceId||'')))throw Error('Hosted inquiries require an isolated D1, mailbox resource and rate limit');
  return {
    name:config.workerName,account_id:config.accountId,compatibility_date:'2026-10-31',workers_dev:true,preview_urls:false,routes:[],
    // No live DB, mail, storage, voice or local host override can be inherited.
    vars:{VOICE_WIDGET_ENABLED:'0',LEAD_SMTP_ENABLED:'0',LEAD_HOSTINGER_ENABLED:inquiries?'1':'0',LEAD_EMAIL_ENABLED:'0',...(inquiries?{LEAD_HOSTINGER_SITE_ID:admission.siteId,LEAD_HOSTINGER_SENDER:admission.inquiry.sender,LEAD_HOSTINGER_MAILBOX_ID:config.mailboxId}:{})},
    d1_databases:inquiries?[{binding:'DB',database_name:admission.siteId+'-preview-inquiries',database_id:config.inquiryDatabaseId}]:[],r2_buckets:[],send_email:[],
    ratelimits:inquiries?[{name:'INQUIRY_RATE_LIMIT',namespace_id:config.rateLimitNamespaceId,simple:{limit:10,period:60}}]:[],
    assets:{binding:'ASSETS',run_worker_first:true},
    observability:{enabled:true,traces:{enabled:true}},
  };
}
