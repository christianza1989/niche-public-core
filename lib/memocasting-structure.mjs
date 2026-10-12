import {nicheBreadcrumbs, nicheSchemaGraph} from './niche-schema-core.mjs';

// Presentation roles over the caller's authoritative eligible projection.
export function memoBreadcrumbs(pkg,page,pages){
  const trail=nicheBreadcrumbs(pkg,page,pages);
  const catalogue=pages.find(p=>p.slug==='collections/all');
  if(page.type==='product'&&catalogue)trail.splice(1,0,{name:'Rinkiniai',path:'/collections/all'});
  return trail;
}
export function memoSchemaGraph(pkg,page,pages,operator){
  const data=nicheSchemaGraph(pkg,page,pages,operator);
  const crumbs=data['@graph'].find(e=>e['@type']==='BreadcrumbList');
  if(crumbs)crumbs.itemListElement=memoBreadcrumbs(pkg,page,pages).map((p,i)=>({'@type':'ListItem',position:i+1,name:p.name,item:`https://${pkg.canonicalHost}${p.path}`}));
  if(page.slug==='collections/all'){
    const collection=data['@graph'].find(e=>e['@type']==='WebPage');
    collection['@type']='CollectionPage';
    collection.hasPart=pages.filter(p=>p.type==='product').map(p=>({'@type':'WebPage',name:p.title,url:`https://${pkg.canonicalHost}/${p.slug}`}));
  }
  if(page.type==='product'){
    const url=`https://${pkg.canonicalHost}/${page.slug}`;
    const product={'@type':'Product','@id':`${url}#product`,url,name:page.title,description:page.description,brand:{'@type':'Brand',name:pkg.site.name}};
    data['@graph'].push(product);
    data['@graph'].find(e=>e['@type']==='WebPage').mainEntity={'@id':product['@id']};
  }
  // Offers, availability, ratings and delivery are supplied only by the live shop.
  return data;
}
export const memoGuideGroups=[
  {id:'dovanos',title:'Dovanos pasirinkimas ir planavimas',slugs:['gidai/dovana-porai','gidai/dovana-vestuviu-metinems','gidai/ranku-liejimo-rinkinys-ar-paruosta-dovana']},
  {id:'naudojimas',title:'Proceso etapai, apdaila ir pagalba',slugs:['gidai/dziovinimas-ir-isemimas','gidai/liejinio-dazymas-ir-prieziura','pagalba']}
];
// Stable fragment identifiers follow the approved words, not block positions.
export function memoSectionId(text){
  return text.toLowerCase().replaceAll('ą','a').replaceAll('č','c').replaceAll('ę','e').replaceAll('ė','e').replaceAll('į','i').replaceAll('š','s').replaceAll('ų','u').replaceAll('ū','u').replaceAll('ž','z').replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'');
}
