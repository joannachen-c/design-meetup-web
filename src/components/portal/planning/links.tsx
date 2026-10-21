"use client";

import { useState, type ReactNode } from "react";
import { isUnnamed, type PlanningItem, type PlanningLink, type PlanningPatch } from "@/lib/planning";
import { CloseIcon, PlusIcon, Popover, usePopoverAnchor } from "./ui";

type Mark = "doc" | "sheet" | "slides" | "form" | "drive" | "play" | "figma" | "link" | { letter: string };
type Service = { name: string | null; color: string; mark: Mark };

const SERVICES: Array<{ test: (host: string, path: string) => boolean } & Service> = [
  { test: (h, p) => h === "docs.google.com" && p.startsWith("/document"), name: "Google Doc", color: "#4285f4", mark: "doc" },
  { test: (h, p) => h === "docs.google.com" && p.startsWith("/spreadsheets"), name: "Google Sheet", color: "#0f9d58", mark: "sheet" },
  { test: (h, p) => h === "docs.google.com" && p.startsWith("/presentation"), name: "Google Slides", color: "#f4b400", mark: "slides" },
  { test: (h, p) => (h === "docs.google.com" && p.startsWith("/forms")) || h === "forms.gle", name: "Google Form", color: "#7248b9", mark: "form" },
  { test: (h) => h === "drive.google.com", name: "Google Drive", color: "#1a73e8", mark: "drive" },
  { test: (h) => h === "mail.google.com", name: "Gmail", color: "#ea4335", mark: { letter: "M" } },
  { test: (h) => h === "calendar.google.com", name: "Google Calendar", color: "#1a73e8", mark: { letter: "31" } },
  { test: (h) => h.endsWith("figma.com"), name: "Figma", color: "transparent", mark: "figma" },
  { test: (h) => h.endsWith("notion.so") || h.endsWith("notion.site"), name: "Notion", color: "#191919", mark: { letter: "N" } },
  { test: (h) => h.endsWith("canva.com"), name: "Canva", color: "#00c4cc", mark: { letter: "C" } },
  { test: (h) => h === "lu.ma" || h.endsWith("luma.com"), name: "Luma", color: "#191919", mark: { letter: "L" } },
  { test: (h) => h.endsWith("loom.com"), name: "Loom", color: "#625df5", mark: { letter: "L" } },
  { test: (h) => h.endsWith("github.com"), name: "GitHub", color: "#24292f", mark: { letter: "GH" } },
  { test: (h) => h.endsWith("slack.com"), name: "Slack", color: "#4a154b", mark: { letter: "S" } },
  { test: (h) => h.endsWith("instagram.com"), name: "Instagram", color: "#d62976", mark: { letter: "IG" } },
  { test: (h) => h.endsWith("linkedin.com"), name: "LinkedIn", color: "#0a66c2", mark: { letter: "in" } },
  { test: (h) => h.endsWith("youtube.com") || h === "youtu.be", name: "YouTube", color: "#ff0000", mark: "play" },
];

function parse(url: string) {
  try {
    const parsed = new URL(url);
    return { host: parsed.hostname.replace(/^www\./, ""), path: parsed.pathname };
  } catch {
    return { host: url, path: "" };
  }
}

function serviceFor(url: string): Service & { host: string } {
  const { host, path } = parse(url);
  const match = SERVICES.find((service) => service.test(host, path));
  return match ? { ...match, host } : { name: null, color: "#99a1af", mark: "link", host };
}

/** Labels default to the hostname on save; show the service name instead when we know it. */
function displayLabel(link: PlanningLink) {
  if (!isUnnamed(link)) return link.label.trim();
  const service = serviceFor(link.url);
  return service.name ?? service.host;
}

