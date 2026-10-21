import type { Metadata } from "next";
import { PlanningBoard } from "@/components/portal/PlanningBoard";
import { getColumnWidths, listPlanningItems } from "@/lib/planning-store";
import { requireOrganizer } from "@/lib/portal-access";

export const metadata: Metadata = {
  title: "Planning",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

export default async function PortalPlanningPage() {
  await requireOrganizer("/portal/planning");
  const [items, columnWidths] = await Promise.all([listPlanningItems(), getColumnWidths()]);
  return <PlanningBoard initialItems={items} initialColumnWidths={columnWidths} />;
}
