# PHASE 3.2 — AU BUSINESS Merchant & B2B Portal Blueprint (Arena Canonical)

> **Env:** `Arena` (`arena/01a09d54-drfifty`) | **Project:** `abduniproject` (`D:\Project\Projects\abduniproject`) | **Target:** `AU BUSINESS` — ONLY B2B (`ab_`) — single command center whose writes propagate realtime to 4 B2C `AU MED amed_ | AU DEALS adl_ | AU SERV asv_ | AU INVEST ainv_` | **Stack:** PHP 8.4 Laravel 12 + React 19 Inertia v2 TS 5.7 strict ZERO `any` + Tailwind v4 + Shadcn Lucide Vite 0.0.0.0 + Redis + MySQL 8.4 Spatial + Reverb 8080 | **Mode:** B2B SPEC & MIGRATION — Agent Deep Workspace Embedded (Agent 4,1,3,12,13) — No separate Part 2 | **Date:** 2026-09-15 | **Inherits:** Phase 3.0 tokens `canvas/surface/text/border/accent/crimson obsidian #09090b glassmorphic` + liquid metallic neon `cyan #06B6D4 emerald #10B981 amber #F59E0B crimson #EF4444` + 8pt `ps/pe` RTL + Phase 3.1 HQ 10 screens

> **MANDATORY CROSS-REFERENCE (Rule 1-38):** `.arenarules` v2.2 (38 Rules, 11 Pillars, 9 Modules 1-9, 13 Agents 1-13 exact, 5 Apps 1+4 Hub-and-Spoke, Micro-Sprint 1-3/150) + `PROJECT_STATE.md` v3.3 (Phase 2 PRISTINE + 3.0 Design System + 3.1 HQ) re-read and enforced — zero override, `AU BUSINESS is_core=1` non-hibernatable, 13-Agent Registry Lock preserved (Agent 4 Vendor Success, 1 CFO, 3 CMO, 12 Global Controller, 13 Fraud Sentinel embedded here; ex-KYC → Agent 12 HITL queue per lock).

---

## 0) Executive — AU BUSINESS as Single Source of Truth (B2B-Only)

```
[AU BUSINESS ab_ — B2B Command Center — WRITES] ──MerchantCatalogUpdatedEvent──► Redis Cache + Reverb ──► [AU MED] [AU DEALS] [AU SERV] [AU INVEST] — READS
                                      ▲  app_id ENUM('AU_BUSINESS',...) DEFAULT 'AU_BUSINESS' (root) + CheckMerchantSubscriptionQuota + MaskCustomerSensitiveData
                                      │  Every deal/product/clinic_slot/price/promo in AU BUSINESS is 1 writer → 4 readers — zero B2C direct writes
```

**Zero-Downtime Propagation Contract:**
- Merchant `PUT /au-business/catalogs/{id} is_hidden toggled|catalogs/bulk|deal publish` → `DB::transaction + lockForUpdate` → `event(new MerchantCatalogUpdatedEvent($catalog, $app_id, $region))` → `Listener: Redis::del("b2c:catalog:*:$region") + broadcast("catalog.updated", $payload) on private-catalog.{app_id}` → B2C screens `useEcho` invalidate `queryClient` → live re-render without reload (Reverb 8080).
- Regional cache keys `b2c:catalog:{app_id}:{governorate}:{city}:{category}` TTL 120s — invalidation is region-scoped via `merchant_branches coverage_zone POLYGON SRID4326`.
- Multi-tenant binding `merchant_multi_tenant_contexts` allows one `merchant_id` to have `app_id` rows `AU_MED+AU_DEALS` etc. — no re-auth, `X-App-Id` header toggles context (see §1).

---

## 1) CORE B2B PHILOSOPHY & CROSS-APP LIVE SYNCHRONIZATION

| Principle | Spec |
|---|---|
| **Single-Source-of-Truth** | `AU BUSINESS` is **sole writer** to `merchant_catalogs`, `merchant_deal_items`, `merchant_branches`, `zatca_tax_invoices`. B2C apps are **read replicas** via `merchant_catalogs` with `app_id` filter + `is_hidden=false` + `stock>0`. Direct B2C `POST` to catalog is `403`. |
| **Zero-Downtime Propagation** | Stock `is_hidden` toggle / `price_subunit` change / `is_urgent` deal → `MerchantCatalogUpdatedEvent` → `Redis del + Reverb` within `40ms`. B2C feed `GET /deals?governorate=Cairo` re-fetches without downtime. Offline POS buffer syncs via `merchant_pos_terminals.offline_queue` `JSON` → `Redis atomic queue` → `MySQL` when online (see §2). |
| **Multi-Tenant App Context Binding** | One merchant `merchant_multi_tenant_contexts` rows per vertical: `(merchant_id, app_id, is_active, settings JSON)`. Header `X-Merchant-Context: AU_MED` + `X-App-Id` resolves tenant — `CheckMerchantSubscriptionQuota` middleware validates `tier quota` before write (see §9.6). Single auth `merchant_users` → `user_roles app_id=AU_BUSINESS` master. |

---

## 2) SECTION 1: MERCHANT ONBOARDING, KYC & MULTI-BRANCH RBAC

### 2.1 Dynamic KYC & Credential Verification Pipeline (`deterministic OCR → Agent 12 HITL`)

**Flow:** `Step 1 CR` (Commercial Registration PDF/image) → `Step 2 Tax ID + National ID` → `Step 3 Bank/IBAN or Wallet Vodafone Cash` → `Step 4 Professional License` (Syndicate for `AU MED` doctors) → **Deterministic OCR** `Regex + ngram + checksum` pipeline (PHP `intervention/image` + `Tesseract` fallback) cross-refs `Tax ID` via `DeterministicRuleDriver` (0-cost) → if `confidence ≥0.90` auto-pass else route to **Master Admin HITL queue governed by Agent 12 (Global AI Controller & Proactive Learning Matrix)** — **ex-KYC role now merged into Agent 12** per Registry Lock. Agent 12 card format: `"Agent 12 — KYC Verification: Merchant #ID, Document CR, Confidence 0.82 <0.90 Requires HITL — Approve/Reject/Modify"` (same 4 CTAs as Screen 1 HQ).

**States:** `draft → pending_ocr → pending_hitl → verified → rejected → suspended` — `status ENUM` + `verified_at`. `Agent 12` HITL `requires_hitl=true` on `Modify KYC Terms`.

### 2.2 Multi-Branch Hierarchy & Spatial Radius Configuration

