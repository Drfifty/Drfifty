// أنواع لوحة الإدارة الرئيسية — Master HQ — Strict TS — لا any
import type { AppId, AgentId, Currency } from "./index";

export type AdminRole = "super_admin" | "sub_admin" | "auditor";
export type CalibratorStatus = "green" | "amber" | "red";
export interface CalibratorHealth { score: number; status: CalibratorStatus; workers: number; deterministic_ratio: number; latency_ms: number; token_budget: number }
export interface AgentMicroSwitch { agent_id: AgentId; agent_title: string; capability_key: string; enabled: boolean; approval_required: boolean; driver: "deterministic" | "cloud" | "local_gpu" }
export interface HITLProposal { id: string; agent_id: AgentId; title: string; description: string; confidence: number; created_at: string; status: "pending" | "approved" | "rejected" | "modified" }
export interface EscrowRecord { journey_id: string; deal_id: string; amount_minor: number; currency: Currency; locked: boolean; commission_tier: 1 | 2 | 3; dispute?: boolean }
export interface LedgerCard { key: "gross" | "escrow" | "net" | "tax"; title: string; value_minor: number; currency: Currency; trend?: number }
export interface GatewayEntry { key: string; name: string; enabled: boolean; failure_rate: number; auto_routed: boolean }
export interface HardwareDNA { ip: string; domain: string; mac: string; status: "MATCHED" | "MISMATCH" | "SECURE" }
export interface WatchdogLog { id: string; admin_id: number; action: string; params: string; timestamp: string; ai_prompt?: string }
export interface FreezeModule { app_id: AppId; enabled: boolean; is_core: boolean; load_pct: number }
export interface MasterAdminHeaderProps { health: CalibratorHealth; aiActive: boolean; onKillSwitch: () => void; modules: FreezeModule[]; onToggleFreeze: (app_id: AppId) => void }
export type SuiteKey = "c-suite" | "ledger" | "monetization" | "taxonomy" | "loyalty" | "disputes" | "hr" | "security" | "telemetry" | "broadcast";
export interface SuiteNav { key: SuiteKey; label: string; icon: string; path: string; permission?: string }
