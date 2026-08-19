// Right-size remote images at request time instead of shipping full-resolution
// originals. Gallery photos live in Supabase Storage as ~500KB-800KB JPEGs but
// only ever render a few hundred pixels tall, so downscaling on the CDN cuts
// the payload by ~10x. Cover art comes from Luma's Cloudflare image pipeline,
// which takes the same kind of width/quality hints.
//
// Supabase photos go through Next.js `/_next/image`, not Storage's
// `/render/image` endpoint. Image Transformations are a Pro-plan feature, and
// every render (or the full original after a failed render) counts against the
// Free plan's 5 GB egress. Vercel caches each unique size after the first
// origin fetch, so repeat views never hit Supabase.

import {
  DEFAULT_IMAGE_QUALITY,
  IMAGE_QUALITIES,
  IMAGE_WIDTHS,
} from "./image-optimizer.ts";

export type SizedImageOptions = {
  /** Target CSS width in pixels (before DPR). */
  width: number;
  /**
   * Optional target height. Luma's transform uses it; Next.js keeps aspect
   * ratio from width alone, so it is ignored for Supabase and local photos.
   */
  height?: number;
  /** JPEG/WebP quality, 20-100. Snapped to the Next.js allowlist. */
  quality?: number;
  /** Device pixel ratio to render for. Defaults to 2 for crisp retina output. */
  dpr?: number;
};

const SUPABASE_OBJECT_SEGMENT = "/storage/v1/object/public/";
const SUPABASE_RENDER_SEGMENT = "/storage/v1/render/image/public/";
const LUMA_TRANSFORM = /\/cdn-cgi\/image\/([^/]+)\//;
const LOCAL_RASTER = /\.(avif|gif|jpe?g|png|webp)$/i;

function clampQuality(quality: number) {
  return Math.min(100, Math.max(20, Math.round(quality)));
}

function snapToAllowlist(value: number, allowed: readonly number[]) {
  let best = allowed[0];
  for (const candidate of allowed) {
    if (candidate >= value) return candidate;
    best = candidate;
  }
  return best;
}

function nextImageUrl(src: string, options: SizedImageOptions) {
  const width = snapToAllowlist(
    Math.round(options.width * (options.dpr ?? 2)),
    IMAGE_WIDTHS,
  );
  const quality = snapToAllowlist(
    clampQuality(options.quality ?? DEFAULT_IMAGE_QUALITY),
    IMAGE_QUALITIES,
  );
  const params = new URLSearchParams({
    url: src,
    w: String(width),
    q: String(quality),
  });
  return `/_next/image?${params.toString()}`;
}

function supabaseObjectUrl(url: string) {
  const [withoutQuery] = url.split("?");
  if (withoutQuery.includes(SUPABASE_RENDER_SEGMENT)) {
    return withoutQuery.replace(SUPABASE_RENDER_SEGMENT, SUPABASE_OBJECT_SEGMENT);
  }
  if (withoutQuery.includes(SUPABASE_OBJECT_SEGMENT)) return withoutQuery;
  return null;
}

// Next.js resizes with `fit=contain` equivalent (width only, aspect kept), so
// we never ask for a height — that would be ignored and used to crop on the
// old Supabase render endpoint.
function transformSupabase(url: string, options: SizedImageOptions) {
  const original = supabaseObjectUrl(url);
  return original ? nextImageUrl(original, options) : null;
}

function transformLocal(url: string, options: SizedImageOptions) {
  if (!url.startsWith("/") || url.startsWith("//") || url.startsWith("/_next/")) {
    return null;
  }
  const path = url.split("?")[0];
  if (!LOCAL_RASTER.test(path)) return null;
  return nextImageUrl(path, options);
}

