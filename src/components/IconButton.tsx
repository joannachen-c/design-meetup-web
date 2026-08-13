import type { ButtonHTMLAttributes, ReactNode } from "react";

type IconButtonProps = Omit<
  ButtonHTMLAttributes<HTMLButtonElement>,
  "children"
> & {
  "aria-label": string;
  children: ReactNode;
  variant?: IconButtonVariant;
  tone?: IconButtonTone;
};

const variantClassName = {
  solid: "bg-surface-muted hover:not-disabled:bg-gray-300",
  ghost: "bg-transparent hover:not-disabled:bg-surface-muted",
} as const;

// The colour lives here rather than in `className` so a caller never has to
// fight the base `text-*` utility for precedence.
const toneClassName = {
  ink: "text-ink",
  muted: "text-muted hover:not-disabled:text-ink",
  subtle: "text-subtle hover:not-disabled:text-ink",
} as const;

type IconButtonVariant = keyof typeof variantClassName;
type IconButtonTone = keyof typeof toneClassName;

export function IconButton({
  "aria-label": ariaLabel,
  children,
  className = "",
  type = "button",
  variant = "solid",
  tone = "ink",
  onClick,
  ...props
}: IconButtonProps) {
  const buttonClassName = [
    "grid appearance-none cursor-pointer place-items-center rounded-full border-0 p-0 leading-none",
    // Drop the default when the caller passes a size utility; both would fight.
    /(?:^|\s)size-/.test(className) ? "" : "size-9",
    variantClassName[variant],
    toneClassName[tone],
    "transition-[background-color,color,transform,opacity] duration-150 ease-out active:not-disabled:scale-[0.96]",
    "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink",
    "disabled:cursor-not-allowed disabled:opacity-[0.32] disabled:active:scale-100",
    className,
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <button
      {...props}
      aria-label={ariaLabel}
      className={buttonClassName}
      type={type}
      onClick={(event) => {
        onClick?.(event);
        if (event.detail > 0) {
          event.currentTarget.blur();
        }
      }}
    >
      {children}
    </button>
  );
}
