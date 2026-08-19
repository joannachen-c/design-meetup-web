export const IMPORT_PROJECT_SLUG = "design-meetup-web";

const VERCEL_API = "https://api.vercel.com";

export function bearerTokenFromHeader(authorization: string | null) {
  if (!authorization) return null;
  const match = /^Bearer\s+(\S+)$/i.exec(authorization.trim());
  return match?.[1] ?? null;
}

type EnvMap = Record<string, string | undefined>;

async function projectAccessible(
  token: string,
  idOrName: string,
  teamId: string | undefined,
  fetchFn: typeof fetch,
) {
  const url = new URL(
    `${VERCEL_API}/v9/projects/${encodeURIComponent(idOrName)}`,
  );
  if (teamId) url.searchParams.set("teamId", teamId);
  const response = await fetchFn(url, {
    headers: { Authorization: `Bearer ${token}` },
    cache: "no-store",
  });
  return response.ok;
}

async function vercelTokenCanAccessProject(
  token: string,
  env: EnvMap,
  fetchFn: typeof fetch,
) {
  const projectId = env.VERCEL_PROJECT_ID || IMPORT_PROJECT_SLUG;
  const teamId = env.VERCEL_ORG_ID;

  if (await projectAccessible(token, projectId, teamId, fetchFn)) return true;
  if (
    projectId !== IMPORT_PROJECT_SLUG &&
    (await projectAccessible(token, IMPORT_PROJECT_SLUG, teamId, fetchFn))
  ) {
    return true;
  }
  if (teamId) return false;

  const teamsResponse = await fetchFn(`${VERCEL_API}/v2/teams?limit=20`, {
    headers: { Authorization: `Bearer ${token}` },
    cache: "no-store",
  });
  if (!teamsResponse.ok) return false;

  const payload = (await teamsResponse.json()) as {
    teams?: Array<{ id?: string }>;
  };
  for (const team of payload.teams ?? []) {
    if (!team.id) continue;
    if (await projectAccessible(token, IMPORT_PROJECT_SLUG, team.id, fetchFn)) {
      return true;
    }
  }
  return false;
}

/**
 * GitHub Actions sends `Authorization: Bearer $VERCEL_TOKEN`. Vercel Cron
 * sends `CRON_SECRET`. Both prove the caller can operate this project —
 * no extra import secret.
 */
export async function isAuthorizedImportCaller(
  token: string | null,
  env: EnvMap = process.env,
  fetchFn: typeof fetch = fetch,
) {
  if (!token) return false;
  if (env.CRON_SECRET && token === env.CRON_SECRET) return true;
  return vercelTokenCanAccessProject(token, env, fetchFn);
}
