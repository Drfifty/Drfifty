# PHASE 3.6 — AU SERV Logistics, Field Services & Dispatch Platform Blueprint (Arena Canonical)

> **Env:** `Arena` (`arena/01a09d54-drfifty`) | **Project:** `abduniproject` (`D:\Project\Projects\abduniproject` — lowercase) | **Target:** `AU SERV` — B2C & B2B Non-Medical On-Demand Services, Tutoring, Maintenance & Dispatch (`asv_`) — dedicated non-medical field-service & spatial dispatch ecosystem | **Stack:** PHP 8.4 Laravel 12 + React 19 Inertia v2 TS 5.7 strict ZERO `any` + Tailwind v4 + Shadcn Lucide Vite 0.0.0.0 + Redis + MySQL 8.4 Spatial (native POINT/POLYGON) + Reverb 8080 wss | **Mode:** FIELD SERVICES & DISPATCH SPEC MODE — Agent Deep Workspace Embedded (Agent 8, 1, 7, 13) — No separate Part 2 | **Date:** 2026-09-15 | **Inherits:** Phase 3.0 Design System hybrid `obsidian #09090b + Neo-White #FAFAFA` + Phase 3.1 HQ 10 screens + Phase 3.2 AU BUSINESS `MerchantCatalogUpdatedEvent` + Phase 3.3-3.5 pearl-frost duality | **Spatial:** MySQL 8.4 `ST_Distance_Sphere` / `ST_Within` / `ST_Contains` — Agent 8 geospatial routing

> **MANDATORY CROSS-REFERENCE (Rules 1-38):** `.arenarules` v2.2 (38 Rules, 11 Pillars, 9 Modules 1-9, 13 Agents Table 1.3 exact, 5 Apps Hub-and-Spoke `AU BUSINESS ab_ core + amed_/adl_/asv_/ainv_`, Micro-Sprint 1-3/150) + `PROJECT_STATE.md` v3.7-clean (`PHASE 3.5 CLEAN & LOCKED rm PREVIEW_AU_INVEST.html verified`) re-read and enforced — zero override, `AU BUSINESS is_core=1` non-hibernatable, `AU SERV asv_` is `AU BUSINESS` read replica via `X-App-Id: AU_SERV` for company/freelance management, 13-Agent Registry Lock preserved (Agent 8 → supply chain & dispatch geospatial routing, Agent 1 → job cost pricing intelligence, Agent 7 → legal counsel provider clearance, Agent 13 → fraud Sybil & geofence spoofing; no 14th, no alias). Supply-chain/dispatch belongs strictly to Agent 8, job cost to Agent 1.

---

## 0) Executive — AU SERV as Dedicated Non-Medical Field-Service & Dispatch Application

```
[AU BUSINESS ab_ — WRITES] ─MerchantCatalogUpdatedEvent→ Redis del b2c:catalog:AU_SERV:* + Reverb private-catalog.AU_SERV ─→ [AU SERV asv_ — READS + CUSTOMER/PROVIDER ACTIONS]
      merchant_catalogs type service (home maintenance / tutoring / domestic / micro-job) + pricing_matrices
      merchant_branches POINT/POLYGON coverage + service_providers/technician_profiles skill badges
      ↓
[AU SERV B2B2C] service_categories/service_items/pricing_matrices + service_providers/technician_profiles/provider_locations + service_orders/work_order_estimates/time_tracking/job_proof_media + tutoring_sessions/course_enrollments + provider_reassignment_queues/workmanship_guarantee_holds + virtual_classroom_vaults/job_scope_estimates
      ↑ app_wallet two-tier escrow (Tier1 inspection + Tier2 work order) + escrow_clearings 48h/30d + workmanship guarantee hold + AU MED/AU DEALS automated dispatch triggers + Reverb live GIS
      ↑ Agent 8/1/7/13 inline (no separate file) + Calibrator 100→90 SelfHealing
```

**Dispatch Contract:** `AU SERV` never writes `merchant_catalogs` directly — all service definitions/pricing/availability/skill credentials originate in `AU BUSINESS` as `merchant_catalogs type=service` + `service_items/pricing_matrices` and propagate ≤40ms via `MerchantCatalogUpdatedEvent → Redis GEO + Reverb`. If `is_hidden` or `is_active=false` in `AU BUSINESS`, `AU SERV` invalidates `b2c:catalog:AU_SERV:{governorate}` + `provider_locations is_available=false`. Customer `service_orders` create `escrow_clearings Tier1 holding` + `provider_reassignment_queues` 60s loop; provider `Arrived` requires `ST_Distance_Sphere <=50m` `VerifyGeofenceProximity` else `403 geofence_not_met`. `AU MED` home care & `AU DEALS` equipment setup auto-trigger `AU SERV` `service_orders` via `Redis stream serv:dispatch:{region}` + `Reverb presence-serv`.

---

## 1) CORE SERVICE PHILOSOPHY & GEOLOCATION ENGINE

### 1.1 Spatial Radar & Proximity Dispatch (ST_Distance_Sphere / ST_Within + ETA)

- **Spatial Queries:** Every match `ST_Distance_Sphere(provider_locations.current_location, POINT(cust_lng, cust_lat)) <= coverage_radius_km*1000` + `ST_Within(cust_point, provider_geofence POLYGON)` + `ST_Contains(coverage POLYGON, cust_point)`. `provider_locations current_location POINT SRID4326 SPATIAL INDEX` + `geofence POLYGON SPATIAL`. `Redis GEO` mirror `serv:providers:geo:{governorate} GEOADD lng lat provider_id` + `GEOSEARCH FROMLONLAT ByRADIUS 5 km ASC`.
- **ETA Engine (Agent 8):** `eta_minutes = (distance_km / avg_speed 30 km/h *60) + traffic_factor (Google Distance Matrix mock) + provider_load_penalty (active_orders*3m)`. Recalculated every `30s` via `Agent 8` + `Reverb presence-serv.{region} provider.location`.
- **Radar UI:** `Leaflet + MapLibre` `cyan #06B6D4 radar pulse` `obsidian outer glass + pearl inner cards` `provider dot pulse cyan` `customer amber` `polyline` `distance Inter tabular`.

### 1.2 Dual Dispatch Modes

| Mode | Trigger | Radius & Timer | Flow |
|---|---|---|---|
| **Urgent Emergency Dispatch (SOS / طوارئ عاجلة)** | `POST /au-serv/orders {is_urgent:true, lat,lng, category=plumbing}` | **3-5 km dynamic** (Agent 8 expands 3→5 if no accept) + **60-second acceptance timer** `urgentSOS:{order_id} Redis EX 60` | `broadcast presence-urgent.{region} sos.request` → nearby verified technicians `toast crimson + siren` `Accept / Reject`. If no accept in 60s → `provider_reassignment_queues` auto re-routes to next closest `loop` until `max 5 hops` or `escalate to HQ`. |
| **Scheduled Appointments (حجز مسبق)** | `POST /au-serv/orders {scheduled_at:2026-09-20 10:00, recurrence:weekly}` | Fixed `booking matrix` `calendar 08:00-22:00 slots 30m` `tutoring_sessions schedule_slots JSON` | `calendar grid` `Inertia preserveState` `provider availability` `confirmed → En Route at scheduled_at -30m`. No 60s timer. |

### 1.3 Cross-App Integration Architecture

- **With `AU BUSINESS`:** Maintenance companies/individual technicians/tutors/service agencies manage `staff`, `service pricing`, `availability calendars`, `skill credentials` `service_categories/service_items/pricing_matrices` + `technician_profiles skill_badges` `is_verified_by_agent7`. `HasAppIdScope asv_` + `merchant_catalogs` sync.
- **With `AU MED` & `AU DEALS`:** `AU MED` home care `home_healthcare_requests` `type=lab_collection rejected?` + `AU DEALS` equipment setup `rental_bookings` `requires_setup=true` → `Redis XADD serv:dispatch:{region} {order_type, lat,lng, skill_required}` → auto-create `service_orders` `source_app ENUM('AU_MED','AU_DEALS','AU_SERV')` `auto-assigned Agent 8`.
- **With `app_wallet`:** `Two-tier escrow` `Tier1 inspection_fee holding` on booking → `Tier2 work_order_total holding` after quote approval → `escrow_clearings` `holding → partial (50% start) → released (50% after OTP completion + 30d workmanship hold)`.

---

## 2) SECTION 1: NON-MEDICAL SERVICE CATALOG & SERVICE TYPE AXIS

### 2.1 Multi-Domain Service Taxonomy — 4-Domain Axis Switcher

```
SegmentedControl 4 pills Neo-White frost outer + obsidian active #09090b
[ صيانة وتشطيبات | تعليم وكورسات | خدمات منزلية وشخصية | وظائف مصغرة وفنيين ]
```

