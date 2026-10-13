import assert from 'node:assert/strict';
import {test} from 'node:test';
import {nicheLlmsIndexCore,nicheLlmsFullCore,nicheRobotsTextCore,nicheSitemapXmlCore} from '../lib/niche-seo-core.mjs';
import {nicheBreadcrumbs,nicheSchemaGraph} from '../lib/niche-schema-core.mjs';
const pkg={siteId:'example',canonicalHost:'example.com',locale:'en',site:{name:'Example',offer:'Useful guidance',contact:{email:'hello@example.com'}}};
const page={id:'guide',slug:'guides/start',title:'Start here',description:'A clear answer',type:'guide',publishAt:'2026-10-06T00:00:00.000Z',approval:{approvedAt:'2026-10-06T01:00:00.000Z'},body:[{type:'heading',level:2,text:'Install'},{type:'paragraph',text:'Keep all the files together.'}],media:[],links:[{targetPageId:'hub',label:'Guides'},{targetPageId:'future',label:'Future'}],externalLinks:[]};
test('English machine-readable summaries use the supplied projection and localized labels',()=>{
 const pages=[page,{...page,id:'hub',type:'faq',slug:'guides',title:'Guides',links:[]}];
 const index=nicheLlmsIndexCore(pkg,pages),full=nicheLlmsFullCore(pkg,pages,'MB Pinet');
 assert.match(index,/Published pages/);assert.match(full,/Author: MB Pinet/);assert.match(full,/## Install/);
 assert.match(full,/Related answer: \[Guides\]/);assert.doesNotMatch(full,/Future|Autorius|Susijęs/);
 assert.equal(nicheBreadcrumbs(pkg,page,pages)[1].name,'Guides');
 assert.equal(nicheBreadcrumbs(pkg,page,[page]).length,2);
});
test('preview robots close crawling; sitemap escapes XML without inventing pages',()=>{
 assert.equal(nicheRobotsTextCore(pkg,true,true),'User-agent: *\nDisallow: /\n');
 assert.equal(nicheRobotsTextCore(pkg,false,false),nicheRobotsTextCore(pkg,true,true));
 const xml=nicheSitemapXmlCore(pkg,[{...page,slug:'guides/a&b'}]);
 assert.match(xml,/a&amp;b/);assert.equal((xml.match(/<url>/g)||[]).length,1);
 assert.match(nicheRobotsTextCore(pkg,false,true),/Sitemap: https:\/\/example.com/);
});
test('English profile and utility page schema retain truthful page roles',()=>{
 const profile={...page,slug:'editorial',type:'faq'};
 const graph=nicheSchemaGraph(pkg,page,[page,profile],'MB Pinet')['@graph'];
 assert.equal(graph.find(x=>x['@type']==='Article').author.url,'https://example.com/editorial');
 assert.equal(nicheSchemaGraph(pkg,profile,[profile],'MB Pinet')['@graph'].find(x=>x['@type']==='ProfilePage').mainEntity['@id'],'https://example.com/#organization');
 for(const slug of ['guides','help','downloads','privacy','terms','contact','about','editorial'])assert.ok(!nicheSchemaGraph(pkg,{...page,type:'service',slug},[page],'MB Pinet')['@graph'].some(x=>x['@type']==='Service'),slug);
 assert.ok(!JSON.stringify(graph).match(/AggregateRating|Review|Offer|Person/));
});
