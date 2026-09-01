"use client";

import { motion, useReducedMotion } from "motion/react";

import { ScrollReveal } from "@/components/ScrollReveal";
import {
  advisorFullName,
  advisors,
  type Advisor,
} from "../advisors";

const sectionHeadingClassName =
  "m-0 text-balance text-[clamp(3.5rem,6vw,5rem)] font-bold leading-[1.05] tracking-[-0.06em] text-black max-[520px]:text-[clamp(2.75rem,12vw,3.75rem)]";

const signatureClassName = [
  "inline-block rounded-sm text-[#5c5c5c] no-underline",
  "transition-colors duration-150 ease-out hover:text-black focus-visible:text-black",
  "focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ink",
  "motion-reduce:transition-none",
  "px-1 pb-1 font-['Handflair',cursive]",
  "text-[clamp(1.5rem,2.8vw,2rem)] leading-[1.1]",
].join(" ");

function tiltForIndex(index: number) {
  const tilts = [-4, 2.5, -2, 3.5, -3, 1.5, -2.5, 4, -1.5, 2];
  return tilts[index % tilts.length];
}

function SignatureAdvisor({
  advisor,
  index,
  reduceMotion,
}: {
  advisor: Advisor;
  index: number;
  reduceMotion: boolean | null;
}) {
  const hidden = { opacity: 0, y: 16, rotate: tiltForIndex(index) - 2 };
  const shown = { opacity: 1, y: 0, rotate: tiltForIndex(index) };

  return (
    <motion.li
      className="list-none"
      initial={reduceMotion ? false : hidden}
      animate={reduceMotion ? undefined : shown}
      transition={{
        duration: 0.28,
        delay: 0.04 + (index % 12) * 0.025,
        ease: [0.22, 1, 0.36, 1],
      }}
    >
      <a
        className={signatureClassName}
        href={advisor.href}
        target="_blank"
        rel="noreferrer"
        aria-label={`${advisorFullName(advisor)}, ${advisor.title} at ${advisor.company}`}
        style={{ transform: reduceMotion ? `rotate(${tiltForIndex(index)}deg)` : undefined }}
      >
        {advisor.firstName}
      </a>
    </motion.li>
  );
}

export function SignaturesVariant() {
  const reduceMotion = useReducedMotion();

  return (
    <section
      className="board-advisors bg-surface px-[clamp(20px,6vw,96px)] py-[clamp(80px,10vw,160px)] text-black max-[820px]:py-[80px]"
      id="advisors"
      aria-labelledby="advisors-title-signatures"
    >
      <ScrollReveal>
        <h2 className={sectionHeadingClassName} id="advisors-title-signatures">
          Board of Advisors
        </h2>
        <p className="m-0 mt-5 max-w-[54ch] text-pretty text-base leading-[1.6] text-ink">
          Fifty designers and builders who believe in what we&apos;re growing
          together.
        </p>
      </ScrollReveal>
      <ScrollReveal delay={80}>
        <ul
          className="m-0 mt-[clamp(40px,6vw,72px)] flex max-w-[920px] flex-wrap items-end justify-center gap-x-[clamp(12px,2.5vw,28px)] gap-y-[clamp(16px,3vw,28px)] p-0"
          aria-label="Board of Advisors"
        >
          {advisors.map((advisor, index) => (
            <SignatureAdvisor
              advisor={advisor}
              index={index}
              key={advisorFullName(advisor)}
              reduceMotion={reduceMotion}
            />
          ))}
        </ul>
        <p className="m-0 mt-[clamp(32px,5vw,56px)] text-center text-base text-subtle">
          Hover a name for the full profile on LinkedIn
        </p>
      </ScrollReveal>
    </section>
  );
}
