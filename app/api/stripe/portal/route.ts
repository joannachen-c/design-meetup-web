import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import {
  ensureProfile,
  getProfile,
  saveStripeCustomerId,
  stripeConfigured,
} from "@/lib/membership-service";
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
      url: `${origin}/portal?mock_portal=1`,
      mock: true,
    });
  }

  const stripe = getStripe();
  if (!stripe) {
    return NextResponse.json(
      { error: "couldn't open billing. try again in a moment." },
      { status: 500 },
    );
  }

  try {
    const profile = await getProfile(user.id);
    let customerId = profile?.stripeCustomerId ?? null;
    if (!customerId) {
      const customer = await stripe.customers.create({
        email: user.email,
        metadata: { supabase_user_id: user.id },
      });
      customerId = customer.id;
      await saveStripeCustomerId(user.id, customerId);
    }

    const session = await stripe.billingPortal.sessions.create({
      customer: customerId,
      return_url: `${origin}/portal`,
    });

    return NextResponse.json({ url: session.url, mock: false });
  } catch (error) {
    console.error("stripe portal failed", error);
    return NextResponse.json(
      { error: "couldn't open billing. try again in a moment." },
      { status: 502 },
    );
  }
}