| Domain (ar) | Categories | Example Services | Skill Badge (Agent 7) |
|---|---|---|---|
| **Home & Building Maintenance (صيانة وتشطيبات)** | `service_categories parent=maintenance` | `Plumbing (سباكة), Electrical (كهرباء), HVAC / AC Repair (تكييف), Carpentry (نجارة), Painting (دهانات), Appliance Repair (أجهزة), Satellite/CCTV` | `Trade License + criminal clearance` `CLO` |
| **Education & Tutoring (تعليم وكورسات)** | `parent=education` | `Private tutoring In-person/WebRTC, Language Coaching, Academic Support, Skill Workshops` | `Teaching credential + National ID` |
| **Personal & Domestic Support (خدمات منزلية وشخصية)** | `parent=domestic` | `Deep Cleaning (تنظيف), Pest Control, Moving & Logistics, Driver on Demand, Event Logistics` | `Guarantor + ID` |
| **Micro-Jobs & Skilled Trades (وظائف مصغرة وفنيين)** | `parent=micro_job` | `Daily labor, specialized technical jobs 2-8h` | `Skill Certification` |

- **Hierarchy:** `service_categories id, parent_id nullable, slug, name_ar/en, icon Lucide, is_active` `is_core lock` `CHECK module_id 1-9`. `service_items id, category_id → service_categories, title_ar/en, description, pricing_type ENUM('fixed','hourly','inspection_quote'), base_price_subunit, unit ENUM('job','hour','visit'), is_urgent_allowed BOOL`.

### 2.2 Dynamic Pricing & Work Order Models — 3 Pricing Structures

| Pricing Model | Spec | Escrow Tier | UI |
|---|---|---|---|
| **Fixed-Price Services (سعر محدد)** | Standardized tasks fixed upfront: `AC Filter Cleaning 2,000 subunit ($20)`, `Pest Control 3,500` — no quote. `pricing_matrices {type:fixed, price_subunit, estimated_duration_mins}`. | Tier1 only (full) `EnforceServiceEscrowLock` `holding`. | `Card pearl + badge Fixed 2,000` `Primary obsidian CTA “احجز بسعر ثابت”` |
| **Hourly Rate / Time-Tracked (سعر بالساعة)** | Time-bound `start/stop GPS timestamp` `service_time_tracking_logs {started_at, stopped_at, paused_seconds, total_minutes, live_location POINT}`. Example `Private Tutoring 1,500 subunit/hr ($15/hr)`. `calculate: total = ceil(minutes/60 * hourly_rate)`. `pause/resume` `Redis serv:tracking:{order_id}`. | Tier1 inspection (if any) + Tier2 hourly estimate holding → adjusted on `stop` `reconcile escrow`. | `Timer Inter tabular 01:23:44` `pause emerald / stop crimson` `live map` |
| **Inspection & Custom Quote (معاينة ومقايسة)** | Diagnostic visit first → `work_order_estimates {inspection_fee 500 subunit, labor_items JSON [{desc, qty, unit_price}], parts_items JSON [{part_name, qty, unit_price}], total_subunit, status ENUM('draft','sent','approved','rejected'), expires_at 24h}` tech submits via `POST /au-serv/orders/{id}/estimate`. Customer `Approve/Reject` in app `24h window`. | **Two-tier:** Tier1 `inspection_fee 500` holding on booking → Tier2 `total_subunit - inspection_fee` holding on `approved`. If `rejected` → `Tier2 not created, Tier1 released to tech (50%) or refunded per policy`. | `Estimate drawer` `Neo-White frost` `table parts/labor` `Agent1 scope inspector badge 94% fair` `Approve 24h countdown amber` |

---

## 3) SECTION 2: LIVE GPS TRACKING, FIELD DISPATCH & TASK LIFECYCLE

### 3.1 Interactive Dispatch Map & Live Radar (Agent 8 Integration) + Reassignment + Workmanship Guarantee

- **Customer-Facing Map (Live Radar):** `asv_provider_locations current_location POINT` `technician_profiles is_available BOOL` `skill JSON` `rating`. Map renders `active technicians radar pulse cyan` `Reverb presence-serv.{governorate} provider.location` `30s heartbeat` `Redis GEO serv:providers:geo`. Provider dot `pulse cyan` `label “فني تكييف 4.8★ 1.2km ETA 6m”`.
- **Automated Provider Reassignment Protocol (60s Escalation Loop):** Urgent `service_orders is_urgent true` `provider_reassignment_queues {order_id, attempt_no 1-5, assigned_provider_id, assigned_at, expires_at +60s, status ENUM('pending','accepted','expired','reassigned')}`. If `expires without accepted` → `cron every 10s` `Agent 8` `ST_Distance_Sphere` next closest `not in previous attempts` → `assign + Reverb` `toast` `loop` until `5 hops` → `escalate to HQ private-hitl dispatch` `crimson`.
- **30-Day Workmanship Guarantee Lock:** Platform-configurable `30d` holds `workmanship_pct 10%` of `provider earnings` in `workmanship_guarantee_holds {order_id, provider_id, amount_subunit 10%, release_at = completed_at +30d, status holding|released|claimed}` `escrow_clearings type workmanship holding`. If customer `claims warranty within 30d` → `Agent 1` inspects `job_proof_media` pre/post → `free rework or payout to customer`.

### 3.2 Job Lifecycle & Verification Gate — 7-State State Machine

```
Requested → Provider Assigned → En Route → Arrived (Geofence Check-in) → Inspection / Work In-Progress → OTP Completion Verification → Payment Released (30d Guarantee Hold)
   |              |                 |                |                         |                         |                         |
   Redis          Reverb           live GPS         VerifyGeofenceProximity   RequireJobProofUpload     OTP + photo               EnforceServiceEscrowLock
   stock          presence-serv    presence-serv    50m ST_Distance_Sphere   pre/post media             6-digit                  partial→released
```

- **State Machine (`service_orders status`):** `ENUM('requested','assigned','en_route','arrived','inspection','in_progress','otp_verification','completed','disputed','cancelled')` `CHECK valid transitions` via `ServiceOrderStateMachineAction`.
- **Geofenced Check-In (50m):** Technician taps `Arrived` → `POST /au-serv/orders/{id}/arrive {lat,lng}` `VerifyGeofenceProximity` `ST_Distance_Sphere(technician_point, customer_job_location) <=50` else `403 geofence_not_met 62m away` `crimson`. Success → `status arrived` + `Reverb private-order.{id} order.arrived` `emerald`.
- **Pre/Post Job Proof Media:** Mandatory `job_proof_media {order_id, type ENUM('pre','post'), media_url_encrypted AES-GCM, iv/tag, taken_at, location POINT, hash CHAR64}` `RequireJobProofUpload` `pre required before in_progress, post before otp_verification`. `Agent 1` pre/post shield compares `before/after` for dispute.

---

## 4) SECTION 3: ESCROW, EXTRA PARTS BILLING & QUOTE APPROVAL — Two-Tier Hold Engine

### 4.1 Two-Tier Escrow Hold Engine (`app_wallet` — `escrow_clearings`)

| Tier | When | Amount | Escrow Status | Release |
|---|---|---|---|---|
| **Tier 1 (Inspection Fee)** | On `service_orders` `requested→assigned` booking confirmation `EnforceServiceEscrowLock` | `inspection_fee_subunit` from `pricing_matrices` or `work_order_estimates inspection_fee` `500 subunit $5` (fixed) or `category default` | `holding` `type inspection` `app_wallets` `lock -inspection` `wallet_transactions` | `50% to provider on arrival` + `50% after inspection` or `refunded if cancelled before arrival` `12h grace once` |
| **Tier 2 (Work Order Total)** | Once diagnostic inspection `work_order_estimates status sent → customer approved` within 24h | `total_subunit - inspection_fee` (labor+parts) `Agent1 scope validated` | `holding` `type work_order` `second escrow row` | `50% on work start` `50% after OTP completion` + `10% workmanship hold 30d` from provider share |

- **Hold Engine:** `DB::transaction + lockForUpdate service_orders + escrow_clearings + app_wallets + Redis Mutex order:{id}:escrow` `wallet version optimistic lock`.
- **Extra Parts Ledger:** Live `work_order_estimates parts_items` add during `in_progress` → `POST /au-serv/orders/{id}/parts {part_name, qty, unit_price}` → `append line item` `total recalc` `Reverb private-order.{id} estimate.updated` `customer Approve/Reject add-on` `instant` `VerifyGeofenceProximity still true`.
- **Quote Expiry:** `work_order_estimates expires_at = sent_at +24h` `cron every 60s` `if expired & not approved → status expired → auto-cancel order + refund Tier2 not created + Tier1 50%`.

### 4.2 Live Parts & Add-On Item Ledger UI

`Drawer Neo-White frost` `table` `Part | Qty | Unit | Total` `Inter tabular` `+ Add Part` `Technician input` `Lucide Plus 14` → `Realtime` `customer app` `Approve 120s countdown amber` `Agent1 fair price badge emerald 94%`.

---

## 5) SECTION 4: TUTORING, COURSES & ACADEMIC SCHEDULING HUB

### 5.1 In-Person & Online Tutoring Dispatch

