"use client";

import type MuxPlayerElement from "@mux/mux-player";
import MuxPlayer from "@mux/mux-player-react";
import {
  AnimatePresence,
  motion,
  type MotionStyle,
  useMotionValue,
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
import { FilmTickerLines, type FilmTickerFocus } from "./FilmTickerLines";
import { FoundersNote } from "./FoundersNote";
import { GalleryLightbox } from "./GalleryLightbox";
import { GalleryViewToggle, type GalleryView } from "./GalleryViewToggle";
import { SoundOffIcon, SoundOnIcon } from "./icons/SoundIcons";
import { IconButton } from "./IconButton";
import { Link } from "./Link";
import { PageLoader } from "./PageLoader";
import { PartnerContactForm } from "./PartnerContactForm";
import { Primary } from "./Primary";
import { RecentEventsPanel } from "./RecentEventsPanel";
import { ScrollReveal } from "./ScrollReveal";
import { SiteFooter } from "./SiteFooter";
import { SiteHeader } from "./SiteHeader";
import { preloadImages, recoverImage, sizedImage, sizedImageUrl } from "@/lib/image";
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
// even gap on both sides of the focused cover. Squeeze stays at 1 so the shear
// alone carries the shelf; the size difference comes from the resting scale.
const CARD_SQUEEZE = 1;
// A shear, not a rotation, so the covers keep vertical left and right edges
// while their top and bottom edges run on the diagonal.
const CARD_SHEAR_DEG = 15;
// Percentages of the cover's own width, so the shelf holds its proportions at
// every cover size. The part clears the focused cover: the shelf is pitched at
// 0.41 of a cover and the focused cover paints 1.03x its layout box, so its
// neighbours have to step out this far to leave a clear gap either side. Pitch
// and part are one setting: a shelf card's painted edge lands at
// distance * pitch + (part + rest scale / 2) * cover, and four whole covers per
// side only fit inside the viewport half at this pitch if the part carries the
// wings out past the focused cover. Dropping the resting scale to 0.9 shrinks
// that painted box, which is what lets the part step out to 0.68 for a more
// generous gap around the focused cover while the fourth cover still lands whole.
const CARD_PART_PCT = 68;
// The hover pull only has to read as a nudge: the cover stays under its left
// neighbour, so a long travel reads as a card escaping the shelf rather than
// being eased out of it. globals.css holds the hovered cover's resting box as a
// hit target over the same distance, so the pull cannot walk a cover out from
// under the pointer that asked for it.
const CARD_PULL_PCT = 5;
// The About video scales up from 0.55 as it scrolls in, and its frame — the
// inset edge and the drop shadow — is painted in the shell's own space before
// that scale is applied. Anything drawn at the edge therefore compresses as the
// video shrinks and reads as a heavy drawn border at the small end. The frame
// is held back instead: it stays invisible for the whole approach and fades in
// over the last stretch, so only a video at full width carries an edge.
const ABOUT_VIDEO_EDGE_FROM_SCALE = 0.9;

function aboutVideoEdgeReveal(scale: number) {
  const travelled =
    (scale - ABOUT_VIDEO_EDGE_FROM_SCALE) / (1 - ABOUT_VIDEO_EDGE_FROM_SCALE);
  return Math.min(Math.max(travelled, 0), 1);
}

// Lengths are held against the live scale so the cloud keeps its size on screen
// rather than compressing with the box; the alphas ride the edge's reveal so
// there is nothing to compress until the video has arrived.
function aboutVideoShadowAt(scale: number) {
  const held = (length: number) => Math.round((length / scale) * 100) / 100;
  const alpha = (weight: number) =>
    Math.round(weight * aboutVideoEdgeReveal(scale) * 1000) / 1000;
  return [
    `0 ${held(2)}px ${held(4)}px rgba(15, 15, 15, ${alpha(0.02)})`,
    `0 ${held(12)}px ${held(24)}px ${held(-8)}px rgba(15, 15, 15, ${alpha(0.07)})`,
    `0 ${held(48)}px ${held(88)}px ${held(-24)}px rgba(15, 15, 15, ${alpha(0.18)})`,
  ].join(", ");
}

// A reader who has asked for no motion gets the far end of the travel outright.
const ABOUT_VIDEO_ARRIVED_SHADOW = aboutVideoShadowAt(1);

// The rail opens on the sixth cover so the shelf reads as a shelf from the
// first frame, with covers tucked behind the focused one on both sides. An
// archive too short to have a sixth cover opens on the newest instead of the
// oldest: the covers then run to the right, which is the end the entrance sweep
// starts from and the end a reader scrolls towards.
const DEFAULT_FOCUS_SLOT = 5;
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
  // Entrance pose: the cover sits a slot to the right of its own, a touch
  // smaller and turned further, so it deals out from under its right-hand
  // neighbour instead of appearing in place.
  entering?: boolean;
}) {
  const squeeze = selected ? 1 : CARD_SQUEEZE;
  const shearRest = selected ? 0 : CARD_SHEAR_DEG;
  const shear = entering ? shearRest + CARD_ENTRANCE_SHEAR_DEG : shearRest;
  const depth = selected ? 26 : hovered ? 2 : -14;
  // The focused cover is the only one painted over its layout box. Shelf covers
  // rest under it and hover stays under it too, so nothing on the shelf ever
  // reads as large as the cover in focus.
  const rest = selected ? 1.03 : hovered ? 0.93 : 0.9;
  const scale = entering ? rest * CARD_ENTRANCE_SCALE : rest;
  const liftRest = selected
    ? -6
    : hovered
      ? -8
      : Math.min(Math.abs(distance) * 1.5, 6);
  const lift = entering ? liftRest + CARD_ENTRANCE_LIFT_PX : liftRest;
  // Ahead of the squeeze so it reads as flat screen distance, which is what keeps
  // the gap on either side of the focused cover even. Hovering slides the cover
  // further off the shelf, like pulling a vinyl out.
  const away = distance < 0 ? -1 : 1;
  // The part mirrors, the pull does not. The rail leans one way, so every cover
  // is painted over by its left-hand neighbour and the only sliver of it a
  // reader can see or click is its right edge. Pulling away from centre would
  // therefore reveal a right-wing cover and bury a left-wing one, dragging that
  // sliver out from under the pointer that hovered it and handing the click to
  // the cover behind. Rightward on both wings pulls every cover out of the same
  // crate.
  const shelf = selected
    ? 0
    : away * CARD_PART_PCT + (hovered ? CARD_PULL_PCT : 0);
  const part = entering ? shelf + CARD_ENTRANCE_SHIFT_PCT : shelf;

  return `perspective(2200px) translateX(${part}%) translateZ(${depth}px) scaleX(${squeeze}) skewY(${shear}deg) scale(${scale}) translate(0px, ${lift}px)`;
}

