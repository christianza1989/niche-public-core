import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {createRequire} from 'node:module';
import ts from 'typescript';

// Exercise the actual schema against the installed Zod, not a mocked validator.
const source=fs.readFileSync(new URL('../lib/ingest.ts',import.meta.url),'utf8');
const js=ts.transpileModule(source,{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText;
const module={exports:{}};
new Function('require','module','exports',js)(createRequire(import.meta.url),module,module.exports);
const {validateIngestPayload}=module.exports;
const article={externalId:'owned-article',title:'A legitimate reviewed article',slug:'reviewed-article',excerpt:'A sufficiently detailed factual excerpt for the reviewed article.',category:'Documentation',locale:'lt-LT',authorIds:['real-author'],blocks:[{type:'heading',level:2,text:'Actual heading'},{type:'paragraph',text:'Actual reviewed content.'}]};
const batch={idempotencyKey:'ingest-contract-key',siteKey:'example',articles:[article]};

test('patched validator preserves legitimate review-only ingest and defaults',()=>{
 const result=validateIngestPayload(batch);assert.equal(result.success,true);
 assert.equal(result.data.articles[0].requestedState,'review');
 assert.deepEqual(result.data.articles[0].sourceIds,[]);
});
test('ingest cannot grant publication or accept invalid collection shapes',()=>{
 assert.equal(validateIngestPayload({...batch,articles:[{...article,requestedState:'published'}]}).success,false);
 assert.equal(validateIngestPayload({...batch,articles:[]}).success,false);
 assert.equal(validateIngestPayload({...batch,articles:[{...article,authorIds:[]}]}).success,false);
});
test('oversized ingest collection is rejected before traversing its elements',()=>{
 const articles=new Array(51);let touched=0;
 Object.defineProperty(articles,0,{get(){touched++;throw Error('oversized collection must not be traversed');}});
 const result=validateIngestPayload({...batch,articles});
 assert.equal(result.success,false);assert.equal(touched,0);
});
