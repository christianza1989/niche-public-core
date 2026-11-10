// Select an artifact only after the compiler validates the complete registry.
// Publication, revision, admission and pause rules remain unchanged.
export function selectValidatedBuild(packages,admissions,network,siteId){
 if(!siteId)return {packages,admissions,network};
 if(!/^[a-z0-9][a-z0-9-]{0,79}$/.test(siteId))throw Error('Invalid NICHE_BUILD_SITE_ID');
 const selected=packages.filter(pkg=>pkg.siteId===siteId);
 if(!selected.length)throw Error('Selected approved site package is missing: '+siteId);
 const settings={...network};
 if(network.guidePublicationPausedAtBySite!==undefined)settings.guidePublicationPausedAtBySite=Object.fromEntries(Object.entries(network.guidePublicationPausedAtBySite).filter(([id])=>id===siteId));
 return {packages:selected,admissions:Object.fromEntries(Object.entries(admissions).filter(([id])=>id===siteId)),network:settings};
}
