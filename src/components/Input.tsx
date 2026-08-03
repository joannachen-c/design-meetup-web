import type { InputHTMLAttributes } from "react";

type InputProps = InputHTMLAttributes<HTMLInputElement>;

export function Input({ className = "", ...props }: InputProps) {
  const inputClassName = [
    "min-h-11 w-full rounded-[10px] border-0 bg-surface-muted px-4 py-2.5 text-left text-base font-normal text-ink disabled:cursor-not-allowed disabled:opacity-50",
    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-primary",
    className,
  ]
    .filter(Boolean)
    .join(" ");

  return <input className={inputClassName} {...props} />;
}
