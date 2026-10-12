"use client";

import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import type { CSSProperties } from "react";

import { ArrowUpRightIcon } from "@/components/icons/ArrowUpRightIcon";

import { advisorFullName, type Advisor } from "./advisors";
import {
  AdvisorEmptyState,
  Portrait,
  SocialLinks,
  advisorLocationLabel,
  monoCellClassName,
  polaroidFrameClassName,
  polaroidPaddingClassName,
} from "./directory-ui";

const POLAROID_TILTS = [-1.2, 0.8, -0.5, 1.1, -0.9, 0.4];

function polaroidTilt(slug: string) {
  let hash = 0;
  for (const char of slug) hash = (hash * 31 + char.charCodeAt(0)) | 0;
  return POLAROID_TILTS[Math.abs(hash) % POLAROID_TILTS.length];
}

function AdvisorCard({ advisor, index }: { advisor: Advisor; index: number }) {
  const reduceMotion = useReducedMotion();

  return (
    <motion.li
      layout={!reduceMotion}
      className="group relative flex list-none flex-col"
      initial={reduceMotion ? false : { opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={reduceMotion ? undefined : { opacity: 0 }}
      transition={{
        duration: 0.24,
        delay: reduceMotion ? 0 : Math.min(index, 18) * 0.014,
        ease: [0.22, 1, 0.36, 1],
      }}
    >
      <div
        className={`${polaroidFrameClassName} ${polaroidPaddingClassName} transition-[transform,box-shadow] duration-200 ease-out [transform:rotate(var(--tilt))] group-hover:shadow-[0_2px_4px_rgba(15,23,42,0.06),0_14px_32px_rgba(15,23,42,0.12)] group-hover:[transform:rotate(0deg)] motion-reduce:transition-none motion-reduce:[transform:none]`}
        style={{ "--tilt": `${polaroidTilt(advisor.slug)}deg` } as CSSProperties}
      >
        <Portrait
          advisor={advisor}
          className="aspect-[4/5] w-full rounded-[2px] text-4xl tracking-[-0.06em] transition-[filter] duration-200 ease-out group-hover:grayscale-0 motion-reduce:transition-none"
        />
      </div>
      <div className="flex flex-1 flex-col gap-1 px-1 pt-4">
        {advisor.href === "#" ? (
          <span className="text-[15px] font-bold leading-tight tracking-[-0.01em] text-ink">
            {advisorFullName(advisor)}
          </span>
        ) : (
          <a
            className="inline-flex items-center gap-1 text-[15px] font-bold leading-tight tracking-[-0.01em] text-ink no-underline after:absolute after:inset-0 after:content-[''] focus-visible:outline-none focus-visible:after:outline-2 focus-visible:after:outline-offset-4 focus-visible:after:outline-ink"
            href={advisor.href}
            target="_blank"
            rel="noreferrer"
          >
            <span className="min-w-0">{advisorFullName(advisor)}</span>
            <ArrowUpRightIcon className="size-3 shrink-0 text-subtle opacity-0 transition-opacity duration-150 ease-out group-hover:opacity-100 motion-reduce:transition-none" />
          </a>
        )}
        <div className="truncate text-[13px] leading-snug text-muted" title={advisor.title}>
          {advisor.title}
        </div>
        <div className="flex flex-col items-start min-[520px]:flex-row min-[520px]:items-center min-[520px]:justify-between min-[520px]:gap-2">
          <div
            className={`${monoCellClassName} w-full min-w-0 truncate text-ink min-[520px]:w-auto`}
            title={[advisor.company, advisorLocationLabel(advisor)].filter(Boolean).join(" · ")}
          >
            {advisor.company}
            {advisor.locations.length > 0 ? (
              <span className="text-subtle">
                <span className="mx-[0.3em]">·</span>
                {advisorLocationLabel(advisor)}
              </span>
            ) : null}
          </div>
          <SocialLinks advisor={advisor} className="-ml-1.5 shrink-0 min-[520px]:-my-1.5 min-[520px]:-mr-1.5 min-[520px]:ml-0" />
        </div>
      </div>
    </motion.li>
  );
}

export function AdvisorCardsView({ rows }: { rows: Advisor[] }) {
  return (
    <div className="grid min-w-0 gap-6">

      {rows.length === 0 ? (
        <AdvisorEmptyState />
      ) : (
        <ul
          className="m-0 grid list-none grid-cols-2 gap-x-5 gap-y-12 p-0 min-[640px]:grid-cols-3 min-[1024px]:grid-cols-4 min-[1024px]:gap-x-8 min-[1024px]:gap-y-14 min-[1440px]:grid-cols-5"
          aria-label="Board of Advisors cards"
        >
          <AnimatePresence mode="popLayout">
            {rows.map((advisor, index) => (
              <AdvisorCard key={advisor.slug} advisor={advisor} index={index} />
            ))}
          </AnimatePresence>
        </ul>
      )}
    </div>
  );
}
