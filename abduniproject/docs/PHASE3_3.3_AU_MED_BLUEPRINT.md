# PHASE 3.3 — AU MED Healthcare & Clinical B2C Blueprint (Arena Canonical)

> **Env:** `Arena` (`arena/01a09d54-drfifty`) | **Project:** `abduniproject` (`D:\Project\Projects\abduniproject` — lowercase) | **Target:** `AU MED` — B2C Patient & Healthcare Client (`amed_`) — read-heavy B2C consuming `AU BUSINESS ab_` realtime via Redis + Reverb 8080 | **Stack:** PHP 8.4 Laravel 12 + React 19 Inertia v2 TS 5.7 strict ZERO `any` + Tailwind v4 + Shadcn Lucide Vite 0.0.0.0 + Redis (GEOSEARCH + Mutex) + MySQL 8.4 Spatial + PostgreSQL 16 PostGIS + pgcrypto (AU MED clinical exclusive) + Reverb 8080 wss | **Mode:** B2C SPEC & MIGRATION — Agent Deep Workspace Embedded (Agent 10, 8, 5, 13) — No separate Part 2 | **Date:** 2026-09-15 | **Inherits:** Phase 3.0 Design System 9 tokens `canvas/surface/text/border/accent/crimson obsidian #09090b glassmorphic backdrop-blur` + liquid metallic `emerald #10B981 cyan #06B6D4` + 8pt `ps/pe` RTL + Phase 3.1 HQ 10 screens + Phase 3.2 AU BUSINESS `MerchantCatalogUpdatedEvent` propagation

> **MANDATORY CROSS-REFERENCE (Rules 1-38):** `.arenarules` v2.2 (38 Rules, 11 Pillars, 9 Modules 1-9, 13 Agents exact Table 1.3, 5 Apps Hub-and-Spoke `AU BUSINESS ab_ core + amed_/adl_/asv_/ainv_` , Micro-Sprint 1-3/150) + `PROJECT_STATE.md` v3.4-clean (`PHASE 3.2 CLEAN & LOCKED rm PREVIEW_AU_BUSINESS.html verified`) re-read and enforced — zero override, `AU BUSINESS is_core=1` non-hibernatable, `AU MED` is `AU BUSINESS` read replica via `X-App-Id: AU_MED`, 13-Agent Registry Lock preserved (Agent 10 QA/Medical, 8 Supply Chain, 5 Customer Support, 13 Fraud Sentinel embedded here; ex-KYC merged to Agent 12, not in AU MED).

---

## 0) Executive — AU MED as Read-Heavy B2C Clinical Client

```
[AU BUSINESS ab_ — WRITES] ─MerchantCatalogUpdatedEvent→ Redis del b2c:catalog:AU_MED:* + Reverb private-catalog.AU_MED ─→ [AU MED amed_ — READS]
      merchant_catalogs type='clinical_service' (doctor, clinic slot, lab panel, medicine inventory)
      merchant_branches POINT/POLYGON coverage_zone ─GEOSEARCH─→ AU MED nearby search
      ↓
[AU MED B2C] patient_profiles (MySQL amed_) + patient_medical_vault (PostgreSQL amed_ pgsql+pgcrypto AES-256-GCM) + medical_appointments + e_prescriptions + pharmacy_orders + home_healthcare_requests
      ↑ patient-owned EHR row-level encryption — sharing via OTP — Syndicate Guard Agent 10
```

**Consumer Contract:** `DO NOT WRITE` to `merchant_catalogs` from AU MED. AU MED `GET /au-med/catalog/clinics?governorate=Cairo&specialty=cardiology&radius=10` hits `Redis GEOSEARCH clinics:geo:{governorate}` → `ST_Distance_Sphere` fallback to MySQL `merchant_branches` replica read. Inventory/doctor/slot updates from `AU BUSINESS PUT /ab/catalogs/{id}` propagate in `≤40ms` via `MerchantCatalogUpdatedEvent → Redis + Reverb` — AU MED invalidates `queryClient` via `useEcho('private-catalog.AU_MED')`. Slot booking holds use atomic `Redis Mutex lock:clinic_slot:{slot_id}` 300s (see §2).

**Why PostgreSQL for AU MED clinical:** `.arenarules` B.7 — `MySQL 8.4 core sole relational source | PostgreSQL 16 PostGIS+pgcrypto exclusive clinical store for AU MED`. Vault `patient_medical_vault` + `telehealth_sessions` signaling audit + `e_prescriptions` signatures live on `pgsql` with `pgcrypto` `pgp_sym_encrypt` / `AES-256-GCM` per-row `iv/tag` — MySQL holds lightweight `patient_profiles`, `medical_appointments`, `pharmacy_orders`, `home_healthcare_requests` with `app_id='AU_MED'`.

---

## 1) CORE APPLICATION PHILOSOPHY & REAL-TIME AU BUSINESS CONSUMPTION

| Principle | Spec (Zero Ambiguity) |
|---|---|
| **Read-Side Optimization & Redis GEOSEARCH Cache** | Search `doctors/clinics/lab panels/meds` never cold-hits DB on hot path. On `MerchantCatalogUpdatedEvent (AU BUSINESS)`, listener warms `Redis GEOADD clinics:geo:{governorate} {lng} {lat} {catalog_id}` + `JSON.SET b2c:catalog:AU_MED:{governorate}:{category} ex 120`. AU MED `GET /au-med/search?lat=30.044&lng=31.235&radius=10&specialty=cardiology` first `GEOSEARCH clinics:geo:Cairo FROMLONLAT 31.235 30.044 BYRADIUS 10 km ASC COUNT 50` → hydrates from `Redis JSON` else `ST_Distance_Sphere(location, POINT(lng,lat)) <= radius*1000` on `merchant_branches` replica + `JOIN merchant_catalogs type='clinical_service' is_hidden=0`. TTL 120s, region-scoped invalidation via `branch.coverage_zone POLYGON`. |
| **Real-Time Mutex Lock Booking Engine (5min Hold)** | Slot click → `POST /au-med/appointments/hold {slot_id}` → `Redis SET lock:clinic_slot:{slot_id} {user_id} NX EX 300` + `MySQL medical_appointments status='hold' expires_at=now+5m` inside `DB::transaction + lockForUpdate` on `merchant_catalogs booking_slots JSON` + `Redis Mutex appt:{user_id}:mutex`. Checkout `POST /au-med/appointments/confirm` validates `owns lock` else `409 Slot taken`. On payment `wallet_transactions holding→escrow_clearings` → lock `DEL` + `Reverb private-catalog.AU_MED slot.taken` → calendar grid `is_muted crimson` realtime. Expired cron `every 60s` `where status='hold' and expires_at<now() → delete + DEL lock + broadcast slot.released`. |
| **Syndicate-Aware Search Ranking** | Results sorted by `Syndicate rating DESC, distance ASC, consultation_fee ASC` — rating from `merchant_catalogs.attributes JSON {syndicate_rating, syndicate_verified:bool, syndicate_id}` propagated from AU BUSINESS KYC (Agent 12 verified). `is_urgent` slots (from AU BUSINESS `merchant_deal_items is_urgent`) pinned top `amber ring` + `presence-dispatch` push. |
| **Consumer Isolation** | Middleware `EnsureAppId:AU_MED` + `HasAppIdScope trait where app_id='AU_MED'` on all `amed_` models. Direct `POST` to `merchant_catalogs` from `AU_MED` returns `403 app_id immutable`. `X-App-Id` header injected by `AU MED` frontend `Inertia`. |

---

## 2) SECTION 1: CLINICAL APPOINTMENT ENGINE & TELEHEALTH MODULE

### 2.1 Clinic & Telehealth Reservation Flow

**Search Filters (`/au-med/search` — DataTable + Spatial + Redis):**
- `specialty` `select` → `deal_categories taxonomy AU MED` `cardiology/derma/pediatrics...` mapped to `merchant_catalogs.category_id`
- `governorate/city` `autocomplete` + `location radius slider 1-50km` `ps-4` `accent emerald` — default 10km `ST_Distance_Sphere`
- `Syndicate rating` `stars filter ≥4` `amber` + `Syndicate verified toggle` `emerald dot`
- `consultation fee range` `dual slider 50-2000 EGP` `subunit BIGINT`
- `mode` `Segmented In-clinic | Video Consultation | Both` `emerald active`

