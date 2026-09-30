import type { Metadata } from "next";

import { fetchAdvisors } from "@/lib/advisors";
import { BoardOfAdvisorsPrototype } from "@/prototypes/board-of-advisors/BoardOfAdvisorsPrototype";

export const metadata: Metadata = {
  title: "Board of Advisors — Prototype",
  robots: { index: false, follow: false },
};

// Always read fresh rows so edits made in Supabase show up on refresh.
export const dynamic = "force-dynamic";

export default async function BoardOfAdvisorsPrototypePage() {
  const { advisors, source, error } = await fetchAdvisors();
  if (error) console.warn(`[advisors] using bundled data: ${error}`);
  return <BoardOfAdvisorsPrototype advisors={advisors} source={source} />;
}
