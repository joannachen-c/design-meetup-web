"use client";

import { useEffect, useRef, useState, type PointerEvent as ReactPointerEvent } from "react";
import { ArrowUpRightIcon } from "./components/icons/ArrowUpRightIcon";
import {
  InstagramIcon,
  LinkedInIcon,
  SubstackIcon,
  XIcon,
} from "./components/icons/SocialIcons";
import { IconButton } from "./components/IconButton";
import { Input } from "./components/Input";
import { Link } from "./components/Link";
import { PageLoader } from "./components/PageLoader";
import { Primary } from "./components/Primary";
import { ScrollReveal } from "./components/ScrollReveal";
import { Select } from "./components/Select";
import { SiteFooter } from "./components/SiteFooter";
import { SiteHeader } from "./components/SiteHeader";
import { Tooltip, TooltipProvider } from "./components/Tooltip";

const sectionClassName =
  "grid min-w-0 gap-8 py-14 md:grid-cols-[minmax(150px,0.32fr)_minmax(0,1fr)] md:gap-16 md:py-20";
const sectionTitleClassName =
  "m-0 text-balance text-xl font-bold leading-tight tracking-[-0.04em]";
const specimenClassName =
  "flex min-h-32 flex-wrap items-center rounded-[11px]";
const whiteSpecimenClassName = `${specimenClassName} gap-3 bg-white py-5 sm:py-8`;
const linksSpecimenClassName =
  "flex flex-wrap items-center gap-6 rounded-[11px] bg-white";
const colorItemClassName = "grid gap-3";
const specimenDescriptionClassName =
  "m-0 mt-1 text-pretty text-sm leading-[1.5] text-muted";

// Match SiteFooter social brand hovers (specimen-only; footer markup stays source).
const dsSocialIconHoverClassName =
  "transition-colors duration-150 ease-out motion-reduce:transition-none";

// Every --color-* token from @theme, plus white (Tailwind default used for
// cards/overlays). Hexes are the sRGB round-trip of the OKLCH theme values.
const semanticColors = [
  {
    label: "ink",
    description: "primary text",
    className: "bg-ink",
    hex: "#121c26",
  },
  {
    label: "muted",
    description: "secondary text",
    className: "bg-muted",
    hex: "#6a7282",
  },
  {
    label: "subtle",
    description: "tertiary text",
    className: "bg-subtle",
    hex: "#99a1af",
  },
  {
    label: "white",
    description: "cards · overlays",
    className: "bg-white",
    hex: "#ffffff",
  },
  {
    label: "surface",
    description: "page background",
    className: "bg-surface",
    hex: "#fcfdff",
  },
  {
    label: "surface muted",
    description: "controls and fields",
    className: "bg-surface-muted",
    hex: "#f3f4f6",
  },
  {
    label: "skeleton",
    description: "image placeholders",
    className: "bg-skeleton",
    hex: "#e7e8eb",
  },
  {
    label: "meetup lime",
    description: "primary actions",
    className: "bg-accent-primary",
    hex: "#ecf26d",
  },
  {
    label: "meetup lime hover",
    description: "primary action hover",
    className: "bg-accent-hover",
    hex: "#e3e95f",
  },
] as const;

const neutralColors = [
  { label: "gray-100", className: "bg-gray-100", hex: "#f3f4f6" },
  { label: "gray-200", className: "bg-gray-200", hex: "#e5e7eb" },
  { label: "gray-300", className: "bg-gray-300", hex: "#d1d5dc" },
  { label: "gray-400", className: "bg-gray-400", hex: "#99a1af" },
  { label: "gray-500", className: "bg-gray-500", hex: "#6a7282" },
] as const;

const sections = [
  { id: "colors", label: "colors" },
  { id: "typography", label: "typography" },
  { id: "layout", label: "layout" },
  { id: "borders", label: "borders" },
  { id: "strokes", label: "strokes" },
  { id: "shadows", label: "shadows" },
  { id: "buttons", label: "buttons" },
  { id: "links", label: "links" },
  { id: "inputs", label: "inputs" },
  { id: "tooltips", label: "tooltips" },
] as const;

const spacingScale = [
  { label: "8px", className: "w-2" },
  { label: "16px", className: "w-4" },
  { label: "24px", className: "w-6" },
  { label: "32px", className: "w-8" },
  { label: "48px", className: "w-12" },
  { label: "64px", className: "w-16" },
] as const;

