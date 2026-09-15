// شارة موحدة — حالات مجالية بألوان رمزية فقط
import type { HTMLAttributes } from "react";
import { cn } from "@/Services/cn";

type Variant = "default" | "obsidian" | "cyan" | "emerald" | "amber" | "crimson" | "pearl";
type Size = "sm" | "md";

interface Props extends HTMLAttributes<HTMLSpanElement> {
  variant?: Variant;
  size?: Size;
  dot?: boolean;
}

const variantMap: Record<Variant, string> = {
  default: "bg-[var(--surface-secondary)] text-[var(--text-secondary)] border border-[var(--border-main)]",
  obsidian: "bg-[var(--canvas-background)] text-white border border-[var(--border-main)]",
  cyan: "bg-[var(--accent-cyan)] text-white border border-transparent",
  emerald: "bg-[var(--accent-emerald)] text-white border border-transparent",
  amber: "bg-[var(--accent-amber)] text-black border border-transparent",
  crimson: "bg-[var(--brand-crimson)] text-white border border-transparent",
  pearl: "bg-[var(--surface-pearl-strong)] text-[var(--text-on-pearl)] border border-[var(--border-pearl)]",
};

export default function Badge({ variant = "default", size = "sm", dot = false, className, children, ...props }: Props) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-[var(--radius-pill)] border font-bold",
        size === "sm" ? "px-2 py-1 text-micro" : "px-2.5 py-1.5 text-body",
        variantMap[variant],
        className,
      )}
      {...props}
    >
      {dot && <span aria-hidden className="h-2 w-2 rounded-full bg-current opacity-80" />}
      {children}
    </span>
  );
}
