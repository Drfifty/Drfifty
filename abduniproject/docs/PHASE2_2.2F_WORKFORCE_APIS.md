# PHASE 2.2f — Digital Workforce Marketplace APIs (Arena Canonical)

> **Env:** `Arena` (`arena/01a09d54-drfifty`) | **Project:** `abduniproject` | **Base:** `https://api.abduni.com/api/v1` | **Store:** MySQL `workforce_*` + `escrow_clearings` | **Realtime:** Reverb 8080 | **Auth:** JWT 15m | **Date:** 2026-09-14

## 0) Scope & Locks

| Item | Value |
|------|-------|
| **Catalogue** | 13 canonical agents (Table 1.3) — **Oil6:** SaaS lease only, **no source transfer** — buyout = enterprise license, subscription = hosted salary via `app_wallet` |
| **Isolation** | `app_id` multi-tenancy strict (`AU_BUSINESS/AU_MED/AU_DEALS/AU_SERV/AU_INVEST`) — middleware `EnsureTenantWorkforce` |
| **Escrow** | Checkout → `escrow_clearings holding` (5% snapshot) + `wallet_transactions` hash chain + `lockForUpdate+Mutex` |
| **Realtime** | `private-tenant.{app_id}.workforce` — streams dispatch status via Reverb `wss://` |

---

## 1) Endpoints

### 1.1 `GET /api/v1/workforce/agents` — Browse Catalogue (public)

| Field | Value |
|-------|-------|
| **Guard** | `public` (L1 Guest) or `auth:jwt` (personalized) |
| **Cache** | `Redis workforce:catalog:{app_id} 120s` |
| **RBAC** | `view` |

**Query:** `?app_id=AU_DEALS&category=growth&search=market&sort=rating_desc&page=1&per_page=15`

**Success `200`:**
```json
{
  "data":[
    {
      "id":3,"slug":"cmо-growth","name":"CMO Growth & Campaigns","name_ar":"نمو وتسويق","category":"growth","agent_id":3,
      "avatar":"https://cdn.../agent3.png","rating":4.9,"leases_count":142,
      "capabilities":["market_trend_analysis","propose_regional_expansion","draft_ads"],
      "micro_switches":[{"key":"propose_regional_expansion","is_enabled":true,"requires_hitl":true}],
      "pricing":{"buyout_license_subunit":50000000,"currency":"EGP","subscription_monthly_subunit":2500000,"is_saas_only":true},
      "app_scope":["AU_BUSINESS","AU_DEALS"],"is_featured":true
    }
  ],
  "meta":{"current_page":1,"last_page":3,"total":13}
}
```
**Errors:** `400` invalid app_id, `503` hibernated.

---

### 1.2 `POST /api/v1/workforce/agents/checkout` — Buyout License OR Monthly Subscription (escrow-locked)

| Field | Value |
|-------|-------|
| **Guard** | `auth:jwt` |
| **RBAC** | `can:workforce.checkout.execute` |
| **Throttle** | `10/min` |
| **Idempotency** | `Idempotency-Key` → `escrow_clearings.uuid` 24h |
| **Lock** | `wallet FOR UPDATE` + `Redis Mutex workforce:checkout:{user}:{agent}` |

**Request JSON (Subscription):**
```json
{
  "agent_id": 3,
  "app_id": "AU_DEALS",
  "plan": "subscription_monthly",
  "currency": "EGP",
  "billing_cycle": "monthly",
  "reference_uuid": "uuid-v4",
  "meta": {"seats":1}
}
```
**Request JSON (Buyout License — SaaS, no source):**
```json
{
  "agent_id": 11,
  "app_id": "AU_BUSINESS",
  "plan": "buyout_license",
  "currency": "EGP",
  "reference_uuid": "uuid-v4"
}
```

