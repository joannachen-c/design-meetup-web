import { preload } from "react-dom";
import HomePage from "@/components/HomePage";
import { SiteJsonLd } from "@/components/SiteJsonLd";
import { firstPaintCoverImages, initialFocusIndex } from "@/lib/image";
import { fetchLumaCalendarEvents } from "@/lib/luma";
import { fetchPastEvents, type MeetupEvent } from "@/lib/supabase";

export const revalidate = 300;

function preloadFirstPaintCovers(events: MeetupEvent[]) {
  for (const cover of firstPaintCoverImages(
    events,
    initialFocusIndex(events.length),
  )) {
    preload(cover.src, {
      as: "image",
      fetchPriority: "high",
      ...(cover.srcSet ? { imageSrcSet: cover.srcSet } : {}),
    });
  }
}

export default async function Page() {
  // Run Supabase + Luma in parallel so a slow calendar feed doesn't block the
  // event shelf (and vice versa) on cold localhost loads.
  const [pastResult, upcomingEvents] = await Promise.all([
    fetchPastEvents()
      .then((events) => ({ events, error: null as string | null }))
      .catch((error: unknown) => ({
        events: [] as MeetupEvent[],
        error:
          error instanceof Error ? error.message : "Unable to load events.",
      })),
    fetchLumaCalendarEvents("future"),
  ]);

  // Start the visible covers before the client hydrates. The cards sit at
  // opacity 0 behind the loader, which otherwise makes the browser treat them
  // as low-priority and deal the shelf in empty.
  preloadFirstPaintCovers(pastResult.events);

  // The Luma embed can only render upcoming events, so when the calendar is
  // empty we show the recent past ones instead of Luma's empty card. Anything
  // other than a confirmed empty calendar — including a failed lookup — leaves
  // the embed in place.
  const recentEvents =
    upcomingEvents?.length === 0
      ? ((await fetchLumaCalendarEvents("past")) ?? [])
      : [];

  return (
    <>
      <SiteJsonLd />
      <HomePage
        initialEvents={pastResult.events}
        initialError={pastResult.error}
        recentEvents={recentEvents}
      />
    </>
  );
}
