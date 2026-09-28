import { NextResponse } from "next/server";
import {
  clearAuthCookies,
  getSessionUser,
  passwordSignIn,
  passwordSignUp,
  requestPasswordReset,
  setRecoverySession,
  updatePassword,
} from "@/lib/auth";
import {
  ensureDemoMembership,
  ensureProfile,
  userHasPortalAccess,
} from "@/lib/membership-service";
import { requestOrigin } from "@/lib/site";
import { sendWelcomeEmail } from "@/lib/welcome-email";

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

  const modeRaw = String(body.mode || "login");
  const mode =
    modeRaw === "signup" ||
    modeRaw === "recover" ||
    modeRaw === "recovery-session" ||
    modeRaw === "update-password"
      ? modeRaw
      : "login";
  const email = String(body.email || "")
    .trim()
    .toLowerCase();
  const password = String(body.password || "");
  const firstName = String(body.firstName || "").trim();
  const lastName = String(body.lastName || "").trim();
  const displayName = firstName
    ? `${firstName} ${lastName}`.trim()
    : String(body.displayName || body.name || "").trim();
  let nextPath =
    typeof body.next === "string" && body.next.startsWith("/")
      ? body.next
      : mode === "signup"
        ? "/portal/subscribe"
        : "/portal";

  if (mode === "recover") {
    if (!email) {
      return NextResponse.json(
        { error: "enter the email for your account." },
        { status: 400 },
      );
    }
    await requestPasswordReset(email, requestOrigin(request));
    return NextResponse.json({
      ok: true,
      sent: true,
    });
  }

  if (mode === "recovery-session") {
    const result = await setRecoverySession({
      access_token: String(body.access_token || ""),
      refresh_token: String(body.refresh_token || ""),
      expires_in:
        typeof body.expires_in === "number" ? body.expires_in : undefined,
    });
    if (!result.ok) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }
    return NextResponse.json({ ok: true });
  }

  if (mode === "update-password") {
    const result = await updatePassword(password);
    if (!result.ok) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }
    const user = await getSessionUser();
    if (user?.email) {
      await ensureProfile({ id: user.id, email: user.email });
      await ensureDemoMembership(user.email, user.id);
      if (
        !(await userHasPortalAccess(user.id)) &&
        !nextPath.startsWith("/portal/subscribe")
      ) {
        nextPath = "/portal/subscribe";
      }
    }
    return NextResponse.json({
      ok: true,
      url: `${requestOrigin(request)}${nextPath}`,
    });
  }

  if (!email || !password) {
    return NextResponse.json(
      { error: "Enter your email and password." },
      { status: 400 },
    );
  }

  if (mode === "signup") {
    if (!firstName && !displayName) {
      return NextResponse.json(
        { error: "Enter your first name." },
        { status: 400 },
      );
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
    }
    await sendWelcomeEmail({
      email,
      firstName: firstName || displayName.split(/\s+/)[0] || "",
      origin: requestOrigin(request),
    });
    nextPath = nextPath.includes("subscribe") ? nextPath : "/portal/subscribe";
  } else {
    const result = await passwordSignIn(email, password);
    if (!result.ok) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }
    const user = await getSessionUser();
    if (user?.email) {
      await ensureProfile({ id: user.id, email: user.email });
      await ensureDemoMembership(user.email, user.id);
      if (
        !(await userHasPortalAccess(user.id)) &&
        !nextPath.startsWith("/portal/subscribe")
      ) {
        nextPath = "/portal/subscribe";
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
