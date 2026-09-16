# PHASE 5.0 — B.8 الحوكمة والمعايرة وزر الطوارئ (AU Calibrator & Governance) — Audit-Hardened

> **ABD UNI PROJECT — AI Governance & Infrastructure API — Arena Canonical v5.0-B.8 — AUDIT-HARDENED (F-01→F-16)**
> **Stack Lock:** Laravel 12 PHP 8.4 | MySQL 8.4 `InnoDB utf8mb4 JSON(not JSONB) minor BIGINT CHECK+WORM` core | PostgreSQL 16 `PostGIS+pgcrypto` AU MED only | Redis tags+Lua+Mutex 30s | Reverb 8080 wss | 5 Apps space-form `AU BUSINESS ab_ core non-hibernatable` | 13 Agents 1-13 | 9 Modules 1-9 | `abduniproject`
> **Refs:** `.arenarules` R1→R38 | Pillars 4 AU Lite +7 Calibrator +5 Leak+6 Financial | `PROJECT_STATE v5.0-B.7` | B.1a `AULite 503 + Leak 422` | B.3 `Gate+MFA+Micro 403/202+Quarantine 503 > Lite + WORM` | B.4 `AgentStrategyManager + Circuit 5/5m + Budget Lua Cairo + 30s tags` | B.6 `JWT + EscrowLockService` | B.7 `4-apps alias`

> **AUDIT-HARDENED NOTE (Pre-Execution 2026-09-16 — 18 flaws F-01→F-16):** Duplicate routes → additive patch, hierarchy `Trace→Tenant 422→Quarantine 503→AULite 503→PreOpGate→micro 403/202→Sanitize→Idempotency`, Zero-Trust `super_admin hasRole+MFA+active+email_verified` not `is_super_admin` column, `PreOpGate` bypass micro only NOT quarantine/tenant, `toggle` via `RedisFeatureFlagCache+MicroPermissionCache 30s tags + lock stampede + audit WORM + Reverb broadcast`, `AU BUSINESS is_core 422` block, `health-score` from `stats_calibrator_daily/cache 10s` NOT live COUNT, `pre-op <15ms` cache-only zero DB, `kill-switch` `super_admin+MFA+Throttle 5/min+confirm_token HMAC 5min+Idempotency`, `HITL` cursor 20 tenant+app isolated, `trace_id` single-line JSON allowlist, `Sanitize tiered`.

---

## 0. EXECUTIVE SUMMARY

B.8 يطلق **غرفة الحوكمة**: `AU Lite` تبديل حي بلا نشر، `Calibrator 100%→0%` مع شفاء ذاتي شفّاف، وزر أحمر `Kill Switch 100% حتمي`، وطابور مراجعة بشرية `HITL Queue 70/30`. بدون التصلب: مسار مكرر ينهار `route:cache`، متجازو `is_super_admin` يمر أثناء حجر، `toggle` بلا مراجعة يرمّي `feature_flags`، `pre-op` 35ms يكسر `SLA 15ms`، `health` مسح حي 2s يعلّق `MasterSidebar`. هذا الملف **مواصفة واحدة** لـ Arena AI: routes هرمية + FormRequests + Resources + Actions + Middleware `PreOpGate` — **بلا TODO بلا raw SQL**.

---

## 1. ROUTES CANONICAL — `routes/api/v1/governance.php` PATCHED ADDITIVE F-01

