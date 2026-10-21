"use client";

import { useEffect, useState } from "react";

import { ArrowUpRightIcon } from "@/components/icons/ArrowUpRightIcon";

import { advisorFullName, type Advisor } from "./advisors";
import {
  AdvisorEmptyState,
  Portrait,
  SocialLinks,
  advisorLocationLabel,
  monoCellClassName,
  monoLabelClassName,
  polaroidFrameClassName,
  polaroidPaddingClassName,
} from "./directory-ui";

const rowGridClassName =
  "grid grid-cols-[40px_minmax(0,1fr)] gap-x-3 min-[1024px]:grid-cols-[40px_minmax(0,1fr)_minmax(0,1.2fr)_minmax(0,0.8fr)_88px] min-[1024px]:gap-x-5";

function SpotlightContent({ advisor }: { advisor: Advisor }) {
  return (
    <>
      <a
        className={`${polaroidFrameClassName} ${polaroidPaddingClassName} group mx-auto block w-[min(100%,calc(clamp(184px,18vw,272px)*1.03))] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink`}
        href={advisor.href}
        target={advisor.href === "#" ? undefined : "_blank"}
        rel={advisor.href === "#" ? undefined : "noreferrer"}
        aria-label={advisorFullName(advisor)}
      >
        <Portrait
          advisor={advisor}
          className="aspect-[4/5] w-full rounded-[2px] text-6xl tracking-[-0.06em] transition-[filter] duration-200 ease-out group-hover:grayscale-0 motion-reduce:transition-none"
        />
      </a>
      <div className="grid gap-2 pt-[clamp(28px,2.8vw,44px)]">
        <p className="m-0 text-balance text-[clamp(1.75rem,2.6vw,2.5rem)] font-bold leading-[1.15] tracking-[-0.06em] text-ink">
          {advisorFullName(advisor)}
        </p>
        <p className="m-0 text-base leading-[1.7] text-ink">{advisor.title}</p>
        <p className="m-0 font-mono text-base leading-[1.5] text-muted">
          {advisor.company}
          {advisor.locations.length > 0 ? (
            <span className="text-subtle">
              <span className="mx-[0.3em]">·</span>
              {advisorLocationLabel(advisor)}
            </span>
          ) : null}
        </p>
        <SocialLinks advisor={advisor} className="-ml-1.5 pt-1" />
      </div>
    </>
  );
}

// Every panel shares one grid cell so the aside is as tall as the tallest advisor and swaps are pure opacity fades.
function SpotlightPanel({ rows, activeSlug }: { rows: Advisor[]; activeSlug: string | undefined }) {
  return (
    <aside className="hidden min-[821px]:grid" aria-live="polite" aria-label="Selected advisor">
      {rows.map((advisor) => {
        const active = advisor.slug === activeSlug;
        return (
          <div
            key={advisor.slug}
            className={`[grid-area:1/1] transition-[opacity,visibility] duration-200 ease-out motion-reduce:transition-none ${active ? "visible opacity-100" : "invisible opacity-0"}`}
            aria-hidden={active ? undefined : true}
          >
            <SpotlightContent advisor={advisor} />
          </div>
        );
      })}
    </aside>
  );
}

function TableRow({
  advisor,
  active,
  onActivate,
}: {
  advisor: Advisor;
  active: boolean;
  onActivate: () => void;
}) {
  return (
    <li
      className={`${rowGridClassName} group/row items-center rounded-[6px] px-2 py-2 transition-colors duration-150 ease-out motion-reduce:transition-none ${advisor.href === "#" ? "" : "cursor-pointer"} ${active ? "bg-surface-muted" : "bg-transparent"}`}
      onMouseEnter={onActivate}
      onFocus={(event) => {
        if (event.target.matches(":focus-visible")) onActivate();
      }}
      onClick={(event) => {
        if (advisor.href === "#" || (event.target as HTMLElement).closest("a")) return;
        window.open(advisor.href, "_blank", "noopener,noreferrer");
      }}
      data-active={active ? "" : undefined}
    >
      <span className="flex w-10 rounded-[3px] bg-white p-[2px] pb-[3px] shadow-[0_1px_2px_rgba(15,23,42,0.08),0_3px_8px_rgba(15,23,42,0.08)]">
        <Portrait advisor={advisor} className="aspect-[4/5] w-full rounded-[1px] text-[10px]" />
      </span>
      {advisor.href === "#" ? (
        <span className="min-w-0 truncate text-base font-bold leading-tight text-ink">
          {advisorFullName(advisor)}
        </span>
      ) : (
        <a
          className="group inline-flex min-w-0 items-center gap-1 self-center text-base font-bold leading-tight text-ink no-underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink"
          href={advisor.href}
          target="_blank"
          rel="noreferrer"
        >
          <span className="truncate">{advisorFullName(advisor)}</span>
          <ArrowUpRightIcon className="size-3.5 shrink-0 text-muted opacity-0 transition-[opacity,transform] duration-150 ease-out group-hover:-translate-y-px group-hover:translate-x-px group-hover/row:opacity-100 group-focus-visible:opacity-100 motion-reduce:transition-none" />
        </a>
      )}
      <span
        className={`${monoCellClassName} col-start-2 min-[1024px]:col-start-auto min-[1024px]:truncate`}
        title={advisor.title}
      >
        {advisor.title}
      </span>
      <span
        className={`${monoCellClassName} col-start-2 text-ink min-[1024px]:col-start-auto min-[1024px]:truncate`}
        title={advisor.company}
      >
        {advisor.company}
      </span>
      <SocialLinks
        advisor={advisor}
        className="col-start-2 -ml-1.5 min-[1024px]:col-start-auto min-[1024px]:ml-0 min-[1024px]:justify-end"
      />
    </li>
  );
}

export function AdvisorTableView({ rows }: { rows: Advisor[] }) {
  const [activeSlug, setActiveSlug] = useState<string | null>(null);
  const activeAdvisor = rows.find((advisor) => advisor.slug === activeSlug) ?? rows[0];

  useEffect(() => {
    if (activeSlug && !rows.some((advisor) => advisor.slug === activeSlug)) {
      setActiveSlug(null);
    }
  }, [rows, activeSlug]);

  return (
    // Left track mirrors the events grid view's detail column: 5/12 of the full-bleed width minus its page padding on both sides.
    <div className="grid min-w-0 gap-[clamp(24px,3vw,40px)] min-[821px]:grid-cols-[calc((100%+2*clamp(20px,6vw,96px))*5/12-2*clamp(20px,6vw,96px))_minmax(0,1fr)]">
      <SpotlightPanel rows={rows} activeSlug={activeAdvisor?.slug} />
      <div className="relative min-w-0">
        {rows.length === 0 ? (
          <AdvisorEmptyState />
        ) : (
          <ol
            className="m-0 list-none p-0 min-[821px]:absolute min-[821px]:inset-0 min-[821px]:overflow-y-auto min-[821px]:overscroll-contain min-[821px]:pb-16 min-[821px]:[mask-image:linear-gradient(to_bottom,black_calc(100%-56px),transparent)] min-[821px]:[scrollbar-width:thin]"
            aria-label="Board of Advisors table"
          >
            {rows.map((advisor) => (
              <TableRow
                key={advisor.slug}
                advisor={advisor}
                active={advisor.slug === activeAdvisor?.slug}
                onActivate={() => setActiveSlug(advisor.slug)}
              />
            ))}
          </ol>
        )}
      </div>
    </div>
  );
}
