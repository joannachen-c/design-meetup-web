"use client";

import { type CSSProperties, useEffect, useRef, useState } from "react";
import { advisorCompanies } from "./talent-content";
import styles from "./TalentPage.module.css";

const pad = (value: number) => String(value).padStart(2, "0");

export function AdvisorWall() {
  const listRef = useRef<HTMLUListElement>(null);
  const [scrolledIndex, setScrolledIndex] = useState(0);
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const activeIndex = hoveredIndex ?? scrolledIndex;

  // A one-pixel band just above the middle of the viewport: whichever company
  // crosses it is the one lit, so the highlight moves down the list at exactly
  // the pace the reader scrolls it.
  useEffect(() => {
    const items = listRef.current?.children;
    if (!items) return;

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue;
          setScrolledIndex(Number((entry.target as HTMLElement).dataset.index));
        }
      },
      { rootMargin: "-45% 0px -55% 0px" },
    );
    for (const item of Array.from(items)) observer.observe(item);
    return () => observer.disconnect();
  }, []);

  return (
    <div className={styles.wallLayout}>
      <div className={styles.wallAside}>
        <h2
          className="m-0 text-base font-normal text-muted text-medium"
          id="network-title"
        >
          Where our Board of Advisors designs
        </h2>
        <p className={styles.wallCounter} aria-hidden="true">
          <span className="text-ink">{pad(activeIndex + 1)}</span> /{" "}
          {pad(advisorCompanies.length)}
        </p>
      </div>
      <ul
        ref={listRef}
        className={styles.wall}
        aria-labelledby="network-title"
        onPointerLeave={() => setHoveredIndex(null)}
      >
        {advisorCompanies.map((company, index) => (
          <li
            key={company.name}
            className={styles.wallItem}
            data-index={index}
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
    </div>
  );
}
