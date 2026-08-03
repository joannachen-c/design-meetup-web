"use client";

import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import {
  useCallback,
  useEffect,
  useId,
  useLayoutEffect,
  useRef,
  useState,
} from "react";
import { ArrowUpRightIcon } from "./icons/ArrowUpRightIcon";
import { InstagramIcon, LinkedInIcon, SubstackIcon, XIcon } from "./icons/SocialIcons";
import { Input } from "./Input";
import { IconButton } from "./IconButton";
import { Link } from "./Link";
import { Primary } from "./Primary";
import { ScrollReveal } from "./ScrollReveal";
import { Tooltip, TooltipProvider } from "./Tooltip";
import type { MeetupEvent } from "@/lib/supabase";

const partnerLogos = [
  { slug: "figma", src: "/partners/figma.png" },
  { slug: "cursor", src: "/partners/cursor.png" },
  { slug: "notion", src: "/partners/notion.png" },
  { slug: "ramp", src: "/partners/partner-4.png" },
  { slug: "apple", src: "/partners/apple.png" },
  { slug: "tiktok", src: "/partners/tiktok.png" },
  { slug: "framer", src: "/partners/framer.png" },
  { slug: "google", src: "/partners/google.png" },
  { slug: "rainbow", src: "/partners/partner-9.png" },
];

type TeamMember = {
  name: string;
  linkedin: string | null;
  image: string;
};

const teamGroups: Array<{ role: string; members: TeamMember[] }> = [
  {
    role: "Founders",
    members: [
      {
        name: "Ilyssa Yan",
        linkedin: "https://www.linkedin.com/in/ilyssayan",
        image: "/team/ilyssa-yan.jpg",
      },
      {
        name: "Brandon Lee",
        linkedin: "https://www.linkedin.com/in/brandonjoshlee",
        image: "/team/brandon-lee.jpg",
      },
    ],
  },
  {
    role: "Directors, Event & Partnerships",
    members: [
      {
        name: "Joanna Chen",
        linkedin: "https://www.linkedin.com/in/joannachen1014/",
        image: "/team/joanna-chen.jpg",
      },
      {
        name: "Michelle Liu",
        linkedin: "https://www.linkedin.com/in/michelletliu",
        image: "/team/michelle-liu.jpg",
      },
    ],
  },
  {
    role: "Graphics Leads",
    members: [
      {
        name: "Matthew Hope",
        linkedin: "https://www.linkedin.com/in/matthewhope1",
        image: "/team/matthew-hope.jpg",
      },
      {
        name: "Yufei Wang",
        linkedin: "https://www.linkedin.com/in/yufei-wang-5b1138253/",
        image: "/team/yufei-wang.jpg",
      },
    ],
  },
  {
    role: "Internal Community Lead",
    members: [
      {
        name: "Emily Shen",
        linkedin: "https://www.linkedin.com/in/emilyshenucla",
        image: "/team/emily-shen.jpg",
      },
    ],
  },
];

const websiteTeam = new Set(["Ilyssa Yan", "Brandon Lee", "Joanna Chen", "Michelle Liu"]);

const aboutOfferings = [
  {
    title: "In-person events",
    description:
      "Think speaker panels, workshops, talks, and meetups at cafes and co-working venues to meet new design friends.",
    icon: "/about/in-person-events.svg",
  },
  {
    title: "Monthly newsletter",
    description:
      "Get curated events, opportunities, and designers to watch and candid takes about craft and taste.",
    icon: "/about/monthly-newsletter.svg",
  },
  {
    title: "Online community",
    description:
      "Meet new design friends, get feedback on your portfolio or side projects, and learn about exclusive opportunities.",
    icon: "/about/online-community.svg",
  },
];

const LUMA_CALENDAR_EMBED_SRC =
  "https://luma.com/embed/calendar/cal-HH5XBdHyWPt0yhB/events?lt=light";

const footerLinkClassName =
  "rounded-sm text-[oklch(53%_0.025_250)] no-underline hover:text-[oklch(22%_0.025_250)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[oklch(22%_0.025_250)]";
const footerCreditLinkClassName = `${footerLinkClassName} text-medium`;

const detailSummaryClassName = [
  "detail-summary max-w-[54ch] text-base leading-[1.7]",
  "[&_p]:whitespace-pre-line [&_p]:text-pretty [&_li]:whitespace-pre-line [&_li]:text-pretty [&_blockquote]:whitespace-pre-line [&_blockquote]:text-pretty",
  "[&_h2]:text-base [&_h2]:font-bold [&_h2]:leading-[1.35] [&_h2]:tracking-[-0.06em] [&_h2]:text-[oklch(22%_0.025_250)]",
  "[&_h3]:text-base [&_h3]:font-bold [&_h3]:leading-[1.35] [&_h3]:tracking-[-0.06em] [&_h3]:text-[oklch(22%_0.025_250)]",
  "[&_h4]:text-base [&_h4]:font-bold [&_h4]:leading-[1.35] [&_h4]:tracking-[-0.06em] [&_h4]:text-[oklch(22%_0.025_250)]",
  "[&_strong]:font-bold [&_strong]:text-[oklch(22%_0.025_250)] [&_a]:text-[oklch(22%_0.025_250)] [&_a]:underline [&_a]:underline-offset-[3px]",
  "[&_ul]:pl-[1.2rem] [&_ol]:pl-[1.2rem] [&_blockquote]:border-l-2 [&_blockquote]:border-[oklch(88%_0.018_240)] [&_blockquote]:pl-[0.9rem] [&_hr]:bg-[oklch(88%_0.018_240)]",
].join(" ");

