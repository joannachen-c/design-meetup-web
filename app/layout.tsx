import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";
import { AgentationDev } from "@/components/AgentationDev";
import {
  siteDescription,
  siteName,
  siteOgImage,
  siteTitle,
  siteUrl,
} from "@/lib/site";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: siteTitle,
    template: `%s · ${siteName}`,
  },
  description: siteDescription,
  applicationName: siteName,
  authors: [{ name: siteName, url: siteUrl }],
  creator: siteName,
  publisher: siteName,
  category: "community",
  keywords: [
    "Design Meetup",
    "design community",
    "NYC designers",
    "San Francisco designers",
    "Los Angeles designers",
    "creative meetup",
    "early career designers",
  ],
  alternates: {
    canonical: "/",
  },
  icons: {
    icon: [{ url: "/design-meetup-logo.png", type: "image/png" }],
    apple: [{ url: "/design-meetup-logo.png", type: "image/png" }],
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "/",
    siteName: siteName,
    title: siteTitle,
    description: siteDescription,
    images: [siteOgImage],
  },
  twitter: {
    card: "summary_large_image",
    title: siteTitle,
    description: siteDescription,
    images: [siteOgImage.url],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
      "max-video-preview": -1,
    },
  },
};

export const viewport: Viewport = {
  themeColor: "#ffffff",
  colorScheme: "light",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  // Browser extensions inject attributes onto html and body before React
  // hydrates, which otherwise reports a mismatch on every page load.
  return (
    <html lang="en" suppressHydrationWarning>
      <body suppressHydrationWarning>
        {children}
        {process.env.NODE_ENV === "development" ? <AgentationDev /> : null}
      </body>
    </html>
  );
}
