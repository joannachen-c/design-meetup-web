import type { Metadata } from "next";
import { redirect } from "next/navigation";

export const metadata: Metadata = {
  title: "Membership",
  robots: { index: false, follow: false },
};

export default async function MembershipPage({
  searchParams,
}: {
  searchParams: Promise<{ mock_portal?: string }>;
}) {
  const params = await searchParams;
  const query = params.mock_portal ? "?mock_portal=1" : "";
  redirect(`/portal${query}`);
}
