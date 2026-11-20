import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/auth";
import { listPreviewTargets, savePortfolioPreview } from "@/lib/portfolio-previews";
import {
  bearerTokenFromHeader,
  isAuthorizedImportCaller,
} from "@/lib/vercel-project-auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

/** GitHub Actions takes screenshots (Chrome does not run here) and sends them back through this route. */
const MAX_SCREENSHOT_BYTES = 4 * 1024 * 1024;

async function authorized(request: Request) {
  return isAuthorizedImportCaller(bearerTokenFromHeader(request.headers.get("authorization")));
}

/** Which members' sites to capture: `?all=1` for everyone with a website, otherwise only those due. */
export async function GET(request: Request) {
  if (!(await authorized(request))) {
    return NextResponse.json({ ok: false }, { status: 401 });
  }
  const all = new URL(request.url).searchParams.get("all") === "1";
  const targets = await listPreviewTargets(createAdminClient(), { all });
  return NextResponse.json({ ok: true, targets });
}

/** Saves one capture: PUT ?id=<profile id>&website=<as listed> with the screenshot as the body (empty = failed). */
export async function PUT(request: Request) {
  if (!(await authorized(request))) {
    return NextResponse.json({ ok: false }, { status: 401 });
  }
  const params = new URL(request.url).searchParams;
  const id = params.get("id");
  const website = params.get("website");
  if (!id || !website) {
    return NextResponse.json({ ok: false, error: "id and website are required" }, { status: 400 });
  }
  const body = Buffer.from(await request.arrayBuffer());
  if (body.length > MAX_SCREENSHOT_BYTES) {
    return NextResponse.json({ ok: false, error: "Screenshot is too large" }, { status: 413 });
  }
  try {
    const status = await savePortfolioPreview(createAdminClient(), {
      id,
      website,
      screenshot: body.length ? body : null,
    });
    return NextResponse.json({ ok: true, status });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Could not save preview";
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
