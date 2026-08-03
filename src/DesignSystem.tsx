"use client";

import { ArrowUpRightIcon } from "./components/icons/ArrowUpRightIcon";
import { IconButton } from "./components/IconButton";
import { Input } from "./components/Input";
import { Link } from "./components/Link";
import { Primary } from "./components/Primary";
import { Tooltip, TooltipProvider } from "./components/Tooltip";

const sectionClassName =
  "grid gap-8 border-t border-gray-200 py-12 md:grid-cols-[minmax(150px,0.32fr)_minmax(0,1fr)] md:gap-16 md:py-16";
const sectionTitleClassName =
  "m-0 text-balance text-xl font-bold leading-tight tracking-[-0.04em]";
const specimenClassName =
  "flex min-h-32 flex-wrap items-center rounded-[11px]";
const whiteSpecimenClassName = `${specimenClassName} gap-3 bg-white py-5 sm:py-8`;
const linksSpecimenClassName = `${specimenClassName} gap-6 bg-white py-5 sm:py-8`;
const navLinkClassName =
  "text-base text-muted no-underline hover:text-ink focus-visible:underline focus-visible:decoration-2 focus-visible:underline-offset-4";
const colorItemClassName = "grid gap-4";

const sections = [
  { id: "colors", label: "Colors" },
  { id: "typography", label: "Typography" },
  { id: "layout", label: "Layout" },
  { id: "borders", label: "Borders" },
  { id: "shadows", label: "Shadows" },
  { id: "buttons", label: "Buttons" },
  { id: "links", label: "Links" },
  { id: "inputs", label: "Inputs" },
  { id: "tooltips", label: "Tooltips" },
] as const;

const spacingScale = [
  { label: "8px", className: "w-2" },
  { label: "16px", className: "w-4" },
  { label: "24px", className: "w-6" },
  { label: "32px", className: "w-8" },
  { label: "48px", className: "w-12" },
  { label: "64px", className: "w-16" },
] as const;

const layoutColumns = Array.from({ length: 12 }, (_, index) => index + 1);

function SpecimenLabel({ children }: { children: string }) {
  return (
    <p className="m-0 text-sm font-bold uppercase text-muted">{children}</p>
  );
}