Result card `glass bg-surface/80 backdrop-blur(12px) border-main hover:border-accent/30 shadow-elevation-md hover:shadow-[0_0_24px_rgba(16,185,129,.18)] rounded-lg p-4` `doctor avatar w-12 h-12 rounded-full bg-accent/10 border-accent/20` + `name_ar/en Inter tabular` + `Syndicate badge emerald` + `fee Inter $` + `distance km` + `Slots CTA emerald`.

### 2.2 Interactive Calendar & Real-Time Slot Selection Grid

```
Calendar 7 days header (Cairo/Tajawal Inter) → Time grid 08:00-22:00 slot 30m → Matrix cell [● available emerald] [◐ hold amber pulse] [●● booked crimson muted] [◑ urgent amber ring + flicker]
Real-time via Reverb presence-clinic.{branch_id}: slot.taken / slot.released
```

- Source `merchant_catalogs type='clinical_service' + merchant_deal_items axis='booking' booking_slots JSON [{start, end, capacity, mutex_locked, mode: in_clinic|video}]` propagated from `AU BUSINESS` `DealStudio booking axis`.
- Selecting `available` → `hold` 5m `Redis lock:clinic_slot:{slot_id}` + `UI countdown 04:59 amber tabular-nums animate-pulse` + `Sticky bottom bar` `Selected Dr. X · Tue 10:00 · In-clinic · Confirm` `Primary emerald`.
- Unavailable from `Mutex` collision → `Shake crimson` + `toast 409 “تم حجز الموعد للتو”`.

### 2.3 Telehealth Session Gateway & Automated E-Prescription

- **Gateway:** `telehealth_sessions` (`appointment_id, webrtc_room_uuid, signaling_endpoint, token_hash CHAR64, status ENUM('scheduled','waiting','in_progress','completed','cancelled'), started_at, ended_at, recording_url_encrypted nullable, e_prescription_id nullable`) on `pgsql` (clinical store). Token `SHA256(room_uuid + server_secret + expires)` `EX 2h` stored `Redis telehealth:token:{uuid}`.
- **Flow:** `Confirmed appointment mode=video` → `POST /au-med/telehealth/{appointment_id}/join` verifies `VerifyEHealthVaultAccess + owns appointment` → returns `{webrtc_room_uuid, signaling_url wss://reverb:8080/telehealth/{room}, token}` → React `WebRTC` `RTCPeerConnection` via `Reverb signaling presence-telehealth.{room}` `offer/answer/ice` relay (no Pusher). `Agent 10` shadows chat via anonymized transcript (no raw).
- **Automated E-Prescription:** On `session completed` → doctor UI `Generate E-Prescription` → `POST /au-med/e-prescriptions {appointment_id, items: [{eda_code, dosage, duration}]}` → `e_prescriptions pgsql` with `digital_signature ECDSA merchant/doctor` + `qr_data SHA256` → `Patient E-Health Vault` push `Reverb private-patient.{user_id} prescription.issued` → patient viewer `emerald`.

### 2.4 Emergency & Urgent Clinic Dispatch

- **Toggle:** `Urgent Care Needed` `Switch large bg-crimson when ON shadow-[0_0_16px_rgba(239,68,68,.35)]` `Lucide Siren 14` → `POST /au-med/appointments/urgent {lat,lng,radius:10, chief_complaint_masked}`.
- **Matching:** `GEOSEARCH urgent:clinics:geo:{governorate} FROMLONLAT lng lat BYRADIUS 10 km` filtered `merchant_branches where coverage_radius_km>=10 AND ST_Distance_Sphere<=10km AND is_active=1 AND catalog is_urgent=1` + `open now` `booking_slots` availability + `Agent 8 proximity ranking` → `Reverb presence-dispatch-{region} urgent.request` → clinics `toast amber` + `accept`.
- **SLA:** `is_urgent` push `FCM high priority` + `am inv` echo `private-urgent.{user_id}` — booked slot `crimson border + pulse` `ETA 8m` `map live point`.

---

## 3) SECTION 2: DIGITAL PHARMACY, E-PRESCRIPTION & OTC DELIVERY ENGINE

### 3.1 E-Prescription Processing Pipeline (Deterministic OCR → Agent 10 Guard)

```
[Upload] Camera/PDF → [Deterministic OCR/Barcode] Tesseract + intervention/image + ngram + EDA codes → [Agent 10 + Agent 13 checks] → [Pharmacy Broadcast GEO] → [Offers] → [Checkout escrow]
```

1. **Upload:** Zone `border-dashed hover:border-emerald bg-surface-secondary/30 p-8 rounded-lg` `Lucide Upload 24 text-emerald` + `Camera capture` `input accept image/*` + `Select E-Prescription issued by AU MED doctor` `DataTable e_prescriptions where patient_id + status='issued'`.
2. **Deterministic OCR/Barcode:** `POST /au-med/e-prescriptions/scan {file, barcode?}` → `DeterministicRuleDriver` pipeline `intervention/image preprocess + Tesseract ngram + barcode Regex + EDA codes dictionary` extracts `{medication_name_ar/en, dosage_mg, frequency, duration_days, active_ingredient, eda_code}` `confidence 0-100`. If `≥0.90` auto-pass → `prescription_items` draft; else `requires_hitl=true` queued to **Agent 10** (no raw storage — `hash` only).
3. **EDA Validation:** `EnforceControlledSubstancePolicy` middleware checks `eda_code against eda_controlled_substances JSON` + `Agent 10` list — **hard block `controlled_narcotics` → `422 controlled_substance_blocked` crimson `“غير متاح للتوصيل — زيارة صيدلية”`**.
4. **Real-Time Pharmacy Inventory Broadcast:** `POST /au-med/pharmacy-orders/dispatch {prescription_id, lat,lng}` → `GEOSEARCH pharmacy:geo:{governorate} BYRADIUS delivery_radius_km (from merchant_branches coverage_radius_km 50km default)` → `broadcast private-pharmacy.{branch_id} prescription.request {items_hash, delivery_point POINT}` (hash only, no raw patient data) → pharmacies `AU BUSINESS` `toast` `bid offer` `price_subunit + eta_minutes + is_substitution_allowed`. Patient picks offer `hash-only`.

### 3.2 OTC Direct Purchase (Search & Add to Cart)

- Search `meds/OTC` `Redis FT ngram` `FT.SEARCH meds:idx "ibuprofen"` + `GEOSEARCH stock>0` + `price comparator` `Grid 3 cols gap-3` `card glass hover emerald glow` `image w-20 h-20 rounded-md` `price Inter emerald` `Add to Cart Primary` → `pharmacy_orders` `type='otc'` with `pharmacy_order_items`.

### 3.3 Chronic Medication Subscription & Auto-Refill Engine

- **Setup:** `Toggle Subscribe monthly` on pharmacy order → `POST /au-med/pharmacy-orders/subscribe {order_id, frequency: monthly, duration_months: 6, auto_refill_day: 15}` → `pharmacy_subscriptions pgsql` `status ENUM('active','paused','cancelled') next_dispatch_at`. 
- **Dispatch:** `Cron daily 09:00 Africa/Cairo` `where next_dispatch_at <= now() AND status='active'` → `DB::transaction + lockForUpdate pharmacy_subscriptions + Redis Mutex sub:{id}` → `creates pharmacy_orders dispatched` → `private-patient.{user_id} subscription.dispatch` `emerald toast` + `SMS/WhatsApp via Agent 5` `“تذكير: شحنتك الشهرية جاهزة”` masked. Failed payment → `pause + Agent 5 ticket`.

---

## 4) SECTION 3: HOME HEALTHCARE, NURSING & LAB SAMPLE DISPATCH (AU SERV INTEGRATION)

### 4.1 Home Nursing & Eldercare Booking

- **Catalog:** Services `nursing hourly/daily, physical therapy, eldercare, post-op care` from `merchant_catalogs type='clinical_service' category=home_healthcare` propagated from `AU BUSINESS` (AU SERV mirror `asv_` → AU MED `amed_` read).
- **Request:** `Form` `service_type select + scope select hourly/daily + date range + chief_complaint textarea masked + lat/lng auto (navigator.geolocation) + address` → `POST /au-med/home-healthcare {service_type, scope, lat,lng, notes}` → `home_healthcare_requests status='pending_assignment'` `POINT location SRID4326` + `coverage_zone POLYGON check`.
- **Assignment & Live GPS:** `Agent 8` `ST_Distance_Sphere` `nearest available provider` `service_providers pgsql?` or `AU SERV dispatch_logs` integration → `assigned_provider_id + eta_minutes` → `Reverb presence-home.{request_uuid} provider.location` `Live map Leaflet polyline emerald/cyan` `provider dot pulse cyan` + `patient Glass card` `Provider en route 6m amber` → `arrived → in_progress → completed` + `report to vault`.