const GLYPHS: Record<Exclude<Mark, "figma" | { letter: string }>, ReactNode> = {
  doc: <path d="M5 5.5h6M5 8h6M5 10.5h3.5" stroke="#fff" strokeWidth="1.3" strokeLinecap="round" />,
  sheet: (
    <path d="M4.5 5h7v6h-7zM4.5 8h7M8 5v6" fill="none" stroke="#fff" strokeWidth="1.2" strokeLinejoin="round" />
  ),
  slides: <rect x="4.25" y="5.25" width="7.5" height="5.5" rx="1" fill="none" stroke="#fff" strokeWidth="1.3" />,
  form: (
    <>
      <circle cx="5.5" cy="6" r="0.9" fill="#fff" />
      <circle cx="5.5" cy="10" r="0.9" fill="#fff" />
      <path d="M7.5 6h3.5M7.5 10h3.5" stroke="#fff" strokeWidth="1.3" strokeLinecap="round" />
    </>
  ),
  drive: <path d="M8 4.5 11.5 10.5h-7z" fill="none" stroke="#fff" strokeWidth="1.3" strokeLinejoin="round" />,
  play: <path d="M6.5 5.5v5l4-2.5z" fill="#fff" />,
  link: (
    <path
      d="M7 9 9 7M6.2 7.6 5.3 8.5a1.7 1.7 0 0 0 2.4 2.4l.9-.9M9.8 8.4l.9-.9a1.7 1.7 0 0 0-2.4-2.4l-.9.9"
      fill="none"
      stroke="#fff"
      strokeWidth="1.3"
      strokeLinecap="round"
    />
  ),
};

export function ServiceIcon({ url }: { url: string }) {
  const { mark, color } = serviceFor(url);
  if (mark === "figma") {
    return (
      <svg aria-hidden viewBox="0 0 16 16" className="size-4 shrink-0">
        <circle cx="6.2" cy="3.6" r="2.3" fill="#f24e1e" />
        <circle cx="9.8" cy="3.6" r="2.3" fill="#ff7262" />
        <circle cx="6.2" cy="8" r="2.3" fill="#a259ff" />
        <circle cx="9.8" cy="8" r="2.3" fill="#1abcfe" />
        <circle cx="6.2" cy="12.4" r="2.3" fill="#0acf83" />
      </svg>
    );
  }
  return (
    <svg aria-hidden viewBox="0 0 16 16" className="size-4 shrink-0">
      <circle cx="8" cy="8" r="8" fill={color} />
      {typeof mark === "object" ? (
        <text
          x="8"
          y="8.5"
          fill="#fff"
          fontSize={mark.letter.length > 1 ? 6.5 : 9}
          fontWeight="700"
          textAnchor="middle"
          dominantBaseline="middle"
          fontFamily="inherit"
        >
          {mark.letter}
        </text>
      ) : (
        GLYPHS[mark]
      )}
    </svg>
  );
}

// The outline is an inset shadow so overflow-clipped containers (table cells) can't cut it off.
const CHIP_FRAME =
  "rounded-full bg-white shadow-[inset_0_0_0_1px_rgb(0_0_0/0.1)] transition-shadow hover:shadow-[inset_0_0_0_1px_rgb(0_0_0/0.22)]";

/** Icon-only chip for squeezing extra links into a table cell. */
export function LinkIconChip({ link }: { link: PlanningLink }) {
  const label = displayLabel(link);
  return (
    <a
      href={link.url}
      target="_blank"
      rel="noopener noreferrer"
      title={label}
      aria-label={label}
      className={`grid size-6 shrink-0 place-items-center ${CHIP_FRAME}`}
    >
      <ServiceIcon url={link.url} />
    </a>
  );
}

export function LinkChip({ link, onRemove }: { link: PlanningLink; onRemove?: () => void }) {
  const label = displayLabel(link);
  return (
    <span
      className={`inline-flex h-6 max-w-full min-w-0 items-center gap-1 pl-1 text-xs text-ink ${CHIP_FRAME} ${onRemove ? "pr-0.5" : "pr-2"}`}
    >
      <a
        href={link.url}
        target="_blank"
        rel="noopener noreferrer"
        title={link.url}
        className="inline-flex min-w-0 items-center gap-1.5 text-ink no-underline"
      >
        <ServiceIcon url={link.url} />
        <span className="min-w-0 max-w-44 truncate">{label}</span>
      </a>
      {onRemove ? (
        <button
          type="button"
          aria-label={`Remove ${label}`}
          onClick={onRemove}
          className="grid size-5 cursor-pointer place-items-center rounded-full border-0 bg-transparent p-0 text-subtle hover:bg-red-50 hover:text-red-700"
        >
          <CloseIcon className="size-2.5" />
        </button>
      ) : null}
    </span>
  );
}