```
merchants 1──N merchant_branches (branch_name, address, governorate/city, location POINT SRID4326 NOT NULL, coverage_radius_km TINYINT, coverage_zone POLYGON SRID4326 GENERATED)
```

- **UI:** `Branch Manager` `DataTable` `Branch | Address | Governorate | Radius slider 1-50km (5 local, 50 urgent, 999 national) | Map Leaflet live POINT + POLYGON ST_Buffer(point, radius)` + `Save` → `PATCH /au-business/branches/{id}/radius`.
- **DB:** `location POINT SRID4326 STORED` + `SPATIAL INDEX`, `coverage_zone POLYGON SRID4326 GENERATED ALWAYS AS (ST_Buffer(location, radius_km*1000)) STORED` + `SPATIAL INDEX`.

### 2.3 Granular Staff RBAC & Cashier Access Control

**Roles:** `Branch Manager`, `Cashier / POS Operator`, `Inventory Clerk`, `Appointment Coordinator` — stored in `merchant_staff_roles` (`merchant_id, branch_id nullable, slug, name, permissions JSON view|execute per module 1-9`).

**Switching:** Shared terminal `Staff Switcher` `Pin-code 4-digit` `input type=password font-latin` `ps-3` + `Biometric (WebAuthn)` token `biometric_token TEXT` → `POST /au-business/staff/switch {pin, branch_id}` → `staff_action_logs` immutable (`staff_id, branch_id, action, ip, device_fingerprint, created_at`) `hash_chain`.

**Spec:** `pin_code_hash CHAR64 SHA256`, `biometric_token` encrypted `AES-256-GCM`, `is_active` toggle.

### 2.4 Unified Multi-Tenant Entity Selector (UI Widget) — Top Header

`SegmentedControl` in `AU BUSINESS` `TopBar` `center` `ps-2 pe-2` 4 pills `Clinic Management AU MED | E-Commerce Inventory AU DEALS | Service/Fleet AU SERV | Property Portfolios AU INVEST` — `active bg-accent text-on-accent neon cyan` + `is_active` dot `emerald`. **No re-auth:** `X-Merchant-Context` header switches `merchant_multi_tenant_contexts` → `Redis cache` `merchant:context:{merchant_id}:{app_id}` TTL 300s + `Reverb private-merchant.{id}`.

### 2.5 Offline-First POS Terminal Sync & Local Hardware Drivers

- **POS Terminal:** `merchant_pos_terminals` (`merchant_id, branch_id, terminal_uuid, hardware JSON {printer: EPSON-TM-T20, scanner: USB-HID}, offline_buffer JSON, last_sync_at, is_online BOOL`).
- **Sync Contract:** When `is_online=false`, `POST /pos/orders` writes to `IndexedDB offline_queue` → `Background Sync` via `Redis atomic queue` `pos:buffer:{terminal_uuid}` `LPUSH` → when online `worker` drains `BLPOP` → `DB::transaction + lockForUpdate + escrow` to `app_wallet`. `Thermal printer ESC/POS` via `WebBluetooth/USB` `navigator.bluetooth.requestDevice` + `Barcode scanner` `input scan ps-8 Lucide Scan` → `merchant_catalogs.barcode`.

**Split Payment:** `Cash (offline) | Wallet QR (app_wallet) | Credit Card (Paymob/Vodafone Cash/InstaPay/Credit)` — split `meta JSON {cash_subunit, wallet_subunit, card_subunit}` reconciled via `wallet_settlements`.

### 2.6 B2B Dashboard Executive UI Widgets — `AU BUSINESS` Command Center

`Grid-cols-12 gap-4` `bento` glass cards `bg-surface/80 backdrop-blur(12px) border-subtle shadow-elevation-md hover:shadow-[0_0_20px_rgba(6,182,212,.15)]`:

1. `Live Sales Volume` `text-title font-latin $42,500` `Δ +12% emerald sparkline` `Redis live`.
2. `Escrow Pending Release` `amber` `Lock 16` `4 deals $8,200` `progress 68%`.
3. `Active Deal Performance Matrix` `DataTable mini` `Deal | Views | Conversion | Stock` with `Agent 4 Insights` badge `AI 0-100%` (see §6).
4. `Agent 4 AI Insights Engine` (see §6) — card `bg-accent/5 border-accent/20` `Lucide Bot 14 text-accent` `Insight: Slow SKU flagged — route to Barter`.

---

## 3) SECTION 2: LIVE CATALOG, INVENTORY & DYNAMIC DEAL CREATION ENGINE

### 3.1 Universal Catalog Manager

**Unified Catalog Builder:** `merchant_catalogs` `type ENUM('physical','digital','clinical_service','rental_asset','real_estate_unit')` — single builder for products, `AU MED clinic slots`, `AU SERV service price`, `AU INVEST units`. Fields `sku, barcode, title_ar/en, description, category_id → deal_categories, attributes JSON Rule7`, `is_active, stock_quantity, price_subunit BIGINT`.

**Bulk Excel/CSV Auto-Parser:** `Upload zone` `border-dashed hover:border-accent bg-surface-secondary/30 p-8` `Lucide Upload 24` → `POST /au-business/catalogs/import {file}` streaming `Laravel Excel + chunk 500` → `Redis queue bulk:parse` → `EphemeralWorker validation` → response `errors JSON [{row: 12, col: price, error: invalid}]` flagged `crimson border` inline `DataTable` preview before `Confirm Import` (zero invalid allowed). Success → `MerchantCatalogUpdatedEvent` per row.

**Inventory Guardrails:** `low_stock_threshold INT`, `safety_stock INT`, `allow_preorder BOOL`. `Cron every 5m` `stock <= threshold → notification private-merchant` + `toast amber` + `auto is_hidden=true when stock=0` unless `allow_preorder`.

### 3.2 The 6-Axis Dynamic Deal Creation Studio

`Studio` `Tabs 6-axis` `segmented pill accent active bg-accent text-on-accent`:

