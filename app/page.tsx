import HomePage from "@/components/HomePage";
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

  return (
    <HomePage initialEvents={initialEvents} initialError={initialError} />
  );
}
