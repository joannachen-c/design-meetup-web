"use client";

import { motion, useReducedMotion } from "motion/react";
import { useState } from "react";

import { ScrollReveal } from "@/components/ScrollReveal";
import {
  advisorAvatarClass,
  advisorFullName,
  advisorInitials,
  advisors,
  type Advisor,
} from "../advisors";

const sectionHeadingClassName =
  "m-0 text-balance text-[clamp(3.5rem,6vw,5rem)] font-bold leading-[1.05] tracking-[-0.06em] text-black max-[520px]:text-[clamp(2.75rem,12vw,3.75rem)]";

function PortraitTile({
  advisor,
  index,
  reduceMotion,
}: {
  advisor: Advisor;
  index: number;
  reduceMotion: boolean | null;
}) {
  const [hovered, setHovered] = useState(false);
  const hidden = { opacity: 0, scale: 0.88 };
  const shown = { opacity: 1, scale: 1 };

  return (
    <motion.li
      className="list-none"
      initial={reduceMotion ? false : hidden}
      animate={reduceMotion ? undefined : shown}
      transition={{
        duration: 0.24,
        delay: 0.02 + (index % 15) * 0.018,
        ease: [0.22, 1, 0.36, 1],
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onFocus={() => setHovered(true)}
      onBlur={() => setHovered(false)}
    >
      <a
        className="group flex flex-col items-center gap-2 no-underline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ink"
        href={advisor.href}
        target="_blank"
        rel="noreferrer"
        aria-label={`${advisorFullName(advisor)}, ${advisor.title} at ${advisor.company}`}
      >
        <span
          className={[
            advisorAvatarClass(advisor),
            "media-inset-edge-soft grid size-[clamp(52px,8vw,72px)] place-items-center rounded-full text-sm font-bold text-ink",
            "transition-transform duration-150 ease-out motion-reduce:transition-none",
            hovered ? "scale-[1.06]" : "scale-100",
          ].join(" ")}
        >
          {advisorInitials(advisor)}
        </span>
        <span
          className={[
            "max-w-[9ch] text-center text-xs leading-tight text-muted transition-opacity duration-150 ease-out motion-reduce:transition-none",
            hovered ? "opacity-100" : "opacity-0 max-[820px]:opacity-100",
          ].join(" ")}
          aria-hidden={!hovered}
        >
          <span className="block font-bold text-ink">{advisor.firstName}</span>
          <span className="block text-subtle">{advisor.company}</span>
        </span>
      </a>
    </motion.li>
  );
}

export function PortraitWallVariant() {
  const reduceMotion = useReducedMotion();

  return (
    <section
      className="board-advisors bg-surface px-[clamp(20px,6vw,96px)] py-[clamp(80px,10vw,160px)] text-black max-[820px]:py-[80px]"
      id="advisors"
      aria-labelledby="advisors-title-portraits"
    >
      <ScrollReveal className="grid min-w-0 gap-10 md:grid-cols-[minmax(0,1fr)_minmax(0,1.4fr)] md:items-start md:gap-16 min-[821px]:grid-cols-12">
        <div className="min-w-0 min-[821px]:col-span-4">
          <h2 className={sectionHeadingClassName} id="advisors-title-portraits">
            Board of Advisors
          </h2>
          <p className="m-0 mt-5 max-w-[36ch] text-pretty text-base leading-[1.6] text-ink">
            The people behind the work — fifty voices shaping where Design
            Meetup goes next.
          </p>
        </div>
        <ScrollReveal
          className="min-w-0 min-[821px]:col-span-8"
          delay={60}
        >
          <ul
            className="m-0 grid grid-cols-4 gap-x-3 gap-y-6 p-0 min-[520px]:grid-cols-5 min-[821px]:grid-cols-5 min-[1024px]:grid-cols-6"
            aria-label="Board of Advisors portraits"
          >
            {advisors.map((advisor, index) => (
              <PortraitTile
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
