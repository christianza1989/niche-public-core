import { createHash } from 'node:crypto';
const localChecks=['schema','routing','seo','forms','media','time','revocation','isolation'];
const launchChecks=['ownership','dns','contacts','inbox','privacy'];
export function assertPreviewSandbox(root, receipt){
  if(receipt.scope==='local-preview' && !/(?:^|\/)(?:output|outputs)\//.test(root.replaceAll('\\','/')))throw new Error('local-preview is allowed only in an isolated output checkout, never main');
}
export function validateV2Admission(pkg, raw, receipt) {
  if(!['gift','niche'].includes(pkg.site.renderer) || pkg.locale!=='lt-LT')throw new Error('V2 admission currently supports reviewed lt-LT gift and niche renderers only');
  if(!receipt || receipt.schemaVersion!==1 || !['local-fixture','local-preview','production'].includes(receipt.scope)) throw new Error('V2 acceptance receipt required');
  if(receipt.siteId!==pkg.siteId || receipt.canonicalHost!==pkg.canonicalHost || receipt.renderer!==pkg.site.renderer || receipt.packageSha256!==createHash('sha256').update(raw).digest('hex')) throw new Error('V2 acceptance receipt does not bind exact package');
  if(receipt.scope==='local-fixture' && !pkg.canonicalHost.endsWith('.example')) throw new Error('Local fixture admission requires reserved .example domain');
  if(receipt.scope!=='production' && receipt.testOnly!==true) throw new Error('Local preview/fixture must explicitly declare testOnly');
  if(!receipt.reviewer?.trim() || !Number.isFinite(Date.parse(receipt.acceptedAt))) throw new Error('V2 acceptance reviewer/date required');
  for(const key of receipt.scope==='production'?[...localChecks,...launchChecks]:[]) {
    const check=receipt.checks?.[key];
    if(check?.status!=='PASS' || !check.evidence?.length || check.evidence.some(e=>!e.path || !/^[a-f0-9]{64}$/.test(e.sha256))) throw new Error(`V2 acceptance evidence missing: ${key}`);
  }
  return {scope:receipt.scope,packageSha256:receipt.packageSha256,acceptedAt:receipt.acceptedAt,reviewer:receipt.reviewer,...(receipt.scope!=='production'?{testOnly:true}: {})};
}
