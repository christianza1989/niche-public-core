// Receives only eligible legacy->current paths from the server. No catalogue
// package or redirect registry is bundled into the browser's JavaScript.
export function migrateInquiryItems(items,aliases){
 const byPath=new Map();
 for(const item of items){
  const path=Object.hasOwn(aliases,item.path)?aliases[item.path]:item.path;
  const existing=byPath.get(path);
  if(existing){existing.quantity=Math.min(999,existing.quantity+item.quantity);if(path===item.path){existing.title=item.title;existing.sku=item.sku;}}
  else byPath.set(path,{...item,path});
 }
 return [...byPath.values()];
}
