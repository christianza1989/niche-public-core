// Owner-approved Lithuanian URL migration. Other markets retain their routes.
export const memoUrlMoves = Object.freeze([
  {from:'products/seimos-rinkinys-1',to:'seimos-rinkinys'},
  {from:'products/liejimo-rinkinys-porai',to:'rinkinys-porai'},
  {from:'collections/all',to:'ranku-liejimo-rinkiniai'},
]);
// Verified historical article aliases do not change the successor's native role.
export const memoContentMoves = Object.freeze([
  {from:'blogs/news/populiariausios-kaledines-dovanos-moteriai-siais-metais',to:'gidai/kaledines-dovanos-moterims'},
  {from:'blogs/news/kaledines-dovanos-moterims-sventines-idejos',to:'gidai/kaledines-dovanos-moterims'},
  {from:'blogs/news/ypatingos-dovanos-moterims-nepamirstamoms-akimirkoms',to:'gidai/dovanos-moterims'},
  ...['personalizuotos-dovanos-mamai','prabangios-dovanos-mamai','dovanos-jaunai-mamai','dovanos-vyresnio-amziaus-mamai','dovana-mamai-50-metu-jubiliejaus-proga','ranku-darbo-dovanos-mamai'].map(slug=>({from:'blogs/news/'+slug,to:'gidai/dovanos-mamai'})),
  {from:'products/seimos-rinkinys',to:'seimos-rinkinys'},
]);
export function memoCanonicalSlug(slug){return memoUrlMoves.find(move=>move.from===slug)?.to??slug;}
export function memoLogicalSlug(slug){return memoUrlMoves.find(move=>move.to===slug)?.from??slug;}
// Caller supplies the authoritative eligible page projection, never raw drafts.
export function memoRedirectPath(path,eligiblePages,method='GET'){
  if(!['GET','HEAD'].includes(method))return null;
  const source=path.replace(/\/$/,'').slice(1),move=[...memoUrlMoves,...memoContentMoves].find(move=>move.from===source);
  return move&&eligiblePages.some(page=>page.slug===move.to)?'/'+move.to:null;
}
