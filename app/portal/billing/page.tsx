import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { ChevronLeftIcon } from "@/components/icons/ChevronLeftIcon";
import { Primary } from "@/components/Primary";
import { ManageBillingButton } from "@/components/portal/ManageBillingButton";
import { ProfileSavedToast } from "@/components/portal/ProfileSavedToast";
import { TIER_CATALOG, membershipStatusLabel } from "@/lib/membership";
import {
  getMemberBillingOverview,
  getMembership,
} from "@/lib/membership-service";
import { requirePaidMembership } from "@/lib/portal-access";

export const metadata: Metadata = {
  title: "Billing",
  robots: { index: false, follow: false },
};

export default async function BillingPage({
  searchParams,
}: {
  searchParams: Promise<{ saved?: string; error?: string }>;
}) {
  const user = await requirePaidMembership("/portal/billing");
  const membership = await getMembership(user.id);
  if (!membership) redirect("/portal/subscribe");
  const params = await searchParams;
  const { cards, invoices } = await getMemberBillingOverview(user.id);
  const card = cards[0] ?? null;

  const renews = membership.currentPeriodEnd
    ? new Intl.DateTimeFormat("en-US", {
        month: "long",
        day: "numeric",
        year: "numeric",
      }).format(new Date(membership.currentPeriodEnd))
    : "—";

  return (
    <main className="w-full px-[clamp(20px,6vw,96px)] pt-[clamp(32px,5vw,64px)] pb-24">
      <ProfileSavedToast saved={params.saved === "1"} message="Billing updated." />
      {params.error ? (
        <p className="mb-8 text-base text-red-700" role="alert">
          Couldn&apos;t update billing in Stripe. Try again.
        </p>
      ) : null}

      <nav aria-label="Breadcrumb" className="mb-3">
        <Link
          href="/portal"
          className="inline-flex items-center gap-1 text-base text-muted no-underline hover:text-ink"
        >
          <ChevronLeftIcon className="size-4 shrink-0" />
          Home
        </Link>
      </nav>

      <h1 className="m-0 mb-10 max-w-[10ch] text-[clamp(2.5rem,6vw,4.5rem)] font-bold leading-[1.02] tracking-[-0.06em] text-balance">
        Billing
      </h1>

      <div className="grid gap-4 md:grid-cols-3">
        <div className="flex flex-col rounded-[20px] bg-gray-100 p-6">
          <p className="m-0 mb-4 text-sm font-bold text-muted">Current plan</p>
          <p className="m-0 text-[32px] font-bold leading-[1.02] tracking-[-0.06em] normal-case">
            {TIER_CATALOG[membership.tier].name}
          </p>
          <p className="mt-1 mb-0 text-sm text-subtle normal-case">
            {TIER_CATALOG[membership.tier].priceLabel}
          </p>
        </div>

        <div className="flex flex-col rounded-[20px] bg-gray-100 p-6">
          <p className="m-0 mb-4 text-sm font-bold text-muted">Status</p>
          <p className="m-0 text-[32px] font-bold leading-[1.02] tracking-[-0.06em] normal-case">
            {membershipStatusLabel(membership.status)}
          </p>
          <p className="mt-1 mb-0 text-sm text-subtle">
            {membership.cancelAtPeriodEnd
              ? "Cancels at period end"
              : "Renews automatically, every month"}
          </p>
        </div>

        <div className="flex flex-col rounded-[20px] bg-gray-100 p-6">
          <p className="m-0 mb-4 text-sm font-bold text-muted">
            Billing renews
          </p>
          <p className="m-0 text-[32px] font-bold leading-[1.02] tracking-[-0.06em] normal-case">
            {renews}
          </p>
          <form
            action="/api/portal/billing"
            method="post"
            className="mt-auto flex justify-end pt-6"
          >
            <input
              type="hidden"
              name="action"
              value={membership.cancelAtPeriodEnd ? "resume" : "cancel"}
            />
            <Primary
              type="submit"
              variant="secondary"
              className="bg-gray-200! text-ink hover:bg-gray-300!"
            >
              {membership.cancelAtPeriodEnd
                ? "Keep subscription"
                : "Cancel at period end"}
            </Primary>
          </form>
        </div>
      </div>

      <div className="mt-4 grid gap-4 md:grid-cols-2">
        <div className="flex flex-col rounded-[20px] bg-gray-100 p-6">
          <p className="m-0 mb-4 text-sm font-bold text-muted">Payment method</p>
          {card ? (
            <>
              <p className="m-0 text-[32px] font-bold leading-[1.02] tracking-[-0.06em] normal-case">
                {card.brand} ···· {card.last4}
              </p>
              <p className="mt-1 mb-0 text-sm text-subtle normal-case">
                Expires {card.expMonth}/{card.expYear}
              </p>
            </>
          ) : (
            <>
              <p className="m-0 text-[32px] font-bold leading-[1.02] tracking-[-0.06em]">
                No card on file
              </p>
              <p className="mt-1 mb-0 text-sm text-subtle">
                Add or update your card in Stripe
              </p>
            </>
          )}
          <div className="mt-auto flex justify-end pt-6">
            <ManageBillingButton label="Update card" flow="payment_method_update" />
          </div>
        </div>

        <div className="flex flex-col rounded-[20px] bg-gray-100 p-6">
          <p className="m-0 mb-4 text-sm font-bold text-muted">Invoices</p>
          {invoices.length ? (
            <ul className="m-0 grid list-none gap-4 p-0">
              {invoices.map((invoice) => (
                <li
                  key={invoice.id}
                  className="flex items-baseline justify-between gap-4"
                >
                  <div className="min-w-0">
                    <p className="m-0 font-bold normal-case">
                      {invoice.number || invoice.createdLabel}
                    </p>
                    <p className="m-0 text-sm text-subtle">
                      {invoice.createdLabel} · {invoice.status}
                    </p>
                  </div>
                  <div className="flex shrink-0 items-baseline gap-3">
                    <span className="normal-case">{invoice.amountLabel}</span>
                    {invoice.hostedInvoiceUrl ? (
                      <a
                        href={invoice.hostedInvoiceUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="text-muted no-underline hover:text-ink"
                      >
                        View
                      </a>
                    ) : null}
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <p className="m-0 text-sm text-subtle">
              Invoices appear here after a payment.
            </p>
          )}
          <div className="mt-auto flex justify-end pt-6">
            <ManageBillingButton label="View in Stripe" />
          </div>
        </div>
      </div>
    </main>
  );
}