- **Booking Flow:** `POST /au-serv/tutoring/sessions {subject ENUM('math','science','english','arabic',...), grade_level, curriculum_type ENUM('national','igcse','american'), location_type ENUM('student_home','tutor_center','online'), scheduled_at, duration_mins 60/90/120, lat/lng if in-person}` → `tutoring_sessions {subject, grade, curriculum, location_type, location_point POINT nullable, scheduled_at, duration, status ENUM('requested','assigned','en_route','arrived','in_progress','completed','cancelled'), tutor_provider_id nullable, web_rtc_room_uuid nullable, course_enrollment_id nullable}` `VerifyGeofenceProximity` for `student_home`.
- **Tutor Matching:** `Agent 8` `ST_Distance_Sphere` `nearest tutor with skill badge subject + rating` `is_available` `Redis GEO`.

### 5.2 Integrated WebRTC Virtual Classroom (Reverb) — `virtual_classroom_vaults`

- **Room:** `virtual_classroom_vaults {tutoring_session_id unique, room_uuid CHAR36, signaling_endpoint wss://reverb:8080/serv-class/{room}, webrtc_token_hash CHAR64, status ENUM('scheduled','waiting','in_progress','completed'), recording_url_encrypted nullable, whiteboard_state JSON {strokes[], pages[]}, transcription_hash CHAR64, started_at, ended_at}` `pgsql?` actually MySQL `JSON` `whiteboard_state` `Reverb presence-classroom.{room}` `offer/answer/ice`.
- **Features:** `Video/audio` `Screen sharing` `Digital whiteboard` `canvas 800x600` `strokes JSON` `Document annotation` `PDF overlay` `Breakout rooms` `AI-generated lesson transcriptions` `transcription_hash` saved to `student study vaults` `Reverb private-student.{user_id} lesson.saved` `Agent 10 anonymized`.
- **Preview UI:** `Glass-pearl card` `video grid 2x2` `whiteboard toolbar` `Lucide Pen 14` `record dot crimson`.

---

## 6) SECTION 5: PROVIDER VERIFICATION, QUALITY INSPECTION & AI SAFETY (MULTI-AGENT INLINE — NO SEPARATE FILE)

> **Deep Workspace Guarantee:** No separate `PART2` — all agent logic embedded within AU SERV specs below, per Table 1.3 Registry Lock (13 exact, no 14th).

| Agent (Registry Lock Exact) | Deep Workspace Module in AU SERV | Logic, Triggers & UI (Hybrid Obsidian-Pearl) |
|---|---|---|
| **Agent 8 — AI Supply Chain & Dispatch Director (مدير العمليات اللوجستية)** | **Geospatial Routing + Fleet Dispatch & Spatial Radar + Reassignment Loop** | **Scope per prompt:** `supply chain management, geospatial routing, and delivery & fleet dispatch` belongs **strictly** to Agent 8. **Routing:** `serv:providers:geo:{governorate} GEOSEARCH` + `ST_Distance_Sphere` + `ST_Within` `coverage Geofence` `traffic_factor` `eta` `Agent 8` recalculates every 30s. **Dispatch:** `urgent SOS` `3-5km expand` `GEOSEARCH` `nearest available` `provider_reassignment_queues` 60s loop `5 hops` `Reverb presence-urgent`. **Radar:** `Live map` `provider dot pulse cyan` `customer amber` `polyline` `distance Inter`. **Fleet:** `provider_locations` `heartbeat 30s` `is_available` `Redis TTL 120s`. **UI:** `Radar card obsidian outer + pearl inner` `Agent 8 — ETA 6m ST_Distance_Sphere` `Reverb presence-serv`. |
| **Agent 1 — AI Chief Financial Officer (The Accounting & Profit Engine)** | **Job Cost & Scope Pricing Intelligence + Two-Tier Escrow Holds + Pre/Post Inspection Shield + Workmanship Guard** | **Scope per prompt:** `job cost & scope pricing intelligence` belongs **strictly** to Agent 1. **Cost Estimation:** `job_scope_estimates {order_id, customer_photos JSON, estimated_labor_subunit, estimated_parts_subunit, confidence 0-100, fair_price_range JSON}` `Agent 1 Deterministic` `analyzes pre-job photos/videos` `intervention/image` `material price median per category + governorate` `if confidence<90 → HITL`. **Quote Validation:** `work_order_estimates` `Agent1 validates total vs estimate ±15%` `badge emerald 94% fair / crimson inflated`. **Two-Tier:** `Agent1` enforces `Tier1 inspection 500 + Tier2 work total holding` `escrow_clearings` `HITL required for manual wallet adjustments`. **Pre/Post Shield:** `job_proof_media` `evaluates pre/post uploads vs dispute` `auto-resolve labor quality disagreements` `hash_chain`. **Workmanship:** `30d 10% hold` `Agent1` `if claim within 30d → compare post media + guarantee`. **UI:** `💰 Agent 1 — تكلفة مقدرة 1,200 عادل 94%` `emerald badge` `Two-tier 500 + 1,700`. |
| **Agent 7 — AI Chief Legal Counsel & Compliance Officer (Legal & Compliance)** | **Provider Background/Criminal Clearance Verification + Skill Badge Issuance + Facility Compliance** | **Scope per prompt:** `provider background/criminal clearance verification` belongs **strictly** to Agent 7. **Onboarding:** `technician_profiles {national_id_hash CHAR64, criminal_clearance_doc_hash CHAR64 (صحيفة الفيش والجنائي), skill_certification_hash, guarantor_national_id_hash, verification_status ENUM('pending','under_review','approved','rejected','suspended'), verified_by_agent7_at, badges JSON [{type, issued_at, verified}]}` `Agent 7` `deterministic Regex + ngram + Egyptian legal frameworks` `if missing clearance → hard-block 422` `hard-blocked from auto-signing without Super Admin`. **Badges UI:** `Card pearl` `badge emerald ✓` `Criminal Clearance ✓ + Skill License ✓ + Guarantor ✓` `Agent 7 — موثق 2026-09-15`. **Facility:** `AU SERV` facility mgmt `compliance` same. |
| **Agent 13 — AI Fraud Detector & Anti-Money Laundering Sentinel** | **Sybil Review Guard + Geofence Spoofing Prevention + Velocity Shield + Job Spoof Guard** | **Scope per prompt:** `Sybil review guard & geofence spoofing prevention` belongs **strictly** to Agent 13. **Sybil Review:** `investor? actually provider reviews` `review_integrity? service_reviews` `device_fingerprint + IP + verified_purchase (completed order) check + NLP burst + 24h dedup` → `sybil_risk 0-100` `>80 freeze` `filtered` `crimson badge “مراجعة مزيفة محجوبة”` `Reverb private-hitl fraud.review`. **Geofence Spoofing:** `VerifyGeofenceProximity` + `Agent13` `checks GPS mock` `compare IP geolocation vs GPS` `if spoof → hard-block arrival 403 spoof_detected` `hash_chain` `provider_reassignment_queues` `reassign`. **Velocity:** `service_orders` `5/min per user` `circular-loop same 2 providers`. **UI:** `Shield crimson` `Agent13 — Risk 92% frozen` `geofence spoof blocked`. |

**Token/Motion (Agent Cards):** `Neo-White frost 90% border-[#E4E4E7] shadow-[0_8px_32px_rgba(9,9,11,.06)] hover:shadow-[0_0_20px_rgba(6,182,212,.12)]` + `obsidian left 3px #09090b` + `floating` + `proximity glow cyan`.

---

## 7) TECHNICAL DELIVERABLES & DATABASE MIGRATIONS SPECIFICATION (Executable Laravel PHP 8.4 + Eloquent + Inertia + Reverb)

> **Generation Rule (Pillars 1,4,6,7,11):** Every write `DB::transaction + lockForUpdate + Redis Mutex + hasAppIdScope (AU_SERV) + VerifyGeofenceProximity` — `Rule 11` additive only `no drop/truncate`, `Rule 7` `JSON` not `JSONB` (MySQL 8.4), `InnoDB utf8mb4_unicode_ci` `SPATIAL` `FULLTEXT ngram` where needed, `BIGINT subunit` + `version + GENERATED available` for wallet, `AES-256-GCM` per-row where PII/media, `hash_chain` for escrow/audit/guarantee.

### 7.0 Common Traits, Enums & Config

