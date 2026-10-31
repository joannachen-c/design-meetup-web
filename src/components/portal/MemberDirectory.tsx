"use client";

import { useDeferredValue, useMemo, useState, type ReactNode } from "react";
import { showSuccessToast } from "@/components/AppToaster";
import { Input } from "@/components/Input";
import { Primary } from "@/components/Primary";
import { Select } from "@/components/Select";
import { ArrowUpRightIcon } from "@/components/icons/ArrowUpRightIcon";
import { AvatarImage } from "@/components/portal/AvatarImage";
import { PersonSilhouette } from "@/components/portal/PersonSilhouette";
import {
  GitHubIcon,
  InstagramIcon,
  LinkedInIcon,
  XIcon,
  YouTubeIcon,
} from "@/components/portal/SocialIcons";
import {
  DISCIPLINES,
  EMPTY_FILTERS,
  REGIONS,
  disciplineLabel,
  filterDirectory,
  linkLabel,
  type DirectoryFilters,
  type DirectoryKind,
  type DirectoryLinks,
  type Discipline,
  type MemberCard,
  type PendingMember,
  type Region,
  type TeamRow,
} from "@/lib/directory";

type MemberDirectoryProps = {
  viewerId: string;
  nudge: boolean;
} & (
  | { mode: "member"; members: MemberCard[] }
  | { mode: "team"; members: TeamRow[]; pending: PendingMember[] }
);

const KIND_OPTIONS: Array<{ value: DirectoryKind; label: string }> = [
  { value: "all", label: "Everyone" },
  { value: "professional", label: "Professionals" },
  { value: "student", label: "Students" },
  { value: "advisor", label: "Advisors" },
];

const SOCIALS: Array<{
  key: Exclude<keyof DirectoryLinks, "website">;
  label: string;
  icon: ReactNode;
}> = [
  { key: "linkedin", label: "LinkedIn", icon: <LinkedInIcon /> },
  { key: "instagram", label: "Instagram", icon: <InstagramIcon /> },
  { key: "x", label: "X", icon: <XIcon /> },
  { key: "github", label: "GitHub", icon: <GitHubIcon /> },
  { key: "youtube", label: "YouTube", icon: <YouTubeIcon /> },
];

/** Our avatar route can resize; a full upload can be several MB. */
function thumbnailUrl(url: string, width: number) {
  if (!url.startsWith("/api/portal/avatar/")) return url;
  return `${url}${url.includes("?") ? "&" : "?"}w=${width}`;
}

function Avatar({ card, size }: { card: MemberCard; size: "sm" | "lg" }) {
  const [failed, setFailed] = useState<string | null>(null);
  const box = size === "lg" ? "size-14" : "size-7";
  if (card.avatarUrl && failed !== card.avatarUrl) {
    return (
      <AvatarImage
        src={thumbnailUrl(card.avatarUrl, size === "lg" ? 128 : 64)}
        className={`${box} shrink-0 rounded-full object-cover`}
        width={size === "lg" ? 56 : 28}
        height={size === "lg" ? 56 : 28}
        loading="lazy"
        onFail={() => setFailed(card.avatarUrl)}
      />
    );
  }
  return (
    <span className={`${box} grid shrink-0 place-items-end overflow-hidden rounded-full bg-skeleton text-subtle`}>
      <PersonSilhouette className="size-[85%] translate-x-[8%]" />
    </span>
  );
}

