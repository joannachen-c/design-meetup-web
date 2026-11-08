import type { Metadata } from "next";
import { TalentPage } from "@/components/talent/TalentPage";

const pageTitle = "Talent Network";
const pageDescription =
  "We match your team with vetted designers of all levels nationwide, through a trusted design community.";

const ogImage = {
  url: "/og-talent.jpg",
  width: 1200,
  height: 630,
  alt: "Design Meetup Talent Network: a globe of the companies our network designs at",
} as const;

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
    images: [ogImage],
  },
  twitter: {
    card: "summary_large_image",
    title: `${pageTitle} · Design Meetup`,
    description: pageDescription,
    images: [ogImage.url],
  },
};

export default function TalentNetworkPage() {
  return <TalentPage />;
}
