"use client";

import type { Ref } from "react";

export function EventListRow({
  title,
  dateLabel,
  location,
  imageUrl,
  selected,
  onSelect,
  ref,
}: {
  title: string;
  dateLabel: string;
  location: string | null;
  imageUrl: string;
  selected: boolean;
  onSelect: () => void;
  ref?: Ref<HTMLButtonElement>;
}) {
  return (
    <button
      className="event-row w-full cursor-pointer rounded-[10px] border-0 bg-transparent py-3.5 pl-3 pr-5 text-left text-base text-body hover:bg-surface-muted aria-pressed:bg-surface-muted focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink"
      type="button"
      ref={ref}
      aria-pressed={selected}
      onClick={onSelect}
    >
      <span className="event-row-thumb block overflow-hidden rounded-md bg-surface-muted">
        <img
          className="block size-full select-none border-0 object-cover outline-none"
          src={imageUrl}
          alt=""
          loading="lazy"
          draggable="false"
        />
      </span>
      <span className="min-w-0">
        <span className="event-row-title block font-bold leading-6 text-black">
          {title}
        </span>
        {location ? (
          <span className="event-row-meta block leading-6 text-muted">
            {location}
          </span>
        ) : null}
      </span>
      <span className="event-row-date leading-6 text-subtle">{dateLabel}</span>
    </button>
  );
}
