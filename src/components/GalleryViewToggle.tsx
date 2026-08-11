"use client";

import { useLayoutEffect, useRef, useState } from "react";
import { Tooltip, TooltipProvider } from "./Tooltip";

export type GalleryView = "carousel" | "grid";

const galleryViewOptions: Array<{ value: GalleryView; label: string }> = [
  { value: "carousel", label: "Carousel" },
  { value: "grid", label: "Grid" },
];

// A solid shape carrying the full 1.4 outline sits 0.7 units wider than the
// outline alone, so the filled state halves its stroke: the silhouette lands
// between the outline's inner and outer edge and neither state reads heavier.
const solidShapeProps = (filled: boolean) =>
  filled ? { fill: "currentColor", strokeWidth: 0.7 } : undefined;

function CarouselViewIcon({ filled }: { filled: boolean }) {
  return (
    <svg
      className="size-4"
      viewBox="0 0 16 16"
      fill="none"
      stroke="currentColor"
      strokeLinecap="round"
      strokeWidth="1.4"
      aria-hidden="true"
    >
      <rect
        x="6"
        y="3.25"
        width="4"
        height="9.5"
        rx="1"
        {...solidShapeProps(filled)}
      />
      <path d="M3.5 5.25v5.5M12.5 5.25v5.5" />
    </svg>
  );
}

function GridViewIcon({ filled }: { filled: boolean }) {
  const square = solidShapeProps(filled);

  return (
    <svg
      className="size-4"
      viewBox="0 0 16 16"
      fill="none"
      stroke="currentColor"
      strokeLinecap="round"
      strokeWidth="1.4"
      aria-hidden="true"
    >
      <rect x="3" y="3" width="4" height="4" rx="0.9" {...square} />
      <rect x="9" y="3" width="4" height="4" rx="0.9" {...square} />
      <rect x="3" y="9" width="4" height="4" rx="0.9" {...square} />
      <rect x="9" y="9" width="4" height="4" rx="0.9" {...square} />
    </svg>
  );
}

export function GalleryViewToggle({
  view,
  onChange,
}: {
  view: GalleryView;
  onChange: (view: GalleryView) => void;
}) {
  const optionRefs = useRef(new Map<GalleryView, HTMLButtonElement>());
  const [thumb, setThumb] = useState<{ x: number; width: number } | null>(null);

  // Both options are the same fixed-size circle, so the thumb only needs to
  // re-measure when the active option changes or the buttons resize; its own
  // CSS transition carries it between the two icons.
  useLayoutEffect(() => {
    const active = optionRefs.current.get(view);
    if (!active) return;

    const measure = () =>
      setThumb({ x: active.offsetLeft, width: active.offsetWidth });

    measure();

    const observer = new ResizeObserver(measure);
    for (const option of optionRefs.current.values()) observer.observe(option);
    return () => observer.disconnect();
  }, [view]);

  return (
    <TooltipProvider>
      <div
        className="view-toggle rounded-full bg-transparent p-[3px]"
        role="group"
        aria-label="Event layout"
      >
        <span
          className="view-toggle-thumb rounded-full bg-surface-muted"
          data-view={view}
          data-measured={thumb ? "" : undefined}
          aria-hidden="true"
          style={
            thumb
              ? { transform: `translateX(${thumb.x}px)`, width: thumb.width }
              : undefined
          }
        />
        {galleryViewOptions.map((option) => (
          <Tooltip key={option.value} content={option.label}>
            <button
              className="view-toggle-option size-[34px] cursor-pointer rounded-full bg-transparent text-subtle hover:text-ink aria-pressed:text-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink"
              ref={(node) => {
                if (node) optionRefs.current.set(option.value, node);
                else optionRefs.current.delete(option.value);
              }}
              type="button"
              aria-label={option.label}
              aria-pressed={view === option.value}
              onClick={() => onChange(option.value)}
            >
              {option.value === "carousel" ? (
                <CarouselViewIcon filled={view === option.value} />
              ) : (
                <GridViewIcon filled={view === option.value} />
              )}
            </button>
          </Tooltip>
        ))}
      </div>
    </TooltipProvider>
  );
}
