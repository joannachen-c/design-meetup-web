import type { SVGProps } from "react";

export function ArrowUpRightIcon({
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
        d="M5 11 11 5M6 5h5v5"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.5"
      />
    </svg>
  );
}
