import type { Metadata } from "next";
import { Toast } from "@/components/Toast";
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

const MONTHS = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "June",
  "July",
  "Aug",
  "Sept",
  "Oct",
  "Nov",
  "Dec",
];

function formatMemberSince(date: Date) {
  return `${MONTHS[date.getMonth()]} ${date.getFullYear()}`;
}

export default async function PortalHomePage({
  searchParams,
}: {
  searchParams: Promise<{
    subscribed?: string;
    mock?: string;
    tier?: string;
    session_id?: string;
    canceled?: string;
    checkout_error?: string;
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
  const memberSince = profile?.createdAt
    ? formatMemberSince(new Date(profile.createdAt))
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
            : "renews automatically, every month",
        },
        {
          label: "billing renews",
          value: renews,
          note: stripeConfigured() ? "billed through Stripe" : null,
          action: true,
        },
      ]
    : null;

  return (
    <main className="w-full px-[clamp(20px,6vw,96px)] pt-[clamp(32px,5vw,64px)] pb-24 lowercase">
      {params.checkout_error ? (
        <Toast className="mb-8" variant="danger">
          couldn&apos;t start checkout. please try again.
        </Toast>
      ) : null}
      {params.canceled ? (
        <Toast className="mb-8">
          checkout canceled — pick a plan when you&apos;re ready.
        </Toast>
      ) : null}

      <div className="mb-12 flex flex-wrap items-end justify-between gap-6 lg:mb-16 lg:flex-nowrap lg:items-start lg:gap-10">
        <div className="min-w-0 flex-1">
          <h1 className="m-0 max-w-[12ch] text-[clamp(2.5rem,6vw,4.5rem)] font-bold leading-[1.02] tracking-[-0.06em] text-balance">
            {hasAccess ? "welcome back," : "welcome,"}
            <br />
            {firstName.toLowerCase()}.
          </h1>
        </div>
        <div className="w-full shrink-0 lg:mr-24 lg:w-[540px]">
          <MemberIdCard
            displayName={displayName}
            avatarUrl={profile?.avatarUrl ?? null}
            school={profile?.school}
            year={profile?.year}
            company={profile?.company}
            position={profile?.position}
            location={profile?.location}
            website={profile?.website}
            instagram={profile?.instagram}
            x={profile?.x}
            linkedin={profile?.linkedin}
            youtube={profile?.youtube}
            github={profile?.github}
            memberSince={memberSince}
          />
        </div>
      </div>

      {summary ? (
        <div className="mb-12 grid gap-4 sm:grid-cols-3">
          {summary.map((item) => (
            <div
              key={item.label}
              className="flex flex-col rounded-[20px] bg-gray-50 p-6"
            >
              <p className="m-0 mb-4 text-sm font-bold text-muted">
                {item.label}
              </p>
              <p className="m-0 text-[32px] font-bold leading-[1.02] tracking-[-0.06em] normal-case">
                {item.value}
              </p>
              {item.note ? (
                <p className="mt-1 mb-0 text-sm text-subtle normal-case">
                  {item.note}
                </p>
              ) : (
                <p className="mt-1 mb-0 text-sm invisible" aria-hidden>
                  &nbsp;
                </p>
              )}
              <div className="mt-auto flex min-h-11 items-end justify-end pt-6">
                {"action" in item && item.action ? (
                  <ManageBillingButton />
                ) : null}
              </div>
            </div>
          ))}
        </div>
      ) : null}

      <h2 className="m-0 mb-6 text-xl font-bold tracking-[-0.04em]">
        membership
      </h2>
      <SubscribeButtons currentTier={membership?.tier ?? null} />
    </main>
  );
}
