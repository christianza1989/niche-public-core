import {memoRoute,memoPath,memoLabels} from './memocasting-locales.mjs';
import {nicheSchemaGraph} from './niche-schema-core.mjs';

// Keep an author's quick answer ahead of large media, without copying or dropping blocks.
export function memoGuideBodyParts(page){
 const firstHeading=page.body.findIndex(block=>block.type==='heading');
 const split=page.type==='guide'&&firstHeading>0?firstHeading:0;
 return {lead:page.body.slice(0,split),body:page.body.slice(split)};
}

export function memoCompany(pkg,pages){
 const about=pages.find(p=>p.slug==='apie-projekta'),items=about?.body.flatMap(b=>b.items??[])??[];
 const code=items.find(s=>s.startsWith('Įmonės kodas:'))?.match(/\b\d{9}\b/)?.[0];
 const address=items.find(s=>s.startsWith('Kontaktinis ir grąžinimo adresas:'))?.replace('Kontaktinis ir grąžinimo adresas: ','').replace(/\.$/,'');
 return {email:pkg.site.contact.email,phone:pkg.site.contact.phone,code,address};
}

export function memoProfilePath(page,pages){
 const route=memoRoute(page),local=pages.find(p=>memoRoute(p).language===route.language&&memoRoute(p).baseSlug==='redakcija');
 if(local)return '/'+local.slug;
 return pages.some(p=>p.slug==='redakcija')?'/redakcija':null;
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
  const profilePath=memoProfilePath(page,pages);if(profilePath)organization.url=`https://${pkg.canonicalHost}${profilePath}`;
  if(identity.phone)organization.telephone=identity.phone;
  if(identity.code)organization.identifier={'@type':'PropertyValue',propertyID:'Company registration number',value:identity.code};
  // Google-supported link-only policy: the approved public page is authoritative.
  // Use only the eligible projection, never private/future pkg.pages.
  const returnsPage=pages.find(p=>p.slug==='grazinimas');
  if(returnsPage)organization.hasMerchantReturnPolicy={'@type':'MerchantReturnPolicy',merchantReturnLink:`https://${pkg.canonicalHost}/${returnsPage.slug}`};
  for(const entity of data['@graph']){if(['WebPage','Article','CollectionPage','ProfilePage','AboutPage','ContactPage'].includes(entity['@type']))entity.inLanguage=route.locale;if(entity['@type']==='WebSite')entity.inLanguage=[...new Set(pages.map(p=>memoRoute(p).locale))];}
  const role={'gidai':'CollectionPage','dovanos':'CollectionPage','redakcija':'ProfilePage','apie-projekta':'AboutPage','kontaktai':'ContactPage'}[route.baseSlug];
  const web=data['@graph'].find(e=>e['@id']===`https://${pkg.canonicalHost}/${page.slug}#webpage`);
  if(role&&web)web['@type']=role;
  if(role==='ProfilePage'&&web)web.mainEntity={'@id':organization['@id']};
  if(['redakcija','apie-projekta','kontaktai','privatumas','naudojimo-salygos'].includes(route.baseSlug))data['@graph']=data['@graph'].filter(e=>e['@type']!=='Service');
  if(role==='CollectionPage'&&web)web.hasPart=memoGuideSections(local,route.language,{giftOnly:route.baseSlug==='dovanos'}).flatMap(group=>group.pages).map(p=>({'@type':'WebPage',name:p.title,url:`https://${pkg.canonicalHost}/${p.slug}`}));
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
    if(page.seoOffer)product.offers={...page.seoOffer,url};
    data['@graph'].push(product);
    data['@graph'].find(e=>e['@type']==='WebPage').mainEntity={'@id':product['@id']};
  }
  // Price/availability above are admitted live-shop runtime data; no invented
  // rating, delivery promise or editorial price is used to complete a Product.
  return data;
}
export const memoGuideGroups=[
  {id:'dovanos',title:'Dovanos pasirinkimas ir planavimas',slugs:['gidai/dovana-porai','gidai/dovana-vestuviu-metinems','gidai/ranku-liejimo-rinkinys-ar-paruosta-dovana']},
  {id:'naudojimas',title:'Proceso etapai, apdaila ir pagalba',slugs:['gidai/dziovinimas-ir-isemimas','gidai/liejinio-dazymas-ir-prieziura','pagalba']}
];
// Accept only the caller's already eligible pages; never inspect pkg.pages or
// private plans here. An approved new topic falls back to planning so extending
// the archive cannot silently orphan it behind an old slug allowlist.
const careGuide=/^gidai\/(?:dziovinimas-ir-isemimas|liejinio-dazymas-ir-prieziura|pasirengimas-ranku-liejimui|ranku-pozos(?:-liejimui)?|suluzes-ranku-liejinys|ranku-liejinio-iteikimas)$|^pagalba$/;
const recipientGuide=/^gidai\/dovan(?:os|a)-(?:moterims|vyrams|mamai|teciui|seimai|tevams|seneliams|mociutei|seneliui|zmonai|merginai|vaikinui|draugei|draugui|sesei|broliui|mokytojai|kolegoms|vadovui|vaikams|paaugliams|dukrai|sunui|kriksto-tevams|porai)$/;
const occasionGuide=/^gidai\/(?:dovan(?:os|a)-(?:gimtadienio-proga|vestuvems|vestuviu-metinems|valentino-dienai|mamos-dienai|tevo-dienai|jubiliejui|ikurtuvems|krikstynoms|suzadetuviu-proga|pensijai|isleistuvems|boso-dienai|gimus-vaikui|mokytoju-dienai|moters-dienai|vardadieniui)|velyku-dovanos|padekos-dovanos)$/;
const kindGuide=/^gidai\/(?:originalios-dovanos|personalizuotos-dovanos|prasmingos-dovanos|romantiskos-dovanos|praktiskos-dovanos|nebrangios-dovanos|ranku-darbo-dovanos|pasidaryk-pats-dovanos|patirties-dovanos|dovanu-rinkiniai|lietuviskos-dovanos|valgomos-dovanos|tvarios-dovanos)$/;
export function memoGuideSections(eligiblePages,language='lt',{giftOnly=false}={}){
  const labels=memoLabels[language];
  const definitions=language==='lt'?
    [{id:'kaledos',title:'Kalėdų dovanos',matches:slug=>/kaled|advento/.test(slug)},
     {id:'gavejai',title:'Kam dovanosite?',matches:slug=>recipientGuide.test(slug)},
     {id:'progos',title:'Dovanos pagal progą',matches:slug=>occasionGuide.test(slug)},
     {id:'pobudis',title:'Kokia dovana tiktų?',matches:slug=>kindGuide.test(slug)},
     {id:'naudojimas',title:labels.care,matches:slug=>careGuide.test(slug)},
     {id:'dovanos',title:labels.planning,matches:()=>true}]:
    [{id:'naudojimas',title:labels.care,matches:slug=>careGuide.test(slug)},
     {id:'dovanos',title:labels.planning,matches:()=>true}];
  const groups=definitions.map(group=>({...group,pages:[]})),seen=new Set();
  for(const page of eligiblePages){
    const route=memoRoute(page);
    if(page.type!=='guide'||route.language!==language||seen.has(page.slug))continue;
    seen.add(page.slug);
    const group=groups.find(group=>group.matches(route.baseSlug));
    if(giftOnly&&group.id==='naudojimas')continue;
    group.pages.push(page);
  }
  for(const group of groups)group.pages.sort((a,b)=>b.publishAt.localeCompare(a.publishAt)||a.title.localeCompare(b.title,language));
  // Keep the original planning / care order in established translated indexes.
  if(language!=='lt')groups.reverse();
  return groups.filter(group=>group.pages.length).map(({id,title,pages})=>({id,title,pages}));
}
// Stable fragment identifiers follow the approved words, not block positions.
export function memoSectionId(text){
  return text.toLowerCase().normalize('NFKD').replace(/[\u0300-\u036f]/g,'').replaceAll('ł','l').replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'');
}
