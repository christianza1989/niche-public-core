import test from 'node:test';
import assert from 'node:assert/strict';
import {memoCartKey,memoNormalizeCart,memoReadCart,memoWriteCart} from '../lib/memocasting-cart.mjs';

test('cart strips customer fields, merges known selections and rejects an excessive combined quantity',()=>{
 assert.deepEqual(memoNormalizeCart([{sku:'couple',quantity:2,email:'private@example.test'},{sku:'family',quantity:1},{sku:'couple',quantity:3},{sku:'unknown',quantity:1},{sku:'wooden_base',quantity:0}]),[{sku:'couple',quantity:5},{sku:'family',quantity:1}]);
 assert.deepEqual(memoNormalizeCart([{sku:'couple',quantity:100},{sku:'couple',quantity:1}]),[]);
 for(const value of [null,{},Array(101).fill({sku:'couple',quantity:1})])assert.deepEqual(memoNormalizeCart(value),[]);
});

test('cart survives a read, reflects removal, clears after order and detects denied storage',()=>{
 const values=new Map(),storage={getItem:key=>values.get(key)??null,setItem:(key,value)=>values.set(key,value)};
 memoWriteCart(storage,[{sku:'couple',quantity:2},{sku:'family',quantity:1}]);
 assert.deepEqual(memoReadCart(storage),[{sku:'couple',quantity:2},{sku:'family',quantity:1}]);
 memoWriteCart(storage,[{sku:'family',quantity:1}]);assert.deepEqual(memoReadCart(storage),[{sku:'family',quantity:1}]);
 memoWriteCart(storage,[]);assert.deepEqual(memoReadCart(storage),[]);
 values.set(memoCartKey,'bad json');assert.deepEqual(memoReadCart(storage),[]);
 values.set(memoCartKey,' '.repeat(10001));assert.deepEqual(memoReadCart(storage),[]);
 assert.throws(()=>memoWriteCart({setItem(){},getItem(){return null;}},[{sku:'couple',quantity:1}]),/cart_storage_unavailable/);
 assert.deepEqual(memoReadCart({getItem(){throw Error('denied');}}),[]);
});

test('included paint migrates old unsent paid variants and drops separate paint without changing kit quantity or charging twice',()=>{
 const legacy=[{sku:'couple_white',quantity:2},{sku:'couple',quantity:1},{sku:'white_paint',quantity:3},{sku:'family',quantity:2},{sku:'wooden_base',quantity:1}];
 const expected=[{sku:'couple',quantity:3},{sku:'family',quantity:2},{sku:'wooden_base',quantity:1}];
 assert.deepEqual(memoNormalizeCart(legacy),expected);
 assert.deepEqual(memoNormalizeCart([{sku:'white_paint',quantity:1}]),[]);
 assert.deepEqual(memoNormalizeCart([{sku:'couple_white',quantity:100},{sku:'couple',quantity:1}]),[]);
 assert.deepEqual(memoReadCart({getItem:()=>JSON.stringify(legacy)}),expected);
 assert.equal(legacy[0].sku,'couple_white','do not mutate the original snapshot');
});
