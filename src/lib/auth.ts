import { createClient, type User } from "@supabase/supabase-js";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { randomUUID } from "node:crypto";
import {
  ACCESS_COOKIE,
  LOCAL_DATA_COOKIE,
  LOCAL_SESSION_PREFIX,
  REFRESH_COOKIE,
  REFRESH_COOKIE_MAX_AGE,
  authCookieOptions as cookieOptions,
  decodeLocalSession,
  refreshSession,
  serviceRoleKey,
  supabaseAuthConfigured,
  supabaseUrl,
} from "./auth-session";

/** Server-only admin client. Never import from client components. */
export function createAdminClient() {
  return createClient(supabaseUrl(), serviceRoleKey(), {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

export async function setAuthCookies(session: {
  access_token: string;
  refresh_token: string;
  expires_in?: number;
}) {
  const jar = await cookies();
  const maxAge = session.expires_in ?? 60 * 60 * 24 * 7;
  jar.set(ACCESS_COOKIE, session.access_token, cookieOptions(maxAge));
  jar.set(REFRESH_COOKIE, session.refresh_token, cookieOptions(REFRESH_COOKIE_MAX_AGE));
}

export async function clearAuthCookies() {
  const jar = await cookies();
  jar.set(ACCESS_COOKIE, "", cookieOptions(0));
  jar.set(REFRESH_COOKIE, "", cookieOptions(0));
  jar.set(LOCAL_DATA_COOKIE, "", cookieOptions(0));
}

/** Cookie writes only succeed in Route Handlers / Server Actions; renders skip them. */
async function trySetAuthCookies(session: {
  access_token: string;
  refresh_token: string;
  expires_in?: number;
}) {
  try {
    await setAuthCookies(session);
  } catch {
    // Server Component render: the proxy persists refreshed cookies instead.
  }
}

async function tryClearAuthCookies() {
  try {
    await clearAuthCookies();
  } catch {
    // Server Component render cannot mutate cookies.
  }
}

const DEMO_EMAIL = "demo@designmeetup.info";
const DEMO_PASSWORD = "DemoPortal123!";
const DEMO_USER_ID = "0dc29875-5afe-4501-ac59-4b46ef1c242f";

function encodeLocalSession(user: { id: string; email: string }) {
  return `${LOCAL_SESSION_PREFIX}${Buffer.from(JSON.stringify(user), "utf8").toString("base64url")}`;
}

function localUser(session: { id: string; email: string }): User {
  return {
    id: session.id,
    email: session.email,
    app_metadata: {},
    user_metadata: {},
    aud: "authenticated",
    created_at: new Date().toISOString(),
  } as User;
}

async function setLocalAuthCookies(user: { id: string; email: string }) {
  const token = encodeLocalSession(user);
  await setAuthCookies({
    access_token: token,
    refresh_token: token,
    expires_in: REFRESH_COOKIE_MAX_AGE,
  });
}

async function localPasswordSignIn(email: string, password: string) {
  const normalized = email.trim().toLowerCase();
  if (normalized === DEMO_EMAIL && password === DEMO_PASSWORD) {
    await setLocalAuthCookies({ id: DEMO_USER_ID, email: normalized });
    return { ok: true as const, userId: DEMO_USER_ID };
  }
  return {
    ok: false as const,
    error: "Invalid login credentials",
  };
}

async function localPasswordSignUp(email: string, _password: string) {
  const normalized = email.trim().toLowerCase();
  if (normalized === DEMO_EMAIL) {
    return {
      ok: false as const,
      error: "User already registered",
    };
  }
  const userId = randomUUID();
  await setLocalAuthCookies({ id: userId, email: normalized });
  return { ok: true as const, userId };
}

export async function getSessionUser(): Promise<User | null> {
  const jar = await cookies();
  const access = jar.get(ACCESS_COOKIE)?.value;
  const refresh = jar.get(REFRESH_COOKIE)?.value;
  if (!access && !refresh) return null;

  const local = decodeLocalSession(access) || decodeLocalSession(refresh);
  if (local) return localUser(local);

  if (!supabaseAuthConfigured()) return null;

  try {
    const admin = createAdminClient();

    if (access) {
      const { data, error } = await admin.auth.getUser(access);
      if (!error && data.user) return data.user;
    }

    if (refresh) {
      const next = await refreshSession(refresh);
      if (!next?.access_token) {
        await tryClearAuthCookies();
        return null;
      }
      await trySetAuthCookies(next);
      if (next.user) return next.user;
      const { data } = await admin.auth.getUser(next.access_token);
      return data.user ?? null;
    }
  } catch {
    return null;
  }

  return null;
}

export async function requireUser(nextPath = "/portal") {
  const user = await getSessionUser();
  if (!user) {
    redirect(`/login?next=${encodeURIComponent(nextPath)}`);
  }
  return user;
}

export async function passwordSignIn(email: string, password: string) {
  if (!supabaseAuthConfigured()) {
    return localPasswordSignIn(email, password);
  }
  try {
    const response = await fetch(`${supabaseUrl()}/auth/v1/token?grant_type=password`, {
      method: "POST",
      headers: {
        apikey: serviceRoleKey(),
        Authorization: `Bearer ${serviceRoleKey()}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ email, password }),
    });
    const payload = (await response.json()) as {
      access_token?: string;
      refresh_token?: string;
      expires_in?: number;
      msg?: string;
      error_description?: string;
      error?: string;
    };
    if (!response.ok || !payload.access_token || !payload.refresh_token) {
      return {
        ok: false as const,
        error:
          payload.error_description ||
          payload.msg ||
          payload.error ||
          "Could not sign in.",
      };
    }
    await setAuthCookies({
      access_token: payload.access_token,
      refresh_token: payload.refresh_token,
      expires_in: payload.expires_in,
    });
    return { ok: true as const };
  } catch {
    return {
      ok: false as const,
      error: "couldn't sign in. try again in a moment.",
    };
  }
}

export async function passwordSignUp(email: string, password: string) {
  if (!supabaseAuthConfigured()) {
    return localPasswordSignUp(email, password);
  }
  try {
    const admin = createAdminClient();
    const { data, error } = await admin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
    });
    if (error) {
      return { ok: false as const, error: error.message };
    }
    const signedIn = await passwordSignIn(email, password);
    if (!signedIn.ok) return signedIn;
    return { ok: true as const, userId: data.user?.id ?? null };
  } catch {
    return {
      ok: false as const,
      error: "couldn't sign in. try again in a moment.",
    };
  }
}