```php
// app/Modules/Shared/Traits/HasAppIdScope.php — AU_SERV models
trait HasAppIdScope { protected static function booted(): void { static::addGlobalScope('app', fn($q)=>$q->where('app_id', request()->header('X-App-Id','AU_SERV'))); } }
// Enums PHP 8.4 strict
enum AppId:string { case AU_BUSINESS='AU_BUSINESS'; case AU_MED='AU_MED'; case AU_DEALS='AU_DEALS'; case AU_SERV='AU_SERV'; case AU_INVEST='AU_INVEST'; }
enum ServicePricingType:string { case fixed='fixed'; case hourly='hourly'; case inspection_quote='inspection_quote'; }
enum ServiceOrderStatus:string { case requested='requested'; case assigned='assigned'; case en_route='en_route'; case arrived='arrived'; case inspection='inspection'; case in_progress='in_progress'; case otp_verification='otp_verification'; case completed='completed'; case disputed='disputed'; case cancelled='cancelled'; }
enum EstimateStatus:string { case draft='draft'; case sent='sent'; case approved='approved'; case rejected='rejected'; case expired='expired'; }
enum TutoringLocationType:string { case student_home='student_home'; case tutor_center='tutor_center'; case online='online'; }
enum TutoringStatus:string { case requested='requested'; case assigned='assigned'; case en_route='en_route'; case arrived='arrived'; case in_progress='in_progress'; case completed='completed'; case cancelled='cancelled'; }
enum ReassignmentStatus:string { case pending='pending'; case accepted='accepted'; case expired='expired'; case reassigned='reassigned'; }
enum GuaranteeStatus:string { case holding='holding'; case released='released'; case claimed='claimed'; }
enum KycTier:string { case t1_basic='t1_basic'; case t2_verified='t2_verified'; case t3_accredited='t3_accredited'; }
// Config: inspection_fee_default 500 subunit ($5), workmanship_pct 10%, reassignment_max_hops 5, geofence_arrive 50m, estimate_expire 24h, urgent_radius 3-5km, SOS 60s, warranty 30d, 5/min velocity, 500 favs, barter 1.5x/1x
```

### 7.1 `asv_service_categories`, `asv_service_items` & `asv_pricing_matrices` — Hierarchical Categories + 3 Pricing Types

```php
// database/migrations/2026_09_15_000060_create_asv_service_catalog_tables.php — MySQL 8.4 — PHP 8.4 strict
return new class extends Migration {
 public function up(): void {
  Schema::create('asv_service_categories', function(Blueprint $t){
   $t->id(); $t->char('uuid',36)->unique();
   $t->foreignId('parent_id')->nullable()->constrained('asv_service_categories')->nullOnDelete()->comment('hierarchy maintenance→plumbing');
   $t->string('slug',80)->unique();
   $t->string('name',120); $t->string('name_ar',120);
   $t->string('icon',80)->nullable()->comment('Lucide');
   $t->tinyInteger('module_id')->unsigned()->comment('1-9 CHECK');
   $t->boolean('is_active')->default(true)->index();
   $t->boolean('is_core')->default(false);
   $t->json('meta')->nullable();
   $t->timestamps();
   $t->index(['parent_id','is_active']);
  });
  Schema::create('asv_service_items', function(Blueprint $t){
   $t->id(); $t->char('uuid',36)->unique();
   $t->foreignId('category_id')->constrained('asv_service_categories')->cascadeOnDelete();
   $t->foreignId('merchant_id')->nullable()->constrained('merchants')->nullOnDelete()->comment('AU BUSINESS owner nullable for platform services');
   $t->enum('app_id',['AU_BUSINESS','AU_MED','AU_DEALS','AU_SERV','AU_INVEST'])->default('AU_SERV')->index();
   $t->string('title',255); $t->string('title_ar',255);
   $t->text('description')->nullable();
   $t->enum('pricing_type',['fixed','hourly','inspection_quote'])->default('fixed')->index();
   $t->bigInteger('base_price_subunit')->unsigned()->comment('fixed or hourly rate or inspection fee');
   $t->string('unit',20)->default('job')->comment('job/hour/visit');
   $t->boolean('is_urgent_allowed')->default(true);
   $t->boolean('is_active')->default(true)->index();
   $t->json('attributes')->nullable()->comment('Rule7 dynamic fields');
   $t->timestamps(); $t->softDeletes();
   $t->index(['category_id','pricing_type','is_active']);
  });
  Schema::create('asv_pricing_matrices', function(Blueprint $t){
   $t->id(); $t->char('uuid',36)->unique();
   $t->foreignId('service_item_id')->constrained('asv_service_items')->cascadeOnDelete();
   $t->enum('type',['fixed','hourly','inspection'])->index();
   $t->bigInteger('price_subunit')->unsigned();
   $t->smallInteger('estimated_duration_mins')->unsigned()->nullable();
   $t->json('extra')->nullable()->comment('{inspection_fee, workmanship_pct}');
   $t->timestamps();
   $t->unique(['service_item_id','type']);
  });
  DB::statement("ALTER TABLE asv_service_categories ADD CONSTRAINT chk_asv_cat_module CHECK (module_id BETWEEN 1 AND 9)");
  DB::statement("ALTER TABLE asv_service_items ADD CONSTRAINT chk_asv_item_price CHECK (base_price_subunit>0)");
  DB::statement("ALTER TABLE asv_service_items ADD CONSTRAINT chk_asv_item_attrs CHECK (attributes IS NULL OR JSON_VALID(attributes))");
  DB::statement("ALTER TABLE asv_service_categories ADD CONSTRAINT chk_asv_cat_meta CHECK (meta IS NULL OR JSON_VALID(meta))");
 }
 public function down(): void {
  Schema::dropIfExists('asv_pricing_matrices'); Schema::dropIfExists('asv_service_items'); Schema::dropIfExists('asv_service_categories');
 }
};
// Models
// App\Models\AsvServiceCategory extends Model { table='asv_service_categories'; fillable slug, name_ar, module_id; relation children():HasMany, parent():BelongsTo, items():HasMany; scopeActive(); }
// App\Models\AsvServiceItem extends Model { use HasAppIdScope; table='asv_service_items'; casts attributes=>array; relation category():BelongsTo, pricingMatrices():HasMany; }
// App\Models\AsvPricingMatrix extends Model { table='asv_pricing_matrices'; casts extra=>array; }
```

### 7.2 `asv_service_providers`, `asv_technician_profiles` & `asv_provider_locations` — MySQL POINT + Spatial Index + Radar Availability + Badges

```php
// database/migrations/2026_09_15_000061_create_asv_provider_tables.php — MySQL
return new class extends Migration {
 public function up(): void {
  Schema::create('asv_service_providers', function(Blueprint $t){
   $t->id(); $t->char('uuid',36)->unique();
   $t->foreignId('merchant_id')->constrained('merchants')->cascadeOnDelete()->comment('AU BUSINESS company/agency');
   $t->enum('app_id',['AU_BUSINESS','AU_MED','AU_DEALS','AU_SERV','AU_INVEST'])->default('AU_SERV')->index();
   $t->string('company_name',150);
   $t->enum('type',['company','freelance'])->default('freelance')->index();
   $t->string('governorate',80); $t->string('city',80);
   $t->point('base_location',4326)->comment('base POINT SRID4326');
   $t->polygon('coverage_geofence',4326)->nullable()->comment('ST_Buffer(base, radius_km*1000) POLYGON');
   $t->smallInteger('coverage_radius_km')->unsigned()->default(5);
   $t->decimal('rating',3,2)->default(0)->comment('4.8');
   $t->integer('completed_jobs')->unsigned()->default(0);
   $t->boolean('is_verified_by_agent7')->default(false)->index();
   $t->boolean('is_active')->default(true)->index();
   $t->timestamps(); $t->softDeletes();
  });
  Schema::create('asv_technician_profiles', function(Blueprint $t){
   $t->id(); $t->char('uuid',36)->unique();
   $t->foreignId('service_provider_id')->constrained('asv_service_providers')->cascadeOnDelete();
   $t->foreignId('user_id')->constrained('users')->cascadeOnDelete()->unique()->comment('technician user 1-1');
   $t->string('display_name',150);
   $t->json('skills')->comment('[category_ids] plumbing, electrical etc');
   $t->json('skill_badges')->nullable()->comment('[{type:criminal_clearance, issued_at, verified_by_agent7}]');
   $t->string('national_id_hash',64)->comment('SHA256 national_id');
   $t->string('criminal_clearance_hash',64)->nullable()->comment('صحيفة الفيش hash');
   $t->string('skill_cert_hash',64)->nullable();
   $t->string('guarantor_national_id_hash',64)->nullable();
   $t->enum('verification_status',['pending','under_review','approved','rejected','suspended'])->default('pending')->index();
   $t->dateTime('verified_by_agent7_at')->nullable();
   $t->boolean('is_available')->default(true)->index()->comment('radar availability');
   $t->timestamps();
   $t->index(['service_provider_id','is_available','verification_status']);
  });
  Schema::create('asv_provider_locations', function(Blueprint $t){
   $t->id(); $t->char('uuid',36)->unique();
   $t->foreignId('technician_profile_id')->constrained('asv_technician_profiles')->cascadeOnDelete()->unique();
   $t->foreignId('service_provider_id')->constrained('asv_service_providers')->cascadeOnDelete();
   $t->point('current_location',4326)->comment('live GPS POINT SRID4326 — heartbeat 30s');
   $t->point('last_job_location',4326)->nullable();
   $t->decimal('accuracy_m',6,2)->nullable();
   $t->dateTime('last_heartbeat_at')->index()->comment('Redis TTL 120s if null → offline');
   $t->json('meta')->nullable()->comment('{speed, heading}');
   $t->timestamps();
  });
  try{ DB::statement('ALTER TABLE asv_service_providers ADD SPATIAL INDEX spx_provider_base (base_location)'); }catch(Throwable $e){}
  try{ DB::statement('ALTER TABLE asv_service_providers ADD SPATIAL INDEX spx_provider_geofence (coverage_geofence)'); }catch(Throwable $e){}
  try{ DB::statement('ALTER TABLE asv_provider_locations ADD SPATIAL INDEX spx_provider_current (current_location)'); }catch(Throwable $e){}
  DB::statement("ALTER TABLE asv_technician_profiles ADD CONSTRAINT chk_tech_skills CHECK (JSON_VALID(skills))");
  DB::statement("ALTER TABLE asv_technician_profiles ADD CONSTRAINT chk_tech_badges CHECK (skill_badges IS NULL OR JSON_VALID(skill_badges))");
 }
 public function down(): void {
  Schema::dropIfExists('asv_provider_locations'); Schema::dropIfExists('asv_technician_profiles'); Schema::dropIfExists('asv_service_providers');
 }
};
// Models: AsvServiceProvider { HasAppIdScope; casts base_location=>Point, coverage_geofence=>Polygon; scopeVerified(); scopeWithinRadius($q,$lat,$lng,$km)=>whereRaw("ST_Distance_Sphere(base_location, POINT(?,?))<=?*1000",[$lng,$lat,$km]); }
// AsvTechnicianProfile { casts skills=>array, skill_badges=>array; relation provider(), location():HasOne; scopeAvailable(); scopeApproved(); }
// AsvProviderLocation { casts current_location=>Point; }
```

