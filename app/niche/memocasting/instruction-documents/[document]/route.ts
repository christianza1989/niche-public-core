import {env,waitUntil} from 'cloudflare:workers';
import {nicheSiteByHost,publicNichePages} from '@/lib/niche-sites';
import {serveMemoInstructionDocument} from '@/lib/memocasting-instruction-documents.mjs';

export const dynamic='force-dynamic';

async function serve(request:Request,{params}:{params:Promise<{document:string}>}){
 const pkg=nicheSiteByHost(request.headers.get('host'));
 const {document}=await params;
 return serveMemoInstructionDocument(request,{
  pkg,eligiblePages:pkg?publicNichePages(pkg):[],pathname:'/dokumentai/'+document,
  assets:env.ASSETS,retainPipeline:waitUntil,
 });
}
export const GET=serve;
export const HEAD=serve;
