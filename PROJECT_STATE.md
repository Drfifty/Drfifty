# PROJECT_STATE.md — ABD UNI PROJECT (abduniproject)

> **Anti-Amnesia State File** — Mandatory per Rule 20 & 25. Read FIRST at session start. Updated: 2026-09-14 — Phase 2.3b FRONTEND LAYOUT DONE (Arena) — 71 Points → 2.1a+2.1b+2.1c+2.1d+2.2a+2.2b+2.2c+2.2d+2.2e+2.2f+2.3a+2.3b Delivered

## 0. Canonical Identity (Immutable)
- **project_folder:** `abduniproject` — fixed, never changes — local approved: `D:\Project\Projects\abduniproject`
- **project_display_name:** `ABD UNI PROJECT`
- **Architecture:** Modular Monolith (`app/Modules/`) + DDD + Clean Architecture
- **Branch:** `arena/01a09d54-drfifty` branched from `beb9215420a05210260296e488c0fee240887847` (main)
- **.arenarules:** v2.2 UNIFIED — 38 Rules, 11 Pillars, 13 Agents, 9 Modules — loaded
- **State Version:** v2.3 — **Phase 1 LOCK 71 Points + Phase 2.1a Auth/RBAC + 2.1b Wallet/Escrow + 2.1c AU DEALS + 2.1d AU SERV Spatial + 2.2a Auth/Financial + 2.2b AU DEALS + 2.2c SERV/INVEST + 2.2d AU MED + 2.2e Governance/Calibrator + 2.2f Workforce + 2.3a Backend + 2.3b Frontend Delivered (Arena ultra-concise)**