function Tag({ children, tone = "plain" }: { children: ReactNode; tone?: "plain" | "ink" }) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-sm leading-6 ${
        tone === "ink" ? "bg-ink text-white" : "bg-white text-ink ring-1 ring-black/5"
      }`}
    >
      {children}
    </span>
  );
}

function DirectoryCard({ card, own }: { card: MemberCard; own: boolean }) {
  const socials = SOCIALS.filter((social) => card.links[social.key]);
  return (
    <article
      className={`flex min-w-0 flex-col gap-4 rounded-[20px] bg-surface-muted p-5 ${own ? "ring-2 ring-ink/10" : ""}`}
    >
      <div className="flex items-start gap-3.5">
        <Avatar card={card} size="lg" />
        <div className="min-w-0 flex-1 pt-0.5">
          <h2 className="m-0 truncate text-lg font-bold leading-tight tracking-[-0.03em]">
            {card.name}
          </h2>
          {card.role ? (
            <p className="m-0 mt-1 line-clamp-2 text-[15px] leading-snug text-pretty">{card.role}</p>
          ) : null}
          {card.location ? (
            <p className="m-0 mt-1 truncate text-sm text-muted">{card.location}</p>
          ) : null}
        </div>
      </div>

      {card.advisor || own || card.disciplines.length ? (
        <div className="flex flex-wrap gap-1.5">
          {own ? <Tag tone="ink">You</Tag> : null}
          {card.advisor ? <Tag tone="ink">Advisor</Tag> : null}
          {card.disciplines.map((discipline) => (
            <Tag key={discipline}>{disciplineLabel(discipline)}</Tag>
          ))}
        </div>
      ) : null}

      <div className="mt-auto flex min-h-9 items-center gap-1">
        {card.links.website ? (
          <a
            className="mr-auto inline-flex min-w-0 items-center gap-1 rounded-[8px] py-1.5 text-base font-bold text-ink no-underline transition-colors hover:text-muted focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink"
            href={card.links.website}
            target="_blank"
            rel="noreferrer"
          >
            <span className="truncate">{linkLabel(card.links.website)}</span>
            <ArrowUpRightIcon />
          </a>
        ) : own ? (
          <a
            className="mr-auto py-1.5 text-base text-muted no-underline hover:text-ink"
            href="/portal/profile"
          >
            Add your portfolio
          </a>
        ) : (
          <span className="mr-auto" />
        )}
        {socials.map((social) => (
          <a
            key={social.key}
            className="grid size-9 place-items-center rounded-full text-muted transition-colors hover:bg-gray-200 hover:text-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink"
            href={card.links[social.key] ?? undefined}
            target="_blank"
            rel="noreferrer"
            aria-label={`${card.name} on ${social.label}`}
          >
            {social.icon}
          </a>
        ))}
      </div>
    </article>
  );
}

type SortKey = "name" | "tier" | "location" | "cohort" | "joinedAt" | "profileComplete";

const TEAM_COLUMNS: Array<{ key: SortKey | null; label: string }> = [
  { key: "name", label: "Name" },
  { key: null, label: "Email" },
  { key: "tier", label: "Tier" },
  { key: null, label: "Role" },
  { key: "location", label: "Location" },
  { key: "cohort", label: "Cohort" },
  { key: "joinedAt", label: "Member since" },
  { key: "profileComplete", label: "Profile" },
  { key: null, label: "Portfolio" },
];

function compareRows(a: TeamRow, b: TeamRow, key: SortKey) {
  const value = (row: TeamRow) => {
    if (key === "profileComplete") return row.profileComplete ? 1 : 0;
    if (key === "cohort") return row.cohort ?? 99;
    return row[key] ?? "";
  };
  const left = value(a);
  const right = value(b);
  if (typeof left === "number" && typeof right === "number") return left - right;
  return String(left).localeCompare(String(right));
}

function TeamTable({ rows }: { rows: TeamRow[] }) {
  const [sort, setSort] = useState<{ key: SortKey; dir: 1 | -1 }>({ key: "name", dir: 1 });
  const sorted = useMemo(
    () => [...rows].sort((a, b) => compareRows(a, b, sort.key) * sort.dir),
    [rows, sort],
  );
  return (
    <div className="overflow-x-auto rounded-[20px] bg-surface-muted">
      <table className="w-full min-w-[1080px] border-collapse text-left text-[15px]">
        <thead>
          <tr className="border-b border-black/5">
            {TEAM_COLUMNS.map((column) => (
              <th
                key={column.label}
                scope="col"
                className="px-4 py-3 text-sm font-bold whitespace-nowrap text-muted"
                aria-sort={
                  column.key && sort.key === column.key
                    ? sort.dir === 1
                      ? "ascending"
                      : "descending"
                    : undefined
                }
              >
                {column.key ? (
                  <button
                    type="button"
                    className="cursor-pointer rounded-[6px] hover:text-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink"
                    onClick={() =>
                      setSort((current) => ({
                        key: column.key as SortKey,
                        dir: current.key === column.key ? (current.dir === 1 ? -1 : 1) : 1,
                      }))
                    }
                  >
                    {column.label}
                    {sort.key === column.key ? (sort.dir === 1 ? " ↑" : " ↓") : ""}
                  </button>
                ) : (
                  column.label
                )}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {sorted.map((row) => (
            <tr key={row.id} className="border-b border-black/5 last:border-0">
              <td className="px-4 py-2.5">
                <span className="flex items-center gap-2.5 whitespace-nowrap">
                  <Avatar card={row} size="sm" />
                  <span className="font-medium">{row.name}</span>
                  {row.advisor ? <Tag tone="ink">Advisor</Tag> : null}
                </span>
              </td>
              <td className="px-4 py-2.5">
                <a className="text-ink no-underline hover:text-muted" href={`mailto:${row.email}`}>
                  {row.email}
                </a>
              </td>
              <td className="px-4 py-2.5 whitespace-nowrap">
                {row.tier === "student" ? "Student" : "Professional"}
              </td>
              <td className="max-w-[260px] px-4 py-2.5">
                <span className="line-clamp-2">{row.role ?? <span className="text-subtle">—</span>}</span>
              </td>
              <td className="px-4 py-2.5 whitespace-nowrap">
                {row.location ?? <span className="text-subtle">—</span>}
              </td>
              <td className="px-4 py-2.5 whitespace-nowrap">
                {row.cohort === null ? <span className="text-subtle">—</span> : row.cohort}
              </td>
              <td className="px-4 py-2.5 whitespace-nowrap">{row.memberSince ?? "—"}</td>
              <td className="px-4 py-2.5 whitespace-nowrap">
                {row.profileComplete ? "Complete" : <span className="text-muted">Incomplete</span>}
              </td>
              <td className="px-4 py-2.5">
                {row.links.website ? (
                  <a
                    className="inline-flex items-center gap-1 font-bold whitespace-nowrap text-ink no-underline hover:text-muted"
                    href={row.links.website}
                    target="_blank"
                    rel="noreferrer"
                  >
                    {linkLabel(row.links.website)}
                    <ArrowUpRightIcon />
                  </a>
                ) : (
                  <span className="text-subtle">—</span>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function csvCell(value: string | number | null) {
  const text = value === null ? "" : String(value);
  return /[",\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}

function downloadCsv(rows: TeamRow[]) {
  const header = [
    "Name",
    "Email",
    "Tier",
    "Advisor",
    "Role",
    "Location",
    "Disciplines",
    "Cohort",
    "Member since",
    "Website",
    "LinkedIn",
  ];
  const lines = rows.map((row) =>
    [
      row.name,
      row.email,
      row.tier,
      row.advisor ? "yes" : "",
      row.role,
      row.location,
      row.disciplines.map(disciplineLabel).join("; "),
      row.cohort,
      row.memberSince,
      row.links.website,
      row.links.linkedin,
    ]
      .map(csvCell)
      .join(","),
  );
  const blob = new Blob([[header.join(","), ...lines].join("\n")], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `design-meetup-directory-${new Date().toISOString().slice(0, 10)}.csv`;
  link.click();
  URL.revokeObjectURL(url);
}

function PendingList({ pending }: { pending: PendingMember[] }) {
  if (!pending.length) return null;
  return (
    <details className="group mt-12 rounded-[20px] bg-surface-muted p-5">
      <summary className="flex cursor-pointer list-none items-center justify-between gap-4 text-lg font-bold tracking-[-0.03em]">
        {pending.length} {pending.length === 1 ? "person hasn't" : "people haven't"} made an account
        <span className="text-sm font-normal text-muted group-open:hidden">Show</span>
        <span className="hidden text-sm font-normal text-muted group-open:inline">Hide</span>
      </summary>
      <div className="mt-4 flex justify-end">
        <Primary
          variant="secondary"
          onClick={() => {
            void navigator.clipboard
              .writeText(pending.map((person) => person.email).join(", "))
              .then(() => showSuccessToast("Emails copied."));
          }}
        >
          Copy emails
        </Primary>
      </div>
      <ul className="m-0 mt-4 grid list-none gap-x-6 gap-y-2 p-0 sm:grid-cols-2 xl:grid-cols-3">
        {pending.map((person) => (
          <li key={person.email} className="flex min-w-0 items-center justify-between gap-3 text-[15px]">
            <span className="truncate">{person.email}</span>
            <span className="shrink-0 text-sm text-muted">{person.sources.join(", ")}</span>
          </li>
        ))}
      </ul>
    </details>
  );
}

export function MemberDirectory(props: MemberDirectoryProps) {
  const { members, viewerId, nudge } = props;
  const [filters, setFilters] = useState<DirectoryFilters>(EMPTY_FILTERS);
  const [view, setView] = useState<"cards" | "table">("cards");
  const query = useDeferredValue(filters.query);
  const shown = useMemo(
    () => filterDirectory<MemberCard>(members, { ...filters, query }),
    [members, filters, query],
  );
  const filtered =
    filters.query.trim() !== "" ||
    filters.kind !== "all" ||
    filters.region !== "all" ||
    filters.discipline !== "all";
  const advisors = members.filter((member) => member.advisor).length;
  const update = (patch: Partial<DirectoryFilters>) =>
    setFilters((current) => ({ ...current, ...patch }));

  return (
    <>
      <header className="flex flex-wrap items-end justify-between gap-x-8 gap-y-5">
        <div>
          <h1 className="m-0 text-[clamp(2.5rem,6vw,4.5rem)] font-bold leading-[1.02] tracking-[-0.06em]">
            Directory
          </h1>
          <p className="m-0 mt-3 text-base text-muted">
            {members.length} members
            {advisors ? `, including ${advisors} on the Board of Advisors` : ""}
          </p>
        </div>
        {props.mode === "team" ? (
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex rounded-[12px] bg-surface-muted p-1" role="group" aria-label="Layout">
              {([
                ["cards", "Cards"],
                ["table", "Table"],
              ] as const).map(([option, label]) => (
                <button
                  key={option}
                  type="button"
                  aria-pressed={view === option}
                  onClick={() => setView(option)}
                  className="min-h-9 cursor-pointer rounded-[9px] px-3.5 text-base text-muted transition-colors hover:text-ink aria-pressed:bg-white aria-pressed:text-ink aria-pressed:shadow-sm focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink"
                >
                  {label}
                </button>
              ))}
            </div>
            <Primary
              variant="secondary"
              onClick={() => downloadCsv(shown as TeamRow[])}
            >
              Download CSV
            </Primary>
          </div>
        ) : null}
      </header>

      {nudge ? (
        <p className="m-0 mt-8 flex flex-wrap items-center gap-x-3 gap-y-1 rounded-[14px] bg-accent-primary px-4 py-3 text-base text-ink">
          Add your role, website, and city so members can find you.
          <a className="inline-flex items-center gap-1 font-bold text-ink no-underline" href="/portal/profile">
            Complete your profile
            <ArrowUpRightIcon />
          </a>
        </p>
      ) : null}

      <div className="mt-8 flex flex-wrap gap-2.5">
        <Input
          className="min-w-[min(100%,240px)] flex-1 sm:max-w-[360px]"
          type="search"
          placeholder="Search names, companies, schools"
          aria-label="Search the directory"
          value={filters.query}
          onChange={(event) => update({ query: event.target.value })}
        />
        <Select
          aria-label="Member type"
          options={KIND_OPTIONS}
          value={filters.kind}
          onValueChange={(value) => update({ kind: value as DirectoryKind })}
        />
        <Select
          aria-label="City"
          options={[{ value: "all", label: "Anywhere" }, ...REGIONS]}
          value={filters.region}
          onValueChange={(value) => update({ region: value as Region | "all" })}
        />
        <Select
          aria-label="Discipline"
          options={[{ value: "all", label: "Any discipline" }, ...DISCIPLINES]}
          value={filters.discipline}
          onValueChange={(value) => update({ discipline: value as Discipline | "all" })}
        />
        {filtered ? (
          <Primary variant="ghost" onClick={() => setFilters(EMPTY_FILTERS)}>
            Clear
          </Primary>
        ) : null}
      </div>

      <p className="m-0 mt-4 min-h-6 text-sm text-muted" aria-live="polite">
        {filtered ? `Showing ${shown.length} of ${members.length}` : ""}
      </p>

      {shown.length === 0 ? (
        <div className="mt-2 grid place-items-center gap-3 rounded-[20px] bg-surface-muted px-6 py-16 text-center">
          <p className="m-0 text-base text-muted">No one matches those filters.</p>
          <Primary variant="secondary" onClick={() => setFilters(EMPTY_FILTERS)}>
            Clear filters
          </Primary>
        </div>
      ) : props.mode === "team" && view === "table" ? (
        <div className="mt-2">
          <TeamTable rows={shown as TeamRow[]} />
        </div>
      ) : (
        <div className="mt-2 grid grid-cols-[repeat(auto-fill,minmax(min(100%,280px),1fr))] gap-4">
          {shown.map((card) => (
            <DirectoryCard key={card.id} card={card} own={card.id === viewerId} />
          ))}
        </div>
      )}

      {props.mode === "team" ? <PendingList pending={props.pending} /> : null}
    </>
  );
}
