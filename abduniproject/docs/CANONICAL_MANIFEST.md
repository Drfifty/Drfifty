# ABD UNI PROJECT — CANONICAL MANIFEST (Phase 0 Harmonized)

> **Single Source of Truth** — Every phase card MUST conform to this file. Conflicts are defects. Last synced: 2026-09-14

## Identity
```yaml
project_folder: "abduniproject"           # technical/folder form — never changes
project_display_name: "ABD UNI PROJECT"   # display prose in all UI/docs
architecture: "Modular Monolith (app/Modules/) + DDD + Clean Architecture"
```

## Tech Stack (Locked)
```yaml
backend: "Laravel 12 (PHP 8.4+)"
frontend: "React 19 (JSX/TSX) via Inertia.js v2 (@inertiajs/react)"
language: "TypeScript v5.7+ (strict: true, ZERO any types)"
styling: "Tailwind CSS v4 + Shadcn UI Components"
icons: "Lucide React"
build: "Vite (HMR + Production Bundling)"
realtime: "Laravel Reverb — exclusive driver (WebSocket port 8080, wss://, BROADCAST_PORT)"
database_core: "MySQL 8.4 LTS (InnoDB, utf8mb4, native Spatial) — sole relational source for platform core"
database_clinical: "PostgreSQL 16 (PostGIS + pgcrypto) — exclusive clinical store for AU MED"
cache_queue: "Redis (Cache, Queues, Mutex Locks)"
encryption: "AES-256-GCM at rest (incl. AU MED PHI via pgcrypto) + TLS 1.3 in transit"
```

## Applications (5) — Space-form app_id, PascalCase ONLY for namespaces
| Display Name | app_id | Namespace | db_prefix | Role |
|--------------|--------|-----------|-----------|------|
| AU BUSINESS | `AU BUSINESS` | `app/Modules/AUBusiness/` | `ab_` | B2B Core Hub & Ecosystem Engine |
| AU MED | `AU MED` | `app/Modules/AUMed/` | `amed_` | Medical B2C (PostgreSQL clinical store) |
| AU DEALS | `AU DEALS` | `app/Modules/AUDeals/` | `adl_` | Marketplace, Barter & E-Commerce |
| AU SERV | `AU SERV` | `app/Modules/AUServ/` | `asv_` | Field Services, Logistics & Dispatch |
| AU INVEST | `AU INVEST` | `app/Modules/AUInvest/` | `ainv_` | Wealth, Real Estate & Franchise |

## Typography & RTL
- Arabic: Cairo / Tajawal (400/600/700) · Latin & numerals: Inter — Phase 3.0 token set
- RTL-first (dir=rtl) with dynamic LTR; Tailwind logical props `ps-/pe-/ms-/me-/text-start/text-end`

## Sprint & Edge
- Sprint limits: 1–3 files / iteration · 150 lines / file max
- Production edge: Cloudflare Enterprise / WAF + Nginx (20 req/sec per IP) + Fail2ban — **PROD Docker only**
- Fallback threshold: Confidence Score < 90% or Regex Mismatch → AI fallback

## Environment Clarification
- **Laragon** = LOCAL dev (Windows, manual testing). No Docker/Swarm/WAF rules.
- **Docker** = PRODUCTION only (docker-compose, Ephemeral Swarm, WAF). Never apply prod rules locally and vice versa.

## Core Rules 1–38
See `PROJECT_STATE.md` §6 and manifest preamble. Key enforcements:
- Rule 7: MySQL 8.4 uses native `JSON` (binary + virtual generated columns) or `listing_attributes` relational table. **Never `JSONB`** — PostgreSQL-only → hard migration failure.
- Rule 11: No `migrate:fresh`/`drop()`/`truncate` — additive only.
- Rule 12: Eloquent only, multi-tenant via `app_id`, never raw SQL.
- Rule 27: Controllers (HTTP only) → Actions/Services (business) → Models (data).
- Rule 28: Shared logic in `app/Modules/Shared/` — zero duplication.
- Rule 35: Wallet/escrow writes require `lockForUpdate()` + Redis mutex + `RegexDataLeakDetector`.
- Rule 37: No `COUNT(*)`/`GROUP BY` on live wallets/escrow — read from pre-aggregated stats/cache.
- Rule 38: Secrets in `.env` + `.env.example` with comments, validated via `env()`.

## Pillar Notes
- Pillar 8 Ephemeral Swarm & Pillar 10 Edge DoS are **PRODUCTION Docker only**.
- All pillars 1–11 mandatory; see `PROJECT_STATE.md` for scaffold status.

---
*Source: Unified Architectural Manifest (Canonical Reference) — harmonized 2026-09-14*
