export function memoMarketCurrency(payload,country) {
 const value=Array.isArray(payload?.markets)?payload.markets.find(m=>m?.country===country)?.currency:null;
 return typeof value==='string'&&/^[A-Z]{3}$/.test(value)?value:'';
}
export function memoAvailableProduct(catalog,sku,country) {
 if(!Array.isArray(catalog))return null;
 const item=catalog.find(p=>p?.sku===sku);
 const pack=item?.package;
 return item?.enabled===true&&Number.isInteger(item.available)&&item.available>0
  &&Number.isInteger(item.prices?.[country])&&item.prices[country]>0
  &&Number.isInteger(pack?.weightGrams)&&pack.weightGrams>0
  &&Array.isArray(pack.dimensionsMm)&&pack.dimensionsMm.length===3
  &&pack.dimensionsMm.every(d=>Number.isInteger(d)&&d>0)?item:null;
}
export function memoAvailableExtra(catalog,extra,kit,country) {
 const item=memoAvailableProduct(catalog,extra,country);
 return item?.addonFor?.includes(kit)?item:null;
}
