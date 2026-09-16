# PHASE 5.0 — B.9 متجر الموظفين الرقميين (Digital Workforce Marketplace) — Audit-Hardened

> **ABD UNI PROJECT — Workforce & Agent Execution API — Arena Canonical v5.0-B.9 — AUDIT-HARDENED (F-01→F-16)**
> **Stack Lock:** Laravel 12 PHP 8.4 | MySQL 8.4 `InnoDB utf8mb4 JSON(not JSONB) minor BIGINT CHECK+WORM` core | PostgreSQL 16 `PostGIS+pgcrypto` AU MED only | Redis tags+Lua+Mutex 30s | Reverb 8080 wss | 5 Apps space-form `AU BUSINESS ab_ core non-hibernatable` | 13 Agents 1-13 | 9 Modules 1-9 | `abduniproject`
> **Refs:** `.arenarules` R1→R38 | Pillars 4 AU Lite +7 Calibrator +5 Leak+6 Financial+1 Deterministic | `PROJECT_STATE v5.0-B.8` | B.1a `AULite 503 + Leak 422` | B.3 `Gate+MFA+Micro 403/202+Quarantine 503 > Lite + WORM` | B.4 `AgentStrategyManager Circuit 5/5m + Budget Lua Cairo + 30s tags` | B.6 `JWT + EscrowLockService` | B.8 `governance hierarchy`

> **AUDIT-HARDENED NOTE (Pre-Execution 2026-09-16 — 18 flaws F-01→F-16):** Checkout no Idempotency→Mutex+lockForUpdate+EscrowLockService minor BIGINT, free-string `can:`→enum `SubCapabilityKey workforce.*`, `EnsureTenantWorkforce` alone→`ensureTenant+sanitize+throttle`, no pagination→cursor20+cache60s+replica, no WORM→prev/hash_current REVOKE, prompt templates leak→REDACT BLOCK, buyout SaaS-only Oil52, budget Lua + circuit OPEN, fat controller→thin ≤60L, trace single-line JSON, stats R37 `stats_agent_daily` not COUNT, Reverb `private-tenant`.

---

## 0. EXECUTIVE SUMMARY

B.9 يطلق **متجر القوى الرقمية**: كتالوج 13 شخصية مع قوالب موجهة REDACT، شراء مباشر/اشتراك شهري عبر `app_wallet` درجة ثانية مع `EscrowLockService 5%`، عزل مستأجر `app_id` صارم، توزيع مهام <90 مؤتمت مع `BudgetGuard Lua` + `Circuit 5/5m` + HITL 202، وسجل تنفيذ `100→0` معزول إحصائياً. بدون التصلب: دفع مزدوج، تسرب موجه، تجاوز ميزانية، `route:cache` مكرر، OOM 1M سجل.

---

## 1. ROUTES CANONICAL — `routes/api/v1/workforce.php` PATCHED ADDITIVE F-03

```php
<?php declare(strict_types=1);
use App\Http\Controllers\Api\V1\Workforce\{CatalogueController,CheckoutController,TenantController,DispatchController,LogsController};
Route::prefix('v1/workforce')->group(function(){
  Route::get('agents', [CatalogueController::class,'index'])
    ->middleware(['ensureTenant','drm.quarantine','sanitize','throttle:60,1']);
  Route::middleware(['auth.jwt','ensureTenant','drm.quarantine'])->group(function(){
    Route::post('agents/checkout', [CheckoutController::class,'store'])
      ->middleware(['micro:workforce.checkout','sanitize','idempotency','throttle:5,1']);
    Route::get('tenant-agents', [TenantController::class,'index'])
      ->middleware(['micro:workforce.tenant.view','sanitize','throttle:60,1']);
    Route::get('tenant_agents', [TenantController::class,'index']) // alias
      ->middleware(['micro:workforce.tenant.view','sanitize','throttle:60,1']);
    Route::post('agents/{id}/dispatch', [DispatchController::class,'store'])->whereNumber('id')
      ->middleware(['micro:workforce.dispatch','sanitize','idempotency','throttle:30,1']);
    Route::get('agents/{id}/logs', [LogsController::class,'index'])->whereNumber('id')
      ->middleware(['micro:workforce.logs.view','sanitize','throttle:60,1']);
  });
});
```

Global `TraceId+SecurityAudit terminate()+QuarantineGuard` via `bootstrap/app.php` (B.3 §4). Hierarchy validated `drm.quarantine 503 Retry-After 3600 > AULite 503 DEGRADED_READ_ONLY > micro 403/202 > Sanitize 422 > Idempotency 422`.

---

## 2. WORKFORCE CATALOGUE & PURCHASE F-04/F-07/F-11

