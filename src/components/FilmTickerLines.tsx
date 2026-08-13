"use client";

import {
  useCallback,
  useEffect,
  useRef,
  type PointerEvent as ReactPointerEvent,
} from "react";

export type FilmTickerItem = {
  id: string;
  label?: string;
};

export type FilmTickerFocus = {
  /** Fractional active index, e.g. 2.4 between items 2 and 3. */
  index: number;
  /** Scroll velocity in pixels per second. */
  velocity: number;
};

type FilmTickerLinesProps = {
  items: readonly FilmTickerItem[];
  currentIndex: number;
  /**
   * Read continuous scroll progress once per frame. Without it the ticker
   * tracks currentIndex and every scroll frame would re-render the page.
   */
  readFocus?: () => FilmTickerFocus;
  onSelect: (index: number) => void;
  label?: string;
  className?: string;
};

const TICK_HIT_WIDTH = 6;
const TICK_GAP = 8;
const TICK_PITCH = TICK_HIT_WIDTH + TICK_GAP;
const TICK_WIDTH = 2;
const RAIL_GUTTER = 64;

const IDLE_HEIGHT = 18;
const PROXIMITY_HEIGHT = 6;
const SELECTED_MULTIPLIER = 2;
const HOVER_HEIGHT = 10;

// Ticks are colored through inline styles, so they read the design system
// variables directly rather than duplicating the values.
const ACTIVE_COLOR = "var(--color-gray-500)";
const IDLE_COLOR = "var(--color-gray-300)";
const DISTANCE_LIMIT = 6;
const HOVER_DISTANCE_LIMIT = 4;
const IDLE_LERP_FLOOR = 0.14;
const TRANSITION_MS = 300;

const MAX_TICK_HEIGHT = Math.ceil(
  (IDLE_HEIGHT + PROXIMITY_HEIGHT) * SELECTED_MULTIPLIER + HOVER_HEIGHT,
);
/** Vertical padding inside each tick's hit area (matches `py-1.5`). */
const TICK_HIT_PAD_Y = 6;
/**
 * Ticks are bottom-anchored and grow upward, so the row reserves the tallest
 * state up front. A content-sized row would push every tick down on hover.
 */
const ROW_HEIGHT = MAX_TICK_HEIGHT + TICK_HIT_PAD_Y * 2;
/** Room for the 2px focus ring plus its 2px offset outside the hit area. */
const FOCUS_RING_ROOM = 4;

function rowWidth(count: number) {
  if (count <= 0) return 0;
  return count * TICK_HIT_WIDTH + (count - 1) * TICK_GAP;
}

function tickCenter(slot: number) {
  return slot * TICK_PITCH + TICK_HIT_WIDTH / 2;
}

function proximityHeight(distance: number, base: number, intensity: number) {
  if (Math.abs(distance) > DISTANCE_LIMIT) return base;
  const normalized = 1 - Math.abs(distance) / DISTANCE_LIMIT;
  return base + intensity * normalized * normalized;
}

function hoverBonus(distance: number) {
  if (Math.abs(distance) > HOVER_DISTANCE_LIMIT) return 0;
  const normalized = 1 - Math.abs(distance) / HOVER_DISTANCE_LIMIT;
  return HOVER_HEIGHT * normalized * normalized;
}

function lerp(current: number, target: number, amount: number) {
  return current + (target - current) * amount;
}

function smoothHeight(current: number, target: number, velocity: number) {
  const velocityFactor = Math.min(1, Math.abs(velocity) / TRANSITION_MS);
  return lerp(current, target, Math.max(velocityFactor, IDLE_LERP_FLOOR));
}

