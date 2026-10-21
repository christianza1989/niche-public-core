import { uniqueImageFamilies } from './niche-media.mjs';

// Input is the authoritative public page projection, shared with the renderer.
// Keep private originals and another site's media out of public image indexes.
export function publicGalleryImageUrls(pkg, page) {
  if (page.siteId !== pkg.siteId) return [];
  const prefix = `/content-assets/${pkg.siteId}/`;
  return uniqueImageFamilies(page.media || []).flatMap(asset => {
    if (!asset.src?.startsWith(prefix) || !/^\/[a-zA-Z0-9/_\-.]+\.webp$/.test(asset.src) || asset.src.includes('..')) return [];
    return [`https://${pkg.canonicalHost}${asset.src}`];
  });
}

export function promedicalProductSchema(pkg, page, sku) {
  const images = publicGalleryImageUrls(pkg, page);
  return { '@context': 'https://schema.org', '@type': 'Product',
    name: page.title, sku, brand: { '@type': 'Brand', name: 'Klaro' },
    manufacturer: { '@type': 'Organization', name: 'Klaro, spol. s r.o.' },
    description: page.description, ...(images.length ? { image: images } : {}) };
}

const escapeXml = value => value.replace(/[<>&"']/g, character => ({ '<': '&lt;', '>': '&gt;', '&': '&amp;', '"': '&quot;', "'": '&apos;' })[character]);
export function galleryImageSitemapTags(pkg, page) {
  return publicGalleryImageUrls(pkg, page).map(url => `<image:image><image:loc>${escapeXml(url)}</image:loc></image:image>`).join('');
}
