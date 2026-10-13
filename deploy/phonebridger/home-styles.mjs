import {createHash} from 'node:crypto';
// Preserve stylesheet order and URL meaning; do not change selectors or rules.
export function bundleHomeStyles(html,files){
 const links=[...html.matchAll(/<link\b(?=[^>]*\brel="stylesheet")(?=[^>]*\bhref="([^"]+)")[^>]*>/g)];
 if(!links.length)throw Error('Homepage styles are missing.');
 const chunks=[];
 for(const [tag,href] of links){
  if(/\b(?:media|disabled)\b/.test(tag)||!/^\/?[a-zA-Z0-9._/-]+\.css$/.test(href))throw Error('Review conditional or external homepage styles separately.');
  const file=href.replace(/^\//,''),bytes=files.get(file);if(!bytes)throw Error('Missing homepage stylesheet: '+file);
  const css=bytes.toString().replace(/url\(\s*(['"]?)([^)]+?)\1\s*\)/g,(original,quote,value)=>{
   if(/^(?:data:|https?:|\/|#)/.test(value))return original;
   const resolved=new URL(value,'https://assets.invalid/'+file);return `url("${resolved.pathname+resolved.search+resolved.hash}")`;
  });chunks.push('/* '+file+' */\n'+css);
 }
 const bytes=Buffer.from(chunks.join('\n')),file='assets/performance/home-styles-'+createHash('sha256').update(bytes).digest('hex').slice(0,12)+'.css';
 let first=true;html=html.replace(/<link\b(?=[^>]*\brel="stylesheet")(?=[^>]*\bhref="([^"]+)")[^>]*>/g,()=>{if(!first)return '';first=false;return '<link rel="stylesheet" href="/'+file+'">';});
 return {html,file,bytes,sources:links.map(x=>x[1])};
}
