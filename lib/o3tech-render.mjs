import {imageSrcSet,uniqueImageFamilies} from './niche-media.mjs';

const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const route=p=>p.slug?'/'+p.slug+'/':'/';
const ABOUT='/ozonas-geriausia-kvapu-naikinimo-priemone/';
const RENT='/ozono-generatoriaus-ozonatoriaus-nuoma/';

// Presentation only. The production caller must pass the native public projection.
// The isolated draft harness is a separate loopback/noindex development tool.
export function o3techMarkup({pkg,page,pages,layout,formAction='/uzklausa'}){
 const byPath=new Map(pages.map(p=>[route(p),p]));
 const home=pages.find(p=>p.type==='home');
 if(!home||!pages.some(p=>p.id===page.id)||pkg.siteId!=='o3tech')throw Error('o3tech requires a same-site projected page set');
 const meta=layout.pages[page.id];if(!meta)throw Error('Missing o3tech page layout');
 const catalogue=pages.filter(p=>layout.pages[p.id]?.kind==='catalogue'&&p.slug!=='prekes');
 const productPages=pages.filter(p=>p.type==='product');
 const homeMeta=layout.pages[home.id];
 const region=i=>home.body.slice(homeMeta.sections[i].start,homeMeta.sections[i].end);
 const heading=i=>region(i).find(b=>b.type==='heading')?.text||'';
 const image=(owner,id,{priority=false,sizes='(max-width: 700px) 92vw, 540px',className='',decorative=false}={})=>{
  const asset=owner.media.find(a=>a.id===id);if(!asset)return '';
  const set=imageSrcSet(owner.media,asset);
  return `<img class="${esc(className)}" src="${esc(asset.src)}"${set?` srcset="${esc(set)}" sizes="${esc(sizes)}"`:''} width="${asset.width}" height="${asset.height}" alt="${decorative?'':esc(asset.alt)}" loading="${priority?'eager':'lazy'}" decoding="async"${priority?' fetchpriority="high"':''}>`;
 };
 const linkedText=(text,owner)=>{let result=esc(text);for(const l of owner.links||[]){const target=pages.find(p=>p.id===l.targetPageId);const label=esc(l.label);if(target&&label&&result.includes(label)){result=result.replace(label,`<a href="${route(target)}">${label}</a>`);break;}}return result;};
 const blocks=(items,owner,{images=true,headings=true}={})=>items.map(b=>b.type==='paragraph'?`<p>${linkedText(b.text,owner)}</p>`:b.type==='heading'?headings?`<h${b.level}>${esc(b.text)}</h${b.level}>`:'':b.type==='list'?`<ul>${b.items.map(x=>`<li>${esc(x)}</li>`).join('')}</ul>`:b.type==='image'&&images?image(owner,b.assetId):'').join('');
 const navLink=(path,label)=>byPath.has(path)?`<a href="${esc(path)}"${route(page)===path?' aria-current="page"':''}>${esc(label)}</a>`:'';
 const categoryLinks=catalogue.map(p=>navLink(route(p),p.title)).join('');
 const nav=`${navLink('/','Pagrindinis')}${navLink(ABOUT,'Apie ozonavimą')}<details class="o3-categories"><summary>Prekės</summary><div>${navLink('/prekes/','Prekės')}${categoryLinks}</div></details>${navLink(RENT,'Nuoma')}<a href="/#kontaktai">Kontaktai</a>`;
 const logo=`<a class="o3-logo" href="/" aria-label="o3tech">${image(home,layout.assets.logo,{priority:true,sizes:'220px',decorative:true})}</a>`;
 const header=`<header class="o3-header"><div class="o3-wrap o3-header-row">${logo}<nav class="o3-desktop-nav" aria-label="Pagrindinis">${nav}</nav><details class="o3-mobile-nav"><summary>Menu</summary><nav aria-label="Pagrindinis">${nav}</nav></details></div></header>`;
 const price=p=>{const m=layout.pages[p.id];const b=m?.priceBlock!==undefined?p.body[m.priceBlock]:null;return b?.type==='paragraph'?`<p class="o3-price">${esc(b.text)}</p>`:'';};
 const cards=items=>`<div class="o3-product-grid">${items.map(p=>`<article class="o3-product-card"><a href="${route(p)}">${image(p,uniqueImageFamilies(p.media)[0]?.id,{sizes:'(max-width: 500px) 44vw, (max-width: 900px) 30vw, 260px',decorative:true})}<h2>${esc(p.title)}</h2></a>${price(p)}</article>`).join('')}</div>`;
 const sourceContactList=region(7).find(b=>b.type==='list')?.items||[];
 const contactLinks=(layout.home.contactLinks||[]).map((l,i)=>`<a href="${esc(l.href)}">${esc(sourceContactList[i]||'')}</a>`).join('');
 const consent='Sutinku, kad šie duomenys būtų naudojami atsakyti į mano užklausą.';
 const inquiry=`<form class="o3-form" action="${esc(formAction)}" method="post"><label><span class="o3-visually-hidden">Telefonu / El. paštu</span><select name="contact_method">${layout.home.formOptions.map(x=>`<option>${esc(x)}</option>`).join('')}</select></label><label><span class="o3-visually-hidden">Vardas</span><input name="name" placeholder="Vardas" autocomplete="name" minlength="2" maxlength="100" required></label><label><span class="o3-visually-hidden">Telefono nr.</span><input name="phone" type="tel" placeholder="Telefono nr." autocomplete="tel" maxlength="80"></label><label><span class="o3-visually-hidden">El. paštas</span><input name="email" type="email" placeholder="El. paštas" autocomplete="email" maxlength="250" required></label><label><span class="o3-visually-hidden">Žinutė</span><textarea name="message" placeholder="Žinutė" minlength="20" maxlength="2800" required></textarea></label><label class="o3-consent"><input name="consent" type="checkbox" value="yes" required><span>${consent}</span></label><input name="website" class="o3-honeypot" tabindex="-1" autocomplete="off" aria-hidden="true"><input type="hidden" name="source_path" value="${esc(route(page))}"><button class="o3-button" type="submit">SIŲSTI ŽINUTĘ</button></form>`;
 let content='';
 if(meta.kind==='home'){
  const hero=region(0),heroImage=hero.find(b=>b.type==='image');
  const rental=region(4),rentalImage=rental.find(b=>b.type==='image');
  const benefits=region(6),benefitItems=[];for(let i=0;i<benefits.length;i++)if(benefits[i].type==='image')benefitItems.push({image:benefits[i],title:benefits.slice(i+1).find(b=>b.type==='heading')?.text||''});
  content=`<section class="o3-hero" style="--o3-bg:url('${esc(home.media.find(a=>a.id===layout.assets.background)?.src)}')"><div class="o3-wrap o3-hero-grid"><div class="o3-hero-panel"><h1>${esc(page.title)}</h1>${blocks(hero,home,{images:false})}</div>${heroImage?image(home,heroImage.assetId,{priority:true,sizes:'(max-width:700px) 75vw, 440px',className:'o3-hero-image',decorative:true}):''}</div></section>
   <section class="o3-section o3-wrap"><h2 class="o3-section-title">${esc(heading(1))}</h2><div class="o3-category-grid">${layout.home.categoryCards.map(card=>{const p=byPath.get(card.path);return p?`<a href="${route(p)}">${image(home,card.imageId,{sizes:'(max-width:700px) 44vw, 270px',decorative:true})}<h3>${esc(p.title)}</h3></a>`:'';}).join('')}</div></section>
   <section class="o3-section o3-wrap"><h2 class="o3-section-title">${esc(heading(3))}</h2><div class="o3-rental-grid"><div>${blocks(rental,home,{images:false})}${navLink(RENT,heading(4)).replace('<a ','<a class="o3-button" ')}</div>${rentalImage?image(home,rentalImage.assetId,{className:'o3-rental-image',decorative:true}):''}</div></section>
   <section class="o3-benefits"><div class="o3-wrap"><h2 class="o3-section-title">${esc(heading(5))}</h2><div class="o3-benefit-grid">${benefitItems.map(b=>`<div>${image(home,b.image.assetId,{sizes:'96px',decorative:true})}<h3>${esc(b.title)}</h3></div>`).join('')}</div></div></section>
   <section class="o3-section o3-wrap o3-contacts" id="kontaktai"><h2 class="o3-section-title">${esc(heading(7))}</h2><h3>${esc(region(7).filter(b=>b.type==='heading')[1]?.text||'')}</h3><address>${contactLinks}</address></section>
   <section class="o3-inquiry" style="--o3-bg:url('${esc(home.media.find(a=>a.id===layout.assets.background)?.src)}')"><div class="o3-wrap o3-inquiry-grid"><div>${region(8).find(b=>b.type==='image')?image(home,region(8).find(b=>b.type==='image').assetId,{decorative:true}):''}</div><div><h2 class="o3-section-title">${esc(heading(8))}</h2>${inquiry}</div></div></section>`;
 }else{
  const crumbs=`<nav class="o3-breadcrumb" aria-label="Kelias"><a href="/">o3tech</a><span aria-hidden="true"> / </span>${meta.kind==='product'?`${navLink('/prekes/','Prekės')}<span aria-hidden="true"> / </span>`:''}<span>${esc(page.title)}</span></nav>`;
  if(meta.kind==='catalogue')content=`<div class="o3-wrap o3-inner">${crumbs}<h1>${esc(page.title)}</h1><nav class="o3-catalogue-links" aria-label="Prekės">${navLink('/prekes/','Prekės')}${categoryLinks}</nav>${cards((meta.productPaths||[]).map(p=>byPath.get(p)).filter(Boolean))}</div>`;
  else if(meta.kind==='product'){
   const gallery=uniqueImageFamilies(page.media),body=page.body.filter((b,i)=>b.type!=='image'&&i!==meta.priceBlock);
   const siblings=pages.filter(p=>p.slug!=='prekes'&&layout.pages[p.id]?.kind==='catalogue'&&layout.pages[p.id]?.productPaths?.includes(route(page))).flatMap(p=>layout.pages[p.id].productPaths).filter(p=>p!==route(page));
   content=`<div class="o3-wrap o3-inner">${crumbs}<div class="o3-product-detail"><div class="o3-gallery">${gallery.map((a,i)=>`<a href="${esc(a.src)}"${i?' class="o3-gallery-small"':''}>${image(page,a.id,{priority:i===0,sizes:i?'140px':'(max-width:700px) 92vw, 540px',decorative:false})}</a>`).join('')}</div><div><h1>${esc(page.title)}</h1><div class="o3-prose">${blocks(body,page)}</div>${price(page)}<p><a class="o3-button" href="mailto:${esc(pkg.site.contact.email)}?subject=${encodeURIComponent(page.title)}">${esc(pkg.site.contact.email)}</a></p><p><a href="tel:${esc(pkg.site.contact.phone)}">${esc(pkg.site.contact.phone)}</a></p></div></div>${siblings.length?cards([...new Set(siblings)].map(p=>byPath.get(p)).filter(Boolean).slice(0,4)):''}</div>`;
  }else if(meta.kind==='rental'){
   const part=i=>page.body.slice(meta.sections[i].start,meta.sections[i].end);
   const groups=items=>{const result=[];for(const b of items){if(b.type==='heading'||!result.length)result.push([]);result.at(-1).push(b);}return result;};
   content=`<div class="o3-wrap o3-inner">${crumbs}<article class="o3-rental-page"><div class="o3-prose"><h1>${esc(page.title)}</h1>${blocks(part(0),page)}</div><div class="o3-rental-offers">${groups(part(1)).map(g=>`<section>${blocks(g.filter(b=>b.text!=='Teirautis'),page)}<a class="o3-button" href="/#kontaktai">${esc(g.find(b=>b.text==='Teirautis')?.text||'')}</a></section>`).join('')}</div><div class="o3-rental-specs-title">${blocks(part(2),page)}</div><div class="o3-rental-specs">${groups(part(3)).map(g=>`<section>${blocks(g,page)}</section>`).join('')}</div></article></div>`;
  }else content=`<div class="o3-wrap o3-inner">${crumbs}<article class="o3-prose"><h1>${esc(page.title)}</h1>${blocks(page.body,page)}</article></div>`;
 }
 const footer=`<footer class="o3-footer"><div class="o3-wrap o3-footer-grid"><div>${logo}</div><div><h2>KATEGORIJA</h2>${categoryLinks}</div><div><h2>INFORMACIJA</h2>${navLink(ABOUT,'Apie ozonavimą')}${navLink(RENT,'Nuoma')}${navLink('/taisykles/','Taisyklės')}${navLink('/garantija-ir-grazinimas/','Garantija ir grąžinimas')}${navLink('/musu-slapuku-politika/','Slapukų politika')}</div><div><h2>KONTAKTAI</h2><a href="tel:${esc(pkg.site.contact.phone)}">${esc(pkg.site.contact.phone)}</a><a href="mailto:${esc(pkg.site.contact.email)}">${esc(pkg.site.contact.email)}</a></div></div><div class="o3-wrap o3-copyright">© o3tech.lt</div></footer>`;
 return `<div class="o3"><a class="o3-skip" href="#main">Skip to content</a>${header}<main id="main">${content}</main>${footer}</div>`;
}