| Axis (ar) | Spec | Key Fields (`merchant_deal_items`) | Propagation |
|---|---|---|---|
| **Sale/Purchase (بيع وشراء)** | Fixed price, tiered bulk `3-Tier 0/50k/500k 5%`, flash sale countdown `valid_to` | `pricing_type='fixed' price_subunit, bulk_tiers JSON, flash_until DATETIME` | `is_hidden false + Redis + Reverb` |
| **Rentals (إيجار)** | Daily/Monthly/Yearly schedules + security deposit hold `escrow holding` | `rental_schedule JSON {daily:5000, monthly:90000}, deposit_subunit` held in `escrow_clearings` `partial_milestone` | `Calendar matrix mutex lock` `service_tickets style` |
| **Bookings (حجز مواعيد)** | Time-slot matrix `30m` with `mutex lock` `lockForUpdate` for clinic/lab/service | `booking_slots JSON [{start,end,capacity,mutex_locked}]` `bookings` `POST /appointments` `Isolates AU MED PostgreSQL` `pgvector` audit | `AU MED slots` |
| **Barter (استبدال)** | Non-cash exchange `monetary_baseline_subunit 1.5x` + `barter_split 50/50` + `Agent 3 valuation` | `barter_baseline_subunit, barter_split JSON` + `b2b_swapping_requests` link | `b2b_swapping_requests status pending` |
| **Auctions & Tenders (مزادات)** | Timed bidding `valid_from/to` + `reserve_price_subunit` `bidding JSON` | `auction JSON {reserve, current_bid, bids[]}` `STRICT 503 if reserve not met` | `private-catalog` `bids` stream |
| **Urgent Deals (عروض عاجلة)** | `is_urgent=true` → `Geo-Dispatch` immediate push `presence-dispatch-{region}` + B2C push `FCM` | `is_urgent BOOL, urgent_radius_km, push_payload JSON` + `Barrier 8` `Rate 20/s` | `Reverb presence + Push` |

**Deal Publish:** `POST /au-business/deals {6-axis JSON + app_id target[AU_MED|DEALS|...]}` → `merchant_deal_items` + `deals_listings` (if `AU DEALS`) mirror → `MerchantCatalogUpdatedEvent` → B2C live.

---

## 4) SECTION 3: B2B NETWORK, BULK TRADING & INTER-MERCHANT BARTER VAULT

### 4.1 B2B Wholesale Marketplace & Inter-Pharmacy Swapping

- **Tab `B2B Trading`:** `DataTable` `Product | Stock | Expiry | Category | Listing merchant | Request swap` — filter `dead_stock (is_stagnant) | near_expiry (<90d) | excess (>2x threshold)` `auto-flagged by Agent 3`.
- **Workflow:** `POST /b2b/swapping/requests {catalog_id, quantity, counter_catalog_id nullable, type: cash|barter, notes}` → `b2b_swapping_requests` `status pending → counter_party notified private-merchant` → counter approves/rejects → `escrow_clearings B2B` `multi-party holding` until `proof_of_delivery PDF` uploaded + approved (Hitl).
- **Inter-Pharmacy Medication Exchange (Specialized):** `Regulatory check` `Agent 7 Legal` validates `Syndicate guidelines` `drug expiry >6m + valid license` → `Syndicate Registry mock` → `allow swap`.

### 4.2 B2B Escrow & Bulk Contract Vault

**Multi-party escrow** (`escrow` `type='b2b_bulk'`): `holding` until `proof JSON [delivery_note, lab_test]` + `counter verify` → `partial_milestone` release `70%` → `completed` `30%` after `48h dispute` — extends `escrow_clearings` with `b2b_contract_id`.

---

## 5) SECTION 4: IN-APP WALLET, ESCROW CLEARING & FINANCIAL LEDGER

### 5.1 Merchant Liquidity & Escrow Balance Dashboard

4 breakdowns `Inter tabular` (`bg-surface border-subtle p-4 rounded-md` glass `hover glow`):

- `Available Cashable Balance` `emerald $12,400` `font-latin` `available_subunit` (`balance - locked`).
- `Pending Escrow Holds` `amber $8,200` `4 active deals` `Lock 16`.
- `Tax Reserve (VAT)` `amber bg-amber/10 border-amber locked` `Isolated Sub-Account` via Module 16 auto `vat_rate_snapshot`.
- `Platform Fee Deductions` `text-secondary` `3-Tier 5% = $420` `progress`.

### 5.2 Automated Payout Engine (`app_wallet`)

**Methods:** `InstaPay (phone)`, `Vodafone Cash / Mobile Wallets (wallet)`, `Local Bank IBAN` — stored `merchant_payout_requests` `method ENUM, destination_encrypted AES-256-GCM, iv/tag`.

**Scheduling:** `Weekly/Monthly` cron or `Instant` → `POST /au-business/payouts {amount_subunit, method, destination}` → `CheckMerchantSubscriptionQuota` + `threshold limit` (`min 50000 subunit $500`) + `Admin risk check` (`Agent 13 Fraud flag >80% → freeze` `btn HARD-BLOCKED`) → `wallet_transactions type=withdraw holding` → `escrow_clearings released` → `wallet_settlements` append-only `hash_chain`.

### 5.3 Invoicing & E-Tax Compliance (ZATCA / ETA)

**Flow:** Every `Completed` B2B/B2C transaction → `Listener` generates `zatca_tax_invoices` `uuid, merchant_id, transaction_id, total_subunit, vat_amount, qr_data TEXT, zatca_hash CHAR64, zatca_status ENUM('pending','submitted','accepted'), eta_log JSON` → `QR Preview Modal` `canvas 200x200` cryptographic `SHA256(total+vat+merchant)` → `POST ZATCA Phase 2 / ETA` mock → `submitted` status + `private-merchant` `toast emerald`.

---

## 6) SECTION 5: COGNITIVE AI BUSINESS ADVISOR (AGENT DEEP WORKSPACE EMBEDDED)

> **Deep Workspace Guarantee:** No separate `PART2` file — agent logic is embedded directly within AU BUSINESS specs below, per protocol.

