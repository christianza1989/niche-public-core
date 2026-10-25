import test from 'node:test';
import assert from 'node:assert/strict';
import {memoGiftQuickPaths} from '../lib/memocasting-structure.mjs';
import {projectPublicPages} from '../lib/niche-links.mjs';
const guide=(slug,publishAt='2026-10-01T00:00:00Z')=>({id:slug,siteId:'memocasting',type:'guide',slug,title:slug,body:[],links:[],media:[],publishAt,revisionHash:'current',approval:{status:'approved',revisionHash:'current',approvedAt:'2026-10-01T00:00:00Z'}});
test('gift shortcuts appear only when the same supplied projection admits the target',()=>{
 const ready=guide('gidai/kaledines-dovanos-mamai'),future=guide('gidai/kaledines-dovanos-paskutine-minute','2026-10-26T08:00:00Z'),revoked={...guide('gidai/kaledines-dovanos-teciui'),revisionHash:'changed'};
 const pkg={siteId:'memocasting',canonicalHost:'memocasting.lt',pages:[ready,future,revoked]};
 for(const [at,expected]of [['2026-10-26T07:59:59Z',1],['2026-10-26T08:00:00Z',2]]){
  const pages=projectPublicPages(pkg,[pkg],{},Date.parse(at)),links=memoGiftQuickPaths(pages);
  assert.equal(links.length,expected);assert.ok(links.every(link=>pages.some(p=>p.id===link.id)));assert.ok(!links.some(link=>link.url.endsWith('teciui')));
 }
 assert.deepEqual(memoGiftQuickPaths([ready],'pl'),[]);
});
