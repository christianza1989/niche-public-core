import test from 'node:test';import assert from 'node:assert/strict';
import{o3techInquiryMessage}from'../lib/o3tech-inquiry.mjs';
import{o3techMarkup}from'../lib/o3tech-render.mjs';
import{o3techBrandAssets}from'../lib/o3tech-brand.mjs';
import layoutConfig from'../config/o3tech-layout.json'with{type:'json'};
import {o3Inline,o3Signature} from '../lib/o3tech-format.mjs';
import {o3techFilteredCatalogue} from '../lib/o3tech-catalogue.mjs';
import cataloguePolicy from '../config/o3tech-catalogue.json' with {type:'json'};
const form=values=>new URLSearchParams({message:'A real inquiry of at least twenty characters.',...values});
test('o3tech preserves bounded phone and contact preference in native durable message',()=>{
 assert.match(o3techInquiryMessage(form({phone:'+37060000000',contact_method:'Telefonu'})),/Telefono nr.: \+37060000000\nTelefonu$/);
 assert.equal(o3techInquiryMessage(form({})),form({}).get('message'));
 assert.equal(o3techInquiryMessage(form({message:''})), '');
 assert.equal(o3techInquiryMessage(form({message:'Trumpai'})), 'Trumpai');
 for(const value of [{message:'x'.repeat(2801)},{phone:'x'.repeat(81)},{phone:'hello\nInjected'},{contact_method:'untrusted'}])assert.equal(o3techInquiryMessage(form(value)),null);
});
function fixture(){
 const home={id:'home',siteId:'o3tech',type:'home',slug:'',title:'Existing home',body:[],media:[],links:[]};
 const catalogue={id:'catalogue',siteId:'o3tech',type:'faq',slug:'prekes',title:'Prekės',body:[],media:[],links:[]};
 const product={id:'product',siteId:'o3tech',type:'product',slug:'produktas/fixture',title:'Fixture <safe>',body:[{type:'paragraph',text:'Original technical description.'}],media:[],links:[]};
 const layout={assets:{},home:{formOptions:[],contactLinks:[],categoryCards:[]},pages:{home:{kind:'home',sections:Array.from({length:9},()=>({start:0,end:0}))},catalogue:{kind:'catalogue',productPaths:['/produktas/fixture/','/produktas/hidden/']},product:{kind:'product'}}};
 const pkg={siteId:'o3tech',site:{contact:{email:'owner@example.test',phone:'+37060000000'}}};return{home,catalogue,product,layout,pkg};
}
test('catalogue only renders products supplied by the shared projection and escapes source words',()=>{
 const f=fixture(),pages=[f.home,f.catalogue,f.product];
 const html=o3techMarkup({...f,page:f.catalogue,pages});
 assert.match(html,/Fixture &lt;safe&gt;/);assert.doesNotMatch(html,/produktas\/hidden|add-to-cart|<script|<iframe/);
 const hidden=o3techMarkup({...f,page:f.catalogue,pages:pages.slice(0,2)});assert.doesNotMatch(hidden,/Fixture/);
 assert.throws(()=>o3techMarkup({...f,page:f.product,pages:pages.slice(0,2)}));
 assert.throws(()=>o3techMarkup({...f,pkg:{...f.pkg,siteId:'foreign'},page:f.catalogue,pages}));
});
test('brand metadata cannot expose a missing, foreign-site or unpublished homepage asset',()=>{
 assert.equal(o3techBrandAssets({siteId:'foreign'},[]),null);
 assert.equal(o3techBrandAssets({siteId:'o3tech'},[]),null);
 const h={type:'home',slug:'',media:[{id:layoutConfig.assets.icon,src:'/content-assets/foreign/icon.webp'}]};
 assert.equal(o3techBrandAssets({siteId:'o3tech'},[h]).icon,undefined);
 h.media[0].src='/content-assets/o3tech/fixture.webp';
 assert.equal(o3techBrandAssets({siteId:'o3tech'},[h]).icon,h.media[0]);
});

test('source formatting is bound to exact text, escapes markup and cannot revive a hidden internal target',()=>{
 const text='Original <safe> link';const format={signature:o3Signature(text),ranges:[{kind:'strong',start:0,end:8},{kind:'link',start:16,end:20,href:'https://o3tech.lt/hidden/'}]};
 const html=o3Inline(text,format,[]);assert.match(html,/<strong>Original<\/strong>/);assert.match(html,/&lt;safe&gt;/);assert.doesNotMatch(html,/<a/);
 assert.equal(o3Inline(text+' changed',format,[]),'Original &lt;safe&gt; link changed');
 assert.match(o3Inline('link',{signature:o3Signature('link'),ranges:[{kind:'link',start:0,end:4,href:'https://o3tech.lt/kept'}]},[{slug:'kept'}]),/href="\/kept\/"/);
 const hostile={signature:o3Signature('link'),ranges:[{kind:'link',start:0,end:4,href:'javascript:alert(1)'}]};assert.equal(o3Inline('link',hostile,[]),'link');
 const f=fixture();f.product.body=[{type:'list',items:['One','Two']}];f.layout.pages.product.format={0:{signature:o3Signature('One\nTwo'),ordered:true,start:2}};
 assert.match(o3techMarkup({...f,page:f.product,pages:[f.home,f.catalogue,f.product]}),/<ol start="2"><li>One<\/li><li>Two<\/li><\/ol>/);
});

test('only exact o3tech catalogue query variants are nonindexable, and price filtering cannot expose an omitted product',()=>{
 const index=cataloguePolicy.indices[0],page={id:index.pageId,slug:index.slug};const pkg={siteId:'o3tech',canonicalHost:'o3tech.lt'};
 assert.equal(o3techFilteredCatalogue(pkg,page,'?min_price=30'),true);assert.equal(o3techFilteredCatalogue(pkg,page,''),false);
 assert.equal(o3techFilteredCatalogue({...pkg,siteId:'foreign'},page,'?show=12'),false);assert.equal(o3techFilteredCatalogue(pkg,{id:'unknown',slug:index.slug},'?show=12'),false);
 const f=fixture();f.product.body.push({type:'paragraph',text:'99,00€'});f.layout.pages.product.priceBlock=1;
 const hidden=o3techMarkup({...f,page:f.catalogue,pages:[f.home,f.catalogue,f.product],query:{min_price:'100',max_price:'1000'}});assert.doesNotMatch(hidden,/class="o3-product-card"/);
 const visible=o3techMarkup({...f,page:f.catalogue,pages:[f.home,f.catalogue,f.product],query:{min_price:'not-a-number'}});assert.match(visible,/Fixture &lt;safe&gt;/);assert.doesNotMatch(visible,/produktas\/hidden/);
});
