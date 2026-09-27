import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import {
  isApprovedSignupEmail,
  UNAPPROVED_SIGNUP_ERROR,
} from "../src/lib/signup-allowlist.ts";

const root = new URL("../", import.meta.url);
const read = (path) => readFile(new URL(path, root), "utf8");

test("sheet and demo emails can sign up, unknown emails cannot", () => {
  assert.equal(isApprovedSignupEmail("demo@designmeetup.info"), true);
  assert.equal(isApprovedSignupEmail("  AngelinaWWU@ucla.edu  "), true);
  assert.equal(isApprovedSignupEmail("sebastianmm.design@gmail.com"), true);
  assert.equal(isApprovedSignupEmail("stranger@example.com"), false);
  assert.equal(isApprovedSignupEmail(""), false);
});

test("unapproved signup error is shown under the email input", async () => {
  const form = await read("src/components/portal/LoginForm.tsx");
  const auth = await read("src/lib/auth.ts");
  const messages = await read("src/lib/signup-messages.ts");
  assert.match(messages, /isn't approved to create an account/);
  assert.match(auth, /isApprovedSignupEmail/);
  assert.match(auth, /UNAPPROVED_SIGNUP_ERROR/);
  assert.match(form, /from "@\/lib\/signup-messages"/);
  assert.doesNotMatch(form, /signup-allowlist/);
  assert.match(form, /setEmailError/);
  const emailInputAt = form.indexOf('name="email"');
  const emailErrorAt = form.indexOf('id="signup-email-error"');
  const passwordAt = form.indexOf('name="password"');
  assert.ok(emailInputAt > 0 && emailErrorAt > emailInputAt && passwordAt > emailErrorAt);
  assert.equal(
    UNAPPROVED_SIGNUP_ERROR,
    "this email isn't approved to create an account.",
  );
});
