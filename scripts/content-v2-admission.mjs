import { createHash } from 'node:crypto';
import { contentRenderer } from '../lib/content-renderers.mjs';
import { assertSignaturepadsLayout } from '../lib/signaturepads-content.mjs';
import { validHostedPreviewHost, hostedContentScope, validHostedInquiry } from '../lib/content-hosted-preview.mjs';
import signaturepadsLayout from '../sites/signaturepads/migration/core-layout.json' with { type: 'json' };
const localChecks=['schema','routing','seo','forms','media','time','revocation','isolation'];
const launchChecks=['ownership','dns','contacts','inbox','privacy'];
export function assertPreviewSandbox(root, receipt){
  if((receipt.scope==='local-preview'||hostedContentScope(receipt.scope)) && !/(?:^|\/)(?:output|outputs)\//.test(root.replaceAll('\\','/')))throw new Error('preview admission is allowed only in an isolated output checkout, never main');
}
export function validateV2Admission(pkg, raw, receipt) {
  if(!contentRenderer(pkg) || pkg.locale!=='lt-LT')throw new Error('V2 admission requires a registered reviewed lt-LT renderer');
  if(contentRenderer(pkg)==='signaturepads')assertSignaturepadsLayout(pkg,signaturepadsLayout);
  if(!receipt || receipt.schemaVersion!==1 || !['local-fixture','local-preview','hosted-preview','hosted-inquiries','production'].includes(receipt.scope)) throw new Error('V2 acceptance receipt required');
  if(receipt.siteId!==pkg.siteId || receipt.canonicalHost!==pkg.canonicalHost || receipt.renderer!==pkg.site.renderer || receipt.packageSha256!==createHash('sha256').update(raw).digest('hex')) throw new Error('V2 acceptance receipt does not bind exact package');
  if(receipt.scope==='local-fixture' && !pkg.canonicalHost.endsWith('.example')) throw new Error('Local fixture admission requires reserved .example domain');
  if(receipt.scope!=='production' && receipt.testOnly!==true) throw new Error('Local preview/fixture must explicitly declare testOnly');
  if(receipt.scope==='hosted-preview' && (!validHostedPreviewHost(receipt.previewHost)||receipt.previewHost===pkg.canonicalHost||receipt.readOnly!==true))throw new Error('Hosted preview requires one distinct exact workers.dev host and readOnly');
  if(receipt.scope==='hosted-inquiries'&&(!validHostedPreviewHost(receipt.previewHost)||receipt.previewHost===pkg.canonicalHost||receipt.readOnly!==false||!validHostedInquiry(receipt.inquiry)||receipt.inquiry.recipient!==pkg.site.contact.email))throw Error('Hosted inquiries require an exact distinct host and explicit authenticated sender/contact recipient');
  if(!receipt.reviewer?.trim() || !Number.isFinite(Date.parse(receipt.acceptedAt))) throw new Error('V2 acceptance reviewer/date required');
  for(const key of receipt.scope==='production'?[...localChecks,...launchChecks]:receipt.scope==='hosted-inquiries'?[...localChecks,'inquiry-authorization','mail-authentication']:receipt.scope==='hosted-preview'?localChecks:[]) {
    const check=receipt.checks?.[key];
    if(check?.status!=='PASS' || !check.evidence?.length || check.evidence.some(e=>!e.path || !/^[a-f0-9]{64}$/.test(e.sha256))) throw new Error(`V2 acceptance evidence missing: ${key}`);
  }
  return {scope:receipt.scope,packageSha256:receipt.packageSha256,acceptedAt:receipt.acceptedAt,reviewer:receipt.reviewer,...(receipt.scope!=='production'?{testOnly:true}: {}),...(hostedContentScope(receipt.scope)?{previewHost:receipt.previewHost,readOnly:receipt.readOnly}:{}),...(receipt.scope==='hosted-inquiries'?{inquiry:receipt.inquiry}:{})};
}
