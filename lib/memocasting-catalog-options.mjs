export function memoAvailableExtra(catalog,extra,kit,country) {
 const item=catalog.find(p=>p.sku===extra);
 const pack=item?.package;
 return item?.enabled===true&&Number.isInteger(item.available)&&item.available>0
  &&item.addonFor?.includes(kit)&&Number.isInteger(item.prices?.[country])&&item.prices[country]>0
  &&Number.isInteger(pack?.weightGrams)&&pack.weightGrams>0
  &&Array.isArray(pack.dimensionsMm)&&pack.dimensionsMm.length===3
  &&pack.dimensionsMm.every(d=>Number.isInteger(d)&&d>0)?item:null;
}
