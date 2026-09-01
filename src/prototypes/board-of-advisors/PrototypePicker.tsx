"use client";

import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type KeyboardEvent as ReactKeyboardEvent,
} from "react";

import "./proto-picker.css";

type PrototypePickerProps = {
  variants: readonly { name: string }[];
  current: number;
  onChange: (index: number) => void;
  onReplay: () => void;
  showReplay?: boolean;
};

export function PrototypePicker({
  variants,
  current,
  onChange,
  onReplay,
  showReplay = true,
}: PrototypePickerProps) {
  const pickerRef = useRef<HTMLElement>(null);
  const highlightRef = useRef<HTMLSpanElement>(null);
  const itemRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const [ready, setReady] = useState(false);

  const moveHighlight = useCallback(() => {
    const highlight = highlightRef.current;
    const item = itemRefs.current[current];
    if (!highlight || !item) return;
    highlight.style.width = `${item.offsetWidth}px`;
    highlight.style.transform = `translateX(${item.offsetLeft}px)`;
  }, [current]);

  useLayoutEffect(() => {
    moveHighlight();
  }, [moveHighlight]);

  useEffect(() => {
    const frame = requestAnimationFrame(() => {
      requestAnimationFrame(() => setReady(true));
    });
    return () => cancelAnimationFrame(frame);
  }, []);

  useEffect(() => {
    const onResize = () => moveHighlight();
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, [moveHighlight]);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      const target = event.target;
      if (
        target instanceof HTMLInputElement ||
        target instanceof HTMLTextAreaElement ||
        target instanceof HTMLSelectElement ||
        (target instanceof HTMLElement && target.isContentEditable)
      ) {
        return;
      }
      if (event.metaKey || event.ctrlKey || event.altKey) return;

      const num = parseInt(event.key, 10);
      if (num >= 1 && num <= variants.length) {
        onChange(num - 1);
      } else if (event.key === "ArrowRight") {
        onChange((current + 1) % variants.length);
      } else if (event.key === "ArrowLeft") {
        onChange((current - 1 + variants.length) % variants.length);
      } else if (event.key === "r" || event.key === "R") {
        onReplay();
      }
    };

    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [current, onChange, onReplay, variants.length]);

  const handleKeyDown = (event: ReactKeyboardEvent<HTMLElement>) => {
    if (event.key === "ArrowRight" || event.key === "ArrowLeft") {
      event.preventDefault();
    }
  };

  return (
    <nav
      ref={pickerRef}
      className="proto-picker"
      aria-label="Prototype variants"
      data-ready={ready ? "" : undefined}
      onKeyDown={handleKeyDown}
    >
      <span ref={highlightRef} className="proto-picker-highlight" aria-hidden="true" />
      {variants.map((variant, index) => (
        <button
          key={variant.name}
          ref={(node) => {
            itemRefs.current[index] = node;
          }}
          type="button"
          className="proto-picker-item"
          data-active={index === current ? "" : undefined}
          aria-current={index === current ? "true" : undefined}
          onClick={() => onChange(index)}
        >
          {variant.name}
        </button>
      ))}
      {showReplay ? (
        <>
          <span className="proto-picker-divider" aria-hidden="true" />
          <button
            type="button"
            className="proto-picker-item proto-picker-replay"
            aria-label="Replay animation (R)"
            onClick={onReplay}
          >
            ↻
          </button>
        </>
      ) : null}
    </nav>
  );
}
