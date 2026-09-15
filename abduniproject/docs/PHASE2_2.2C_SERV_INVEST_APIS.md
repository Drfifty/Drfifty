# PHASE 2.2c — AU SERV & AU INVEST APIs (REST + Reverb WebSocket) — Arena Canonical

> **Env:** `Arena` (`arena/01a09d54-drfifty`) | **Project:** `abduniproject` (`asv_` `ainv_`) | **Base:** `https://api.abduni.com/api/v1` | **Realtime:** Laravel Reverb 8080 `wss://` exclusive | **Auth:** JWT 15m | **Date:** 2026-09-14

## 0) Scope

| App | Domain | Core REST | Realtime |
|-----|--------|-----------|----------|
| **AU SERV** (`asv_`) | Real-time service tickets + dispatch | `POST tickets` + `PATCH radius` | `presence-dispatch-{region}` live provider geolocation |
| **AU INVEST** (`ainv_`) | Micro-financing escrow dispatches | `POST invest/dispatches` (funds lock → milestone) | `private-invest.{id}` escrow updates |

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

## 1) REST Endpoints

### 1.1 `POST /api/v1/serv/tickets` — Create Service Ticket (Tier1)

| Field | Value |
|-------|-------|
| **Guard** | `auth:jwt` |
| **RBAC** | `can:serv.ticket.create.execute` |
| **Throttle** | `20/min` |
| **Idempotency** | `Idempotency-Key: uuid` → `service_tickets.uuid` 24h |
| **App** | `AU_SERV` (`X-App-Id`) |

**Headers:**
```
Authorization: Bearer eyJ...
X-App-Id: AU_SERV
Idempotency-Key: 550e8400-e29b-41d4-a716-446655440001
```

**Request JSON:**
```json
{
  "category": "hvac",
  "title": "صيانة تكييف 3 حصان - مدينة نصر",
  "title_ar": "صيانة تكييف 3 حصان - مدينة نصر",
  "description": "التكييف لا يبرد، تسريب فريون",
  "priority": "high",
  "address_text": "مدينة نصر، الحي السابع، عمارة 12",
  "governorate": "Cairo",
  "city": "Nasr City",
  "lat": 30.0444,
  "lng": 31.2357,
  "scheduled_at": "2026-09-15T10:00:00Z",
  "price_subunit": 75000,
  "currency": "EGP",
  "meta": {"ac_model":"Carrier 3HP","warranty":false}
}
```

**Validation (`StoreTicketRequest`):**
```php
'category'=>['required','in:hvac,plumbing,electrical,cleaning,appliance,other'],
'title'=>['required','string','min:10','max:255'], 'title_ar'=>['required','string','min:10','max:255'],
'description'=>['required','string','min:20','max:5000'],
'priority'=>['required','in:low,normal,high,urgent'],
'governorate'=>['required','string','max:80'], 'city'=>['required','string','max:80'],
'lat'=>['required','numeric','between:-90,90'], 'lng'=>['required','numeric','between:-180,180'],
'scheduled_at'=>['nullable','date','after:now'],
'price_subunit'=>['nullable','integer','min:1000'], 'currency'=>['required','in:EGP,USD,SAR,AED'],
'meta'=>['sometimes','array'],
// LeakDetector: description strict post-ticket? allowed but regex sanitized
```

**Success `201`:**
```json
{
  "data": {
    "ticket": {
      "uuid":"...","status":"open","category":"hvac","priority":"high",
      "ticket_location":"POINT(31.2357 30.0444)","governorate":"Cairo","city":"Nasr City",
      "price_subunit":75000,"currency":"EGP",
      "scheduled_at":"2026-09-15T10:00:00Z","dispute_deadline_at":null,"grace_expires_at":"2026-09-14T21:00:00Z",
      "is_hidden":false
    }
  },
  "meta":{"trace_id":"..."}
}
```
**Errors:** `422`, `401`, `403`, `429`, `503` AU SERV hibernated.

*Side-effects:* `ticket_location = ST_SRID(POINT(lng,lat),4326)` + `grace_expires_at = now+12h` (Oil4 once) + broadcast `TicketCreated` on `presence-dispatch-{governorate}`.

---

### 1.2 `PATCH /api/v1/serv/tickets/{uuid}/radius` — Dynamic Radius Adjustment (dispatch tuning)

| Field | Value |
|-------|-------|
| **Guard** | `auth:jwt` |
| **RBAC** | `can:serv.dispatch.adjust.execute` (requester or dispatcher Agent 8) |
| **Throttle** | `30/min` |
| **Purpose** | Expand/shrink search radius for nearest providers when no available within 10km |

**Request JSON:**
```json
{
  "radius_km": 15,
  "reason": "no_providers_in_10km_expand"
}
```
**Validation:**
```php
'radius_km'=>['required','integer','between:1,50'], // 1-50km cap
'reason'=>['required','in:no_providers_in_10km_expand,high_demand_shrink,manual'],
```

