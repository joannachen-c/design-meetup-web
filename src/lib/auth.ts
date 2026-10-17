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
  supabasePublishableOrServiceKey,
  supabaseUrl,
} from "./auth-session";
import {
  isApprovedSignupEmail,
  UNAPPROVED_SIGNUP_ERROR,
} from "./signup-allowlist";
import { publicAppUrl } from "./site";

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

function createUserAuthClient() {
  const key = supabasePublishableOrServiceKey();
  if (!key) {
    throw new Error("Supabase API key is required for password reset.");
  }
  return createClient(supabaseUrl(), key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

export async function requestPasswordReset(email: string, origin: string) {
  const normalized = email.trim().toLowerCase();
  const apiKey = supabasePublishableOrServiceKey();
  if (!normalized || !apiKey) {
    if (normalized && !apiKey) {
      console.error("password reset skipped: missing supabase API key");
    }
    return { ok: true as const };
  }

  try {
    const client = createUserAuthClient();
    // Vercel blocks outbound SMTP (465/587). Gmail IMAP still works, but reset
    // mail has to go through Supabase's HTTP mailer instead of smtp.gmail.com.
    // The public anon key is enough for recover; production already inlines it
    // for the homepage even when the service-role secret is missing.
    const { error } = await client.auth.resetPasswordForEmail(normalized, {
      redirectTo: `${publicAppUrl}/reset-password`,
    });
    console.info("password reset email", {
      via: "supabase",
      delivered: !error,
      error: error?.message,
    });
    if (error) {
      console.error("password reset email was not delivered", error.message);
    }
  } catch (error) {
    console.error("password reset request failed", error);
  }
  return { ok: true as const };
}

export async function setRecoverySession(input: {
  access_token?: string;
  refresh_token?: string;
  token_hash?: string;
  expires_in?: number;
}) {
  const tokenHash = input.token_hash?.trim();
  if (tokenHash) {
    if (!supabasePublishableOrServiceKey()) {
      return {
        ok: false as const,
        error: "This reset link is invalid or expired.",
      };
    }
    try {
      const client = createUserAuthClient();
      const { data, error } = await client.auth.verifyOtp({
        token_hash: tokenHash,
        type: "recovery",
      });
      const session = data.session;
      const userId = data.user?.id;
      if (error || !userId) {
        console.error("recovery verifyOtp failed", error?.message);
        return {
          ok: false as const,
          error: "This reset link is invalid or expired.",
        };
      }
      if (session?.access_token && session.refresh_token) {
        await setAuthCookies({
          access_token: session.access_token,
          refresh_token: session.refresh_token,
          expires_in: session.expires_in,
        });
      }
      return {
        ok: true as const,
        userId,
        access_token: session?.access_token,
      };
    } catch (error) {
      console.error("recovery verifyOtp failed", error);
      return {
        ok: false as const,
        error: "This reset link is invalid or expired.",
      };
    }
  }

  if (!input.access_token || !input.refresh_token) {
    return {
      ok: false as const,
      error: "This reset link is invalid or expired.",
    };
  }
  if (!supabaseAuthConfigured()) {
    const local = decodeLocalSession(input.access_token);
    if (!local) {
      return {
        ok: false as const,
        error: "This reset link is invalid or expired.",
      };
    }
    await setAuthCookies({
      access_token: input.access_token,
      refresh_token: input.refresh_token,
      expires_in: input.expires_in,
    });
    return { ok: true as const, userId: local.id };
  }
  try {
    const admin = createAdminClient();
    const { data, error } = await admin.auth.getUser(input.access_token);
    if (error || !data.user) {
      return {
        ok: false as const,
        error: "This reset link is invalid or expired.",
      };
    }
    await setAuthCookies({
      access_token: input.access_token,
      refresh_token: input.refresh_token,
      expires_in: input.expires_in,
    });
    return { ok: true as const, userId: data.user.id };
  } catch {
    return {
      ok: false as const,
      error: "This reset link is invalid or expired.",
    };
  }
}

export async function updatePassword(
  password: string,
  recovery?: {
    token_hash?: string;
    access_token?: string;
    refresh_token?: string;
    expires_in?: number;
  },
) {
  if (password.length < 8) {
    return {
      ok: false as const,
      error: "Password must be at least 8 characters.",
    };
  }

  if (recovery?.token_hash && supabasePublishableOrServiceKey()) {
    try {
      const client = createUserAuthClient();
      const { data, error } = await client.auth.verifyOtp({
        token_hash: recovery.token_hash.trim(),
        type: "recovery",
      });
      if (error || !data.user) {
        console.error("recovery verifyOtp failed", error?.message);
        return {
          ok: false as const,
          error: "This reset link is invalid or expired.",
        };
      }
      const { error: updateError } = await client.auth.updateUser({ password });
      if (updateError) {
        const message = updateError.message.toLowerCase();
        return {
          ok: false as const,
          error: message.includes("different")
            ? "New password must be different from your current password."
            : updateError.message,
        };
      }
      return { ok: true as const };
    } catch (error) {
      console.error("recovery password update failed", error);
      return {
        ok: false as const,
        error: "Couldn't update your password. Try again in a moment.",
      };
    }
  }

  let userId: string | undefined;
  if (recovery?.access_token) {
    const recovered = await setRecoverySession(recovery);
    if (!recovered.ok) return recovered;
    userId = recovered.userId;
  }
  if (!userId) {
    userId = (await getSessionUser())?.id;
  }
  if (!userId) {
    return {
      ok: false as const,
      error: "This reset link is invalid or expired.",
    };
  }
  if (supabaseAuthConfigured()) {
    try {
      const admin = createAdminClient();
      const { error } = await admin.auth.admin.updateUserById(userId, {
        password,
      });
      if (error) {
        return { ok: false as const, error: error.message };
      }
      return { ok: true as const };
    } catch {
      return {
        ok: false as const,
        error: "Couldn't update your password. Try again in a moment.",
      };
    }
  }
  return { ok: true as const };
}

export async function getSessionUser(): Promise<User | null> {
  const jar = await cookies();
  const access = jar.get(ACCESS_COOKIE)?.value;
  const refresh = jar.get(REFRESH_COOKIE)?.value;
  if (!access && !refresh) return null;

  const local = decodeLocalSession(access) || decodeLocalSession(refresh);
  if (local) return localUser(local);

  if (!supabasePublishableOrServiceKey()) return null;

  try {
    const client = createUserAuthClient();

    if (access) {
      const { data, error } = await client.auth.getUser(access);
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
      const { data } = await client.auth.getUser(next.access_token);
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
  const apiKey = supabasePublishableOrServiceKey();
  if (!apiKey) {
    return localPasswordSignIn(email, password);
  }
  try {
    const response = await fetch(`${supabaseUrl()}/auth/v1/token?grant_type=password`, {
      method: "POST",
      headers: {
        apikey: apiKey,
        Authorization: `Bearer ${apiKey}`,
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
      error: "Couldn't sign in. Try again in a moment.",
    };
  }
}

export async function passwordSignUp(email: string, password: string) {
  if (!isApprovedSignupEmail(email)) {
    return { ok: false as const, error: UNAPPROVED_SIGNUP_ERROR };
  }
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
      error: "Couldn't sign in. Try again in a moment.",
    };
  }
}
