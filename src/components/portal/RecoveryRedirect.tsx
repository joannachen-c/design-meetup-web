"use client";

import { useEffect } from "react";

function recoveryLocation() {
  if (typeof window === "undefined") return null;
  const hash = new URLSearchParams(window.location.hash.replace(/^#/, ""));
  const query = new URLSearchParams(window.location.search);
  const type = hash.get("type") || query.get("type") || "";
  const tokenHash = hash.get("token_hash") || query.get("token_hash") || "";
  const accessToken = hash.get("access_token") || query.get("access_token") || "";
  const refreshToken =
    hash.get("refresh_token") || query.get("refresh_token") || "";
  const isRecovery = type === "recovery" || Boolean(tokenHash);
  if (!isRecovery) return null;
  if (!tokenHash && !(accessToken && refreshToken)) return null;
  return `/reset-password${window.location.search}${window.location.hash}`;
}

/** Supabase recovery mail often lands on Site URL `/#access_token=…` instead of `/reset-password`. */
export function RecoveryRedirect() {
  useEffect(() => {
    if (window.location.pathname.startsWith("/reset-password")) return;
    const next = recoveryLocation();
    if (next) window.location.replace(next);
  }, []);

  return null;
}
