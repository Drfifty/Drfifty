# PHASE 5.0 — B.7 التطبيقات الـ5 (Deals, Serve, Invest, Med) — Isolated REST APIs — Audit-Hardened

> **ABD UNI PROJECT — Senior API Architect — 4 Apps Isolated REST + Spatial + Escrow Funding + Privacy-First Telemetry — Arena Canonical v5.0-B.7 — AUDIT-HARDENED (F-01→F-14)**
> **Stack Lock:** Laravel 12 PHP 8.4 | MySQL 8.4 `InnoDB utf8mb4 JSON(not JSONB) FULLTEXT ngram SPATIAL SRID4326 minor BIGINT CHECK+WORM TRIGGER` core | PostgreSQL 16 `PostGIS+pgcrypto` AU MED only | Redis tags+Lua+Mutex 30s | Reverb 8080 wss | 5 Apps space-form `AU BUSINESS ab_ core` | 13 Agents 1-13 | 9 Modules 1-9 | `abduniproject`
> **Refs:** `.arenarules` R5 DDD/R7 JSON/R11 Additive/R12 Eloquent+app_id/R17 env/R18 tx/R27 SoC/R28 DRY/R31 YAGNI/R35 Mutex/R36 view≠execute/R37 stats/R38 secrets | Pillars 3 Tri-Hybrid+5 Leak+6 Financial+9 Rotation | `PROJECT_STATE v5.0-B.6` | B.1a Hierarchy+Leak | B.2a Money/Idempotency/TRACE | B.3 Gate+Micro+Quarantine WORM | B.4 Circuit 5/5m+Budget Lua | B.5 000022-024 ngram+SRID+state-machine+pgcrypto HMAC | B.6 JWT family+EscrowLockService+R37

> **AUDIT-HARDENED NOTE (Pre-Execution 2026-09-16 — 21 flaws F-01→F-14 integrated):** Additive route alias `/serve→/serv` + `/search→listings?search=` + `/med→/au-med pgsql`, full hierarchy `Trace→Tenant 422→Quarantine 503→AULite 503→micro 403/202→Sanitize 422→Idempotency`, `TenantScoped+scopeSearch ngram BOOLEAN + scopeNearby SRID4326`, `Money minor`, `state-machine trigger 45000`, `pgsql PostGIS+pgcrypto HMAC chain WORM 90d`, `AgentStrategyManager deterministic→fallback`, `stats R37 30s tags + replica heartbeat 5s`, `thin Controllers ≤60L→Actions≤120L→Services`.

---

## 0. EXECUTIVE SUMMARY

B.7 يطلق **4 تطبيقات معزولة**: `AU DEALS adl_` بحث `ngram` مصفّى بالفئة/سعر + خامل Agent3 CMO، `AU SERV asv_` تذاكر + `nearby ST_Distance_Sphere` بفهرس مكاني، `AU INVEST ainv_` فرص ممولة + تعهد ضمان `WORM`، `AU MED amed_ pgsql` عيادات + حجز `pgp_sym_encrypt` + قياس `HMAC` صفر خام. بدون التصلب: `/serve` يكرر `/serv` فيصطدم، عربي 0 نتائج، مكاني `600ms` مسح كامل، تعهد بلا `canTransition` يعيد التمويل، خام طبّي يسرّب `010`. هذا الملف **مواصفة واحدة** لـ Arena AI: routes هرمية + FormRequests TRIM + Resources minor + Actions SRP + تهجير إضافي فقط — **بلا TODO بلا raw SQL بلا float**.

**Philosophy:** `Eloquent TenantScoped + Eager ≤5 + Cache tags 60s + replica fallback + EscrowLockService + AgentStrategyManager + AnonymizedTelemetryMiddleware`.

---

## 1. ROUTES CANONICAL — `routes/api/v1/*.php` HARDENED F-01/F-02

