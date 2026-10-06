import { nicheEditorialDates } from './niche-schema-core.mjs';

// Pure formatting only. Callers must supply the authoritative public projection.
export const nichePageUrlCore = (pkg, page) => `https://${pkg.canonicalHost}${page.slug ? `/${page.slug}` : '/'}`;
const wording = pkg => /^en(?:-|$)/i.test(pkg.locale) ? {
  pages:'Published pages', contact:'Contact', full:'Full approved content',
  intro:'Only currently eligible pages are included below. A separately designed homepage is supplemented by its public HTML.',
  author:'Author', method:'text prepared with AI using the cited sources.', published:'Publication date', modified:'Content review', related:'Related answer', source:'Source'
} : {
  pages:'Publikuoti puslapiai', contact:'Kontaktai', full:'Išplėstas patvirtinto turinio sąrašas',
  intro:'Toliau pateikiami tik šiuo metu vieši puslapiai. Kai pagrindinis puslapis turi atskirą dizaino šabloną, jo santrauką papildo viešas HTML.',
  author:'Autorius', method:'tekstas rengtas su AI pagal nurodytus šaltinius.', published:'Publikavimo data', modified:'Turinio peržiūra', related:'Susijęs atsakymas', source:'Šaltinis'
};
export function nicheRobotsTextCore(pkg, preview, hasHomepage) {
  if (preview || !hasHomepage) return 'User-agent: *\nDisallow: /\n';
  return `User-agent: *\nAllow: /\nDisallow: /api/\nDisallow: /uzklausa\nSitemap: https://${pkg.canonicalHost}/sitemap.xml\n`;
}
const escapeXml = value => value.replace(/[<>&"']/g, character => ({'<':'&lt;','>':'&gt;','&':'&amp;','"':'&quot;',"'":'&apos;'})[character]);
export function nicheSitemapXmlCore(pkg, pages) {
  const entries=pages.map(page=>`<url><loc>${escapeXml(nichePageUrlCore(pkg,page))}</loc><lastmod>${escapeXml(nicheEditorialDates(page).modified)}</lastmod></url>`).join('');
  return `<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${entries}</urlset>`;
}
const blockText = block => block.type === 'paragraph' ? block.text : block.type === 'heading' ? `${'#'.repeat(block.level)} ${block.text}` : block.type === 'list' ? block.items.map(item=>`- ${item}`).join('\n') : '';
export function nicheLlmsIndexCore(pkg, pages) {
  const words=wording(pkg);
  return [`# ${pkg.site.name}`,`> ${pkg.site.offer}`,'',`## ${words.pages}`,
    ...pages.map(page=>`- [${page.title}](${nichePageUrlCore(pkg,page)}): ${page.description}`),'',
    `${words.contact}: ${pkg.site.contact.email}${pkg.site.contact.phone ? `, ${pkg.site.contact.phone}` : ''}`,
    `${words.full}: https://${pkg.canonicalHost}/llms-full.txt`].join('\n');
}
export function nicheLlmsFullCore(pkg, pages, operatorName) {
  const words=wording(pkg),byId=new Map(pages.map(page=>[page.id,page]));
  return [`# ${pkg.site.name}`,`> ${pkg.site.offer}`,'',words.intro,
    ...pages.map(page=>['',`## ${page.title}`,`URL: ${nichePageUrlCore(pkg,page)}`,page.description,
      ...(page.type==='guide'?[`${words.author}: ${operatorName}; ${words.method}`,`${words.published}: ${nicheEditorialDates(page).published}`,`${words.modified}: ${nicheEditorialDates(page).modified}`]:[]),
      ...(page.type==='home'&&pkg.siteId!=='traktoriupadangos'?[]:['',...page.body.map(blockText).filter(Boolean)]),
      ...page.links.flatMap(link=>{const target=byId.get(link.targetPageId);return target?[`${words.related}: [${link.label}](${nichePageUrlCore(pkg,target)})`]:[];}),
      ...(page.externalLinks??[]).map(link=>`${words.source}: [${link.label}](${link.url}) — ${link.reason}`)].join('\n'))].join('\n');
}
