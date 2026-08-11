import { readdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const logosDir = path.join(__dirname, "data", "sponsor-logos");

// Chips size logos by height, so transparent or white padding baked into a
// source file reads as dead space inside the pill.

// Some marks are a coloured tile with the wordmark knocked out of it (EF's
// purple square). That background is the logo, not padding, and trimming it
// crops the tile down to the glyph bounding box. Treat an opaque, saturated
// border as artwork and leave the file alone; near-white borders are still
// padding worth removing.
async function hasOpaqueColouredBackground(buffer) {
  const image = sharp(buffer).ensureAlpha();
  const { width, height } = await image.metadata();
  const pixels = await image.raw().toBuffer();
  const at = (x, y) => {
    const offset = (y * width + x) * 4;
    return pixels.subarray(offset, offset + 4);
  };

  const corners = [
    at(0, 0),
    at(width - 1, 0),
    at(0, height - 1),
    at(width - 1, height - 1),
  ];

  if (corners.some(([, , , alpha]) => alpha < 250)) return false;

  const [reference] = corners;
  const uniform = corners.every((corner) =>
    corner.every((channel, index) => channel === reference[index]),
  );
  if (!uniform) return false;

  const [r, g, b] = reference;
  return Math.min(r, g, b) < 230;
}

async function main() {
  const files = (await readdir(logosDir)).filter((name) => /\.png$/i.test(name));
  let trimmed = 0;

  for (const filename of files) {
    const filePath = path.join(logosDir, filename);
    const original = await readFile(filePath);
    const before = await sharp(original).metadata();

    if (await hasOpaqueColouredBackground(original)) {
      console.log(
        `· ${filename} keeps its background tile (${before.width}×${before.height})`,
      );
      continue;
    }

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