```php
// deals.php — reuse 000012/022 tables — hierarchy F-02
Route::prefix('v1/deals')->group(function(){
  // Public browse but still tenant-aware + throttled + AULite + leak scan
  Route::get('listings', [ListingController::class,'index'])->middleware(['ensureTenant','drm.quarantine','au.lite:AU DEALS','throttle:deals-search','sanitize']);
  Route::get('search', [ListingController::class,'index']); // F-01 alias — identical to listings?search= — 302 not needed, same handler
  Route::get('listings/{uuid}', [ListingController::class,'show'])->middleware(['ensureTenant','drm.quarantine','au.lite:AU DEALS']);
  Route::middleware(['auth.jwt','ensureTenant','drm.quarantine','au.lite:AU DEALS'])->group(function(){
    Route::post('listings', [ListingController::class,'store'])->middleware(['micro:deals.create','sanitize','idempotency','throttle:deals-write']);
    Route::post('stagnant/promote', [StagnantController::class,'promote'])->middleware(['micro:deals.promote','sanitize','idempotency']); // Agent3
  });
});

// serv.php — canonical /serv + alias /serve F-01
Route::prefix('v1/serv')->middleware(['ensureTenant','drm.quarantine','au.lite:AU SERV'])->group(function(){
  Route::get('providers/nearby', [ProviderNearbyController::class,'index'])->middleware(['throttle:serv-nearby']);
  Route::middleware(['auth.jwt'])->group(function(){
    Route::post('tickets', [TicketController::class,'store'])->middleware(['micro:serv.ticket.create','sanitize','idempotency']);
  });
});
Route::prefix('v1/serve')->group(fn()=> Route::redirect('providers/nearby','/api/v1/serv/providers/nearby',302)); // alias compatibility

// invest.php — funding rounds + escrow pledge
Route::prefix('v1/invest')->middleware(['ensureTenant','drm.quarantine','au.lite:AU INVEST'])->group(function(){
  Route::get('opportunities', [OpportunityController::class,'index'])->middleware(['throttle:invest-browse']);
  Route::middleware(['auth.jwt'])->group(function(){
    Route::post('escrow/pledge', [PledgeController::class,'pledge'])->middleware(['micro:invest.fractional.issue','sanitize','idempotency']);
    // alias canonical dispatches for Phase 3.5 compatibility
    Route::post('dispatches', [PledgeController::class,'pledge'])->middleware(['micro:invest.fractional.issue','sanitize','idempotency']);
  });
});

// med.php + au-med alias — pgsql exclusive
Route::prefix('v1/med')->middleware(['ensureTenant','drm.quarantine','au.lite:AU MED'])->group(function(){
  Route::get('providers', [MedProviderController::class,'index'])->middleware(['throttle:med-browse']);
  Route::middleware(['auth.jwt'])->group(function(){
    Route::post('appointments', [MedAppointmentController::class,'store'])->middleware(['micro:med.appointment','sanitize','idempotency']);
    Route::post('telemetry/audit', [MedTelemetryController::class,'audit'])->middleware(['micro:med.telemetry.audit','AnonymizedTelemetryMiddleware','throttle:med-telemetry','idempotency']);
  });
});
Route::prefix('v1/au-med')->group(fn()=> Route::redirect('providers','/api/v1/med/providers',302)); // alias
```

Global order already `TraceId+SecurityAudit terminate+QuarantineGuard` via `bootstrap/app.php` (B.3 §4). `auth.jwt` after `ensureTenant` → 401/422 correct.

---

## 2. AU DEALS — `POST listings | GET search | POST stagnant/promote`

### 2.1 `POST /deals/listings` — Create

**Headers:** `Authorization Bearer 15m + X-App-Id: AU DEALS + Idempotency-Key ≥16`

**Request `CreateListingRequest` F-12:**
```json
{ "category_id": 12, "title":"سيارة مستعملة نظيفة", "description":"حالة ممتازة ...", "price_minor": 25000000, "currency":"EGP", "stock":1, "attributes": {"fuel":"gasoline"}, "geo_point": {"lng":31.235,"lat":30.044} }
```
Rules: `category_id required|exists:deal_categories,id + app_id on row must equal X-App-Id TenantScoped check` `title 5..255` `description 10..5000` `price_minor int 1..9e18` `stock int 0..999999` `attributes nullable JSON_VALID` `geo_point nullable lng -180..180 lat -90..90` + `Sanitize BLOCK if contains 010/wa.me/@handle in non-chat → 422 leaks[]` F-09.

**Action `CreateListingAction` ≤120L:**
`DB::transaction READ COMMITTED → verify category isolation TenantScoped → INSERT deals_listings(uuid,tenant_id=auth user,category_id,app_id=AU DEALS,title,description,price_minor,currency,stock,geo_point=ST_SRID(POINT(lng lat),4326),is_hidden 0,is_stagnant 0) → if attributes insert deal_items? → return DealsListingResource eager category` + `Cache::tags(['deals:search:*'])->flush()`

**Response 201:**
```json
{ "data": {"uuid":"...","title":"سيارة...","price_minor":25000000,"price_formatted":"250,000.00","category":{"id":12,"slug":"cars"},"geo_point":{"lng":31.235,"lat":30.044}}, "meta":{"trace_id":"…","app_id":"AU DEALS"} }
```
**Codes:** `201 Created | 401 | 403 MICRO_PERMISSION_DENIED | 422 VALIDATION/LEAK_BLOCKED | 429 throttle | 503 Module Hibernated | DRM 503`

