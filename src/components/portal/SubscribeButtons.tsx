"use client";

import { useState, type FormEvent } from "react";
import { Primary } from "@/components/Primary";
import { TIER_CATALOG, type Tier } from "@/lib/membership";

export function SubscribeButtons({
  currentTier = null,
}: {
  currentTier?: Tier | null;
}) {
  const [busy, setBusy] = useState<Tier | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function startCheckout(tier: Tier, event: FormEvent<HTMLFormElement>) {
    const form = event.currentTarget;
    event.preventDefault();
    if (busy != null || currentTier === tier) return;

    setBusy(tier);
    setError(null);
    try {
      const response = await fetch("/api/stripe/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify({ tier }),
      });
      const payload = (await response.json()) as { url?: string; error?: string };
      if (!response.ok || !payload.url) {
        setError(payload.error || "Could not start checkout.");
        setBusy(null);
        return;
      }
      // Stay on the current host — absolute URLs can point at a tunnel/env
      // origin and drop localhost auth cookies.
      try {
        const next = new URL(payload.url, window.location.origin);
        window.location.assign(
          `${next.pathname}${next.search}${next.hash}` || next.href,
        );
      } catch {
        window.location.assign(payload.url);
      }
    } catch {
      form.submit();
    }
  }

  return (
    <div className="grid gap-4">
      <div className="grid gap-4 md:grid-cols-2">
        {(Object.keys(TIER_CATALOG) as Tier[]).map((tier) => {
          const catalog = TIER_CATALOG[tier];
          const isCurrent = currentTier === tier;
          const isUpgradeTarget =
            currentTier === "student" && tier === "professional";
          const isDowngrade =
            currentTier === "professional" && tier === "student";
          let cta = "choose plan";
          if (isCurrent) cta = "current plan";
          else if (isUpgradeTarget) cta = "switch";
          else if (isDowngrade) cta = "switch";
          else if (!currentTier) cta = "get started";

          return (
            <form
              key={tier}
              method="post"
              action="/api/stripe/checkout"
              onSubmit={(event) => {
                void startCheckout(tier, event);
              }}
              className={[
                "flex flex-col gap-6 rounded-[20px] bg-surface-muted p-6 text-ink lowercase",
              ].join(" ")}
            >
              <input type="hidden" name="tier" value={tier} />
              <div className="flex items-center justify-between gap-3">
                <span
                  className="text-xl font-bold tracking-[-0.04em] text-muted"
                >
                  {catalog.name}
                </span>
                {isCurrent ? (
                  <span className="rounded-full bg-accent-primary px-2.5 py-1 text-sm font-bold text-muted">
                    current
                  </span>
                ) : null}
              </div>
              <div className="text-[32px] font-bold leading-[1.02] tracking-[-0.06em] normal-case">
                {catalog.priceLabel}
              </div>
              <ul
                className="m-0 list-disc space-y-2 pl-5 text-base leading-normal text-muted"
              >
                {catalog.benefits.map((benefit) => (
                  <li key={benefit}>{benefit}</li>
                ))}
              </ul>
              <Primary
                className="mt-auto lowercase"
                type="submit"
                variant="ink"
                disabled={isCurrent || busy != null}
                loading={busy === tier}
              >
                {cta}
              </Primary>
            </form>
          );
        })}
      </div>
      {error ? (
        <p className="m-0 text-base lowercase text-red-700" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}