// The shelf deals itself out right to left: every cover starts a slot right of
// its own and slides into place from under its right-hand neighbour, the way a
// record is drawn out of a crate.
//
// Matches the -0.59 slot overlap in globals.css: the shelf steps 41% of a cover
// per slot, so a cover that starts about that far right of its slot is sitting
// where its neighbour rests. Staying a touch under the step keeps the covers
// from crossing each other on the way in.
const CARD_SLOT_PITCH_PCT = 41;
const CARD_ENTRANCE_SHIFT_PCT = 34;
// Turned further than the shelf rests, so each cover squares up onto the shelf
// as it lands instead of sliding along it flat.
const CARD_ENTRANCE_SHEAR_DEG = 9;
const CARD_ENTRANCE_SCALE = 0.94;
// Covers rise the last of the way in, which keeps the deal from reading as a
// purely sideways sweep.
const CARD_ENTRANCE_LIFT_PX = 16;
// Soft edges while a cover is travelling, resolving as it lands. This is what
// sells the deal as movement rather than a row of covers changing places.
const CARD_ENTRANCE_BLUR_PX = 6;
const CARD_ENTRANCE_STAGGER_S = 0.05;
// Ordering only, and counted from the focused cover rather than from the start
// of the archive, so the sweep travels with the focus wherever the rail opens.
// Covers right of this lead in together, then the sweep steps leftward one slot
// at a time.
const CARD_ENTRANCE_LEAD_SLOTS = 5;
// Caps the sweep so covers deep off the left edge, which nobody sees arrive,
// can't stretch the entrance past the loader's hand-off.
const CARD_ENTRANCE_MAX_DELAY_S = 0.42;
const CARD_ENTRANCE_DURATION_S = 0.72;
// A long tail out of an easing curve keeps this a settle. A spring here reads as
// the cover overshooting its slot and snapping back.
const CARD_ENTRANCE_EASE = [0.16, 1, 0.3, 1] as const;
// Covers have to be back in place before the spring takes over selection, and
// the view swap replays the same deal, so both wait on this.
const CARD_ENTRANCE_TOTAL_MS = Math.ceil(
  (CARD_ENTRANCE_MAX_DELAY_S + CARD_ENTRANCE_DURATION_S) * 1000,
);

// Right to left: the covers on the right lead, then each slot follows.
function cardEntranceDelay(distance: number) {
  return Math.min(
    Math.max(CARD_ENTRANCE_LEAD_SLOTS - distance, 0) * CARD_ENTRANCE_STAGGER_S,
    CARD_ENTRANCE_MAX_DELAY_S,
  );
}

