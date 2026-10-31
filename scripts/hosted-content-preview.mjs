import {validHostedPreviewHost,hostedPreviewAdmission} from '../lib/content-hosted-preview.mjs';

export function hostedContentPreviewConfig(config,admissions){
  const admission=hostedPreviewAdmission(admissions);
  if(!admission||config.siteId!==admission.siteId||config.previewHost!==admission.previewHost)throw Error('Hosting target must match the exact hosted-preview admission');
  if(!/^[a-f0-9]{32}$/.test(config.accountId)||!/^[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?$/.test(config.workerName)||!validHostedPreviewHost(config.previewHost)||!config.previewHost.startsWith(config.workerName+'.'))throw Error('Invalid hosted preview account/name/host');
  return {
    name:config.workerName,account_id:config.accountId,compatibility_date:'2026-10-31',workers_dev:true,preview_urls:false,routes:[],
    // No live DB, mail, storage, voice or local host override can be inherited.
    vars:{VOICE_WIDGET_ENABLED:'0',LEAD_SMTP_ENABLED:'0',LEAD_HOSTINGER_ENABLED:'0',LEAD_EMAIL_ENABLED:'0'},
    d1_databases:[],r2_buckets:[],send_email:[],
    assets:{binding:'ASSETS',run_worker_first:true},
    observability:{enabled:true,traces:{enabled:true}},
  };
}
