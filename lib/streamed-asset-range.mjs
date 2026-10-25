// A bounded HTTP byte-range adapter for immutable assets. Never buffers a whole
// media file. Callers own admission and the verified manifest's byte length.
export function parseByteRange(value,size){
 const match=/^bytes=(\d*)-(\d*)$/.exec(value||'');
 if(!match||(!match[1]&&!match[2]))return null;
 let start,end;
 if(!match[1]){const suffix=Number(match[2]);if(!Number.isSafeInteger(suffix)||suffix<=0)return false;start=Math.max(0,size-suffix);end=size-1;}
 else{start=Number(match[1]);end=match[2]?Number(match[2]):size-1;if(!Number.isSafeInteger(start)||!Number.isSafeInteger(end)||start>=size||end<start)return false;end=Math.min(end,size-1);}
 return {start,end};
}
export function sliceAssetStream(body,start,end){
 const reader=body.getReader();let offset=0,finished=false;
 return new ReadableStream({
  async pull(controller){try{while(!finished){const {value,done}=await reader.read();if(done){finished=true;controller.error(new Error('Asset ended before requested interval'));return;}const chunkStart=offset;offset+=value.byteLength;if(offset<=start)continue;const from=Math.max(0,start-chunkStart),to=Math.min(value.byteLength,end+1-chunkStart);if(to>from)controller.enqueue(value.subarray(from,to));if(offset>end){finished=true;await reader.cancel();controller.close();}return;}}catch(error){finished=true;controller.error(error);}},
  async cancel(reason){finished=true;await reader.cancel(reason);}
 });
}
export async function serveStreamedAsset(request,assets,size,retainPipeline){
 if(!['GET','HEAD'].includes(request.method))return new Response('Method not allowed',{status:405,headers:{Allow:'GET, HEAD'}});
 const sourceHeaders=new Headers(request.headers);sourceHeaders.delete('Range');sourceHeaders.delete('If-Range');sourceHeaders.set('Accept-Encoding','identity');
 const source=await assets.fetch(new Request(request,{headers:sourceHeaders}));
 if(source.status!==200||source.headers.has('Content-Encoding'))return source;
 const headers=new Headers(source.headers);headers.set('Accept-Ranges','bytes');
 headers.set('Cache-Control','private, no-store, no-transform');
 const ifRange=request.headers.get('If-Range'),matches=!ifRange||ifRange===headers.get('ETag')||ifRange===headers.get('Last-Modified');
 const interval=request.method==='GET'&&matches?parseByteRange(request.headers.get('Range'),size):null;
 if(request.method==='HEAD'){await source.body?.cancel();headers.set('Content-Length',String(size));return new Response(null,{status:200,headers});}
 if(interval===null)return new Response(source.body,{status:200,headers});
 if(interval===false){await source.body?.cancel();headers.set('Content-Range',`bytes */${size}`);headers.set('Content-Length','0');return new Response(null,{status:416,headers});}
 const {start,end}=interval;headers.set('Content-Range',`bytes ${start}-${end}/${size}`);headers.set('Content-Length',String(end-start+1));
 const slice=sliceAssetStream(source.body,start,end);
 // Workers needs its native fixed-length stream to emit the exact length.
 // Node tests consume the same streamed slice without this runtime extension.
 if(typeof FixedLengthStream==='function'){
  const fixed=new FixedLengthStream(end-start+1);
  const pipeline=slice.pipeTo(fixed.writable).catch(()=>{});
  if(retainPipeline)retainPipeline(pipeline);
  return new Response(fixed.readable,{status:206,headers});
 }
 return new Response(slice,{status:206,headers});
}
