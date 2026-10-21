import { createAdminClient } from "@/lib/auth";
import { nameLinks } from "@/lib/link-titles";
import {
  parseColumnWidths,
  type ColumnWidths,
  PLANNING_SELECT,
  planningItemFromRow,
  planningPatchToRow,
  type PlanningPatch,
} from "@/lib/planning";

export async function listPlanningItems() {
  const { data, error } = await createAdminClient()
    .from("planning_items")
    .select(PLANNING_SELECT)
    .order("created_at", { ascending: true });
  if (error) throw new Error(`Could not load planning items: ${error.message}`);
  return (data ?? []).map((row) => planningItemFromRow(row));
}

async function withNamedLinks(patch: PlanningPatch) {
  return patch.links ? { ...patch, links: await nameLinks(patch.links) } : patch;
}

export async function createPlanningItem(patch: PlanningPatch, actor: string) {
  const { data, error } = await createAdminClient()
    .from("planning_items")
    .insert({ ...planningPatchToRow(await withNamedLinks(patch)), updated_by: actor })
    .select(PLANNING_SELECT)
    .single();
  if (error) throw new Error(`Could not create planning item: ${error.message}`);
  return planningItemFromRow(data);
}

/** Writes only the fields that changed, so two people editing one row don't clobber each other. */
export async function updatePlanningItem(id: string, patch: PlanningPatch, actor: string) {
  const { data, error } = await createAdminClient()
    .from("planning_items")
    .update({
      ...planningPatchToRow(await withNamedLinks(patch)),
      updated_at: new Date().toISOString(),
      updated_by: actor,
    })
    .eq("id", id)
    .select(PLANNING_SELECT)
    .maybeSingle();
  if (error) throw new Error(`Could not update planning item: ${error.message}`);
  return data ? planningItemFromRow(data) : null;
}

export async function deletePlanningItem(id: string) {
  const { data, error } = await createAdminClient()
    .from("planning_items")
    .delete()
    .eq("id", id)
    .select("id");
  if (error) throw new Error(`Could not delete planning item: ${error.message}`);
  return (data ?? []).length > 0;
}

const COLUMN_WIDTHS_KEY = "column_widths";

export async function getColumnWidths(): Promise<ColumnWidths> {
  const { data, error } = await createAdminClient()
    .from("planning_settings")
    .select("value")
    .eq("key", COLUMN_WIDTHS_KEY)
    .maybeSingle();
  // Before the settings table exists, fall back to the default widths instead of failing the page.
  if (error) {
    console.error("planning column widths load failed", error.message);
    return {};
  }
  return parseColumnWidths(data?.value);
}

export async function saveColumnWidths(widths: ColumnWidths, actor: string) {
  const { error } = await createAdminClient()
    .from("planning_settings")
    .upsert({
      key: COLUMN_WIDTHS_KEY,
      value: widths,
      updated_at: new Date().toISOString(),
      updated_by: actor,
    });
  if (error) throw new Error(`Could not save column widths: ${error.message}`);
}
