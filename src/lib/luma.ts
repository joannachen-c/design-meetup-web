// The Luma calendar embed only ever renders upcoming events — when the calendar
// is empty it shows its own "No Upcoming Events" card. luma.com/designmeetup
// falls back to the past events list instead, so we read the same public
// calendar feed the Luma site uses and render that fallback ourselves.
const LUMA_CALENDAR_API_ID = "cal-HH5XBdHyWPt0yhB";
const LUMA_ITEMS_ENDPOINT = "https://api.lu.ma/calendar/get-items";

export type LumaEvent = {
  id: string;
  name: string;
  url: string;
  coverUrl: string | null;
  startAt: string;
  dateLabel: string;
  location: string | null;
  hosts: string | null;
};

type LumaApiEntry = {
  event?: {
    api_id?: string;
    name?: string;
    url?: string;
    cover_url?: string | null;
    start_at?: string;
    timezone?: string | null;
    location_type?: string | null;
    geo_address_info?: {
      city_state?: string | null;
      city?: string | null;
      region?: string | null;
      country?: string | null;
    } | null;
  } | null;
  hosts?: Array<{ name?: string | null }> | null;
};

function formatDateLabel(startAt: string, timezone: string | null | undefined) {
  const date = new Date(startAt);
  if (Number.isNaN(date.getTime())) {
    return "";
  }

  try {
    return new Intl.DateTimeFormat("en-US", {
      month: "long",
      day: "numeric",
      year: "numeric",
      timeZone: timezone ?? "UTC",
    }).format(date);
  } catch {
    return new Intl.DateTimeFormat("en-US", {
      month: "long",
      day: "numeric",
      year: "numeric",
      timeZone: "UTC",
    }).format(date);
  }
}

function formatLocation(event: NonNullable<LumaApiEntry["event"]>) {
  if (event.location_type === "online" || event.location_type === "virtual") {
    return "Online";
  }

  const geo = event.geo_address_info;
  return geo?.city_state ?? geo?.city ?? geo?.region ?? null;
}

function formatHosts(hosts: LumaApiEntry["hosts"]) {
  const names = (hosts ?? [])
    .map((host) => host?.name?.trim())
    .filter((name): name is string => Boolean(name));

  if (names.length === 0) return null;
  if (names.length === 1) return names[0];
  return `${names.slice(0, -1).join(", ")} & ${names[names.length - 1]}`;
}

function normalize(entry: LumaApiEntry): LumaEvent | null {
  const event = entry.event;
  if (!event?.api_id || !event.name || !event.url || !event.start_at) {
    return null;
  }

  return {
    id: event.api_id,
    name: event.name,
    url: `https://luma.com/${event.url}`,
    coverUrl: event.cover_url ?? null,
    startAt: event.start_at,
    dateLabel: formatDateLabel(event.start_at, event.timezone),
    location: formatLocation(event),
    hosts: formatHosts(entry.hosts),
  };
}

// Never throws. Returns null when Luma could not be reached, which is different
// from an empty list: only a confirmed empty calendar should replace the embed.
export async function fetchLumaCalendarEvents(
  period: "future" | "past",
  limit = 4,
): Promise<LumaEvent[] | null> {
  const params = new URLSearchParams({
    calendar_api_id: LUMA_CALENDAR_API_ID,
    period,
    pagination_limit: String(limit),
  });

  try {
    const response = await fetch(`${LUMA_ITEMS_ENDPOINT}?${params}`, {
      headers: { accept: "application/json" },
      next: { revalidate: 300 },
      signal: AbortSignal.timeout(8_000),
    });

    if (!response.ok) return null;

    const payload = (await response.json()) as { entries?: LumaApiEntry[] };
    return (payload.entries ?? [])
      .map(normalize)
      .filter((event): event is LumaEvent => event !== null)
      .slice(0, limit);
  } catch {
    return null;
  }
}
