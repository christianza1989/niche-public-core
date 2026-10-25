// Catalog originals stay unchanged for the main image and zoom. The commerce
// API authorizes this derivative against the published original on every read.
export function catalogThumbnailUrl(src) {
  return /^\/prekyba\/catalog-media\/img_[a-f0-9]{64}$/.test(src)
    ? src + '?size=192' : src;
}