const layoutGridGapClassName = "gap-2";
const layoutColumns = Array.from({ length: 12 }, (_, index) => index + 1);

function SpecimenLabel({
  children,
  weight = "bold",
}: {
  children: string;
  weight?: "bold" | "normal";
}) {
  return (
    <p
      className={`m-0 text-sm text-muted ${weight === "normal" ? "font-normal" : "font-bold"}`}
    >
      {children}
    </p>
  );
}

function ColorSwatch({
  className,
  hex,
  label,
  size = "card",
}: {
  className: string;
  hex: string;
  label: string;
  size?: "card" | "chip";
}) {
  const [copied, setCopied] = useState(false);
  const [open, setOpen] = useState(false);
  const resetTimerRef = useRef<number | null>(null);

  useEffect(() => {
    return () => {
      if (resetTimerRef.current !== null) {
        window.clearTimeout(resetTimerRef.current);
      }
    };
  }, []);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(hex);
    } catch {
      return;
    }

    setCopied(true);
    setOpen(true);
    if (resetTimerRef.current !== null) {
      window.clearTimeout(resetTimerRef.current);
    }
    resetTimerRef.current = window.setTimeout(() => {
      setCopied(false);
      resetTimerRef.current = null;
    }, 1500);
  };

  return (
    <Tooltip
      content={copied ? "Copied!" : hex}
      open={open}
      onOpenChange={(nextOpen) => {
        setOpen(nextOpen);
        if (!nextOpen) setCopied(false);
      }}
    >
      <button
        type="button"
        aria-label={`Copy ${label} ${hex}`}
        className={[
          className,
          // Inset edge so near-white swatches read on the surface page, and
          // dark ones keep the same media treatment as production covers.
          "media-inset-edge relative border-0 p-0 transition-transform duration-150 ease-out active:scale-[0.97]",
          "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink",
          size === "card"
            ? "size-16 rounded-[16px] sm:size-20 sm:rounded-[18px] lg:size-28 lg:rounded-[20px]"
            : "size-12 rounded-[11px]",
        ]
          .filter(Boolean)
          .join(" ")}
        onClick={handleCopy}
      />
    </Tooltip>
  );
}

function ArrowIcon({ className = "size-5 translate-x-px" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" aria-hidden="true">
      <path
        d="M9 5l7 7-7 7"
        fill="none"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="2"
      />
    </svg>
  );
}

function HelpIcon({ className = "size-5" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" aria-hidden="true">
      <path
        d="M8 8.75a4 4 0 1 1 7.6 1.7c0 2.7-3.8 3-3.8 5.55"
        fill="none"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="2"
      />
      <circle cx="12" cy="18.75" r="1.25" fill="currentColor" />
    </svg>
  );
}

function SelectSpecimen() {
  const [city, setCity] = useState("sf");

  return (
    <span className="flex flex-wrap items-center gap-2 text-base text-ink">
      Our next meetup is in
      <Select
        aria-label="City"
        options={[
          { value: "sf", label: "San Francisco" },
          { value: "nyc", label: "New York" },
          { value: "la", label: "Los Angeles" },
        ]}
        value={city}
        onValueChange={setCity}
      />
    </span>
  );
}

const GUTTER_DEMO_MIN_WIDTH_PX = 12 * 16;

/** Mac-style column-resize grip: opposing triangles with a center rule. */
function GutterResizeHandleIcon({ className }: { className?: string }) {
  return (
    <span
      aria-hidden="true"
      className={`inline-flex items-center gap-x-1 pr-2 text-current ${className ?? ""}`}
    >
      <svg
        fill="currentColor"
        viewBox="0 0 5 11"
        width="5"
        height="11"
      >
        <path d="M5 0 0 5.5 5 11V0Z" />
      </svg>
      <span className="h-3 w-[2px] bg-current opacity-40" />
      <svg
        fill="currentColor"
        viewBox="0 0 5 11"
        width="5"
        height="11"
      >
        <path d="M0 0 5 5.5 0 11V0Z" />
      </svg>
    </span>
  );
}