## 1. What Was Built
- [x] **Phase 0 Harmonized:** Scaffold `abduniproject/` Modular Monolith (6 modules × layered `Controllers/{Admin,User,Public}/Models/Actions/Services/Requests/Enums`), Shared kernel, dual DB configs, Reverb 8080 exclusive, Tailwind v4 RTL-first (Cairo/Tajawal+Inter)
- [x] `.env.example` (38 keys incl. FX_PROVIDER, LOCAL_GPU_ENDPOINT), `composer.json` Laravel 12 PHP 8.4, `package.json` React 19 Inertia v2 TS 5.7 strict, `vite.config.ts` 0.0.0.0, `docker-compose.prod.yml` (prod-only Ephemeral Swarm + CF WAF + Nginx 20/s + Fail2ban)
- [x] Shared kernel: `RegexDataLeakDetector`, `AgentStrategyManager` Tri-Hybrid, `CheckModuleStatus` 503, Enums `AppId`/`Currency`
- [x] Migrations: `feature_flags` (AU Lite), `agent_actions` ledger (append-only, confidence<90 fallback, HITL), `app_wallets` multi-currency (no base, CHECK>=0, `exchange_rates` + `deal_exchange_snapshots`)
- [x] Frontend: `Types/index.ts` strict zero any, `AppLayout` RTL logical, `DataTable` server-paginated (Rule 13)
- [x] Docs: `CANONICAL_MANIFEST`, `AGENT_REGISTRY` (13), `MODULES_INDEX` (9), `COMPLIANCE_AUDIT`, `PHASE1_MASTER_ARCHITECTURE` (ZERO CODE, 59 frozen) — 9 MODULES CANONICAL
- [x] **Phase 1 Ingestion:** All chunks Vision + Modules 1-9 Parts 1-3 memorized, live market research + SWOT delivered (Vezeeta/Yodawy, TijaraHub/MaxAB, Property Finder $525M, Paymob/Fawry)
- [x] **59 Master Decisions Frozen:** Q1-59 fully approved
- [x] **6 Architect Suggestions Approved:** Paymob sub-merchant auto+fallback, FX seed exchangerate-api */30, app_settings_schema seed, pgvector primary, intervention/image GD, Parquet hash archive
- [x] **6 Oil Updates Frozen (النفط):** Contact protection timing (30), 5% commission (34), B2B single-payer (36), 12h grace once (38), 500 favs cap (40), no source buyout SaaS-only (52) — all locked
- [x] **Phase 1 FINAL COMPREHENSIVE LOCK 71 points** → docs `PHASE1_FINAL_COMPREHENSIVE.md` frozen + pushed
- [x] **Global Rename to Arena 2026-09-14:** legacy rules file → `.arenarules`, zero legacy remains, Arena env lock `arena/01a09d54-drfifty` — pushed `762d759`
- [x] **PHASE 2.1a — Auth & RBAC Schema [DONE]:** 9 tables canonical `users/roles/permissions/role_permissions/user_roles/micro_switch_matrix/feature_flags/data_leak_patterns/refresh_tokens` (MySQL 8.4 InnoDB utf8mb4, JSON not JSONB, FK CASCADE, BTREE), AU Lite toggles, Regex 100% post-escrow, Silent Token Rotation 15m/7d HttpOnly+Lax+Inertia/Axios queue — DDL `database/schema/2026_09_14_2.1a_auth_rbac_canonical.sql` + migration `2026_09_14_000010_create_auth_rbac_schema.php` + spec `docs/PHASE2_2.1A_AUTH_RBAC_SCHEMA.md` with Mermaid ERD
- [x] **PHASE 2.1b — Wallet & Escrow Engine [DONE]:** 7 tables canonical `app_wallets/exchange_rates/commission_rules/escrow_clearings/deal_exchange_snapshots/wallet_transactions/financial_audit_logs` (InnoDB utf8mb4, CHECK balance>=0, subunit BIGINT, GENERATED available, TRIGGER immutability), 3-Tier 5% Oil2 snapshots frozen, Paymob blind sub-merchant, FX locked_at, barter 1.5/1x 50/50, 48h dispute + 12h grace once — DDL `database/schema/2026_09_14_2.1b_wallet_escrow_canonical.sql` + migration `2026_09_14_000011_create_wallet_escrow_schema.php` + spec `docs/PHASE2_2.1B_WALLET_ESCROW_SCHEMA.md` with Mermaid ERD + Race-Guard (lockForUpdate+Redis Mutex)
- [x] **PHASE 2.1c — AU DEALS Listings [DONE]:** 5 tables canonical `deal_categories/deals_listings/deal_items/promotional_bundles/stagnant_deals` (InnoDB utf8mb4, JSON Rule7, FULLTEXT ngram x2, POINT SRID4326 GENERATED + SPATIAL, Tiered Mutation), 24h stagnant cron, hierarchical taxonomy — DDL `database/schema/2026_09_14_2.1c_deals_canonical.sql` + migration `2026_09_14_000012_create_deals_schema.php` + spec `docs/PHASE2_2.1C_DEALS_SCHEMA.md` with Mermaid ERD
- [x] **PHASE 2.1d — AU SERV Spatial [DONE]:** 3 tables canonical `service_providers/service_tickets/dispatch_logs` (InnoDB utf8mb4, POINT SRID4326 live + POLYGON SRID4326 coverage, SPATIAL INDEX x4, ST_Distance_Sphere sub-ms), 48h dispute + 12h grace, live heartbeat via Reverb — DDL `database/schema/2026_09_14_2.1d_serv_canonical.sql` + migration `2026_09_14_000013_create_serv_schema.php` + spec `docs/PHASE2_2.1D_SERV_SCHEMA.md` with Mermaid ERD + Spatial Query Layout
- [x] **PHASE 2.2a — Auth & Financial APIs [DONE]:** 9 endpoints canonical `POST /auth/login|register|refresh + GET /me + GET balance + POST deposit|withdraw-request + POST escrow/lock|release|dispute` (JWT 15m + HttpOnly 7d, Idempotency-Key, Pillar6 race-guard, 3-Tier snapshot, RBAC view≠execute) — spec `docs/PHASE2_2.2A_AUTH_FINANCIAL_APIS.md` + routes `routes/api/v1/auth_wallet_escrow.php`
- [x] **PHASE 2.2b — AU DEALS APIs [DONE]:** 7 endpoints canonical `POST listings + GET listings (FULLTEXT+Spatial feed) + GET listings/{uuid} + GET/POST stagnant + GET providers catalog` (Idempotency-Key, Oil1 contact hidden, 24h stagnant promote, FULLTEXT ngram) — spec `docs/PHASE2_2.2B_DEALS_APIS.md` + routes `routes/api/v1/deals.php`
- [x] **PHASE 2.2c — SERV & INVEST APIs [DONE]:** 4 endpoints canonical `POST /serv/tickets + PATCH radius + POST /invest/dispatches` + Reverb `presence-dispatch-{region}` live POINT + `private-invest.{uuid}` escrow (WSS 8080, ProviderLocationUpdated/TicketCreated/DispatchRadiusAdjusted) — spec `docs/PHASE2_2.2C_SERV_INVEST_APIS.md` + routes `routes/api/v1/serv.php|invest.php` + `routes/channels.php`
- [x] **PHASE 2.2d — AU MED Anonymized APIs [DONE]:** 4 endpoints canonical `GET /au-med/providers + GET providers/{uuid} + POST appointments (hash-only complaint) + POST telemetry/audit (SHA256 hashes, ZERO raw)` + `AnonymizedTelemetryMiddleware` (422 raw block, TTL 90d PG) — spec `docs/PHASE2_2.2D_MED_APIS.md` + routes `routes/api/v1/med.php`
- [x] **PHASE 2.2e — Governance & Calibrator [DONE]:** 8 endpoints canonical `GET system/modules/status + POST toggle (no deploy, is_core lock) + POST leak-check (100% Regex) + GET calibrator/health-score (100→90% auto-heal) + POST pre-op (<15ms) + POST kill-switch (sever LLM) + GET/POST hitl queue/approve` — spec `docs/PHASE2_2.2E_GOVERNANCE_APIS.md` + routes `routes/api/v1/governance.php`
- [x] **PHASE 2.2f — Workforce Marketplace [DONE]:** 4 endpoints canonical `GET agents catalogue + POST checkout (buyout license SaaS-only + subscription monthly via escrow 12h + Mutex) + GET tenant-agents + POST dispatch (HITL+Reverb)` + `private-tenant.{app_id}.workforce` streaming (Queued/Progress/Completed) + `EnsureTenantWorkforce` app_id isolation — spec `docs/PHASE2_2.2F_WORKFORCE_APIS.md` + routes `routes/api/v1/workforce.php` + `routes/channels.php`
- [x] **PHASE 2.3a — Backend Layout [DONE]:** Clean Arch DDD tree `app/Domain/{Wallet,Escrow,AUDeals,AUServ,AUInvest,AUMed,Workforce,Calibrator} + app/Services/{Rules,Security,Agents,Calibrator} + docker/sandboxes` (deterministic 0-cost, Regex 100%, Tri-Hybrid, SelfHealing) + 8 interface contracts (Repositories/Actions/Gates/Drivers) — spec `docs/PHASE2_2.3A_BACKEND_LAYOUT.md` + scaffold `.gitkeep`
- [x] **PHASE 2.3b — Frontend Layout [DONE]:** React 19 + Inertia v2 + Zustand tree `resources/js/{Components/{UI,Layout,Calibrator,Governance},Stores,Services,Router,Pages/AU MED|DEALS|SERV|INVEST|Admin}` + 4 HQ widgets (PerformanceGauge 100→90%, Emergency Red Button, MicroSwitchMatrixPanel, HitlInbox) + Guards (Auth/Role/AppId/FeatureFlag) — spec `docs/PHASE2_2.3B_FRONTEND_LAYOUT.md` + scaffold `.gitkeep`