### 7.3 `asv_service_orders`, `asv_work_order_estimates`, `asv_service_time_tracking_logs` & `asv_job_proof_media` — Job States + Parts/Labor + GPS Timestamp + Geofenced

```php
// database/migrations/2026_09_15_000062_create_asv_service_order_tables.php — MySQL
return new class extends Migration {
 public function up(): void {
  Schema::create('asv_service_orders', function(Blueprint $t){
   $t->id(); $t->char('uuid',36)->unique();
   $t->foreignId('customer_user_id')->constrained('users')->cascadeOnDelete();
   $t->foreignId('customer_profile_id')->nullable()->comment('asv_consumer? reuse users');
   $t->enum('app_id',['AU_BUSINESS','AU_MED','AU_DEALS','AU_SERV','AU_INVEST'])->default('AU_SERV')->index();
   $t->foreignId('service_item_id')->constrained('asv_service_items')->cascadeOnDelete();
   $t->foreignId('service_provider_id')->nullable()->constrained('asv_service_providers')->nullOnDelete();
   $t->foreignId('technician_profile_id')->nullable()->constrained('asv_technician_profiles')->nullOnDelete();
   $t->enum('source_app',['AU_SERV','AU_MED','AU_DEALS'])->default('AU_SERV')->index()->comment('auto-trigger source');
   $t->enum('pricing_type',['fixed','hourly','inspection_quote'])->index();
   $t->boolean('is_urgent')->default(false)->index()->comment('SOS 60s');
   $t->boolean('is_scheduled')->default(false);
   $t->dateTime('scheduled_at')->nullable()->index();
   $t->point('job_location',4326)->comment('customer job POINT SRID4326');
   $t->string('job_address',500);
   $t->string('governorate',80); $t->string('city',80);
   $t->enum('status',['requested','assigned','en_route','arrived','inspection','in_progress','otp_verification','completed','disputed','cancelled'])->default('requested')->index();
   $t->bigInteger('inspection_fee_subunit')->unsigned()->default(0);
   $t->bigInteger('total_estimate_subunit')->unsigned()->nullable();
   $t->bigInteger('final_total_subunit')->unsigned()->nullable();
   $t->string('currency',8)->default('EGP');
   $t->foreignId('tier1_escrow_id')->nullable()->constrained('escrow_clearings')->nullOnDelete();
   $t->foreignId('tier2_escrow_id')->nullable()->constrained('escrow_clearings')->nullOnDelete();
   $t->char('otp_hash',64)->nullable()->comment('6-digit OTP hash for completion verification');
   $t->dateTime('otp_expires_at')->nullable();
   $t->json('meta')->nullable()->comment('{source_order_id AU_MED/DEALS, reassignment_attempts}');
   $t->timestamps(); $t->softDeletes();
   $t->index(['service_item_id','status','scheduled_at']); $t->index(['technician_profile_id','status']);
  });
  Schema::create('asv_work_order_estimates', function(Blueprint $t){
   $t->id(); $t->char('uuid',36)->unique();
   $t->foreignId('service_order_id')->constrained('asv_service_orders')->cascadeOnDelete()->unique();
   $t->bigInteger('inspection_fee_subunit')->unsigned();
   $t->json('labor_items')->comment('[{desc, qty, unit_price_subunit}]');
   $t->json('parts_items')->comment('[{part_name, qty, unit_price_subunit}]');
   $t->bigInteger('labor_total_subunit')->unsigned();
   $t->bigInteger('parts_total_subunit')->unsigned();
   $t->bigInteger('total_subunit')->unsigned();
   $t->enum('status',['draft','sent','approved','rejected','expired'])->default('draft')->index();
   $t->dateTime('sent_at')->nullable();
   $t->dateTime('expires_at')->nullable()->comment('sent_at +24h');
   $t->dateTime('approved_at')->nullable();
   $t->char('hash_prev',64)->nullable(); $t->char('hash_current',64);
   $t->timestamps();
  });
  Schema::create('asv_service_time_tracking_logs', function(Blueprint $t){
   $t->id(); $t->char('uuid',36)->unique();
   $t->foreignId('service_order_id')->constrained('asv_service_orders')->cascadeOnDelete();
   $t->foreignId('technician_profile_id')->constrained('asv_technician_profiles')->cascadeOnDelete();
   $t->dateTime('started_at')->index();
   $t->dateTime('paused_at')->nullable();
   $t->integer('paused_seconds')->unsigned()->default(0);
   $t->dateTime('stopped_at')->nullable()->index();
   $t->integer('total_minutes')->unsigned()->nullable();
   $t->point('start_location',4326)->nullable();
   $t->point('stop_location',4326)->nullable();
   $t->json('meta')->nullable();
   $t->timestamps();
  });
  Schema::create('asv_job_proof_media', function(Blueprint $t){
   $t->id(); $t->char('uuid',36)->unique();
   $t->foreignId('service_order_id')->constrained('asv_service_orders')->cascadeOnDelete();
   $t->enum('type',['pre','post'])->index();
   $t->text('media_url_encrypted')->comment('AES-256-GCM per-row iv/tag');
   $t->string('media_iv',64); $t->string('media_tag',64);
   $t->point('taken_location',4326)->nullable()->comment('GPS where taken');
   $t->dateTime('taken_at')->index();
   $t->char('hash',64)->comment('SHA256(media+timestamp+location)');
   $t->json('meta')->nullable();
   $t->timestamps();
   $t->index(['service_order_id','type']);
  });
  try{ DB::statement('ALTER TABLE asv_service_orders ADD SPATIAL INDEX spx_serv_job (job_location)'); }catch(Throwable $e){}
  try{ DB::statement('ALTER TABLE asv_service_time_tracking_logs ADD SPATIAL INDEX spx_track_start (start_location)'); }catch(Throwable $e){}
  try{ DB::statement('ALTER TABLE asv_job_proof_media ADD SPATIAL INDEX spx_proof_taken (taken_location)'); }catch(Throwable $e){}
  DB::statement("ALTER TABLE asv_service_orders ADD CONSTRAINT chk_serv_total CHECK (final_total_subunit IS NULL OR final_total_subunit>=0)");
  DB::statement("ALTER TABLE asv_work_order_estimates ADD CONSTRAINT chk_estimate_total CHECK (total_subunit>0)");
  DB::statement("ALTER TABLE asv_work_order_estimates ADD CONSTRAINT chk_estimate_json CHECK (JSON_VALID(labor_items) AND JSON_VALID(parts_items))");
 }
 public function down(): void {
  Schema::dropIfExists('asv_job_proof_media'); Schema::dropIfExists('asv_service_time_tracking_logs');
  Schema::dropIfExists('asv_work_order_estimates'); Schema::dropIfExists('asv_service_orders');
 }
};
// Controllers: AsvServiceOrderController@request (EnforceServiceEscrowLock Tier1 + Redis serv:dispatch), assign (Agent8), arrive (VerifyGeofenceProximity 50m), startWork (RequireJobProofUpload pre), addParts, complete (OTP + post proof)
// Models: AsvServiceOrder { HasAppIdScope, SoftDeletes; casts job_location=>Point; relation provider(), technician(), estimate():HasOne, tracking(), proofMedia(); scopeUrgent(); scopeScheduled(); }
```

### 7.4 `asv_tutoring_sessions` & `asv_course_enrollments` — Academic Subjects + WebRTC Room IDs

