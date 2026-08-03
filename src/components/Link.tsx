import type {
  AnchorHTMLAttributes,
  ButtonHTMLAttributes,
  ReactNode,
} from "react";

type LinkBaseProps = {
  children: ReactNode;
  className?: string;
  href?: string;
};

type AnchorLinkProps = LinkBaseProps &
  Omit<AnchorHTMLAttributes<HTMLAnchorElement>, keyof LinkBaseProps> & {
    href: string;
  };

type ButtonLinkProps = LinkBaseProps &
  Omit<ButtonHTMLAttributes<HTMLButtonElement>, keyof LinkBaseProps> & {
    href?: undefined;
  };

type LinkProps = AnchorLinkProps | ButtonLinkProps;

export function Link({
  children,
  className: providedClassName = "",
  href,
  ...props
}: LinkProps) {
  const className = [
    "text-medium cursor-pointer border-0 bg-transparent p-0 text-left text-base text-[oklch(53%_0.025_250)] no-underline",
    "transition-colors duration-150 hover:text-[oklch(22%_0.025_250)]",
    "focus-visible:underline focus-visible:decoration-2 focus-visible:underline-offset-4",
    providedClassName,
  ]
    .filter(Boolean)
    .join(" ");

  return href ? (
    <a
      {...(props as Omit<AnchorLinkProps, keyof LinkBaseProps>)}
      className={className}
      href={href}
    >
      {children}
    </a>
  ) : (
    <button
      {...(props as Omit<ButtonLinkProps, keyof LinkBaseProps>)}
      className={className}
      type={(props as ButtonLinkProps).type ?? "button"}
    >
      {children}
    </button>
  );
}
