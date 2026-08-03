import { createClient } from "@supabase/supabase-js";
import { config } from "dotenv";
import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

config({ path: ".env.local" });
config();

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const placeholdersDir = path.join(__dirname, "data", "gallery-placeholders");
const BUCKET = "event-galleries";
const MIGRATION =
  "supabase/migrations/20260802230000_create_event_gallery_images.sql";

const url = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !serviceKey) {
  console.error(
    "Missing SUPABASE_URL / VITE_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local",
  );
  process.exit(1);
}

const supabase = createClient(url, serviceKey, {
  auth: { persistSession: false, autoRefreshToken: false },
});

function naturalName(a, b) {
  return a.localeCompare(b, undefined, { numeric: true, sensitivity: "base" });
}

async function assertReady() {
  const { error: eventsError } = await supabase
    .from("events")
    .select("id")
    .limit(1);
  if (eventsError) {
    console.error(
      "Could not read public.events. Seed events first (npm run seed:events).",
    );
    console.error(eventsError.message);
    process.exit(1);
  }

  const { error: galleryError } = await supabase
    .from("event_gallery_images")
    .select("id")
    .limit(1);
  if (galleryError) {
    console.error(
      `Could not read public.event_gallery_images. Paste and run ${MIGRATION} in the Supabase SQL editor, then re-run npm run seed:galleries.`,
    );
    console.error(galleryError.message);
    process.exit(1);
  }

  const { data: buckets, error: bucketError } =
    await supabase.storage.listBuckets();
  if (bucketError) {
    console.error("Could not list storage buckets:", bucketError.message);
    process.exit(1);
  }

  if (!buckets?.some((bucket) => bucket.id === BUCKET)) {
    const { error: createError } = await supabase.storage.createBucket(BUCKET, {
      public: true,
    });
    if (createError) {
      console.error(
        `Missing ${BUCKET} bucket. Create a public Storage bucket named ${BUCKET}, or run the migration SQL.`,
      );
      console.error(createError.message);
      process.exit(1);
    }
    console.log(`Created public storage bucket: ${BUCKET}`);
  }
}

async function loadPlaceholderFiles() {
  const names = (await readdir(placeholdersDir))
    .filter((name) => /\.(png|jpe?g|webp)$/i.test(name))
    .sort(naturalName);

  if (names.length === 0) {
    console.error(
      `No placeholder images found in ${placeholdersDir}. Unzip DM.zip PNGs into that folder.`,
    );
    process.exit(1);
  }

  return names;
}

async function uploadPlaceholders(fileNames) {
  const publicUrls = [];

  for (let index = 0; index < fileNames.length; index += 1) {
    const fileName = fileNames[index];
    const bytes = await readFile(path.join(placeholdersDir, fileName));
    const ext = path.extname(fileName).slice(1).toLowerCase() || "png";
    const contentType =
      ext === "jpg" || ext === "jpeg"
        ? "image/jpeg"
        : ext === "webp"
          ? "image/webp"
          : "image/png";
    const objectPath = `placeholders/slide-${String(index + 1).padStart(2, "0")}.${ext}`;

    const { error: uploadError } = await supabase.storage
      .from(BUCKET)
      .upload(objectPath, bytes, {
        contentType,
        upsert: true,
        cacheControl: "31536000",
      });

    if (uploadError) {
      throw new Error(`Upload failed for ${fileName}: ${uploadError.message}`);
    }

    const { data } = supabase.storage.from(BUCKET).getPublicUrl(objectPath);
    publicUrls.push(data.publicUrl);
    console.log(`✓ uploaded ${objectPath}`);
  }

  return publicUrls;
}

async function main() {
  await assertReady();

  const fileNames = await loadPlaceholderFiles();
  const imageUrls = await uploadPlaceholders(fileNames);
  const photosPerEvent = imageUrls.length;
  console.log(
    `Seeding galleries from ${photosPerEvent} reusable placeholder images (${photosPerEvent} per event)…`,
  );

  const { data: events, error: eventsError } = await supabase
    .from("events")
    .select("id, luma_event_id, title, sort_order")
    .order("sort_order", { ascending: true });

  if (eventsError) {
    console.error("Failed to load events:", eventsError.message);
    process.exit(1);
  }

  if (!events?.length) {
    console.error("No events found. Run npm run seed:events first.");
    process.exit(1);
  }

  const rows = [];
  for (const event of events) {
    for (let photoIndex = 0; photoIndex < photosPerEvent; photoIndex += 1) {
      const imageUrl = imageUrls[photoIndex];
      rows.push({
        event_id: event.id,
        image_url: imageUrl,
        sort_order: photoIndex,
      });
    }
  }

  const { error: staleError } = await supabase
    .from("event_gallery_images")
    .delete()
    .gte("sort_order", photosPerEvent);

  if (staleError) {
    console.error("Could not remove stale gallery rows:", staleError.message);
    process.exit(1);
  }

  const { error: upsertError } = await supabase
    .from("event_gallery_images")
    .upsert(rows, { onConflict: "event_id,sort_order" });

  if (upsertError) {
    console.error("Upsert failed:", upsertError.message);
    process.exit(1);
  }

  const eventIds = events.map((event) => event.id);
  const { data: verificationRows, error: verificationError } = await supabase
    .from("event_gallery_images")
    .select("event_id, sort_order")
    .in("event_id", eventIds);

  if (verificationError) {
    console.error("Gallery verification failed:", verificationError.message);
    process.exit(1);
  }

  const expectedRows = events.length * photosPerEvent;
  const countsByEvent = new Map();
  for (const row of verificationRows ?? []) {
    countsByEvent.set(row.event_id, (countsByEvent.get(row.event_id) ?? 0) + 1);
  }
  const allEventsComplete = eventIds.every(
    (eventId) => countsByEvent.get(eventId) === photosPerEvent,
  );

  if (verificationRows?.length !== expectedRows || !allEventsComplete) {
    console.error(
      `Gallery verification expected ${expectedRows} rows and ${photosPerEvent} per event; found ${verificationRows?.length ?? 0} total.`,
    );
    process.exit(1);
  }

  console.log(
    `Done. Reused ${imageUrls.length} uploaded placeholder files; verified ${expectedRows} gallery rows (${photosPerEvent} per event) across ${events.length} events.`,
  );
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
