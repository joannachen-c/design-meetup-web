import type { ReactNode } from "react";

const baseClassName =
  "inline-flex items-center gap-2 rounded-full px-3.5 py-2 text-base leading-6 text-body";

const variantClassName = {
  solid: "bg-surface-muted",
  outline: "border border-gray-200 bg-transparent",
} as const;

type ChipVariant = keyof typeof variantClassName;

type ChipBaseProps = {
  children: ReactNode;
  className?: string;
  variant?: ChipVariant;
};

type StaticChipProps = ChipBaseProps & {
  href?: undefined;
  rel?: never;
  target?: never;
};

type LinkChipProps = ChipBaseProps & {
  href: string;
  rel?: string;
  target?: string;
};

export type ChipProps = StaticChipProps | LinkChipProps;

export function Chip({
  children,
  className = "",
  href,
  variant = "solid",
  ...props
}: ChipProps) {
  const chipClassName = [baseClassName, variantClassName[variant], className]
    .filter(Boolean)
    .join(" ");

  if (href === undefined) {
    return <span className={chipClassName}>{children}</span>;
  }

  return (
    <a
      className={`${chipClassName} cursor-pointer no-underline transition-[background-color,transform] duration-150 ease-out hover:bg-gray-200 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink active:scale-[0.97] active:bg-gray-300`}
      href={href}
      {...props}
    >
      {children}
    </a>
  );
}
