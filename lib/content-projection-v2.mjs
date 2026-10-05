// Edge-safe read model over ingest-validated packages. Approval bytes stay intact.
const due=(p,now)=>p.approval?.status==='approved'&&p.approval.revisionHash===p.revisionHash&&Number.isFinite(Date.parse(p.publishAt))&&Date.parse(p.publishAt)<=now;
const urlFor=(pkg,p)=>new URL('/'+p.slug,'https://'+pkg.canonicalHost).href;
const safeUrl=value=>{try{const u=new URL(value);return u.protocol==='https:'&&!u.username&&!u.password&&!u.port?u:null;}catch{return null;}};
export function commerceDestination(snapshot,registry,now=Date.now()){
  if(!snapshot?.verified || !Number.isFinite(Date.parse(snapshot.checkedAt)) || Date.parse(snapshot.checkedAt)>now)return null;
  const t=(registry?.targets||[]).find(t=>t.id===snapshot.id);
  if(!t||t.status!=='ready'||!Number.isFinite(Date.parse(t.verifiedAt))||Date.parse(t.verifiedAt)>now||!Number.isFinite(Date.parse(t.expiresAt))||Date.parse(t.expiresAt)<=now)return null;
  const u=safeUrl(snapshot.url),c=safeUrl(t.canonicalUrl);
  if(!u||!c||u.origin!==c.origin||u.pathname!==c.pathname||u.hash||c.hash||c.search)return null;
  const allowed=new Set(t.allowedQueryParams||[]),seen=new Set();
  for(const[k,v]of u.searchParams){if(!allowed.has(k)||seen.has(k)||v.length>500||/[\u0000-\u001f\u007f]/.test(v))return null;seen.add(k);}
  return u.href;
}
/** @param {{targets?:Array<{id:string,status:string,canonicalUrl:string,allowedQueryParams?:string[],verifiedAt:string,expiresAt:string,purpose?:string}>}} commerceRegistry */
export function projectContentPagesV2(pkg,packages,settings={},commerceRegistry={targets:[]},now=Date.now()){
  const owned=new Set([...(settings.networkDomains||[]),...(settings.ownedAliases||[]),...packages.map(p=>p.canonicalHost)]);
  const deployed=new Set(settings.networkLiveDomains||[]);
  const live=pkg.pages.filter(p=>due(p,now)),ids=new Set(live.map(p=>p.id));
  const findPage=(siteId,id)=>{const t=packages.find(p=>p.siteId===siteId);if(!t||t.siteId!==pkg.siteId&&!deployed.has(t.canonicalHost))return null;const p=t.pages.find(p=>p.id===id&&due(p,now));return p?urlFor(t,p):null;};
  const external=value=>{
    const u=safeUrl(value);if(!u)return null;if(!owned.has(u.hostname))return u.href;
    const t=packages.find(p=>p.canonicalHost===u.hostname);if(!t||t.siteId!==pkg.siteId&&!deployed.has(t.canonicalHost))return null;
    return t.pages.some(p=>due(p,now)&&urlFor(t,p)===u.href)?u.href:null;
  };
  return live.map(page=>{
    const e=page.editorial;
    const inline=nodes=>nodes.map(n=>{
      if(n.type!=='link')return {type:'text',text:n.text};
      const t=n.target;
      const href=t.kind==='page'?findPage(pkg.siteId,t.pageId):t.kind==='network'?findPage(t.siteId,t.pageId):t.kind==='external'?external(t.url):t.kind==='commerce'?commerceDestination(e.commerceTargets.find(c=>c.id===t.targetId),commerceRegistry,now):null;
      return href?{type:'link',text:n.text,href}:{type:'text',text:n.text};
    });
    const body=page.body.map(b=>b.content?{...b,content:inline(b.content)}:b.type==='richList'?{...b,items:b.items.map(inline)}:{...b});
    const citation=url=>external(url)||e.commerceTargets.some(t=>commerceRegistry.targets?.some(r=>r.id===t.id&&r.purpose==='information')&&commerceDestination({...t,url},commerceRegistry,now));
    return {...page,url:urlFor(pkg,page),body,links:page.links.filter(l=>ids.has(l.targetPageId)),externalLinks:(page.externalLinks||[]).filter(l=>external(l.url)),editorial:{...e,authors:e.authors.map(a=>({...a,sameAs:(a.sameAs||[]).filter(url=>external(url))})),relatedPageIds:e.relatedPageIds.filter(id=>ids.has(id)),sources:e.sources.filter(s=>s.public===true&&citation(s.url)),commerceTargets:e.commerceTargets.filter(t=>commerceDestination(t,commerceRegistry,now))}};
  });
}
export function visibleContentTextV2(page){
  const inline=nodes=>nodes.map(n=>n.type==='link'?`${n.text} (${n.href})`:n.text).join('');
  const text=page.body.map(b=>b.text??(b.content?inline(b.content):b.type==='richList'?b.items.map(inline).join('\n'):b.items?.join('\n')||'')).join('\n');
  const e=page.editorial;
  return [text,...e.authors.map(a=>`Redakcija: ${a.name}. ${a.role}. ${a.bio}`),...e.sources.map(s=>`Šaltinis: ${s.title} — ${s.url}`),...(e.productRecommendation?e.commerceTargets.map(t=>`Rekomendacija: ${t.label} — ${t.url}. Komercinis ryšys: ${t.relationship}`):[])].join('\n');
}
export function projectedSnapshotV2(p){return {id:p.id,title:p.title,url:p.url,type:p.type,publishAt:p.publishAt,body:p.body,media:p.media,links:p.links,externalLinks:p.externalLinks,editorial:p.editorial};}
