import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { ensureProfile, getProfile, stripeConfigured } from "@/lib/membership-service";
import { getStripe, siteOriginFromRequest } from "@/lib/stripe";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const user = await getSessionUser();
  if (!user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  await ensureProfile({ id: user.id, email: user.email });
  const origin = siteOriginFromRequest(request);

  if (!stripeConfigured()) {
    return NextResponse.json({
      url: `${origin}/portal/membership?mock_portal=1`,
      mock: true,
    });
  }

  const stripe = getStripe();
  const profile = await getProfile(user.id);
  if (!stripe || !profile?.stripeCustomerId) {
    return NextResponse.json(
      { error: "No Stripe customer on file yet. Subscribe first." },
      { status: 400 },
    );
  }

  const session = await stripe.billingPortal.sessions.create({
    customer: profile.stripeCustomerId,
    return_url: `${origin}/portal/membership`,
  });

  return NextResponse.json({ url: session.url, mock: false });
}
