import policy from '../config/o3tech-catalogue.json' with {type:'json'};

export function o3techFilteredCatalogue(pkg,page,rawQuery){
 if(pkg?.siteId!==policy.siteId||pkg.canonicalHost!==policy.canonicalHost||!policy.indices.some(i=>i.pageId===page?.id&&i.slug===page.slug))return false;
 const query=new URLSearchParams(rawQuery||'');
 return ['min_price','max_price','show'].some(key=>query.has(key));
}

// Apply before the common final ID/link filter. Raw approved package bytes and
// hashes remain untouched; HTML, schema and discovery receive the same slice.
export function projectO3techCataloguePages(pkg,live){
 if(pkg.siteId!==policy.siteId||pkg.canonicalHost!==policy.canonicalHost)return live;
 const liveIds=new Set(live.map(p=>p.id));
 return live.flatMap(page=>{
  const index=policy.indices.find(i=>i.pageId===page.id);if(!index)return[page];
  if(page.type!=='faq'||page.siteId!==pkg.siteId||page.slug!==index.slug||page.contentVersion!==undefined)return[];
  const products=index.productIds.map(id=>pkg.pages.find(p=>p.id===id));
  if(products.some(p=>!p||p.siteId!==pkg.siteId||p.type!=='product'||!p.slug?.startsWith('produktas/')))return[];
  const list=page.body?.length===1&&page.body[0].type==='list'?page.body[0].items:null;
  if(!Array.isArray(list)||list.length!==products.length||page.links?.length!==products.length
   ||!products.every((p,i)=>list[i]===p.title&&page.links[i]?.targetPageId===p.id&&page.links[i]?.label===p.title))return[];
  const visible=products.filter(p=>liveIds.has(p.id));
  return visible.length?[{...page,body:[{type:'list',items:visible.map(p=>p.title)}]}]:[];
 });
}
