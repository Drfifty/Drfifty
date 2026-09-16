// بطاقة زجاجية موحدة — Obsidian خارجي / Pearl داخلي
// تحقق التوازن الهجين: حاوية داكنة + مكونات داخلية فاتحة — بدون ألوان ثابتة في الصفحات
import type { HTMLAttributes, PropsWithChildren } from "react";
import { cn } from "@/Services/cn";

type Level = "outer" | "inner" | "inner-strong";
type Accent = "default" | "cyan" | "emerald" | "amber" | "crimson";

interface Props extends HTMLAttributes<HTMLDivElement> {
  level?: Level;
  accent?: Accent;
  interactive?: boolean; // يفعّل proximity glow
  padding?: "none" | "sm" | "md" | "lg";
}

const levelMap: Record<Level, string> = {
  outer: "glass-outer rounded-[var(--radius-lg)]",
  inner: "glass-inner rounded-[var(--radius-md)] text-[var(--text-on-pearl)]",
  "inner-strong": "glass-pearl-strong rounded-[var(--radius-md)] text-[var(--text-on-pearl)]",
};

const accentMap: Record<Accent, string> = {
  default: "",
  cyan: "border-l-2 border-l-[var(--accent-cyan)]",
  emerald: "border-l-2 border-l-[var(--accent-emerald)]",
  amber: "border-l-2 border-l-[var(--accent-amber)]",
  crimson: "border-l-2 border-l-[var(--brand-crimson)]",
};

const paddingMap = {
  none: "p-0",
  sm: "p-3",
  md: "p-4",
  lg: "p-6",
};

export default function GlassCard({
  children,
  level = "outer",
  accent = "default",
  interactive = false,
  padding = "md",
  className,
  ...props
}: PropsWithChildren<Props>) {
  return (
    <div
      // الألوان والظلال والتمويه كلها من tokens.css — الصفحات تمرّر level فقط
      className={cn(
        "relative overflow-hidden metallic",
        levelMap[level],
        accentMap[accent],
        paddingMap[padding],
        interactive && "proximity-glow prox",
        className,
      )}
      {...props}
    >
      {children}
    </div>
  );
}
