import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const root = new URL("../", import.meta.url);
const read = (path) => readFile(new URL(path, root), "utf8");

test("signup sends a welcome email without blocking a failed send", async () => {
  const route = await read("app/api/auth/route.ts");
  const actions = await read("src/lib/auth-actions.ts");
  const welcome = await read("src/lib/welcome-email.ts");
  assert.match(route, /sendWelcomeEmail\(/);
  assert.match(actions, /sendWelcomeEmail\(/);
  assert.match(welcome, /gmailConfigured\(\)/);
  assert.match(welcome, /return \{ ok: false as const \}/);
  assert.doesNotMatch(route, /if \(!\(await sendWelcomeEmail/);
});

test("welcome email is a simple logo, message, View Account CTA, and footer socials", async () => {
  const welcome = await read("src/lib/welcome-email.ts");
  assert.match(welcome, /subject: "your design meetup account"/);
  assert.match(welcome, /\$\{origin\}\/login/);
  assert.match(welcome, /\$\{origin\}\/design-meetup-logo\.png/);
  assert.match(welcome, />View Account</);
  assert.match(welcome, /background:\$\{INK\}/);
  assert.match(welcome, /your account is ready\./);
  assert.match(welcome, /hi \$\{firstName\.toLowerCase\(\)\} — /);
  assert.match(welcome, /<svg /);
  assert.match(welcome, /label: "Substack"/);
  assert.match(welcome, /label: "Instagram"/);
  assert.match(welcome, /label: "LinkedIn"/);
  assert.match(welcome, /label: "X"/);
});

test("welcome email socials match the site footer", async () => {
  const welcome = await read("src/lib/welcome-email.ts");
  const footer = await read("src/components/SiteFooter.tsx");
  for (const href of [
    "https://designmeetup.substack.com/",
    "https://www.instagram.com/designmeetup/",
    "https://www.linkedin.com/company/design-meetup/",
    "https://x.com/designmeetuphq",
  ]) {
    assert.ok(welcome.includes(href), `welcome email missing ${href}`);
    assert.ok(footer.includes(href), `footer missing ${href}`);
  }
});

test("preview deploys copy Gmail credentials so signup receipts can send", async () => {
  const workflow = await read(".github/workflows/vercel-preview.yml");
  assert.match(workflow, /copy_prod_to_preview GMAIL_USER/);
  assert.match(workflow, /copy_prod_to_preview GMAIL_APP_PASSWORD/);
});
