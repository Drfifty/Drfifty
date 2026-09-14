# PROJECT_STATE.md — ABD UNI PROJECT (abduniproject)

> **Anti-Amnesia State File** — Mandatory per Rule 20 & 25. Read FIRST at session start. Updated: 2026-09-14 — Phase 1 Frozen SOW Locked

## 0. Canonical Identity (Immutable)
- **project_folder:** `abduniproject` — fixed, never changes — local approved: `D:\Project\Projects\abduniproject`
- **project_display_name:** `ABD UNI PROJECT`
- **Architecture:** Modular Monolith (`app/Modules/`) + DDD + Clean Architecture
- **Branch:** `arena/01a09d54-drfifty` branched from `beb9215420a05210260296e488c0fee240887847` (main)
- **.cursorrules:** v2.2 UNIFIED — 38 Rules, 11 Pillars, 13 Agents, 15 Modules — loaded
- **State Version:** v1.0 — **Phase 1 Frozen — SOW Locked** (59/59 decisions approved)

## 1. What Was Built
- [x] **Phase 0 Harmonized:** Scaffold `abduniproject/` Modular Monolith (6 modules × layered `Controllers/{Admin,User,Public}/Models/Actions/Services/Requests/Enums`), Shared kernel, dual DB configs, Reverb 8080 exclusive, Tailwind v4 RTL-first (Cairo/Tajawal+Inter)
- [x] `.env.example` (38 keys), `composer.json` Laravel 12 PHP 8.4, `package.json` React 19 Inertia v2 TS 5.7 strict, `vite.config.ts` 0.0.0.0, `docker-compose.prod.yml` (prod-only Ephemeral Swarm + CF WAF + Nginx 20/s + Fail2ban)
- [x] Shared kernel: `RegexDataLeakDetector`, `AgentStrategyManager` Tri-Hybrid, `CheckModuleStatus` 503, Enums `AppId`/`Currency`
- [x] Migrations: `feature_flags` (AU Lite), `agent_actions` ledger (append-only, confidence<90 fallback, HITL), `app_wallets` multi-currency (no base, CHECK>=0, `exchange_rates` + `deal_exchange_snapshots`)
- [x] Frontend: `Types/index.ts` strict zero any, `AppLayout` RTL logical, `DataTable` server-paginated (Rule 13)
- [x] Docs: `CANONICAL_MANIFEST`, `AGENT_REGISTRY` (13), `MODULES_INDEX` (15), `COMPLIANCE_AUDIT`
- [x] **Phase 1 Ingestion:** All chunks stored (Vision + Modules 1-8 + Module 9 Parts 1-3) — no code, memorize only
- [x] **Phase 1 Market Research & SWOT:** Live web research (Vezeeta/Yodawy/Chefaa, TijaraHub/MaxAB, Property Finder $525M, Paymob/Fawry) + feasibility + gap audit delivered
- [x] **59 Clarifying Questions → 59 Master Decisions Frozen:** SOW Locked, no assumptions remaining
- [x] **This update:** State → Phase 1 Frozen; generating final Master Architecture Document (ZERO code)

## 2. Tech Stack Lock (NO deviations)
Backend Laravel 12 PHP 8.4 Action-Service-Repository | Frontend React 19 Inertia v2 | TS 5.7 strict zero any | Tailwind v4 Shadcn Lucide | Vite HMR+Prod | Reverb 8080 wss exclusive | MySQL 8.4 InnoDB utf8mb4 Spatial (JSON not JSONB) sole core | PostgreSQL 16 PostGIS+pgcrypto AU MED only | Redis | AES-256-GCM + TLS 1.3 | Cloudflare Enterprise/WAF + Nginx 20/s + Fail2ban PROD only

## 3. Applications Registry (5) — space-form app_id
AU BUSINESS `ab_` (core, non-hibernatable) | AU MED `amed_` (pgsql clinical) | AU DEALS `adl_` | AU SERV `asv_` | AU INVEST `ainv_` — all inherit `app_wallet`, escrow, taxonomy

## 4. Agents: 13 Canonical (Table 1.3) | Modules: 15 (Table 1.4)
Agents: 1 CFO, 2 CTO, 3 CMO, 4 Vendor Success, 5 Customer Support, 6 SecOps, 7 CLO, 8 Supply Chain, 9 PR, 10 QA/Medical, 11 DevOps/Code Sandbox, 12 Global Controller, 13 Fraud/AML — superseded Phase 3.x numbering void.
Modules 1-9 Phase 1 (Auth→Dashboard), 10-15 Phase 2/4/5/6 — see MODULES_INDEX.

