import { NextResponse } from "next/server";
import {
  sendContactEmails,
  validateContactSubmission,
} from "@/lib/contact-email";

export const runtime = "nodejs";

const MAX_BODY_BYTES = 4096;

export async function POST(request: Request) {
  const body = await request.text();

  if (body.length > MAX_BODY_BYTES) {
    return NextResponse.json({ ok: false }, { status: 400 });
  }

  let payload: unknown;

  try {
    payload = JSON.parse(body);
  } catch {
    return NextResponse.json({ ok: false }, { status: 400 });
  }

  if (
    payload &&
    typeof payload === "object" &&
    typeof (payload as Record<string, unknown>).company === "string" &&
    (payload as Record<string, unknown>).company !== ""
  ) {
    return NextResponse.json({ ok: true });
  }

  const submission = validateContactSubmission(payload);

  if (!submission) {
    return NextResponse.json({ ok: false }, { status: 400 });
  }

  const result = await sendContactEmails(submission);

  if (!result.ok) {
    return NextResponse.json({ ok: false }, { status: result.status });
  }

  return NextResponse.json({ ok: true });
}
