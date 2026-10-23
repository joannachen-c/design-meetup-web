import type { Metadata } from "next";
import { TalentPage } from "@/components/talent/TalentPage";
import { siteOgImage } from "@/lib/site";

const pageTitle = "Talent Network";
const pageDescription =
  "Hire vetted senior designers in San Francisco, Los Angeles and New York through Design Meetup’s Board of Advisors.";

export const metadata: Metadata = {
  title: pageTitle,
  description: pageDescription,
  alternates: {
    canonical: "/talent",
  },
  // Shared by direct link only: kept out of search and the sitemap.
  robots: {
    index: false,
    follow: false,
  },
  openGraph: {
    title: `${pageTitle} · Design Meetup`,
    description: pageDescription,
    url: "/talent",
    images: [siteOgImage],
  },
  twitter: {
    card: "summary_large_image",
    title: `${pageTitle} · Design Meetup`,
    description: pageDescription,
    images: [siteOgImage.url],
  },
};

export default function TalentNetworkPage() {
  return <TalentPage />;
}