| Agent (Registry Lock) | Workspace Module in AU BUSINESS | Logic & UI |
|---|---|---|
| **Agent 4 — AI Vendor Success Officer** | **Listing Quality Inspector** (inside Catalog Manager) | Every `merchant_catalogs` save → `Agent 4` `DeterministicRuleDriver` scores `media resolution + description length ngram + SKU completeness + price vs market median` → `0-100% score` badge `emerald >80 amber 50-80 crimson <50` + `1-click Photo Enhancement` `intervention/image` background remove `POST /ai/vendor/score {catalog_id}` → `private-merchant` card "Score 62% — Add 2 images + Arabic description". |
| **Agent 3 — AI Chief Marketing Officer** | **Dynamic Price & Revenue Optimizer** + **Multi-Channel Marketing Suite** + **Inventory Liquidation & Barter Router** (inside Deal Studio & Dashboard Widget) | **Price Optimizer:** scans `AU DEALS` `deals_listings price_subunit` competitive median per `category_id + governorate` + `Agent 3` `LLM fallback <0.90` → suggests `bundle 3x 12% off => +18% yield` `Approve` → `merchant_marketing_campaigns`. **Marketing Suite:** `1-click Generate` Arabic/English `ad_copy` `WhatsApp/Meta/Instagram/TikTok` via `AgentStrategyManager` `Cloud|LocalGpu` → `campaigns schedule JSON {channels, audience_segment, copy, budget}` + `Scheduler`. **Liquidation Router:** `Cron every 30m` flags `slow SKU stock>90d || near_expiry <30d` + `is_stagnant` → builds `liquidation deal 50% + barter vault route auto` → `Card amber` "5 SKUs flagged — Auto-liquidate?" `Approve → B2B BarterVault`. |
| **Agent 1 — AI CFO** | **ZATCA / ETA Tax Compliance Engine** (inside Financial Ledger) | `Agent 1` generates `zatca_tax_invoices` QR `SHA256 + ECDSA mock` + `eta submission logs` `JSON` → `Compliance badge emerald` if `accepted`. Budget `token/latency` tracked in TopRow (Screen 1 HQ) but widget shows `Tax due $1,200` `Inter`. |
| **Agent 12 — Global AI Controller & Proactive Learning Matrix** | **KYC HITL Governor + AU Lite Auto-Freeze** (inside §2.1 + Dashboard) | Governs **all KYC HITL queues** → card `Agent 12 — KYC Verification` + enforces `AU Lite Auto-Freeze ON` toggle → when `health 90%` auto-hibernates `AU_MED/DEALS` via `feature_flags`. No separate KYC agent. |
| **Agent 13 — AI Fraud & AML Sentinel** | **Payout Risk Guard** (inside §5.2 + Abandoned earlier) | `>80% risk wallet` detection → `Flag` `amber dot` + `Freeze Suspicious Escrow Release ON` switch (enabled) → `Seize User Balances HARD-BLOCKED` `opacity-40 lock` per Oil6 — `Agent 13` never seizes. Triggers `private-hitl fraud` `Risk High crimson`. |

**Token/Motion:** Agent cards `bg-accent/5 border-accent/20 backdrop-blur` `cyan glow` + `floating translate-y-1` on suggestion.

---

## 7) SECTION 6: CRM, ORDER & SERVICE FULFILLMENT HUB

### 7.1 Unified Order Command Center — Kanban

`Kanban 5 columns` `grid-cols-5 gap-4` `min-w-[900px] overflow-x-auto` glass `bg-canvas p-4 rounded-lg`:

`Pending Approval amber dot` → `Preparing / In-Progress blue` → `Out for Delivery / Scheduled cyan (map point live)` → `Completed emerald` → `Disputed crimson` — `Drag card` → `PATCH /au-business/orders/{id}/status` → `Realtime private-merchant` `order.updated`. Card `bg-surface border-subtle rounded-md p-3 shadow-elevation-sm hover:shadow-md` `order_uuid font-latin text-micro text-secondary` + `Customer masked name` (`MaskCustomerSensitiveData` until escrow holding) + `Amount Inter`.

### 7.2 Real-time Customer Chat & Support Escalation

**Window:** `Chat` `bg-surface border-subtle rounded-md h-[520px] flex-col` `Header Customer name masked` `Messages` `ps-4 pe-4 py-4 overflow-auto` `bubble` `Reverb private-merchant.chat.{order_id}`. **Regex Masking:** Middleware `MaskCustomerSensitiveData` applies `RegexDataLeakDetector` `phone/email/wa.me/url` → `[محمي]` in real-time before persist (100% block). **Escalate:** `Button Ghost border-amber text-amber` "Escalate to Platform Dispute" `Lucide ShieldAlert` → `POST /au-business/disputes {order_id}` → `Agent 10/13 brief` → `Master HQ Screen 6` queue.

---

## 8) SECTION 7: SUBSCRIPTION TIERS, DEALS QUOTAS & BOOSTERS

### 8.1 Merchant Tier Management

**Tiers:** `FREE`, `SILVER`, `GOLD`, `PLATINUM` stored `merchant_subscriptions` `tier ENUM, listing_quota, notification_quota, rank_multiplier DECIMAL(4,2)`.

| Tier | Listing Quota | WA Notification Quota | Rank Multiplier | Renewal |
|------|---------------|----------------------|-----------------|---------|
| FREE | 20 | 100/mo | 1.0x | — |
| SILVER | 100 | 1,000/mo | 1.2x | 30d $29 |
| GOLD | 500 | 5,000/mo | 1.5x | 30d $79 |
| PLATINUM | 2,000 | 20,000/mo | 2.0x | 30d $199 |

**UI:** `DataTable` `Tier Cards` `bg-surface border-subtle rounded-lg p-6` `active border-accent bg-accent/5 neon cyan` + `Subscribe` `Primary` → `POST /au-business/subscriptions {tier}` → `CheckMerchantSubscriptionQuota` blocks if `active_listings >= quota` → `Toast crimson` "Quota exceeded — Upgrade".

### 8.2 Sponsored Keyword & Geolocation Boosters

**Bidding Portal:** `Tabs Keyword | GeoBoost` `Segmented`.

- **Keyword Booster:** `Auction Input` `Keyword e.g., 'cardiology'` + `Bid per click subunit` `Slider 100-5000` + `Budget cap` + `Sponsored badge` `amber bg-amber/10` on B2C `search feed` top `sticky`.
- **Geo-Booster:** `Extend Radius +20km for 7d` `Slider` + `Heatmap preview` `Leaflet` + `Cost $10` `Purchase` → `PATCH /au-business/branches/{id}/boost {extra_km, days}` → active until `boost_expires_at` → `ST_Buffer` enlarged.

---

## 9) TECHNICAL DELIVERABLES & DATABASE MIGRATIONS SPECIFICATION (Executable Laravel PHP 8.4 + Eloquent + Inertia + Reverb)

> **Generation Rule (Pillar 11):** Every write `DB::transaction + lockForUpdate + Redis Mutex + hasAppIdScope trait` — `Rule 11` additive only, `Rule 7` `JSON` not `JSONB`, MySQL 8.4 `InnoDB utf8mb4_unicode_ci` `SPATIAL` `FULLTEXT ngram` where needed, PostgreSQL only for `AU MED`.

### 9.0 Common Traits & Enums

