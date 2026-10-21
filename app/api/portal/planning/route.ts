import { NextResponse } from "next/server";
import { parsePlanningPatch } from "@/lib/planning";
import { createPlanningItem, listPlanningItems } from "@/lib/planning-store";
import { planningActor } from "@/lib/portal-access";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const notFound = () => NextResponse.json({ error: "Not found" }, { status: 404 });

export async function GET(request: Request) {
  if (!(await planningActor(request))) return notFound();
  try {
    const items = await listPlanningItems();
    return NextResponse.json({ items }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    console.error("planning list failed", error);
    return NextResponse.json({ error: "Could not load the pipeline." }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const actor = await planningActor(request);
  if (!actor) return notFound();
  if (!(request.headers.get("content-type") || "").includes("application/json")) {
    return NextResponse.json({ error: "Send JSON." }, { status: 415 });
  }
  const parsed = parsePlanningPatch(await request.json().catch(() => null), {
    requireCompany: true,
  });
  if (!parsed.ok) return NextResponse.json({ error: parsed.error }, { status: 400 });
  try {
    const item = await createPlanningItem(parsed.patch, actor);
    return NextResponse.json({ item }, { status: 201 });
  } catch (error) {
    console.error("planning create failed", error);
    return NextResponse.json({ error: "Could not add that item." }, { status: 500 });
  }
}
