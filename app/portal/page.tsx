import type { Metadata } from "next";
import { ManageBillingButton } from "@/components/portal/ManageBillingButton";
import { MemberIdCard } from "@/components/portal/MemberIdCard";
import { SubscribeButtons } from "@/components/portal/SubscribeButtons";
import { requireUser } from "@/lib/auth";
import {
  TIER_CATALOG,
  displayNameFromEmail,
  firstNameFromDisplay,
} from "@/lib/membership";
import {
  ensureProfile,
  getMembership,
  getProfile,
  stripeConfigured,
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
    mock_portal?: string;
    canceled?: string;
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
  const membership = await getMembership(user.id);
  const profile = await getProfile(user.id);
  const displayName =
    profile?.displayName?.trim() ||
    displayNameFromEmail(user.email || "member");
  const firstName = firstNameFromDisplay(displayName, user.email || "member");
  const tierLabel = membership ? TIER_CATALOG[membership.tier].name : null;
  const memberSince = profile?.createdAt
    ? new Intl.DateTimeFormat("en-US", {
        month: "short",
        year: "numeric",
      }).format(new Date(profile.createdAt))
    : null;

  const renews = membership?.currentPeriodEnd
    ? new Intl.DateTimeFormat("en-US", {
        month: "long",
        day: "numeric",
        year: "numeric",
      }).format(new Date(membership.currentPeriodEnd))
    : "—";

  const summary = membership
    ? [
        {
          label: "current tier",
          value: TIER_CATALOG[membership.tier].name,
          note: TIER_CATALOG[membership.tier].priceLabel,
        },
        {
          label: "status",
          value: membership.status,
          note: membership.cancelAtPeriodEnd
            ? "cancels at period end"
            : "renews automatically",
        },
        {
          label: "billing renews",
          value: renews,
          note: stripeConfigured() ? "stripe billing" : "local mock period",
        },
      ]
    : null;

  return (
    <main className="w-full px-[clamp(20px,6vw,96px)] pt-[clamp(32px,5vw,64px)] pb-24 lowercase">
      {params.subscribed ? (
        <p
          className="mb-8 rounded-[20px] bg-accent-primary px-4 py-3 text-base text-ink"
          role="status"
        >
          {params.mock
            ? `local mock checkout activated ${params.tier || membership?.tier || "your"} plan. add a stripe secret key for real billing.`
            : "welcome — your membership is active."}
        </p>
      ) : null}
      {params.canceled ? (
        <p className="mb-8 text-base text-muted" role="status">
          checkout canceled — pick a plan when you&apos;re ready.
        </p>
      ) : null}
      {params.mock_portal ? (
        <p
          className="mb-8 rounded-[20px] bg-surface-muted px-4 py-3 text-base text-muted"
          role="status"
        >
          stripe customer portal needs a valid secret key. change plans below
          for now.
        </p>
      ) : null}

      <div className="mb-12 flex flex-wrap items-end justify-between gap-6 lg:mb-16 lg:flex-nowrap lg:items-center lg:gap-10">
        <div className="flex min-w-0 flex-1 flex-wrap items-end justify-between gap-4">
          <h1 className="m-0 max-w-[12ch] text-[clamp(2.5rem,6vw,4.5rem)] font-bold leading-[1.02] tracking-[-0.06em] text-balance">
            welcome back,
            <br />
            {firstName.toLowerCase()}.
          </h1>
          {hasAccess ? <ManageBillingButton /> : null}
        </div>
        <div className="w-full shrink-0 lg:w-auto lg:max-w-[420px]">
          <MemberIdCard
            displayName={displayName}
            email={profile?.email || user.email || ""}
            avatarUrl={profile?.avatarUrl ?? null}
            school={profile?.school}
            year={profile?.year}
            company={profile?.company}
            position={profile?.position}
            website={profile?.website}
            instagram={profile?.instagram}
            x={profile?.x}
            linkedin={profile?.linkedin}
            youtube={profile?.youtube}
            tierLabel={tierLabel}
            memberSince={memberSince}
          />
        </div>
      </div>

      {summary ? (
        <div className="mb-12 grid gap-4 sm:grid-cols-3">
          {summary.map((item) => (
            <div
              key={item.label}
              className="rounded-[20px] bg-surface-muted p-6"
            >
              <p className="m-0 mb-4 text-sm font-bold text-muted">
                {item.label}
              </p>
              <p className="m-0 text-2xl font-bold leading-tight tracking-[-0.04em] normal-case">
                {item.value}
              </p>
              <p className="mt-1 mb-0 text-sm text-subtle normal-case">
                {item.note}
              </p>
            </div>
          ))}
        </div>
      ) : null}

      <h2 className="m-0 mb-6 text-xl font-bold tracking-[-0.04em]">
        {hasAccess ? "change plan" : "membership"}
      </h2>
      <SubscribeButtons currentTier={membership?.tier ?? null} />
    </main>
  );
}