```php
// app/Modules/Shared/Traits/HasAppIdScope.php — enforced on all merchant models
trait HasAppIdScope { protected static function booted(){ static::addGlobalScope('app', fn($q)=>$q->where('app_id', request()->header('X-App-Id', 'AU_BUSINESS'))); } }
// Enums: AppId {AU_BUSINESS, AU_MED, AU_DEALS, AU_SERV, AU_INVEST}, MerchantStatus, PayoutMethod, B2bStatus, CampaignChannel
```

### 9.1 `merchants` & `merchant_branches` — KYC + Spatial Radius

```php
// database/migrations/2026_09_15_000020_create_merchants_table.php — PHP 8.4 strict — IN-PLACE for AU BUSINESS
return new class extends Migration {
 public function up(): void {
  Schema::create('merchants', function(Blueprint $t){
   $t->id(); $t->char('uuid',36)->unique();
   $t->foreignId('user_id')->constrained('users')->cascadeOnDelete(); // owner (merchant account)
   $t->enum('app_id',['AU_BUSINESS','AU_MED','AU_DEALS','AU_SERV','AU_INVEST'])->default('AU_BUSINESS')->index();
   $t->string('business_name',150); $t->string('business_name_ar',150);
   $t->string('cr_number',80)->nullable(); // Commercial Registration
   $t->string('tax_id',80)->nullable()->index(); // cross-ref deterministic
   $t->string('national_id',80)->nullable();
   $t->text('bank_details_encrypted')->nullable()->comment('AES-256-GCM IBAN');
   $t->string('payout_method',32)->default('bank'); // bank|instapay|vodafone_cash
   $t->enum('kyc_status',['draft','pending_ocr','pending_hitl','verified','rejected','suspended'])->default('draft')->index();
   $t->decimal('kyc_confidence',5,2)->nullable(); // <0.90 → Agent 12 HITL
   $t->json('kyc_documents')->nullable()->comment('CR, Tax, License JSON array');
   $t->json('settings')->nullable(); // multi-vertical preferences
   $t->timestamps(); $t->softDeletes();
   $t->unique(['user_id','app_id']);
  });
  Schema::create('merchant_branches', function(Blueprint $t){
   $t->id(); $t->char('uuid',36)->unique();
   $t->foreignId('merchant_id')->constrained('merchants')->cascadeOnDelete();
   $t->string('branch_name',120); $t->string('address',500);
   $t->string('governorate',80); $t->string('city',80);
   $t->point('location',4326); // NOT NULL — spatial
   $t->tinyInteger('coverage_radius_km')->unsigned()->default(5);
   $t->polygon('coverage_zone',4326)->nullable()->comment('ST_Buffer(location, radius)');
   $t->boolean('is_active')->default(true)->index();
   $t->dateTime('boost_expires_at')->nullable();
   $t->smallInteger('boost_extra_km')->unsigned()->default(0);
   $t->timestamps();
  });
  try{ DB::statement('ALTER TABLE merchant_branches ADD SPATIAL INDEX spx_branch_location (location)'); }catch(Throwable $e){}
  try{ DB::statement('ALTER TABLE merchant_branches ADD SPATIAL INDEX spx_branch_zone (coverage_zone)'); }catch(Throwable $e){}
  DB::statement("ALTER TABLE merchants ADD CONSTRAINT chk_merch_kyc CHECK (kyc_confidence IS NULL OR kyc_confidence BETWEEN 0 AND 100)");
 }
 public function down(): void { Schema::dropIfExists('merchant_branches'); Schema::dropIfExists('merchants'); }
};
// Models
// App\Models\Merchant extends Model { use HasAppIdScope, SoftDeletes; fillable business_name, cr_number, tax_id, kyc_status, casts json, appends is_verified => kyc_status==='verified'; relation branches():HasMany, staffRoles():HasMany, catalogs():HasMany }
// App\Models\MerchantBranch extends Model { use HasFactory; casts location POINT, coverage_zone POLYGON; scopeWithinRadius($q, $lat,$lng,$km) => whereRaw("ST_Distance_Sphere(location, POINT(?,?)) <= ?*1000", [$lng,$lat,$km]); }
```

**Controller:** `App\Modules\AUBusiness\Http\Controllers\User\MerchantController@update, branchRadius` — `DB::transaction + lockForUpdate` + `MerchantCatalogUpdatedEvent` after branch radius.

### 9.2 `merchant_staff_roles` & `staff_action_logs` — RBAC + Cashier Pin + Biometric

```php
Schema::create('merchant_staff_roles', function(Blueprint $t){
 $t->id(); $t->char('uuid',36)->unique();
 $t->foreignId('merchant_id')->constrained('merchants')->cascadeOnDelete();
 $t->foreignId('branch_id')->nullable()->constrained('merchant_branches')->nullOnDelete();
 $t->string('slug',80); $t->string('name',120); $t->string('name_ar',120);
 $t->json('permissions')->nullable()->comment('view|execute per module 1-9 + app_id');
 $t->string('pin_code_hash',64)->nullable()->comment('SHA256 4-digit');
 $t->text('biometric_token')->nullable()->comment('WebAuthn + AES-GCM');
 $t->boolean('is_active')->default(true);
 $t->timestamps(); $t->unique(['merchant_id','slug','branch_id']);
 DB::statement("ALTER TABLE merchant_staff_roles ADD CONSTRAINT chk_staff_pin CHECK (pin_code_hash IS NULL OR LENGTH(pin_code_hash)=64)");
});
Schema::create('staff_action_logs', function(Blueprint $t){
 $t->id(); $t->char('uuid',36)->unique();
 $t->foreignId('staff_role_id')->constrained('merchant_staff_roles')->cascadeOnDelete();
 $t->foreignId('branch_id')->nullable()->constrained('merchant_branches')->nullOnDelete();
 $t->string('action',120); $t->string('ip_address',45)->nullable();
 $t->string('device_fingerprint',128)->nullable();
 $t->char('hash_prev',64)->nullable(); $t->char('hash_current',64)->comment('SHA256 chain immutable');
 $t->json('payload')->nullable(); $t->timestamps();
 $t->index(['staff_role_id','created_at']); $t->index('action');
});
// TRIGGER immutability: BEFORE UPDATE/DELETE SIGNAL SQLSTATE 45000 'staff_action_logs immutable'
```

### 9.3 `merchant_catalogs` & `merchant_deal_items` — SKUs, 6-Axis Pricing, Rental, Barter Baselines

