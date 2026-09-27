import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { setMembershipCancelAtPeriodEnd } from "@/lib/membership-service";
import { requestOrigin } from "@/lib/site";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const user = await getSessionUser();
  const origin = requestOrigin(request);
  if (!user?.email) {
    return NextResponse.redirect(new URL("/login?next=%2Fportal%2Fbilling", origin), 303);
  }

  const form = await request.formData();
  const action = String(form.get("action") || "");
  if (action !== "cancel" && action !== "resume") {
    return NextResponse.redirect(new URL("/portal/billing", origin), 303);
  }

  await setMembershipCancelAtPeriodEnd(user.id, action === "cancel");
  return NextResponse.redirect(new URL("/portal/billing?saved=1", origin), 303);
}
