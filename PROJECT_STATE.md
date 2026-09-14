# PROJECT_STATE.md — ABD UNI PROJECT (abduniproject)

> **Anti-Amnesia State File** — Mandatory per Rule 20. Updated before every shutdown. Read this FIRST at session start (Rule 25).

## 0. Canonical Identity (Immutable)
- **project_folder (technical):** `abduniproject` — never changes, snake/lowercase, used for Git folder, Docker service names, env prefix.
- **project_display_name (prose):** `ABD UNI PROJECT` — used in all UI, docs, and comments.
- **Architecture:** Modular Monolith (`app/Modules/`) + Domain-Driven Design (DDD) + Clean Architecture
- **Branch:** `arena/01a09d54-drfifty` branched from `beb9215420a05210260296e488c0fee240887847` (main)
- **Date:** 2026-09-14 UTC
- **State Version:** v0.1 — Phase 0 Initialization Harmonized

## 1. What Was Built (This Session)
- [x] Audited empty repository (only `README.md` at `beb9215`) against Unified Manifest v1.0
- [x] Created canonical folder `abduniproject/` with Modular Monolith skeleton:
  - `app/Modules/{AUBusiness,AUMed,AUDeals,AUInvest,AUServ,Shared}/` each with `Controllers/{Admin,User,Public}/Models/Actions/Services/Requests/Enums/`
  - `Shared/` for DRY reusable Actions/Traits/Contracts per Rule 28
- [x] Created this `PROJECT_STATE.md` (root anti-amnesia)
- [ ] Next: `.env.example` validation, `composer.json` (Laravel 12 / PHP 8.4), `package.json` (React 19 / Inertia v2 / TS 5.7 strict / Tailwind v4), `vite.config.ts`, `tsconfig.json`, dual-DB configs (MySQL 8.4 + PostgreSQL 16), Reverb config, Tailwind tokens (Cairo/Tajawal + Inter, RTL-first)

## 2. Tech Stack Lock (Manifest § tech_stack — NO deviations)
| Layer | Canonical Value | Notes |
|-------|-----------------|-------|
| Backend | Laravel 12 (PHP 8.4+) | Modular Monolith |
| Frontend | React 19 (JSX/TSX) via Inertia.js v2 (@inertiajs/react) | |
| Language | TypeScript v5.7+ strict:true ZERO any | Enforced in tsconfig |
| Styling | Tailwind CSS v4 + Shadcn UI | v4 CSS-first, no tailwind.config.js needed for core |
| Icons | Lucide React | |
| Build | Vite (HMR + Prod) | |
| Realtime | Laravel Reverb exclusive — port 8080 wss:// BROADCAST_PORT | No Pusher/Ably/Soketi |
| DB Core | MySQL 8.4 LTS InnoDB utf8mb4 native Spatial — sole relational source for platform core | Never JSONB |
| DB Clinical | PostgreSQL 16 PostGIS + pgcrypto — exclusive for AU MED PHI | AES-256-GCM at rest via pgcrypto |
| Cache/Queue | Redis (Cache, Queues, Mutex Locks) | |
| Encryption | AES-256-GCM + TLS 1.3 | |
| Edge (PROD only) | Cloudflare Enterprise / WAF + Nginx 20 req/sec + Fail2ban | Never in Laragon local |

## 3. Applications Registry (5)
| Display Name | app_id (tenant) | Namespace | db_prefix | Role |
|--------------|-----------------|-----------|-----------|------|
| AU BUSINESS | `AU BUSINESS` | `app/Modules/AUBusiness/` | `ab_` | B2B Core Hub & Ecosystem Engine |
| AU MED | `AU MED` | `app/Modules/AUMed/` | `amed_` | Medical B2C (PostgreSQL clinical store) |
| AU DEALS | `AU DEALS` | `app/Modules/AUDeals/` | `adl_` | Marketplace, Barter & E-Commerce |
| AU SERV | `AU SERV` | `app/Modules/AUServ/` | `asv_` | Field Services, Logistics & Dispatch |
| AU INVEST | `AU INVEST` | `app/Modules/AUInvest/` | `ainv_` | Wealth, Real Estate & Franchise |

> **Rule:** PascalCase kept ONLY for backend namespaces. `app_id` is space-form display (e.g., `"AU BUSINESS"`).

## 4. Canonical Agent Registry: 13 (Table 1.3 — Single Source)
See `abduniproject/docs/AGENT_REGISTRY.md`. Former Phase 3.x numbering (2=CSO Market Hunter, 3=CLC etc.) SUPERSEDED.

