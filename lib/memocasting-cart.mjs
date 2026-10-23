import {normalizedChoices,selectionKey} from '../vendor/commerce-core/commerce-client.mjs';
export const memoCartKey = 'memo_cart_v1';
const skus = new Set(['couple', 'family', 'wooden_base']);

// Store only product selections; customer details and order access stay in the shared client.
export function memoNormalizeCart(value) {
  if (!Array.isArray(value) || value.length > 100) return [];
  const result = new Map(),totals=new Map();
  for (const line of value) {
    // Owner2026-10-14: paint is included. Only migrate unsent cart selections;
    // the shared client's existing order/recovery snapshots remain immutable.
    const sku = line?.sku==='couple_white'?'couple':line?.sku;
    if (!line || !skus.has(sku) || !Number.isInteger(line.quantity) || line.quantity < 1 || line.quantity > 100) continue;
    let choices;try{choices=normalizedChoices(line.choices);}catch{return [];}
    const key=selectionKey({sku,choices}),total=(totals.get(sku)||0)+line.quantity;
    const quantity=(result.get(key)?.quantity||0)+line.quantity;
    if(total>100)return [];totals.set(sku,total);
    result.set(key,{sku,quantity,...(Object.keys(choices).length?{choices}:{})});
  }
  return [...result.values()];
}

export function memoReadCart(storage) {
  try {
    const raw = storage.getItem(memoCartKey);
    return raw && raw.length <= 10000 ? memoNormalizeCart(JSON.parse(raw)) : [];
  } catch { return []; }
}

export function memoWriteCart(storage, lines) {
  const value = JSON.stringify(memoNormalizeCart(lines));
  storage.setItem(memoCartKey, value);
  if (storage.getItem(memoCartKey) !== value) throw Error('cart_storage_unavailable');
}