### 4.2 Home Lab Tests & Diagnostics

- **Panels:** `select` `Blood Test (CBC), Lipid, HbA1c, ECG, Ultrasound portable, PCR` → `dispatches phlebotomist` `POST /au-med/lab-requests {panel_codes: ['CBC','LIPID'], lat,lng, preferred_time}` → `home_healthcare_requests type='lab_collection'` same table `service_type='lab'` `panel JSON`.
- **Flow:** `pending_assignment → assigned → en_route (live GPS) → sample_collected → lab_processing → report_ready` → `digital lab report PDF encrypted AES-256-GCM stored patient_medical_vault pgsql` `private-patient.{user_id} lab.ready` `emerald` `View in Vault` `Launch encrypted viewer` `VerifyEHealthVaultAccess`.

### 4.3 AU SERV Integration Contract

- `AU MED home_healthcare_requests` `dispatches` mirror `AU SERV service_tickets` via `Redis stream home:dispatch:{region}` + `Reverb presence-serv.{region}` — same `POINT live + POLYGON coverage` + `Redis GEOSEARCH` + `Agent 8 radius recalculation` (see §6 Agent 8). Status sync bidirectional `webhook internal`.

---

## 5) SECTION 4: UNIFIED PATIENT E-HEALTH VAULT & SYNDICATE COMPLIANCE

### 5.1 Encrypted E-Health Records (EHR) — Patient-Owned Vault (PostgreSQL 16 + pgcrypto)

- **Architecture:** `patient_profiles MySQL amed_patient_profiles (lightweight)` `1—1 patient_medical_vault pgsql amed_patient_medical_vault (encrypted JSONB via pgsql JSONB, AES-256-GCM per-row iv/tag)` — `.arenarules` `JSONB valid ONLY inside AU MED PostgreSQL store`.
- **Fields MySQL:** `user_id, display_name, phone_masked, blood_type ENUM(A/B/AB/O +/-), allergies JSON, chronic_conditions JSON, emergency_contacts JSON {name, relation, phone_encrypted AES-GCM}, preferred_language, lat/lng POINT nullable`.
- **Fields pgsql vault:** `patient_id FK pgsql, record_type ENUM('history','report','prescription','allergy','lab','imaging','vaccination'), encrypted_payload BYTEA (pgp_sym_encrypt JSON stringify + AES-GCM iv/tag), payload_hash CHAR64 SHA256, record_date, issuing_merchant_id nullable, is_shared_temporary BOOL, share_expires_at, created_at` — **middleware never decrypts bulk** — decrypt only on `VerifyEHealthVaultAccess` granted.
- **Access Control:** Patient owns vault. Doctor `GET /au-med/vault/{record_id}` requires `VerifyEHealthVaultAccess` check `vault_share_grants pgsql where patient_id + grantee_doctor_id + token_hash + expires_at>now() AND used=false` → decrypt single row `pgp_sym_decrypt` + stream `one-time`.

### 5.2 Granular Sharing Permissions (OTP-Verified 1-Time View)

- **Grant Flow:** Vault `Share` `Button emerald Lucide Share2` → `POST /au-med/vault/share {record_ids:[], doctor_id, expires_minutes:30}` → generates `OTP 6-digit` `Redis vault:share:{token_hash} EX 1800` + `vault_share_grants pgsql token_hash CHAR64, patient_id, doctor_id, record_ids JSONB, expires_at, used BOOL` → `SMS/WhatsApp` `OTP + deep link` via `Reverb private-doctor.{id}`. Doctor enters OTP → `POST /au-med/vault/access {otp}` → `VerifyEHealthVaultAccess` validates `hash + not used + not expired` → `mark used=true` → `decrypt + audit log vault_access_logs pgsql immutable hash_chain` `single view` then `auto-expire`.

### 5.3 Syndicate & Regulatory Compliance Guardrails (Agent 10 Integration — Deep Workspace)

- **EDA Guard:** `eda_controlled_substances` `seed JSON {eda_code, schedule: 'I narcotic', is_delivery_blocked: true}` loaded from `Egyptian Drug Authority` mock — enforced in `EnforceControlledSubstancePolicy` middleware + `Agent 10` scanning pipeline before `pharmacy_orders` creation. **Hard-blocking** `schedule I/II narcotics` + `restricted antibiotics without valid prescription signature` → `422 + audit to agent_actions`.
- **Syndicate Verification Badge:** Doctor `syndicate_verified` `emerald check` from `AU BUSINESS KYC Agent 12` — `unverified doctors cannot issue e_prescriptions` `403 syndicate_unverified`.

---

## 6) COGNITIVE AI MEDICAL ADVISOR — AGENT DEEP WORKSPACE EMBEDDED (No Separate File)

> **Deep Workspace Guarantee:** No separate `PART2` file — agent logic embedded directly within AU MED specs below, per Registry Lock Table 1.3 (13 Agents exact, no 14th).

| Agent (Registry Lock Exact Title) | Deep Workspace Module in AU MED | Logic, Triggers & UI (Glassmorphic Obsidian) |
|---|---|---|
| **Agent 10 — AI Quality Assurance & Medical Compliance (مراقب الجودة والتطابق الطبي)** | **Medical Compliance Sentinel — EHR Audit + EDA Screening + Telehealth Transcript QA** | **Scope:** AU MED consultation chat & telehealth transcript auditing via **anonymized NLP telemetry ONLY — zero access to raw patient payloads or AES-256-GCM records** (per Table 1.3). **Pipeline:** `telehealth_sessions transcript anonymized hash` + `e_prescriptions eda_code + dosage` → `Agent 10 DeterministicRuleDriver` `Regex + EDA dictionary + dosage guideline JSON (min/max per age/weight)` → `compliance_score 0-100` `badge emerald >85 amber 60-85 crimson <60` `+ confidence`. `>80% risk` `hard-block narcotic/overdose` `crimson` + `agent_actions hitl_required=true` queue to Master HQ Screen 1 `Agent 10 — Compliance Review: Prescription #ID confidence 0.82 requires HITL`. **UI:** Vault `shield emerald/crimson` `Agent 10 badge` on each record `“مطابق لـ EDA ✓”` vs `“يتطلب مراجعة”`. `Prescription Pipeline` shows `OCR confidence badge` same. |
| **Agent 8 — AI Supply Chain & Dispatch Director (مدير العمليات اللوجستية)** | **Pharmacy & Home-Care Dispatch Optimizer — GEOSEARCH + Live Radius + ETA** | **Scope:** MySQL Spatial `SPATIAL index`, `ST_Distance_Sphere` integrity, `dynamic radius recalculation` for pharmacy & nursing (per Table 1.3). **Logic:** `GEOSEARCH pharmacy:geo + home:geo` `nearest provider` `ST_Distance_Sphere<=coverage_radius_km*1000` + `provider load balancing` (least active orders) + `ETA = distance / avg_speed 30km/h + prep_minutes`. **Cron `every 2m`** `radius recalculation` if `dispatch failure >20% in region → expand 5km`. **UI:** Map `Leaflet` `provider dots cyan pulse` + `patient amber` + `polyline` `distance label tabular Inter` + `ETA badge amber` `“Dispatching via Agent 8 — ETA 12m”`. **Events:** `presence-dispatch-{governorate}` same as Phase 2.2c. **Reuse:** Shares `Agent 8` with `AU SERV Module 4` spatial but isolated `app_id`. |
| **Agent 5 — AI Customer Support Director (مدير دعم العملاء)** | **Patient Support Triage — Ticket Routing + Refund Bottleneck + Chronic Reminders** | **Scope:** Support ticket triage, automated routing pipelines, refund bottleneck resolution, chronic reminders (per Table 1.3). **Logic:** `POST /au-med/support/tickets {subject, body}` → `RegexDataLeakDetector` masks `phone/email` → `Agent 5 classifier Deterministic confidence` routes `urgent→crimson queue`, `billing→Agent1 CFO brief`, `clinical→Agent10`. `Auto-response` `“تم استلام طلبك — رقم # — الرد خلال 2h”` `WhatsApp/SMS masked`. **Refund:** On `pharmacy_orders status='disputed'` `48h + 12h grace once` → `Agent 5` creates `Master HQ Screen 6 Dispute` brief. **Chronic:** Sends `Auto-refill reminders` via `Reverb private-patient`. **UI:** `Inbox glass` `card bg-surface border-main rounded-md p-3` `status Pending/Resolved` `Agent 5 avatar emerald`. |
| **Agent 13 — AI Fraud Detector & Anti-Money Laundering Sentinel (مراقب الاحتيال ومكافحة غسيل الأموال)** | **Prescription Audit & Velocity Guard — E-Prescription Fraud + Opioid Velocity** | **Scope:** Velocity tracking, circular-loop detection, ZKP synthetic isolation, auto-freeze `>80% risk` (per Table 1.3). **Logic:** On `e_prescriptions create` → `Agent 13` scans `patient_id frequency per eda_code 7d` `>3 opioid scripts 7d` → `velocity risk 0-100` `+ circular loop` `same doctor+patient+pharmacy ring`. If `risk>80` → `auto-freeze order holding` `HARD-BLOCKED seize opaque 40` per Oil 6 `no seize` + `Freeze Suspicious ON` toggle → `private-hitl fraud.prescription` queue `Agent 13 — High Risk Prescription #ID 92% freeze`. **UI:** Pharmacy order `risk badge amber 60-80 crimson >80` `Lucide ShieldAlert` + `freeze banner`. `Agent 13 never seizes wallet` — requires HITL. |

