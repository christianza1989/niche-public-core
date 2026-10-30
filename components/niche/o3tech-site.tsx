import {nicheJsonLd} from '@/lib/niche-seo';
import {o3techMarkup} from '@/lib/o3tech-render.mjs';
import layout from '@/config/o3tech-layout.json';
import type {NichePackage,NichePage} from '@/lib/niche-sites';
import './o3tech.css';
import './o3tech-fonts.css';
import './o3tech-hero06.css';

export function O3techSite({pkg,page,livePages,query={}}:{pkg:NichePackage;page:NichePage;livePages:NichePage[];query?:Record<string,string|string[]|undefined>}){
  return <><script type="application/ld+json" dangerouslySetInnerHTML={{__html:nicheJsonLd(pkg,page,livePages)}}/><div dangerouslySetInnerHTML={{__html:o3techMarkup({pkg,page,pages:livePages,layout,query})}}/><script src="/o3tech-ui.js" defer/></>;
}
