// شريط جانبي قابل للطي — FIX-P1-10: Inertia Link + lucide + RBAC permission + aria-current — توكنات + RTL
import { Link, usePage } from "@inertiajs/react";
import type { SharedPageProps } from "@/Types/global.d";
import type { SuiteNav } from "@/Types/admin.d";
import { cn } from "@/Services/cn";
import { Bot, Landmark, CreditCard, FolderTree, Gift, Scale, Users, Shield, Radio, Megaphone } from "lucide-react";

const iconMap: Record<string, React.ElementType> = { "c-suite": Bot, ledger: Landmark, monetization: CreditCard, taxonomy: FolderTree, loyalty: Gift, disputes: Scale, hr: Users, security: Shield, telemetry: Radio, broadcast: Megaphone };

const suites: SuiteNav[] = [
  { key: "c-suite", label: "AI C-Suite & Swarm Governance", icon: "🤖", path: "/admin/c-suite", permission: "governance.c-suite.view" },
  { key: "ledger", label: "Consolidated Ledger, Escrow & Tax Vault", icon: "🏦", path: "/admin/ledger", permission: "finance.ledger.view" },
  { key: "monetization", label: "Monetization, Paywall & Subscriptions", icon: "💳", path: "/admin/monetization", permission: "finance.monetization.view" },
  { key: "taxonomy", label: "Dynamic Taxonomy, Schema & Form Builder", icon: "🗂️", path: "/admin/taxonomy", permission: "taxonomy.view" },
  { key: "loyalty", label: "Loyalty, Barter & Merchant HQ", icon: "🎁", path: "/admin/loyalty", permission: "loyalty.view" },
  { key: "disputes", label: "Disputes, SLA & Support HQ", icon: "⚖️", path: "/admin/disputes", permission: "disputes.view" },
  { key: "hr", label: "Enterprise HR, Micro-Permissions & Audit", icon: "👥", path: "/admin/hr", permission: "hr.view" },
  { key: "security", label: "Security, DRM, Quarantine & Poison Pill Vault", icon: "🛡️", path: "/admin/security", permission: "security.view" },
  { key: "telemetry", label: "System Telemetry, Ephemeral Swarms & Failover", icon: "📡", path: "/admin/telemetry", permission: "telemetry.view" },
  { key: "broadcast", label: "Broadcast Studio, Ads & Geo-Dispatch", icon: "📢", path: "/admin/broadcast", permission: "broadcast.view" },
];

export default function MasterSidebar({ collapsed, onToggle }: { collapsed: boolean; onToggle: () => void }) {
  const { props, url } = usePage<SharedPageProps & { url?: string }>();
  const allowed = new Set([...(props.permissions ?? []), ...(props.tenant?.permissions ?? [])]);
  // super_admin sees all even if permissions empty — Gate::before parity
  const isSuper = allowed.has("super_admin") || props.auth?.user?.roles?.includes("super_admin");
  return (
    <aside className={cn("glass-outer flex flex-col transition-all", collapsed ? "w-[64px]" : "w-[280px]")} aria-label="Master Sidebar" aria-expanded={!collapsed}>
      <button onClick={onToggle} aria-expanded={!collapsed} aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"} className="m-2 rounded-[var(--radius-md)] border border-[var(--border-main)] bg-[var(--surface-secondary)] px-2 py-1 text-micro focus-ring">{collapsed ? "»" : "« طي"}</button>
      <nav className="flex-1 space-y-1 overflow-auto p-2">
        {suites
          .filter((s) => isSuper || !s.permission || allowed.has(s.permission))
          .map((s) => {
            const Icon = iconMap[s.key] ?? Bot;
            const active = typeof url === "string" ? url.startsWith(s.path) : false;
            return (
              <Link key={s.key} href={s.path} prefetch aria-current={active ? "page" : undefined} className={cn("flex items-center gap-3 rounded-[var(--radius-md)] px-3 py-2 text-body hover:bg-[var(--surface-secondary)] focus-ring", active && "bg-[var(--surface-secondary)] font-semibold")}>
                <Icon size={18} aria-hidden />
                {!collapsed && <span className="text-start text-micro font-medium">{s.label}</span>}
              </Link>
            );
          })}
      </nav>
      <div className="border-t border-[var(--border-main)] p-3 text-micro text-[var(--text-secondary)]">{!collapsed && "10 Suites • RBAC purge • RTL • lucide"}</div>
    </aside>
  );
}
