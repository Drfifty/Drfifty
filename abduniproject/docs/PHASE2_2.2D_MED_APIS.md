# PHASE 2.2d — AU MED Anonymized Consultation APIs (Arena Canonical)

> **Env:** `Arena` (`arena/01a09d54-drfifty`) | **Project:** `abduniproject` (`amed_`) | **DB:** PostgreSQL 16 `PostGIS+pgcrypto+pgvector` (clinical) + MySQL 8.4 (catalog) | **Base:** `https://api.abduni.com/api/v1/au-med` | **Auth:** JWT 15m | **Privacy:** AES-256-GCM per-row IV + SHA256 anonymized hashes (ZERO raw) | **Date:** 2026-09-14

## 0) Scope & Privacy Mandate

| Item | Value |
|------|-------|
| **Store Split** | `PostgreSQL 16` exclusive clinical (appointments, messages hashes, pgvector) — **MySQL never stores raw chat** |
| **Encryption** | `pgp_sym_encrypt(data, key, 'cipher-algo=aes256')` + `AES-256-GCM` per-row IV (Rule6) — TLS 1.3 |
| **Telemetry** | `/telemetry/audit` passes **only SHA256 hashes** of NLP tokens/ intents — **zero raw payload** stored/transmitted |
| **Headers** | `Authorization: Bearer <jwt>` + `X-App-Id: AU_MED` + `X-Request-Id: uuid` + `Idempotency-Key` (POST) |
| **RBAC** | `med.provider.view` (public) vs `med.appointment.execute` + `med.telemetry.audit.execute` (internal service + HITL) |
| **HITL** | `micro_switch_matrix` Agent 10 QA/Medical `requires_hitl` → HOLD for human review |

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

## 1) Endpoints

### 1.1 `GET /api/v1/au-med/providers` — Medical Provider Listing (public catalog, cached)

| Field | Value |
|-------|-------|
| **Guard** | `public` (L1 Guest) — `throttle:60/min` |
| **Cache** | `Redis::remember med:providers:{hash} 120s` |
| **Store** | MySQL catalog (non-clinical) + `PostGIS` clinic point |

**Query:** `?specialty=cardiology&governorate=Cairo&city=Nasr City&lat=30.04&lng=31.23&radius_km=10&available_on=2026-09-15&rating_min=4.5&verified=1&page=1&per_page=15&sort=rating_desc`

**Success `200`:**
```json
{
  "data":[
    {
      "id":101,"uuid":"...","name":"د. أحمد кардиو","name_ar":"د. أحمد قلب","specialty":"cardiology","specialty_ar":"قلب",
      "governorate":"Cairo","city":"Nasr City","clinic_point":"POINT(31.23 30.04)","distance_m":850,
      "rating":4.9,"is_verified":true,"available_slots":["2026-09-15T10:00:00Z","2026-09-15T10:30:00Z"],
      "consultation_price_subunit":50000,"currency":"EGP","is_contact_hidden":true
    }
  ],
  "meta":{"current_page":1,"last_page":8,"total":112,"took_ms":22}
}
```
*Contact hidden pre-escrow (Oil1) — disclosed only after `appointment holding` via escrow.*

---

### 1.2 `GET /api/v1/au-med/providers/{uuid}`

| Field | Value |
|-------|-------|
| **Guard** | `public` |

**Success `200`:**
```json
{
  "data":{
    "provider":{"id":101,"uuid":"...","name":"د. أحمد قلب","specialty":"cardiology","about":"استشاري قلب 15 سنة","languages":["ar","en"],"rating":4.9,"verified":true,"clinic":{"address":"مدينة نصر","point":"POINT(31.23 30.04)"}},
    "slots":[{"start":"2026-09-15T10:00:00Z","end":"2026-09-15T10:30:00Z","status":"free"}],
    "reviews_summary":{"avg":4.9,"count":142}
  }
}
```
**Errors:** `404`, `500`.

---

### 1.3 `POST /api/v1/au-med/appointments` — Appointment Booking (escrow-locked)

| Field | Value |
|-------|-------|
| **Guard** | `auth:jwt` |
| **RBAC** | `can:med.appointment.execute` |
| **Idempotency** | `Idempotency-Key` → `appointments.uuid` 24h |
| **Lock** | `Redis Mutex appointment:{provider}:{slot} 10s` + `SELECT FOR UPDATE` on slot (PG) |
| **Escrow** | Creates `escrow_clearings holding` (AU MED `module_id=7`) — single-payer, 12h grace once |

**Request JSON:**
```json
{
  "provider_uuid": "uuid-provider-101",
  "slot_start": "2026-09-15T10:00:00Z",
  "slot_end": "2026-09-15T10:30:00Z",
  "consultation_type": "in_person",
  "chief_complaint_hash": "a3f5c1e8...64char SHA256",
  "symptoms_hashes": ["b7e2...","c9d1..."],
  "currency": "EGP",
  "reference_uuid": "uuid-v4"
}
```
*Privacy:* Client hashes complaint/symptoms **locally via `SHA256(normalize(ar)+salt)`** before send — **no raw text** leaves device. Raw chat stored only encrypted in PG `pgcrypto` if needed, never in `telemetry`.

