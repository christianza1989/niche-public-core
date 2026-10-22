// Call only with the site's authoritative eligible page media. New imports carry
// immutable familyId; the alt/aspect fallback preserves old approved packages.
const sameAspect = (a,b) => Math.abs(a.width / a.height - b.width / b.height) < .01;
const sameFamily = (a,b) => a.familyId || b.familyId
  ? Boolean(a.familyId) && a.familyId === b.familyId
  : a.alt === b.alt && sameAspect(a,b);
export function imageFamilyKey(asset) {
  return asset.familyId ? `family:${asset.familyId}` : `legacy:${asset.alt}:${Math.round(asset.width / asset.height * 100)}`;
}
// First-family order is significant: the first composition remains the primary.
// Keep the largest representative without making low-resolution thumbnails the
// source of Product.image, sitemap entries or the enlargement link.
export function uniqueImageFamilies(media) {
  const representatives=[];
  for(const asset of media) {
    const index=representatives.findIndex(item=>sameFamily(item,asset));
    if(index===-1) representatives.push(asset);
    else if(asset.width>representatives[index].width) representatives[index]=asset;
  }
  return representatives;
}
export function responsiveImageVariants(media, asset) {
  const widths = new Set();
  return media.filter(item => sameFamily(item,asset))
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
