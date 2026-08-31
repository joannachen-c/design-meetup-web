import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

import {
  coverImageUrl,
  diffCalendar,
  formatHosts,
  normalizeCalendarEntry,
  sortEvents,
} from "../scripts/lib/luma-calendar.mjs";

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const packageJson = JSON.parse(
  await readFile(path.join(root, "package.json"), "utf8"),
);
const events = JSON.parse(
  await readFile(path.join(root, "scripts/data/past-events.json"), "utf8"),
);

const entry = {
  event: {
    api_id: "evt-kqU17RuLWahwfVk",
    name: "SF Make-a-thon",
    url: "b0l7tzxd",
    cover_url:
      "https://images.lumacdn.com/uploads/nm/128f62c6-2e38-41a4-b906-d704d364f29b.jpg",
    start_at: "2026-07-31T00:30:00.000Z",
    end_at: "2026-07-31T05:00:00.000Z",
    timezone: "America/Los_Angeles",
    location_type: "offline",
    geo_address_info: { city_state: "San Francisco, CA", city: "San Francisco" },
  },
  hosts: [{ name: "Ilyssa Yan" }, { name: null }, { name: "Joanna Chen" }],
  guest_count: 0,
};

test("sync:luma is wired to the reconciliation script", () => {
  assert.equal(packageJson.scripts["sync:luma"], "node scripts/sync-luma-events.mjs");
});

test("a calendar entry normalizes into the past-events.json shape", () => {
  const event = normalizeCalendarEntry(entry);
  assert.deepEqual(event, {
    luma_event_id: "evt-kqU17RuLWahwfVk",
    luma_url: "https://luma.com/b0l7tzxd",
    title: "SF Make-a-thon",
    // Local time, so a 00:30 UTC start is still the previous evening in SF.
    date_label: "July 30, 2026",
    starts_at: "2026-07-31T00:30:00.000Z",
    ends_at: "2026-07-31T05:00:00.000Z",
    timezone: "America/Los_Angeles",
    location: "San Francisco, CA",
    hosts: "Ilyssa Yan & Joanna Chen",
    image_url:
      "https://images.lumacdn.com/cdn-cgi/image/format=auto,fit=cover,dpr=2,anim=false,background=white,quality=85,width=1200,height=1200/uploads/nm/128f62c6-2e38-41a4-b906-d704d364f29b.jpg",
    guest_count: 0,
  });
});

test("cover URLs get the transform segment src/lib/image.ts rewrites", () => {
  assert.match(
    coverImageUrl("https://images.lumacdn.com/uploads/nm/cover.jpg"),
    /\/cdn-cgi\/image\/[^/]*width=1200[^/]*\/uploads\/nm\/cover\.jpg$/,
  );
  const alreadyTransformed =
    "https://images.lumacdn.com/cdn-cgi/image/width=1200/uploads/nm/cover.jpg";
  assert.equal(coverImageUrl(alreadyTransformed), alreadyTransformed);
  assert.equal(coverImageUrl(null), null);
});

test("hosts without a name are dropped rather than joined as blanks", () => {
  assert.equal(formatHosts([{ name: "Ilyssa Yan" }]), "Ilyssa Yan");
  assert.equal(formatHosts([{ name: null }, { name: "" }]), null);
  assert.equal(formatHosts([]), null);
});

test("the diff separates past gaps, upcoming events, and local-only events", () => {
  const now = new Date("2026-08-31T00:00:00.000Z");
  const past = normalizeCalendarEntry(entry);
  const future = { ...past, luma_event_id: "evt-future", starts_at: "2026-09-06T14:30:00.000Z", ends_at: null };
  const localOnly = {
    luma_event_id: "evt-gone",
    title: "Pulled from the calendar",
    starts_at: "2026-06-14T17:00:00.000Z",
  };

  const diff = diffCalendar([localOnly], [past, future], now);

  assert.deepEqual(
    diff.missingPast.map((event) => event.luma_event_id),
    ["evt-kqU17RuLWahwfVk"],
  );
  assert.deepEqual(
    diff.upcoming.map((event) => event.luma_event_id),
    ["evt-future"],
  );
  assert.deepEqual(
    diff.localOnly.map((event) => event.luma_event_id),
    ["evt-gone"],
  );
  assert.deepEqual(diff.drift, []);
});

test("drift on Luma-owned fields is reported, never silently applied", () => {
  const luma = normalizeCalendarEntry(entry);
  const stale = { ...luma, title: "Old name" };

  const { drift, missingPast } = diffCalendar([stale], [luma], new Date("2026-08-31T00:00:00.000Z"));

  assert.deepEqual(missingPast, []);
  assert.equal(drift.length, 1);
  assert.deepEqual(drift[0].changes, [
    { field: "title", local: "Old name", luma: "SF Make-a-thon" },
  ]);
});

test("sorting is newest first and keeps the curated order of same-day events", () => {
  const sorted = sortEvents([
    { luma_event_id: "b", starts_at: "2026-06-06T20:00:00.000Z" },
    { luma_event_id: "c", starts_at: "2026-06-06T20:00:00.000Z" },
    { luma_event_id: "a", starts_at: "2026-08-09T19:00:00.000Z" },
  ]);

  assert.deepEqual(
    sorted.map((event) => [event.luma_event_id, event.sort_order]),
    [
      ["a", 0],
      ["b", 1],
      ["c", 2],
    ],
  );
});

test("every event on the Luma calendar is in past-events.json", () => {
  // Guards the gap sync:luma was written to close: SF Make-a-thon ran but was
  // never added, so it silently never appeared on the past-events shelf.
  const ids = new Set(events.map((event) => event.luma_event_id));
  assert.ok(ids.has("evt-kqU17RuLWahwfVk"));
  assert.equal(ids.size, events.length);
});

test("seeded events stay newest first with contiguous sort_order", () => {
  events.forEach((event, index) => {
    assert.equal(event.sort_order, index, `${event.title} sort_order`);
    if (index === 0) return;
    assert.ok(
      new Date(events[index - 1].starts_at).getTime() >=
        new Date(event.starts_at).getTime(),
      `${event.title} is out of date order`,
    );
  });
});