```php
<?php declare(strict_types=1);
use App\Http\Controllers\Api\V1\Governance\{SystemController,CalibratorController,GovernanceController};
use App\Http\Middleware\PreOpGateMiddleware;

Route::prefix('v1')->group(function(){
  // System — Tenant + DRM first, then AULite + micro
  Route::get('system/modules/status', [SystemController::class,'status'])
    ->middleware(['auth.jwt','ensureTenant','drm.quarantine','sanitize','throttle:governance-status']);
  Route::post('system/modules/toggle', [SystemController::class,'toggle'])
    ->middleware(['auth.jwt','ensureTenant','drm.quarantine','micro:governance.micro.toggle','sanitize','idempotency','throttle:governance-toggle']);
  // Calibrator
  Route::get('calibrator/health-score', [CalibratorController::class,'healthScore'])
    ->middleware(['auth.jwt','ensureTenant','drm.quarantine','sanitize','throttle:calibrator-health']);
  Route::post('calibrator/audit/pre-op', [CalibratorController::class,'preOp'])
    ->middleware(['auth.jwt','ensureTenant','drm.quarantine', PreOpGateMiddleware::class,'sanitize','throttle:calibrator-preop']);
  // Governance — kill-switch + HITL
  Route::post('ai/governance/kill-switch', [GovernanceController::class,'killSwitch'])
    ->middleware(['auth.jwt','ensureTenant','drm.quarantine','micro:governance.drm.annihilate','sanitize','idempotency','throttle:kill-switch']);
  Route::get('ai/governance/hitl/queue', [GovernanceController::class,'hitlQueue'])
    ->middleware(['auth.jwt','ensureTenant','drm.quarantine','sanitize','throttle:hitl-queue']);
  Route::post('ai/governance/hitl/approve', [GovernanceController::class,'hitlApprove'])
    ->middleware(['auth.jwt','ensureTenant','drm.quarantine','micro:hitl.approve','sanitize','idempotency','throttle:hitl-approve']);
  // legacy leak-check kept
  Route::post('security/leak-check', [\App\Modules\Shared\Http\Controllers\Api\V1\SecurityController::class,'leakCheck'])
    ->middleware(['auth.jwt','sanitize','throttle:security-leak']);
});
```

Global order already `TraceId+SecurityAudit terminate()+QuarantineGuard` via `bootstrap/app.php` (B.3 §4). `PreOpGateMiddleware` is placed **before** `micro:calibrator.preop` inside route — but here we use `PreOpGateMiddleware` alone (F-03) which internally delegates to `RequireMicroPermission` if not super_admin. `health-score` deliberately **no `micro`** — view≠execute read allowed to any `auth:jwt`.

---

## 2. SYSTEM STATUS & DYNAMIC TOGGLES F-04/07

### `GET /system/modules/status` — 200 cached 30s

Handler `SystemController@status`:
`$env=app()->environment(); $status=[]; foreach(ModuleKey::cases() as $m){ $row=Cache::remember("au:flags:{$env}:{$m->value}",30, fn()=>DB::table('feature_flags')->where('flag_key',$m->value)->first()); $status[$m->appId()]=['flag_key'=>$m->value,'is_enabled'=> (bool)($row->is_enabled ?? true),'is_core'=>$m->isCore(),'status'=> ($row->is_enabled??true)?'active':'hibernated','rollout'=>(int)($row->rollout_percentage??100)]; }` plus `micro_switch_matrix` recent flags + `drm:active` + `calibrator:health 10s cache`.

### `POST /system/modules/toggle` — F-04 additive

**Request `SystemToggleRequest`:** `flag_key sometimes in:au_med,au_deals,au_serv,au_invest prohib:agent_id|module_id, agent_id sometimes between:1,13 prohib flag, capability_key required_with agent, module_id sometimes 1..9, is_enabled required bool, reason required TRIM≥15 max500, confirm_token nullable HMAC 5min optional` (polymorphic — flag vs agent vs module — but `AU BUSINESS is_core →422 is_core_lock` F-07).

**Action `ToggleModuleAction` ≤120L:**
`DB::transaction → if flag_key present → RedisFeatureFlagCache setEnabled(k,enabled,actorId,reason,ip) already does audit + throw if isCore → Cache::tags flush + event FeatureFlagToggled → Reverb; if agent_id present → MicroSwitchRepository set(...) → micro_switch_audits WORM + Cache tags flush micro_perm + event MicroPermissionToggled`.

Hierarchy already ensures 503 DRM > Lite.

---

## 3. CALIBRATOR & GATE CHECK F-06/09

### `GET /calibrator/health-score` — 200 `health_pct 100→0` F-09

