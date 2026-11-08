import type { Metadata } from "next";
import { Primary } from "@/components/Primary";
import { SiteHeader, type SiteHeaderLink } from "@/components/SiteHeader";

const notFoundHeaderLinks: SiteHeaderLink[] = [
  { href: "/#calendar", label: "Calendar" },
  { href: "/#about", label: "About" },
  { href: "/#sponsor", label: "Sponsor" },
  { href: "/#apply", label: "Join Us" },
  { href: "/login", label: "Login" },
];

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
      <SiteHeader links={notFoundHeaderLinks} />
      <main className="flex min-h-[60vh] flex-col items-center justify-center gap-2 px-[clamp(20px,6vw,96px)] py-[clamp(48px,10vw,120px)] text-center">
        <p className="m-0 text-[clamp(7rem,24vw,16rem)] leading-none font-bold tracking-[-0.04em] text-subtle/40">
          404
        </p>
        <h1 className="m-0 max-w-[20ch] text-balance text-[clamp(2rem,5vw,3rem)] font-bold leading-[1.05] tracking-[-0.04em] text-ink">
          This page doesn&rsquo;t exist
        </h1>
        <p className="m-0 max-w-[48ch] text-pretty text-base leading-[1.6] text-muted">
          We&rsquo;re pushing the pixels!
        </p>
        <Primary href="/" variant="primary" className="mt-4">
          Back to home
        </Primary>
      </main>
    </>
  );
}
