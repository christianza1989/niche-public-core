import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import {validateNichePathAliases,indexNichePathAliases,nichePathAliasDestination} from '../lib/niche-path-aliases.mjs';
import {projectPublicPages} from '../lib/niche-links.mjs';
import {productNavigation,validateProductCatalogue} from '../lib/product-navigation.mjs';
const pkg=JSON.parse(await fs.readFile(new URL('../content-packages/promedical/content-package.json',import.meta.url))),config=JSON.parse(await fs.readFile(new URL('../config/niche-path-aliases.json',import.meta.url))),catalogue=JSON.parse(await fs.readFile(new URL('../config/promedical-catalogue.json',import.meta.url)));
const retired=[
  {
    "id": "19583f01-3d41-49bd-8904-81d6fe8876af",
    "canonical": "/produktai/nerudijanciojo-plieno-padeklas-2701-pakeistas-modeliu-nerez2003-nerez2701",
    "legacy": "/produktai/nerez2701",
    "targetId": "f6b5f722-8f1c-4edd-a2c5-34ace534f6fe",
    "target": "/kategorijos/vezimeliai-su-padeklais/stacionarus-nerudijanciojo-plieno-padeklai-m-l-xl-xxl/l/padeklai"
  },
  {
    "id": "7f44e4cf-f05b-4267-8e2d-b0180628e6a2",
    "canonical": "/produktai/nerudijanciojo-plieno-padeklas-pakeistas-modeliais-nerez2622-nerez2722",
    "legacy": "/produktai/nerez2722",
    "targetId": "a8c37f85-842f-4947-aadb-f7c181c237c6",
    "target": "/kategorijos/iso-moduliu-sistema/nerudijanciojo-plieno-padeklai-color-edition/vezimeliai"
  },
  {
    "id": "625c21ad-6190-4120-b694-c60fbb7613eb",
    "canonical": "/produktai/nerudijanciojo-plieno-padeklas-pakeistas-modeliais-nerez2624-nerez2734",
    "legacy": "/produktai/nerez2734",
    "targetId": "a8c37f85-842f-4947-aadb-f7c181c237c6",
    "target": "/kategorijos/iso-moduliu-sistema/nerudijanciojo-plieno-padeklai-color-edition/vezimeliai"
  },
  {
    "id": "6f6b3693-708d-482f-8445-0763cfd9b203",
    "canonical": "/produktai/nerudijanciojo-plieno-padeklas-pakeistas-modeliais-nerez2625-nerez2738",
    "legacy": "/produktai/nerez2738",
    "targetId": "a8c37f85-842f-4947-aadb-f7c181c237c6",
    "target": "/kategorijos/iso-moduliu-sistema/nerudijanciojo-plieno-padeklai-color-edition/vezimeliai"
  },
  {
    "id": "f0ea34fa-a4f2-4c4f-a656-557a9a0ab899",
    "canonical": "/produktai/nerudijanciojo-plieno-padeklas-pakeistas-modeliais-nerez2626-nerez2742",
    "legacy": "/produktai/nerez2742",
    "targetId": "09731f12-e1ad-4e55-af3e-bddb64c16b55",
    "target": "/kategorijos/iso-moduliu-sistema/nerudijanciojo-plieno-padeklai-color-edition"
  },
  {
    "id": "71678a0d-2466-46d8-99f7-000b1b2405e0",
    "canonical": "/produktai/nerudijanciojo-plieno-padeklas-pakeistas-modeliais-nerez2628-nerez2760",
    "legacy": "/produktai/nerez2760",
    "targetId": "a8c37f85-842f-4947-aadb-f7c181c237c6",
    "target": "/kategorijos/iso-moduliu-sistema/nerudijanciojo-plieno-padeklai-color-edition/vezimeliai"
  },
  {
    "id": "17785b91-6f66-4c94-8a0f-a667c6483683",
    "canonical": "/produktai/nerudijanciojo-plieno-padeklas-pakeistas-modeliais-nerez2629-nerez2767",
    "legacy": "/produktai/nerez2767",
    "targetId": "a8c37f85-842f-4947-aadb-f7c181c237c6",
    "target": "/kategorijos/iso-moduliu-sistema/nerudijanciojo-plieno-padeklai-color-edition/vezimeliai"
  },
  {
    "id": "83c8efca-45ef-4ed2-82a3-a172703ca297",
    "canonical": "/produktai/nerudijanciojo-plieno-padeklas-pakeistas-modeliais-nerez2641-nerez2820",
    "legacy": "/produktai/nerez2820",
    "targetId": "a8c37f85-842f-4947-aadb-f7c181c237c6",
    "target": "/kategorijos/iso-moduliu-sistema/nerudijanciojo-plieno-padeklai-color-edition/vezimeliai"
  },
  {
    "id": "c578d170-f64e-4eb1-ae5a-71b9facf9e0e",
    "canonical": "/produktai/nerudijanciojo-plieno-padeklas-pakeistas-modeliais-nerez2642-nerez2822",
    "legacy": "/produktai/nerez2822",
    "targetId": "a8c37f85-842f-4947-aadb-f7c181c237c6",
    "target": "/kategorijos/iso-moduliu-sistema/nerudijanciojo-plieno-padeklai-color-edition/vezimeliai"
  },
  {
    "id": "ae155b10-ea44-4c14-a907-2b491a7c6895",
    "canonical": "/produktai/nerudijanciojo-plieno-padeklas-pakeistas-modeliais-nerez2643-nerez2838",
    "legacy": "/produktai/nerez2838",
    "targetId": "a8c37f85-842f-4947-aadb-f7c181c237c6",
    "target": "/kategorijos/iso-moduliu-sistema/nerudijanciojo-plieno-padeklai-color-edition/vezimeliai"
  },
  {
    "id": "e44ab931-0040-46e1-9b99-d4c7cf552f14",
    "canonical": "/produktai/nerudijanciojo-plieno-padeklas-pakeistas-modeliais-nerez2644-nerez2842",
    "legacy": "/produktai/nerez2842",
    "targetId": "a8c37f85-842f-4947-aadb-f7c181c237c6",
    "target": "/kategorijos/iso-moduliu-sistema/nerudijanciojo-plieno-padeklai-color-edition/vezimeliai"
  },
  {
    "id": "e0c38fbe-63ac-4f89-a8ff-8c68a3bd233e",
    "canonical": "/produktai/nerudijanciojo-plieno-padeklas-pakeistas-modeliu-nerez2104-nerez2724",
    "legacy": "/produktai/nerez2724",
    "targetId": "a8c37f85-842f-4947-aadb-f7c181c237c6",
    "target": "/kategorijos/iso-moduliu-sistema/nerudijanciojo-plieno-padeklai-color-edition/vezimeliai"
  }
];
const index=indexNichePathAliases(config),live=projectPublicPages(pkg,[pkg],{},Date.parse('2026-10-25T15:35:00Z'));
test('twelve replaced-model products and both URL spellings retire to their own existing catalogue category without chains',()=>{
 validateNichePathAliases(config,[pkg]);validateProductCatalogue(catalogue,pkg);assert.equal(retired.length,12);
 for(const r of retired){assert(!pkg.pages.some(p=>p.id===r.id));assert(!catalogue.products[r.id]);const target=live.find(p=>p.id===r.targetId);assert(target&&target.slug.startsWith('kategorijos/'));assert.equal('/'+target.slug,r.target);
  for(const path of[r.canonical,r.legacy]){assert.equal(nichePathAliasDestination(pkg,index,()=>live,path),r.target);assert.equal(nichePathAliasDestination(pkg,index,()=>live,path+'/', '?utm_source=retirement'),r.target+'?utm_source=retirement');assert.equal(nichePathAliasDestination(pkg,index,()=>live.filter(p=>p.id!==r.targetId),path),null);}
  assert.equal(nichePathAliasDestination(pkg,index,()=>live,r.target),null);
 }
});
test('all remaining1395 native navigation projections exclude retired products while keeping real category and product targets',()=>{
 const ids=new Set(retired.map(r=>r.id)),products=live.filter(p=>p.type==='product');assert.equal(products.length,1395);
 for(const p of products){const n=productNavigation(pkg,p,live,catalogue);assert(n.category);assert(n.related.length<=5);assert(n.related.every(r=>r.id!==p.id&&!ids.has(r.id)&&live.some(p=>p.id===r.id)));}
 for(const p of pkg.pages)assert(p.links.every(l=>!ids.has(l.targetPageId)));
});
