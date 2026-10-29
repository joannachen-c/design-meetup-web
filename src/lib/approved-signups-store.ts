/** Server-only. Approved signups added at runtime, on top of the hardcoded allowlist. */

import type { ApprovedSignup } from "@/lib/approved-signups";
import { createAdminClient } from "@/lib/auth";
import { supabaseAuthConfigured } from "@/lib/auth-session";
import { cohortForEmail, type Cohort } from "@/lib/cohort";
import { isApprovedSignupEmail } from "@/lib/signup-allowlist";


const normalize = (email: string | null | undefined) => (email ?? "").trim().toLowerCase();

/** Newest first. Read failures return [] so a missing table never blocks the portal. */
export async function listApprovedSignups(): Promise<ApprovedSignup[]> {
  if (!supabaseAuthConfigured()) return [];
  const { data, error } = await createAdminClient()
    .from("approved_signups")
    .select("email,added_by,created_at")
    .order("created_at", { ascending: false });
  if (error) {
    console.error("approved signups lookup failed", error.message);
    return [];
  }
  return (data ?? []).map((row) => ({
    email: row.email as string,
    addedBy: (row.added_by as string | null) ?? null,
    createdAt: row.created_at as string,
  }));
}

export async function listApprovedSignupEmails() {
  return (await listApprovedSignups()).map((row) => row.email);
}

/** Approved from the portal or the Google Sheets sync (not the hardcoded allowlist). */
export async function isAddedApprovedSignup(email: string) {
  const normalized = normalize(email);
  if (!normalized || !supabaseAuthConfigured()) return false;
  const { data, error } = await createAdminClient()
    .from("approved_signups")
    .select("email")
    .eq("email", normalized)
    .maybeSingle();
  if (error) {
    console.error("approved signup lookup failed", error.message);
    return false;
  }
  return Boolean(data);
}

/** Portal-approved members join cohort 1 with the rest of the allowlist. */
export async function cohortForMember(email: string | null | undefined): Promise<Cohort | null> {
  const cohort = cohortForEmail(email);
  if (cohort != null) return cohort;
  return email && (await isAddedApprovedSignup(email)) ? 1 : null;
}

/** Safe to repeat: emails that are already approved are reported, not re-added. */
export async function addApprovedSignups(emails: string[], actor: string) {
  const unique = [...new Set(emails.map(normalize).filter(Boolean))];
  const alreadyInCode = unique.filter((email) => isApprovedSignupEmail(email));
  const candidates = unique.filter((email) => !isApprovedSignupEmail(email));
  if (!candidates.length) return { added: [] as string[], alreadyApproved: alreadyInCode };
  if (!supabaseAuthConfigured()) throw new Error("Supabase is not configured.");

  const { data, error } = await createAdminClient()
    .from("approved_signups")
    .upsert(
      candidates.map((email) => ({ email, added_by: actor })),
      { onConflict: "email", ignoreDuplicates: true },
    )
    .select("email");
  if (error) throw new Error(`Could not approve signups: ${error.message}`);
  const added = new Set((data ?? []).map((row) => row.email as string));
  return {
    added: candidates.filter((email) => added.has(email)),
    alreadyApproved: [...alreadyInCode, ...candidates.filter((email) => !added.has(email))],
  };
}
