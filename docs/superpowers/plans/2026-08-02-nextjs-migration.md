# Next.js Migration Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Migrate design-meetup-web from Vite + React SPA to Next.js App Router with hybrid server/client event loading, preserving UI parity.

**Architecture:** App Router with `app/layout.tsx`, server `app/page.tsx` that fetches past events and passes `initialEvents` / `initialError` into a `"use client"` `HomePage`, plus `app/design-system/page.tsx`. Tailwind 4 via `@tailwindcss/postcss`. Remove Vite entrypoints.

**Tech Stack:** Next.js (latest stable App Router), React 19, TypeScript, Tailwind CSS 4, Motion, Radix Tooltip, Supabase JS, Node test runner.

## Global Constraints

- Follow `docs/superpowers/specs/2026-08-02-nextjs-migration-design.md` exactly.
- Do **not** split `HomePage` into section files, add `next/image` sweep, or add per-event routes.
- Env rename: `VITE_SUPABASE_*` → `NEXT_PUBLIC_SUPABASE_*`.
- Keep existing seed scripts; only update env names they document if they reference `VITE_`.
- Preserve visual/interaction behavior of the current home and design-system pages.
- Working branch may already have uncommitted design-system WIP (`src/DesignSystem.tsx`, `IconButton`, related tests) — treat those as part of the codebase to migrate, not delete them.
- Commit after each task.

---

## File Structure

| Path | Responsibility |
|---|---|
| `app/layout.tsx` | Root HTML, metadata, global CSS import |
| `app/page.tsx` | Server Component: fetch events, render `HomePage` |
| `app/design-system/page.tsx` | Design system route |
| `app/globals.css` | Migrated from `src/styles.css` |
| `src/components/HomePage.tsx` | Former `App.tsx`; `"use client"`; props-driven events |
| `src/DesignSystem.tsx` | Specimen page; add `"use client"` |
| `src/lib/supabase.ts` | `NEXT_PUBLIC_*` env; unchanged fetch API |
| `next.config.ts` | Next config |
| `postcss.config.mjs` | `@tailwindcss/postcss` |
| `package.json` | Next scripts; drop Vite |
| `tsconfig.json` | Next-compatible TS config |
| `.gitignore` | Add `.next` |
| `.env.example` | `NEXT_PUBLIC_*` names |
| `tests/*.test.mjs` | Retarget Vite/App paths to Next/HomePage |

**Delete after migration:** `vite.config.ts`, `index.html`, `src/main.tsx`, `src/vite-env.d.ts`, `src/App.tsx`, `src/styles.css` (moved to `app/globals.css`).

---

### Task 1: Failing tests for Next toolchain + routes

**Files:**
- Modify: `tests/tailwind.test.mjs`
- Modify: `tests/design-system.test.mjs`
- Create: `tests/next-app-router.test.mjs`

**Interfaces:**
- Consumes: none (test-first)
- Produces: failing assertions that lock Next package scripts, PostCSS Tailwind, App Router files, and hybrid home props

- [ ] **Step 1: Rewrite Tailwind integration tests for Next/PostCSS**

Replace Vite-plugin assertions in `tests/tailwind.test.mjs` with:

