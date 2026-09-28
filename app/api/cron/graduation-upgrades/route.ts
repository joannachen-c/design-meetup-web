import { NextResponse } from "next/server";
import {
  listStudentMemberIds,
  maybeUpgradeGraduatedStudent,
} from "@/lib/membership-service";
import { requestOrigin } from "@/lib/site";
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

  const origin = requestOrigin(request);
  const userIds = await listStudentMemberIds();
  let upgraded = 0;
  for (const userId of userIds) {
    const result = await maybeUpgradeGraduatedStudent({ userId, origin });
    if (result) upgraded += 1;
  }
  return NextResponse.json({ ok: true, checked: userIds.length, upgraded });
}

export async function GET(request: Request) {
  return handle(request);
}

export async function POST(request: Request) {
  return handle(request);
}
