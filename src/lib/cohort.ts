/** Server-only. Which founding cohort a member's email belongs to. */

import { directorySheetEmails, isDirectorySheetEmail } from "./comp-membership.ts";
import { approvedSignupEmails, isApprovedSignupEmail } from "./signup-allowlist.ts";

export type Cohort = 0 | 1 | 2;

/** Slack's free plan has no join dates, so each cohort's card shows the month the cohort started. */
export const COHORT_0_JOINED_AT = "2026-03-01T00:00:00.000Z";
export const COHORT_1_JOINED_AT = "2026-09-01T00:00:00.000Z";
export const COHORT_2_JOINED_AT = "2026-10-01T00:00:00.000Z";

/** Paying members admitted in October 2026. They must also be on the signup allowlist. */
const COHORT_2_EMAILS = new Set<string>([
  "katherine9wang@gmail.com",
  "hanswfu.design@gmail.com",
  "giangt.edu@gmail.com",
  "design.ginny@gmail.com",
  "justingainsley@gmail.com",
]);

export function cohortJoinedAt(cohort: Cohort | null): string | null {
  if (cohort === 0) return COHORT_0_JOINED_AT;
  if (cohort === 1) return COHORT_1_JOINED_AT;
  if (cohort === 2) return COHORT_2_JOINED_AT;
  return null;
}

/** Cohort 0 is the member directory sheet, cohort 2 the October 2026 intake, cohort 1 the rest of the signup allowlist. */
export function cohortForEmail(email: string | null | undefined): Cohort | null {
  const normalized = (email || "").trim().toLowerCase();
  if (!normalized) return null;
  if (isDirectorySheetEmail(normalized)) return 0;
  if (!isApprovedSignupEmail(normalized)) return null;
  return COHORT_2_EMAILS.has(normalized) ? 2 : 1;
}

/** Everyone in a cohort, whether or not they have made a portal account yet. */
export function cohortEmails() {
  return [...new Set([...directorySheetEmails(), ...approvedSignupEmails()])];
}
