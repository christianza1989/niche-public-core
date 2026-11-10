import { copyFile, mkdir, readFile, readdir, stat, writeFile } from "node:fs/promises";
import path from "node:path";
import {selectValidatedBuild} from '../lib/niche-build-scope.mjs';
import { fileURLToPath } from "node:url";
import { validateContentPackage } from "./content-package-core.mjs";
import { validateV2Admission, assertPreviewSandbox } from './content-v2-admission.mjs';
import { validateNichePathAliases } from '../lib/niche-path-aliases.mjs';
import { validateGuidePublicationPauses } from '../lib/niche-links.mjs';
import { validateProductCatalogue } from '../lib/product-navigation.mjs';
import promedicalCatalogue from '../config/promedical-catalogue.json' with { type: 'json' };

const root = fileURLToPath(new URL("../", import.meta.url));
const packagesRoot = path.join(root, "content-packages");
const outputPath = path.join(root, "lib", "generated", "content-packages.json");
const assetsRoot = path.join(root, "public", "content-assets");
// Deployment selection narrows an artifact, never page publication eligibility.
// All source packages still pass the same validators before selection.
const buildSiteId = process.env.NICHE_BUILD_SITE_ID;

const entries = await readdir(packagesRoot, { withFileTypes: true });
const packages = [];
const hosts = new Set();
const admissions = {};

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
for (const pkg of packages) if (pkg.siteId === promedicalCatalogue.siteId) validateProductCatalogue(promedicalCatalogue, pkg);
const network=JSON.parse(await readFile(path.join(root,'config/niche-network.json'),'utf8'));
validateGuidePublicationPauses(network,packages);
validateNichePathAliases(JSON.parse(await readFile(path.join(root,'config/niche-path-aliases.json'),'utf8')),packages);
await mkdir(path.dirname(outputPath), { recursive: true });
const selected=selectValidatedBuild(packages,admissions,network,buildSiteId);
const selectedPackages=selected.packages;
await writeFile(outputPath, `${JSON.stringify(selectedPackages)}\n`, "utf8");
const selectedAdmissions=selected.admissions;
await writeFile(path.join(root,'lib/generated/content-admissions.json'),`${JSON.stringify(selectedAdmissions)}\n`,'utf8');
await writeFile(path.join(root,'lib/generated/niche-network.json'),`${JSON.stringify(selected.network)}\n`,'utf8');
console.log(`Validated ${packages.length} approved site package(s); compiled ${selectedPackages.length}${buildSiteId?' for '+buildSiteId:''}.`);