**Validation (`StoreAppointmentRequest`):**
```php
'provider_uuid'=>['required','uuid','exists:med_providers,uuid'],
'slot_start'=>['required','date','after:now','exists:med_slots,start,provider_uuid,provider_uuid'],
'slot_end'=>['required','date','after:slot_start'],
'consultation_type'=>['required','in:in_person,video,chat'],
'chief_complaint_hash'=>['required','string','size:64','regex:/^[a-f0-9]{64}$/'], // SHA256 hex
'symptoms_hashes'=>['sometimes','array','max:10'], 'symptoms_hashes.*'=>['string','size:64','regex:/^[a-f0-9]{64}$/'],
'currency'=>['required','in:EGP,USD,SAR'],
'reference_uuid'=>['required','uuid','unique:au_med_appointments,uuid'],
// Custom: slot not already held, provider available, wallet available >= price
```

**Success `201`:**
```json
{
  "data":{
    "appointment":{"uuid":"...","status":"holding","provider_uuid":"...","slot_start":"2026-09-15T10:00:00Z","consultation_type":"in_person","price_subunit":50000,"currency":"EGP","escrow_uuid":"...","hold_started_at":"2026-09-14T09:00:00Z","grace_expires_at":"2026-09-14T21:00:00Z"},
    "escrow":{"uuid":"...","commission_rate_snapshot":0.05,"hash_chain":"..."}
  },
  "meta":{"trace_id":"..."}
}
```
**Errors:** `422` (hash format), `409 {code:"slot_taken", retry_slot:"2026-09-15T11:00:00Z"}`, `402 insufficient_available`, `429`, `503` AU MED hibernated.

*Flow:* `wallet available → escrow holding (snapshots frozen) → PG appointment holding` + `Reverb private-med.{appointment_uuid}` + `Agent 10` triage if `requires_hitl`.

---

### 1.4 `POST /api/v1/au-med/telemetry/audit` — Anonymized NLP Compliance Telemetry (ZERO raw)

| Field | Value |
|-------|-------|
| **Guard** | `auth:jwt` **+** `service` (`X-Service-Token: <internal>`) — dual |
| **RBAC** | `can:med.telemetry.audit.execute` (Agent 10 / internal NLP service only) |
| **Throttle** | `100/min` (service) |
| **Store** | **PG** `med_telemetry_audits` — **only hashes**, TTL 90d hot → S3 Parquet |
| **Privacy Middleware** | `AnonymizedTelemetryMiddleware` **hard-blocks raw** (see §2) |

**Request JSON (STRICTLY hashes, zero raw):**
```json
{
  "appointment_uuid": "uuid-appointment",
  "model_version": "au-nlp-v2.1",
  "input_hashes": ["a3f5...","b7e2...","c9d1..."],
  "intent_hashes": ["d4a8..."],
  "entity_hashes": ["e5b9..."],
  "compliance_flags": ["no_pii_leak","no_dosage_advice"],
  "confidence": 0.92,
  "latency_ms": 180,
  "meta": {"tokens_count":42,"language":"ar"}
}
```
*Forbidden payload (will be `422`):* `{"raw_text":"ألم في الصدر"}` or `{"chat":"..."}` — **blocked**.

**Validation (`TelemetryAuditRequest`):**
```php
'appointment_uuid'=>['required','uuid','exists:au_med_appointments,uuid'],
'model_version'=>['required','string','max:40','regex:/^au-nlp-v[0-9.]+$/'],
'input_hashes'=>['required','array','min:1','max:100'], 'input_hashes.*'=>['string','size:64','regex:/^[a-f0-9]{64}$/'],
'intent_hashes'=>['required','array','min:1','max:20'], 'intent_hashes.*'=>['string','size:64'],
'entity_hashes'=>['sometimes','array','max:20'], 'entity_hashes.*'=>['string','size:64'],
'compliance_flags'=>['required','array','min:1'], 'compliance_flags.*'=>['in:no_pii_leak,no_dosage_advice,safe_tone,policy_ok'],
'confidence'=>['required','numeric','between:0,1'],
'latency_ms'=>['required','integer','between:1,10000'],
'meta'=>['sometimes','array'], 'meta.tokens_count'=>['integer','min:1','max:1000'],
// Custom: no field named raw_text/chat/message/content allowed → 422 leak_detected
```

**Success `202` (queued):**
```json
{ "data": {"audit_id":"...","status":"queued","retention_days":90}, "meta":{"trace_id":"..."} }
```

**Errors:** `400` missing `X-Service-Token`, `401`, `403 {code:"not_telemetry_service"}`, `422 {code:"raw_payload_blocked", field:"raw_text"}`, `422 {code:"invalid_hash_format"}`, `429`, `500`.

