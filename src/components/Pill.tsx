import type { ReactNode } from "react";

const variantClassName = {
  default: "bg-surface-muted text-ink",
  muted: "bg-surface-muted text-muted",
  attention: "bg-red-50 text-red-700",
} as const;

export type PillVariant = keyof typeof variantClassName;

export type PillProps = {
  children: ReactNode;
  variant?: PillVariant;
  className?: string;
};

export function Pill({ children, variant = "default", className = "" }: PillProps) {
  const pillClassName = [
    "inline-flex h-8 items-center rounded-full px-3.5 text-sm font-bold",
    variantClassName[variant],
    className,
  ]
    .filter(Boolean)
    .join(" ");

  return <span className={pillClassName}>{children}</span>;
}
