// Explicit withdrawals keep immutable approved packages intact. Compile-time
// identity/path checks guard configuration; runtime edits cannot republish IDs.
export function validatePageWithdrawals(settings, packages) {
  const sites = settings.pageWithdrawalsBySite;
  if (sites === undefined) return;
  if (!sites || typeof sites !== 'object' || Array.isArray(sites)) throw Error('Invalid page withdrawals');
  for (const [siteId, rule] of Object.entries(sites)) {
    const pkg = packages.find(p => p.siteId === siteId && p.schemaVersion === 1);
    const destination = pkg?.pages.find(p => p.id === rule?.targetPageId);
    if (!pkg || siteId !== 'promedical' || rule?.canonicalHost !== pkg.canonicalHost
      || rule.redirectTo !== '/produktai' || destination?.slug !== 'produktai' || destination.type !== 'service'
      || !Array.isArray(rule.pages) || !rule.pages.length) throw Error('Invalid withdrawal site: ' + siteId);
    const seen = new Set();
    for (const entry of rule.pages) {
      const page = pkg.pages.find(p => p.id === entry.pageId);
      if (!page || page.type !== 'faq' || page.siteId !== siteId || entry.path !== '/' + page.slug
        || !/^\/kategorijos\/[a-z0-9]+(?:[-/][a-z0-9]+)*$/.test(entry.path)
        || seen.has(entry.pageId) || seen.has(entry.path)) throw Error('Invalid withdrawal page: ' + entry.pageId);
      seen.add(entry.pageId); seen.add(entry.path);
    }
  }
}

export function withdrawnPage(pkg, page, settings) {
  const rule = settings.pageWithdrawalsBySite?.[pkg.siteId];
  return !!rule && rule.canonicalHost === pkg.canonicalHost
    && rule.pages.some(entry => entry.pageId === page.id);
}

export function pageWithdrawalDestination(pkg, settings, aliasIndex, getPublicPages, pathname, search = '') {
  const rule = settings.pageWithdrawalsBySite?.[pkg.siteId];
  if (!rule || rule.canonicalHost !== pkg.canonicalHost) return null;
  const paths = new Set(rule.pages.map(p => p.path));
  const ids = new Set(rule.pages.map(p => p.pageId));
  const aliases = aliasIndex.get(pkg.siteId);
  const matches = path => paths.has(path) || (aliases?.canonicalHost === pkg.canonicalHost && ids.has(aliases.byFrom.get(path)?.targetPageId));
  const path = pathname.replace(/\/$/u, ''), params = new URLSearchParams(search);
  const direct = matches(path);
  const category = path === '/produktai' && params.getAll('category').some(value => matches('/kategorijos/' + value));
  if (!direct && !category) return null;
  const pages = getPublicPages();
  if (!pages.some(p => p.type === 'home' && p.slug === '' && p.siteId === pkg.siteId)) return null;
  if (!pages.some(p => p.id === rule.targetPageId && p.siteId === pkg.siteId && '/' + p.slug === rule.redirectTo)) return null;
  if (category || params.getAll('category').some(value => matches('/kategorijos/' + value))) { params.delete('category'); params.delete('p'); }
  return rule.redirectTo + (params.size ? '?' + params.toString() : '');
}
