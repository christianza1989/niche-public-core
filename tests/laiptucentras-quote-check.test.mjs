import {test} from 'node:test';
import assert from 'node:assert/strict';
import {summarizeQuoteCheck} from '../lib/laiptucentras-quote-check.mjs';
test('empty review keeps each unspecified item attached to the correct offer',()=>{
 assert.deepEqual(summarizeQuoteCheck(['Pakopos','Montavimas'],[['unknown','unknown'],['unknown','unknown']]),{unknownA:['Pakopos','Montavimas'],unknownB:['Pakopos','Montavimas'],different:[]});
});
test('partial review distinguishes unknown from explicitly excluded scope',()=>{
 assert.deepEqual(summarizeQuoteCheck(['Pakopos','Montavimas','Transportas'],[['included','excluded'],['unknown','included'],['excluded','excluded']]),{unknownA:['Montavimas'],unknownB:[],different:['Pakopos']});
});
test('all excluded is fully specified but is not declared a complete installation or winner',()=>{
 const result=summarizeQuoteCheck(['Pakopos'],[['excluded','excluded']]);
 assert.deepEqual(result,{unknownA:[],unknownB:[],different:[]});
 assert.equal('winner' in result,false);
});
test('invalid or misaligned selections fail instead of producing a false completeness result',()=>{
 assert.throws(()=>summarizeQuoteCheck(['Pakopos'],[['yes','included']]));
 assert.throws(()=>summarizeQuoteCheck(['Pakopos'],[]));
 assert.throws(()=>summarizeQuoteCheck(['Pakopos'],[['included']]));
});
