import type { InputHTMLAttributes } from "react";

type InputProps = InputHTMLAttributes<HTMLInputElement>;

export function Input({ className = "", ...props }: InputProps) {
  const inputClassName = [
    "min-h-11 w-full rounded-[10px] border-0 bg-[oklch(96.7%_0.003_264.542)] px-4 py-2.5 text-left text-base text-[oklch(22%_0.025_250)]",
    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-400",
    className,
  ]
    .filter(Boolean)
    .join(" ");

  return <input className={inputClassName} {...props} />;
}
