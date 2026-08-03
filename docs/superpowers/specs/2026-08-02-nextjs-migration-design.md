# Next.js Migration Design

Date: 2026-08-02  
Status: Approved for planning  
Repo: design-meetup-web

## Goal

Migrate the Design Meetup site from a Vite + React SPA to **Next.js App Router**, preserving visual and interaction parity while adopting real routes and hybrid data loading.

## Decisions

| Topic | Choice |
|---|---|
| Migration depth | Proper App Router (not lift-and-shift, not full component split) |
| Data loading | Hybrid: server-fetch initial events; client owns gallery/detail interactions |
| Structure approach | Route-first hybrid: new `app/` shell, keep home UI as one client component for now |
| Deploy | Remain on Vercel |

## Architecture

- **Framework:** Next.js (latest stable App Router), TypeScript, React 19
- **Routes:**
  - `/` — marketing home
  - `/design-system` — component specimen page
- **`app/layout.tsx`** — root HTML shell, global CSS, shared metadata
- **`app/page.tsx`** — Server Component that `await`s `fetchPastEvents()` and passes results into the client home
- **`app/design-system/page.tsx`** — design system route (client if interactivity requires it)
- **Client home** — current `App.tsx` behavior moved to a `"use client"` component (e.g. `src/components/HomePage.tsx`) that receives `initialEvents` / `initialError` props
- **Styling:** Tailwind CSS 4 via Next/PostCSS (replace `@tailwindcss/vite`)
- **Keep:** Motion, Radix Tooltip, Supabase lib, `public/`, seed scripts, Node test runner
- **Remove:** `vite.config.ts`, `index.html`, `src/main.tsx`, Vite-only types/`import.meta.env` usage

## Data flow

1. Server page calls `fetchPastEvents()` from `src/lib/supabase.ts`.
2. Success → pass `initialEvents` into client home.
3. Failure → pass `initialError`; client shows existing error UI.
4. Client owns selection index, gallery scroll sync, photo rail, and motion.
5. No second fetch on mount by default; server props are the load-time source of truth. Client retry only if we add an explicit retry action later.
6. Env vars rename: `VITE_SUPABASE_URL` / `VITE_SUPABASE_ANON_KEY` → `NEXT_PUBLIC_SUPABASE_URL` / `NEXT_PUBLIC_SUPABASE_ANON_KEY`. Update `.env.example` and Vercel project env.

## Target file map

```
app/
  layout.tsx
  page.tsx
  design-system/page.tsx
  globals.css              # migrated from src/styles.css
src/
  components/              # existing primitives
  components/HomePage.tsx  # former App.tsx, "use client"
  DesignSystem.tsx
  lib/supabase.ts          # process.env.NEXT_PUBLIC_* 
public/                    # unchanged
tests/                     # path/assertion updates for Next
next.config.ts
package.json               # next scripts; drop vite
```

## Out of scope

- Splitting `App.tsx` / `HomePage.tsx` into per-section files
- Broad `next/image` conversion
- New per-event URL routes
- Agentation integration (drop or defer unless trivial)

## Testing

- Keep `node --test` source-string tests.
- Retarget Vite-specific assertions (`src/main.tsx`, pathname routing, `import.meta.env`) to Next equivalents (`app/page.tsx`, `app/design-system/page.tsx`, `NEXT_PUBLIC_*`, `"use client"`).
- Add a smoke assertion that the home server page fetches / passes `initialEvents`.
- Gate on `npm test` and `npm run build`.

## Rollout steps

1. Swap toolchain: Next deps, `next.config.ts`, scripts, Tailwind PostCSS wiring.
2. Add `app/` routes; move global CSS; adapt Supabase env reads.
3. Wire hybrid props into client home; remove Vite entrypoints.
4. Update tests; verify `/` and `/design-system` in `next dev`.
5. Confirm Vercel builds as a Next app; ensure production env vars renamed.

## Risks

| Risk | Mitigation |
|---|---|
| Hydration mismatch from motion/scroll | Keep interactive tree client-only; avoid `window`/`Date` in server render |
| Missing/renamed env in production | Document + update Vercel `NEXT_PUBLIC_*` vars before deploy |
| Tailwind 4 + Next setup friction | Use official Tailwind 4 PostCSS setup for Next, not the Vite plugin |
| Behavior drift in large home UI | Change only initial data wiring; leave interaction logic intact |
| Design-system route regressions | Dedicated App Router page + updated tests |

## Success criteria

- `next dev` serves `/` and `/design-system`
- Past events load via server props (hybrid model)
- Gallery, detail panel, and motion behavior match current site
- Tests and production build pass