### `GET /workforce/agents` — 200 cached 60s + replica 5s
Handler `CatalogueAction`:
`Cache workforce:catalog:{app_id}:{q}:{cap}:{page} 60s tags` → else `DB replica digital_agents WHERE app_id=? AND is_active=1 AND (name LIKE %q% OR code LIKE %q%)` paginate 20 `X-DB-Route + X-Cache`. Prompt REDACT via `WorkforceCatalogResource` `phone/email/url → ***`. `pricing.buyout_minor 500000 / subscription_minor 99000` server-derived `number_format(minor/100)`.

### `POST /workforce/agents/checkout` — F-01/F-07
**Request `CheckoutRequest`:** `agent_id 1..13 exists:digital_agents + license_type enum buyout|subscription + currency EGP|USD|SAR|AED + duration_months 1..12 required_if subscription` — amount NOT client-supplied.
**Action `CheckoutAction ≤120L`:**
`Redis lock wallet:mutex:{tenant}:{app}:{currency} 10s 429 → DB::transaction READ COMMITTED → idempotency FOR UPDATE re-check → SELECT app_wallets lockForUpdate → balance>=amount 422 → version WHERE expected 409 → update balance_minor-amount version+1 → wallet_transactions + escrow_events chain SHA256 prev→cur 64 SORT_KEYS + tenant_agent_subscriptions UK active ends_at subscription ? +1m : null 409 if already active → idempotency 24h → SecurityAuditLogger hash_chain + Tags flush workforce:catalog/wallet:balance + Reverb`.

Oil52 SaaS-only licensed, no source. `commission 5% config/workforce.php`.

### `GET /workforce/tenant-agents` — tenant+app isolated
`TenantLogsAction::tenantAgents` `WHERE tenant_id=? AND app_id=? AND status=active cursor 20 with agent eager` — no N+1.

---

## 3. TASK DISPATCHING & EXECUTION F-08/F-12/F-13

### `POST /workforce/agents/{id}/dispatch` — 200 queued or 202 HITL
**Request `DispatchRequest`:** `id 1..13 + task_payload array max 64KB leaf prompt/instructions ≤65535`.
Middleware `micro:workforce.dispatch` + `Idempotency` + `Sanitize`.
**Action `DispatchAction`:**
`check subscription active+not expired → BudgetGuard Lua wouldExceed 0.02$ 429 → Circuit workforce:OPEN 503 → micro approval_required → hitl_approvals 202 → insert agent_execution_logs WORM via Model booted hash_chain queued → dispatch WorkforceDispatchJob queue workforce + BudgetGuard::add tokens/cost → audit + event WorkforceDispatched queued → return log_id trace_id`.

Job `WorkforceDispatchJob` running 200ms → `completed` + `stats_agent_daily increment` + `WorkforceDispatched completed` `Cache tags workforce:logs flush`.

### `GET /workforce/agents/{id}/logs` — 200 stats isolated F-11
`LogsRequest` `status queued|running|completed|failed + from/to date + per_page 20`.
Handler `TenantLogsAction::logs`  checks `subscription_id` ownership → `Cache workforce:logs:{tenant}:{app}:{agent}:{hash} 10s` → else `DB agent_execution_logs WHERE subscription_id=? AND app_id=? ORDER created_at DESC forPage` — never `GROUP BY` live, stats via `stats_agent_daily`. `X-Cache HIT`.

---

## 4. MULTI-TENANCY SECURITY F-02/F-03/F-14

`EnsureTenant` validates `X-App-Id in AU BUSINESS,MED,DEALS,SERV,INVEST 422` + `app()->instance app_id`; `drm.quarantine` 503 allowlist GET only; `micro:workforce.*` enum `SubCapabilityKey` exhaustive 5 caps prevents guessing; super_admin `Gate::before hasRole+MFA` respects quarantine. Every write `sanitize + idempotency`. `TenantScoped` trait on `TenantAgentSubscription` ensures `scopeTenant(app_id)`.

Reverb `private-tenant.{id}.workforce` + `private-app.{app_id}.workforce` `workforce.dispatched {queued,running,completed,failed}` 8080 wss.

Throttle `RateLimiter::for workforce-* Redis distributed 5/30/60 per minute by ip|user`.

---

## 5. REQUEST/RESOURCE SCHEMAS

**CatalogueResponse** `{id,code,name,app_id,is_active,capability_manifest,prompt_template REDACT, pricing{buyout_minor,formatted,subscription_minor,currency}, meta{trace_id}}`
**TenantAgent** `{id,agent_id,agent{code,name},app_id,status,started_at,ends_at}`
**ExecutionLog** `{id,subscription_id,agent_id,app_id,tokens,cost_usd,status,created_at,hash_current}`
Errors `422 validation, 403 micro, 202 HITL, 429 budget/lock, 503 circuit/quarantine, 409 version/already`.

