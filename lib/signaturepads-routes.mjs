import routes from '../sites/signaturepads/migration/core-routes.json' with { type: 'json' };
import { contentPagePath } from './content-renderers.mjs';

export function signaturepadsRoute(url, pages) {
  const path=url.pathname, query=url.searchParams;
  const normalized=path==='/'?'/':path.replace(/\/+$/,'')+'/';
  if(routes.retired.includes(normalized) || /^\/(?:cart|checkout|krepselis|krep[sš]elis|atsiskaitymas|apmokejimas|paysera)(?:\/|$)/i.test(path) || ['add-to-cart','wc-ajax','wc-api'].some(k=>query.has(k)))return {status:410};
  if(path==='/'){
    const legacy=query.get('p')||query.get('page_id');
    if(legacy){
      const target=routes.legacyIds[legacy];
      if(routes.retired.includes(target))return {status:410};
      if(target&&pages.some(p=>contentPagePath({siteId:'signaturepads',site:{renderer:'niche'}},p)===target)){
        const rest=new URLSearchParams(query);rest.delete('p');rest.delete('page_id');
        return {status:301,location:target+(rest.size?'?'+rest:'')};
      }
      return {status:404};
    }
    if(query.get('s'))return {status:302,location:'/prekes/?'+query};
  }
  const pagination=path.match(/^\/prekes\/page\/(\d+)\/?$/);
  if(pagination&&pagination[1]==='2'&&pages.some(p=>p.slug==='prekes')){
    const rest=new URLSearchParams(query);rest.set('paged','2');return {status:301,location:'/prekes/?'+rest};
  }
  if(path!==normalized && pages.some(p=>contentPagePath({siteId:'signaturepads',site:{renderer:'niche'}},p)===normalized))return {status:308,location:normalized+url.search};
  return null;
}

export const signaturepadsFiltered = query => ['s','min_price','max_price','orderby','paged','product_count'].some(k=>query.has(k));
