import {memoRecoveredMoves,memoLegacySitemapPaths} from './memocasting-legacy-redirects.mjs';
export {memoRecoveredMoves};
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
]);
export function memoCanonicalSlug(slug){return memoUrlMoves.find(move=>move.from===slug)?.to??slug;}
export function memoLogicalSlug(slug){return memoUrlMoves.find(move=>move.to===slug)?.from??slug;}
// Caller supplies the authoritative eligible page projection, never raw drafts.
export function memoRedirectPath(path,eligiblePages,method='GET'){
  if(!['GET','HEAD'].includes(method))return null;
  const source=path.replace(/\/$/,'').slice(1);
  // A restored, approved native page owns its route before an old alias does.
  if(eligiblePages.some(page=>page.slug===source))return null;
  if(memoLegacySitemapPaths.includes(source))return eligiblePages.some(page=>page.type==='home'&&page.slug==='')?'/sitemap.xml':null;
  const move=[...memoUrlMoves,...memoContentMoves,...memoRecoveredMoves].find(move=>move.from===source);
  return move&&eligiblePages.some(page=>page.slug===move.to)?'/'+move.to+(move.hash?'#'+move.hash:''):null;
}

export function memoRedirectUrl(input,eligiblePages,method='GET'){
  const url=new URL(input),moved=memoRedirectPath(url.pathname,eligiblePages,method);
  if(!moved)return null;
  const target=new URL(moved,url.origin);url.pathname=target.pathname;url.hash=target.hash;
  // Retired Shopify credential/return URLs must not reach the public homepage.
  if(url.pathname==='/'&&['/password','/en/password'].includes(new URL(input).pathname.replace(/\/$/,'')))url.search='';
  // Shopify child-range parameters do not describe the current unified sitemap.
  if(memoLegacySitemapPaths.includes(new URL(input).pathname.replace(/\/$/,'').slice(1))){url.search='';url.hash='';}
  return url;
}