**Success `200`:**
```json
{
  "data": {
    "ticket":{"uuid":"...","status":"dispatched"},
    "dispatch": {
      "radius_km":15,
      "candidates": [
        {"provider_id":12,"name":"أحمد تكييف","distance_m":8200,"eta_min":11,"rank":1,"status":"proposed"},
        {"provider_id":9,"distance_m":11200,"eta_min":14,"rank":2}
      ],
      "expanded": true
    }
  }
}
```
*Engine:* `ST_Distance_Sphere(provider.current_location, ticket.ticket_location) < radius_km*1000` + `ST_Contains(coverage_zone)` + rank insert `dispatch_logs`. Re-broadcast `DispatchRadiusAdjusted` on presence channel.

**Errors:** `404 ticket_not_found`, `409 already_dispatched`, `403 not_owner`, `422`.

---

### 1.3 `POST /api/v1/invest/dispatches` — Investor Funding Dispatch (escrow lock, 3-Tier snapshot)

| Field | Value |
|-------|-------|
| **Guard** | `auth:jwt` |
| **RBAC** | `can:invest.dispatch.execute` (investor) |
| **Lock** | `Pessimistic wallet FOR UPDATE` + `Redis Mutex` + `Idempotency-Key` |
| **App** | `AU_INVEST` |

**Request JSON:**
```json
{
  "opportunity_id": 42,
  "seller_id": 88,
  "app_id": "AU_INVEST",
  "module_id": 9,
  "amount_subunit": 50000000,
  "currency": "EGP",
  "milestones": {"total":3,"current":1},
  "expected_return_rate": 0.12,
  "reference_uuid": "uuid-v4"
}
```
**Validation:**
```php
'opportunity_id'=>['required','integer','exists:invest_opportunities,id'],
'seller_id'=>['required','exists:users,id','different:investor_id'],
'app_id'=>['required','in:AU_INVEST'], 'module_id'=>['required','between:1,9'],
'amount_subunit'=>['required','integer','min:1000000'], // 10k EGP min invest
'currency'=>['required','in:EGP,USD,SAR'],
'milestones.total'=>['required','integer','between:1,10'],
'expected_return_rate'=>['required','numeric','between:0,0.5'],
'reference_uuid'=>['required','uuid','unique:escrow_clearings,uuid'],
```

**Success `201`:**
```json
{
  "data": {
    "escrow": {"uuid":"...","status":"holding","amount_subunit":50000000,"currency":"EGP","commission_rate_snapshot":0.05,"commission_amount_subunit":2500000,"fx_snapshot":{"EGP_USD":0.0204},"hold_started_at":"2026-09-14T09:00:00Z","dispute_deadline_at":"2026-09-16T09:00:00Z","grace_expires_at":"2026-09-14T21:00:00Z","hash_chain":"..."},
    "investment": {"opportunity_id":42,"milestone":1,"expected_return_rate":0.12,"sub_merchant_id":"sub_88"}
  }
}
```
*Flow:* Investor wallet `available >= amount` → `escrow_clearings holding` (snapshots frozen, Oil2 5% + FX locked) → `wallet_transactions escrow_hold` + `dispatch_logs` for audit → Reverb `private-invest.{uuid}`.

**Errors:** `402 insufficient_available`, `409 wallet_busy`, `422`, `503`.

---

## 2) WebSocket Channels (Laravel Reverb 8080 — Exclusive, Pillar Realtime)

### 2.1 Transport
```
BROADCAST_DRIVER=reverb
REVERB_APP_ID=abduni
REVERB_APP_KEY=...
REVERB_HOST=0.0.0.0  REVERB_PORT=8080  REVERB_SCHEME=https (wss://)
Client: Echo (Inertia) → wss://api.abduni.com:8080/app/<key>?protocol=7
Auth: POST /broadcasting/auth (JWT) → Channel authorize via Gate
```

### 2.2 `presence-dispatch-{region}` — Live Geolocation Tracking (AU SERV)

| Field | Value |
|-------|-------|
| **Type** | `presence` (list online providers + requesters) |
| **Name** | `presence-dispatch-{governorate}` e.g., `presence-dispatch-Cairo`, `presence-dispatch-Alexandria` (slug, lower) |
| **Auth** | `auth:jwt` + `can:serv.dispatch.view` (provider with `status=available` or requester with open ticket) |
| **Authorize** | `Broadcast::channel('presence-dispatch-{region}', fn($user,$region)=> $user->can('serv.dispatch.view') && $user->governorate== $region)` |

**Join Payload (client → server):**
```json
{ "channel": "presence-dispatch-Cairo", "auth": "Bearer eyJ..." }
```

**Presence State (server → client on join):**
```json
{
  "presence": {
    "count": 12,
    "ids": ["user:12","provider:77"],
    "hash": {"user:12":{"name":"أحمد","role":"requester"}, "provider:77":{"name":"أحمد تكييف","category":"hvac","rating":4.8,"current_location":"POINT(31.23 30.04)"}}
  }
}
```

**Events (server → channel):**