**Validation (`CheckoutWorkforceRequest`):**
```php
'agent_id'=>['required','integer','between:1,13','exists:workforce_agents,agent_id'],
'app_id'=>['required','in:AU_BUSINESS,AU_MED,AU_DEALS,AU_SERV,AU_INVEST'],
'plan'=>['required','in:buyout_license,subscription_monthly'],
'currency'=>['required','in:EGP,USD,SAR,AED'],
'billing_cycle'=>['required_if:plan,subscription_monthly','in:monthly,quarterly,annual'],
'reference_uuid'=>['required','uuid','unique:escrow_clearings,uuid'],
// Custom: plan buyout → subscription fields forbidden, wallet available >= price, app_id scope allowed for agent
```

**Success `201` (Subscription):**
```json
{
  "data":{
    "order":{"uuid":"...","agent_id":3,"plan":"subscription_monthly","status":"holding","billing_cycle":"monthly"},
    "escrow":{"uuid":"...","amount_subunit":2500000,"commission_rate_snapshot":0.05,"hold_started_at":"...","grace_expires_at":"... (12h once)","hash_chain":"..."},
    "tenant_agent":{"id":77,"agent_id":3,"app_id":"AU_DEALS","status":"active","activated_at":"...","next_billing_at":"2026-10-14T09:00:00Z"},
    "wallet":{"balance_subunit":10000000,"available_subunit":7500000,"locked_subunit":2500000}
  }
}
```
**Success `201` (Buyout License):**
```json
{
  "data":{
    "order":{"uuid":"...","agent_id":11,"plan":"buyout_license","status":"holding","license_key":"lic_...","is_source_transfer":false},
    "escrow":{"uuid":"...","amount_subunit":50000000,"commission_rate_snapshot":0.05},
    "tenant_agent":{"id":78,"status":"active","license_expires_at":null,"is_saas_only":true}
  }
}
```
*Oil6:* `is_source_transfer:false` always — license is SaaS, code stays hosted, `no buyout source`.

**Errors:** `402 insufficient_available`, `409 wallet_busy / already_subscribed`, `422 plan_mismatch`, `403 not_in_scope`, `503`.

*Flow:* `CheckModuleStatus` → `wallet available` → `escrow holding (12h grace)` → `tenant_agents active` → `Reverb private-tenant.{app_id}.workforce → AgentActivated`.

---

### 1.3 `GET /api/v1/workforce/tenant-agents` — List Active for Current `app_id`

| Field | Value |
|-------|-------|
| **Guard** | `auth:jwt` |
| **RBAC** | `can:workforce.tenant.view` (owner) — **strict `app_id` isolation** |
| **Scope** | `where tenant_agents.user_id=auth && app_id=X-App-Id` |

**Query:** `?app_id=AU_DEALS&status=active&page=1&per_page=15`

**Success `200`:**
```json
{
  "data":[
    {
      "id":77,"agent_id":3,"slug":"cmо-growth","name":"CMO Growth","app_id":"AU_DEALS","status":"active",
      "plan":"subscription_monthly","activated_at":"2026-09-14T09:00:00Z","next_billing_at":"2026-10-14T09:00:00Z",
      "micro_switches":[{"key":"propose_regional_expansion","is_enabled":true}],
      "last_dispatch":{"id":909,"status":"completed","at":"2026-09-14T08:30:00Z"}
    }
  ],
  "meta":{"total":2}
}
```
**Errors:** `401`, `403 cross_app_forbidden` if `app_id` mismatch, `422`.

---

### 1.4 `POST /api/v1/workforce/agents/{id}/dispatch` — Dispatch Automated Workflow Task

| Field | Value |
|-------|-------|
| **Guard** | `auth:jwt` |
| **RBAC** | `can:workforce.dispatch.execute` + `micro_switch_matrix is_enabled` (else `403 micro_disabled`) + `HITL` if `requires_hitl` → queued |
| **Throttle** | `30/min` per tenant-agent |
| **Queue** | `Redis` → `Ephemeral Swarm` worker (prod) → `Reverb` stream |

**Route:** `POST /api/v1/workforce/agents/77/dispatch` where `77` = `tenant_agent.id` (not catalogue `agent_id`).