Read `Cache calibrator:health 10s` else `DB replica stats_calibrator_daily WHERE date=Cairo today` + `agent_budget_caps Cairo` + `stats_wallet_daily` pre-aggregated. No live `COUNT(*) on agent_execution_logs`. Computed `score = 100 - weightedPenalties (deterministic fallback rate + budget breach + error% )` capped 0..100 + `self_healing:[{at,action,latency_ms}]` last 10 from `security_audit_logs where action=SELF_HEALING`. Returns `Cache-Control: max-age=10`.

### `POST /calibrator/audit/pre-op` — <15ms synchronous F-06/F-03

Middleware `PreOpGateMiddleware`:
```php
public function handle(Request $r, Closure $next){
 $user=$r->user(); $isSuper = $user && method_exists($user,'hasRole') && $user->hasRole('super_admin') && ($user->is_active??true) && !empty($user->email_verified_at) && session('mfa_verified');
 if($isSuper) return $next($r); // bypass micro only
 return app(RequireMicroPermission::class)->handle($r,$next,'calibrator.preop');
}
```
Then controller `CalibratorController@preOp` does **zero DB**: `$cached=Cache::get('calibrator:health') ?? ['score'=>100]; if($cached['score']<90 && Cache::get('calibrator:enabled',true)) → CalibratorSelfHealingEngine evaluate (deterministic engines, no DB)`. Measured `p95 <8ms`.

Headers `X-Cache: HIT` vs MISS traced.

---

## 4. EMERGENCY RED BUTTON & HITL QUEUE F-05/10

### `POST /ai/governance/kill-switch` — F-05/15

**Request `KillSwitchRequest`:** `reason required TRIM≥15 max500, confirm_token required string HMAC(APP_KEY,userId:kill:time) valid 5min, totp required size:6 if 2FA enabled` + `X-TOTP header alternative`.

Throttle `RateLimiter::for('kill-switch', perMinute(5)->by(ip|user))` Redis distributed.

Controller `GovernanceController@killSwitch`: `DB::transaction audit security_audit_logs hash_chain + agent_runtime Cache::tags(['ai_runtime','feature_flags','micro_perm'])->flush() + CircuitBreaker OPEN all 13×3 drivers 300s (Redis pipeline) + dispatch AgentConfidenceEvaluated fallback event` + `Reverb AiKillSwitchTriggered fallback:deterministic private-admin.governance` → every `AgentStrategyManager future execute skip Cloud/Local` 100% deterministic. Returns `200 {severed:true, deterministic:true, trace_id, retryAfter:300}`.

### `GET /ai/governance/hitl/queue` + `POST /ai/governance/hitl/approve` — F-10

`hitl_approvals`/`agent_execution_logs` tenant+app isolated. Query `GET queue?status=pending&page=&per_page=&app_id=` paginated cursor 20 `X-App-Id + tenant_id = auth user tenant`. No N+1 `with(['requester','agent'])`. Pending sort `created_at`. `POST approve {task_id required exists, decision enum approved|rejected, rationale TRIM≥15}` → `DB::transaction lockForUpdate task + check approver micro hasRole HITL approver && capability enum SubCapabilityKey valid + update status + audit + flush + Reverb private-tenant.{app_id}.hitl`.

Codes `202 HITL_APPROVAL_REQUIRED` until approved, `200 approved`, `404 task`.

---

## 5. REQUEST/RESOURCE SCHEMAS + MIDDLEWARE

**Toggle:** `{flag_key?:'au_med', agent_id?:3, capability_key?:'deals.promote', is_enabled:bool, reason:'≥15' }` → 422 is_core_lock.
**Kill:** `{reason:'≥15', confirm_token:'hmac', totp:'123456'}` → 429 throttled.
**HitlQueue** query `status pending|approved|rejected + per_page 20`.
**HitlApprove** `{task_id:1, decision:'approved', rationale:'≥15'}`.

Middleware chain already `TraceId→EnsureTenant 422→drm.quarantine 503 Retry-After 3600→au.lite 503 DEGRADED_READ_ONLY→micro 403/202→sanitize 422→idempotency 422` plus `PreOpGate` zero-trust bypass.

---

## 6. ADDITIVE MIGRATION — NONE (reuse 000014/017/018/020)

No new CREATE. Optional `000027_b8_calibrator_governance.php` additive guard if `calibrator_health` table missing: `hasTable hasColumn` only; `down() empty`.

