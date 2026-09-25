import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { TIER_CATALOG, firstNameFromDisplay } from "@/lib/membership";
import {
  ensureProfile,
  getMembership,
  getProfile,
  syncMembershipFromCheckoutSession,
  userHasPortalAccess,
} from "@/lib/membership-service";

export const metadata: Metadata = {
  title: "Portal",
  robots: { index: false, follow: false },
};

export default async function PortalHomePage({
  searchParams,
}: {
  searchParams: Promise<{
    subscribed?: string;
    mock?: string;
    tier?: string;
    session_id?: string;
  }>;
}) {
  const user = await requireUser("/portal");
  await ensureProfile({ id: user.id, email: user.email });
  const params = await searchParams;

  if (params.session_id) {
    await syncMembershipFromCheckoutSession({
      userId: user.id,
      sessionId: params.session_id,
    });
  }

  const hasAccess = await userHasPortalAccess(user.id);
  if (!hasAccess) redirect("/portal/subscribe");

  const membership = await getMembership(user.id);
  const profile = await getProfile(user.id);
  const firstName = firstNameFromDisplay(
    profile?.displayName,
    user.email || "member",
  );
  const tierLabel = membership
    ? TIER_CATALOG[membership.tier].name
    : "member";

  const todayLabel = new Intl.DateTimeFormat("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
  }).format(new Date());

  return (
    <main className="w-full px-[clamp(20px,6vw,96px)] pt-[clamp(32px,5vw,64px)] pb-24">
      {params.subscribed ? (
        <p
          className="mb-8 rounded-[20px] bg-accent-primary px-4 py-3 text-base lowercase text-ink"
          role="status"
        >
          {params.mock
            ? `local mock checkout activated ${params.tier || membership?.tier || "your"} plan. add a stripe secret key for real billing.`
            : "welcome — your membership is active."}
        </p>
      ) : null}

      <div className="mb-12 grid items-end gap-6 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,0.8fr)]">
        <h1 className="m-0 text-[clamp(2rem,6vw,4.5rem)] font-bold leading-[1.02] tracking-[-0.06em] text-balance lowercase">
          welcome back, {firstName.toLowerCase()}.
        </h1>
        <p className="m-0 max-w-[44ch] text-base leading-normal text-muted lowercase">
          {todayLabel.toLowerCase()}. you&apos;re on the {tierLabel} plan.
        </p>
      </div>

      <div className="mb-16 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <Link
          href="/portal/membership"
          className="flex flex-col gap-16 rounded-[20px] bg-surface-muted p-6 text-left text-ink no-underline transition-colors hover:bg-gray-200"
        >
          <span aria-hidden className="block text-subtle">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
              <path
                d="M12 3.5 16.75 5.4v4.85c0 3.35-2.15 6.35-4.75 7.75-2.6-1.4-4.75-4.4-4.75-7.75V5.4L12 3.5Z"
                stroke="currentColor"
                strokeWidth="1.75"
                strokeLinejoin="round"
              />
              <path
                d="m9.85 11.15 1.45 1.45 2.95-3"
                stroke="currentColor"
                strokeWidth="1.75"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </span>
          <span className="block">
            <span className="mb-2 block text-2xl font-bold tracking-[-0.04em] lowercase">
              membership
            </span>
            <span className="block text-base leading-normal text-muted lowercase">
              tier, renewal date, payment method, and plan changes.
            </span>
          </span>
        </Link>
        <div className="flex flex-col gap-16 rounded-[20px] bg-surface-muted p-6 text-left">
          <span aria-hidden className="block text-subtle">
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
            <span className="mb-2 block text-2xl font-bold tracking-[-0.04em] lowercase">
              your profile
            </span>
            <span className="block text-base leading-normal text-muted lowercase">
              coming next — update where you work and what people should reach
              out about.
            </span>
          </span>
        </div>
        <div className="flex flex-col gap-16 rounded-[20px] bg-surface-muted p-6 text-left">
          <span aria-hidden className="block text-subtle">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
              <path
                d="M12 6.5c-1.6-1.2-3.5-1.75-5.75-1.75H4v14.5h2.25c2.25 0 4.15.55 5.75 1.75 1.6-1.2 3.5-1.75 5.75-1.75H20V4.75h-1.75c-2.25 0-4.15.55-5.75 1.75Z"
                stroke="currentColor"
                strokeWidth="1.75"
                strokeLinejoin="round"
              />
              <path d="M12 6.5V21" stroke="currentColor" strokeWidth="1.75" />
            </svg>
          </span>
          <span className="block">
            <span className="mb-2 block text-2xl font-bold tracking-[-0.04em] lowercase">
              member directory
            </span>
            <span className="block text-base leading-normal text-muted lowercase">
              coming next — browse members by role, location, and company.
            </span>
          </span>
        </div>
      </div>
    </main>
  );
}
