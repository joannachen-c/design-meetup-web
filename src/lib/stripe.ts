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
    stripe = new Stripe(key, {
      // Match the Dashboard webhook destination (not stripe-node's latest pin).
      apiVersion: "2026-04-22.dahlia" as Stripe.LatestApiVersion,
    });
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

const PORTAL_HEADLINE = "Design Meetup membership";

const portalFeatures: Stripe.BillingPortal.ConfigurationCreateParams.Features = {
  customer_update: {
    enabled: true,
    allowed_updates: ["email", "name", "address"],
  },
  invoice_history: { enabled: true },
  payment_method_update: { enabled: true },
  subscription_cancel: { enabled: true },
  subscription_update: { enabled: false },
};

function portalHasBillingTools(
  config: Stripe.BillingPortal.Configuration,
) {
  return Boolean(
    config.features?.invoice_history?.enabled &&
      config.features?.payment_method_update?.enabled,
  );
}

async function ensurePortalConfiguration(stripeClient: Stripe) {
  if (portalConfigurationId) return portalConfigurationId;

  const existing = await stripeClient.billingPortal.configurations.list({
    limit: 20,
    active: true,
  });
  const ready =
    existing.data.find(
      (config) =>
        config.business_profile?.headline === PORTAL_HEADLINE &&
        portalHasBillingTools(config),
    ) ?? existing.data.find(portalHasBillingTools);

  if (ready) {
    portalConfigurationId = ready.id;
    return ready.id;
  }

  const created = await stripeClient.billingPortal.configurations.create({
    business_profile: { headline: PORTAL_HEADLINE },
    features: portalFeatures,
  });
  portalConfigurationId = created.id;
  return created.id;
}

export type PortalFlow = "payment_method_update";

export async function createBillingPortalSession(
  stripeClient: Stripe,
  input: { customerId: string; returnUrl: string; flow?: PortalFlow | null },
) {
  const configuration = await ensurePortalConfiguration(stripeClient);
  return stripeClient.billingPortal.sessions.create({
    customer: input.customerId,
    return_url: input.returnUrl,
    configuration,
    ...(input.flow ? { flow_data: { type: input.flow } } : {}),
  });
}

export type StripeCardSummary = {
  id: string;
  brand: string;
  last4: string;
  expMonth: number;
  expYear: number;
};

export type StripeInvoiceSummary = {
  id: string;
  number: string | null;
  createdLabel: string;
  amountLabel: string;
  status: string;
  hostedInvoiceUrl: string | null;
  invoicePdf: string | null;
};

function formatStripeMoney(cents: number, currency: string) {
  try {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: (currency || "usd").toUpperCase(),
    }).format(cents / 100);
  } catch {
    return `$${(cents / 100).toFixed(2)}`;
  }
}

export async function getCustomerBillingOverview(
  stripeClient: Stripe,
  customerId: string,
) {
  const [methods, invoices] = await Promise.all([
    stripeClient.paymentMethods.list({
      customer: customerId,
      type: "card",
      limit: 5,
    }),
    stripeClient.invoices.list({ customer: customerId, limit: 12 }),
  ]);

  const cards: StripeCardSummary[] = methods.data.flatMap((method) => {
    const card = method.card;
    if (!card?.last4) return [];
    return [
      {
        id: method.id,
        brand: card.brand,
        last4: card.last4,
        expMonth: card.exp_month,
        expYear: card.exp_year,
      },
    ];
  });

  const invoiceRows: StripeInvoiceSummary[] = invoices.data
    .filter((invoice) => invoice.status && invoice.status !== "draft")
    .map((invoice) => {
      const cents =
        invoice.status === "paid" ? invoice.amount_paid : invoice.amount_due;
      return {
        id: invoice.id,
        number: invoice.number,
        createdLabel: new Intl.DateTimeFormat("en-US", {
          month: "short",
          day: "numeric",
          year: "numeric",
        }).format(new Date(invoice.created * 1000)),
        amountLabel: formatStripeMoney(cents, invoice.currency),
        status: invoice.status ?? "open",
        hostedInvoiceUrl: invoice.hosted_invoice_url ?? null,
        invoicePdf: invoice.invoice_pdf ?? null,
      };
    });

  return { cards, invoices: invoiceRows };
}

export function siteOriginFromRequest(request: Request) {
  return requestOrigin(request);
}
