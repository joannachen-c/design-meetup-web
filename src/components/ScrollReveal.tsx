import { type ReactNode, useEffect, useRef } from "react";

import { observeReplayReveal } from "../lib/replay-reveal";

export function ScrollReveal({
  children,
  delay = 0,
  className = "",
  repeat = false,
}: {
  children: ReactNode;
  delay?: number;
  className?: string;
  /** Replay the reveal on every pass instead of settling after the first. */
  repeat?: boolean;
}) {
  const ref = useRef<HTMLDivElement>(null);

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
      ref={ref}
      className={`scroll-reveal ${className}`}
      style={{ transitionDelay: `${delay}ms` }}
    >
      {children}
    </div>
  );
}
