"use client";

import { useLayoutEffect, useRef, useState } from "react";

import { monoLabelClassName } from "./directory-ui";

export type AdvisorView = "table" | "cards";

export const ADVISOR_VIEWS: { value: AdvisorView; label: string }[] = [
  { value: "table", label: "Table" },
  { value: "cards", label: "Cards" },
];

function TableIcon() {
  return (
    <svg className="size-4" viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <path
        d="M2.5 4h11M2.5 8h11M2.5 12h11"
        stroke="currentColor"
        strokeLinecap="round"
        strokeWidth="1.5"
      />
    </svg>
  );
}

function CardsIcon() {
  return (
    <svg className="size-4" viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <rect x="2.5" y="2.5" width="4.5" height="4.5" rx="1" stroke="currentColor" strokeWidth="1.5" />
      <rect x="9" y="2.5" width="4.5" height="4.5" rx="1" stroke="currentColor" strokeWidth="1.5" />
      <rect x="2.5" y="9" width="4.5" height="4.5" rx="1" stroke="currentColor" strokeWidth="1.5" />
      <rect x="9" y="9" width="4.5" height="4.5" rx="1" stroke="currentColor" strokeWidth="1.5" />
    </svg>
  );
}

export function AdvisorViewToggle({
  view,
  onChange,
}: {
  view: AdvisorView;
  onChange: (view: AdvisorView) => void;
}) {
  const optionRefs = useRef(new Map<AdvisorView, HTMLButtonElement>());
  const [thumb, setThumb] = useState<{ x: number; width: number } | null>(null);

  useLayoutEffect(() => {
    const active = optionRefs.current.get(view);
    if (!active) return;
    const measure = () => setThumb({ x: active.offsetLeft, width: active.offsetWidth });
    measure();
    const observer = new ResizeObserver(measure);
    for (const option of optionRefs.current.values()) observer.observe(option);
    return () => observer.disconnect();
  }, [view]);

  return (
    <div
      className="view-toggle shrink-0 rounded-full bg-white p-[3px] shadow-[0_1px_4px_rgba(0,0,0,0.08)]"
      role="group"
      aria-label="Advisor layout"
    >
      <span
        className="view-toggle-thumb rounded-full bg-surface-muted"
        data-measured={thumb ? "" : undefined}
        aria-hidden="true"
        style={thumb ? { transform: `translateX(${thumb.x}px)`, width: thumb.width } : undefined}
      />
      {ADVISOR_VIEWS.map((option) => (
        <button
          key={option.value}
          ref={(node) => {
            if (node) optionRefs.current.set(option.value, node);
            else optionRefs.current.delete(option.value);
          }}
          type="button"
          className="view-toggle-option cursor-pointer rounded-full bg-transparent px-3 text-muted hover:text-ink aria-pressed:text-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink"
          aria-pressed={view === option.value}
          onClick={() => onChange(option.value)}
        >
          {option.value === "table" ? <TableIcon /> : <CardsIcon />}
          <span className={`${monoLabelClassName} max-[519px]:sr-only`}>{option.label}</span>
        </button>
      ))}
    </div>
  );
}
