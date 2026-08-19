import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";
import {
  sendContactEmails,
  validateContactSubmission,
  type ContactSubmission,
} from "@/lib/contact-email";

export const runtime = "nodejs";

const MAX_BODY_BYTES = 4096;

function createWriteClient() {
  const url = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key =
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return null;
  return createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

async function recordPartnerInquiry(submission: ContactSubmission) {
  const supabase = createWriteClient();
  if (!supabase) return "skipped" as const;

  const { error } = await supabase.from("partner_inquiries").insert({
    submission_id: submission.submissionId,
    first_name: submission.firstName,
    last_name: submission.lastName,
    email: submission.email,
    interest: submission.interest,
    city: submission.city,
  });

  if (!error) return "inserted" as const;
  if (error.code === "23505") return "duplicate" as const;

  console.error("Partner inquiry insert failed", error.message);
  return "failed" as const;
}

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

  const recorded = await recordPartnerInquiry(submission);
  if (recorded === "duplicate") {
    return NextResponse.json({ ok: true });
  }

  const result = await sendContactEmails(submission);

  if (!result.ok) {
    return NextResponse.json({ ok: false }, { status: result.status });
  }

  return NextResponse.json({ ok: true });
}
