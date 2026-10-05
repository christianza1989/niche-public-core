// Call only with the site's authoritative eligible page media. Variants share
// descriptive alt and aspect ratio; use distinct alt for distinct compositions.
export function responsiveImageVariants(media, asset) {
  const widths = new Set();
  return media.filter(item => item.alt === asset.alt && Math.abs(item.width / item.height - asset.width / asset.height) < .01)
    .sort((a,b) => a.width-b.width).filter(item => { if(widths.has(item.width))return false; widths.add(item.width);return true; });
}
export function imageSrcSet(media, asset) {
  return responsiveImageVariants(media,asset).map(item=>`${item.src} ${item.width}w`).join(', ');
}
// Original generator provenance belongs to the editorial/source ledger.
// Preserve ordinary third-party credit; removing a generator badge is not
// permission to remove a photograph's licence-required attribution.
export function visibleImageCredit(asset) {
  return /\bImageGen\b/i.test(asset.credit || '') ? undefined : asset.credit || undefined;
}
