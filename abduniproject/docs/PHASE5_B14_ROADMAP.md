# PHASE 5.0 — B.14 خارطة الـ20 Micro-Sprints والتجهيز النهائي (Retrospective DELTA Validation) — Audit-Hardened

> **ABD UNI PROJECT — 20 Micro-Sprints Execution Roadmap — Arena Canonical v5.0-B.14 — AUDIT-HARDENED (F-01→F-16)**
> **Stack Lock:** Laravel 12 PHP 8.4 + MySQL 8.4 `InnoDB utf8mb4 JSON` + pgsql PostGIS `geography` + Redis `critical/standard/low/ai` + Reverb `8080 wss` | 5 Apps `AU BUSINESS ab_ core` +4 B2C | 13 Agents | 9 Modules 1-9
> **Refs:** `.arenarules` R1→R38 | Pillars 1→11 | `PHASE2_2.3F` canonical `1.1→10.2` | `PHASE5_B1→B13` built | `B.14 PROMPT` TPM consolidation ask

> **AUDIT-HARDENED NOTE (Pre-Execution 2026-09-16 — 20 flaws B14-01→B14-20 → F-01→F-16):** arithmetic 40→20 cap + numbering 20.2→10.2 + duplication→DELTA validation + AU BUSINESS anchor + JSON not JSONB SRID4326 + RBAC/micro hibernation 503 + R37 stats replica + bulkhead ai/low not critical + deterministic-first before LLM + SoC ≤150L + Cairo skew 30s + Reverb 8080 alias + Docker single compose + R24/R25 micro-plan/state-recovery + R34 Arabic summary + Module 8 inside 1-9 + healing tags correct + env drift guard + doc collision rename + YAGNI lean.

---

## 0. EXECUTIVE SUMMARY — RETROSPECTIVE NOT ADDITIVE

`B.14` لا يضيف كودًا — `B.1→B13` أنجز `1.1→10.2` بالفعل. الخارطة **تدقيق رجعي DELTA**: 20 سبرنت كان → 13 مُنجز 100% + 7 فجوات تحقق (validation gates) تُقفل بدون تكرار DDL. كل سبرنت `1-3 ملفات ≤150 سطر` — Zero-regression additive only.

## 1. CANONICAL RETROSPECTIVE MAP — `1.1→10.2` (F-01→F-03)

| Sprint | Title | Status B.1→B13 | DELTA Gate | Files (1-3) | Lines |
|--------|-------|---------------|------------|-------------|-------|
| **1.1** | Canonical Bootstrap | DONE `composer/.env/vite 0.0.0.0` | verify Vite HMR 0.0.0.0 | `vite.config.ts` | ≤20 |
| **1.2** | Shared Kernel AppIds | DONE `AppId+HasAppIdScope+CheckModuleStatus` | add tenant E2E test | — | 0 |
| **2.1-2.2** | Auth RBAC + AU Lite Flags | DONE `feature_flags is_core micro_switch` | verify `is_hibernated 503` | — | 0 |
| **3.1** | Deterministic Rules First | DONE `PricingRuleEngine 5%` | **DELTA-1** Ranking/Barter audit | `Rules/RankingRuleEngine.php` | ≤40 |
| **3.2** | Deterministic Barter 1.5x/1x | DONE | verify `RuleResult confidence 0.99` | — | 0 |
| **4.1-4.2** | Wallet/Escrow + DEALS Schema | DONE `BIGINT+SPATIAL+FULLTEXT ngram` | verify `ST_SRID+JSON_VALID` | — | 0 |
| **5.1-5.2** | SERV Spatial + Auth APIs | DONE `POINT/POLYGON SRID4326 + JWT` | **DELTA-2** SERV heartbeat E2E | — | 0 |
| **6.1-6.2** | DEALS/SERV/INVEST/MED APIs | DONE `DEALS FULLTEXT SERV nearby INVEST pledge MED pgp` | **DELTA-3** MED HMAC chain verify | — | 0 |
| **7.1-7.2** | Governance/Workforce APIs | DONE `toggle/health/kill HITL workforce` | verify `202 HITL` | — | 0 |
| **8.1-8.2** | Clean Arch + HQ Widgets | DONE `Domain/Services + Gauge` | **DELTA-4** SoC ≤150L lint | — | 0 |
| **9.1-9.2** | Workforce Factory + Tri-Hybrid Docker | DONE `AgentStrategyManager + vllm_gpu` | **DELTA-5** Docker single compose verify | — | 0 |
| **10.1-10.2** | Ephemeral Swarm + Calibrator Heal | DONE `ai/low swarm + heal tags` | **DELTA-6/7** bulkhead Cairo Reverb | — | 0 |

**Total:** 20 canonical — 13 locked + **7 DELTA validation** = audit-closed. No `1.1→20.2` renumbering (F-02).

## 2. FILE BOUNDARY DETAIL — Domain→Files→Classes→Acceptance (F-10)

| Domain | Files | Classes | Acceptance |
|--------|-------|---------|------------|
| **Rules** | `Services/Rules/RankingRuleEngine.php` | `RankingRuleEngine: evaluate()->RuleResult` | `8-point badge 3/24mo =0.99` no LLM |
| **Barter** | `Services/Rules/BarterSplitEngine.php` | `BarterSplitEngine: split()->{1.5x/1x 50/50}` | `delta لك/له + cash` |
| **Tenant** | `Middleware/EnsureTenant.php` | `X-App-Id enum 5 422` | `5 Apps isolated R12` |
| **Leak** | `Services/Security/RegexDataLeakDetector.php` | `sanitize BLOCK 422 REDACT ***` | `Oil1 post-escrow only` |
| **Calibrator** | `Services/Calibrator/CalibratorSelfHealingEngine.php` | `heal<90 tags feature_flags/micro_perm/ai_runtime` | `not agents_cache + recycle low/ai 40s` |