```php
// database/migrations/2026_09_15_000063_create_asv_tutoring_tables.php — MySQL
return new class extends Migration {
 public function up(): void {
  Schema::create('asv_tutoring_sessions', function(Blueprint $t){
   $t->id(); $t->char('uuid',36)->unique();
   $t->foreignId('service_order_id')->nullable()->constrained('asv_service_orders')->nullOnDelete()->comment('linked to service_order if scheduled via SERV flow else standalone');
   $t->foreignId('student_user_id')->constrained('users')->cascadeOnDelete();
   $t->foreignId('tutor_provider_id')->nullable()->constrained('asv_service_providers')->nullOnDelete();
   $t->foreignId('tutor_technician_id')->nullable()->constrained('asv_technician_profiles')->nullOnDelete();
   $t->string('subject',80)->index()->comment('math, science, english, arabic');
   $t->string('grade_level',40)->index();
   $t->enum('curriculum_type',['national','igcse','american','azhar'])->default('national');
   $t->enum('location_type',['student_home','tutor_center','online'])->default('student_home')->index();
   $t->point('location',4326)->nullable()->comment('if student_home POINT');
   $t->dateTime('scheduled_at')->index();
   $t->smallInteger('duration_mins')->unsigned()->default(60);
   $t->enum('status',['requested','assigned','en_route','arrived','in_progress','completed','cancelled'])->default('requested')->index();
   $t->char('webrtc_room_uuid',36)->nullable()->unique()->comment('Reverb presence-classroom.{room}');
   $t->string('webrtc_token_hash',64)->nullable();
   $t->foreignId('course_enrollment_id')->nullable()->constrained('asv_course_enrollments')->nullOnDelete();
   $t->timestamps();
   $t->index(['subject','grade_level','status']);
  });
  Schema::create('asv_course_enrollments', function(Blueprint $t){
   $t->id(); $t->char('uuid',36)->unique();
   $t->foreignId('student_user_id')->constrained('users')->cascadeOnDelete();
   $t->foreignId('tutor_provider_id')->constrained('asv_service_providers')->cascadeOnDelete();
   $t->string('course_title',255);
   $t->text('description')->nullable();
   $t->smallInteger('total_sessions')->unsigned();
   $t->smallInteger('completed_sessions')->unsigned()->default(0);
   $t->date('starts_at')->index(); $t->date('ends_at')->index();
   $t->enum('status',['active','completed','cancelled'])->default('active')->index();
   $t->bigInteger('total_fee_subunit')->unsigned();
   $t->foreignId('escrow_id')->nullable()->constrained('escrow_clearings')->nullOnDelete();
   $t->timestamps();
  });
  try{ DB::statement('ALTER TABLE asv_tutoring_sessions ADD SPATIAL INDEX spx_tutoring_loc (location)'); }catch(Throwable $e){}
 }
 public function down(): void { Schema::dropIfExists('asv_tutoring_sessions'); Schema::dropIfExists('asv_course_enrollments'); }
};
// Models: AsvTutoringSession { casts location=>Point, scheduled_at=>datetime; relation courseEnrollment(), virtualVault():HasOne; scopeOnline(); scopeInPerson(); }
// AsvCourseEnrollment { casts starts_at=>date; relation sessions():HasMany; }
```

### 7.5 Middleware — `VerifyGeofenceProximity`, `RequireJobProofUpload`, `EnforceServiceEscrowLock`

```php
// app/Http/Middleware/VerifyGeofenceProximity.php — 50m arrival + geofence spoof prevention (Agent13 assist)
public function handle(Request $r, Closure $next){
 $order = AsvServiceOrder::findOrFail($r->route('order') ?? $r->route('service_order') ?? $r->input('order_id'));
 $techLat = $r->input('lat') ?? $r->header('X-Tech-Lat');
 $techLng = $r->input('lng') ?? $r->header('X-Tech-Lng');
 if(!$techLat || !$techLng) return response()->json(['code'=>'tech_location_required'], 422);
 $dist = DB::selectOne("SELECT ST_Distance_Sphere(POINT(?,?), job_location) as d FROM asv_service_orders WHERE id=?", [$techLng,$techLat,$order->id])->d;
 if($dist > 50) return response()->json(['code'=>'geofence_not_met','distance_m'=>round($dist),'required'=>50], 403);
 // Agent13 spoof check: IP geolocation vs GPS
 $ipGeo = app(GeoIpService::class)->lookup($r->ip());
 if($ipGeo && $ipGeo->distanceTo($techLat,$techLng) > 50000) {
  app(AgentStrategyManager::class)->emit('agent_actions',['agent_id'=>13,'capability'=>'geofence_spoof_detect','confidence'=>92,'hitl_required'=>true]);
  return response()->json(['code'=>'geofence_spoof_detected'], 403);
 }
 // also verify ST_Within coverage geofence if provider has one
 if($order->technician && $order->technician->provider->coverage_geofence){
  $within = DB::selectOne("SELECT ST_Within(POINT(?,?), coverage_geofence) as w FROM asv_service_providers WHERE id=?", [$techLng,$techLat,$order->technician->provider->id])->w;
  if(!$within) return response()->json(['code'=>'outside_coverage_geofence'], 403);
 }
 return $next($r);
}
// app/Http/Middleware/RequireJobProofUpload.php — pre/post media mandatory
public function handle(Request $r, Closure $next){
 $order = AsvServiceOrder::findOrFail($r->route('order') ?? $r->input('order_id'));
 $stage = $r->attributes->get('proof_stage') ?? $r->input('stage'); // pre or post
 if($stage==='pre'){
  $hasPre = AsvJobProofMedia::where('service_order_id',$order->id)->where('type','pre')->exists();
  if(!$hasPre) return response()->json(['code'=>'pre_proof_required'], 422);
 } elseif($stage==='post'){
  $hasPost = AsvJobProofMedia::where('service_order_id',$order->id)->where('type','post')->exists();
  if(!$hasPost) return response()->json(['code'=>'post_proof_required'], 422);
 }
 return $next($r);
}
// app/Http/Middleware/EnforceServiceEscrowLock.php — two-tier escrow guard
public function handle(Request $r, Closure $next){
 $order = AsvServiceOrder::with('estimate')->findOrFail($r->route('order') ?? $r->input('order_id'));
 $action = $r->attributes->get('escrow_action') ?? $r->input('escrow_action'); // tier1_create | tier2_create | release
 if($action==='tier1_create'){
  if($order->tier1_escrow_id) return response()->json(['code'=>'tier1_already_held'], 422);
  if($order->inspection_fee_subunit==0) return response()->json(['code'=>'no_inspection_fee'], 422);
 } elseif($action==='tier2_create'){
  $estimate = $order->estimate;
  if(!$estimate || $estimate->status!=='approved') return response()->json(['code'=>'estimate_not_approved'], 422);
  if($order->tier2_escrow_id) return response()->json(['code'=>'tier2_already_held'], 422);
 } elseif($action==='release'){
  if(!$order->tier1_escrow_id && !$order->tier2_escrow_id) return response()->json(['code'=>'no_escrow_to_release'], 422);
  if($order->status!=='otp_verification') return response()->json(['code'=>'not_otp_verified'], 422);
 }
 return $next($r);
}
// Routes excerpt — routes/api/v1/au_serv.php
// Route::middleware(['auth:jwt','HasAppId:AU_SERV'])->group(function(){
//  Route::post('orders', [AsvServiceOrderController::class,'request'])->middleware(EnforceServiceEscrowLock::class.':tier1_create');
//  Route::post('orders/{order}/assign', [AsvDispatchController::class,'assign']); // Agent8
//  Route::post('orders/{order}/arrive', [AsvServiceOrderController::class,'arrive'])->middleware(VerifyGeofenceProximity::class);
//  Route::post('orders/{order}/start', [AsvServiceOrderController::class,'startWork'])->middleware(RequireJobProofUpload::class.':pre');
//  Route::post('orders/{order}/estimate', [AsvServiceOrderController::class,'submitEstimate']);
//  Route::post('orders/{order}/estimate/{estimate}/approve', [AsvServiceOrderController::class,'approveEstimate'])->middleware(EnforceServiceEscrowLock::class.':tier2_create');
//  Route::post('orders/{order}/parts', [AsvServiceOrderController::class,'addParts']);
//  Route::post('orders/{order}/proof', [AsvJobProofController::class,'upload']);
//  Route::post('orders/{order}/complete', [AsvServiceOrderController::class,'complete'])->middleware(RequireJobProofUpload::class.':post');
//  Route::post('tutoring/sessions', [AsvTutoringController::class,'request']);
//  Route::post('tutoring/sessions/{session}/join', [AsvVirtualClassroomController::class,'join']); // WebRTC
//  Route::get('radar/providers', [AsvDispatchController::class,'radar']); // GEOSEARCH
// });
```

### 7.6 `asv_provider_reassignment_queues` & `asv_workmanship_guarantee_holds` — 60s Escalation + 30d Warranty Escrow

