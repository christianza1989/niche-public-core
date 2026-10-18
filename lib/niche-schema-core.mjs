import {pageLanguage,pageRole,localizedRolePage,languagePath,pageLanguageKey} from './niche-languages.mjs';
// Caller supplies the authoritative public projection, never drafts/raw packages.
export function nicheBreadcrumbs(pkg, page, publicPages) {
  const trail = [{ name: pkg.site.name, path: languagePath(pkg,'home',pageLanguageKey(pkg,page))||'/' }];
  if (page.type === 'home'||pageRole(pkg,page)==='home') return trail;
  const hub = localizedRolePage(pkg,'guides',page,publicPages);
  if (page.type === 'guide' && hub) trail.push({ name: hub.title, path: `/${hub.slug}` });
  if(page.type==='product'){const parent=publicPages.filter(p=>['tubs','saunas'].includes(pageRole(pkg,p))&&page.slug.startsWith(p.slug+'/')).sort((a,b)=>b.slug.length-a.slug.length)[0];if(parent)trail.push({name:parent.title,path:`/${parent.slug}`});}
  trail.push({ name: page.title, path: page.slug ? `/${page.slug}` : '/' });
  return trail;
}
export function nicheEditorialIdentity(pkg, publicPages, operatorName, page) {
  const origin = `https://${pkg.canonicalHost}`;
  const profile = page?localizedRolePage(pkg,'profile',page,publicPages):publicPages.find(p => p.slug === 'redakcija');
  return { '@type': 'Organization', '@id': `${origin}/#organization`, name: operatorName,
    url: profile ? `${origin}/${profile.slug}` : `${origin}/`, email: pkg.site.contact.email };
}
export function nicheEditorialDates(page) {
  return { published: page.publishAt, modified: new Date(Math.max(Date.parse(page.publishAt), Date.parse(page.approval.approvedAt))).toISOString() };
}
export function nicheSchemaGraph(pkg, page, publicPages, operatorName) {
  const origin = `https://${pkg.canonicalHost}`;
  const url = `${origin}${page.slug ? `/${page.slug}` : '/'}`;
  const organization = nicheEditorialIdentity(pkg, publicPages, operatorName,page);
  const locale=pageLanguage(pkg,page),role=pageRole(pkg,page);
  const dates = nicheEditorialDates(page);
  const pageType = ['guides','catalogue','tubs','saunas'].includes(role) ? 'CollectionPage' : role === 'profile' ? 'ProfilePage' : role === 'about' ? 'AboutPage' : role === 'contact' ? 'ContactPage' : 'WebPage';
  const collectionPages=publicPages.filter(p=>pageLanguage(pkg,p)===locale&&(role==='guides'?p.type==='guide':p.type==='product'&&(!['tubs','saunas'].includes(role)||p.slug.startsWith(page.slug+'/'))));
  const graph = [organization,
    { '@type': 'WebSite', '@id': `${origin}/#website`, url: `${origin}/`, name: pkg.site.name,
      description: pkg.site.offer, inLanguage: pkg.locale, publisher: { '@id': organization['@id'] } },
    { '@type': pageType, '@id': `${url}#webpage`, url, name: page.title, description: page.description,
      inLanguage: locale, isPartOf: { '@id': `${origin}/#website` },
      ...(pageType === 'ProfilePage' ? { mainEntity: { '@id': organization['@id'] } } : {}),
      ...(pageType === 'CollectionPage' ? { hasPart: collectionPages.map(p=>({ '@type':'WebPage',name:p.title,url:`${origin}/${p.slug}` })) } : {}) }
  ];
  if (page.type !== 'home'&&role!=='home') graph.push({ '@type': 'BreadcrumbList',
    itemListElement: nicheBreadcrumbs(pkg, page, publicPages).map((item, i) => ({ '@type': 'ListItem', position: i + 1, name: item.name, item: `${origin}${item.path}` })) });
  if (page.type === 'guide') graph.push({ '@type': 'Article', '@id': `${url}#article`, headline: page.title,
    description: page.description, inLanguage: locale, mainEntityOfPage: { '@id': `${url}#webpage` },
    datePublished: dates.published, dateModified: dates.modified, author: organization, publisher: organization,
    ...(page.media[0] ? { image: `${origin}${page.media[0].src}` } : {}) });
  // The editor's broad service bucket also holds informational utility pages.
  // Their public role is already defined above; a policy/index is not a service.
  const informationalSlugs = new Set(['gidai', 'kontaktai', 'apie-projekta', 'redakcija', 'privatumas', 'naudojimo-salygos']);
  if (page.type === 'service' && !role && !informationalSlugs.has(page.slug)) graph.push({ '@type': 'Service', name: page.title, description: page.description, url, provider: organization });
  return { '@context': 'https://schema.org', '@graph': graph };
}
