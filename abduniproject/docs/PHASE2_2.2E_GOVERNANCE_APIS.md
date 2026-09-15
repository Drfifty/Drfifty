# PHASE 2.2e — AU Calibrator, AU Lite & Governance APIs (Arena Canonical)

> **Env:** `Arena` (`arena/01a09d54-drfifty`) | **Project:** `abduniproject` | **Base:** `https://api.abduni.com/api/v1` | **Auth:** JWT 15m + 2FA for kill-switch | **Pillars:** 4 AU Lite, 5 Leak, 7 Calibrator | **Date:** 2026-09-14

## 0) Scope

| Domain | Endpoints | Pillar |
|--------|-----------|--------|
| **AU Lite** | `GET modules/status` + `POST modules/toggle` (no deploy) | 4 `CheckModuleStatus → 503` |
| **Security** | `POST security/leak-check` (RegexDataLeakDetector 100%) | 5 |
| **Calibrator** | `GET health-score` (100%→90% auto-heal) + `POST audit/pre-op` (<15ms sync) | 7 |
| **AI Governance** | `POST kill-switch` (sever LLM sockets) + `GET/POST hitl queue/approve` | Tri-Hybrid + HITL |

### 0.1 AU BUSINESS — Master Core B2B Anchor (AUDIT FIX 2026-09-14 — Phase1→2 Strict Alignment)

**AU BUSINESS (`ab_`, `AU_BUSINESS`) is the Master Core B2B Platform — non-hibernatable (`is_core=1`, `CheckModuleStatus` → `503` blocked), owns **Paymob sub-merchant vault**, **single `app_wallet` universal ledger (no base, `BIGINT subunit`, `CHECK>=0`)**, **FX `exchangerate_api` */30**, and **shared RBAC + AU Lite gateway**. The 4 B2C spokes — **AU MED (`amed_`)**, **AU DEALS (`adl_`)**, **AU SERV (`asv_`)**, **AU INVEST (`ainv_`)** — are `is_core=0` hibernatable and **settle exclusively through AU BUSINESS vault** (no spoke-local liquidity). All tables/APIs below enforce `app_id ENUM('AU_BUSINESS',...) DEFAULT 'AU_BUSINESS'` as root tenure.

**Hub-and-Spoke:**
```
[AU BUSINESS Core `ab_` — B2B Escrow Vault + Wallet + RBAC + Calibrator — Modules 1-9 anchor]
      ├─ AU MED (clinical PG + pgvector)
      ├─ AU DEALS (B2B medicine exchange — Module 4)
      ├─ AU SERV (real-time dispatch — Module 5/6)
      └─ AU INVEST (micro-finance)
```
**Strict Sequential:** `5 Applications` (1 core + 4 spokes) | `9 Modules 1→9` (no 10-15) | `13 Agents 1→13` (`micro_switch_matrix` + `preferred_driver`) | `100% Anti-Leak` (`RegexDataLeakDetector` until `post-escrow holding`) | `Universal Wallet` (`single app_wallet`, `5% adjustable` `commission_rules`, `single-payer Oil3`) | `Calibrator 100→90%` (`Pre<15ms/In/Post` + `Ephemeral Swarm`).

---

---

## 1) AU Lite — Feature Toggles (No Deploy)

### 1.1 `GET /api/v1/system/modules/status`

| Field | Value |
|-------|-------|
| **Guard** | `auth:jwt` |
| **RBAC** | `can:system.modules.view` (admin/viewer) |
| **Cache** | `Redis feature_flags` 30s |

**Success `200`:**
```json
{
  "data": {
    "core": {"AU_BUSINESS":{"is_enabled":true,"is_core":true,"status":"active"}},
    "spokes": {
      "AU_MED":{"is_enabled":true,"flag_key":"au_med","rollout":100,"status":"active"},
      "AU_DEALS":{"is_enabled":false,"flag_key":"au_deals","rollout":0,"status":"hibernated","maintenance_message":"صيانة","maintenance_message_ar":"صيانة مجدولة"},
      "AU_SERV":{"is_enabled":true,"flag_key":"au_serv","status":"active"},
      "AU_INVEST":{"is_enabled":true,"flag_key":"au_invest","status":"active"}
    },
    "modules": {"1_auth":"active","4_deals":"hibernated"},
    "agents": [{"agent_id":4,"capability":"dispatch","is_enabled":true,"requires_hitl":false}]
  },
  "meta":{"cached":true,"trace_id":"..."}
}
```
**Errors:** `401`, `403`, `500`.

---