// One view clears out before the next builds itself, so the swap never shows two
// sets of covers at once. Short: it is dead time in front of the view you asked
// for, and the arriving view carries the motion that reads as the change.
const VIEW_SWAP_DURATION_MS = 120;
// The same deal, run faster on the way back from the pack: a first load is a
// reveal the reader is watching, but a view swap is a control they just pressed,
// and the far end of the sweep is empty rail until it lands.
const CARD_SWAP_SPEEDUP = 0.65;
const CARD_SWAP_TOTAL_MS =
  VIEW_SWAP_DURATION_MS + Math.ceil(CARD_ENTRANCE_TOTAL_MS * CARD_SWAP_SPEEDUP);

// A smooth centre outlives one settle window, so every frame of it extends the
// suppression that keeps it from being read back as a change of selection. That
// extension needs a ceiling: a flick that lands while the rail is still
// centring goes on renewing it for as long as the reader keeps scrolling, and
// the selection stays pinned to the cover it was centring on while the rail
// runs out from under it. Longer than the longest centre the rail can animate,
// short enough that a stuck latch frees within a frame or two of a flick.
const PROGRAMMATIC_SCROLL_MAX_MS = 900;

// The pack has far more covers than the rail, so its wave steps in smaller
// increments and caps well short of the rail's.
const GRID_TILE_STAGGER_S = 0.022;
const GRID_TILE_MAX_DELAY_S = 0.22;
const GRID_TILE_DURATION_S = 0.42;
const GRID_TILE_RISE_PX = 12;

