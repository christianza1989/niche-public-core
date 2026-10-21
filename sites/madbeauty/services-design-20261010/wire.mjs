import {readFile,writeFile} from 'node:fs/promises';
import path from 'node:path';
const site=path.resolve(import.meta.dirname,'..');
const edits=[
 ['prototype/public/app.html','<link rel="stylesheet" href="/workspace.css">','<link rel="stylesheet" href="/workspace.css"><link rel="stylesheet" href="/services.css">'],
 ['prototype/public/public-views.mjs','renderCataloguePage(route,{selectedCityId})',"renderCataloguePage(route,{selectedCityId,query:new URLSearchParams(location.search).get('q')||''})"],
 ['prototype/app-server.mjs',"'catalogue-page.mjs','config.mjs'","'catalogue-page.mjs','services-media.mjs','config.mjs'"],
 ['prototype/app-server.mjs','renderCataloguePage(cataloguePage)',"renderCataloguePage(cataloguePage,{query:url.searchParams.get('q')||''})"],
 ['cloudflare/build.mjs',"'catalogue-page.mjs','config.mjs'","'catalogue-page.mjs','services-media.mjs','config.mjs'"],
 ['cloudflare/worker.mjs','renderCataloguePage(cataloguePage)',"renderCataloguePage(cataloguePage,{query:url.searchParams.get('q')||''})"]
];
for(const [file,before,after]of edits){const p=path.join(site,file),source=await readFile(p,'utf8');if(!source.includes(before))throw Error('Missing exact replacement: '+file);await writeFile(p,source.replace(before,after));}
