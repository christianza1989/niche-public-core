import manifest from './memocasting-homepage-assets.json' with {type:'json'};
import {memoHomepageAdmitted,memoHomepageStory} from './memocasting-homepage-markup.mjs';
import {memoRoute} from './memocasting-locales.mjs';
import {imageSrcSet} from './niche-media.mjs';
import {memoPreparationImageId} from './memocasting-homepage-images.mjs';

// Owner-hidden visual sections remain in the source for isolated restoration.
// No native body/admission prefix or product-page contents are changed here.
export function memoHomepageVisibleLead(story){
 return story.replace(/<section\b[^>]*\bid="(?:akimirkos|sudetis)"[^>]*>[\s\S]*?<\/section>/g,'');
}

// Always receive the shared, currently eligible projection, never raw pkg.pages.
export function memoHomepageAsset(pkg,eligiblePages,pathname){
 if(pkg?.siteId!=='memocasting'||!eligiblePages.some(memoHomepageAdmitted))return null;
 return manifest.assets.find(asset=>asset.path===pathname)??null;
}
export function memoHomepageProductStory(eligiblePages){
 const targets={PAIR:'products/liejimo-rinkinys-porai',FAMILY:'products/seimos-rinkinys-1',INSTRUCTION:'pages/instrukcija',HELP:'pagalba',FINISHING:'gidai/liejinio-dazymas-ir-prieziura',DELIVERY:'pristatymas',RETURNS:'grazinimas',CONTACT:'kontaktai'};
 // Owner-selected replacement illustration; retain the approved text/body and
 // original cutout assets so this presentation change can be reverted alone.
 let mediaStory=memoHomepageStory.replaceAll('Medinis pagrindas pasirenkamas atskirai už 10 €.', 'Medinis pagrindas pasirenkamas atskirai. Kainą rasite produkto puslapyje.').replaceAll('/media/asset-kit/family-alpha-v2-','/media/asset-kit/family-reference-white-v1-');
 const home=eligiblePages.find(memoHomepageAdmitted),preparation=home?.media?.find(m=>m.id===memoPreparationImageId);
 if(preparation){
  const attr=value=>String(value).replaceAll('&','&amp;').replaceAll('"','&quot;').replaceAll('<','&lt;').replaceAll('>','&gt;');
  const image=`<img class="home-guide-image" src="${attr(preparation.src)}" srcset="${attr(imageSrcSet(home.media,preparation))}" sizes="(max-width: 700px) 90vw, 30vw" width="${preparation.width}" height="${preparation.height}" alt="${attr(preparation.alt)}" loading="lazy" decoding="async">`;
  mediaStory=mediaStory.replace(/<img class="home-guide-image" src="[^"]*\/creation-table-v1-1536\.webp"[^>]*>/,image);
 }
 return mediaStory.replace(/<a([^>]*?)href="@@([A-Z]+)@@"([^>]*?)>([\s\S]*?)<\/a>/g,(_all,before,token,after,content)=>{
  const target=eligiblePages.find(page=>{const route=memoRoute(page);return route.language==='lt'&&route.baseSlug===targets[token];});
  if(!target)return '<span class="text-link">'+(token==='PAIR'||token==='FAMILY'?'Rinkinys šiuo metu nerodomas.':'Informacija šiuo metu nerodoma.')+'</span>';
  const path=('/'+target.slug).replaceAll('&','&amp;').replaceAll('"','&quot;').replaceAll('<','&lt;').replaceAll('>','&gt;');
  return `<a${before}href="${path}"${after}>${content}</a>`;
 });
}