**Request JSON:**
```json
{
  "task_type": "market_trend_analysis",
  "payload": {"region":"Cairo","category":"medicines","days":30},
  "priority": "normal",
  "callback_url": "https://app.abduni.com/webhooks/dispatch",
  "reference_uuid": "uuid-v4-task"
}
```
**Validation:**
```php
'task_type'=>['required','string','max:80','exists:micro_switch_matrix,capability_key'],
'payload'=>['required','array','max:10000'],
'priority'=>['sometimes','in:low,normal,high'],
'callback_url'=>['sometimes','url','max:500'],
'reference_uuid'=>['required','uuid','unique:workforce_dispatches,uuid'],
// Custom: tenant_agent.app_id == X-App-Id, micro_switch is_enabled, wallet subscription active
```

**Success `202` (Accepted, async):**
```json
{
  "data": {
    "dispatch": {"uuid":"...","tenant_agent_id":77,"agent_id":3,"app_id":"AU_DEALS","task_type":"market_trend_analysis","status":"queued","queued_at":"2026-09-14T09:00:00Z","estimated_seconds":45},
    "hitl": {"required":false}
  },
  "meta":{"trace_id":"...","channel":"private-tenant.AU_DEALS.workforce"}
}
```
*If HITL required → `status:pending_hitl` + `queue_id`.*

**Errors:** `404 tenant_agent_not_found`, `403 micro_disabled / cross_app_forbidden / subscription_expired`, `409 already_dispatching`, `422`, `503 hibernated`.

---

## 2) Security & WebSocket — `app_id` Isolation + `private-tenant.{app_id}.workforce`

### 2.1 Middleware `EnsureTenantWorkforce` (app_id isolation)

```php
// app/Modules/Shared/Http/Middleware/EnsureTenantWorkforce.php
public function handle($req, Closure $next){
  $appId=$req->header('X-App-Id') ?? $req->input('app_id');
  if(!in_array($appId, ['AU_BUSINESS','AU_MED','AU_DEALS','AU_SERV','AU_INVEST'])) abort(400,'invalid_app');
  if($req->user() && $req->route('id')){
    $ta=DB::table('tenant_agents')->where('id',$req->route('id'))->where('user_id',$req->user()->id)->first();
    if(!$ta || $ta->app_id!==$appId) abort(403,'cross_app_forbidden');
  }
  // All queries scoped: ->where('app_id',$appId)
  $req->attributes->set('tenant_app_id',$appId);
  return $next($req);
}
```
| Rule | Enforce |
|------|---------|
| 1 | `X-App-Id` required, enum `AU_*` |
| 2 | `tenant_agents` + `dispatches` always `where app_id = tenant_app_id` |
| 3 | Route `id` must belong to auth user **and** same `app_id` → else `403 cross_app_forbidden` |
| 4 | `feature_flags` hibernated → `503` before controller (CheckModuleStatus) |
| 5 | `can:workforce.*.view/execute` separate (Rule36) |

### 2.2 Channel `private-tenant.{app_id}.workforce` — Streaming Agent Task Status

| Field | Value |
|-------|-------|
| **Type** | `private` (not presence) |
| **Name** | `private-tenant.AU_DEALS.workforce` (per `app_id` tenant) |
| **Auth** | `auth:jwt` + `can:workforce.tenant.view` + `app_id` match |
| **Driver** | Reverb 8080 `wss://` |

**Authorize (`routes/channels.php`):**
```php
Broadcast::channel('private-tenant.{appId}.workforce', function($user, $appId){
  return in_array($appId, ['AU_BUSINESS','AU_MED','AU_DEALS','AU_SERV','AU_INVEST']) && $user->can('workforce.tenant.view');
});
```

**Events (server → channel):**

#### `AgentTaskQueued`
```json
{ "event":"AgentTaskQueued", "data":{"dispatch_uuid":"...","tenant_agent_id":77,"agent_id":3,"app_id":"AU_DEALS","task_type":"market_trend_analysis","status":"queued","queued_at":"..."} }
```

