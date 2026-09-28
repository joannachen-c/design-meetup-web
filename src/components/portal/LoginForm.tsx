"use client";

import { useState, type FormEvent } from "react";
import { Input } from "@/components/Input";
import { Primary } from "@/components/Primary";
import { Tooltip, TooltipProvider } from "@/components/Tooltip";
import {
  SIGNUP_APPLY_URL,
  UNAPPROVED_SIGNUP_ERROR,
} from "@/lib/signup-messages";

function EyeIcon() {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
      className="block"
    >
      <path
        d="M2.5 12s3.5-6.5 9.5-6.5S21.5 12 21.5 12s-3.5 6.5-9.5 6.5S2.5 12 2.5 12Z"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinejoin="round"
      />
      <circle
        cx="12"
        cy="12"
        r="2.75"
        stroke="currentColor"
        strokeWidth="1.75"
      />
    </svg>
  );
}

function EyeOffIcon() {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
      className="block"
    >
      <path
        d="M3 3.75 21 20.25"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
      />
      <path
        d="M9.8 5.1A10.3 10.3 0 0 1 12 4.75c6 0 9.5 6.5 9.5 6.5a15.6 15.6 0 0 1-3.15 3.55M6.4 6.9C3.9 8.7 2.5 12 2.5 12S6 18.5 12 18.5c1.15 0 2.22-.2 3.2-.55"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M10.2 10.35a2.75 2.75 0 0 0 3.55 3.55"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
      />
    </svg>
  );
}

