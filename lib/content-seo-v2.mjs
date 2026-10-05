import { visibleContentTextV2 } from './content-projection-v2.mjs';
const xml = text => String(text).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&apos;'}[c]));
export function contentSeoV2(pkg, pages, kind, preview = false) {
  const origin = `https://${pkg.canonicalHost}`;
  if (kind === 'robots') return { type:'text/plain; charset=utf-8', body:preview ? 'User-agent: *\nDisallow: /\n' : `User-agent: *\nAllow: /\nDisallow: /api/\nDisallow: /gift/\nDisallow: /niche/\nDisallow: /uzklausa\nDisallow: /ivykius\nDisallow: /pokalbis/\nSitemap: ${origin}/sitemap.xml\n` };
  if (kind === 'sitemap') return { type:'application/xml; charset=utf-8', body:`<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${pages.map(p=>`<url><loc>${xml(p.url)}</loc>${p.editorial.dateModified ? `<lastmod>${xml(p.editorial.dateModified)}</lastmod>` : ''}</url>`).join('')}</urlset>` };
  if (kind === 'llms' || kind === 'llms-full') return { type:'text/markdown; charset=utf-8', body:`# ${pkg.site.name}\n\n${pkg.site.offer}\n\nKontaktas: ${pkg.site.contact.email}\n\n${pages.map(p=>kind==='llms' ? `- [${p.title}](${p.url}): ${p.description}` : `## ${p.title}\n\nURL: ${p.url}\n\n${p.description}\n\n${visibleContentTextV2(p)}`).join('\n\n')}\n` };
  if (kind === 'favicon') return { type:'image/svg+xml', body:`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><rect width="64" height="64" rx="14" fill="${xml(pkg.site.brand.accent)}"/><path fill="none" stroke="white" stroke-width="4" d="M15 29h34v23H15zM11 22h42v8H11zM32 22v30M32 22c-19 0-17-17-9-13 5 2 9 13 9 13s4-11 9-13c8-4 10 13-9 13"/></svg>` };
  return null;
}
