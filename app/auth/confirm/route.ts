import { NextResponse } from "next/server";
import { publicAppUrl } from "@/lib/site";

export const runtime = "nodejs";

/** Supabase recovery links should land here, never on a protected *.vercel.app host. */
export function GET(request: Request) {
  const url = new URL(request.url);
  const tokenHash =
    url.searchParams.get("token_hash") || url.searchParams.get("token") || "";
  const type = url.searchParams.get("type") || "recovery";
  const dest = new URL("/reset-password", publicAppUrl);
  if (tokenHash) {
    dest.searchParams.set("token_hash", tokenHash);
    dest.searchParams.set("type", type);
  }
  return NextResponse.redirect(dest, 303);
}
