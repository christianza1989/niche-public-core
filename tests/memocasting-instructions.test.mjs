import test from 'node:test';
import assert from 'node:assert/strict';
import {memoInstructionKind,memoInstructionChoices,memoInstructionSections,memoInstructionDownloads} from '../lib/memocasting-instructions.mjs';
import {memoBreadcrumbs} from '../lib/memocasting-structure.mjs';

const page={slug:'instrukcijos/poros-rinkiniui',type:'faq',title:'Poros rinkinio instrukcija',body:[]};
test('instruction routes and choices use only the supplied eligible LT pages',()=>{
 assert.equal(memoInstructionKind({slug:'pages/instrukcija'}),'hub');
 assert.equal(memoInstructionKind(page),'couple');
 assert.equal(memoInstructionKind({slug:'pl/instrukcijos/poros-rinkiniui'}),null);
 assert.equal(memoInstructionKind({slug:'gidai/ranku-liejimas'}),null);
 assert.deepEqual(memoInstructionChoices([page]).map(p=>p.page.slug),[page.slug]);
 assert.equal(memoInstructionChoices([]).length,0);
});
test('section grouping keeps all author blocks and exact quantities without deriving recipes',()=>{
 const body=[{type:'paragraph',text:'Įžanga.'},{type:'heading',level:2,text:'Trumpa atmintinė'},{type:'list',items:['Tikslus autoriaus kiekis: 3,2 l.']},{type:'heading',level:2,text:'1. Paruoškite vietą'},{type:'paragraph',text:'Tikslus terminas: 60–70 sek.'},{type:'heading',level:3,text:'Svarbu'},{type:'paragraph',text:'Nekeiskite santykio.'},{type:'image',assetId:'real'},{type:'heading',level:2,text:'1. Paruoškite vietą'},{type:'paragraph',text:'Dar viena autoriaus dalis.'}];
 const result=memoInstructionSections({...page,body});assert.deepEqual(result.lead,[body[0]]);assert.equal(result.sections[0].role,'summary');assert.equal(result.sections[1].step,1);assert.equal(result.sections[1].title,'Paruoškite vietą');assert.notEqual(result.sections[1].id,result.sections[2].id);
 assert.deepEqual(result.sections[0].blocks,[body[2]]);assert.deepEqual(result.sections[1].blocks,body.slice(4,8));assert.deepEqual(result.sections[2].blocks,[body[9]]);
});
test('PDF controls accept only owned HTTPS PDF paths supplied by the page',()=>{
 const urls=['https://memocasting.lt/instrukcijos/poros.pdf','https://www.memocasting.lt/files/seimos.PDF?v=2','https://foreign.example/claim.pdf','javascript:alert(1)','https://memocasting.lt/not-a-pdf','https://evil.example/memocasting.lt/file.pdf','https://user:secret@memocasting.lt/file.pdf'];
 assert.deepEqual(memoInstructionDownloads({externalLinks:urls.map(url=>({url,label:'Dokumentas'}))}).map(l=>l.url),urls.slice(0,2));
});
test('instruction breadcrumbs add only an eligible hub and preserve the product trail',()=>{
 const pkg={site:{name:'Memocasting'}},home={slug:'',type:'home'},hub={slug:'pages/instrukcija',type:'faq',title:'Instrukcijos'};
 assert.deepEqual(memoBreadcrumbs(pkg,page,[home,hub,page]).map(x=>x.path),['/','/pages/instrukcija','/'+page.slug]);
 assert.deepEqual(memoBreadcrumbs(pkg,page,[home,page]).map(x=>x.path),['/','/'+page.slug]);
});
