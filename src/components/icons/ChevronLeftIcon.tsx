import type { SVGProps } from "react";

export function ChevronLeftIcon({
  className = "size-4 shrink-0",
  ...props
}: SVGProps<SVGSVGElement>) {
  return (
    <svg
      aria-hidden="true"
      className={className}
      fill="none"
      viewBox="0 0 16 16"
      {...props}
    >
      <path
        d="m9.5 4-4 4 4 4"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="2"
      />
    </svg>
  );
}
