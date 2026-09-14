# PHASE 2.2a — Auth & Financial APIs (Arena Canonical)

> **Env:** `Arena` (`arena/01a09d54-drfifty`) | **Project:** `abduniproject` | **Base:** `https://api.abduni.com/api/v1` | **Stack:** Laravel 12 PHP8.4 → Action-Service-Repository → Inertia v2 | **Auth:** JWT 15m + `__Host-rt` HttpOnly 7d (Pillar9) | **Date:** 2026-09-14

## 0) Global Contract

| Item | Value |
|------|-------|
| **Versioning** | URI `v1`, `Accept: application/json` |
| **Auth Header** | `Authorization: Bearer <access_jwt>` (memory, not storage) |
| **Refresh** | `Cookie: __Host-rt=...; Path=/api/v1/auth/refresh; Secure; HttpOnly; SameSite=Lax` |
| **App Context** | `X-App-Id: AU_BUSINESS\|AU_MED\|AU_DEALS\|AU_SERV\|AU_INVEST` (enum, default AU_BUSINESS) |
| **Idempotency** | `Idempotency-Key: uuid` required for `deposit/withdraw/lock` (24h) |
| **Rate Limit** | `X-RateLimit-Limit: 60/min` (auth 5/min, wallet 20/min, escrow 10/min) + Cloudflare 20/s/IP prod |
| **Errors** | `{message, code, errors: {field:[msg]}, meta: {trace_id}}` |
| **Pagination** | `?page&per_page(15/50)` → `{data, meta: {current_page,last_page,total}}` |
| **Audit** | Every `POST` → `wallet_transactions` hash chain; `401 token_expired` → silent refresh (2.1a) |

```ts
// Common Types (TS 5.7 strict zero any)
type AppId = 'AU_BUSINESS'|'AU_MED'|'AU_DEALS'|'AU_SERV'|'AU_INVEST';
type UUID = string; // v4
type MoneySubunit = number; // int cents
type ApiError = { message:string; code:string; errors?:Record<string,string[]>; meta:{trace_id:UUID} };
```

---

## 1) Auth Endpoints

### 1.1 `POST /api/v1/auth/register`

| Field | Value |
|-------|-------|
| **Guard** | `guest` (`throttle:5/min`) |
| **App** | `AU_BUSINESS` default (origin `app_id`) |
| **RBAC** | `view: public` |

**Request (JSON):**
```json
{
  "name": "أحمد محمد",
  "email": "ahmed@example.com",
  "phone": "+201012345678",
  "password": "S3cure!Pass123",
  "password_confirmation": "S3cure!Pass123",
  "locale": "ar",
  "app_id": "AU_BUSINESS"
}
```
**Validation (Laravel FormRequest `RegisterRequest`):**
```php
'name'=>['required','string','min:3','max:120','regex:/^[\p{Arabic}\p{L}\s]+$/u'],
'email'=>['required','email:rfc','max:255','unique:users,email'],
'phone'=>['required','string','regex:/^(\+?20|0)?1[0125][0-9]{8}$/','unique:users,phone_encrypted'], // encrypted before check via Detector
'password'=>['required','string','min:8','max:64','confirmed','regex:/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&]).+$/'],
'locale'=>['sometimes','in:ar,en'],
'app_id'=>['sometimes','in:AU_BUSINESS,AU_MED,AU_DEALS,AU_SERV,AU_INVEST'],
```
*LeakDetector:* `phone` passes `RegexDataLeakDetector` (allowed here pre-escrow), `AES-256-GCM` encrypt before store.

**Success `201`:**
```json
{
  "data": { "user": {"id":1,"uuid":"...","name":"أحمد محمد","email":"ahmed@example.com","app_id":"AU_BUSINESS","locale":"ar","status":"active"}, "access_token":"eyJ...","token_type":"Bearer","expires_in":900 },
  "meta": {"trace_id":"..."}
}
```
*Headers:* `Set-Cookie: __Host-rt=<refresh>; Path=/api/v1/auth/refresh; HttpOnly; Secure; SameSite=Lax; Max-Age=604800`

