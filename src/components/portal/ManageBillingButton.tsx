"use client";

import { type FormEvent, useState } from "react";
import { Primary } from "@/components/Primary";

const BILLING_ERROR_PATH = "/portal/billing?error=1";

export function ManageBillingButton({
  label = "Manage billing",
  flow,
}: {
  label?: string;
  flow?: "payment_method_update";
}) {
  const [pending, setPending] = useState(false);

  async function openPortal(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (pending) return;
    setPending(true);

    try {
      const response = await fetch("/api/stripe/portal", {
        method: "POST",
        credentials: "same-origin",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
        },
        body: JSON.stringify(flow ? { flow } : {}),
      });
      const raw = await response.text();
      let payload: { url?: string; error?: string } = {};
      if (raw) {
        try {
          payload = JSON.parse(raw) as { url?: string; error?: string };
        } catch {
          window.location.assign(BILLING_ERROR_PATH);
          return;
        }
      }
      if (payload.url) {
        const next = new URL(payload.url, window.location.origin);
        window.location.assign(next.href);
        return;
      }
      window.location.assign(BILLING_ERROR_PATH);
    } catch {
      window.location.assign(BILLING_ERROR_PATH);
    } finally {
      setPending(false);
    }
  }

  return (
    <form
      action="/api/stripe/portal"
      method="post"
      onSubmit={(event) => {
        void openPortal(event);
      }}
      className="grid shrink-0 justify-items-end"
    >
      {flow ? <input type="hidden" name="flow" value={flow} /> : null}
      <Primary
        className="normal-case bg-gray-200! text-ink hover:bg-gray-300! disabled:hover:bg-gray-200!"
        variant="secondary"
        type="submit"
        loading={pending}
        disabled={pending}
      >
        {label}
      </Primary>
    </form>
  );
}
