import {test} from 'node:test';
import assert from 'node:assert/strict';
import {nicheReadingBody} from '../lib/niche-reading.mjs';
test('home and article reading use all canonical text blocks without a domain exception or image/private metadata',()=>{
 const body=[{type:'paragraph',text:'Visible opening'},{type:'heading',level:2,text:'Preparation'},{type:'list',items:['Room','Time']},{type:'image',assetId:'private-image'}];
 for(const type of ['home','guide','service'])assert.deepEqual(nicheReadingBody({type,body,bodyProjection:type==='home'?'canonical':undefined,factChecks:['PRIVATE']}),['Visible opening','## Preparation','- Room\n- Time']);
 assert.deepEqual(nicheReadingBody({type:'home',body}),[],'Legacy partial layout must not gain model-only body claims');
});
