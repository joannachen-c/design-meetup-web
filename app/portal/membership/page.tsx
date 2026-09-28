import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { requirePaidMembership } from "@/lib/portal-access";

export const metadata: Metadata = {
  title: "Membership",
  robots: { index: false, follow: false },
};

export default async function MembershipPage() {
  await requirePaidMembership("/portal/membership");
  redirect("/portal");
}
