import { copyFile, mkdir, readFile, stat } from "node:fs/promises";
import { createHash } from "node:crypto";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { validateContentPackage } from "./content-package-core.mjs";
import { validateV2Admission, assertPreviewSandbox } from './content-v2-admission.mjs';

const sourceArgument = process.argv[2];
const replace = process.argv.includes("--replace");
const shadow = process.argv.includes('--shadow');
const acceptanceIndex = process.argv.indexOf('--acceptance');
const acceptancePath = acceptanceIndex>=0 ? process.argv[acceptanceIndex+1] : null;
if (!sourceArgument) throw new Error("Usage: npm run content:import -- <export-directory> [--replace]");

const root = fileURLToPath(new URL("../", import.meta.url));
const source = path.resolve(sourceArgument);
const sourceInfo = await stat(source);
if (!sourceInfo.isDirectory()) throw new Error("Export path must be a directory");
const sourcePackage = path.join(source, "content-package.json");
const raw = await readFile(sourcePackage, "utf8");
const pkg = validateContentPackage(JSON.parse(raw));
let acceptanceRaw;
if(pkg.schemaVersion===2&&!shadow){
  if(!acceptancePath)throw new Error('V2 must use --shadow until renderer/host cutover acceptance; --acceptance requires exact package evidence');
  acceptanceRaw=await readFile(path.resolve(acceptancePath),'utf8');
  assertPreviewSandbox(root,JSON.parse(acceptanceRaw));
  validateV2Admission(pkg,raw,JSON.parse(acceptanceRaw));
}
const target = path.join(root, shadow?'content-staging':'content-packages', pkg.siteId);
const targetPackage = path.join(target, "content-package.json");

let oldPackage;
try {
  oldPackage = await readFile(targetPackage, "utf8");
} catch (error) {
  if (error.code !== "ENOENT") throw error;
}
if (oldPackage && !replace) throw new Error(`Package ${pkg.siteId} exists; use --replace after reviewing its changes`);

const expectedAssets = new Map();
for (const page of pkg.pages) {
  for (const media of page.media) {
    const filename = path.basename(media.src);
    const sourceAsset = path.join(source, "assets", filename);
    const contents = await readFile(sourceAsset);
    if (contents.length > 8 * 1024 * 1024) throw new Error(`Asset exceeds 8 MiB: ${filename}`);
    const digest = createHash("sha256").update(contents).digest("hex");
    const previous = expectedAssets.get(filename);
    if (previous && previous.digest !== digest) throw new Error(`Duplicate asset filename with different content: ${filename}`);
    expectedAssets.set(filename, { contents, digest });
  }
}

// Never overwrite an existing image path with different bytes; old pages may
// still reference it while a new package waits for its publication time.
for (const [filename, asset] of expectedAssets) {
  try {
    const previous = await readFile(path.join(target, "assets", filename));
    const previousDigest = createHash("sha256").update(previous).digest("hex");
    if (previousDigest !== asset.digest) throw new Error(`Asset path changed in place: ${filename}`);
  } catch (error) {
    if (error.code !== "ENOENT") throw error;
  }
}

await mkdir(path.join(target, "assets"), { recursive: true });
for (const filename of expectedAssets.keys()) {
  await copyFile(path.join(source, "assets", filename), path.join(target, "assets", filename));
}
if (oldPackage) {
  const backup = path.join(target, `content-package.previous.${Date.now()}.json`);
  await copyFile(targetPackage, backup);
}
await copyFile(sourcePackage, targetPackage);
if(acceptanceRaw)await copyFile(path.resolve(acceptancePath),path.join(target,'activation.json'));
console.log(`Imported ${shadow?'private shadow':'approved'} package ${pkg.siteId}: ${pkg.pages.length} page(s), ${expectedAssets.size} asset(s). ${shadow?'No host, compiled registry or public assets activated.':'Run npm run content:compile.'}`);