function withProtocol(url: string) {
  return /^https?:\/\//i.test(url) ? url : `https://${url}`;
}

export function LinksEditor({
  links,
  onChange,
  startAdding = false,
}: {
  links: PlanningLink[];
  onChange: (links: PlanningLink[]) => void;
  startAdding?: boolean;
}) {
  const [adding, setAdding] = useState(startAdding);
  const inputClass =
    "h-8 min-w-0 rounded-[7px] border-0 bg-surface-muted px-2.5 font-[inherit] text-sm text-ink outline-none placeholder:text-subtle focus:shadow-[inset_0_0_0_1.5px_var(--color-ink)]";

  return (
    <div className="grid gap-2">
      <div className="flex flex-wrap items-center gap-1.5">
        {links.map((link, index) => (
          <LinkChip
            key={`${link.url}-${index}`}
            link={link}
            onRemove={() => onChange(links.filter((_, other) => other !== index))}
          />
        ))}
        {adding ? null : (
          <button
            type="button"
            onClick={() => setAdding(true)}
            className="inline-flex h-6 cursor-pointer items-center gap-1 rounded-full border border-dashed border-black/20 bg-transparent px-2 font-[inherit] text-xs text-muted hover:border-ink hover:text-ink"
          >
            <PlusIcon className="size-3" />
            Add link
          </button>
        )}
      </div>
      {adding ? (
        <form
          className="flex flex-wrap gap-1.5"
          onSubmit={(event) => {
            event.preventDefault();
            const form = new FormData(event.currentTarget);
            const url = String(form.get("url") || "").trim();
            if (!url) return;
            onChange([...links, { label: String(form.get("label") || "").trim(), url: withProtocol(url) }]);
            event.currentTarget.reset();
            setAdding(false);
          }}
        >
          <input
            name="url"
            required
            autoFocus
            aria-label="Link URL"
            placeholder="Paste a Google Doc, Figma, Notion… link"
            className={`${inputClass} min-w-48 flex-1`}
          />
          <input name="label" aria-label="Link label (optional)" placeholder="Label (optional)" className={`${inputClass} w-32`} />
          <button
            type="submit"
            className="h-8 cursor-pointer rounded-[7px] border-0 bg-ink px-3 font-[inherit] text-sm font-bold text-white"
          >
            Add
          </button>
        </form>
      ) : null}
    </div>
  );
}

// After the first full chip, a few more links fit as icons before collapsing to "+N".
const MAX_ICON_CHIPS = 3;

export function LinksCell({ item, save }: { item: PlanningItem; save: (patch: PlanningPatch) => void }) {
  const { anchor, toggle, close } = usePopoverAnchor();
  const [first, ...rest] = item.links;
  const icons = rest.slice(0, MAX_ICON_CHIPS);
  const hidden = rest.length - icons.length;
  return (
    <div className="flex h-9 min-w-0 items-center gap-1 px-2">
      <div className="flex min-w-0 flex-1 items-center gap-1 overflow-hidden">
        {first ? <LinkChip link={first} /> : null}
        {icons.map((link, index) => (
          <LinkIconChip key={`${link.url}-${index}`} link={link} />
        ))}
        {hidden > 0 ? <span className="shrink-0 text-xs text-muted">+{hidden}</span> : null}
      </div>
      <button
        type="button"
        aria-label={`Edit links for ${item.company}`}
        onClick={toggle}
        className={`grid size-6 shrink-0 cursor-pointer place-items-center rounded-[6px] border-0 bg-transparent text-subtle hover:bg-black/[0.05] hover:text-ink focus-visible:opacity-100 ${anchor ? "opacity-100" : "opacity-0 group-hover:opacity-100"}`}
      >
        <PlusIcon className="size-3.5" />
      </button>
      {anchor ? (
        <Popover anchor={anchor} label={`Links for ${item.company}`} width={340} onClose={close}>
          <div className="p-1.5">
            <LinksEditor links={item.links} onChange={(links) => save({ links })} startAdding={!item.links.length} />
          </div>
        </Popover>
      ) : null}
    </div>
  );
}
