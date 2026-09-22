"use client";

import { useActionState } from "react";
import { Input } from "@/components/Input";
import { Primary } from "@/components/Primary";
import {
  loginAction,
  signupAction,
  type AuthActionState,
} from "@/lib/auth-actions";

const initial: AuthActionState = {};

export function LoginForm({
  mode,
  nextPath,
}: {
  mode: "login" | "signup";
  nextPath: string;
}) {
  const action = mode === "login" ? loginAction : signupAction;
  const [state, formAction, pending] = useActionState(action, initial);

  return (
    <form action={formAction} className="grid gap-6">
      <input type="hidden" name="next" value={nextPath} />
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
      {state.error ? (
        <p className="m-0 text-base text-red-700" role="alert">
          {state.error}
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
