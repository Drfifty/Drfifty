// تخطيط HQ الرئيسي — FIX-P1-01: unified shell composes AppLayout — server health/modules hydration (R25)
import { useState } from "react";
import type { PropsWithChildren } from "react";
import { usePage } from "@inertiajs/react";
import AppLayout from "@/Layouts/AppLayout";
import MasterAdminHeader from "./MasterAdminHeader";
import MasterSidebar from "./MasterSidebar";
import type { CalibratorHealth, FreezeModule } from "@/Types/admin.d";
import type { AppId } from "@/Types";
import type { SharedPageProps } from "@/Types/global.d";

const initialHealth: CalibratorHealth = { score: 96, status: "green", workers: 12, deterministic_ratio: 90, latency_ms: 42, token_budget: 78 };
const initialModules: FreezeModule[] = [
  { app_id: "AU BUSINESS", enabled: true, is_core: true, load_pct: 62 },
  { app_id: "AU MED", enabled: true, is_core: false, load_pct: 71 },
  { app_id: "AU DEALS", enabled: true, is_core: false, load_pct: 68 },
  { app_id: "AU SERV", enabled: true, is_core: false, load_pct: 55 },
  { app_id: "AU INVEST", enabled: false, is_core: false, load_pct: 82 },
];

export default function MasterAdminLayout({ children }: PropsWithChildren) {
  const { props } = usePage<SharedPageProps & { health?: CalibratorHealth; freeze_modules?: FreezeModule[] }>();
  const [collapsed, setCollapsed] = useState(false);
  // FIX-P1-01: server hydration fallback — no client mock flash (R25)
  const serverHealth = (props.health as CalibratorHealth | undefined) ?? initialHealth;
  const serverModules = (props.freeze_modules as FreezeModule[] | undefined) ?? initialModules;
  const [health, setHealth] = useState<CalibratorHealth>(serverHealth);
  const [aiActive, setAiActive] = useState(true);
  const [modules, setModules] = useState<FreezeModule[]>(serverModules);
  const onKill = (): void => {
    setAiActive(false);
    setHealth((h) => ({ ...h, score: 88, status: "red" }));
    fetch("/api/v1/governance/kill-switch", { method: "POST", headers: { "X-CSRF-TOKEN": (document.querySelector('meta[name="csrf-token"]') as HTMLMetaElement)?.content ?? "", "X-App-Id": (props.tenant?.app_id ?? "AU BUSINESS") as string } }).catch(() => {});
  };
  const onToggleFreeze = (app_id: AppId): void => setModules((m) => m.map((x) => (x.app_id === app_id ? { ...x, enabled: !x.enabled } : x)));
  // FIX-P1-01: unified shell — AppLayout owns particle/canvas/proximity single source
  return (
    <AppLayout>
      <MasterAdminHeader health={health} aiActive={aiActive} onKillSwitch={onKill} modules={modules} onToggleFreeze={onToggleFreeze} />
      <div className="flex -mx-6 -mb-6 mt-4">
        <MasterSidebar collapsed={collapsed} onToggle={() => setCollapsed((v) => !v)} />
        <main className="flex-1 p-4 md:p-6">{children}</main>
      </div>
    </AppLayout>
  );
}
