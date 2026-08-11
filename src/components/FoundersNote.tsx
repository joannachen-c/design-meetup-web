"use client";

import { motion, useReducedMotion } from "motion/react";
import { useRef } from "react";

import { useReplayInView } from "../lib/replay-reveal";

type Person = {
  firstName: string;
  fullName: string;
  href: string;
};

type Signatory = Person & {
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
        tiltDeg: 4.5,
      },
      {
        firstName: "Michelle",
        fullName: "Michelle Liu",
        href: "https://www.linkedin.com/in/michelletliu/",
        tiltDeg: -3.25,
      },
    ],
  },
];

const teamGroups: Array<{ role: string; people: Person[] }> = [
  {
    role: "Graphics Leads",
    people: [
      {
        firstName: "Matthew",
        fullName: "Matthew Hope",
        href: "https://www.linkedin.com/in/matthewhope1/",
      },
      {
        firstName: "Yufei",
        fullName: "Yufei Wang",
        href: "https://www.linkedin.com/in/yufei-wang-5b1138253/",
      },
    ],
  },
  {
    role: "Internal Community Lead",
    people: [
      {
        firstName: "Emily",
        fullName: "Emily Shen",
        href: "https://www.linkedin.com/in/emilyshenucla/",
      },
    ],
  },
];

const nameLinkClassName = [
  "inline-block rounded-sm text-[#5c5c5c] no-underline",
  "transition-colors duration-150 ease-out hover:text-black focus-visible:text-black",
  "focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ink",
  "motion-reduce:transition-none",
].join(" ");

const signatureClassName = [
  nameLinkClassName,
  "founders-signature px-1 pb-1 font-['Handflair',cursive]",
  "text-[clamp(2.25rem,4.5vw,3rem)] leading-[1.1]",
].join(" ");

const teamNameClassName = [
  nameLinkClassName,
  "px-1 pb-1 font-['Handflair',cursive]",
  "text-[clamp(1.75rem,3.5vw,2.25rem)] leading-[1.1]",
].join(" ");

// The card travels far enough to read as arriving from off the page, and the
// spring is loose enough to overshoot a touch as it lands. It comes to rest
// just off level, so the note reads as set down by hand rather than typeset.
const cardHidden = { opacity: 0, y: 64, rotate: -3.5, scale: 0.955 };
const cardShown = { opacity: 1, y: 0, rotate: -1, scale: 1 };

// The stamp resolves out of a blur rather than being slammed down. Opacity
// carries the entrance and the 2% scale settle is small enough to read as the
// mark coming into focus; the curve's long tail lands it without any overshoot,
// which is what separates a dissolve from the press this used to be.
const stampHidden = { opacity: 0, scale: 1.02, filter: "blur(6px)" };
const stampShown = { opacity: 1, scale: 1, filter: "blur(0px)" };
const dissolveEase: [number, number, number, number] = [0.22, 1, 0.36, 1];

const teamHidden = { opacity: 0, y: 32 };
const teamShown = { opacity: 1, y: 0 };

