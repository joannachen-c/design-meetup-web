export const ADVISOR_RELATIONSHIPS = [
  "advisor",
  "mentor",
  "speaker",
  "hiring_partner",
] as const;

export type AdvisorRelationship = (typeof ADVISOR_RELATIONSHIPS)[number];

export const ADVISOR_RELATIONSHIP_LABELS: Record<AdvisorRelationship, string> = {
  advisor: "Advisor",
  mentor: "Mentor",
  speaker: "Speaker",
  hiring_partner: "Hiring Partner",
};

export type Advisor = {
  slug: string;
  firstName: string;
  lastName: string;
  title: string;
  company: string;
  relationship: AdvisorRelationship;
  fields: string[];
  locations: string[];
  bio: string | null;
  photoUrl: string | null;
  websiteUrl: string | null;
  linkedinUrl: string | null;
  xUrl: string | null;
  href: string;
};

export type AdvisorRow = {
  slug: string;
  first_name: string;
  last_name: string;
  title: string;
  company: string;
  relationship: string;
  fields: string[] | null;
  locations?: string[] | null;
  bio?: string | null;
  photo_url?: string | null;
  website_url?: string | null;
  linkedin_url?: string | null;
  x_url?: string | null;
  sort_order?: number | null;
};

export type AdvisorFilters = {
  query: string;
  relationship: AdvisorRelationship | "all";
  field: string | "all";
  location: string | "all";
};

export type AdvisorSort = "default" | "name" | "company";

export const EMPTY_ADVISOR_FILTERS: AdvisorFilters = {
  query: "",
  relationship: "all",
  field: "all",
  location: "all",
};

export function isAdvisorRelationship(value: unknown): value is AdvisorRelationship {
  return (
    typeof value === "string" &&
    (ADVISOR_RELATIONSHIPS as readonly string[]).includes(value)
  );
}

export function advisorFromRow(row: AdvisorRow): Advisor {
  return {
    slug: row.slug,
    firstName: row.first_name,
    lastName: row.last_name,
    title: row.title,
    company: row.company,
    relationship: isAdvisorRelationship(row.relationship) ? row.relationship : "advisor",
    fields: row.fields ?? [],
    locations: row.locations ?? [],
    bio: row.bio ?? null,
    photoUrl: row.photo_url ?? null,
    websiteUrl: row.website_url ?? null,
    linkedinUrl: row.linkedin_url ?? null,
    xUrl: row.x_url ?? null,
    href: row.website_url || row.linkedin_url || row.x_url || "#",
  };
}

function normalize(value: string) {
  return value
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

function searchableText(advisor: Advisor) {
  return normalize(
    [
      advisor.firstName,
      advisor.lastName,
      advisor.title,
      advisor.company,
      ADVISOR_RELATIONSHIP_LABELS[advisor.relationship],
      ...advisor.fields,
      ...advisor.locations,
    ].join(" "),
  );
}

export function filterAdvisors(advisors: Advisor[], filters: AdvisorFilters): Advisor[] {
  const terms = normalize(filters.query).split(/\s+/).filter(Boolean);

  return advisors.filter((advisor) => {
    if (filters.relationship !== "all" && advisor.relationship !== filters.relationship) {
      return false;
    }
    if (filters.field !== "all" && !advisor.fields.includes(filters.field)) {
      return false;
    }
    if (filters.location !== "all" && !advisor.locations.includes(filters.location)) {
      return false;
    }
    if (terms.length === 0) return true;
    const haystack = searchableText(advisor);
    return terms.every((term) => haystack.includes(term));
  });
}

export function sortAdvisors(advisors: Advisor[], sort: AdvisorSort): Advisor[] {
  if (sort === "default") return advisors;
  const key =
    sort === "name"
      ? (advisor: Advisor) => `${advisor.lastName} ${advisor.firstName}`
      : (advisor: Advisor) => `${advisor.company} ${advisor.lastName}`;
  return [...advisors].sort((a, b) =>
    key(a).localeCompare(key(b), "en", { sensitivity: "base" }),
  );
}

function uniqueSorted(values: string[]) {
  return [...new Set(values)].sort((a, b) => a.localeCompare(b, "en", { sensitivity: "base" }));
}

export function advisorFieldOptions(advisors: Advisor[]): string[] {
  return uniqueSorted(advisors.flatMap((advisor) => advisor.fields));
}

export function advisorLocationOptions(advisors: Advisor[]): string[] {
  return uniqueSorted(advisors.flatMap((advisor) => advisor.locations));
}

export function hasActiveAdvisorFilters(filters: AdvisorFilters) {
  return (
    filters.query.trim() !== "" ||
    filters.relationship !== "all" ||
    filters.field !== "all" ||
    filters.location !== "all"
  );
}

export function advisorFiltersFromSearchParams(params: URLSearchParams): AdvisorFilters {
  const relationship = params.get("rel");
  return {
    query: params.get("q") ?? "",
    relationship: isAdvisorRelationship(relationship) ? relationship : "all",
    field: params.get("field") || "all",
    location: params.get("loc") || "all",
  };
}

export function writeAdvisorFiltersToSearchParams(
  params: URLSearchParams,
  filters: AdvisorFilters,
) {
  const entries: [string, string][] = [
    ["q", filters.query.trim()],
    ["rel", filters.relationship === "all" ? "" : filters.relationship],
    ["field", filters.field === "all" ? "" : filters.field],
    ["loc", filters.location === "all" ? "" : filters.location],
  ];
  for (const [key, value] of entries) {
    if (value) params.set(key, value);
    else params.delete(key);
  }
  return params;
}
