import { NextResponse } from "next/server";
import {
  clearAuthCookies,
  passwordSignIn,
  passwordSignUp,
} from "@/lib/auth";
import { ensureProfile } from "@/lib/membership-service";

export const runtime = "nodejs";

function siteOrigin(request: Request) {
  return (
    process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") ||
    new URL(request.url).origin
  );
}

export async function POST(request: Request) {
  let body: Record<string, unknown>;
  try {
    body = (await request.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const mode = body.mode === "signup" ? "signup" : "login";
  const email = String(body.email || "")
    .trim()
    .toLowerCase();
  const password = String(body.password || "");
  const nextPath =
    typeof body.next === "string" && body.next.startsWith("/")
      ? body.next
      : mode === "signup"
        ? "/portal/subscribe"
        : "/portal";

  if (!email || !password) {
    return NextResponse.json(
      { error: "Enter your email and password." },
      { status: 400 },
    );
  }

  if (mode === "signup") {
    if (password.length < 8) {
      return NextResponse.json(
        { error: "Password must be at least 8 characters." },
        { status: 400 },
      );
    }
    const result = await passwordSignUp(email, password);
    if (!result.ok) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }
    if (result.userId) {
      await ensureProfile({ id: result.userId, email });
    }
  } else {
    const result = await passwordSignIn(email, password);
    if (!result.ok) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }
  }

  return NextResponse.json({
    ok: true,
    url: `${siteOrigin(request)}${nextPath}`,
  });
}

export async function DELETE() {
  await clearAuthCookies();
  return NextResponse.json({ ok: true });
}
