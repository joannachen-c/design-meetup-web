import type { Metadata } from "next";
import type { ReactNode } from "react";
import { AgentationDev } from "@/components/AgentationDev";
import "./globals.css";

const siteUrl = "https://design-meetup-web.vercel.app";
const siteTitle = "Design Meetup";
const siteDescription =
  "A space for ambitious, early-career designers to meet the people behind the work.";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: siteTitle,
  description: siteDescription,
  icons: {
    icon: [{ url: "/design-meetup-logo.png", type: "image/png" }],
  },
  openGraph: {
    type: "website",
    url: siteUrl,
    siteName: siteTitle,
    title: siteTitle,
    description: siteDescription,
    images: [
      {
        url: "/og-preview.jpg",
        width: 1024,
        height: 537,
        alt: "Design Meetup — For designers who believe growth happens together",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: siteTitle,
    description: siteDescription,
    images: ["/og-preview.jpg"],
  },
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
