"use client";

import {
  type CSSProperties,
  type PointerEvent,
  useEffect,
  useRef,
  useState,
} from "react";
import { advisorCompanies } from "./talent-content";
import styles from "./TalentPage.module.css";

// The row nearest this line (as a share of the viewport) is the one lit.
const READING_LINE = 0.45;

export function AdvisorWall() {
  const listRef = useRef<HTMLUListElement>(null);
  const [scrolledIndex, setScrolledIndex] = useState(0);
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const activeIndex = hoveredIndex ?? scrolledIndex;

  // Measured once per frame rather than by an observer: a fast touch fling
  // can skip a thin observer band entirely, which left the highlight stuck and
  // then jumping several rows at once on phones.
  useEffect(() => {
    const list = listRef.current;
    if (!list) return;
    const items = Array.from(list.children) as HTMLElement[];

    let frame = 0;
    const update = () => {
      frame = 0;
      const line = window.innerHeight * READING_LINE;
      let nearest = 0;
      let nearestDistance = Number.POSITIVE_INFINITY;
      items.forEach((item, index) => {
        const rect = item.getBoundingClientRect();
        const distance = Math.abs(rect.top + rect.height / 2 - line);
        if (distance < nearestDistance) {
          nearest = index;
          nearestDistance = distance;
        }
      });
      setScrolledIndex(nearest);
    };
    const schedule = () => {
      if (!frame) frame = requestAnimationFrame(update);
    };

    update();
    window.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", schedule);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("scroll", schedule);
      window.removeEventListener("resize", schedule);
    };
  }, []);

  const itemProps = (index: number) => ({
    className: styles.wallItem,
    "data-active": index === activeIndex || undefined,
    onPointerEnter: (event: PointerEvent) => {
      if (event.pointerType === "mouse") setHoveredIndex(index);
    },
  });

  return (
    <div className={styles.wallBlock}>
      <h2 className={styles.wallTitle} id="network-title">
        Our network designs at
      </h2>
      <ul
        ref={listRef}
        className={styles.wall}
        aria-labelledby="network-title"
        onPointerLeave={() => setHoveredIndex(null)}
      >
        {advisorCompanies.map((company, index) => (
          <li key={company.name} {...itemProps(index)}>
            <span
              className={styles.mark}
              data-fit={company.fit}
              style={
                {
                  background: company.background,
                  "--mark-size": company.size,
                } as CSSProperties
              }
            >
              <img
                src={company.src}
                alt=""
                width={96}
                height={96}
                loading="lazy"
                decoding="async"
              />
            </span>
            {company.name}
          </li>
        ))}
        <li {...itemProps(advisorCompanies.length)}>
          <span className={styles.markSpacer} aria-hidden="true" />& more
        </li>
      </ul>
    </div>
  );
}
