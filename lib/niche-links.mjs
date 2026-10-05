// One projection feeds HTML, JSON-LD, sitemap and LLM routes. Raw approved bytes
// are unchanged; only eligible links/media may appear in a public response.
export const dueRevision = (page, now) => page.approval?.status === 'approved'
  && page.approval.revisionHash === page.revisionHash && Date.parse(page.publishAt) <= now;
export function projectPublicPages(pkg, packages, settings, now = Date.now()) {
  const owned = new Set([...(settings.networkDomains || []), ...(settings.ownedAliases || []), ...packages.map(item => item.canonicalHost)]);
  const deployed = new Set(settings.networkLiveDomains || []);
  const live = pkg.pages.filter(page => dueRevision(page, now));
  const ids = new Set(live.map(page => page.id));
  const eligible = url => {
    let parsed; try { parsed = new URL(url); } catch { return false; }
    if (parsed.protocol !== 'https:' || parsed.username || parsed.password || parsed.port) return false;
    if (!owned.has(parsed.hostname)) return true;
    const target = packages.find(item => item.canonicalHost === parsed.hostname);
    if (!target || target.siteId !== pkg.siteId && !deployed.has(parsed.hostname)) return false;
    return target.pages.some(page => dueRevision(page, now) && new URL(`/${page.slug}`, `https://${target.canonicalHost}`).href === parsed.href);
  };
  return live.map(page => ({ ...page, links: page.links.filter(link => ids.has(link.targetPageId)),
    ...(page.externalLinks ? { externalLinks: page.externalLinks.filter(link => eligible(link.url)) } : {}) }));
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