#### `AgentTaskStarted`
```json
{ "event":"AgentTaskStarted", "data":{"dispatch_uuid":"...","status":"running","started_at":"...","worker":"swarm-abc"} }
```

#### `AgentTaskProgress` (streaming 0-100)
```json
{ "event":"AgentTaskProgress", "data":{"dispatch_uuid":"...","progress":45,"step":"analyzing_trends","message":"تحليل اتجاهات القاهرة..."} }
```

#### `AgentTaskCompleted` / `Failed` / `PendingHITL`
```json
{ "event":"AgentTaskCompleted", "data":{"dispatch_uuid":"...","status":"completed","result":{"trends":[{"region":"Cairo","growth":0.12}]}, "took_ms":42000, "confidence":0.96} }
{ "event":"AgentTaskFailed", "data":{"dispatch_uuid":"...","status":"failed","error":"timeout","retryable":true} }
{ "event":"AgentTaskPendingHITL", "data":{"dispatch_uuid":"...","status":"pending_hitl","queue_id":55,"requires":"human approval"} }
```

**Client Subscribe (React 19 + Echo):**
```ts
import Echo from 'laravel-echo';
const echo=new Echo({broadcaster:'reverb', key: import.meta.env.VITE_REVERB_APP_KEY, wsHost: location.hostname, wsPort:8080, forceTLS:true, auth:{headers:{Authorization:`Bearer ${token}`}}});
const ch=echo.private(`private-tenant.${appId}.workforce`) // appId = X-App-Id
  .listen('AgentTaskQueued', e=> addToast(`Queued ${e.task_type}`))
  .listen('AgentTaskProgress', e=> setProgress(e.dispatch_uuid, e.progress))
  .listen('AgentTaskCompleted', e=> showResult(e.result));
```

**Throttle & Security:** `throttle:60/min` per socket, `Redis` presence, `is_hidden` tasks never broadcast, `confidence<90` → fallback to `deterministic` + `pending_hitl`.

---

## 3) Common Errors

| Code | When |
|------|------|
| `200` | catalogue, tenant list |
| `201` | checkout (holding) |
| `202` | dispatch queued |
| `400` | invalid app_id |
| `401` | token_expired |
| `403` | cross_app_forbidden / micro_disabled / not_in_scope / forbidden_execute |
| `409` | already_subscribed / already_dispatching / wallet_busy |
| `402` | insufficient_available |
| `422` | validation |
| `503` | AU module hibernated |

---

## 4) Route File (Laravel 12)

```php
// routes/api/v1/workforce.php — Arena canonical
use App\Modules\Shared\Http\Controllers\Api\V1\WorkforceController;
use App\Modules\Shared\Http\Middleware\EnsureTenantWorkforce;
use Illuminate\Support\Facades\Route;

Route::prefix('v1/workforce')->group(function(){
  Route::get('agents', [WorkforceController::class,'catalogue']);
  Route::middleware(['auth:jwt', EnsureTenantWorkforce::class])->group(function(){
    Route::post('agents/checkout', [WorkforceController::class,'checkout'])->middleware('can:workforce.checkout.execute');
    Route::get('tenant-agents', [WorkforceController::class,'tenantAgents'])->middleware('can:workforce.tenant.view');
    Route::post('agents/{id}/dispatch', [WorkforceController::class,'dispatch'])->middleware('can:workforce.dispatch.execute');
  });
});
// channels.php
Broadcast::channel('private-tenant.{appId}.workforce', fn($user,$appId)=> $user->can('workforce.tenant.view'));
```

---

**ملخص عربي:** متجر الموظفين الرقميين بجاهزية إنتاج — تصفح 13 وكيل مع تسعير SaaS (ترخيص شراء بدون نقل مصدر + اشتراك شهري عبر المحفظة بضمان مقفل 12 ساعة)، وعزل صارم حسب `app_id`، وإرسال مهام غير متزامن مع بث حي لحالة التنفيذ عبر Reverb `private-tenant.{app_id}.workforce`.

*Next: [PROMPT 2.4] Master Admin & Orchestration*