---

## 2) Privacy Middleware Rules (AnonymizedTelemetryMiddleware) — Hard Guarantees

```php
// app/Modules/AUMed/Http/Middleware/AnonymizedTelemetryMiddleware.php — ultra-concise
public function handle($req, Closure $next){
  $rawKeys=['raw_text','chat','message','content','transcript','prompt'];
  foreach($rawKeys as $k) if($req->has($k)) abort(422, "raw_payload_blocked: $k forbidden");
  if(strlen(json_encode($req->all()))> 8000) abort(422, 'payload_too_large');
  // Ensure every hash is 64 hex (SHA256), no plaintext tokens
  foreach(['input_hashes','intent_hashes','entity_hashes'] as $f){
    foreach((array)$req->input($f,[]) as $h) if(!preg_match('/^[a-f0-9]{64}$/',$h)) abort(422, "invalid_hash_format: $f");
  }
  // Strip IP → hash via HMAC before logging
  $req->headers->set('X-Forwarded-For', hash_hmac('sha256', $req->ip(), config('app.key')));
  return $next($req);
}
```

| # | Rule | Enforce |
|---|------|---------|
| 1 | **ZERO raw** | Middleware abort `422` if any `raw_text/chat/message` exists |
| 2 | **Hash-only** | Regex `^[a-f0-9]{64}$` for all hashes (SHA256) |
| 3 | **Client-side salt** | `hash = SHA256(normalize(ar_text) + per-device salt + appointment_uuid)` — prevents rainbow |
| 4 | **Encrypted storage** | PG `pgp_sym_encrypt(hash, key)` + `pgcrypto` + `AES-256-GCM` app-layer for any residual PII |
| 5 | **TTL 90d** | `med_telemetry_audits` hot 90d → `S3 Parquet` cold, `DELETE` raw after 90d, hashes retained |
| 6 | **Audit + HITL** | `confidence <0.90` → `Agent 10 QA/Medical` queue `requires_hitl` + `human review` before model update |
| 7 | **No echo** | Response never echoes input_hashes raw, only `audit_id` |

**PG Schema (clinical):**
```sql
-- PostgreSQL 16 (AU MED exclusive)
CREATE TABLE med_telemetry_audits (
  id BIGSERIAL PRIMARY KEY, uuid UUID UNIQUE NOT NULL,
  appointment_uuid UUID NOT NULL, model_version TEXT NOT NULL,
  input_hashes TEXT[] NOT NULL, -- SHA256[]
  intent_hashes TEXT[] NOT NULL, entity_hashes TEXT[],
  compliance_flags TEXT[] NOT NULL, confidence REAL CHECK (confidence BETWEEN 0 AND 1),
  latency_ms INT, meta JSONB, created_at TIMESTAMPTZ DEFAULT NOW()
);
-- No raw_text column exists — by design
```

---

## 3) Status Codes Matrix

| Code | When |
|------|------|
| `200` | provider listing, provider get |
| `201` | appointment created (holding) |
| `202` | telemetry queued |
| `400` | invalid specialty, missing X-Service-Token |
| `401` | token_expired |
| `403` | forbidden_execute / not_telemetry_service |
| `422` | validation / raw_payload_blocked / invalid_hash |
| `429` | throttle |
| `503` | AU MED hibernated |
| `500` | PG fail + trace_id |

---

## 4) Route File (Laravel 12)

```php
// routes/api/v1/med.php — Arena canonical
use App\Modules\AUMed\Http\Controllers\Api\V1\ProviderController;
use App\Modules\AUMed\Http\Controllers\Api\V1\AppointmentController;
use App\Modules\AUMed\Http\Controllers\Api\V1\TelemetryController;
use App\Modules\AUMed\Http\Middleware\AnonymizedTelemetryMiddleware;
use Illuminate\Support\Facades\Route;

Route::prefix('v1/au-med')->group(function(){
  Route::get('providers', [ProviderController::class,'index']);
  Route::get('providers/{uuid}', [ProviderController::class,'show']);
  Route::middleware('auth:jwt')->group(function(){
    Route::post('appointments', [AppointmentController::class,'store'])->middleware('can:med.appointment.execute');
    Route::post('telemetry/audit', [TelemetryController::class,'audit'])
      ->middleware(['can:med.telemetry.audit.execute', AnonymizedTelemetryMiddleware::class, 'throttle:100,1']);
  });
});
```

---

**ملخص عربي:** واجهات AU MED بجاهزية إنتاج — قوائم أطباء مع فلاتر جغرافية/تخصص، وحجز مواعيد مؤمن بضمان مقفل 5% وفترة سماح 12 ساعة، مع قياس مجهول الهوية يمرر فقط تجزئات SHA256 ويحجب أي نص خام عبر وسيط خصوصية صارم وتخزين PG مشفر 90 يوم.

*Next: [PROMPT 2.3] Search & Notifications*
