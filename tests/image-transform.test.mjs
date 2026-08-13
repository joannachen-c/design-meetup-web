import assert from "node:assert/strict";
import test from "node:test";

const { sizedImageUrl, firstPaintCoverImages, eventCoverImage, VISIBLE_COVER_RADIUS, initialFocusIndex, DEFAULT_FOCUS_SLOT } = await import("../src/lib/image.ts");

const SUPABASE_COVER =
  "https://example.supabase.co/storage/v1/object/public/event-covers/evt-abc.jpg";
const LUMA_COVER =
  "https://images.lumacdn.com/cdn-cgi/image/format=auto,fit=cover,dpr=2,anim=false,quality=85,width=1200,height=1200/uploads/63/cover.png";

test("Supabase renders keep the image's aspect ratio", () => {
  // The render endpoint defaults to resize=cover and fills the dimension we
  // leave out with the original's, so a bare width crops the sides off a square
  // cover instead of scaling it down.
  const url = new URL(sizedImageUrl(SUPABASE_COVER, { width: 420, quality: 74 }));
  assert.equal(url.searchParams.get("resize"), "contain");
  assert.equal(url.searchParams.get("width"), "840");
  assert.equal(url.searchParams.get("quality"), "74");
  assert.equal(url.searchParams.get("height"), null);
  assert.match(url.pathname, /^\/storage\/v1\/render\/image\/public\//);
});

test("Supabase renders honour an explicit height without cropping", () => {
  const url = new URL(
    sizedImageUrl(SUPABASE_COVER, { width: 200, height: 120, dpr: 1 }),
  );
  assert.equal(url.searchParams.get("width"), "200");
  assert.equal(url.searchParams.get("height"), "120");
  assert.equal(url.searchParams.get("resize"), "contain");
});

test("Luma covers are re-rendered at the requested size", () => {
  const url = sizedImageUrl(LUMA_COVER, { width: 420, quality: 74 });
  assert.match(url, /width=420/);
  assert.match(url, /height=420/);
  assert.match(url, /dpr=2/);
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
