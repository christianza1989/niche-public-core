/* eslint-disable @next/next/no-img-element -- Native links and responsive immutable media. */
import type {NicheBlock,NicheMedia,NichePackage,NichePage} from '@/lib/niche-sites';
import {memoRoute,memoPath,memoLabels,memoLanguageLinks} from '@/lib/memocasting-locales.mjs';
import {nicheEditorialDates} from '@/lib/niche-schema-core.mjs';
import {nicheJsonLd} from '@/lib/niche-seo';
import {uniqueRelatedLinks} from '@/lib/niche-links.mjs';
import {memoBreadcrumbs as nicheBreadcrumbs,memoSectionId,memoGuideSections,memoCompany,memoProfilePath,memoGuideBodyParts,memoGiftQuickPaths} from '@/lib/memocasting-structure.mjs';
import {imageSrcSet,visibleImageCredit} from '@/lib/niche-media.mjs';
import {LinkedText} from './linked-text';
import {MemoProductConfigurator} from './memocasting-product-configurator';
import {MemoCataloguePrice} from './memocasting-catalogue';
import {memoGalleryImages,memoStoreLabels} from '@/lib/memocasting-storefront.mjs';
import {memoLogoImage} from '@/lib/memocasting-homepage-images.mjs';
import {memoCheckoutPolicies} from '@/lib/memocasting-checkout-policies.mjs';
import s from './memocasting-site.module.css';
import {MemoHomepageMotion} from './memocasting-homepage-motion';
import {memoHomepageAdmitted,memoHomepageIntro} from '@/lib/memocasting-homepage-markup.mjs';
import {memoHomepageProductStory,memoHomepageVisibleLead} from '@/lib/memocasting-homepage-assets.mjs';
import './memocasting-homepage.css';
import './memocasting-reviews.css';
import './memocasting-product-cards.css';
import './memocasting-review-carousel.css';
import './memocasting-brand-story.css';
import {MemoBrandStory} from './memocasting-brand-story';
import {memoHomepageBrand} from '@/lib/memocasting-homepage-brand.mjs';
import {MemoHomepageFaq} from './memocasting-homepage-faq';
import {memoHomepageFaq,memoHomepageFaqPlacement} from '@/lib/memocasting-homepage-faq.mjs';
import './memocasting-homepage-faq.css';
import {MemoHomepageFooter} from './memocasting-homepage-footer';
import {MemoAnalytics} from './memocasting-analytics';
import {memoFooterGroups} from '@/lib/memocasting-footer.mjs';
import {MemoInspirationGallery} from './memocasting-inspiration-gallery';
import {MemoVideoCarousel} from './memocasting-video-carousel';
import {memoInstagramPlacement} from '@/lib/memocasting-instagram-bridge.mjs';
import {memoProductForSlug,memoProducts} from '@/lib/memocasting-products.mjs';
import {memoProductContents} from '@/lib/memocasting-product-content.mjs';
import {memoInstructionKind} from '@/lib/memocasting-instructions.mjs';
import {MemoInstructions} from './memocasting-instructions';
import {Fragment} from 'react';
import {MemoGuideVideo} from './memocasting-guide-video';
import {MemoHomeReviews,MemoProductReviews,type MemoReviewData} from './memocasting-reviews';
import {memoReviewInstruction} from '@/lib/memocasting-reviews.mjs';
import {MemoReviewPrivacy} from './memocasting-review-privacy';
function MemoArticleMeta({pkg,page,pages,className}:{pkg:NichePackage;page:NichePage;pages:NichePage[];className:string}){const route=memoRoute(page),labels=memoLabels[route.language as keyof typeof memoLabels],dates=nicheEditorialDates(page),profile=memoProfilePath(page,pages),format=(d:string)=>new Intl.DateTimeFormat(route.locale,{dateStyle:'medium',timeZone:pkg.site.timezone}).format(new Date(d));return <div className={className}><p>{labels.author} {profile?<a href={profile} rel='author'>MB Memocasting</a>:'MB Memocasting'} · {labels.editorial}</p><p>{labels.published} <time dateTime={dates.published}>{format(dates.published)}</time> · {labels.reviewed} <time dateTime={dates.modified}>{format(dates.modified)}</time></p></div>;}
const productSlugs=memoProducts.map(p=>p.logicalSlug);
const mainKitSlugs=['products/liejimo-rinkinys-porai','products/seimos-rinkinys-1'];
const nav=[['collections/all','Rinkiniai'],['pages/instrukcija','Instrukcija'],['dovanos','Dovanos'],['gidai','Gidai'],['kontaktai','Kontaktai']];
function Photo({asset,media,hero=false}:{asset:NicheMedia;media:NicheMedia[];hero?:boolean}){return <figure className={s.photo}><img src={asset.src} srcSet={imageSrcSet(media,asset)} sizes={hero?'(max-width: 760px) calc(100vw - 40px), (max-width: 1200px) 55vw, 680px':'(max-width: 760px) calc(100vw - 40px), 760px'} width={asset.width} height={asset.height} alt={asset.alt} loading={hero?'eager':'lazy'} fetchPriority={hero?'high':'auto'}/>{visibleImageCredit(asset)&&<figcaption>{visibleImageCredit(asset)}</figcaption>}</figure>;}
function Body({page,pages}:{page:NichePage;pages:NichePage[]}){return <div className={s.prose}>{page.body.map((b:NicheBlock,i:number)=>{
 if(b.type==='paragraph')return <p key={i}><LinkedText text={b.text} page={page} livePages={pages}/></p>;
 if(b.type==='heading')return <Fragment key={i}>{b.level===2?<h2 id={memoSectionId(b.text)}>{b.text}</h2>:<h3 id={memoSectionId(b.text)}>{b.text}</h3>}<MemoGuideVideo page={page} heading={b.text}/></Fragment>;
 if(b.type==='list')return <ul key={i}>{b.items.map((text,j)=><li key={j}><LinkedText text={text} page={page} livePages={pages}/></li>)}</ul>;
 const asset=page.media.find(a=>a.id===b.assetId);return asset?<Photo key={i} asset={asset} media={page.media}/>:null;
 })}</div>;}
