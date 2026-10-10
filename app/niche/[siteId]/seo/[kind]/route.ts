import { headers } from 'next/headers';
import { contentPackageByHost, publicContentPages, localContentAdmission } from '@/lib/content-model-v2';
import { contentSeoV2 } from '@/lib/content-seo-v2.mjs';
export const dynamic = 'force-dynamic';
export const revalidate = 0;
export async function GET(_request: Request, { params }: { params: Promise<{siteId:string;kind:string}> }) {
  const {siteId,kind} = await params;
  const host = (await headers()).get('host');
  const pkg = contentPackageByHost(host);
  if(!pkg || pkg.siteId !== siteId || pkg.site.renderer !== 'niche') return new Response('Not found',{status:404});
  const pages = publicContentPages(pkg);
  if(!pages.some(p=>p.slug===''&&p.type==='home')) return new Response('Not found',{status:404});
  const preview = localContentAdmission(pkg) || /^(localhost|127\.0\.0\.1)(:\d+)?$/.test(host || '') || (host || '').endsWith('.vercel.app');
  const result = contentSeoV2(pkg,pages,kind,preview);
  if(!result) return new Response('Not found',{status:404});
  return new Response(result.body,{headers:{'Content-Type':result.type,'Cache-Control':'private, no-store','X-Content-Type-Options':'nosniff',...(preview?{'X-Robots-Tag':'noindex, nofollow'}:{})}});
}
