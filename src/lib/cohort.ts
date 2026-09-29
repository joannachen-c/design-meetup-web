/** Server-only. Which founding cohort a member's email belongs to. */

import { isDirectorySheetEmail } from "./comp-membership.ts";
import { isApprovedSignupEmail } from "./signup-allowlist.ts";

export type Cohort = 0 | 1;

/** Cohort 0 is the member directory sheet; cohort 1 is the rest of the signup allowlist. */
export function cohortForEmail(email: string | null | undefined): Cohort | null {
  const normalized = (email || "").trim().toLowerCase();
  if (!normalized) return null;
  if (isDirectorySheetEmail(normalized)) return 0;
  if (isApprovedSignupEmail(normalized)) return 1;
  return null;
}
