import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const root = new URL("../", import.meta.url);
const read = (path) => readFile(new URL(path, root), "utf8");

test("wrong login credentials reveal a forgot-password link", async () => {
  const form = await read("src/components/portal/LoginForm.tsx");
  assert.match(form, /setShowForgotLink\(true\)/);
  assert.match(form, /forgot your password\?/);
  assert.match(form, /mode: "recover"/);
  assert.match(form, /send reset link/);
  assert.match(
    form,
    /if an account exists for that email, we sent a link to reset your password/,
  );
});

test("auth recover does not require a password and always returns ok", async () => {
  const route = await read("app/api/auth/route.ts");
  const auth = await read("src/lib/auth.ts");
  assert.match(route, /mode === "recover"/);
  assert.match(route, /requestPasswordReset\(email, requestOrigin\(request\)\)/);
  assert.match(route, /sent: true/);
  assert.match(auth, /generateLink\(\{/);
  assert.match(auth, /type: "recovery"/);
  assert.match(auth, /\/reset-password/);
  assert.match(auth, /return \{ ok: true as const \}/);
});

test("reset password page captures the recovery session then updates the password", async () => {
  const page = await read("app/reset-password/page.tsx");
  const form = await read("src/components/portal/ResetPasswordForm.tsx");
  const route = await read("app/api/auth/route.ts");
  const auth = await read("src/lib/auth.ts");
  assert.match(page, /choose a new password/);
  assert.match(form, /mode: "recovery-session"/);
  assert.match(form, /mode: "update-password"/);
  assert.match(form, /passwords don't match/);
  assert.match(route, /mode === "update-password"/);
  assert.match(auth, /admin\.updateUserById\(user\.id, \{\s*password/);
});

test("password reset email uses the same chrome as welcome mail", async () => {
  const welcome = await read("src/lib/welcome-email.ts");
  assert.match(welcome, /export function buildPasswordResetEmail/);
  assert.match(welcome, /subject: "reset your design meetup password"/);
  assert.match(welcome, /reset your password\./);
  assert.match(welcome, /ctaLabel: "Reset Password"/);
  assert.match(welcome, /if you didn't ask for this/);
});
