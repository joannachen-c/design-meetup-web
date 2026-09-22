"use client";

import { useState } from "react";
import { Primary } from "@/components/Primary";
import { TIER_CATALOG, type Tier } from "@/lib/membership";

export function SubscribeButtons({
  currentTier = null,
}: {
  currentTier?: Tier | null;
}) {
  const [busy, setBusy] = useState<Tier | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function startCheckout(tier: Tier) {
    setBusy(tier);
    setError(null);
    try {
      const response = await fetch("/api/stripe/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tier }),
      });
      const payload = (await response.json()) as { url?: string; error?: string };
      if (!response.ok || !payload.url) {
        setError(payload.error || "Could not start checkout.");
        setBusy(null);
        return;
      }
      window.location.href = payload.url;
    } catch {
      setError("Could not start checkout.");
      setBusy(null);
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
          else if (isUpgradeTarget) cta = "Upgrade";
          else if (isDowngrade) cta = "Switch to Student";
          else if (!currentTier) cta = "Get started";

          return (
            <div
              key={tier}
              className={[
                "flex flex-col gap-6 rounded-[11px] border p-6",
                isCurrent
                  ? "border-ink bg-ink text-white"
                  : "border-gray-200 bg-white text-ink",
              ].join(" ")}
            >
              <div className="flex items-center justify-between gap-3">
                <span className="text-xl font-bold tracking-[-0.04em]">
                  {catalog.name}
                </span>
                {isCurrent ? (
                  <span className="text-sm font-bold text-accent-primary">
                    Current
                  </span>
                ) : null}
              </div>
              <div className="text-[32px] font-bold leading-[1.02] tracking-[-0.06em]">
                {catalog.priceLabel}
              </div>
              <p
                className={[
                  "m-0 text-base leading-normal",
                  isCurrent ? "text-white/75" : "text-muted",
                ].join(" ")}
              >
                {catalog.body}
              </p>
              <Primary
                className="mt-auto"
                variant={isCurrent ? "secondary" : "ink"}
                disabled={isCurrent || busy != null}
                loading={busy === tier}
                onClick={() => startCheckout(tier)}
              >
                {cta}
              </Primary>
            </div>
          );
        })}
      </div>
      {error ? (
        <p className="m-0 text-base text-red-700" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}
