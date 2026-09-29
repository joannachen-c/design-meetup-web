import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { updateProfile } from "@/lib/membership-service";

export const runtime = "nodejs";

const MAX_AVATAR_BYTES = 2.5 * 1024 * 1024;

export async function POST(request: Request) {
  const user = await getSessionUser();
  if (!user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const form = await request.formData().catch(() => null);
  const file = form?.get("avatar");
  if (!file || typeof file === "string" || file.size === 0) {
    return NextResponse.json({ error: "Choose an image." }, { status: 400 });
  }
  if (!file.type.startsWith("image/")) {
    return NextResponse.json(
      { error: "Choose a JPG, PNG, or WebP image." },
      { status: 400 },
    );
  }
  if (file.size > MAX_AVATAR_BYTES) {
    return NextResponse.json(
      { error: "Image is too large. Keep it under 2.5 MB." },
      { status: 413 },
    );
  }

  const profile = await updateProfile({
    userId: user.id,
    avatarBytes: Buffer.from(await file.arrayBuffer()),
    avatarContentType: file.type,
  });

  return NextResponse.json({ avatarUrl: profile?.avatarUrl ?? null });
}
