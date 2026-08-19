import assert from "node:assert/strict";
import test from "node:test";
import { readFile } from "node:fs/promises";

const { sizedImageUrl, firstPaintCoverImages, eventCoverImage, VISIBLE_COVER_RADIUS, initialFocusIndex, DEFAULT_FOCUS_SLOT, untransformedImageUrl } = await import("../src/lib/image.ts");
const nextConfigSource = await readFile(
  new URL("../next.config.ts", import.meta.url),
  "utf8",
);

const SUPABASE_COVER =
  "https://example.supabase.co/storage/v1/object/public/event-covers/evt-abc.jpg";
const LUMA_COVER =
  "https://images.lumacdn.com/cdn-cgi/image/format=auto,fit=cover,dpr=2,anim=false,quality=85,width=1200,height=1200/uploads/63/cover.png";

function optimizerUrl(src, options) {
  return new URL(sizedImageUrl(src, options), "https://design-meetup.local");
}

test("Supabase photos are resized by Next.js, not the Storage render endpoint", () => {
  const url = optimizerUrl(SUPABASE_COVER, { width: 420, quality: 90 });
  assert.equal(url.pathname, "/_next/image");
  assert.equal(url.searchParams.get("url"), SUPABASE_COVER);
  assert.equal(url.searchParams.get("q"), "90");
  // 420 CSS px at the default 2x dpr is 840; snap up to the next allowlisted width.
  assert.equal(url.searchParams.get("w"), "920");
  assert.equal(url.searchParams.get("height"), null);
  assert.doesNotMatch(url.href, /render\/image/);
  assert.match(nextConfigSource, /hostname: "\*\.supabase\.co"/);
  assert.match(nextConfigSource, /pathname: "\/storage\/v1\/object\/public\/\*\*"/);
  assert.match(nextConfigSource, /minimumCacheTTL: 60 \* 60 \* 24 \* 31/);
});

test("Supabase renders keep the image's aspect ratio", () => {
  // Next.js sizes from width alone. Passing a height used to crop on the
  // Supabase render endpoint (resize=cover filling the missing side).
  const url = optimizerUrl(SUPABASE_COVER, {
    width: 200,
    height: 120,
    dpr: 1,
    quality: 90,
  });
  assert.equal(url.searchParams.get("w"), "240");
  assert.equal(url.searchParams.get("url"), SUPABASE_COVER);
  assert.equal(url.searchParams.get("height"), null);
});

test("legacy Storage render URLs are rewritten back to the original object", () => {
  const rendered =
    "https://example.supabase.co/storage/v1/render/image/public/event-covers/evt-abc.jpg?width=840&resize=contain";
  const url = optimizerUrl(rendered, { width: 200, dpr: 1, quality: 90 });
  assert.equal(url.searchParams.get("url"), SUPABASE_COVER);
});

test("local raster photos use the same optimizer", () => {
  const url = optimizerUrl("/marquee/IMG_9707.jpg", {
    width: 283,
    dpr: 1,
    quality: 90,
  });
  assert.equal(url.pathname, "/_next/image");
  assert.equal(url.searchParams.get("url"), "/marquee/IMG_9707.jpg");
  assert.equal(url.searchParams.get("w"), "283");
});

test("a failed optimizer URL falls back to the stored original", () => {
  const optimized = sizedImageUrl(SUPABASE_COVER, { width: 200, dpr: 1, quality: 90 });
  assert.equal(untransformedImageUrl(optimized), SUPABASE_COVER);
  assert.equal(
    untransformedImageUrl(
      `https://design-meetup-web.vercel.app${optimized}`,
    ),
    SUPABASE_COVER,
  );
});

test("Luma covers are re-rendered at the requested size", () => {
  const url = sizedImageUrl(LUMA_COVER, { width: 420, quality: 90 });
  assert.match(url, /width=420/);
  assert.match(url, /height=420/);
  assert.match(url, /dpr=2/);
  assert.match(url, /quality=90/);
  assert.doesNotMatch(url, /width=1200/);
});

test("unknown hosts and empty values pass through untouched", () => {
  assert.equal(
    sizedImageUrl("https://cdn.example.com/cover.jpg", { width: 420 }),
    "https://cdn.example.com/cover.jpg",
  );
  assert.equal(sizedImageUrl(null, { width: 420 }), "");
});

test("first-paint covers are the focused slot plus the visible radius", () => {
  const events = Array.from({ length: 12 }, (_, index) => ({
    image_url: LUMA_COVER.replace("cover.png", `cover-${index}.png`),
  }));
  const focus = initialFocusIndex(events.length);
  assert.equal(focus, DEFAULT_FOCUS_SLOT);
  const covers = firstPaintCoverImages(events, focus);
  assert.equal(covers.length, VISIBLE_COVER_RADIUS * 2 + 1);
  assert.match(covers[0].src, /cover-1\.png/);
  assert.match(covers.at(-1).src, /cover-9\.png/);
  assert.deepEqual(covers[VISIBLE_COVER_RADIUS], eventCoverImage(events[focus].image_url));
});

test("a short archive still preloads every cover around the opening slot", () => {
  const events = [{ image_url: LUMA_COVER }, { image_url: LUMA_COVER }];
  assert.equal(initialFocusIndex(events.length), 0);
  assert.equal(firstPaintCoverImages(events, 0).length, 2);
});