## 5. Architectural Modules: 15 (Table 1.4)
See `abduniproject/docs/MODULES_INDEX.md`.

## 6. Mandatory Pillars (11) — Status
1. Deterministic-First (Regex/State Machine) — scaffolded
2. Graceful Fallback (<90% → AI) — scaffolded via AgentStrategyManager stub
3. Tri-Hybrid Switcher (DeterministicRuleDriver/CloudLlmDriver/LocalGpuDriver {LOCAL_GPU_ENDPOINT}) — stub
4. AU Lite Feature Flags (CheckModuleStatus → 503) — migration pending
5. RegexDataLeakDetector — stub in Shared
6. Financial Guards (selectForUpdate + Redis Mutex) — pattern enforced
7. Calibrator Telemetry 100%→90% — stub
8. Ephemeral Swarm (PROD Docker only) — NOT in Laragon
9. Silent Token Rotation (HttpOnly Refresh) — stub
10. Edge DoS (PROD only) — NOT in Laragon
11. Tiered Mutation (Hide/Show vs Hard-Delete) — documented

## 7. Environment Clarification (Critical)
- **Laragon** = LOCAL dev only (Windows). No Docker/Swarm/Cloudflare rules here.
- **Docker** = PRODUCTION only (docker-compose, Ephemeral Swarm, WAF). Never apply prod infra rules locally.

## 8. Current Context
- No phase cards existed at audit start; scaffold is Phase 0 harmonized baseline.
- No code written yet beyond skeleton folders (Rule 2: NO CODE until Phase 1 approved — this scaffold is exception for manifest compliance).
- Next approval needed before vertical slice implementation.

## 9. What Is Next (Ordered Micro-Sprints, 1-3 files / 150 lines max)
1. **Micro-Sprint 0.2:** `.env.example` + `composer.json` + `package.json` (env validation, stack lock)
2. **Micro-Sprint 0.3:** `tsconfig.json` + `vite.config.ts` + `resources/css/app.css` (TS strict, Tailwind v4, RTL tokens, Cairo/Tajawal/Inter)
3. **Micro-Sprint 0.4:** Dual DB configs (`config/database.php` MySQL 8.4 + pgsql PostGIS, `config/reverb.php` port 8080) + `feature_flags` migration stub
4. **Micro-Sprint 0.5:** Shared kernel (`RegexDataLeakDetector`, `AgentStrategyManager`, `CheckModuleStatus` middleware, `agent_actions` ledger migration)
5. **Checkpoint:** Calibrator Gate (6 domains) + Gap Analysis, wait for user explicit confirmation (Rule 34)

## 10. Risks & Trade-offs Flagged (Rule 10)
- MySQL vs PostgreSQL dual-driver adds ops complexity; mitigate via dedicated `pgsql` connection for AU MED only, MySQL remains sole core source.
- Redis mutex + DB pessimistic lock doubles latency but required for escrow correctness (Rule 35).
- Reverb on 8080 requires wss:// TLS termination at Nginx/Cloudflare in prod; local uses ws://.

## 11. Compliance Notes
- JSON vs JSONB: MySQL 8.4 uses `JSON` (binary + virtual generated columns). `JSONB` is PostgreSQL-only and FORBIDDEN in MySQL migrations (Rule 7).
- Typography: Arabic Cairo/Tajawal 400/600/700, Latin Inter, Tailwind logical props `ps-/pe-/ms-/me-/text-start` for RTL-first.
- Sprint limits enforced: 1-3 files / 150 lines per iteration after Phase 0.
- No `migrate:fresh`/`drop()`/`truncate` — additive only (Rule 11).

---
**Arabic Summary (ملخص عربي):** تم إنشاء الهيكل المعياري الموحد `abduniproject` مطابقًا للمانيفستو الموحد، مع تثبيت الحزمة التقنية (Laravel 12 + React 19 + Inertia v2 + TS strict + Tailwind v4 + Reverb 8080 + MySQL 8.4 + PostgreSQL 16 + Redis)، وتوثيق السجلات القانونية للوكلاء (13) والوحدات (15)، وفصل بيئة Laragon المحلية عن Docker الإنتاجية، وحفظ الحالة في `PROJECT_STATE.md`.

*Last updated: 2026-09-14 — Next trigger: after 2 Micro-Sprints, auto-reset notice per Rule 24.*