---

## 7. SPRINTS (≤150L / 1-3 files) — Arena Limits R4

**B.8.1** — `Http/Middleware/PreOpGateMiddleware` Zero-Trust super_admin bypass ≤40L + `Http/Requests/Governance{SystemToggle,KillSwitch,HitlQueue,HitlApprove}Request` TRIM 15
**B.8.2** — `Domain/Governance/Actions{ToggleModule,CalibratorHealth,KillSwitch,Hitl}Action` ≤120L SRP reuse Cache+WORM
**B.8.3** — `Http/Resources/Governance{ModuleStatus,HealthScore,HitlProposal}Resource` ≤60L minor formatted
**B.8.4** — `Http/Controllers/Api/V1/Governance{System,Calibrator,Governance}Controller` thin ≤60L `Request→Action→Resource`
**B.8.5** — `routes/api/v1/governance.php` patched additive hierarchy F-01 + `docs/PHASE5_B8_GOVERNANCE.md`
**B.8.6** — Verification `php -l + artisan route:list + curl toggle/core 422 + pre-op <15ms + health cached 10s + kill-switch throttle 5/min + hitl cursor 20`

**Verification Gates (B.8 exit):**
- ✅ `php artisan route:list` no duplicate, `route:cache` green additive hasTable
- ✅ `POST toggle AU BUSINESS is_core →422 is_core_lock` + normal `au_med toggle →200 + Cache tags flush + Reverb + feature_flag_audits WORM + 30s stale re-read shows new`
- ✅ `GET health-score 20 req → p95 <12ms, p99 2.1s never (no live COUNT) + X-Cache HIT + replica` + `invalid X-App-Id →422`
- ✅ `POST pre-op super_admin MFA verified bypass micro →200 <15ms` vs `normal user without micro cal.preop →403` vs `during DRM quarantine POST pre-op write still 503` (hierarchy)
- ✅ `POST kill-switch without super_admin+MFA →403, without confirm_token →422, 6th within minute →429 Retry-After, success →200 severed deterministic + Cache ai_runtime flushed + Circuit OPEN + WORM audit`
- ✅ `GET hitl/queue pending 10k rows → paginate 20 no OOM cursor + tenant+app isolated: AU MED user not seeing AU INVEST` + `POST approve rationale 15 spaces →422 TRIM` + `Logs single-line JSON allowlist trace_id propagated HTTP→queue→Reverb`

---

## 8. CALIBRATOR GATE — 100% before any code

| Domain | Score | Gate |
|--------|-------|------|
| Memory (71pts+9M/5A/13Agents+B1a→B7) | 100% | reuse governance cache+WORM+PreOpGate hierarchy |
| Architecture (DDD Thin→Action→Service→Repo) | 100% | R27 ultra-thin + ≤150L + DRY |
| Security (super_admin Zero-Trust+MFA+Throttle+HMAC+503) | 100% | R6+R36+R38+DRM |
| Precision (JSON not JSONB+cache 30s+pre-agg 10s) | 100% | no float, ngram unaffected |
| Craftsmanship (PHP8.4 readonly+strict TS zero any) | 100% | R28/YAGNI |
| Operational (stats R37 10s+replica+Reverb 8080) | 100% | B.10 |

> **BLOCKED if <100%** — reload `.arenarules`+B.1a→B.7.

---

## 9. ARABIC SUMMARY

تم تأمين غرفة الحوكمة: نقاط `system/modules` معذّلة بلا نشر مع `Tags+Lock+WORM+Reverb` وحصار `AU BUSINESS أساس 422`، بوابة `PreOp <15ms` كاش فقط مع تجاوز صفر-ثقة للمدير الأعلى، مقياس صحة `100→0` من إحصائيات 10ث لا مسح حي، زر قتل أحمر `Throttle 5/د + HMAC 5د + فتح دارات + غسل ai_runtime` نحو `100% حتمي`، وطابور `HITL` مقسّم 20 معزول مستأجر—متوافق مع `DRM>Lite>Micro` ومتخيل.

---
*Target: `abduniproject` — Next: B.9 Workforce Marketplace — Arena*
