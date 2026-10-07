import { visibleContentTextV2 } from './content-projection-v2.mjs';
const xml = text => String(text).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&apos;'}[c]));
const md = text => String(text).replace(/\s+/g,' ').replace(/[\\[\]]/g,'\\$&');
// This helper consumes projected pages only. It does not decide publication,
// invent dates, mutate approvals or maintain a separate static index.
export function contentReadingV2(pkg,pages,full=false){
  const byId=new Map(pages.map(p=>[p.id,p]));
  const pageText=p=>[
    `## ${p.title}`,`URL: ${p.url}`,p.description,
    ...(p.editorial.datePublished?[`Publikavimo data: ${p.editorial.datePublished}`]:[]),
    ...(p.editorial.dateModified?[`Turinio atnaujinimo data: ${p.editorial.dateModified}`]:[]),
    ...p.editorial.authors.flatMap(a=>{
      const profiles=pages.filter(p=>p.type==='author'&&p.editorial.authors.some(identity=>identity.id===a.id));
      return profiles.length===1?[`Autoriaus profilis: [${md(a.name)}](${profiles[0].url})`]:[];
    }),
    visibleContentTextV2(p),
    ...(p.links||[]).flatMap(link=>{const target=byId.get(link.targetPageId);return target?[`Susijęs atsakymas: [${md(link.label)}](${target.url})`]:[];}),
    ...(p.externalLinks||[]).map(link=>`Šaltinis: [${md(link.label)}](${link.url}) — ${link.reason}`),
  ].filter(Boolean).join('\n\n');
  return [`# ${pkg.site.name}`,`> ${md(pkg.site.offer)}`,`Kontaktas: ${pkg.site.contact.email}`,
    ...(!full?[`Išsamus patvirtinto turinio tekstas: [llms-full.txt](https://${pkg.canonicalHost}/llms-full.txt)`,'## Puslapiai']:[]),
    pages.map(p=>full?pageText(p):`- [${md(p.title)}](${p.url}): ${md(p.description)}`).join('\n\n'),
  ].join('\n\n')+'\n';
}
export function contentSeoV2(pkg, pages, kind, preview = false) {
  const origin = `https://${pkg.canonicalHost}`;
  if (kind === 'robots') return { type:'text/plain; charset=utf-8', body:preview ? 'User-agent: *\nDisallow: /\n' : `User-agent: *\nAllow: /\nDisallow: /api/\nDisallow: /gift/\nDisallow: /niche/\nDisallow: /uzklausa\nDisallow: /ivykius\nDisallow: /pokalbis/\nSitemap: ${origin}/sitemap.xml\n` };
  if (kind === 'sitemap') return { type:'application/xml; charset=utf-8', body:`<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${pages.map(p=>`<url><loc>${xml(p.url)}</loc>${p.editorial.dateModified ? `<lastmod>${xml(p.editorial.dateModified)}</lastmod>` : ''}</url>`).join('')}</urlset>` };
  if (kind === 'llms' || kind === 'llms-full') return { type:'text/markdown; charset=utf-8', body:contentReadingV2(pkg,pages,kind==='llms-full') };
  if (kind === 'favicon') return { type:'image/svg+xml', body:`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><rect width="64" height="64" rx="14" fill="${xml(pkg.site.brand.accent)}"/><path fill="none" stroke="white" stroke-width="4" d="M15 29h34v23H15zM11 22h42v8H11zM32 22v30M32 22c-19 0-17-17-9-13 5 2 9 13 9 13s4-11 9-13c8-4 10 13-9 13"/></svg>` };
  return null;
}