```js
import assert from "node:assert/strict";
import { access, readFile } from "node:fs/promises";
import test from "node:test";

const root = new URL("../", import.meta.url);
const home = await readFile(new URL("src/components/HomePage.tsx", root), "utf8").catch(() => "");
const appLegacy = await readFile(new URL("src/App.tsx", root), "utf8").catch(() => "");
const app = home || appLegacy;
const css = await readFile(
  new URL("app/globals.css", root),
  "utf8",
).catch(() => readFile(new URL("src/styles.css", root), "utf8"));
const layout = await readFile(new URL("app/layout.tsx", root), "utf8").catch(() => "");
const primary = await readFile(
  new URL("src/components/Primary.tsx", root),
  "utf8",
);
const packageJson = JSON.parse(
  await readFile(new URL("package.json", root), "utf8"),
);
const postcssConfig = await readFile(
  new URL("postcss.config.mjs", root),
  "utf8",
).catch(() => "");

test("Tailwind v4 is integrated through the Next PostCSS plugin", () => {
  assert.match(packageJson.dependencies.tailwindcss, /^\^4\./);
  assert.ok(
    packageJson.dependencies["@tailwindcss/postcss"] ||
      packageJson.devDependencies["@tailwindcss/postcss"],
  );
  assert.doesNotMatch(
    JSON.stringify(packageJson),
    /@tailwindcss\/vite/,
  );
  assert.match(postcssConfig, /@tailwindcss\/postcss/);
  assert.match(css, /@import ["']tailwindcss["']/);
  assert.match(layout, /globals\.css/);
});

test("the primary accent token colors buttons and text selection", () => {
  assert.match(css, /--color-accent-primary:\s*#ecf26d/);
  assert.match(
    css,
    /::selection\s*\{[^}]*background-color:\s*var\(--color-accent-primary\)/s,
  );
  assert.match(primary, /\bbg-accent-primary\b/);
});

test("requested style categories live in Tailwind utilities", () => {
  assert.match(app, /text-\[clamp\(/);
  assert.match(app, /px-\[clamp\(/);
  assert.match(app, /rounded-\[/);
  assert.match(app, /bg-\[#/);
  assert.doesNotMatch(
    css
      .replace(/@font-face\s*\{[^}]*\}/gs, "")
      .replace(/::selection\s*\{[^}]*\}/gs, ""),
    /^\s*(?:padding(?:-(?:top|right|bottom|left|block|inline))?|border-radius|color|background(?:-color)?|font-size|font-weight|line-height|letter-spacing|text-align|text-decoration|text-transform|text-wrap)\s*:/m,
  );
});

test("browser favicon uses the existing Design Meetup logo", async () => {
  assert.match(
    layout,
    /design-meetup-logo\.png/,
  );
  assert.doesNotMatch(layout, /vite\.svg/i);
  await access(new URL("public/design-meetup-logo.png", root));
});

test("only headings use the tight tracking value", () => {
  assert.doesNotMatch(
    app,
    /<main className="[^"]*tracking-\[-0\.06em\][^"]*"/,
  );
  const headings = [...app.matchAll(/<h[1-6][^>]*className="([^"]*)"/g)];
  assert.ok(headings.length > 0);
  assert.ok(
    headings.every(([, className]) =>
      className.includes("tracking-[-0.06em]"),
    ),
  );
  assert.doesNotMatch(app, /<p className="[^"]*tracking-\[-0\.06em\]/);
});
```

- [ ] **Step 2: Rewrite design-system route tests for App Router**

In `tests/design-system.test.mjs`, change the route test and source paths:

```js
const [app, designSystem, iconButton, designSystemPage, styles] =
  await Promise.all([
    readSource("src/components/HomePage.tsx").catch(() =>
      readSource("src/App.tsx"),
    ),
    readSource("src/DesignSystem.tsx").catch(() => ""),
    readSource("src/components/IconButton.tsx").catch(() => ""),
    readSource("app/design-system/page.tsx").catch(() => ""),
    readSource("app/globals.css").catch(() => readSource("src/styles.css")),
  ]);

test("the design system is available at its own App Router route", () => {
  assert.match(designSystemPage, /DesignSystem/);
  assert.match(designSystemPage, /from ["']@\/DesignSystem["']|from ["']\.\.\/\.\.\/src\/DesignSystem["']|from ["']@\/src\/DesignSystem["']/);
});
```

Keep the remaining specimen/content tests unchanged (they assert on `designSystem` / `iconButton` / `styles` / `app` source). Where those tests still read `src/styles.css` or `src/App.tsx` via the old `styles`/`app` bindings, the fallbacks above cover the transition.

If other tests in this file assert on `main`, replace those references with `designSystemPage` or drop Vite-only checks.

- [ ] **Step 3: Add Next App Router + hybrid data smoke tests**

Create `tests/next-app-router.test.mjs`:

