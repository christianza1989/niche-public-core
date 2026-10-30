import { imageSrcSet } from '../../../lib/niche-media.mjs';

const esc=value=>String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const html=value=>value||''; // Native projection in Core; owner fragments in private migration preview.
const decoded=value=>String(value||'').replace(/&#8211;/g,'–').replace(/&#038;|&amp;/g,'&');
const price=p=>`${(Number(p.prices.price)/10**p.prices.currency_minor_unit).toLocaleString('lt-LT',{minimumFractionDigits:2,maximumFractionDigits:2})}€`;
const icon='<svg viewBox="0 0 24 24" aria-hidden="true" width="18" height="18"><path d="m6 9 6 6 6-6" fill="none" stroke="currentColor" stroke-width="1.8"/></svg>';

export function signaturepadsImage(image,{eager=false,className='',sizes='(max-width: 720px) calc(100vw - 40px), 540px'}={}){
  if(!image?.src)return '';
  const variants=image.variants||[];
  const width=image.width||variants.at(-1)?.width||600;
  const height=image.height||Math.round(width*.8);
  const media=variants.map((v,i)=>({id:`image-${i}`,familyId:image.src,src:v.src,alt:image.alt||'',width:v.width,height:Math.round(v.width*height/width)}));
  const base=media.at(-1)||{src:image.src,alt:image.alt||'',width,height,familyId:image.src};
  const srcset=media.length?imageSrcSet(media,base):'';
  return `<img class="${esc(className)}" src="${esc(base.src)}" ${srcset?`srcset="${esc(srcset)}" sizes="${esc(sizes)}"`:''} width="${base.width}" height="${base.height}" alt="${esc(image.alt||'')}" loading="${eager?'eager':'lazy'}" decoding="async"${eager?' fetchpriority="high"':''}>`;
}
function header(data,route){
  const links=[data.categories[0],data.categories[2],data.categories[1]].filter(Boolean).map(c=>`<a href="${esc(c.path)}"${route.path===c.path?' aria-current="page"':''}>${esc(c.id===2828?'Monitorių išplėtimai':decoded(c.name))}</a>`).join('');
  const start=`<a href="/"${route.kind==='home'?' aria-current="page"':''}>PAGRINDINIS</a>`;
  const equipment=['product','category','catalog'].includes(route.kind);
  const equipmentPath=data.categories.find(c=>c.path==='/iranga/paraso-plansetes/')?.path;
  const parent=equipmentPath?`<a href="${esc(equipmentPath)}"${equipment?' class="is-current"':''}>ĮRANGA</a>`:'<span>ĮRANGA</span>';
  const group=links?`<div class="sp-nav-group">${parent}<details class="sp-dropdown"><summary aria-label="ĮRANGA">${icon}</summary><div>${links}</div></details></div>`:'';
  return `<a class="sp-skip" href="#main">Skip to content</a><header class="sp-header"><div class="sp-wrap sp-header-inner"><a class="sp-brand" href="/" aria-label="signaturepads.lt">${signaturepadsImage({...data.home.logo,alt:'SIGNATUREPADS.LT'},{eager:true,sizes:'208px'})}</a><nav class="sp-desktop-nav" aria-label="Pagrindinis meniu">${start}${group}<a href="/#kontaktai">KONTAKTAI</a></nav><details class="sp-mobile-nav"><summary aria-label="Meniu"><span></span><span></span><span></span></summary><nav aria-label="Mobilus meniu">${start}${group}<a href="/#kontaktai">KONTAKTAI</a></nav></details></div></header>`;
}
function footer(data){const categories=[data.categories[0],data.categories[2],data.categories[1]].filter(Boolean);return `<footer class="sp-footer"><div class="sp-wrap"><div class="sp-footer-grid"><a class="sp-footer-brand" href="/" aria-label="signaturepads.lt">${signaturepadsImage({...data.home.logo,alt:'SIGNATUREPADS.LT'},{sizes:'225px'})}</a><section><h2>KATEGORIJA</h2>${categories.map(c=>`<a href="${esc(c.path)}">${esc(c.id===2828?'Monitorių išplėtimai':decoded(c.name))}</a>`).join('')}</section><section><h2>INFORMACIJA</h2>${data.routes.some(r=>r.path==='/apie-mus-spaudoje/')?'<a href="/apie-mus-spaudoje/">Apie mus spaudoje</a>':''}${data.routes.some(r=>r.path==='/musu-slapuku-politika/')?'<a href="/musu-slapuku-politika/">Slapukų politika</a>':''}</section><section><h2>KONTAKTAI</h2><a href="tel:${esc(data.contact.phone.replace(/[^+0-9]/g,''))}">${esc(data.contact.phone)}</a><a href="mailto:${esc(data.contact.email)}">${esc(data.contact.email)}</a></section></div><div class="sp-copyright">© signaturepads.lt</div></div></footer>`;}
function accordion(items,name){return `<div class="sp-accordion">${items.map((item,i)=>`<details name="${name}"${i===0?' open':''}><summary>${esc(item.title)}${icon}</summary><div class="sp-prose">${html(item.html)}</div></details>`).join('')}</div>`;}
function contact(data,product){if(data.leadEnabled===false)return `<section class="sp-wrap sp-contact" id="kontaktai"><div>${signaturepadsImage(data.home.images[9])}</div><div><h2>SUSISIEKITE SU MUMIS!</h2><a href="mailto:${esc(data.contact.email)}">${esc(data.contact.email)}</a></div></section>`;return `<section class="sp-wrap sp-contact" id="kontaktai"><div>${signaturepadsImage(data.home.images[9])}</div><div><h2>SUSISIEKITE SU MUMIS!</h2><form class="sp-contact-form" action="/uzklausa" method="post"><input type="hidden" name="inquiry_id" value="${crypto.randomUUID()}"><label class="sp-sr" for="contact-preference">-Pasirinkite-</label><select id="contact-preference" name="preference">${data.home.selectOptions.map(o=>`<option>${esc(o)}</option>`).join('')}</select><label class="sp-sr" for="contact-name">Vardas / Įmonės pavadinimas</label><input id="contact-name" name="name" placeholder="Vardas / Įmonės pavadinimas" autocomplete="name" required minlength="2" maxlength="100"><label class="sp-sr" for="contact-phone">Telefono nr.</label><input id="contact-phone" type="tel" name="phone" placeholder="Telefono nr." autocomplete="tel" maxlength="50"><label class="sp-sr" for="contact-email">El. paštas</label><input id="contact-email" type="email" name="email" placeholder="El. paštas" autocomplete="email" required maxlength="250"><label class="sp-sr" for="contact-message">Žinutė</label><textarea id="contact-message" name="message" placeholder="Žinutė" rows="6" required minlength="20" maxlength="3000">${esc(product?.name||'')}</textarea><div class="sp-trap" aria-hidden="true"><label>Website<input name="website" tabindex="-1" autocomplete="off"></label></div><label class="sp-consent"><input type="checkbox" name="consent" value="yes" required><span>Sutinku, kad šie duomenys būtų naudojami atsakyti į mano užklausą.</span></label><button class="sp-button" type="submit">SIŲSTI ŽINUTĘ</button><p class="sp-form-status" role="status" aria-live="polite"></p></form></div></section>`;}
function home(data){const h=data.home;const trust=h.trust||[{url:'https://www.post.lt/',label:'Lietuvos paštas',image:h.images[6]},{url:'https://www.registrucentras.lt/',label:'Registrų centras',image:h.images[7]},{url:'https://www.antakpol.lt/',label:'VŠĮ Antakalnio poliklinika',image:h.images[8]}];return `<section class="sp-hero" style="--sp-hero-image:url('${esc(h.background)}')"><div class="sp-wrap"><h1>${esc(h.title)}</h1><div class="sp-hero-grid">${accordion(h.accordions.slice(0,4),'hardware')}<div class="sp-hero-image">${signaturepadsImage(h.images[0],{eager:true})}</div></div></div></section><section class="sp-wrap sp-section sp-equipment"><h2>ĮRANGA</h2><div class="sp-category-grid" data-sp-reveal>${h.categoryCards.map(c=>`<a class="sp-category" href="${esc(c.href)}">${signaturepadsImage({...c.image,alt:c.title},{sizes:'(max-width: 540px) calc(100vw - 40px), (max-width: 900px) 45vw, 270px'})}<h3>${esc(c.title)}</h3></a>`).join('')}</div></section><section class="sp-software"${h.softwareBackground?` style="--sp-software-image:url('${esc(h.softwareBackground)}')"`:''}><div class="sp-wrap sp-hero-grid">${accordion(h.accordions.slice(4),'software')}<a class="sp-software-image" href="/iranga/programine-iranga/">${signaturepadsImage({...h.images[5],alt:h.accordions[4].title})}</a></div></section><section class="sp-wrap sp-section sp-trust"><h2>SIGNOTEC PARAŠO PLANŠETĖMIS PASITIKI:</h2><div data-sp-reveal="desktop">${trust.map(({url,label,image})=>`<a href="${url}">${signaturepadsImage({...image,alt:label},{sizes:'200px'})}<span>${esc(label)}</span></a>`).join('')}</div></section>${contact(data)}`;}
function card(data,p){
  const cat=data.routes.find(r=>r.kind==='category'&&r.productIds.includes(p.id));
  const options={sizes:'(max-width: 720px) 45vw, 280px'};
  const alternative=p.images.find(i=>i.src!==p.images[0].src);
  return `<article class="sp-product-card"><div class="sp-card-media"><a class="sp-card-image${alternative?' has-alternative':''}" href="${esc(p.path)}">${signaturepadsImage({...p.images[0],alt:p.name},{...options,className:'sp-card-primary'})}${alternative?signaturepadsImage({...alternative,alt:''},{...options,className:'sp-card-alternative'}):''}</a><a class="sp-quick" href="${esc(p.path)}" data-quick>Greita peržiūra</a></div>${cat?`<a class="sp-card-category" href="${esc(cat.path)}">${esc(cat.title)}</a>`:''}<h3><a href="${esc(p.path)}">${esc(p.name)}</a></h3><p class="sp-card-price">${esc(price(p))} <span>be PVM</span></p></article>`;
}
const hiddenQuery=(query,omit=[])=>[...query].filter(([k])=>['s','q','min_price','max_price','product_count','products-per-page','orderby'].includes(k)&&!omit.includes(k)).map(([k,v])=>`<input type="hidden" name="${esc(k)}" value="${esc(v)}">`).join('');
function categoryContent(route){
  if(!route.html)return '';
  const image=route.introImage||route.images.find(i=>/Paraso-plansetes-signotec-1024x602\.jpg$|epsilon_produktbild_12-1\.png$/.test(i.src));
  return `<article class="sp-prose sp-category-prose">${image?signaturepadsImage({...image,alt:image.alt||route.title},{className:'sp-category-intro-image',sizes:'(max-width: 720px) calc(100vw - 40px), 487px'}):''}${html(route.html)}</article>`;
}
function catalogue(data,route,query){
  let products=route.kind==='category'?route.productIds.map(id=>data.products.find(p=>p.id===id)).filter(Boolean):[...data.products];
  const available=products;
  const number=value=>value!==null&&value!==''&&Number.isFinite(Number(value))?Number(value):null;
  const min=number(query.get('min_price')),max=number(query.get('max_price')),term=(query.get('s')||query.get('q')||'').slice(0,100);
  if(min!==null)products=products.filter(p=>Number(p.prices.price)/100>=min);
  if(max!==null)products=products.filter(p=>Number(p.prices.price)/100<=max);
  if(term)products=products.filter(p=>p.name.toLocaleLowerCase('lt').includes(term.toLocaleLowerCase('lt')));
  const order=query.get('orderby')||'price';
  if(order==='price')products.sort((a,b)=>+a.prices.price-+b.prices.price||a.id-b.id);
  else if(order==='price-desc')products.sort((a,b)=>+b.prices.price-+a.prices.price||b.id-a.id);
  else if(order==='title')products.sort((a,b)=>a.name.localeCompare(b.name,'lt'));
  else if(data.catalogueOrders?.[order]){
    const rank=new Map(data.catalogueOrders[order].map((id,i)=>[id,i]));
    products.sort((a,b)=>(rank.get(a.id)??Infinity)-(rank.get(b.id)??Infinity)||b.id-a.id);
  }
  const count=query.get('products-per-page')||query.get('product_count')||'12',limit=count==='all'?100:Math.max(1,Math.min(100,parseInt(count)||12)),total=Math.max(1,Math.ceil(products.length/limit));
  const current=Math.max(1,Math.min(total,parseInt(query.get('paged')||'1')||1));
  const url=(key,value)=>{const q=new URLSearchParams(query);q.set(key,String(value));if(key==='products-per-page')q.delete('product_count');if(key!=='paged')q.delete('paged');return `${route.path}?${esc(q.toString())}`;};
  const floor=Math.floor(Math.min(...available.map(p=>+p.prices.price/100))/10)*10,ceiling=Math.ceil(Math.max(...available.map(p=>+p.prices.price/100))/10)*10;
  const low=min??floor,high=max??ceiling,rangeMin=Math.min(floor,low,high),rangeMax=Math.max(ceiling,low,high);
  const money=n=>n.toLocaleString('lt-LT',{maximumFractionDigits:2})+'€';
  const family=route.categoryId===2827?'software':route.kind==='category'?'equipment':'all';
  const sidebar=family==='all'?'':`<aside class="sp-sidebar"><form action="${esc(route.path)}" class="sp-price-filter"><h2>Filtruoti pagal kainą</h2>${hiddenQuery(query,['min_price','max_price'])}<div class="sp-price-ranges"><span class="sp-price-track"></span><input type="range" name="min_price" min="${rangeMin}" max="${rangeMax}" step="0.01" aria-label="Min kaina" value="${low}"><input type="range" name="max_price" min="${rangeMin}" max="${rangeMax}" step="0.01" aria-label="Maks kaina" value="${high}"></div><div class="sp-price-caption"><span>Kaina: <output>${esc(money(low))} — ${esc(money(high))}</output></span><button class="sp-button">Filtruoti</button></div></form><h2>Produkto kategorijos</h2>${data.categories.map(c=>`<a href="${esc(c.path)}"${route.categoryId===c.id?' aria-current="page"':''}>${esc(decoded(c.name))}</a>`).join('')}</aside>`;
  const orders=[['popularity','Rikiuoti pagal populiarumą'],['rating','Rikiuoti pagal vertinimą'],['date','Rikiuoti nuo naujausių'],['price','Rikiuoti pagal kainą (min → maks)'],['price-desc','Rikiuoti pagal kainą (maks → min)']];
  const results=`<section class="sp-catalogue-results" aria-label="Produktai"><div class="sp-catalogue-tools"><form action="${esc(route.path)}" data-catalogue-sort>${hiddenQuery(query,['orderby'])}<label class="sp-sr" for="product-order">Rikiuoti</label><select id="product-order" name="orderby">${orders.map(([value,label])=>`<option value="${value}"${order===value?' selected':''}>${label}</option>`).join('')}</select><button class="sp-sort-submit" type="submit">Rikiuoti</button></form><div>Rodyti ${['12','24','all'].map(n=>`<a href="${url('products-per-page',n)}"${n===count?' aria-current="true"':''}>${n==='all'?'Visus':n}</a>`).join('')}</div></div><div class="sp-products-grid">${products.slice((current-1)*limit,current*limit).map(p=>card(data,p)).join('')||'<p>Produktų nerasta.</p>'}</div>${total>1?`<nav class="sp-pagination" aria-label="Puslapiai">${Array.from({length:total},(_,i)=>`<a href="${url('paged',i+1)}"${current===i+1?' aria-current="page"':''}>${i+1}</a>`).join('')}</nav>`:''}</section>`;
  return `<div class="sp-wrap sp-catalogue sp-catalogue--${family}"><h1${family==='all'?' class="sp-sr"':''}>${esc(route.title.replace(/ -$/,''))}</h1><div class="sp-catalogue-layout">${family==='software'?results+sidebar:sidebar+results}</div>${route.kind==='category'?categoryContent(route):''}</div>`;
}
function productGallery(p){
  const width=p.images[0].displayWidth||300;
  return `<div class="sp-gallery"><a href="${esc(p.images[0].src)}" class="sp-gallery-main" data-zoom style="--sp-gallery-width:${width}px" aria-label="${esc(p.name)}">${signaturepadsImage({...p.images[0],alt:p.name},{eager:true,sizes:`(max-width: 720px) min(calc(100vw - 20px), ${width}px), ${width}px`})}<span class="sp-zoom-icon" aria-hidden="true"><svg viewBox="0 0 24 24"><circle cx="10" cy="10" r="5" fill="none" stroke="currentColor" stroke-width="2"/><path d="m14 14 6 6" fill="none" stroke="currentColor" stroke-width="2"/></svg></span></a>${p.images.length>1?`<div class="sp-thumbnails">${p.images.map((image,i)=>`<a href="${esc(image.src)}" data-gallery="${esc(p.id)}" data-display-width="${image.displayWidth||550}" aria-label="${esc(p.name)} ${i+1}"${i===0?' aria-current="true"':''}>${signaturepadsImage(image,{sizes:'100px'})}</a>`).join('')}</div>`:''}</div>`;
}
function product(data,route){
  const p=data.products.find(p=>p.id===route.productId);
  const category=data.routes.find(r=>r.kind==='category'&&r.productIds.includes(p.id));
  const related=(category?.productIds||data.products.map(p=>p.id)).filter(id=>id!==p.id).slice(0,4).map(id=>data.products.find(p=>p.id===id)).filter(Boolean);
  return `<div class="sp-wrap sp-product-page"><div class="sp-product">${productGallery(p)}<article class="sp-product-copy"><h1>${esc(p.name)}</h1><div class="sp-prose">${html(p.contentHtml)}</div><p class="sp-product-price">${esc(price(p))} <span>be PVM</span></p><a class="sp-button sp-product-enquiry" href="/#kontaktai">SUSISIEKITE SU MUMIS!</a></article></div><section class="sp-section sp-related"><h2>PANAŠŪS PRODUKTAI</h2><div class="sp-related-grid">${related.map(p=>card(data,p)).join('')}</div></section></div>`;
}
export function renderSignaturepads(data,route,query=new URLSearchParams()){
  const content=html(route.html);
  const heading=content.match(/^(\s*)<h[12]\b[^>]*>([\s\S]*?)<\/h[12]>/i);
  const page=heading?content.replace(heading[0],`${heading[1]}<h1>${heading[2]}</h1>`):`<h1>${esc(route.title.replace(/ -$/,''))}</h1>${content}`;
  const body=route.kind==='home'?home(data):route.kind==='product'?product(data,route):['category','catalog'].includes(route.kind)?catalogue(data,route,query):`<article class="sp-wrap sp-page sp-prose">${page}</article>`;
  return `${header(data,route)}<main id="main">${body}</main>${footer(data)}<a class="sp-top" href="#main" aria-label="Į viršų" hidden><svg viewBox="0 0 24 24" aria-hidden="true"><path d="m4 15 8-8 8 8" fill="none" stroke="currentColor" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/></svg></a><dialog class="sp-dialog sp-product-dialog" aria-label="Greita peržiūra"><button class="sp-dialog-close" aria-label="Uždaryti">×</button><div class="sp-dialog-content"></div></dialog><dialog class="sp-dialog sp-image-dialog" aria-label="Greita peržiūra"><button class="sp-dialog-close" aria-label="Uždaryti">×</button><div class="sp-dialog-content"></div></dialog>`;
}