```php
Schema::create('merchant_catalogs', function(Blueprint $t){
 $t->id(); $t->char('uuid',36)->unique();
 $t->foreignId('merchant_id')->constrained('merchants')->cascadeOnDelete();
 $t->foreignId('branch_id')->nullable()->constrained('merchant_branches')->nullOnDelete();
 $t->enum('app_id',['AU_BUSINESS','AU_MED','AU_DEALS','AU_SERV','AU_INVEST'])->default('AU_BUSINESS')->index();
 $t->enum('type',['physical','digital','clinical_service','rental_asset','real_estate_unit'])->default('physical')->index();
 $t->string('sku',80); $t->string('barcode',80)->nullable()->index();
 $t->string('title',255); $t->string('title_ar',255);
 $t->foreignId('category_id')->nullable()->constrained('deal_categories')->nullOnDelete();
 $t->text('description')->nullable(); $t->json('attributes')->nullable(); // Rule7
 $t->bigInteger('price_subunit')->unsigned();
 $t->string('currency',8)->default('EGP');
 $t->integer('stock_quantity')->unsigned()->default(0)->index();
 $t->integer('low_stock_threshold')->unsigned()->default(5);
 $t->integer('safety_stock')->unsigned()->default(2);
 $t->boolean('allow_preorder')->default(false);
 $t->boolean('is_active')->default(true)->index(); $t->boolean('is_hidden')->default(false)->index();
 $t->json('media')->nullable(); // urls
 $t->decimal('listing_quality_score',5,2)->default(0)->comment('Agent 4 0-100');
 $t->timestamps(); $t->softDeletes();
 $t->unique(['merchant_id','sku']); $t->unique(['barcode']);
 DB::statement("ALTER TABLE merchant_catalogs ADD FULLTEXT ft_catalog_title (title, description) WITH PARSER ngram");
 DB::statement("ALTER TABLE merchant_catalogs ADD CHECK (price_subunit>0)");
 DB::statement("ALTER TABLE merchant_catalogs ADD CHECK (attributes IS NULL OR JSON_VALID(attributes))");
});
Schema::create('merchant_deal_items', function(Blueprint $t){
 $t->id(); $t->char('uuid',36)->unique();
 $t->foreignId('catalog_id')->constrained('merchant_catalogs')->cascadeOnDelete();
 $t->enum('axis',['sale','rental','booking','barter','auction','urgent'])->default('sale')->index();
 $t->bigInteger('price_subunit')->unsigned();
 $t->json('bulk_tiers')->nullable(); // 3-Tier
 $t->json('rental_schedule')->nullable(); // {daily, monthly, yearly, deposit}
 $t->json('booking_slots')->nullable(); // [{start,end,capacity,mutex_locked}]
 $t->bigInteger('barter_baseline_subunit')->unsigned()->nullable();
 $t->json('barter_split')->nullable(); // 50/50
 $t->json('auction')->nullable(); // {reserve, current_bid, bids[]}
 $t->boolean('is_urgent')->default(false)->index();
 $t->smallInteger('urgent_radius_km')->unsigned()->nullable();
 $t->dateTime('valid_from')->nullable(); $t->dateTime('valid_to')->nullable()->index();
 $t->json('push_payload')->nullable();
 $t->timestamps();
});
// Controllers: MerchantCatalogController@index(store bulk import), store, update, toggleHidden, importBulk (Excel chunk, Agent 4 score), DealStudioController@publish6Axis (validates 6-axis JSON, creates merchant_deal_items, fires MerchantCatalogUpdatedEvent + is_urgent push presence-dispatch)
```

### 9.4 `b2b_swapping_requests` — Inter-Merchant Bulk Exchange

```php
Schema::create('b2b_swapping_requests', function(Blueprint $t){
 $t->id(); $t->char('uuid',36)->unique();
 $t->foreignId('requester_merchant_id')->constrained('merchants')->cascadeOnDelete();
 $t->foreignId('counter_merchant_id')->nullable()->constrained('merchants')->nullOnDelete();
 $t->foreignId('requester_catalog_id')->constrained('merchant_catalogs')->cascadeOnDelete();
 $t->foreignId('counter_catalog_id')->nullable()->constrained('merchant_catalogs')->nullOnDelete();
 $t->integer('quantity')->unsigned();
 $t->enum('type',['cash','barter','swap'])->default('swap');
 $t->bigInteger('cash_amount_subunit')->unsigned()->nullable();
 $t->enum('status',['pending','counter_review','approved','rejected','escrow_holding','completed'])->default('pending')->index();
 $t->json('regulatory_check')->nullable()->comment('Agent 7 Syndicate validation');
 $t->json('proof_of_delivery')->nullable();
 $t->foreignId('escrow_id')->nullable()->constrained('escrow_clearings')->nullOnDelete();
 $t->timestamps();
});
```

### 9.5 `merchant_payout_requests` & `wallet_settlements` — `app_wallet` Integration

```php
Schema::create('merchant_payout_requests', function(Blueprint $t){
 $t->id(); $t->char('uuid',36)->unique();
 $t->foreignId('merchant_id')->constrained('merchants')->cascadeOnDelete();
 $t->enum('app_id',['AU_BUSINESS','AU_MED','AU_DEALS','AU_SERV','AU_INVEST'])->default('AU_BUSINESS');
 $t->enum('method',['instapay','vodafone_cash','bank'])->default('bank');
 $t->text('destination_encrypted')->comment('AES-256-GCM IBAN/phone');
 $t->string('destination_iv',64); $t->string('destination_tag',64);
 $t->bigInteger('amount_subunit')->unsigned();
 $t->string('currency',8)->default('EGP');
 $t->enum('status',['pending','risk_review','approved','rejected','settled'])->default('pending')->index();
 $t->decimal('risk_score',5,2)->nullable()->comment('Agent 13 Fraud >80 freeze');
 $t->json('meta')->nullable();
 $t->timestamps();
 DB::statement("ALTER TABLE merchant_payout_requests ADD CHECK (amount_subunit>=50000)"); // threshold $500
});
Schema::create('wallet_settlements', function(Blueprint $t){
 $t->id(); $t->char('uuid',36)->unique();
 $t->foreignId('merchant_id')->constrained('merchants')->cascadeOnDelete();
 $t->foreignId('wallet_id')->constrained('app_wallets')->cascadeOnDelete();
 $t->foreignId('payout_request_id')->nullable()->constrained('merchant_payout_requests')->nullOnDelete();
 $t->enum('type',['payout','refund','fee','tax_reserve'])->default('payout');
 $t->bigInteger('amount_subunit'); // signed
 $t->bigInteger('balance_after_subunit');
 $t->char('hash_prev',64)->nullable(); $t->char('hash_current',64);
 $t->json('meta')->nullable();
 $t->timestamps(); $t->index(['wallet_id','created_at']);
});
// TRIGGER immutable on wallet_settlements: no UPDATE/DELETE
// Controller: MerchantPayoutController@store (CheckMerchantSubscriptionQuota + Agent13 risk check + threshold) → DB::transaction + lockForUpdate app_wallets + Redis Mutex merchant:{id}:payout + Mask destination
```