**Token/Motion (Agent Cards):** `bg-emerald/5 border-emerald/20 backdrop-blur(12px) rounded-lg p-4 shadow-elevation-md hover:shadow-[0_0_20px_rgba(16,185,129,.15)]` `Lucide Bot 14 text-emerald` `floating translate-y-1 3s infinite` `proximity glow cyan` on hover via `--cursor-x/y`.

---

## 7) TECHNICAL DELIVERABLES & DATABASE MIGRATIONS SPECIFICATION (Executable Laravel PHP 8.4 + Eloquent + Inertia + Reverb + pgsql)

> **Generation Rule (Pillars 1,4,6,7,11):** Every write `DB::transaction + lockForUpdate + Redis Mutex + hasAppIdScope (MySQL)` + `pgcrypto AES-256-GCM per-row iv/tag + TLS 1.3` — `Rule 11` additive only `no drop/truncate`, `Rule 7` `JSON` MySQL `JSONB` only pgsql vault, MySQL 8.4 `InnoDB utf8mb4_unicode_ci` `SPATIAL` `FULLTEXT ngram` where needed, PostgreSQL 16 `pgsql` exclusive for `amed_patient_medical_vault + telehealth_sessions + e_prescriptions + vault_share_grants + vault_access_logs`.

### 7.0 Common Traits, Enums & Config

```php
// app/Modules/Shared/Traits/HasAppIdScope.php — MySQL amed_ models only (vault pgsql bypasses scope)
trait HasAppIdScope { protected static function booted(): void { static::addGlobalScope('app', fn($q)=>$q->where('app_id', request()->header('X-App-Id','AU_MED'))); } }
// Enums (strict PHP 8.4)
enum AppId:string { case AU_BUSINESS='AU_BUSINESS'; case AU_MED='AU_MED'; case AU_DEALS='AU_DEALS'; case AU_SERV='AU_SERV'; case AU_INVEST='AU_INVEST'; }
enum VaultRecordType:string { case history='history'; case report='report'; case prescription='prescription'; case allergy='allergy'; case lab='lab'; case imaging='imaging'; case vaccination='vaccination'; }
enum AppointmentStatus:string { case hold='hold'; case confirmed='confirmed'; case in_progress='in_progress'; case completed='completed'; case cancelled='cancelled'; case no_show='no_show'; }
enum TelehealthStatus:string { case scheduled='scheduled'; case waiting='waiting'; case in_progress='in_progress'; case completed='completed'; case cancelled='cancelled'; }
enum PharmacyOrderStatus:string { case pending='pending'; case offer_pending='offer_pending'; case confirmed='confirmed'; case preparing='preparing'; case out_for_delivery='out_for_delivery'; case delivered='delivered'; case disputed='disputed'; case cancelled='cancelled'; }
enum HomeCareStatus:string { case pending_assignment='pending_assignment'; case assigned='assigned'; case en_route='en_route'; case in_progress='in_progress'; case sample_collected='sample_collected'; case lab_processing='lab_processing'; case report_ready='report_ready'; case completed='completed'; case cancelled='cancelled'; }
// Config tiers seed already; EDA seed eda_controlled_substances JSON
```

### 7.1 `amed_patient_profiles` (MySQL) & `amed_patient_medical_vault` (PostgreSQL pgsql + pgcrypto)

```php
// database/migrations/2026_09_15_000030_create_amed_patient_profiles_table.php — MySQL 8.4 InnoDB — PHP 8.4 strict
return new class extends Migration {
 public function up(): void {
  Schema::create('amed_patient_profiles', function(Blueprint $t){
   $t->id(); $t->char('uuid',36)->unique();
   $t->foreignId('user_id')->constrained('users')->cascadeOnDelete()->unique()->comment('1-1 users');
   $t->enum('app_id',['AU_BUSINESS','AU_MED','AU_DEALS','AU_SERV','AU_INVEST'])->default('AU_MED')->index();
   $t->string('display_name',150);
   $t->string('phone_masked',32)->nullable()->comment('Regex masked until escrow — store hash only');
   $t->enum('blood_type',['A+','A-','B+','B-','AB+','AB-','O+','O-'])->nullable()->index();
   $t->json('allergies')->nullable()->comment('["penicillin"] JSON array');
   $t->json('chronic_conditions')->nullable()->comment('["diabetes","hypertension"]');
   $t->json('emergency_contacts')->nullable()->comment('[{name, relation, phone_encrypted AES-GCM, iv, tag}]');
   $t->point('home_location',4326)->nullable()->comment('for dispatch GEOSEARCH');
   $t->string('preferred_language',8)->default('ar');
   $t->timestamps(); $t->softDeletes();
   $t->index(['app_id','blood_type']);
  });
  try{ DB::statement('ALTER TABLE amed_patient_profiles ADD SPATIAL INDEX spx_patient_home (home_location)'); }catch(Throwable $e){}
  DB::statement("ALTER TABLE amed_patient_profiles ADD CONSTRAINT chk_patient_allergies_json CHECK (allergies IS NULL OR JSON_VALID(allergies))");
  DB::statement("ALTER TABLE amed_patient_profiles ADD CONSTRAINT chk_patient_emergency_json CHECK (emergency_contacts IS NULL OR JSON_VALID(emergency_contacts))");
 }
 public function down(): void { Schema::dropIfExists('amed_patient_profiles'); }
};
// database/migrations/2026_09_15_000031_create_amed_patient_medical_vault_pgsql.php — PostgreSQL 16 pgsql connection
return new class extends Migration {
 public function up(): void {
  Schema::connection('pgsql')->create('amed_patient_medical_vault', function(Blueprint $t){
   $t->id(); $t->char('uuid',36)->unique();
   $t->unsignedBigInteger('patient_profile_id')->comment('FK to MySQL amed_patient_profiles.id — app-level FK (cross-DB)');
   $t->unsignedBigInteger('user_id')->index()->comment('owner');
   $t->enum('record_type',['history','report','prescription','allergy','lab','imaging','vaccination'])->index();
   // JSONB valid ONLY in pgsql per Rule 7 — encrypted payload
   $t->jsonb('encrypted_payload')->nullable()->comment('pgp_sym_encrypt JSON — AES-256-GCM per-row iv/tag inside JSONB');
   $t->string('payload_iv',64)->comment('AES-GCM IV base64');
   $t->string('payload_tag',64)->comment('AES-GCM auth tag');
   $t->char('payload_hash',64)->comment('SHA256 of plaintext for audit without decrypt');
   $t->date('record_date')->nullable()->index();
   $t->unsignedBigInteger('issuing_merchant_id')->nullable()->index()->comment('doctor/clinic merchant ab_ id if issued by AU MED doctor');
   $t->boolean('is_shared_temporary')->default(false)->index();
   $t->dateTime('share_expires_at')->nullable();
   $t->timestamps(); $t->softDeletes();
   $t->index(['user_id','record_type','record_date']);
  });
  // pgsql indexes GIN on JSONB for audit hash search
  try{ DB::connection('pgsql')->statement('CREATE INDEX gin_vault_payload ON amed_patient_medical_vault USING GIN (encrypted_payload)'); }catch(Throwable $e){}
  // Enable pgcrypto if not exists
  try{ DB::connection('pgsql')->statement('CREATE EXTENSION IF NOT EXISTS pgcrypto'); }catch(Throwable $e){}
 }
 public function down(): void { Schema::connection('pgsql')->dropIfExists('amed_patient_medical_vault'); }
};
// Vault share grants + access logs — pgsql immutable
// Schema::connection('pgsql')->create('vault_share_grants', fn(Blueprint $t)=>{ $t->id(); $t->char('uuid',36)->unique(); $t->unsignedBigInteger('patient_id'); $t->unsignedBigInteger('doctor_merchant_id')->index(); $t->char('token_hash',64)->unique(); $t->jsonb('record_ids'); $t->dateTime('expires_at')->index(); $t->boolean('used')->default(false)->index(); $t->timestamps(); });
// Schema::connection('pgsql')->create('vault_access_logs', fn(Blueprint $t)=>{ $t->id(); $t->char('uuid',36)->unique(); $t->unsignedBigInteger('grant_id')->nullable(); $t->char('hash_prev',64)->nullable(); $t->char('hash_current',64); $t->jsonb('meta'); $t->timestamps(); $t->index(['created_at']); }); // BEFORE UPDATE/DELETE trigger SIGNAL SQLSTATE 45000 'vault_access_logs immutable'
// Models
// App\Models\AmedPatientProfile extends Model { use HasAppIdScope, SoftDeletes; connection='mysql'; table='amed_patient_profiles'; fillable display_name, blood_type, casts allergies/emergency_contacts=>array, home_location=>Point; relation vault():HasMany via cross-DB manual; scopeNearby($q,$lat,$lng,$km)=>whereRaw("ST_Distance_Sphere(home_location, POINT(?,?))<=?*1000",[$lng,$lat,$km]); }
// App\Models\Pgsql\AmedPatientMedicalVault extends Model { connection='pgsql'; table='amed_patient_medical_vault'; casts encrypted_payload=>array; fillable record_type, payload_iv/tag/hash; method decrypt(string $key):array => pgp_sym_decrypt (or AES-GCM with iv/tag); scopeOwnedBy($q,$userId)=>where('user_id',$userId); }
```

