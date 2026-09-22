"use client";

import { useState } from "react";
import { Primary } from "@/components/Primary";

export function ManageBillingButton() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function openPortal() {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch("/api/stripe/portal", { method: "POST" });
      const payload = (await response.json()) as { url?: string; error?: string };
      if (!response.ok || !payload.url) {
        setError(payload.error || "Could not open billing portal.");
        setLoading(false);
        return;
      }
      window.location.href = payload.url;
    } catch {
      setError("Could not open billing portal.");
      setLoading(false);
    }
  }

  return (
    <div className="grid gap-2">
      <Primary variant="secondary" loading={loading} onClick={openPortal}>
        Manage billing
      </Primary>
      {error ? (
        <p className="m-0 text-sm text-red-700" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}
