"use client";

import { BlossomCarousel } from "@blossom-carousel/react";
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
  type CSSProperties,
} from "react";
import { ArrowUpRightIcon } from "./icons/ArrowUpRightIcon";
import { InstagramIcon, SubstackIcon } from "./icons/SocialIcons";
import { ApplyNotifyForm } from "./ApplyNotifyForm";
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
import { PhotoMarquee } from "./PhotoMarquee";
import { Primary } from "./Primary";
import { RecentEventsPanel } from "./RecentEventsPanel";
import { ScrollReveal } from "./ScrollReveal";
import { SiteFooter } from "./SiteFooter";
import { SiteHeader } from "./SiteHeader";
import {
  eventCoverImage,
  firstPaintCoverImages,
  initialFocusIndex,
  preloadImages,
  recoverImage,
  sizedImage,
  sizedImageUrl,
  VISIBLE_COVER_RADIUS,
} from "@/lib/image";
import type { LumaEvent } from "@/lib/luma";
import type { MeetupEvent } from "@/lib/supabase";

const partnerLogos = [
  { slug: "figma", name: "Figma", href: "https://www.figma.com/", src: "/partners/figma.png" },
  { slug: "cursor", name: "Cursor", href: "https://cursor.com/", src: "/partners/cursor.png" },
  { slug: "notion", name: "Notion", href: "https://www.notion.com/", src: "/partners/notion.png" },
  { slug: "ramp", name: "Ramp", href: "https://ramp.com/", src: "/partners/partner-4.png" },
  { slug: "apple", name: "Apple", href: "https://www.apple.com/", src: "/partners/apple.png" },
  { slug: "tiktok", name: "TikTok", href: "https://www.tiktok.com/", src: "/partners/tiktok.png" },
  { slug: "framer", name: "Framer", href: "https://www.framer.com/", src: "/partners/framer.png" },
  { slug: "google", name: "Google", href: "https://www.google.com/", src: "/partners/google.png" },
  { slug: "rainbow", name: "Clay", href: "https://www.clay.com/", src: "/partners/partner-9.png" },
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
// while their top and bottom edges run on the diagonal. Kept shallow so the
// focused cover doesn't sit in a harsh 3D contrast with its neighbours.
const CARD_SHEAR_DEG = 8;
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

const SELECTED_TITLE_ID = "selected-event-title";
const DETAIL_COVER_FRAME =
  "detail-cover aspect-square overflow-hidden rounded-lg bg-surface-muted shadow-[0_12px_28px_rgba(0,0,0,0.18)]";

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
  const depth = selected ? 12 : hovered ? 2 : -6;
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

  return `perspective(2800px) translateX(${part}%) translateZ(${depth}px) scaleX(${squeeze}) skewY(${shear}deg) scale(${scale}) translate(0px, ${lift}px)`;
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
const PHOTO_RAIL_LOOP_COPIES = 3;
// Portrait steps are ~240px; hold that cruise so a wide landscape doesn't
// dump its whole travel in the first frames of a 420ms ease-out.
const PHOTO_RAIL_GLIDE_MS = 420;
const PHOTO_RAIL_GLIDE_REF_PX = 240;
const PHOTO_RAIL_GLIDE_MAX_MS = 720;
// Ease-out is wall-clock. A long frame (decode, React) would otherwise dump
// the missed distance in one paint — the landscape teleport in grid view.
const PHOTO_RAIL_GLIDE_MAX_PX = 36;

function photoRailCycleWidth(rail: HTMLUListElement, count: number) {
  const items = rail.querySelectorAll(":scope > li");
  if (count <= 0 || items.length < count * 2) return 0;
  const mid = items[count] as HTMLElement;
  const nextCopy = items[count * 2] as HTMLElement | undefined;
  // Middle copy is the one on screen; clone copies stay lazy placeholders
  // and would under-report the cycle until they decode.
  if (nextCopy) return nextCopy.offsetLeft - mid.offsetLeft;
  return mid.offsetLeft - (items[0] as HTMLElement).offsetLeft;
}

function photoRailLoopScrollLeft(rail: HTMLUListElement, count: number) {
  const cycleWidth = photoRailCycleWidth(rail, count);
  if (cycleWidth <= 0) return null;
  let left = rail.scrollLeft;
  for (
    let step = 0;
    step < PHOTO_RAIL_LOOP_COPIES && left < cycleWidth * 0.5;
    step += 1
  ) {
    left += cycleWidth;
  }
  for (
    let step = 0;
    step < PHOTO_RAIL_LOOP_COPIES && left > cycleWidth * 1.5;
    step += 1
  ) {
    left -= cycleWidth;
  }
  return { cycleWidth, left };
}

function photoRailItems(rail: HTMLUListElement) {
  return [...rail.querySelectorAll(":scope > li")] as HTMLElement[];
}

function photoRailItemRight(item: HTMLElement) {
  return item.offsetLeft + item.offsetWidth;
}

function photoRailAlignLeft(
  rail: HTMLUListElement,
  item: HTMLElement,
  align: "start" | "end",
) {
  // Visual edges, not offsetLeft/clientWidth: the rail bleeds by the page
  // gutter, and CSS end-snap uses the snapport's painted box. Mixing those
  // left the ease 86px short, then restoring snap jumped the rest.
  const itemBox = item.getBoundingClientRect();
  const port = rail.getBoundingClientRect();
  return align === "start"
    ? rail.scrollLeft + (itemBox.left - port.left)
    : rail.scrollLeft + (itemBox.right - port.right);
}

function photoRailEndAlignLeft(rail: HTMLUListElement, item: HTMLElement) {
  return photoRailAlignLeft(rail, item, "end");
}

function photoRailSnappedItem(
  rail: HTMLUListElement,
  align: "start" | "end" = "end",
) {
  const items = photoRailItems(rail);
  if (items.length === 0) return null;
  const port = rail.getBoundingClientRect();
  const portEdge = align === "end" ? port.right : port.left;
  let best = items[0];
  let bestDist = Infinity;
  for (const item of items) {
    const box = item.getBoundingClientRect();
    const edge = align === "end" ? box.right : box.left;
    const dist = Math.abs(edge - portEdge);
    if (dist < bestDist) {
      bestDist = dist;
      best = item;
    }
  }
  return best;
}

function photoRailStepItem(
  items: HTMLElement[],
  current: HTMLElement,
  direction: -1 | 1,
) {
  const index = items.indexOf(current);
  if (index < 0) return null;
  const next = index + direction;
  return next < 0 || next >= items.length ? null : items[next];
}

function photoRailSeedScrollLeft(
  rail: HTMLUListElement,
  count: number,
  align: "start" | "end" = "end",
) {
  const items = photoRailItems(rail);
  const start = items[count] ? count : 0;
  const origin = items[start];
  if (!origin) return 0;
  let target = origin;
  if (align === "end") {
    const limit = origin.offsetLeft + rail.clientWidth;
    for (let index = start; index < items.length; index += 1) {
      target = items[index];
      if (photoRailItemRight(target) >= limit - 1) break;
    }
  }
  let left = photoRailAlignLeft(rail, target, align);
  const cycleWidth = photoRailCycleWidth(rail, count);
  if (cycleWidth > 0) {
    while (left > cycleWidth * 1.5) left -= cycleWidth;
    while (left < cycleWidth * 0.5) left += cycleWidth;
  }
  return left;
}

function restorePhotoRailChrome(rail: HTMLUListElement) {
  rail.style.removeProperty("scroll-snap-type");
  rail.style.removeProperty("scroll-behavior");
}

function jumpPhotoRailScroll(rail: HTMLUListElement, left: number) {
  if (Math.abs(rail.scrollLeft - left) <= 1) return;
  // Instant wrap has to ignore snap or the jump lands on a neighbour instead
  // of the matching photo in the next copy. Blossom sets scroll-behavior:
  // smooth on the carousel, which would animate this jump as auto-scroll.
  rail.style.setProperty("scroll-snap-type", "none", "important");
  rail.style.setProperty("scroll-behavior", "auto", "important");
  rail.scrollLeft = left;
  restorePhotoRailChrome(rail);
}

let photoRailGlideFrame = 0;

function cancelPhotoRailGlide() {
  cancelAnimationFrame(photoRailGlideFrame);
  photoRailGlideFrame = 0;
}

// Chevron-only ease with snap held off for the whole motion. Native
// behavior:"smooth" still hitch-jumped at the end once mandatory snap
// returned — Chrome retargets the glide, fires scrollend early, then snaps.
function glidePhotoRailScroll(
  rail: HTMLUListElement,
  leftOrGet: number | (() => number),
  reduceMotion: boolean,
  onDone: () => void,
) {
  const destination = () =>
    typeof leftOrGet === "function" ? leftOrGet() : leftOrGet;
  cancelPhotoRailGlide();
  const left0 = destination();
  if (Math.abs(rail.scrollLeft - left0) <= 1) return false;
  if (reduceMotion) {
    jumpPhotoRailScroll(rail, left0);
    return false;
  }
  // Stop Blossom's rAF physics so it cannot write scrollLeft during the ease.
  rail.scrollTo({ left: rail.scrollLeft, behavior: "auto" });
  // [blossom-carousel][has-snap=true] applies --snap-type with !important.
  // Drop the attribute so that rule is inert, then pin snap off for the ease.
  rail.setAttribute("has-snap", "false");
  rail.style.setProperty("scroll-snap-type", "none", "important");
  rail.style.setProperty("scroll-behavior", "auto", "important");
  void rail.offsetWidth;
  const start = rail.scrollLeft;
  const initialDelta = left0 - start;
  const duration = Math.min(
    PHOTO_RAIL_GLIDE_MAX_MS,
    Math.max(
      PHOTO_RAIL_GLIDE_MS,
      (Math.abs(initialDelta) * PHOTO_RAIL_GLIDE_MS) / PHOTO_RAIL_GLIDE_REF_PX,
    ),
  );
  const origin = performance.now();
  const step = (now: number) => {
    const left = destination();
    const t = Math.min(1, (now - origin) / duration);
    const eased = 1 - (1 - t) ** 3;
    const desired = t < 1 ? start + (left - start) * eased : left;
    const remaining = desired - rail.scrollLeft;
    const delta =
      Math.sign(remaining) *
      Math.min(Math.abs(remaining), PHOTO_RAIL_GLIDE_MAX_PX);
    rail.scrollLeft += delta;
    if (Math.abs(rail.scrollLeft - left) > 1) {
      photoRailGlideFrame = requestAnimationFrame(step);
      return;
    }
    photoRailGlideFrame = 0;
    rail.scrollLeft = left;
    onDone();
  };
  photoRailGlideFrame = requestAnimationFrame(step);
  return true;
}

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
  // A chevron's mass sits on the open side, so geometric centering in a
  // round ghost button reads off-axis. Nudge each glyph 1px toward its tip.
  return (
    <svg
      className={
        direction === "left" ? "size-5 -translate-x-px" : "size-5 translate-x-px"
      }
      viewBox="0 0 24 24"
      aria-hidden="true"
    >
      <path
        d={direction === "left" ? "M15 5l-7 7 7 7" : "M9 5l7 7-7 7"}
        fill="none"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="2"
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
  const clampRef = useRef<HTMLDivElement | null>(null);
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
    const clamp = clampRef.current;
    if (!content || !clamp) return;

    const updateOverflow = () => {
      // Expanding grows the clamp to the content, so measuring then would
      // hide "See less". Only the collapsed box tells us if copy is clipped.
      if (isExpanded) return;
      setHasOverflow(content.scrollHeight > clamp.clientHeight + 1);
    };

    updateOverflow();
    const observer = new ResizeObserver(updateOverflow);
    observer.observe(content);
    observer.observe(clamp);

    return () => observer.disconnect();
  }, [summaryHtml, summaryParagraphs, isExpanded]);

  return (
    <>
      <div className="detail-summary-shell relative" ref={containerRef}>
        <div
          className="detail-summary-clamp"
          data-expanded={isExpanded ? "" : undefined}
          id={contentId}
          ref={clampRef}
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
          // Stretch matches the photo-rail column, which ends on the size-8
          // ghost hit targets. A light upward nudge meets the chevron path
          // bottoms without floating the label above the arrow row.
          className="mt-6 shrink-0 leading-none -translate-y-1.5"
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
  // The rail opens on the sixth cover so the shelf reads as a shelf from the
  // first frame, with covers tucked behind the focused one on both sides. An
  // archive too short to have a sixth cover opens on the newest instead of the
  // oldest: the covers then run to the right, which is the end the entrance sweep
  // starts from and the end a reader scrolls towards.
  const initialIndex = initialFocusIndex(initialEvents.length);
  const firstPaintCovers = useMemo(
    () => firstPaintCoverImages(events, initialIndex),
    [events, initialIndex],
  );
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
  // True while the rail is moving under the pointer. CSS :hover would otherwise
  // light the Luma label as the focused cover slides through a parked cursor.
  const railScrolling = useRef(false);
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
  const [photoRailLoops, setPhotoRailLoops] = useState(false);
  const photoRailLoopsRef = useRef(false);
  const photoRailAnimatingRef = useRef(false);
  // One silent jump into the middle copy; after that the rail only moves on
  // user scroll, drag, or chevrons.
  const photoRailPlacedRef = useRef(false);
  const photoRailMidStartRef = useRef(0);
  // True once there is a next photo to scroll to. A short gallery can still
  // fit the column, so arrows follow the loop, not a one-copy overflow check.
  const [isPhotoRailScrollable, setIsPhotoRailScrollable] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  const [loadedPhotos, setLoadedPhotos] = useState<Record<string, true>>({});
  const [photoAspects, setPhotoAspects] = useState<Record<string, string>>({});
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
  const detailLumaUrl = selectedEvent?.luma_url ?? null;
  // The frame paints the same whether or not it is the button that opens the
  // event, so both spellings of the cover share one set of classes.
  const detailCoverImage = selectedEvent ? (
    <img
      className="block size-full select-none border-0 object-cover outline-none"
      // Matches .detail-cover: the cover size times the 1.03 the focused card
      // is scaled by.
      {...sizedImage(selectedEvent.image_url, { width: 280, quality: 76 })}
      alt=""
      draggable="false"
      decoding="async"
      onError={(event) => recoverImage(event.currentTarget)}
    />
  ) : null;
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
  const photoRailCopies = photoRailLoops ? PHOTO_RAIL_LOOP_COPIES : 1;
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

  const setPhotoViewport = useCallback((node: HTMLDivElement | null) => {
    const rail =
      (node?.querySelector("#event-photo-rail") as HTMLUListElement | null) ??
      null;
    detailPhotoRailRef.current = rail;
    setPhotoRailElement(rail);
  }, []);

  const updatePhotoRailBounds = useCallback(
    (rail: HTMLUListElement, wrap = false) => {
      const count = selectedPhotoRenders.length;
      const align = view === "grid" ? "start" : "end";
      const items = rail.querySelectorAll(":scope > li");
      if (count === 0 || items.length < count) {
        photoRailLoopsRef.current = false;
        photoRailPlacedRef.current = false;
        photoRailMidStartRef.current = 0;
        setPhotoRailLoops(false);
        setIsPhotoRailScrollable(false);
        setCanScrollPhotosLeft(false);
        setCanScrollPhotosRight(false);
        return;
      }

      const copies = Math.round(items.length / count);
      const cycleWidth = photoRailCycleWidth(rail, count);
      const overflows =
        copies > 1
          ? cycleWidth > rail.clientWidth + 1
          : rail.scrollWidth > rail.clientWidth + 1;
      // One copy of a short gallery can fit the column and hide the arrows.
      // Loop as soon as there is a next photo so both views can scroll and snap.
      const shouldLoop = count > 1;

      if (shouldLoop !== photoRailLoopsRef.current) {
        photoRailLoopsRef.current = shouldLoop;
        setPhotoRailLoops(shouldLoop);
      }

      setIsPhotoRailScrollable(shouldLoop);

      if (shouldLoop && copies > 1 && cycleWidth > 0) {
        const midStart = (items[count] as HTMLElement).offsetLeft;
        if (!photoRailPlacedRef.current) {
          jumpPhotoRailScroll(
            rail,
            photoRailSeedScrollLeft(rail, count, align),
          );
          photoRailPlacedRef.current = true;
          photoRailMidStartRef.current = (items[count] as HTMLElement)
            .offsetLeft;
        } else {
          const shift = midStart - photoRailMidStartRef.current;
          photoRailMidStartRef.current = midStart;
          // Clone copies expand from 3/4 placeholders to landscape and push
          // the middle copy. Hold the visual still unless a chevron ease is
          // already chasing the live target.
          if (shift && !photoRailAnimatingRef.current) {
            rail.scrollLeft += shift;
          }
          if (wrap && !photoRailAnimatingRef.current) {
            const looped = photoRailLoopScrollLeft(rail, count);
            if (looped) jumpPhotoRailScroll(rail, looped.left);
          }
        }
        setCanScrollPhotosLeft(true);
        setCanScrollPhotosRight(true);
        return;
      }

      setCanScrollPhotosLeft(overflows && rail.scrollLeft > 1);
      setCanScrollPhotosRight(
        overflows && rail.scrollLeft < rail.scrollWidth - rail.clientWidth - 1,
      );
    },
    [selectedPhotoRenders.length, view],
  );

  const updatePhotoRailBoundsFromRef = useCallback(() => {
    const rail = detailPhotoRailRef.current;
    if (rail) updatePhotoRailBounds(rail);
  }, [updatePhotoRailBounds]);

  // Keyed by URL so photos stay revealed when you move between events instead
  // of shimmering again. Aspect is stored separately so loop clones can reserve
  // landscape width before their own <img> decodes.
  const pendingPhotoAspects = useRef<Record<string, string>>({});
  const photoAspectFlush = useRef(0);
  const recordPhotoAspect = useCallback((src: string, width: number, height: number) => {
    if (width <= 0 || height <= 0) return;
    pendingPhotoAspects.current[src] = `${width} / ${height}`;
    if (photoAspectFlush.current) return;
    photoAspectFlush.current = requestAnimationFrame(() => {
      photoAspectFlush.current = 0;
      const batch = pendingPhotoAspects.current;
      pendingPhotoAspects.current = {};
      setPhotoAspects((previous) => {
        let changed = false;
        const next = { ...previous };
        for (const [url, aspect] of Object.entries(batch)) {
          if (next[url] !== aspect) {
            next[url] = aspect;
            changed = true;
          }
        }
        return changed ? next : previous;
      });
    });
  }, []);
  const markPhotoLoaded = useCallback(
    (photoUrl: string, image?: HTMLImageElement | null) => {
      setLoadedPhotos((previous) =>
        previous[photoUrl] ? previous : { ...previous, [photoUrl]: true },
      );
      if (image) recordPhotoAspect(photoUrl, image.naturalWidth, image.naturalHeight);
    },
    [recordPhotoAspect],
  );

  // Warm the current event's photos right away and prefetch the neighbouring
  // events' first few, so moving through the carousel opens galleries without
  // waiting on a fresh download each time. Read natural size off the same
  // fetch so every loop copy can reserve landscape width up front.
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
    const stop = preloadImages([...selectedPhotoRenders, ...neighbourPhotos]);
    let cancelled = false;
    for (const photo of selectedPhotoRenders) {
      const image = new Image();
      const record = () => {
        if (cancelled) return;
        recordPhotoAspect(photo.src, image.naturalWidth, image.naturalHeight);
      };
      image.onload = record;
      if (photo.srcSet) image.srcset = photo.srcSet;
      image.src = photo.src;
      if (image.complete) record();
    }
    return () => {
      cancelled = true;
      stop();
    };
  }, [selectedPhotoRenders, selectedIndex, events, recordPhotoAspect]);

  useLayoutEffect(() => {
    photoRailPlacedRef.current = false;
    photoRailMidStartRef.current = 0;
    if (!photoRailElement) {
      photoRailLoopsRef.current = false;
      setPhotoRailLoops(false);
      setIsPhotoRailScrollable(false);
      setCanScrollPhotosLeft(false);
      setCanScrollPhotosRight(false);
      return;
    }
    updatePhotoRailBounds(photoRailElement);
  }, [photoRailElement, selectedEvent?.id, view, updatePhotoRailBounds]);

  useLayoutEffect(() => {
    if (photoRailElement) updatePhotoRailBounds(photoRailElement);
  }, [photoRailLoops, photoRailElement, updatePhotoRailBounds]);

  useEffect(() => {
    if (!photoRailElement) return;

    const updateBounds = () => updatePhotoRailBounds(photoRailElement);
    const onScrollEnd = () => {
      // Chevron rAF owns restore + wrap. Drag/trackpad wrap here after idle.
      if (photoRailAnimatingRef.current) return;
      updatePhotoRailBounds(photoRailElement, true);
    };
    const observer = new ResizeObserver(updateBounds);

    photoRailElement.addEventListener("scrollend", onScrollEnd);
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
      cancelPhotoRailGlide();
      photoRailElement.removeEventListener("scrollend", onScrollEnd);
      photoRailElement.removeEventListener("load", updateBounds, {
        capture: true,
      });
      observer.disconnect();
    };
  }, [
    photoRailElement,
    selectedEvent?.id,
    photoRailLoops,
    updatePhotoRailBounds,
  ]);

  const scrollPhotoRail = useCallback(
    (direction: -1 | 1) => {
      const rail = detailPhotoRailRef.current;
      if (!rail || photoRailAnimatingRef.current) return;

      const align = view === "grid" ? "start" : "end";
      const items = photoRailItems(rail);
      const current = photoRailSnappedItem(rail, align);
      if (!current) return;
      const next = photoRailStepItem(items, current, direction);
      if (!next) return;

      // Always glide to the next photo, even across a copy boundary. Wrapping
      // mid-step was the instant teleport. Loop fold happens after the ease.
      photoRailAnimatingRef.current = true;
      const gliding = glidePhotoRailScroll(
        rail,
        () => photoRailAlignLeft(rail, next, align),
        Boolean(reduceMotion),
        () => {
          photoRailAnimatingRef.current = false;
          rail.setAttribute("has-snap", "true");
          restorePhotoRailChrome(rail);
          updatePhotoRailBounds(rail, true);
        },
      );
      if (!gliding) {
        photoRailAnimatingRef.current = false;
        updatePhotoRailBounds(rail, true);
      }
    },
    [reduceMotion, updatePhotoRailBounds, view],
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

  const openLuma = useCallback((lumaUrl: string) => {
    window.open(lumaUrl, "_blank", "noopener,noreferrer");
  }, []);

  // A cover out on the wings is a target to bring in; the centred one has
  // already been read, so hitting it again leaves for the event's Luma page.
  const activateEvent = useCallback(
    (index: number) => {
      const centered = pressedFromIndex.current ?? selectedIndex;
      pressedFromIndex.current = null;
      const lumaUrl = events[index]?.luma_url;
      if (centered === index && lumaUrl) {
        openLuma(lumaUrl);
        return;
      }
      selectEvent(index);
    },
    [events, openLuma, selectEvent, selectedIndex],
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
  // while the CSS hover: shadow correctly followed the pointer. Scroll and
  // programmatic centres suppress new hovers so a cover sliding under a
  // parked cursor cannot claim the focused cover's Luma label.
  const hoverCard = useCallback((index: number | null, pointerType: string) => {
    if (pointerType !== "mouse") return;
    if (
      index !== null &&
      (railScrolling.current || isProgrammaticScroll.current)
    ) {
      return;
    }
    setHoveredIndex(index);
  }, []);

  // A selection change means the cover under the pointer is no longer the one
  // the reader hovered into place — drop the hover so the Luma label waits for
  // a fresh pass over the focused cover.
  useEffect(() => {
    setHoveredIndex(null);
  }, [selectedIndex]);

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
        railScrolling.current = false;
      }, 140);
    };

    const handleScroll = () => {
      if (frame !== 0) return;

      frame = requestAnimationFrame(() => {
        frame = 0;
        railScrolling.current = true;
        setHoveredIndex((current) => (current === null ? current : null));
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
      <PageLoader onDone={revealGallery} waitForImages={firstPaintCovers} />

      <SiteHeader reveal />

      <section
        className="intro px-[clamp(20px,6vw,96px)] pt-[clamp(18px,2.5vw,40px)] pb-[clamp(12px,1.6vw,24px)] max-[820px]:pt-5 max-[820px]:pb-3 max-[520px]:pt-4 max-[520px]:pb-2.5"
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
                    // The rail's vertical padding is tied to the underhang it
                    // lends the covers, so it is set in CSS beside it.
                    className="gallery px-[max(8vw,calc((100vw-1440px)/2))] max-[820px]:px-[18vw]"
                    id="event-carousel"
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
                      // JS-driven, not CSS :hover: a cover scrolling under a
                      // parked pointer must not surface the Luma label.
                      const centerHovered = selected && hoveredIndex === index;
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
                            className={`event-card cursor-pointer rounded-lg border-0 bg-white p-0 text-left text-[oklch(98%_0.008_240)] shadow-[0_3px_10px_rgba(0,0,0,0.12)] outline-none focus:shadow-[0_12px_28px_rgba(0,0,0,0.18)] focus-visible:brightness-[0.88] focus-visible:shadow-[0_12px_28px_rgba(0,0,0,0.18)] hover:shadow-[0_14px_30px_rgba(0,0,0,0.14)] aria-pressed:shadow-[0_12px_28px_rgba(0,0,0,0.18)]${centerHovered ? " is-center-hovered" : ""}`}
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
                              {...eventCoverImage(item.image_url)}
                              alt=""
                              draggable="false"
                              decoding="async"
                              loading={
                                Math.abs(distance) > VISIBLE_COVER_RADIUS
                                  ? "lazy"
                                  : "eager"
                              }
                              fetchPriority={
                                Math.abs(distance) <= 1 ? "high" : "auto"
                              }
                              onError={(event) => recoverImage(event.currentTarget)}
                            />
                            <span className="event-card-sheen" aria-hidden />
                          </motion.button>
                          {/* Sits outside the cover so it keeps its own
                              upright box while the cover is scaled and
                              sheared, and so the rail's hover rule can reach
                              it as the cover's next sibling. The cover's own
                              label already carries the destination for
                              readers who never see this one. */}
                          {selected && item.luma_url ? (
                            <span
                              className="cover-luma-hint text-medium text-base text-muted"
                              aria-hidden
                            >
                              View on Luma
                              <ArrowUpRightIcon />
                            </span>
                          ) : null}
                        </li>
                      );
                    })}
                  </ul>
                  <div
                    className="gallery-edge gallery-edge-start"
                    onPointerEnter={(event) =>
                      hoverCard(null, event.pointerType)
                    }
                  >
                    <button
                      type="button"
                      className="gallery-edge-button bg-transparent p-0 text-muted"
                      aria-label="Previous event"
                      aria-controls="event-carousel"
                      disabled={selectedIndex <= 0}
                      onClick={(event) => {
                        selectEvent(selectedIndex - 1);
                        if (event.detail > 0) {
                          event.currentTarget.blur();
                        }
                      }}
                    >
                      <ArrowIcon direction="left" />
                    </button>
                  </div>
                  <div
                    className="gallery-edge gallery-edge-end"
                    onPointerEnter={(event) =>
                      hoverCard(null, event.pointerType)
                    }
                  >
                    <button
                      type="button"
                      className="gallery-edge-button bg-transparent p-0 text-muted"
                      aria-label="Next event"
                      aria-controls="event-carousel"
                      disabled={selectedIndex >= events.length - 1}
                      onClick={(event) => {
                        selectEvent(selectedIndex + 1);
                        if (event.detail > 0) {
                          event.currentTarget.blur();
                        }
                      }}
                    >
                      <ArrowIcon direction="right" />
                    </button>
                  </div>
                </div>

                <div className="gallery-ticker px-[clamp(20px,6vw,96px)] pb-[clamp(32px,4vw,56px)]">
                  <FilmTickerLines
                    items={tickerItems}
                    currentIndex={selectedIndex}
                    readFocus={readGalleryFocus}
                    onSelect={selectEvent}
                    label="Past event timeline"
                  />
                  {/* Mobile only: the under-cover hint sits between the rail and
                      the ticks on wider screens, but a phone puts the ticks
                      right under the covers, so the caption drops below them. */}
                  {detailLumaUrl ? (
                    <span
                      className="gallery-luma-hint text-medium text-base text-muted"
                      aria-hidden
                    >
                      View on Luma
                      <ArrowUpRightIcon />
                    </span>
                  ) : null}
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
              // Instant exit: mode="wait" holds each outgoing panel for the
              // full exit before mounting the next, so scrubbing the rail
              // queues those exits and the description falls seconds behind
              // the centred card. Dropping the exit duration keeps the panel
              // within a frame of the selection while the enter fade stays.
              exit={reduceMotion ? undefined : { opacity: 0, transition: { duration: 0 } }}
              transition={{
                duration: reduceMotion ? 0 : 0.18,
                ease: "easeOut",
              }}
            >
              {view === "grid" ? (
                <div className="detail-cover-slot">
                  {/* The cover reads the same as the focused one in the rail, so
                      it takes the same click: an event with a Luma page hangs it
                      on the frame itself rather than on a link elsewhere. */}
                  {detailLumaUrl ? (
                    <button
                      className={`${DETAIL_COVER_FRAME} cursor-pointer appearance-none border-0 p-0 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink`}
                      type="button"
                      aria-label={`Open ${selectedEvent.title} on Luma`}
                      onClick={() => openLuma(detailLumaUrl)}
                    >
                      {detailCoverImage}
                    </button>
                  ) : (
                    <div className={DETAIL_COVER_FRAME}>{detailCoverImage}</div>
                  )}
                  {detailLumaUrl ? (
                    <span
                      className="cover-luma-hint text-medium text-base text-muted"
                      aria-hidden
                    >
                      View on Luma
                      <ArrowUpRightIcon />
                    </span>
                  ) : null}
                </div>
              ) : null}
              <div className="detail-primary">
              <div className="detail-title">
                <h2
                  className="m-0 text-balance text-[clamp(1.75rem,2.6vw,2.5rem)] font-bold leading-[1.15] tracking-[-0.06em] text-black"
                  id={SELECTED_TITLE_ID}
                >
                  {selectedEvent.title}
                </h2>
                <div className="detail-facts">
                  {/* Date reads as the title's eyebrow; place and chips follow.
                      Classes let CSS reorder the stack without changing markup. */}
                  <p className="detail-fact-line m-0 flex flex-wrap items-baseline gap-x-4 text-base leading-6">
                    {selectedEvent.location ? (
                      <span className="detail-place text-muted">
                        <span className="sr-only">Location: </span>
                        {selectedEvent.location}
                      </span>
                    ) : null}
                    <span className="detail-date text-subtle">
                      <span className="sr-only">Date: </span>
                      {selectedEvent.date_label}
                    </span>
                  </p>
                  <ul
                    className="detail-chips m-0 gap-2.5 p-0 max-[820px]:mt-0.5"
                    aria-label="Sponsors"
                  >
                    {sponsors.length > 0 ? (
                      sponsors.map((sponsor) => {
                        const chipContent = (
                          <>
                            <span className="sr-only">Sponsor: </span>
                            {sponsor.logo_url ? (
                              <img
                                className="sponsor-logo overflow-hidden rounded-sm border-0 outline-none"
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
                </div>
              </div>
              {showEventGallery ? (
              <div className="detail-extras pt-[var(--detail-extra-gap)]">
                <section
                  className="detail-photos"
                  aria-label="Event gallery"
                >
                  <div
                    className="detail-photo-viewport"
                    ref={setPhotoViewport}
                  >
                  <BlossomCarousel
                    as="ul"
                    className="detail-photo-list m-0 touch-pan-x p-0 focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-ink"
                    id="event-photo-rail"
                    tabIndex={0}
                    aria-label={`${selectedEvent.title} gallery, horizontally scrollable`}
                  >
                    {Array.from({ length: photoRailCopies }, (_, copy) =>
                    selectedPhotoRenders.map((photo, photoIndex) => {
                      const isClone = photoRailCopies > 1 && copy !== 1;
                      return (
                      <li
                        key={`${selectedEvent.id}-${copy}-${photoIndex}`}
                        className="leading-none"
                        data-blossom-slide=""
                        aria-hidden={isClone ? true : undefined}
                      >
                        <button
                          type="button"
                          className="detail-photo-frame relative flex overflow-hidden rounded-md border-0 bg-transparent p-0 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink"
                          data-loaded={loadedPhotos[photo.src] ? "true" : "false"}
                          style={
                            photoAspects[photo.src]
                              ? ({
                                  "--photo-aspect": photoAspects[photo.src],
                                } as CSSProperties)
                              : undefined
                          }
                          tabIndex={isClone ? -1 : undefined}
                          aria-label={`Open photo ${photoIndex + 1} of ${selectedPhotoRenders.length} at full size`}
                          onClick={() =>
                            openLightbox(
                              photoIndex % selectedPhotoRenders.length,
                            )
                          }
                        >
                          <img
                            className="detail-photo h-[clamp(230px,58vw,300px)] w-auto max-w-[min(82vw,640px)] rounded-md border-0 bg-surface-muted object-contain min-[821px]:h-[clamp(240px,20vw,310px)] min-[821px]:max-w-none"
                            src={photo.src}
                            srcSet={photo.srcSet}
                            alt={`${selectedEvent.title} event photo ${photoIndex + 1} of ${selectedPhotoRenders.length}`}
                            loading={isClone || photoIndex >= 3 ? "lazy" : "eager"}
                            decoding="async"
                            // A cached photo can finish before hydration
                            // attaches onLoad, which would leave the
                            // placeholder up for good.
                            ref={(node) => {
                              if (node?.complete && node.naturalWidth > 0) {
                                markPhotoLoaded(photo.src, node);
                              }
                            }}
                            onLoad={(event) => {
                              markPhotoLoaded(photo.src, event.currentTarget);
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
                      );
                    })
                    )}
                  </BlossomCarousel>
                  </div>
                  {isPhotoRailScrollable ? (
                    <div className="detail-photo-arrows mt-[clamp(12px,1.5vw,22px)] flex items-center justify-end">
                      <div
                        className="flex gap-2"
                        role="group"
                        aria-label="Event photo controls"
                      >
                        <IconButton
                          aria-label="Previous event photo"
                          aria-controls="event-photo-rail"
                          className="size-8 -ml-3"
                          variant="ghost"
                          tone="muted"
                          disabled={photoRailLoops ? false : !canScrollPhotosLeft}
                          onClick={() => scrollPhotoRail(-1)}
                        >
                          <ArrowIcon direction="left" />
                        </IconButton>
                        <IconButton
                          aria-label="Next event photo"
                          aria-controls="event-photo-rail"
                          className="size-8 -mr-3"
                          variant="ghost"
                          tone="muted"
                          disabled={photoRailLoops ? false : !canScrollPhotosRight}
                          onClick={() => scrollPhotoRail(1)}
                        >
                          <ArrowIcon direction="right" />
                        </IconButton>
                      </div>
                    </div>
                  ) : null}
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
              </div>
              <div className="detail-meta">
                <ExpandableSummary
                  summaryHtml={summaryHtml}
                  summaryParagraphs={summaryParagraphs}
                  eventId={selectedEvent.id}
                />
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
            {showRecentEvents
              ? "We keep our Luma updated with all of our latest events. Stay tuned to be the first to hear about the next one!"
              : "RSVP on Luma to join us at the next Design Meetup."}
          </p>
          <Primary
            className="gap-2"
            href="https://luma.com/designmeetup"
            target="_blank"
            rel="noreferrer"
            variant="ink"
          >
            <img
              className="size-5 brightness-0 invert"
              src="/luma-logo.svg"
              alt=""
              aria-hidden="true"
            />
            Follow our Luma
          </Primary>
        </ScrollReveal>
        <ScrollReveal
          className="upcoming-events-embed overflow-hidden rounded-[20px]"
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
                We are a community of the world’s most ambitious young creatives.
              </p>
              <p className="m-0 text-pretty">
                In December 2025, Design Meetup was just an idea. A month later, we hosted our first event with 50 designers. And now, we’ve brought together 10,000+ people across 30 events in NY, LA, and the Bay Area.
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
              <li key={partner.slug}>
                <a
                  className="partner-tile rounded-[10px] bg-surface-muted"
                  href={partner.href}
                  target="_blank"
                  rel="noreferrer"
                  aria-label={partner.name}
                >
                  <img
                    className={`partner-logo partner-logo--${partner.slug} border-0 outline-none`}
                    src={partner.src}
                    alt=""
                    loading="lazy"
                  />
                </a>
              </li>
            ))}
          </ul>
        </ScrollReveal>
      </section>

      <FoundersNote />

      <section
        className="apply-cta bg-surface px-[clamp(20px,6vw,96px)] pt-[80px] pb-[clamp(48px,6vw,80px)] text-black max-[820px]:pt-[40px]"
        id="apply"
        aria-labelledby="apply-cta-title"
      >
        <ScrollReveal className="apply-copy">
          <h2
            className="m-0 text-balance text-[clamp(3.5rem,6vw,5rem)] font-bold leading-[1.05] tracking-[-0.06em] text-black max-[520px]:text-[clamp(2.75rem,12vw,3.75rem)]"
            id="apply-cta-title"
          >
            Applications opening soon
          </h2>
        </ScrollReveal>
        <ScrollReveal className="apply-follow" delay={80}>
          <div className="grid w-full max-w-[54ch] gap-5 text-base leading-[1.6] text-body">
            <p className="m-0 text-pretty">
              We'll be opening up applications for the next Design Meetup member cohort soon. If you're a student or early career designer, we'd love to meet you.
            </p>
            <div className="grid gap-3">
              <p className="m-0 text-pretty">
                Drop your email, and we'll let you know when applications open.
              </p>
              <ApplyNotifyForm />
            </div>
            <p className="m-0 mt-5 text-pretty">
              Follow us on Instagram and Substack to stay updated!
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Primary
              className="group gap-2"
              variant="secondary"
              href="https://www.instagram.com/designmeetup/"
              target="_blank"
              rel="noreferrer"
            >
              <span className="relative size-5">
                <InstagramIcon className="size-5 transition-opacity duration-150 ease-out group-hover:opacity-0 group-focus-visible:opacity-0 motion-reduce:transition-none" />
                <InstagramIcon
                  branded
                  className="absolute inset-0 size-5 opacity-0 transition-opacity duration-150 ease-out group-hover:opacity-100 group-focus-visible:opacity-100 motion-reduce:transition-none"
                />
              </span>
              Instagram
            </Primary>
            <Primary
              className="group gap-2"
              variant="secondary"
              href="https://designmeetup.substack.com/"
              target="_blank"
              rel="noreferrer"
            >
              <SubstackIcon className="size-5 transition-colors duration-150 ease-out group-hover:text-[#FF6719] group-focus-visible:text-[#FF6719] motion-reduce:transition-none" />
              Substack
            </Primary>
          </div>
        </ScrollReveal>
      </section>

      <PhotoMarquee events={events} />

      <SiteFooter />
    </main>
  );
}
