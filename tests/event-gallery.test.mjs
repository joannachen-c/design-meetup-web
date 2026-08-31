import assert from "node:assert/strict";
import { access, readdir, readFile } from "node:fs/promises";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const supabase = await readFile(
  path.join(root, "src/lib/supabase.ts"),
  "utf8",
);
const packageJson = JSON.parse(
  await readFile(path.join(root, "package.json"), "utf8"),
);
const migration = await readFile(
  path.join(
    root,
    "supabase/migrations/20260802230000_create_event_gallery_images.sql",
  ),
  "utf8",
);
const seed = await readFile(
  path.join(root, "scripts/seed-galleries.mjs"),
  "utf8",
);
const bundledGalleries = JSON.parse(
  await readFile(path.join(root, "src/data/event-galleries.json"), "utf8"),
);

test("supabase fetch joins ordered event gallery images", () => {
  assert.match(supabase, /export type EventGalleryImage/);
  assert.match(supabase, /gallery_images: EventGalleryImage\[\]/);
  assert.match(
    supabase,
    /gallery_images:event_gallery_images\(id, image_url, sort_order\)/,
  );
  assert.match(supabase, /a\.sort_order - b\.sort_order/);
});

test("gallery migration defines public-read table and storage bucket", () => {
  assert.match(migration, /create table if not exists public\.event_gallery_images/);
  assert.match(migration, /references public\.events \(id\) on delete cascade/);
  assert.match(migration, /unique \(event_id, sort_order\)/);
  assert.match(migration, /Public read event gallery images/);
  assert.match(migration, /'event-galleries'/);
});

test("seed:galleries maps all reusable placeholders to every event", () => {
  assert.equal(packageJson.scripts["seed:galleries"], "node scripts/seed-galleries.mjs");
  assert.match(seed, /const photosPerEvent = imageUrls\.length/);
  assert.match(seed, /photoIndex < photosPerEvent/);
  assert.match(seed, /const imageUrl = imageUrls\[photoIndex\]/);
  assert.match(seed, /onConflict: "event_id,sort_order"/);
  assert.match(seed, /\.gte\("sort_order", photosPerEvent\)/);
  assert.match(seed, /expectedRows = events\.length \* photosPerEvent/);
  assert.match(seed, /event-galleries/);
});

test("bundled galleries fill in for events without uploaded photos", () => {
  assert.match(supabase, /import galleryPathsByEventId from "\.\.\/data\/event-galleries\.json"/);
  assert.match(supabase, /gallery_images: galleryImages\(event\)/);
  // Uploaded photos win; a gallery of shared seed placeholders does not.
  assert.match(
    supabase,
    /if \(stored\.some\(\(image\) => !image\.image_url\.includes\(PLACEHOLDER_SEGMENT\)\)\) \{\s*return stored;/,
  );
  assert.match(supabase, /sort_order: bundled\.length \+ image\.sort_order/);
});

test("bundled gallery paths point at committed images", async () => {
  const entries = Object.entries(bundledGalleries);
  assert.ok(entries.length > 0, "expected at least one bundled gallery");

  for (const [lumaEventId, paths] of entries) {
    assert.match(lumaEventId, /^evt-/);
    assert.ok(paths.length > 0, `${lumaEventId} should list photos`);
    assert.deepEqual(
      paths,
      [...paths].sort(),
      `${lumaEventId} paths should be in display order`,
    );
    for (const imagePath of paths) {
      assert.match(imagePath, /^\/event-galleries\/[a-z0-9-]+\/[\w.-]+\.jpg$/);
      await access(path.join(root, "public", imagePath));
    }
  }
});

test("the Spotify recap ships its backstage pass set", () => {
  const paths = bundledGalleries["evt-4IoFFcCGFcq1JfC"];
  assert.equal(paths?.length, 6);
  assert.match(paths[0], /nyc-backstage-pass-spotify\/000-backstage-pass\.jpg$/);
});

test("placeholder gallery images from DM.zip are present for seeding", async () => {
  const dir = path.join(root, "scripts/data/gallery-placeholders");
  await access(dir);
  const images = (await readdir(dir)).filter((name) =>
    /\.(png|jpe?g|webp)$/i.test(name),
  );
  assert.equal(images.length, 8);
});
