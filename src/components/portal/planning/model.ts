import {
  STATUSES,
  TEAM,
  URGENCIES,
  type PlanningItem,
  type PlanningPatch,
  type Status,
  type Urgency,
} from "@/lib/planning";

export const STATUS_LABEL: Record<Status, string> = {
  attention: "Needs attention",
  todo: "To do",
  motion: "In motion",
  backlog: "Backlog",
  done: "Done",
};
export const URGENCY_LABEL: Record<Urgency, string> = {
  urgent: "Urgent",
  soon: "Soon",
  normal: "Normal",
};

export const COLUMN_LABEL = {
  status: "Status",
  urgency: "Urgency",
  deadline: "Deadline",
  description: "Description",
  poc: "POC",
  location: "Location",
  owners: "Owners",
  roles: "Roles",
  nextStep: "Next step",
  updated: "Updated",
} as const;
export type ColumnKey = keyof typeof COLUMN_LABEL;
export const COLUMN_KEYS = Object.keys(COLUMN_LABEL) as ColumnKey[];
export const COLUMN_WIDTH: Record<ColumnKey, number> = {
  status: 164,
  urgency: 112,
  deadline: 124,
  description: 320,
  poc: 200,
  location: 128,
  owners: 168,
  roles: 200,
  nextStep: 300,
  updated: 104,
};
export const NAME_WIDTH = 300;

export const GROUP_LABEL = {
  status: "Status",
  urgency: "Urgency",
  location: "Location",
  none: "None",
} as const;
export type GroupBy = keyof typeof GROUP_LABEL;

export const SORT_LABEL = {
  urgency: "Urgency",
  deadline: "Deadline",
  updated: "Last updated",
  name: "Name",
} as const;
export type SortBy = keyof typeof SORT_LABEL;

export type Filters = {
  status: Status[];
  urgency: Urgency[];
  location: string[];
  owners: string[];
  roles: string[];
};
export type View = {
  groupBy: GroupBy;
  sortBy: SortBy;
  filters: Filters;
  collapsed: string[];
};

export const EMPTY_FILTERS: Filters = { status: [], urgency: [], location: [], owners: [], roles: [] };
export const DEFAULT_VIEW: View = {
  groupBy: "status",
  sortBy: "urgency",
  filters: EMPTY_FILTERS,
  collapsed: ["backlog", "done"],
};

const VIEW_KEY = "dm-planning-view-v1";

function strings(value: unknown) {
  return Array.isArray(value) ? value.filter((entry): entry is string => typeof entry === "string") : [];
}

export function loadView(): View {
  try {
    const saved = JSON.parse(localStorage.getItem(VIEW_KEY) || "null");
    if (!saved || typeof saved !== "object") return DEFAULT_VIEW;
    const filters = saved.filters ?? {};
    return {
      groupBy: saved.groupBy in GROUP_LABEL ? saved.groupBy : DEFAULT_VIEW.groupBy,
      sortBy: saved.sortBy in SORT_LABEL ? saved.sortBy : DEFAULT_VIEW.sortBy,
      filters: {
        status: strings(filters.status).filter((value): value is Status =>
          (STATUSES as readonly string[]).includes(value),
        ),
        urgency: strings(filters.urgency).filter((value): value is Urgency =>
          (URGENCIES as readonly string[]).includes(value),
        ),
        location: strings(filters.location),
        owners: strings(filters.owners),
        roles: strings(filters.roles),
      },
      collapsed: Array.isArray(saved.collapsed) ? strings(saved.collapsed) : DEFAULT_VIEW.collapsed,
    };
  } catch {
    return DEFAULT_VIEW;
  }
}

export function saveView(view: View) {
  try {
    localStorage.setItem(VIEW_KEY, JSON.stringify(view));
  } catch {
    // Storage can be unavailable (private windows); the view just won't persist.
  }
}

export const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

export function daysUntil(iso: string) {
  const today = new Date();
  today.setHours(12, 0, 0, 0);
  return Math.round((new Date(`${iso}T12:00:00`).getTime() - today.getTime()) / 864e5);
}

export function relativeDays(days: number) {
  if (days === 0) return "Today";
  if (days === 1) return "Tomorrow";
  if (days === -1) return "Yesterday";
  return days > 0 ? `In ${days} days` : `${-days} days ago`;
}

export function formatDeadline(value: string) {
  if (!ISO_DATE.test(value)) return { label: value, title: value, days: null as number | null };
  const date = new Date(`${value}T12:00:00`);
  const sameYear = date.getFullYear() === new Date().getFullYear();
  const label = date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    ...(sameYear ? {} : { year: "numeric" }),
  });
  const days = daysUntil(value);
  return { label, title: relativeDays(days), days };
}

export function daysSince(timestamp: string) {
  const time = Date.parse(timestamp);
  return Number.isNaN(time) ? 0 : Math.max(0, Math.floor((Date.now() - time) / 864e5));
}

