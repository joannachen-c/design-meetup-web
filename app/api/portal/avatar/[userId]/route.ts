import { NextResponse } from "next/server";
import sharp from "sharp";
import { getAvatarForUser } from "@/lib/membership-service";

export const runtime = "nodejs";

/** Thumbnail widths the directory asks for; originals can be several MB. */
const THUMBNAIL_WIDTHS = [64, 128, 256] as const;

export async function GET(
  request: Request,
  context: { params: Promise<{ userId: string }> },
) {
  const { userId } = await context.params;
  if (!userId) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const avatar = await getAvatarForUser(userId);
  if (!avatar) {
    return new NextResponse(null, {
      status: 404,
      headers: { "Cache-Control": "no-store" },
    });
  }

  const requested = Number(new URL(request.url).searchParams.get("w"));
  const width = requested > 0 ? THUMBNAIL_WIDTHS.find((size) => size >= requested) : undefined;
  if (width) {
    const thumbnail = await sharp(avatar.bytes)
      .rotate()
      .resize(width, width, { fit: "cover" })
      .webp({ quality: 80 })
      .toBuffer();
    return new NextResponse(new Uint8Array(thumbnail), {
      status: 200,
      headers: {
        "Content-Type": "image/webp",
        "Cache-Control": "private, max-age=3600",
      },
    });
  }

  return new NextResponse(new Uint8Array(avatar.bytes), {
    status: 200,
    headers: {
      "Content-Type": avatar.contentType,
      "Cache-Control": "private, max-age=3600",
    },
  });
}
