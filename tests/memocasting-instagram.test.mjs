import {test} from 'node:test';
import assert from 'node:assert/strict';
import {memoInstagramPosts,memoInstagramUrl,memoInstagramMarkup} from '../lib/memocasting-instagram.mjs';
test('curated Instagram links preserve real source authors and never load third-party frames/scripts',()=>{
 for(const p of memoInstagramPosts)assert.equal(memoInstagramUrl(p.url),p.url);
 for(const value of ['javascript:alert(1)','https://www.instagram.com.evil.test/a/reel/AbCdEf/','https://user:pass@www.instagram.com/a/reel/AbCdEf/','https://www.instagram.com/a/reel/AbCdEf/?session=secret','https://www.instagram.com/a/reel/AbCdEf/#token','http://www.instagram.com/a/reel/AbCdEf/'])assert.equal(memoInstagramUrl(value),null);
 const html=memoInstagramMarkup();assert.equal((html.match(/<article/g)||[]).length,3);assert.ok(!/<iframe|<script|<img/.test(html));assert.ok(html.includes('@karolinameschino'));assert.ok(html.includes('Reklaminis bendradarbiavimas.'));
});
