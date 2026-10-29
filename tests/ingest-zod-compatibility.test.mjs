import test from 'node:test';
import assert from 'node:assert/strict';
import {spawnSync} from 'node:child_process';

test('patched Zod retains ingest defaults, approval boundary and payload constraints',()=>{
 const moduleUrl=new URL('../lib/ingest.ts',import.meta.url).href;
 const result=spawnSync(process.execPath,['--experimental-strip-types','--input-type=module','-e',`
  import assert from 'node:assert/strict';
  import {validateIngestPayload} from ${JSON.stringify(moduleUrl)};
  const article={externalId:'fixture',title:'Synthetic compatibility fixture',slug:'compatibility-fixture',excerpt:'A synthetic bounded payload for the existing ingestion contract.',category:'Testing',locale:'lt-LT',authorIds:['fixture-author'],blocks:[{type:'paragraph',text:'Existing body text.'},{type:'list',items:['Existing list item.']}]};
  const payload={idempotencyKey:'fixture-key-20261029',siteKey:'fixture',articles:[article]};
  const accepted=validateIngestPayload(payload);assert.ok(accepted.success);assert.equal(accepted.data.articles[0].requestedState,'review');assert.equal(accepted.data.articles[0].blocks[1].ordered,false);
  assert.equal(validateIngestPayload({...payload,articles:[{...article,requestedState:'approved'}]}).success,false);
  assert.equal(validateIngestPayload({...payload,articles:Array(51).fill(article)}).success,false);
  assert.equal(validateIngestPayload({...payload,articles:[{...article,blocks:[...article.blocks,{type:'image',src:'//foreign.example/image.png',alt:'Fixture image',width:100,height:100}]}]}).success,false);
 `],{encoding:'utf8',windowsHide:true,timeout:30000});
 assert.equal(result.status,0,result.stderr||result.stdout);
});
