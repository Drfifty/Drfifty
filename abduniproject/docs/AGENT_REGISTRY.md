# Table 1.3 — Canonical 13-Agent Registry (Single Authoritative Source — Phase 5.0/6.0 Matrix)

> Any agent reference in any card MUST match this table (number + title). Former Phase 3.x numbering is SUPERSEDED.

| # | Agent | Role & Scope |
|---|-------|--------------|
| 1 | AI Chief Financial Officer (AI CFO — The Accounting & Profit Engine) | Yield optimization, liquidity auditing, risk-bound enforcement, direct price intelligence. **HITL required for manual wallet balance adjustments.** |
| 2 | AI Chief Technology Officer (AI CTO — System Health & Security) | DB performance monitoring, index recommendation logging, automated optimization alerts across all 5 apps. |
| 3 | AI Chief Marketing Officer (AI CMO — Growth & Campaigns) | Campaign generation, personalized deal matching & opportunity detection (Market Hunter), investment feasibility & opportunity analysis, stagnant listing detection, isolated `Approve & Launch` UI action. |
| 4 | AI Vendor Success Officer (مسئول نجاح الشركاء) | Business plan generation for underperforming vendors/doctors; **no direct permission/pricing alteration**. |
| 5 | AI Customer Support Director (مدير دعم العملاء) | Support ticket triage, automated routing pipelines, refund bottleneck resolution. |
| 6 | AI SecOps & Self-Healing Guard (The Cybersecurity Shield / Red-Team) | Sandbox penetration testing, data air-gapping/tokenization (masking to `User_X`/`Entity_Y`), spawning up to 100+ Red-Team workers under load. |
| 7 | AI Chief Legal Counsel & Compliance Officer (AI CLO — Legal & Compliance) | Contract templates (Egyptian legal frameworks), legal compliance & real estate screening. **Hard-blocked from auto-signing without Super Admin clearance.** |
| 8 | AI Supply Chain & Dispatch Director (مدير العمليات اللوجستية) | MySQL Spatial queries, spatial index integrity monitoring, dynamic radius recalculation for AU DEALS & AU SERV. |
| 9 | AI PR & Brand Reputation Manager (مدير السمعة والعلاقات العامة) | Brand sentiment detection across public boards. **Blocked from external auto-publishing without Super Admin HITL.** |
| 10 | AI Quality Assurance & Medical Compliance (مراقب الجودة والتطابق الطبي) | AU MED consultation chat auditing via anonymized NLP compliance telemetry ONLY — **zero access to raw patient payloads or AES-256-GCM records**. |
| 11 | AI Lead Software Engineer & DevOps (The Internal Programmer / Code Sandbox) | Docker sandbox code generation, automated tests via `ShouldQueue`, n8n/Make workflow sandbox (Workflow Inventor). **Hard-blocked from direct production PR merging & destructive DDL (`DROP TABLE`, `TRUNCATE`).** |
| 12 | The Global AI Controller & Proactive Learning Matrix (Supreme Governance Engine) | Owns Master Emergency Kill-Switch, micro-switch matrix for every agent sub-capability. **Prohibited from autonomous web/data ingestion without explicit approval.** |
| 13 | AI Fraud Detector & Anti-Money Laundering Sentinel (مراقب الاحتيال ومكافحة غسيل الأموال) | Velocity tracking, circular-loop detection, ZKP synthetic isolation, auto-freeze on transactions >80% risk factor. |

## Governance — Agent Action Ledger (Mandatory for all 13)
Every autonomous action (proposed or executed) MUST emit a structured event to append-only `agent_actions` table:

```
(action_id, agent_id, capability_key, confidence_score, inputs_hash, outputs_hash, hitl_required, hitl_granted_by, outcome, created_at)
```

- Dashboard MUST surface 24h Activity feed with one-click drill-down to raw event.
- Any action with `confidence_score < 90%` → tagged **FALLBACK** → routed to human queue without execution.
- Ledger is audit trail for Agent 12 Kill-Switch and forensic review.

## Superseded Lines Appendix
The following former Phase 3.x-era numbering is **void** and MUST NOT be used:
- 2=CSO Market Hunter → now **Agent 3 (AI CMO)**
- 3=CLC Legal → now **Agent 7 (AI CLO)**
- 4=CAA Automation Architect → redistributed (now Agent 11 + Agent 8)
- 5=CMO → now **Agent 3**
- 7=Vendor Success → now **Agent 4**

All cards referencing old numbers are defects — update to this table.