**Errors:** `422` validation, `429` throttle, `503` AU Lite `feature_flags` disabled.

---

### 1.2 `POST /api/v1/auth/login`

| Field | Value |
|-------|-------|
| **Guard** | `guest` `throttle:5/min` |
| **Lock** | `Cache::throttle login:{email} 5/min` + soft-freeze after 3 MFA fails |

**Request:**
```json
{ "email":"ahmed@example.com", "password":"S3cure!Pass123", "app_id":"AU_BUSINESS" }
```
**Validation:**
```php
'email'=>['required','email','exists:users,email'],
'password'=>['required','string'],
'app_id'=>['sometimes','in:AU_BUSINESS,AU_MED,AU_DEALS,AU_SERV,AU_INVEST'],
// Optional TOTP when mfa_enabled: 'otp'=>['required_with:mfa_enabled','digits:6']
```

**Success `200`:**
```json
{ "data": {"user":{"id":1,"uuid":"...","email":"ahmed@example.com","roles":[{"slug":"buyer"}]}, "access_token":"eyJ...","expires_in":900 } }
```
`Set-Cookie: __Host-rt` as above. `200` also returns `X-RateLimit-Remaining`.

**Errors:** `401 {code:"invalid_credentials"}`, `423 {code:"account_frozen_soft"}`, `429`, `422`.

**Silent Refresh Flow:** `401 + code:"token_expired"` → client `POST /api/v1/auth/refresh` (cookie only) → `200 {access_token}` (see 2.1a), replay original. No logout.

---

### 1.3 `GET /api/v1/auth/me`

| Field | Value |
|-------|-------|
| **Guard** | `auth:jwt` (`Bearer` 15m) |
| **RBAC** | `auth` (any) |

**Headers:** `Authorization: Bearer eyJ...`

**Success `200`:**
```json
{
  "data": {
    "user": {"id":1,"uuid":"...","name":"أحمد محمد","email":"ahmed@example.com","phone_verified":true,"mfa_enabled":false,"locale":"ar","app_id":"AU_BUSINESS","status":"active","last_login_at":"2026-09-14T09:00:00Z"},
    "roles": [{"slug":"buyer","name":"Buyer","app_id":"AU_DEALS"}],
    "permissions": ["module.4.deals.view","wallet.balance.view"],
    "wallets_summary": [{"currency":"EGP","balance_subunit":500000,"available_subunit":400000}]
  }
}
```
**Errors:** `401 token_expired/token_invalid`, `401 token_revoked`.

---

## 2) Wallet Endpoints

### 2.1 `GET /api/v1/wallet/balance`

| Field | Value |
|-------|-------|
| **Guard** | `auth:jwt` |
| **RBAC** | `can:wallet.balance.view` (Rule36 view) |
| **Cache** | `Redis::remember wallet:balance:{user}:{currency} 30s` (Rule37 no COUNT*) |

**Query:** `?currency=EGP` (optional, default all) `?app_id=AU_DEALS`

**Success `200`:**
```json
{
  "data": {
    "wallets": [
      {"id":10,"uuid":"...","app_id":"AU_DEALS","currency":"EGP","balance_subunit":500000,"locked_subunit":100000,"available_subunit":400000,"status":"active","version":12}
    ],
    "fx": {"EGP_USD":"0.0204","fetched_at":"2026-09-14T08:30:00Z"}
  },
  "meta": {"trace_id":"..."}
}
```
**Errors:** `401`, `403 {code:"forbidden_view"}`, `503 AU Lite`.

---

### 2.2 `POST /api/v1/wallet/deposit`

| Field | Value |
|-------|-------|
| **Guard** | `auth:jwt` |
| **RBAC** | `can:wallet.deposit.execute` (Rule36 execute + server lock) |
| **Idempotency** | `Idempotency-Key` required, 24h dedup via `wallet_transactions.reference_uuid` |
| **Lock** | `Redis Mutex wallet:lock:{wallet_id} 10s` + `SELECT FOR UPDATE` (Pillar6) |

