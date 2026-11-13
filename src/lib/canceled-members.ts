import type { MembershipStatus, Tier } from "./membership";

export type CanceledMember = {
  email: string;
  name: string | null;
  tier: Tier;
  /** "canceled" once the subscription has ended, "scheduled" while it runs out the paid period. */
  state: "canceled" | "scheduled";
  /** When access ends (scheduled) or ended (canceled), if known. */
  endsAt: string | null;
  updatedAt: string;
};

export type MembershipRow = {
  email: string | null;
  name: string | null;
  tier: Tier;
  status: MembershipStatus;
  cancelAtPeriodEnd: boolean;
  currentPeriodEnd: string | null;
  updatedAt: string;
};

/** Members who canceled, or who will lose access at the end of the period, newest first. */
export function pickCanceledMembers(rows: MembershipRow[]): CanceledMember[] {
  return rows
    .flatMap((row): CanceledMember[] => {
      const email = row.email?.trim().toLowerCase();
      if (!email) return [];
      const canceled = row.status === "canceled";
      if (!canceled && !row.cancelAtPeriodEnd) return [];
      return [
        {
          email,
          name: row.name?.trim() || null,
          tier: row.tier,
          state: canceled ? "canceled" : "scheduled",
          endsAt: row.currentPeriodEnd,
          updatedAt: row.updatedAt,
        },
      ];
    })
    .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
}
