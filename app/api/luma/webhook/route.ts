import { NextResponse } from "next/server";
import {
  approvePendingMembers,
  createLumaClient,
  eventIdFromWebhook,
  isValidLumaWebhookToken,
  lumaApiKey,
  memberEmailSet,
} from "@/lib/luma-member-approvals";
import { listMemberEmails } from "@/lib/membership-service";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

export async function POST(request: Request) {
  const apiKey = lumaApiKey();
  if (!apiKey) {
    return NextResponse.json({ ok: false }, { status: 503 });
  }
  const token = new URL(request.url).searchParams.get("token");
  if (!isValidLumaWebhookToken(apiKey, token)) {
    return NextResponse.json({ ok: false }, { status: 401 });
  }

  let payload: unknown;
  try {
    payload = await request.json();
  } catch {
    return NextResponse.json({ ok: false }, { status: 400 });
  }

  const eventId = eventIdFromWebhook(payload);
  if (!eventId) {
    return NextResponse.json({ ok: true, skipped: true });
  }

  try {
    const memberEmails = memberEmailSet(await listMemberEmails());
    if (memberEmails.size === 0) throw new Error("No active members found");
    const summary = await approvePendingMembers({
      client: createLumaClient({ apiKey }),
      memberEmails,
      eventIds: [eventId],
    });
    return NextResponse.json({
      ok: summary.failed === 0,
      approved: summary.approved,
      failed: summary.failed,
    });
  } catch (error) {
    // A non-2xx makes Luma retry; the scheduled sweep is the backstop either way.
    console.error("[luma-webhook] approval failed", error);
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}
