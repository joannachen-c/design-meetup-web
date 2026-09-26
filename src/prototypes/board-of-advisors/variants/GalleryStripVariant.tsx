"use client";

import { motion, useReducedMotion } from "motion/react";

import { ScrollReveal } from "@/components/ScrollReveal";
import { advisorFullName, advisors, type Advisor } from "../advisors";
import {
  AdvisorAvatar,
  AdvisorLink,
  AdvisorName,
  sectionHeadingClassName,
  sectionShellClassName,
} from "../shared";

function GalleryTile({
  advisor,
  index,
  reduceMotion,
}: {
  advisor: Advisor;
  index: number;
  reduceMotion: boolean | null;
}) {
  const hidden = { opacity: 0, y: 10 };
  const shown = { opacity: 1, y: 0 };

  return (
    <motion.li
      className="list-none"
      initial={reduceMotion ? false : hidden}
      animate={reduceMotion ? undefined : shown}
      transition={{
        duration: 0.24,
        delay: 0.02 + (index % 10) * 0.022,
        ease: [0.22, 1, 0.36, 1],
      }}
    >
      <AdvisorLink
        advisor={advisor}
        className="flex flex-col items-center gap-2.5 no-underline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ink"
      >
        <AdvisorAvatar advisor={advisor} size="md" />
        <AdvisorName
          advisor={advisor}
          className="max-w-[11ch] text-center text-sm font-bold leading-tight text-ink"
        />
        <span className="max-w-[12ch] text-center text-xs leading-snug text-subtle">
          {advisor.company}
        </span>
      </AdvisorLink>
    </motion.li>
  );
}

export function GalleryStripVariant() {
  const reduceMotion = useReducedMotion();

  return (
    <section
      className={sectionShellClassName}
      id="advisors"
      aria-labelledby="advisors-title-gallery"
    >
      <ScrollReveal>
        <h2 className={sectionHeadingClassName} id="advisors-title-gallery">
          Board of Advisors
        </h2>
        <p className="m-0 mt-5 max-w-[54ch] text-pretty text-base leading-[1.6] text-ink">
          Portrait-first wall — every face and full name visible, company as a
          quiet second line.
        </p>
      </ScrollReveal>
      <ScrollReveal delay={60}>
        <ul
          className="m-0 mt-[clamp(40px,6vw,72px)] grid list-none grid-cols-3 gap-x-3 gap-y-8 p-0 min-[520px]:grid-cols-4 min-[821px]:grid-cols-5 min-[1024px]:grid-cols-6"
          aria-label="Board of Advisors gallery"
        >
          {advisors.map((advisor, index) => (
            <GalleryTile
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
