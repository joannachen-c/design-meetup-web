"use client";

import { motion, useReducedMotion } from "motion/react";

type Signatory = {
  firstName: string;
  fullName: string;
  href: string;
  // Each signature leans a different way so the four read as hands rather than
  // as one styled font applied four times.
  tiltDeg: number;
};

const signatureGroups: Array<{ role: string; people: Signatory[] }> = [
  {
    role: "Founders",
    people: [
      {
        firstName: "Ilyssa",
        fullName: "Ilyssa Yan",
        href: "https://www.linkedin.com/in/ilyssayan/",
        tiltDeg: -3.5,
      },
      {
        firstName: "Brandon",
        fullName: "Brandon Lee",
        href: "https://www.linkedin.com/in/brandonjoshlee/",
        tiltDeg: 2,
      },
    ],
  },
  {
    role: "Directors, Events & Partnerships",
    people: [
      {
        firstName: "Joanna",
        fullName: "Joanna Chen",
        href: "https://www.linkedin.com/in/joannachen1014/",
        tiltDeg: 2.75,
      },
      {
        firstName: "Michelle",
        fullName: "Michelle Liu",
        href: "https://www.linkedin.com/in/michelletliu/",
        tiltDeg: -1.75,
      },
    ],
  },
];

const signatureClassName = [
  "founders-signature inline-block rounded-sm px-1 pb-1 font-['Handflair',cursive]",
  "text-[clamp(2.25rem,4.5vw,3rem)] leading-[1.1] text-[#5c5c5c] no-underline",
  "transition-colors duration-150 ease-out hover:text-black focus-visible:text-black",
  "focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[oklch(22%_0.025_250)]",
  "motion-reduce:transition-none",
].join(" ");

export function FoundersNote() {
  const reduceMotion = useReducedMotion();

  return (
    <section
      className="founders-note bg-white px-[clamp(20px,6vw,96px)] pb-[clamp(24px,3vw,48px)] text-black"
      aria-labelledby="founders-note-title"
    >
      <h2 className="sr-only" id="founders-note-title">
        A note from the Design Meetup team
      </h2>
      {/* The card settles out of a slight tilt, like a note being laid down, and
          replays on every pass rather than only the first. */}
      <motion.figure
        className="founders-card m-0 mx-auto flex max-w-[760px] flex-col items-center rounded-[14px] border border-[#ececec] bg-white px-[clamp(24px,5vw,64px)] pt-[clamp(36px,5vw,64px)] pb-[clamp(28px,4vw,52px)] text-center shadow-[0_18px_48px_-28px_rgba(0,0,0,0.25)]"
        initial={reduceMotion ? false : { opacity: 0, y: 24, rotate: -1.6 }}
        whileInView={reduceMotion ? undefined : { opacity: 1, y: 0, rotate: 0 }}
        viewport={{ once: false, amount: 0.35 }}
        transition={{
          type: "spring",
          stiffness: 120,
          damping: 18,
          mass: 0.9,
        }}
      >
        <blockquote className="m-0 max-w-[52ch]">
          <p className="m-0 text-pretty text-base leading-[1.7] text-body">
            We created Design Meetup as a space for young designers to learn
            from not only each other but also industry leaders as speakers and
            mentors. The world might change, but we will always have our
            community.
          </p>
        </blockquote>
        <figcaption className="mt-[clamp(32px,4vw,52px)] flex w-full flex-wrap items-start justify-center gap-x-[clamp(24px,4vw,56px)] gap-y-[clamp(20px,3vw,32px)]">
          {signatureGroups.map((group) => (
            <div className="flex flex-col items-center" key={group.role}>
              <div className="flex items-end justify-center gap-x-[clamp(14px,2.5vw,28px)]">
                {group.people.map((person) => (
                  <a
                    className={signatureClassName}
                    key={person.fullName}
                    href={person.href}
                    target="_blank"
                    rel="noreferrer"
                    aria-label={`${person.fullName} on LinkedIn`}
                    style={{ transform: `rotate(${person.tiltDeg}deg)` }}
                  >
                    {person.firstName}
                  </a>
                ))}
              </div>
              <p className="m-0 mt-3 text-base text-subtle">{group.role}</p>
            </div>
          ))}
        </figcaption>
      </motion.figure>
    </section>
  );
}
