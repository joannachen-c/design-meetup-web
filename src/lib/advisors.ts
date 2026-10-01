import bundledAdvisorRows from "../data/advisors.json";
import { advisorFromRow, type Advisor, type AdvisorRow } from "./advisor-directory";
import { supabase } from "./supabase";

export type AdvisorsSource = "supabase" | "bundled";

export type AdvisorsResult = {
  advisors: Advisor[];
  source: AdvisorsSource;
  error: string | null;
};

const ADVISOR_SELECT =
  "slug, first_name, last_name, title, company, relationship, fields, locations, bio, photo_url, website_url, linkedin_url, x_url, sort_order";

export function bundledAdvisors(): Advisor[] {
  return (bundledAdvisorRows as AdvisorRow[]).map(advisorFromRow);
}

// The bundled copy mirrors the seed file, so the directory still renders in
// previews that have no Supabase env or haven't run the advisors migration.
export async function fetchAdvisors(): Promise<AdvisorsResult> {
  if (!supabase) {
    return {
      advisors: bundledAdvisors(),
      source: "bundled",
      error: "Supabase env is not configured.",
    };
  }

  const { data, error } = await supabase
    .from("advisors")
    .select(ADVISOR_SELECT)
    .order("sort_order", { ascending: true })
    .order("last_name", { ascending: true });

  if (error) {
    return { advisors: bundledAdvisors(), source: "bundled", error: error.message };
  }

  return {
    advisors: ((data as AdvisorRow[] | null) ?? []).map(advisorFromRow),
    source: "supabase",
    error: null,
  };
}
