import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { updateProfile } from "@/lib/membership-service";

export const runtime = "nodejs";

const MAX_AVATAR_BYTES = 2.5 * 1024 * 1024;

function siteOrigin(request: Request) {
  return (
    process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") ||
    new URL(request.url).origin
  );
}

export async function POST(request: Request) {
  const user = await getSessionUser();
  const origin = siteOrigin(request);
  const contentType = request.headers.get("content-type") || "";
  const isForm = contentType.includes("multipart/form-data");

  if (!user?.email) {
    if (isForm) {
      return NextResponse.redirect(
        new URL("/login?next=%2Fportal%2Fprofile", origin),
        303,
      );
    }
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let displayName = "";
  let email = "";
  let avatarBytes: Buffer | null = null;
  let avatarContentType: string | null = null;

  if (isForm) {
    const form = await request.formData();
    displayName = String(form.get("displayName") || "").trim();
    email = String(form.get("email") || "")
      .trim()
      .toLowerCase();
    const file = form.get("avatar");
    if (file && typeof file !== "string" && file.size > 0) {
      if (file.size > MAX_AVATAR_BYTES) {
        return NextResponse.redirect(
          new URL("/portal/profile?error=avatar-size", origin),
          303,
        );
      }
      if (!file.type.startsWith("image/")) {
        return NextResponse.redirect(
          new URL("/portal/profile?error=avatar-type", origin),
          303,
        );
      }
      avatarBytes = Buffer.from(await file.arrayBuffer());
      avatarContentType = file.type;
    }
  } else {
    try {
      const body = (await request.json()) as {
        displayName?: string;
        email?: string;
      };
      displayName = String(body.displayName || "").trim();
      email = String(body.email || "")
        .trim()
        .toLowerCase();
    } catch {
      return NextResponse.json({ error: "Invalid request" }, { status: 400 });
    }
  }

  if (!displayName || !email || !email.includes("@")) {
    if (isForm) {
      return NextResponse.redirect(
        new URL("/portal/profile?error=required", origin),
        303,
      );
    }
    return NextResponse.json(
      { error: "Name and a valid email are required." },
      { status: 400 },
    );
  }

  try {
    const profile = await updateProfile({
      userId: user.id,
      email,
      displayName,
      avatarBytes,
      avatarContentType,
    });

    if (isForm) {
      return NextResponse.redirect(
        new URL("/portal/profile?saved=1", origin),
        303,
      );
    }
    return NextResponse.json({ ok: true, profile });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Could not save profile.";
    if (isForm) {
      return NextResponse.redirect(
        new URL(
          `/portal/profile?error=${encodeURIComponent(message)}`,
          origin,
        ),
        303,
      );
    }
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