#### `ProviderLocationUpdated` (every 5s, throttled)
```json
{
  "event": "ProviderLocationUpdated",
  "channel": "presence-dispatch-Cairo",
  "data": {
    "provider_id": 77,
    "uuid": "...",
    "current_location": {"lat":30.0446,"lng":31.2359,"point":"POINT(31.2359 30.0446)"},
    "heading": 45,
    "accuracy_m": 12,
    "status": "available",
    "updated_at": "2026-09-14T09:00:05Z"
  }
}
```
*Trigger:* `service_providers` `UPDATE current_location = ST_SRID(POINT(lng,lat),4326)` → `broadcast(new ProviderLocationUpdated($provider))->toOthers()` via `ShouldBroadcast`.

#### `TicketCreated`
```json
{
  "event": "TicketCreated",
  "data": {
    "ticket": {"uuid":"...","category":"hvac","priority":"high","ticket_location":"POINT(31.2357 30.0444)","governorate":"Cairo","price_subunit":75000},
    "requester": {"id":12,"name":"محمد"}
  }
}
```

#### `DispatchRadiusAdjusted`
```json
{
  "event": "DispatchRadiusAdjusted",
  "data": {
    "ticket_uuid":"...","radius_km":15,"candidates":[{"provider_id":12,"distance_m":8200,"eta_min":11,"rank":1}],
    "adjusted_by":12
  }
}
```

#### `TicketDispatched` / `ProviderAccepted`
```json
{ "event":"TicketDispatched", "data":{"ticket_uuid":"...","provider_id":77,"distance_m":850,"eta_min":2,"dispatched_at":"..." } }
{ "event":"ProviderAccepted", "data":{"ticket_uuid":"...","provider_id":77,"accepted_at":"...","dispatch_log_uuid":"..."} }
```

**Client Subscribe (React 19 + Echo):**
```ts
// resources/js/hooks/useDispatchPresence.ts — ultra-concise
import Echo from 'laravel-echo'; const echo=new Echo({broadcaster:'reverb', key:import.meta.env.VITE_REVERB_APP_KEY, wsHost: window.location.hostname, wsPort:8080, forceTLS:true, auth:{headers:{Authorization:`Bearer ${token}`}}});
const ch=echo.join(`presence-dispatch-${region}`) // presence
  .here((users:any[])=> setOnline(users))
  .joining((u:any)=> add(u)).leaving((u:any)=> remove(u))
  .listen('ProviderLocationUpdated', (e:any)=> updateMarker(e.provider_id, e.current_location))
  .listen('DispatchRadiusAdjusted', (e:any)=> rerank(e.candidates));
```

**Rate & Security:** `throttle:60/min` per socket, `Redis` presence store, `ST_Distance_Sphere` calc server-side not client, `is_hidden` tickets not broadcast.

### 2.3 `private-invest.{uuid}` (AU INVEST escrow updates)
```
Channel: private-invest.550e8400-... (escrow uuid)
Auth: auth:jwt + buyer==seller? (investor or seller)
Events: EscrowLocked, MilestoneReleased, Disputed (same as 2.2a)
```

---

## 3) Common Status Codes

| Code | When |
|------|------|
| `200` | radius adjusted, dispatch list |
| `201` | ticket created, invest dispatch locked |
| `400` | invalid lat/lng, radius>50 |
| `401` | token_expired |
| `403` | forbidden_execute, not_in_region |
| `422` | validation errors |
| `429` | throttle |
| `503` | AU SERV / AU INVEST hibernated |

---

## 4) Route Files

```php
// routes/api/v1/serv.php
Route::prefix('v1/serv')->middleware('auth:jwt')->group(function(){
  Route::post('tickets', [TicketController::class,'store'])->middleware('can:serv.ticket.create.execute');
  Route::patch('tickets/{uuid}/radius', [TicketController::class,'adjustRadius'])->middleware('can:serv.dispatch.adjust.execute');
});
// routes/api/v1/invest.php
Route::prefix('v1/invest')->middleware('auth:jwt')->group(function(){
  Route::post('dispatches', [InvestDispatchController::class,'store'])->middleware('can:invest.dispatch.execute');
});
// routes/channels.php (Reverb)
Broadcast::channel('presence-dispatch-{region}', function($user, $region){
  return $user->can('serv.dispatch.view') && strtolower($user->governorate)===strtolower($region);
});
Broadcast::channel('private-invest.{uuid}', function($user, $uuid){
  $esc=EscrowClearing::where('uuid',$uuid)->first(); return $esc && ($esc->buyer_id==$user->id || $esc->seller_id==$user->id);
});
```

---

**ملخص عربي:** واجهات AU SERV وAU INVEST بجاهزية إنتاج — إنشاء تذاكر بخريطة POINT وتعديل نصف قطر ديناميكي لإعادة حساب أقرب مزود دون ميلي ثانية، مع إرسال استثماري مقفل بضمان 5%، وقناة حضور `presence-dispatch-{region}` عبر Reverb 8080 لتتبع مواقع المزودين حياً وأحداث الإرسال.

*Next: [PROMPT 2.3a] Search & Realtime Contracts*
