import manifest from './memocasting-homepage-assets.json' with {type:'json'};
import {memoHomepageAdmitted,memoHomepageStory} from './memocasting-homepage-markup.mjs';
import {memoRoute} from './memocasting-locales.mjs';

// Always receive the shared, currently eligible projection, never raw pkg.pages.
export function memoHomepageAsset(pkg,eligiblePages,pathname){
 if(pkg?.siteId!=='memocasting'||!eligiblePages.some(memoHomepageAdmitted))return null;
 return manifest.assets.find(asset=>asset.path===pathname)??null;
}
export function memoHomepageProductStory(eligiblePages){
 const targets={PAIR:'products/liejimo-rinkinys-porai',FAMILY:'products/seimos-rinkinys-1',INSTRUCTION:'pages/instrukcija',HELP:'pagalba',FINISHING:'gidai/liejinio-dazymas-ir-prieziura',DELIVERY:'pristatymas',RETURNS:'grazinimas',CONTACT:'kontaktai'};
 // Owner-selected replacement illustration; retain the approved text/body and
 // original cutout assets so this presentation change can be reverted alone.
 const mediaStory=memoHomepageStory.replaceAll('/media/asset-kit/family-alpha-v2-','/media/asset-kit/family-reference-white-v1-');
 return mediaStory.replace(/<a([^>]*?)href="@@([A-Z]+)@@"([^>]*?)>([\s\S]*?)<\/a>/g,(_all,before,token,after,content)=>{
  const target=eligiblePages.find(page=>{const route=memoRoute(page);return route.language==='lt'&&route.baseSlug===targets[token];});
  if(!target)return '<span class="text-link">'+(token==='PAIR'||token==='FAMILY'?'Rinkinys šiuo metu nerodomas.':'Informacija šiuo metu nerodoma.')+'</span>';
  const path=('/'+target.slug).replaceAll('&','&amp;').replaceAll('"','&quot;').replaceAll('<','&lt;').replaceAll('>','&gt;');
  return `<a${before}href="${path}"${after}>${content}</a>`;
 });
}
