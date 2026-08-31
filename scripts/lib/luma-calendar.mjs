/**
 * Read the public Design Meetup Luma calendar and reconcile it against
 * scripts/data/past-events.json.
 *
 * past-events.json is the curated source of truth that seed:events pushes to
 * Supabase, and it has always been hand-maintained: nothing noticed when an
 * event was added to Luma but never written down. These helpers do the
 * comparison. They are deliberately pure so the merge rules can be tested
 * without hitting the network.
 */

const CALENDAR_API_ID = "cal-HH5XBdHyWPt0yhB";
const ITEMS_ENDPOINT = "https://api.lu.ma/calendar/get-items";

// Luma serves covers through Cloudflare Images. The feed hands back the raw
// upload path; the seed data stores the transformed URL because src/lib/image.ts
// rewrites that segment to ask for a smaller render.
const COVER_TRANSFORM =
  "format=auto,fit=cover,dpr=2,anim=false,background=white,quality=85,width=1200,height=1200";
const LUMA_IMAGE_HOST = "https://images.lumacdn.com/";

export function coverImageUrl(coverUrl) {
  if (!coverUrl) return null;
  if (coverUrl.includes("/cdn-cgi/image/")) return coverUrl;
  if (!coverUrl.startsWith(LUMA_IMAGE_HOST)) return coverUrl;
  const objectPath = coverUrl.slice(LUMA_IMAGE_HOST.length);
  return `${LUMA_IMAGE_HOST}cdn-cgi/image/${COVER_TRANSFORM}/${objectPath}`;
}

export function formatDateLabel(startAt, timezone) {
  const date = new Date(startAt);
  if (Number.isNaN(date.getTime())) return "";
  const format = (timeZone) =>
    new Intl.DateTimeFormat("en-US", {
      month: "long",
      day: "numeric",
      year: "numeric",
      timeZone,
    }).format(date);
  try {
    return format(timezone ?? "UTC");
  } catch {
    return format("UTC");
  }
}

export function formatHosts(hosts) {
  const names = (hosts ?? [])
    .map((host) => host?.name?.trim())
    .filter((name) => Boolean(name));
  if (names.length === 0) return null;
  if (names.length === 1) return names[0];
  return `${names.slice(0, -1).join(", ")} & ${names[names.length - 1]}`;
}

export function formatLocation(event) {
  if (event.location_type === "online" || event.location_type === "virtual") {
    return "Online";
  }
  const geo = event.geo_address_info;
  return geo?.city_state ?? geo?.city ?? geo?.region ?? null;
}

/** Flatten a calendar entry into the shape past-events.json stores. */
export function normalizeCalendarEntry(entry) {
  const event = entry?.event;
  if (!event?.api_id || !event.name || !event.url || !event.start_at) return null;

  return {
    luma_event_id: event.api_id,
    luma_url: `https://luma.com/${event.url}`,
    title: event.name,
    date_label: formatDateLabel(event.start_at, event.timezone),
    starts_at: event.start_at,
    ends_at: event.end_at ?? null,
    timezone: event.timezone ?? null,
    location: formatLocation(event),
    hosts: formatHosts(entry.hosts),
    image_url: coverImageUrl(event.cover_url),
    guest_count: entry.guest_count ?? 0,
  };
}

export async function fetchCalendarEvents(period, { fetchImpl = fetch } = {}) {
  const params = new URLSearchParams({
    calendar_api_id: CALENDAR_API_ID,
    period,
    pagination_limit: "200",
  });

  const response = await fetchImpl(`${ITEMS_ENDPOINT}?${params}`, {
    headers: { accept: "application/json" },
  });
  if (!response.ok) {
    throw new Error(`Luma calendar returned ${response.status} for ${period}`);
  }

  const payload = await response.json();
  return (payload.entries ?? [])
    .map(normalizeCalendarEntry)
    .filter((event) => event !== null);
}

export function hasEnded(event, now = new Date()) {
  const end = event.ends_at || event.starts_at;
  const endMs = new Date(end).getTime();
  return Number.isFinite(endMs) && endMs < now.getTime();
}

/**
 * Fields Luma owns outright, so a mismatch means the seed data is stale.
 * Everything else (guest_count, hand-written locations, checked-in cover
 * overrides) is curated here and is left alone.
 */
const TRACKED_FIELDS = ["title", "luma_url", "starts_at", "ends_at", "timezone"];

export function diffCalendar(existingEvents, calendarEvents, now = new Date()) {
  const known = new Map(
    existingEvents.map((event) => [event.luma_event_id, event]),
  );
  const feed = new Map(
    calendarEvents.map((event) => [event.luma_event_id, event]),
  );

  const missingPast = [];
  const upcoming = [];
  const drift = [];

  for (const event of calendarEvents) {
    const local = known.get(event.luma_event_id);
    if (!local) {
      (hasEnded(event, now) ? missingPast : upcoming).push(event);
      continue;
    }
    const changes = TRACKED_FIELDS.flatMap((field) =>
      local[field] === event[field]
        ? []
        : [{ field, local: local[field], luma: event[field] }],
    );
    if (changes.length > 0) {
      drift.push({ luma_event_id: event.luma_event_id, title: local.title, changes });
    }
  }

  const localOnly = existingEvents.filter(
    (event) => !feed.has(event.luma_event_id),
  );

  return { missingPast, upcoming, localOnly, drift };
}

/**
 * Newest first, renumbered. Same-day events keep the order they already had so
 * adding one event never reshuffles a pair the curator arranged by hand.
 */
export function sortEvents(events) {
  return events
    .map((event, index) => ({ event, index }))
    .sort((a, b) => {
      const delta =
        new Date(b.event.starts_at).getTime() -
        new Date(a.event.starts_at).getTime();
      return delta !== 0 ? delta : a.index - b.index;
    })
    .map(({ event }, sortOrder) => ({ ...event, sort_order: sortOrder }));
}
