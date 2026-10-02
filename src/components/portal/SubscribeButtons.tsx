"use client";

import { useState, type FormEvent } from "react";
import { Primary } from "@/components/Primary";
import { TIER_CATALOG, type Tier } from "@/lib/membership";

export function SubscribeButtons({
  currentTier = null,
  comped = false,
}: {
  currentTier?: Tier | null;
  comped?: boolean;
}) {
  const [busy, setBusy] = useState<Tier | null>(null);

  async function startCheckout(tier: Tier, event: FormEvent<HTMLFormElement>) {
    const form = event.currentTarget;
    event.preventDefault();
    if (busy != null || currentTier === tier) return;

    setBusy(tier);
    try {
      const response = await fetch("/api/stripe/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify({ tier }),
      });
      const raw = await response.text();
      let payload: { url?: string; error?: string; code?: string } = {};
      if (raw) {
        try {
          payload = JSON.parse(raw) as {
            url?: string;
            error?: string;
            code?: string;
          };
        } catch {
          form.submit();
          return;
        }
      }
      if (!response.ok || !payload.url) {
        const params = new URLSearchParams({
          error: payload.code || "checkout",
        });
        if (payload.error) params.set("reason", payload.error.slice(0, 240));
        window.location.assign(`/portal/subscribe?${params}`);
        return;
      }
      const next = new URL(payload.url, window.location.origin);
      if (next.origin !== window.location.origin) {
        window.location.assign(next.href);
        return;
      }
      window.location.assign(
        `${next.pathname}${next.search}${next.hash}` || next.href,
      );
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
          let cta = "Choose plan";
          if (isCurrent) cta = "Current plan";
          else if (isUpgradeTarget) cta = "Switch";
          else if (isDowngrade) cta = "Switch";
          else if (!currentTier) cta = "Get started";

          return (
            <form
              key={tier}
              method="post"
              action="/api/stripe/checkout"
              onSubmit={(event) => {
                void startCheckout(tier, event);
              }}
              className={[
                "flex flex-col gap-6 rounded-[20px] p-6 text-ink",
                isCurrent ? "bg-gray-200" : "bg-gray-100",
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
                  <span className="rounded-full bg-accent-primary px-2.5 py-1 text-sm font-bold text-ink">
                    Current
                  </span>
                ) : null}
              </div>
              {comped ? (
                <div className="flex flex-wrap items-baseline gap-x-3 text-[32px] font-bold leading-[1.02] tracking-[-0.06em] normal-case">
                  <s className="text-tertiary">{catalog.priceLabel}</s>
                  <span className="text-ink">$0</span>
                </div>
              ) : (
                <div className="text-[32px] font-bold leading-[1.02] tracking-[-0.06em] normal-case">
                  {catalog.priceLabel}
                </div>
              )}
              <ul
                className="m-0 list-disc space-y-2 pl-5 text-base leading-normal text-muted"
              >
                {catalog.benefits.map((benefit) => (
                  <li key={benefit}>{benefit}</li>
                ))}
              </ul>
              <Primary
                className="mt-auto disabled:text-gray-300"
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
    </div>
  );
}
