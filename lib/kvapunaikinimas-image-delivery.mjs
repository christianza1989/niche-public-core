// Delivery transforms preserve the approved original and its immutable URL.
// Native high-DPI resolution remains available; only the transferred encoding
// and the 1x candidate change on the explicit Next/Node target.
export function kvapunaikinimasImageSrcSet(asset, nodeTarget) {
 if(!nodeTarget||!/^\/content-assets\/kvapunaikinimas\/[a-f0-9-]{36}\.webp$/.test(asset.src)||asset.width!==500||asset.height!==500)return undefined;
 // Next16 internal image requests omit Host. Use the narrowly allowlisted public
 // source so the existing tenant/publication guard remains fully enforced.
 const source='https://kvapunaikinimas.lt'+asset.src;
 return [300,500].map(width=>`/_next/image?url=${encodeURIComponent(source)}&w=${width}&q=85 ${width}w`).join(', ');
}
