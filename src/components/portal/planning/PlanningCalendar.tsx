"use client";

import { useEffect, useMemo, useState } from "react";
import type { PlanningItem } from "@/lib/planning";
import { ISO_DATE, locationColor } from "./model";
import { ChevronIcon } from "./ui";

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const MAX_PER_DAY = 3;
const AGENDA_LENGTH = 12;

function isoDay(date: Date) {
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${date.getFullYear()}-${month}-${day}`;
}

function currentMonth() {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), 1);
}

function shortDate(iso: string) {
  return new Date(`${iso}T12:00:00`).toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
}

const DRAG_TYPE = "application/x-planning-item";

// A div rather than a <button>: Firefox won't start a drag from a button.
function Entry({
  item,
  onOpen,
  draggable = false,
  dragging = false,
  onDragStart,
  onDragEnd,
}: {
  item: PlanningItem;
  onOpen: (id: string) => void;
  draggable?: boolean;
  dragging?: boolean;
  onDragStart?: () => void;
  onDragEnd?: () => void;
}) {
  return (
    <div
      role="button"
      tabIndex={0}
      draggable={draggable}
      title={`${item.company}${item.location ? ` · ${item.location}` : ""}${draggable ? " — drag to another day to move" : ""}`}
      aria-label={`${item.company}, ${shortDate(item.deadline)}${item.location ? `, ${item.location}` : ""}`}
      onClick={() => onOpen(item.id)}
      onKeyDown={(event) => {
        if (event.key !== "Enter" && event.key !== " ") return;
        event.preventDefault();
        onOpen(item.id);
      }}
      onDragStart={(event) => {
        event.dataTransfer.setData(DRAG_TYPE, item.id);
        event.dataTransfer.effectAllowed = "move";
        onDragStart?.();
      }}
      onDragEnd={onDragEnd}
      style={locationColor(item.location)}
      className={`block h-5 w-full min-w-0 truncate rounded-[4px] px-1.5 text-left text-xs leading-5 select-none hover:brightness-95 focus-visible:outline-2 focus-visible:outline-ink ${
        draggable ? "cursor-grab active:cursor-grabbing" : "cursor-pointer"
      } ${dragging ? "opacity-40" : ""}`}
    >
      {item.company}
    </div>
  );
}

/** Dated items on a month grid, colored by city like the location tags. */
export function PlanningCalendar({
  items,
  onOpen,
  onMove,
}: {
  items: PlanningItem[];
  onOpen: (id: string) => void;
  onMove: (id: string, day: string) => void;
}) {
  // "Today" depends on the viewer's timezone, so the grid renders only on the client.
  const [today, setToday] = useState<string | null>(null);
  const [month, setMonth] = useState<Date | null>(null);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [dropDay, setDropDay] = useState<string | null>(null);
  const endDrag = () => {
    setDraggingId(null);
    setDropDay(null);
  };

  useEffect(() => {
    setToday(isoDay(new Date()));
    setMonth(currentMonth());
  }, []);

  const byDay = useMemo(() => {
    const days = new Map<string, PlanningItem[]>();
    for (const item of items) {
      if (item.status === "done" || !ISO_DATE.test(item.deadline)) continue;
      days.set(item.deadline, [...(days.get(item.deadline) ?? []), item]);
    }
    return days;
  }, [items]);

  if (!today || !month) {
    return <div aria-hidden className="h-[520px] rounded-[12px] bg-surface-muted max-[640px]:h-48" />;
  }

  const lead = month.getDay();
  const daysInMonth = new Date(month.getFullYear(), month.getMonth() + 1, 0).getDate();
  const cellCount = Math.ceil((lead + daysInMonth) / 7) * 7;
  const cells = Array.from(
    { length: cellCount },
    (_, index) => new Date(month.getFullYear(), month.getMonth(), index - lead + 1),
  );
  const monthKey = isoDay(month).slice(0, 7);
  const monthLocations = [
    ...new Set(
      [...byDay.entries()].filter(([day]) => day.startsWith(monthKey)).flatMap(([, entries]) => entries.map((item) => item.location)),
    ),
  ].sort((a, b) => (!a ? 1 : !b ? -1 : a.localeCompare(b)));
  const upcoming = [...byDay.keys()]
    .filter((day) => day >= today)
    .sort()
    .flatMap((day) => byDay.get(day)!.map((item) => ({ day, item })))
    .slice(0, AGENDA_LENGTH);
  const showMonth = (next: (current: Date) => Date) => {
    setExpanded(null);
    setMonth((current) => next(current ?? currentMonth()));
  };
  const shiftMonth = (delta: number) =>
    showMonth((current) => new Date(current.getFullYear(), current.getMonth() + delta, 1));
  const navButton =
    "grid size-8 cursor-pointer place-items-center rounded-[7px] border-0 bg-transparent text-muted hover:bg-surface-muted hover:text-ink";

  return (
    <section aria-labelledby="planning-calendar-title">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-1">
          <h2 id="planning-calendar-title" className="m-0 mr-2 text-xl font-bold tracking-[-0.04em]">
            <span className="max-[640px]:hidden">
              {month.toLocaleDateString("en-US", { month: "long", year: "numeric" })}
            </span>
            <span className="min-[641px]:hidden">Coming up</span>
          </h2>
          <span className="flex items-center max-[640px]:hidden">
            <button type="button" aria-label="Previous month" onClick={() => shiftMonth(-1)} className={navButton}>
              <ChevronIcon open={false} className="size-3.5 rotate-180" />
            </button>
            <button
              type="button"
              onClick={() => showMonth(currentMonth)}
              className="h-8 cursor-pointer rounded-[7px] border-0 bg-transparent px-2.5 font-[inherit] text-sm text-muted hover:bg-surface-muted hover:text-ink"
            >
              Today
            </button>
            <button type="button" aria-label="Next month" onClick={() => shiftMonth(1)} className={navButton}>
              <ChevronIcon open={false} className="size-3.5" />
            </button>
          </span>
        </div>
        {monthLocations.length ? (
          <ul aria-label="City colors" className="m-0 flex list-none flex-wrap gap-1.5 p-0 max-[640px]:hidden">
            {monthLocations.map((location) => (
              <li
                key={location || "none"}
                style={locationColor(location)}
                className="inline-flex h-5 items-center rounded-[4px] px-1.5 text-xs"
              >
                {location || "No location"}
              </li>
            ))}
          </ul>
        ) : null}
      </div>

      <div
        className="mt-3 grid grid-cols-7 gap-px overflow-hidden rounded-[12px] bg-black/[0.07] ring-1 ring-black/[0.07] max-[640px]:hidden"
      >
        {WEEKDAYS.map((day) => (
          <div key={day} aria-hidden className="bg-surface px-2 py-1.5 text-xs text-muted">
            {day}
          </div>
        ))}
        {cells.map((date) => {
          const day = isoDay(date);
          const entries = byDay.get(day) ?? [];
          const inMonth = date.getMonth() === month.getMonth();
          const isToday = day === today;
          const shown = expanded === day ? entries : entries.slice(0, MAX_PER_DAY);
          return (
            <div
              key={day}
              onDragOver={(event) => {
                if (!event.dataTransfer.types.includes(DRAG_TYPE)) return;
                event.preventDefault();
                event.dataTransfer.dropEffect = "move";
                if (dropDay !== day) setDropDay(day);
              }}
              onDragLeave={(event) => {
                if (event.currentTarget.contains(event.relatedTarget as Node | null)) return;
                setDropDay((current) => (current === day ? null : current));
              }}
              onDrop={(event) => {
                event.preventDefault();
                const id = event.dataTransfer.getData(DRAG_TYPE);
                endDrag();
                const moved = items.find((item) => item.id === id);
                if (moved && moved.deadline !== day) onMove(id, day);
              }}
              className={`grid min-h-24 content-start gap-1 p-1.5 transition-colors ${
                dropDay === day
                  ? "bg-[#fdfde8] shadow-[inset_0_0_0_1.5px_var(--color-ink)]"
                  : inMonth
                    ? "bg-surface"
                    : "bg-[oklch(98.4%_0.003_264.542)]"
              }`}
            >
              <span
                aria-hidden
                className={`grid size-6 place-items-center rounded-full text-xs ${
                  isToday ? "bg-accent-primary font-bold text-ink" : inMonth && day >= today ? "text-ink" : "text-subtle"
                }`}
              >
                {date.getDate()}
              </span>
              {shown.map((item) => (
                <Entry
                  key={item.id}
                  item={item}
                  onOpen={onOpen}
                  draggable
                  dragging={draggingId === item.id}
                  onDragStart={() => setDraggingId(item.id)}
                  onDragEnd={endDrag}
                />
              ))}
              {entries.length > shown.length ? (
                <button
                  type="button"
                  onClick={() => setExpanded(day)}
                  className="h-5 cursor-pointer rounded-[4px] border-0 bg-transparent px-1.5 text-left font-[inherit] text-xs text-muted hover:bg-surface-muted hover:text-ink"
                >
                  +{entries.length - shown.length} more
                </button>
              ) : null}
            </div>
          );
        })}
      </div>

      <ol className="m-0 mt-3 grid list-none gap-1 p-0 min-[641px]:hidden">
        {upcoming.length ? (
          upcoming.map(({ day, item }) => (
            <li key={item.id} className="grid grid-cols-[88px_minmax(0,1fr)] items-center gap-2">
              <span className={`text-xs ${day === today ? "font-bold text-ink" : "text-muted"}`}>{shortDate(day)}</span>
              <Entry item={item} onOpen={onOpen} />
            </li>
          ))
        ) : (
          <li className="text-sm text-muted">Nothing dated coming up.</li>
        )}
      </ol>
    </section>
  );
}
