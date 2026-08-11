import { createClient } from "@supabase/supabase-js";
import { config } from "dotenv";
import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";

config({ path: ".env.local" });
config();

const BUCKET = "event-galleries";
const MAX_EDGE = 2400;
const JPEG_QUALITY = 82;

const url = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !serviceKey) {
  console.error(
    "Missing SUPABASE_URL / NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local",
  );
  process.exit(1);
}

const supabase = createClient(url, serviceKey, {
  auth: { persistSession: false, autoRefreshToken: false },
});

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

function slugify(value) {
  return value
    .toLowerCase()
    .replace(/\.[a-z0-9]+$/, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function naturalName(a, b) {
  return a.localeCompare(b, undefined, { numeric: true, sensitivity: "base" });
}

async function resolveEvent(reference) {
  const { data, error } = await supabase
    .from("events")
    .select("id, title")
    .order("sort_order", { ascending: true });
  if (error) throw error;

  const byId = data.find((event) => event.id === reference);
  if (byId) return byId;

  const needle = reference.toLowerCase();
  const matches = data.filter((event) =>
    event.title.toLowerCase().includes(needle),
  );
  if (matches.length === 0) {
    throw new Error(`No event matches "${reference}".`);
  }
  if (matches.length > 1) {
    throw new Error(
      `"${reference}" matches ${matches.length} events: ${matches
        .map((event) => event.title)
        .join(", ")}`,
    );
  }
  return matches[0];
}

async function uploadDirectory(dir, slug) {
  const fileNames = (await readdir(dir))
    .filter((name) => /\.(png|jpe?g|webp|heic)$/i.test(name))
    .sort(naturalName);

  if (fileNames.length === 0) {
    throw new Error(`No images found in ${dir}`);
  }

  const publicUrls = [];
  for (let index = 0; index < fileNames.length; index += 1) {
    const fileName = fileNames[index];
    const original = await readFile(path.join(dir, fileName));
    const bytes = await sharp(original)
      .rotate()
      .resize({
        width: MAX_EDGE,
        height: MAX_EDGE,
        fit: "inside",
        withoutEnlargement: true,
      })
      .jpeg({ quality: JPEG_QUALITY, mozjpeg: true })
      .toBuffer();

    const objectPath = `${slug}/${String(index).padStart(3, "0")}-${slugify(fileName)}.jpg`;
    const { error } = await supabase.storage
      .from(BUCKET)
      .upload(objectPath, bytes, {
        contentType: "image/jpeg",
        upsert: true,
        cacheControl: "31536000",
      });
    if (error) throw new Error(`Upload failed for ${fileName}: ${error.message}`);

    const { data } = supabase.storage.from(BUCKET).getPublicUrl(objectPath);
    publicUrls.push(data.publicUrl);
    console.log(
      `  ✓ ${objectPath} (${(bytes.length / 1024).toFixed(0)}KB from ${(original.length / 1024 / 1024).toFixed(1)}MB)`,
    );
  }

  return publicUrls;
}

async function replaceGallery(eventId, imageUrls) {
  const { error: deleteError } = await supabase
    .from("event_gallery_images")
    .delete()
    .eq("event_id", eventId);
  if (deleteError) throw deleteError;

  const { error } = await supabase.from("event_gallery_images").insert(
    imageUrls.map((imageUrl, index) => ({
      event_id: eventId,
      image_url: imageUrl,
      sort_order: index,
    })),
  );
  if (error) throw error;
}

async function prependGallery(eventId, imageUrls) {
  await insertGalleryAt(eventId, imageUrls, 0);
}

async function insertGalleryAt(eventId, imageUrls, at) {
  const insertAt = Math.max(0, Number(at) || 0);
  const { data: existing, error: readError } = await supabase
    .from("event_gallery_images")
    .select("id, sort_order")
    .eq("event_id", eventId)
    .gte("sort_order", insertAt)
    .order("sort_order", { ascending: false });
  if (readError) throw readError;

  // Shift from the tail so each update lands on a sort_order that is still
  // free under the (event_id, sort_order) unique constraint.
  for (const row of existing ?? []) {
    const { error } = await supabase
      .from("event_gallery_images")
      .update({ sort_order: row.sort_order + imageUrls.length })
      .eq("id", row.id);
    if (error) throw error;
  }

  const { error } = await supabase.from("event_gallery_images").insert(
    imageUrls.map((imageUrl, index) => ({
      event_id: eventId,
      image_url: imageUrl,
      sort_order: insertAt + index,
    })),
  );
  if (error) throw error;
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const { dir, event: eventRef, slug, mode = "replace", at = "0" } = args;

  if (!dir || !eventRef) {
    console.error(
      'Usage: node scripts/upload-event-gallery.mjs --dir "<folder>" --event "<event id or title fragment>" [--slug <storage-folder>] [--mode replace|prepend|insert] [--at <index>]',
    );
    process.exit(1);
  }

  if (mode !== "replace" && mode !== "prepend" && mode !== "insert") {
    console.error(`Unknown --mode "${mode}". Use replace, prepend, or insert.`);
    process.exit(1);
  }

  const event = await resolveEvent(eventRef);
  const storageSlug = slug || slugify(event.title);
  const insertAt = Number(at);
  console.log(
    `${event.title} (${mode}${mode === "insert" ? ` @${insertAt}` : ""}) → ${BUCKET}/${storageSlug}`,
  );

  const imageUrls = await uploadDirectory(dir, storageSlug);

  if (mode === "replace") {
    await replaceGallery(event.id, imageUrls);
  } else if (mode === "prepend") {
    await prependGallery(event.id, imageUrls);
  } else {
    await insertGalleryAt(event.id, imageUrls, insertAt);
  }

  const { count, error } = await supabase
    .from("event_gallery_images")
    .select("id", { count: "exact", head: true })
    .eq("event_id", event.id);
  if (error) throw error;

  console.log(`Done. ${event.title} now has ${count} gallery images.\n`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
