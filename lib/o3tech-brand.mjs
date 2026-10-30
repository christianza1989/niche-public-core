import layout from '../config/o3tech-layout.json' with {type:'json'};
// Only assets attached to the eligible homepage can be advertised in metadata.
export function o3techBrandAssets(pkg,pages){
 if(pkg.siteId!=='o3tech')return null;
 const home=pages.find(p=>p.type==='home'&&p.slug==='');if(!home)return null;
 const asset=role=>home.media.find(a=>a.id===layout.assets[role]&&a.src.startsWith('/content-assets/o3tech/'));
 return {icon:asset('icon'),background:asset('background')};
}
// The owner-selected decorative source image is served only with its homepage.
export function o3techPresentationAsset(pkg,pages,pathname){
 return pkg.siteId==='o3tech'&&pathname==='/brand/o3tech/hero-circles.png'&&pages.some(p=>p.type==='home'&&p.slug==='');
}