```js
import assert from "node:assert/strict";
import { access, readFile } from "node:fs/promises";
import test from "node:test";

const root = new URL("../", import.meta.url);
const read = (path) => readFile(new URL(path, root), "utf8");

test("package scripts use Next.js", async () => {
  const pkg = JSON.parse(await read("package.json"));
  assert.match(pkg.scripts.dev, /\bnext dev\b/);
  assert.match(pkg.scripts.build, /\bnext build\b/);
  assert.match(pkg.scripts.start, /\bnext start\b/);
  assert.equal(pkg.scripts.preview, undefined);
  assert.ok(pkg.dependencies.next || pkg.devDependencies.next);
  assert.equal(pkg.dependencies?.vite, undefined);
  assert.equal(pkg.devDependencies?.vite, undefined);
});

test("App Router pages exist for home and design-system", async () => {
  await access(new URL("app/layout.tsx", root));
  await access(new URL("app/page.tsx", root));
  await access(new URL("app/design-system/page.tsx", root));
});

test("home server page fetches events and passes hybrid props", async () => {
  const page = await read("app/page.tsx");
  assert.match(page, /fetchPastEvents/);
  assert.match(page, /initialEvents/);
  assert.match(page, /initialError/);
  assert.match(page, /HomePage/);
  assert.doesNotMatch(page, /["']use client["']/);
});

test("HomePage is a client component driven by initial props", async () => {
  const home = await read("src/components/HomePage.tsx");
  assert.match(home, /["']use client["']/);
  assert.match(home, /initialEvents/);
  assert.match(home, /initialError/);
  assert.doesNotMatch(home, /fetchPastEvents\(\)/);
});

test("Supabase env uses NEXT_PUBLIC_ prefix", async () => {
  const supabase = await read("src/lib/supabase.ts");
  const envExample = await read(".env.example");
  assert.match(supabase, /NEXT_PUBLIC_SUPABASE_URL/);
  assert.match(supabase, /NEXT_PUBLIC_SUPABASE_ANON_KEY/);
  assert.doesNotMatch(supabase, /import\.meta\.env/);
  assert.doesNotMatch(supabase, /VITE_SUPABASE_/);
  assert.match(envExample, /NEXT_PUBLIC_SUPABASE_URL=/);
  assert.match(envExample, /NEXT_PUBLIC_SUPABASE_ANON_KEY=/);
});

test("Vite entrypoints are removed", async () => {
  for (const path of [
    "vite.config.ts",
    "index.html",
    "src/main.tsx",
    "src/App.tsx",
    "src/vite-env.d.ts",
  ]) {
    await assert.rejects(() => access(new URL(path, root)));
  }
});
```

- [ ] **Step 4: Run tests to verify they fail**

Run: `npm test`

Expected: FAIL on missing `app/`, `HomePage.tsx`, Next scripts, PostCSS config, etc.

- [ ] **Step 5: Commit**

```bash
git add tests/tailwind.test.mjs tests/design-system.test.mjs tests/next-app-router.test.mjs
git commit -m "$(cat <<'EOF'
Add failing tests for Next.js App Router migration.

EOF
)"
```

---

### Task 2: Next.js toolchain and Tailwind PostCSS

**Files:**
- Modify: `package.json`
- Create: `next.config.ts`
- Create: `postcss.config.mjs`
- Modify: `tsconfig.json`
- Modify: `.gitignore`
- Modify: `.env.example`
- Delete after install settles: Vite-only deps from lockfile via npm uninstall

**Interfaces:**
- Consumes: failing tests from Task 1
- Produces: `next` / `@tailwindcss/postcss` installed; `npm run build` runnable once app files exist (may still fail without `app/`)

- [ ] **Step 1: Install Next and PostCSS Tailwind; remove Vite**

```bash
npm install next@latest
npm install -D @tailwindcss/postcss
npm uninstall vite @vitejs/plugin-react @tailwindcss/vite agentation
```

Keep `tailwindcss` `^4` in dependencies (already present). Keep `react` / `react-dom` as-is.

- [ ] **Step 2: Update `package.json` scripts**

Set scripts to:

```json
{
  "dev": "next dev",
  "build": "next build",
  "start": "next start",
  "test": "node --test tests/*.test.mjs",
  "seed:events": "node scripts/seed-events.mjs",
  "seed:galleries": "node scripts/seed-galleries.mjs",
  "refresh:summaries": "node scripts/refresh-event-summaries.mjs",
  "seed:sponsors": "node scripts/seed-sponsors.mjs",
  "upload:sponsor-logos": "node scripts/upload-sponsor-logos.mjs"
}
```

Remove `"type": "module"` only if it breaks Next (Next supports it; keep `"type": "module"` unless `next build` errors — prefer keep).

