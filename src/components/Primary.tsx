import {
  Children,
  isValidElement,
  type MouseEventHandler,
  type ReactNode,
} from "react";

type PrimaryProps = {
  children: ReactNode;
  className?: string;
  disabled?: boolean;
  fullWidth?: boolean;
  href?: string;
  loading?: boolean;
  onClick?: MouseEventHandler<HTMLButtonElement>;
  rel?: string;
  target?: string;
  type?: "button" | "submit" | "reset";
  variant?: "primary" | "secondary" | "ghost";
  "aria-pressed"?: boolean;
};

export function Primary({
  children,
  className: providedClassName = "",
  disabled = false,
  fullWidth = false,
  href,
  loading = false,
  onClick,
  rel,
  target,
  type = "button",
  variant = "primary",
  "aria-pressed": ariaPressed,
}: PrimaryProps) {
  const isDisabled = disabled || loading;
  const childArray = Children.toArray(children);
  const hasLeadingIcon = isValidElement(childArray[0]);
  const hasTrailingIcon = isValidElement(childArray.at(-1));
  const className = [
    "text-medium relative inline-flex min-h-11 w-fit cursor-pointer items-center justify-start rounded-[10px] border-0 px-4 py-2.5 text-left text-base leading-[1.2] no-underline",
    "transition-[background-color,transform,opacity] duration-150 ease-out active:scale-[0.97]",
    "focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-ink",
    "disabled:cursor-not-allowed disabled:opacity-50 disabled:active:scale-100 aria-disabled:cursor-not-allowed aria-disabled:opacity-50 aria-disabled:active:scale-100",
    variant === "ghost"
      ? "bg-transparent text-gray-500 hover:bg-surface-muted active:bg-gray-200 disabled:hover:bg-transparent disabled:active:bg-transparent aria-disabled:hover:bg-transparent aria-disabled:active:bg-transparent"
      : variant === "primary"
        ? "bg-accent-primary text-ink hover:bg-accent-hover disabled:hover:bg-accent-primary aria-disabled:hover:bg-accent-primary"
        : "bg-surface-muted text-ink hover:bg-gray-300 disabled:hover:bg-surface-muted aria-disabled:hover:bg-surface-muted",
    variant === "secondary" && hasLeadingIcon ? "pl-[14px]" : "",
    variant === "secondary" && hasTrailingIcon ? "pr-[14px]" : "",
    fullWidth ? "w-full" : "",
    providedClassName,
  ]
    .filter(Boolean)
    .join(" ");

  const content = (
    <>
      <span
        className={`inline-flex items-center gap-[inherit] ${loading ? "opacity-0" : ""}`}
      >
        {children}
      </span>
      {loading ? (
        <span
          className="absolute inset-0 grid place-items-center"
          aria-hidden="true"
        >
          <svg
            className="size-4 animate-spin motion-reduce:animate-none"
            viewBox="0 0 24 24"
            fill="none"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="9"
              stroke="currentColor"
              strokeWidth="3"
            />
            <path
              className="opacity-80"
              d="M21 12a9 9 0 0 0-9-9"
              stroke="currentColor"
              strokeLinecap="round"
              strokeWidth="3"
            />
          </svg>
        </span>
      ) : null}
    </>
  );

  return href ? (
    <a
      className={className}
      href={isDisabled ? undefined : href}
      target={target}
      rel={rel}
      aria-busy={loading || undefined}
      aria-disabled={isDisabled || undefined}
      tabIndex={isDisabled ? -1 : undefined}
    >
      {content}
    </a>
  ) : (
    <button
      className={className}
      type={type}
      disabled={isDisabled}
      aria-busy={loading || undefined}
      aria-pressed={ariaPressed}
      onClick={onClick}
    >
      {content}
    </button>
  );
}
