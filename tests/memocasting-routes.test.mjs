import test from 'node:test';
import assert from 'node:assert/strict';
import {memoUrlMoves,memoContentMoves,memoRecoveredMoves,memoRedirectPath,memoRedirectUrl} from '../lib/memocasting-routes.mjs';
import {memoRoute,memoPath,memoAlternates,memoLanguageLinks} from '../lib/memocasting-locales.mjs';
import {projectPublicPages} from '../lib/niche-links.mjs';
test('permanent moves require an eligible destination and cannot catch localized, unrelated or write routes',()=>{
 for(const move of [...memoUrlMoves,...memoContentMoves,...memoRecoveredMoves]){
  const target={slug:move.to,approval:{status:'approved',revisionHash:'r'},revisionHash:'r',publishAt:'2026-10-01',links:[]};
  const pkg={siteId:'memocasting',canonicalHost:'memocasting.lt',pages:[target]};
  const live=projectPublicPages(pkg,[pkg],{},Date.parse('2026-10-13'));
  const expected='/'+move.to+(move.hash?'#'+move.hash:'');
  assert.equal(memoRedirectPath('/'+move.from,live),expected);
  assert.equal(memoRedirectPath('/'+move.from+'/',live,'HEAD'),expected);
  for(const path of ['/'+move.to,'/pl/'+move.from,'/'+move.from+'/extra','/other'])assert.equal(memoRedirectPath(path,live),null);
  assert.equal(memoRedirectPath('/'+move.from,live,'POST'),null);
  for(const change of [{publishAt:'2099-01-01'},{approval:{status:'revoked',revisionHash:'r'}},{revisionHash:'changed'}]){
   const hidden={...pkg,pages:[{...target,...change}]};
   assert.equal(memoRedirectPath('/'+move.from,projectPublicPages(hidden,[hidden],{},Date.parse('2026-10-13'))),null);
  }
 }
});

test('retired storefront password GET/HEAD reaches home without forwarding credentials or a return destination',()=>{
 const home={slug:'',type:'home'};
 for(const method of ['GET','HEAD']){
  const url=memoRedirectUrl('https://memocasting.lt/password?password=do-not-forward&return_url=https%3A%2F%2Fexample.com',[home],method);
  assert.equal(url.href,'https://memocasting.lt/');
 }
 assert.equal(memoRedirectUrl('https://memocasting.lt/password',[home],'POST'),null);
 for(const path of ['/password/reset','/account/reset','/prekyba/password','/pl/password','/not-a-historical-page'])assert.equal(memoRedirectUrl('https://memocasting.lt'+path,[home]),null);
 assert.equal(memoRedirectUrl('https://memocasting.lt/password',[]),null);
});

test('gallery retains the real section fragment and ordinary migration keeps campaign attribution',()=>{
 const gallery=memoRedirectUrl('https://memocasting.lt/pages/galerija?utm_source=old',[{slug:'',type:'home'}]);
 assert.equal(gallery.href,'https://memocasting.lt/?utm_source=old#galerija');
 const kit=memoRedirectUrl('https://memocasting.lt/products/1-2-ranku-rinkinys-3d?utm_source=old',[{slug:'rinkinys-porai',type:'product'}]);
 assert.equal(kit.href,'https://memocasting.lt/rinkinys-porai?utm_source=old');
});

test('a restored native product owns its URL and an unrelated mother-and-child SKU does not redirect to the family SKU',()=>{
 const move=memoRecoveredMoves.find(m=>m.from==='products/1-2-ranku-rinkinys-3d');
 assert.equal(memoRedirectPath('/'+move.from,[{slug:move.from,type:'product'},{slug:move.to,type:'product'}]),null);
 assert.equal(memoRedirectPath('/products/seimos-rinkinys',[{slug:'seimos-rinkinys',type:'product'}]),null);
});

test('historical article alias activates at the eligible publication boundary and preserves the native guide role',()=>{
 const move=memoContentMoves[0],at=Date.parse('2026-10-16T07:00:00Z');
 const page={slug:move.to,type:'guide',revisionHash:'r',approval:{status:'approved',revisionHash:'r'},publishAt:new Date(at).toISOString(),links:[]};
 const pkg={siteId:'memocasting',canonicalHost:'memocasting.lt',pages:[page]};
 assert.equal(memoRedirectPath('/'+move.from,projectPublicPages(pkg,[pkg],{},at-1)),null);
 assert.equal(memoRedirectPath('/'+move.from,projectPublicPages(pkg,[pkg],{},at)),'/'+move.to);
 assert.equal(memoRoute(page).baseSlug,move.to);
 assert.equal(memoPath(memoRoute(page),move.to),'/'+move.to);
});
test('new LT canonical routes preserve product/catalog roles and native equivalents',()=>{
 const pkg={canonicalHost:'memocasting.lt'};
 for(const move of memoUrlMoves){
  const lt={slug:move.to,type:move.from==='collections/all'?'faq':'product'},pl={slug:'pl/'+move.from,type:lt.type};
  assert.equal(memoRoute(lt).baseSlug,move.from);
  assert.equal(memoPath(memoRoute(lt),move.from),'/'+move.to);
  assert.equal(memoPath(memoRoute(pl),move.from),'/pl/'+move.from);
  assert.equal(memoAlternates(pkg,pl,[lt,pl]).find(x=>x.language==='lt-LT').url,'https://memocasting.lt/'+move.to);
  assert.equal(memoLanguageLinks(pl,[lt,pl]).find(x=>x.language==='lt').path,'/'+move.to);
 }
});
