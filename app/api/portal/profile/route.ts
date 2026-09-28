import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { formatGraduation, persistGraduation } from "@/lib/graduation";
import {
  maybeUpgradeGraduatedStudent,
  updateProfile,
} from "@/lib/membership-service";
import { requestOrigin } from "@/lib/site";

export const runtime = "nodejs";

const MAX_AVATAR_BYTES = 2.5 * 1024 * 1024;

function optionalField(value: FormDataEntryValue | null | undefined) {
  return String(value || "").trim();
}

function wantsJson(request: Request) {
  return (request.headers.get("accept") || "").includes("application/json");
}

function formRedirectOrJson(
  request: Request,
  origin: string,
  path: string,
  json: { error?: string; ok?: boolean; profile?: unknown },
  status = 200,
) {
  const isForm = (request.headers.get("content-type") || "").includes(
    "multipart/form-data",
  );
  if (isForm && !wantsJson(request)) {
    return NextResponse.redirect(new URL(path, origin), 303);
  }
  return NextResponse.json(json, { status });
}

export async function POST(request: Request) {
  const user = await getSessionUser();
  const origin = requestOrigin(request);
  const contentType = request.headers.get("content-type") || "";
  const isForm = contentType.includes("multipart/form-data");

  if (!user?.email) {
    return formRedirectOrJson(
      request,
      origin,
      "/login?next=%2Fportal%2Fprofile",
      { error: "Unauthorized" },
      401,
    );
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
    year =
      persistGraduation(
        formatGraduation(
          optionalField(form.get("gradMonth")),
          optionalField(form.get("gradYear")),
        ) || optionalField(form.get("year")),
      ) || "";
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
        return formRedirectOrJson(
          request,
          origin,
          "/portal/profile?error=avatar-size",
          { error: "keep the photo under 2.5 mb." },
          400,
        );
      }
      if (!file.type.startsWith("image/")) {
        return formRedirectOrJson(
          request,
          origin,
          "/portal/profile?error=avatar-type",
          { error: "use a jpg, png, or webp image." },
          400,
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
      year =
        persistGraduation(
          formatGraduation(
            String(body.gradMonth || "").trim(),
            String(body.gradYear || "").trim(),
          ) || String(body.year || "").trim(),
        ) || "";
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
    return formRedirectOrJson(
      request,
      origin,
      "/portal/profile?error=required",
      { error: "Name and a valid email are required." },
      400,
    );
  }

  try {
    await updateProfile({
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
    await maybeUpgradeGraduatedStudent({
      userId: user.id,
      origin,
    });

    return formRedirectOrJson(
      request,
      origin,
      "/portal/profile?saved=1",
      { ok: true },
    );
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Could not save profile.";
    return formRedirectOrJson(
      request,
      origin,
      `/portal/profile?error=${encodeURIComponent(message)}`,
      { error: message },
      500,
    );
  }
}
