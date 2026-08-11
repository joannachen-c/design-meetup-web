import { createClient } from "@supabase/supabase-js";
import { config } from "dotenv";
import { createHash } from "node:crypto";
import { readdir, readFile, access } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

config({ path: ".env.local" });
config();

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const logosDir = path.join(__dirname, "data", "sponsor-logos");
const sponsorsPath = path.join(__dirname, "data", "sponsors.json");

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

function contentTypeFor(filename) {
  if (filename.endsWith(".svg")) return "image/svg+xml";
  if (filename.endsWith(".webp")) return "image/webp";
  if (filename.endsWith(".jpg") || filename.endsWith(".jpeg")) return "image/jpeg";
  return "image/png";
}

async function main() {
  const sponsors = JSON.parse(await readFile(sponsorsPath, "utf8"));
  const expected = new Map(sponsors.map((sponsor) => [sponsor.slug, sponsor]));

  try {
    await access(logosDir);
  } catch {
    console.error(
      `Create ${path.relative(process.cwd(), logosDir)} and add logo files named by slug (e.g. figma.svg).`,
    );
    process.exit(1);
  }

  const files = (await readdir(logosDir)).filter((name) =>
    /\.(svg|png|jpe?g|webp)$/i.test(name),
  );

  if (files.length === 0) {
    console.error("No logo files found. Expected filenames:");
    for (const sponsor of sponsors) {
      console.error(`  - ${sponsor.slug}.svg`);
    }
    process.exit(1);
  }

  const { data: buckets } = await supabase.storage.listBuckets();
  if (!buckets?.some((bucket) => bucket.id === "sponsor-logos")) {
    const { error: createError } = await supabase.storage.createBucket(
      "sponsor-logos",
      { public: true },
    );
    if (createError) {
      console.error(
        "Missing sponsor-logos bucket. Run the sponsors migration SQL first.",
      );
      console.error(createError.message);
      process.exit(1);
    }
  }

  let uploaded = 0;
  for (const filename of files) {
    const slug = path.parse(filename).name.toLowerCase();
    if (!expected.has(slug)) {
      console.warn(`Skipping unrecognized logo file: ${filename}`);
      continue;
    }

    const bytes = await readFile(path.join(logosDir, filename));
    const objectPath = `${slug}${path.extname(filename).toLowerCase()}`;
    const contentType = contentTypeFor(filename.toLowerCase());

    const { error: uploadError } = await supabase.storage
      .from("sponsor-logos")
      .upload(objectPath, bytes, {
        contentType,
        upsert: true,
        cacheControl: "31536000",
      });

    if (uploadError) {
      throw new Error(`Upload failed for ${filename}: ${uploadError.message}`);
    }

    const { data } = supabase.storage
      .from("sponsor-logos")
      .getPublicUrl(objectPath);

    // Objects keep their path across re-uploads, so a content hash is what
    // pushes a replaced logo past the year-long browser cache.
    const version = createHash("sha1").update(bytes).digest("hex").slice(0, 8);

    const { error: updateError } = await supabase
      .from("sponsors")
      .update({
        logo_url: `${data.publicUrl}?v=${version}`,
        updated_at: new Date().toISOString(),
      })
      .eq("slug", slug);

    if (updateError) {
      throw new Error(`Failed updating ${slug}: ${updateError.message}`);
    }

    uploaded += 1;
    console.log(`✓ ${slug} → ${objectPath}`);
  }

  const missing = sponsors
    .map((sponsor) => sponsor.slug)
    .filter(
      (slug) =>
        !files.some(
          (filename) => path.parse(filename).name.toLowerCase() === slug,
        ),
    );

  console.log(`Uploaded ${uploaded} sponsor logo(s).`);
  if (missing.length > 0) {
    console.log("Still missing:");
    for (const slug of missing) {
      console.log(`  - ${slug}.svg`);
    }
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
