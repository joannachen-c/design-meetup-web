import { NextResponse } from "next/server";
import { importPartnerInquiriesFromGmail } from "@/lib/partner-inquiry-import";
import {
  bearerTokenFromHeader,
  isAuthorizedImportCaller,
} from "@/lib/vercel-project-auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

async function handle(request: Request) {
  const token = bearerTokenFromHeader(request.headers.get("authorization"));
  if (!(await isAuthorizedImportCaller(token))) {
    return NextResponse.json({ ok: false }, { status: 401 });
  }

  try {
    const result = await importPartnerInquiriesFromGmail();
    return NextResponse.json({ ok: true, ...result });
  } catch {
    console.error("Partner inquiry import failed");
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}

export async function GET(request: Request) {
  return handle(request);
}

export async function POST(request: Request) {
  return handle(request);
}
