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
  type PortalFlow,
} from "@/lib/stripe";

export const runtime = "nodejs";

function wantsJson(request: Request) {
  const accept = request.headers.get("accept") || "";
  const contentType = request.headers.get("content-type") || "";
  return (
    accept.includes("application/json") ||
    contentType.includes("application/json")
  );
}

function send(request: Request, url: string) {
  if (wantsJson(request)) {
    return NextResponse.json({ url });
  }
  return NextResponse.redirect(url, 303);
}

function sendError(request: Request, origin: string) {
  const errorUrl = new URL("/portal/billing?error=1", origin).toString();
  if (wantsJson(request)) {
    return NextResponse.json(
      { error: "couldn't open billing. try again in a moment." },
      { status: 502 },
    );
  }
  return NextResponse.redirect(errorUrl, 303);
}

async function readPortalFlow(request: Request): Promise<PortalFlow | null> {
  const contentType = request.headers.get("content-type") || "";
  if (contentType.includes("application/json")) {
    try {
      const body = (await request.json()) as { flow?: unknown };
      return body.flow === "payment_method_update" ? body.flow : null;
    } catch {
      return null;
    }
  }

  try {
    const form = await request.formData();
    return form.get("flow") === "payment_method_update"
      ? "payment_method_update"
      : null;
  } catch {
    return null;
  }
}

export async function POST(request: Request) {
  const user = await getSessionUser();
  const origin = siteOriginFromRequest(request);
  const billingUrl = `${origin}/portal/billing`;
  const flow = await readPortalFlow(request);

  if (!user?.email) {
    if (wantsJson(request)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.redirect(new URL("/login?next=%2Fportal", origin), 303);
  }

  await ensureProfile({ id: user.id, email: user.email });

  if (!stripeConfigured()) {
    return sendError(request, origin);
  }

  const stripe = getStripe();
  if (!stripe) {
    return sendError(request, origin);
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

    let session;
    try {
      session = await createBillingPortalSession(stripe, {
        customerId,
        returnUrl: billingUrl,
        flow,
      });
    } catch (error) {
      // A deep-link into card update can fail for customers with no Stripe
      // subscription yet. Open the general billing portal instead.
      if (flow) {
        session = await createBillingPortalSession(stripe, {
          customerId,
          returnUrl: billingUrl,
        });
      } else {
        throw error;
      }
    }

    if (!session.url) {
      return sendError(request, origin);
    }
    return send(request, session.url);
  } catch (error) {
    console.error("stripe portal failed", error);
    return sendError(request, origin);
  }
}
