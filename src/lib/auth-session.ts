import type { User } from "@supabase/supabase-js";

export const ACCESS_COOKIE = "dm_access_token";
export const REFRESH_COOKIE = "dm_refresh_token";
export const LOCAL_DATA_COOKIE = "dm_local_data";
export const REFRESH_COOKIE_MAX_AGE = 60 * 60 * 24 * 30;
export const LOCAL_SESSION_PREFIX = "local.";

export function isLocalSessionToken(token: string | undefined) {
  return Boolean(token?.startsWith(LOCAL_SESSION_PREFIX));
}

export function decodeLocalSession(token: string | undefined) {
  if (!isLocalSessionToken(token) || !token) return null;
  try {
    const parsed = JSON.parse(
      Buffer.from(token.slice(LOCAL_SESSION_PREFIX.length), "base64url").toString(
        "utf8",
      ),
    ) as { id?: string; email?: string };
    if (parsed.id && parsed.email) return { id: parsed.id, email: parsed.email };
  } catch {
    return null;
  }
  return null;
}

export type RefreshedSession = {
  access_token: string;
  refresh_token: string;
  expires_in?: number;
  user?: User;
};

export function supabaseUrl() {
  return (
    process.env.SUPABASE_URL ||
    process.env.NEXT_PUBLIC_SUPABASE_URL ||
    "https://sngjttldklmgyzebikxv.supabase.co"
  );
}

export function supabaseAuthConfigured() {
  return Boolean(process.env.SUPABASE_SERVICE_ROLE_KEY?.trim());
}

export function serviceRoleKey() {
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();
  if (!key) {
    throw new Error("SUPABASE_SERVICE_ROLE_KEY is required for member auth.");
  }
  return key;
}

export function authCookieOptions(maxAge: number) {
  return {
    httpOnly: true,
    sameSite: "lax" as const,
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge,
  };
}

/** True when the JWT is missing, unreadable, or expires within `skewSeconds`. */
export function accessTokenExpired(token: string | undefined, skewSeconds = 60) {
  if (!token) return true;
  // Demo/preview sessions are not JWTs; treating them as expired would clear login.
  if (isLocalSessionToken(token)) return false;
  const payload = token.split(".")[1];
  if (!payload) return true;
  try {
    const json = JSON.parse(
      Buffer.from(payload.replace(/-/g, "+").replace(/_/g, "/"), "base64").toString(
        "utf8",
      ),
    ) as { exp?: number };
    if (typeof json.exp !== "number") return true;
    return json.exp - skewSeconds <= Math.floor(Date.now() / 1000);
  } catch {
    return true;
  }
}

export async function refreshSession(
  refreshToken: string,
): Promise<RefreshedSession | null> {
  if (isLocalSessionToken(refreshToken) || !supabaseAuthConfigured()) {
    return null;
  }
  const response = await fetch(
    `${supabaseUrl()}/auth/v1/token?grant_type=refresh_token`,
    {
      method: "POST",
      headers: {
        apikey: serviceRoleKey(),
        Authorization: `Bearer ${serviceRoleKey()}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ refresh_token: refreshToken }),
    },
  );
  if (!response.ok) return null;
  return (await response.json()) as RefreshedSession;
}
