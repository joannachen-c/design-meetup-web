import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { ChevronLeftIcon } from "@/components/icons/ChevronLeftIcon";
import { Primary } from "@/components/Primary";
import { ManageBillingButton } from "@/components/portal/ManageBillingButton";
import { ProfileSavedToast } from "@/components/portal/ProfileSavedToast";
import { requireUser } from "@/lib/auth";
import { TIER_CATALOG } from "@/lib/membership";
import {
  getMemberBillingOverview,
  getMembership,
} from "@/lib/membership-service";

export const metadata: Metadata = {
  title: "Billing",
  robots: { index: false, follow: false },
};

export default async function BillingPage({
  searchParams,
}: {
  searchParams: Promise<{ saved?: string; error?: string }>;
}) {
  const user = await requireUser("/portal/billing");
  const membership = await getMembership(user.id);
  if (!membership) redirect("/portal");
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
    <main className="w-full px-[clamp(20px,6vw,96px)] pt-[clamp(32px,5vw,64px)] pb-24 lowercase">
      <ProfileSavedToast saved={params.saved === "1"} message="Billing updated." />
      {params.error ? (
        <p className="mb-8 text-base text-red-700" role="alert">
          couldn&apos;t update billing in stripe. try again.
        </p>
      ) : null}

      <nav aria-label="Breadcrumb" className="mb-3">
        <Link
          href="/portal"
          className="inline-flex items-center gap-1 text-base text-muted no-underline hover:text-ink"
        >
          <ChevronLeftIcon className="size-4 shrink-0" />
          home
        </Link>
      </nav>

      <h1 className="m-0 mb-10 max-w-[10ch] text-[clamp(2.5rem,6vw,4.5rem)] font-bold leading-[1.02] tracking-[-0.06em] text-balance">
        billing
      </h1>

      <div className="grid max-w-xl gap-4">
        <div className="rounded-[20px] bg-gray-50 p-6">
          <p className="m-0 mb-4 text-sm font-bold text-muted">current plan</p>
          <p className="m-0 text-[32px] font-bold leading-[1.02] tracking-[-0.06em] normal-case">
            {TIER_CATALOG[membership.tier].name}
          </p>
          <p className="mt-1 mb-0 text-sm text-subtle normal-case">
            {TIER_CATALOG[membership.tier].priceLabel}
          </p>
        </div>

        <div className="rounded-[20px] bg-gray-50 p-6">
          <p className="m-0 mb-4 text-sm font-bold text-muted">status</p>
          <p className="m-0 text-[32px] font-bold leading-[1.02] tracking-[-0.06em] normal-case">
            {membership.status}
          </p>
          <p className="mt-1 mb-0 text-sm text-subtle">
            {membership.cancelAtPeriodEnd
              ? "cancels at period end"
              : "renews automatically, every month"}
          </p>
        </div>

        <div className="rounded-[20px] bg-gray-50 p-6">
          <p className="m-0 mb-4 text-sm font-bold text-muted">payment method</p>
          {card ? (
            <>
              <p className="m-0 text-[32px] font-bold leading-[1.02] tracking-[-0.06em] normal-case">
                {card.brand} ···· {card.last4}
              </p>
              <p className="mt-1 mb-0 text-sm text-subtle normal-case">
                expires {card.expMonth}/{card.expYear}
              </p>
            </>
          ) : (
            <>
              <p className="m-0 text-[32px] font-bold leading-[1.02] tracking-[-0.06em]">
                no card on file
              </p>
              <p className="mt-1 mb-0 text-sm text-subtle">
                add or update your card in stripe
              </p>
            </>
          )}
          <div className="mt-6 flex justify-end">
            <ManageBillingButton label="update card" flow="payment_method_update" />
          </div>
        </div>

        <div className="rounded-[20px] bg-gray-50 p-6">
          <p className="m-0 mb-4 text-sm font-bold text-muted">invoices</p>
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
                        view
                      </a>
                    ) : null}
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <p className="m-0 text-sm text-subtle">
              invoices appear here after a payment.
            </p>
          )}
          <div className="mt-6 flex justify-end">
            <ManageBillingButton label="view in stripe" />
          </div>
        </div>

        <div className="rounded-[20px] bg-gray-50 p-6">
          <p className="m-0 mb-4 text-sm font-bold text-muted">
            billing renews
          </p>
          <p className="m-0 text-[32px] font-bold leading-[1.02] tracking-[-0.06em] normal-case">
            {renews}
          </p>
          <form action="/api/portal/billing" method="post" className="mt-6 flex justify-end">
            <input
              type="hidden"
              name="action"
              value={membership.cancelAtPeriodEnd ? "resume" : "cancel"}
            />
            <Primary
              type="submit"
              variant="secondary"
              className="lowercase bg-gray-100! text-ink hover:bg-gray-200!"
            >
              {membership.cancelAtPeriodEnd
                ? "keep subscription"
                : "cancel at period end"}
            </Primary>
          </form>
        </div>
      </div>
    </main>
  );
}