// Luma already serves through Cloudflare's `/cdn-cgi/image/<opts>/` transform.
// Rewriting width/height/dpr in that segment lets us ask for a smaller render
// than the default 1200x1200@2x the seed data hard-codes.
function transformLuma(url: string, options: SizedImageOptions) {
  const match = url.match(LUMA_TRANSFORM);
  if (!match) return null;
  const dpr = options.dpr ?? 2;
  const opts = new Map<string, string>();
  for (const pair of match[1].split(",")) {
    const [key, value] = pair.split("=");
    if (key) opts.set(key, value ?? "");
  }
  opts.set("width", String(options.width));
  opts.set("height", String(options.height ?? options.width));
  opts.set("dpr", String(dpr));
  if (options.quality) opts.set("quality", String(clampQuality(options.quality)));
  const rebuilt = Array.from(opts, ([key, value]) =>
    value === "" ? key : `${key}=${value}`,
  ).join(",");
  return url.replace(LUMA_TRANSFORM, `/cdn-cgi/image/${rebuilt}/`);
}

/**
 * Return a CDN URL that renders `url` at roughly the size it's displayed.
 * Falls back to the original URL for hosts we don't recognise.
 */
export function sizedImageUrl(
  url: string | null | undefined,
  options: SizedImageOptions,
): string {
  if (!url) return url ?? "";
  try {
    return (
      transformSupabase(url, options) ??
      transformLuma(url, options) ??
      transformLocal(url, options) ??
      url
    );
  } catch {
    return url;
  }
}

export type SizedImage = { src: string; srcSet?: string };

/** Matches the cover `<img>`: 272 is the --event-cover-size ceiling. */
export const EVENT_COVER_RENDER = { width: 272, quality: 90 } as const;

// Desktop fits four whole covers either side of the focused one; phone shows
// fewer, but the extras are the next covers a flick would reveal.
export const VISIBLE_COVER_RADIUS = 4;

// The rail opens on the sixth cover so the shelf reads as a shelf from the
// first frame. Keep the server preload on this same slot or it would warm a
// different set than the one that deals in after the loader.
export const DEFAULT_FOCUS_SLOT = 5;

export function initialFocusIndex(eventCount: number) {
  return eventCount > DEFAULT_FOCUS_SLOT ? DEFAULT_FOCUS_SLOT : 0;
}

export function eventCoverImage(url: string | null | undefined): SizedImage {
  return sizedImage(url, EVENT_COVER_RENDER);
}

/**
 * Cover art for the shelf that is on screen when the page first opens.
 *
 * `focusIndex` must match the rail's opening slot (`DEFAULT_FOCUS_SLOT`),
 * otherwise we would warm a different set than the one that deals in after
 * the loader.
 */
export function firstPaintCoverImages(
  events: Array<{ image_url: string }>,
  focusIndex: number,
  radius = VISIBLE_COVER_RADIUS,
): SizedImage[] {
  const from = Math.max(0, focusIndex - radius);
  const to = Math.min(events.length, focusIndex + radius + 1);
  return events.slice(from, to).map((event) => eventCoverImage(event.image_url));
}

function sizedImageParts(
  entry: SizedImage | string | null | undefined,
): SizedImage | null {
  if (!entry) return null;
  const image = typeof entry === "string" ? { src: entry } : entry;
  return image.src ? image : null;
}

/**
 * Build a `src`/`srcSet` pair for an image that paints `width` CSS pixels wide.
 *
 * Density descriptors leave the choice of render to the browser, which is the
 * only party that knows the screen. Asking for a fixed 2x render instead made
 * every 1x visitor download four times the pixels they could display, and
 * offering a 1x candidate is also what lets a 2x screen stay sharp without us
 * having to pick a compromise size for both.
 */
export function sizedImage(
  url: string | null | undefined,
  options: Omit<SizedImageOptions, "dpr">,
): SizedImage {
  const src = sizedImageUrl(url, { ...options, dpr: 1 });
  const retina = sizedImageUrl(url, { ...options, dpr: 2 });
  return retina === src ? { src } : { src, srcSet: `${src} 1x, ${retina} 2x` };
}

