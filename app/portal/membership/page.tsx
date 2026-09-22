import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { ManageBillingButton } from "@/components/portal/ManageBillingButton";
import { SubscribeButtons } from "@/components/portal/SubscribeButtons";
import { requireUser } from "@/lib/auth";
import { TIER_CATALOG } from "@/lib/membership";
import {
  ensureProfile,
  getMembership,
  stripeConfigured,
  userHasPortalAccess,
} from "@/lib/membership-service";

export const metadata: Metadata = {
  title: "Membership",
  robots: { index: false, follow: false },
};

export default async function MembershipPage({
  searchParams,
}: {
  searchParams: Promise<{ mock_portal?: string }>;
}) {
  const user = await requireUser("/portal/membership");
  await ensureProfile({ id: user.id, email: user.email });
  const hasAccess = await userHasPortalAccess(user.id);
  if (!hasAccess) redirect("/portal/subscribe");

  const membership = await getMembership(user.id);
  const params = await searchParams;
  if (!membership) redirect("/portal/subscribe");

  const catalog = TIER_CATALOG[membership.tier];
  const renews = membership.currentPeriodEnd
    ? new Intl.DateTimeFormat("en-US", {
        month: "long",
        day: "numeric",
        year: "numeric",
      }).format(new Date(membership.currentPeriodEnd))
    : "—";

  const summary = [
    {
      label: "current tier",
      value: catalog.name,
      note: catalog.priceLabel,
    },
    {
      label: "status",
      value: membership.status,
      note: membership.cancelAtPeriodEnd ? "Cancels at period end" : "Renews automatically",
    },
    {
      label: "billing renews",
      value: renews,
      note: stripeConfigured() ? "Stripe Billing" : "Local mock period",
    },
  ];

  return (
    <main className="w-full px-[clamp(20px,6vw,96px)] pt-[clamp(24px,3vw,40px)] pb-24">
      <Link
        href="/portal"
        className="mb-8 inline-flex min-h-11 items-center rounded-[10px] text-base text-muted no-underline hover:text-ink"
      >
        Back to home
      </Link>
      <h1 className="m-0 mb-12 text-[clamp(2.5rem,6vw,4.5rem)] font-bold leading-[1.02] tracking-[-0.06em]">
        membership
      </h1>

      {params.mock_portal ? (
        <p className="mb-8 rounded-[11px] bg-surface-muted px-4 py-3 text-base text-muted" role="status">
          Stripe Customer Portal needs live/test Stripe keys. Locally, change
          plans below or manage billing once keys are added.
        </p>
      ) : null}

      <div className="mb-12 grid gap-4 sm:grid-cols-3">
        {summary.map((item) => (
          <div key={item.label} className="rounded-[11px] bg-surface-muted p-6">
            <p className="m-0 mb-4 text-sm font-bold text-muted">{item.label}</p>
            <p className="m-0 text-2xl font-bold tracking-[-0.04em] leading-tight">
              {item.value}
            </p>
            <p className="mt-1 mb-0 text-sm text-subtle">{item.note}</p>
          </div>
        ))}
      </div>

      <div className="mb-16 max-w-xs">
        <ManageBillingButton />
      </div>

      <h2 className="m-0 mb-6 text-xl font-bold tracking-[-0.04em]">
        Change plan
      </h2>
      <SubscribeButtons currentTier={membership.tier} />
    </main>
  );
}
