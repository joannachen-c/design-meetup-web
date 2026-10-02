"use client";

import { motion, useReducedMotion } from "motion/react";

import { ScrollReveal } from "@/components/ScrollReveal";
import { advisorFullName, advisors, type Advisor } from "../advisors";
import {
  AdvisorAvatar,
  AdvisorLink,
  AdvisorMeta,
  AdvisorName,
  sectionHeadingClassName,
  sectionShellClassName,
} from "../shared";

function CompactTile({
  advisor,
  index,
  reduceMotion,
}: {
  advisor: Advisor;
  index: number;
  reduceMotion: boolean | null;
}) {
  const hidden = { opacity: 0, scale: 0.94 };
  const shown = { opacity: 1, scale: 1 };

  return (
    <motion.li
      className="list-none"
      initial={reduceMotion ? false : hidden}
      animate={reduceMotion ? undefined : shown}
      transition={{
        duration: 0.22,
        delay: 0.015 + (index % 18) * 0.012,
        ease: [0.22, 1, 0.36, 1],
      }}
    >
      <AdvisorLink
        advisor={advisor}
        className="flex flex-col items-center gap-2 rounded-[10px] px-1 py-2 text-center no-underline transition-colors duration-150 ease-out hover:bg-surface-muted focus-visible:bg-surface-muted focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink motion-reduce:transition-none"
      >
        <AdvisorAvatar advisor={advisor} size="sm" />
        <span className="grid min-w-0 gap-0.5">
          <AdvisorName
            advisor={advisor}
            className="text-xs font-bold leading-tight text-ink min-[821px]:text-sm"
          />
          <AdvisorMeta
            advisor={advisor}
            className="line-clamp-2 text-[11px] leading-snug text-muted min-[821px]:text-xs"
          />
        </span>
      </AdvisorLink>
    </motion.li>
  );
}

export function CompactGridVariant() {
  const reduceMotion = useReducedMotion();

  return (
    <section
      className={sectionShellClassName}
      id="advisors"
      aria-labelledby="advisors-title-compact"
    >
      <ScrollReveal className="grid min-w-0 gap-10 min-[821px]:grid-cols-12 min-[821px]:gap-16">
        <div className="min-w-0 min-[821px]:col-span-4">
          <h2 className={sectionHeadingClassName} id="advisors-title-compact">
            Board of Advisors
          </h2>
          <p className="m-0 mt-5 max-w-[36ch] text-pretty text-base leading-[1.6] text-ink">
            Fifty faces in one view — dense grid with full names and titles
            always readable.
          </p>
        </div>
        <ScrollReveal className="min-w-0 min-[821px]:col-span-8" delay={60}>
          <ul
            className="m-0 grid list-none grid-cols-3 gap-x-2 gap-y-4 p-0 min-[520px]:grid-cols-4 min-[821px]:grid-cols-5 min-[1024px]:grid-cols-6"
            aria-label="Board of Advisors compact grid"
          >
            {advisors.map((advisor, index) => (
              <CompactTile
                advisor={advisor}
                index={index}
                key={advisorFullName(advisor)}
                reduceMotion={reduceMotion}
              />
            ))}
          </ul>
        </ScrollReveal>
      </ScrollReveal>
    </section>
  );
}
