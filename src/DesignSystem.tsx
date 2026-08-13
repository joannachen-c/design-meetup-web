"use client";

import { useState } from "react";
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
  "grid gap-8 py-14 md:grid-cols-[minmax(150px,0.32fr)_minmax(0,1fr)] md:gap-16 md:py-20";
const sectionTitleClassName =
  "m-0 text-balance text-xl font-bold leading-tight tracking-[-0.04em]";
const specimenClassName =
  "flex min-h-32 flex-wrap items-center rounded-[11px]";
const whiteSpecimenClassName = `${specimenClassName} gap-3 bg-white py-5 sm:py-8`;
const linksSpecimenClassName = `${specimenClassName} gap-6 bg-white`;
const colorItemClassName = "grid gap-4";
const specimenDescriptionClassName =
  "m-0 mt-1 text-pretty text-sm leading-[1.5] text-muted";

const sections = [
  { id: "colors", label: "colors" },
  { id: "typography", label: "typography" },
  { id: "layout", label: "layout" },
  { id: "borders", label: "borders" },
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

function SpecimenLabel({ children }: { children: string }) {
  return (
    <p className="m-0 text-sm font-bold text-muted">{children}</p>
  );
}

function ArrowIcon() {
  return (
    <svg className="size-[18px] translate-x-px" viewBox="0 0 24 24" aria-hidden="true">
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

function HelpIcon() {
  return (
    <svg className="size-5" viewBox="0 0 24 24" aria-hidden="true">
      <path
        d="M9.2 9a3 3 0 1 1 5.8 1c0 2-3 2-3 4"
        fill="none"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.7"
      />
      <circle cx="12" cy="18" r="1" fill="currentColor" />
    </svg>
  );
}

function SelectSpecimen() {
  const [city, setCity] = useState("sf");

  return (
    <span className="flex flex-wrap items-center gap-2 text-base text-body">
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

        <div className="px-[clamp(20px,6vw,96px)] pb-24">
          <div className="grid grid-cols-12 items-end gap-x-[clamp(16px,2vw,28px)] gap-y-8 py-[clamp(32px,7vw,96px)] max-[820px]:grid-cols-1">
            {/* The grid placement rides the reveal wrapper, as it does on the
                home page's intro: the wrapper is the grid item once the title
                is wrapped, so leaving the spans on the heading would drop it
                out of the twelve-column track. */}
            <ScrollReveal className="col-span-8 max-[820px]:col-span-1">
              <h1 className="m-0 whitespace-nowrap text-balance text-[clamp(3.25rem,7vw,7rem)] font-bold leading-[0.94] tracking-[-0.06em]">
                design system
              </h1>
            </ScrollReveal>
            <ScrollReveal
              className="col-start-9 col-span-4 max-[820px]:col-start-1 max-[820px]:col-span-1"
              delay={60}
            >
              <p className="m-0 mb-2 max-w-[48ch] text-pretty text-base leading-[1.5] text-muted max-[820px]:mt-2">
                The foundations behind the Design Meetup website. These examples
                use the same production components as the site.
              </p>
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
            <div className="grid gap-12">
              <div className="grid gap-x-4 gap-y-8 grid-cols-2 lg:grid-cols-4">
                <div className={colorItemClassName}>
                  <div className="aspect-[4/3] rounded-[11px] bg-ink" />
                  <div>
                    <SpecimenLabel>ink</SpecimenLabel>
                    <p className="m-0 mt-1 text-sm text-subtle">
                      primary text
                    </p>
                  </div>
                </div>
                <div className={colorItemClassName}>
                  <div className="aspect-[4/3] rounded-[11px] bg-muted" />
                  <div>
                    <SpecimenLabel>muted</SpecimenLabel>
                    <p className="m-0 mt-1 text-sm text-subtle">
                      secondary text
                    </p>
                  </div>
                </div>
                <div className={colorItemClassName}>
                  <div className="aspect-[4/3] rounded-[11px] border border-gray-200 bg-surface-muted" />
                  <div>
                    <SpecimenLabel>soft gray</SpecimenLabel>
                    <p className="m-0 mt-1 text-sm text-subtle">
                      controls and fields
                    </p>
                  </div>
                </div>
                <div className={colorItemClassName}>
                  <div className="aspect-[4/3] rounded-[11px] bg-accent-primary" />
                  <div>
                    <SpecimenLabel>meetup lime</SpecimenLabel>
                    <p className="m-0 mt-1 text-sm text-subtle">
                      primary actions
                    </p>
                  </div>
                </div>
              </div>
              <div>
                <SpecimenLabel>tailwind neutrals</SpecimenLabel>
                <ul className="m-0 mt-5 grid list-none grid-cols-2 gap-x-6 gap-y-4 p-0 sm:grid-cols-3 lg:grid-cols-5">
                  <li className="flex items-center gap-3">
                    <div
                      className="size-12 rounded-[11px] bg-gray-100"
                      aria-hidden="true"
                    />
                    <code className="text-sm text-muted">gray-100</code>
                  </li>
                  <li className="flex items-center gap-3">
                    <div
                      className="size-12 rounded-[11px] bg-gray-200"
                      aria-hidden="true"
                    />
                    <code className="text-sm text-muted">gray-200</code>
                  </li>
                  <li className="flex items-center gap-3">
                    <div
                      className="size-12 rounded-[11px] bg-gray-300"
                      aria-hidden="true"
                    />
                    <code className="text-sm text-muted">gray-300</code>
                  </li>
                  <li className="flex items-center gap-3">
                    <div
                      className="size-12 rounded-[11px] bg-gray-400"
                      aria-hidden="true"
                    />
                    <code className="text-sm text-muted">gray-400</code>
                  </li>
                  <li className="flex items-center gap-3">
                    <div
                      className="size-12 rounded-[11px] bg-gray-500"
                      aria-hidden="true"
                    />
                    <code className="text-sm text-muted">gray-500</code>
                  </li>
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
                <p className="m-0 mt-4 whitespace-nowrap text-balance text-[clamp(1.125rem,4.5vw,4.5rem)] font-bold leading-[1.02] tracking-[-0.06em]">
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
            <div className="grid gap-16">
              <div className="grid gap-8">
                <div>
                  <SpecimenLabel>responsive page gutter</SpecimenLabel>
                  <p className="m-0 mt-2 max-w-[58ch] text-pretty text-base leading-[1.5] text-muted">
                    20–96px, scaling with the viewport via{" "}
                    <code className="text-sm text-ink">
                      px-[clamp(20px,6vw,96px)]
                    </code>
                    .
                  </p>
                  <div className="mt-5 rounded-[11px] bg-surface-muted px-[clamp(20px,6vw,96px)] py-6">
                    <div className="flex min-h-20 items-center justify-center rounded-[11px] bg-white text-sm font-bold text-muted">
                      Content
                    </div>
                  </div>
                </div>

                <div>
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
                        <dd className="m-0">
                          <div
                            className={`${space.className} h-3 rounded-sm bg-ink`}
                            aria-hidden="true"
                          />
                        </dd>
                      </div>
                    ))}
                  </dl>
                  <p className="m-0 mt-6 max-w-[62ch] text-pretty text-base leading-[1.5] text-muted">
                    Design-system sections use 56px vertical padding, growing
                    to 80px at tablet widths. Larger homepage bands use a more
                    generous 120px rhythm.
                  </p>
                </div>
              </div>

              <div>
                <SpecimenLabel>12-column grid</SpecimenLabel>
                <p className="m-0 mt-2 max-w-[62ch] text-pretty text-base leading-[1.5] text-muted">
                  Prominent heading and copy layouts use 8/4 columns, then
                  collapse to one column at 820px and below.
                </p>
                <ol
                  className={`m-0 mt-5 grid list-none grid-cols-6 ${layoutGridGapClassName} p-0 min-[821px]:grid-cols-12`}
                  aria-label="Twelve-column responsive grid"
                >
                  {layoutColumns.map((column) => (
                    <li
                      className="flex aspect-[3/4] items-center justify-center rounded-[11px] bg-surface-muted text-sm tabular-nums text-muted"
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
                  <div className="min-h-20 rounded-[11px] bg-ink px-4 py-16 text-white min-[821px]:col-span-8">
                    <p className="m-0 text-2xl font-bold leading-[1.02] tracking-[-0.06em]">
                      Display
                    </p>
                    <p className="m-0 mt-1 text-sm font-normal leading-[1.5]">
                      8 columns
                    </p>
                  </div>
                  <div className="min-h-20 rounded-[11px] bg-surface-muted px-4 py-16 min-[821px]:col-span-4">
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
            <div>
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
                      rounded-lg · 8px · event covers
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
              <ul className="m-0 mt-10 grid list-none grid-cols-2 gap-x-8 gap-y-10 p-0 lg:grid-cols-6">
                <li className="grid justify-items-start gap-4">
                  <div>
                    <SpecimenLabel>media inset edge</SpecimenLabel>
                    <p className={specimenDescriptionClassName}>
                      2px · shelf covers · event cards · 5%
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
                      2px · focused cover · 2%
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
                      1px · video · 3% · fades in at full width
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
                    event cards · soft shadow + media inset edge
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
                  <Primary variant="ink" disabled>
                    Disabled
                  </Primary>
                  <IconButton aria-label="Disabled icon button" disabled>
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
                  <span className="font-bold">Email address</span>
                  <Input
                    type="email"
                    placeholder="you@example.com"
                    autoComplete="email"
                  />
                </label>
                <label className="grid gap-2 text-base">
                  <span className="font-bold">Disabled</span>
                  <Input placeholder="Unavailable" disabled />
                </label>
              </div>
              <div className="grid gap-2 text-base">
                <span className="font-bold">Dropdown</span>
                <SelectSpecimen />
              </div>
            </div>
          </section>

          <section
            id="tooltips"
            className={sectionClassName}
            aria-labelledby="tooltips-title"
          >
            <h2 className={sectionTitleClassName} id="tooltips-title">
              tooltips
            </h2>
            <div
              className={`${specimenClassName} items-start gap-8 bg-surface-muted p-5 sm:grid sm:grid-cols-2 sm:items-center sm:p-8`}
            >
              <div className="grid gap-3">
                <div className="flex items-center gap-2">
                  <Tooltip content="Substack">
                    <IconButton aria-label="Substack" variant="ghost">
                      <SubstackIcon className="size-[18px]" />
                    </IconButton>
                  </Tooltip>
                  <Tooltip content="Instagram">
                    <IconButton aria-label="Instagram" variant="ghost">
                      <InstagramIcon className="size-5" />
                    </IconButton>
                  </Tooltip>
                  <Tooltip content="LinkedIn">
                    <IconButton aria-label="LinkedIn" variant="ghost">
                      <LinkedInIcon className="size-5" />
                    </IconButton>
                  </Tooltip>
                  <Tooltip content="X">
                    <IconButton aria-label="X" variant="ghost">
                      <XIcon className="size-[18px]" />
                    </IconButton>
                  </Tooltip>
                </div>
                <p className="m-0 max-w-[36ch] text-pretty text-base text-muted">
                  Adjacent icon buttons each own a tooltip — same pattern as the
                  footer contact icons.
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-3">
                <Tooltip content="Helpful context appears on hover or focus.">
                  <IconButton aria-label="More information">
                    <HelpIcon />
                  </IconButton>
                </Tooltip>
                <p className="m-0 max-w-[36ch] text-pretty text-base text-muted">
                  Hover or focus the information button. Tooltips supplement a
                  clear label; they do not replace one.
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
