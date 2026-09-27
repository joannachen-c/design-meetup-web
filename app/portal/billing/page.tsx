import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Primary } from "@/components/Primary";
import { Toast } from "@/components/Toast";
import { requireUser } from "@/lib/auth";
import { TIER_CATALOG } from "@/lib/membership";
import { getMembership } from "@/lib/membership-service";

export const metadata: Metadata = {
  title: "Billing",
  robots: { index: false, follow: false },
};

export default async function BillingPage({
  searchParams,
}: {
  searchParams: Promise<{ saved?: string }>;
}) {
  const user = await requireUser("/portal/billing");
  const membership = await getMembership(user.id);
  if (!membership) redirect("/portal");
  const params = await searchParams;

  const renews = membership.currentPeriodEnd
    ? new Intl.DateTimeFormat("en-US", {
        month: "long",
        day: "numeric",
        year: "numeric",
      }).format(new Date(membership.currentPeriodEnd))
    : "—";

  return (
    <main className="w-full px-[clamp(20px,6vw,96px)] pt-[clamp(32px,5vw,64px)] pb-24 lowercase">
      {params.saved === "1" ? (
        <Toast className="mb-8" variant="success">
          billing updated.
        </Toast>
      ) : null}

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
              : "renews automatically"}
          </p>
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
