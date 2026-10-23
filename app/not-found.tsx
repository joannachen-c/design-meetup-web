import type { Metadata } from "next";
import { Primary } from "@/components/Primary";
import { SiteHeader } from "@/components/SiteHeader";

export const metadata: Metadata = {
  title: "Page not found",
  robots: {
    index: false,
    follow: false,
  },
};

export default function NotFound() {
  return (
    <>
      <SiteHeader navAriaLabel="Primary navigation" />
      <main className="flex min-h-[60vh] flex-col items-center justify-center gap-5 px-[clamp(20px,6vw,96px)] py-[clamp(48px,10vw,120px)] text-center">
        <p className="text-medium m-0 text-sm tracking-[0.08em] text-subtle uppercase">
          404
        </p>
        <h1 className="m-0 max-w-[20ch] text-balance text-[clamp(2.5rem,6vw,4rem)] font-bold leading-[1.05] tracking-[-0.04em] text-ink">
          This page doesn&rsquo;t exist
        </h1>
        <p className="m-0 max-w-[48ch] text-pretty text-base leading-[1.6] text-muted">
          The link might be broken, or the page may have moved. Let&rsquo;s
          get you back on track.
        </p>
        <Primary href="/" variant="primary" className="mt-2">
          Back to home
        </Primary>
      </main>
    </>
  );
}
