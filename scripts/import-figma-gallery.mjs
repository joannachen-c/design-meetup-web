import { config } from "dotenv";
import { execFileSync } from "node:child_process";
import { mkdtemp, mkdir, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

import {
  fetchNodes,
  fetchSectionChildren,
  normalizeNodeId,
  parseFigmaReference,
  pickSlides,
  renderPngs,
  slideFileName,
} from "./lib/figma-gallery.mjs";

config({ path: ".env.local" });
config();

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const USAGE = `Usage:
  List the slides in a section (copy the section link from Figma):
    npm run import:figma-gallery -- --figma "<section url>" --list [--match "<name>"]

  Export slides and add them to an event gallery:
    npm run import:figma-gallery -- --figma "<section url>" --match "<name>" --event "<event>"
    npm run import:figma-gallery -- --figma "<file url>" --frames 5603:281,5622:163 --event "<event>"

  Options:
    --frames <ids>    Comma-separated frame ids, in gallery order. Wins over --match.
    --match <text>    Only frames whose name contains this text.
    --skip <ids>      Frame ids to leave out (slides that were never posted).
    --event <ref>     Event id, Luma event id, or title fragment (as in upload:gallery).
    --slug <folder>   Storage folder. Defaults to the event title, as in upload:gallery.
    --mode <mode>     replace (default), prepend, or insert.
    --at <index>      Position for --mode insert.
    --scale <n>       Export scale, 1-4. Default 2.
    --out <dir>       Keep the PNGs here instead of a temp folder.
    --dry-run         Export the PNGs but do not upload.`;

function parseArgs(argv) {
  const args = {};
  for (let index = 0; index < argv.length; index += 1) {
    const token = argv[index];
    if (!token.startsWith("--")) continue;
    const key = token.slice(2);
    const next = argv[index + 1];
    args[key] = next && !next.startsWith("--") ? (index += 1, next) : "true";
  }
  return args;
}

function idList(value) {
  return value ? value.split(",").map(normalizeNodeId).filter(Boolean) : [];
}

async function resolveSlides(fileKey, sectionId, args, token) {
  const frameIds = idList(args.frames);
  if (frameIds.length > 0) return fetchNodes(fileKey, frameIds, token);

  if (!sectionId) {
    throw new Error(
      "Pass --frames, or a --figma link that points at the recap section (it carries ?node-id=).",
    );
  }
  const section = await fetchSectionChildren(fileKey, sectionId, token);
  console.log(`Section: ${section.name} (${sectionId})`);
  return pickSlides(section.children, { match: args.match });
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  if (!args.figma || (!args.list && !args.event && !args["dry-run"])) {
    console.error(USAGE);
    process.exit(1);
  }

  const token = process.env.FIGMA_TOKEN;
  if (!token) {
    console.error(
      "Missing FIGMA_TOKEN in .env.local. Create a personal access token with file_content:read in Figma (Settings → Security).",
    );
    process.exit(1);
  }

  const { fileKey, nodeId } = parseFigmaReference(args.figma);
  const skip = new Set(idList(args.skip));
  const slides = (await resolveSlides(fileKey, nodeId, args, token)).filter(
    (node) => !skip.has(node.id),
  );

  if (slides.length === 0) {
    throw new Error("No slides matched. Run with --list to see what the section holds.");
  }

  for (const [index, node] of slides.entries()) {
    console.log(`  ${String(index + 1).padStart(2)}. ${node.id}  ${node.name}`);
  }
  if (args.list) return;

  const outDir = args.out
    ? path.resolve(args.out)
    : await mkdtemp(path.join(os.tmpdir(), "figma-gallery-"));
  await mkdir(outDir, { recursive: true });

  const scale = Number(args.scale ?? 2);
  const urls = await renderPngs(
    fileKey,
    slides.map((node) => node.id),
    token,
    scale,
  );
  for (const [index, url] of urls.entries()) {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Download failed for ${slides[index].id} (${response.status})`);
    }
    const fileName = slideFileName(index, slides[index].name);
    await writeFile(path.join(outDir, fileName), Buffer.from(await response.arrayBuffer()));
  }
  console.log(`Exported ${slides.length} slides to ${outDir}`);

  if (args["dry-run"]) return;

  const uploadArgs = ["--dir", outDir, "--event", args.event];
  for (const key of ["slug", "mode", "at"]) {
    if (args[key]) uploadArgs.push(`--${key}`, args[key]);
  }
  execFileSync(
    process.execPath,
    [path.join(__dirname, "upload-event-gallery.mjs"), ...uploadArgs],
    { stdio: "inherit" },
  );
}

main().catch((error) => {
  console.error(error.message ?? error);
  process.exit(1);
});
