import test from 'node:test';
import assert from 'node:assert/strict';
import {blockDigest,matchingPresentation,inlinePieces,originalHref,pageDigest,orderedWidgets,originalTextStyle} from '../lib/kvapunaikinimas-presentation.mjs';

test('native edits invalidate old emphasis and link ranges',()=>{
 const block={type:'paragraph',text:'Patalpų kainos >>>'};
 const presentation={digest:blockDigest(block),marks:[{kind:'link',from:14,to:17,href:'https://kvapunaikinimas.lt/ozonavimas-vilniuje-kaina/'}]};
 assert.equal(matchingPresentation(block,presentation),presentation);
 assert.equal(matchingPresentation({...block,text:'Pasikeitęs tekstas'},presentation),undefined);
 assert.equal(matchingPresentation({type:'heading',text:block.text},presentation),undefined);
});
test('overlapping emphasis preserves every Lithuanian character exactly once',()=>{
 const text='Kvapų šalinimo žingsniai';
 const parts=inlinePieces(text,[{kind:'strong',from:0,to:14},{kind:'em',from:6,to:14}]);
 assert.equal(parts.map(p=>p.text).join(''),text);
 assert.equal(parts[1].text,'šalinimo');
 assert.deepEqual(parts[1].marks.map(m=>m.kind),['strong','em']);
});
test('source links keep canonical local targets and reject executable protocols',()=>{
 assert.equal(originalHref('https://kvapunaikinimas.lt/ozonavimas-kas-tai/'),'/ozonavimas-kas-tai');
 assert.equal(originalHref('https://www.kvapunaikinimas.lt/'),'/');
 assert.equal(originalHref('javascript:alert(1)'),undefined);
 assert.equal(originalHref('data:text/html,test'),undefined);
 assert.equal(inlinePieces('>>>',[{kind:'link',from:0,to:3,href:'javascript:alert(1)'}])[0].marks.length,0);
 assert.equal(inlinePieces('>>>',[{kind:'strong',from:-1,to:3}])[0].marks.length,0);
});
test('real draft and synthetic fixture share presentation without sharing media IDs',()=>{
 const before=[{type:'paragraph',text:'Tas pats tekstas'},{type:'image',assetId:'real'}];
 const after=[{type:'paragraph',text:'Tas pats tekstas'},{type:'image',assetId:'fixture'}];
 assert.equal(pageDigest(before,[{id:'real',alt:'Nuotrauka'}]),pageDigest(after,[{id:'fixture',alt:'Nuotrauka'}]));
 assert.notEqual(pageDigest(before,[{id:'real',alt:'Nuotrauka'}]),pageDigest(after,[{id:'fixture',alt:'Kita nuotrauka'}]));
});
test('numeric Elementor IDs cannot move a later heading before the introduction',()=>{
 const widgets={'37b20e2':{start:0},'7f0d2d9':{start:1},'3054466':{start:22},'166e37a':{start:23}};
 assert.equal(Object.keys(widgets)[0],'3054466');
 assert.deepEqual(orderedWidgets(widgets).map(([id])=>id),['37b20e2','7f0d2d9','3054466','166e37a']);
});

test('child typography survives overlapping semantic marks without changing native words',()=>{
 const text='Prieš ozonavimą';const parts=inlinePieces(text,[{kind:'strong',from:0,to:text.length},{kind:'style',from:0,to:text.length,style:{size:14,weight:600,letter:1}}]);
 assert.equal(parts.map(p=>p.text).join(''),text);
 assert.deepEqual(parts[0].marks.map(m=>m.kind),['strong','style']);
 assert.deepEqual(originalTextStyle(parts[0].marks[1].style),{fontSize:14,fontWeight:600,letterSpacing:1});
});
test('imported text styles allow only bounded typography and the dark source palette',()=>{
 assert.deepEqual(originalTextStyle({size:Infinity,weight:999,letter:100,color:'url(https://invalid.example)',slant:'anything',position:'fixed'}),{});
 assert.deepEqual(originalTextStyle({color:'rgb(51, 51, 51)',slant:'italic'}),{fontStyle:'italic',color:'rgb(51,51,51)'});
 assert.deepEqual(originalTextStyle({color:'rgb(94,190,214)'}),{});
 assert.equal(inlinePieces('x',[{kind:'style',from:0,to:1,style:{position:'fixed'}}])[0].marks.length,0);
});
