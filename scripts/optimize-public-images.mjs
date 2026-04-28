import { readdir, stat } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

import sharp from "sharp";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(__dirname, "..");
const publicDir = path.join(projectRoot, "public");

const minSourceBytes = 300 * 1024;
const webpQuality = 80;
const supportedExtensions = new Set([".jpg", ".jpeg", ".png"]);
const skipNamePattern = /(?:favicon|icon|logo|apple-touch)/i;

function formatBytes(bytes) {
  if (bytes >= 1024 * 1024) {
    return `${(bytes / 1024 / 1024).toFixed(2)} MB`;
  }

  return `${(bytes / 1024).toFixed(1)} KB`;
}

async function shouldSkipOutput(sourcePath, outputPath) {
  try {
    const [sourceStats, outputStats] = await Promise.all([stat(sourcePath), stat(outputPath)]);
    return outputStats.mtimeMs >= sourceStats.mtimeMs;
  } catch {
    return false;
  }
}

async function optimizeImage(fileName) {
  const sourcePath = path.join(publicDir, fileName);
  const parsed = path.parse(fileName);
  const outputFileName = `${parsed.name}.webp`;
  const outputPath = path.join(publicDir, outputFileName);

  if (await shouldSkipOutput(sourcePath, outputPath)) {
    const [sourceStats, outputStats] = await Promise.all([stat(sourcePath), stat(outputPath)]);
    console.log(`skip ${fileName} -> ${outputFileName} (${formatBytes(sourceStats.size)} -> ${formatBytes(outputStats.size)})`);
    return {
      fileName,
      outputFileName,
      originalSize: sourceStats.size,
      optimizedSize: outputStats.size,
      skipped: true,
    };
  }

  const sourceStats = await stat(sourcePath);
  await sharp(sourcePath).rotate().webp({ quality: webpQuality, effort: 5 }).toFile(outputPath);
  const outputStats = await stat(outputPath);

  console.log(`${fileName} -> ${outputFileName} (${formatBytes(sourceStats.size)} -> ${formatBytes(outputStats.size)})`);
  return {
    fileName,
    outputFileName,
    originalSize: sourceStats.size,
    optimizedSize: outputStats.size,
    skipped: false,
  };
}

const publicFiles = await readdir(publicDir, { withFileTypes: true });
const imageFileNames = [];

for (const entry of publicFiles) {
  if (!entry.isFile()) {
    continue;
  }

  const extension = path.extname(entry.name).toLowerCase();
  if (!supportedExtensions.has(extension) || skipNamePattern.test(entry.name)) {
    continue;
  }

  const fileStats = await stat(path.join(publicDir, entry.name));
  if (fileStats.size >= minSourceBytes) {
    imageFileNames.push(entry.name);
  }
}

imageFileNames.sort((a, b) => a.localeCompare(b));

if (imageFileNames.length === 0) {
  console.log("No large public PNG/JPEG images found to optimize.");
  process.exit(0);
}

console.log(`Optimizing ${imageFileNames.length} image(s) to WebP at quality ${webpQuality}.`);

const results = [];
for (const fileName of imageFileNames) {
  results.push(await optimizeImage(fileName));
}

const originalTotal = results.reduce((total, result) => total + result.originalSize, 0);
const optimizedTotal = results.reduce((total, result) => total + result.optimizedSize, 0);
const savedBytes = originalTotal - optimizedTotal;

console.log(`Done. ${formatBytes(originalTotal)} -> ${formatBytes(optimizedTotal)} saved ${formatBytes(savedBytes)}.`);