function Products({pages,headingLevel=3}:{pages:NichePage[];headingLevel?:2|3}){const route=memoRoute(pages[0]??{slug:''}),labels=memoLabels[route.language],text=memoStoreLabels[route.language as keyof typeof memoStoreLabels],Heading=headingLevel===2?'h2':'h3';return <div className={s.products}>{pages.filter(p=>productSlugs.includes(memoRoute(p).baseSlug)).map(p=><article className={s.product} key={p.id}>
 <a href={'/'+p.slug} className={s.productVisual} aria-label={p.title}>{p.media[0]&&<img src={p.media[0].src} srcSet={imageSrcSet(p.media,p.media[0])} sizes="(max-width: 760px) calc(100vw - 40px), 480px" width={p.media[0].width} height={p.media[0].height} loading="lazy" alt=""/>}<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 12h15m-6-6 6 6-6 6"/></svg></a>
 <Heading><a href={'/'+p.slug}>{p.title}</a></Heading><MemoCataloguePrice sku={memoProductForSlug(memoRoute(p).baseSlug)!.sku} language={route.language} country={route.country}/>
 <a className={s.productLink} href={'/'+p.slug}>{route.language==='lt'?'Peržiūrėti prekę':labels.choose}<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 12h15m-6-6 6 6-6 6"/></svg></a>
 <details className={s.cardInfo}><summary>{text.productInfo}<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12h14M12 5v14"/></svg></summary><p>{p.description}</p></details>
 </article>)}</div>;}