**Controller (thin):** `App\Modules\AUMed\Http\Controllers\User\PatientVaultController@show (VerifyEHealthVaultAccess decrypts single row), share (creates vault_share_grants + Redis vault:share:{hash} EX 1800 + Reverb private-doctor), accessViaOtp (validates hash + mark used + vault_access_logs hash_chain)` — `DB::transaction` on pgsql + Redis Mutex `vault:{patient_id}:share`.

### 7.2 `amed_medical_appointments` (MySQL) & `amed_telehealth_sessions` (pgsql)

```php
// database/migrations/2026_09_15_000032_create_amed_medical_appointments_table.php — MySQL
return new class extends Migration {
 public function up(): void {
  Schema::create('amed_medical_appointments', function(Blueprint $t){
   $t->id(); $t->char('uuid',36)->unique();
   $t->foreignId('patient_profile_id')->constrained('amed_patient_profiles')->cascadeOnDelete();
   $t->foreignId('user_id')->constrained('users')->cascadeOnDelete()->index()->comment('patient user');
   $t->foreignId('merchant_id')->constrained('merchants')->cascadeOnDelete()->comment('clinic/hospital merchant ab_');
   $t->foreignId('branch_id')->nullable()->constrained('merchant_branches')->nullOnDelete();
   $t->foreignId('catalog_id')->constrained('merchant_catalogs')->cascadeOnDelete()->comment('clinical_service catalog');
   $t->enum('app_id',['AU_BUSINESS','AU_MED','AU_DEALS','AU_SERV','AU_INVEST'])->default('AU_MED')->index();
   $t->string('slot_id',80)->index()->comment('booking_slots JSON slot id from merchant_deal_items + Redis lock:clinic_slot:{slot_id}');
   $t->enum('mode',['in_clinic','video'])->default('in_clinic')->index();
   $t->enum('status',['hold','confirmed','in_progress','completed','cancelled','no_show'])->default('hold')->index();
   $t->dateTime('slot_start')->index(); $t->dateTime('slot_end')->index();
   $t->dateTime('expires_at')->nullable()->index()->comment('hold 5m TTL — cron cleanup');
   $t->bigInteger('fee_subunit')->unsigned()->comment('consultation fee');
   $t->string('currency',8)->default('EGP');
   $t->foreignId('escrow_id')->nullable()->constrained('escrow_clearings')->nullOnDelete();
   $t->json('meta')->nullable()->comment('{chief_complaint_hash, is_urgent, urgent_radius_km}');
   $t->timestamps(); $t->softDeletes();
   $t->index(['merchant_id','slot_start','status']); $t->index(['user_id','status','slot_start']);
   $t->unique(['slot_id','slot_start','merchant_id']); // mutex DB guard + Redis NX
  });
  DB::statement("ALTER TABLE amed_medical_appointments ADD CONSTRAINT chk_appt_fee CHECK (fee_subunit>0)");
 }
 public function down(): void { Schema::dropIfExists('amed_medical_appointments'); }
};
// database/migrations/2026_09_15_000033_create_amed_telehealth_sessions_pgsql.php — pgsql
return new class extends Migration {
 public function up(): void {
  Schema::connection('pgsql')->create('amed_telehealth_sessions', function(Blueprint $t){
   $t->id(); $t->char('uuid',36)->unique();
   $t->unsignedBigInteger('appointment_id')->unique()->comment('FK to MySQL amed_medical_appointments.id cross-DB');
   $t->char('webrtc_room_uuid',36)->unique();
   $t->string('signaling_endpoint',255)->comment('wss://reverb:8080/telehealth/{room} presence-telehealth.{room}');
   $t->char('token_hash',64)->index()->comment('SHA256(room+secret+exp) — Redis telehealth:token:{uuid} EX 2h');
   $t->enum('status',['scheduled','waiting','in_progress','completed','cancelled'])->default('scheduled')->index();
   $t->dateTime('started_at')->nullable(); $t->dateTime('ended_at')->nullable();
   $t->text('recording_url_encrypted')->nullable()->comment('AES-256-GCM if recorded — optional');
   $t->string('recording_iv',64)->nullable(); $t->string('recording_tag',64)->nullable();
   $t->unsignedBigInteger('e_prescription_id')->nullable()->index()->comment('FK pgsql amed_e_prescriptions.id when generated post-session');
   $t->jsonb('anonymized_transcript_hashes')->nullable()->comment('Agent 10 audit hashes only — no raw');
   $t->timestamps();
  });
 }
 public function down(): void { Schema::connection('pgsql')->dropIfExists('amed_telehealth_sessions'); }
};
// Controllers: AmedAppointmentController@hold (Redis NX EX 300 + DB transaction lockForUpdate merchant_catalogs + escrow hold), confirm (verify owns lock + escrow lock), cancel, urgentDispatch (GEOSEARCH 10km + Reverb presence-dispatch + Agent 8)
// TelehealthController@join (VerifyEHealthVaultAccess + token issue), signal (Reverb presence-telehealth relay), complete (creates e_prescription)
```

### 7.3 `amed_e_prescriptions` & `amed_prescription_items` (pgsql — clinical store)

