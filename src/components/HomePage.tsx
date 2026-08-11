"use client";

import type MuxPlayerElement from "@mux/mux-player";
import MuxPlayer from "@mux/mux-player-react";
import {
  AnimatePresence,
  motion,
  useReducedMotion,
  useScroll,
  useSpring,
  useTransform,
} from "motion/react";
import {
  useCallback,
  useEffect,
  useId,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { ArrowUpRightIcon } from "./icons/ArrowUpRightIcon";
import { Chip } from "./Chip";
import { EventListRow } from "./EventListRow";
import { FilmTickerLines, type FilmTickerFocus } from "./FilmTickerLines";
import { FoundersNote } from "./FoundersNote";
import { GalleryViewToggle, type GalleryView } from "./GalleryViewToggle";
import { InstagramIcon, LinkedInIcon, SubstackIcon, XIcon } from "./icons/SocialIcons";
import { SoundOffIcon, SoundOnIcon } from "./icons/SoundIcons";
import { IconButton } from "./IconButton";
import { Link } from "./Link";
import { NewsletterForm } from "./NewsletterForm";
import { PageLoader } from "./PageLoader";
import { PartnerContactForm } from "./PartnerContactForm";
import { Primary } from "./Primary";
import { RecentEventsPanel } from "./RecentEventsPanel";
import { ScrollReveal } from "./ScrollReveal";
import { SiteHeader } from "./SiteHeader";
import { preloadImages, sizedImageUrl } from "@/lib/image";
import type { LumaEvent } from "@/lib/luma";
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

const LUMA_CALENDAR_EMBED_SRC =
  "https://luma.com/embed/calendar/cal-HH5XBdHyWPt0yhB/events?lt=light";

// Every unfocused cover turns the same way, so the rail reads as one shelf of
// records instead of a mirrored fan. The turn is a flat squeeze rather than a
// rotateY: a rotation runs the covers through perspective, which bows their
// edges and paints their box off-centre, and an off-centre box cannot leave an
// even gap on both sides of the focused cover.
const CARD_SQUEEZE = 0.68;
// A shear, not a rotation, so the covers keep vertical left and right edges
// while their top and bottom edges run on the diagonal. The squeeze steepens it
// on screen — the edges land at atan(tan(shear) / squeeze), about 19deg.
const CARD_SHEAR_DEG = 13;
// Percentages of the cover's own width, so the shelf holds its proportions at
// every cover size. The part clears the focused cover: the shelf is pitched at
// 0.409 of a cover and the focused one paints 1.0668x its layout box, so its
// neighbours step out this far to leave an even gap either side.
const CARD_PART_PCT = 54;
// The hover pull only has to read as a nudge: the cover stays under its left
// neighbour, so a long travel reads as a card escaping the shelf rather than
// being eased out of it.
const CARD_PULL_PCT = 5;
const SELECTED_TITLE_ID = "selected-event-title";

function cardTransform({
  distance,
  selected,
  hovered,
  entering = false,
}: {
  distance: number;
  selected: boolean;
  hovered: boolean;
  // First load only: the cover holds its finished pose and sits a short step
  // right of its slot, so nothing about it turns or unfolds on the way in.
  entering?: boolean;
}) {
  const squeeze = selected ? 1 : CARD_SQUEEZE;
  const shear = selected ? 0 : CARD_SHEAR_DEG;
  const depth = selected ? 26 : hovered ? 2 : -14;
  const rest = selected ? 1.03 : hovered ? 0.87 : 0.85;
  const scale = entering ? rest * CARD_ENTRANCE_SCALE : rest;
  const lift = selected
    ? -6
    : hovered
      ? -8
      : Math.min(Math.abs(distance) * 1.5, 6);
  // Ahead of the squeeze so it reads as flat screen distance, which is what keeps
  // the gap on either side of the focused cover even. Hovering slides the cover
  // further off the shelf, like pulling a vinyl out.
  const away = distance < 0 ? -1 : 1;
  const shelf = selected
    ? 0
    : away * (CARD_PART_PCT + (hovered ? CARD_PULL_PCT : 0));
  const part = entering ? shelf + CARD_ENTRANCE_SHIFT_PCT : shelf;

  return `perspective(2200px) translateX(${part}%) translateZ(${depth}px) scaleX(${squeeze}) skewY(${shear}deg) scale(${scale}) translate(0px, ${lift}px)`;
}

// First load fades the covers up in place, sweeping right to left. The step to
// the right and the touch of scale are small on purpose: the shelf should look
// like it settles into focus, not like the covers were thrown onto it.
const CARD_ENTRANCE_SHIFT_PCT = 9;
const CARD_ENTRANCE_SCALE = 0.97;
// Ordering only. Covers right of this lead in together, then the sweep steps
// leftward one slot at a time.
const CARD_ENTRANCE_LEAD_SLOTS = 5;
const CARD_ENTRANCE_STAGGER_S = 0.045;
// Caps the sweep so covers deep off the left edge, which nobody sees arrive,
// can't stretch the entrance past the loader's hand-off.
const CARD_ENTRANCE_MAX_DELAY_S = 0.4;
const CARD_ENTRANCE_DURATION_S = 0.62;
// A long tail out of an easing curve keeps this a settle. A spring here reads as
// the cover overshooting its slot and snapping back.
const CARD_ENTRANCE_EASE = [0.22, 1, 0.36, 1] as const;

function cardEntranceDelay(distance: number) {
  return Math.min(
    Math.max(CARD_ENTRANCE_LEAD_SLOTS - distance, 0) * CARD_ENTRANCE_STAGGER_S,
    CARD_ENTRANCE_MAX_DELAY_S,
  );
}

const footerLinkClassName =
  "rounded-sm text-muted no-underline hover:text-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink";
const footerCreditLinkClassName = `${footerLinkClassName} text-medium`;

const detailSummaryClassName = [
  "detail-summary max-w-[62ch] text-base leading-[1.7] text-body",
  "[&_p]:whitespace-pre-line [&_p]:text-pretty [&_li]:whitespace-pre-line [&_li]:text-pretty [&_blockquote]:whitespace-pre-line [&_blockquote]:text-pretty",
  "[&_h2]:text-xl [&_h2]:font-bold [&_h2]:leading-[1.35] [&_h2]:tracking-[-0.06em] [&_h2]:text-black",
  "[&_h3]:text-xl [&_h3]:font-bold [&_h3]:leading-[1.35] [&_h3]:tracking-[-0.06em] [&_h3]:text-black",
  "[&_h4]:text-base [&_h4]:font-bold [&_h4]:leading-[1.35] [&_h4]:tracking-[-0.06em] [&_h4]:text-black",
  "[&_strong]:font-bold [&_strong]:text-black [&_a]:text-black [&_a]:underline [&_a]:underline-offset-[3px]",
  "[&_ul]:pl-[1.2rem] [&_ol]:pl-[1.2rem] [&_blockquote]:border-l-2 [&_blockquote]:border-gray-300 [&_blockquote]:pl-[0.9rem] [&_hr]:bg-gray-300",
].join(" ");

// Breathing room above the summary when "See less" scrolls it back into view.
const SUMMARY_COLLAPSE_SCROLL_MARGIN = 24;

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
  const containerRef = useRef<HTMLDivElement | null>(null);
  const contentId = `event-summary-${eventId}-${useId().replace(/:/g, "")}`;
  const reduceMotion = useReducedMotion();

  const toggleExpanded = useCallback(() => {
    const container = containerRef.current;
    // Collapsing removes everything the reader scrolled through, so walk them
    // back up to where the summary starts instead of dropping them mid-page.
    if (isExpanded && container) {
      const top = container.getBoundingClientRect().top;
      if (top < SUMMARY_COLLAPSE_SCROLL_MARGIN) {
        window.scrollTo({
          top: window.scrollY + top - SUMMARY_COLLAPSE_SCROLL_MARGIN,
          behavior: reduceMotion ? "auto" : "smooth",
        });
      }
    }
    setIsExpanded(!isExpanded);
  }, [isExpanded, reduceMotion]);

  useLayoutEffect(() => {
    const content = contentRef.current;
    if (!content) return;

    const updateOverflow = () => {
      const contentHeight = content.getBoundingClientRect().height;
      // Keep in step with the max-h-[220px] clamp below.
      setHasOverflow(contentHeight > 220);
    };

    updateOverflow();
    const observer = new ResizeObserver(updateOverflow);
    observer.observe(content);

    return () => observer.disconnect();
  }, [summaryHtml, summaryParagraphs]);

  return (
    <>
      <div className="relative" ref={containerRef}>
        <div
          className={isExpanded ? "overflow-visible" : "max-h-[220px] overflow-hidden"}
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
            className="pointer-events-none absolute inset-x-0 bottom-0 h-24 bg-gradient-to-b from-white/0 via-white/80 to-white"
            aria-hidden="true"
          />
        ) : null}
      </div>
      {hasOverflow ? (
        <Link
          className="mt-2"
          aria-expanded={isExpanded}
          aria-controls={contentId}
          onClick={toggleExpanded}
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
  // Only populated when the Luma calendar has no upcoming events.
  recentEvents: LumaEvent[];
};

export default function HomePage({
  initialEvents,
  initialError,
  recentEvents,
}: HomePageProps) {
  const events = initialEvents;
  const showRecentEvents = recentEvents.length > 0;
  const initialIndex = initialEvents.length > 4 ? 4 : 0;
  const [selectedIndex, setSelectedIndex] = useState(initialIndex);
  const [view, setView] = useState<GalleryView>("carousel");
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const [isGalleryReady, setIsGalleryReady] = useState(false);
  const [hasGalleryEntered, setHasGalleryEntered] = useState(false);
  const status: "ready" | "error" = initialError ? "error" : "ready";
  const errorMessage = initialError;
  const cardRefs = useRef<Array<HTMLButtonElement | null>>([]);
  const rowRefs = useRef<Array<HTMLButtonElement | null>>([]);
  const galleryRef = useRef<HTMLUListElement | null>(null);
  const detailPhotoRailRef = useRef<HTMLUListElement | null>(null);
  const slideRefs = useRef<Array<HTMLLIElement | null>>([]);
  const hasCenteredInitial = useRef(false);
  const isProgrammaticScroll = useRef(false);
  const scrollSettleTimer = useRef<number | null>(null);
  const selectionSource = useRef<"control" | "scroll">("control");
  const galleryFocus = useRef<FilmTickerFocus>({
    index: initialIndex,
    velocity: 0,
  });
  const lastScrollSample = useRef({ left: 0, at: 0 });
  const velocityResetTimer = useRef<number | null>(null);
  const [photoRailElement, setPhotoRailElement] =
    useState<HTMLUListElement | null>(null);
  const [listScrollElement, setListScrollElement] =
    useState<HTMLDivElement | null>(null);
  const [listEdges, setListEdges] = useState({ top: false, bottom: false });
  const [canScrollPhotosLeft, setCanScrollPhotosLeft] = useState(false);
  const [canScrollPhotosRight, setCanScrollPhotosRight] = useState(false);
  const [loadedPhotos, setLoadedPhotos] = useState<Record<string, true>>({});
  const reduceMotion = useReducedMotion();
  const aboutVideoRef = useRef<HTMLDivElement | null>(null);
  const { scrollYProgress: aboutVideoProgress } = useScroll({
    target: aboutVideoRef,
    offset: ["start end", "start 15%"],
  });
  const aboutVideoScaleTarget = useTransform(
    aboutVideoProgress,
    [0, 1],
    [0.55, 1],
  );
  const aboutVideoScale = useSpring(aboutVideoScaleTarget, {
    stiffness: 260,
    damping: 42,
    mass: 0.6,
  });
  const aboutPlayerRef = useRef<MuxPlayerElement | null>(null);
  const [aboutVideoMuted, setAboutVideoMuted] = useState(true);
  const toggleAboutVideoSound = useCallback(
    () => setAboutVideoMuted((previous) => !previous),
    [],
  );

  useEffect(() => {
    const container = aboutVideoRef.current;
    if (!container || reduceMotion) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        const player = aboutPlayerRef.current;
        if (!player) return;
        if (entry.isIntersecting) {
          // Autoplay can still be refused (e.g. unmuted with no prior
          // interaction); leaving the poster up is the acceptable fallback.
          void player.play?.().catch(() => {});
        } else {
          player.pause?.();
        }
      },
      { threshold: 0.4 },
    );

    observer.observe(container);
    return () => observer.disconnect();
  }, [reduceMotion]);
  const selectedEvent = events[selectedIndex];
  const sponsors =
    selectedEvent?.event_sponsors.map((eventSponsor) => eventSponsor.sponsor) ??
    [];
  const summaryParagraphs =
    selectedEvent?.summary?.split(/\n{2,}/).filter(Boolean) ?? [];
  const summaryHtml = selectedEvent?.summary_html?.trim() ?? "";
  // Shared seed placeholders live under /placeholders/ in storage. Hide that
  // default set until an event has its own photos.
  // Photos render a few hundred pixels tall, so ask the CDN for a right-sized
  // render (~10x smaller than the stored original) instead of the full JPEG.
  const selectedPhotos = useMemo(
    () =>
      (selectedEvent?.gallery_images ?? [])
        .map((image) => image.image_url)
        .filter((url) => !url.includes("/placeholders/"))
        .map((url) => sizedImageUrl(url, { width: 420, quality: 68 })),
    [selectedEvent?.gallery_images],
  );
  const showEventGallery = selectedPhotos.length > 0;
  const tickerItems = useMemo(
    () =>
      events.map((item) => ({
        id: item.id,
        label: `${item.title}, ${item.date_label}`,
      })),
    [events],
  );
  const readGalleryFocus = useCallback(() => galleryFocus.current, []);
  const revealGallery = useCallback(() => setIsGalleryReady(true), []);

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

  // Keyed by URL so photos stay revealed when you move between events instead
  // of shimmering again.
  const markPhotoLoaded = useCallback((photoUrl: string) => {
    setLoadedPhotos((previous) =>
      previous[photoUrl] ? previous : { ...previous, [photoUrl]: true },
    );
  }, []);

  // Warm the current event's photos right away and prefetch the neighbouring
  // events' first few, so moving through the carousel opens galleries without
  // waiting on a fresh download each time.
  useEffect(() => {
    const neighbourPhotos = [selectedIndex - 1, selectedIndex + 1]
      .filter((index) => index >= 0 && index < events.length)
      .flatMap((index) =>
        (events[index]?.gallery_images ?? [])
          .map((image) => image.image_url)
          .filter((url) => !url.includes("/placeholders/"))
          .slice(0, 4)
          .map((url) => sizedImageUrl(url, { width: 420, quality: 68 })),
      );
    return preloadImages([...selectedPhotos, ...neighbourPhotos]);
  }, [selectedPhotos, selectedIndex, events]);

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

  const changeView = useCallback((nextView: GalleryView) => {
    // Re-entering the carousel should land on the selected cover without
    // animating the scrollport across the whole rail.
    hasCenteredInitial.current = false;
    selectionSource.current = "control";
    setHoveredIndex(null);
    setView(nextView);
  }, []);

  const hoverCard = useCallback((index: number | null, pointerType: string) => {
    if (pointerType !== "mouse") return;
    setHoveredIndex(index);
  }, []);

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

  const slideCenterOffset = useCallback(
    (index: number, scrollportCenter: number) => {
      const slide = slideRefs.current[index];
      if (!slide) return null;
      const rect = slide.getBoundingClientRect();
      return rect.left + rect.width / 2 - scrollportCenter;
    },
    [],
  );

  // Center on the slide's layout box, not the transformed cover: an unfocused
  // cover is painted offset by CARD_PART_PCT, and scrollIntoView would chase
  // that painted box and overshoot into the next snap point.
  const centerSlide = useCallback(
    (index: number, behavior: ScrollBehavior) => {
      const gallery = galleryRef.current;
      if (!gallery) return;
      const rect = gallery.getBoundingClientRect();
      const offset = slideCenterOffset(index, rect.left + rect.width / 2);
      if (offset === null || Math.abs(offset) < 1) return;
      gallery.scrollTo({ left: gallery.scrollLeft + offset, behavior });
    },
    [slideCenterOffset],
  );

  // Returns both the snapped index and the fractional position of the
  // scrollport centre, which the ticker reads to track mid-scroll.
  const measureGalleryFocus = useCallback(() => {
    const gallery = galleryRef.current;
    if (!gallery) return null;

    const rect = gallery.getBoundingClientRect();
    const scrollportCenter = rect.left + rect.width / 2;

    let nearestIndex = -1;
    let nearestOffset = Number.POSITIVE_INFINITY;

    for (let index = 0; index < slideRefs.current.length; index += 1) {
      const offset = slideCenterOffset(index, scrollportCenter);
      if (offset === null) continue;
      if (Math.abs(offset) < Math.abs(nearestOffset)) {
        nearestOffset = offset;
        nearestIndex = index;
      }
    }

    if (nearestIndex < 0) return null;

    const neighborIndex = nearestIndex > 0 ? nearestIndex - 1 : 1;
    const neighborOffset = slideCenterOffset(neighborIndex, scrollportCenter);
    const pitch =
      neighborOffset === null
        ? 0
        : Math.abs(neighborOffset - nearestOffset) /
          Math.abs(neighborIndex - nearestIndex);

    return {
      index: nearestIndex,
      focal: pitch > 0 ? nearestIndex - nearestOffset / pitch : nearestIndex,
    };
  }, [slideCenterOffset]);

  useEffect(() => {
    if (status !== "ready" || events.length === 0) return;
    if (view !== "carousel") return;
    if (selectionSource.current === "scroll") return;

    const frame = requestAnimationFrame(() => {
      markProgrammaticScroll();
      centerSlide(
        selectedIndex,
        hasCenteredInitial.current && !reduceMotion ? "smooth" : "auto",
      );
      hasCenteredInitial.current = true;
    });

    return () => cancelAnimationFrame(frame);
  }, [
    centerSlide,
    events.length,
    markProgrammaticScroll,
    reduceMotion,
    selectedIndex,
    status,
    view,
  ]);

  // Only fade the edges the list can actually scroll towards, so the first and
  // last rows are never dimmed for no reason.
  useEffect(() => {
    if (!listScrollElement) return;

    const updateEdges = () => {
      const { scrollTop, scrollHeight, clientHeight } = listScrollElement;
      const overflowing = scrollHeight > clientHeight + 1;
      setListEdges({
        top: overflowing && scrollTop > 1,
        bottom: overflowing && scrollTop < scrollHeight - clientHeight - 1,
      });
    };

    const frame = requestAnimationFrame(updateEdges);
    const observer = new ResizeObserver(updateEdges);

    listScrollElement.addEventListener("scroll", updateEdges, {
      passive: true,
    });
    observer.observe(listScrollElement);

    return () => {
      cancelAnimationFrame(frame);
      listScrollElement.removeEventListener("scroll", updateEdges);
      observer.disconnect();
    };
  }, [listScrollElement]);

  // Arrow keys move the selection in either view, so keep the highlighted row
  // inside the list's own scroll area. scrollIntoView would also scroll every
  // ancestor scrollport, which drags the page down the moment list view mounts.
  useEffect(() => {
    if (view !== "list") return;

    const row = rowRefs.current[selectedIndex];
    if (!listScrollElement || !row) return;

    const viewport = listScrollElement.getBoundingClientRect();
    const rowBox = row.getBoundingClientRect();
    const offset =
      rowBox.top < viewport.top
        ? rowBox.top - viewport.top
        : rowBox.bottom > viewport.bottom
          ? rowBox.bottom - viewport.bottom
          : 0;
    if (offset === 0) return;

    listScrollElement.scrollBy({
      top: offset,
      behavior: reduceMotion ? "auto" : "smooth",
    });
  }, [listScrollElement, reduceMotion, selectedIndex, view]);

  // The covers hold just short of their slots until the loader lifts, then fade
  // up right to left. Once that has played, selection hands over to the spring
  // that carries every later move.
  useEffect(() => {
    if (!isGalleryReady || hasGalleryEntered) return;
    const timer = window.setTimeout(() => setHasGalleryEntered(true), 1100);
    return () => window.clearTimeout(timer);
  }, [hasGalleryEntered, isGalleryReady]);

  useEffect(() => {
    const failsafe = window.setTimeout(() => setIsGalleryReady(true), 2400);
    return () => window.clearTimeout(failsafe);
  }, []);

  useEffect(
    () => () => {
      if (scrollSettleTimer.current !== null) {
        window.clearTimeout(scrollSettleTimer.current);
      }
      if (velocityResetTimer.current !== null) {
        window.clearTimeout(velocityResetTimer.current);
      }
    },
    [],
  );

  useEffect(() => {
    const gallery = galleryRef.current;
    if (!gallery || status !== "ready" || events.length === 0) return;
    if (view !== "carousel") return;

    let frame = 0;

    const sampleVelocity = () => {
      const now = performance.now();
      const previous = lastScrollSample.current;
      const elapsed = now - previous.at;
      galleryFocus.current.velocity =
        elapsed > 0 ? ((gallery.scrollLeft - previous.left) / elapsed) * 1000 : 0;
      lastScrollSample.current = { left: gallery.scrollLeft, at: now };

      if (velocityResetTimer.current !== null) {
        window.clearTimeout(velocityResetTimer.current);
      }
      velocityResetTimer.current = window.setTimeout(() => {
        galleryFocus.current.velocity = 0;
      }, 140);
    };

    const handleScroll = () => {
      if (frame !== 0) return;

      frame = requestAnimationFrame(() => {
        frame = 0;
        sampleVelocity();

        const focus = measureGalleryFocus();
        if (focus === null) return;
        galleryFocus.current.index = focus.focal;

        if (isProgrammaticScroll.current) {
          markProgrammaticScroll();
          return;
        }
        selectionSource.current = "scroll";
        setSelectedIndex(focus.index);
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
    measureGalleryFocus,
    status,
    view,
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
    <main className="min-h-dvh w-full overflow-hidden rounded-none border-0 bg-white font-['Alte_Haas_Grotesk',sans-serif] text-body shadow-none antialiased [font-synthesis:none] [text-rendering:optimizeLegibility]">
      <PageLoader onDone={revealGallery} />

      <SiteHeader reveal />

      <section
        className="intro px-[clamp(20px,6vw,96px)] pt-[clamp(18px,2.5vw,40px)] pb-[clamp(14px,2vw,32px)] max-[820px]:pt-5 max-[820px]:pb-3.5 max-[520px]:pt-4 max-[520px]:pb-3"
        aria-labelledby="page-title"
      >
        <ScrollReveal className="intro-title col-span-8 max-[820px]:col-span-1">
          <h1
            className="m-0 text-balance text-[clamp(3.5rem,6vw,5rem)] font-bold leading-[1.05] tracking-[-0.06em] text-black max-[520px]:text-[clamp(2.75rem,12vw,3.75rem)]"
            id="page-title"
            aria-label="A space for the world’s most ambitious creatives"
          >
            <span>A space for the world’s</span>{" "}
            <span>most ambitious creatives</span>
          </h1>
        </ScrollReveal>
      </section>

      {/* Carousel view leaves these stacked; list view pairs them into a
          master/detail split, so they need a common layout parent. */}
      <div className="events-layout" data-view={view}>
      {/* Lives outside the gallery column so the toggle keeps the same
          top-right placement once list view splits the layout in two. */}
      <ScrollReveal className="gallery-toolbar px-[clamp(20px,6vw,96px)]">
        {status === "ready" && events.length > 0 ? (
          <GalleryViewToggle view={view} onChange={changeView} />
        ) : (
          <p className="m-0 text-base text-muted">
            {status === "error" ? "Unavailable" : null}
          </p>
        )}
      </ScrollReveal>

      <section className="gallery-section" id="events" aria-label="Past events">
        {status === "error" ? (
          <div
            className="gallery-status px-[clamp(20px,6vw,96px)] py-12 text-base text-muted"
            role="alert"
          >
            Couldn’t load events. {errorMessage}
          </div>
        ) : null}

        {status === "ready" && events.length === 0 ? (
          <div
            className="gallery-status px-[clamp(20px,6vw,96px)] py-12 text-base text-muted"
            role="status"
          >
            No past events yet. Run the seed script after creating the table.
          </div>
        ) : null}

        {status === "ready" && events.length > 0 ? (
          <ScrollReveal delay={80}>
            {view === "carousel" ? (
              <>
                <div className="gallery-viewport">
                  <ul
                    className="gallery px-[max(8vw,calc((100vw-1440px)/2))] pt-[clamp(36px,5vw,72px)] pb-[clamp(40px,4vw,56px)] max-[820px]:px-[18vw]"
                    ref={galleryRef}
                    aria-label="Choose a past event"
                  >
                    {events.map((item, index) => {
                      const selected = index === selectedIndex;
                      const distance = index - selectedIndex;
                      const hovered = hoveredIndex === index && !selected;
                      const transform = cardTransform({
                        distance,
                        selected,
                        hovered,
                      });
                      const entranceDelay = hasGalleryEntered
                        ? 0
                        : cardEntranceDelay(distance);
                      const entranceTransform = cardTransform({
                        distance,
                        selected,
                        hovered: false,
                        entering: true,
                      });

                      return (
                        <li
                          key={item.id}
                          ref={(node) => {
                            slideRefs.current[index] = node;
                          }}
                          style={{
                            // One order across the whole rail: every cover sits
                            // on the one to its right, so both wings lean the
                            // same way as the shear instead of mirroring at the
                            // centre. The focused cover keeps the top of the
                            // stack so its shadow stays clear. A hovered cover
                            // holds its place in that order, so it slides out
                            // from under its left-hand neighbour the way a
                            // record leaves a crate.
                            zIndex: selected
                              ? events.length + 1
                              : events.length - index,
                          }}
                        >
                          <motion.button
                            ref={(node) => {
                              cardRefs.current[index] = node;
                            }}
                            type="button"
                            className="event-card cursor-pointer rounded-md border-0 bg-white p-0 text-left text-[oklch(98%_0.008_240)] shadow-[0_3px_10px_rgba(0,0,0,0.12)] outline-none focus:shadow-[0_12px_28px_rgba(0,0,0,0.18)] focus-visible:brightness-[0.88] focus-visible:shadow-[0_12px_28px_rgba(0,0,0,0.18)] hover:shadow-[0_14px_30px_rgba(0,0,0,0.14)] aria-pressed:shadow-[0_12px_28px_rgba(0,0,0,0.18)]"
                            aria-label={`View details for ${item.title}`}
                            aria-pressed={selected}
                            onFocus={() => selectEvent(index)}
                            onClick={() => selectEvent(index)}
                            onPointerEnter={(event) =>
                              hoverCard(index, event.pointerType)
                            }
                            onPointerLeave={(event) =>
                              hoverCard(null, event.pointerType)
                            }
                            initial={false}
                            animate={{
                              transform: isGalleryReady
                                ? transform
                                : entranceTransform,
                              opacity: isGalleryReady ? 1 : 0,
                            }}
                            transition={
                              reduceMotion
                                ? { duration: 0 }
                                : hasGalleryEntered
                                  ? {
                                      type: "spring",
                                      stiffness: 190,
                                      damping: 24,
                                      mass: 0.85,
                                    }
                                  : {
                                      duration: CARD_ENTRANCE_DURATION_S,
                                      ease: CARD_ENTRANCE_EASE,
                                      delay: entranceDelay,
                                    }
                            }
                          >
                            <img
                              className="border-0 outline-none"
                              src={sizedImageUrl(item.image_url, {
                                width: 420,
                                quality: 74,
                              })}
                              alt=""
                              draggable="false"
                              decoding="async"
                              loading={Math.abs(distance) > 3 ? "lazy" : "eager"}
                            />
                          </motion.button>
                        </li>
                      );
                    })}
                  </ul>
                </div>

                <div className="gallery-ticker px-[clamp(20px,6vw,96px)] pb-[clamp(32px,4vw,56px)]">
                  <FilmTickerLines
                    items={tickerItems}
                    currentIndex={selectedIndex}
                    readFocus={readGalleryFocus}
                    onSelect={selectEvent}
                    label="Past event timeline"
                  />
                </div>
              </>
            ) : (
              <div className="gallery-list px-[clamp(20px,6vw,96px)] pt-[clamp(32px,4vw,64px)] pb-[clamp(40px,5vw,72px)]">
                <div
                  className="event-list-viewport"
                  data-fade-top={listEdges.top ? "" : undefined}
                  data-fade-bottom={listEdges.bottom ? "" : undefined}
                >
                  <div className="event-list-scroll" ref={setListScrollElement}>
                    <ul
                      className="event-list m-0 p-0 pb-10"
                      aria-label="Choose a past event"
                    >
                      {events.map((item, index) => (
                        <li key={item.id}>
                          <EventListRow
                            ref={(node) => {
                              rowRefs.current[index] = node;
                            }}
                            title={item.title}
                            dateLabel={item.date_label}
                            location={item.location}
                            imageUrl={sizedImageUrl(item.image_url, {
                              width: 96,
                              quality: 72,
                            })}
                            selected={index === selectedIndex}
                            onSelect={() => selectEvent(index)}
                          />
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            )}
          </ScrollReveal>
        ) : null}
      </section>

      <section
        className="event-detail px-[clamp(20px,6vw,96px)] pt-[clamp(32px,4vw,64px)] pb-[clamp(56px,9vw,128px)]"
        aria-live="polite"
        aria-labelledby={selectedEvent ? SELECTED_TITLE_ID : undefined}
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
              {view === "list" ? (
                <div className="detail-cover aspect-square overflow-hidden rounded-md bg-surface-muted shadow-[0_12px_28px_rgba(0,0,0,0.18)]">
                  <img
                    className="block size-full select-none border-0 object-cover outline-none"
                    src={sizedImageUrl(selectedEvent.image_url, {
                      width: 520,
                      quality: 76,
                    })}
                    alt=""
                    draggable="false"
                    decoding="async"
                  />
                </div>
              ) : null}
              <div className="detail-title">
                <h2
                  className="m-0 text-balance text-[clamp(1.75rem,2.6vw,2.5rem)] font-bold leading-[1.15] tracking-[-0.06em] text-black"
                  id={SELECTED_TITLE_ID}
                >
                  {selectedEvent.title}
                </h2>
                <div className="detail-facts pt-[clamp(12px,1.4vw,18px)]">
                  {/* Same colour split as the list rows: place sits one step
                      darker than the date, location first. */}
                  <p className="m-0 flex flex-wrap items-baseline gap-x-4 text-base leading-6">
                    {selectedEvent.location ? (
                      <span className="text-muted">
                        <span className="sr-only">Location: </span>
                        {selectedEvent.location}
                      </span>
                    ) : null}
                    <span className="text-subtle">
                      <span className="sr-only">Date: </span>
                      {selectedEvent.date_label}
                    </span>
                  </p>
                  <ul
                    className="detail-chips m-0 gap-2.5 p-0"
                    aria-label="Sponsors"
                  >
                    {sponsors.length > 0 ? (
                      sponsors.map((sponsor) => {
                        const chipContent = (
                          <>
                            <span className="sr-only">Sponsor: </span>
                            {sponsor.logo_url ? (
                              <img
                                className="sponsor-logo border-0 outline-none"
                                src={sponsor.logo_url}
                                alt=""
                                loading="lazy"
                              />
                            ) : null}
                            {sponsor.name}
                          </>
                        );

                        return (
                          <li key={sponsor.id}>
                            {sponsor.website_url ? (
                              <Chip
                                href={sponsor.website_url}
                                target="_blank"
                                rel="noreferrer"
                              >
                                {chipContent}
                              </Chip>
                            ) : (
                              <Chip>{chipContent}</Chip>
                            )}
                          </li>
                        );
                      })
                    ) : (
                      <li>
                        <Chip className="sponsor-placeholder" variant="outline">
                          Sponsor slot open
                        </Chip>
                      </li>
                    )}
                  </ul>
                  {selectedEvent.luma_url ? (
                    <Link
                      className="inline-flex items-center gap-1.5"
                      href={selectedEvent.luma_url}
                      target="_blank"
                      rel="noreferrer"
                    >
                      View on Luma
                      <ArrowUpRightIcon />
                    </Link>
                  ) : null}
                </div>
              </div>
              <div className="detail-meta">
                <ExpandableSummary
                  summaryHtml={summaryHtml}
                  summaryParagraphs={summaryParagraphs}
                  eventId={selectedEvent.id}
                />
              </div>
              <div className="detail-extras pt-0">
                {showEventGallery ? (
                <section
                  className="detail-photos"
                  aria-labelledby="event-photos-title"
                >
                  <div className="mb-[clamp(24px,3vw,40px)] flex items-center justify-between">
                    <h3
                      className="m-0 text-xl font-bold tracking-[-0.06em] text-black"
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
                        variant="ghost"
                        disabled={!canScrollPhotosLeft}
                        onClick={() => scrollPhotoRail(-1)}
                      >
                        <ArrowIcon direction="left" />
                      </IconButton>
                      <IconButton
                        aria-label="Next event photo"
                        aria-controls="event-photo-rail"
                        variant="ghost"
                        disabled={!canScrollPhotosRight}
                        onClick={() => scrollPhotoRail(1)}
                      >
                        <ArrowIcon direction="right" />
                      </IconButton>
                    </div>
                  </div>
                  <ul
                    className="detail-photo-list m-0 touch-pan-x p-0 pb-2.5 focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-ink"
                    id="event-photo-rail"
                    ref={setDetailPhotoRail}
                    tabIndex={0}
                    aria-label={`${selectedEvent.title} gallery, horizontally scrollable`}
                  >
                    {selectedPhotos.map((photoUrl, photoIndex) => (
                      <li key={`${selectedEvent.id}-${photoIndex}`}>
                        <div
                          className="detail-photo-frame relative inline-flex overflow-hidden rounded-md"
                          data-loaded={loadedPhotos[photoUrl] ? "true" : "false"}
                        >
                          <img
                            className="detail-photo h-[clamp(180px,52vw,260px)] w-auto max-w-[min(82vw,640px)] rounded-md border-0 bg-surface-muted object-contain min-[821px]:h-[clamp(190px,15vw,200px)] min-[821px]:max-w-none"
                            src={photoUrl}
                            alt={`${selectedEvent.title} event photo ${photoIndex + 1} of ${selectedPhotos.length}`}
                            loading={photoIndex < 3 ? "eager" : "lazy"}
                            decoding="async"
                            // A cached photo can finish before hydration
                            // attaches onLoad, which would leave the
                            // placeholder up for good.
                            ref={(node) => {
                              if (node?.complete && node.naturalWidth > 0) {
                                markPhotoLoaded(photoUrl);
                              }
                            }}
                            onLoad={() => {
                              markPhotoLoaded(photoUrl);
                              updatePhotoRailBoundsFromRef();
                            }}
                            onError={() => markPhotoLoaded(photoUrl)}
                          />
                          <span
                            className="detail-photo-shimmer bg-skeleton"
                            aria-hidden="true"
                          />
                        </div>
                      </li>
                    ))}
                  </ul>
                </section>
                ) : null}
              </div>
            </motion.div>
            </AnimatePresence>
          ) : (
            <div className="detail-grid detail-empty">
              <div className="detail-title">
                <h2 className="m-0 text-balance text-[clamp(1.75rem,2.6vw,2.5rem)] font-bold leading-[1.15] tracking-[-0.06em] text-black">
                  Waiting for the archive
                </h2>
              </div>
              <div className="detail-meta">
                <p className="m-0 max-w-[62ch] text-pretty text-base leading-[1.7] text-body">
                  Once Supabase is seeded, each square opens the full event
                  details here.
                </p>
              </div>
            </div>
          )}
        </ScrollReveal>
      </section>
      </div>

      <section
        className="upcoming-events bg-white px-[clamp(20px,6vw,96px)] py-[160px] text-black max-[820px]:py-[80px]"
        id="calendar"
        aria-labelledby="upcoming-events-title"
      >
        <ScrollReveal className="upcoming-events-copy">
          <h2
            className="m-0 text-balance text-[clamp(3.5rem,6vw,5rem)] font-bold leading-[1.05] tracking-[-0.06em] text-black max-[520px]:text-[clamp(2.75rem,12vw,3.75rem)]"
            id="upcoming-events-title"
          >
            Calendar
          </h2>
          <p className="m-0 max-w-[54ch] text-pretty text-base leading-[1.6] text-body">
            {showRecentEvents
              ? "Nothing on the calendar right now. Follow our Luma to hear about the next one first."
              : "RSVP on Luma to join us at the next Design Meetup."}
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
          {showRecentEvents ? (
            <RecentEventsPanel events={recentEvents} />
          ) : (
            <iframe
              className="upcoming-events-frame block w-full border-0 bg-transparent"
              src={LUMA_CALENDAR_EMBED_SRC}
              title="Design Meetup upcoming events on Luma"
              loading="lazy"
              allow="fullscreen"
            />
          )}
        </ScrollReveal>
      </section>

      <section
        className="about-section bg-white px-[clamp(20px,6vw,96px)] pt-[160px] pb-[80px] text-black max-[820px]:pt-[80px] max-[820px]:pb-[40px]"
        id="about"
        aria-labelledby="about-title"
      >
        <ScrollReveal className="about-grid">
          <div className="about-copy">
            <h2
              className="m-0 text-balance text-[clamp(3.5rem,6vw,5rem)] font-bold leading-[1.05] tracking-[-0.06em] text-black max-[520px]:text-[clamp(2.75rem,12vw,3.75rem)]"
              id="about-title"
            >
              About
            </h2>
            <div className="about-lede grid gap-5 text-base leading-[1.6] text-body">
              <p className="m-0 text-pretty">
                We are a community of the world’s most ambitious creatives in NYC, SF, & LA.
              </p>
              <p className="m-0 text-pretty">
                We bring together designers who aspire to take their craft seriously while forming meaningful connections.
              </p>
            </div>
          </div>

          <div className="about-image min-w-0" ref={aboutVideoRef}>
            <motion.div
              className="about-video-shell relative rounded-[20px]"
              style={{ scale: reduceMotion ? 1 : aboutVideoScale }}
            >
              <MuxPlayer
                className="about-video block aspect-[16/9] w-full overflow-hidden rounded-[20px] border border-gray-200 outline-none"
                ref={aboutPlayerRef}
                playbackId="Lsd9OIuICyIM2sIfKSt7ecwwVjFvMPeXOxNFS00X43dM"
                streamType="on-demand"
                thumbnailTime={31}
                muted={aboutVideoMuted}
                loop
                nohotkeys
                playsInline
                preload="auto"
                title="Design Meetup community gathering around tables to make and connect"
                style={{
                  aspectRatio: "16 / 9",
                  "--controls": "none",
                  "--media-object-fit": "cover",
                }}
              />
              <button
                className="about-video-sound absolute right-4 bottom-4 grid size-9 place-items-center rounded-full border-0 bg-[#0f0f0f]/55 p-2 text-white transition-[background-color,transform] duration-150 ease-out hover:bg-[#0f0f0f]/75 active:scale-[0.96] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
                type="button"
                onClick={toggleAboutVideoSound}
                aria-pressed={!aboutVideoMuted}
                aria-label={
                  aboutVideoMuted ? "Unmute video" : "Mute video"
                }
              >
                {aboutVideoMuted ? (
                  <SoundOffIcon className="size-4 shrink-0" />
                ) : (
                  <SoundOnIcon className="size-4 shrink-0" />
                )}
              </button>
            </motion.div>
          </div>
        </ScrollReveal>
      </section>

      <section
        className="partner-cta bg-white px-[clamp(20px,6vw,96px)] py-[160px] text-black max-[820px]:py-[80px]"
        id="sponsor"
        aria-labelledby="partner-cta-title"
      >
        <ScrollReveal className="partner-copy">
          <h2
            className="m-0 max-w-[676px] text-balance text-[clamp(3.5rem,6vw,5rem)] font-bold leading-[1.05] tracking-[-0.06em] text-black max-[520px]:text-[clamp(2.75rem,12vw,3.75rem)]"
            id="partner-cta-title"
          >
            Partner with us
          </h2>
          <PartnerContactForm />
        </ScrollReveal>
        <ScrollReveal className="partner-logos" delay={80}>
          <ul
            className="partner-grid m-0 p-0"
            aria-label="Selected partner companies"
          >
            {partnerLogos.map((partner) => (
              <li
                className="partner-tile rounded-[10px] bg-surface-muted"
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

      <FoundersNote />

      <footer
        className="bg-white px-[clamp(20px,6vw,96px)] pt-[clamp(80px,10vw,144px)] pb-[clamp(40px,5vw,72px)] text-base text-body"
        id="contact"
      >
        <ScrollReveal className="footer-brand">
          <img
            className="footer-logo border-0 outline-none"
            src="/design-meetup-logo.svg"
            alt="Design Meetup"
            width={1000}
            height={1000}
            loading="lazy"
          />
        </ScrollReveal>
        <ScrollReveal className="footer-contact" delay={60}>
          <h2 className="m-0 mb-5 text-xl font-bold tracking-[-0.06em] text-black">
            Contact
          </h2>
          <nav
            aria-label="Contact links"
            className="flex flex-col items-start gap-5"
          >
            <a
              className={`${footerLinkClassName} group inline-flex items-center gap-1 [overflow-wrap:anywhere]`}
              href="mailto:contactdesignmeetup@gmail.com"
            >
              contactdesignmeetup@gmail.com
              <ArrowUpRightIcon className="size-4 opacity-0 transition-opacity duration-150 group-hover:opacity-100 group-focus-visible:opacity-100 motion-reduce:transition-none" />
            </a>
            <div className="footer-contact-row flex items-center gap-6">
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
          <h2 className="m-0 mb-5 text-xl font-bold tracking-[-0.06em] text-black">
            Join the newsletter
          </h2>
          <NewsletterForm />
        </ScrollReveal>
        <ScrollReveal className="footer-credit" delay={160}>
          <p className="m-0 text-right text-base text-muted max-[820px]:text-left">
            Website built in{" "}
          <a
            className={footerCreditLinkClassName}
            href="https://nextjs.org/"
            target="_blank"
            rel="noreferrer"
          >
            Next.js
          </a>{" "}
          with{" "}
          <a
            className={footerCreditLinkClassName}
            href="https://cursor.com/"
            target="_blank"
            rel="noreferrer"
          >
            Cursor
          </a>{" "}
          and{" "}
          <a
            className={footerCreditLinkClassName}
            href="https://supabase.com/"
            target="_blank"
            rel="noreferrer"
          >
            Supabase
          </a>
          .
          </p>
        </ScrollReveal>
      </footer>
    </main>
  );
}
