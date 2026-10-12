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

/**
 * Read a server env var without letting Next.js inline a missing / placeholder
 * value at build time. GitHub Actions `vercel pull` cannot decrypt Sensitive
 * Production secrets, so a static `process.env.SUPABASE_SERVICE_ROLE_KEY` gets
 * baked in as empty and production falls back to local demo auth.
 */
function readServerEnv(name: string) {
  const value = process.env[name];
  if (typeof value !== "string") return "";
  const trimmed = value.trim();
  if (!trimmed || trimmed === "[SENSITIVE]") return "";
  return trimmed;
}

export function supabaseUrl() {
  const fromPublic = (process.env.NEXT_PUBLIC_SUPABASE_URL || "").trim();
  return (
    readServerEnv("SUPABASE_URL") ||
    fromPublic ||
    "https://sngjttldklmgyzebikxv.supabase.co"
  );
}

export function supabaseAuthConfigured() {
  return Boolean(readServerEnv("SUPABASE_SERVICE_ROLE_KEY"));
}

/**
 * Public anon key. Must be a static `process.env.NEXT_PUBLIC_…` read so Next
 * inlines it the same way the homepage loads events. Production already has
 * this key; it does not have the service-role secret at runtime.
 */
export function supabaseAnonKey() {
  const value = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (typeof value !== "string") return "";
  const trimmed = value.trim();
  if (!trimmed || trimmed === "[SENSITIVE]" || trimmed === "your-anon-key") {
    return "";
  }
  return trimmed;
}

/** Service role if present, otherwise the public anon key. Enough for recover + verify. */
export function supabasePublishableOrServiceKey() {
  return readServerEnv("SUPABASE_SERVICE_ROLE_KEY") || supabaseAnonKey();
}

export function serviceRoleKey() {
  const key = readServerEnv("SUPABASE_SERVICE_ROLE_KEY");
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
  if (isLocalSessionToken(refreshToken) || !supabasePublishableOrServiceKey()) {
    return null;
  }
  const apiKey = supabasePublishableOrServiceKey();
  const response = await fetch(
    `${supabaseUrl()}/auth/v1/token?grant_type=refresh_token`,
    {
      method: "POST",
      headers: {
        apikey: apiKey,
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ refresh_token: refreshToken }),
    },
  );
  if (!response.ok) return null;
  return (await response.json()) as RefreshedSession;
}
