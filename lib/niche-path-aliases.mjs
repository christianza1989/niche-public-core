// Legacy routes refer to stable page IDs. The approved package owns the URL,
// and the existing public projection alone decides whether a target is visible.
const safePath=/^\/[a-z0-9]+(?:[-/][a-z0-9]+)*$/;
const reservedPath=/^\/(?:api|niche|gift|content-assets|pokalbis)(?:\/|$)/;
export function validateNichePathAliases(config,packages){
 if(config.version!==1||!config.sites||typeof config.sites!=='object')throw Error('Invalid path alias registry');
 for(const [siteId,site] of Object.entries(config.sites)){
  const pkg=packages.find(p=>p.siteId===siteId);
  if(!pkg||pkg.schemaVersion!==1||pkg.canonicalHost!==site.canonicalHost||!Array.isArray(site.redirects))throw Error('Path alias site mismatch: '+siteId);
  const byId=new Map(pkg.pages.map(p=>[p.id,p])),current=new Set(pkg.pages.map(p=>'/'+p.slug)),seen=new Set();
  for(const alias of site.redirects){
   const target=byId.get(alias.targetPageId);
   if(!safePath.test(alias.from)||!safePath.test(alias.to)||reservedPath.test(alias.from)||alias.from===alias.to||current.has(alias.from)||seen.has(alias.from)||!target||target.siteId!==siteId||alias.to!=='/'+target.slug)throw Error('Unsafe, duplicate or stale path alias: '+alias.from);
   seen.add(alias.from);
  }
 }
 return config;
}
export function indexNichePathAliases(config){
 return new Map(Object.entries(config.sites).map(([id,site])=>[id,{canonicalHost:site.canonicalHost,byFrom:new Map(site.redirects.map(alias=>[alias.from,alias]))}]));
}
export function nichePathAliasDestination(pkg,index,getPublicPages,pathname,search=''){
 const site=index.get(pkg.siteId);
 if(!site||site.canonicalHost!==pkg.canonicalHost)return null;
 const path=pathname.replace(/\/$/u,''),alias=site.byFrom.get(path),params=new URLSearchParams(search);
 const category=(path==='/produktai'||path.startsWith('/kategorijos/'))&&params.get('category');
 const categoryAlias=category&&site.byFrom.get('/kategorijos/'+category);
 if(!alias&&!categoryAlias)return null;
 const pages=new Map(getPublicPages().map(p=>[p.id,p]));
 if(![...pages.values()].some(p=>p.siteId===pkg.siteId&&p.type==='home'&&p.slug===''))return null;
 const visible=a=>{const p=pages.get(a.targetPageId);return p?.siteId===pkg.siteId&&'/'+p.slug===a.to;};
 if(alias&&!visible(alias)||categoryAlias&&!visible(categoryAlias))return null;
 if(categoryAlias)params.set('category',categoryAlias.to.slice('/kategorijos/'.length));
 return (alias?.to||path)+(params.size?'?'+params.toString():'');
}
export function legacyProductPaths(pkg,publicPages,index,pageId){
 const site=index.get(pkg.siteId);if(!site||site.canonicalHost!==pkg.canonicalHost)return {};
 const live=new Map(publicPages.filter(p=>p.type==='product'&&(!pageId||p.id===pageId)).map(p=>[p.id,p]));
 return Object.fromEntries([...site.byFrom.values()].filter(a=>a.from.startsWith('/produktai/')&&live.get(a.targetPageId)?.slug===a.to.slice(1)).map(a=>[a.from,a.to]));
}
