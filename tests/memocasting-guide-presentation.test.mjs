import test from 'node:test';
import assert from 'node:assert/strict';
import {memoGuideBodyParts} from '../lib/memocasting-structure.mjs';
test('quick answer moves before media without losing, duplicating or altering prose',()=>{
 for(const type of ['guide','product','faq'])for(const body of [[],[{type:'paragraph',text:'Only answer'}],[{type:'heading',level:2,text:'Start'},{type:'paragraph',text:'Body'}],[{type:'paragraph',text:'Answer'},{type:'list',items:['Choice']},{type:'heading',level:2,text:'Details'},{type:'image',assetId:'photo'}]]){
  const result=memoGuideBodyParts({type,body});assert.deepEqual([...result.lead,...result.body],body);
  if(type!=='guide'||!body.some(b=>b.type==='heading'))assert.equal(result.lead.length,0);
  if(type==='guide'&&body[0]?.text==='Answer')assert.equal(result.lead.length,2);
 }
});