### 2.2 `GET /deals/search | /deals/listings?search=&category_id=&price_min_minor=&price_max_minor=&near_lng=&near_lat=&radius_m=&page=1`

**Request `SearchRequest`:** `search nullable string 2..120 via ngram`, `category_id nullable exists`, `price_min_minor|price_max_minor nullable int ≥0 + max≥min`, `near_* nullable + radius 100..50000`, `page 1..1000 per_page 20 max 50`

**Handler `ListingController@index` F-05:**
`$q=DealsListing::query()->tenant($appId)->with(['category:id,slug,name','dealItems'])->where('is_hidden',0); if(search) $q->search($search) // scopeSearch whereRaw MATCH(title,description) AGAINST(? IN BOOLEAN MODE); if(category) $q->where('category_id',$c); if(price_min) $q->where('price_minor>='); if(near) $q->nearby(lng,lat,radius)->orderByDistance;`
Plus `ReplicaResolver heartbeat<5s?replica:primary + Cache::tags(['deals:search:{hash}']) remember 60s` + `paginate 20 cursor` + `X-DB-Route/cached` meta. `EXPLAIN MATCH` uses `FULLTEXT ngram`.

**Response 200:**
```json
{ "data":[ {"uuid":"...","title":"...","score":1.2,"price_minor":...,"distance_m": 1200} ], "links":{...}, "meta":{"trace_id":"…","app_id":"AU DEALS","db_route":"replica","cached":true} }
```
No live `COUNT(*) group_by` — use `stats_deals_daily` for stagnant KPI.

### 2.3 `POST /deals/stagnant/promote` — Agent3 CMO F-08

**Request `PromoteRequest`:** `listing_uuid required|uuid|exists:deals_listings,uuid` `reason nullable string 10..500`

Auth `micro:deals.promote` (Agent3) 403/202. Fetch `stagnant_deals WHERE listing_id=? and is_promoted=0` via `stats_deals_daily` (not live). Action `PromoteStagnantAction`:

`$ctx=[title,desc,stats last_interaction_at, category] → $proposal = app(AgentStrategyManager)->execute(agentId:3 CMO, appId:AU DEALS, context:$ctx)` — `DeterministicRuleDriver FSM 0-cost first; if confidence<90 or RegexMismatch → fallback Cloud/LocalGpu via local_gpu endpoint SSRF allowlist → Circuit 5/5m skip if OPEN → BudgetGuard Lua Cairo daily atomic check→ BudgetExhausted → HITL` → `if proposal confidence>=90 → update stagnant_deals is_promoted=1,promoted_at=now + toggle is_hidden?0 + event AgentConfidenceEvaluated → CalibratorHealingListener queue:calibrator <15ms` → `Cache flush`.

**Response `202 PROMOTION_QUEUED`:** `{data:{listing_uuid, confidence, driver:"deterministic", reasonCode:"OK"}, meta:{trace_id}}` or `429 BudgetExhausted` or `503 CircuitOpen`.

---

## 3. AU SERV — `POST tickets | GET providers/nearby` F-04

### 3.1 `POST /serv/tickets` — Dispatch

**CreateTicketRequest:** `title 5..255, description 10..2000, pickup_lng/lat required -180..180/-90..90, app_id enum, amount_minor nullable ≥0`

