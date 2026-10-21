import { isUnnamed, type PlanningLink } from "./planning.ts";

const TITLE_HOSTS = new Set([
  "docs.google.com",
  "drive.google.com",
  "figma.com",
  "www.figma.com",
  "notion.so",
  "www.notion.so",
  "canva.com",
  "www.canva.com",
  "lu.ma",
  "luma.com",
  "loom.com",
  "www.loom.com",
  "github.com",
  "youtube.com",
  "www.youtube.com",
  "youtu.be",
]);
const MAX_REDIRECTS = 3;
const MAX_BYTES = 400_000;
const TIMEOUT_MS = 4_000;
const MAX_TITLE = 80;

const SUFFIXES = [
  / [-–|] Google (Docs|Sheets|Slides|Forms|Drive)$/i,
  / [-–|] Figma$/i,
  / [-–|] Notion$/i,
  / [-–|] Canva$/i,
  / [-–|] Loom$/i,
  / [-–|] YouTube$/i,
  / [·|] Luma$/i,
];
// Pages that only say which app they are, e.g. a restricted doc's sign-in screen.
const GENERIC = /^(google (docs|sheets|slides|forms|drive)|sign[ -]?in.*|figma|notion|canva|loom|youtube|luma|github|untitled.*|access denied.*)$/i;

/** Only well-known document hosts are fetched, so a saved link can't point the server at internal addresses. */
export function isTitleHost(url: URL) {
  return (
    url.protocol === "https:" &&
    !url.port &&
    (TITLE_HOSTS.has(url.hostname) || url.hostname.endsWith(".notion.site"))
  );
}

function decodeEntities(text: string) {
  return text
    .replace(/&#(\d+);/g, (_, code) => String.fromCodePoint(Number(code)))
    .replace(/&#x([0-9a-f]+);/gi, (_, code) => String.fromCodePoint(parseInt(code, 16)))
    .replace(/&quot;/g, '"')
    .replace(/&#39;|&apos;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&");
}

export function titleFromHtml(html: string) {
  const og =
    html.match(/<meta[^>]+property=["']og:title["'][^>]+content=["']([^"']*)["']/i) ??
    html.match(/<meta[^>]+content=["']([^"']*)["'][^>]+property=["']og:title["']/i);
  const raw = og?.[1] ?? html.match(/<title[^>]*>([\s\S]*?)<\/title>/i)?.[1] ?? "";
  let title = decodeEntities(raw).replace(/\s+/g, " ").trim();
  for (const suffix of SUFFIXES) title = title.replace(suffix, "").trim();
  if (!title || GENERIC.test(title)) return null;
  return title.length > MAX_TITLE ? `${title.slice(0, MAX_TITLE - 1).trimEnd()}…` : title;
}

async function readCapped(response: Response) {
  const reader = response.body?.getReader();
  if (!reader) return "";
  const chunks: Uint8Array[] = [];
  let size = 0;
  while (size < MAX_BYTES) {
    const { done, value } = await reader.read();
    if (done) break;
    chunks.push(value);
    size += value.byteLength;
  }
  await reader.cancel().catch(() => {});
  return new TextDecoder().decode(Buffer.concat(chunks).subarray(0, MAX_BYTES));
}

export async function fetchLinkTitle(href: string): Promise<string | null> {
  let url: URL;
  try {
    url = new URL(href);
  } catch {
    return null;
  }
  const signal = AbortSignal.timeout(TIMEOUT_MS);
  try {
    for (let hop = 0; hop <= MAX_REDIRECTS; hop += 1) {
      if (!isTitleHost(url)) return null;
      const response = await fetch(url, {
        redirect: "manual",
        signal,
        headers: { "User-Agent": "Mozilla/5.0 (compatible; DesignMeetupPlanning/1.0)", Accept: "text/html" },
      });
      const location = response.headers.get("location");
      if (response.status >= 300 && response.status < 400 && location) {
        url = new URL(location, url);
        continue;
      }
      if (!response.ok || !(response.headers.get("content-type") || "").includes("text/html")) return null;
      return titleFromHtml(await readCapped(response));
    }
  } catch {
    // Timeouts and network errors just leave the link unnamed.
  }
  return null;
}

/** Fills in page titles for unnamed links; labels people typed are left alone. */
export async function nameLinks(links: PlanningLink[]) {
  return Promise.all(
    links.map(async (link) => {
      if (!isUnnamed(link)) return link;
      const title = await fetchLinkTitle(link.url);
      return title ? { ...link, label: title } : link;
    }),
  );
}
