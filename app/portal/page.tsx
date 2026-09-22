import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { TIER_CATALOG } from "@/lib/membership";
import {
  ensureProfile,
  getMembership,
  getProfile,
  userHasPortalAccess,
} from "@/lib/membership-service";
import { firstNameFromDisplay } from "@/lib/membership";

export const metadata: Metadata = {
  title: "Portal",
  robots: { index: false, follow: false },
};

export default async function PortalHomePage({
  searchParams,
}: {
  searchParams: Promise<{ subscribed?: string; mock?: string; tier?: string }>;
}) {
  const user = await requireUser("/portal");
  await ensureProfile({ id: user.id, email: user.email });
  const hasAccess = await userHasPortalAccess(user.id);
  if (!hasAccess) redirect("/portal/subscribe");

  const membership = await getMembership(user.id);
  const profile = await getProfile(user.id);
  const firstName = firstNameFromDisplay(
    profile?.displayName,
    user.email || "member",
  );
  const params = await searchParams;
  const tierLabel = membership
    ? TIER_CATALOG[membership.tier].name
    : "Member";

  const todayLabel = new Intl.DateTimeFormat("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
  }).format(new Date());

  return (
    <main className="w-full px-[clamp(20px,6vw,96px)] pt-[clamp(32px,5vw,64px)] pb-24">
      {params.subscribed ? (
        <p
          className="mb-8 rounded-[11px] bg-accent-primary px-4 py-3 text-base text-ink"
          role="status"
        >
          {params.mock
            ? `Local mock checkout activated ${params.tier || membership?.tier || "your"} plan. Add Stripe test keys for real Billing.`
            : "Welcome — your membership is active."}
        </p>
      ) : null}

      <div className="mb-12 grid items-end gap-6 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,0.8fr)]">
        <h1 className="m-0 text-[clamp(2rem,6vw,4.5rem)] font-bold leading-[1.02] tracking-[-0.06em] text-balance">
          welcome back, {firstName.toLowerCase()}.
        </h1>
        <p className="m-0 max-w-[44ch] text-base leading-normal text-muted">
          {todayLabel}. You&apos;re on the {tierLabel} plan.
        </p>
      </div>

      <div className="mb-16 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <Link
          href="/portal/membership"
          className="flex flex-col gap-16 rounded-[11px] border border-gray-200 bg-white p-6 text-left text-ink no-underline transition-shadow hover:shadow-[0_3px_10px_rgba(0,0,0,0.12)]"
        >
          <span aria-hidden className="block text-ink">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
              <path
                d="M7.5 3.75h9v5.5a4.5 4.5 0 0 1-9 0v-5.5Z"
                stroke="currentColor"
                strokeWidth="1.75"
                strokeLinejoin="round"
              />
              <path
                d="M7.5 5.25H4.75v1.5a3.25 3.25 0 0 0 3.25 3.25M16.5 5.25h2.75v1.5A3.25 3.25 0 0 1 16 10M12 13.75V17m-3.25 3.25h6.5"
                stroke="currentColor"
                strokeWidth="1.75"
                strokeLinecap="round"
              />
            </svg>
          </span>
          <span className="block">
            <span className="mb-2 block text-2xl font-bold tracking-[-0.04em]">
              membership
            </span>
            <span className="block text-base leading-normal text-muted">
              Tier, renewal date, payment method, and plan changes.
            </span>
          </span>
        </Link>
        <div className="flex flex-col gap-16 rounded-[11px] border border-dashed border-gray-200 bg-white p-6 text-left">
          <span aria-hidden className="block text-ink">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
              <circle
                cx="12"
                cy="8.5"
                r="3.75"
                stroke="currentColor"
                strokeWidth="1.75"
              />
              <path
                d="M4.75 20c1.1-3.9 3.85-5.75 7.25-5.75S18.15 16.1 19.25 20"
                stroke="currentColor"
                strokeWidth="1.75"
                strokeLinecap="round"
              />
            </svg>
          </span>
          <span className="block">
            <span className="mb-2 block text-2xl font-bold tracking-[-0.04em]">
              your profile
            </span>
            <span className="block text-base leading-normal text-muted">
              Coming next — update where you work and what people should reach
              out about.
            </span>
          </span>
        </div>
        <div className="flex flex-col gap-16 rounded-[11px] border border-dashed border-gray-200 bg-white p-6 text-left">
          <span aria-hidden className="block text-ink">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
              <path
                d="M12 6.5c-1.6-1.2-3.5-1.75-5.75-1.75H4v14.5h2.25c2.25 0 4.15.55 5.75 1.75 1.6-1.2 3.5-1.75 5.75-1.75H20V4.75h-1.75c-2.25 0-4.15.55-5.75 1.75Z"
                stroke="currentColor"
                strokeWidth="1.75"
                strokeLinejoin="round"
              />
              <path
                d="M12 6.5V21"
                stroke="currentColor"
                strokeWidth="1.75"
              />
            </svg>
          </span>
          <span className="block">
            <span className="mb-2 block text-2xl font-bold tracking-[-0.04em]">
              member directory
            </span>
            <span className="block text-base leading-normal text-muted">
              Coming next — browse members by role, location, and company.
            </span>
          </span>
        </div>
      </div>
    </main>
  );
}