function parseHosts(hosts: string | null | undefined) {
  return (hosts ?? "")
    .split(/\s*(?:,|&|\band\b)\s*/i)
    .map((host) => host.trim())
    .filter(Boolean);
}

function ArrowIcon({ direction }: { direction: "left" | "right" }) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path
        d={direction === "left" ? "M15 5l-7 7 7 7" : "M9 5l7 7-7 7"}
        fill="none"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.7"
      />
    </svg>
  );
}

function TeamCard({ member }: { member: TeamMember }) {
  const card = (
    <>
      <div className="aspect-square overflow-hidden rounded-sm bg-gray-100">
        <img
          className="size-full rounded-sm border-0 object-cover outline-none"
          src={member.image}
          alt={`${member.name} portrait`}
          width={800}
          height={800}
          loading="lazy"
        />
      </div>
      <span className="mt-1.5 block text-sm font-bold text-[oklch(22%_0.025_250)]">
        {member.name}
      </span>
    </>
  );

  return member.linkedin ? (
    <a
      className="team-polaroid w-[clamp(108px,9vw,132px)] block rounded-md border border-gray-100 bg-white p-2 pb-3.5 no-underline shadow-lg outline-none hover:shadow-xl focus-visible:ring-2 focus-visible:ring-[oklch(22%_0.025_250)] focus-visible:ring-offset-4"
      href={member.linkedin}
      target="_blank"
      rel="noreferrer"
      aria-label={`${member.name} on LinkedIn`}
    >
      {card}
    </a>
  ) : (
    <div className="team-polaroid w-[clamp(108px,9vw,132px)] block rounded-md border border-gray-100 bg-white p-2 pb-3.5 shadow-lg hover:shadow-xl">
      {card}
    </div>
  );
}

function ExpandableSummary({
  summaryHtml,
  summaryParagraphs,
  eventId,
}: {
  summaryHtml: string;
  summaryParagraphs: string[];
  eventId: string;
}) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [hasOverflow, setHasOverflow] = useState(false);
  const contentRef = useRef<HTMLDivElement | null>(null);
  const contentId = `event-summary-${eventId}-${useId().replace(/:/g, "")}`;

  useLayoutEffect(() => {
    const content = contentRef.current;
    if (!content) return;

    const updateOverflow = () => {
      const contentHeight = content.getBoundingClientRect().height;
      setHasOverflow(contentHeight > 360);
    };

    updateOverflow();
    const observer = new ResizeObserver(updateOverflow);
    observer.observe(content);

    return () => observer.disconnect();
  }, [summaryHtml, summaryParagraphs]);

  return (
    <>
      <div className="relative">
        <div
          className={isExpanded ? "overflow-visible" : "max-h-[360px] overflow-hidden"}
          id={contentId}
        >
          <div ref={contentRef}>
            {summaryHtml ? (
              <div
                className={detailSummaryClassName}
                dangerouslySetInnerHTML={{ __html: summaryHtml }}
              />
            ) : (
              <div className={detailSummaryClassName}>
                {summaryParagraphs.map((paragraph, paragraphIndex) => (
                  <p key={`${eventId}-summary-${paragraphIndex}`}>
                    {paragraph}
                  </p>
                ))}
              </div>
            )}
          </div>
        </div>
        {hasOverflow && !isExpanded ? (
          <div
            className="pointer-events-none absolute inset-x-0 bottom-0 h-24 bg-gradient-to-b from-transparent to-white backdrop-blur-[1px]"
            aria-hidden="true"
          />
        ) : null}
      </div>
      {hasOverflow ? (
        <Link
          className="mt-2"
          aria-expanded={isExpanded}
          aria-controls={contentId}
          onClick={() => setIsExpanded(!isExpanded)}
        >
          {isExpanded ? "See less" : "See more"}
        </Link>
      ) : null}
    </>
  );
}

export type HomePageProps = {
  initialEvents: MeetupEvent[];
  initialError: string | null;
};

