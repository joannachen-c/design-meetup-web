import type { Metadata } from "next";
import DesignSystem from "@/DesignSystem";

const pageTitle = "Design system";
const pageDescription =
  "Colors, typography, layout, and shared components for Design Meetup.";

export const metadata: Metadata = {
  title: pageTitle,
  description: pageDescription,
  alternates: {
    canonical: "/design-system",
  },
  robots: {
    index: false,
    follow: false,
  },
  openGraph: {
    title: `${pageTitle} · Design Meetup`,
    description: pageDescription,
    url: "/design-system",
    images: [
      {
        url: "/og-design-system.jpg",
        width: 1024,
        height: 537,
        alt: "Design Meetup design system",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: `${pageTitle} · Design Meetup`,
    description: pageDescription,
    images: ["/og-design-system.jpg"],
  },
};

export default function DesignSystemPage() {
  return <DesignSystem />;
}
