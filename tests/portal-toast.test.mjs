import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const root = new URL("../", import.meta.url);
const read = (path) => readFile(new URL(path, root), "utf8");

test("sonner is a production dependency", async () => {
  const pkg = JSON.parse(await read("package.json"));
  assert.ok(pkg.dependencies.sonner);
});

test("the root layout mounts a bottom toaster that renders the design-system Toast", async () => {
  const layout = await read("app/layout.tsx");
  const toaster = await read("src/components/AppToaster.tsx");
  const toast = await read("src/components/Toast.tsx");
  assert.match(layout, /import \{ AppToaster \} from "@\/components\/AppToaster"/);
  assert.match(layout, /<AppToaster \/>/);
  assert.match(toaster, /from "sonner"/);
  assert.match(toaster, /from "@\/components\/Toast"/);
  assert.match(toaster, /toast\.custom/);
  assert.match(toaster, /<Toast variant="success" className="whitespace-nowrap" icon=\{<ToastCheckIcon \/>\}>/);
  assert.match(toaster, /position="bottom-center"/);
  assert.match(toast, /success: "bg-surface-muted text-ink"/);
  assert.match(toast, /text-accent-primary/);
  assert.match(toast, /font-normal/);
  assert.doesNotMatch(toaster, /#22c55e/);
});

test("saving the profile fires a Sonner success toast instead of a page flash", async () => {
  const form = await read("src/components/portal/ProfileForm.tsx");
  const page = await read("app/portal/profile/page.tsx");
  const api = await read("app/api/portal/profile/route.ts");
  const saved = await read("src/components/portal/ProfileSavedToast.tsx");

  assert.match(form, /showSuccessToast\("Profile updated\."\)/);
  assert.match(form, /Accept: "application\/json"/);
  assert.doesNotMatch(form, /window\.location\.assign\("\/portal\/profile\?saved=1"\)/);
  assert.match(page, /<ProfileSavedToast saved=\{params\.saved === "1"\} \/>/);
  assert.match(saved, /showSuccessToast\("Profile updated\."\)/);
  assert.match(api, /wantsJson/);
  assert.match(api, /headers\.get\("accept"\)/);
});
