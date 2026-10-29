import { NextResponse } from "next/server";
import { MAX_APPROVALS_PER_REQUEST, parseApprovalEmails } from "@/lib/approved-signups";
import { addApprovedSignups, listApprovedSignups } from "@/lib/approved-signups-store";
import { approvalsActor } from "@/lib/portal-access";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const notFound = () => NextResponse.json({ error: "Not found" }, { status: 404 });

export async function GET(request: Request) {
  if (!(await approvalsActor(request))) return notFound();
  return NextResponse.json(
    { approved: await listApprovedSignups() },
    { headers: { "Cache-Control": "no-store" } },
  );
}

/** Body: { emails: string | string[] }. Safe to repeat, so the Sheets script resends every green row. */
export async function POST(request: Request) {
  const actor = await approvalsActor(request);
  if (!actor) return notFound();
  if (!(request.headers.get("content-type") || "").includes("application/json")) {
    return NextResponse.json({ error: "Send JSON." }, { status: 415 });
  }
  const body = (await request.json().catch(() => null)) as { emails?: unknown } | null;
  const { valid, invalid } = parseApprovalEmails(body?.emails);
  if (!valid.length) {
    return NextResponse.json({ error: "Add at least one valid email.", invalid }, { status: 400 });
  }
  if (valid.length > MAX_APPROVALS_PER_REQUEST) {
    return NextResponse.json(
      { error: `Send at most ${MAX_APPROVALS_PER_REQUEST} emails at a time.` },
      { status: 400 },
    );
  }
  try {
    const result = await addApprovedSignups(valid, actor);
    return NextResponse.json({ ...result, invalid });
  } catch (error) {
    console.error("approve signups failed", error);
    return NextResponse.json({ error: "Could not approve those emails." }, { status: 500 });
  }
}
