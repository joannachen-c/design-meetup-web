// Right-size remote images at request time instead of shipping full-resolution
// originals. Gallery photos live in Supabase Storage as ~500KB-800KB JPEGs but
// only ever render a few hundred pixels tall, so downscaling on the CDN cuts
// the payload by ~10x. Cover art comes from Luma's Cloudflare image pipeline,
// which takes the same kind of width/quality hints.

export type SizedImageOptions = {
  /** Target CSS width in pixels (before DPR). */
  width: number;
  /** Optional target height; only used by the Supabase transform. */
  height?: number;
  /** JPEG/WebP quality, 20-100. */
  quality?: number;
  /** Device pixel ratio to render for. Defaults to 2 for crisp retina output. */
  dpr?: number;
};

const SUPABASE_OBJECT_SEGMENT = "/storage/v1/object/public/";
const SUPABASE_RENDER_SEGMENT = "/storage/v1/render/image/public/";
const LUMA_TRANSFORM = /\/cdn-cgi\/image\/([^/]+)\//;

function clampQuality(quality: number) {
  return Math.min(100, Math.max(20, Math.round(quality)));
}

// Supabase Storage supports on-the-fly resizing via the render endpoint. WebP
// is negotiated automatically from the browser's Accept header, so we only need
// to pass dimensions + quality.
function transformSupabase(url: string, options: SizedImageOptions) {
  if (!url.includes(SUPABASE_OBJECT_SEGMENT)) return null;
  const rendered = url.replace(
    SUPABASE_OBJECT_SEGMENT,
    SUPABASE_RENDER_SEGMENT,
  );
  const parsed = new URL(rendered);
  const targetWidth = Math.round(options.width * (options.dpr ?? 2));
  parsed.searchParams.set("width", String(targetWidth));
  if (options.height) {
    parsed.searchParams.set(
      "height",
      String(Math.round(options.height * (options.dpr ?? 2))),
    );
  }
  // Needed even when we only ask for a width: the endpoint defaults to `cover`
  // and fills the dimension we leave out with the original's, so a bare width
  // renders a 2400x2400 cover as a 840x2400 slice with the sides cropped off.
  parsed.searchParams.set("resize", "contain");
  parsed.searchParams.set("quality", String(clampQuality(options.quality ?? 70)));
  return parsed.toString();
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
      url
    );
  } catch {
    return url;
  }
}

export type SizedImage = { src: string; srcSet?: string };

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
  if (!url.includes(SUPABASE_RENDER_SEGMENT)) return null;
  try {
    const parsed = new URL(url);
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
 * Every photo on the site is served through the one transformation endpoint, so
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
    if (!entry) continue;
    const { src, srcSet } = typeof entry === "string" ? { src: entry, srcSet: undefined } : entry;
    if (!src) continue;
    const image = new Image();
    image.decoding = "async";
    // Before `src`, so the browser resolves the same candidate the rendered
    // `<img>` will. Warming a different variant would fetch bytes nothing goes
    // on to use and still leave the real image cold.
    if (srcSet) image.srcset = srcSet;
    image.src = src;
    loaders.push(image);
  }
  return () => {
    for (const image of loaders) {
      image.src = "";
    }
  };
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