export function formatAgo(days: number) {
  if (days === 0) return "Today";
  if (days < 7) return `${days}d ago`;
  if (days < 60) return `${Math.floor(days / 7)}w ago`;
  return `${Math.floor(days / 30)}mo ago`;
}

export const STALE_DAYS = 14;
export const isActive = (item: PlanningItem) => item.status !== "backlog" && item.status !== "done";
export const isStale = (item: PlanningItem) => isActive(item) && daysSince(item.updatedAt) >= STALE_DAYS;

const teamByName = new Map<string, string>();
for (const member of TEAM) {
  teamByName.set(member.name.toLowerCase(), member.slug);
  teamByName.set(member.name.split(" ")[0].toLowerCase(), member.slug);
}

export function photoFor(name: string) {
  const slug = teamByName.get(name.trim().toLowerCase());
  return slug ? `/team/${slug}.jpg` : null;
}

// Notion's light tag palette, with text darkened to pass contrast at 12px.
const TAG_COLORS = [
  { background: "#f1f1ef", color: "#55534e" },
  { background: "#f4eeee", color: "#6f4a39" },
  { background: "#fbecdd", color: "#93500d" },
  { background: "#fbf3db", color: "#7d5a12" },
  { background: "#edf3ec", color: "#2f5d46" },
  { background: "#e7f3f8", color: "#24597a" },
  { background: "#f6f3f9", color: "#654381" },
  { background: "#faf1f5", color: "#8a365f" },
  { background: "#fdebec", color: "#9b3532" },
];

export function tagColor(tag: string) {
  let hash = 0;
  for (const char of tag.toLowerCase()) hash = (hash * 31 + char.charCodeAt(0)) >>> 0;
  return TAG_COLORS[hash % TAG_COLORS.length];
}

// The main cities get fixed, clearly different colors so the calendar reads at a glance.
const CITY_COLORS: Record<string, (typeof TAG_COLORS)[number]> = {
  nyc: TAG_COLORS[5],
  sf: TAG_COLORS[4],
  both: TAG_COLORS[6],
  la: TAG_COLORS[7],
};

export function locationColor(location: string) {
  if (!location) return TAG_COLORS[0];
  return CITY_COLORS[location.trim().toLowerCase()] ?? tagColor(location);
}

const URGENCY_RANK: Record<Urgency, number> = { urgent: 0, soon: 1, normal: 2 };

function deadlineKey(item: PlanningItem) {
  return ISO_DATE.test(item.deadline) ? item.deadline : "9999";
}

export function compareBy(sortBy: SortBy) {
  return (a: PlanningItem, b: PlanningItem) => {
    if (sortBy === "name") return a.company.localeCompare(b.company);
    if (sortBy === "updated") return b.updatedAt.localeCompare(a.updatedAt);
    if (sortBy === "deadline") {
      return deadlineKey(a).localeCompare(deadlineKey(b)) || URGENCY_RANK[a.urgency] - URGENCY_RANK[b.urgency];
    }
    return (
      URGENCY_RANK[a.urgency] - URGENCY_RANK[b.urgency] ||
      deadlineKey(a).localeCompare(deadlineKey(b)) ||
      a.company.localeCompare(b.company)
    );
  };
}

export type Group = {
  key: string;
  label: string;
  status?: Status;
  urgency?: Urgency;
  items: PlanningItem[];
  defaults: PlanningPatch;
};

export function groupItems(items: PlanningItem[], groupBy: GroupBy): Group[] {
  if (groupBy === "none") return [{ key: "all", label: "All items", items, defaults: {} }];
  if (groupBy === "status") {
    return STATUSES.map((status) => ({
      key: status,
      label: STATUS_LABEL[status],
      status,
      items: items.filter((item) => item.status === status),
      defaults: { status },
    }));
  }
  if (groupBy === "urgency") {
    return URGENCIES.map((urgency) => ({
      key: urgency,
      label: URGENCY_LABEL[urgency],
      urgency,
      items: items.filter((item) => item.urgency === urgency),
      defaults: { urgency },
    }));
  }
  const locations = [...new Set(items.map((item) => item.location))].sort((a, b) =>
    !a ? 1 : !b ? -1 : a.localeCompare(b),
  );
  return locations.map((location) => ({
    key: `location:${location}`,
    label: location || "No location",
    items: items.filter((item) => item.location === location),
    defaults: { location },
  }));
}

export function itemMatches(item: PlanningItem, filters: Filters, query: string) {
  const { status, urgency, location, owners, roles } = filters;
  if (status.length && !status.includes(item.status)) return false;
  if (urgency.length && !urgency.includes(item.urgency)) return false;
  if (location.length && !location.includes(item.location)) return false;
  if (owners.length && !item.owners.some((owner) => owners.includes(owner))) return false;
  if (roles.length && !item.roles.some((role) => roles.includes(role))) return false;
  if (!query) return true;
  return [item.company, item.description, item.nextStep, item.notes, item.poc, ...item.owners, ...item.roles]
    .join(" ")
    .toLowerCase()
    .includes(query);
}
