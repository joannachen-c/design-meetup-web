import type { Metadata } from "next";
import type { ReactNode } from "react";
import "./globals.css";

export const metadata: Metadata = {
  title: "Design Meetup",
  description:
    "Design Meetup brings ambitious, early-career designers together.",
  icons: {
    icon: [{ url: "/design-meetup-logo.png", type: "image/png" }],
  },
};

export default function RootLayout({ children }: { children: ReactNode }) {
  // Browser extensions inject attributes onto html and body before React
  // hydrates, which otherwise reports a mismatch on every page load.
  return (
    <html lang="en" suppressHydrationWarning>
      <body suppressHydrationWarning>{children}</body>
    </html>
  );
}
