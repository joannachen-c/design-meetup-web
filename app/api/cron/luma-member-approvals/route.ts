import { NextResponse } from "next/server";
import {
  approvePendingMembers,
  createLumaClient,
  lumaApiKey,
  memberEmailSet,
  syncMembershipTier,
} from "@/lib/luma-member-approvals";
import { listMemberEmails } from "@/lib/membership-service";
import {
  bearerTokenFromHeader,
  isAuthorizedImportCaller,
} from "@/lib/vercel-project-auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

async function handle(request: Request) {
  const token = bearerTokenFromHeader(request.headers.get("authorization"));
  if (!(await isAuthorizedImportCaller(token))) {
    return NextResponse.json({ ok: false }, { status: 401 });
  }

  const apiKey = lumaApiKey();
  if (!apiKey) {
    return NextResponse.json(
      { ok: false, error: "LUMA_API_KEY is not set" },
      { status: 503 },
    );
  }

  const dryRun = new URL(request.url).searchParams.get("dry_run") === "1";
  try {
    const memberEmails = memberEmailSet(await listMemberEmails());
    if (memberEmails.size === 0) {
      return NextResponse.json(
        { ok: false, error: "No active members found; check the Supabase connection" },
        { status: 503 },
      );
    }
    const client = createLumaClient({ apiKey });
    const summary = await approvePendingMembers({ client, memberEmails, dryRun });
    let tier: Awaited<ReturnType<typeof syncMembershipTier>> | { error: string } | null = null;
    if (!dryRun) {
      // Tier sync is secondary: a renamed tier must not hide the approval results.
      try {
        tier = await syncMembershipTier({ client, memberEmails });
      } catch (error) {
        console.error("[luma-member-approvals] tier sync failed", error);
        tier = { error: error instanceof Error ? error.message : "unknown error" };
      }
    }
    return NextResponse.json({
      ok: summary.failed === 0,
      dryRun,
      members: memberEmails.size,
      tier,
      pending: summary.pending,
      approved: summary.approved,
      failed: summary.failed,
      events: summary.events.map((event) => ({
        eventId: event.eventId,
        eventName: event.eventName,
        pending: event.pending,
        approved: event.approved.length,
        failed: event.failed.map(({ id, error }) => ({ guestId: id, error })),
      })),
    });
  } catch (error) {
    console.error("[luma-member-approvals] sweep failed", error);
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : "unknown error" },
      { status: 500 },
    );
  }
}

export async function GET(request: Request) {
  return handle(request);
}

export async function POST(request: Request) {
  return handle(request);
}
