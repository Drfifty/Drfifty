# ABD UNI PROJECT — `abduniproject`

> **Display name:** `ABD UNI PROJECT` (prose/UI) · **Technical folder:** `abduniproject` (never changes) — per Unified Architectural Manifest (Canonical Reference).

## Architecture
- **Modular Monolith** `app/Modules/` + **DDD** + **Clean Architecture**
- Backend: Laravel 12 (PHP 8.4) · Frontend: React 19 via Inertia v2 · TS 5.7 strict (zero any) · Tailwind v4 + Shadcn · Lucide · Vite · Reverb (8080 wss)
- **MySQL 8.4 LTS** (InnoDB utf8mb4 Spatial) — sole core relational source · **PostgreSQL 16** (PostGIS + pgcrypto) — exclusive AU MED clinical store
- Redis (cache/queue/mutex) · AES-256-GCM + TLS 1.3 · Cloudflare Enterprise / WAF + Nginx 20/s + Fail2ban (**PROD Docker only**)

## Applications (5)
- `AU BUSINESS` (`ab_`) — B2B Core Hub · `AU MED` (`amed_`, pgsql) — Healthcare · `AU DEALS` (`adl_`) — Marketplace/Barter · `AU SERV` (`asv_`) — Field Services · `AU INVEST` (`ainv_`) — Wealth/Real Estate
- Tenant isolation via `app_id` (space-form). PascalCase only for namespaces.

## Quick Start (Laragon — LOCAL)
```bash
cp .env.example .env
composer install
php artisan key:generate
php artisan migrate
npm install
npm run dev          # Vite HMR 5173
php artisan reverb:start --port=8080
```
Laragon = local only. Never apply Docker/Swarm/WAF rules locally.

## Production (Docker — PROD ONLY)
```bash
docker compose -f docker-compose.prod.yml up -d --build
```
See `docker-compose.prod.yml` — Ephemeral Swarm workers + Nginx + Fail2ban.

## Docs
- `docs/CANONICAL_MANIFEST.md` — single source of truth
- `docs/AGENT_REGISTRY.md` — 13 agents (supersedes Phase 3.x numbering)
- `docs/MODULES_INDEX.md` — 15 modules
- `docs/COMPLIANCE_AUDIT_2026-09-14.md` — audit gate
- `../PROJECT_STATE.md` — anti-amnesia state (read first each session)

## Typography & RTL
Arabic Cairo/Tajawal 400/600/700 · Latin Inter · RTL-first `dir=rtl` + Tailwind logical `ps-/pe-/ms-/me-/text-start`

---
*Scaffold Phase 0 Harmonized — 2026-09-14 — Next: await Phase 1 approval (Rule 2).*
