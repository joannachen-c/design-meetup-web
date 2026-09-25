"use client";

import { useState, type FormEvent } from "react";
import { Primary } from "@/components/Primary";
import { TIER_CATALOG, type Tier } from "@/lib/membership";

export function SubscribeButtons({
  currentTier = null,
  memberName = null,
}: {
  currentTier?: Tier | null;
  memberName?: string | null;
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
        // Prefer a full navigation so the server can set cookies / redirect to login.
        form.submit();
        return;
      }
      window.location.assign(payload.url);
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
          else if (isUpgradeTarget) cta = "upgrade";
          else if (isDowngrade) cta = "switch to student";
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
                "flex flex-col gap-6 rounded-[20px] p-6 lowercase",
                isCurrent ? "bg-ink text-white" : "bg-surface-muted text-ink",
              ].join(" ")}
            >
              <input type="hidden" name="tier" value={tier} />
              {memberName ? (
                <p
                  className={[
                    "m-0 text-base",
                    isCurrent ? "text-white/55" : "text-subtle",
                  ].join(" ")}
                >
                  {memberName}
                </p>
              ) : null}
              <div className="flex items-center justify-between gap-3">
                <span className="text-xl font-bold tracking-[-0.04em]">
                  {catalog.name}
                </span>
                {isCurrent ? (
                  <span className="text-sm font-bold text-accent-primary">
                    current
                  </span>
                ) : null}
              </div>
              <div className="text-[32px] font-bold leading-[1.02] tracking-[-0.06em] normal-case">
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
                className="mt-auto lowercase"
                type="submit"
                variant={isCurrent ? "secondary" : "ink"}
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
