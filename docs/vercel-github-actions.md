# Vercel deploys via GitHub Actions

Production site: https://design-meetup-web.vercel.app/

Native Vercel Git deploys are **disabled** (`vercel.json` → `git.deploymentEnabled: false`) so people who are not on the Vercel project can still open and merge PRs. Previews and production ship through GitHub Actions using a token owned by the Vercel project member.

## Required GitHub Actions secrets

Repo → **Settings → Secrets and variables → Actions**:

| Secret | Where to get it |
| --- | --- |
| `VERCEL_TOKEN` | [vercel.com/account/tokens](https://vercel.com/account/tokens) → Create (scope: full account or this team) |
| `VERCEL_ORG_ID` | `.vercel/project.json` → `orgId` (already linked locally) |
| `VERCEL_PROJECT_ID` | `.vercel/project.json` → `projectId` |

Only someone on the Vercel project needs to create/rotate `VERCEL_TOKEN`. Collaborators never need Vercel access.

## Workflows

| Workflow | When | What |
| --- | --- | --- |
| `CI` | Every PR + push to `main` | `npm test` + `npm run build` (mergeable without Vercel membership) |
| `Vercel Preview` | Non-draft PRs from this repo | Preview deploy + PR comment with URL |
| `Vercel Production` | Push to `main` | Production deploy, then import Gmail partner inquiries |
| `Import partner inquiries` | Manual dispatch, or daily at 06:00 UTC | POSTs `/api/contact/import` on production. Gmail secrets stay on Vercel (Sensitive env cannot be pulled into Actions). |

Fork PRs skip the preview deploy (secrets are unavailable). Same-repo collaborator branches work normally.

## One-time setup checklist

1. Add the three secrets above.
2. Merge this branch so the workflows land on `main`.
3. Open a test PR from a collaborator account that is **not** on Vercel — confirm CI is green and the preview comment appears.
4. Optional: under branch protection, require the **CI** check (not a Vercel Git check).
