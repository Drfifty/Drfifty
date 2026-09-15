// الخزنة المالية — Split-Ledger + Escrow + Tax + Gateway + Rationale
import { useState } from "react";
import MasterAdminLayout from "./MasterAdminLayout";
import Button from "@/Components/UI/Button";
import Modal from "@/Components/UI/Modal";
import StatusBadge from "@/Components/UI/StatusBadge";
import type { LedgerCard, EscrowRecord, GatewayEntry } from "@/Types/admin.d";

const ledgers: LedgerCard[] = [
  { key: "gross", title: "Gross Platform Liquidity", value_minor: 12500000, currency: "EGP" },
  { key: "escrow", title: "Active Escrow Locked Pool", value_minor: 3420000, currency: "EGP" },
  { key: "net", title: "Net Platform Earnings (3-Tier)", value_minor: 890000, currency: "EGP" },
  { key: "tax", title: "Tax Reserve Ledger", value_minor: 210000, currency: "EGP" },
];
const escrows: EscrowRecord[] = [
  { journey_id: "j1", deal_id: "d1", amount_minor: 50000, currency: "EGP", locked: true, commission_tier: 1 },
  { journey_id: "j2", deal_id: "d2", amount_minor: 120000, currency: "EGP", locked: true, commission_tier: 2, dispute: true },
];
const gateways: GatewayEntry[] = [
  { key: "paymob", name: "Paymob", enabled: true, failure_rate: 1.2, auto_routed: false },
  { key: "fawry", name: "Fawry", enabled: true, failure_rate: 6.1, auto_routed: true },
  { key: "instapay", name: "InstaPay", enabled: true, failure_rate: 0.8, auto_routed: false },
  { key: "vodafone", name: "Vodafone Cash", enabled: false, failure_rate: 2.4, auto_routed: false },
];

function fmt(minor: number): string { return new Intl.NumberFormat("ar-EG", { style: "currency", currency: "EGP", numberingSystem: "latn" }).format(minor / 100); }

export default function FinancialVault() {
  const [rationaleOpen, setRationaleOpen] = useState(false);
  const [rationale, setRationale] = useState("");
  const [drawer, setDrawer] = useState<EscrowRecord | null>(null);
  return (
    <MasterAdminLayout>
      <div className="grid gap-3 md:grid-cols-4">
        {ledgers.map((l) => (
          <div key={l.key} className="glass-inner p-4">
            <p className="text-micro text-[var(--text-secondary)]">{l.title}</p>
            <p className="mt-1 text-section font-bold" data-numeric="true">{fmt(l.value_minor)}</p>
          </div>
        ))}
      </div>
      <div className="glass-inner mt-4 p-4">
        <div className="flex justify-between"><h3 className="text-section font-semibold">Escrow Immutability & Clearing Queue</h3><Button size="sm" variant="danger" onClick={() => setRationaleOpen(true)}>Manual Adjustment</Button></div>
        <div className="mt-3 overflow-auto rounded-[var(--radius-md)] border border-[var(--border-pearl)]">
          <table className="w-full text-body">
            <thead className="bg-[var(--surface-secondary)] text-[var(--text-secondary)]"><tr><th className="p-3 text-start">journey / deal</th><th className="p-3">المبلغ</th><th className="p-3">Lock</th><th className="p-3">إجراء</th></tr></thead>
            <tbody>
              {escrows.map((e) => (
                <tr key={e.journey_id} className="border-t border-[var(--border-pearl)]">
                  <td className="p-3">{e.journey_id} / {e.deal_id} — Tier {e.commission_tier}</td>
                  <td className="p-3" data-numeric="true">{fmt(e.amount_minor)}</td>
                  <td className="p-3"><StatusBadge state={e.locked ? "Verified" : "Pending"} label={e.locked ? "LOCKED" : "OPEN"} /></td>
                  <td className="p-3"><Button size="sm" variant="secondary" onClick={() => setDrawer(e)}>Dispute Drawer</Button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {drawer && (
          <div className="mt-3 rounded-[var(--radius-md)] border border-[var(--border-pearl)] bg-[var(--surface-pearl-strong)] p-3">
            <p className="text-body font-semibold">Dispute Override — {drawer.journey_id}</p>
            <div className="mt-2 flex gap-2"><Button size="sm" variant="danger">Manual Release</Button><Button size="sm" variant="secondary">Manual Refund</Button><Button size="sm" variant="ghost" onClick={() => setDrawer(null)}>Close</Button></div>
          </div>
        )}
      </div>
      <div className="glass-inner mt-4 p-4">
        <h3 className="text-section font-semibold">Gateway Failover Circuit & Payment Matrix</h3>
        <p className="text-micro text-[var(--text-secondary)]">Auto-routing if failure &gt; 5% — circuit breaker</p>
        <div className="mt-3 overflow-auto rounded-[var(--radius-md)] border border-[var(--border-pearl)]">
          <table className="w-full text-body">
            <thead className="bg-[var(--surface-secondary)]"><tr><th className="p-3 text-start">Gateway</th><th className="p-3">Enabled</th><th className="p-3">Failure</th><th className="p-3">Routing</th></tr></thead>
            <tbody>
              {gateways.map((g) => (
                <tr key={g.key} className="border-t border-[var(--border-pearl)]">
                  <td className="p-3">{g.name}</td>
                  <td className="p-3">{g.enabled ? "ON" : "OFF"}</td>
                  <td className="p-3"><span style={{ color: g.failure_rate > 5 ? "var(--brand-crimson)" : "var(--accent-emerald)" }}>{g.failure_rate}%</span></td>
                  <td className="p-3">{g.auto_routed ? <StatusBadge state="AI_Active" label="AUTO-ROUTED" /> : "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      <Modal open={rationaleOpen} onOpenChange={setRationaleOpen} title="Manual Ledger Adjustment — Rationale Required" description="يجب تسجيل السبب — يُحفظ في immutable audit logs">
        <textarea value={rationale} onChange={(e) => setRationale(e.target.value)} placeholder="اكتب السبب التفصيلي..." rows={4} className="w-full rounded-[var(--radius-md)] border border-[var(--border-pearl)] bg-white p-3 text-body" />
        <div className="mt-3 flex justify-end gap-2"><Button variant="secondary" onClick={() => setRationaleOpen(false)}>إلغاء</Button><Button disabled={rationale.trim().length < 15} onClick={() => { setRationaleOpen(false); setRationale(""); }}>تأكيد التعديل</Button></div>
      </Modal>
    </MasterAdminLayout>
  );
}
