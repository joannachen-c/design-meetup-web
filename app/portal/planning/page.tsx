import type { Metadata } from "next";
import { ApproveMembersForm } from "@/components/portal/ApproveMembersForm";
import { CanceledMembersList } from "@/components/portal/CanceledMembersList";
import { PlanningBoard } from "@/components/portal/PlanningBoard";
import { listApprovedSignups } from "@/lib/approved-signups-store";
import { listCanceledMembers } from "@/lib/membership-service";
import { getColumnWidths, listPlanningItems } from "@/lib/planning-store";
import { requireOrganizer } from "@/lib/portal-access";

export const metadata: Metadata = {
  title: "Planning",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

export default async function PortalPlanningPage() {
  await requireOrganizer("/portal/planning");
  const [items, columnWidths, approved, canceled] = await Promise.all([
    listPlanningItems(),
    getColumnWidths(),
    listApprovedSignups(),
    listCanceledMembers(),
  ]);
  return (
    <PlanningBoard initialItems={items} initialColumnWidths={columnWidths}>
      <ApproveMembersForm initialApproved={approved} />
      <CanceledMembersList members={canceled} />
    </PlanningBoard>
  );
}