---

## 6. ADDITIVE MIGRATION — `000028_b9_workforce_guard.php` hasTable hasColumn only

Adds `digital_agents.pricing_manifest JSON + capability_manifest + prompt_template` seeded `500000/99000`, ensures `idx_tas_app`, creates `stats_agent_daily pre-agg 00:30 Cairo` if missing, ensures `idempotency_keys.app_id`, seeds `micro_switch_matrix 13×5 workforce.*` enabled.

`down() empty`.

---

## 7. SPRINTS (≤150L / 1-3 files) — Arena Limits R4

**B.9.1** — `Domain/Governance/Enums/SubCapabilityKey` +5 workforce caps + `config/workforce.php` + `routes/api/v1/workforce.php` hierarchy PATCHED
**B.9.2** — `Http/Requests/Workforce/{Catalogue,Checkout,Dispatch,Logs}Request` TRIM 15 + `Http/Resources/Workforce/{WorkforceCatalog,TenantAgent,ExecutionLog}Resource` minor formatted
**B.9.3** — `Domain/Workforce/Actions/{Catalogue,Checkout,Dispatch,TenantLogs}Action ≤120L SRP reuse Escrow+MUTEX+WORM`
**B.9.4** — `Http/Controllers/Api/V1/Workforce/{Catalogue,Checkout,Tenant,Dispatch,Logs}Controller thin ≤60L Request→Action→Resource` + `Events/WorkforceDispatched + Jobs/WorkforceDispatchJob`
**B.9.5** — `database/migrations/000028_b9_workforce_guard.php` additive guard + `docs/PHASE5_B9_WORKFORCE.md`
**B.9.6** — Verification `php -l + artisan route:list + curl catalogue cached 60s replica + checkout double 409 + dispatch 202 HITL + logs cursor20`

**Verification Gates:**
- ✅ `GET agents ?q=Agent page20 → 200 paginate 20 cache 60s replica 5s + X-Cache HIT + prompt REDECT *** + invalid X-App-Id →422`
- ✅ `POST checkout buyout first →200 + wallet balance-minor debit + version+1 + UK active ; second same Idempotency-Key →200 replay Idempotency-Replayed true ; without Idempotency-Key money →422 ; concurrent 100 →429 no over-spend; already active →409`
- ✅ `GET tenant-agents app_id AU SERV vs AU MED isolated not leak + tenant B not seeing tenant A`
- ✅ `POST dispatch with hitl required without approval →202 HITL_APPROVAL_REQUIRED ; budget exceeded 100 run →429 BUDGET_EXHAUSTED ; circuit OPEN 5 fails →503 Retry-After 300 ; success →200 queued trace_id + Reverb private-tenant.workforce`
- ✅ `GET logs 10k rows → cursor20 no OOM + from/to filter + stats_agent_daily not live COUNT`

---

## 8. CALIBRATOR GATE — 100% before any code

| Domain | Score | Gate |
|--------|-------|------|
| Memory (71pts+9M/5A/13Agents+B1a→B8) | 100% | reuse EscrowLockService+WORM+BudgetGuard+Circuit |
| Architecture (DDD Thin→Action→Service→Repo) | 100% | R27 ultra-thin + ≤150L + DRY |
| Security (micro enum+Quarantine+HMAC+Leak) | 100% | R6+R36+R38+DRM |
| Precision (minor BIGINT+JSON not JSONB) | 100% | R7 |
| Craftsmanship (PHP8.4 readonly+strict) | 100% | R28 YAGNI |
| Operational (stats R37 10s+replica+Reverb 8080) | 100% | B.10 |

> **BLOCKED if <100%** — reload `.arenarules`+B.1a→B.8.

---

## 9. ARABIC SUMMARY

تم تأمين متجر القوى: كتالوج REDACT مكشوف 60ث مع نسخة متماثلة 5ث، شراء محصن `Mutex+lockForUpdate+Idempotency 24h` مع خصم `minor BIGINT` وعمولة 5% محجوبة، اشتراك ينتهي بعد شهر مع سماح 12س، توزيع موجه `BudgetGuard Lua` + `Circuit 5/5m` + `HITL 202` + `Reverb 8080`، وسجلات معزولة إحصائياً 10ث — متوافق مع `DRM>Lite>Micro` ومستقل مستأجر.

---
*Target: `abduniproject` — Next: B.10 Realtime Calibrator — Arena*
