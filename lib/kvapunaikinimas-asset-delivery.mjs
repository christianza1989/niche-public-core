export function kvapunaikinimasDeliverySrc(src,nodeTarget) {
 if(!nodeTarget)return src;
 const media=src.match(/^\/content-assets\/kvapunaikinimas\/([a-f0-9-]{36}\.webp)$/);
 if(media)return '/_next/static/niche-assets/kvapunaikinimas/'+media[1];
 const font=src.match(/^\/fonts\/kvapunaikinimas\/([a-z-]+)\.woff2\?v=([a-f0-9]{12})$/);
 return font?`/_next/static/niche-assets/kvapunaikinimas/${font[1]}-${font[2]}.woff2`:src;
}

// Only the isolated export uses Next static paths; Workers CSS stays canonical.
export function kvapunaikinimasDeliveryCss(css) {
 return css.replaceAll(/\/fonts\/kvapunaikinimas\/[a-z-]+\.woff2\?v=[a-f0-9]{12}/g,src=>kvapunaikinimasDeliverySrc(src,true));
}
