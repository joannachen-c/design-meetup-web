import assert from "node:assert/strict";
import { access, readFile } from "node:fs/promises";
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
  assert.match(welcome, /\$\{input\.origin\}\/design-meetup-logo\.png/);
  assert.match(welcome, /https:\/\/www\.designmeetup\.info/);
  assert.match(welcome, /ctaLabel: "View Account"/);
  assert.match(welcome, /background:\$\{INK\}/);
  assert.match(welcome, /your account is ready\./);
  assert.match(welcome, /hi \$\{firstName\.toLowerCase\(\)\},/);
  assert.match(
    welcome,
    /thanks for creating a design meetup account! we're so excited to have you as part of the community\./,
  );
  assert.match(welcome, /log in anytime to view your membership\./);
  assert.doesNotMatch(welcome, /<svg /);
  assert.match(welcome, /\/email\/\$\{item\.icon\}/);
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
  for (const icon of ["substack.png", "instagram.png", "linkedin.png", "x.png"]) {
    await access(new URL(`public/email/${icon}`, root));
  }
});

test("preview deploys copy Gmail credentials so signup receipts can send", async () => {
  const workflow = await read(".github/workflows/vercel-preview.yml");
  assert.match(workflow, /copy_prod_to_preview GMAIL_USER/);
  assert.match(workflow, /copy_prod_to_preview GMAIL_APP_PASSWORD/);
});

test("graduation upgrade email tells members they are on professional", async () => {
  const welcome = await read("src/lib/welcome-email.ts");
  assert.match(welcome, /export function buildGraduationUpgradeEmail/);
  assert.match(welcome, /export async function sendGraduationUpgradeEmail/);
  assert.match(welcome, /subject: "your design meetup plan"/);
  assert.match(welcome, /you're on professional now\./);
  assert.match(welcome, /moved you to the professional plan/);
});