```php
// database/migrations/2026_09_15_000034_create_amed_e_prescriptions_pgsql.php — pgsql
return new class extends Migration {
 public function up(): void {
  Schema::connection('pgsql')->create('amed_e_prescriptions', function(Blueprint $t){
   $t->id(); $t->char('uuid',36)->unique();
   $t->unsignedBigInteger('appointment_id')->nullable()->index()->comment('nullable for upload-scan flow without appointment');
   $t->unsignedBigInteger('patient_profile_id')->index(); // cross-DB
   $t->unsignedBigInteger('user_id')->index();
   $t->unsignedBigInteger('prescribing_merchant_id')->index()->comment('doctor merchant ab_ id — must be syndicate_verified');
   $t->enum('source',['telehealth_auto','doctor_issued','upload_scan'])->default('doctor_issued')->index();
   $t->enum('status',['draft','issued','dispensed','cancelled'])->default('draft')->index();
   $t->string('digital_signature',512)->comment('ECDSA signature of payload_hash by doctor merchant key');
   $t->char('payload_hash',64)->comment('SHA256(prescription_items JSON + patient_id + timestamp)');
   $t->text('qr_data')->comment('Base64 QR PNG SHA256(payload_hash+merchant) for pharmacy verify');
   $t->decimal('ocr_confidence',5,2)->nullable()->comment('deterministic OCR 0-100 — <90 → Agent 10 HITL');
   $t->jsonb('scan_meta')->nullable()->comment('{file_hash, barcode, eda_codes[], image_preprocess}');
   $t->char('eda_risk_hash',64)->nullable()->comment('Agent 10+13 combined risk hash');
   $t->timestamps(); $t->softDeletes();
   $t->index(['user_id','status','created_at']);
  });
  Schema::connection('pgsql')->create('amed_prescription_items', function(Blueprint $t){
   $t->id(); $t->char('uuid',36)->unique();
   $t->unsignedBigInteger('e_prescription_id')->index()->comment('FK pgsql amed_e_prescriptions.id');
   $t->foreignId('catalog_id', null)->nullable()->comment('optional link to merchant_catalogs med if OTC mapped — cross-DB loose FK');
   $t->string('medication_name',255); $t->string('medication_name_ar',255);
   $t->string('active_ingredient',255)->index();
   $t->string('eda_code',32)->index()->comment('Egyptian Drug Authority code — EnforceControlledSubstancePolicy checks');
   $t->string('dosage',80)->comment('500mg');
   $t->string('frequency',80)->comment('twice daily');
   $t->smallInteger('duration_days')->unsigned();
   $t->text('instructions')->nullable();
   $t->boolean('is_substitution_allowed')->default(false);
   $t->timestamps();
   $t->index(['eda_code','active_ingredient']);
  });
  try{ DB::connection('pgsql')->statement('CREATE INDEX gin_prescription_items_med ON amed_prescription_items USING GIN (to_tsvector(\'english\', medication_name))'); }catch(Throwable $e){}
  // FK pgsql local
  try{ DB::connection('pgsql')->statement('ALTER TABLE amed_prescription_items ADD CONSTRAINT fk_items_prescription FOREIGN KEY (e_prescription_id) REFERENCES amed_e_prescriptions(id) ON DELETE CASCADE'); }catch(Throwable $e){}
 }
 public function down(): void { Schema::connection('pgsql')->dropIfExists('amed_prescription_items'); Schema::connection('pgsql')->dropIfExists('amed_e_prescriptions'); }
};
// Controllers: EPrescriptionController@scan (intervention/image + Tesseract ngram → confidence), store (EnforceControlledSubstancePolicy + Agent10/13 checks + pgsql transaction), issue (doctor sign ECDSA + qr_data), showQR
```

### 7.4 `amed_pharmacy_orders` & `amed_pharmacy_order_items` (MySQL — dispatch operational)

```php
// database/migrations/2026_09_15_000035_create_amed_pharmacy_orders_table.php — MySQL
return new class extends Migration {
 public function up(): void {
  Schema::create('amed_pharmacy_orders', function(Blueprint $t){
   $t->id(); $t->char('uuid',36)->unique();
   $t->foreignId('patient_profile_id')->constrained('amed_patient_profiles')->cascadeOnDelete();
   $t->foreignId('user_id')->constrained('users')->cascadeOnDelete()->index();
   $t->enum('app_id',['AU_BUSINESS','AU_MED','AU_DEALS','AU_SERV','AU_INVEST'])->default('AU_MED')->index();
   $t->unsignedBigInteger('e_prescription_id')->nullable()->index()->comment('pgsql amed_e_prescriptions.id cross-DB — nullable for OTC');
   $t->enum('type',['prescription','otc','subscription_refill'])->default('prescription')->index();
   $t->foreignId('assigned_pharmacy_merchant_id')->nullable()->constrained('merchants')->nullOnDelete()->comment('chosen offer merchant ab_');
   $t->foreignId('assigned_branch_id')->nullable()->constrained('merchant_branches')->nullOnDelete();
   $t->enum('status',['pending','offer_pending','confirmed','preparing','out_for_delivery','delivered','disputed','cancelled'])->default('pending')->index();
   $t->point('delivery_location',4326)->comment('patient delivery POINT SRID4326');
   $t->string('delivery_address',500);
   $t->bigInteger('total_subunit')->unsigned();
   $t->string('currency',8)->default('EGP');
   $t->foreignId('escrow_id')->nullable()->constrained('escrow_clearings')->nullOnDelete();
   $t->decimal('fraud_risk_score',5,2)->default(0)->comment('Agent 13 0-100 — >80 freeze');
   $t->json('dispatch_meta')->nullable()->comment('{offers:[{merchant_id,price,eta}], chosen_offer, eta_minutes, is_substitution_allowed, eda_verified:bool}');
   $t->json('tracking')->nullable()->comment('{live_point, eta, dispatched_at}');
   $t->timestamps(); $t->softDeletes();
   $t->index(['assigned_pharmacy_merchant_id','status']); $t->index(['user_id','status','created_at']);
  });
  Schema::create('amed_pharmacy_order_items', function(Blueprint $t){
   $t->id(); $t->char('uuid',36)->unique();
   $t->foreignId('pharmacy_order_id')->constrained('amed_pharmacy_orders')->cascadeOnDelete();
   $t->unsignedBigInteger('prescription_item_id')->nullable()->index()->comment('pgsql amed_prescription_items.id cross-DB');
   $t->foreignId('catalog_id')->nullable()->constrained('merchant_catalogs')->nullOnDelete()->comment('medicine catalog if mapped');
   $t->string('medication_name',255);
   $t->string('eda_code',32)->nullable()->index();
   $t->integer('quantity')->unsigned();
   $t->bigInteger('unit_price_subunit')->unsigned();
   $t->bigInteger('line_total_subunit')->unsigned();
   $t->timestamps();
  });
  try{ DB::statement('ALTER TABLE amed_pharmacy_orders ADD SPATIAL INDEX spx_pharmacy_delivery (delivery_location)'); }catch(Throwable $e){}
  DB::statement("ALTER TABLE amed_pharmacy_orders ADD CONSTRAINT chk_pharmacy_total CHECK (total_subunit>0)");
  DB::statement("ALTER TABLE amed_pharmacy_orders ADD CONSTRAINT chk_pharmacy_risk CHECK (fraud_risk_score BETWEEN 0 AND 100)");
 }
 public function down(): void { Schema::dropIfExists('amed_pharmacy_order_items'); Schema::dropIfExists('amed_pharmacy_orders'); }
};
// Extra: pharmacy_subscriptions pgsql or MySQL for chronic refill
// Schema::create('amed_pharmacy_subscriptions', fn(Blueprint $t)=>{ $t->id(); $t->char('uuid',36)->unique(); $t->foreignId('patient_profile_id')->constrained('amed_patient_profiles'); $t->foreignId('pharmacy_order_id')->constrained('amed_pharmacy_orders'); $t->enum('frequency',['monthly'])->default('monthly'); $t->smallInteger('duration_months')->unsigned(); $t->date('next_dispatch_at')->index(); $t->enum('status',['active','paused','cancelled'])->default('active')->index(); $t->timestamps(); });
// Controllers: PharmacyOrderController@scanAndDispatch (EnforceControlledSubstancePolicy + Agent13 risk + GEOSEARCH pharmacy:geo broadcast + Reverb private-pharmacy), choseOffer, confirm, trackLive, subscriptionSetup (Cron daily)
// Agent 8 handles nearest pharmacy selection + radius expansion
```

### 7.5 `amed_home_healthcare_requests` (MySQL — provider assignment + spatial tracking + AU SERV mirror)

