import handler from 'vinext/server/fetch-handler';
import { contentPackageByHost, contentAdmissionScope, publicContentPages, contentHostedPreview } from './lib/content-model-v2';
import { contentFrameworkRequest, contentFrameworkResponse } from './lib/content-framework-request.mjs';
import { hostedPreviewRequest, hostedPreviewResponse, hostedPreviewAssetResponse, hostedInquiryRequest } from './lib/content-hosted-preview.mjs';

export default {
  ...handler,
  async fetch(request: Request, env: Cloudflare.Env, ctx: ExecutionContext) {
    const preview=contentHostedPreview(), denied=hostedPreviewRequest(request,preview);
    if(denied)return denied;
    const inquiryDenied=await hostedInquiryRequest(request,env,preview);
    if(inquiryDenied)return inquiryDenied;
    const asset=await hostedPreviewAssetResponse(request,env.ASSETS,preview);
    if(asset)return asset;
    const pkg=contentPackageByHost(request.headers.get('host'));
    const adapted=contentFrameworkRequest(request,pkg,pkg?contentAdmissionScope(pkg):null);
    if(adapted instanceof Response)return hostedPreviewResponse(adapted,preview);
    const response=await handler.fetch(adapted,env,ctx);
    return hostedPreviewResponse(contentFrameworkResponse(request,pkg,pkg&&response.status>=300&&response.status<400?publicContentPages(pkg):[],response),preview);
  },
};
