// شريط جانبي قابل للطي — 10 أجنحة إدارية — توكنات + RTL + RBAC purge
import { usePage } from "@inertiajs/react";
import type { SharedPageProps } from "@/Types/global.d";
import type { SuiteNav } from "@/Types/admin.d";
import { cn } from "@/Services/cn";

const suites: SuiteNav[] = [
  { key: "c-suite", label: "AI C-Suite & Swarm Governance", icon: "🤖", path: "/admin/c-suite" },
  { key: "ledger", label: "Consolidated Ledger, Escrow & Tax Vault", icon: "🏦", path: "/admin/ledger" },
  { key: "monetization", label: "Monetization, Paywall & Subscriptions", icon: "💳", path: "/admin/monetization" },
  { key: "taxonomy", label: "Dynamic Taxonomy, Schema & Form Builder", icon: "🗂️", path: "/admin/taxonomy" },
  { key: "loyalty", label: "Loyalty, Barter & Merchant HQ", icon: "🎁", path: "/admin/loyalty" },
  { key: "disputes", label: "Disputes, SLA & Support HQ", icon: "⚖️", path: "/admin/disputes" },
  { key: "hr", label: "Enterprise HR, Micro-Permissions & Audit", icon: "👥", path: "/admin/hr" },
  { key: "security", label: "Security, DRM, Quarantine & Poison Pill Vault", icon: "🛡️", path: "/admin/security" },
  { key: "telemetry", label: "System Telemetry, Ephemeral Swarms & Failover", icon: "📡", path: "/admin/telemetry" },
  { key: "broadcast", label: "Broadcast Studio, Ads & Geo-Dispatch", icon: "📢", path: "/admin/broadcast" },
];

export default function MasterSidebar({ collapsed, onToggle }: { collapsed: boolean; onToggle: () => void }) {
  const { props } = usePage<SharedPageProps>();
  const allowed = new Set(props.permissions ?? []);
  return (
    <aside className={cn("glass-outer flex flex-col transition-all", collapsed ? "w-[64px]" : "w-[280px]")} aria-label="Master Sidebar">
      <button onClick={onToggle} className="m-2 rounded-[var(--radius-md)] border border-[var(--border-main)] bg-[var(--surface-secondary)] px-2 py-1 text-micro">{collapsed ? "»" : "« طي"}</button>
      <nav className="flex-1 space-y-1 overflow-auto p-2">
        {suites
          .filter((s) => !s.permission || allowed.has(s.permission))
          .map((s) => (
            <a key={s.key} href={s.path} className="flex items-center gap-3 rounded-[var(--radius-md)] px-3 py-2 text-body hover:bg-[var(--surface-secondary)] focus-ring">
              <span aria-hidden>{s.icon}</span>
              {!collapsed && <span className="text-start text-micro font-medium">{s.label}</span>}
            </a>
          ))}
      </nav>
      <div className="border-t border-[var(--border-main)] p-3 text-micro text-[var(--text-secondary)]">{!collapsed && "10 Suites • RBAC purge • RTL"}</div>
    </aside>
  );
}
