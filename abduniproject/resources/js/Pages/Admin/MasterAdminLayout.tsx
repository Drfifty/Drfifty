// تخطيط HQ الرئيسي — Header ثابت + Sidebar قابل للطي + محتوى — توكنات + RTL
import { useState } from "react";
import type { PropsWithChildren } from "react";
import MasterAdminHeader from "./MasterAdminHeader";
import MasterSidebar from "./MasterSidebar";
import type { CalibratorHealth, FreezeModule } from "@/Types/admin.d";
import type { AppId } from "@/Types";

const initialHealth: CalibratorHealth = { score: 96, status: "green", workers: 12, deterministic_ratio: 90, latency_ms: 42, token_budget: 78 };
const initialModules: FreezeModule[] = [
  { app_id: "AU BUSINESS", enabled: true, is_core: true, load_pct: 62 },
  { app_id: "AU MED", enabled: true, is_core: false, load_pct: 71 },
  { app_id: "AU DEALS", enabled: true, is_core: false, load_pct: 68 },
  { app_id: "AU SERV", enabled: true, is_core: false, load_pct: 55 },
  { app_id: "AU INVEST", enabled: false, is_core: false, load_pct: 82 },
];

export default function MasterAdminLayout({ children }: PropsWithChildren) {
  const [collapsed, setCollapsed] = useState(false);
  const [health, setHealth] = useState<CalibratorHealth>(initialHealth);
  const [aiActive, setAiActive] = useState(true);
  const [modules, setModules] = useState<FreezeModule[]>(initialModules);
  const onKill = (): void => {
    setAiActive(false);
    setHealth((h) => ({ ...h, score: 88, status: "red" }));
    // API: POST /api/v1/governance/kill-switch — sever LLM
    fetch("/api/v1/governance/kill-switch", { method: "POST", headers: { "X-CSRF-TOKEN": (document.querySelector('meta[name="csrf-token"]') as HTMLMetaElement)?.content ?? "" } }).catch(() => {});
  };
  const onToggleFreeze = (app_id: AppId): void => setModules((m) => m.map((x) => (x.app_id === app_id ? { ...x, enabled: !x.enabled } : x)));
  return (
    <div className="canvas-obsidian min-h-screen text-[var(--text-primary)]">
      <MasterAdminHeader health={health} aiActive={aiActive} onKillSwitch={onKill} modules={modules} onToggleFreeze={onToggleFreeze} />
      <div className="flex">
        <MasterSidebar collapsed={collapsed} onToggle={() => setCollapsed((v) => !v)} />
        <main className="flex-1 p-4 md:p-6">{children}</main>
      </div>
    </div>
  );
}
