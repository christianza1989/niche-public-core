// Published commerce content augments only the two existing LT product URLs.
// Editorial page admission and future article dates remain owned by the content core.
export function memoProductSku(page){return page?.slug==='rinkinys-porai'?'couple':page?.slug==='seimos-rinkinys'?'family':null;}
export function memoDescriptionBlocks(description){
 const blocks=[];let paragraph=[],items=[];
 const flush=()=>{if(paragraph.length){blocks.push({type:'paragraph',text:paragraph.join('\n')});paragraph=[];}if(items.length){blocks.push({type:'list',items});items=[];}};
 for(const line of description.split('\n')){
  const heading=line.match(/^(#{2,3})\s+(.+)$/),item=line.match(/^-\s+(.+)$/);
  if(!line.trim()){flush();continue;}
  if(heading){flush();blocks.push({type:'heading',level:heading[1].length,text:heading[2]});}
  else if(item){if(paragraph.length)flush();items.push(item[1]);}
  else{if(items.length)flush();paragraph.push(line);}
 }flush();return blocks;
}
export function memoApplyProductContent(page,product){
 if(!page||!memoProductSku(page)||product?.sku!==memoProductSku(page))return page;
 const c=product.content;
 const body=c?.description?.trim() ? memoDescriptionBlocks(c.description) : page.body;
 const contents=c?.contents?.trim() ? [{type:'heading',level:2,text:'Kas įeina į rinkinį?'},{type:'list',items:c.contents.split('\n').map(s=>s.trim()).filter(Boolean)}] : [];
 return {...page,title:product.title||page.title,description:c?.summary||page.description,
  seoTitle:c?.seoTitle||product.title||page.title,seoDescription:c?.seoDescription||c?.summary||page.description,
  body:contents.length?[...body,...contents]:body,
  media:c?.images?.length?c.images.map(m=>({...m,rights:'owner-managed-product-media'})):page.media};
}
