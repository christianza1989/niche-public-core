import assets from './memocasting-gallery-assets.json' with {type:'json'};

export const memoGalleryCopy={
 title:'Prisiminimai, įgavę formą.',
 intro:'Vienas gestas. Tūkstančiai istorijų.',
 note:'Įkvėpimo iliustracijos. Jos nerodo klientų darbų ar tikslios rinkinių komplektacijos.',
};
export const memoGalleryFilters=[{id:'all',label:'Visos'},{id:'couple',label:'Porai'},{id:'family',label:'Šeimai'},{id:'detail',label:'Gestai'}];
export const memoInspirationItems=assets.items.map(item=>{
 const full=item.variants.at(-1),preview=item.variants.find(v=>v.width>=800)??full;
 return {...item,src:preview.src,fullSrc:full.src,width:full.width,height:full.height,srcSet:item.variants.map(v=>`${v.src} ${v.width}w`).join(', ')};
});
// Selection always belongs to the active category, including a one-image filter.
export function memoGallerySelection(items,filter='all',selectedId){
 const images=items.filter(item=>filter==='all'||item.category===filter);
 const index=Math.max(0,images.findIndex(item=>item.id===selectedId));
 return {images,index,image:images[index]??null};
}
export function memoGalleryStep(items,filter,selectedId,delta){
 const {images,index}=memoGallerySelection(items,filter,selectedId);
 return images.length?images[((index+delta)%images.length+images.length)%images.length].id:null;
}
export function memoGallerySwipe(start,end){
 if(!start||!end||end.time-start.time>850)return 0;
 const x=end.x-start.x,y=end.y-start.y;
 return Math.abs(x)>=48&&Math.abs(x)>Math.abs(y)*1.4?(x<0?1:-1):0;
}
