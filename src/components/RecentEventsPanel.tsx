import { ArrowUpRightIcon } from "./icons/ArrowUpRightIcon";
import { Link } from "./Link";
import type { LumaEvent } from "@/lib/luma";

const LUMA_PAST_CALENDAR_URL = "https://luma.com/designmeetup?period=past";

export function RecentEventsPanel({ events }: { events: LumaEvent[] }) {
  return (
    <div className="recent-events flex h-full flex-col gap-6 bg-surface-muted p-[clamp(20px,2.4vw,32px)]">
      <h3 className="m-0 pl-3 pt-3 text-2xl font-bold tracking-[-0.06em] text-black">
        Past events
      </h3>
      <ul className="m-0 grid list-none gap-1 p-0">
        {events.map((event) => (
          <li key={event.id}>
            <a
              className="recent-event-row group grid items-center gap-[clamp(14px,2vw,24px)] rounded-[10px] px-3 py-3.5 no-underline transition-colors duration-150 hover:bg-gray-200 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink"
              href={event.url}
              target="_blank"
              rel="noreferrer"
            >
              <span className="recent-event-thumb block overflow-hidden rounded-md bg-white">
                {event.coverUrl ? (
                  <img
                    className="block size-full select-none border-0 object-cover outline-none"
                    src={event.coverUrl}
                    alt=""
                    loading="lazy"
                    draggable="false"
                  />
                ) : null}
              </span>
              <span className="min-w-0">
                <span className="block text-base leading-6 text-subtle">
                  {event.dateLabel}
                </span>
                <span className="recent-event-title block text-lg font-bold leading-7 text-black">
                  {event.name}
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
        className="mt-auto inline-flex items-center gap-1.5 px-3 pb-3"
        href={LUMA_PAST_CALENDAR_URL}
        target="_blank"
        rel="noreferrer"
      >
        See all past events on Luma
        <ArrowUpRightIcon />
      </Link>
    </div>
  );
}
