import { Miniflare } from 'miniflare';
import { build } from 'esbuild';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import { randomBytes } from 'node:crypto';

// Isolated workerd + ephemeral local D1. No remote bindings or real credentials.
const bundle = await build({ stdin: { contents: `
import {handleContentAdmin} from './lib/content-admin-api.mjs';
import {revisionHash} from './vendor/content-studio/authoring.mjs';
const page={id:'fixture',siteId:'promedical',type:'guide',slug:'gidai/fixture',title:'Fixture',description:'Fixture description',body:[{type:'paragraph',text:'Fixture body'}],media:[],links:[],publishAt:'2026-01-01T10:00:10.793Z'};
page.revisionHash=revisionHash(page);page.approval={status:'approved',revisionHash:page.revisionHash,actorId:'fixture-owner'};
const pkg={siteId:'promedical',canonicalHost:'example.test',site:{timezone:'Europe/Vilnius'},pages:[page]};
export default {fetch(request,env){return handleContentAdmin(request,pkg,env,p=>p.pages,{})}};
`, resolveDir: process.cwd(), sourcefile: 'draft-fixture.mjs', loader: 'js' },
  bundle: true, write: false, format: 'esm', platform: 'neutral', external: ['node:*'], logLevel: 'silent' });
const key = randomBytes(32).toString('base64url');
const mf = new Miniflare({ modules: true, script: bundle.outputFiles[0].text,
  compatibilityDate: '2026-05-22', compatibilityFlags: ['nodejs_compat'],
  d1Databases: { DB: 'draft-only-isolated-fixture' },
  bindings: { CONTENT_ADMIN_ENABLED: '1', CONTENT_ADMIN_DRAFT_TOKEN: key } });
try {
  const db = await mf.getD1Database('DB');
  const sql = await fs.readFile(new URL('../db/content-admin.sql', import.meta.url), 'utf8');
  for (const statement of sql.split(';').map(s => s.trim()).filter(Boolean)) await db.prepare(statement).run();
  const call = (path, input, headers = {}) => mf.dispatchFetch('https://example.test/admin/api/' + path, {
    method: input === undefined ? 'GET' : 'POST', headers: { authorization: 'Bearer ' + key, 'content-type': 'application/json', ...headers },
    ...(input === undefined ? {} : { body: JSON.stringify(input) }) });
  const firstResponse = await call('drafts/fixture'); assert.equal(firstResponse.status, 200);
  const first = await firstResponse.json();
  const saved = await call('drafts/fixture', { etag: first.etag, changes: { title: 'Workerd draft', body: [{ type: 'heading', level: 3, text: 'Fixture H3' }] } });
  assert.equal(saved.status, 200); const next = await saved.json();
  assert.equal(next.draft.publishAt, '2026-01-01T10:00:10.793Z');
  assert.equal((await (await call('drafts/fixture')).json()).draft.title, 'Workerd draft');
  assert.equal((await call('drafts/fixture', { etag: first.etag, changes: { title: 'stale' } })).status, 409);
  assert.equal((await call('texts/fixture/publish', { etag: next.etag, evidence: {} })).status, 403);
  assert.equal((await call('policy', { action: 'resume' })).status, 403);
  assert.equal((await call('drafts/fixture', undefined, { authorization: 'Bearer invalid' })).status, 401);
  assert.equal((await call('drafts/fixture')).status, 200, 'keep-alive remains healthy after rejected writes');
  const row = await db.prepare('SELECT approved_json,review_json,actor_email,version FROM content_admin_edits').first();
  assert.deepEqual(row, { approved_json: null, review_json: null, actor_email: 'automation:codex-drafts', version: 1 });
  assert.equal((await db.prepare('SELECT count(*) AS n FROM content_admin_settings').first()).n, 0);
  console.log(JSON.stringify({ pass: true, runtime: 'workerd', storage: 'ephemeral local D1', draftWrites: 1, approvedWrites: 0, policyWrites: 0 }));
} finally { await mf.dispose(); }