/** The stored original behind a transformed URL, or null if this isn't one. */
export function untransformedImageUrl(url: string): string | null {
  try {
    const parsed = new URL(url, "https://design-meetup.local");
    if (
      parsed.pathname === "/_next/image" ||
      parsed.pathname.endsWith("/_next/image")
    ) {
      return parsed.searchParams.get("url");
    }
    if (!url.includes(SUPABASE_RENDER_SEGMENT)) return null;
    parsed.search = "";
    return parsed
      .toString()
      .replace(SUPABASE_RENDER_SEGMENT, SUPABASE_OBJECT_SEGMENT);
  } catch {
    return null;
  }
}

/**
 * Retry a failed image against its untransformed original.
 *
 * Every photo on the site is served through the Next.js optimizer, so
 * without this a fault there leaves the page with no artwork at all rather than
 * heavy artwork. Returns whether a retry was started, so callers can tell a
 * recoverable failure from a final one.
 */
export function recoverImage(image: HTMLImageElement | null): boolean {
  if (!image || image.dataset.recovered === "true") return false;
  const original = untransformedImageUrl(image.currentSrc || image.src);
  if (!original) return false;
  image.dataset.recovered = "true";
  image.srcset = "";
  image.src = original;
  return true;
}

/**
 * Warm the browser cache for a set of images. Returns a cleanup function that
 * detaches the in-flight loaders so we don't keep decoding work alive after the
 * component unmounts or the target set changes.
 */
export function preloadImages(
  images: Array<SizedImage | string | null | undefined>,
): () => void {
  if (typeof window === "undefined") return () => {};
  const loaders: HTMLImageElement[] = [];
  for (const entry of images) {
    const parts = sizedImageParts(entry);
    if (!parts) continue;
    const image = new Image();
    image.decoding = "async";
    // Before `src`, so the browser resolves the same candidate the rendered
    // `<img>` will. Warming a different variant would fetch bytes nothing goes
    // on to use and still leave the real image cold.
    if (parts.srcSet) image.srcset = parts.srcSet;
    image.src = parts.src;
    loaders.push(image);
  }
  return () => {
    for (const image of loaders) {
      image.src = "";
    }
  };
}

/**
 * Resolve once every image has been fetched and decoded, or has failed.
 *
 * Used to hold the page loader until the first-paint covers have pixels, so
 * the shelf does not deal in as empty white cards. Failures still resolve:
 * a missing cover should not strand the curtain.
 */
export function whenImagesReady(
  images: Array<SizedImage | string | null | undefined>,
): Promise<void> {
  if (typeof window === "undefined") return Promise.resolve();

  const pending = images.flatMap((entry) => {
    const parts = sizedImageParts(entry);
    if (!parts) return [];
    return [
      new Promise<void>((resolve) => {
        const image = new Image();
        const settle = () => resolve();
        image.onload = () => {
          image.decode().then(settle, settle);
        };
        image.onerror = settle;
        if (parts.srcSet) image.srcset = parts.srcSet;
        image.src = parts.src;
        if (image.complete) {
          if (image.naturalWidth > 0) {
            image.decode().then(settle, settle);
          } else {
            settle();
          }
        }
      }),
    ];
  });

  return pending.length === 0 ? Promise.resolve() : Promise.all(pending).then(() => {});
}

const warmedUrls = new Set<string>();

/**
 * Fetch and decode images, then remember that they are ready to paint.
 *
 * Unlike `preloadImages` this never aborts an in-flight fetch: the images it
 * warms are the ones about to be shown, so cancelling on the next state change
 * would throw away exactly the work that makes the swap feel instant.
 */
export function warmImages(urls: Array<string | null | undefined>): void {
  if (typeof window === "undefined") return;
  for (const url of urls) {
    if (!url || warmedUrls.has(url)) continue;
    const image = new Image();
    image.decoding = "async";
    image.src = url;
    // The pending decode holds `image` alive; once it settles the browser's own
    // cache keeps the pixels, so only the URL is worth remembering.
    const remember = () => {
      if (image.complete && image.naturalWidth > 0) warmedUrls.add(url);
    };
    image.decode().then(remember, remember);
  }
}

/** True once `warmImages` has decoded `url`, so it can paint without a fetch. */
export function isImageWarm(url: string | null | undefined): boolean {
  return Boolean(url && warmedUrls.has(url));
}
