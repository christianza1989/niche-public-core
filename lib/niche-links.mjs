import {memoInstructionDocument} from './memocasting-instruction-documents.mjs';

// One projection feeds HTML, JSON-LD, sitemap and LLM routes. Raw approved bytes
// are unchanged; only eligible links/media may appear in a public response.
export const dueRevision = (page, now) => page.approval?.status === 'approved'
  && page.approval.revisionHash === page.revisionHash && Date.parse(page.publishAt) <= now;
export function validateGuidePublicationPauses(settings, packages) {
  const pauses = settings.guidePublicationPausedAtBySite;
  if (pauses === undefined) return;
  if (!pauses || typeof pauses !== 'object' || Array.isArray(pauses)) throw new Error('Invalid guide publication pauses');
  for (const [siteId, pausedAt] of Object.entries(pauses)) {
    if (!packages.some(pkg => pkg.siteId === siteId && pkg.schemaVersion === 1)) throw new Error(`Unknown guide publication pause site: ${siteId}`);
    if (typeof pausedAt !== 'string' || !Number.isFinite(Date.parse(pausedAt)) || new Date(pausedAt).toISOString() !== pausedAt) throw new Error(`Invalid guide publication pause time: ${siteId}`);
  }
}

export function projectPublicPages(pkg, packages, settings, now = Date.now()) {
  const owned = new Set([...(settings.networkDomains || []), ...(settings.ownedAliases || []), ...packages.map(item => item.canonicalHost)]);
  const deployed = new Set(settings.networkLiveDomains || []);
  validateGuidePublicationPauses(settings, packages);
  const isPublic = (site, page) => {
    const cutoff = settings.guidePublicationPausedAtBySite?.[site.siteId];
    return dueRevision(page, page.type === 'guide' && cutoff !== undefined ? Math.min(now, Date.parse(cutoff)) : now);
  };
  const live = pkg.pages.filter(page => isPublic(pkg, page));
  const ids = new Set(live.map(page => page.id));
  const eligible = url => {
    let parsed; try { parsed = new URL(url); } catch { return false; }
    if (parsed.protocol !== 'https:' || parsed.username || parsed.password || parsed.port) return false;
    if (!owned.has(parsed.hostname)) return true;
    const target = packages.find(item => item.canonicalHost === parsed.hostname);
    if (!target || target.siteId !== pkg.siteId && !deployed.has(parsed.hostname)) return false;
    if (!parsed.search && !parsed.hash && memoInstructionDocument(target, target.pages.filter(page => isPublic(target, page)), parsed.pathname)) return true;
    return target.pages.some(page => isPublic(target, page) && new URL(`/${page.slug}`, `https://${target.canonicalHost}`).href === parsed.href);
  };
  return live.map(page => ({ ...page, links: page.links.filter(link => ids.has(link.targetPageId)),
    ...(page.externalLinks ? { externalLinks: page.externalLinks.filter(link => eligible(link.url)) } : {}) }));
}

// Contextual anchors may use several labels for the same destination. For a
// related-content list, keep the first link to each eligible target only; do
// not change the source links used to resolve prose.
export function uniqueRelatedLinks(links, livePages) {
  const seen = new Set();
  const related = [];
  for (const link of links) {
    const page = livePages.find(item => item.id === link.targetPageId);
    if (!page || seen.has(page.id)) continue;
    seen.add(page.id);
    related.push({page, label:link.label});
  }
  return related;
}

// Exact approved labels, with word boundaries and longest match first.
// No HTML/Markdown parsing; callers render ordinary escaped text and native <a>.
export function contextualParts(text, links) {
  const candidates = links.filter(link => link.label?.trim() && link.href && /^(https:\/\/|\/(?!\/))/.test(link.href))
    .sort((a, b) => b.label.length - a.label.length);
  const result = []; const used = new Set(); let position = 0;
  const letter = value => /[\p{L}\p{N}]/u.test(value || '');
  while (position < text.length) {
    let best;
    for (const link of candidates) {
      if (used.has(link.href)) continue;
      let at = text.indexOf(link.label, position);
      while (at >= 0 && (letter(text[at - 1]) && letter(link.label[0]) || letter(text[at + link.label.length]) && letter(link.label.at(-1)))) at = text.indexOf(link.label, at + 1);
      if (at >= 0 && (!best || at < best.at)) best = { at, link };
    }
    if (!best) { result.push({ text: text.slice(position) }); break; }
    if (best.at > position) result.push({ text: text.slice(position, best.at) });
    result.push({ text: best.link.label, href: best.link.href }); used.add(best.link.href);
    position = best.at + best.link.label.length;
  }
  return result;
}
