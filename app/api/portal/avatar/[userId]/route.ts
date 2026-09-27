import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { getAvatarForUser } from "@/lib/membership-service";

export const runtime = "nodejs";

export async function GET(
  _request: Request,
  context: { params: Promise<{ userId: string }> },
) {
  const { userId } = await context.params;
  if (!userId) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const avatar = await getAvatarForUser(userId);
  if (!avatar) {
    return new NextResponse(null, { status: 404 });
  }

  return new NextResponse(new Uint8Array(avatar.bytes), {
    status: 200,
    headers: {
      "Content-Type": avatar.contentType,
      "Cache-Control": "private, max-age=3600",
    },
  });
}