### 1.2 `POST /api/v1/system/modules/toggle` — Dynamic Enable/Disable (zero code)

| Field | Value |
|-------|-------|
| **Guard** | `auth:jwt` + `2FA TOTP` (header `X-TOTP`) |
| **RBAC** | `can:system.modules.toggle.execute` (super_admin/Global Controller Agent 12 only) |
| **Audit** | `DB::table('feature_flags')->update + Reverb broadcast + AuditLog` |
| **Throttle** | `10/min` |

**Request JSON:**
```json
{
  "flag_key": "au_deals",
  "is_enabled": false,
  "rollout_percentage": 0,
  "maintenance_message": "إغلاق مؤقت للصيانة",
  "maintenance_message_ar": "إغلاق مؤقت للصيانة",
  "reason": "high_error_rate_>5%"
}
```
**Alternatives:** `{"agent_id":4,"capability_key":"dispatch","is_enabled":false}` or `{"module_id":4,"is_enabled":false}` — same endpoint, polymorphic `flag_key|agent_id|module_id`.

**Validation:**
```php
'flag_key'=>['sometimes','in:au_med,au_deals,au_serv,au_invest,au_business','prohibits:agent_id,module_id'],
'agent_id'=>['sometimes','integer','between:1,13','prohibits:flag_key,module_id'],
'capability_key'=>['required_with:agent_id','string','max:80'],
'module_id'=>['sometimes','integer','between:1,9','prohibits:flag_key,agent_id'],
'is_enabled'=>['required','boolean'],
'rollout_percentage'=>['sometimes','integer','between:0,100'],
'maintenance_message'=>['sometimes','string','max:500'], 'maintenance_message_ar'=>['sometimes','string','max:500'],
'reason'=>['required','string','min:10','max:500'],
// Custom: au_business is_core → cannot disable (422 is_core_lock)
```

**Success `200`:**
```json
{
  "data": {"flag_key":"au_deals","is_enabled":false,"rollout_percentage":0,"last_toggled_by":1,"last_toggled_at":"2026-09-14T09:00:00Z","broadcast":"reverb:system.flags"},
  "meta":{"trace_id":"..."}
}
```
*Effect:* `CheckModuleStatus` middleware instantly returns `503 {code:"module_hibernated", maintenance:"..."}` for `AU DEALS` routes, without deploy.

**Errors:** `400` missing target, `401`, `403 is_core_lock`, `422`, `429`, `503` (not here).

---

## 2) Security — `POST /api/v1/security/leak-check` (100% Deterministic Regex, Pillar5)

| Field | Value |
|-------|-------|
| **Guard** | `auth:jwt` OR `service` (`X-Service-Token`) |
| **RBAC** | `can:security.leak_check.execute` (any authenticated, internal) |
| **Engine** | `RegexDataLeakDetector` — **zero AI tokens** — `is_strict_post_escrow_only` (Oil1) |

**Request JSON:**
```json
{
  "text": "تواصل واتساب 01012345678 أو wa.me/201012345678 أو ahmed@gmail.com https://evil.com",
  "context": "post_escrow",
  "strict": true
}
```
**Validation:**
```php
'text'=>['required','string','max:10000'],
'context'=>['required','in:pre_escrow,post_escrow'],
'strict'=>['sometimes','boolean'], // true → use is_strict_post_escrow_only=1 patterns
```

**Success `200`:**
```json
{
  "data": {
    "sanitized": "تواصل واتساب [محمي] أو [محمي] أو [محمي] [محمي]",
    "leaks_found": [
      {"category":"phone","pattern":"Egypt Mobile","match":"01012345678","severity":"critical"},
      {"category":"url","pattern":"WhatsApp Link","match":"wa.me/201012345678"},
      {"category":"email","match":"ahmed@gmail.com"},
      {"category":"url","match":"https://evil.com"}
    ],
    "is_blocked": true,
    "replacement": "[محمي]",
    "engine": "deterministic_regex",
    "took_ms": 2
  }
}
```
*If `context=pre_escrow && strict=true` → `is_blocked=false` (Oil1: pre-escrow browsing untouched, post-escrow strict).*

**Errors:** `400` text empty, `422`, `500`.

---

## 3) Calibrator — Health & Pre-Op Gate (Pillar7, 100%→90% Auto-Heal)

### 3.1 `GET /api/v1/calibrator/health-score` — Real-time 100%→90%

| Field | Value |
|-------|-------|
| **Guard** | `auth:jwt` |
| **RBAC** | `can:calibrator.health.view` |
| **Cache** | `Redis calibrator:health 10s` |