- [ ] **Step 3: Add `next.config.ts`**

```ts
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
};

export default nextConfig;
```

- [ ] **Step 4: Add `postcss.config.mjs`**

```js
export default {
  plugins: {
    "@tailwindcss/postcss": {},
  },
};
```

- [ ] **Step 5: Replace `tsconfig.json` with Next-compatible config**

```json
{
  "compilerOptions": {
    "target": "ES2017",
    "lib": ["dom", "dom.iterable", "esnext"],
    "allowJs": false,
    "skipLibCheck": true,
    "strict": true,
    "noEmit": true,
    "esModuleInterop": true,
    "module": "esnext",
    "moduleResolution": "bundler",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "jsx": "preserve",
    "incremental": true,
    "plugins": [{ "name": "next" }],
    "paths": {
      "@/*": ["./src/*"]
    }
  },
  "include": ["next-env.d.ts", "**/*.ts", "**/*.tsx", ".next/types/**/*.ts"],
  "exclude": ["node_modules"]
}
```

- [ ] **Step 6: Update `.gitignore` and `.env.example`**

Append to `.gitignore`:

```
.next
out
```

Replace Vite env lines in `.env.example`:

```
NEXT_PUBLIC_SUPABASE_URL=https://sngjttldklmgyzebikxv.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_URL=https://sngjttldklmgyzebikxv.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

Also rename keys in local `.env.local` (do not commit): `VITE_SUPABASE_URL` → `NEXT_PUBLIC_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY` → `NEXT_PUBLIC_SUPABASE_ANON_KEY`.

- [ ] **Step 7: Commit**

```bash
git add package.json package-lock.json next.config.ts postcss.config.mjs tsconfig.json .gitignore .env.example
git commit -m "$(cat <<'EOF'
Swap Vite toolchain for Next.js and Tailwind PostCSS.

EOF
)"
```

---

### Task 3: Supabase env + global CSS + root layout

**Files:**
- Modify: `src/lib/supabase.ts`
- Create: `app/globals.css` (copy of `src/styles.css`)
- Create: `app/layout.tsx`
- Delete later (Task 6): `src/styles.css`

**Interfaces:**
- Consumes: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- Produces: `fetchPastEvents(): Promise<MeetupEvent[]>` unchanged signature; root layout with metadata + favicon

- [ ] **Step 1: Update `src/lib/supabase.ts` env reads**

Replace:

```ts
const url = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;
```

with:

```ts
const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
```

Update the thrown error message string to mention `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY`.

Leave `fetchPastEvents` and types unchanged.

- [ ] **Step 2: Create `app/globals.css`**

Copy entire contents of `src/styles.css` to `app/globals.css` (keep `@import "tailwindcss";` and `@theme` block as-is).

- [ ] **Step 3: Create `app/layout.tsx`**

```tsx
import type { Metadata } from "next";
import type { ReactNode } from "react";
import "./globals.css";

export const metadata: Metadata = {
  title: "Design Meetup",
  description:
    "Design Meetup brings ambitious, early-career designers together.",
  icons: {
    icon: [{ url: "/design-meetup-logo.png", type: "image/png" }],
  },
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
```

- [ ] **Step 4: Smoke-check TypeScript on supabase**

Run: `npx tsc --noEmit -p tsconfig.json`  
Expected: may still error on missing pages/HomePage; `supabase.ts` itself should not error on `import.meta`.

- [ ] **Step 5: Commit**

```bash
git add src/lib/supabase.ts app/globals.css app/layout.tsx
git commit -m "$(cat <<'EOF'
Add Next root layout, globals CSS, and NEXT_PUBLIC Supabase env.

EOF
)"
```

---

### Task 4: Client `HomePage` with hybrid props

**Files:**
- Create: `src/components/HomePage.tsx` (from `src/App.tsx`)
- Modify imports inside that file only as needed

**Interfaces:**
- Consumes: `MeetupEvent` from `@/lib/supabase`
- Produces:

```ts
export type HomePageProps = {
  initialEvents: MeetupEvent[];
  initialError: string | null;
};

