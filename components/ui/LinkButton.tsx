"use client";

/**
 * Simple link styled as a button. Use for primary/secondary CTAs.
 */

import Link from "next/link";

type Variant = "primary" | "secondary" | "ghost";

interface LinkButtonProps {
  href: string;
  children: React.ReactNode;
  variant?: Variant;
  className?: string;
}

const variants: Record<Variant, string> = {
  primary:
    "bg-cyan-500 text-black font-semibold hover:bg-cyan-400 active:bg-cyan-600",
  secondary:
    "border border-zinc-600 text-zinc-200 hover:bg-zinc-800 active:bg-zinc-700",
  ghost: "text-zinc-400 hover:text-white hover:bg-zinc-800",
};

export function LinkButton({
  href,
  children,
  variant = "primary",
  className = "",
}: LinkButtonProps) {
  return (
    <Link
      href={href}
      className={
        "inline-flex items-center justify-center rounded-xl px-5 py-2.5 text-sm transition-colors " +
        variants[variant] +
        " " +
        className
      }
    >
      {children}
    </Link>
  );
}