## 2. Tech Stack Lock (NO deviations)
Backend Laravel 12 PHP 8.4 Action-Service-Repository | Frontend React 19 Inertia v2 | TS 5.7 strict zero any | Tailwind v4 Shadcn Lucide | Vite HMR+Prod | Reverb 8080 wss exclusive | MySQL 8.4 InnoDB utf8mb4 Spatial (JSON not JSONB) sole core | PostgreSQL 16 PostGIS+pgcrypto AU MED only + pgvector primary (Qdrant auxiliary) | Redis | AES-256-GCM per-row IV + TLS 1.3 | Cloudflare Enterprise/WAF + Nginx 20/s + Fail2ban PROD only

## 3. Applications Registry (5) — space-form app_id
AU BUSINESS `ab_` (core, non-hibernatable, owns Paymob sub-merchant + FX) | AU MED `amed_` (pgsql clinical+pgvector) | AU DEALS `adl_` | AU SERV `asv_` | AU INVEST `ainv_`

## 4. Agents: 13 Canonical | Modules: 9 — EXACTLY 9 (1-9)
Agents 1 CFO, 2 CTO, 3 CMO, 4 Vendor Success, 5 Customer Support, 6 SecOps, 7 CLO, 8 Supply Chain, 9 PR, 10 QA/Medical, 11 DevOps/Code Sandbox, 12 Global Controller, 13 Fraud/AML. Modules 1-9 Phase 1 (Auth→Dashboard) — Modules 10-15 VOID per 2026-09-14 correction.

## 5. Pillars 11 — All Enforced + Final Tweaks
Deterministic-First → Fallback <90% → Tri-Hybrid → CheckModuleStatus → RegexDataLeakDetector → lockForUpdate+Mutex → Calibrator → Ephemeral Swarm (prod) → Silent Token Rotation → Edge DoS (prod) → Tiered Mutation — plus final: pgvector, intervention/image GD, Parquet archive, Paymob sub-merchant auto.

