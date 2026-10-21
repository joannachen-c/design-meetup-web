import { NextResponse } from "next/server";
import { parsePlanningPatch } from "@/lib/planning";
import { deletePlanningItem, updatePlanningItem } from "@/lib/planning-store";
import { planningActor } from "@/lib/portal-access";

export const runtime = "nodejs";

type Context = { params: Promise<{ id: string }> };

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const notFound = () => NextResponse.json({ error: "Not found" }, { status: 404 });

export async function PATCH(request: Request, { params }: Context) {
  const actor = await planningActor(request);
  const { id } = await params;
  if (!actor || !UUID.test(id)) return notFound();
  if (!(request.headers.get("content-type") || "").includes("application/json")) {
    return NextResponse.json({ error: "Send JSON." }, { status: 415 });
  }
  const parsed = parsePlanningPatch(await request.json().catch(() => null));
  if (!parsed.ok) return NextResponse.json({ error: parsed.error }, { status: 400 });
  try {
    const item = await updatePlanningItem(id, parsed.patch, actor);
    return item ? NextResponse.json({ item }) : notFound();
  } catch (error) {
    console.error("planning update failed", error);
    return NextResponse.json({ error: "Could not save that change." }, { status: 500 });
  }
}

export async function DELETE(request: Request, { params }: Context) {
  const actor = await planningActor(request);
  const { id } = await params;
  if (!actor || !UUID.test(id)) return notFound();
  try {
    return (await deletePlanningItem(id)) ? NextResponse.json({ ok: true }) : notFound();
  } catch (error) {
    console.error("planning delete failed", error);
    return NextResponse.json({ error: "Could not delete that item." }, { status: 500 });
  }
}
