import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { isTier, priceIdForTier, TIER_CATALOG } from "@/lib/membership";
import {
  activateMockMembership,
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

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const tier =
    body && typeof body === "object"
      ? (body as { tier?: unknown }).tier
      : null;
  if (!isTier(tier)) {
    return NextResponse.json({ error: "Pick a valid tier." }, { status: 400 });
  }

  await ensureProfile({ id: user.id, email: user.email });
  const origin = siteOriginFromRequest(request);

  if (!stripeConfigured()) {
    await activateMockMembership(user.id, tier);
    return NextResponse.json({
      url: `${origin}/portal?subscribed=1&mock=1&tier=${tier}`,
      mock: true,
    });
  }

  const stripe = getStripe();
  if (!stripe) {
    return NextResponse.json({ error: "Stripe is not configured." }, { status: 500 });
  }

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

  const priceId = priceIdForTier(tier);
  if (priceId.startsWith("price_local_")) {
    return NextResponse.json(
      {
        error: `Missing Stripe Price id for ${TIER_CATALOG[tier].name}. Set STRIPE_PRICE_${tier.toUpperCase()}_MONTHLY.`,
      },
      { status: 500 },
    );
  }

  const session = await stripe.checkout.sessions.create({
    mode: "subscription",
    customer: customerId,
    line_items: [{ price: priceId, quantity: 1 }],
    success_url: `${origin}/portal?subscribed=1`,
    cancel_url: `${origin}/portal/subscribe?canceled=1`,
    client_reference_id: user.id,
    metadata: { supabase_user_id: user.id, tier },
    subscription_data: {
      metadata: { supabase_user_id: user.id, tier },
    },
  });

  if (!session.url) {
    return NextResponse.json({ error: "Could not start checkout." }, { status: 500 });
  }

  return NextResponse.json({ url: session.url, mock: false });
}
