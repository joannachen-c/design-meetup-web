import type { HTMLAttributes, ReactNode } from "react";

const variantClassName = {
  neutral: "bg-surface-muted text-muted",
  danger: "bg-red-50 text-red-700",
} as const;

export type ToastVariant = keyof typeof variantClassName;

type ToastProps = {
  children: ReactNode;
  className?: string;
  variant?: ToastVariant;
} & Pick<HTMLAttributes<HTMLParagraphElement>, "role">;

export function Toast({
  children,
  className = "",
  role,
  variant = "neutral",
}: ToastProps) {
  const resolvedRole = role ?? (variant === "danger" ? "alert" : "status");

  return (
    <p
      role={resolvedRole}
      className={[
        "m-0 w-fit max-w-full rounded-[11px] px-4 py-3 text-base",
        variantClassName[variant],
        className,
      ]
        .filter(Boolean)
        .join(" ")}
    >
      {children}
    </p>
  );
}
