"use client";

import { type FormEvent, useState } from "react";
import { Primary } from "@/components/Primary";

export function ManageBillingButton({
  label = "manage billing",
  flow,
}: {
  label?: string;
  flow?: "payment_method_update";
}) {
  const [pending, setPending] = useState(false);

  async function openPortal(event: FormEvent<HTMLFormElement>) {
    const form = event.currentTarget;
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
          form.submit();
          return;
        }
      }
      if (!response.ok || !payload.url) {
        form.submit();
        return;
      }
      const next = new URL(payload.url, window.location.origin);
      window.location.assign(next.href);
    } catch {
      form.submit();
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
