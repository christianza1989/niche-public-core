import {memoRoute,memoPath,memoLabels} from './memocasting-locales.mjs';
import {nicheBreadcrumbs, nicheSchemaGraph} from './niche-schema-core.mjs';

export function memoCompany(pkg,pages){
 const about=pages.find(p=>p.slug==='apie-projekta'),items=about?.body.flatMap(b=>b.items??[])??[];
 const code=items.find(s=>s.startsWith('Įmonės kodas:'))?.match(/\b\d{9}\b/)?.[0];
 const address=items.find(s=>s.startsWith('Kontaktinis ir grąžinimo adresas:'))?.replace('Kontaktinis ir grąžinimo adresas: ','').replace(/\.$/,'');
 return {email:pkg.site.contact.email,phone:pkg.site.contact.phone,code,address};
}

// Presentation roles over the caller's authoritative eligible projection.
export function memoBreadcrumbs(pkg,page,pages){
  const route=memoRoute(page),local=pages.filter(p=>memoRoute(p).language===route.language),labels=memoLabels[route.language];
  const trail=[{name:pkg.site.name,path:local.some(p=>memoRoute(p).baseSlug==='')?memoPath(route):'/'}];
  if(route.baseSlug==='')return trail;
  if(page.type==='guide'&&local.some(p=>memoRoute(p).baseSlug==='gidai'))trail.push({name:labels.guides,path:memoPath(route,'gidai')});
  if(page.type==='product'&&local.some(p=>memoRoute(p).baseSlug==='collections/all'))trail.push({name:labels.catalogue,path:memoPath(route,'collections/all')});
  trail.push({name:page.title,path:'/'+page.slug});return trail;
}
export function memoSchemaGraph(pkg,page,pages,operator){
  const route=memoRoute(page),local=pages.filter(p=>memoRoute(p).language===route.language);
  const data=nicheSchemaGraph(pkg,page,pages,operator);
  const identity=memoCompany(pkg,pages),organization=data['@graph'].find(e=>e['@type']==='Organization');
  if(identity.phone)organization.telephone=identity.phone;
  if(identity.code)organization.identifier={'@type':'PropertyValue',propertyID:'Company registration number',value:identity.code};
  for(const entity of data['@graph']){if(['WebPage','Article','CollectionPage','ProfilePage','AboutPage','ContactPage'].includes(entity['@type']))entity.inLanguage=route.locale;if(entity['@type']==='WebSite')entity.inLanguage=[...new Set(pages.map(p=>memoRoute(p).locale))];}
  const role={'gidai':'CollectionPage','redakcija':'ProfilePage','apie-projekta':'AboutPage','kontaktai':'ContactPage'}[route.baseSlug];
  const web=data['@graph'].find(e=>e['@id']===`https://${pkg.canonicalHost}/${page.slug}#webpage`);
  if(role&&web)web['@type']=role;
  if(role==='CollectionPage'&&web)web.hasPart=local.filter(p=>p.type==='guide').map(p=>({'@type':'WebPage',name:p.title,url:`https://${pkg.canonicalHost}/${p.slug}`}));
  if(route.baseSlug==='')data['@graph']=data['@graph'].filter(e=>e['@type']!=='BreadcrumbList');
  const crumbs=data['@graph'].find(e=>e['@type']==='BreadcrumbList');
  if(crumbs)crumbs.itemListElement=memoBreadcrumbs(pkg,page,pages).map((p,i)=>({'@type':'ListItem',position:i+1,name:p.name,item:`https://${pkg.canonicalHost}${p.path}`}));
  if(route.baseSlug==='collections/all'){
    const collection=web;
    collection['@type']='CollectionPage';
    collection.hasPart=local.filter(p=>p.type==='product').map(p=>({'@type':'WebPage',name:p.title,url:`https://${pkg.canonicalHost}/${p.slug}`}));
  }
  if(page.type==='product'){
    const url=`https://${pkg.canonicalHost}/${page.slug}`;
    const product={'@type':'Product','@id':`${url}#product`,url,name:page.title,description:page.description,brand:{'@type':'Brand',name:pkg.site.name},...(page.media[0]?{image:[`https://${pkg.canonicalHost}${page.media[0].src}`]}:{})};
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
  return text.toLowerCase().normalize('NFKD').replace(/[\u0300-\u036f]/g,'').replaceAll('ł','l').replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'');
}
