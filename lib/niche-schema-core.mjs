// Caller supplies the authoritative public projection, never drafts/raw packages.
export function nicheBreadcrumbs(pkg, page, publicPages) {
  const trail = [{ name: pkg.site.name, path: '/' }];
  if (page.type === 'home') return trail;
  const hub = publicPages.find(p => p.slug === 'gidai');
  if (page.type === 'guide' && hub) trail.push({ name: 'Gidai', path: '/gidai' });
  trail.push({ name: page.title, path: page.slug ? `/${page.slug}` : '/' });
  return trail;
}
export function nicheEditorialIdentity(pkg, publicPages, operatorName) {
  const origin = `https://${pkg.canonicalHost}`;
  const profile = publicPages.find(p => p.slug === 'redakcija');
  return { '@type': 'Organization', '@id': `${origin}/#organization`, name: operatorName,
    url: profile ? `${origin}/redakcija` : `${origin}/`, email: pkg.site.contact.email };
}
export function nicheEditorialDates(page) {
  return { published: page.publishAt, modified: new Date(Math.max(Date.parse(page.publishAt), Date.parse(page.approval.approvedAt))).toISOString() };
}
export function nicheSchemaGraph(pkg, page, publicPages, operatorName) {
  const origin = `https://${pkg.canonicalHost}`;
  const url = `${origin}${page.slug ? `/${page.slug}` : '/'}`;
  const organization = nicheEditorialIdentity(pkg, publicPages, operatorName);
  const dates = nicheEditorialDates(page);
  const pageType = page.slug === 'redakcija' ? 'ProfilePage' : page.slug === 'apie-projekta' ? 'AboutPage' : page.slug === 'kontaktai' ? 'ContactPage' : 'WebPage';
  const graph = [organization,
    { '@type': 'WebSite', '@id': `${origin}/#website`, url: `${origin}/`, name: pkg.site.name,
      description: pkg.site.offer, inLanguage: pkg.locale, publisher: { '@id': organization['@id'] } },
    { '@type': pageType, '@id': `${url}#webpage`, url, name: page.title, description: page.description,
      inLanguage: pkg.locale, isPartOf: { '@id': `${origin}/#website` },
      ...(pageType === 'ProfilePage' ? { mainEntity: { '@id': organization['@id'] } } : {}) }
  ];
  if (page.type !== 'home') graph.push({ '@type': 'BreadcrumbList',
    itemListElement: nicheBreadcrumbs(pkg, page, publicPages).map((item, i) => ({ '@type': 'ListItem', position: i + 1, name: item.name, item: `${origin}${item.path}` })) });
  if (page.type === 'guide') graph.push({ '@type': 'Article', '@id': `${url}#article`, headline: page.title,
    description: page.description, inLanguage: pkg.locale, mainEntityOfPage: { '@id': `${url}#webpage` },
    datePublished: dates.published, dateModified: dates.modified, author: organization, publisher: organization,
    ...(page.media[0] ? { image: `${origin}${page.media[0].src}` } : {}) });
  // The editor's broad service bucket also holds informational utility pages.
  // Their public role is already defined above; a policy/index is not a service.
  const informationalSlugs = new Set(['gidai', 'kontaktai', 'apie-projekta', 'redakcija', 'privatumas', 'naudojimo-salygos']);
  if (page.type === 'service' && !informationalSlugs.has(page.slug)) graph.push({ '@type': 'Service', name: page.title, description: page.description, url, provider: organization });
  return { '@context': 'https://schema.org', '@graph': graph };
}