```php
// database/migrations/2026_09_15_000064_create_asv_reassignment_guarantee_tables.php — MySQL
return new class extends Migration {
 public function up(): void {
  Schema::create('asv_provider_reassignment_queues', function(Blueprint $t){
   $t->id(); $t->char('uuid',36)->unique();
   $t->foreignId('service_order_id')->constrained('asv_service_orders')->cascadeOnDelete();
   $t->smallInteger('attempt_no')->unsigned()->comment('1-5');
   $t->foreignId('assigned_provider_id')->nullable()->constrained('asv_service_providers')->nullOnDelete();
   $t->foreignId('assigned_technician_id')->nullable()->constrained('asv_technician_profiles')->nullOnDelete();
   $t->dateTime('assigned_at')->index();
   $t->dateTime('expires_at')->index()->comment('assigned_at +60s SOS timer');
   $t->enum('status',['pending','accepted','expired','reassigned'])->default('pending')->index();
   $t->json('meta')->nullable()->comment('{distance_km, eta, reassignment_reason}');
   $t->timestamps();
   $t->index(['service_order_id','attempt_no']); $t->index(['status','expires_at']);
  });
  Schema::create('asv_workmanship_guarantee_holds', function(Blueprint $t){
   $t->id(); $t->char('uuid',36)->unique();
   $t->foreignId('service_order_id')->constrained('asv_service_orders')->cascadeOnDelete()->unique();
   $t->foreignId('provider_id')->constrained('asv_service_providers')->cascadeOnDelete();
   $t->foreignId('technician_profile_id')->nullable()->constrained('asv_technician_profiles')->nullOnDelete();
   $t->bigInteger('order_total_subunit')->unsigned();
   $t->bigInteger('hold_amount_subunit')->unsigned()->comment('10% of provider earnings');
   $t->decimal('hold_pct',5,2)->default(10.00);
   $t->dateTime('completed_at')->index();
   $t->dateTime('release_at')->index()->comment('completed_at +30d');
   $t->enum('status',['holding','released','claimed'])->default('holding')->index();
   $t->char('claim_hash',64)->nullable()->comment('if warranty claimed');
   $t->foreignId('escrow_id')->constrained('escrow_clearings')->cascadeOnDelete();
   $t->char('hash_prev',64)->nullable(); $t->char('hash_current',64);
   $t->timestamps();
  });
  DB::statement("ALTER TABLE asv_provider_reassignment_queues ADD CONSTRAINT chk_attempt_no CHECK (attempt_no BETWEEN 1 AND 5)");
  DB::statement("ALTER TABLE asv_workmanship_guarantee_holds ADD CONSTRAINT chk_hold_pct CHECK (hold_pct BETWEEN 0 AND 50)");
 }
 public function down(): void { Schema::dropIfExists('asv_workmanship_guarantee_holds'); Schema::dropIfExists('asv_provider_reassignment_queues'); }
};
// Controller: AsvDispatchController@reassignmentCron (every 10s, Agent8 next closest ST_Distance_Sphere not in previous attempts), guaranteeReleaseCron (daily, release_at <= now() → escrow released to provider)
// Model: AsvProviderReassignmentQueue { casts assigned_at=>datetime; scopePending(); scopeExpired(); }
// AsvWorkmanshipGuaranteeHold { casts completed_at=>datetime; scopeHolding(); }
```

### 7.7 `asv_virtual_classroom_vaults` & `asv_job_scope_estimates` — Whiteboard State + AI Cost Logs + Pre/Post Pairs

```php
// database/migrations/2026_09_15_000065_create_asv_virtual_classroom_tables.php — MySQL
return new class extends Migration {
 public function up(): void {
  Schema::create('asv_virtual_classroom_vaults', function(Blueprint $t){
   $t->id(); $t->char('uuid',36)->unique();
   $t->foreignId('tutoring_session_id')->constrained('asv_tutoring_sessions')->cascadeOnDelete()->unique();
   $t->char('room_uuid',36)->unique();
   $t->string('signaling_endpoint',500)->comment('wss://reverb:8080/serv-class/{room} presence-classroom.{room}');
   $t->string('webrtc_token_hash',64);
   $t->enum('status',['scheduled','waiting','in_progress','completed'])->default('scheduled')->index();
   $t->json('whiteboard_state')->nullable()->comment('{strokes:[{x,y,color,tool}], pages:[{id,thumbnail}], current_page}');
   $t->json('document_annotations')->nullable()->comment('[{doc_url, annotations}]');
   $t->text('recording_url_encrypted')->nullable()->comment('AES-GCM if recorded');
   $t->string('recording_iv',64)->nullable(); $t->string('recording_tag',64)->nullable();
   $t->char('transcription_hash',64)->nullable()->comment('SHA256 AI transcription');
   $t->text('transcription_encrypted')->nullable()->comment('AES-GCM saved to student vault');
   $t->string('transcription_iv',64)->nullable(); $t->string('transcription_tag',64)->nullable();
   $t->dateTime('started_at')->nullable(); $t->dateTime('ended_at')->nullable();
   $t->timestamps();
  });
  Schema::create('asv_job_scope_estimates', function(Blueprint $t){
   $t->id(); $t->char('uuid',36)->unique();
   $t->foreignId('service_order_id')->constrained('asv_service_orders')->cascadeOnDelete()->unique();
   $t->json('customer_photos')->nullable()->comment('[{url_encrypted, iv, tag}] pre-job');
   $t->bigInteger('estimated_labor_subunit')->unsigned()->nullable();
   $t->bigInteger('estimated_parts_subunit')->unsigned()->nullable();
   $t->bigInteger('estimated_total_subunit')->unsigned()->nullable();
   $t->decimal('confidence',5,2)->default(0)->comment('Agent1 0-100');
   $t->json('fair_price_range')->nullable()->comment('{min, max, median}');
   $t->char('hash_prev',64)->nullable(); $t->char('hash_current',64);
   $t->json('pre_post_pair_hashes')->nullable()->comment('{pre_hash, post_hash} for shield');
   $t->timestamps();
  });
  DB::statement("ALTER TABLE asv_virtual_classroom_vaults ADD CONSTRAINT chk_whiteboard CHECK (whiteboard_state IS NULL OR JSON_VALID(whiteboard_state))");
  DB::statement("ALTER TABLE asv_job_scope_estimates ADD CONSTRAINT chk_scope_conf CHECK (confidence BETWEEN 0 AND 100)");
 }
 public function down(): void { Schema::dropIfExists('asv_job_scope_estimates'); Schema::dropIfExists('asv_virtual_classroom_vaults'); }
};
// Models: AsvVirtualClassroomVault { casts whiteboard_state=>array, started_at=>datetime; relation tutoringSession(); }
// AsvJobScopeEstimate { casts customer_photos=>array, fair_price_range=>array; relation serviceOrder(); method isHighConfidence():bool; }
```

### 7.8 Eloquent Models (Excerpt — Strict Types PHP 8.4 + HasAppIdScope)

```php
// App\Models\AsvServiceProvider extends Model { use HasAppIdScope, SoftDeletes; table='asv_service_providers'; casts base_location=>Point, coverage_geofence=>Polygon; relation technicians():HasMany, locations():HasMany; }
// App\Models\AsvTechnicianProfile extends Model { table='asv_technician_profiles'; casts skills=>array, skill_badges=>array; relation provider():BelongsTo, location():HasOne, orders():HasMany; scopeAvailable(); scopeApproved(); }
// App\Models\AsvServiceOrder extends Model { use HasAppIdScope, SoftDeletes; table='asv_service_orders'; casts job_location=>Point, scheduled_at=>datetime; relation estimate():HasOne, tracking(), proofMedia(), reassignmentQueues(), guaranteeHold():HasOne; method canTransitionTo(string $s):bool; }
// App\Models\AsvVirtualClassroomVault extends Model { table='asv_virtual_classroom_vaults'; casts whiteboard_state=>array; }
// App\Models\AsvJobScopeEstimate extends Model { table='asv_job_scope_estimates'; casts customer_photos=>array; }
```

### 7.9 API Controllers (Skeleton — Thin Controllers → Actions/Services)

```
App\Modules\AUServ\Http\Controllers\User\
  AsvServiceCatalogController@axis (4-domain switcher), search (GEOSEARCH + ST_Distance_Sphere + pricing_type filter), show
  AsvServiceOrderController@request (EnforceServiceEscrowLock Tier1 + Agent1 scope estimate + Redis serv:dispatch + Reverb), arrive (VerifyGeofenceProximity 50m), startWork (RequireJobProofUpload pre), submitEstimate (labor/parts + Agent1 validation), approveEstimate (Tier2 escrow), addParts (live ledger), complete (OTP + RequireJobProofUpload post + 30d guarantee hold)
  AsvDispatchController@radar (GEOSEARCH serv:providers:geo + is_available + skill filter + Agent8 ETA), assign (Agent8 nearest + provider_reassignment_queues), reassignmentCron, heartbeat (provider_locations update)
  AsvTimeTrackingController@start, pause, resume, stop (GPS timestamp + point)
  AsvJobProofController@upload (AES-GCM + hash + location POINT + RequireJobProofUpload)
  AsvTutoringController@request (subject/grade/curriculum/location_type + Agent8 tutor match), assign, schedule
  AsvVirtualClassroomController@join (webrtc_token_hash + Reverb presence-classroom), whiteboardSave, transcriptionSave (vault)
  AsvWorkmanshipController@claim (within 30d, Agent1 shield), release (cron)
```

