import type { SVGProps } from "react";

export function SoundOnIcon({
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
        d="M8.5 2.5 4.75 5.5H2.5v5h2.25L8.5 13.5v-11Z"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.5"
      />
      <path
        d="M11.25 5.75a3.25 3.25 0 0 1 0 4.5M13.25 3.75a6 6 0 0 1 0 8.5"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.5"
      />
    </svg>
  );
}

export function SoundOffIcon({
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
        d="M8.5 2.5 4.75 5.5H2.5v5h2.25L8.5 13.5v-11Z"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.5"
      />
      <path
        d="m11.25 6.25 3.25 3.5M14.5 6.25l-3.25 3.5"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.5"
      />
    </svg>
  );
}
