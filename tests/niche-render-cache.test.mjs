import test from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

if (process.argv.includes('--render-child')) {
  const { build } = await import('esbuild');
  const fs = await import('node:fs/promises');
  const { randomUUID } = await import('node:crypto');
  const { Writable } = await import('node:stream');
  const React = await import('react');
  const { renderToPipeableStream } = await import('react-server-dom-webpack/server.node');
  const { projectPublicPages } = await import('../lib/niche-links.mjs');
  const moduleUrl = new URL(`../.sites-runtime/cache-test-${randomUUID()}.mjs`, import.meta.url);
  await fs.mkdir(new URL('../.sites-runtime/', import.meta.url), { recursive: true });
  await build({entryPoints:[fileURLToPath(new URL('../lib/niche-sites.ts',import.meta.url))],
    outfile:fileURLToPath(moduleUrl),bundle:true,format:'esm',platform:'node',external:['react'],
    tsconfig:fileURLToPath(new URL('../tsconfig.json',import.meta.url)),plugins:[{
      name:'local-cloudflare-binding',setup(b){
        b.onResolve({filter:/^cloudflare:workers$/},()=>({path:'binding',namespace:'local-test'}));
        b.onLoad({filter:/.*/,namespace:'local-test'},()=>({contents:'export const env = {};'}));
      }
    }]});
  const oldNow = Date.now;
  try {
    const model = await import(moduleUrl.href);
    const pkg = model.nicheSiteById('promedical');
    const packages = JSON.parse(await fs.readFile(new URL('../lib/generated/content-packages.json',import.meta.url),'utf8'));
    const settings = JSON.parse(await fs.readFile(new URL('../config/niche-network.json',import.meta.url),'utf8'));
    const guides = pkg.pages.filter(p=>p.type==='guide');
    let renders=0;
    for (const guide of guides) for (const instant of [Date.parse(guide.publishAt)-1, Date.parse(guide.publishAt)]) {
      Date.now=()=>instant;
      let observed;
      function Probe() {
        const first=model.publicNichePages(pkg),second=model.publicNichePages(pkg);
        assert.strictEqual(first,second,'one React request must reuse its publication projection');
        assert.strictEqual(model.publicNichePage(pkg,guide.slug),first.find(p=>p.id===guide.id));
        observed=first;
        return React.createElement('p',null,String(first.length));
      }
      await new Promise((resolve,reject)=>{
        const stream=renderToPipeableStream(React.createElement(Probe),null,{onError:reject});
        const sink=new Writable({write(chunk,encoding,done){done();}});
        sink.on('finish',resolve);sink.on('error',reject);stream.pipe(sink);
      });
      assert.deepEqual(observed,projectPublicPages(pkg,packages,settings,instant),
        'cache must reset on the next request, including backward QA clocks');
      assert.equal(observed.some(p=>p.id===guide.id),instant>=Date.parse(guide.publishAt));
      assert.deepEqual(model.publicNichePages(pkg,instant-1),projectPublicPages(pkg,packages,settings,instant-1),
        'explicit caller clocks remain independent of the render cache');
      renders++;
    }
    console.log(JSON.stringify({guides:guides.length,renders,passed:true}));
  } finally { Date.now=oldNow;await fs.unlink(moduleUrl); }
} else {
  test('actual RSC projection reuse preserves every Promedical publication boundary and request isolation',()=>{
    const child=spawnSync(process.execPath,['--conditions=react-server',fileURLToPath(import.meta.url),'--render-child'],
      {cwd:fileURLToPath(new URL('../',import.meta.url)),encoding:'utf8',windowsHide:true});
    assert.equal(child.status,0,child.stderr||child.stdout);
    const result=JSON.parse(child.stdout.trim());
    assert.equal(result.guides,57);assert.equal(result.renders,114);assert.equal(result.passed,true);
  });
}
