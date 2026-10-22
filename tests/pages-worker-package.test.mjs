import assert from 'node:assert/strict';
import {test} from 'node:test';
import {mkdtemp,mkdir,readFile,writeFile,access} from 'node:fs/promises';
import path from 'node:path';
import {packagePagesWorker} from '../scripts/package-pages-worker.mjs';

async function fixture(){
 await mkdir(path.resolve('.local'),{recursive:true});
 const root=await mkdtemp(path.resolve('.local/pages-package-test-'));
 await mkdir(path.join(root,'dist/server/assets'),{recursive:true});
 await mkdir(path.join(root,'dist/client/assets'),{recursive:true});
 await writeFile(path.join(root,'dist/server/wrangler.json'),JSON.stringify({main:'index.js',compatibility_date:'2026-05-15',compatibility_flags:['nodejs_compat'],d1_databases:[{binding:'DB',database_id:'private-test-id'}]}));
 await writeFile(path.join(root,'dist/server/index.js'),'export const marker="cycle-proof";export default{async fetch(){return(await import(`./assets/ssr.js`)).render()}}');
 await writeFile(path.join(root,'dist/server/assets/ssr.js'),'export async function render(){const entry=await import(`../index.js`);return new Response(entry.marker)}');
 await writeFile(path.join(root,'dist/client/assets/site.css'),'body{color:#123}');
 await writeFile(path.join(root,'dist/client/assets/site.css.map'),'private source map');
 return {root,output:path.join(root,'.local/pages-r1')};
}

test('packages circular backtick SSR imports before relocation, preserving assets and incumbent asset-first routing',async()=>{
 const f=await fixture(),result=await packagePagesWorker({projectRoot:f.root,outputDirectory:f.output});
 assert.equal(result.modules.length,2);assert.equal(result.bundleInputs,2);
 const worker=await readFile(path.join(f.output,'_worker.js'),'utf8');
 assert.doesNotMatch(worker,/import\([`'"]\.\.\/index\.js/);
 const {default:entry}=await import(`data:text/javascript;base64,${Buffer.from(worker).toString('base64')}`);
 assert.equal(await(await entry.fetch()).text(),'cycle-proof');
 assert.equal(await readFile(path.join(f.output,'assets/site.css'),'utf8'),'body{color:#123}');
 await assert.rejects(access(path.join(f.output,'assets/site.css.map')));
 await assert.rejects(access(path.join(f.output,'wrangler.json')));
 const routes=JSON.parse(await readFile(path.join(f.output,'_routes.json')));
 assert.deepEqual(routes,{version:1,include:['/*'],exclude:['/_next/static/*','/fonts/*']});
 for(const guarded of ['/content-assets/site/photo.webp','/images/private.webp','/uzklausa','/ivykius','/niche/private','/unknown-page'])assert.ok(!routes.exclude.some(pattern=>guarded.startsWith(pattern.slice(0,-1))));
 assert.equal(result.workerOwnsContentMediaAndForms,true);
 assert.equal(result.publicFrameworkAssetsOnUnknownHosts,true);
 assert.equal(result.staticFiles.length,1);assert.equal(result.deployed,false);assert.equal(result.staticExport,false);
 assert.equal(JSON.parse(await readFile(f.output+'.manifest.json')).bundleSha256,result.bundleSha256);
 await assert.rejects(packagePagesWorker({projectRoot:f.root,outputDirectory:f.output}),/already exists/);
});

test('rejects a compiled dynamic import escaping the server before publishing output',async()=>{
 const f=await fixture();await writeFile(path.join(f.root,'dist/server/index.js'),'export default()=>import(`../../private.js`)');
 await assert.rejects(packagePagesWorker({projectRoot:f.root,outputDirectory:f.output}),/escapes/);
 await assert.rejects(access(f.output));
});

test('rejects reserved worker and private config collisions in static assets',async()=>{
 for(const name of ['_worker.js','.env.production','wrangler.json','contacts.sqlite']){
  const f=await fixture();await writeFile(path.join(f.root,'dist/client',name),'private');
  await assert.rejects(packagePagesWorker({projectRoot:f.root,outputDirectory:f.output}),/Reserved or private/);
  await assert.rejects(access(f.output));
 }
});

test('refuses output outside the isolated private project directory',async()=>{
 const f=await fixture();await assert.rejects(packagePagesWorker({projectRoot:f.root,outputDirectory:path.join(f.root,'public')}),/private project/);
 await assert.rejects(access(path.join(f.root,'public')));
});
