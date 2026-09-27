import Stripe from "stripe";
import { requestOrigin } from "@/lib/site";

let stripe: Stripe | null = null;
let stripeKey: string | null = null;
let portalConfigurationId: string | null = null;

function stripeSecretKey() {
  const key = process.env.STRIPE_SECRET_KEY?.trim();
  return key && key.startsWith("sk_") ? key : "";
}

export function stripeSecretConfigured() {
  return Boolean(stripeSecretKey());
}

export function getStripe() {
  const key = stripeSecretKey();
  if (!key) return null;
  if (!stripe || stripeKey !== key) {
    stripe = new Stripe(key);
    stripeKey = key;
    portalConfigurationId = null;
  }
  return stripe;
}

export async function ensureStripeCustomer(
  stripeClient: Stripe,
  input: { customerId?: string | null; email: string; userId: string },
) {
  if (input.customerId) {
    try {
      const existing = await stripeClient.customers.retrieve(input.customerId);
      if (!existing.deleted) return existing.id;
    } catch {
      // Stored id is missing or from a mock; create a real customer.
    }
  }

  const customer = await stripeClient.customers.create({
    email: input.email,
    metadata: { supabase_user_id: input.userId },
  });
  return customer.id;
}

export async function createBillingPortalSession(
  stripeClient: Stripe,
  input: { customerId: string; returnUrl: string },
) {
  if (!portalConfigurationId) {
    const existing = await stripeClient.billingPortal.configurations.list({
      limit: 1,
      active: true,
    });
    portalConfigurationId = existing.data[0]?.id ?? null;
  }

  if (!portalConfigurationId) {
    const created = await stripeClient.billingPortal.configurations.create({
      business_profile: {
        headline: "Design Meetup membership",
      },
      features: {
        customer_update: {
          enabled: true,
          allowed_updates: ["email", "name", "address"],
        },
        invoice_history: { enabled: true },
        payment_method_update: { enabled: true },
        subscription_cancel: { enabled: true },
        subscription_update: { enabled: false },
      },
    });
    portalConfigurationId = created.id;
  }

  return stripeClient.billingPortal.sessions.create({
    customer: input.customerId,
    return_url: input.returnUrl,
    configuration: portalConfigurationId,
  });
}

export function siteOriginFromRequest(request: Request) {
  return requestOrigin(request);
}
