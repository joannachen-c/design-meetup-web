import { readdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const logosDir = path.join(__dirname, "data", "sponsor-logos");

// Chips size logos by height, so any transparent or flat-colour padding baked
// into a source file reads as dead space inside the pill.
async function main() {
  const files = (await readdir(logosDir)).filter((name) => /\.png$/i.test(name));
  let trimmed = 0;

  for (const filename of files) {
    const filePath = path.join(logosDir, filename);
    const original = await readFile(filePath);
    const before = await sharp(original).metadata();
    const output = await sharp(original)
      .trim({ threshold: 2 })
      .png({ compressionLevel: 9 })
      .toBuffer();
    const after = await sharp(output).metadata();

    if (after.width === before.width && after.height === before.height) {
      console.log(`· ${filename} already tight (${before.width}×${before.height})`);
      continue;
    }

    await writeFile(filePath, output);
    trimmed += 1;
    console.log(
      `✓ ${filename} ${before.width}×${before.height} → ${after.width}×${after.height}`,
    );
  }

  console.log(`Trimmed ${trimmed} of ${files.length} logo(s).`);
  if (trimmed > 0) {
    console.log("Run npm run upload:sponsor-logos to publish the tighter files.");
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
