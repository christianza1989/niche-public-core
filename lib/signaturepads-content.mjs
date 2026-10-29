import { signaturepadsImage } from '../components/niche/signaturepads/render.mjs';
import { contentPagePath } from './content-renderers.mjs';

const esc = text => String(text ?? '').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const textOf = block => block?.text ?? block?.content?.map(n=>n.text).join('') ?? '';
const priceOf = (page, role) => {
  const match = textOf(page.body[role.priceBlock]).match(/^(\d+),(\d{2})€ be PVM$/);
  return match ? {price:match[1]+match[2],currency_minor_unit:2} : null;
};
export function assertSignaturepadsLayout(pkg, layout) {
  for (const page of pkg.pages) {
    const role=layout.routes[page.id];
    if (!role || role.path !== contentPagePath(pkg,page) || !textOf(page.body[0])) throw Error('Signaturepads page needs a reviewed layout binding');
    if (role.kind==='product' && (!priceOf(page,role) || !role.gallery.length || role.gallery.some(fid=>!page.media.some(m=>m.familyId===fid)))) throw Error('Signaturepads product price/gallery binding changed; review the layout');
  }
}

// Caller supplies only the common publication projection (or an explicitly
// private draft preview). No source HTML, original prices or draft fallback.
export function signaturepadsSnapshot(pkg, pages, layout) {
  const home = pages.find(p=>p.slug===''&&p.type==='home');
  if (!home || pkg.siteId!=='signaturepads') return null;
  const localHref = href => {
    const u=new URL(href);
    return u.origin===`https://${pkg.canonicalHost}` ? u.pathname+u.search+u.hash : u.href;
  };
  const image = (page,familyId) => {
    const variants=page.media.filter(m=>m.familyId===familyId).sort((a,b)=>a.width-b.width);
    const primary=variants.at(-1);
    return primary ? {...primary,variants} : null;
  };
  const marked = (text, marks, offset) => {
    const breaks=new Set([0,text.length]);
    for(const m of marks||[])for(const n of [m.from-offset,m.to-offset])if(n>0&&n<text.length)breaks.add(n);
    const points=[...breaks].sort((a,b)=>a-b);
    return points.slice(0,-1).map((start,i)=>{
      const end=points[i+1], tags=[...new Set((marks||[]).filter(m=>m.from<=start+offset&&m.to>=end+offset&&['strong','em'].includes(m.tag)).map(m=>m.tag))];
      return tags.map(t=>`<${t}>`).join('')+esc(text.slice(start,end)).replace(/\n/g,'<br>')+[...tags].reverse().map(t=>`</${t}>`).join('');
    }).join('');
  };
  const inline = (nodes, marks=[]) => {
    let offset=0;
    return nodes.map(n=>{const text=marked(n.text,marks,offset);offset+=n.text.length;
      return n.type==='link' ? `<a href="${esc(localHref(n.href))}">${text}</a>` : text;}).join('');
  };
  const bodyHTML = (page,start,end) => page.body.slice(start,end).map((b,k)=>{
    const style=layout.styles[page.id]?.[start+k]||{};
    const gap='<p aria-hidden="true">&nbsp;</p>'.repeat(Math.min(style.gapBefore||0,3));
    if(b.type==='image'){
      const asset=page.media.find(m=>m.id===b.assetId);
      return gap+(asset?signaturepadsImage(image(page,asset.familyId)): '');
    }
    if(b.type==='list'||b.type==='richList'){
      const tag=b.ordered?'ol':'ul';
      return gap+`<${tag}>`+b.items.map((row,i)=>`<li>${Array.isArray(row)?inline(row,style.rows?.[i]):esc(row)}</li>`).join('')+`</${tag}>`;
    }
    const tag=['heading','richHeading'].includes(b.type)?`h${b.level}`:'p';
    const content=b.content?inline(b.content,style.marks):marked(b.text,style.marks,0);
    return gap+`<${tag}>${content}</${tag}>`;
  }).join('');
  const products=pages.flatMap(page=>{
    const role=layout.routes[page.id];
    if(role?.kind!=='product')return [];
    const prices=priceOf(page,role),images=role.gallery.map(fid=>image(page,fid)).filter(Boolean);
    if(!prices||!images.length)return [];
    return [{id:role.productId,name:textOf(page.body[0]),path:contentPagePath(pkg,page),prices,images,contentHtml:bodyHTML(page,role.copyStart,role.copyEnd)}];
  });
  const productIds=new Set(products.map(p=>p.id));
  const productByPath=new Map(products.map(p=>[p.path,p.id]));
  const routes=pages.flatMap(page=>{
    const role=layout.routes[page.id];
    if(!role||role.kind==='product'&&!productIds.has(role.productId))return [];
    const introImage=role.intro?image(page,role.intro):null;
    return [{...role,title:textOf(page.body[0]),metaTitle:page.title,description:page.description,
      productIds:(page.body[role.inventoryBlock]?.items||[]).flatMap(row=>row.filter(n=>n.type==='link').map(n=>productByPath.get(localHref(n.href)))).filter(id=>productIds.has(id)),
      html:bodyHTML(page,role.copyStart,role.copyEnd),images:introImage?[introImage]:[],introImage}];
  });
  const categories=routes.filter(r=>r.kind==='category').map(r=>({id:r.categoryId,path:r.path,name:r.title}));
  const cardRows=home.body[layout.home.cardBlock]?.items||[];
  const trustRows=home.body[layout.home.trustBlock]?.items||[];
  const accordions=layout.home.accordions.map(a=>({title:textOf(home.body[a.titleBlock]),html:bodyHTML(home,a.start,a.end)}));
  const h={title:textOf(home.body[0]),logo:image(home,layout.home.logo),background:image(home,layout.home.background)?.src,
    images:layout.home.images.map(fid=>image(home,fid)),accordions,selectOptions:['-Pasirinkite-','Telefonu','El. paštu'],
    categoryCards:cardRows.flatMap((row,i)=>{const n=row[0];return n?.type==='link'?[{title:n.text,href:localHref(n.href),image:image(home,layout.home.cardImages[i])}]:[];}),
    trust:trustRows.flatMap((row,i)=>{const n=row[0];return n?.type==='link'?[{url:n.href,label:n.text,image:image(home,layout.home.images[i+6])}]:[];})};
  return {home:h,routes,products,categories,contact:pkg.site.contact,favicon:home.media.find(m=>m.id===layout.home.favicon)?.src,
    // A withdrawn policy removes the form as well as rejecting its POST.
    leadEnabled:pages.some(p=>p.slug==='musu-slapuku-politika'&&p.type==='policy')};
}