export function FoundersNote() {
  const reduceMotion = useReducedMotion();
  const noteRef = useRef<HTMLElement>(null);
  // The section is never transformed, so how much of it overlaps the viewport
  // depends only on the scroll position. Watching it — instead of letting the
  // card, the stamp and the team row each watch themselves — keeps every
  // entrance transform out of its own trigger, which is what stopped the card
  // from revealing and rewinding forever once the page hit its scroll limit.
  const inView = useReplayInView(noteRef, { amount: 0.35 });

  return (
    // The gutter runs wider than the page's 20px because the tilt swings the
    // card's corners outward; the extra inset lands them back on the page
    // gutter line at the narrowest widths.
    <section
      ref={noteRef}
      className="founders-note bg-surface px-[clamp(30px,6vw,96px)] pb-[clamp(48px,6.5vw,96px)] text-black"
      aria-labelledby="founders-note-title"
    >
      <h2 className="sr-only" id="founders-note-title">
        A note from the Design Meetup team
      </h2>
      {/* The card settles out of a tilt, like a note being laid down, and
          replays on every pass rather than only the first. Reduced motion skips
          the travel and holds that resting angle, since the tilt is the card's
          posture and not movement. */}
      <motion.figure
        className="founders-card m-0 mx-auto flex max-w-[720px] flex-col items-center rounded-[6px] border border-gray-100 bg-white px-[clamp(24px,5vw,56px)] pt-[clamp(36px,5vw,64px)] pb-[clamp(28px,4vw,52px)] text-center shadow-[0_4px_12px_4px_rgba(0,0,0,0.05)]"
        initial={reduceMotion ? { rotate: -1 } : cardHidden}
        animate={
          reduceMotion ? { rotate: -1 } : inView ? cardShown : cardHidden
        }
        transition={{
          type: "spring",
          stiffness: 104,
          damping: 16,
          mass: 0.95,
        }}
      >
        {/* The stamp waits for the card to settle before it appears, so it
            reads as surfacing on a note already lying flat. It dissolves in
            rather than landing: the blur clearing is what carries the entrance,
            and the slow tail means the mark never overshoots or springs, which
            at 100px is the difference between a mark appearing and a bounce.
            Reduced motion keeps the mark and drops the dissolve. */}
        <motion.img
          className="mb-[clamp(28px,3.5vw,44px)] size-[100px]"
          src="/design-meetup-stamp.png"
          alt=""
          width={100}
          height={100}
          loading="lazy"
          decoding="async"
          initial={reduceMotion ? { opacity: 0 } : stampHidden}
          animate={
            reduceMotion
              ? { opacity: inView ? 1 : 0 }
              : inView
                ? stampShown
                : stampHidden
          }
          transition={
            reduceMotion
              ? { duration: 0.3, ease: "easeOut" }
              : { duration: 0.72, delay: 0.24, ease: dissolveEase }
          }
        />
        <blockquote className="m-0 max-w-[44ch]">
          <p className="m-0 text-pretty text-base leading-[1.7] text-body">
            We created Design Meetup to build the design community our younger
            selves wish existed:{"\u00A0"}curated, ambitious, and focused on
            growth.
          </p>
          <p className="m-0 mt-4 text-pretty text-base leading-[1.7] text-body">
            We’d love to grow it alongside partners who believe in the future of
            design. Join us!
          </p>
        </blockquote>
        {/* Heart sign-off ("from,") temporarily hidden — card max-width tightened without it. */}
        <figcaption className="mt-[clamp(28px,3.5vw,44px)] flex w-full flex-wrap items-start justify-center gap-x-[clamp(24px,4vw,56px)] gap-y-[clamp(20px,3vw,32px)] min-[821px]:flex-nowrap">
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
      <motion.div
        className="mx-auto mt-[clamp(56px,8vw,104px)] flex max-w-[760px] flex-wrap items-start justify-center gap-x-[clamp(56px,10vw,140px)] gap-y-[clamp(16px,2.5vw,24px)] text-center"
        initial={reduceMotion ? false : teamHidden}
        animate={reduceMotion ? undefined : inView ? teamShown : teamHidden}
        transition={{
          type: "spring",
          stiffness: 112,
          damping: 18,
          mass: 0.85,
          delay: 0.08,
        }}
      >
        {teamGroups.map((group) => (
          <div className="flex flex-col items-center" key={group.role}>
            <div className="flex flex-wrap items-baseline justify-center gap-x-[clamp(14px,2.5vw,28px)]">
              {group.people.map((person) => (
                <a
                  className={teamNameClassName}
                  key={person.fullName}
                  href={person.href}
                  target="_blank"
                  rel="noreferrer"
                  aria-label={`${person.fullName} on LinkedIn`}
                >
                  {person.firstName}
                </a>
              ))}
            </div>
            <p className="m-0 mt-3 text-base text-subtle">{group.role}</p>
          </div>
        ))}
      </motion.div>
    </section>
  );
}
