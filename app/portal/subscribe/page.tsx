import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Toast } from "@/components/Toast";
import { SubscribeButtons } from "@/components/portal/SubscribeButtons";
import { requireUser } from "@/lib/auth";
import {
  syncMembershipFromCheckoutSession,
  userHasPortalAccess,
} from "@/lib/membership-service";

export const metadata: Metadata = {
  title: "Choose a membership",
  robots: { index: false, follow: false },
};

function subscribeError(code: string | undefined, reason: string | undefined) {
  const detail = (reason || "").trim();
  if (detail) return detail.toLowerCase();
  switch (code) {
    case "pick-tier":
      return "pick student or professional to continue.";
    case "stripe":
    case "price":
      return "billing isn't set up correctly yet. please try again later.";
    case "coupon":
      return "couldn't apply the free membership coupon. please try again later.";
    case "checkout":
      return "couldn't start checkout. please try again.";
    default:
      return null;
  }
}

export default async function SubscribePage({
  searchParams,
}: {
  searchParams: Promise<{
    canceled?: string;
    error?: string;
    reason?: string;
    session_id?: string;
  }>;
}) {
  const user = await requireUser("/portal/subscribe");
  const params = await searchParams;

  if (params.session_id) {
    await syncMembershipFromCheckoutSession({
      userId: user.id,
      sessionId: params.session_id,
    });
  }

  if (await userHasPortalAccess(user.id)) {
    redirect("/portal");
  }

  const error = subscribeError(params.error, params.reason);

  return (
    <main className="w-full px-[clamp(20px,6vw,96px)] pt-[clamp(32px,5vw,64px)] pb-24 lowercase">
      {params.canceled ? (
        <Toast className="mb-8">
          checkout canceled — pick a plan when you&apos;re ready.
        </Toast>
      ) : null}
      {error ? (
        <Toast className="mb-8" variant="danger">
          {error}
        </Toast>
      ) : null}

      <h1 className="m-0 mb-10 max-w-[16ch] text-[clamp(2.5rem,6vw,4.5rem)] font-bold leading-[1.02] tracking-[-0.06em] text-balance">
        choose a membership.
      </h1>
      <SubscribeButtons />
    </main>
  );
}
