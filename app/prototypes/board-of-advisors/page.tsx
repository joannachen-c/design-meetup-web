import type { Metadata } from "next";

import HomePage from "@/components/HomePage";
import { loadHomePageData } from "@/lib/home-page-data";
import { BoardOfAdvisorsPrototype } from "@/prototypes/board-of-advisors/BoardOfAdvisorsPrototype";

export const metadata: Metadata = {
  title: "Board of Advisors — Prototype",
  robots: { index: false, follow: false },
};

// Always read fresh rows so edits made in Supabase show up on refresh.
export const dynamic = "force-dynamic";

export default async function BoardOfAdvisorsPrototypePage() {
  const { advisors, ...homePage } = await loadHomePageData();
  return (
    <HomePage
      {...homePage}
      advisorsSection={
        <BoardOfAdvisorsPrototype advisors={advisors.advisors} source={advisors.source} />
      }
    />
  );
}
