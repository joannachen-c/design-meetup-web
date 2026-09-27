import type { Metadata } from "next";
import { Primary } from "@/components/Primary";
import { LUMA_CALENDAR_EMBED_SRC, LUMA_PROFILE_URL } from "@/lib/luma";

export const metadata: Metadata = {
  title: "Events",
  robots: { index: false, follow: false },
};

export default function PortalEventsPage() {
  return (
    <main
      className="upcoming-events w-full px-[clamp(20px,6vw,96px)] pt-[clamp(32px,5vw,64px)] pb-24"
      aria-labelledby="portal-events-title"
    >
      <div className="upcoming-events-copy">
        <h1
          id="portal-events-title"
          className="m-0 text-[clamp(2.5rem,6vw,4.5rem)] font-bold leading-[1.02] tracking-[-0.06em]"
        >
          Events
        </h1>
        <p className="m-0 max-w-[54ch] text-pretty text-base leading-[1.6] text-ink">
          RSVP on Luma to join us at the next Design Meetup.
        </p>
        <Primary
          className="gap-2"
          href={LUMA_PROFILE_URL}
          target="_blank"
          rel="noreferrer"
          variant="ink"
        >
          <img
            className="size-5 brightness-0 invert"
            src="/luma-logo.svg"
            alt=""
            aria-hidden="true"
          />
          Follow our Luma
        </Primary>
      </div>
      <div className="upcoming-events-embed overflow-hidden rounded-[20px]">
        <iframe
          className="upcoming-events-frame block w-full border-0 bg-transparent"
          src={LUMA_CALENDAR_EMBED_SRC}
          title="Design Meetup upcoming events on Luma"
          loading="lazy"
          allow="fullscreen"
        />
      </div>
    </main>
  );
}
