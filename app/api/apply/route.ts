import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

export const runtime = "nodejs";

const MAX_BODY_BYTES = 1024;
const MAX_EMAIL_LENGTH = 254;
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function normalizeEmail(value: unknown) {
  if (typeof value !== "string") return "";
  const normalized = value.trim().toLowerCase();
  if (!normalized || normalized.length > MAX_EMAIL_LENGTH) return "";
  return EMAIL_PATTERN.test(normalized) ? normalized : "";
}

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

  const email = normalizeEmail(
    payload && typeof payload === "object"
      ? (payload as Record<string, unknown>).email
      : null,
  );

  if (!email) {
    return NextResponse.json({ ok: false }, { status: 400 });
  }

  const supabase = createWriteClient();
  if (!supabase) {
    return NextResponse.json({ ok: false }, { status: 500 });
  }

  // Plain insert — not upsert. Production only has the anon key, and anon
  // upsert fails the insert-only RLS policy even with ignoreDuplicates.
  const { error } = await supabase.from("application_emails").insert({ email });

  if (error) {
    // Already on the waitlist; treat as success so the form can thank them.
    if (error.code === "23505") {
      return NextResponse.json({ ok: true });
    }
    return NextResponse.json({ ok: false }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
