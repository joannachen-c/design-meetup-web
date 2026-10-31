/** Member directory shapes and filters. Client-safe: no email lists live here. */

export const DISCIPLINES = [
  { value: "product", label: "Product design" },
  { value: "brand", label: "Brand & visual" },
  { value: "ux-research", label: "UX research" },
  { value: "interaction", label: "Interaction" },
  { value: "motion", label: "Motion" },
  { value: "design-engineering", label: "Design engineering" },
  { value: "3d", label: "3D" },
  { value: "illustration", label: "Illustration" },
  { value: "content", label: "Content design" },
  { value: "leadership", label: "Design leadership" },
] as const;

export type Discipline = (typeof DISCIPLINES)[number]["value"];

export function disciplineLabel(value: string) {
  return DISCIPLINES.find((item) => item.value === value)?.label ?? value;
}

/** Known values only, deduped, in DISCIPLINES order. */
export function normalizeDisciplines(values: unknown): Discipline[] {
  if (!Array.isArray(values)) return [];
  const picked = new Set(values.map((value) => String(value).trim()));
  return DISCIPLINES.map((item) => item.value).filter((value) => picked.has(value));
}

export const REGIONS = [
  { value: "nyc", label: "New York" },
  { value: "sf", label: "SF Bay Area" },
  { value: "la", label: "Los Angeles" },
  { value: "elsewhere", label: "Elsewhere" },
] as const;

export type Region = (typeof REGIONS)[number]["value"];

const REGION_PATTERNS: Array<[Exclude<Region, "elsewhere">, RegExp]> = [
  ["nyc", /\b(nyc|new york|ny|brooklyn|manhattan|queens)\b/i],
  [
    "sf",
    /\b(sf|san francisco|bay|bay area|berkeley|oakland|palo alto|stanford|san jose|mountain view|menlo park)\b/i,
  ],
  ["la", /\b(la|los angeles|santa monica|pasadena|culver city)\b/i],
];

/** Locations are free text ("NYC", "Bay + LA"), so a member can land in several regions. */
export function regionsForLocation(location: string | null | undefined): Region[] {
  const text = (location || "").trim();
  if (!text) return [];
  const matched = REGION_PATTERNS.filter(([, pattern]) => pattern.test(text)).map(
    ([region]) => region,
  );
  return matched.length ? matched : ["elsewhere"];
}

/** A link written out for display: "liumichelle.com", not "https://www.liumichelle.com/". */
export function linkLabel(href: string) {
  return href.replace(/^https?:\/\//i, "").replace(/^www\./i, "").replace(/\/$/, "");
}

export type DirectoryLinks = {
  website: string | null;
  instagram: string | null;
  x: string | null;
  linkedin: string | null;
  youtube: string | null;
  github: string | null;
};

/** What members and advisors see about each other. */
export type MemberCard = {
  id: string;
  name: string;
  avatarUrl: string | null;
  tier: "student" | "professional";
  advisor: boolean;
  role: string | null;
  school: string | null;
  location: string | null;
  regions: Region[];
  disciplines: Discipline[];
  links: DirectoryLinks;
};

/** What the Design Meetup team sees on top of the member card. */
export type TeamRow = MemberCard & {
  email: string;
  status: string;
  cohort: number | null;
  memberSince: string | null;
  joinedAt: string | null;
  profileComplete: boolean;
};

/** Members on a sheet or allowlist who have not made a portal account. */
export type PendingMember = {
  email: string;
  sources: string[];
};

export type DirectoryKind = "all" | "student" | "professional" | "advisor";

export type DirectoryFilters = {
  query: string;
  kind: DirectoryKind;
  region: Region | "all";
  discipline: Discipline | "all";
};

export const EMPTY_FILTERS: DirectoryFilters = {
  query: "",
  kind: "all",
  region: "all",
  discipline: "all",
};

function searchable(card: MemberCard) {
  return [card.name, card.role, card.school, card.location, ...card.disciplines.map(disciplineLabel)]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
}

export function filterDirectory<T extends MemberCard>(cards: T[], filters: DirectoryFilters) {
  const terms = filters.query.toLowerCase().split(/\s+/).filter(Boolean);
  return cards.filter((card) => {
    if (filters.kind === "advisor" && !card.advisor) return false;
    if ((filters.kind === "student" || filters.kind === "professional") && card.tier !== filters.kind) {
      return false;
    }
    if (filters.region !== "all" && !card.regions.includes(filters.region)) return false;
    if (filters.discipline !== "all" && !card.disciplines.includes(filters.discipline)) {
      return false;
    }
    if (!terms.length) return true;
    const haystack = searchable(card);
    return terms.every((term) => haystack.includes(term));
  });
}

function richness(card: MemberCard) {
  return (
    (card.avatarUrl ? 2 : 0) +
    (card.role ? 1 : 0) +
    (card.links.website ? 1 : 0) +
    (card.disciplines.length ? 1 : 0)
  );
}

/** Fuller profiles first so the grid opens on faces, then alphabetical. */
export function sortDirectory<T extends MemberCard>(cards: T[]) {
  return [...cards].sort(
    (a, b) => richness(b) - richness(a) || a.name.localeCompare(b.name),
  );
}
