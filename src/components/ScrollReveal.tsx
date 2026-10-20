import {
  type CSSProperties,
  type ReactNode,
  useEffect,
  useRef,
} from "react";

import { observeReplayReveal } from "../lib/replay-reveal";

export function ScrollReveal({
  children,
  delay = 0,
  className = "",
  style,
  repeat = false,
  elementRef,
}: {
  children: ReactNode;
  delay?: number;
  className?: string;
  style?: CSSProperties;
  elementRef?: { current: HTMLDivElement | null };
  /** Replay the reveal on every pass instead of settling after the first. */
  repeat?: boolean;
}) {
  const ref = useRef<HTMLDivElement>(null);

  function assignRef(node: HTMLDivElement | null) {
    ref.current = node;
    if (typeof elementRef === "function") {
      elementRef(node);
      return;
    }
    if (elementRef) elementRef.current = node;
  }

  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    // Held in an object so the reveal callback can stop the observers on the
    // very first notification, which arrives after this assignment.
    const observation = { stop: () => {} };

    observation.stop = observeReplayReveal(
      element,
      (revealed) => {
        if (revealed) {
          element.classList.add("is-visible");
          if (!repeat) observation.stop();
          return;
        }
        // Rewinding only once the element is fully past the viewport keeps the
        // reset off screen, so the next pass starts from the top of the motion.
        if (repeat) element.classList.remove("is-visible");
      },
      { margin: 40 },
    );

    return () => observation.stop();
  }, [repeat]);

  return (
    <div
      ref={assignRef}
      className={`scroll-reveal ${className}`}
      style={{ transitionDelay: `${delay}ms`, ...style }}
    >
      {children}
    </div>
  );
}
