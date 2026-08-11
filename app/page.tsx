import HomePage from "@/components/HomePage";
import { SiteJsonLd } from "@/components/SiteJsonLd";
import { fetchLumaCalendarEvents } from "@/lib/luma";
import { fetchPastEvents, type MeetupEvent } from "@/lib/supabase";

export const revalidate = 300;

export default async function Page() {
  let initialEvents: MeetupEvent[] = [];
  let initialError: string | null = null;

  try {
    initialEvents = await fetchPastEvents();
  } catch (error: unknown) {
    initialError =
      error instanceof Error ? error.message : "Unable to load events.";
  }

  // The Luma embed can only render upcoming events, so when the calendar is
  // empty we show the recent past ones instead of Luma's empty card. Anything
  // other than a confirmed empty calendar — including a failed lookup — leaves
  // the embed in place.
  const upcomingEvents = await fetchLumaCalendarEvents("future");
  const recentEvents =
    upcomingEvents?.length === 0
      ? ((await fetchLumaCalendarEvents("past")) ?? [])
      : [];

  return (
    <>
      <SiteJsonLd />
      <HomePage
        initialEvents={initialEvents}
        initialError={initialError}
        recentEvents={recentEvents}
      />
    </>
  );
}
