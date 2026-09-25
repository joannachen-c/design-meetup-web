"use client";

import { useState } from "react";
import { Primary } from "@/components/Primary";

const DEMO_EMAIL = "demo@designmeetup.info";
const DEMO_PASSWORD = "DemoPortal123!";

export function DemoLoginButton({ nextPath = "/portal" }: { nextPath?: string }) {
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function continueAsDemo() {
    if (pending) return;
    setPending(true);
    setError(null);
    try {
      const response = await fetch("/api/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify({
          mode: "login",
          email: DEMO_EMAIL,
          password: DEMO_PASSWORD,
          next: nextPath,
        }),
      });
      const payload = (await response.json()) as { url?: string; error?: string };
      if (!response.ok || !payload.url) {
        setError(payload.error || "Demo login failed.");
        setPending(false);
        return;
      }
      window.location.assign(payload.url);
    } catch {
      setError("Demo login failed. Try again.");
      setPending(false);
    }
  }

  return (
    <div className="mt-8 grid gap-3">
      <Primary
        type="button"
        variant="secondary"
        loading={pending}
        disabled={pending}
        onClick={continueAsDemo}
      >
        continue with demo account
      </Primary>
      {error ? (
        <p className="m-0 text-base text-red-700" role="alert">
          {error}
        </p>
      ) : (
        <p className="m-0 text-sm text-subtle lowercase">
          demo@designmeetup.info · DemoPortal123!
        </p>
      )}
    </div>
  );
}