export default function HomePage(props: HomePageProps): JSX.Element;
```

- [ ] **Step 1: Copy `App.tsx` → `HomePage.tsx` and add client directive + props**

1. Copy `src/App.tsx` to `src/components/HomePage.tsx`.
2. Add as first line: `"use client";`
3. Rename `export default function App` → `export default function HomePage`.
4. Add props type and parameters:

```tsx
import { fetchPastEvents, type MeetupEvent } from "@/lib/supabase";
// after copy, REMOVE fetchPastEvents from the import — keep only type MeetupEvent:
import type { MeetupEvent } from "@/lib/supabase";

export type HomePageProps = {
  initialEvents: MeetupEvent[];
  initialError: string | null;
};

export default function HomePage({
  initialEvents,
  initialError,
}: HomePageProps) {
```

5. Replace initial state so server data drives first paint:

```tsx
const [events, setEvents] = useState<MeetupEvent[]>(initialEvents);
const [selectedIndex, setSelectedIndex] = useState(() =>
  initialEvents.length > 3 ? 3 : 0,
);
const [status, setStatus] = useState<"loading" | "ready" | "error">(() =>
  initialError ? "error" : "ready",
);
const [errorMessage, setErrorMessage] = useState<string | null>(initialError);
```

6. **Delete** the entire `useEffect` that calls `fetchPastEvents()` (the mount fetch around the current lines that set status from network). Do not leave a stub that re-fetches.

7. Fix relative imports that break after the move into `components/`:
   - `./components/icons/...` → `./icons/...`
   - `./components/Input` → `./Input`
   - same for `IconButton`, `Link`, `Primary`, `ScrollReveal`, `Tooltip`
   - `./lib/supabase` → `@/lib/supabase`

Leave all gallery/detail/motion logic intact.

- [ ] **Step 2: Run targeted tests that read home source**

Run: `node --test tests/header-navigation.test.mjs tests/gallery-motion.test.mjs`

Expected: FAIL until Task 5/6 retargets those files from `App.tsx` → `HomePage.tsx` (optional to fix paths now — preferred in Task 5). If you already updated those test paths, expect PASS for content assertions.

- [ ] **Step 3: Commit**

```bash
git add src/components/HomePage.tsx
git commit -m "$(cat <<'EOF'
Add client HomePage driven by server-provided event props.

EOF
)"
```

---

### Task 5: Server home page + design-system route

**Files:**
- Create: `app/page.tsx`
- Create: `app/design-system/page.tsx`
- Modify: `src/DesignSystem.tsx` (add `"use client";` at top)

**Interfaces:**
- Consumes: `fetchPastEvents` from `@/lib/supabase`; `HomePage` from `@/components/HomePage`; `DesignSystem` from `@/DesignSystem`
- Produces: `/` and `/design-system` routes

- [ ] **Step 1: Create server `app/page.tsx`**

```tsx
import HomePage from "@/components/HomePage";
import { fetchPastEvents, type MeetupEvent } from "@/lib/supabase";

export default async function Page() {
  let initialEvents: MeetupEvent[] = [];
  let initialError: string | null = null;

  try {
    initialEvents = await fetchPastEvents();
  } catch (error: unknown) {
    initialError =
      error instanceof Error ? error.message : "Unable to load events.";
  }

  return (
    <HomePage initialEvents={initialEvents} initialError={initialError} />
  );
}
```

- [ ] **Step 2: Make DesignSystem a client module**

Ensure `src/DesignSystem.tsx` starts with:

```tsx
"use client";
```

(Keep the rest of the file unchanged.)

- [ ] **Step 3: Create `app/design-system/page.tsx`**

```tsx
import type { Metadata } from "next";
import DesignSystem from "@/DesignSystem";

export const metadata: Metadata = {
  title: "Design system — Design Meetup",
};

export default function DesignSystemPage() {
  return <DesignSystem />;
}
```

If Next complains that a client default export cannot be composed with `metadata` in the same file, keep metadata in this server page and import the client `DesignSystem` as above (this pattern is valid: server page imports client child).

- [ ] **Step 4: Run new smoke tests**

Run: `node --test tests/next-app-router.test.mjs`

Expected: most assertions PASS; Vite-removal test may still FAIL until Task 6.

- [ ] **Step 5: Commit**

```bash
git add app/page.tsx app/design-system/page.tsx src/DesignSystem.tsx
git commit -m "$(cat <<'EOF'
Add App Router home and design-system pages.

