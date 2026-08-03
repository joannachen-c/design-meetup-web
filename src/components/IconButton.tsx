import type { ButtonHTMLAttributes, ReactNode } from "react";

type IconButtonProps = Omit<
  ButtonHTMLAttributes<HTMLButtonElement>,
  "children"
> & {
  "aria-label": string;
  children: ReactNode;
};

export function IconButton({
  "aria-label": ariaLabel,
  children,
  className = "",
  type = "button",
  ...props
}: IconButtonProps) {
  const buttonClassName = [
    "grid size-9 cursor-pointer place-items-center rounded-full border-0 bg-surface-muted p-2 text-ink",
    "transition-[background-color,transform,opacity] duration-150 ease-out hover:not-disabled:bg-gray-300 active:not-disabled:scale-[0.96]",
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
    >
      {children}
    </button>
  );
}