**Success `200`:**
```json
{
  "data": {
    "score": 96.4,
    "status": "healthy",
    "threshold": 90,
    "components": {
      "memory":100,"architecture":100,"security":98,"precision":95,"craftsmanship":97,"operational":92
    },
    "auto_heal": {
      "triggered": false,
      "next_threshold": 90,
      "actions": ["cache_flush","container_recycle","route_correction"],
      "last_heal_at":"2026-09-14T08:00:00Z"
    },
    "telemetry": {"uptime_s":86400,"failed_jobs":2,"queue_lag_ms":120}
  },
  "meta":{"trace_id":"..."}
}
```
*Logic:* `<100 && >=90` → warning; `<90` → auto `Calibrator → cache:clear + queue:restart + route:cache` + Reverb `private-calibrator`.

**Errors:** `401`, `403`, `500`.

---

### 3.2 `POST /api/v1/calibrator/audit/pre-op` — Synchronous Pre-Op Gate (<15ms)

| Field | Value |
|-------|-------|
| **Guard** | `auth:jwt` OR `service` |
| **RBAC** | `can:calibrator.preop.execute` |
| **SLA** | `<15ms` (deterministic, no AI) — if `>15ms` → `504` |
| **Engine** | `CalibratorSuite::preOpGate(payload)` — 6 domains × checks |

**Request JSON:**
```json
{
  "entity_type": "deal_listing",
  "entity_id": 101,
  "checks": ["memory","architecture","security","precision","craftsmanship","operational"],
  "payload": {"title":"بنادول","price_subunit":750000}
}
```
**Validation:**
```php
'entity_type'=>['required','in:deal_listing,service_ticket,appointment,escrow'],
'entity_id'=>['required','integer','min:1'],
'checks'=>['sometimes','array','max:6'], 'checks.*'=>['in:memory,architecture,security,precision,craftsmanship,operational'],
'payload'=>['required','array'],
```

**Success `200` (<15ms):**
```json
{
  "data": {
    "gate":"passed",
    "score":100,
    "results":{"memory":"pass","architecture":"pass","security":"pass","precision":"pass","craftsmanship":"pass","operational":"pass"},
    "took_ms": 8,
    "next_step": "allow_persist"
  }
}
```
**Fail `422` (blocked):**
```json
{ "message":"Calibrator gate failed","code":"calibrator_failed","errors":{"security":["phone leak detected"]}, "data":{"score":88,"gate":"blocked","required":100} }
```
**Errors:** `504 {code:"preop_timeout", took_ms:16}`, `422`, `401`.

---

## 4) AI Governance — Kill-Switch & HITL

### 4.1 `POST /api/v1/ai/governance/kill-switch` — Sever External LLM Sockets Instantly

| Field | Value |
|-------|-------|
| **Guard** | `auth:jwt` + `2FA TOTP` (`X-TOTP: 6 digits`) |
| **RBAC** | `can:ai.kill_switch.execute` (Agent 12 Global Controller / super_admin only, `is_system` role) |
| **Audit** | `agent_actions` append-only + `Reverb broadcast` + `Slack` |
| **Throttle** | `5/min` (critical) |

**Request JSON:**
```json
{
  "scope": "all",
  "reason": "prompt_injection_detected P1",
  "sever_external": true,
  "sever_local_gpu": false
}
```
**Alternatives:** `"scope":"agent:3"` or `"scope":"driver:cloud_llm"` — granular.

**Validation:**
```php
'scope'=>['required','string','regex:/^(all|agent:[0-9]+|driver:(deterministic|cloud_llm|local_gpu))$/'],
'reason'=>['required','string','min:15','max:500'], // 15-char rationale (Oil)
'sever_external'=>['required','boolean'], 'sever_local_gpu'=>['sometimes','boolean'],
// Custom: TOTP must verify via Google2FA
```

**Success `200`:**
```json
{
  "data": {
    "killed": true,
    "scope":"all",
    "severed_drivers":["cloud_llm","local_gpu?false"],
    "sockets_closed": 12,
    "fallback": "deterministic_rule_driver",
    "audit_id":"...",
    "at":"2026-09-14T09:00:00Z"
  }
}
```
*Effect:* `AgentStrategyManager` → `CloudLlmDriver` & `LocalGpuDriver` sockets `close()` instantly, `CircuitBreaker open`, all agents fallback to `DeterministicRuleDriver` (0-cost) until manual `POST /ai/governance/kill-switch/restore`.

**Errors:** `401 invalid_totp`, `403 not_global_controller`, `422`, `429`.