EOF
)"
```

---

### Task 6: Retarget tests, delete Vite artifacts

**Files:**
- Modify: every `tests/*.test.mjs` that reads `src/App.tsx` → `src/components/HomePage.tsx`
- Modify: any remaining `src/styles.css` / `src/main.tsx` references
- Delete: `vite.config.ts`, `index.html`, `src/main.tsx`, `src/App.tsx`, `src/vite-env.d.ts`, `src/styles.css`

**Interfaces:**
- Consumes: HomePage + app routes from prior tasks
- Produces: green `npm test`; no Vite files left

- [ ] **Step 1: Bulk-update test file paths**

For each test under `tests/` that contains `src/App.tsx`, change to `src/components/HomePage.tsx`.

For CSS path references `src/styles.css`, change to `app/globals.css`.

Remove any remaining `src/main.tsx` reads except those already rewritten in Task 1.

Files known to need the App → HomePage path change (verify with ripgrep):

- `tests/about-section.test.mjs`
- `tests/event-detail.test.mjs`
- `tests/footer.test.mjs`
- `tests/gallery-motion.test.mjs`
- `tests/gallery-scroll-sync.test.mjs`
- `tests/header-navigation.test.mjs`
- `tests/input.test.mjs`
- `tests/link.test.mjs`
- `tests/partner-section.test.mjs`
- `tests/primary-button.test.mjs` (if it reads App)
- `tests/scroll-reveal.test.mjs`
- `tests/section-spacing.test.mjs`
- `tests/sponsors.test.mjs`
- `tests/upcoming-events.test.mjs`
- `tests/design-system.test.mjs` (finalize paths; remove Vite fallbacks if desired)

- [ ] **Step 2: Delete Vite / old SPA entrypoints**

```bash
rm -f vite.config.ts index.html src/main.tsx src/App.tsx src/vite-env.d.ts src/styles.css
```

- [ ] **Step 3: Run full test suite**

Run: `npm test`

Expected: all tests PASS.

- [ ] **Step 4: Commit**

```bash
git add -A tests vite.config.ts index.html src/main.tsx src/App.tsx src/vite-env.d.ts src/styles.css
git commit -m "$(cat <<'EOF'
Remove Vite entrypoints and retarget tests to Next.js.

EOF
)"
```

---

### Task 7: Verify build and local routes

**Files:**
- Possibly: `next-env.d.ts` (auto-generated — commit it if Next creates it)
- Fix only compile errors discovered here

**Interfaces:**
- Consumes: complete App Router app
- Produces: passing `next build`; `/` and `/design-system` work in `next dev`

- [ ] **Step 1: Production build**

Run: `npm run build`

Expected: compiled successfully. Fix any TypeScript or module path errors (usually missing `"use client"`, bad import paths, or JSON import config).

- [ ] **Step 2: Manual route check**

Run: `npm run dev`  
Open `http://localhost:3000/` — home renders; past events appear when env is set.  
Open `http://localhost:3000/design-system` — specimen page renders with correct document title.

Stop the dev server when done.

- [ ] **Step 3: Remind about Vercel env**

Do not change Vercel via CLI unless asked. Note in the commit message / PR later: rename production env vars to `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY`.

- [ ] **Step 4: Final commit if build generated files**

```bash
git add next-env.d.ts
git status
# commit only if there are new generated/tracked fixes:
git commit -m "$(cat <<'EOF'
Verify Next.js production build for migrated app.

EOF
)"
```

If nothing to commit, skip.

---

## Self-Review (plan author)

1. **Spec coverage:** Architecture, hybrid data, routes, env rename, Tailwind PostCSS, Vite removal, tests, Vercel env note — each has a task.
2. **Placeholders:** None; steps include concrete file paths and code.
3. **Type consistency:** `HomePageProps` uses `initialEvents: MeetupEvent[]` and `initialError: string | null` in Tasks 1, 4, and 5.

---

## Execution Handoff

Plan complete and saved to `docs/superpowers/plans/2026-08-02-nextjs-migration.md`. Two execution options:

**1. Subagent-Driven (recommended)** — fresh subagent per task, review between tasks  
**2. Inline Execution** — execute tasks in this session with checkpoints  

Which approach?
