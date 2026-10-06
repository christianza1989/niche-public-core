import compiled from './generated/content-packages.json';
import network from '../config/niche-network.json';
import commerce from '../config/commerce-targets.json';
import { projectContentPagesV2 } from './content-projection-v2.mjs';
import { SITE_CONFIGS } from './site-config';
import admissions from './generated/content-admissions.json';
import { env } from 'cloudflare:workers';
export type InlineTargetV2={kind:'page';pageId:string}|{kind:'external';url:string}|{kind:'network';siteId:string;pageId:string}|{kind:'commerce';targetId:string};
export type InlineV2={type:'text';text:string}|{type:'link';text:string;target:InlineTargetV2};
export type VisibleInlineV2={type:'text';text:string}|{type:'link';text:string;href:string};
type TextBlock={type:'paragraph';text:string}|{type:'heading';level:2|3;text:string}|{type:'list';items:string[]}|{type:'image';assetId:string};
export type ContentBlockV2=TextBlock|{type:'richParagraph';content:InlineV2[]}|{type:'richHeading';level:2|3;content:InlineV2[]}|{type:'richList';ordered:boolean;items:InlineV2[][]};
export type VisibleBlockV2=TextBlock|{type:'richParagraph';content:VisibleInlineV2[]}|{type:'richHeading';level:2|3;content:VisibleInlineV2[]}|{type:'richList';ordered:boolean;items:VisibleInlineV2[][]};
export type MediaV2={id:string;src:string;alt:string;width:number;height:number;rights:string;credit?:string};
export type AuthorV2={id:string;siteId:string;locale:string;slug:string;name:string;role:string;bio:string;kind:'person'|'organization';sameAs:string[]};
export type SourceV2={id:string;title:string;publisher:string;url:string;accessedAt:string;public:true};
export type CommerceTargetV2={id:string;url:string;label:string;relationship:string;verified:boolean;checkedAt:string|null};
export type EditorialV2={category:string;readingMinutes:number;authors:AuthorV2[];sources:SourceV2[];datePublished:string|null;dateModified:string|null;productRecommendation:boolean;featuredImageId:string|null;relatedPageIds:string[];commerceTargets:CommerceTargetV2[]};
export type ContentSiteV2={id:string;name:string;canonicalHost:string;locale:string;timezone:string;brand:{accent:string};offer:string;contact:{email:string;phone?:string};renderer:'gift'|'niche';operatorName:string};
export type ContentPageV2={id:string;siteId:string;contentVersion:2;type:'home'|'service'|'product'|'guide'|'faq'|'location'|'article'|'index'|'author'|'policy'|'about'|'contact';slug:string;title:string;description:string;intent:string;body:ContentBlockV2[];publishAt:string;revisionHash:string;approval:{status:'approved';revisionHash:string;approvedAt:string;actorId:string};media:MediaV2[];links:{targetPageId:string;label:string}[];externalLinks?:{url:string;label:string;reason:string}[];editorial:EditorialV2;siteSnapshot:ContentSiteV2};
export type ContentPackageV2={schemaVersion:2;siteId:string;canonicalHost:string;locale:string;site:ContentSiteV2;pages:ContentPageV2[];generatedAt:string};
export type ProjectedContentPageV2=Omit<ContentPageV2,'body'|'externalLinks'>&{url:string;body:VisibleBlockV2[];externalLinks:{url:string;label:string;reason:string}[]};
// Shadow exports are deliberately absent from the active registry.
export const contentPackagesV2=(compiled as unknown as ContentPackageV2[]).filter(p=>p.schemaVersion===2);
export const contentPackageBySiteId=(id:string)=>contentPackagesV2.find(p=>p.siteId===id)||null;
export function contentAdmissionScope(pkg:ContentPackageV2){return (admissions as Record<string,{scope:string}>)[pkg.siteId]?.scope;}
export function localContentAdmission(pkg:ContentPackageV2){return ['local-fixture','local-preview','hosted-preview'].includes(contentAdmissionScope(pkg)||'');}
export function hasLocalPreviewContent(){return contentPackagesV2.some(pkg=>['local-preview','hosted-preview'].includes(contentAdmissionScope(pkg)||''));}
export function hostedPreviewHost(pkg:ContentPackageV2){const a=(admissions as Record<string,{scope:string;previewHost?:string}>)[pkg.siteId];return a?.scope==='hosted-preview'?a.previewHost:null;}
export const contentPackageByHost=(host:string|null|undefined)=>{
  const name=(host||'').split(',')[0].trim().toLowerCase().replace(/:\d+$/,'');
  if(name==='localhost'||name==='127.0.0.1'){
    const devId=env.NICHE_DEV_SITE_ID || process.env.NICHE_DEV_SITE_ID;
    if(devId)return contentPackageBySiteId(devId);
  }
  const preview=contentPackagesV2.find(p=>hostedPreviewHost(p)===name);if(preview)return preview;
  const legacy=Object.values(SITE_CONFIGS).find(site=>site.domains.includes(name));
  return contentPackagesV2.find(p=>p.canonicalHost===(legacy?.domains[0]||name))||null;
};
export function publicContentPages(pkg:ContentPackageV2,now=Date.now()):ProjectedContentPageV2[]{return projectContentPagesV2(pkg,compiled,network,commerce,now) as ProjectedContentPageV2[];}
