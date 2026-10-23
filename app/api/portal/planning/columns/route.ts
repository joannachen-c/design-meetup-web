import { NextResponse } from "next/server";
import { parseColumnWidths } from "@/lib/planning";
import { saveColumnWidths } from "@/lib/planning-store";
import { planningActor } from "@/lib/portal-access";

export const runtime = "nodejs";

/** Saves the shared Planning column widths for everyone. */
export async function PUT(request: Request) {
  const actor = await planningActor(request);
  if (!actor) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (!(request.headers.get("content-type") || "").includes("application/json")) {
    return NextResponse.json({ error: "Send JSON." }, { status: 415 });
  }
  const body = (await request.json().catch(() => null)) as { widths?: unknown } | null;
  const columnWidths = parseColumnWidths(body?.widths);
  try {
    await saveColumnWidths(columnWidths, actor);
    return NextResponse.json({ columnWidths });
  } catch (error) {
    console.error("planning column widths save failed", error);
    return NextResponse.json({ error: "Could not save column widths." }, { status: 500 });
  }
}
