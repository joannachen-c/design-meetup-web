/** Team members with a photo in /public/team. Owners can be anyone; these get a face. */
export const TEAM = [
  { slug: "michelle-liu", name: "Michelle Liu" },
  { slug: "ilyssa-yan", name: "Ilyssa Yan" },
  { slug: "brandon-lee", name: "Brandon Lee" },
  { slug: "joanna-chen", name: "Joanna Chen" },
  { slug: "emily-shen", name: "Emily Shen" },
  { slug: "matthew-hope", name: "Matthew Hope" },
  { slug: "yufei-wang", name: "Yufei Wang" },
] as const;

export const URGENCIES = ["urgent", "soon", "normal"] as const;
export const STATUSES = ["attention", "motion", "backlog", "done"] as const;

export type Urgency = (typeof URGENCIES)[number];
export type Status = (typeof STATUSES)[number];
export type PlanningLink = { label: string; url: string };

export type PlanningItem = {
  id: string;
  company: string;
  description: string;
  nextStep: string;
  notes: string;
  deadline: string;
  poc: string;
  urgency: Urgency;
  location: string;
  status: Status;
  roles: string[];
  owners: string[];
  links: PlanningLink[];
  updatedAt: string;
};

export type PlanningPatch = Partial<Omit<PlanningItem, "id" | "updatedAt">>;

const TEXT_LIMITS = {
  company: 200,
  description: 2000,
  nextStep: 1000,
  notes: 5000,
  deadline: 40,
  poc: 300,
  location: 80,
} as const;

const COLUMNS: Record<keyof PlanningPatch, string> = {
  company: "company",
  description: "description",
  nextStep: "next_step",
  notes: "notes",
  deadline: "deadline",
  poc: "poc",
  urgency: "urgency",
  location: "location",
  status: "status",
  roles: "roles",
  owners: "owners",
  links: "links",
};

export const PLANNING_SELECT = [...Object.values(COLUMNS), "id", "updated_at"].join(",");

const MAX_LINKS = 20;
const MAX_TAGS = 12;
const TAG_LIMITS = { roles: 40, owners: 80 } as const;

function cleanTags(value: unknown, max: number) {
  if (!Array.isArray(value)) return [];
  const tags = value.flatMap((entry) => (typeof entry === "string" && entry.trim() ? [entry.trim()] : []));
  return [...new Set(tags)].filter((tag) => tag.length <= max).slice(0, MAX_TAGS);
}

type ParseResult = { ok: true; patch: PlanningPatch } | { ok: false; error: string };

function oneOf<T extends string>(values: readonly T[], value: unknown): value is T {
  return typeof value === "string" && (values as readonly string[]).includes(value);
}

function parseLink(value: unknown): PlanningLink | null {
  if (!value || typeof value !== "object") return null;
  const { label, url } = value as { label?: unknown; url?: unknown };
  if (typeof url !== "string" || url.length > 2000) return null;
  try {
    const parsed = new URL(url.trim());
    if (parsed.protocol !== "https:" && parsed.protocol !== "http:") return null;
    const text = typeof label === "string" ? label.trim().slice(0, 80) : "";
    return { label: text || parsed.hostname, url: parsed.toString() };
  } catch {
    return null;
  }
}

/** Validates a partial update from the portal or Muse. Unknown keys are rejected. */
export function parsePlanningPatch(input: unknown, { requireCompany = false } = {}): ParseResult {
  if (!input || typeof input !== "object" || Array.isArray(input)) {
    return { ok: false, error: "Send a JSON object of fields to change." };
  }
  const patch: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(input)) {
    if (key in TEXT_LIMITS) {
      if (typeof value !== "string") return { ok: false, error: `${key} must be text.` };
      const text = value.trim();
      if (text.length > TEXT_LIMITS[key as keyof typeof TEXT_LIMITS]) {
        return { ok: false, error: `${key} is too long.` };
      }
      patch[key] = text;
    } else if (key === "urgency" || key === "status") {
      const allowed = key === "urgency" ? URGENCIES : STATUSES;
      if (!oneOf(allowed, value)) {
        return { ok: false, error: `${key} must be one of: ${allowed.join(", ")}.` };
      }
      patch[key] = value;
    } else if (key === "roles" || key === "owners") {
      const max = TAG_LIMITS[key];
      const valid =
        Array.isArray(value) &&
        value.length <= MAX_TAGS &&
        value.every((entry) => typeof entry === "string" && entry.trim().length <= max);
      if (!valid) {
        return { ok: false, error: `${key} must be a list of up to ${MAX_TAGS} names, ${max} characters each.` };
      }
      patch[key] = cleanTags(value, max);
    } else if (key === "links") {
      if (!Array.isArray(value) || value.length > MAX_LINKS) {
        return { ok: false, error: `links must be a list of at most ${MAX_LINKS}.` };
      }
      const links = value.map(parseLink);
      if (links.some((link) => !link)) {
        return { ok: false, error: "Each link needs an http(s) url." };
      }
      patch[key] = links;
    } else {
      return { ok: false, error: `Unknown field: ${key}.` };
    }
  }
  if ("company" in patch && !patch.company) {
    return { ok: false, error: "company can't be empty." };
  }
  if (requireCompany && !patch.company) {
    return { ok: false, error: "company is required." };
  }
  return { ok: true, patch: patch as PlanningPatch };
}

export function planningPatchToRow(patch: PlanningPatch) {
  const row: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(patch)) {
    row[COLUMNS[key as keyof PlanningPatch]] = value;
  }
  return row;
}

export function planningItemFromRow(data: object): PlanningItem {
  const row = data as Record<string, unknown>;
  const text = (value: unknown) => (typeof value === "string" ? value : "");
  return {
    id: text(row.id),
    company: text(row.company),
    description: text(row.description),
    nextStep: text(row.next_step),
    notes: text(row.notes),
    deadline: text(row.deadline),
    poc: text(row.poc),
    urgency: oneOf(URGENCIES, row.urgency) ? row.urgency : "normal",
    location: text(row.location),
    status: oneOf(STATUSES, row.status) ? row.status : "motion",
    roles: cleanTags(row.roles, TAG_LIMITS.roles),
    owners: cleanTags(row.owners, TAG_LIMITS.owners),
    links: Array.isArray(row.links)
      ? row.links.flatMap((link) => {
          const parsed = parseLink(link);
          return parsed ? [parsed] : [];
        })
      : [],
    updatedAt: text(row.updated_at),
  };
}
