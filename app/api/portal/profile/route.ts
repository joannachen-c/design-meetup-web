import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { updateProfile } from "@/lib/membership-service";
import { requestOrigin } from "@/lib/site";

export const runtime = "nodejs";

const MAX_AVATAR_BYTES = 2.5 * 1024 * 1024;

function optionalField(value: FormDataEntryValue | null | undefined) {
  return String(value || "").trim();
}

export async function POST(request: Request) {
  const user = await getSessionUser();
  const origin = requestOrigin(request);
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
  let school = "";
  let year = "";
  let company = "";
  let position = "";
  let location = "";
  let website = "";
  let instagram = "";
  let x = "";
  let linkedin = "";
  let youtube = "";
  let github = "";
  let avatarBytes: Buffer | null = null;
  let avatarContentType: string | null = null;

  if (isForm) {
    const form = await request.formData();
    const firstName = optionalField(form.get("firstName"));
    const lastName = optionalField(form.get("lastName"));
    displayName = firstName
      ? `${firstName} ${lastName}`.trim()
      : optionalField(form.get("displayName"));
    email = optionalField(form.get("email")).toLowerCase();
    school = optionalField(form.get("school"));
    year = optionalField(form.get("year"));
    company = optionalField(form.get("company"));
    position = optionalField(form.get("position"));
    location = optionalField(form.get("location"));
    website = optionalField(form.get("website"));
    instagram = optionalField(form.get("instagram"));
    x = optionalField(form.get("x"));
    linkedin = optionalField(form.get("linkedin"));
    youtube = optionalField(form.get("youtube"));
    github = optionalField(form.get("github"));
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
      const body = (await request.json()) as Record<string, string | undefined>;
      displayName = String(body.displayName || "").trim();
      email = String(body.email || "")
        .trim()
        .toLowerCase();
      school = String(body.school || "").trim();
      year = String(body.year || "").trim();
      company = String(body.company || "").trim();
      position = String(body.position || "").trim();
      location = String(body.location || "").trim();
      website = String(body.website || "").trim();
      instagram = String(body.instagram || "").trim();
      x = String(body.x || "").trim();
      linkedin = String(body.linkedin || "").trim();
      youtube = String(body.youtube || "").trim();
      github = String(body.github || "").trim();
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
      school,
      year,
      company,
      position,
      location,
      website,
      instagram,
      x,
      linkedin,
      youtube,
      github,
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
