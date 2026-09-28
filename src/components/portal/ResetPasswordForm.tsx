"use client";

import { useEffect, useState, type FormEvent } from "react";
import { Input } from "@/components/Input";
import { Primary } from "@/components/Primary";

function readRecoveryTokens() {
  const hash = new URLSearchParams(
    typeof window === "undefined" ? "" : window.location.hash.replace(/^#/, ""),
  );
  const query = new URLSearchParams(
    typeof window === "undefined" ? "" : window.location.search,
  );
  const access_token =
    hash.get("access_token") || query.get("access_token") || "";
  const refresh_token =
    hash.get("refresh_token") || query.get("refresh_token") || "";
  const type = hash.get("type") || query.get("type") || "";
  const expires_in = Number(hash.get("expires_in") || query.get("expires_in") || "");
  return {
    access_token,
    refresh_token,
    type,
    expires_in: Number.isFinite(expires_in) ? expires_in : undefined,
  };
}

export function ResetPasswordForm({ nextPath }: { nextPath: string }) {
  const [ready, setReady] = useState(false);
  const [linkError, setLinkError] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  useEffect(() => {
    const tokens = readRecoveryTokens();
    if (!tokens.access_token || !tokens.refresh_token) {
      setLinkError("this reset link is invalid or expired.");
      setReady(false);
      return;
    }

    let cancelled = false;
    (async () => {
      try {
        const response = await fetch("/api/auth", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "same-origin",
          body: JSON.stringify({
            mode: "recovery-session",
            access_token: tokens.access_token,
            refresh_token: tokens.refresh_token,
            expires_in: tokens.expires_in,
          }),
        });
        const payload = (await response.json()) as { error?: string };
        if (cancelled) return;
        if (!response.ok) {
          setLinkError(payload.error || "this reset link is invalid or expired.");
          setReady(false);
          return;
        }
        window.history.replaceState(null, "", window.location.pathname);
        setReady(true);
      } catch {
        if (!cancelled) {
          setLinkError("this reset link is invalid or expired.");
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (pending || !ready) return;
    const form = new FormData(event.currentTarget);
    const password = String(form.get("password") || "");
    const confirm = String(form.get("confirm") || "");
    setError(null);
    if (password.length < 8) {
      setError("password must be at least 8 characters.");
      return;
    }
    if (password !== confirm) {
      setError("passwords don't match.");
      return;
    }
    setPending(true);
    try {
      const response = await fetch("/api/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify({
          mode: "update-password",
          password,
          next: nextPath,
        }),
      });
      const payload = (await response.json()) as { error?: string; url?: string };
      if (!response.ok || !payload.url) {
        setError(payload.error || "couldn't update your password. try again.");
        setPending(false);
        return;
      }
      window.location.assign(payload.url);
    } catch {
      setError("couldn't update your password. try again.");
      setPending(false);
    }
  }

  if (linkError) {
    return (
      <div className="grid gap-6 lowercase">
        <p className="m-0 text-base text-red-700" role="alert">
          {linkError}
        </p>
        <a
          className="inline-flex min-h-11 w-fit items-center rounded-[10px] px-4 text-base text-muted no-underline hover:bg-surface-muted hover:text-ink"
          href="/login"
        >
          back to log in
        </a>
      </div>
    );
  }

  if (!ready) {
    return <p className="m-0 text-base text-muted lowercase">checking your reset link…</p>;
  }

  return (
    <form onSubmit={onSubmit} className="grid gap-6 lowercase" noValidate>
      <label className="grid gap-2">
        <span className="text-sm font-bold text-muted">new password</span>
        <Input
          name="password"
          type="password"
          autoComplete="new-password"
          required
          minLength={8}
          placeholder="••••••••"
        />
      </label>
      <label className="grid gap-2">
        <span className="text-sm font-bold text-muted">confirm password</span>
        <Input
          name="confirm"
          type="password"
          autoComplete="new-password"
          required
          minLength={8}
          placeholder="••••••••"
        />
      </label>
      {error ? (
        <p className="m-0 text-base text-red-700" role="alert">
          {error}
        </p>
      ) : null}
      <Primary type="submit" variant="ink" loading={pending} disabled={pending}>
        save password
      </Primary>
    </form>
  );
}