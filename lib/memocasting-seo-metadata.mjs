import {memoFunctionalPage} from './memocasting-content.mjs';
import {memoHomepageAsset} from './memocasting-homepage-assets.mjs';
import {uniqueImageFamilies} from './niche-media.mjs';

export const memoBrandName='Memory Casting';
const owns=pkg=>pkg?.siteId==='memocasting'&&pkg.canonicalHost==='memocasting.lt';
const admitted=(page,pages)=>page&&pages.some(candidate=>candidate.id===page.id&&candidate.slug===page.slug&&candidate.revisionHash===page.revisionHash);
const homeHero={src:'/memocasting-homepage/v1/media/hero-layers/hero-objects-alpha-v4-1536.webp',width:1536,height:1024,alt:'Memory Casting rinkinys ir balta susikibusių rankų skulptūra'};

// The runtime producer admits actual LIVE offers; reject an incomplete shape
// before reusing its price for metadata or rich Product markup.
export function memoSeoOffer(page){
 const offer=page?.seoOffer;
 if(offer?.['@type']!=='Offer'||offer.priceCurrency!=='EUR'||typeof offer.price!=='string'
  ||!/^(?:0|[1-9]\d*)\.\d{2}$/.test(offer.price)
  ||!['https://schema.org/InStock','https://schema.org/OutOfStock'].includes(offer.availability))return null;
 const [whole,fraction]=offer.price.split('.'),cents=Number(whole)*100+Number(fraction);
 return Number.isSafeInteger(cents)&&cents>0?offer:null;
}

function ownHero(media){
 return uniqueImageFamilies(media??[]).find(image=>typeof image.src==='string'&&/^\/(?:content-assets\/|prekyba\/catalog-media\/)/.test(image.src)
  &&!/[?#]/.test(image.src)&&image.width>0&&image.height>0)??null;
}

// No unrelated default photograph: use this page's admitted media, the exact
// visible/home-admitted hero, or a relevant eligible kit on the instruction hub.
export function memoPageImage(pkg,page,pages){
 if(!owns(pkg)||!admitted(page,pages)||memoFunctionalPage(pkg,page))return null;
 if(page.slug===''&&memoHomepageAsset(pkg,[page],homeHero.src))return {...homeHero};
 const own=ownHero(page.media);if(own)return own;
 if(page.slug==='pages/instrukcija'){
  for(const slug of ['rinkinys-porai','seimos-rinkinys']){
   const product=pages.find(candidate=>candidate.type==='product'&&candidate.slug===slug),image=product&&ownHero(product.media);
   if(image)return image;
  }
 }
 return null;
}

function brandedTitle(value){
 const title=(value||memoBrandName).trim().replace(/\s*[|–—-]\s*(?:Memory Casting|Memocasting)\s*$/i,'').trim();
 return title===memoBrandName?title:`${title} | ${memoBrandName}`;
}
// Keep the initial editorial homepage independent of payment-provider latency.
// Actual prices and strict LIVE eligibility remain on products and checkout.
function homepageDescription(){
 return 'Rankų liejimo rinkinys porai ar šeimai – kūrybai kartu ir bendram prisiminimui. Balti dažai įeina į abu rinkinius.';
}

// All text channels use one admitted runtime title/description. Publication,
// canonical and live-commerce admission remain owned by their existing cores.
export function memoSeoMetadata(pkg,page,pages,canonical){
 if(!owns(pkg))return null;
 const visible=admitted(page,pages),functional=visible&&memoFunctionalPage(pkg,page);
 const title=brandedTitle(visible?(page.slug===''?'Rankų liejimo rinkiniai porai ir šeimai':page.seoTitle||page.title):memoBrandName);
 const description=visible?(page.slug===''?homepageDescription():page.seoDescription||page.description):pkg.site.offer;
 const image=visible?memoPageImage(pkg,page,pages):null,offer=visible&&page.type==='product'?memoSeoOffer(page):null;
 return {title,description,image,offer,siteName:memoBrandName,type:visible&&page.type==='guide'?'article':offer?'product':'website',
  robots:visible&&canonical&&!functional?'index, follow, max-image-preview:large, max-snippet:-1':'noindex, nofollow'};
}
