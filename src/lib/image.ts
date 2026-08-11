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

/**
 * Warm the browser cache for a set of images. Returns a cleanup function that
 * detaches the in-flight loaders so we don't keep decoding work alive after the
 * component unmounts or the target set changes.
 */
export function preloadImages(urls: Array<string | null | undefined>): () => void {
  if (typeof window === "undefined") return () => {};
  const loaders: HTMLImageElement[] = [];
  for (const url of urls) {
    if (!url) continue;
    const image = new Image();
    image.decoding = "async";
    image.src = url;
    loaders.push(image);
  }
  return () => {
    for (const image of loaders) {
      image.src = "";
    }
  };
}
