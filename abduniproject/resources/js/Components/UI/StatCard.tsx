// بطاقة إحصائية ذرية — Pearl داخلية بعنونة Obsidian
// كل الألوان عبر tokens — تبديل اللون يغير Dashboard بالكامل
import { cn } from "@/Services/cn";

interface Props {
  label: string;
  value: string;
  hint?: string;
  accent?: "cyan" | "emerald" | "amber" | "crimson";
  className?: string;
}

const accentBar: Record<NonNullable<Props["accent"]>, string> = {
  cyan: "bg-[var(--accent-cyan)]",
  emerald: "bg-[var(--accent-emerald)]",
  amber: "bg-[var(--accent-amber)]",
  crimson: "bg-[var(--brand-crimson)]",
};

export default function StatCard({ label, value, hint, accent = "cyan", className }: Props) {
  return (
    <div
      className={cn(
        "glass-inner rounded-[var(--radius-md)] p-4 relative overflow-hidden",
        className,
      )}
    >
      <div className={cn("absolute top-0 inset-inline-start-0 h-1 w-full", accentBar[accent])} aria-hidden />
      <p className="text-micro text-[var(--text-secondary)]">{label}</p>
      <p className="mt-1 text-section font-bold text-[var(--text-on-pearl)] tabular-nums">{value}</p>
      {hint && <p className="mt-1 text-micro text-[var(--text-secondary)]">{hint}</p>}
    </div>
  );
}
