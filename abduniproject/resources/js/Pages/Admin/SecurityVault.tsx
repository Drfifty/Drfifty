// خزنة الأمان — DRM + Dead-Man + Poison Pill + Watchdog
import { useEffect, useState } from "react";
import MasterAdminLayout from "./MasterAdminLayout";
import Button from "@/Components/UI/Button";
import Modal from "@/Components/UI/Modal";
import StatusBadge from "@/Components/UI/StatusBadge";
import type { HardwareDNA, WatchdogLog } from "@/Types/admin.d";

const dna: HardwareDNA = { ip: "192.0.2.10", domain: "abduni.com", mac: "AA:BB:CC:DD:EE:FF", status: "MATCHED" };
const logs: WatchdogLog[] = [
  { id: "w1", admin_id: 1, action: "POST /api/v1/governance/kill-switch", params: "{}", timestamp: "2026-09-15T10:00:00Z", ai_prompt: "sever LLM" },
  { id: "w2", admin_id: 2, action: "GET /admin/ledger", params: "app_id=AU MED", timestamp: "2026-09-15T10:02:00Z" },
];

function Countdown({ deadline }: { deadline: number }) {
  const [left, setLeft] = useState(deadline - Date.now());
  useEffect(() => { const t = setInterval(() => setLeft(deadline - Date.now()), 1000); return () => clearInterval(t); }, [deadline]);
  const h = Math.max(0, Math.floor(left / 3600000));
  const m = Math.max(0, Math.floor((left % 3600000) / 60000));
  const s = Math.max(0, Math.floor((left % 60000) / 1000));
  return <span className="font-mono text-section font-bold">{String(h).padStart(2, "0")}:{String(m).padStart(2, "0")}:{String(s).padStart(2, "0")}</span>;
}

export default function SecurityVault() {
  const [poisonOpen, setPoisonOpen] = useState(false);
  const [mfa, setMfa] = useState("");
  const [pass, setPass] = useState("");
  const deadline = Date.now() + 48 * 3600 * 1000;
  const canSelfDestruct = mfa.length === 6 && pass.length >= 12;
  return (
    <MasterAdminLayout>
      <div className="grid gap-4 md:grid-cols-2">
        <div className="glass-inner p-4">
          <h3 className="text-section font-semibold">Hardware DNA Binding Status</h3>
          <div className="mt-3 space-y-2 text-body">
            <p>IP: <span dir="ltr">{dna.ip}</span> — Domain: {dna.domain} — MAC: <span dir="ltr">{dna.mac}</span></p>
            <StatusBadge state={dna.status === "MATCHED" ? "Verified" : "Danger"} label={dna.status === "MATCHED" ? "ENVIRONMENT MATCHED / SECURE" : "MISMATCH"} />
          </div>
        </div>
        <div className="glass-inner p-4">
          <h3 className="text-section font-semibold">Dead-Man's Switch — 48h Heartbeat</h3>
          <p className="text-micro text-[var(--text-secondary)]">يجب إرسال نبضة تشفير كل 48 ساعة</p>
          <div className="mt-3 flex items-center gap-3"><Countdown deadline={deadline} /><Button size="sm" variant="ai-action">إرسال نبضة الآن</Button></div>
        </div>
      </div>
      <div className="glass-inner mt-4 p-4">
        <h3 className="text-section font-semibold" style={{ color: "var(--brand-crimson)" }}>Poison Pill & Emergency Self-Destruct Panel</h3>
        <p className="text-body text-[var(--text-secondary)]">يمسح قاعدة البيانات و .env عند اختراق مادي — يتطلب MFA + Master Passphrase</p>
        <Button variant="danger" className="mt-3" onClick={() => setPoisonOpen(true)}>تهيئة المسح الذاتي</Button>
      </div>
      <div className="glass-inner mt-4 p-4">
        <h3 className="text-section font-semibold">Watchdog Immutable Audit Log — Read-only</h3>
        <div className="mt-3 overflow-auto rounded-[var(--radius-md)] border border-[var(--border-pearl)]">
          <table className="w-full text-body">
            <thead className="bg-[var(--surface-secondary)]"><tr><th className="p-3 text-start">Time (ms)</th><th className="p-3">Admin</th><th className="p-3">Action</th><th className="p-3">Params</th><th className="p-3">AI Prompt</th></tr></thead>
            <tbody>
              {logs.map((l) => (
                <tr key={l.id} className="border-t border-[var(--border-pearl)]">
                  <td className="p-3 font-mono text-micro" dir="ltr">{new Date(l.timestamp).toISOString()}</td>
                  <td className="p-3">#{l.admin_id}</td>
                  <td className="p-3" dir="ltr">{l.action}</td>
                  <td className="p-3" dir="ltr">{l.params}</td>
                  <td className="p-3">{l.ai_prompt ?? "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      <Modal open={poisonOpen} onOpenChange={setPoisonOpen} title="تأكيد Poison Pill — خطر" description="يتطلب Super Admin MFA + Master Passphrase — لا يمكن التراجع">
        <div className="space-y-3">
          <label className="block text-body">MFA (6 أرقام)<input value={mfa} onChange={(e) => setMfa(e.target.value)} placeholder="123456" className="mt-1 w-full rounded-[var(--radius-md)] border border-[var(--border-pearl)] bg-white p-2" /></label>
          <label className="block text-body">Master Passphrase (≥12)<input type="password" value={pass} onChange={(e) => setPass(e.target.value)} placeholder="••••••••••••" className="mt-1 w-full rounded-[var(--radius-md)] border border-[var(--border-pearl)] bg-white p-2" /></label>
          <div className="flex justify-end gap-2"><Button variant="secondary" onClick={() => setPoisonOpen(false)}>إلغاء</Button><Button variant="danger" disabled={!canSelfDestruct} onClick={() => setPoisonOpen(false)}>تأكيد المسح</Button></div>
        </div>
      </Modal>
    </MasterAdminLayout>
  );
}