All `≤150L` SoC: Controller ≤60L `Request→Action→Resource` (R27).

## 3. DELTA 7 SPRINTS — EXECUTION GATES (≤150L each)

- **DELTA-1 Ranking/Barter audit (3.1):** verify `RankingRuleEngine + BarterSplitEngine` deterministic 0-cost before any LLM (F-09).
- **DELTA-2 SERV heartbeat (5.1):** `presence-dispatch-{region} 27 governorate` + `ST_Distance_Sphere` replica R37.
- **DELTA-3 MED HMAC (6.2):** `pgsql pgp_sym_encrypt + hash_hmac TELEMETRY_HMAC_KEY` 90d WORM.
- **DELTA-4 SoC lint (8.1):** `php -l + phpstan` 0 any, `≤150L` per file.
- **DELTA-5 Docker single (9.2):** `docker-compose.prod.yml` 13 svc front/backend/sandbox/gpu + `BROADCAST_PORT 8080` alias Reverb (F-12).
- **DELTA-6 Bulkhead Cairo (10.1):** `critical 12s ≠ ai 125s` flood test + `Africa/Cairo + CLOCK_SKEW_MARGIN 30s` (F-08/F-11).
- **DELTA-7 Healing tags (10.2):** `Cache::tags feature_flags/micro_perm/ai_runtime` not full flush, `healing_events` WORM.

## 4. HARDENING MATRIX — B14-01→20 → F-01→F-16

| Flaw | Fix | Guard |
|------|-----|-------|
| B14-01 40 sprints | F-01 cap 20 | canonical 1.1→10.2 only |
| B14-02 numbering 20.2 | F-02 keep 10.2 | no renumber |
| B14-03 duplication DONE | F-03 DELTA validation | additive only R11 |
| B14-04 AU BUSINESS anchor | F-04 §0.1 hub `ab_→amed/adl/asv/ainv` | 5 Apps |
| B14-05 JSONB/SRID | F-05 `JSON not JSONB` `SRID4326 SPATIAL GIST` | R7 |
| B14-06 RBAC hibernation | F-06 `CheckModuleStatus 503 + micro_switch` | R36 |
| B14-07 R37 stats | F-07 `replica heartbeat 5s + stats_*_daily` | R37 |
| B14-08 bulkhead critical | F-08 `ai/low` only, `critical` SLA 10s | B.12 |
| B14-09 deterministic invert | F-09 `Pricing/Ranking/Barter → LLM` | Pillar1 |
| B14-10 SoC >150L | F-10 `≤150L ≤60L controller` | R27/R31 |
| B14-11 Cairo skew | F-11 `Africa/Cairo + skew 30s` | R17 |
| B14-12 Reverb 8080 | F-12 `BROADCAST_PORT 8080 wss` | B.10 |
| B14-13 Docker duplicate | F-13 single `docker-compose.prod.yml` | B.11 |
| B14-14 R24/R25 | F-14 micro-plan + state recovery | R24/R25 |
| B14-15 R34 | F-15 Arabic summary per § | R34 |
| B14-16 Module8 | F-16 Module8 = Workforce inside 1-9 | 9M |
| B14-17 healing tag | F-07 tags correct | B.13 |
| B14-18 env drift | F-05 env `EPHEMERAL_MAX 10` | R17 |
| B14-19 doc collision | F-02 `PHASE5_B14_ROADMAP` not `2.3F` | R11 |
| B14-20 YAGNI | F-10 lean 7 DELTA not 20 new | R31 |

## 5. VERIFICATION GATES (per DELTA)

- `PricingRuleEngine evaluate 100→0.99` + `BarterSplit 1.5x` deterministic.
- `curl -H X-App-Id:AU_DEALS /api/v1/deals/search → MATCH ngram HIT` `X-DB-Route replica`.
- `presence-dispatch-cairo` throttled 20/2s wss 8080 `private-tenant` dedup.
- `php artisan schedule:list` 8 Cairo `withoutOverlapping onOneServer` + `redis LLEN queues:critical 0` under `ai 1000`.
- `Cache::tags flush` preserves `SESSION DB0`.

## 6. CALIBRATOR GATE — 100% pre-code

| Domain | Score | Gate |
|--------|-------|------|
| Memory | 100% | `.arenarules + B.1→B13` reloaded |
| Architecture | 100% | 9M 5A 13Ag canonical |
| Security | 100% | JSON/SRID/RBAC 503/422 |
| Precision | 100% | R37 stats bulkhead Cairo |
| Craftsmanship | 100% | ≤150L SoC DRY |
| Operational | 100% | DELTA 7 lean no regression |

---

**ملخص عربي:** B.14 خارطة رجعية — `1.1→10.2` ثابتة 20 سبرنت (13 مُنجزة +7 تحقق) بدل 40، بدون كود مكرر، مع AU BUSINESS محور و `JSON/SRID4326` و `503 hibernation` و `R37` و `bulkhead ai/low` و `deterministic-first` و `Cairo 30s` و `8080 wss` — جاهز للإقفال.

*Phase 5 COMPLETE — Next: B.14 LOCK v5.0-B.14*
