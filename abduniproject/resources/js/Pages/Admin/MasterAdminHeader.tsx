// الشريط العلوي الثابت — Kill-Switch + Calibrator + Freeze Bar + Switcher + Security DNA
import { useEffect, useRef, useState } from "react";
import Button from "@/Components/UI/Button";
import ConfirmHoldModal from "@/Components/UI/ConfirmHoldModal";
import MultiTenantSwitcher from "@/Components/UI/MultiTenantSwitcher";
import { usePage } from "@inertiajs/react";
import type { SharedPageProps } from "@/Types/global.d";
import type { MasterAdminHeaderProps } from "@/Types/admin.d";

function Gauge({ score }: { score: number }) {
  const status = score >= 95 ? "green" : score >= 90 ? "amber" : "red";
  const color = status === "green" ? "var(--accent-emerald)" : status === "amber" ? "var(--accent-amber)" : "var(--brand-crimson)";
  const dash = (score / 100) * 251;
  return (
    <div className="flex items-center gap-2">
      <svg width="44" height="44" viewBox="0 0 44 44" aria-label={`Calibrator ${score}%`}>
        <circle cx="22" cy="22" r="20" fill="none" stroke="var(--surface-secondary)" strokeWidth="4" />
        <circle cx="22" cy="22" r="20" fill="none" stroke={color} strokeWidth="4" strokeDasharray={`${dash} 251`} strokeLinecap="round" transform="rotate(-90 22 22)" />
        <text x="22" y="26" textAnchor="middle" fontSize="10" fontWeight="700" fill="var(--text-primary)">{score}%</text>
      </svg>
      <span className="text-micro font-bold" style={{ color }}>{score >= 95 ? "سليم" : score >= 90 ? "تحذير" : "خطر"}</span>
    </div>
  );
}

export default function MasterAdminHeader({ health, aiActive, onKillSwitch, modules, onToggleFreeze }: MasterAdminHeaderProps) {
  const { props } = usePage<SharedPageProps>();
  const [killOpen, setKillOpen] = useState(false);
  const [sec, setSec] = useState(3600);
  const timerRef = useRef<number | null>(null);
  useEffect(() => { timerRef.current = window.setInterval(() => setSec((s) => (s > 0 ? s - 1 : 0)), 1000); return () => { if (timerRef.current) clearInterval(timerRef.current); }; }, []);
  const fmt = (s: number): string => `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;
  return (
    <header className="sticky top-0 z-40">
      <div className="glass-outer flex flex-wrap items-center justify-between gap-3 px-4 py-3">
        <div className="flex items-center gap-3">
          <span className="text-section font-bold text-white">ABD UNI — MASTER HQ</span>
          <span className="rounded-full px-3 py-1 text-micro font-bold" style={{ background: aiActive ? "var(--accent-cyan)" : "var(--brand-crimson)", color: "#fff" }}>{aiActive ? "AI SWARM: ACTIVE" : "AI SWARM: SEVERED (MANUAL MODE)"}</span>
        </div>
        <div className="flex items-center gap-3">
          <Gauge score={health.score} />
          <MultiTenantSwitcher />
          <div className="hidden items-center gap-2 sm:flex">
            <span className="text-micro text-[var(--text-secondary)]">{props.auth.user?.name ?? "Super Admin"}</span>
            <span className="rounded-full bg-[var(--accent-emerald)] px-2 py-1 text-micro text-white">MFA ✓</span>
            <span className="rounded-full bg-[var(--surface-secondary)] px-2 py-1 text-micro">DNA 🔒</span>
            <span className="font-mono text-micro">{fmt(sec)}</span>
          </div>
          <Button variant="danger" onClick={() => setKillOpen(true)}>Kill-Switch #EF4444</Button>
        </div>
      </div>
      <div className="flex flex-wrap items-center gap-2 bg-[var(--accent-amber)] px-4 py-2 text-micro text-black">
        <span>AU Lite Freeze Bar — حِمل الخادم {Math.max(...modules.map((m) => m.load_pct))}%</span>
        <div className="flex gap-1">
          {modules.filter((m) => !m.is_core).map((m) => (
            <button key={m.app_id} onClick={() => onToggleFreeze(m.app_id)} className="rounded-full border border-black/20 bg-white px-2 py-1 text-micro font-bold">{m.app_id}: {m.enabled ? "ON" : "FROZEN"}</button>
          ))}
        </div>
      </div>
      <ConfirmHoldModal open={killOpen} onOpenChange={setKillOpen} title="تأكيد Kill-Switch" description="سيتم قطع كل خيوط LLM والتحول لليدوي 100% — اضغط 2 ثانية" confirmLabel="اضغط 2 ثانية — SEVER" variant="danger" onConfirm={onKillSwitch} />
    </header>
  );
}
