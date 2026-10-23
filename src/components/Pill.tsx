import type { ReactNode } from "react";

const variantClassName = {
  neutral: "bg-surface-muted text-gray-700",
  white: "bg-white text-ink",
  accent: "bg-accent-primary text-ink",
  ink: "bg-ink text-white",
  muted: "bg-surface-muted text-muted",
  attention: "bg-red-50 text-red-700",
} as const;

export type PillVariant = keyof typeof variantClassName;

/** Small, non-interactive label: a tag, status or category. */
export function Pill({
  children,
  className = "",
  variant = "neutral",
}: {
  children: ReactNode;
  className?: string;
  variant?: PillVariant;
}) {
  return (
    <span
      className={[
        "text-medium inline-flex w-fit shrink-0 items-center rounded-full px-2.5 py-1 text-sm leading-none",
        variantClassName[variant],
        className,
      ]
        .filter(Boolean)
        .join(" ")}
    >
      {children}
    </span>
  );
}
