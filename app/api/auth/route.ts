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

async function readBody(request: Request) {
  const contentType = request.headers.get("content-type") || "";
  if (contentType.includes("application/json")) {
    try {
      return {
        kind: "json" as const,
        body: (await request.json()) as Record<string, unknown>,
      };
    } catch {
      return { kind: "json" as const, body: null };
    }
  }

  try {
    const form = await request.formData();
    return {
      kind: "form" as const,
      body: {
        mode: form.get("mode"),
        email: form.get("email"),
        password: form.get("password"),
        next: form.get("next"),
      } as Record<string, unknown>,
    };
  } catch {
    return { kind: "form" as const, body: null };
  }
}

export async function POST(request: Request) {
  const parsed = await readBody(request);
  if (!parsed.body) {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const mode = parsed.body.mode === "signup" ? "signup" : "login";
  const email = String(parsed.body.email || "")
    .trim()
    .toLowerCase();
  const password = String(parsed.body.password || "");
  const nextPath =
    typeof parsed.body.next === "string" &&
    String(parsed.body.next).startsWith("/")
      ? String(parsed.body.next)
      : mode === "signup"
        ? "/portal/subscribe"
        : "/portal";

  if (!email || !password) {
    if (parsed.kind === "form") {
      return NextResponse.redirect(
        new URL(
          `${mode === "signup" ? "/signup" : "/login"}?error=${encodeURIComponent("Enter your email and password.")}`,
          siteOrigin(request),
        ),
        303,
      );
    }
    return NextResponse.json(
      { error: "Enter your email and password." },
      { status: 400 },
    );
  }

  let authError: string | null = null;
  if (mode === "signup") {
    if (password.length < 8) {
      authError = "Password must be at least 8 characters.";
    } else {
      const result = await passwordSignUp(email, password);
      if (!result.ok) authError = result.error;
      else if (result.userId) {
        await ensureProfile({ id: result.userId, email });
      }
    }
  } else {
    const result = await passwordSignIn(email, password);
    if (!result.ok) authError = result.error;
  }

  if (authError) {
    if (parsed.kind === "form") {
      return NextResponse.redirect(
        new URL(
          `${mode === "signup" ? "/signup" : "/login"}?error=${encodeURIComponent(authError)}`,
          siteOrigin(request),
        ),
        303,
      );
    }
    return NextResponse.json({ error: authError }, { status: 400 });
  }

  const url = `${siteOrigin(request)}${nextPath}`;
  if (parsed.kind === "form") {
    return NextResponse.redirect(url, 303);
  }
  return NextResponse.json({ ok: true, url });
}

export async function DELETE() {
  await clearAuthCookies();
  return NextResponse.json({ ok: true });
}
