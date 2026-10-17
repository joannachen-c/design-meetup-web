import { preload } from "react-dom";

import { fetchAdvisors, type AdvisorsResult } from "./advisors";
import { firstPaintCoverImages, initialFocusIndex } from "./image";
import { fetchLumaCalendarEvents, type LumaEvent } from "./luma";
import { fetchPastEvents, type MeetupEvent } from "./supabase";

export type HomePageData = {
  initialEvents: MeetupEvent[];
  initialError: string | null;
  recentEvents: LumaEvent[];
  advisors: AdvisorsResult;
};

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

export async function loadHomePageData(): Promise<HomePageData> {
  // Run Supabase + Luma in parallel so a slow calendar feed doesn't block the
  // event shelf (and vice versa) on cold localhost loads.
  const [pastResult, upcomingEvents, advisors] = await Promise.all([
    fetchPastEvents()
      .then((events) => ({ events, error: null as string | null }))
      .catch((error: unknown) => ({
        events: [] as MeetupEvent[],
        error:
          error instanceof Error ? error.message : "Unable to load events.",
      })),
    fetchLumaCalendarEvents("future"),
    fetchAdvisors(),
  ]);
  if (advisors.error) console.warn(`[advisors] using bundled data: ${advisors.error}`);

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

  return {
    initialEvents: pastResult.events,
    initialError: pastResult.error,
    recentEvents,
    advisors,
  };
}
