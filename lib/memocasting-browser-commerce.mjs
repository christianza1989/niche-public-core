import {CommerceClient} from '../vendor/commerce-core/commerce-client.mjs';
import {memoReadCart,memoWriteCart} from './memocasting-cart.mjs';
export {memoCartKey} from './memocasting-cart.mjs';

// Product, catalogue and footer do not need to load the checkout UI or its CSS.
// Keep the same same-origin transport and existing tab-local cart contract.
export function memoCommerceClient(){return new CommerceClient({fetchImpl:(path,init)=>{
 if(!path.startsWith('/api/'))throw Error('invalid_api_route');
 return fetch('/prekyba/'+path.slice(5),init);
}});}
export function memoCartLines(){try{return memoReadCart(sessionStorage);}catch{return [];}}
export function memoSaveCart(lines){memoWriteCart(sessionStorage,lines);}
