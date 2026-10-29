import test from 'node:test';import assert from 'node:assert/strict';
import{o3techInquiryMessage}from'../lib/o3tech-inquiry.mjs';
import{o3techMarkup}from'../lib/o3tech-render.mjs';
import{o3techBrandAssets}from'../lib/o3tech-brand.mjs';
import layoutConfig from'../config/o3tech-layout.json'with{type:'json'};
const form=values=>new URLSearchParams({message:'A real inquiry of at least twenty characters.',...values});
test('o3tech preserves bounded phone and contact preference in native durable message',()=>{
 assert.match(o3techInquiryMessage(form({phone:'+37060000000',contact_method:'Telefonu'})),/Telefono nr.: \+37060000000\nTelefonu$/);
 assert.equal(o3techInquiryMessage(form({})),form({}).get('message'));
 for(const value of [{message:''},{message:'x'.repeat(2801)},{phone:'x'.repeat(81)},{phone:'hello\nInjected'},{contact_method:'untrusted'},{contact_method:'Telefonu',phone:''}])assert.equal(o3techInquiryMessage(form(value)),'');
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
