import { createAdminClient } from "@/lib/auth";
import {
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

export async function createPlanningItem(patch: PlanningPatch, actor: string) {
  const { data, error } = await createAdminClient()
    .from("planning_items")
    .insert({ ...planningPatchToRow(patch), updated_by: actor })
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
      ...planningPatchToRow(patch),
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
