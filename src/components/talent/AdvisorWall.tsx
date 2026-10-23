"use client";

import { type CSSProperties, useEffect, useRef, useState } from "react";
import { advisorCompanies } from "./talent-content";
import styles from "./TalentPage.module.css";

// The highlight walks the wall while its top travels from 70% of the viewport
// down to where its bottom reaches 30%, so the first company is lit as the wall
// arrives and the last one as it leaves.
const START_RATIO = 0.7;
const END_RATIO = 0.3;

function scrollIndex(list: HTMLElement, count: number) {
  const rect = list.getBoundingClientRect();
  const start = window.innerHeight * START_RATIO;
  const end = window.innerHeight * END_RATIO;
  const travel = rect.height + start - end;
  const progress = Math.min(Math.max((start - rect.top) / travel, 0), 1);
  return Math.min(count - 1, Math.floor(progress * count));
}

export function AdvisorWall() {
  const listRef = useRef<HTMLUListElement>(null);
  const [scrolledIndex, setScrolledIndex] = useState(0);
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const activeIndex = hoveredIndex ?? scrolledIndex;

  useEffect(() => {
    const list = listRef.current;
    if (!list) return;

    let frame = 0;
    const update = () => {
      frame = 0;
      setScrolledIndex(scrollIndex(list, advisorCompanies.length));
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

  return (
    <ul
      ref={listRef}
      className={styles.wall}
      aria-label="Companies where our Board of Advisors design"
      onPointerLeave={() => setHoveredIndex(null)}
    >
      {advisorCompanies.map((company, index) => (
        <li
          key={company.name}
          className={styles.wallItem}
          data-active={index === activeIndex || undefined}
          onPointerEnter={(event) => {
            if (event.pointerType === "mouse") setHoveredIndex(index);
          }}
        >
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
    </ul>
  );
}