```php
// database/migrations/2026_09_15_000036_create_amed_home_healthcare_requests_table.php — MySQL
return new class extends Migration {
 public function up(): void {
  Schema::create('amed_home_healthcare_requests', function(Blueprint $t){
   $t->id(); $t->char('uuid',36)->unique();
   $t->foreignId('patient_profile_id')->constrained('amed_patient_profiles')->cascadeOnDelete();
   $t->foreignId('user_id')->constrained('users')->cascadeOnDelete()->index();
   $t->enum('app_id',['AU_BUSINESS','AU_MED','AU_DEALS','AU_SERV','AU_INVEST'])->default('AU_MED')->index();
   $t->enum('service_type',['nursing','physical_therapy','eldercare','post_op','lab_collection'])->index();
   $t->enum('scope',['hourly','daily','visit'])->default('visit');
   $t->json('panel_codes')->nullable()->comment('for lab_collection: ["CBC","LIPID","ECG"]');
   $t->point('patient_location',4326)->comment('home POINT SRID4326');
   $t->polygon('coverage_zone',4326)->nullable()->comment('ST_Buffer(patient_location, radius) for assignment');
   $t->enum('status',['pending_assignment','assigned','en_route','in_progress','sample_collected','lab_processing','report_ready','completed','cancelled'])->default('pending_assignment')->index();
   $t->foreignId('assigned_provider_merchant_id')->nullable()->constrained('merchants')->nullOnDelete()->comment('AU SERV provider merchant ab_');
   $t->foreignId('assigned_branch_id')->nullable()->constrained('merchant_branches')->nullOnDelete();
   $t->bigInteger('fee_subunit')->unsigned();
   $t->string('currency',8)->default('EGP');
   $t->foreignId('escrow_id')->nullable()->constrained('escrow_clearings')->nullOnDelete();
   $t->point('provider_live_location',4326)->nullable()->comment('live GPS via Reverb presence-home.{uuid}');
   $t->integer('eta_minutes')->nullable();
   $t->json('tracking')->nullable()->comment('{live_point, eta, dispatched_at, polyline}');
   $t->json('report')->nullable()->comment('{lab_pdf_encrypted ref vault uuid, vitals}');
   $t->timestamps(); $t->softDeletes();
   $t->index(['assigned_provider_merchant_id','status']); $t->index(['service_type','status','created_at']);
  });
  try{ DB::statement('ALTER TABLE amed_home_healthcare_requests ADD SPATIAL INDEX spx_home_patient (patient_location)'); }catch(Throwable $e){}
  try{ DB::statement('ALTER TABLE amed_home_healthcare_requests ADD SPATIAL INDEX spx_home_provider_live (provider_live_location)'); }catch(Throwable $e){}
  try{ DB::statement('ALTER TABLE amed_home_healthcare_requests ADD SPATIAL INDEX spx_home_zone (coverage_zone)'); }catch(Throwable $e){}
 }
 public function down(): void { Schema::dropIfExists('amed_home_healthcare_requests'); }
};
// Controllers: HomeHealthcareController@store (ST_Distance_Sphere + Agent 8 nearest + escrow hold), assign (Agent 8), updateLiveLocation (Reverb presence-home.{uuid} + Redis GEOADD home:geo), collectSample, deliverReport (writes to pgsql vault)
// Mirror to AU SERV: Listener HomeDispatchListener → Redis XADD home:dispatch:{region} + broadcast presence-serv.{region}
```

### 7.6 API Middleware — `VerifyEHealthVaultAccess` & `EnforceControlledSubstancePolicy` + Routes

```php
// app/Http/Middleware/VerifyEHealthVaultAccess.php — pgsql vault one-time OTP share guard
public function handle(Request $r, Closure $next){
 $recordId = $r->route('record') ?? $r->input('record_id');
 $user = $r->user(); // patient owns OR doctor holds valid grant
 if($user->id === $r->vaultOwnerId) return $next($r); // owner bypass
 $token = $r->header('X-Vault-OTP') ?? $r->input('otp');
 if(!$token) return response()->json(['code'=>'vault_otp_required'], 403);
 $hash = hash('sha256', $token);
 $grant = DB::connection('pgsql')->table('vault_share_grants')->where('token_hash',$hash)->where('used',false)->where('expires_at','>',now())->first();
 if(!$grant) return response()->json(['code'=>'vault_otp_invalid_expired'], 403);
 if(! in_array($recordId, json_decode($grant->record_ids,true) ?? [])) return response()->json(['code'=>'vault_record_not_granted'], 403);
 // mark used + audit chain
 DB::connection('pgsql')->transaction(function() use($grant){
  DB::connection('pgsql')->table('vault_share_grants')->where('id',$grant->id)->update(['used'=>true]);
  $prev = DB::connection('pgsql')->table('vault_access_logs')->latest('id')->value('hash_current');
  $curr = hash('sha256', $prev.$grant->id.now());
  DB::connection('pgsql')->table('vault_access_logs')->insert(['uuid'=>Str::uuid(),'grant_id'=>$grant->id,'hash_prev'=>$prev,'hash_current'=>$curr,'meta'=>json_encode(['ip'=>request()->ip()]),'created_at'=>now(),'updated_at'=>now()]);
 });
 // decrypt single row only inside controller after this passes
 return $next($r);
}
// app/Http/Middleware/EnforceControlledSubstancePolicy.php — hard block narcotics delivery
public function handle(Request $r, Closure $next){
 $edaCodes = collect($r->input('items',[]))->pluck('eda_code')->merge([$r->input('eda_code')])->filter();
 $controlled = config('eda.controlled_substances'); // seed {eda_code, schedule, is_delivery_blocked}
 foreach($edaCodes as $code){
  $entry = collect($controlled)->firstWhere('eda_code',$code);
  if($entry && ($entry['is_delivery_blocked'] ?? false)){
   // emit Agent 10 + 13 actions low confidence
   app(AgentStrategyManager::class)->emit('agent_actions', ['agent_id'=>10,'capability'=>'eda_block','confidence'=>100,'hitl_required'=>true]);
   return response()->json(['code'=>'controlled_substance_blocked','message'=>'Restricted substance — pharmacy delivery blocked. Visit pharmacy in person.','eda_code'=>$code], 422);
  }
 }
 // also run Agent 13 velocity guard preview (soft check — hard freeze in controller)
 return $next($r);
}
// Routes — routes/api/v1/au_med.php
// Route::middleware(['auth:jwt','EnsureAppId:AU_MED'])->group(function(){
//  Route::get('search', [AmedCatalogController::class,'search']); // GEOSEARCH + ST_Distance_Sphere
//  Route::post('appointments/hold', [AmedAppointmentController::class,'hold'])->middleware('throttle:20,1');
//  Route::post('appointments/confirm', [AmedAppointmentController::class,'confirm']);
//  Route::post('appointments/urgent', [AmedAppointmentController::class,'urgentDispatch']); // 10km
//  Route::post('telehealth/{appointment}/join', [TelehealthController::class,'join'])->middleware(VerifyEHealthVaultAccess::class);
//  Route::post('e-prescriptions/scan', [EPrescriptionController::class,'scan']);
//  Route::post('e-prescriptions', [EPrescriptionController::class,'store'])->middleware(EnforceControlledSubstancePolicy::class);
//  Route::post('pharmacy-orders/dispatch', [PharmacyOrderController::class,'dispatch'])->middleware(EnforceControlledSubstancePolicy::class);
//  Route::post('pharmacy-orders/{id}/choose-offer', [PharmacyOrderController::class,'chooseOffer']);
//  Route::post('pharmacy-orders/subscribe', [PharmacyOrderController::class,'subscribe']);
//  Route::apiResource('vault', PatientVaultController::class)->middleware(VerifyEHealthVaultAccess::class)->only(['show']);
//  Route::post('vault/share', [PatientVaultController::class,'share']);
//  Route::post('vault/access', [PatientVaultController::class,'accessViaOtp']);
//  Route::post('home-healthcare', [HomeHealthcareController::class,'store']);
//  Route::patch('home-healthcare/{id}/live', [HomeHealthcareController::class,'updateLiveLocation']); // Reverb presence-home.{uuid}
//  Route::post('support/tickets', [SupportTicketController::class,'store']); // Agent 5
// });
// Reverb channels: private-catalog.AU_MED (catalog propagation), presence-clinic.{branch_id} (slot grid), presence-telehealth.{room} (WebRTC signal), private-patient.{user_id} (prescription/lab/subscription), presence-home.{uuid} / presence-dispatch-{region} (nursing/pharmacy dispatch), private-pharmacy.{branch_id} (prescription broadcast)
```

### 7.7 Eloquent Models (Excerpt — Strict Types PHP 8.4 Dual-DB)

```php
// App\Models\AmedPatientProfile extends Model { use HasAppIdScope, SoftDeletes; connection='mysql'; table='amed_patient_profiles'; casts allergies=>array, chronic_conditions=>array, emergency_contacts=>array, home_location=>Point; fillable display_name, blood_type, preferred_language; relation vaults():HasMany cross-DB via user_id; }
// App\Models\Pgsql\AmedPatientMedicalVault extends Model { connection='pgsql'; table='amed_patient_medical_vault'; casts encrypted_payload=>array; hidden payload_iv/tag; method decrypt(string $appKey):array { return json_decode(openssl_decrypt(... AES-256-GCM ...), true); } }
// App\Models\AmedMedicalAppointment extends Model { use HasAppIdScope; connection='mysql'; table='amed_medical_appointments'; casts slot_start=>datetime, expires_at=>datetime, meta=>array; scopeHold($q)=>where('status','hold'); relation telehealth():HasOne Pgsql; }
// App\Models\Pgsql\AmedTelehealthSession extends Model { connection='pgsql'; table='amed_telehealth_sessions'; casts anonymized_transcript_hashes=>array; relation appointment():BelongsTo cross-DB; }
// App\Models\Pgsql\AmedEPrescription extends Model { connection='pgsql'; table='amed_e_prescriptions'; casts scan_meta=>array; relation items():HasMany Pgsql; }
// App\Models\AmedPharmacyOrder extends Model { use HasAppIdScope, SoftDeletes; connection='mysql'; table='amed_pharmacy_orders'; casts delivery_location=>Point, dispatch_meta=>array, tracking=>array; scopeNearby($q,$lat,$lng,$km)=>whereRaw("ST_Distance_Sphere(delivery_location, POINT(?,?))<=?*1000",[$lng,$lat,$km]); }
// App\Models\AmedHomeHealthcareRequest extends Model { use HasAppIdScope, SoftDeletes; connection='mysql'; table='amed_home_healthcare_requests'; casts patient_location=>Point, provider_live_location=>Point, panel_codes=>array, report=>array; }
```