**Request:**
```json
{
  "currency": "EGP",
  "amount_subunit": 100000,
  "app_id": "AU_DEALS",
  "paymob_token": "tok_...",
  "reference_uuid": "uuid-v4-idempotency"
}
```
**Validation:**
```php
'currency'=>['required','string','size:3','in:EGP,USD,SAR,AED,KWD'], // dynamic via Super Admin but seed list
'amount_subunit'=>['required','integer','min:100','max:10000000000'], // 1 EGP min, 100M EGP max (rolling cap)
'app_id'=>['required','in:AU_BUSINESS,AU_MED,AU_DEALS,AU_SERV,AU_INVEST'],
'paymob_token'=>['required','string','max:500'],
'reference_uuid'=>['required','uuid','unique:wallet_transactions,reference_uuid'],
```

**Success `201`:**
```json
{
  "data": {
    "transaction": {"uuid":"...","type":"deposit","amount_subunit":100000,"balance_after_subunit":600000,"currency":"EGP","hash_current":"...","paymob_transaction_id":"pm_123"},
    "wallet": {"id":10,"balance_subunit":600000,"available_subunit":500000}
  }
}
```
**Errors:** `422`, `409 {code:"idempotency_replayed", existing_uuid}`, `423 wallet_frozen`, `402 paymob_declined`, `409 wallet_busy (retry 50ms)`.

**Flow:** `Paymob /api/ecommerce/orders + /payment/keys → capture → wallet_transactions paymob_capture + deposit` atomically; hash chain `SHA256(prev+uuid+amount+balance)`.

---

### 2.3 `POST /api/v1/wallet/withdraw-request`

| Field | Value |
|-------|-------|
| **Guard** | `auth:jwt` |
| **RBAC** | `can:wallet.withdraw.execute` |
| **Lock** | Same Pillar6 + `velocity 5/min` (Q24) + `rolling caps` |

**Request:**
```json
{
  "currency": "EGP",
  "amount_subunit": 50000,
  "app_id": "AU_DEALS",
  "iban": "EG380003...",
  "reference_uuid": "uuid-v4"
}
```
**Validation:**
```php
'currency'=>['required','in:EGP,USD,SAR,AED'],
'amount_subunit'=>['required','integer','min:1000','max:50000000'], // 10 EGP min
'app_id'=>['required','in:...'],
'iban'=>['required','string','regex:/^EG[0-9]{27}$/'],
'reference_uuid'=>['required','uuid','unique:wallet_transactions,reference_uuid'],
// Custom: available_subunit >= amount_subunit (after FOR UPDATE check)
```

**Success `202` (async batch payout):**
```json
{
  "data": {
    "request": {"uuid":"...","status":"pending_batch","amount_subunit":50000,"currency":"EGP","eta":"next_batch 18:00 UTC"},
    "wallet": {"balance_subunit":550000,"available_subunit":450000,"locked_subunit":100000}
  }
}
```
**Errors:** `422`, `403 insufficient_available`, `429 velocity_exceeded (5/min)`, `423 rolling_cap_exceeded`, `409 wallet_busy`.

*Note:* `withdraw` is **request** → queued `batch_payouts` (escrow Q15-27), no instant; `wallet_transactions withdraw` only on batch success.

---

## 3) Escrow Endpoints

### 3.1 `POST /api/v1/escrow/lock` — hold funds (Closed/Blind, single-payer, 12h grace once)

| Field | Value |
|-------|-------|
| **Guard** | `auth:jwt` |
| **RBAC** | `can:escrow.lock.execute` + `is_single_payer buyer` (Oil3) |
| **Idempotency** | `Idempotency-Key` → `escrow_clearings.uuid` |
| **Lock** | `Pessimistic wallet FOR UPDATE` + `Redis Mutex` |

