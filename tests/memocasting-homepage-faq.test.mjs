import test from 'node:test';import assert from 'node:assert/strict';
import {memoHomepageBlocks} from '../lib/memocasting-homepage-markup.mjs';
import {memoHomepageFaq,memoHomepageFaqPlacement} from '../lib/memocasting-homepage-faq.mjs';
test('homepage FAQ uses all six reviewed native answers and eligible help links only',()=>{
 const p={slug:'',body:memoHomepageBlocks},faq=memoHomepageFaq(p,[{slug:'pages/instrukcija'},{slug:'kontaktai'}]);
 assert.equal(faq.items.length,6);assert.match(faq.items[0].answers[0],/1 200 g/);assert.match(faq.items[2].answers[0],/Balti dažai įeina/);assert.match(faq.items[3].answers[0],/5–7 paras/);
 assert.deepEqual(faq.links.map(l=>l.href),['/pages/instrukcija','/kontaktai']);
 assert.equal(memoHomepageFaq({...p,slug:'pl'},[]),null);assert.equal(memoHomepageFaq({...p,body:p.body.slice(1)},[]),null);
 const story='<section id="gidai">Guides</section><section class="questions" id="klausimai"><h2>Old FAQ</h2><div>Answers</div></section><section class="closing">Closing</section>';
 const placement=memoHomepageFaqPlacement(story,faq);assert.equal(placement.before,'<section id="gidai">Guides</section>');assert.equal(placement.after,'<section class="closing">Closing</section>');assert.equal(placement.replace,true);
 assert.deepEqual(memoHomepageFaqPlacement(story,null),{before:story,after:'',replace:false});
});
