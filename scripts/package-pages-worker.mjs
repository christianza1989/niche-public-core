// Package an existing Vinext Module Worker for Cloudflare Pages Advanced Mode.
// This is neither a static export nor a deployment command.
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {createRequire} from 'node:module';
import {copyFile,mkdir,readFile,readdir,realpath,stat,writeFile} from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

const require=createRequire(import.meta.url);
const hash=bytes=>createHash('sha256').update(bytes).digest('hex');
const inside=(root,file)=>file.startsWith(root+path.sep);

export async function packagePagesWorker({projectRoot,outputDirectory}) {
 const root=await realpath(path.resolve(projectRoot));
 const server=path.join(root,'dist/server'),client=path.join(root,'dist/client');
 const output=path.resolve(outputDirectory);
 assert.ok(inside(path.join(root,'.local'),output),'Output must be a new private project .local directory.');
 try {await stat(output);throw new Error('Packaging output already exists; preserve it and choose a new edition.');}
 catch(error){if(error.code!=='ENOENT')throw error;}
 // An existing parent junction must not redirect output into another checkout.
 let ancestor=path.dirname(output);
 while(true){try{assert.equal(await realpath(ancestor),ancestor,'Output parent must not be redirected.');break;}
 catch(error){if(error.code!=='ENOENT')throw error;ancestor=path.dirname(ancestor);}}
 assert.equal(await realpath(server),server,'Compiled server directory must not be redirected.');
 assert.equal(await realpath(client),client,'Compiled client directory must not be redirected.');
 const configPath=path.join(server,'wrangler.json');
 const configBytes=await readFile(configPath),config=JSON.parse(configBytes);
 assert.ok(config.compatibility_flags?.includes('nodejs_compat'),'Existing Vinext node compatibility is required.');
 assert.equal(typeof config.main,'string');
 const entry=path.resolve(server,config.main);
 assert.ok(inside(server,entry),'Worker entry must remain inside the compiled server.');
 const ts=require('typescript'),modules=new Map();
 async function moduleFile(file){
  file=path.resolve(file);assert.ok(inside(server,file),'A compiled module escapes the server output.');
  assert.equal(await realpath(file),file,'Compiled modules must not be redirected.');
  if(modules.has(file))return;
  const bytes=await readFile(file);modules.set(file,hash(bytes));
  const ast=ts.createSourceFile(file,bytes.toString('utf8'),ts.ScriptTarget.Latest,true,ts.ScriptKind.JS),references=[];
  function visit(node){
   if((ts.isImportDeclaration(node)||ts.isExportDeclaration(node))&&node.moduleSpecifier&&ts.isStringLiteralLike(node.moduleSpecifier))references.push(node.moduleSpecifier.text);
   if(ts.isCallExpression(node)&&node.expression.kind===ts.SyntaxKind.ImportKeyword&&node.arguments.length&&ts.isStringLiteralLike(node.arguments[0]))references.push(node.arguments[0].text);
   ts.forEachChild(node,visit);
  }
  visit(ast);
  for(const reference of new Set(references)){
   if(reference.startsWith('.'))await moduleFile(path.resolve(path.dirname(file),reference));
   else assert.ok(reference.startsWith('node:')||reference.startsWith('cloudflare:'),`Unexpected external module: ${reference}`);
  }
 }
 await moduleFile(entry);
 const staticFiles=[];
 // Validate the complete asset tree before creating any served output.
 async function assets(directory,relative=''){
  for(const item of await readdir(directory,{withFileTypes:true})){
   if(item.name==='.vite'||item.name==='.wrangler'||item.name.endsWith('.map')||item.name==='.assetsignore')continue;
   assert.ok(!['_worker.js','_routes.json','wrangler.json','wrangler.jsonc','wrangler.toml'].includes(item.name)&&!/^\.env(?:\.|$)|^\.dev\.vars(?:\.|$)|\.(?:sqlite3?|db)(?:-|$)/i.test(item.name),'Reserved or private file found in compiled assets.');
   const name=path.join(relative,item.name),source=path.join(directory,item.name);
   if(item.isDirectory())await assets(source,name);
   else if(item.isFile()){const bytes=await readFile(source);staticFiles.push({path:name.replaceAll(path.sep,'/'),sha256:hash(bytes),bytes:bytes.length});}
   else throw new Error('Compiled assets must not contain links or special files.');
  }
 }
 await assets(client);
 const esbuild=createRequire(require.resolve('wrangler/package.json'))('esbuild');
 // Bundle before Wrangler relocates the Pages entry. Vinext SSR chunks can
 // dynamically import ../index.js, so copying the graph alone is insufficient.
 const bundle=await esbuild.build({entryPoints:[entry],bundle:true,format:'esm',platform:'neutral',target:'es2022',external:['node:*','cloudflare:*'],write:false,metafile:true,minify:true,logLevel:'silent'});
 assert.equal(bundle.outputFiles.length,1);
 await mkdir(output,{recursive:true});
 await writeFile(path.join(output,'_worker.js'),bundle.outputFiles[0].contents,{flag:'wx'});
 for(const asset of staticFiles){const target=path.join(output,asset.path);await mkdir(path.dirname(target),{recursive:true});await copyFile(path.join(client,asset.path),target);}
 // The native Workers build serves these generated framework/font assets
 // before the app. Vinext's handler otherwise returns 404 for compiled CSS/JS.
 // Site media, content, forms and private paths still go through its guards.
 const assetFirstRoutes=['/_next/static/*','/fonts/*'];
 const routes=JSON.stringify({version:1,include:['/*'],exclude:assetFirstRoutes},null,2)+'\n';
 await writeFile(path.join(output,'_routes.json'),routes,{flag:'wx'});
 const manifest={version:1,createdAt:new Date().toISOString(),output,inputServerConfigSha256:hash(configBytes),entrySha256:modules.get(entry),bundleSha256:hash(bundle.outputFiles[0].contents),routesSha256:hash(routes),bundleInputs:Object.keys(bundle.metafile.inputs).length,modules:[...modules].map(([file,sha256])=>({path:path.relative(server,file).replaceAll(path.sep,'/'),sha256})),staticFiles,workerOwnsContentMediaAndForms:true,assetFirstRoutes,publicFrameworkAssetsOnUnknownHosts:true,staticExport:false,configCopied:false,remoteResourcesCreated:false,deployed:false};
 // Provenance remains outside the public asset directory.
 await writeFile(output+'.manifest.json',JSON.stringify(manifest,null,2)+'\n',{flag:'wx'});
 return manifest;
}

if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url)){
 const [projectRoot,outputDirectory]=process.argv.slice(2);
 assert.ok(projectRoot&&outputDirectory,'Usage: node scripts/package-pages-worker.mjs <project-root> <new-project-.local-output>');
 const result=await packagePagesWorker({projectRoot,outputDirectory});
 console.log(JSON.stringify({output:result.output,moduleCount:result.modules.length,assetCount:result.staticFiles.length,bundleSha256:result.bundleSha256,deployed:false}));
}
