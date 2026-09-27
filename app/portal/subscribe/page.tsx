import type { Metadata } from "next";
import { requireUser } from "@/lib/auth";
import { SubscribeButtons } from "@/components/portal/SubscribeButtons";
import {
  ensureProfile,
  getMembership,
  getProfile,
  stripeConfigured,
} from "@/lib/membership-service";

export const metadata: Metadata = {
  title: "Membership",
  robots: { index: false, follow: false },
};

export default async function SubscribePage({
  searchParams,
}: {
  searchParams: Promise<{ canceled?: string }>;
}) {
  const user = await requireUser("/portal/subscribe");
  await ensureProfile({ id: user.id, email: user.email });
  const membership = await getMembership(user.id);
  const profile = await getProfile(user.id);
  const params = await searchParams;

  return (
    <main className="w-full px-[clamp(20px,6vw,96px)] pt-[clamp(32px,5vw,64px)] pb-24 lowercase">
      <h1 className="m-0 mb-4 text-[clamp(2.5rem,6vw,4.5rem)] font-bold leading-[1.02] tracking-[-0.06em]">
        membership
      </h1>
      <p className="mb-12 max-w-[54ch] text-base leading-normal text-muted normal-case">
        choose student ($10/mo) or professional ($35/mo).
        {!stripeConfigured()
          ? " stripe secret key is not set yet — get started activates a local mock subscription."
          : " checkout runs through stripe."}
      </p>
      {params.canceled ? (
        <p className="mb-8 text-base text-muted" role="status">
          checkout canceled — pick a plan when you&apos;re ready.
        </p>
      ) : null}
      <SubscribeButtons
        currentTier={membership?.tier ?? null}
        memberName={profile?.displayName ?? user.email ?? null}
      />
    </main>
  );
}
