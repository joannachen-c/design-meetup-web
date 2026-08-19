// Widths and qualities the Next.js image optimizer is allowed to serve.
// Keep these in lockstep with `images` in next.config.ts — a URL that asks
// for a value outside the lists is rejected or coerced, which would either
// 400 the photo or silently drop quality.
//
// `imageSizes` must stay below the smallest `deviceSizes` entry (Next.js
// treats the two lists as "thumbnail" vs "viewport" breakpoints).

export const IMAGE_SIZES = [
  16, 32, 48, 64, 96, 128, 240, 256, 272, 280, 283, 384, 460,
] as const;

export const IMAGE_DEVICE_SIZES = [
  480, 544, 560, 566, 640, 750, 828, 920, 1080, 1200, 1500, 1920, 2048, 3840,
] as const;

export const IMAGE_WIDTHS = [...IMAGE_SIZES, ...IMAGE_DEVICE_SIZES];

// 90 is visually lossless at the sizes we paint. 75 is Next's default, kept
// so a request that omits `q` still hits an allowlisted value.
export const IMAGE_QUALITIES = [75, 90] as const;

export const DEFAULT_IMAGE_QUALITY = 90;
