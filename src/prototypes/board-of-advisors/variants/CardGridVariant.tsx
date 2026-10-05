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

function AdvisorCard({
  advisor,
  index,
  reduceMotion,
}: {
  advisor: Advisor;
  index: number;
  reduceMotion: boolean | null;
}) {
  const hidden = { opacity: 0, y: 12 };
  const shown = { opacity: 1, y: 0 };

  return (
    <motion.li
      className="list-none"
      initial={reduceMotion ? false : hidden}
      animate={reduceMotion ? undefined : shown}
      transition={{
        duration: 0.24,
        delay: 0.02 + (index % 12) * 0.02,
        ease: [0.22, 1, 0.36, 1],
      }}
    >
      <AdvisorLink
        advisor={advisor}
        className="group flex h-full flex-col items-center gap-3 rounded-[11px] bg-white p-5 text-center no-underline shadow-[0_3px_10px_rgba(0,0,0,0.08)] transition-[transform,box-shadow] duration-150 ease-out hover:shadow-[0_8px_20px_rgba(0,0,0,0.12)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink motion-reduce:transition-none min-[821px]:hover:-translate-y-0.5"
      >
        <AdvisorAvatar advisor={advisor} size="lg" />
        <span className="grid gap-1">
          <AdvisorName
            advisor={advisor}
            className="text-base font-bold leading-tight text-ink"
          />
          <AdvisorMeta advisor={advisor} className="text-sm leading-snug text-muted" />
        </span>
      </AdvisorLink>
    </motion.li>
  );
}

export function CardGridVariant() {
  const reduceMotion = useReducedMotion();

  return (
    <section
      className={sectionShellClassName}
      id="advisors"
      aria-labelledby="advisors-title-cards"
    >
      <ScrollReveal>
        <h2 className={sectionHeadingClassName} id="advisors-title-cards">
          Board of Advisors
        </h2>
        <p className="m-0 mt-5 max-w-[54ch] text-pretty text-base leading-[1.6] text-ink">
          Each advisor gets a card — portrait, full name, and role always on
          display.
        </p>
      </ScrollReveal>
      <ScrollReveal delay={60}>
        <ul
          className="m-0 mt-[clamp(40px,6vw,72px)] grid list-none grid-cols-2 gap-3 p-0 min-[520px]:grid-cols-3 min-[821px]:grid-cols-4 min-[1024px]:gap-4"
          aria-label="Board of Advisors cards"
        >
          {advisors.map((advisor, index) => (
            <AdvisorCard
              advisor={advisor}
              index={index}
              key={advisorFullName(advisor)}
              reduceMotion={reduceMotion}
            />
          ))}
        </ul>
      </ScrollReveal>
    </section>
  );
}
