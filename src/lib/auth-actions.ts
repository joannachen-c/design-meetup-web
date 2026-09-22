"use server";

import { redirect } from "next/navigation";
import {
  clearAuthCookies,
  passwordSignIn,
  passwordSignUp,
} from "@/lib/auth";
import { ensureProfile } from "@/lib/membership-service";

function safeNext(raw: FormDataEntryValue | null) {
  if (typeof raw !== "string" || !raw.startsWith("/")) return "/portal";
  return raw;
}

export type AuthActionState = {
  error?: string;
};

export async function loginAction(
  _prev: AuthActionState,
  formData: FormData,
): Promise<AuthActionState> {
  const email = String(formData.get("email") || "")
    .trim()
    .toLowerCase();
  const password = String(formData.get("password") || "");
  const next = safeNext(formData.get("next"));

  if (!email || !password) {
    return { error: "Enter your email and password." };
  }

  const result = await passwordSignIn(email, password);
  if (!result.ok) return { error: result.error };

  redirect(next);
}

export async function signupAction(
  _prev: AuthActionState,
  formData: FormData,
): Promise<AuthActionState> {
  const email = String(formData.get("email") || "")
    .trim()
    .toLowerCase();
  const password = String(formData.get("password") || "");
  const next = safeNext(formData.get("next"));

  if (!email || password.length < 8) {
    return { error: "Use a valid email and a password with at least 8 characters." };
  }

  const result = await passwordSignUp(email, password);
  if (!result.ok) return { error: result.error };

  if (result.userId) {
    await ensureProfile({ id: result.userId, email });
  }

  redirect(next.includes("subscribe") ? next : "/portal/subscribe");
}

export async function logoutAction() {
  await clearAuthCookies();
  redirect("/login");
}