## 6. Phase 1 FINAL Decisions (71 Points)
- **Identity 1-7 + Oil 30 update:** L1 Guest, L2 Phone, L3 ID/Business TOTP, revoke sessions, soft-freeze 3 MFA fails, annual re-verify, spatie RBAC immutable — plus **Oil 1:** Zero contact browsing/preview; business verified contact disclosed ONLY to targeted counterparty after programmatic purchase/hold + full escrow funding, never before
- **Ledger 8-14:** Unified multi-currency no bias, FX locked_at settlement, subunit int, double-entry hash append-only, daily reconciliation, no negative — plus **FX Seed:** exchangerate-api */30 FX_PROVIDER env
- **Escrow 15-27 + Oil 36:** Closed/Blind Paymob no local liquidity, 48h dispute, batch payouts, partial milestone, 0 wallet penalties, 24h hold, dynamic VAT, chargeback freeze, 5/min velocity, FX transparent, rolling caps, 90d vault, no code buyout — plus **Oil 3:** Single-payer buyer/requester only; seller service fee auto-deducted at settlement — plus **Paymob Suggestion:** auto sub-merchant via Paymob API + manual queue fallback
- **Deal Page 28-33 + Oil 30:** Points 50/day, 8-point equal weight 3/24mo badge, safety block dynamic — plus **Oil 1** strict timing above, Oil 4: Grace 12h once → auto-cancel + waiting-list reroute + technical penalty
- **Wallet/Checkout 34-39 + Oil 34/38:** 5% default dynamic per module — plus **Oil 2:** 5% base unified at launch, flexible per module via dashboard — OCR exact $0.01 → manual, barter 1.5x/1x split 50/50, grace 12h once, sacred wallet — plus **Oil 4** 12h once strict
- **Interaction 40-44 + Oil 40:** 500 favs cap — plus **Oil 5:** 500 max to prevent DB bloat/bot, barter delta لك/له banner, private.notifications.{id}, 6th suspension, views/clicks IP+session dedup 24h
- **Auxiliary 45-50 + Suggestions:** LOYALTY_POINTS in unified wallet, milestones once, 365d expiration deduction, AES-GCM IV, proportional discount, surge fixed/% — plus **pgvector primary, intervention/image GD, Parquet archive**
- **Workforce 51-53 + Oil 52:** Calibrator reject+auto-fix approvable, no buyout — plus **Oil 6:** Absolute no source code/app ownership transfer — SaaS + Smart Agent lease only — double-entry
- **HQ 54-59 + Suggestion Seeds:** Non-hibernatable core, global free overrides, 7d DRM quarantine 503, 80% budget → local 0-cost, 15-char rationale, 90d hot → S3 — plus **app_settings_schema seed** (p2p_quota=2, commission 5%, etc.)

## 7. Current Context & Next
- **Phase:** 2 ARCHITECTURE & SPEC — **2.1a+2.1b+2.1c+2.1d+2.2a+2.2b+2.2c+2.2d+2.2e+2.2f+2.3a+2.3b DONE** (Arena ultra-concise + React 19 HQ)
- **Deliverable now:** `[PROMPT 2.3b]` delivered — Frontend Layout + 4 HQ widgets (see `docs/PHASE2_2.3B_FRONTEND_LAYOUT.md`)
- **Next:** `[PROMPT 2.3c]` — Security Vault & DRM (awaiting prompt) — continuing FULL unabridged

## 8. Risks Mitigated
- Contact leak: Zero preview + post-escrow targeted disclosure only → eliminates scraping
- FX volatility: exchangerate-api + locked_at + transparent fee
- B2B dual-pay complexity: removed → single-payer simplifies state machine
- Agent buyout IP leak: SaaS-only eliminates source distribution
- DB bloat: 500 favs + Parquet archive + 90d S3 mitigates

---
**ملخص عربي:** تم تثبيت 71 نقطة نهائية (59 + 6 مقترحات + 6 تحديثات جوهرية النفط) — اكتمال 100% للتحليل، جاهز للتنفيذ المجهري بدون افتراضات.

*Last updated: 2026-09-14 — Rule 20 — Arena — Phase 2.3b DONE — Next: [PROMPT 2.3c]*

---
## 9. MANDATORY GLOBAL CORRECTION 2026-09-14 — 15→9 Modules

**Canonical Correction Applied:** System is EXACTLY **9 MODULES (1-9)** — 5 Applications (AU BUSINESS + AU MED/AU DEALS/AU SERV/AU INVEST) | 13 Agents | 9 Modules

**Defect Fixed:** Prior references counting 15 modules incorrectly included 4 B2C Spokes, financial ledger core, and AI gateway as extra modules, plus counted Phase 2/4/5/6 work packages (Core Infra, Frontend Master, Backend B.1-B.14, RBAC, Poison Pill, Test Suites) as Modules 10-15. Those are **NOT modules** — they are sub-systems integrated inside Modules 1-9 (e.g., RBAC → Module 9 Module 7/13, Poison Pill → Module 9 Module 14).

**Files corrected:** `abduniproject/.arenarules` (total_modules 15→9, ecosystem_scale), `abduniproject/docs/MODULES_INDEX.md` (rewritten to 9), `PROJECT_STATE.md` (§0/§1/§4), `abduniproject/docs/CANONICAL_MANIFEST.md` (verified), `PHASE1_MASTER_ARCHITECTURE` and `PHASE1_FINAL_COMPREHENSIVE` addendum applied in next commit.

**Single Source of Truth:** Table 1.4 = 9 rows (Phase 1 Modules 1-9). Any reference to Module 10-15 is a defect to be ignored.