function Guides({pages}:{pages:NichePage[]}){return <div className={s.guides}>{pages.filter(p=>p.type==='guide').map(p=><article key={p.id}><a href={'/'+p.slug}>{p.media[0]&&<img src={p.media[0].src} srcSet={imageSrcSet(p.media,p.media[0])} sizes="(max-width: 760px) calc(100vw - 40px), 380px" width={p.media[0].width} height={p.media[0].height} loading="lazy" alt=""/>}<h3>{p.title}</h3></a><p>{p.description}</p></article>)}</div>;}
function GuideIndex({pages,language,giftOnly}:{pages:NichePage[];language:string;giftOnly:boolean}){
 const groups=memoGuideSections(pages,language,{giftOnly}),labels=memoLabels[language as keyof typeof memoLabels];
 if(!groups.length)return null;
 return <div className={s.guideArchive} data-memo-guide-archive><nav className={s.guideTopics} aria-label={labels.topics}>{groups.map(group=><a href={'#'+group.id} key={group.id}>{group.title}<span>{group.pages.length}</span></a>)}</nav>{groups.map(group=><section className={s.archiveSection} key={group.id} id={group.id}><h2>{group.title}</h2><Guides pages={group.pages}/></section>)}</div>;
}
export async function MemocastingSite({pkg,page,livePages}:{pkg:NichePackage;page:NichePage;livePages:NichePage[]}){
 const route=memoRoute(page),labels=memoLabels[route.language as keyof typeof memoLabels],path=(slug:string='')=>memoPath(route,slug),localPages=livePages.filter(p=>memoRoute(p).language===route.language),exists=(slug:string)=>localPages.some(p=>memoRoute(p).baseSlug===slug),home=route.baseSlug==='',product=productSlugs.includes(route.baseSlug),cart=['cart','checkout','uzsakymas'].includes(route.baseSlug);
 const MemoNativeCheckout=cart?(await import('./memocasting-native-checkout')).MemoNativeCheckout:null;
 const company=memoCompany(pkg,livePages),languages=memoLanguageLinks(page,livePages),languageLabel=({lt:'Svetainės kalba',pl:'Język strony',lv:'Vietnes valoda',et:'Veebilehe keel'} as Record<string,string>)[route.language];
 const footer=<MemoHomepageFooter company={company} groups={memoFooterGroups(page,livePages)} languages={languages} languageLabel={languageLabel} automation={labels.automation} language={route.language} analytics={<MemoAnalytics siteId={pkg.siteId} path={'/'+page.slug} title={page.title} language={route.language} functional={cart} privacyPath={exists('privatumas')?path('privatumas'):undefined}/>}/>;
 const storeText=memoStoreLabels[route.language as keyof typeof memoStoreLabels],catalogue=route.baseSlug==='collections/all';
 const instruction=memoInstructionKind(page);
 const related=uniqueRelatedLinks(page.links,livePages);
 if(home&&route.language==='lt'&&memoHomepageAdmitted(page)){
  const escape=(value:string)=>value.replaceAll('&','&amp;').replaceAll('"','&quot;').replaceAll('<','&lt;').replaceAll('>','&gt;');
  const story=memoHomepageProductStory(localPages).split('<!-- memo-inspiration-gallery -->');
  const social=memoInstagramPlacement(story[1]??'');
  const faq=memoHomepageFaq(page,livePages),faqPlacement=memoHomepageFaqPlacement(social.after,faq);
  const brand=memoHomepageBrand(page,livePages);
  // Keep the owner's two hidden sections out of the rendered homepage.
  const lead=memoHomepageVisibleLead(story[0]);
  const videoBoundary=lead.indexOf('<section class="sculpture-showroom"');
  const beforeVideos=videoBoundary<0?lead:lead.slice(0,videoBoundary);
  const afterVideos=videoBoundary<0?'':lead.slice(videoBoundary);
  const cartLink=exists('cart')?`<a class="home-cart" href="${escape(path('cart'))}" aria-label="Krepšelis"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 7h14l1 14H4L5 7Zm3 0V5a4 4 0 0 1 8 0v2"/></svg></a>`:'';
  const intro=memoHomepageIntro.replace('</nav>',cartLink+'</nav>');
  return <MemoHomepageMotion><script type="application/ld+json" dangerouslySetInnerHTML={{__html:nicheJsonLd(pkg,page)}}/><div dangerouslySetInnerHTML={{__html:intro}}/><main id="turinys"><div dangerouslySetInnerHTML={{__html:beforeVideos}}/><MemoVideoCarousel/><div dangerouslySetInnerHTML={{__html:afterVideos}}/><MemoInspirationGallery/><MemoBrandStory story={brand.section}/><MemoHomeReviews/><div dangerouslySetInnerHTML={{__html:social.before}}/><div dangerouslySetInnerHTML={{__html:faqPlacement.before}}/>{faqPlacement.replace&&<MemoHomepageFaq faq={faq}/>}<div dangerouslySetInnerHTML={{__html:faqPlacement.after}}/><details className="home-information"><summary>Rinkinių informacija ir naudingi gidai</summary><Body page={{...page,body:brand.remainder}} pages={livePages}/>{exists('gidai')&&<p><a href={path('gidai')}>{labels.allGuides}</a></p>}</details></main>{footer}</MemoHomepageMotion>;
 }
 return <div className={s.site} data-memo-instructions={instruction||undefined}><a className={s.skip} href="#turinys">{labels.skip}</a><script type="application/ld+json" dangerouslySetInnerHTML={{__html:nicheJsonLd(pkg,page)}}/>
 <header className={s.header}>
  <a href={path()} className={s.logo} aria-label={labels.home}><img src={memoLogoImage.src} srcSet={memoLogoImage.srcSet} sizes="(max-width:700px) 190px, 230px" width="1000" height="300" alt="Memory Casting"/></a>
  <nav className={s.desktopNav} aria-label={labels.menu}>{nav.filter(([slug])=>exists(slug)).map(([slug,label])=><a key={slug} href={path(slug)} aria-current={route.baseSlug===slug?'page':undefined}>{({Rinkiniai:labels.catalogue,Instrukcija:labels.instruction,Dovanos:labels.gifts,Gidai:labels.guides,Kontaktai:labels.contact} as Record<string,string>)[label]}</a>)}</nav>
  <div className={s.headerTools}>
   {languages.length>1&&<details className={s.languageMenu}><summary><span className={s.srOnly}>{languageLabel}: </span>{route.language.toUpperCase()}<svg viewBox="0 0 24 24" aria-hidden="true"><path d="m7 10 5 5 5-5"/></svg></summary><nav aria-label={languageLabel} data-memo-language-switch>{languages.map((l:{language:string;label:string;path:string;current:boolean})=><a href={l.path} hrefLang={l.language} lang={l.language} aria-current={l.current?'page':undefined} key={l.language}>{l.label}</a>)}</nav></details>}
   {exists('cart')&&<a href={path('cart')} className={s.cartLink} aria-label={labels.cart}><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 7h14l1 14H4L5 7Zm3 0V5a4 4 0 0 1 8 0v2"/></svg><span className={s.srOnly}>{labels.cart}</span></a>}
   <details className={s.mobileMenu}><summary aria-label={storeText.menu}><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 7h16M4 12h16M4 17h16"/></svg></summary><div className={s.menuPanel}><nav aria-label={labels.menu}>{nav.filter(([slug])=>exists(slug)).map(([slug,label])=><a key={slug} href={path(slug)} aria-current={route.baseSlug===slug?'page':undefined}>{({Rinkiniai:labels.catalogue,Instrukcija:labels.instruction,Dovanos:labels.gifts,Gidai:labels.guides,Kontaktai:labels.contact} as Record<string,string>)[label]}</a>)}</nav>{languages.length>1&&<nav aria-label={languageLabel} data-memo-language-switch>{languages.map((l:{language:string;label:string;path:string;current:boolean})=><a href={l.path} hrefLang={l.language} lang={l.language} aria-current={l.current?'page':undefined} key={l.language}>{l.label}</a>)}</nav>}</div></details>
  </div>
 </header>
 <main id="turinys" className={s.main}>
 {!home&&<nav className={'niche-breadcrumbs '+s.crumbs} data-niche-breadcrumbs aria-label={labels.trail}>{nicheBreadcrumbs(pkg,page,livePages).map((b:{name:string;path:string},i:number)=><span key={b.path}>{i>0&&<span aria-hidden="true"> / </span>}{i<nicheBreadcrumbs(pkg,page,livePages).length-1?<a href={b.path}>{b.name}</a>:<span aria-current="page">{b.name}</span>}</span>)}</nav>}
 {home?<><section className={s.hero}><div><h1>{page.title}</h1><p className={s.intro}>{page.description}</p><div className={s.actions}>{exists('collections/all')&&<a href={path("collections/all")} className={s.button}>{labels.choose}</a>}{exists('pages/instrukcija')&&<a href={path("pages/instrukcija")}>{labels.start}</a>}</div></div>{page.media[0]&&<Photo asset={page.media[0]} media={page.media} hero/>}</section><section className={s.selection}><h2>{labels.selection}</h2><Products pages={localPages}/></section><div className={s.homeBody}><Body page={page} pages={livePages}/></div>{exists('gidai')&&<section className={s.guideSection}><div className={s.sectionHead}><h2>{labels.ideas}</h2><a href={path("gidai")}>{labels.allGuides}</a></div><Guides pages={localPages}/></section>}</>:<>
 {!cart&&!product&&!instruction&&<div className={catalogue?s.catalogHeading:s.pageHeading}><h1>{page.title}</h1><p className={s.intro}>{page.description}</p></div>}
 {['gidai','dovanos'].includes(route.baseSlug)&&memoGiftQuickPaths(localPages,route.language).length>0&&<nav className={s.giftQuickPaths} aria-label="Greitas dovanų pasirinkimas"><h2>Raskite tinkamą gidą</h2><div>{memoGiftQuickPaths(localPages,route.language).map((link:{id:string;url:string;label:string})=><a href={link.url} key={link.id}>{link.label}<span aria-hidden="true">↗</span></a>)}</div></nav>}
 {instruction&&<MemoInstructions page={page} pages={livePages}/>}
 {MemoNativeCheckout&&<MemoNativeCheckout title={page.title} language={route.language} country={route.country} policies={memoCheckoutPolicies(livePages)} catalogueUrl={exists('collections/all')?path('collections/all'):undefined}/>}
 {page.type==='guide'&&!instruction&&<MemoArticleMeta pkg={pkg} page={page} pages={livePages} className={s.meta}/>}
 {page.type==='guide'&&!instruction&&<Body page={{...page,body:memoGuideBodyParts(page).lead}} pages={livePages}/>}
 {page.media[0]&&!product&&!instruction&&<div className={s.articleHero}><Photo asset={page.media[0]} media={page.media} hero/></div>}
 {page.type==='guide'&&!instruction&&<details className={s.toc}><summary>{labels.contents}</summary><nav aria-label={labels.contents}><ul>{page.body.flatMap((b,i)=>b.type==='heading'&&b.level===2?[<li key={i}><a href={'#'+memoSectionId(b.text)}>{b.text}</a></li>]:[])}</ul></nav></details>}
 {product&&<>
  <section className={s.productHero} aria-labelledby="product-title">
   <div className={s.productHeading}><h1 id="product-title">{page.title}</h1><p className={s.intro}>{labels.tagline}</p></div>
   <MemoProductConfigurator images={memoGalleryImages(page.media)} key={route.country+':'+route.baseSlug} sku={memoProductForSlug(route.baseSlug)!.sku} language={route.language} country={route.country} cartPath={path('cart')}>
    <nav className={s.purchaseLinks} aria-label={labels.information}>{[['pristatymas',labels.delivery],['grazinimas',labels.returns],['kontaktai',labels.contact]].filter(([slug])=>exists(slug)).map(([slug,label])=><a key={slug} href={path(slug)}>{label}</a>)}</nav>
   </MemoProductConfigurator>
  </section>
  <nav className={s.productSections} aria-label={storeText.productInfo}>{page.body.flatMap((b,i)=>b.type==='heading'&&b.level===2?[<a key={i} href={'#'+memoSectionId(b.text)}>{b.text}</a>]:[])}</nav>
  <div className={s.productDetail}><div><p className={s.productDescription}>{page.description}</p><Body page={page} pages={livePages}/></div><aside className={s.productHelp}><h2>{storeText.documents}</h2><nav>{[['pages/instrukcija',labels.instruction],['pagalba',labels.help],['gidai',labels.guides]].filter(([slug])=>exists(slug)).map(([slug,label])=><a key={slug} href={path(slug)}>{label}<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 12h15m-6-6 6 6-6 6"/></svg></a>)}</nav>{route.language==='lt'&&['rinkinys-porai','seimos-rinkinys'].includes(page.slug)&&localPages.some(p=>p.slug===''&&memoHomepageAdmitted(p))&&<div className={s.processEvidence}><a href="https://memocasting.lt/#instagram"><img src="/memocasting-homepage/v1/media/video-carousel-20261020/moment-2e7a942ef0b6-360.webp" width="360" height="640" loading="lazy" alt="Pora prie stalo ruošia indus rankų liejimui."/><span>Pažiūrėkite, kaip liejamos rankos ↗</span></a><p>Tikruose proceso įrašuose matysite pasiruošimą, rankų laikymą formoje ir liejinio išėmimą. Tikslius kiekius ir laukimo laiką rinkitės pagal savo rinkinio instrukciją.</p></div>}</aside></div>
  {route.language==='lt'&&<MemoProductReviews sku={memoProductForSlug(route.baseSlug)!.sku} instruction={memoReviewInstruction(memoProductForSlug(route.baseSlug)!.sku,livePages)} initial={(page as NichePage & {memoReviews?:MemoReviewData}).memoReviews||null}/>}
 </>}
 {!cart&&!product&&!catalogue&&!instruction&&<Body page={page.type==='guide'?{...page,body:memoGuideBodyParts(page).body}:page} pages={livePages}/>}
 {route.language==='lt'&&page.slug==='privatumas'&&<MemoReviewPrivacy/>}
 {catalogue&&<>
  <Products pages={localPages} headingLevel={2}/>
  <section className={s.comparison} aria-labelledby="kit-comparison"><h2 id="kit-comparison">{storeText.comparison}</h2><table className={s.comparisonTable}><caption>{storeText.contents}</caption><thead><tr><th scope="col">{labels.catalogue}</th>{localPages.filter(p=>mainKitSlugs.includes(memoRoute(p).baseSlug)).map(p=><th scope="col" key={p.id}><a href={'/'+p.slug} aria-label={p.title}>{memoRoute(p).baseSlug===productSlugs[0]?labels.pair:labels.family}</a></th>)}</tr></thead><tbody><tr><th scope="row">{storeText.contents}</th>{localPages.filter(p=>mainKitSlugs.includes(memoRoute(p).baseSlug)).map(p=><td key={p.id}><ul>{memoProductContents(p).map((item:string,i:number)=><li key={i}>{item}</li>)}</ul></td>)}</tr></tbody></table></section>
  <section className={s.catalogueInformation}><h2>{storeText.productInfo}</h2><Body page={page} pages={livePages}/></section>
  <nav className={s.catalogueSupport} aria-label={labels.information}>{[['pages/instrukcija',labels.instruction],['pristatymas',labels.delivery],['grazinimas',labels.returns],['pagalba',labels.help]].filter(([slug])=>exists(slug)).map(([slug,label])=><a href={path(slug)} key={slug}>{label}<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 12h15m-6-6 6 6-6 6"/></svg></a>)}</nav>
 </>} {['gidai','dovanos'].includes(route.baseSlug)&&<GuideIndex pages={localPages} language={route.language} giftOnly={route.baseSlug==='dovanos'}/>}
 {route.baseSlug==='kontaktai'&&exists('privatumas')&&<section className={s.contact}><h2>{labels.help}</h2><form action="/uzklausa" method="post"><input type="hidden" name="source_path" value={"/"+page.slug}/><label>{labels.name}<input name="name" minLength={2} maxLength={100} autoComplete="name" required/></label><label>{labels.email}<input name="email" type="email" autoComplete="email" maxLength={250} required/></label><label>{labels.question}<textarea name="message" minLength={20} maxLength={3000} rows={5} required/></label><label className={s.check}><input name="consent" type="checkbox" value="yes" required/>{labels.consent} <a href={path("privatumas")}>{labels.privacyInfo}</a>.</label><div className={s.trap} aria-hidden="true"><label>{labels.empty}<input name="website" tabIndex={-1} autoComplete="off"/></label></div><button type="submit">{labels.save}</button><p>{labels.testContact}</p></form></section>}
 </>}
 {(page.externalLinks?.length??0)>0&&<section className={s.sources}><h2>{labels.sources}</h2><ul>{page.externalLinks!.map(l=><li key={l.url}><a href={l.url} rel="noopener noreferrer">{l.label}</a><p>{l.reason}</p></li>)}</ul></section>}
 {related.length>0&&!home&&<aside className={s.related} aria-label={labels.related}><h2>{labels.related}</h2><ul>{related.map(l=><li key={l.page.id}><a href={'/'+l.page.slug}>{l.label}</a></li>)}</ul></aside>}
 </main>{footer}</div>;
}