export function LoginForm({
  mode,
  nextPath,
}: {
  mode: "login" | "signup";
  nextPath: string;
}) {
  const [error, setError] = useState<string | null>(null);
  const [emailError, setEmailError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showForgotLink, setShowForgotLink] = useState(false);
  const [view, setView] = useState<"form" | "forgot">("form");
  const [resetSent, setResetSent] = useState(false);

  async function authenticate(
    email: string,
    password: string,
    authMode: "login" | "signup" = mode,
    names?: { firstName?: string; lastName?: string; displayName?: string },
  ) {
    setPending(true);
    setError(null);
    setEmailError(null);

    try {
      const response = await fetch("/api/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify({
          mode: authMode,
          email,
          password,
          firstName: names?.firstName,
          lastName: names?.lastName,
          displayName: names?.displayName,
          next: nextPath,
        }),
      });
      const raw = await response.text();
      let payload: { error?: string; url?: string } = {};
      if (raw) {
        try {
          payload = JSON.parse(raw) as { error?: string; url?: string };
        } catch {
          setError("couldn't sign in. try again in a moment.");
          setPending(false);
          return;
        }
      }
      if (!response.ok || !payload.url) {
        if (authMode === "login") setShowForgotLink(true);
        // Existing demo accounts should land on login, not a dead-end signup error.
        if (
          authMode === "signup" &&
          /already been registered|already registered|exists/i.test(
            payload.error || "",
          )
        ) {
          setError("Account already exists — try logging in instead.");
          setPending(false);
          return;
        }
        if (
          authMode === "signup" &&
          (payload.error === UNAPPROVED_SIGNUP_ERROR ||
            /isn't approved to create an account/i.test(payload.error || ""))
        ) {
          setEmailError(payload.error || UNAPPROVED_SIGNUP_ERROR);
          setPending(false);
          return;
        }
        setError(payload.error || "Something went wrong.");
        setPending(false);
        return;
      }
      try {
        const next = new URL(payload.url, window.location.origin);
        window.location.assign(
          `${next.pathname}${next.search}${next.hash}` || next.href,
        );
      } catch {
        window.location.assign(payload.url);
      }
    } catch {
      setError("Something went wrong. Check your connection and try again.");
      setPending(false);
    }
  }

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    event.stopPropagation();
    if (pending) return;

    const form = new FormData(event.currentTarget);
    const firstName = String(form.get("firstName") || "").trim();
    const lastName = String(form.get("lastName") || "").trim();
    const displayName = firstName
      ? `${firstName} ${lastName}`.trim()
      : String(form.get("displayName") || "").trim();
    const email = String(form.get("email") || "").trim();
    const password = String(form.get("password") || "");
    setError(null);
    setEmailError(null);
    if (view === "forgot") {
      if (!email) {
        setError("enter the email for your account.");
        return;
      }
      setPending(true);
      try {
        const response = await fetch("/api/auth", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "same-origin",
          body: JSON.stringify({ mode: "recover", email, next: nextPath }),
        });
        const raw = await response.text();
        let payload: { error?: string; sent?: boolean } = {};
        if (raw) {
          try {
            payload = JSON.parse(raw) as { error?: string; sent?: boolean };
          } catch {
            setError("couldn't send a reset link. try again in a moment.");
            setPending(false);
            return;
          }
        }
        if (!response.ok) {
          setError(payload.error || "couldn't send a reset link. try again in a moment.");
          setPending(false);
          return;
        }
        setResetSent(true);
        setError(null);
      } catch {
        setError("couldn't send a reset link. try again in a moment.");
      }
      setPending(false);
      return;
    }
    if (mode === "signup" && !firstName) {
      setError("Enter your first name.");
      return;
    }
    if (!email || !password) {
      setError(
        mode === "signup"
          ? "Enter your first name, email, and password."
          : "Enter your email and password.",
      );
      return;
    }
    await authenticate(email, password, mode, {
      firstName,
      lastName,
      displayName,
    });
  }

  return (
    <TooltipProvider>
      <form
        method="post"
        action="/api/auth"
        onSubmit={onSubmit}
        className="grid gap-6 lowercase"
        noValidate
      >
        <input type="hidden" name="mode" value={mode} />
        <input type="hidden" name="next" value={nextPath} />
        {mode === "signup" ? (
          <div className="grid grid-cols-2 gap-3">
            <label className="grid gap-2">
              <span className="text-sm font-bold text-muted">first name</span>
              <Input
                name="firstName"
                type="text"
                autoComplete="given-name"
                required
              />
            </label>
            <label className="grid gap-2">
              <span className="text-sm font-bold text-muted">last name</span>
              <Input
                name="lastName"
                type="text"
                autoComplete="family-name"
              />
            </label>
          </div>
        ) : null}
        <div className="grid gap-2">
          <label className="grid gap-2">
            <span className="text-sm font-bold text-muted">email address</span>
            <Input
              name="email"
              type="email"
              autoComplete="email"
              required
              placeholder="you@example.com"
              aria-invalid={emailError ? true : undefined}
              aria-describedby={emailError ? "signup-email-error" : undefined}
            />
          </label>
          {emailError ? (
            <p
              id="signup-email-error"
              className="m-0 text-sm text-red-700"
              role="alert"
            >
              {emailError}{" "}
              <a
                href={SIGNUP_APPLY_URL}
                target="_blank"
                rel="noreferrer"
                className="text-red-700 underline"
              >
                apply here!
              </a>
            </p>
          ) : null}
        </div>
        {view === "forgot" ? (
          <p className="m-0 text-base text-muted">
            {resetSent
              ? "if an account exists for that email, we sent a link to reset your password."
              : "enter the email for your account. we'll send a link to reset your password."}
          </p>
        ) : (
          <label className="grid gap-2">
            <span className="text-sm font-bold text-muted">password</span>
            <span className="relative block">
              <Input
                name="password"
                type={showPassword ? "text" : "password"}
                autoComplete={
                  mode === "login" ? "current-password" : "new-password"
                }
                required
                minLength={mode === "signup" ? 8 : undefined}
                placeholder="••••••••"
                className="pr-12"
              />
              <Tooltip
                content={showPassword ? "hide password" : "show password"}
              >
                <button
                  type="button"
                  className="absolute top-1/2 right-2 grid size-9 -translate-y-1/2 cursor-pointer place-items-center rounded-full border-0 bg-transparent p-0 text-subtle transition-colors duration-150 ease-out hover:text-muted focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink"
                  aria-label={showPassword ? "hide password" : "show password"}
                  aria-pressed={showPassword}
                  onClick={() => setShowPassword((value) => !value)}
                >
                  {showPassword ? <EyeOffIcon /> : <EyeIcon />}
                </button>
              </Tooltip>
            </span>
          </label>
        )}
        {error ? (
          <p className="m-0 text-base text-red-700" role="alert">
            {error}
          </p>
        ) : null}
        {mode === "login" && view === "form" && showForgotLink ? (
          <button
            type="button"
            className="m-0 cursor-pointer border-0 bg-transparent p-0 text-left text-base text-muted underline decoration-1 underline-offset-4 hover:text-ink"
            onClick={() => {
              setView("forgot");
              setError(null);
              setResetSent(false);
            }}
          >
            forgot your password?
          </button>
        ) : null}
        <div className="mt-2 flex flex-wrap items-center gap-3 lowercase">
          {view === "forgot" ? (
            <>
              {resetSent ? null : (
                <Primary
                  type="submit"
                  variant="ink"
                  loading={pending}
                  disabled={pending}
                >
                  send reset link
                </Primary>
              )}
              <button
                type="button"
                className="inline-flex min-h-11 cursor-pointer items-center rounded-[10px] border-0 bg-transparent px-4 text-base text-muted hover:bg-surface-muted hover:text-ink"
                onClick={() => {
                  setView("form");
                  setError(null);
                  setResetSent(false);
                }}
              >
                back to log in
              </button>
            </>
          ) : (
            <>
              <Primary
                type="submit"
                variant="ink"
                loading={pending}
                disabled={pending}
              >
                {mode === "login" ? "log in" : "create account"}
              </Primary>
              {mode === "login" ? (
                <a
                  className="inline-flex min-h-11 items-center rounded-[10px] px-4 text-base text-muted no-underline hover:bg-surface-muted hover:text-ink"
                  href={`/signup?next=${encodeURIComponent(nextPath)}`}
                >
                  create an account
                </a>
              ) : (
                <a
                  className="inline-flex min-h-11 items-center rounded-[10px] px-4 text-base text-muted no-underline hover:bg-surface-muted hover:text-ink"
                  href={`/login?next=${encodeURIComponent(nextPath)}`}
                >
                  log in
                </a>
              )}
            </>
          )}
        </div>
      </form>
    </TooltipProvider>
  );
}