## 5. Pillars 11 — All Enforced
Deterministic-First → Fallback <90% → Tri-Hybrid (Deterministic/CloudLlm/LocalGpu {LOCAL_GPU_ENDPOINT}) → CheckModuleStatus → RegexDataLeakDetector → lockForUpdate+Redis Mutex → Calibrator → Ephemeral Swarm (prod) → Silent Token Rotation → Edge DoS (prod) → Tiered Mutation (Hide/Show vs Hard-Delete)

## 6. Phase 1 Frozen Decisions (Summary — 59/59)
- **Identity (1-7):** Levels L1 Guest, L2 Phone, L3 National ID/Business + TOTP MFA for L3/admins, revoke sessions on pwd reset, soft-freeze after 3 MFA fails, annual L3 re-verify, spatie/laravel-permission RBAC immutable core
- **Ledger (8-14):** Unified app_wallet multi-currency no bias, FX locked at settlement `exchange_rate_locked_at`, integer subunit storage, double-entry + hash append-only, daily reconciliation, no negative balances
- **Escrow (15-27):** Closed/Blind via Paymob gateway (no local liquidity), 48h dispute hold → admin queue, batch auto-payouts on completion, partial releases milestone-proportional, 0 financial penalties (technical scores only), 24h hold pre-payout, dynamic VAT at checkout, immediate freeze on chargeback, 5 tx/min velocity, FX fee passed transparently, rolling caps per level, 90d unclaimed → platform vault, **ABSOLUTE: no code/source buyout — SaaS + agent lease only**
- **Deal Page (28-33):** Points on publish 50/day cap, 8-point equal weight (3 settlements/24mo rolling cron for badge), zero contact until escrow-funded, safety block dynamic via app_settings_schema, L2 quota exceeded → dual CTA Upgrade/Bid Pack, global override supersedes per-deal
- **Wallet/Checkout (34-39):** 5% commission default dynamic per module, OCR exact match only, single-payer (buyer/requester) escrow, barter 1.5x total split 50/50, single 12h grace extension, sacred wallet (no wallet debits — technical penalties only)
- **Interaction Hub (40-44):** 500 favorites cap, barter delta top banner `لك/له`, private.notifications.{id}, 6th violation → suspension pending HQ review, views/clicks via backend middleware IP+session dedup 24h
- **Auxiliary (45-50):** Loyalty LOYALTY_POINTS in unified wallet, milestones once (100/300/500), 365d expiration deduction entry, AES-256-GCM IV per record, journey discount proportional split, urgent surge fixed/% to provider minus commission
- **Workforce/Calibrator (51-53):** Calibrator rejection + auto-fix suggestion requires approval, no code buyout — execution/lease licenses post-escrow, double-entry debit client_wallet / credit platform_income
- **HQ (54-59):** AU BUSINESS non-hibernatable, global free overrides individual, DRM quarantine 7d grace JSON 503 + HTML maintenance, 80% budget → pause high-cost LLM → local 0-cost, wallet rationale 15-char FormRequest+DB CHECK, 90d hot DB → encrypted S3 archive

## 7. Current Context & Next
- **Phase:** 1 ANALYSIS — frozen, no code generated per Rule 2
- **Deliverable now:** `docs/PHASE1_MASTER_ARCHITECTURE.md` — comprehensive SOW (functional, non-functional, roles matrix, use cases Actor→Goal→Steps→Alt Flows, assumptions, DB sketch, API contracts) — ZERO code, 100% manifest/R2.2 compliant
- **After this doc:** Await user explicit Phase 1 approval → then Micro-Sprint execution (1-3 files/150 lines max, vertical slices DB→Backend→API→Frontend→Test, Rule 21/33)

## 8. Risks & Next Mitigations
- Escrow license: Closed via Paymob — no local vault risk
- FX volatility: integer subunit + locked rate + transparent fee mitigates
- Dual DB ops: pgsql isolated to AU MED, WAL to S3 cold storage per 90d plan
- Reverb 8080 wss: CF/WAF edge, private channels only

---
**ملخص عربي:** تم تجميد 59 قرارًا نهائيًا (SOW Locked) وتحديث الحالة إلى Phase 1 Frozen — الانتقال لإصدار وثيقة الهندسة الرئيسية بدون كود، ملتزمة بالـ 38 قاعدة والـ 11 ركن.

*Last updated: 2026-09-14 — Rule 20 pre-shutdown — Next: PHASE1_MASTER_ARCHITECTURE.md*
