import { NextResponse } from "next/server";
import {
  clearAuthCookies,
  getSessionUser,
  passwordSignIn,
  passwordSignUp,
} from "@/lib/auth";
import { supabaseAuthConfigured } from "@/lib/auth-session";
import {
  activateMockMembership,
  ensureProfile,
  getMembership,
} from "@/lib/membership-service";
import { requestOrigin } from "@/lib/site";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    return await handleAuth(request);
  } catch (error) {
    console.error("auth failed", error);
    return NextResponse.json(
      { error: "couldn't sign in. try again in a moment." },
      { status: 500 },
    );
  }
}

async function handleAuth(request: Request) {
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
  const displayName = String(body.displayName || body.name || "").trim();
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
    if (!displayName) {
      return NextResponse.json({ error: "Enter your name." }, { status: 400 });
    }
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
      await ensureProfile({ id: result.userId, email, displayName });
      if (!supabaseAuthConfigured()) {
        const membership = await getMembership(result.userId);
        if (!membership) await activateMockMembership(result.userId, "student");
      }
    }
  } else {
    const result = await passwordSignIn(email, password);
    if (!result.ok) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }
    if (!supabaseAuthConfigured()) {
      const user = await getSessionUser();
      if (user?.email) {
        await ensureProfile({ id: user.id, email: user.email });
        const membership = await getMembership(user.id);
        if (!membership) await activateMockMembership(user.id, "student");
      }
    }
  }

  return NextResponse.json({
    ok: true,
    url: `${requestOrigin(request)}${nextPath}`,
  });
}

export async function DELETE() {
  await clearAuthCookies();
  return NextResponse.json({ ok: true });
}
