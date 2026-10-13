import manifest from './memocasting-homepage-assets.json' with {type:'json'};
import {memoHomepageAdmitted,memoHomepageStory} from './memocasting-homepage-markup.mjs';
import {memoRoute} from './memocasting-locales.mjs';

// Always receive the shared, currently eligible projection, never raw pkg.pages.
export function memoHomepageAsset(pkg,eligiblePages,pathname){
 if(pkg?.siteId!=='memocasting'||!eligiblePages.some(memoHomepageAdmitted))return null;
 return manifest.assets.find(asset=>asset.path===pathname)??null;
}
export function memoHomepageProductStory(eligiblePages){
 const targets={PAIR:'products/liejimo-rinkinys-porai',FAMILY:'products/seimos-rinkinys-1'};
 return memoHomepageStory.replace(/<a([^>]*?)href="@@(PAIR|FAMILY)@@"([^>]*?)>([\s\S]*?)<\/a>/g,(_all,before,token,after,content)=>{
  const target=eligiblePages.find(page=>{const route=memoRoute(page);return route.language==='lt'&&route.baseSlug===targets[token];});
  if(!target)return '<span class="text-link">Rinkinys šiuo metu nerodomas.</span>';
  const path=('/'+target.slug).replaceAll('&','&amp;').replaceAll('"','&quot;').replaceAll('<','&lt;').replaceAll('>','&gt;');
  return `<a${before}href="${path}"${after}>${content}</a>`;
 });
}
