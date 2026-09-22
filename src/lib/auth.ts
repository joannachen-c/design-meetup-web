import { createClient, type User } from "@supabase/supabase-js";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

const ACCESS_COOKIE = "dm_access_token";
const REFRESH_COOKIE = "dm_refresh_token";

function supabaseUrl() {
  return (
    process.env.SUPABASE_URL ||
    process.env.NEXT_PUBLIC_SUPABASE_URL ||
    "https://sngjttldklmgyzebikxv.supabase.co"
  );
}

function serviceRoleKey() {
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!key) {
    throw new Error("SUPABASE_SERVICE_ROLE_KEY is required for member auth.");
  }
  return key;
}

/** Server-only admin client. Never import from client components. */
export function createAdminClient() {
  return createClient(supabaseUrl(), serviceRoleKey(), {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

function cookieOptions(maxAge: number) {
  return {
    httpOnly: true,
    sameSite: "lax" as const,
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge,
  };
}

export async function setAuthCookies(session: {
  access_token: string;
  refresh_token: string;
  expires_in?: number;
}) {
  const jar = await cookies();
  const maxAge = session.expires_in ?? 60 * 60 * 24 * 7;
  jar.set(ACCESS_COOKIE, session.access_token, cookieOptions(maxAge));
  jar.set(REFRESH_COOKIE, session.refresh_token, cookieOptions(60 * 60 * 24 * 30));
}

export async function clearAuthCookies() {
  const jar = await cookies();
  jar.set(ACCESS_COOKIE, "", cookieOptions(0));
  jar.set(REFRESH_COOKIE, "", cookieOptions(0));
}

async function refreshSession(refreshToken: string) {
  const response = await fetch(`${supabaseUrl()}/auth/v1/token?grant_type=refresh_token`, {
    method: "POST",
    headers: {
      apikey: serviceRoleKey(),
      Authorization: `Bearer ${serviceRoleKey()}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ refresh_token: refreshToken }),
  });
  if (!response.ok) return null;
  return (await response.json()) as {
    access_token: string;
    refresh_token: string;
    expires_in?: number;
    user?: User;
  };
}

export async function getSessionUser(): Promise<User | null> {
  const jar = await cookies();
  let access = jar.get(ACCESS_COOKIE)?.value;
  const refresh = jar.get(REFRESH_COOKIE)?.value;
  if (!access && !refresh) return null;

  const admin = createAdminClient();

  if (access) {
    const { data, error } = await admin.auth.getUser(access);
    if (!error && data.user) return data.user;
  }

  if (refresh) {
    const next = await refreshSession(refresh);
    if (!next?.access_token) {
      await clearAuthCookies();
      return null;
    }
    await setAuthCookies(next);
    if (next.user) return next.user;
    const { data } = await admin.auth.getUser(next.access_token);
    return data.user ?? null;
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
}

export async function passwordSignUp(email: string, password: string) {
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
}
