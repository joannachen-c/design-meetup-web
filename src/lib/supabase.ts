import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import summaryHtmlByEventId from "../data/event-summaries.json";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

export const supabaseConfigured = Boolean(url && anonKey);

export const supabase: SupabaseClient | null = supabaseConfigured
  ? createClient(url!, anonKey!)
  : null;

const HIDDEN_EVENT_IDS = new Set(["evt-QuvB1PVOsKysNp7"]);

export type EventGalleryImage = {
  id: string;
  image_url: string;
  sort_order: number;
};

export type Sponsor = {
  id: string;
  slug: string;
  name: string;
  logo_url: string | null;
  website_url: string | null;
};

export type EventSponsor = {
  sort_order: number;
  sponsor: Sponsor;
};

export type MeetupEvent = {
  id: string;
  luma_event_id: string;
  luma_url: string | null;
  title: string;
  date_label: string;
  starts_at: string;
  ends_at: string | null;
  timezone: string | null;
  location: string | null;
  hosts: string | null;
  summary: string | null;
  summary_html: string | null;
  image_url: string;
  guest_count: number | null;
  sort_order: number;
  gallery_images: EventGalleryImage[];
  event_sponsors: EventSponsor[];
};

type MeetupEventRow = Omit<MeetupEvent, "gallery_images" | "event_sponsors"> & {
  gallery_images?: EventGalleryImage[] | null;
  event_sponsors?: EventSponsor[] | null;
};

const bundledSummaryHtml = summaryHtmlByEventId as Record<string, string>;

// Rich summaries are scraped from Luma into the repo, then pushed to Supabase.
// Until the summary_html column exists in every environment, fall back to the
// bundled copy so headings, bold, and links still render.
function fallbackSummaryHtml(event: MeetupEventRow) {
  return bundledSummaryHtml[event.luma_event_id] ?? null;
}

export async function fetchPastEvents(): Promise<MeetupEvent[]> {
  if (!supabase) {
    throw new Error(
      "Add NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY to .env.local.",
    );
  }

  const gallerySelect =
    "gallery_images:event_gallery_images(id, image_url, sort_order)";
  const sponsorSelect =
    "event_sponsors:event_sponsors(sort_order, sponsor:sponsors(id, slug, name, logo_url, website_url))";
  const richSelect =
    "id, luma_event_id, luma_url, title, date_label, starts_at, ends_at, timezone, location, hosts, summary, summary_html, image_url, guest_count, sort_order";
  const plainSelect =
    "id, luma_event_id, luma_url, title, date_label, starts_at, ends_at, timezone, location, hosts, summary, image_url, guest_count, sort_order";

  let { data, error } = await supabase
    .from("events")
    .select(`${richSelect}, ${gallerySelect}, ${sponsorSelect}`)
    .order("sort_order", { ascending: true });

  if (error && /summary_html/i.test(error.message)) {
    const withoutHtml = await supabase
      .from("events")
      .select(`${plainSelect}, ${gallerySelect}, ${sponsorSelect}`)
      .order("sort_order", { ascending: true });
    data = withoutHtml.data as typeof data;
    error = withoutHtml.error;
  }

  if (error && /event_sponsors|sponsors/i.test(error.message)) {
    const fallback = await supabase
      .from("events")
      .select(`${richSelect}, ${gallerySelect}`)
      .order("sort_order", { ascending: true });
    if (fallback.error && /summary_html/i.test(fallback.error.message)) {
      const plainFallback = await supabase
        .from("events")
        .select(`${plainSelect}, ${gallerySelect}`)
        .order("sort_order", { ascending: true });
      data = plainFallback.data as typeof data;
      error = plainFallback.error;
    } else {
      data = fallback.data as typeof data;
      error = fallback.error;
    }
  }

  if (error) {
    throw error;
  }

  return ((data as unknown as MeetupEventRow[] | null) ?? [])
    .filter((event) => !HIDDEN_EVENT_IDS.has(event.luma_event_id))
    .map((event) => ({
      ...event,
      summary_html: event.summary_html ?? fallbackSummaryHtml(event),
      gallery_images: [...(event.gallery_images ?? [])].sort(
        (a, b) => a.sort_order - b.sort_order,
      ),
      event_sponsors: [...(event.event_sponsors ?? [])].sort(
        (a, b) => a.sort_order - b.sort_order,
      ),
    }));
}
