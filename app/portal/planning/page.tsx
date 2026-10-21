import type { Metadata } from "next";
import { PLANNING_PIPELINE_URL } from "@/lib/organizers";
import { requireOrganizer } from "@/lib/portal-access";

export const metadata: Metadata = {
  title: "Planning",
  robots: { index: false, follow: false },
};

export default async function PortalPlanningPage() {
  await requireOrganizer("/portal/planning");
  return (
    <main className="flex w-full flex-1 flex-col px-[clamp(20px,6vw,96px)] pt-[clamp(16px,2vw,24px)] pb-[clamp(20px,6vw,96px)]">
      <h1 className="sr-only">Planning</h1>
      <iframe
        className="block min-h-[640px] w-full flex-1 rounded-[20px] border-0 bg-surface-muted"
        src={PLANNING_PIPELINE_URL}
        title="Design Meetup team pipeline"
      />
    </main>
  );
}
