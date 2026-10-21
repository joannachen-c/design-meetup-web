"use client";

import { useLayoutEffect, useRef, useState } from "react";

import { GridViewIcon } from "@/components/GalleryViewToggle";

export type AdvisorView = "table" | "cards";

export const ADVISOR_VIEWS: { value: AdvisorView; label: string }[] = [
  { value: "cards", label: "Cards" },
  { value: "table", label: "Table" },
];

// Drawn on the gallery toggle's 24×24 / stroke-2 grid so it pairs with GridViewIcon.
function TableIcon() {
  return (
    <svg
      className="size-5"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeLinecap="round"
      strokeWidth="2"
      aria-hidden="true"
    >
      <path d="M4.5 6.5h15M4.5 12h15M4.5 17.5h15" />
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
      className="view-toggle shrink-0 rounded-full bg-surface-muted p-[3px]"
      role="group"
      aria-label="Advisor layout"
    >
      <span
        className="view-toggle-thumb rounded-full bg-white"
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
          className="view-toggle-option size-[34px] cursor-pointer rounded-full bg-transparent p-0 text-muted hover:text-ink aria-pressed:text-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink"
          aria-pressed={view === option.value}
          aria-label={`${option.label} view`}
          title={`${option.label} view`}
          onClick={() => onChange(option.value)}
        >
          {option.value === "table" ? (
            <TableIcon />
          ) : (
            <GridViewIcon filled={view === option.value} />
          )}
        </button>
      ))}
    </div>
  );
}
