import type { Metadata } from "next";
import { redirect } from "next/navigation";

export const metadata: Metadata = {
  title: "Membership",
  robots: { index: false, follow: false },
};

export default function MembershipPage() {
  redirect("/portal");
}
