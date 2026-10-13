// Owner-approved Lithuanian URL migration. Other markets retain their routes.
export const memoUrlMoves = Object.freeze([
  {from:'products/seimos-rinkinys-1',to:'seimos-rinkinys'},
  {from:'products/liejimo-rinkinys-porai',to:'rinkinys-porai'},
  {from:'collections/all',to:'ranku-liejimo-rinkiniai'},
]);
export function memoCanonicalSlug(slug){return memoUrlMoves.find(move=>move.from===slug)?.to??slug;}
export function memoLogicalSlug(slug){return memoUrlMoves.find(move=>move.to===slug)?.from??slug;}
// Caller supplies the authoritative eligible page projection, never raw drafts.
export function memoRedirectPath(path,eligiblePages,method='GET'){
  if(!['GET','HEAD'].includes(method))return null;
  const source=path.replace(/\/$/,'').slice(1),move=memoUrlMoves.find(move=>move.from===source);
  return move&&eligiblePages.some(page=>page.slug===move.to)?'/'+move.to:null;
}