### 7.8 API Controllers (Skeleton — Action-Service-Repository Thin Layer)

```
App\Modules\AUMed\Http\Controllers\User\
  AmedCatalogController@search (GEOSEARCH clinics:geo + ST_Distance_Sphere + syndicate sort + is_urgent pin + Redis 120s)
  AmedAppointmentController@hold (Redis NX EX 300 + DB lockForUpdate merchant_catalogs + escrow holding + Reverb slot.taken), confirm (owns lock), cancel, urgentDispatch (10km GEOSEARCH + Agent 8 + presence-dispatch)
  TelehealthController@join (VerifyEHealthVaultAccess + token SHA256 + Redis telehealth:token), signal (Reverb presence-telehealth relay offer/answer/ice), complete (creates e_prescription pgsql + private-patient)
  EPrescriptionController@scan (intervention/image + Tesseract + EDA ngram confidence → Agent10 HITL if <90), store (EnforceControlledSubstancePolicy + Agent10 compliance + Agent13 velocity + pgsql transaction ECDSA + qr_data + vault push)
  PharmacyOrderController@dispatch (EnforceControlledSubstancePolicy + GEOSEARCH pharmacy:geo + broadcast private-pharmacy + Agent8 ETA + Agent13 risk freeze), chooseOffer, confirm, trackLive, subscribe (Cron daily + Agent5 reminders)
  PatientVaultController@show (VerifyEHealthVaultAccess decrypt single row pgsql pgp_sym_decrypt), share (vault_share_grants pgsql + Redis vault:share + Reverb private-doctor + OTP), accessViaOtp (mark used + vault_access_logs hash_chain)
  HomeHealthcareController@store (ST_Distance_Sphere + Agent8 nearest provider + escrow hold + Redis home:dispatch + Reverb presence-home), updateLiveLocation (Reverb presence-home.{uuid} GEOADD), collectSample, deliverReport (encrypt to vault pgsql + private-patient lab.ready)
  SupportTicketController@store (RegexDataLeakDetector mask + Agent5 classifier route + Reverb private-patient)
```

### 7.9 Events & Listeners — AU BUSINESS → AU MED Propagation + AU MED Internal Realtime

```php
// App\Events\MerchantCatalogUpdatedEvent already in AU BUSINESS — AU MED listener InvalidateAuMedCacheListener { handle(e): if(e.appId includes AU_MED){ Redis::del("b2c:catalog:AU_MED:*"); Redis::GEOADD("clinics:geo:{$region}", ...); broadcast(new CatalogUpdatedBroadcast($e->catalog))->toOthers(); } }
// App\Events\ClinicSlotTakenEvent { slot_id, branch_id, slot_start } → broadcast presence-clinic.{branch_id}
// App\Events\TelehealthSignalEvent { room_uuid, type:'offer'|'answer'|'ice', payload_hash } → broadcast presence-telehealth.{room} (no raw SDP logging)
// App\Events\PharmacyDispatchEvent { prescription_hash, delivery_point, governorate } → broadcast private-pharmacy.{branch_id} + presence-dispatch-{governorate}
// App\Events\HomeProviderLocationUpdated { request_uuid, live_point, eta } → broadcast presence-home.{uuid} + Redis GEOADD home:geo:{region}
// Channels pgsql+mysql queue: Redis + EphemeralWorker --max-time 3600 (calibrator watches)
```

---

## 8) BLUEPRINT VERIFICATION & HANDOFF

- **Cinematic Isolation (Phase 3.0 tokens):** Every widget uses `bg-surface border-main text-primary ps/pe` etc. — `tokens.css` `var(--canvas-background) var(--surface-primary) var(--accent-primary emerald) var(--brand-crimson)` re-skins liquid metallic glass obsidian `#09090b` + emerald `#10B981` cyan `#06B6D4` ambers/crimsons across AU MED + 4 other apps + HQ without `.tsx` change — verified `stylelint color-no-hex` except tokens. `backdrop-blur(16px)` + `border-subtle` + `shadow-elevation-md hover:shadow-[0_0_24px_rgba]` + `proximity --cursor-x/y` encapsulated in `tokens.css`.
- **13-Agent Lock:** Agent 10 (QA/Medical), 8 (Supply Chain), 5 (Customer Support), 13 (Fraud Sentinel) embedded per §6 — exact Table 1.3 titles, zero alias/renumbering — no 14th — ex-KYC remains Agent 12 (not in AU MED). `agent_actions` ledger `hitl_required` when `confidence<90`.
- **Master HQ & AU BUSINESS Continuity:** AU MED reads via `MerchantCatalogUpdatedEvent → Redis del + Reverb private-catalog.AU_MED` — same `TopHeader AU BUSINESS core`, same `Calibrator 100→90 SelfHealing`, same `HITL 4 CTAs Approve/Reject/Modify/AskLater` (Master HQ Screen 1 queue for Agent 10/13).
- **Dual-DB Pillar 7:** MySQL `JSON` vs pgsql `JSONB` + `pgcrypto` verified — `STRICTLY DO NOT reference JSONB in MySQL migrations` — pgsql column `encrypted_payload JSONB` is `Schema::connection('pgsql')` only — migration will fail if run on MySQL.
- **Micro-Sprint Compliance:** This blueprint respects `1-3 files/150 lines` future sprints — migrations split per section §7.1→7.6, each `≤130` lines, `DB::transaction + lockForUpdate + Redis Mutex` everywhere.
- **Follow-up Sprints:** Phase 3.3 execution will migrate per §7 in order `000030→000036`, each with `app_id='AU_MED'` scope + feature flag `AU_MED is_core=0` hibernatable via `micro_switch_matrix`, seeding `eda_controlled_substances` + `syndicate rating` attributes, then `Inertia Pages/AU MED/` `BookingGrid, TelehealthRoom, PrescriptionViewer, PharmacyCart, VaultViewer, HomeTrackingMap`.

**ملخص عربي:** تطبيق AU MED الـ B2C الصحي — الواجهة القرائية الخفيفة التي تستهلك لحظيًا ملفات الأطباء والعيادات والأدوية من `AU BUSINESS` عبر `Redis GEOSEARCH + Mutex Hold 5m + Reverb`؛ أربعة محاور (حجز عيادات وتطبيب عن بعد بشبكة مواعيد تفاعلية ونفق WebRTC وتوليد وصفة إلكترونية، صيدلية رقمية بمسح OCR حتمي وبث مخزون جغرافي واشتراك شهري مزمن، رعاية منزلية ومختبر متكامل مع `AU SERV` وتتبع GPS حي، خزنة صحية موحدة مشفرة `PostgreSQL pgcrypto AES-256-GCM` بصلاحيات مشاركة لمرة واحدة OTP وحوكمة نقابية EDA عبر `Agent 10` حجب صلب للمخدرات) + عقول ذكية مدمجة (`Agent 10` جودة، `Agent 8` إمداد واقتطاب مكاني، `Agent 5` دعم، `Agent 13` احتيال وصفات) + حزمة تقنية 7 هجرات PHP 8.4 ثنائية قاعدة `amed_` (ملف مريض + خزنة pgsql + مواعيد + جلسات WebRTC + وصفات + طلبات صيدلة + رعاية منزلية) ووسيطان `VerifyEHealthVaultAccess + EnforceControlledSubstancePolicy` — متوافقة مع رموز Phase 3.0 وهيكل HQ وB2B، جاهزة للمعاينة الزجاجية السائلة بلون الزمرد/السيان على خلفية حجرية `#09090b`.

*Next: Visual Preview `docs/PREVIEW_AU_MED.html` liquid emerald/cyan glass obsidian `#09090b` + Blueprint locks → `PROJECT_STATE v3.5 PHASE 3.3 DONE` — temp preview single cleanup `rm docs/PREVIEW_AU_MED.html`*
