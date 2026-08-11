"use client";

import { type RefObject, useEffect, useState } from "react";

export type ReplayRevealOptions = {
  /** Fraction of the element that must be on screen before the reveal plays. */
  amount?: number;
  /** How far ahead of the viewport edge the reveal may start, in pixels. */
  margin?: number;
};

/**
 * Reports when a reveal that replays on every pass should be playing.
 *
 * Revealing and rewinding deliberately happen at different boundaries. The
 * element reveals once `amount` of it is on screen, but only rewinds once it
 * has left the viewport completely. Sharing one boundary for both is what lets
 * a reveal undo its own trigger: an entrance transform changes how much of the
 * element overlaps the viewport, so the reveal can push the element back across
 * the very threshold that started it. Anywhere else on the page the next scroll
 * event breaks the tie, but at the very bottom the scroll offset is pinned at
 * its maximum and cannot move away from the boundary, so the two states alternate
 * forever. The gap between the two boundaries is what makes that impossible.
 */
export function observeReplayReveal(
  element: Element,
  onChange: (revealed: boolean) => void,
  { amount = 0, margin = 0 }: ReplayRevealOptions = {},
): () => void {
  if (typeof IntersectionObserver === "undefined") {
    onChange(true);
    return () => {};
  }

  let revealed = false;
  const set = (next: boolean) => {
    if (next === revealed) return;
    revealed = next;
    onChange(next);
  };

  const enterObserver = new IntersectionObserver(
    ([entry]) => {
      if (!entry.isIntersecting) return;
      // Once the element's top edge has passed the top of the viewport the
      // reader has plainly arrived at it, even if it never manages to show
      // `amount` of itself. Anything close enough to the end of the document
      // runs the page out of scroll before it can, so without this the reveal
      // would never fire for a reader who lands directly at the bottom.
      if (
        entry.intersectionRatio >= amount ||
        entry.boundingClientRect.top <= 0
      ) {
        set(true);
      }
    },
    { rootMargin: `${margin}px`, threshold: amount > 0 ? [0, amount] : 0 },
  );

  // No margin here, so the rewind waits for the element to clear the real
  // viewport rather than the expanded one the reveal fires against.
  const exitObserver = new IntersectionObserver(
    ([entry]) => {
      if (!entry.isIntersecting) set(false);
    },
    { threshold: 0 },
  );

  enterObserver.observe(element);
  exitObserver.observe(element);

  return () => {
    enterObserver.disconnect();
    exitObserver.disconnect();
  };
}

/** React binding for {@link observeReplayReveal}. */
export function useReplayInView<T extends Element>(
  ref: RefObject<T | null>,
  { amount = 0, margin = 0 }: ReplayRevealOptions = {},
): boolean {
  const [revealed, setRevealed] = useState(false);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;
    return observeReplayReveal(element, setRevealed, { amount, margin });
  }, [ref, amount, margin]);

  return revealed;
}