### 9.6 API Middleware — `CheckMerchantSubscriptionQuota` & `MaskCustomerSensitiveData`

```php
// app/Http/Middleware/CheckMerchantSubscriptionQuota.php
public function handle(Request $r, Closure $next){
 $merchant = Merchant::where('user_id', $r->user()->id)->where('app_id','AU_BUSINESS')->firstOrFail();
 $tier = $merchant->subscription->tier ?? 'FREE';
 $quota = config("tiers.$tier.listing_quota"); // FREE 20, SILVER 100, GOLD 500, PLATINUM 2000
 $active = MerchantCatalog::where('merchant_id',$merchant->id)->where('is_active',1)->where('is_hidden',0)->count();
 if($active >= $quota) return response()->json(['code'=>'quota_exceeded','message'=>'Listing quota exceeded — Upgrade '.$tier], 403);
 return $next($r);
}
// app/Http/Middleware/MaskCustomerSensitiveData.php
public function handle(Request $r, Closure $next){
 $response = $next($r);
 if($r->user() && ! $r->user()->can('customer.unmasked.view')){
  $data = $response->getData(true);
  $masked = app(RegexDataLeakDetector::class)->sanitize(json_encode($data), isPostEscrow: $this->isPostEscrow($r));
  $response->setData(json_decode($masked->sanitized, true));
 }
 return $response;
}
// Routes (excerpt) routes/api/v1/au_business.php
// Route::middleware(['auth:jwt','can:merchant.view','X-App-Id:AU_BUSINESS'])->group(function(){
//  Route::apiResource('merchants', MerchantController::class);
//  Route::patch('branches/{id}/radius', [MerchantBranchController::class,'updateRadius']);
//  Route::post('catalogs/import', [MerchantCatalogController::class,'importBulk']); // CheckMerchantSubscriptionQuota
//  Route::post('deals/publish', [DealStudioController::class,'publish']); // 6-axis
//  Route::post('b2b/swaps', [B2bSwappingController::class,'store']);
//  Route::post('payouts', [MerchantPayoutController::class,'store'])->middleware('mask.customer');
// });
```

### 9.7 `merchant_multi_tenant_contexts` & `merchant_pos_terminals` — Multi-Vertical Bindings, Cashier Shifts, Offline Buffer, Hardware Drivers

```php
Schema::create('merchant_multi_tenant_contexts', function(Blueprint $t){
 $t->id(); $t->foreignId('merchant_id')->constrained('merchants')->cascadeOnDelete();
 $t->enum('app_id',['AU_BUSINESS','AU_MED','AU_DEALS','AU_SERV','AU_INVEST']);
 $t->boolean('is_active')->default(true); $t->json('settings')->nullable(); // vertical prefs
 $t->timestamps(); $t->unique(['merchant_id','app_id']);
});
Schema::create('merchant_pos_terminals', function(Blueprint $t){
 $t->id(); $t->char('uuid',36)->unique();
 $t->foreignId('merchant_id')->constrained('merchants')->cascadeOnDelete();
 $t->foreignId('branch_id')->constrained('merchant_branches')->cascadeOnDelete();
 $t->string('terminal_name',120);
 $t->json('hardware')->nullable()->comment('{printer: EPSON-TM-T20, scanner: USB-HID, driver: ESC/POS}');
 $t->json('offline_buffer')->nullable()->comment('IndexedDB queue JSON when is_online=false');
 $t->boolean('is_online')->default(true)->index();
 $t->dateTime('last_sync_at')->nullable();
 $t->json('current_shift')->nullable()->comment('{staff_role_id, opened_at, cash_subunit}');
 $t->timestamps();
});
```

### 9.8 `merchant_marketing_campaigns` & `zatca_tax_invoices` — Agent 3 Ads, ZATCA Phase 2

```php
Schema::create('merchant_marketing_campaigns', function(Blueprint $t){
 $t->id(); $t->char('uuid',36)->unique();
 $t->foreignId('merchant_id')->constrained('merchants')->cascadeOnDelete();
 $t->enum('app_id',['AU_BUSINESS','AU_MED','AU_DEALS','AU_SERV','AU_INVEST'])->default('AU_BUSINESS');
 $t->string('name',150); $t->json('channels')->comment('["whatsapp","meta","instagram","tiktok"]');
 $t->json('audience_segment')->nullable(); $t->text('ad_copy_ar')->nullable(); $t->text('ad_copy_en')->nullable();
 $t->json('schedule')->nullable()->comment('{start, end, budget_subunit, agent:3}');
 $t->enum('status',['draft','scheduled','active','paused','completed'])->default('draft')->index();
 $t->json('performance')->nullable()->comment('{impressions, clicks, conversions}');
 $t->timestamps();
});
Schema::create('zatca_tax_invoices', function(Blueprint $t){
 $t->id(); $t->char('uuid',36)->unique();
 $t->foreignId('merchant_id')->constrained('merchants')->cascadeOnDelete();
 $t->foreignId('transaction_id')->nullable()->comment('references escrow_clearings or deals');
 $t->string('invoice_number',80)->unique();
 $t->bigInteger('total_subunit')->unsigned(); $t->bigInteger('vat_amount_subunit')->unsigned();
 $t->text('qr_data')->comment('Base64 QR PNG'); $t->char('zatca_hash',64)->comment('SHA256+ECDSA');
 $t->enum('zatca_status',['pending','submitted','accepted','rejected'])->default('pending')->index();
 $t->json('eta_log')->nullable()->comment('ETA submission logs');
 $t->timestamps();
});
// Agent 3 generates ad_copy via AgentStrategyManager Cloud|LocalGpu when Deterministic confidence <0.90
// Agent 1 generates QR + zatca_hash: SHA256(total+vat+merchant_id+invoice_number) + ECDSA mock
```

### 9.9 `merchant_dashboard_widgets` & `inventory_liquidation_alerts` — Custom UI Configs + Excess Stock Triggers

