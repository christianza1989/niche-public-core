// Public ownership tokens are bound to site identity and canonical host.
export function siteVerification(pkg,registry){
 const entry=pkg&&registry[pkg.siteId];
 if(!entry||entry.canonicalHost!==pkg.canonicalHost)return null;
 return typeof entry.google==='string'&&/^[A-Za-z0-9_-]{20,200}$/.test(entry.google)?{google:entry.google}:null;
}