function ArrowIcon() {
  return (
    <svg className="size-[18px]" viewBox="0 0 24 24" aria-hidden="true">
      <path
        d="M9 5l7 7-7 7"
        fill="none"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.7"
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

export default function DesignSystem() {
  return (
    <TooltipProvider>
      <main className="min-h-dvh bg-surface font-['Alte_Haas_Grotesk',sans-serif] text-ink antialiased [font-synthesis:none]">
        <header className="site-header px-[clamp(20px,6vw,96px)] py-[clamp(24px,3vw,46px)] text-base">
          <a
            className="wordmark leading-[0] no-underline focus-visible:underline focus-visible:decoration-2 focus-visible:underline-offset-4"
            href="/"
            aria-label="Design Meetup home"
          >
            <img
              className="wordmark-logo border-0 outline-none"
              src="/design-meetup-logo.png"
              alt=""
              width={60}
              height={60}
              decoding="async"
            />
          </a>
          <nav
            className="primary-navigation design-system-navigation"
            aria-label="Design system sections"
          >
            {sections.map(({ id, label }) => (
              <a key={id} className={navLinkClassName} href={`#${id}`}>
                {label}
              </a>
            ))}
          </nav>
        </header>

        <div className="px-[clamp(20px,6vw,96px)] pb-24">
          <div className="grid grid-cols-12 items-end gap-x-[clamp(16px,2vw,28px)] gap-y-8 py-[clamp(32px,7vw,96px)] max-[820px]:grid-cols-1">
            <h1 className="col-span-8 m-0 whitespace-nowrap text-balance text-[clamp(3.25rem,7vw,7rem)] font-bold leading-[0.94] tracking-[-0.06em] max-[820px]:col-span-1">
              design system
            </h1>
            <p className="col-start-9 col-span-4 m-0 mb-2 max-w-[48ch] text-pretty text-base leading-[1.5] text-muted max-[820px]:col-start-1 max-[820px]:col-span-1 max-[820px]:mt-2">
              The foundations behind the Design Meetup website. These examples
              use the same production components as the site.
            </p>
          </div>

          <section
            id="colors"
            className={sectionClassName}
            aria-labelledby="colors-title"
          >
            <h2 className={sectionTitleClassName} id="colors-title">
              Colors
            </h2>
            <div className="grid gap-12">
              <div className="grid gap-x-4 gap-y-8 sm:grid-cols-2 lg:grid-cols-4">
                <div className={colorItemClassName}>
                  <div className="aspect-[4/3] rounded-[11px] bg-ink" />
                  <div>
                    <SpecimenLabel>Ink</SpecimenLabel>
                    <p className="m-0 mt-1 text-sm text-subtle">
                      Primary text
                    </p>
                  </div>
                </div>
                <div className={colorItemClassName}>
                  <div className="aspect-[4/3] rounded-[11px] bg-muted" />
                  <div>
                    <SpecimenLabel>Muted</SpecimenLabel>
                    <p className="m-0 mt-1 text-sm text-subtle">
                      Secondary text
                    </p>
                  </div>
                </div>
                <div className={colorItemClassName}>
                  <div className="aspect-[4/3] rounded-[11px] border border-gray-200 bg-surface-muted" />
                  <div>
                    <SpecimenLabel>Soft gray</SpecimenLabel>
                    <p className="m-0 mt-1 text-sm text-subtle">
                      Controls and fields
                    </p>
                  </div>
                </div>
                <div className={colorItemClassName}>
                  <div className="aspect-[4/3] rounded-[11px] bg-accent-primary" />
                  <div>
                    <SpecimenLabel>Meetup lime</SpecimenLabel>
                    <p className="m-0 mt-1 text-sm text-subtle">
                      Primary actions
                    </p>
                  </div>
                </div>
              </div>
              <div>
                <SpecimenLabel>Tailwind neutrals</SpecimenLabel>
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
              Typography
            </h2>
            <div className="grid gap-12">
              <div>
                <SpecimenLabel>Display</SpecimenLabel>
                <p className="m-0 mt-4 whitespace-nowrap text-balance text-[clamp(1.125rem,4.5vw,4.5rem)] font-bold leading-[1.02] tracking-[-0.06em]">
                  Growth happens together.
                </p>
              </div>
              <div className="grid gap-8 sm:grid-cols-2">
                <div>
                  <SpecimenLabel>Heading</SpecimenLabel>
                  <p className="m-0 mt-4 text-2xl font-bold leading-tight tracking-[-0.04em]">
                    Upcoming events
                  </p>
                </div>
                <div>
                  <SpecimenLabel>Body</SpecimenLabel>
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
              Layout
            </h2>
            <div className="grid gap-16">
              <div className="grid gap-8">
                <div>
                  <SpecimenLabel>Responsive page gutter</SpecimenLabel>
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
                  <SpecimenLabel>Spacing scale</SpecimenLabel>
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
                  <p className="m-0 mt-6 max-w-[62ch] text-pretty text-sm leading-[1.5] text-muted">
                    Design-system sections use 48px vertical padding, growing
                    to 64px at tablet widths. Larger homepage bands use a more
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
                  className="m-0 mt-5 grid list-none grid-cols-6 gap-2 p-0 min-[821px]:grid-cols-12"
                  aria-label="Twelve-column responsive grid"
                >
                  {layoutColumns.map((column) => (
                    <li
                      className="flex aspect-square items-center justify-center rounded-[11px] bg-surface-muted text-sm tabular-nums text-muted"
                      key={column}
                    >
                      {column}
                    </li>
                  ))}
                </ol>
                <div
                  className="mt-6 grid grid-cols-1 gap-4 min-[821px]:grid-cols-12"
                  aria-label="Eight-column heading and four-column copy layout"
                >
                  <div className="min-h-20 rounded-[11px] bg-ink p-4 text-sm font-bold text-white min-[821px]:col-span-8">
                    Heading · 8 columns
                  </div>
                  <div className="min-h-20 rounded-[11px] bg-surface-muted p-4 text-sm font-bold text-muted min-[821px]:col-span-4">
                    Copy · 4 columns
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
              Borders
            </h2>
            <div>
              <p className="m-0 max-w-[62ch] text-pretty text-base leading-[1.5] text-muted">
                Corner radii follow the role and scale of each production
                element.
              </p>
              <ul className="m-0 mt-5 grid list-none grid-cols-2 gap-x-8 gap-y-10 p-0 lg:grid-cols-5">
                <li className="grid justify-items-start gap-4">
                  <div>
                    <SpecimenLabel>Small</SpecimenLabel>
                    <code className="mt-1 block text-sm text-muted">
                      rounded-sm · 4px
                    </code>
                  </div>
                  <div
                    className="size-20 rounded-sm bg-gray-200"
                    aria-hidden="true"
                  />
                </li>
                <li className="grid justify-items-start gap-4">
                  <div>
                    <SpecimenLabel>Medium</SpecimenLabel>
                    <code className="mt-1 block text-sm text-muted">
                      rounded-md · 6px
                    </code>
                  </div>
                  <div
                    className="size-20 rounded-md bg-gray-200"
                    aria-hidden="true"
                  />
                </li>
                <li className="grid justify-items-start gap-4">
                  <div>
                    <SpecimenLabel>Control</SpecimenLabel>
                    <code className="mt-1 block text-sm text-muted">
                      rounded-[10px]
                    </code>
                  </div>
                  <div
                    className="size-20 rounded-[10px] bg-gray-200"
                    aria-hidden="true"
                  />
                </li>
                <li className="grid justify-items-start gap-4">
                  <div>
                    <SpecimenLabel>Surface</SpecimenLabel>
                    <code className="mt-1 block text-sm text-muted">
                      rounded-[11px]
                    </code>
                  </div>
                  <div
                    className="size-20 rounded-[11px] bg-gray-200"
                    aria-hidden="true"
                  />
                </li>
                <li className="grid justify-items-start gap-4">
                  <div>
                    <SpecimenLabel>Full</SpecimenLabel>
                    <code className="mt-1 block text-sm text-muted">
                      rounded-full · pill
                    </code>
                  </div>
                  <div
                    className="size-20 rounded-full bg-gray-200"
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
              Shadows
            </h2>
            <ul className="m-0 grid list-none grid-cols-2 gap-x-12 gap-y-10 p-0 lg:grid-cols-3">
              <li className="grid justify-items-start gap-4">
                <div>
                  <SpecimenLabel>Base</SpecimenLabel>
                  <p className="m-0 mt-1 text-pretty text-sm leading-[1.5] text-muted">
                    Border only
                  </p>
                </div>
                <div
                  className="size-24 rounded-[11px] border border-gray-200 bg-white shadow-none"
                  aria-hidden="true"
                />
              </li>
              <li className="grid justify-items-start gap-4">
                <div>
                  <SpecimenLabel>Soft</SpecimenLabel>
                  <p className="m-0 mt-1 text-pretty text-sm leading-[1.5] text-muted">
                    Event cards
                  </p>
                </div>
                <div
                  className="size-24 rounded-[11px] bg-white shadow-[0_3px_10px_rgba(0,0,0,0.12)]"
                  aria-hidden="true"
                />
              </li>
              <li className="grid justify-items-start gap-4">
                <div>
                  <SpecimenLabel>Raised</SpecimenLabel>
                  <p className="m-0 mt-1 text-pretty text-sm leading-[1.5] text-muted">
                    Team cards · shadow-lg / hover:shadow-xl
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
              Buttons
            </h2>
            <div className="grid gap-8">
              <div>
                <SpecimenLabel>Variants</SpecimenLabel>
                <div className={`${whiteSpecimenClassName} mt-4`}>
                  <Primary>Primary</Primary>
                  <Primary variant="secondary">
                    Secondary
                    <ArrowUpRightIcon />
                  </Primary>
                  <Primary variant="ghost">Ghost</Primary>
                  <IconButton aria-label="Next item">
                    <ArrowIcon />
                  </IconButton>
                </div>
              </div>
              <div>
                <SpecimenLabel>States</SpecimenLabel>
                <div className={`${whiteSpecimenClassName} mt-4`}>
                  <Primary loading>Loading</Primary>
                  <Primary disabled>Disabled</Primary>
                  <Primary variant="secondary" disabled>
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
            className={sectionClassName}
            aria-labelledby="links-title"
          >
            <h2 className={sectionTitleClassName} id="links-title">
              Links
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
              Inputs
            </h2>
            <div className="grid max-w-2xl gap-8 sm:grid-cols-2">
              <label className="grid gap-2 text-base font-bold">
                Email address
                <Input
                  type="email"
                  placeholder="you@example.com"
                  autoComplete="email"
                />
              </label>
              <label className="grid gap-2 text-base font-bold">
                Disabled
                <Input placeholder="Unavailable" disabled />
              </label>
            </div>
          </section>

          <section
            id="tooltips"
            className={sectionClassName}
            aria-labelledby="tooltips-title"
          >
            <h2 className={sectionTitleClassName} id="tooltips-title">
              Tooltips
            </h2>
            <div
              className={`${specimenClassName} gap-3 bg-surface-muted p-5 sm:p-8`}
            >
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
          </section>
        </div>
      </main>
    </TooltipProvider>
  );
}
