import { copyFile, mkdir, readFile, readdir, stat, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { validateContentPackage } from "./content-package-core.mjs";
import { validateV2Admission, assertPreviewSandbox } from './content-v2-admission.mjs';
import { cleanBuildSource } from './content-build-proof.mjs';

const root = fileURLToPath(new URL("../", import.meta.url));
const packagesRoot = path.join(root, "content-packages");
const outputPath = path.join(root, "lib", "generated", "content-packages.json");
const assetsRoot = path.join(root, "public", "content-assets");

const entries = await readdir(packagesRoot, { withFileTypes: true });
const packages = [];
const hosts = new Set();
const admissions = {};
const acceptanceReceipts = {};
const sourceBefore=cleanBuildSource(root);

for (const entry of entries) {
  if (!entry.isDirectory()) continue;
  const packageDir = path.join(packagesRoot, entry.name);
  const bytes = await readFile(path.join(packageDir, "content-package.json"), "utf8");
  const pkg = validateContentPackage(JSON.parse(bytes));
  if(pkg.schemaVersion===2){
    let receipt;
    try{receipt=JSON.parse(await readFile(path.join(packageDir,'activation.json'),'utf8'));}
    catch{throw new Error('V2 active compile is gated until renderer/host cutover acceptance; use content-staging');}
    assertPreviewSandbox(root,receipt);
    admissions[pkg.siteId]=validateV2Admission(pkg,bytes,receipt);
    acceptanceReceipts[pkg.siteId]=receipt;
  }
  if (pkg.siteId !== entry.name) throw new Error(`Package directory does not match siteId: ${entry.name}`);
  if (hosts.has(pkg.canonicalHost)) throw new Error(`Duplicate canonicalHost: ${pkg.canonicalHost}`);
  hosts.add(pkg.canonicalHost);
  const copied = new Set();
  for (const page of pkg.pages) {
    for (const media of page.media) {
      if (copied.has(media.src)) continue;
      const relative = path.basename(media.src);
      const source = path.resolve(packageDir, "assets", relative);
      const assetsDir = path.resolve(packageDir, "assets");
      if (!source.startsWith(`${assetsDir}${path.sep}`)) throw new Error(`Unsafe asset path: ${media.src}`);
      const info = await stat(source);
      if (!info.isFile() || info.size > 8 * 1024 * 1024) throw new Error(`Asset must be a file below 8 MiB: ${media.src}`);
      const destination = path.resolve(assetsRoot, pkg.siteId, relative);
      await mkdir(path.dirname(destination), { recursive: true });
      await copyFile(source, destination);
      copied.add(media.src);
    }
  }
  packages.push(pkg);
}

packages.sort((a, b) => a.siteId.localeCompare(b.siteId));
// Proof identifies original imported bytes, not the serialized/projected registry.
// Mutable content inputs are separate from the clean execution graph.
const sourceAfter=cleanBuildSource(root);
if(sourceBefore&&sourceBefore===sourceAfter){
  for(const pkg of packages.filter(p=>p.schemaVersion===2)){
    const raw=await readFile(path.join(packagesRoot,pkg.siteId,'content-package.json'),'utf8');
    const bound=validateV2Admission(pkg,raw,acceptanceReceipts[pkg.siteId]);
    admissions[pkg.siteId]={...bound,buildSourceRevision:sourceAfter};
  }
}
if(cleanBuildSource(root)!==sourceBefore)for(const value of Object.values(admissions))delete value.buildSourceRevision;
await mkdir(path.dirname(outputPath), { recursive: true });
await writeFile(outputPath, `${JSON.stringify(packages)}\n`, "utf8");
await writeFile(path.join(root,'lib/generated/content-admissions.json'),`${JSON.stringify(admissions)}\n`,'utf8');
console.log(`Validated ${packages.length} approved site package(s).`);
