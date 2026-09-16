// 24/7 C-Suite & HITL Governance HQ — مقاييس + 70/30 Feed/Matrix — 13 Agent
import { useState } from "react";
import MasterAdminLayout from "./MasterAdminLayout";
import Button from "@/Components/UI/Button";
import StatusBadge from "@/Components/UI/StatusBadge";
import type { AgentMicroSwitch, HITLProposal } from "@/Types/admin.d";

const agents: AgentMicroSwitch[] = [
  { agent_id: 1, agent_title: "CFO — Accounting & Profit", capability_key: "reconcile", enabled: true, approval_required: true, driver: "deterministic" },
  { agent_id: 2, agent_title: "CTO — Health & Security", capability_key: "scan", enabled: true, approval_required: false, driver: "deterministic" },
  { agent_id: 3, agent_title: "CMO — Growth & Campaigns", capability_key: "Draft Ads", enabled: true, approval_required: true, driver: "cloud" },
  { agent_id: 4, agent_title: "Vendor Success Officer", capability_key: "tier", enabled: true, approval_required: false, driver: "deterministic" },
  { agent_id: 5, agent_title: "Customer Support Director", capability_key: "triage", enabled: true, approval_required: true, driver: "cloud" },
  { agent_id: 6, agent_title: "SecOps & Self-Healing Guard", capability_key: "patch", enabled: true, approval_required: false, driver: "local_gpu" },
  { agent_id: 7, agent_title: "CLO — Legal & Compliance", capability_key: "audit terms", enabled: false, approval_required: true, driver: "deterministic" },
  { agent_id: 8, agent_title: "Supply Chain & Dispatch", capability_key: "dispatch", enabled: true, approval_required: false, driver: "deterministic" },
  { agent_id: 9, agent_title: "PR & Brand Reputation", capability_key: "press", enabled: true, approval_required: true, driver: "cloud" },
  { agent_id: 10, agent_title: "QA & Medical Compliance", capability_key: "clinical", enabled: true, approval_required: true, driver: "deterministic" },
  { agent_id: 11, agent_title: "Lead SWE & DevOps / Sandbox", capability_key: "deploy", enabled: true, approval_required: true, driver: "local_gpu" },
  { agent_id: 12, agent_title: "Global AI Controller & Proactive", capability_key: "learn", enabled: true, approval_required: false, driver: "cloud" },
  { agent_id: 13, agent_title: "Fraud Detector & AML Sentinel", capability_key: "aml", enabled: true, approval_required: true, driver: "deterministic" },
];

const proposals: HITLProposal[] = [
  { id: "p1", agent_id: 3, title: "حملة إعلانية جديدة — رمضان", description: "Agent 3 proposes 3 ad variants — budget 5k EGP", confidence: 87, created_at: "2026-09-15", status: "pending" },
  { id: "p2", agent_id: 11, title: "PR #42 — إصلاح تسريب", description: "Agent 11 — diff +12 -3 — confidence 92%", confidence: 92, created_at: "2026-09-15", status: "pending" },
  { id: "p3", agent_id: 8, title: "توجيه إرسال — AU SERV", description: "Agent 8 — nearest provider 1.2km ETA 6m", confidence: 89, created_at: "2026-09-15", status: "pending" },
];

export default function CSuiteHQ() {
  const [items, setItems] = useState<HITLProposal[]>(proposals);
  const act = (id: string, status: HITLProposal["status"]): void => setItems((a) => a.map((p) => (p.id === id ? { ...p, status } : p)));
  return (
    <MasterAdminLayout>
      <div className="grid gap-3 md:grid-cols-4">
        <div className="glass-inner p-4"><p className="text-micro text-[var(--text-secondary)]">Ephemeral Workers</p><p className="text-section font-bold">12 نشط</p></div>
        <div className="glass-inner p-4"><p className="text-micro text-[var(--text-secondary)]">Deterministic vs LLM</p><p className="text-section font-bold">90% PHP 8.4 / 10% LLM</p><div className="mt-2 h-2 rounded-full bg-[var(--surface-secondary)]"><div className="h-2 rounded-full bg-[var(--accent-emerald)]" style={{ width: "90%" }} /></div></div>
        <div className="glass-inner p-4"><p className="text-micro text-[var(--text-secondary)]">Adapter</p><div className="mt-2 flex gap-2"><span className="rounded-full bg-[var(--accent-cyan)] px-2 py-1 text-micro text-white">Local GPU 127.0.0.1:8000</span><span className="rounded-full bg-[var(--surface-secondary)] px-2 py-1 text-micro">Cloud API</span></div></div>
        <div className="glass-inner p-4"><p className="text-micro text-[var(--text-secondary)]">Token / Latency Budget</p><p className="text-section font-bold">78% — 42ms</p><div className="mt-2 h-2 rounded-full bg-[var(--surface-secondary)]"><div className="h-2 rounded-full bg-[var(--accent-amber)]" style={{ width: "78%" }} /></div></div>
      </div>
      <div className="mt-4 grid gap-4 lg:grid-cols-[70%_30%]">
        <div className="glass-inner p-4">
          <h3 className="text-section font-semibold">Central Suggestion Feed — HITL Queue (AI Proposes, Admin Disposes)</h3>
          <div className="mt-3 space-y-3">
            {items.map((p) => (
              <div key={p.id} className="rounded-[var(--radius-md)] border border-[var(--border-pearl)] bg-white p-3">
                <div className="flex justify-between"><span className="text-body font-semibold">Agent {p.agent_id} — {p.title}</span><StatusBadge state={p.confidence >= 90 ? "Verified" : "Pending"} label={`${p.confidence}%`} /></div>
                <p className="mt-1 text-body text-[var(--text-secondary)]">{p.description}</p>
                <div className="mt-3 flex flex-wrap gap-2">
                  <Button size="sm" onClick={() => act(p.id, "approved")}>Approve</Button><Button size="sm" variant="secondary" onClick={() => act(p.id, "rejected")}>Reject</Button><Button size="sm" variant="secondary" onClick={() => act(p.id, "modified")}>Modify</Button><Button size="sm" variant="ghost" onClick={() => act(p.id, "pending")}>Ask Me Later</Button>
                </div>
              </div>
            ))}
          </div>
        </div>
        <div className="glass-inner p-4">
          <h3 className="text-section font-semibold">Micro-Switch Matrix — 13 Agents</h3>
          <div className="mt-3 space-y-2 max-h-[520px] overflow-auto">
            {agents.map((a) => (
              <div key={a.agent_id} className="rounded-[var(--radius-md)] border border-[var(--border-pearl)] bg-white p-3">
                <p className="text-body font-semibold">Agent {a.agent_id} — {a.agent_title}</p>
                <p className="text-micro text-[var(--text-secondary)]">{a.capability_key} • {a.driver}</p>
                <div className="mt-2 flex items-center justify-between">
                  <label className="flex items-center gap-2 text-micro"><input type="checkbox" defaultChecked={a.enabled} /> {a.capability_key}</label>
                  <label className="flex items-center gap-2 text-micro"><input type="checkbox" defaultChecked={a.approval_required} /> Approval Required</label>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </MasterAdminLayout>
  );
}
