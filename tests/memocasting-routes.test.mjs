import test from 'node:test';
import assert from 'node:assert/strict';
import {memoUrlMoves,memoRedirectPath} from '../lib/memocasting-routes.mjs';
import {memoRoute,memoPath,memoAlternates,memoLanguageLinks} from '../lib/memocasting-locales.mjs';
import {projectPublicPages} from '../lib/niche-links.mjs';
test('permanent moves require an eligible destination and cannot catch localized, unrelated or write routes',()=>{
 for(const move of memoUrlMoves){
  const target={slug:move.to,approval:{status:'approved',revisionHash:'r'},revisionHash:'r',publishAt:'2026-10-01',links:[]};
  const pkg={siteId:'memocasting',canonicalHost:'memocasting.lt',pages:[target]};
  const live=projectPublicPages(pkg,[pkg],{},Date.parse('2026-10-13'));
  assert.equal(memoRedirectPath('/'+move.from,live),'/'+move.to);
  assert.equal(memoRedirectPath('/'+move.from+'/',live,'HEAD'),'/'+move.to);
  for(const path of ['/'+move.to,'/pl/'+move.from,'/'+move.from+'/extra','/other'])assert.equal(memoRedirectPath(path,live),null);
  assert.equal(memoRedirectPath('/'+move.from,live,'POST'),null);
  for(const change of [{publishAt:'2099-01-01'},{approval:{status:'revoked',revisionHash:'r'}},{revisionHash:'changed'}]){
   const hidden={...pkg,pages:[{...target,...change}]};
   assert.equal(memoRedirectPath('/'+move.from,projectPublicPages(hidden,[hidden],{},Date.parse('2026-10-13'))),null);
  }
 }
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
