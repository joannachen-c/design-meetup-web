// The Luma calendar embed only ever renders upcoming events — when the calendar
// is empty it shows its own "No Upcoming Events" card. luma.com/designmeetup
// falls back to the past events list instead, so we check the calendar's public
// iCal feed for anything upcoming and render that fallback ourselves. The JSON
// feed the Luma site uses rate-limits server requests; the iCal feed is meant
// for calendar apps and serves them.
const LUMA_ICS_URL =
  "https://api.lu.ma/ics/get?entity=calendar&id=cal-HH5XBdHyWPt0yhB";

const LUMA_INVITE_CODE = "ilyssayan";
const LUMA_HOSTS = new Set(["luma.com", "www.luma.com", "lu.ma", "www.lu.ma"]);

// Every outbound Luma link carries our invite code so RSVPs are attributed.
export function withLumaInvite(url: string): string {
  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    return url;
  }
  if (!LUMA_HOSTS.has(parsed.hostname.toLowerCase())) return url;
  parsed.searchParams.set("invite", LUMA_INVITE_CODE);
  return parsed.toString();
}

// Event links are usually Luma, but some events are hosted on Partiful.
export function eventLinkPlatform(url: string): "Luma" | "Partiful" {
  try {
    const host = new URL(url).hostname.toLowerCase();
    if (host === "partiful.com" || host.endsWith(".partiful.com")) {
      return "Partiful";
    }
  } catch {}
  return "Luma";
}

export function withLumaInviteInHtml(html: string): string {
  return html.replace(
    /href="(https?:\/\/(?:www\.)?(?:luma\.com|lu\.ma)\/[^"]*)"/gi,
    (_match, href: string) => {
      const decoded = href.replace(/&amp;/g, "&");
      return `href="${withLumaInvite(decoded).replace(/&/g, "&amp;")}"`;
    },
  );
}

export const LUMA_PROFILE_URL = withLumaInvite("https://luma.com/designmeetup");
export const LUMA_PAST_EVENTS_URL = withLumaInvite(
  "https://luma.com/designmeetup?period=past",
);
export const LUMA_CALENDAR_EMBED_SRC =
  "https://luma.com/embed/calendar/cal-HH5XBdHyWPt0yhB/events?lt=light";

// iCal timestamps look like 20261025T210000Z. Luma always writes UTC.
function parseIcsTimestamp(value: string): number {
  const match = /^(\d{4})(\d{2})(\d{2})(?:T(\d{2})(\d{2})(\d{2})Z?)?$/.exec(
    value.trim(),
  );
  if (!match) return Number.NaN;
  const [, y, mo, d, h = "0", mi = "0", se = "0"] = match;
  return Date.UTC(+y, +mo - 1, +d, +h, +mi, +se);
}

// An event counts until it ends, matching the embed, which keeps listing an
// event while it is happening.
export function icsHasUpcomingEvent(ics: string, now = Date.now()): boolean {
  return ics
    .split("BEGIN:VEVENT")
    .slice(1)
    .some((block) => {
      const field = (name: string) =>
        new RegExp(`^${name}(?:;[^:\\r\\n]*)?:(.+)$`, "m").exec(block)?.[1];
      const end = parseIcsTimestamp(field("DTEND") ?? field("DTSTART") ?? "");
      return end > now;
    });
}

// Never throws. Returns null when Luma could not be reached, which is different
// from false: only a confirmed empty calendar should replace the embed.
export async function fetchLumaHasUpcomingEvents(): Promise<boolean | null> {
  try {
    const response = await fetch(LUMA_ICS_URL, {
      next: { revalidate: 300 },
      signal: AbortSignal.timeout(8_000),
    });

    if (!response.ok) return null;

    const ics = await response.text();
    if (!ics.includes("BEGIN:VCALENDAR")) return null;
    return icsHasUpcomingEvent(ics);
  } catch {
    return null;
  }
}
