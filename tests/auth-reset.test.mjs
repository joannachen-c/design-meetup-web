import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const root = new URL("../", import.meta.url);
const read = (path) => readFile(new URL(path, root), "utf8");

test("wrong login credentials reveal a forgot-password link", async () => {
  const form = await read("src/components/portal/LoginForm.tsx");
  assert.match(form, /setShowForgotLink\(true\)/);
  assert.match(form, /Forgot your password\?/);
  assert.match(form, /mode: "recover"/);
  assert.match(form, /Send reset link/);
  assert.match(form, /variant="secondary"/);
  assert.match(
    form,
    /If an account exists for that email, we sent a link to reset your password/,
  );
});

test("auth recover sends through supabase HTTP mail, not Vercel SMTP", async () => {
  const route = await read("app/api/auth/route.ts");
  const auth = await read("src/lib/auth.ts");
  const layout = await read("app/layout.tsx");
  const redirect = await read("src/components/portal/RecoveryRedirect.tsx");
  const session = await read("src/lib/auth-session.ts");
  assert.match(route, /mode === "recover"/);
  assert.match(route, /requestPasswordReset\(email, requestOrigin\(request\)\)/);
  assert.match(route, /sent: true/);
  assert.match(auth, /resetPasswordForEmail\(/);
  assert.match(auth, /supabasePublishableOrServiceKey/);
  assert.match(session, /NEXT_PUBLIC_SUPABASE_ANON_KEY/);
  assert.match(session, /supabasePublishableOrServiceKey/);
  assert.match(auth, /redirectTo: `\$\{publicAppUrl\}\/reset-password`/);
  assert.doesNotMatch(auth, /generateLink\(/);
  assert.doesNotMatch(auth, /sendPasswordResetEmail/);
  assert.doesNotMatch(auth, /action_link/);
  assert.match(auth, /return \{ ok: true as const \}/);
  assert.match(layout, /RecoveryRedirect/);
  assert.match(redirect, /\/reset-password/);
  assert.match(redirect, /type === "recovery"/);
});

test("reset password page captures the recovery session then updates the password", async () => {
  const page = await read("app/reset-password/page.tsx");
  const form = await read("src/components/portal/ResetPasswordForm.tsx");
  const route = await read("app/api/auth/route.ts");
  const auth = await read("src/lib/auth.ts");
  const session = await read("src/lib/auth-session.ts");
  assert.match(page, /Choose a new password/);
  assert.match(form, /query.get\("token"\)/);
  assert.match(form, /mode: "update-password"/);
  assert.match(form, /token_hash: tokens.token_hash/);
  assert.doesNotMatch(form, /mode: "recovery-session"/);
  assert.match(route, /token_hash: String\(body.token_hash \|\| ""\)/);
  assert.match(auth, /verifyOtp\(\{/);
  assert.match(auth, /client\.auth\.updateUser\(\{ password \}\)/);
  assert.match(auth, /admin\.updateUserById\(userId, \{\s*password/);
  assert.match(auth, /supabasePublishableOrServiceKey\(\)/);
  const loginForm = await read("src/components/portal/LoginForm.tsx");
  assert.match(loginForm, /mode: "recover"/);
  assert.match(form, /Passwords don't match/);
  assert.match(route, /mode === "update-password"/);
  assert.match(route, /clearAuthCookies\(\)/);
  assert.match(route, /\/login\?reset=1/);
  assert.match(auth, /admin\.updateUserById\(userId, \{\s*password/);
  assert.match(session, /readServerEnv/);
  assert.match(session, /\[SENSITIVE\]/);
  const login = await read("app/login/page.tsx");
  assert.match(login, /Password saved\. Log in with your new password/);
});

test("recovery email template brands Design Meetup and skips Vercel SSO hosts", async () => {
  const template = await read("src/lib/recovery-email.ts");
  const html = await read("public/email/recovery.html");
  const confirm = await read("app/auth/confirm/route.ts");
  assert.match(template, /Choose a new Design Meetup password/);
  for (const source of [template, html]) {
    assert.match(source, /password reset for your Design Meetup account/);
    assert.match(source, /design-meetup-logo\.png/);
    assert.match(
      source,
      /https:\/\/www\.designmeetup\.info\/reset-password\?token_hash=\{\{ \.TokenHash \}\}&type=recovery/,
    );
    assert.doesNotMatch(source, /ConfirmationURL/);
    assert.doesNotMatch(source, /vercel\.app/);
  }
  assert.match(confirm, /publicAppUrl/);
  assert.match(confirm, /\/reset-password/);
  assert.match(confirm, /token_hash/);
});

test("password reset email uses the same chrome as welcome mail", async () => {
  const welcome = await read("src/lib/welcome-email.ts");
  assert.match(welcome, /export function buildPasswordResetEmail/);
  assert.match(welcome, /subject: "Choose a new Design Meetup password"/);
  assert.match(welcome, /heading: "Reset your Design Meetup password"/);
  assert.match(
    welcome,
    /This is a password reset for your Design Meetup account/,
  );
  assert.match(welcome, /ctaLabel: "Reset Password"/);
  assert.match(welcome, /If you didn't ask for this/);
  assert.match(welcome, /function ctaButton/);
  assert.match(welcome, /background:\$\{INK\}/);
  assert.match(welcome, /design-meetup-logo\.png/);
});
