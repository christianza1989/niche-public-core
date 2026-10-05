import fs from "node:fs/promises";
import path from "node:path";
import { execFile } from "node:child_process";
import { promisify } from "node:util";

const execFileAsync = promisify(execFile);

const inputDir = path.resolve(process.cwd(), process.argv[2] ?? "public/images/articles");
const outputDir = path.resolve(process.cwd(), process.argv[3] ?? inputDir);
const supported = new Set([".png", ".jpg", ".jpeg"]);

async function walk(directory) {
  const entries = await fs.readdir(directory, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    const fullPath = path.join(directory, entry.name);
    if (entry.isDirectory()) files.push(...(await walk(fullPath)));
    else if (supported.has(path.extname(entry.name).toLowerCase())) files.push(fullPath);
  }
  return files;
}

await fs.mkdir(outputDir, { recursive: true });
const files = await walk(inputDir);
for (const source of files) {
  const relative = path.relative(inputDir, source);
  const destination = path.join(outputDir, relative.replace(/\.(png|jpe?g)$/i, ".webp"));
  await fs.mkdir(path.dirname(destination), { recursive: true });
  await execFileAsync("ffmpeg", ["-y", "-i", source, "-c:v", "libwebp", "-quality", "84", "-compression_level", "5", destination], { windowsHide: true });
  const [sourceStat, outputStat] = await Promise.all([fs.stat(source), fs.stat(destination)]);
  console.log(`${relative} -> ${path.relative(process.cwd(), destination)} (${sourceStat.size} -> ${outputStat.size} bytes)`);
}

console.log(`Converted ${files.length} image${files.length === 1 ? "" : "s"} to WebP.`);
