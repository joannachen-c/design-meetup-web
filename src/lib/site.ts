/** Canonical public site URL. Override with NEXT_PUBLIC_SITE_URL when a custom domain ships. */
export const siteUrl = (
  process.env.NEXT_PUBLIC_SITE_URL ?? "https://design-meetup-web.vercel.app"
).replace(/\/$/, "");

export const siteName = "Design Meetup";

export const siteTitle =
  "Design Meetup — Community for ambitious creatives in NYC, SF & LA";

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