Action `DispatchTicketAction` F-03:
`DB::transaction READ COMMITTED → Ticket uuid + requester_id=auth user + app_id SERV + status requested + pickup_point ST_SRID(POINT(lng lat),4326) → find nearby providers scopeNearby 5km is_active limit5 → dispatch_logs insert distance_m ST_Distance_Sphere → optional escrow hold via EscrowLockService if amount_minor → broadcast Reverb private presence-dispatch.{region} `ProviderLocationUpdated` via `Agent8`. Uses `Cache::lock ticket:{uuid}:5 NX`.

Response 201 `uuid + assigned_provider_id + distance_m`.

### 3.2 `GET /serv/providers/nearby?lat=30.04&lng=31.23&radius_m=5000&specialty=plumbing`

**NearbyProvidersRequest:** `lat -90..90 required, lng -180..180 required, radius_m 100..50000 default 5000, specialty nullable string, limit 1..50 default 20`

Handler: `ServiceProvider::query()->tenant(AU SERV)->where('is_active',1)->withinRadius(lng,lat,radius)->when(specialty)->orderByDistance → select id, specialty, provider_location, distance_m raw + coverage_zone ST_Within fallback + Cache 30s + paginate`.

Response 200 `data:[{id,uuid,specialty,distance_m: 840, provider_location:{lng,lat}}]`. `EXPLAIN` must hit `SPATIAL`.

---

## 4. AU INVEST — `GET opportunities | POST escrow/pledge` F-06

### 4.1 `GET /invest/opportunities?status=funded&min_target_minor=&page=`

**OpportunitiesRequest:** `status in draft,funding,funded,escrow_locked nullable, min_target nullable int`

Query `investment_deals tenant AU INVEST + with funding_rounds escrow_contracts investorLedgers (eager ≤5) + where status in funding|funded + replica + Cache tags 60s`. Returns `fractional_shares style` + `to SPV` + `ROI simulator not computed here`.

### 4.2 `POST /invest/escrow/pledge` — Lock investor funds into funding round F-06

**PledgeRequest:** `opportunity_id (investment_deals id) required|exists, round_id required|exists:funding_rounds where deal_id=opportunity_id, amount_minor int 1..9e18, currency EGP in, reference_uuid uuid`

Action `PledgeEscrowAction` ≤120L:
`DB::transaction lockForUpdate wallet + funding_round→ validate deal canTransition(draft→funding) via trigger else 409 → validate round status open → investor wallet EscrowLockService debit amount_minor → INSERT investor_ledgers(deal_id,investor_id,amount_minor,currency,prev_hash/hash_current chain REVOKE WORM) → update funding_rounds raised_minor+=amount → if raised>=target → deal status→funded→escrow_locked + escrow_contracts INSERT → funding_round status closed → escrow_events insert + Idempotency inside tx`. Header `Idempotency-Replayed`.

---

## 5. AU MED — Privacy-First `GET providers | POST appointments | POST telemetry/audit` F-07

### 5.1 `GET /med/providers?specialty=&near_lat=&near_lng=&radius_m=`

Pgsql `amed_medical_providers $connection=pgsql + USING GIST(clinic_location)`. Handler `MedProvider::$query()->where('app_id','AU MED')->when(near)->whereRaw('ST_DWithin(clinic_location, ST_SetSRID(ST_MakePoint(?,?),4326)::geography, ?)', [lng,lat,radius]) → paginate`.
Cache `med:providers:{hash} 60s tag`. Returns `is_verified + trust_score from amed_provider_trust_scores pre-aggregated + specialty`.

### 5.2 `POST /med/appointments` — Book

**BookAppointmentRequest pgsql:** `provider_id required|exists:pgsql.amed_medical_providers,id, scheduled_at required|date after:now + 30min grid, complaint_raw required string 10..2000`

Action `BookAppointmentAction` pgsql trx:
`VERIFY provider.app_id AU MED → INSERT amed_medical_appointments pgsql patient_user_id=auth, provider_id, complaint_encrypted=pgp_sym_encrypt(complaint_raw, PGCRYPTO_KEY) (via DB raw), scheduled_at, status scheduled` via `Schema::connection('pgsql')` raw `INSERT ... pgp_sym_encrypt(...)`. Decrypt on read via accessor `pgp_sym_decrypt`. No plaintext column. Daily retention not purge.

Response 201 `uuid + scheduled_at + provider Trust`.

### 5.3 `POST /med/telemetry/audit` — Zero raw F-07

**Middleware `AnonymizedTelemetryMiddleware` (existing):** if body contains keys `raw|text|chat|complaint_raw|transcript` → `422 Unprocessable, code: RAW_TELEMETRY_BLOCKED + leaks[]` (before DB). Else compute.

**TelemetryRequest:** `appointment_id required|exists:pgsql.amed_medical_appointments,id, nlp_canonical_json required|array (redacted tokens), payload_version int optional`

Action `RecordTelemetryAction` `avail pgsql`:
`canonical = json_encode SORT_KEYS ksort nlp_canonical_json → nlp_hash = hash_hmac('sha256', canonical, TELEMETRY_HMAC_KEY) → payload_hash = hash('sha256', canonical) → prev_hash = SELECT hash_current ORDER BY id DESC limit1 FOR UPDATE → hash_current = hash('sha256', prev.payload_hash) → INSERT amed_consultation_telemetry pgsql (appointment_id, nlp_hash, payload_hash, prev_hash, hash_current) REVOKE UPDATE/DELETE WORM partitioned monthly → async 90d retention job`. Zero `complaint_raw` column exists; audit verifies `SELECT complaint_encrypted` is encrypted.

Response 201 `{appointment_id, nlp_hash, payload_hash, hash_current, meta:{trace_id}}`.

---

## 6. ADDITIVE MIGRATION — NONE (reuse 000022-024) + Optional 000026 Guard

No new CREATE. If index missing `php artisan migrate` 000026 additive `hasIndex`:
`deal_categories idx_cat_app`, `spx_deals_geo SPATIAL`, `idx_invest_deal+status`, `spx_amed_prov_loc GIST`, `investor_ledgers idx_il_investor`, `service_providers spx_provider_location`.

---

## 7. SPRINTS (≤150L / 1-3 files) — Arena Limits R4

**B.7.1** — `Domain/AUDeals/Actions{CreateListing,PromoteStagnant}+Domain/AUServ/Actions/DispatchTicket + Domain/AUInvest/Actions/PledgeEscrow + Domain/AUMed/Actions{BookAppointment,RecordTelemetry}` ≤120L each
**B.7.2** — `Http/Requests/AUDeals{CreateListing,Search,Promote}+AUServ{CreateTicket,Nearby}+AUInvest{Pledge,Opportunities}+AUMed{Book,Telemetry}` ≤80L each F-05/12
**B.7.3** — `Http/Resources/{DealsListing,ProviderNearby,Opportunity,MedProvider,MedAppointment}` ≤60L minor formatted + meta trace
**B.7.4** — `Http/Controllers/Api/V1/Deals{Listing,Stagnant}+Serv{Ticket,ProviderNearby}+Invest{Opportunity,Pledge}+Med{Provider,Appointment,Telemetry}` thin ≤60L `Request→Action→Resource`
**B.7.5** — `routes/api/v1/{deals,serv,invest,med}.php` patched additive hierarchy F-02 + `config/deals.php` env wrapper if needed
**B.7.6** — Verification `php -l + artisan migrate + curl E2E + EXPLAIN FULLTEXT/SPATIAL + HMAC chain`

**Verification Gates (B.7 exit):**
- ✅ `php artisan migrate --force` green additive hasTable
- ✅ `GET /deals/listings?search=سيارة Arabic ngram` hits FULLTEXT `EXPLAIN` ngram + `ST_Distance_Sphere` uses SPATIAL <5ms
- ✅ `POST serv/tickets concurrent 2 same provider different ticket → 1 succeeds 1 queued NOT double assign + dispatch_logs 2`
- ✅ `POST invest/escrow/pledge amount_minor 100k + Idempotency same key replay → Idempotency-Replayed:true no second debit + investor_ledgers chain hash chain 0ms` + invalid `canTransition draft→released 45000 409`
- ✅ `med/appointments complaint_encrypted = pgp_sym_encrypt exists pgsql + pgp_sym_decrypt accessor returns plaintext via key` + `telemetry with raw field → 422 BLOCK` + `without raw → HMAC chain WORM partitioned + SELECT hash_current prev matches`
- ✅ `invalid X-App-Id →422, hibernated AU SERV →503, DRM quarantine POST →503 Retry-After, micro deals.promote without →403, sanitize 010 in listings description →422 leaks[], pagination cursor 20 no OOM, logs single-line JSON allowlist trace_id propagated`

---

## 8. CALIBRATOR GATE — 100% before any code

| Domain | Score | Gate |
|--------|-------|------|
| Memory (71pts+9M/5A/13Agents+B1a→B6) | 100% | reuse 000022-024+EscrowLockService+TenantScoped+AgentStrategyManager |
| Architecture (DDD Thin→Action→Service→Repo) | 100% | R27 ultra-thin + ≤150L + DRY |
| Security (pgsql pgcrypto+HMAC chain+WORM+__Host not reused+sanitize BLOCK) | 100% | R6+R38+Phase 3.3 |
| Precision (ngram+SRID4326+minor+trigger 45000+PARTITION) | 100% | no float, Arabic hits |
| Craftsmanship (PHP8.4 readonly DTO+strict TS zero any+Resources) | 100% | R28/YAGNI |
| Operational (stats R37 30s tags+replica heartbeat 5s+Reverb 8080) | 100% | B.10 |

> **BLOCKED if <100%** — reload `.arenarules`+B.1a→B.6.

---

## 9. ARABIC SUMMARY

تم تأمين تطبيقات 4: عروض `ngram` عربي مع فلترة مصفوفة `TenantScoped` + تذاكر `POINT 4326 SPATIAL + Mutex` + استثمار `آلة حالات 45000 + WORM سلسلة تشفير + Idempotency` + طب `pgsql جغرافيا مشفر HMAC 90d تجزئة`، مع هرمية `Trace→Tenant→DRM→Lite→Micro→Sanitize→Idempotency` وترقية خامل Agent3 CMO عبر المحول الثلاثي — معزول ومستقبلي.

---
*Target: `abduniproject` — Next: B.8 Workforce Marketplace — Arena*
