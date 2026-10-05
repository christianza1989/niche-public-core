// Explicit original-URL to approved asset binding; no archive-derived guesses.
export function visibleMediaAlias(pkg, pages, aliases, pathname) {
  const matches=(aliases?.entries || []).filter(entry=>entry.siteId===pkg.siteId && entry.from===pathname);
  if(matches.length!==1)return null;
  const entry=matches[0];
  return pages.find(page=>page.id===entry.pageId)?.media.find(asset=>asset.id===entry.assetId)?.src || null;
}
