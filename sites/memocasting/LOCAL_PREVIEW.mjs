// Explicit isolated loopback preview. Never a production configuration.
import {readFile,mkdir,writeFile} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import {spawn} from 'node:child_process';
const root=new URL('../../',import.meta.url),runtime=new URL('output/memocasting-runtime/',root);
const config=JSON.parse(await readFile(new URL('dist/server/wrangler.json',root),'utf8'));
config.name='memocasting-local-preview';config.main=fileURLToPath(new URL('dist/server/index.js',root));
config.assets.directory=fileURLToPath(new URL('dist/client/',root));
config.vars={NICHE_DEV_SITE_ID:'memocasting',MEMO_COMMERCE_ORIGIN:process.env.MEMO_LOCAL_COMMERCE_ORIGIN||'http://127.0.0.1:8797',LEAD_SMTP_ENABLED:'0',VOICE_WIDGET_ENABLED:'0'};
config.d1_databases=[{binding:'DB',database_name:'memo_local_leads',database_id:'00000000-0000-4000-8000-000000000017'}];
config.send_email=[];config.services=[];config.r2_buckets=[];
await mkdir(runtime,{recursive:true});const configPath=new URL('wrangler.local.json',runtime);await writeFile(configPath,JSON.stringify(config));
process.env.SITES_RUNTIME_ROOT=fileURLToPath(runtime);await import(new URL('scripts/sites-env.mjs',root));
const cli=new URL('node_modules/wrangler/bin/wrangler.js',root);
const child=spawn(process.execPath,[fileURLToPath(cli),'dev','--config',fileURLToPath(configPath),'--local','--persist-to',fileURLToPath(new URL('state',runtime)),'--port','8817','--ip','127.0.0.1','--inspector-port','0','--log-level','error'],{cwd:fileURLToPath(root),env:process.env,stdio:'inherit'});
process.on('SIGINT',()=>child.kill('SIGINT'));
await new Promise(resolve=>child.on('exit',code=>{process.exitCode=code||0;resolve();}));