export function FilmTickerLines({
  items,
  currentIndex,
  readFocus,
  onSelect,
  label = "Timeline",
  className = "",
}: FilmTickerLinesProps) {
  const width = rowWidth(items.length);

  const viewportRef = useRef<HTMLDivElement>(null);
  const railRef = useRef<HTMLDivElement>(null);
  const tablistRef = useRef<HTMLDivElement>(null);
  const tickRefs = useRef<(HTMLSpanElement | null)[]>([]);
  const heightsRef = useRef<number[]>([]);
  const hoveredIndexRef = useRef<number | null>(null);
  const scrubbingRef = useRef(false);
  const lastScrubIndexRef = useRef(-1);

  const resolveIndex = useCallback(
    (clientX: number) => {
      const tablist = tablistRef.current;
      if (!tablist || items.length === 0) return 0;
      const relativeX = clientX - tablist.getBoundingClientRect().left;
      return Math.max(
        0,
        Math.min(items.length - 1, Math.round(relativeX / TICK_PITCH)),
      );
    },
    [items.length],
  );

  const selectFromPointer = useCallback(
    (clientX: number) => {
      const index = resolveIndex(clientX);
      if (index !== lastScrubIndexRef.current) {
        lastScrubIndexRef.current = index;
        onSelect(index);
      }
    },
    [onSelect, resolveIndex],
  );

  useEffect(() => {
    let frameId = 0;

    const animate = () => {
      const focus = readFocus?.() ?? { index: currentIndex, velocity: 0 };
      const focalIndex = focus.index;
      const viewport = viewportRef.current;
      const rail = railRef.current;

      // A viewport that measures zero has no centre to hold the focal tick
      // against, and centring on it would park the whole row at the left edge.
      if (viewport && rail && viewport.clientWidth > 0) {
        const focalX = RAIL_GUTTER + tickCenter(focalIndex);
        rail.style.transform = `translate3d(${
          viewport.clientWidth / 2 - focalX
        }px, 0, 0)`;
      }

      if (heightsRef.current.length !== items.length) {
        heightsRef.current = Array.from(
          { length: items.length },
          () => IDLE_HEIGHT,
        );
      }

      for (let index = 0; index < items.length; index += 1) {
        let target = proximityHeight(
          focalIndex - index,
          IDLE_HEIGHT,
          PROXIMITY_HEIGHT,
        );

        if (index === currentIndex) {
          target *= SELECTED_MULTIPLIER;
        }

        const hovered = hoveredIndexRef.current;
        if (hovered !== null) {
          target += hoverBonus(index - hovered);
        }

        const next = smoothHeight(
          heightsRef.current[index] ?? IDLE_HEIGHT,
          target,
          focus.velocity,
        );
        heightsRef.current[index] = next;

        const tick = tickRefs.current[index];
        if (tick) {
          tick.style.height = `${next}px`;
          tick.style.backgroundColor =
            index === currentIndex ? ACTIVE_COLOR : IDLE_COLOR;
        }
      }

      frameId = requestAnimationFrame(animate);
    };

    frameId = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(frameId);
  }, [currentIndex, items.length, readFocus]);

  const handlePointerDown = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (event.pointerType === "mouse") return;
    event.currentTarget.setPointerCapture(event.pointerId);
    scrubbingRef.current = true;
    selectFromPointer(event.clientX);
    event.preventDefault();
  };

  const handlePointerMove = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (!scrubbingRef.current) return;
    selectFromPointer(event.clientX);
    event.preventDefault();
  };

  const stopScrubbing = () => {
    scrubbingRef.current = false;
    lastScrubIndexRef.current = -1;
  };

  if (items.length === 0) return null;

  return (
    <div
      ref={viewportRef}
      className={`film-ticker relative w-full max-w-full overflow-hidden ${className}`}
      role="group"
      aria-label={label}
      style={{ paddingBlock: FOCUS_RING_ROOM }}
    >
      <div ref={railRef} className="flex w-max min-w-0 will-change-transform">
        <div
          className="flex min-w-0"
          style={{ minWidth: width + RAIL_GUTTER * 2 }}
        >
          <div className="shrink-0" style={{ width: RAIL_GUTTER }} aria-hidden="true" />

          <div
            ref={tablistRef}
            role="tablist"
            className="flex shrink-0 items-end"
            style={{
              width,
              gap: TICK_GAP,
              height: ROW_HEIGHT,
              touchAction: "none",
            }}
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={stopScrubbing}
            onPointerCancel={stopScrubbing}
            onLostPointerCapture={stopScrubbing}
          >
            {items.map((item, index) => {
              const active = index === currentIndex;

              return (
                <button
                  key={item.id}
                  type="button"
                  role="tab"
                  aria-selected={active}
                  aria-label={
                    item.label
                      ? `${item.label}, item ${index + 1} of ${items.length}`
                      : `Item ${index + 1} of ${items.length}`
                  }
                  onClick={() => onSelect(index)}
                  onPointerEnter={(event) => {
                    if (event.pointerType !== "mouse") return;
                    hoveredIndexRef.current = index;
                  }}
                  onPointerLeave={(event) => {
                    if (event.pointerType !== "mouse") return;
                    hoveredIndexRef.current = null;
                  }}
                  className="flex shrink-0 cursor-pointer items-end justify-center rounded-sm border-0 bg-transparent p-0 outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink"
                  style={{
                    width: TICK_HIT_WIDTH,
                    paddingBlock: TICK_HIT_PAD_Y,
                  }}
                >
                  <span
                    ref={(element) => {
                      tickRefs.current[index] = element;
                    }}
                    className="block rounded-full"
                    style={{
                      width: TICK_WIDTH,
                      height: IDLE_HEIGHT,
                      backgroundColor: active ? ACTIVE_COLOR : IDLE_COLOR,
                    }}
                  />
                </button>
              );
            })}
          </div>

          <div className="shrink-0" style={{ width: RAIL_GUTTER }} aria-hidden="true" />
        </div>
      </div>
    </div>
  );
}