---

### 4.2 `GET /api/v1/ai/governance/hitl/queue` — HITL Approval Queue

| Field | Value |
|-------|-------|
| **Guard** | `auth:jwt` |
| **RBAC** | `can:hitl.queue.view` (hitl_role_id from `micro_switch_matrix`) |

**Query:** `?agent_id=4&status=pending&page=1&per_page=15`

**Success `200`:**
```json
{
  "data":[
    {
      "id":55,"uuid":"...","agent_id":4,"capability_key":"dispatch","sub_capability":"auto_price_cut",
      "entity_type":"deal_listing","entity_id":101,"proposed_action":{"discount":5},
      "confidence":0.87,"requires_hitl":true,"hitl_role":"vendor_success","status":"pending","created_at":"2026-09-14T08:55:00Z"
    }
  ],
  "meta":{"total":7}
}
```

---

### 4.3 `POST /api/v1/ai/governance/hitl/approve` — Approve/Reject

| Field | Value |
|-------|-------|
| **Guard** | `auth:jwt` + `2FA` if `confidence<0.90`? |
| **RBAC** | `can:hitl.approve.execute` (must match `hitl_role_id`) |

**Request JSON:**
```json
{
  "queue_id": 55,
  "decision": "approved",
  "rationale": "سعر مقبول بعد المراجعة",
  "override_payload": {"discount":5}
}
```
**Validation:**
```php
'queue_id'=>['required','exists:agent_actions,id'],
'decision'=>['required','in:approved,rejected'],
'rationale'=>['required','string','min:15','max:500'],
'override_payload'=>['sometimes','array'],
```

**Success `200`:**
```json
{ "data": {"queue_id":55,"decision":"approved","executed":true,"executed_at":"2026-09-14T09:05:00Z"} }
```
**Errors:** `404`, `403 not_hitl_role`, `409 already_decided`, `422`.

---

## 5) Common Codes

| Code | When |
|------|------|
| `200` | all GET + toggle/kill/approve success |
| `400` | invalid scope, missing flag_key |
| `401` | token_expired, invalid_totp |
| `403` | forbidden_execute, not_global_controller, is_core_lock |
| `422` | validation / calibrator_failed / raw_payload |
| `429` | throttle |
| `503` | module_hibernated (AU Lite) / calibrator unhealthy |
| `504` | pre-op timeout >15ms |

---

## 6) Route File (Laravel 12)

```php
// routes/api/v1/governance.php — Arena canonical — Rule5/36
use App\Modules\Shared\Http\Controllers\Api\V1\SystemController;
use App\Modules\Shared\Http\Controllers\Api\V1\SecurityController;
use App\Modules\Shared\Http\Controllers\Api\V1\CalibratorController;
use App\Modules\Shared\Http\Controllers\Api\V1\GovernanceController;
use Illuminate\Support\Facades\Route;

Route::prefix('v1')->group(function(){
  Route::get('system/modules/status', [SystemController::class,'status'])->middleware('auth:jwt');
  Route::post('system/modules/toggle', [SystemController::class,'toggle'])->middleware(['auth:jwt','can:system.modules.toggle.execute','throttle:10,1']);
  Route::post('security/leak-check', [SecurityController::class,'leakCheck'])->middleware(['auth:jwt','throttle:60,1']);
  Route::get('calibrator/health-score', [CalibratorController::class,'healthScore'])->middleware('auth:jwt');
  Route::post('calibrator/audit/pre-op', [CalibratorController::class,'preOp'])->middleware(['auth:jwt','throttle:100,1']);
  Route::post('ai/governance/kill-switch', [GovernanceController::class,'killSwitch'])->middleware(['auth:jwt','can:ai.kill_switch.execute']);
  Route::get('ai/governance/hitl/queue', [GovernanceController::class,'hitlQueue'])->middleware('auth:jwt');
  Route::post('ai/governance/hitl/approve', [GovernanceController::class,'hitlApprove'])->middleware(['auth:jwt','can:hitl.approve.execute']);
});
```

---

**ملخص عربي:** واجهات الحوكمة والمعايرة بجاهزية إنتاج — تبديل AU Lite فوري بدون نشر مع حماية النواة، وفحص تسريب Deterministic 100%، ومعاير صحة 100%→90% مع شفاء تلقائي وبوابة Pre-Op <15ms، ومفتاح قتل يقطع مقابس LLM خارجياً فوراً، وطابور HITL بموافقة مشروطة.

*Next: [PROMPT 2.4] Master Admin & Audit*