function GutterResizeDemo() {
  const shellRef = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState<number | null>(null);

  useEffect(() => {
    const shell = shellRef.current;
    const parent = shell?.parentElement;
    if (!shell || !parent) return;

    const clampToParent = () => {
      const max = parent.clientWidth;
      setWidth((current) => {
        if (current == null) return max;
        return Math.min(Math.max(current, GUTTER_DEMO_MIN_WIDTH_PX), max);
      });
    };

    clampToParent();
    const observer = new ResizeObserver(clampToParent);
    observer.observe(parent);
    return () => observer.disconnect();
  }, []);

  const handlePointerDown = (event: ReactPointerEvent<HTMLButtonElement>) => {
    event.preventDefault();
    const shell = shellRef.current;
    const parent = shell?.parentElement;
    if (!shell || !parent) return;

    const startX = event.clientX;
    const startWidth = shell.getBoundingClientRect().width;
    const target = event.currentTarget;
    target.setPointerCapture(event.pointerId);

    const onMove = (moveEvent: PointerEvent) => {
      const max = parent.clientWidth;
      const next = Math.min(
        max,
        Math.max(
          GUTTER_DEMO_MIN_WIDTH_PX,
          startWidth + (moveEvent.clientX - startX),
        ),
      );
      setWidth(next);
    };

    const onUp = () => {
      target.releasePointerCapture(event.pointerId);
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
      window.removeEventListener("pointercancel", onUp);
    };

    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
    window.addEventListener("pointercancel", onUp);
  };

  return (
    <div
      ref={shellRef}
      aria-label="Resizable page gutter demonstration"
      className="@container relative mt-5 w-full min-w-0 max-w-full overflow-hidden rounded-[11px] bg-surface-muted"
      style={{ width: width == null ? "100%" : width }}
    >
      <div className="px-[clamp(20px,6cqw,96px)] py-8 sm:py-12">
        <div className="flex min-h-28 items-center justify-center rounded-[11px] bg-white text-sm font-bold text-muted sm:min-h-40">
          Content
        </div>
      </div>
      <button
        type="button"
        aria-label="Drag to resize gutter demonstration"
        className="absolute inset-y-0 right-0 z-10 flex w-5 cursor-col-resize touch-none items-center justify-center border-0 bg-transparent p-0 text-subtle transition-colors duration-150 ease-out hover:text-muted focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-ink active:text-muted"
        onPointerDown={handlePointerDown}
      >
        <GutterResizeHandleIcon />
      </button>
    </div>
  );
}

