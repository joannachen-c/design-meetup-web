import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/auth";
import { supabaseAuthConfigured } from "@/lib/auth-session";
import { canViewMemberMedia } from "@/lib/portal-access";
import { PREVIEW_BUCKET } from "@/lib/portfolio-previews";

export const runtime = "nodejs";

function notFound() {
  return new NextResponse(null, {
    status: 404,
    headers: { "Cache-Control": "no-store" },
  });
}

/** A screenshot of a member's portfolio site, for directory cards. Members only. */
export async function GET(
  _request: Request,
  context: { params: Promise<{ userId: string }> },
) {
  const { userId } = await context.params;
  if (!userId || !supabaseAuthConfigured() || !(await canViewMemberMedia(userId))) {
    return notFound();
  }

  const { data } = await createAdminClient().storage.from(PREVIEW_BUCKET).download(`${userId}.webp`);
  if (!data) return notFound();

  // The directory adds ?v=<captured at>, so a new capture gets a new URL.
  return new NextResponse(new Uint8Array(await data.arrayBuffer()), {
    status: 200,
    headers: {
      "Content-Type": "image/webp",
      "Cache-Control": "private, max-age=86400",
    },
  });
}
