"use client";

import { useState, type FormEvent } from "react";
import { Input } from "@/components/Input";
import { Primary } from "@/components/Primary";

export function LoginForm({
  mode,
  nextPath,
}: {
  mode: "login" | "signup";
  nextPath: string;
}) {
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (pending) return;
    setPending(true);
    setError(null);

    const form = new FormData(event.currentTarget);
    const email = String(form.get("email") || "").trim();
    const password = String(form.get("password") || "");

    try {
      const response = await fetch("/api/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mode,
          email,
          password,
          next: nextPath,
        }),
      });
      const payload = (await response.json()) as {
        error?: string;
        url?: string;
      };
      if (!response.ok || !payload.url) {
        setError(payload.error || "Something went wrong.");
        setPending(false);
        return;
      }
      window.location.href = payload.url;
    } catch {
      setError("Something went wrong.");
      setPending(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="grid gap-6">
      <label className="grid gap-2">
        <span className="text-sm font-bold text-muted">email address</span>
        <Input
          name="email"
          type="email"
          autoComplete="email"
          required
          placeholder="you@example.com"
        />
      </label>
      <label className="grid gap-2">
        <span className="text-sm font-bold text-muted">password</span>
        <Input
          name="password"
          type="password"
          autoComplete={mode === "login" ? "current-password" : "new-password"}
          required
          minLength={mode === "signup" ? 8 : undefined}
          placeholder="••••••••"
        />
      </label>
      {error ? (
        <p className="m-0 text-base text-red-700" role="alert">
          {error}
        </p>
      ) : null}
      <div className="mt-2 flex flex-wrap items-center gap-3">
        <Primary type="submit" variant="ink" loading={pending} disabled={pending}>
          {mode === "login" ? "Log in" : "Create account"}
        </Primary>
        {mode === "login" ? (
          <a
            className="inline-flex min-h-11 items-center rounded-[10px] px-4 text-base text-muted no-underline hover:bg-surface-muted hover:text-ink"
            href={`/signup?next=${encodeURIComponent(nextPath)}`}
          >
            Create an account
          </a>
        ) : (
          <a
            className="inline-flex min-h-11 items-center rounded-[10px] px-4 text-base text-muted no-underline hover:bg-surface-muted hover:text-ink"
            href={`/login?next=${encodeURIComponent(nextPath)}`}
          >
            Log in
          </a>
        )}
      </div>
    </form>
  );
}