export default function DesignSystem() {
  return (
    <TooltipProvider>
      <main className="min-h-dvh bg-surface font-['Alte_Haas_Grotesk',sans-serif] text-ink antialiased [font-synthesis:none]">
        <PageLoader />

        <SiteHeader
          homeHref="/"
          navAriaLabel="Design system sections"
          navClassName="design-system-navigation max-[820px]:hidden"
          links={sections.map(({ id, label }) => ({ href: `#${id}`, label }))}
          reveal
        />

        <div className="min-w-0 px-[clamp(20px,6vw,96px)] pb-24">
          <div className="grid grid-cols-12 items-end gap-x-[clamp(16px,2vw,28px)] gap-y-8 py-[clamp(32px,7vw,96px)] max-[820px]:grid-cols-1">
            {/* The grid placement rides the reveal wrapper, as it does on the
                home page's intro: the wrapper is the grid item once the title
                is wrapped, so leaving the spans on the heading would drop it
                out of the twelve-column track. */}
            <ScrollReveal className="col-span-8 min-w-0 max-[820px]:col-span-1">
              <h1 className="m-0 text-balance text-[clamp(2.5rem,7vw,7rem)] font-bold leading-[0.94] tracking-[-0.06em] max-[820px]:whitespace-normal min-[821px]:whitespace-nowrap">
                design system
              </h1>
            </ScrollReveal>
          </div>

          <section
            id="colors"
            className={sectionClassName}
            aria-labelledby="colors-title"
          >
            <h2 className={sectionTitleClassName} id="colors-title">
              colors
            </h2>
            <div className="grid gap-10">
              <div className="grid grid-cols-3 gap-x-4 gap-y-5 sm:grid-cols-3 sm:gap-x-8 sm:gap-y-6 lg:grid-cols-5">
                {semanticColors.map((color) => (
                  <div className={colorItemClassName} key={color.label}>
                    <ColorSwatch
                      className={color.className}
                      hex={color.hex}
                      label={color.label}
                    />
                    <div>
                      <SpecimenLabel>{color.label}</SpecimenLabel>
                      <p className="m-0 mt-1 text-sm text-subtle">
                        {color.description}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
              <div>
                <SpecimenLabel>tailwind neutrals</SpecimenLabel>
                <ul className="m-0 mt-5 grid list-none grid-cols-2 gap-x-6 gap-y-4 p-0 sm:grid-cols-3 lg:grid-cols-5">
                  {neutralColors.map((color) => (
                    <li className="flex items-center gap-3" key={color.label}>
                      <ColorSwatch
                        className={color.className}
                        hex={color.hex}
                        label={color.label}
                        size="chip"
                      />
                      <code className="text-sm text-muted">{color.label}</code>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </section>

          <section
            id="typography"
            className={sectionClassName}
            aria-labelledby="typography-title"
          >
            <h2 className={sectionTitleClassName} id="typography-title">
              typography
            </h2>
            <div className="grid gap-12">
              <div>
                <SpecimenLabel>display</SpecimenLabel>
                <p className="m-0 mt-4 whitespace-normal text-balance text-[clamp(1.125rem,4.5vw,4.5rem)] font-bold leading-[1.02] tracking-[-0.06em] min-[821px]:whitespace-nowrap">
                  Growth happens together.
                </p>
              </div>
              <div className="grid gap-8 sm:grid-cols-2">
                <div>
                  <SpecimenLabel>heading</SpecimenLabel>
                  <p className="m-0 mt-4 text-2xl font-bold leading-tight tracking-[-0.04em]">
                    Upcoming events
                  </p>
                </div>
                <div>
                  <SpecimenLabel>body</SpecimenLabel>
                  <p className="m-0 mt-4 max-w-[54ch] text-pretty text-base leading-[1.5] text-muted">
                    A space for ambitious, early-career designers to meet the
                    people behind the work.
                  </p>
                </div>
              </div>
            </div>
          </section>

          <section
            id="layout"
            className={sectionClassName}
            aria-labelledby="layout-title"
          >
            <h2 className={sectionTitleClassName} id="layout-title">
              layout
            </h2>
            <div className="grid min-w-0 gap-16">
              <div className="grid min-w-0 gap-8">
                <div className="min-w-0">
                  <SpecimenLabel>responsive page gutter</SpecimenLabel>
                  <p className="m-0 mt-2 max-w-full text-pretty text-base leading-[1.5] text-muted sm:max-w-[58ch]">
                    20–96px, scaling with the viewport via{" "}
                    <code className="break-all text-sm text-ink">
                      px-[clamp(20px,6vw,96px)]
                    </code>
                    .
                  </p>
                  <GutterResizeDemo />
                </div>

                <div className="min-w-0">
                  <SpecimenLabel>spacing scale</SpecimenLabel>
                  <dl className="m-0 mt-5 grid gap-4">
                    {spacingScale.map((space) => (
                      <div
                        className="grid grid-cols-[3rem_minmax(0,1fr)] items-center gap-4"
                        key={space.label}
                      >
                        <dt className="text-sm tabular-nums text-muted">
                          {space.label}
                        </dt>
                        <dd className="m-0 min-w-0">
                          <div
                            className={`${space.className} h-3 rounded-sm bg-gray-300`}
                            aria-hidden="true"
                          />
                        </dd>
                      </div>
                    ))}
                  </dl>
                </div>
              </div>

              <div className="min-w-0">
                <SpecimenLabel>12-column grid</SpecimenLabel>
                <p className="m-0 mt-2 max-w-full text-pretty text-base leading-[1.5] text-muted sm:max-w-[62ch]">
                  Prominent heading and copy layouts use 8/4 columns, then
                  collapse to one column at 820px and below.
                </p>
                <ol
                  className={`m-0 mt-5 grid list-none grid-cols-4 ${layoutGridGapClassName} p-0 min-[821px]:grid-cols-12`}
                  aria-label="Twelve-column responsive grid"
                >
                  {layoutColumns.map((column) => (
                    <li
                      className="flex aspect-square items-center justify-center rounded-[11px] bg-surface-muted text-sm tabular-nums text-muted min-[821px]:aspect-[3/4]"
                      key={column}
                    >
                      {column}
                    </li>
                  ))}
                </ol>
                <div
                  className={`mt-6 grid grid-cols-1 ${layoutGridGapClassName} min-[821px]:grid-cols-12`}
                  aria-label="Eight-column display and four-column body layout"
                >
                  <div className="min-h-20 rounded-[11px] bg-ink px-4 py-8 text-white sm:py-12 min-[821px]:col-span-8 min-[821px]:py-16">
                    <p className="m-0 text-2xl font-bold leading-[1.02] tracking-[-0.06em]">
                      Display
                    </p>
                    <p className="m-0 mt-1 text-sm font-normal leading-[1.5]">
                      8 columns
                    </p>
                  </div>
                  <div className="min-h-20 rounded-[11px] bg-surface-muted px-4 py-8 sm:py-12 min-[821px]:col-span-4 min-[821px]:py-16">
                    <p className="m-0 text-base font-normal leading-[1.5] text-muted">
                      Body
                    </p>
                    <p className="m-0 mt-1 text-sm font-normal leading-[1.5] text-muted">
                      4 columns
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </section>

          <section
            id="borders"
            className={sectionClassName}
            aria-labelledby="borders-title"
          >
            <h2 className={sectionTitleClassName} id="borders-title">
              borders
            </h2>
            <ul className="m-0 grid list-none grid-cols-2 gap-x-8 gap-y-10 p-0 lg:grid-cols-6">
              <li className="grid justify-items-start gap-4">
                <div>
                  <SpecimenLabel>small</SpecimenLabel>
                  <p className={specimenDescriptionClassName}>
                    rounded-sm · 4px
                  </p>
                </div>
                <div
                  className="size-20 rounded-sm bg-gray-200"
                  aria-hidden="true"
                />
              </li>
              <li className="grid justify-items-start gap-4">
                <div>
                  <SpecimenLabel>medium</SpecimenLabel>
                  <p className={specimenDescriptionClassName}>
                    rounded-md · 6px
                  </p>
                </div>
                <div
                  className="size-20 rounded-md bg-gray-200"
                  aria-hidden="true"
                />
              </li>
              <li className="grid justify-items-start gap-4">
                <div>
                  <SpecimenLabel>large</SpecimenLabel>
                  <p className={specimenDescriptionClassName}>
                    rounded-lg · 8px
                  </p>
                </div>
                <div
                  className="size-20 rounded-lg bg-gray-200"
                  aria-hidden="true"
                />
              </li>
              <li className="grid justify-items-start gap-4">
                <div>
                  <SpecimenLabel>control</SpecimenLabel>
                  <p className={specimenDescriptionClassName}>
                    rounded-[10px]
                  </p>
                </div>
                <div
                  className="size-20 rounded-[10px] bg-gray-200"
                  aria-hidden="true"
                />
              </li>
              <li className="grid justify-items-start gap-4">
                <div>
                  <SpecimenLabel>surface</SpecimenLabel>
                  <p className={specimenDescriptionClassName}>
                    rounded-[11px]
                  </p>
                </div>
                <div
                  className="size-20 rounded-[11px] bg-gray-200"
                  aria-hidden="true"
                />
              </li>
              <li className="grid justify-items-start gap-4">
                <div>
                  <SpecimenLabel>full</SpecimenLabel>
                  <p className={specimenDescriptionClassName}>
                    rounded-full · pill
                  </p>
                </div>
                <div
                  className="size-20 rounded-full bg-gray-200"
                  aria-hidden="true"
                />
              </li>
            </ul>
          </section>

          <section
            id="strokes"
            className={sectionClassName}
            aria-labelledby="strokes-title"
          >
            <h2 className={sectionTitleClassName} id="strokes-title">
              strokes
            </h2>
            <div
              className={`${specimenClassName} bg-surface-muted p-5 sm:p-8`}
            >
              <ul className="m-0 grid w-full list-none grid-cols-2 gap-x-8 gap-y-10 p-0 lg:grid-cols-3">
                <li className="grid justify-items-start gap-4">
                  <div>
                    <SpecimenLabel>media inset edge</SpecimenLabel>
                    <p className={specimenDescriptionClassName}>
                      2px · 5%
                    </p>
                  </div>
                  <div
                    className="media-inset-edge relative size-20 rounded-lg bg-white"
                    aria-hidden="true"
                  />
                </li>
                <li className="grid justify-items-start gap-4">
                  <div>
                    <SpecimenLabel>media inset edge focused</SpecimenLabel>
                    <p className={specimenDescriptionClassName}>
                      2px · 2%
                    </p>
                  </div>
                  <div
                    className="media-inset-edge-focused relative size-20 rounded-lg bg-white"
                    aria-hidden="true"
                  />
                </li>
                <li className="grid justify-items-start gap-4">
                  <div>
                    <SpecimenLabel>media inset edge soft</SpecimenLabel>
                    <p className={specimenDescriptionClassName}>
                      1px · 3%
                    </p>
                  </div>
                  <div
                    className="media-inset-edge-soft relative size-20 rounded-[20px] bg-white"
                    aria-hidden="true"
                  />
                </li>
              </ul>
            </div>
          </section>

          <section
            id="shadows"
            className={sectionClassName}
            aria-labelledby="shadows-title"
          >
            <h2 className={sectionTitleClassName} id="shadows-title">
              shadows
            </h2>
            <ul className="m-0 grid list-none grid-cols-2 gap-x-12 gap-y-10 p-0 lg:grid-cols-3">
              <li className="grid justify-items-start gap-4">
                <div>
                  <SpecimenLabel>base</SpecimenLabel>
                  <p className={specimenDescriptionClassName}>
                    border only
                  </p>
                </div>
                <div
                  className="size-24 rounded-[11px] border border-gray-200 bg-white shadow-none"
                  aria-hidden="true"
                />
              </li>
              <li className="grid justify-items-start gap-4">
                <div>
                  <SpecimenLabel>soft</SpecimenLabel>
                  <p className={specimenDescriptionClassName}>
                    soft shadow + media inset edge
                  </p>
                </div>
                <div
                  className="media-inset-edge relative size-24 rounded-[11px] bg-white shadow-[0_3px_10px_rgba(0,0,0,0.12)]"
                  aria-hidden="true"
                />
              </li>
              <li className="grid justify-items-start gap-4">
                <div>
                  <SpecimenLabel>raised</SpecimenLabel>
                  <p className={specimenDescriptionClassName}>
                    team cards
                  </p>
                </div>
                <div
                  className="size-24 rounded-[11px] bg-white shadow-lg hover:shadow-xl"
                  aria-hidden="true"
                />
              </li>
            </ul>
          </section>

          <section
            id="buttons"
            className={sectionClassName}
            aria-labelledby="buttons-title"
          >
            <h2 className={sectionTitleClassName} id="buttons-title">
              buttons
            </h2>
            <div className="grid gap-8">
              <div>
                <SpecimenLabel>variants</SpecimenLabel>
                <div className={`${whiteSpecimenClassName} mt-4`}>
                  <Primary>Primary</Primary>
                  <Primary variant="secondary">
                    Secondary
                    <ArrowUpRightIcon />
                  </Primary>
                  <Primary variant="ghost">Ghost</Primary>
                  <Primary variant="ink">Ink</Primary>
                  <IconButton aria-label="Next item">
                    <ArrowIcon />
                  </IconButton>
                  <IconButton aria-label="Ghost icon button" variant="ghost">
                    <ArrowIcon />
                  </IconButton>
                </div>
              </div>
              <div>
                <SpecimenLabel>states</SpecimenLabel>
                <div className={`${whiteSpecimenClassName} mt-4`}>
                  <Primary loading>Loading</Primary>
                  <Primary disabled>Disabled</Primary>
                  <Primary variant="secondary" disabled>
                    Disabled
                  </Primary>
                  <Primary variant="ghost" disabled>
                    Disabled
                  </Primary>
                  <Primary variant="ink" disabled>
                    Disabled
                  </Primary>
                  <IconButton aria-label="Disabled icon button" disabled>
                    <ArrowIcon />
                  </IconButton>
                  <IconButton
                    aria-label="Disabled ghost icon button"
                    variant="ghost"
                    disabled
                  >
                    <ArrowIcon />
                  </IconButton>
                </div>
              </div>
            </div>
          </section>

          <section
            id="links"
            className={`${sectionClassName} md:items-end`}
            aria-labelledby="links-title"
          >
            <h2 className={sectionTitleClassName} id="links-title">
              links
            </h2>
            <div className={linksSpecimenClassName}>
              <Link href="/">Navigation link</Link>
              <Link onClick={() => undefined}>Button action</Link>
              <a
                className="text-medium inline-flex items-center gap-1 rounded-sm text-base text-ink underline underline-offset-4 focus-visible:outline-2 focus-visible:outline-offset-4"
                href="https://designmeetup.substack.com/"
                target="_blank"
                rel="noreferrer"
              >
                External link
                <ArrowUpRightIcon />
              </a>
            </div>
          </section>

          <section
            id="inputs"
            className={sectionClassName}
            aria-labelledby="inputs-title"
          >
            <h2 className={sectionTitleClassName} id="inputs-title">
              inputs
            </h2>
            <div className="grid gap-8">
              <div className="grid max-w-2xl gap-8 sm:grid-cols-2">
                <label className="grid gap-2 text-base">
                  <SpecimenLabel>email address</SpecimenLabel>
                  <Input
                    type="email"
                    placeholder="you@example.com"
                    autoComplete="email"
                  />
                </label>
                <label className="grid gap-2 text-base">
                  <SpecimenLabel>disabled</SpecimenLabel>
                  <Input placeholder="Unavailable" disabled />
                </label>
              </div>
              <div className="grid gap-2 text-base">
                <SpecimenLabel>dropdown</SpecimenLabel>
                <SelectSpecimen />
              </div>
            </div>
          </section>

          <section
            id="tooltips"
            className={`${sectionClassName} max-[820px]:hidden`}
            aria-labelledby="tooltips-title"
          >
            <h2 className={sectionTitleClassName} id="tooltips-title">
              tooltips
            </h2>
            <div
              className={`${specimenClassName} items-start gap-8 bg-surface-muted px-5 py-4.5 sm:grid sm:grid-cols-2 sm:items-start sm:px-8 sm:py-7.5`}
            >
              <div className="grid gap-3">
                <div className="-ml-4 w-fit">
                  <Tooltip content="Helpful context appears on hover or focus.">
                    <IconButton aria-label="More information">
                      <HelpIcon />
                    </IconButton>
                  </Tooltip>
                </div>
                <p className="m-0 max-w-[36ch] text-pretty text-base text-muted">
                  Tooltips add context on hover or focus.
                </p>
              </div>
              <div className="grid gap-3">
                <div className="-ml-2 flex w-fit items-center gap-2">
                  <Tooltip content="Substack">
                    <IconButton
                      aria-label="Substack"
                      className="group"
                      variant="ghost"
                    >
                      <SubstackIcon
                        className={`${dsSocialIconHoverClassName} size-[18px] group-hover:text-[#FF6719] group-focus-visible:text-[#FF6719]`}
                      />
                    </IconButton>
                  </Tooltip>
                  <Tooltip content="Instagram">
                    <IconButton
                      aria-label="Instagram"
                      className="group"
                      variant="ghost"
                    >
                      <span className="relative size-5">
                        <InstagramIcon className="size-5 transition-opacity duration-150 ease-out group-hover:opacity-0 group-focus-visible:opacity-0 motion-reduce:transition-none" />
                        <InstagramIcon
                          branded
                          className="absolute inset-0 size-5 opacity-0 transition-opacity duration-150 ease-out group-hover:opacity-100 group-focus-visible:opacity-100 motion-reduce:transition-none"
                        />
                      </span>
                    </IconButton>
                  </Tooltip>
                  <Tooltip content="LinkedIn">
                    <IconButton
                      aria-label="LinkedIn"
                      className="group"
                      variant="ghost"
                    >
                      <LinkedInIcon
                        className={`${dsSocialIconHoverClassName} size-5 group-hover:text-[#0A66C2] group-focus-visible:text-[#0A66C2]`}
                      />
                    </IconButton>
                  </Tooltip>
                  <Tooltip content="X">
                    <IconButton
                      aria-label="X"
                      className="group"
                      variant="ghost"
                    >
                      <XIcon
                        className={`${dsSocialIconHoverClassName} size-[18px] group-hover:text-ink group-focus-visible:text-ink`}
                      />
                    </IconButton>
                  </Tooltip>
                </div>
                <p className="m-0 max-w-[36ch] text-pretty text-base text-muted">
                  Adjacent icon buttons each own a tooltip
                </p>
              </div>
            </div>
          </section>
        </div>

        <SiteFooter
          logoHref="/"
          logoAriaLabel="Design Meetup home"
          hideDesignSystemPromo
        />
      </main>
    </TooltipProvider>
  );
}