function gridTileDelay(index: number) {
  return Math.min(index * GRID_TILE_STAGGER_S, GRID_TILE_MAX_DELAY_S);
}

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
            className="pointer-events-none absolute inset-x-0 bottom-0 h-16 bg-gradient-to-b from-surface/0 via-surface/80 to-surface"
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
  const initialIndex =
    initialEvents.length > DEFAULT_FOCUS_SLOT ? DEFAULT_FOCUS_SLOT : 0;
  const [selectedIndex, setSelectedIndex] = useState(initialIndex);
  const [view, setView] = useState<GalleryView>("carousel");
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const [isGalleryReady, setIsGalleryReady] = useState(false);
  const [hasGalleryEntered, setHasGalleryEntered] = useState(false);
  // Set while the rail replays its deal after a view swap, so the covers mount
  // from the entrance pose instead of springing out of the selection spring.
  const [isDealing, setIsDealing] = useState(false);
  const status: "ready" | "error" = initialError ? "error" : "ready";
  const errorMessage = initialError;
  const cardRefs = useRef<Array<HTMLButtonElement | null>>([]);
  const galleryRef = useRef<HTMLUListElement | null>(null);
  // The rail is torn down and rebuilt around a view swap, and it arrives a beat
  // after the view state changes because the outgoing view animates out first.
  // Everything that has to measure or scroll the rail waits on the node itself
  // rather than on the view, which is why it is tracked in state.
  const [galleryElement, setGalleryElement] = useState<HTMLUListElement | null>(
    null,
  );
  const detailPhotoRailRef = useRef<HTMLUListElement | null>(null);
  const slideRefs = useRef<Array<HTMLLIElement | null>>([]);
  const hasCenteredInitial = useRef(false);
  const isProgrammaticScroll = useRef(false);
  const scrollSettleTimer = useRef<number | null>(null);
  const programmaticScrollUntil = useRef(0);
  const selectionSource = useRef<"control" | "scroll">("control");
  // Which cover was centred when the pointer went down. Focus lands on a cover
  // before its click fires and moves the selection under it, so a click can
  // only tell it was aimed at the already-centred cover by the index it read
  // on the way down. Cleared on any keypress: keyboard activation has no
  // pointerdown to read and falls back to the live selection.
  const pressedFromIndex = useRef<number | null>(null);
  const galleryFocus = useRef<FilmTickerFocus>({
    index: initialIndex,
    velocity: 0,
  });
  const lastScrollSample = useRef({ left: 0, at: 0 });
  const velocityResetTimer = useRef<number | null>(null);
  const [photoRailElement, setPhotoRailElement] =
    useState<HTMLUListElement | null>(null);
  const [canScrollPhotosLeft, setCanScrollPhotosLeft] = useState(false);
  const [canScrollPhotosRight, setCanScrollPhotosRight] = useState(false);
  // The rail only overflows once the photos are wider than their column, and a
  // gallery that fits has nothing for the arrows to do.
  const [isPhotoRailScrollable, setIsPhotoRailScrollable] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
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
  const aboutVideoEdgeOpacity = useTransform(
    aboutVideoScale,
    aboutVideoEdgeReveal,
  );
  const aboutVideoShadow = useTransform(aboutVideoScale, aboutVideoShadowAt);
  // The server renders the travelling pose because it cannot know the reader's
  // motion preference, and React declines to patch up the inline styles it finds
  // on the shell when a reduced-motion client hydrates over them. Motion writes
  // its own values to the DOM, so the arrived pose is spelled in motion values:
  // plain ones would leave the video wearing the server's frameless styles.
  const arrivedScale = useMotionValue(1);
  const arrivedShadow = useMotionValue(ABOUT_VIDEO_ARRIVED_SHADOW);
  const arrivedEdgeOpacity = useMotionValue(1);
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
  const selectedPhotoSources = useMemo(
    () =>
      (selectedEvent?.gallery_images ?? [])
        .map((image) => image.image_url)
        .filter((url) => !url.includes("/placeholders/")),
    [selectedEvent?.gallery_images],
  );
  // Photos render a few hundred pixels tall, so ask the CDN for a right-sized
  // render (~10x smaller than the stored original) instead of the full JPEG.
  // 460 is the widest the rail can paint one: its tallest clamp against the
  // widest aspect ratio the recap posts come in.
  const selectedPhotoRenders = useMemo(
    () =>
      selectedPhotoSources.map((url) =>
        sizedImage(url, { width: 460, quality: 68 }),
      ),
    [selectedPhotoSources],
  );
  // The 1x render doubles as the identity for a photo's load state and as the
  // lightbox's stand-in, so the rail keys off it whichever candidate paints.
  const selectedPhotos = useMemo(
    () => selectedPhotoRenders.map((photo) => photo.src),
    [selectedPhotoRenders],
  );
  // The lightbox paints a photo across most of the viewport, so the rail's
  // thumbnail render would go soft there. It stays a long way short of the
  // stored original, though: the rail's render stands in until this arrives, so
  // shaving the bytes shortens the wait more than the extra pixels are worth.
  const lightboxPhotos = useMemo(
    () =>
      selectedPhotoSources.map((url) =>
        sizedImageUrl(url, { width: 1200, quality: 76, dpr: 1.25 }),
      ),
    [selectedPhotoSources],
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

  const setGalleryRail = useCallback((rail: HTMLUListElement | null) => {
    galleryRef.current = rail;
    setGalleryElement(rail);
  }, []);

  const setDetailPhotoRail = useCallback(
    (rail: HTMLUListElement | null) => {
      detailPhotoRailRef.current = rail;
      setPhotoRailElement(rail);
    },
    [],
  );

  const updatePhotoRailBounds = useCallback(
    (rail: HTMLUListElement) => {
      setIsPhotoRailScrollable(rail.scrollWidth > rail.clientWidth + 1);
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
          .map((url) => sizedImage(url, { width: 460, quality: 68 })),
      );
    return preloadImages([...selectedPhotoRenders, ...neighbourPhotos]);
  }, [selectedPhotoRenders, selectedIndex, events]);

  useEffect(() => {
    if (!photoRailElement) {
      setIsPhotoRailScrollable(false);
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
    // A photo claims its width only once it decodes, and the rail's own box is
    // sized by the column around it, so watching the rail alone never sees the
    // content grow past it. Watching the items too is what catches an
    // overflowing rail on first paint instead of after a stray scroll.
    observer.observe(photoRailElement);
    for (const item of Array.from(photoRailElement.children)) {
      observer.observe(item);
    }
    // A cached photo can settle before React attaches onLoad, and load events
    // don't bubble, so the capture phase is the only way to hear all of them.
    photoRailElement.addEventListener("load", updateBounds, { capture: true });

    return () => {
      cancelAnimationFrame(frame);
      photoRailElement.removeEventListener("scroll", updateBounds);
      photoRailElement.removeEventListener("load", updateBounds, {
        capture: true,
      });
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

  const openLightbox = useCallback((photoIndex: number) => {
    setLightboxIndex(photoIndex);
  }, []);

  const closeLightbox = useCallback(() => setLightboxIndex(null), []);

  // Moving to another event swaps the whole gallery out from under the overlay.
  useEffect(() => {
    setLightboxIndex(null);
  }, [selectedEvent?.id]);

  const selectEvent = useCallback(
    (index: number) => {
      if (events.length === 0) return;
      const nextIndex = Math.max(0, Math.min(events.length - 1, index));
      selectionSource.current = "control";
      setSelectedIndex(nextIndex);
    },
    [events.length],
  );

  // A cover out on the wings is a target to bring in; the centred one has
  // already been read, so hitting it again leaves for the event's Luma page.
  const activateEvent = useCallback(
    (index: number) => {
      const centered = pressedFromIndex.current ?? selectedIndex;
      pressedFromIndex.current = null;
      const lumaUrl = events[index]?.luma_url;
      if (centered === index && lumaUrl) {
        window.open(lumaUrl, "_blank", "noopener,noreferrer");
        return;
      }
      selectEvent(index);
    },
    [events, selectEvent, selectedIndex],
  );

  const changeView = useCallback((nextView: GalleryView) => {
    // Re-entering the carousel should land on the selected cover without
    // animating the scrollport across the whole rail.
    hasCenteredInitial.current = false;
    selectionSource.current = "control";
    setHoveredIndex(null);
    // The rail is built fresh on the way back in, so it deals out the same way
    // it does on first load rather than cutting to a finished shelf.
    if (nextView === "carousel") setIsDealing(true);
    setView(nextView);
  }, []);

  useEffect(() => {
    if (!isDealing) return;
    const timer = window.setTimeout(
      () => setIsDealing(false),
      reduceMotion ? 0 : CARD_SWAP_TOTAL_MS,
    );
    return () => window.clearTimeout(timer);
  }, [isDealing, reduceMotion]);

  // The toggle is hidden below 820px, so a grid selection from a wider window
  // has to snap back to the carousel once the viewport goes mobile.
  useEffect(() => {
    const media = window.matchMedia("(max-width: 820px)");
    const syncView = () => {
      if (media.matches) changeView("carousel");
    };
    syncView();
    media.addEventListener("change", syncView);
    return () => media.removeEventListener("change", syncView);
  }, [changeView]);

  // Hover is driven by pointerover on each cover (bubbles, last cover under
  // the pointer wins) and cleared by pointerleave on the rail. Paired
  // enter/leave on overlapping, sheared covers used to miss a leave or fire
  // leave-then-enter out of order, leaving hoveredIndex stuck on one card
  // while the CSS hover: shadow correctly followed the pointer.
  const hoverCard = useCallback((index: number | null, pointerType: string) => {
    if (pointerType !== "mouse") return;
    setHoveredIndex(index);
  }, []);

  const releaseProgrammaticScroll = useCallback(() => {
    isProgrammaticScroll.current = false;
    programmaticScrollUntil.current = 0;
    if (scrollSettleTimer.current !== null) {
      window.clearTimeout(scrollSettleTimer.current);
      scrollSettleTimer.current = null;
    }
  }, []);

  // Holds the suppression open for one more quiet window. The rail's own scroll
  // frames call this so a centre that is still animating stays suppressed.
  const holdProgrammaticScroll = useCallback(() => {
    if (scrollSettleTimer.current !== null) {
      window.clearTimeout(scrollSettleTimer.current);
    }
    scrollSettleTimer.current = window.setTimeout(
      releaseProgrammaticScroll,
      reduceMotion ? 80 : 180,
    );
  }, [reduceMotion, releaseProgrammaticScroll]);

  const markProgrammaticScroll = useCallback(() => {
    isProgrammaticScroll.current = true;
    programmaticScrollUntil.current =
      performance.now() + PROGRAMMATIC_SCROLL_MAX_MS;
    holdProgrammaticScroll();
  }, [holdProgrammaticScroll]);

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
    // A rail that is hidden or has not been laid out measures zero, and every
    // slide inside it collapses onto the same point, which reads as a focus.
    if (rect.width === 0) return null;
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

  // A rebuilt rail arrives at scrollLeft 0 with the selected cover off to the
  // right of the scrollport. Its slides carry their layout boxes the moment they
  // attach, and the covers' entrance pose is a transform those boxes never see,
  // so the rail can be put where it belongs before anything is painted instead
  // of a frame later. Only the rail arriving belongs here: a selection change
  // goes through the effect below, which scrolls smoothly from wherever the
  // reader left the rail, and this one would jump it there.
  useLayoutEffect(() => {
    if (!galleryElement || status !== "ready" || events.length === 0) return;
    markProgrammaticScroll();
    centerSlide(selectedIndex, "auto");
    hasCenteredInitial.current = true;
    // The ticker's focus is otherwise only refreshed by the rail's scroll
    // handler, and a rebuilt rail that already sits where it belongs never
    // scrolls: coming back from the pack onto one of the first covers leaves
    // the ticker pointing at wherever the rail was before the swap. Reading it
    // back here also keeps the ticker from painting a frame of the old
    // position on the swaps that do scroll.
    const focus = measureGalleryFocus();
    galleryFocus.current.index = focus?.focal ?? selectedIndex;
    galleryFocus.current.velocity = 0;
  }, [galleryElement]);

  useEffect(() => {
    if (!galleryElement || status !== "ready" || events.length === 0) return;
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
    galleryElement,
    markProgrammaticScroll,
    reduceMotion,
    selectedIndex,
    status,
    view,
  ]);

  // The covers hold a slot right of their own until the loader lifts, then deal
  // in right to left. Once that has played, selection hands over to the spring
  // that carries every later move.
  useEffect(() => {
    if (!isGalleryReady || hasGalleryEntered) return;
    const timer = window.setTimeout(
      () => setHasGalleryEntered(true),
      CARD_ENTRANCE_TOTAL_MS,
    );
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
    const gallery = galleryElement;
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
          // Only a centre that is still plausibly running holds the rail: past
          // its ceiling the frames belong to the reader, and holding them would
          // freeze the focused cover while the rail carries on under it.
          if (performance.now() < programmaticScrollUntil.current) {
            holdProgrammaticScroll();
            return;
          }
          releaseProgrammaticScroll();
        }
        selectionSource.current = "scroll";
        setSelectedIndex(focus.index);
      });
    };

    // The reader reaching for the rail ends any centre in flight — the browser
    // drops the smooth scroll on the first wheel or touch anyway — so the
    // frames that follow are theirs to steer the selection with.
    const takeOverScroll = () => releaseProgrammaticScroll();

    gallery.addEventListener("scroll", handleScroll, { passive: true });
    gallery.addEventListener("wheel", takeOverScroll, { passive: true });
    gallery.addEventListener("touchstart", takeOverScroll, { passive: true });
    gallery.addEventListener("pointerdown", takeOverScroll, { passive: true });

    return () => {
      gallery.removeEventListener("scroll", handleScroll);
      gallery.removeEventListener("wheel", takeOverScroll);
      gallery.removeEventListener("touchstart", takeOverScroll);
      gallery.removeEventListener("pointerdown", takeOverScroll);
      if (frame !== 0) cancelAnimationFrame(frame);
    };
  }, [
    events.length,
    galleryElement,
    holdProgrammaticScroll,
    measureGalleryFocus,
    releaseProgrammaticScroll,
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
      // The lightbox owns the arrows while it is up: stepping the event under it
      // would swap the whole gallery out and close the overlay.
      if (lightboxIndex !== null) return;

      event.preventDefault();
      selectionSource.current = "control";
      setSelectedIndex((current) => {
        const delta = event.key === "ArrowLeft" ? -1 : 1;
        return Math.max(0, Math.min(events.length - 1, current + delta));
      });
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [events.length, lightboxIndex]);

  return (
    <main className="min-h-dvh w-full overflow-hidden rounded-none border-0 bg-surface font-['Alte_Haas_Grotesk',sans-serif] text-body shadow-none antialiased [font-synthesis:none] [text-rendering:optimizeLegibility]">
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

      {/* Carousel view leaves these stacked; grid view pairs them into a
          master/detail split, so they need a common layout parent. */}
      <div className="events-layout" data-view={view}>
      {/* Lives outside the gallery column so the toggle keeps the same
          top-right placement once grid view splits the layout in two. */}
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
            {/* One view leaves before the next arrives, so the covers never
                cross-dissolve into a second set of covers. */}
            <AnimatePresence mode="wait" initial={false}>
            {view === "carousel" ? (
              <motion.div
                key="carousel"
                initial={reduceMotion ? false : { opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={reduceMotion ? undefined : { opacity: 0 }}
                transition={{
                  duration: reduceMotion ? 0 : VIEW_SWAP_DURATION_MS / 1000,
                  ease: "easeOut",
                }}
              >
                <div className="gallery-viewport">
                  <ul
                    className="gallery px-[max(8vw,calc((100vw-1440px)/2))] pt-[clamp(36px,5vw,72px)] pb-[clamp(40px,4vw,56px)] max-[820px]:px-[18vw]"
                    ref={setGalleryRail}
                    aria-label="Choose a past event"
                    onPointerLeave={(event) =>
                      hoverCard(null, event.pointerType)
                    }
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
                      // The shelf is settled once the deal has played and no
                      // view swap is replaying it; from then on selection is
                      // carried by the spring.
                      const settled = hasGalleryEntered && !isDealing;
                      const pace = isDealing ? CARD_SWAP_SPEEDUP : 1;
                      const entranceDelay = settled
                        ? 0
                        : cardEntranceDelay(distance) * pace;
                      const entranceTransform = cardTransform({
                        distance,
                        selected,
                        hovered: false,
                        entering: true,
                      });
                      const entrancePose = {
                        transform: entranceTransform,
                        opacity: 0,
                        filter: `blur(${CARD_ENTRANCE_BLUR_PX}px)`,
                      };

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
                            className="event-card cursor-pointer rounded-lg border-0 bg-white p-0 text-left text-[oklch(98%_0.008_240)] shadow-[0_3px_10px_rgba(0,0,0,0.12)] outline-none focus:shadow-[0_12px_28px_rgba(0,0,0,0.18)] focus-visible:brightness-[0.88] focus-visible:shadow-[0_12px_28px_rgba(0,0,0,0.18)] hover:shadow-[0_14px_30px_rgba(0,0,0,0.14)] aria-pressed:shadow-[0_12px_28px_rgba(0,0,0,0.18)]"
                            aria-label={
                              selected && item.luma_url
                                ? `Open ${item.title} on Luma`
                                : `View details for ${item.title}`
                            }
                            aria-pressed={selected}
                            onFocus={() => selectEvent(index)}
                            onPointerDown={() => {
                              pressedFromIndex.current = selectedIndex;
                            }}
                            onKeyDown={() => {
                              pressedFromIndex.current = null;
                            }}
                            onClick={() => activateEvent(index)}
                            onPointerOver={(event) =>
                              hoverCard(index, event.pointerType)
                            }
                            // A cover built for a view swap has no earlier pose
                            // to leave, so it takes the entrance pose on mount.
                            initial={
                              isDealing && !reduceMotion ? entrancePose : false
                            }
                            animate={{
                              transform: isGalleryReady
                                ? transform
                                : entranceTransform,
                              opacity: isGalleryReady ? 1 : 0,
                              // Dropped to none once the shelf has settled: a
                              // filter of any kind keeps every cover on its own
                              // raster layer for the rest of the page's life.
                              filter:
                                settled || reduceMotion
                                  ? "none"
                                  : isGalleryReady
                                    ? "blur(0px)"
                                    : `blur(${CARD_ENTRANCE_BLUR_PX}px)`,
                            }}
                            transition={
                              reduceMotion
                                ? { duration: 0 }
                                : settled
                                  ? {
                                      type: "spring",
                                      stiffness: 190,
                                      damping: 24,
                                      mass: 0.85,
                                      filter: { duration: 0 },
                                    }
                                  : {
                                      duration: CARD_ENTRANCE_DURATION_S * pace,
                                      ease: CARD_ENTRANCE_EASE,
                                      delay: entranceDelay,
                                    }
                            }
                          >
                            <img
                              className="rounded-[inherit] border-0 outline-none"
                              // 272 is the --event-cover-size ceiling.
                              {...sizedImage(item.image_url, {
                                width: 272,
                                quality: 74,
                              })}
                              alt=""
                              draggable="false"
                              decoding="async"
                              loading={Math.abs(distance) > 3 ? "lazy" : "eager"}
                              onError={(event) => recoverImage(event.currentTarget)}
                            />
                            <span className="event-card-sheen" aria-hidden />
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
              </motion.div>
            ) : (
              <motion.div
                key="grid"
                className="gallery-grid px-[clamp(20px,6vw,96px)] pt-[clamp(32px,4vw,64px)] pb-[clamp(56px,9vw,128px)]"
                initial={reduceMotion ? false : { opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={reduceMotion ? undefined : { opacity: 0 }}
                transition={{
                  duration: reduceMotion ? 0 : VIEW_SWAP_DURATION_MS / 1000,
                  ease: "easeOut",
                }}
              >
                <ul className="event-grid m-0 p-0" aria-label="Choose a past event">
                  {events.map((item, index) => (
                    // The pack fills in reading order, so the wave runs the way
                    // the eye already travels across it.
                    <motion.li
                      key={item.id}
                      initial={
                        reduceMotion ? false : { opacity: 0, y: GRID_TILE_RISE_PX }
                      }
                      animate={{ opacity: 1, y: 0 }}
                      transition={{
                        duration: reduceMotion ? 0 : GRID_TILE_DURATION_S,
                        ease: CARD_ENTRANCE_EASE,
                        delay: reduceMotion ? 0 : gridTileDelay(index),
                      }}
                    >
                      {/* The cover carries the event's own artwork, so the
                          title and date live in the label rather than on
                          screen. */}
                      <button
                        className="event-grid-cover w-full overflow-hidden rounded-lg border-0 bg-surface-muted p-0 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink"
                        type="button"
                        aria-label={`${item.title}, ${item.date_label}`}
                        aria-pressed={index === selectedIndex}
                        onClick={() => selectEvent(index)}
                      >
                        <img
                          className="block size-full select-none border-0 object-cover outline-none"
                          // The pack's columns cap out near 150px, plus the
                          // scale the selected tile takes.
                          {...sizedImage(item.image_url, {
                            width: 160,
                            quality: 72,
                          })}
                          alt=""
                          draggable="false"
                          decoding="async"
                          loading="lazy"
                          onError={(event) => recoverImage(event.currentTarget)}
                        />
                      </button>
                    </motion.li>
                  ))}
                </ul>
              </motion.div>
            )}
            </AnimatePresence>
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
              {view === "grid" ? (
                <div className="detail-cover aspect-square overflow-hidden rounded-lg bg-surface-muted shadow-[0_12px_28px_rgba(0,0,0,0.18)]">
                  <img
                    className="block size-full select-none border-0 object-cover outline-none"
                    // Matches .detail-cover: the cover size times the 1.03 the
                    // focused card is scaled by.
                    {...sizedImage(selectedEvent.image_url, {
                      width: 280,
                      quality: 76,
                    })}
                    alt=""
                    draggable="false"
                    decoding="async"
                    onError={(event) => recoverImage(event.currentTarget)}
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
              {showEventGallery ? (
              <div className="detail-extras pt-[var(--detail-extra-gap)]">
                <section
                  className="detail-photos"
                  aria-label="Event gallery"
                >
                  {isPhotoRailScrollable ? (
                    <div className="mb-[clamp(24px,3vw,40px)] flex items-center justify-end">
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
                  ) : null}
                  <div
                    className="detail-photo-viewport"
                    data-fade-left={canScrollPhotosLeft ? "" : undefined}
                    data-fade-right={canScrollPhotosRight ? "" : undefined}
                  >
                  <ul
                    className="detail-photo-list m-0 touch-pan-x p-0 pb-2.5 focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-ink"
                    id="event-photo-rail"
                    ref={setDetailPhotoRail}
                    tabIndex={0}
                    aria-label={`${selectedEvent.title} gallery, horizontally scrollable`}
                  >
                    {selectedPhotoRenders.map((photo, photoIndex) => (
                      <li key={`${selectedEvent.id}-${photoIndex}`}>
                        <button
                          type="button"
                          className="detail-photo-frame relative inline-flex overflow-hidden rounded-md border-0 bg-transparent p-0 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink"
                          data-loaded={loadedPhotos[photo.src] ? "true" : "false"}
                          aria-label={`Open photo ${photoIndex + 1} of ${selectedPhotoRenders.length} at full size`}
                          onClick={() => openLightbox(photoIndex)}
                        >
                          <img
                            className="detail-photo h-[clamp(240px,62vw,320px)] w-auto max-w-[min(82vw,640px)] rounded-md border-0 bg-surface-muted object-contain min-[821px]:h-[clamp(260px,22vw,340px)] min-[821px]:max-w-none"
                            src={photo.src}
                            srcSet={photo.srcSet}
                            alt={`${selectedEvent.title} event photo ${photoIndex + 1} of ${selectedPhotoRenders.length}`}
                            loading={photoIndex < 3 ? "eager" : "lazy"}
                            decoding="async"
                            // A cached photo can finish before hydration
                            // attaches onLoad, which would leave the
                            // placeholder up for good.
                            ref={(node) => {
                              if (node?.complete && node.naturalWidth > 0) {
                                markPhotoLoaded(photo.src);
                              }
                            }}
                            onLoad={() => {
                              markPhotoLoaded(photo.src);
                              updatePhotoRailBoundsFromRef();
                            }}
                            // Only give up on a photo once the original has
                            // failed too, otherwise the retry never gets to
                            // paint over the placeholder.
                            onError={(event) => {
                              if (!recoverImage(event.currentTarget)) {
                                markPhotoLoaded(photo.src);
                              }
                            }}
                          />
                          <span
                            className="detail-photo-shimmer bg-skeleton"
                            aria-hidden="true"
                          />
                        </button>
                      </li>
                    ))}
                  </ul>
                  </div>
                  <GalleryLightbox
                    photos={lightboxPhotos}
                    previews={selectedPhotos}
                    index={lightboxIndex}
                    label={`${selectedEvent.title} gallery`}
                    title={selectedEvent.title}
                    onIndexChange={setLightboxIndex}
                    onClose={closeLightbox}
                  />
                </section>
              </div>
              ) : null}
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
        className="upcoming-events bg-surface px-[clamp(20px,6vw,96px)] py-[160px] text-black max-[820px]:py-[80px]"
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
            {showRecentEvents ? (
              <>
                Nothing&apos;s on the calendar right now ...
                <br />
                Stay tuned on Luma to hear about the next one first!
              </>
            ) : (
              "RSVP on Luma to join us at the next Design Meetup."
            )}
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
        className="about-section bg-surface px-[clamp(20px,6vw,96px)] pt-[160px] pb-[80px] text-black max-[820px]:pt-[80px] max-[820px]:pb-[40px]"
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
              style={
                reduceMotion
                  ? ({
                      scale: arrivedScale,
                      boxShadow: arrivedShadow,
                      "--media-edge-reveal": arrivedEdgeOpacity,
                    } as MotionStyle)
                  : ({
                      scale: aboutVideoScale,
                      boxShadow: aboutVideoShadow,
                      "--media-edge-reveal": aboutVideoEdgeOpacity,
                    } as MotionStyle)
              }
            >
              <MuxPlayer
                className="about-video block aspect-[16/9] w-full overflow-hidden rounded-[20px] border-0 outline-none"
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
        className="partner-cta bg-surface px-[clamp(20px,6vw,96px)] py-[200px] text-black max-[820px]:py-[96px]"
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

      <SiteFooter />
    </main>
  );
}