export default function HomePage({
  initialEvents,
  initialError,
}: HomePageProps) {
  const [events, setEvents] = useState<MeetupEvent[]>(initialEvents);
  const [selectedIndex, setSelectedIndex] = useState(() =>
    initialEvents.length > 3 ? 3 : 0,
  );
  const [isWebsiteTeamVisible, setIsWebsiteTeamVisible] = useState(false);
  const [status, setStatus] = useState<"loading" | "ready" | "error">(() =>
    initialError ? "error" : "ready",
  );
  const [errorMessage, setErrorMessage] = useState<string | null>(initialError);
  const cardRefs = useRef<Array<HTMLButtonElement | null>>([]);
  const galleryRef = useRef<HTMLUListElement | null>(null);
  const detailPhotoRailRef = useRef<HTMLUListElement | null>(null);
  const slideRefs = useRef<Array<HTMLLIElement | null>>([]);
  const hasCenteredInitial = useRef(false);
  const isProgrammaticScroll = useRef(false);
  const scrollSettleTimer = useRef<number | null>(null);
  const selectionSource = useRef<"control" | "scroll">("control");
  const [photoRailElement, setPhotoRailElement] =
    useState<HTMLUListElement | null>(null);
  const [canScrollPhotosLeft, setCanScrollPhotosLeft] = useState(false);
  const [canScrollPhotosRight, setCanScrollPhotosRight] = useState(false);
  const reduceMotion = useReducedMotion();
  const selectedEvent = events[selectedIndex];
  const hosts = parseHosts(selectedEvent?.hosts);
  const sponsors =
    selectedEvent?.event_sponsors.map((eventSponsor) => eventSponsor.sponsor) ??
    [];
  const summaryParagraphs =
    selectedEvent?.summary?.split(/\n{2,}/).filter(Boolean) ?? [];
  const summaryHtml = selectedEvent?.summary_html?.trim() ?? "";
  const selectedPhotos =
    selectedEvent?.gallery_images?.length > 0
      ? selectedEvent.gallery_images.map((image) => image.image_url)
      : selectedEvent
        ? [selectedEvent.image_url]
        : [];
  const showWebsiteTeam = () => setIsWebsiteTeamVisible(true);

  const setDetailPhotoRail = useCallback(
    (rail: HTMLUListElement | null) => {
      detailPhotoRailRef.current = rail;
      setPhotoRailElement(rail);
    },
    [],
  );

  const updatePhotoRailBounds = useCallback(
    (rail: HTMLUListElement) => {
      setCanScrollPhotosLeft(rail.scrollLeft > 1);
      setCanScrollPhotosRight(
        rail.scrollLeft < rail.scrollWidth - rail.clientWidth - 1,
      );
    },
    [],
  );

  const updatePhotoRailBoundsFromRef = useCallback(() => {
    const rail = detailPhotoRailRef.current;
    if (rail) updatePhotoRailBounds(rail);
  }, [updatePhotoRailBounds]);

  useEffect(() => {
    if (!photoRailElement) {
      setCanScrollPhotosLeft(false);
      setCanScrollPhotosRight(false);
      return;
    }

    const updateBounds = () => updatePhotoRailBounds(photoRailElement);
    const frame = requestAnimationFrame(updateBounds);
    const observer = new ResizeObserver(updateBounds);

    photoRailElement.addEventListener("scroll", updateBounds, {
      passive: true,
    });
    observer.observe(photoRailElement);

    return () => {
      cancelAnimationFrame(frame);
      photoRailElement.removeEventListener("scroll", updateBounds);
      observer.disconnect();
    };
  }, [photoRailElement, selectedEvent?.id, updatePhotoRailBounds]);

  const scrollPhotoRail = useCallback(
    (direction: -1 | 1) => {
      const rail = detailPhotoRailRef.current;
      if (!rail) return;

      rail.scrollBy({
        left: direction * Math.max(rail.clientWidth * 0.8, 240),
        behavior: reduceMotion ? "auto" : "smooth",
      });
    },
    [reduceMotion],
  );

  const selectEvent = useCallback(
    (index: number) => {
      if (events.length === 0) return;
      const nextIndex = Math.max(0, Math.min(events.length - 1, index));
      selectionSource.current = "control";
      setSelectedIndex(nextIndex);
    },
    [events.length],
  );

  const markProgrammaticScroll = useCallback(() => {
    isProgrammaticScroll.current = true;
    if (scrollSettleTimer.current !== null) {
      window.clearTimeout(scrollSettleTimer.current);
    }
    scrollSettleTimer.current = window.setTimeout(
      () => {
        isProgrammaticScroll.current = false;
        scrollSettleTimer.current = null;
      },
      reduceMotion ? 80 : 180,
    );
  }, [reduceMotion]);

  const nearestSlideIndexToCenter = useCallback(() => {
    const gallery = galleryRef.current;
    if (!gallery) return null;

    const rect = gallery.getBoundingClientRect();
    const scrollportCenter = rect.left + rect.width / 2;
    let nearestIndex: number | null = null;
    let nearestDistance = Number.POSITIVE_INFINITY;

    slideRefs.current.forEach((slide, index) => {
      if (!slide) return;
      const slideRect = slide.getBoundingClientRect();
      const slideCenter = slideRect.left + slideRect.width / 2;
      const distance = Math.abs(slideCenter - scrollportCenter);
      if (distance < nearestDistance) {
        nearestDistance = distance;
        nearestIndex = index;
      }
    });

    return nearestIndex;
  }, []);

  useEffect(() => {
    if (status !== "ready" || events.length === 0) return;
    if (selectionSource.current === "scroll") return;

    const frame = requestAnimationFrame(() => {
      markProgrammaticScroll();
      cardRefs.current[selectedIndex]?.scrollIntoView({
        behavior:
          hasCenteredInitial.current && !reduceMotion ? "smooth" : "auto",
        block: "nearest",
        inline: "center",
      });
      hasCenteredInitial.current = true;
    });

    return () => cancelAnimationFrame(frame);
  }, [
    events.length,
    markProgrammaticScroll,
    reduceMotion,
    selectedIndex,
    status,
  ]);

  useEffect(
    () => () => {
      if (scrollSettleTimer.current !== null) {
        window.clearTimeout(scrollSettleTimer.current);
      }
    },
    [],
  );

  useEffect(() => {
    const gallery = galleryRef.current;
    if (!gallery || status !== "ready" || events.length === 0) return;

    let frame = 0;

    const handleScroll = () => {
      if (isProgrammaticScroll.current) {
        markProgrammaticScroll();
        return;
      }
      if (frame !== 0) return;

      frame = requestAnimationFrame(() => {
        frame = 0;
        const nextIndex = nearestSlideIndexToCenter();
        if (nextIndex === null) return;
        selectionSource.current = "scroll";
        setSelectedIndex(nextIndex);
      });
    };

    gallery.addEventListener("scroll", handleScroll, { passive: true });

    return () => {
      gallery.removeEventListener("scroll", handleScroll);
      if (frame !== 0) cancelAnimationFrame(frame);
    };
  }, [
    events.length,
    markProgrammaticScroll,
    nearestSlideIndexToCenter,
    status,
  ]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key !== "ArrowLeft" && event.key !== "ArrowRight") return;
      if (
        event.target instanceof HTMLInputElement ||
        event.target instanceof HTMLTextAreaElement
      ) {
        return;
      }
      if (events.length === 0) return;

      event.preventDefault();
      selectionSource.current = "control";
      setSelectedIndex((current) => {
        const delta = event.key === "ArrowLeft" ? -1 : 1;
        return Math.max(0, Math.min(events.length - 1, current + delta));
      });
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [events.length]);

  return (
    <main className="min-h-dvh w-full overflow-hidden rounded-none border-0 bg-white font-['Alte_Haas_Grotesk',sans-serif] text-[oklch(22%_0.025_250)] shadow-none antialiased [font-synthesis:none] [text-rendering:optimizeLegibility]">
      <header className="site-header px-[clamp(20px,6vw,96px)] pt-[clamp(20px,2.5vw,38px)] pb-[clamp(24px,3vw,46px)] text-base">
        <ScrollReveal>
          <a
            className="wordmark leading-[0] no-underline focus-visible:underline focus-visible:decoration-2 focus-visible:underline-offset-4"
            href="#"
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
        </ScrollReveal>
        <ScrollReveal delay={60}>
          <nav className="primary-navigation" aria-label="Primary navigation">
            <a
              className="text-base text-[oklch(53%_0.025_250)] no-underline hover:text-[oklch(22%_0.025_250)] focus-visible:underline focus-visible:decoration-2 focus-visible:underline-offset-4"
              href="#calendar"
            >
              CALENDAR
            </a>
            <a
              className="text-base text-[oklch(53%_0.025_250)] no-underline hover:text-[oklch(22%_0.025_250)] focus-visible:underline focus-visible:decoration-2 focus-visible:underline-offset-4"
              href="#about"
            >
              ABOUT
            </a>
            <a
              className="text-base text-[oklch(53%_0.025_250)] no-underline hover:text-[oklch(22%_0.025_250)] focus-visible:underline focus-visible:decoration-2 focus-visible:underline-offset-4"
              href="#sponsor"
            >
              SPONSOR
            </a>
          </nav>
        </ScrollReveal>
      </header>

      <section
        className="intro px-[clamp(20px,6vw,96px)] py-[clamp(26px,4.5vw,69px)] max-[820px]:py-8 max-[520px]:py-[23px]"
        aria-labelledby="page-title"
      >
        <ScrollReveal className="intro-title col-span-8 max-[820px]:col-span-1">
          <h1
            className="m-0 text-balance text-[clamp(3rem,4.7vw,3.75rem)] font-bold leading-[1.08] tracking-[-0.06em] text-black max-[520px]:text-[clamp(2.4rem,11vw,3.25rem)]"
            id="page-title"
            aria-label="For designers who believe growth happens together"
          >
            <span>For designers who believe</span>{" "}
            <span>growth happens together</span>
          </h1>
        </ScrollReveal>
        <ScrollReveal
          className="col-start-9 col-span-4 max-[820px]:col-start-1 max-[820px]:col-span-1"
          delay={80}
        >
          <p className="intro-copy col-start-9 col-span-4 m-0 mb-2 text-pretty text-base text-[oklch(53%_0.025_250)] max-[820px]:mt-2">
            A space for ambitious, early-career designers to meet the people
            behind the work.
          </p>
        </ScrollReveal>
      </section>

      <section className="gallery-section" id="events" aria-label="Past events">
        <ScrollReveal className="gallery-toolbar px-[clamp(20px,6vw,96px)] py-4 max-[520px]:py-3">
          <p className="m-0 text-[0.7rem] text-[oklch(53%_0.025_250)]">
            {status === "ready" ? (
              <>
                <span className="counter-current font-normal text-[oklch(22%_0.025_250)]">
                  {String(selectedIndex + 1).padStart(2, "0")}
                </span>
                {" / "}
                {String(events.length).padStart(2, "0")}
              </>
            ) : (
              <span>{status === "loading" ? "Loading" : "Unavailable"}</span>
            )}
          </p>
          <div className="gallery-actions">
            <IconButton
              aria-label="Previous event"
              disabled={selectedIndex === 0 || events.length === 0}
              onClick={() => selectEvent(selectedIndex - 1)}
            >
              <ArrowIcon direction="left" />
            </IconButton>
            <IconButton
              aria-label="Next event"
              disabled={
                selectedIndex >= events.length - 1 || events.length === 0
              }
              onClick={() => selectEvent(selectedIndex + 1)}
            >
              <ArrowIcon direction="right" />
            </IconButton>
          </div>
        </ScrollReveal>

        {status === "loading" ? (
          <div
            className="gallery-status px-[clamp(20px,6vw,96px)] py-12 text-[0.92rem] text-[oklch(53%_0.025_250)]"
            role="status"
          >
            Loading events from Supabase…
          </div>
        ) : null}

        {status === "error" ? (
          <div
            className="gallery-status px-[clamp(20px,6vw,96px)] py-12 text-[0.92rem] text-[oklch(53%_0.025_250)]"
            role="alert"
          >
            Couldn’t load events. {errorMessage}
          </div>
        ) : null}

        {status === "ready" && events.length === 0 ? (
          <div
            className="gallery-status px-[clamp(20px,6vw,96px)] py-12 text-[0.92rem] text-[oklch(53%_0.025_250)]"
            role="status"
          >
            No past events yet. Run the seed script after creating the table.
          </div>
        ) : null}

        {status === "ready" && events.length > 0 ? (
          <ScrollReveal delay={80}>
            <ul
              className="gallery px-[max(8vw,calc((100vw-1440px)/2))] pt-[clamp(36px,5vw,72px)] pb-[clamp(40px,4vw,56px)] max-[820px]:px-[18vw]"
              ref={galleryRef}
              aria-label="Choose a past event"
            >
              {events.map((item, index) => {
                const selected = index === selectedIndex;
                const distance = index - selectedIndex;
                const slant = selected ? 0 : distance < 0 ? 42 : -42;
                const depth = selected ? 48 : -24;
                const scale = selected ? 1.06 : 0.96;
                const lift = selected
                  ? -8
                  : Math.min(Math.abs(distance) * 2, 8);
                const transform = `perspective(900px) rotateY(${slant}deg) translateZ(${depth}px) scale(${scale}) translateY(${lift}px)`;

                return (
                  <li
                    key={item.id}
                    ref={(node) => {
                      slideRefs.current[index] = node;
                    }}
                    style={{ zIndex: events.length - Math.abs(distance) }}
                  >
                    <motion.button
                      ref={(node) => {
                        cardRefs.current[index] = node;
                      }}
                      type="button"
                      className="event-card cursor-pointer rounded-md border-0 bg-white p-0 text-left text-[oklch(98%_0.008_240)] shadow-[0_3px_10px_rgba(0,0,0,0.12)] outline-none focus:shadow-[0_12px_28px_rgba(0,0,0,0.18)] focus-visible:brightness-[0.88] focus-visible:shadow-[0_12px_28px_rgba(0,0,0,0.18)] aria-pressed:shadow-[0_12px_28px_rgba(0,0,0,0.18)]"
                      aria-label={`View details for ${item.title}`}
                      aria-pressed={selected}
                      onFocus={() => selectEvent(index)}
                      onClick={() => selectEvent(index)}
                      initial={false}
                      animate={{ transform }}
                      transition={
                        reduceMotion
                          ? { duration: 0 }
                          : {
                              type: "spring",
                              stiffness: 190,
                              damping: 24,
                              mass: 0.85,
                            }
                      }
                    >
                      <img
                        className="border-0 outline-none"
                        src={item.image_url}
                        alt=""
                        draggable="false"
                        loading={Math.abs(distance) > 3 ? "lazy" : "eager"}
                      />
                    </motion.button>
                  </li>
                );
              })}
            </ul>

            <AnimatePresence mode="wait">
              <motion.div
                className="gallery-caption mx-auto pb-[clamp(40px,5vw,72px)] pt-0 text-center"
                key={selectedEvent.id}
                initial={reduceMotion ? false : { opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={reduceMotion ? undefined : { opacity: 0, y: -4 }}
                transition={{
                  duration: reduceMotion ? 0 : 0.18,
                  ease: "easeOut",
                }}
                aria-live="polite"
              >
                <p
                  className="m-0 w-full text-pretty text-base font-bold leading-6"
                  id="selected-event-title"
                >
                  {selectedEvent.title}
                </p>
                <p className="m-0 text-base leading-6 text-[oklch(70.7%_0.022_261.325)]">
                  {selectedEvent.date_label}
                </p>
              </motion.div>
            </AnimatePresence>
          </ScrollReveal>
        ) : null}
      </section>

      <section
        className="event-detail px-[clamp(20px,6vw,96px)] pt-[clamp(20px,3vw,40px)] pb-[clamp(56px,9vw,128px)]"
        aria-live="polite"
        aria-labelledby={selectedEvent ? "selected-event-title" : undefined}
      >
        <ScrollReveal>
          {selectedEvent ? (
            <AnimatePresence mode="wait">
            <motion.div
              className="detail-grid"
              key={selectedEvent.id}
              initial={reduceMotion ? false : { opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={reduceMotion ? undefined : { opacity: 0, y: -8 }}
              transition={{
                duration: reduceMotion ? 0 : 0.18,
                ease: "easeOut",
              }}
            >
              <div className="detail-title">
                <ExpandableSummary
                  summaryHtml={summaryHtml}
                  summaryParagraphs={summaryParagraphs}
                  eventId={selectedEvent.id}
                />
              </div>
              <dl className="m-0">
                <div>
                  <dt className="mb-[7px] text-base uppercase text-gray-400">
                    Where
                  </dt>
                  <dd className="m-0 text-base leading-6">
                    {selectedEvent.location}
                  </dd>
                </div>
                <div>
                  <dt className="mb-[7px] text-base uppercase text-gray-400">
                    Hosted by
                  </dt>
                  <dd className="m-0 text-base leading-6">
                    <ul className="host-list m-0 p-0">
                      {hosts.length > 0 ? (
                        hosts.map((host) => <li key={host}>{host}</li>)
                      ) : (
                        <li>Host details to come</li>
                      )}
                    </ul>
                  </dd>
                </div>
                <div className="detail-sponsor">
                  <dt className="mb-4 text-base uppercase text-gray-400">
                    Sponsors
                  </dt>
                  <dd className="m-0 mb-2 text-base leading-6">
                    {sponsors.length > 0 ? (
                      <TooltipProvider>
                        <ul className="sponsor-list m-0 gap-5 p-0">
                          {sponsors.map((sponsor) => (
                            <li key={sponsor.id}>
                              {sponsor.logo_url ? (
                                <Tooltip content={sponsor.name}>
                                  <span
                                    className="inline-flex rounded-sm focus-visible:outline-2 focus-visible:outline-offset-4"
                                    tabIndex={0}
                                  >
                                    <img
                                      className="sponsor-logo border-0 outline-none"
                                      src={sponsor.logo_url}
                                      alt={sponsor.name}
                                      loading="lazy"
                                    />
                                  </span>
                                </Tooltip>
                              ) : (
                                <span className="sponsor-placeholder bg-transparent px-0 py-2.5 text-base">
                                  {sponsor.name}
                                </span>
                              )}
                            </li>
                          ))}
                        </ul>
                      </TooltipProvider>
                    ) : (
                      <span className="sponsor-placeholder bg-transparent px-0 py-2.5 text-base">
                        Sponsor slot open
                      </span>
                    )}
                  </dd>
                  {selectedEvent.luma_url ? (
                    <Link
                      className="inline-flex items-center gap-2"
                      href={selectedEvent.luma_url}
                      target="_blank"
                      rel="noreferrer"
                    >
                      View on Luma
                      <ArrowUpRightIcon />
                    </Link>
                  ) : null}
                </div>
              </dl>
              <div className="detail-extras pt-0">
                <section
                  className="detail-photos"
                  aria-labelledby="event-photos-title"
                >
                  <div className="mb-4 flex items-center justify-between">
                    <h3
                      className="m-0 text-base font-medium tracking-[-0.06em] uppercase text-gray-400"
                      id="event-photos-title"
                    >
                      Gallery
                    </h3>
                    <div
                      className="flex gap-2"
                      role="group"
                      aria-label="Event photo controls"
                    >
                      <IconButton
                        aria-label="Previous event photo"
                        aria-controls="event-photo-rail"
                        disabled={!canScrollPhotosLeft}
                        onClick={() => scrollPhotoRail(-1)}
                      >
                        <ArrowIcon direction="left" />
                      </IconButton>
                      <IconButton
                        aria-label="Next event photo"
                        aria-controls="event-photo-rail"
                        disabled={!canScrollPhotosRight}
                        onClick={() => scrollPhotoRail(1)}
                      >
                        <ArrowIcon direction="right" />
                      </IconButton>
                    </div>
                  </div>
                  <ul
                    className="detail-photo-list relative left-1/2 m-0 w-screen -translate-x-1/2 touch-pan-x p-0 pb-2.5 focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-[oklch(22%_0.025_250)]"
                    id="event-photo-rail"
                    ref={setDetailPhotoRail}
                    tabIndex={0}
                    aria-label={`${selectedEvent.title} gallery, horizontally scrollable`}
                  >
                    {selectedPhotos.map((photoUrl, photoIndex) => (
                      <li key={`${selectedEvent.id}-${photoIndex}`}>
                        <img
                          className="detail-photo h-[clamp(180px,52vw,260px)] w-auto max-w-[min(82vw,640px)] rounded-md border-0 bg-[oklch(98%_0.008_240)] object-contain min-[821px]:h-[clamp(190px,15vw,200px)] min-[821px]:max-w-none"
                          src={photoUrl}
                          alt={`${selectedEvent.title} event photo ${photoIndex + 1} of ${selectedPhotos.length}`}
                          loading={photoIndex === 0 ? "eager" : "lazy"}
                          onLoad={() => updatePhotoRailBoundsFromRef()}
                        />
                      </li>
                    ))}
                  </ul>
                </section>
              </div>
            </motion.div>
            </AnimatePresence>
          ) : (
            <div className="detail-grid detail-empty">
              <div className="detail-title">
                <h2 className="m-0 max-w-[18ch] text-balance text-[clamp(2rem,4.2vw,4.8rem)] font-medium leading-[1.03] tracking-[-0.06em] max-[820px]:max-w-[22ch]">
                  Waiting for the archive.
                </h2>
                <p className="m-0 mt-7 max-w-[54ch] text-pretty text-base leading-[1.7]">
                  Once Supabase is seeded, each square opens the full event
                  details here.
                </p>
              </div>
            </div>
          )}
        </ScrollReveal>
      </section>

      <section
        className="upcoming-events bg-white px-[clamp(20px,6vw,96px)] py-[120px] text-black max-[820px]:py-36"
        id="calendar"
        aria-labelledby="upcoming-events-title"
      >
        <ScrollReveal className="upcoming-events-copy">
          <h2
            className="m-0 text-balance text-[clamp(3rem,4.7vw,3.75rem)] font-bold leading-[1.2] tracking-[-0.06em] max-[520px]:text-[clamp(2.4rem,11vw,3.25rem)]"
            id="upcoming-events-title"
          >
            UPCOMING EVENTS
          </h2>
          <p className="m-0 max-w-[54ch] text-pretty text-[1.05rem] leading-[1.5] text-[#202020] max-[520px]:text-base">
            RSVP on Luma and join us at the next Design Meetup.
          </p>
          <Primary
            className="gap-2"
            href="https://luma.com/designmeetup"
            target="_blank"
            rel="noreferrer"
            variant="secondary"
          >
            <img
              className="size-5"
              src="/luma-logo.svg"
              alt=""
              aria-hidden="true"
            />
            Follow our Luma
          </Primary>
        </ScrollReveal>
        <ScrollReveal
          className="upcoming-events-embed overflow-hidden rounded-[11px]"
          delay={80}
        >
          <iframe
            className="upcoming-events-frame block w-full border-0 bg-transparent"
            src={LUMA_CALENDAR_EMBED_SRC}
            title="Design Meetup upcoming events on Luma"
            loading="lazy"
            allow="fullscreen"
          />
        </ScrollReveal>
      </section>

      <section
        className="about-section bg-white px-[clamp(20px,6vw,96px)] py-[120px] text-black max-[820px]:py-36"
        id="about"
        aria-labelledby="about-title"
      >
        <ScrollReveal className="about-grid">
          <div className="about-copy">
            <h2
              className="m-0 text-balance text-[clamp(3rem,4.7vw,3.75rem)] font-bold leading-[1.2] tracking-[-0.06em] max-[520px]:text-[clamp(2.4rem,11vw,3.25rem)]"
              id="about-title"
            >
              ABOUT
            </h2>
            <div className="mt-8 grid max-w-[54ch] gap-5 text-base leading-[1.5] text-[#202020]">
              <p className="m-0 text-pretty">
                We are a community of the world’s most ambitious creatives.
              </p>
              <p className="m-0 text-pretty">
                We bring together those who aspire to take their craft seriously while forming meaningful connections.
              </p>
            </div>
          </div>

          <div className="about-image min-w-0">
            <img
              className="block aspect-[3/2] w-full rounded-[11px] border-0 object-cover outline-none"
              src="/about/design-meetup-community.jpg"
              alt="Design Meetup community gathering around tables to make and connect"
              width={1600}
              height={1067}
              loading="lazy"
            />
          </div>
          <ul
            className="about-offerings m-0 mt-[clamp(72px,8vw,120px)] list-none p-0"
            aria-label="Ways to join Design Meetup"
          >
            {aboutOfferings.map((offering) => (
              <li className="min-w-0 flex flex-col gap-3" key={offering.title}>
                <div className="flex items-center gap-2.5">
                  <img
                    className="size-[18px] shrink-0 border-0 outline-none"
                    src={offering.icon}
                    alt=""
                    width={18}
                    height={18}
                    loading="lazy"
                    aria-hidden="true"
                  />
                  <h3 className="m-0 whitespace-nowrap text-balance text-lg font-bold leading-[1.2] tracking-[-0.06em] text-black">
                    {offering.title}
                  </h3>
                </div>
                <p className="m-0 max-w-[321px] text-pretty text-base leading-[1.2] tracking-[-0.03em] text-[#727272]">
                  {offering.description}
                </p>
              </li>
            ))}
          </ul>
          <div className="team-filter-control flex justify-start">
            {isWebsiteTeamVisible ? (
              <Primary
                className="-ml-4 mt-2"
                variant="ghost"
                aria-pressed={isWebsiteTeamVisible}
                onClick={() => setIsWebsiteTeamVisible(false)}
              >
                WEBSITE TEAM!
              </Primary>
            ) : null}
          </div>
          <dl className="team-groups m-0 pb-4">
            {teamGroups.map((group) => (
              <div className="team-row" key={group.role}>
                <dt
                  className={`mb-4 text-base uppercase text-gray-400 ${
                    isWebsiteTeamVisible &&
                    !group.members.some((member) =>
                      websiteTeam.has(member.name),
                    )
                      ? "opacity-50"
                      : ""
                  }`}
                >
                  {group.role}
                </dt>
                <dd className="m-0">
                  <ul className="m-0 flex list-none flex-nowrap gap-[clamp(8px,1.25vw,14px)] p-0">
                    {group.members.map((member) => (
                      <li
                        className={
                          isWebsiteTeamVisible &&
                          !websiteTeam.has(member.name)
                            ? "opacity-50"
                            : ""
                        }
                        key={member.name}
                      >
                        <TeamCard member={member} />
                      </li>
                    ))}
                  </ul>
                </dd>
              </div>
            ))}
          </dl>
        </ScrollReveal>
      </section>

      <section
        className="partner-cta bg-white px-[clamp(20px,6vw,96px)] py-[120px] text-black max-[820px]:py-36"
        id="sponsor"
        aria-labelledby="partner-cta-title"
      >
        <ScrollReveal className="partner-copy">
          <h2
            className="m-0 max-w-[676px] text-balance text-[clamp(3rem,4.7vw,3.75rem)] font-bold leading-[1.2] tracking-[-0.06em] max-[520px]:text-[clamp(2.4rem,11vw,3.25rem)] [&_span]:block"
            id="partner-cta-title"
          >
            <span>WE’VE WORKED WITH</span>
            <span>SOME OF YOUR</span>
            <span>FAVORITE COMPANIES</span>
          </h2>
          <p className="m-0 text-pretty text-base leading-[1.2] text-[#202020]">
            We’d love to chat if you’re interested in partnering with us.
          </p>
          <Primary href="#contact">Reach out</Primary>
        </ScrollReveal>
        <ScrollReveal className="partner-logos" delay={80}>
          <ul
            className="partner-grid m-0 p-0"
            aria-label="Selected partner companies"
          >
            {partnerLogos.map((partner) => (
              <li
                className="partner-tile rounded-[10px] bg-[#f5f5f5]"
                key={partner.slug}
              >
                <img
                  className={`partner-logo partner-logo--${partner.slug} border-0 outline-none`}
                  src={partner.src}
                  alt=""
                  loading="lazy"
                />
              </li>
            ))}
          </ul>
        </ScrollReveal>
      </section>

      <footer
        className="bg-white px-[clamp(20px,6vw,96px)] pt-[clamp(64px,8vw,112px)] pb-[clamp(32px,4vw,56px)] text-base text-[oklch(22%_0.025_250)]"
        id="contact"
      >
        <ScrollReveal className="footer-brand">
          <img
            className="footer-logo border-0 outline-none"
            src="/design-meetup-logo.png"
            alt="Design Meetup"
            width={128}
            height={128}
            loading="lazy"
          />
        </ScrollReveal>
        <ScrollReveal className="footer-contact" delay={60}>
          <h2 className="m-0 mb-4 text-base font-semibold tracking-[-0.06em]">Contact</h2>
          <nav
            aria-label="Contact links"
            className="flex flex-col items-start gap-4"
          >
            <a
              className={`${footerLinkClassName} group inline-flex items-center gap-1`}
              href="mailto:contactdesignmeetup@gmail.com"
            >
              contactdesignmeetup@gmail.com
              <ArrowUpRightIcon className="size-4 opacity-0 transition-opacity duration-150 group-hover:opacity-100 group-focus-visible:opacity-100 motion-reduce:transition-none" />
            </a>
            <div className="footer-contact-row flex items-center gap-4">
              <a
                aria-label="Substack"
                className={`${footerLinkClassName} inline-flex rounded-sm focus-visible:outline-2 focus-visible:outline-offset-4`}
                href="https://designmeetup.substack.com/"
                target="_blank"
                rel="noreferrer"
              >
                <SubstackIcon />
              </a>
              <a
                aria-label="Instagram"
                className={`${footerLinkClassName} inline-flex rounded-sm focus-visible:outline-2 focus-visible:outline-offset-4`}
                href="https://www.instagram.com/designmeetup/"
                target="_blank"
                rel="noreferrer"
              >
                <InstagramIcon />
              </a>
              <a
                aria-label="LinkedIn"
                className={`${footerLinkClassName} inline-flex rounded-sm focus-visible:outline-2 focus-visible:outline-offset-4`}
                href="https://www.linkedin.com/company/design-meetup/"
                target="_blank"
                rel="noreferrer"
              >
                <LinkedInIcon />
              </a>
              <a
                aria-label="X"
                className={`${footerLinkClassName} inline-flex rounded-sm focus-visible:outline-2 focus-visible:outline-offset-4`}
                href="https://x.com/designmeetuphq"
                target="_blank"
                rel="noreferrer"
              >
                <XIcon />
              </a>
            </div>
          </nav>
        </ScrollReveal>
        <ScrollReveal className="footer-newsletter" delay={120}>
          <h2 className="m-0 mb-4 text-base font-semibold tracking-[-0.06em]">
            Join the newsletter
          </h2>
          <form
            className="newsletter-form grid grid-cols-[minmax(0,1fr)_auto] gap-2"
            onSubmit={(event) => event.preventDefault()}
          >
            <label htmlFor="newsletter-email" className="sr-only">
              Email address
            </label>
            <Input
              id="newsletter-email"
              name="email"
              type="email"
              autoComplete="email"
              placeholder="Enter your email here"
            />
            <Primary type="submit">
              Subscribe
            </Primary>
          </form>
        </ScrollReveal>
        <ScrollReveal className="col-span-full" delay={160}>
          <p className="col-span-full m-0 text-center text-sm text-gray-400">
            Website built in{" "}
          <a
            className={footerCreditLinkClassName}
            href="https://nextjs.org/"
            target="_blank"
            rel="noreferrer"
          >
            Next.js
          </a>
          ,{" "}
          <a
            className={footerCreditLinkClassName}
            href="https://cursor.com/"
            target="_blank"
            rel="noreferrer"
          >
            Cursor
          </a>
          , and{" "}
          <a
            className={footerCreditLinkClassName}
            href="https://supabase.com/"
            target="_blank"
            rel="noreferrer"
          >
            Supabase
          </a>{" "}
            by the{" "}
            <a
              className={footerCreditLinkClassName}
              href="#about"
              onClick={showWebsiteTeam}
            >
              Design Meetup Team
            </a>
            .
          </p>
        </ScrollReveal>
      </footer>
    </main>
  );
}
