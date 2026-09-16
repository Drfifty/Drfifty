// محوّل المستأجرين — 6 سياقات — MASTER_HQ + 5 تطبيقات — توكنات + RTL + Inertia
// Phase 4.0 Part 2: App Isolation — يبدّل app_id ويعيد توجيه الحافة
import { router, usePage } from "@inertiajs/react";
import type { SharedPageProps } from "@/Types/global.d";
import type { AppId } from "@/Types";
import { cn } from "@/Services/cn";

export type TenantOption = "MASTER_HQ" | AppId;

const options: { value: TenantOption; label: string; short: string }[] = [
  { value: "MASTER_HQ", label: "المركز الرئيسي", short: "HQ" },
  { value: "AU BUSINESS", label: "AU BUSINESS", short: "B2B" },
  { value: "AU MED", label: "AU MED", short: "MED" },
  { value: "AU DEALS", label: "AU DEALS", short: "DEALS" },
  { value: "AU SERV", label: "AU SERV", short: "SERV" },
  { value: "AU INVEST", label: "AU INVEST", short: "INVEST" },
];

export interface MultiTenantSwitcherProps {
  className?: string;
  onSwitch?: (next: TenantOption) => void;
}

export default function MultiTenantSwitcher({ className, onSwitch }: MultiTenantSwitcherProps) {
  const { props } = usePage<SharedPageProps>();
  const current: TenantOption = (props.app_id as TenantOption) ?? "MASTER_HQ";
  const isMaster = current === "MASTER_HQ" || props.tenant?.app_id === undefined;

  const switchTo = (next: TenantOption): void => {
    if (next === current) return;
    onSwitch?.(next);
    // حافة مسار موحّد — الخادم يضبط app_id عبر HandleInertiaRequests
    if (next === "MASTER_HQ") router.visit("/admin", { preserveState: false });
    else router.visit(`/switch?app_id=${encodeURIComponent(next)}`, { preserveState: false });
  };

  return (
    <div className={cn("inline-flex flex-wrap gap-1 rounded-[var(--radius-pill)] bg-[var(--surface-secondary)] p-1", className)} role="tablist" aria-label="اختيار التطبيق">
      {options.map((o) => {
        const active = (isMaster && o.value === "MASTER_HQ") || current === o.value;
        return (
          <button
            key={o.value}
            role="tab"
            aria-selected={active}
            onClick={() => switchTo(o.value)}
            className={cn(
              "rounded-[var(--radius-pill)] px-3 py-1.5 text-micro font-bold transition-colors focus-ring",
              active ? "bg-[var(--brand-gold)] text-black shadow-[var(--shadow-elevation-sm)]" : "text-[var(--text-secondary)] hover:bg-[var(--surface-primary)] hover:text-[var(--text-primary)]",
            )}
          >
            <span className="hidden sm:inline">{o.label}</span>
            <span className="sm:hidden">{o.short}</span>
          </button>
        );
      })}
    </div>
  );
}