**Request:**
```json
{
  "deal_id": 101,
  "seller_id": 77,
  "app_id": "AU_DEALS",
  "module_id": 4,
  "amount_subunit": 250000,
  "currency": "EGP",
  "barter_split": {"ratio":"1.5/1.0","split":"50/50"},
  "milestones": {"total":2,"current":1},
  "reference_uuid": "uuid-v4"
}
```
**Validation:**
```php
'deal_id'=>['required','integer','exists:deals_listings,id'],
'seller_id'=>['required','integer','exists:users,id','different:buyer_id'],
'app_id'=>['required','in:AU_BUSINESS,AU_MED,AU_DEALS,AU_SERV,AU_INVEST'],
'module_id'=>['required','integer','between:1,9'],
'amount_subunit'=>['required','integer','min:1'],
'currency'=>['required','in:EGP,USD,SAR,AED'],
'barter_split'=>['sometimes','array:ratio,split'],
'milestones.total'=>['sometimes','integer','between:1,10'],
'reference_uuid'=>['required','uuid','unique:escrow_clearings,uuid'],
// Custom: buyer = auth user, wallet available >= amount, seller sub_merchant exists or queued
```

**Success `201`:**
```json
{
  "data": {
    "escrow": {
      "uuid":"...","status":"holding","amount_subunit":250000,"currency":"EGP",
      "commission_rate_snapshot":0.05,"commission_amount_subunit":12500,"vat_amount_subunit":0,
      "fx_snapshot":{"EGP_USD":0.0204,"locked_at":"2026-09-14T09:00:00Z"},
      "barter_split":{"ratio":"1.5/1.0","split":"50/50"},
      "paymob_transaction_id":"pm_lock_123","sub_merchant_id":"sub_77",
      "hold_started_at":"2026-09-14T09:00:00Z","dispute_deadline_at":"2026-09-16T09:00:00Z","grace_expires_at":"2026-09-14T21:00:00Z",
      "hash_chain":"..."
    },
    "wallet": {"balance_subunit":350000,"locked_subunit":350000,"available_subunit":0}
  }
}
```
**Errors:** `422`, `403 not_single_payer`, `402 insufficient_available`, `409 wallet_busy`, `503 paymob_queue`.

*Immutability:* `commission_rate_snapshot` & `fx_snapshot` frozen here; later dashboard changes affect only new locks.

---

### 3.2 `POST /api/v1/escrow/release` — seller payout (partial milestone supported)

| Field | Value |
|-------|-------|
| **Guard** | `auth:jwt` |
| **RBAC** | `can:escrow.release.execute` (buyer or auto after 48h no dispute) |
| **State** | `holding/disputed/partial_milestone → released` |

**Request:**
```json
{ "escrow_uuid":"...", "milestone_number":1 }
```
**Validation:**
```php
'escrow_uuid'=>['required','uuid','exists:escrow_clearings,uuid'],
'milestone_number'=>['sometimes','integer','min:1'],
// Custom: auth is buyer OR calibrator auto-fix, escrow not expired_grace, not chargeback_frozen
```

**Success `200`:**
```json
{
  "data": {
    "escrow":{"uuid":"...","status":"released","released_at":"2026-09-16T10:00:00Z","milestone_number":1},
    "transactions": [
      {"type":"escrow_release","amount_subunit":237500,"to":"seller"},
      {"type":"commission","amount_subunit":12500,"to":"platform"},
      {"type":"vat","amount_subunit":0}
    ]
  }
}
```
**Errors:** `404`, `409 {code:"not_hold_status"}`, `403 {code:"not_buyer"}`, `423 {code:"chargeback_frozen"}`, `410 {code:"grace_expired_waiting_list"}`.

---

### 3.3 `POST /api/v1/escrow/dispute` — open 48h window

| Field | Value |
|-------|-------|
| **Guard** | `auth:jwt` |
| **RBAC** | `can:escrow.dispute.execute` (buyer/seller) |
| **Window** | `now <= dispute_deadline_at (hold+48h)` |

