import Link from "next/link";
import type { ComponentProps } from "react";

type Variant = "primary" | "secondary" | "ghost" | "danger";

const base =
  "inline-flex items-center justify-center gap-2 rounded-sm px-5 py-2.5 text-sm font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-50";

const variants: Record<Variant, string> = {
  primary: "bg-forest text-fog hover:bg-forest-soft",
  secondary: "border border-forest text-forest hover:bg-forest hover:text-fog",
  ghost: "text-forest underline-offset-4 hover:underline",
  danger: "bg-danger text-paper hover:opacity-90",
};

export function buttonClass(variant: Variant = "primary", extra = "") {
  return `${base} ${variants[variant]} ${extra}`;
}

export function Button({
  variant = "primary",
  className = "",
  ...props
}: ComponentProps<"button"> & { variant?: Variant }) {
  return <button className={buttonClass(variant, className)} {...props} />;
}

export function ButtonLink({
  variant = "primary",
  className = "",
  ...props
}: ComponentProps<typeof Link> & { variant?: Variant }) {
  return <Link className={buttonClass(variant, className)} {...props} />;
}
