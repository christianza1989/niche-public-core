/** @returns {Awaited<ReturnType<NonNullable<import('next').NextConfig['headers']>>>} */
export function hostingerAssetHeaders() {
 const headers=[{key:'Cache-Control',value:'public, max-age=31536000, immutable'}];
 return [
  {source:String.raw`/content-assets/:siteId/:name([0-9a-f-]{36}\.webp)`,headers},
  {source:String.raw`/fonts/:siteId/:name([^/]+\.woff2)`,has:[{type:'query',key:'v',value:'[a-f0-9]{12}'}],headers},
 ];
}
