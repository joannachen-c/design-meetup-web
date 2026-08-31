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

test("placeholder gallery images from DM.zip are present for seeding", async () => {
  const dir = path.join(root, "scripts/data/gallery-placeholders");
  await access(dir);
  const images = (await readdir(dir)).filter((name) =>
    /\.(png|jpe?g|webp)$/i.test(name),
  );
  assert.equal(images.length, 8);
});

test("the Rivet cafe recap set is checked in under its storage slug", async () => {
  // upload:gallery derives the storage folder from the event title, so the
  // folder name has to keep matching or the upload lands somewhere else.
  const events = JSON.parse(
    await readFile(path.join(root, "scripts/data/past-events.json"), "utf8"),
  );
  const rivet = events.find(
    (event) => event.luma_event_id === "evt-vSYwX6dEPDBtMuE",
  );
  assert.equal(rivet.title, "Design Meetup Cafe with Rivet");

  const slug = rivet.title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  const dir = path.join(root, "scripts/data/event-galleries", slug);
  await access(dir);

  const images = (await readdir(dir)).filter((name) => /\.jpe?g$/i.test(name));
  assert.equal(images.length, 8);
  // Natural-sorted filenames are what fix the running order of the recap.
  assert.deepEqual(images.sort(), [
    "01-gallery-mingle.jpg",
    "02-cafe-lounge.jpg",
    "03-cafe-floor.jpg",
    "04-recap-postcard.jpg",
    "05-the-calm-in-a-city.jpg",
    "06-todays-caffeine-fix.jpg",
    "07-the-buzz-of-conversations.jpg",
    "08-say-cheese.jpg",
  ]);
});