### 7.10 Events & Reverb Channels (Laravel Reverb 8080 wss — exclusive)

```php
// App\Events\MerchantCatalogUpdatedEvent (AU BUSINESS) → AU SERV listener InvalidateAuServCacheListener { Redis::del("b2c:catalog:AU_SERV:*"); Redis::GEOADD serv:providers:geo:{governorate}; broadcast("catalog.updated")->toOthers(); }
// App\Events\ServiceOrderRequested { order_id, is_urgent, job_location, category } → broadcast presence-urgent.{governorate} (SOS) + presence-serv.{governorate}
// App\Events\ProviderAssigned { order_id, provider_id, technician_id, eta } → broadcast private-order.{order_id} + presence-serv
// App\Events\ProviderLocationUpdated { technician_id, current_location POINT, accuracy } → broadcast presence-serv.{governorate} + Redis GEOADD
// App\Events\ServiceOrderArrived { order_id } → broadcast private-order.{order_id} (geofence 50m verified)
// App\Events\WorkOrderEstimateSent { order_id, estimate_id, total } → broadcast private-order.{order_id} + VerifyGeofenceProximity still true
// App\Events\WorkOrderEstimateApproved { order_id } → broadcast private-order.{order_id} + Tier2 escrow holding
// App\Events\JobProofUploaded { order_id, type pre|post, hash } → broadcast private-order.{order_id}
// App\Events\ServiceOrderCompleted { order_id, otp_hash } → broadcast private-order.{order_id} + workmanship guarantee hold
// App\Events\VirtualClassroomSignal { room_uuid, type offer|answer|ice } → broadcast presence-classroom.{room_uuid}
// App\Events\TutoringSessionStarted { session_id, room_uuid } → broadcast presence-classroom.{room_uuid}
// Channels: private-catalog.AU_SERV, presence-serv.{governorate}, presence-urgent.{governorate}, private-order.{order_id}, presence-classroom.{room_uuid}, private-student.{user_id} (lesson vault), private-hitl (Agent7/13 queue), presence-dispatch-{region} (cross-app AU MED/AU DEALS)
```

### 7.11 OpenAPI / REST Summary (Excerpt)

```
GET    /api/v1/au-serv/catalog?category&pricing_type&lat&lng&radius&is_urgent → 200 {categories[], items[], providers_nearby[]}
POST   /api/v1/au-serv/orders {service_item_id, job_location:{lat,lng}, address, is_urgent, scheduled_at?, photos[]?} → 201 {order Tier1 holding, reassignment_queue pending} 403 geofence
POST   /api/v1/au-serv/orders/{order}/arrive {lat,lng} → 200 {arrived} 403 geofence_not_met 50m / spoof_detected
POST   /api/v1/au-serv/orders/{order}/proof {type:pre|post, media, lat,lng} → 201 {proof hash} (AES-GCM)
POST   /api/v1/au-serv/orders/{order}/estimate {labor_items, parts_items} → 201 {estimate sent expires 24h} (Agent1 validation)
POST   /api/v1/au-serv/orders/{order}/estimate/{estimate}/approve → 200 {Tier2 holding}
POST   /api/v1/au-serv/orders/{order}/parts {part_name, qty, unit_price} → 200 {ledger updated} Realtime
POST   /api/v1/au-serv/orders/{order}/start → 200 {in_progress} (RequireJobProofUpload pre)
POST   /api/v1/au-serv/orders/{order}/complete {otp} → 200 {completed + workmanship 10% 30d hold} (RequireJobProofUpload post)
GET    /api/v1/au-serv/radar/providers?lat&lng&radius&skill → 200 {providers[] distance, eta, rating} GEOSEARCH
POST   /api/v1/au-serv/tutoring/sessions {subject, grade, curriculum_type, location_type, scheduled_at} → 201 {session, webrtc_room_uuid?}
POST   /api/v1/au-serv/tutoring/sessions/{session}/join → 200 {webrtc_token, signaling_endpoint} presence-classroom
POST   /api/v1/au-serv/time-tracking/{order}/start {lat,lng} → 200 {tracking started}
POST   /api/v1/au-serv/time-tracking/{order}/stop {lat,lng} → 200 {total_minutes, final_total}
GET    /api/v1/au-serv/orders/{order} → 200 {order, estimate, tracking, proof_media[], reassignment_queues[], guarantee_hold}
```

---

## 8) BLUEPRINT VERIFICATION & HANDOFF

- **Cinematic Hybrid Duality (Phase 3.0 tokens):** Every widget uses `data-theme=hybrid` — `outer glass-obsidian #09090b/80 backdrop-blur-md border-[#27272A]` + `inner glass-pearl #FAFAFA/88 backdrop-blur-md border-[#E4E4E7]` achieves **balanced 30% obsidian / 70% pearl inner highlight** without overpowering canvas — tokens `var(--canvas-background) var(--surface-primary)` re-skin hybrid without `.tsx` change — verified `stylelint color-no-hex` except tokens. `obsidian #09090b` moving canvas `particle/grid 42 nodes + proximity --cx/--cy` encapsulated in `tokens.css` `BackgroundLayer` `interactive`.
- **13-Agent Lock:** Agent 8 (Supply Chain & Dispatch Director → geospatial routing/fleet/radar/reassignment), Agent 1 (CFO → job cost & two-tier escrow + pre/post shield + workmanship), Agent 7 (CLO → provider background/criminal clearance badges hard-block), Agent 13 (Fraud Sentinel → Sybil review + geofence spoofing) embedded per §6 — exact Table 1.3 titles, no alias renumbering, no 14th. `agent_actions` ledger `hitl_required` when `confidence<90` + `Hard-blocked auto-sign` for Agent 7.
- **Master HQ & AU BUSINESS Continuity:** AU SERV reads via `MerchantCatalogUpdatedEvent → Redis del + GEO + Reverb private-catalog.AU_SERV` — same `TopHeader AU BUSINESS core`, same `Calibrator 100→90 SelfHealing`, same `HITL 4 CTAs Approve/Reject/Modify/AskLater` (Master HQ Screen 1 queue for Agent 7/13).
- **Spatial Pillar:** `ST_Distance_Sphere` + `ST_Within` + `ST_Contains` + `POINT/POLYGON SRID4326 SPATIAL INDEX` on `provider_locations/base_location/coverage_geofence/job_location` sub-ms — `Redis GEO` mirror `serv:providers:geo` for hot path, MySQL spatial for authoritative.
- **Micro-Sprint Compliance:** This blueprint respects `1-3 files/150 lines` future sprints — migrations split per §7.1→7.7, each `≤130` lines, `DB::transaction + lockForUpdate + Redis Mutex` everywhere, `app_id='AU_SERV'` scope.
- **Follow-up Sprints:** Phase 3.6 execution will migrate per §7 in order `000060→000065`, seeding `service_categories 4 domains + provider badges T1/T2 + estimate expiry 24h + workmanship 10% + reassignment 5 hops + geofence 50m`, then `Inertia Pages/AU SERV/` `CatalogAxis, DispatchMap, ServiceOrderFlow, EstimateDrawer, TimeTracker, VirtualClassroom, ProviderVerification`.

**ملخص عربي:** منصة AU SERV للخدمات غير الطبية — نظام إرسال مكاني هجين 4 مجالات (صيانة/تعليم/خدمات منزلية/أعمال مصغرة) بثلاثة نماذج تسعير (ثابت/ساعة/معاينة ومقايسة) مع خريطة رادار حية تتبع GPS لحظي + إعادة توجيه تلقائي 60 ثانية حتى 5 قفزات + ضمان مصنعية 30 يوم 10% محجوز، دورة حياة 7 حالات بتحقق سياج جغرافي 50م + إثبات صور قبل/بعد إلزامي، اسكرو ثنائي المستوى (رسوم معاينة + إجمالي مقايسة بعد موافقة 24h) وسجل قطع غيار حي، محور تعليم بحجز دروس حضور/أونلاين + فصل افتراضي WebRTC سبورة ونسخ محفوظ، وعقول مضمنة (8 توجيه مكاني، 1 تسعير وتدقيق قبل/بعد، 7 تحقق خلفية جنائية، 13 كشف انتحال سياج) + حزمة 7 هجرات `asv_` PHP 8.4 + 3 وسطاء — جاهزة للمعاينة الهجينة المتوازنة `#09090b + #FAFAFA`.

*Next: Visual Preview `docs/PREVIEW_AU_SERV.html` Hybrid Obsidian-Pearl moving canvas #09090b + pearl frost #FAFAFA inner + amber/crimson/cyan/emerald + 4-domain switcher + GIS dispatch map + SOS 60s + two-tier breakdown + WebRTC classroom + 50m geofence — temp file `rm docs/PREVIEW_AU_SERV.html` — PROJECT_STATE v3.8 `PHASE 3.6 DONE`*
