/** Server-only. Which founding cohort a member's email belongs to. */

import { isDirectorySheetEmail } from "./comp-membership.ts";
import { isApprovedSignupEmail } from "./signup-allowlist.ts";

export type Cohort = 0 | 1;

/** Slack's free plan has no join dates, so each cohort's card shows the month the cohort started. */
export const COHORT_0_JOINED_AT = "2026-03-01T00:00:00.000Z";
export const COHORT_1_JOINED_AT = "2026-09-01T00:00:00.000Z";

export function cohortJoinedAt(cohort: Cohort | null): string | null {
  if (cohort === 0) return COHORT_0_JOINED_AT;
  if (cohort === 1) return COHORT_1_JOINED_AT;
  return null;
}

/** Cohort 0 is the member directory sheet; cohort 1 is the rest of the signup allowlist. */
export function cohortForEmail(email: string | null | undefined): Cohort | null {
  const normalized = (email || "").trim().toLowerCase();
  if (!normalized) return null;
  if (isDirectorySheetEmail(normalized)) return 0;
  if (isApprovedSignupEmail(normalized)) return 1;
  return null;
}
