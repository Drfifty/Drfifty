// شارة حالة موحدة — 6 حالات معيارية — توكنات فقط + RTL
// Phase 4.0 Part 2: Verified/Pending/Danger/VIP/Anonymous/AI_Active
import { cn } from "@/Services/cn";

export type BadgeState = "Verified" | "Pending" | "Danger" | "VIP" | "Anonymous" | "AI_Active";

export interface StatusBadgeProps {
  state: BadgeState;
  label?: string;
  dot?: boolean;
  className?: string;
}

const stateMap: Record<BadgeState, string> = {
  Verified: "bg-[var(--accent-emerald)] text-white border-transparent",
  Pending: "bg-[var(--accent-amber)] text-black border-transparent",
  Danger: "bg-[var(--brand-crimson)] text-white border-transparent",
  VIP: "bg-[var(--brand-gold)] text-black border-transparent",
  Anonymous: "bg-[var(--surface-secondary)] text-[var(--text-secondary)] border border-[var(--border-main)]",
  AI_Active: "bg-[var(--accent-cyan)] text-white border-transparent shadow-[var(--shadow-elevation-sm)]",
};

const labelMap: Record<BadgeState, string> = {
  Verified: "موثّق",
  Pending: "قيد المراجعة",
  Danger: "خطر",
  VIP: "VIP",
  Anonymous: "مجهول",
  AI_Active: "AI نشط",
};

export default function StatusBadge({ state, label, dot = false, className }: StatusBadgeProps) {
  return (
    <span className={cn("inline-flex items-center gap-1.5 rounded-[var(--radius-pill)] border px-2.5 py-1 text-micro font-bold", stateMap[state], className)}>
      {dot && <span aria-hidden className="h-2 w-2 rounded-full bg-current opacity-80" />}
      {label ?? labelMap[state]}
    </span>
  );
}