```php
Schema::create('merchant_dashboard_widgets', function(Blueprint $t){
 $t->id(); $t->foreignId('merchant_id')->constrained('merchants')->cascadeOnDelete();
 $t->string('widget_key',80); // live_sales, escrow_pending, deal_matrix, agent4_insights
 $t->smallInteger('position')->unsigned()->default(0);
 $t->json('config')->nullable()->comment('{kpi, refresh_interval, is_visible}');
 $t->timestamps(); $t->unique(['merchant_id','widget_key']);
});
Schema::create('inventory_liquidation_alerts', function(Blueprint $t){
 $t->id(); $t->char('uuid',36)->unique();
 $t->foreignId('merchant_id')->constrained('merchants')->cascadeOnDelete();
 $t->foreignId('catalog_id')->constrained('merchant_catalogs')->cascadeOnDelete();
 $t->enum('reason',['slow_moving','near_expiry','overstock','stagnant_24h'])->index();
 $t->integer('stock_at_alert')->unsigned();
 $t->date('expiry_at')->nullable();
 $t->enum('action',['liquidation_deal','barter_vault','preorder_toggle'])->default('liquidation_deal');
 $t->enum('status',['pending','approved','rejected','auto_routed'])->default('pending')->index();
 $t->char('ai_score_hash',64)->nullable()->comment('Agent 3 valuation hash');
 $t->timestamps();
});
// Cron every 30m: flag slow SKU stock>90d || near_expiry <30d || stagnant_24h → insert liquidation alert → private-merchant toast amber → Approve → creates merchant_deal_items liquidation 50% or b2b_swapping_requests
```

### 9.10 Eloquent Models (Excerpt — Strict Types PHP 8.4)

```php
// App\Models\Merchant — HasAppIdScope, SoftDeletes, casts: kyc_documents=>array, settings=>array, appends is_verified
// MerchantBranch — casts location=>Point, coverage_zone=>Polygon, scopeWithinCoverage($q, $lat,$lng) => ST_Contains(coverage_zone, POINT(lng,lat))
// MerchantCatalog — HasAppIdScope, SoftDeletes, fillable sku,barcode,title,price_subunit, casts attributes/media=>array, scopeActive, scopeUrgent
// MerchantStaffRole — fillable slug, pin_code_hash, biometric_token (encrypted), casts permissions=>array
// B2bSwappingRequest — fillable quantity, type, status, casts regulatory_check=>array, relation escrow()
// ZatcaTaxInvoice — appends qrPreviewUrl, scopeAccepted
```

### 9.11 API Controllers (Skeleton — Action-Service-Repository)

```
App\Modules\AUBusiness\Http\Controllers\User\
  MerchantController@index, store(KYC), update, verifyCallback (Agent12 HITL)
  MerchantBranchController@store, updateRadius (spatial), indexWithinRadius
  MerchantStaffController@storeRole, switchStaff (pin+biometric → staff_action_logs chain), logs
  MerchantCatalogController@index (DataTable), store, update, toggleHidden (fires MerchantCatalogUpdatedEvent), importBulk (Excel chunk Agent4 score)
  DealStudioController@publish (6-axis validates Sale|Rental|Booking|Barter|Auction|Urgent → merchant_deal_items + MerchantCatalogUpdatedEvent + is_urgent push)
  B2bSwappingController@index, store, approve (Agent7 regulatoryCheck)
  MerchantPayoutController@store (threshold 50000 + Agent13 risk >80 freeze + mask), index Settlements
  MerchantMarketingController@generateCopy (Agent3), scheduleCampaign
  ZatcaInvoiceController@showQR, verify, etaLog
```

### 9.12 Events & Listeners — Propagation Contract

```php
// App\Events\MerchantCatalogUpdatedEvent { public MerchantCatalog $catalog; public string $appId; public ?string $region; }
// App\Listeners\InvalidateB2cCacheListener { handle(e): Redis::del("b2c:catalog:*:$region"); broadcast(new CatalogUpdatedBroadcast($e->catalog))->toOthers(); }
// Channels: private-catalog.{app_id} + private-merchant.{merchant_id} + presence-dispatch-{region} (urgent)
// Queue: Redis + EphemeralWorker --max-time 3600
```

---

## 10) BLUEPRINT VERIFICATION & HANDOFF

- **Cinematic Isolation:** Every UI widget above uses `bg-surface border-main text-primary ps/pe` etc. — `tokens.css` re-skins liquid metallic glass obsidian `#09090b` + neon glows across AU BUSINESS + all 5 apps without `.tsx` change — verified `stylelint color-no-hex` except tokens.
- **13-Agent Lock:** Agent 4,1,3,12,13 embedded per §6 — ex-KYC → Agent 12 HITL queue — no 14th.
- **Master HQ Continuity:** AU BUSINESS writes → B2C reads via `MerchantCatalogUpdatedEvent` → `Reverb private-catalog` — same `TopHeader` `AU BUSINESS` core, same `Calibrator 100→90`, same `HITL 4 CTAs`.
- **Micro-Sprint Compliance:** This blueprint respects `1-3 files/150 lines` future sprints — migrations split per section (e.g., `merchants+branches` 1 file ≤120 lines, `catalogs+deal_items` 1 file ≤130).
- **Follow-up Sprints:** Phase 3.2 execution will migrate per §9 in order 9.1→9.9, each with `DB::transaction + lockForUpdate`, seeding `feature_flags` `AU BUSINESS is_core=1`.

**ملخص عربي:** بوابة AU BUSINESS الـ B2B الوحيدة — الكاتب المركزي الوحيد الذي ينشر فورًا عبر Redis+Reverb إلى 4 تطبيقات B2C؛ 7 أقسام (تحقق هوية + فروع مكانية + طاقم PIN/بصمة + محدد متعدد المستأجرين + نقاط بيع تعمل بدون إنترنت + لوحة KPIs، كتالوج موحد واستيراد Excel ومحركات عروض سداسية، سوق جملة ومقايضة أدوية، محفظة وتسويات وضرائب ZATCA/ETA، مستشار ذكي مدمج 13 وكيل (4 جودة، 3 تسعير/تسويق/تصفية، 1 ضرائب، 12 تحقق، 13 احتيال)، طلبات وفولفيلمنت مع حجب Regex، اشتراكات وquota وتعزيزات) + حزمة تقنية 9 هجرات PHP 8.4 نماذج ومتحكمات ووسيطين ومتعدد المستأجرين ومحطات نقاط بيع وحملات وضرائب وتنبيهات تصفية — متوافقة مع Phase 3.0 الرموز وPhase 3.1 القيادة، جاهزة للمعاينة الحية.

*Next: Visual Preview `docs/PREVIEW_AU_BUSINESS.html` + `PROJECT_STATE v3.4`*
