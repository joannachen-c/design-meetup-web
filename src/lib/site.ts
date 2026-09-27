/** Canonical public site URL. Override with NEXT_PUBLIC_SITE_URL when a custom domain ships. */
export const siteUrl = (
  process.env.NEXT_PUBLIC_SITE_URL ?? "https://design-meetup-web.vercel.app"
).replace(/\/$/, "");

export const siteName = "Design Meetup";

export const siteTitle = "Design Meetup";

export const siteDescription =
  "A space for the world’s most ambitious creatives.";

export const siteOgImage = {
  url: "/og-preview.jpg",
  width: 1024,
  height: 537,
  alt: "Design Meetup — A space for the world’s most ambitious creatives",
} as const;

export const siteEmail = "contactdesignmeetup@gmail.com";

export const siteSameAs = [
  "https://designmeetup.substack.com/",
  "https://www.instagram.com/designmeetup/",
  "https://www.linkedin.com/company/design-meetup/",
  "https://x.com/designmeetuphq",
  "https://luma.com/designmeetup",
] as const;

/**
 * Origin for redirects after browser POSTs (auth, checkout, profile).
 * Prefer the request's Origin / Host over NEXT_PUBLIC_SITE_URL so localhost
 * and ephemeral tunnels don't cross-redirect and drop auth cookies.
 */
export function originFromHeaders(headerList: Headers) {
  const originHeader = headerList.get("origin");
  if (originHeader) {
    try {
      return new URL(originHeader).origin;
    } catch {
      // ignore invalid Origin
    }
  }

  const referer = headerList.get("referer");
  if (referer) {
    try {
      return new URL(referer).origin;
    } catch {
      // ignore invalid Referer
    }
  }

  const forwardedHost = headerList.get("x-forwarded-host");
  if (forwardedHost) {
    const host = forwardedHost.split(",")[0]?.trim();
    const proto =
      headerList.get("x-forwarded-proto")?.split(",")[0]?.trim() || "https";
    if (host) return `${proto}://${host}`;
  }

  const host = headerList.get("host");
  if (host) {
    const proto =
      headerList.get("x-forwarded-proto")?.split(",")[0]?.trim() || "https";
    return `${proto}://${host.split(",")[0]?.trim()}`;
  }

  return null;
}

export function requestOrigin(request: Request) {
  return originFromHeaders(request.headers) ?? fallbackRequestOrigin(request);
}

function fallbackRequestOrigin(request: Request) {
  try {
    return new URL(request.url).origin;
  } catch {
    return siteUrl;
  }
}
