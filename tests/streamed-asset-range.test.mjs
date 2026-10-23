import {test} from 'node:test';
import assert from 'node:assert/strict';
import {parseByteRange,serveStreamedAsset,sliceAssetStream} from '../lib/streamed-asset-range.mjs';
test('range parsing supports open/suffix/clamped intervals and safely ignores unsupported syntax',()=>{
 assert.deepEqual(parseByteRange('bytes=2-5',10),{start:2,end:5});
 assert.deepEqual(parseByteRange('bytes=7-',10),{start:7,end:9});
 assert.deepEqual(parseByteRange('bytes=-3',10),{start:7,end:9});
 assert.deepEqual(parseByteRange('bytes=8-999',10),{start:8,end:9});
 assert.deepEqual(parseByteRange('bytes=-99',10),{start:0,end:9});
 for(const range of ['bytes=10-','bytes=5-2','bytes=-0','bytes=99999999999999999999-'])assert.equal(parseByteRange(range,10),false);
 for(const range of ['',null,'bytes=1-2,4-5','kilobytes=1-2','bytes=-'])assert.equal(parseByteRange(range,10),null);
});
test('actual streamed responses return exact bytes and honor If-Range, HEAD, errors and cancellation',async()=>{
 const bytes=Uint8Array.from({length:20},(_,i)=>i);let cancelled=0,fetches=0;
 const assets={fetch:async request=>{fetches++;assert.equal(request.headers.get('Range'),null);return new Response(new ReadableStream({start(c){c.enqueue(bytes.slice(0,7));c.enqueue(bytes.slice(7,14));c.enqueue(bytes.slice(14));},pull(c){c.close();},cancel(){cancelled++;}}),{headers:{ETag:'"v1"','Content-Type':'video/mp4','Content-Length':'20'}});}};
 for(const [range,expected,contentRange] of [['bytes=2-10',bytes.slice(2,11),'bytes 2-10/20'],['bytes=-4',bytes.slice(-4),'bytes 16-19/20'],['bytes=17-',bytes.slice(17),'bytes 17-19/20']]){
  const response=await serveStreamedAsset(new Request('https://example.test/film',{headers:{Range:range}}),assets,20);
  assert.equal(response.status,206);assert.equal(response.headers.get('Content-Range'),contentRange);assert.equal(response.headers.get('Accept-Ranges'),'bytes');assert.deepEqual(new Uint8Array(await response.arrayBuffer()),expected);
 }
 const unsatisfiable=await serveStreamedAsset(new Request('https://example.test/film',{headers:{Range:'bytes=20-'}}),assets,20);assert.equal(unsatisfiable.status,416);assert.equal(unsatisfiable.headers.get('Content-Range'),'bytes */20');assert.equal(await unsatisfiable.text(),'');
 const head=await serveStreamedAsset(new Request('https://example.test/film',{method:'HEAD',headers:{Range:'bytes=1-2'}}),assets,20);assert.equal(head.status,200);assert.equal(head.headers.get('Content-Length'),'20');assert.equal(await head.text(),'');
 const full=await serveStreamedAsset(new Request('https://example.test/film',{headers:{Range:'bytes=1-2','If-Range':'"stale"'}}),assets,20);assert.equal(full.status,200);assert.deepEqual(new Uint8Array(await full.arrayBuffer()),bytes);
 const before=fetches,write=await serveStreamedAsset(new Request('https://example.test/film',{method:'POST'}),assets,20);assert.equal(write.status,405);assert.equal(fetches,before);assert.ok(cancelled>=1);
 const short=sliceAssetStream(new ReadableStream({start(c){c.enqueue(bytes.slice(0,2));c.close();}}),3,5);await assert.rejects(new Response(short).arrayBuffer(),/ended before/);
});
test('the Workers fixed-length path registers and settles its pipeline lifetime',async()=>{
 const original=globalThis.FixedLengthStream;const retained=[];
 globalThis.FixedLengthStream=class extends TransformStream{constructor(){super();}};
 try{
  const assets={fetch:async()=>new Response(Uint8Array.from([0,1,2,3,4,5]))};
  const response=await serveStreamedAsset(new Request('https://example.test/film',{headers:{Range:'bytes=2-4'}}),assets,6,p=>retained.push(p));
  assert.equal(retained.length,1);assert.equal(response.status,206);assert.deepEqual(new Uint8Array(await response.arrayBuffer()),Uint8Array.from([2,3,4]));await retained[0];
 }finally{if(original===undefined)delete globalThis.FixedLengthStream;else globalThis.FixedLengthStream=original;}
});
