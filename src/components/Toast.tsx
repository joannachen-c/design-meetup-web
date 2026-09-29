import type { HTMLAttributes, ReactNode } from "react";

const variantClassName = {
  neutral: "bg-surface-muted text-muted",
  success: "bg-green-50 text-green-700",
  danger: "bg-red-50 text-red-700",
} as const;

export type ToastVariant = keyof typeof variantClassName;

type ToastProps = {
  children: ReactNode;
  className?: string;
  icon?: ReactNode;
  variant?: ToastVariant;
} & Pick<HTMLAttributes<HTMLDivElement>, "role">;

export function ToastCheckIcon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 16 16"
      fill="none"
      aria-hidden
    >
      <path
        d="M3 8.2 6.2 11.4 13 4.4"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function Toast({
  children,
  className = "",
  icon,
  role,
  variant = "neutral",
}: ToastProps) {
  const resolvedRole = role ?? (variant === "danger" ? "alert" : "status");

  return (
    <div
      role={resolvedRole}
      className={[
        "m-0 inline-flex w-fit max-w-full items-center gap-3 rounded-[11px] px-4 py-3 text-base font-normal",
        variantClassName[variant],
        className,
      ]
        .filter(Boolean)
        .join(" ")}
    >
      {icon ? <span className="inline-flex shrink-0">{icon}</span> : null}
      {children}
    </div>
  );
}
