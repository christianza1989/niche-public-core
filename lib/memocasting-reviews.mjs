// One public projection feeds visible product reviews and Product structured data.
export function memoReviewMetadata(pkg,path){return pkg?.siteId==='memocasting'&&path==='/atsiliepimas'?{title:'Palikti atsiliepimą – Memory Casting',description:'Pasidalykite savo pirkimo patirtimi ir liejinio nuotraukomis. Saugi su užsakymu susieta atsiliepimo forma.',siteName:'Memory Casting',robots:'noindex, nofollow',image:undefined,offer:undefined,type:'website'}:null;}
export function memoReviewProjection(value, sku) {
 if(!value||!Array.isArray(value.items)||!Array.isArray(value.stats))return null;
 const stats=value.stats.find(s=>s.sku===sku);
 const items=value.items.filter(r=>r.sku===sku&&typeof r.id==='string'&&typeof r.authorName==='string'&&Number.isInteger(r.rating)&&r.rating>=1&&r.rating<=5&&typeof r.body==='string'&&/^\d{4}-\d{2}-\d{2}$/.test(r.date)).map(r=>({...r,photos:(r.photos||[]).filter(p=>/^\/prekyba\/reviews\/photos\/[a-f0-9-]{36}$/.test(p.src))}));
 const directCount=Number.isSafeInteger(stats?.directCount)&&stats.directCount>=0&&stats.directCount<=stats.count?stats.directCount:0;
 const directAverage=directCount>0&&Number.isFinite(stats?.directAverage)&&stats.directAverage>=1&&stats.directAverage<=5?stats.directAverage:null;
 return {items,total:Number.isSafeInteger(value.total)?value.total:items.length,stats:stats&&Number.isSafeInteger(stats.count)&&stats.count>0&&Number.isFinite(stats.average)&&stats.average>=1&&stats.average<=5?{count:stats.count,average:stats.average,directCount,directAverage}:null};
}
export function memoReviewSchema(data) {
 // Legacy ownership does not establish where a rating was collected. Keep imports
 // visible, but never syndicate an unknown/external collection pool into Google markup.
 if(!data?.stats?.directCount||data.stats.directAverage===null)return {};
 const direct=data.items.filter(r=>r.schemaEligible===true);
 return {aggregateRating:{'@type':'AggregateRating',ratingValue:data.stats.directAverage,reviewCount:data.stats.directCount,bestRating:5,worstRating:1},...(direct.length?{review:direct.map(r=>({'@type':'Review',author:{'@type':'Person',name:r.authorName},datePublished:r.date,...(r.body?{reviewBody:r.body}:{}),...(r.title?{name:r.title}:{}),reviewRating:{'@type':'Rating',ratingValue:r.rating,bestRating:5,worstRating:1}}))}:{})};
}