**Request:**
```json
{ "escrow_uuid":"...", "reason":"item_not_as_described", "evidence_urls":["https://.../img.jpg"], "description":"المقاس غير مطابق" }
```
**Validation:**
```php
'escrow_uuid'=>['required','uuid','exists:escrow_clearings,uuid'],
'reason'=>['required','in:item_not_as_described,not_delivered,damaged,other'],
'evidence_urls'=>['sometimes','array','max:5'], 'evidence_urls.*'=>['url','max:500'],
'description'=>['required','string','min:10','max:2000'],
// Detector: description passes RegexDataLeakDetector (post-escrow strict)
```

**Success `201`:**
```json
{ "data": {"escrow":{"uuid":"...","status":"disputed","dispute_deadline_at":"2026-09-16T09:00:00Z","hold_extended":true}} }
```
**Errors:** `410 {code:"dispute_window_closed"}`, `409 {code:"already_disputed"}`, `422 leak_detected`.

*After dispute:* Calibrator (Agent 10/13) auto-triage → `released/refunded/partial_milestone` + Reverb `private.escrow.{uuid}`.

---

## 4) Common Schemas & Validation Matrix

| Field | Rule | Error Code |
|-------|------|------------|
| `app_id` | `in:AU_BUSINESS,AU_MED,AU_DEALS,AU_SERV,AU_INVEST` | `invalid_app` |
| `currency` | `in:EGP,USD,SAR,AED,KWD...` + Super Admin dynamic | `unsupported_currency` |
| `amount_subunit` | `integer, min:100, max:cap` + `CHECK >=0` | `invalid_amount` |
| `reference_uuid` | `uuid, unique:table,uuid` | `idempotency_replayed` |
| `Idempotency-Key` | header `uuid` required for POST wallet/escrow | `missing_idempotency` |
| `phone` | encrypted `AES-256-GCM`, uniqueness on hash | `phone_taken` |

**Error envelope (all):**
```json
{ "message":"Validation failed", "code":"validation_error", "errors":{"email":["taken"]}, "meta":{"trace_id":"..."} }
```

---

## 5) Route File (Laravel 12)

```php
// routes/api/v1/auth_wallet_escrow.php — Arena canonical
use Illuminate\Support\Facades\Route;
Route::prefix('v1')->group(function(){
  Route::prefix('auth')->group(function(){
    Route::post('register',[AuthController::class,'register'])->middleware('throttle:5,1');
    Route::post('login',[AuthController::class,'login'])->middleware('throttle:5,1');
    Route::post('refresh',[AuthController::class,'refresh']); // cookie only
    Route::get('me',[AuthController::class,'me'])->middleware('auth:jwt');
  });
  Route::middleware(['auth:jwt','throttle:60,1'])->group(function(){
    Route::get('wallet/balance',[WalletController::class,'balance'])->middleware('can:wallet.balance.view');
    Route::post('wallet/deposit',[WalletController::class,'deposit'])->middleware('can:wallet.deposit.execute');
    Route::post('wallet/withdraw-request',[WalletController::class,'withdrawRequest'])->middleware('can:wallet.withdraw.execute');
    Route::post('escrow/lock',[EscrowController::class,'lock'])->middleware('can:escrow.lock.execute');
    Route::post('escrow/release',[EscrowController::class,'release'])->middleware('can:escrow.release.execute');
    Route::post('escrow/dispute',[EscrowController::class,'dispute'])->middleware('can:escrow.dispute.execute');
  });
});
```

---

**ملخص عربي:** واجهات مصادقة ومحفظة وضمان بجاهزية إنتاج — 9 نقاط نهاية بتوثيق JWT 15د + كوكي منعش HttpOnly، مع تحقق صارم ومفاتيح تكرار وهاش متسلسل وضمانات تجميد عمولة 5% وصرف، وحماية تزامن حتمية وقفل تنفيذي منفصل عن العرض.

*Next: [PROMPT 2.2b] Deals/Serv/Med APIs*
