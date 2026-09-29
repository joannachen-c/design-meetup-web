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
  const token_hash =
    hash.get("token_hash") ||
    query.get("token_hash") ||
    query.get("token") ||
    "";
  const type = hash.get("type") || query.get("type") || "";
  const expires_in = Number(hash.get("expires_in") || query.get("expires_in") || "");
  return {
    access_token,
    refresh_token,
    token_hash,
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
    if (
      !tokens.token_hash &&
      (!tokens.access_token || !tokens.refresh_token)
    ) {
      setLinkError("This reset link is invalid or expired.");
      setReady(false);
      return;
    }
    setLinkError(null);
    setReady(true);
  }, []);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (pending || !ready) return;
    const tokens = readRecoveryTokens();
    const form = new FormData(event.currentTarget);
    const password = String(form.get("password") || "");
    const confirm = String(form.get("confirm") || "");
    setError(null);
    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }
    if (password !== confirm) {
      setError("Passwords don't match.");
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
          token_hash: tokens.token_hash,
          access_token: tokens.access_token,
          refresh_token: tokens.refresh_token,
          expires_in: tokens.expires_in,
        }),
      });
      const payload = (await response.json()) as { error?: string; url?: string };
      if (!response.ok || !payload.url) {
        setError(payload.error || "Couldn't update your password. Try again.");
        setPending(false);
        return;
      }
      window.location.assign(payload.url);
    } catch {
      setError("Couldn't update your password. Try again.");
      setPending(false);
    }
  }

  if (linkError) {
    return (
      <div className="grid gap-6">
        <p className="m-0 text-base text-red-700" role="alert">
          {linkError}
        </p>
        <Primary href="/login" variant="secondary">
          Back to log in
        </Primary>
      </div>
    );
  }

  if (!ready) {
    return <p className="m-0 text-base text-muted">Checking your reset link…</p>;
  }

  return (
    <form onSubmit={onSubmit} className="grid gap-6" noValidate>
      <label className="grid gap-2">
        <span className="text-sm font-bold text-muted">New password</span>
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
        <span className="text-sm font-bold text-muted">Confirm password</span>
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
        Save password
      </Primary>
    </form>
  );
}
