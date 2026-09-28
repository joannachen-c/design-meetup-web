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

test("welcome email uses the account-ready copy and calendar link", async () => {
  const welcome = await read("src/lib/welcome-email.ts");
  assert.match(welcome, /subject: "Welcome to Design Meetup"/);
  assert.match(
    welcome,
    /export const CALENDAR_URL = `\$\{PUBLIC_HOME_URL\}\/#calendar`/,
  );
  assert.match(welcome, /Hi \$\{firstName\},/);
  assert.match(welcome, /"Hi,"/);
  assert.match(
    welcome,
    /Your Design Meetup account is officially set up\. Welcome to the community!/,
  );
  assert.match(welcome, /You can now:/);
  assert.match(welcome, /Connect with designers in the Slack community/);
  assert.match(welcome, /Get early and guaranteed access to our events/);
  assert.match(
    welcome,
    /Take a look at what's coming up in NYC\/SF\/LA \$\{calendarLink\}\./,
  );
  assert.match(welcome, />here<\/a>/);
  assert.match(welcome, /&lt;3,/);
  assert.match(welcome, /"<3,"/);
  assert.match(welcome, /ctaButton\("View Account", loginUrl\)/);
  assert.match(welcome, /View Account: \$\{loginUrl\}/);
  assert.match(welcome, /https:\/\/www\.designmeetup\.info/);
  assert.match(welcome, /\$\{input\.origin\}\/design-meetup-logo\.png/);
  assert.match(welcome, /\/email\/\$\{item\.icon\}/);
  assert.doesNotMatch(welcome, /<svg /);
  assert.doesNotMatch(
    welcome,
    /thanks for creating a design meetup account/,
  );
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
  assert.match(welcome, /ctaLabel: "View Account"/);
});
