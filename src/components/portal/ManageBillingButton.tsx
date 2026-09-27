"use client";

import { useState } from "react";
import { Primary } from "@/components/Primary";
import { Toast } from "@/components/Toast";

export function ManageBillingButton() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function openPortal() {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch("/api/stripe/portal", { method: "POST" });
      const payload = (await response.json()) as {
        url?: string;
        error?: string;
        mock?: boolean;
      };
      if (!response.ok || !payload.url || payload.mock) {
        setError(
          payload.error || "couldn't open billing. try again in a moment.",
        );
        setLoading(false);
        return;
      }
      window.location.href = payload.url;
    } catch {
      setError("couldn't open billing. try again in a moment.");
      setLoading(false);
    }
  }

  return (
    <div className="grid shrink-0 justify-items-end gap-2">
      <Primary
        className="lowercase bg-gray-100! text-ink hover:bg-gray-200! disabled:hover:bg-gray-100!"
        variant="secondary"
        loading={loading}
        onClick={openPortal}
      >
        manage billing
      </Primary>
      {error ? <Toast variant="danger">{error}</Toast> : null}
    </div>
  );
}
