import { ArrowUpRightIcon } from "./icons/ArrowUpRightIcon";
import { Link } from "./Link";
import { sizedImage } from "@/lib/image";
import { LUMA_PAST_EVENTS_URL } from "@/lib/luma";
import type { MeetupEvent } from "@/lib/supabase";

export function RecentEventsPanel({ events }: { events: MeetupEvent[] }) {
  return (
    <div className="recent-events flex h-full flex-col gap-4 rounded-[20px] bg-surface-muted p-[clamp(20px,2.4vw,32px)] max-[820px]:gap-3">
      <ul className="m-0 grid list-none gap-1 p-0">
        {events.map((event) => (
          <li key={event.id}>
            <a
              className="recent-event-row group grid items-center gap-[clamp(18px,2.4vw,28px)] rounded-[10px] px-[18px] py-3.5 no-underline transition-colors duration-150 hover:bg-gray-200 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink"
              href={event.luma_url ?? LUMA_PAST_EVENTS_URL}
              target="_blank"
              rel="noreferrer"
            >
              <span className="recent-event-thumb block overflow-hidden rounded-md bg-white">
                {event.image_url ? (
                  <img
                    className="block size-full select-none border-0 object-cover outline-none"
                    {...sizedImage(event.image_url, { width: 72, quality: 90 })}
                    alt=""
                    loading="lazy"
                    draggable="false"
                  />
                ) : null}
              </span>
              <span className="min-w-0">
                <span className="block text-base leading-6 text-subtle">
                  {event.date_label}
                </span>
                <span className="recent-event-title block text-lg font-bold leading-7 text-black">
                  {event.title}
                </span>
                {event.location ? (
                  <span className="recent-event-meta block text-base leading-6 text-muted">
                    {event.location}
                  </span>
                ) : null}
              </span>
            </a>
          </li>
        ))}
      </ul>
      <Link
        className="mt-auto inline-flex items-center gap-1.5 px-[18px] pt-2.5 pb-2"
        href={LUMA_PAST_EVENTS_URL}
        target="_blank"
        rel="noreferrer"
      >
        See all past events on Luma
        <ArrowUpRightIcon />
      </Link>
    </div>
  );
}
