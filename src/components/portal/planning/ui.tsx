"use client";

import { useEffect, useLayoutEffect, useRef, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import type { Status, Urgency } from "@/lib/planning";
import { photoFor, tagColor } from "./model";

/** Fixed-position so it isn't clipped by the table's horizontal scroll container. */
export function Popover({
  anchor,
  label,
  width = 260,
  onClose,
  children,
}: {
  anchor: HTMLElement;
  label: string;
  width?: number;
  onClose: () => void;
  children: ReactNode;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const close = useRef(onClose);
  close.current = onClose;
  const [position, setPosition] = useState<{ top: number; left: number } | null>(null);

  useLayoutEffect(() => {
    const rect = anchor.getBoundingClientRect();
    const height = ref.current?.offsetHeight ?? 0;
    const left = Math.max(8, Math.min(rect.left, window.innerWidth - width - 8));
    const below = rect.bottom + 4;
    const flip = below + height > window.innerHeight - 8 && rect.top - height - 4 > 8;
    setPosition({ top: flip ? rect.top - height - 4 : below, left });
  }, [anchor, width]);

  useEffect(() => {
    const first = ref.current?.querySelector<HTMLElement>("input, button, [tabindex]");
    first?.focus();
    const onPointer = (event: PointerEvent) => {
      const target = event.target as Node;
      if (!ref.current?.contains(target) && !anchor.contains(target)) close.current();
    };
    const onKey = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      // Fields inside the popover that cancel their own edit on Escape keep it open.
      if ((event.target as Element | null)?.closest?.("[data-own-escape]")) return;
      event.stopPropagation();
      close.current();
      anchor.focus();
    };
    const onScroll = (event: Event) => {
      if (!ref.current?.contains(event.target as Node)) close.current();
    };
    const onResize = () => close.current();
    document.addEventListener("pointerdown", onPointer, true);
    document.addEventListener("keydown", onKey, true);
    window.addEventListener("scroll", onScroll, true);
    window.addEventListener("resize", onResize);
    return () => {
      document.removeEventListener("pointerdown", onPointer, true);
      document.removeEventListener("keydown", onKey, true);
      window.removeEventListener("scroll", onScroll, true);
      window.removeEventListener("resize", onResize);
    };
  }, [anchor]);

  return createPortal(
    <div
      ref={ref}
      role="dialog"
      aria-label={label}
      style={{
        position: "fixed",
        width,
        top: position?.top ?? -9999,
        left: position?.left ?? -9999,
      }}
      className="z-[60] max-h-[min(420px,calc(100vh-16px))] overflow-y-auto rounded-[10px] bg-white p-1 text-sm text-ink shadow-[0_10px_32px_rgb(18_24_38/0.14)] ring-1 ring-black/[0.08]"
    >
      {children}
    </div>,
    document.body,
  );
}

/** Opens a popover from a trigger button; clicking the trigger again closes it. */
export function usePopoverAnchor() {
  const [anchor, setAnchor] = useState<HTMLElement | null>(null);
  return {
    anchor,
    toggle: (event: React.MouseEvent<HTMLElement>) => {
      const target = event.currentTarget;
      setAnchor((current) => (current ? null : target));
    },
    close: () => setAnchor(null),
  };
}

export function CheckIcon({ className = "size-4" }: { className?: string }) {
  return (
    <svg aria-hidden viewBox="0 0 16 16" className={className}>
      <path d="m3.5 8.5 3 3 6-7" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function ChevronIcon({ open, className = "size-3.5" }: { open: boolean; className?: string }) {
  return (
    <svg
      aria-hidden
      viewBox="0 0 16 16"
      className={`${className} transition-transform duration-150 motion-reduce:transition-none ${open ? "rotate-90" : ""}`}
    >
      <path d="M6 3.5 10.5 8 6 12.5" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function CloseIcon({ className = "size-3" }: { className?: string }) {
  return (
    <svg aria-hidden viewBox="0 0 10 10" className={`block ${className}`}>
      <path d="M2 2l6 6M8 2 2 8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

export function TrashIcon({ className = "size-3.5" }: { className?: string }) {
  return (
    <svg aria-hidden viewBox="0 0 16 16" className={className}>
      <path
        d="M3 4.5h10M6.5 4.5V3h3v1.5M4.5 4.5l.6 8.1a1 1 0 0 0 1 .9h3.8a1 1 0 0 0 1-.9l.6-8.1"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function PlusIcon({ className = "size-4" }: { className?: string }) {
  return (
    <svg aria-hidden viewBox="0 0 16 16" className={className}>
      <path d="M8 3.5v9M3.5 8h9" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

export function StatusIcon({ status, className = "size-3.5" }: { status: Status; className?: string }) {
  if (status === "attention") {
    return (
      <svg aria-hidden viewBox="0 0 14 14" className={`${className} shrink-0 text-red-700`}>
        <circle cx="7" cy="7" r="6.25" fill="currentColor" />
        <path d="M7 3.75v4" stroke="#fff" strokeWidth="1.5" strokeLinecap="round" />
        <circle cx="7" cy="10.1" r="0.9" fill="#fff" />
      </svg>
    );
  }
  if (status === "todo") {
    return (
      <svg aria-hidden viewBox="0 0 14 14" className={`${className} shrink-0 text-muted`}>
        <circle cx="7" cy="7" r="5.75" fill="none" stroke="currentColor" strokeWidth="1.5" />
      </svg>
    );
  }
  if (status === "motion") {
    return (
      <svg aria-hidden viewBox="0 0 14 14" className={`${className} shrink-0 text-ink`}>
        <circle cx="7" cy="7" r="5.75" fill="none" stroke="currentColor" strokeWidth="1.5" />
        <path d="M7 3.25a3.75 3.75 0 0 1 0 7.5Z" fill="currentColor" />
      </svg>
    );
  }
  if (status === "backlog") {
    return (
      <svg aria-hidden viewBox="0 0 14 14" className={`${className} shrink-0 text-subtle`}>
        <circle cx="7" cy="7" r="5.75" fill="none" stroke="currentColor" strokeWidth="1.5" strokeDasharray="2.2 2.2" />
      </svg>
    );
  }
  return (
    <svg aria-hidden viewBox="0 0 14 14" className={`${className} shrink-0 text-subtle`}>
      <circle cx="7" cy="7" r="6.25" fill="currentColor" />
      <path d="m4.4 7.2 1.8 1.8 3.5-3.8" fill="none" stroke="#fff" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function UrgencyIcon({ urgency, className = "size-3.5" }: { urgency: Urgency; className?: string }) {
  if (urgency === "urgent") {
    return (
      <svg aria-hidden viewBox="0 0 14 14" className={`${className} shrink-0 text-red-700`}>
        <rect x="0.75" y="0.75" width="12.5" height="12.5" rx="3" fill="currentColor" />
        <path d="M7 3.5v4.25" stroke="#fff" strokeWidth="1.5" strokeLinecap="round" />
        <circle cx="7" cy="10.2" r="0.9" fill="#fff" />
      </svg>
    );
  }
  const filled = urgency === "soon" ? 2 : 1;
  return (
    <svg aria-hidden viewBox="0 0 14 14" className={`${className} shrink-0 text-ink`}>
      {[0, 1, 2].map((bar) => (
        <rect
          key={bar}
          x={1.5 + bar * 4}
          y={9 - bar * 3}
          width="3"
          height={3.5 + bar * 3}
          rx="1"
          fill="currentColor"
          opacity={bar < filled ? 1 : 0.22}
        />
      ))}
    </svg>
  );
}

export function Avatar({ name, size = 20 }: { name: string; size?: number }) {
  const photo = photoFor(name);
  const initials = name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");
  return photo ? (
    <img
      src={photo}
      alt=""
      width={size}
      height={size}
      style={{ width: size, height: size }}
      className="shrink-0 rounded-full object-cover ring-2 ring-white"
    />
  ) : (
    <span
      aria-hidden
      style={{ width: size, height: size, fontSize: Math.round(size * 0.42) }}
      className="grid shrink-0 place-items-center rounded-full bg-skeleton font-bold text-muted ring-2 ring-white"
    >
      {initials || "?"}
    </span>
  );
}

export function People({ names, max = 3 }: { names: string[]; max?: number }) {
  if (!names.length) return null;
  if (names.length === 1) {
    return (
      <span className="flex min-w-0 items-center gap-1.5">
        <Avatar name={names[0]} />
        <span className="truncate">{names[0]}</span>
      </span>
    );
  }
  const shown = names.slice(0, max);
  return (
    <span className="flex min-w-0 items-center gap-1.5" title={names.join(", ")}>
      <span className="flex -space-x-1.5">
        {shown.map((name) => (
          <Avatar key={name} name={name} />
        ))}
      </span>
      <span className="truncate text-muted">
        {names.length > max ? `+${names.length - max}` : names.map((name) => name.split(" ")[0]).join(", ")}
      </span>
    </span>
  );
}

export function TagChip({ tag, color = tagColor(tag) }: { tag: string; color?: { background: string; color: string } }) {
  return (
    <span
      style={color}
      className="inline-flex h-5 max-w-full shrink-0 items-center truncate rounded-[4px] px-1.5 text-xs leading-5"
    >
      {tag}
    </span>
  );
}

export function MenuList<T extends string>({
  options,
  value,
  icon,
  onPick,
}: {
  options: Record<T, string>;
  value: T;
  icon?: (option: T) => ReactNode;
  onPick: (option: T) => void;
}) {
  return (
    <div className="grid">
      {(Object.keys(options) as T[]).map((option) => (
        <button
          key={option}
          type="button"
          aria-pressed={option === value}
          onClick={() => onPick(option)}
          className="flex h-8 cursor-pointer items-center gap-2 rounded-[7px] border-0 bg-transparent px-2 text-left font-[inherit] text-sm text-ink hover:bg-surface-muted focus-visible:bg-surface-muted focus-visible:outline-none"
        >
          {icon?.(option)}
          <span className="truncate">{options[option]}</span>
          {option === value ? <CheckIcon className="ml-auto size-4 text-muted" /> : null}
        </button>
      ))}
    </div>
  );
}

/** Search existing values or create a new one — no fixed option lists. */
export function OptionPicker({
  options,
  selected,
  multiple,
  placeholder,
  render,
  onChange,
  onDone,
  noun,
  onDeleteOption,
  canDeleteOption = () => true,
}: {
  options: string[];
  selected: string[];
  multiple: boolean;
  placeholder: string;
  render: (value: string) => ReactNode;
  onChange: (next: string[]) => void;
  onDone: () => void;
  noun: string;
  onDeleteOption?: (value: string) => void;
  canDeleteOption?: (value: string) => boolean;
}) {
  const [query, setQuery] = useState("");
  const text = query.trim();
  const needle = text.toLowerCase();
  const all = [...new Set([...selected, ...options.filter(Boolean)])];
  const shown = all.filter((option) => option.toLowerCase().includes(needle));
  const existing = all.find((option) => option.toLowerCase() === needle);

  const pick = (value: string) => {
    setQuery("");
    if (multiple) {
      onChange(selected.includes(value) ? selected.filter((entry) => entry !== value) : [...selected, value]);
      return;
    }
    onChange(selected[0] === value ? [] : [value]);
    onDone();
  };

  return (
    <div className="grid gap-1">
      <input
        aria-label={placeholder}
        placeholder={placeholder}
        value={query}
        onChange={(event) => setQuery(event.target.value)}
        onKeyDown={(event) => {
          if (event.key === "Enter" && text) {
            event.preventDefault();
            pick(existing ?? text);
          }
        }}
        className="h-8 w-full rounded-[7px] border-0 bg-surface-muted px-2.5 font-[inherit] text-sm text-ink outline-none placeholder:text-subtle"
      />
      <div className="grid">
        {shown.map((option) => (
          <div
            key={option}
            className="group/option flex h-8 min-w-0 items-center rounded-[7px] hover:bg-surface-muted focus-within:bg-surface-muted"
          >
            <button
              type="button"
              aria-pressed={selected.includes(option)}
              onClick={() => pick(option)}
              className="flex h-8 min-w-0 flex-1 cursor-pointer items-center gap-2 border-0 bg-transparent px-2 text-left font-[inherit] text-sm text-ink focus-visible:outline-none"
            >
              <span className="flex min-w-0 flex-1 items-center gap-2">{render(option)}</span>
              {selected.includes(option) ? <CheckIcon className="size-4 shrink-0 text-muted" /> : null}
            </button>
            {onDeleteOption && canDeleteOption(option) ? (
              <button
                type="button"
                aria-label={`Delete ${noun} ${option}`}
                title={`Delete ${noun}`}
                onClick={() => onDeleteOption(option)}
                className="mr-1 grid size-6 shrink-0 cursor-pointer place-items-center rounded-[6px] border-0 bg-transparent text-subtle opacity-0 group-hover/option:opacity-100 hover:bg-red-50 hover:text-red-700 focus-visible:opacity-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ink"
              >
                <TrashIcon />
              </button>
            ) : null}
          </div>
        ))}
        {text && !existing ? (
          <button
            type="button"
            onClick={() => pick(text)}
            className="flex h-8 min-w-0 cursor-pointer items-center gap-2 rounded-[7px] border-0 bg-transparent px-2 text-left font-[inherit] text-sm text-muted hover:bg-surface-muted focus-visible:bg-surface-muted focus-visible:outline-none"
          >
            <PlusIcon className="size-3.5 shrink-0" />
            <span className="truncate">
              Create <span className="text-ink">{text}</span>
            </span>
          </button>
        ) : null}
        {!shown.length && !text ? (
          <p className="m-0 px-2 py-1.5 text-sm text-subtle">Type to create one.</p>
        ) : null}
      </div>
      {selected.length && !multiple ? (
        <button
          type="button"
          onClick={() => {
            onChange([]);
            onDone();
          }}
          className="h-8 cursor-pointer rounded-[7px] border-0 bg-transparent px-2 text-left font-[inherit] text-sm text-muted hover:bg-surface-muted"
        >
          Clear
        </button>
      ) : null}
    </div>
  );
}
