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

async function readTier(request: Request) {
  const contentType = request.headers.get("content-type") || "";
  if (contentType.includes("application/json")) {
    try {
      const body = (await request.json()) as { tier?: unknown };
      return { kind: "json" as const, tier: body.tier };
    } catch {
      return { kind: "json" as const, tier: null };
    }
  }

  try {
    const form = await request.formData();
    return { kind: "form" as const, tier: form.get("tier") };
  } catch {
    return { kind: "form" as const, tier: null };
  }
}

export async function POST(request: Request) {
  const user = await getSessionUser();
  const origin = siteOriginFromRequest(request);
  const parsed = await readTier(request);

  if (!user?.email) {
    if (parsed.kind === "form") {
      return NextResponse.redirect(
        new URL("/login?next=%2Fportal%2Fsubscribe", origin),
        303,
      );
    }
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!isTier(parsed.tier)) {
    if (parsed.kind === "form") {
      return NextResponse.redirect(
        new URL("/portal/subscribe?error=pick-tier", origin),
        303,
      );
    }
    return NextResponse.json({ error: "Pick a valid tier." }, { status: 400 });
  }
  const tier = parsed.tier;

  await ensureProfile({ id: user.id, email: user.email });

  if (!stripeConfigured()) {
    await activateMockMembership(user.id, tier);
    const url = `${origin}/portal?subscribed=1&mock=1&tier=${tier}`;
    if (parsed.kind === "form") {
      return NextResponse.redirect(url, 303);
    }
    return NextResponse.json({ url, mock: true });
  }

  const stripe = getStripe();
  if (!stripe) {
    if (parsed.kind === "form") {
      return NextResponse.redirect(
        new URL("/portal/subscribe?error=stripe", origin),
        303,
      );
    }
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
    if (parsed.kind === "form") {
      return NextResponse.redirect(
        new URL("/portal/subscribe?error=price", origin),
        303,
      );
    }
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
    success_url: `${origin}/portal?subscribed=1&session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${origin}/portal/subscribe?canceled=1`,
    client_reference_id: user.id,
    metadata: { supabase_user_id: user.id, tier },
    subscription_data: {
      metadata: { supabase_user_id: user.id, tier },
    },
  });

  if (!session.url) {
    if (parsed.kind === "form") {
      return NextResponse.redirect(
        new URL("/portal/subscribe?error=checkout", origin),
        303,
      );
    }
    return NextResponse.json({ error: "Could not start checkout." }, { status: 500 });
  }

  if (parsed.kind === "form") {
    return NextResponse.redirect(session.url, 303);
  }
  return NextResponse.json({ url: session.url, mock: false });
}
