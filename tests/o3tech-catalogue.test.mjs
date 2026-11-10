import test from'node:test';import assert from'node:assert/strict';
import policy from'../config/o3tech-catalogue.json'with{type:'json'};
import{projectPublicPages}from'../lib/niche-links.mjs';
const now=Date.parse('2026-10-29T00:00:00Z'),past='2026-01-01T00:00:00Z',future='2026-12-01T00:00:00Z';
const page=(id,type,slug,title)=>({id,siteId:'o3tech',type,slug,title,body:[],media:[],links:[],publishAt:past,revisionHash:'isolated-unit-fixture',approval:{status:'approved',revisionHash:'isolated-unit-fixture'}});
function fixture(){const products=[...new Set(policy.indices.flatMap(i=>i.productIds))].map((id,i)=>({...page(id,'product','produktas/item-'+i,'Synthetic item '+i),publishAt:future}));const indices=policy.indices.map(i=>({...page(i.pageId,'faq',i.slug,'Synthetic index'),body:[{type:'list',items:i.productIds.map(id=>products.find(p=>p.id===id).title)}],links:i.productIds.map(id=>({targetPageId:id,label:products.find(p=>p.id===id).title}))}));return{siteId:'o3tech',canonicalHost:'o3tech.lt',pages:[{...page('home','home','','Fixture'),links:indices.map(p=>({targetPageId:p.id,label:p.title}))},...products,...indices]};}
test('catalogue body, links and incoming navigation use the actual same-site due product slice',()=>{
 const pkg=fixture(),raw=JSON.stringify(pkg);let live=projectPublicPages(pkg,[pkg],{},now);assert.deepEqual(live.map(p=>p.id),['home']);assert.deepEqual(live[0].links,[]);
 const product=pkg.pages.find(p=>p.type==='product');product.publishAt=past;
 live=projectPublicPages(pkg,[pkg],{},now);const indexes=live.filter(p=>p.type==='faq');assert.equal(indexes.length,policy.indices.filter(i=>i.productIds.includes(product.id)).length);
 for(const p of indexes){assert.deepEqual(p.body,[{type:'list',items:[product.title]}]);assert.deepEqual(p.links,[{targetPageId:product.id,label:product.title}]);}
 const before=JSON.stringify(pkg);projectPublicPages(pkg,[pkg],{},Date.parse(future));assert.equal(JSON.stringify(pkg),before,'Projection never changes approved bytes');
 product.approval=null;assert.deepEqual(projectPublicPages(pkg,[pkg],{},now).map(p=>p.id),['home']);
 assert.ok(raw.includes('Synthetic item'));
});
test('wrong tenant, malformed list/links and revoked or future targets cannot create a catalogue exception',()=>{
 const pkg=fixture();for(const p of pkg.pages.filter(p=>p.type==='product'))p.publishAt=past;
 assert.equal(projectPublicPages(pkg,[pkg],{},now).filter(p=>p.type==='faq').length,6);
 const index=pkg.pages.find(p=>p.type==='faq');index.body[0].items[0]='Unapproved mismatched label';const live=projectPublicPages(pkg,[pkg],{},now);assert.ok(!live.some(p=>p.id===index.id));assert.ok(!live[0].links.some(l=>l.targetPageId===index.id));
 const foreign={...pkg,siteId:'foreign',canonicalHost:'foreign.example'};assert.equal(projectPublicPages(foreign,[foreign],{},now).filter(p=>p.type==='faq').length,6,'Unrelated tenants keep their ordinary projection');
});
