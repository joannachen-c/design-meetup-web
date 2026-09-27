import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import {
  ensureProfile,
  getProfile,
  saveStripeCustomerId,
  stripeConfigured,
} from "@/lib/membership-service";
import {
  createBillingPortalSession,
  ensureStripeCustomer,
  getStripe,
  siteOriginFromRequest,
} from "@/lib/stripe";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const user = await getSessionUser();
  if (!user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  await ensureProfile({ id: user.id, email: user.email });
  const origin = siteOriginFromRequest(request);

  if (!stripeConfigured()) {
    return NextResponse.json(
      { error: "stripe billing isn't configured yet." },
      { status: 503 },
    );
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
    const customerId = await ensureStripeCustomer(stripe, {
      customerId: profile?.stripeCustomerId ?? null,
      email: user.email,
      userId: user.id,
    });
    if (customerId !== profile?.stripeCustomerId) {
      await saveStripeCustomerId(user.id, customerId);
    }

    const session = await createBillingPortalSession(stripe, {
      customerId,
      returnUrl: `${origin}/portal`,
    });

    return NextResponse.json({ url: session.url, mock: false });
  } catch (error) {
    console.error("stripe portal failed", error);
    const message =
      error instanceof Error ? error.message : "couldn't open billing.";
    const friendly = /api key|invalid/i.test(message)
      ? "stripe api key is invalid. update STRIPE_SECRET_KEY."
      : "couldn't open billing. try again in a moment.";
    return NextResponse.json({ error: friendly }, { status: 502 });
  }
}
