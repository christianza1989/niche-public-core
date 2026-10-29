import handler from 'vinext/server/fetch-handler';
import { contentPackageByHost, contentAdmissionScope } from './lib/content-model-v2';
import { contentFrameworkRequest } from './lib/content-framework-request.mjs';

export default {
  ...handler,
  async fetch(request: Request, env: Cloudflare.Env, ctx: ExecutionContext) {
    const pkg=contentPackageByHost(request.headers.get('host'));
    const adapted=contentFrameworkRequest(request,pkg,pkg?contentAdmissionScope(pkg):null);
    if(adapted instanceof Response)return adapted;
    return handler.fetch(adapted,env,ctx);
  },
};
