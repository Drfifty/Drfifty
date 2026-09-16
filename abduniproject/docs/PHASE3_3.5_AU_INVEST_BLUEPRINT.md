# PHASE 3.5 — AU INVEST Wealth, Real Estate & Franchise Platform Blueprint (Arena Canonical)

> **Env:** `Arena` (`arena/01a09d54-drfifty`) | **Project:** `abduniproject` (`D:\Project\Projects\abduniproject` — lowercase) | **Target:** `AU INVEST` — B2C & B2B Real Estate, Franchises, Business Equity & Wealth Management (`ainv_`) — dedicated investment & capital deployment ecosystem | **Stack:** PHP 8.4 Laravel 12 + React 19 Inertia v2 TS 5.7 strict ZERO `any` + Tailwind v4 + Shadcn Lucide Vite 0.0.0.0 + Redis + MySQL 8.4 Spatial + Reverb 8080 wss | **Mode:** INVESTMENT PLATFORM SPEC MODE — Agent Deep Workspace Embedded (Agent 1, 3, 7, 13) — No separate Part 2 | **Date:** 2026-09-15 | **Inherits:** Phase 3.0 Design System hybrid `obsidian #09090b + Neo-White #FAFAFA` + Phase 3.1 HQ 10 screens + Phase 3.2 AU BUSINESS `MerchantCatalogUpdatedEvent` + Phase 3.3 pgsql vault pattern + Phase 3.4 Neo-White marketplace | **Legal:** SPV (Special Purpose Vehicle) share register + Egyptian franchise/real-estate compliance via Agent 7 | **Barter Calibration:** Module 5/9 1.5x/1x bound where non-cash valuations intersect (equipment barter)

> **MANDATORY CROSS-REFERENCE (Rules 1-38):** `.arenarules` v2.2 (38 Rules, 11 Pillars, 9 Modules 1-9, 13 Agents Table 1.3 exact, 5 Apps Hub-and-Spoke `AU BUSINESS ab_ core + amed_/adl_/asv_/ainv_`, Micro-Sprint 1-3/150) + `PROJECT_STATE.md` v3.6-clean (`PHASE 3.4 CLEAN & LOCKED rm PREVIEW_AU_DEALS.html verified`) re-read and enforced — zero override, `AU BUSINESS is_core=1` non-hibernatable, `AU INVEST ainv_` is `AU BUSINESS` read replica via `X-App-Id: AU_INVEST` for developer/merchant investment offerings, 13-Agent Registry Lock preserved (Agent 1 → portfolio & yield cash-flow, Agent 3 → feasibility & growth, Agent 7 → legal screening & SPV compliance, Agent 13 → KYC/AML & Sybil; no 14th, no alias). Portfolio cash-flow belongs strictly to Agent 1, feasibility to Agent 3, legal screening to Agent 7, AML guarding to Agent 13.

---

## 0) Executive — AU INVEST as Dedicated Capital Deployment Ecosystem

```
[AU BUSINESS ab_ — WRITES] ─MerchantCatalogUpdatedEvent→ Redis del b2c:catalog:AU_INVEST:* + Reverb private-catalog.AU_INVEST ─→ [AU INVEST ainv_ — READS + INVESTOR ACTIONS]
      merchant_catalogs type real_estate_unit/rental_asset (property, franchise, equipment asset)
      merchant_branches POINT/POLYGON coverage_zone ─GIS─→ AU INVEST spatial mapping
      merchant_deal_items rental/booking/barter/auction for equipment leasing
      ↓
[AU INVEST B2B2C] real_estate_listings + property_milestones + fractional_shares + franchise_opportunities/applications + equity_campaigns/investments/revenue_payouts + investment_contracts/kyc + secondary_share_order_book/spv_registries + investor_aml_audit_logs/capital_call_schedules
      ↑ app_wallet escrow (threshold-lock) + escrow_clearings staged milestone releases + SPV digital share ledger + Reverb live + AU DEALS commercial leasing flag + AU SERV facility dispatch
      ↑ Agent 1/3/7/13 inline (no separate file) + Calibrator 100→90 SelfHealing
```

**Deployment Contract:** `AU INVEST` never writes `merchant_catalogs` directly — all property/franchise/equipment offerings originate in `AU BUSINESS` as `merchant_catalogs type=real_estate_unit|rental_asset` with `merchant_deal_items rental_schedule` and propagate ≤40ms via `MerchantCatalogUpdatedEvent → Redis GEO + Reverb`. If `is_hidden` or `stock` zero in `AU BUSINESS`, `AU INVEST` invalidates `b2c:catalog:AU_INVEST:{governorate}` + `fractional_shares is_tradeable=false` + `secondary order book pause`. Investor funds are `app_wallet` `escrow_clearings type investment holding` threshold-locked until `minimum funding met` or `milestone AI/HITL verified` before release to founders. `AU DEALS` commercial leasing flag `is_commercial_leasable` exposes AU INVEST units to `AU DEALS` feed; `AU SERV` facility management `service_tickets` dispatch for leased assets.

---

## 1) CORE INVESTMENT PHILOSOPHY & ECOSYSTEM INTEGRATION

### 1.1 Multi-Asset Investment Hub — 4 Capital Deployment Verticals

| # | Vertical (العقارات/الفرنشايز/الشراكات/التأجير) | Asset Classes & Yield Model | Investor Access |
|---|---|---|---|
| **1** | **Real Estate Assets (عقارات)** — Residential, commercial retail, administrative medical towers, land plots | **Full purchase** (title transfer) OR **fractional yield shares** (micro-investing via SPV) — monthly rental yield → `revenue_share_payouts` net after `property management fees` `app_wallet credit`. Capital appreciation via secondary market. | B2C retail (1 share $500) + B2B institutional (bulk 100 shares) |
| **2** | **Franchises & Agencies (فرنشايز ووكالات)** — Pharmacy chains, medical clinics, F&B, retail brands | **Turnkey franchise** — `franchise_fee + royalty % + marketing fund` + `CAPEX` + `payback period` disclosure — single territory license via `investment_contracts` `franchise_rights_license` PDF + `spv_registries` if pooled. | B2B entrepreneurs |
| **3** | **Business Equity & Project Funding (شراكات وتمويل مشاريع)** — Vetted businesses/startups from `AU BUSINESS` | **Equity stakes** OR **revenue-sharing** `10% of monthly revenue 24m` — crowdfunding `equity_campaigns` threshold-locked `escrow threshold` + staged `capital_call_schedules` tranches. | B2C+B2B mixed |
| **4** | **Equipment & Rental Asset Leasing (تأجير أصول ومعدات)** — Medical devices, construction machinery, fleet | **High-yield leasing** — `rental_schedule daily/monthly` via `merchant_deal_items` mirror + `property_milestones` `equipment delivery` → `revenue_share_payouts` `lease yield` + `AU SERV` maintenance dispatch. | B2B yield seekers |

**Visual Switcher:** `SegmentedControl 4 pills` `Neo-White frost outer + obsidian active #09090b` `ps-2 pe-2` switching verticals preserves GIS map + calculator + order book. Vertical `Real Estate` default.

### 1.2 Cross-App Data Convergence

- **With `AU BUSINESS`:** Developers/franchise owners/business entities list offerings, submit `audit_ledgers JSON {quarterly P&L, balance sheet, title deed hash}`, manage investor relations `Investor Q&A private-investor.{merchant_id}` from `AU BUSINESS` `Investor Relations Panel`. `HasAppIdScope ainv_` + `merchant_catalogs` sync ensures live stock/price.
- **With `AU DEALS` & `AU SERV`:** AU INVEST commercial units `is_commercial_leasable=true` `real_estate_listings` flagged → appear in `AU DEALS` feed `GET /au-deals/feed axis=rent` via `Redis GEO` + `ST_Distance_Sphere`. `AU SERV` `service_tickets` auto-created for `facility management` `property_milestones type=maintenance` `dispatch_logs` via `Redis stream facility:dispatch`.
- **With `app_wallet`:** All investments `escrow_clearings type=investment holding → partial milestones → released` `wallet_transactions` `hash_chain`. Yield distributions `revenue_share_payouts` `app_wallet credit` via `Agent 1` yield calc.

---

## 2) SECTION 1: REAL ESTATE MARKETPLACE, FRACTIONAL SHARES & YIELD CALCULATOR

### 2.1 Interactive Property Marketplace & Spatial GIS Mapping + 3D Progress Viewer

**Listing Engine:** `real_estate_listings` detailed `title_ar/en, description, category ENUM('off_plan','turn_key_residential','commercial_retail','administrative_tower','land_plot'), address, governorate/city, location POINT SRID4326 + geofence POLYGON, price_total_subunit, price_per_sqm_subunit, area_sqm, developer_merchant_id → merchants, 3d_tour_url (Matterport), drone_footage JSON [{url, timestamp, milestone_id}], blueprint_urls JSON, construction_status ENUM('planning','foundation','structure','finishing','delivered'), yield_annual_pct DECIMAL(5,2)`.

**GIS Mapping:** `Leaflet + MapLibre satellite` `center user POINT` `markers per listing POINT` `cluster cyan #06B6D4` `geofence POLYGON ST_Contains` `measure tool ST_Distance_Sphere`. Tap marker → `Drawer` `Neo-White frost + obsidian header` `price Inter tabular + yield emerald + risk crimson`.

**3D Virtual Tour & Drone Progress Viewer:** Integrated `Matterport iframe` + `drone site footage` timestamped linked to `property_milestones {milestone_no, title, target_date, completion_pct, media JSON [photo/video], verified_by_agent7 BOOL}`. Timeline `vertical stepper` `completed emerald 4/6 · next amber · locked muted`. `Reverb private-property.{listing_id} milestone.verified`.

**Categories UI:** `Filter pills` `Off-plan | Turn-key | Commercial | Admin Tower | Land` `obsidian active` + `Sort yield DESC | price ASC | distance ASC`.

### 2.2 Fractional Real Estate & Dividend Yield Engine

- **Fractionalization:** High-value assets `price > 5M EGP` auto-split `fractional_shares` `total_shares 100-1000` `share_price_subunit = price_total / total_shares` `micro-share ledger` `share_register_hash CHAR64 SHA256(pool)`. Investor `POST /au-invest/fractional/{listing_id}/buy {shares:5}` → `RequireInvestorKYCTier + EnforceEscrowThresholdLock + CalculatePropertyYields` → `escrow_clearings investment holding` + `fractional_shares holdings JSON [{user_id, shares}]` + `SPV map`.
- **Automated Rental Yield Distribution:** `Cron monthly 01 Africa/Cairo` `where next_payout_at <= now()` → `Agent 1` calculates `gross_rental = price_per_sqm * occupancy_rate` `net = gross - management_fee - maintenance` → `revenue_share_payouts per holding proportional` `app_wallet credit` `Reverb private-investor.{user_id} dividend.credited` `emerald toast`.
- **Secondary Micro-Share Marketplace & Liquidity Trading:** Internal `secondary_share_order_book` P2P trading desk `type bid|ask` `price_subunit` `shares` `status open|matched|settled|cancelled` `escrow verification` before `share transfer` `SPV register hash update`. `Order book` `bids emerald left · asks crimson right` `spread Inter tabular` + `Match engine` `price-time priority` `Reverb private-orderbook.{listing_id}`.
- **SPV Legal Entity Registry:** Automated mapping `spv_registries {listing_id, spv_name, registration_no, jurisdiction:EG, shareholder_ledger_hash CHAR64, share_register_pdf_encrypted AES-GCM, verified_by_agent7_at}` `investment_contracts type share_certificate` linked. `Agent 7` verifies title before list.

### 2.3 Dynamic ROI & Mortgage/Yield Financial Calculator

- **Simulator Panel (Neo-White frost):** `Inputs` `shares slider 1-50` `installment months 12/24/36` `down_payment %` `inflation %` `tax/fees %` → `CalculatePropertyYields` middleware computes `Capital Appreciation (historical price_per_sqm CAGR) + Net Rental Yield (annual %) + Tax/Registration + Inflation adj + Installment schedule` `output Inter tabular` `Total ROI 18.4% emerald + monthly dividend 1,240 EGP + breakeven 34m`. `Agent 3` market comp overlay `cyan`.
- **Mortgage:** `loan_amount = total - down_payment` `monthly = P*r*(1+r)^n/((1+r)^n-1)` `r = 15% annual /12` → schedule table `DataTable` `balance waterfall`.

---

## 3) SECTION 2: FRANCHISE MARKETPLACE, COMMERCIAL AGENCIES & TURNKEY B2B

### 3.1 Franchise & Agency Discovery Hub (الفرنشايز والوكالات التجارية)

- **Catalog:** Vetted brands `franchise_opportunities {brand_name, brand_logo_url, category ENUM('pharmacy','medical_clinic','f&b','retail','education'), description, franchise_fee_subunit, royalty_pct DECIMAL(5,2), marketing_fund_pct, capex_min_subunit, capex_max_subunit, expected_payback_months, territory ENUM('exclusive','non_exclusive'), training_support JSON, disclosure_pdf_hash}` `Card Neo-White frost + obsidian badge` `payback amber`.
- **Disclosure:** Clear `Fees breakdown` `Donut capex/fee/royalty` `emerald/cyan/amber` `Agent 3 feasibility 78/100`.
- **Agency:** `Commercial agencies` `distribution rights` `region polygon` `ST_Contains`.

### 3.2 Franchise Application & Feasibility Evaluation Pipeline (4-stage)

```
Investor Application → Financial Eligibility & Location Submission → AI/HITL Feasibility Approval → Digital Franchise Agreement Signing
```

1. **Application:** `POST /au-invest/franchises/{opportunity_id}/apply {financial_statement_hash, proposed_location POINT, capital_proof_subunit, experience JSON}` → `franchise_applications status applied` `VerifyInvestorKYCTier`.
2. **Eligibility:** `Agent 1` checks `capital >= capex_min + franchise_fee` + `location ST_Distance_Sphere vs existing franchise geofence` `no overlap 2km` → `financial_eligible BOOL`.
3. **Feasibility AI/HITL:** `Agent 3` feasibility `market comp + traffic density + neighborhood growth` `score 0-100 risk & yield` + `Agent 7` legal screen `franchise rights license valid` → `feasibility_score, risk_index` `if <90 → HITL queue` `Master HQ Screen 1` `4 CTAs`.
4. **Agreement:** Upon `approved → investment_contracts type franchise_rights_license` `OTP e-sign` `ECDSA` → `escrow release franchise_fee to brand`.

---

## 4) SECTION 3: BUSINESS EQUITY, PROJECT CROWDFUNDING & REVENUE SHARING

### 4.1 Project Crowdfunding & Revenue-Sharing Vault (Threshold-Locked Escrow)

- **Campaign Vault:** `equity_campaigns {business_merchant_id → merchants, title, type ENUM('equity','revenue_share'), target_subunit, minimum_threshold_subunit (70% of target), raised_subunit, share_price_subunit, revenue_share_pct, duration_months, start_at, ends_at, status ENUM('draft','live','threshold_met','threshold_failed','funded','disbursing','completed','refunded'), escrow_id → escrow_clearings holding, milestones JSON}`.
- **Investment:** `POST /au-invest/campaigns/{id}/invest {amount_subunit}` → `EnforceEscrowThresholdLock` `lockForUpdate equity_campaigns + Redis Mutex campaign:{id} + app_wallet available >= amount` → `campaign_investments {user_id, amount, shares, status holding}` + `Redis campaign:raised:{id} INCRBY` + `escrow holding`.
- **Threshold Logic:** `Cron every 60s ends_at` `if raised < minimum_threshold → status threshold_failed → 100% refund without fees` `escrow_clearings → refunded` `wallet_transactions refund` `Reverb private-campaign.{id} campaign.failed` `crimson`. If `raised >= minimum → threshold_met → funded` `escrow remains holding` until `capital_call_schedules` milestones.
- **Revenue Share Payouts:** `revenue_share_payouts {campaign_id, investment_id, period_start, period_end, gross_revenue_subunit, net_payout_subunit, status pending|credited}` `Agent 1` tracks `quarterly reports` `business uploads audit ledger`.

### 4.2 Investor Relations & Quarterly Performance Dashboard + Capital Call Milestones Escrow Release (Staged Disbursement)

- **Portal:** `Investor dashboard` `My portfolio` `cards per investment` `active investments, cash flow projection sparkline emerald, capital gains Inter tabular, dividend history, quarterly reports PDF vault` `DataTable` `Investor Relations`.
- **Capital Call & Milestones Escrow Release:** Staged `capital_call_schedules {campaign_id, tranche_no, amount_subunit, milestone_title, milestone_verified_at nullable, status ENUM('pending','verified','released'), verification_hash CHAR64}`. Founder requests `POST /au-invest/campaigns/{id}/milestone/verify {tranche_no, evidence JSON}` → `Agent 7` + HITL `Master HQ` verify `construction/operational milestone` `if verified → escrow_clearings partial release` `percentage` `private-campaign.{id} milestone.released` `amber`.

---

## 5) SECTION 4: LEGAL VAULT, SMART CONTRACTS & DIGITAL SIGNATURES

### 5.1 Cryptographic E-Signing & Contract Vault (OTP-verified + Timestamped Hash)

- **Pipeline:** `investment_contracts {user_id, related_type ENUM('property_share','franchise_license','equity_share','escrow_release_deed'), related_id, contract_type ENUM('share_certificate','franchise_rights_license','investment_certificate','escrow_release_deed'), pdf_url_encrypted AES-GCM, pdf_iv/tag, hash CHAR64 SHA256(pdf+timestamp+user), signed_at, otp_verified BOOL, signature_ecdsa TEXT, status ENUM('draft','pending_sign','signed','revoked')}`.
- **E-Signing:** `POST /au-invest/contracts/{id}/sign {otp:6 digits}` `Redis contract:otp:{contract_id}:{user_id} EX 300` `OTP verify → ECDSA sign (secp256k1) → hash store` `Document Vault` `Reverb private-investor.{user_id} contract.signed` `emerald`. `Agent 7` templates `Egyptian legal frameworks` `hard-blocked auto-sign without Super Admin`.
- **Vault:** `GET /au-invest/vault/contracts` `DataTable` `Contract | Type | Hash | Signed At | Download AES-GCM decrypt` `VerifyInvestorKYCTier` ensures tier before download.

### 5.2 Investor KYC, AML & Accredited Investor Verification (Tiered — Agent 7 + Agent 13 Co-Govern)

- **Tiers:**
  - **T1 Basic** `phone + national_id OCR deterministic 0.90 → Agent 7` — limit `single investment ≤ 50k EGP`
  - **T2 Verified** `+ source_of_funds disclosure + liveness biometric` — limit `≤ 500k`
  - **T3 Accredited** `+ income statement >1M + professional investor proof + Agent 13 AML deep` — unlimited + high-ticket deals `reserve >1M`.
- **Flow:** `POST /au-invest/kyc/verify {tier, documents JSON, source_of_funds, income_proof}` → `investor_kyc_verifications {user_id, tier_requested, tier_granted, status ENUM('pending','under_review','approved','rejected','expired'), documents_hash CHAR64, aml_risk_score DECIMAL(5,2), reviewed_by_agent7_at, reviewed_by_agent13_at}` `Agent 7` legal compliance `+ Agent 13` AML velocity/Sybil `if risk>80 freeze HARD-BLOCKED` `private-hitl kyc` `HITL`. `VerifyInvestorKYCTier` middleware gates `investment amount` vs `tier_granted`.
- **Accredited Check:** High-ticket `equity_campaigns target>1M or real_estate fractional >500k` requires `T3 approved` else `403 tier insufficient`.

---

## 6) SECTION 5: COGNITIVE AI INVESTMENT ADVISOR & RISK INSPECTOR (MULTI-AGENT INLINE — NO SEPARATE FILE)

> **Deep Workspace Guarantee:** No separate `PART2` — all agent logic embedded within AU INVEST specs below, per Table 1.3 Registry Lock (13 exact, no 14th).

| Agent (Registry Lock Exact) | Deep Workspace Module in AU INVEST | Logic, Triggers & UI (Hybrid Obsidian-Pearl) |
|---|---|---|
| **Agent 1 — AI Chief Financial Officer (The Accounting & Profit Engine)** | **Portfolio & Yield Cash-Flow Intelligence + Dividend Engine + Capital Call Guard** | **Scope per prompt:** `portfolio and investment cash-flow intelligence` belongs **strictly** to Agent 1. **Pipeline:** `investor holdings across 4 verticals` `fractional_shares + franchise_applications + campaign_investments + secondary orders` → `Agent 1 Deterministic` `yield optimization` `gross_rental - fees - inflation` `net_yield%` `cash_flow_projection 12m sparkline emerald` `risk-bound enforcement` `if yield < promised 70% → alert amber + Calibrator`. **Dividend:** `Cron monthly` `Agent 1` `calculates + distributes` `revenue_share_payouts` `app_wallet credit` `HITL required for manual balance adjustments` (per registry). **Capital Call:** `Agent 1` validates `tranche amount <= remaining escrow + audit ledger`. **UI:** `Portfolio card Neo-White frost + emerald yield badge` `Agent 1 — Yield 12.4% net · cash flow +8%` `TopUp CTA`. |
| **Agent 3 — AI Chief Marketing Officer (Growth & Campaigns)** | **Feasibility & Opportunity Analysis + Market Hunter + Stagnant Detection** | **Scope per prompt:** `feasibility and investment opportunity analysis` belongs **strictly** to Agent 3. **Engine:** `market comps` `price_per_sqm historical 24m` `regional traffic density OSM` `neighborhood growth factor` `deal_categories` → `feasibility_score 0-100` `Risk & Yield Index 1-100` `badge cyan 78/100` `confidence`. **HITL:** `if confidence<90 → hitl_required` `Master HQ`. **Opportunity Detection (Market Hunter):** `scans stagnant AU INVEST listings >60d + price drop >12% + high yield` → `Proactive Learning` `“Admin, I found off-plan in New Cairo yield 14% risk 22%”` `Approve & Launch` isolated UI. **Growth:** `personalized recommendations` `For You` `Neo-White carousel` `“similar to your 2BR New Zayed”`. **UI:** `Feasibility panel cyan border` `comps table + growth sparkline`. |
| **Agent 7 — AI Chief Legal Counsel & Compliance Officer (Legal & Compliance)** | **Legal & Title Screening + SPV Compliance + Franchise Rights License Review + Contract Template Guard** | **Scope per prompt:** `legal compliance and real estate screening` belongs **strictly** to Agent 7. **Title Screening:** `property title documents hash` `land registry status` `SPV registration` `franchise rights license` `Egyptian legal frameworks` `deterministic Regex + ngram` `if missing title → hard-block listing 422` `“hard-blocked without Super Admin clearance”` (per registry). **SPV Compliance:** `spv_registries` `registration_no verification` `share register hash` `digital share issuance ledger` `verified_by_agent7_at`. **Contract Guard:** `investment_contracts template` `Egyptian law` `OTP e-sign` `Agent 7` `hard-blocked auto-sign`. **UI:** `Shield cyan` `Agent 7 — Title Verified ✓ Land Registry #8821` `SPV EG-2026-441 verified`. |
| **Agent 13 — AI Fraud Detector & Anti-Money Laundering Sentinel** | **Investor KYC/AML Enforcement + Sybil Guard + Circular-Loop Shield + Crowdfunding Velocity Guard** | **Scope per prompt:** `investor KYC/AML enforcement & Sybil guard` co-governed by Agent 13. **Pipeline:** `investor_kyc_verifications documents_hash + source_of_funds + device_fingerprint + IP + investment amount` → `velocity 5/min` `circular-loop same 2 investors alternating large amounts` `Sybil multiple accounts same fingerprint investing same campaign` `ZKP synthetic isolation` → `aml_risk 0-100`. **If >80 → auto-freeze investment holding` `HARD-BLOCKED seize opaque 40` `private-hitl aml.kyc` `Risk 92% frozen crimson`. **Crowdfunding:** `campaign_investments` `if same IP funds 3 campaigns <10m → Sybil flag` `revert investments`. **Review Guard:** `investor_aml_audit_logs` append-only `hash_chain`. **UI:** `Shield crimson` `Agent13 — AML Risk 92% frozen` `KYC Tier blocked`. |

**Token/Motion (Agent Cards):** `Neo-White frost 90% backdrop-blur-md border-[#E4E4E7] shadow-[0_8px_32px_rgba(9,9,11,.06)] hover:shadow-[0_0_20px_rgba(6,182,212,.12)]` + `obsidian left border 3px #09090b` + `floating` on recommendation + `proximity glow cyan` `--cx/--cy`.

---

## 7) TECHNICAL DELIVERABLES & DATABASE MIGRATIONS SPECIFICATION (Executable Laravel PHP 8.4 + Eloquent + Inertia + Reverb)

> **Generation Rule (Pillars 1,4,6,7,11):** Every write `DB::transaction + lockForUpdate + Redis Mutex + hasAppIdScope (AU_INVEST) + VerifyInvestorKYCTier` — `Rule 11` additive only `no drop/truncate`, `Rule 7` `JSON` not `JSONB` (MySQL 8.4), `InnoDB utf8mb4_unicode_ci` `SPATIAL` `FULLTEXT ngram` where needed, `BIGINT subunit` + `version + GENERATED available` for wallet, `AES-256-GCM` per-row where PII/contracts, `hash_chain` for escrow/audit/SPV, `app_id='AU_INVEST'` scope.

### 7.0 Common Traits, Enums & Config

```php
// app/Modules/Shared/Traits/HasAppIdScope.php — AU_INVEST models
trait HasAppIdScope { protected static function booted(): void { static::addGlobalScope('app', fn($q)=>$q->where('app_id', request()->header('X-App-Id','AU_INVEST'))); } }
// Enums PHP 8.4 strict
enum AppId:string { case AU_BUSINESS='AU_BUSINESS'; case AU_MED='AU_MED'; case AU_DEALS='AU_DEALS'; case AU_SERV='AU_SERV'; case AU_INVEST='AU_INVEST'; }
enum PropertyCategory:string { case off_plan='off_plan'; case turn_key_residential='turn_key_residential'; case commercial_retail='commercial_retail'; case administrative_tower='administrative_tower'; case land_plot='land_plot'; }
enum ConstructionStatus:string { case planning='planning'; case foundation='foundation'; case structure='structure'; case finishing='finishing'; case delivered='delivered'; }
enum MilestoneStatus:string { case pending='pending'; case in_progress='in_progress'; case completed='completed'; case verified='verified'; }
enum FranchiseCategory:string { case pharmacy='pharmacy'; case medical_clinic='medical_clinic'; case f_b='f_b'; case retail='retail'; case education='education'; }
enum FranchiseAppStatus:string { case applied='applied'; case financial_eligible='financial_eligible'; case feasibility_review='feasibility_review'; case approved='approved'; case rejected='rejected'; case signed='signed'; }
enum CampaignType:string { case equity='equity'; case revenue_share='revenue_share'; }
enum CampaignStatus:string { case draft='draft'; case live='live'; case threshold_met='threshold_met'; case threshold_failed='threshold_failed'; case funded='funded'; case disbursing='disbursing'; case completed='completed'; case refunded='refunded'; }
enum KycTier:string { case t1_basic='t1_basic'; case t2_verified='t2_verified'; case t3_accredited='t3_accredited'; }
enum KycStatus:string { case pending='pending'; case under_review='under_review'; case approved='approved'; case rejected='rejected'; case expired='expired'; }
enum ContractType:string { case share_certificate='share_certificate'; case franchise_rights_license='franchise_rights_license'; case investment_certificate='investment_certificate'; case escrow_release_deed='escrow_release_deed'; }
enum OrderBookType:string { case bid='bid'; case ask='ask'; }
enum OrderBookStatus:string { case open='open'; case matched='matched'; case settled='settled'; case cancelled='cancelled'; }
// Config: barter 1.5x/1x, 5% commission, 48h dispute + 12h grace once, 500 favs, payoff escrow threshold 70%
```

### 7.1 `ainv_real_estate_listings`, `ainv_property_milestones` & `ainv_fractional_shares` — Property + Construction + Micro-Share Ledgers

```php
// database/migrations/2026_09_15_000050_create_ainv_real_estate_tables.php — MySQL 8.4 — PHP 8.4 strict
return new class extends Migration {
 public function up(): void {
  Schema::create('ainv_real_estate_listings', function(Blueprint $t){
   $t->id(); $t->char('uuid',36)->unique();
   $t->foreignId('developer_merchant_id')->constrained('merchants')->cascadeOnDelete()->comment('AU BUSINESS developer');
   $t->enum('app_id',['AU_BUSINESS','AU_MED','AU_DEALS','AU_SERV','AU_INVEST'])->default('AU_INVEST')->index();
   $t->string('title',255); $t->string('title_ar',255);
   $t->enum('category',['off_plan','turn_key_residential','commercial_retail','administrative_tower','land_plot'])->index();
   $t->text('description')->nullable();
   $t->string('governorate',80); $t->string('city',80); $t->string('address',500);
   $t->point('location',4326)->comment('GIS POINT SRID4326');
   $t->polygon('geofence',4326)->nullable()->comment('ST_Buffer(location, 500m) for nearby search');
   $t->decimal('area_sqm',10,2);
   $t->bigInteger('price_total_subunit')->unsigned();
   $t->bigInteger('price_per_sqm_subunit')->unsigned();
   $t->decimal('yield_annual_pct',5,2)->nullable()->comment('Agent1 estimated');
   $t->enum('construction_status',['planning','foundation','structure','finishing','delivered'])->default('planning')->index();
   $t->string('three_d_tour_url',500)->nullable()->comment('Matterport');
   $t->json('drone_footage')->nullable()->comment('[{url, timestamp, milestone_id}]');
   $t->json('blueprint_urls')->nullable();
   $t->json('media')->nullable()->comment('images HD');
   $t->boolean('is_fractionalized')->default(false)->index();
   $t->boolean('is_commercial_leasable')->default(false)->comment('flag for AU DEALS');
   $t->json('audit_ledger')->nullable()->comment('{quarterly P&L hash}');
   $t->boolean('is_verified_by_agent7')->default(false)->index()->comment('legal title screened');
   $t->timestamps(); $t->softDeletes();
   $t->index(['category','construction_status']); $t->index(['price_total_subunit']);
  });
  Schema::create('ainv_property_milestones', function(Blueprint $t){
   $t->id(); $t->char('uuid',36)->unique();
   $t->foreignId('listing_id')->constrained('ainv_real_estate_listings')->cascadeOnDelete();
   $t->smallInteger('milestone_no')->unsigned();
   $t->string('title',255);
   $t->text('description')->nullable();
   $t->date('target_date')->index();
   $t->tinyInteger('completion_pct')->unsigned()->default(0);
   $t->enum('status',['pending','in_progress','completed','verified'])->default('pending')->index();
   $t->json('media')->nullable()->comment('[photo/video] drone');
   $t->char('verification_hash',64)->nullable()->comment('SHA256(media+timestamp)');
   $t->dateTime('verified_at')->nullable();
   $t->foreignId('verified_by_user_id')->nullable()->constrained('users')->nullOnDelete();
   $t->timestamps();
   $t->unique(['listing_id','milestone_no']);
  });
  Schema::create('ainv_fractional_shares', function(Blueprint $t){
   $t->id(); $t->char('uuid',36)->unique();
   $t->foreignId('listing_id')->constrained('ainv_real_estate_listings')->cascadeOnDelete()->unique();
   $t->integer('total_shares')->unsigned()->comment('100-1000');
   $t->bigInteger('share_price_subunit')->unsigned();
   $t->integer('available_shares')->unsigned();
   $t->integer('sold_shares')->unsigned()->default(0);
   $t->boolean('is_tradeable')->default(true)->index()->comment('false if AU BUSINESS stock zero');
   $t->char('share_register_hash',64)->comment('SHA256(pool holdings)');
   $t->json('holdings')->nullable()->comment('[{user_id, shares, bought_at}] snapshot for hash');
   $t->foreignId('spv_registry_id')->nullable()->constrained('ainv_spv_registries')->nullOnDelete();
   $t->timestamps();
  });
  try{ DB::statement('ALTER TABLE ainv_real_estate_listings ADD SPATIAL INDEX spx_invest_location (location)'); }catch(Throwable $e){}
  try{ DB::statement('ALTER TABLE ainv_real_estate_listings ADD SPATIAL INDEX spx_invest_geofence (geofence)'); }catch(Throwable $e){}
  DB::statement("ALTER TABLE ainv_real_estate_listings ADD CONSTRAINT chk_invest_price CHECK (price_total_subunit>0)");
  DB::statement("ALTER TABLE ainv_real_estate_listings ADD CONSTRAINT chk_invest_yield CHECK (yield_annual_pct IS NULL OR yield_annual_pct BETWEEN 0 AND 50)");
  DB::statement("ALTER TABLE ainv_fractional_shares ADD CONSTRAINT chk_fractional_total CHECK (total_shares BETWEEN 10 AND 5000)");
 }
 public function down(): void {
  Schema::dropIfExists('ainv_fractional_shares'); Schema::dropIfExists('ainv_property_milestones'); Schema::dropIfExists('ainv_real_estate_listings');
 }
};
// Models
// App\Models\AinvRealEstateListing extends Model { use HasAppIdScope, SoftDeletes; table='ainv_real_estate_listings'; casts location=>Point, geofence=>Polygon, drone_footage/media=>array; scopeWithinRadius($q,$lat,$lng,$km)=>whereRaw("ST_Distance_Sphere(location, POINT(?,?))<=?*1000",[$lng,$lat,$km]); relation milestones():HasMany, fractional():HasOne; }
// App\Models\AinvPropertyMilestone extends Model { table='ainv_property_milestones'; casts target_date=>date, media=>array; }
// App\Models\AinvFractionalShare extends Model { table='ainv_fractional_shares'; casts holdings=>array; method recalcHash():string; }
```

### 7.2 `ainv_franchise_opportunities` & `ainv_franchise_applications` — CAPEX, Royalties, Feasibility

```php
// database/migrations/2026_09_15_000051_create_ainv_franchise_tables.php — MySQL
return new class extends Migration {
 public function up(): void {
  Schema::create('ainv_franchise_opportunities', function(Blueprint $t){
   $t->id(); $t->char('uuid',36)->unique();
   $t->foreignId('brand_merchant_id')->constrained('merchants')->cascadeOnDelete()->comment('AU BUSINESS brand owner');
   $t->enum('app_id',['AU_BUSINESS','AU_MED','AU_DEALS','AU_SERV','AU_INVEST'])->default('AU_INVEST')->index();
   $t->string('brand_name',150); $t->string('brand_name_ar',150);
   $t->string('brand_logo_url',500)->nullable();
   $t->enum('category',['pharmacy','medical_clinic','f_b','retail','education'])->index();
   $t->text('description')->nullable();
   $t->bigInteger('franchise_fee_subunit')->unsigned();
   $t->decimal('royalty_pct',5,2)->comment('e.g., 5.00');
   $t->decimal('marketing_fund_pct',5,2)->default(0);
   $t->bigInteger('capex_min_subunit')->unsigned();
   $t->bigInteger('capex_max_subunit')->unsigned();
   $t->smallInteger('expected_payback_months')->unsigned();
   $t->enum('territory',['exclusive','non_exclusive'])->default('exclusive');
   $t->polygon('territory_geofence',4326)->nullable()->comment('exclusive region POLYGON');
   $t->json('training_support')->nullable();
   $t->string('disclosure_pdf_hash',64)->comment('SHA256 disclosure');
   $t->string('disclosure_pdf_url_encrypted',500)->nullable()->comment('AES-GCM');
   $t->string('disclosure_iv',64)->nullable(); $t->string('disclosure_tag',64)->nullable();
   $t->decimal('feasibility_score',5,2)->nullable()->comment('Agent3 0-100');
   $t->boolean('is_verified_by_agent7')->default(false)->index();
   $t->enum('status',['draft','live','paused','closed'])->default('draft')->index();
   $t->timestamps(); $t->softDeletes();
  });
  Schema::create('ainv_franchise_applications', function(Blueprint $t){
   $t->id(); $t->char('uuid',36)->unique();
   $t->foreignId('opportunity_id')->constrained('ainv_franchise_opportunities')->cascadeOnDelete();
   $t->foreignId('investor_user_id')->constrained('users')->cascadeOnDelete();
   $t->foreignId('investor_profile_id')->nullable()->comment('consumer/investor profile id cross-app');
   $t->point('proposed_location',4326)->comment('ST_Distance_Sphere vs existing geofence 2km check');
   $t->bigInteger('capital_proof_subunit')->unsigned();
   $t->string('financial_statement_hash',64)->comment('SHA256 financial docs');
   $t->json('experience')->nullable();
   $t->enum('status',['applied','financial_eligible','feasibility_review','approved','rejected','signed'])->default('applied')->index();
   $t->boolean('financial_eligible')->nullable();
   $t->decimal('feasibility_score',5,2)->nullable();
   $t->decimal('risk_index',5,2)->nullable();
   $t->char('verification_hash',64)->nullable();
   $t->foreignId('contract_id')->nullable()->constrained('ainv_investment_contracts')->nullOnDelete();
   $t->timestamps();
   $t->unique(['opportunity_id','investor_user_id']);
  });
  try{ DB::statement('ALTER TABLE ainv_franchise_applications ADD SPATIAL INDEX spx_franchise_proposed (proposed_location)'); }catch(Throwable $e){}
  try{ DB::statement('ALTER TABLE ainv_franchise_opportunities ADD SPATIAL INDEX spx_franchise_territory (territory_geofence)'); }catch(Throwable $e){}
  DB::statement("ALTER TABLE ainv_franchise_opportunities ADD CONSTRAINT chk_franchise_capex CHECK (capex_max_subunit>=capex_min_subunit)");
  DB::statement("ALTER TABLE ainv_franchise_opportunities ADD CONSTRAINT chk_franchise_royalty CHECK (royalty_pct BETWEEN 0 AND 30)");
 }
 public function down(): void { Schema::dropIfExists('ainv_franchise_applications'); Schema::dropIfExists('ainv_franchise_opportunities'); }
};
// Controller: AinvFranchiseController@discovery (filter category + territory ST_Contains), apply (VerifyInvestorKYCTier + capital check + 2km geofence overlap), feasibilityReview (Agent3+7)
```

### 7.3 `ainv_equity_campaigns`, `ainv_campaign_investments` & `ainv_revenue_share_payouts` — Crowdfunding Threshold-Locked

```php
// database/migrations/2026_09_15_000052_create_ainv_equity_campaign_tables.php — MySQL
return new class extends Migration {
 public function up(): void {
  Schema::create('ainv_equity_campaigns', function(Blueprint $t){
   $t->id(); $t->char('uuid',36)->unique();
   $t->foreignId('business_merchant_id')->constrained('merchants')->cascadeOnDelete()->comment('AU BUSINESS vetted business');
   $t->enum('app_id',['AU_BUSINESS','AU_MED','AU_DEALS','AU_SERV','AU_INVEST'])->default('AU_INVEST')->index();
   $t->string('title',255); $t->text('description')->nullable();
   $t->enum('type',['equity','revenue_share'])->default('equity')->index();
   $t->bigInteger('target_subunit')->unsigned();
   $t->bigInteger('minimum_threshold_subunit')->unsigned()->comment('70% of target');
   $t->bigInteger('raised_subunit')->unsigned()->default(0);
   $t->bigInteger('share_price_subunit')->unsigned()->nullable()->comment('for equity');
   $t->decimal('revenue_share_pct',5,2)->nullable()->comment('for revenue_share e.g., 10.00% 24m');
   $t->smallInteger('duration_months')->unsigned()->nullable();
   $t->dateTime('starts_at')->index(); $t->dateTime('ends_at')->index();
   $t->enum('status',['draft','live','threshold_met','threshold_failed','funded','disbursing','completed','refunded'])->default('draft')->index();
   $t->foreignId('escrow_id')->nullable()->constrained('escrow_clearings')->nullOnDelete()->comment('threshold-lock holding');
   $t->json('milestones')->nullable()->comment('[{title, amount_pct}] for capital_call');
   $t->json('audit_ledger')->nullable()->comment('{quarterly P&L hash} business uploads');
   $t->boolean('is_verified_by_agent7')->default(false)->index();
   $t->timestamps(); $t->softDeletes();
   $t->index(['type','status','ends_at']);
  });
  Schema::create('ainv_campaign_investments', function(Blueprint $t){
   $t->id(); $t->char('uuid',36)->unique();
   $t->foreignId('campaign_id')->constrained('ainv_equity_campaigns')->cascadeOnDelete();
   $t->foreignId('investor_user_id')->constrained('users')->cascadeOnDelete();
   $t->bigInteger('amount_subunit')->unsigned();
   $t->integer('shares')->unsigned()->nullable();
   $t->enum('status',['holding','released','refunded','forfeited'])->default('holding')->index();
   $t->foreignId('escrow_id')->constrained('escrow_clearings')->cascadeOnDelete();
   $t->char('hash_prev',64)->nullable(); $t->char('hash_current',64);
   $t->timestamps();
   $t->index(['campaign_id','status']); $t->index(['investor_user_id','status']);
  });
  Schema::create('ainv_revenue_share_payouts', function(Blueprint $t){
   $t->id(); $t->char('uuid',36)->unique();
   $t->foreignId('campaign_id')->nullable()->constrained('ainv_equity_campaigns')->nullOnDelete();
   $t->foreignId('listing_id')->nullable()->constrained('ainv_real_estate_listings')->nullOnDelete()->comment('or fractional rental yield');
   $t->foreignId('investment_id')->nullable()->constrained('ainv_campaign_investments')->nullOnDelete();
   $t->foreignId('investor_user_id')->constrained('users')->cascadeOnDelete();
   $t->date('period_start')->index(); $t->date('period_end')->index();
   $t->bigInteger('gross_revenue_subunit')->unsigned();
   $t->bigInteger('net_payout_subunit')->unsigned()->comment('after fees');
   $t->decimal('yield_pct',5,2)->nullable();
   $t->enum('status',['pending','credited','failed'])->default('pending')->index();
   $t->foreignId('wallet_transaction_id')->nullable()->constrained('wallet_transactions')->nullOnDelete();
   $t->char('hash_prev',64)->nullable(); $t->char('hash_current',64);
   $t->timestamps();
  });
  DB::statement("ALTER TABLE ainv_equity_campaigns ADD CONSTRAINT chk_campaign_target CHECK (target_subunit>0)");
  DB::statement("ALTER TABLE ainv_equity_campaigns ADD CONSTRAINT chk_campaign_threshold CHECK (minimum_threshold_subunit<=target_subunit)");
  DB::statement("ALTER TABLE ainv_campaign_investments ADD CONSTRAINT chk_invest_amount CHECK (amount_subunit>0)");
 }
 public function down(): void {
  Schema::dropIfExists('ainv_revenue_share_payouts'); Schema::dropIfExists('ainv_campaign_investments'); Schema::dropIfExists('ainv_equity_campaigns');
 }
};
// Controllers: AinvEquityCampaignController@create (AU BUSINESS), invest (VerifyInvestorKYCTier + EnforceEscrowThresholdLock + Redis campaign:raised INCRBY + escrow holding + Reverb private-campaign), thresholdCron (60s → refunded 100% without fees if failed)
```

### 7.4 `ainv_investment_contracts` & `ainv_investor_kyc_verifications` — Cryptographic Hashes + AML States

```php
// database/migrations/2026_09_15_000053_create_ainv_contracts_kyc_tables.php — MySQL
return new class extends Migration {
 public function up(): void {
  Schema::create('ainv_investment_contracts', function(Blueprint $t){
   $t->id(); $t->char('uuid',36)->unique();
   $t->foreignId('investor_user_id')->constrained('users')->cascadeOnDelete();
   $t->enum('related_type',['property_share','franchise_license','equity_share','escrow_release_deed','spv_share'])->index();
   $t->unsignedBigInteger('related_id')->index()->comment('polymorphic id');
   $t->enum('contract_type',['share_certificate','franchise_rights_license','investment_certificate','escrow_release_deed'])->index();
   $t->text('pdf_url_encrypted')->comment('AES-256-GCM per-row iv/tag');
   $t->string('pdf_iv',64); $t->string('pdf_tag',64);
   $t->char('hash',64)->comment('SHA256(pdf+timestamp+user) timestamped hash');
   $t->text('signature_ecdsa')->nullable()->comment('secp256k1 ECDSA signature by platform + OTP verified');
   $t->boolean('otp_verified')->default(false);
   $t->dateTime('signed_at')->nullable()->index();
   $t->enum('status',['draft','pending_sign','signed','revoked'])->default('draft')->index();
   $t->timestamps(); $t->softDeletes();
   $t->index(['investor_user_id','contract_type','status']);
  });
  Schema::create('ainv_investor_kyc_verifications', function(Blueprint $t){
   $t->id(); $t->char('uuid',36)->unique();
   $t->foreignId('investor_user_id')->constrained('users')->cascadeOnDelete()->unique();
   $t->enum('tier_requested',['t1_basic','t2_verified','t3_accredited'])->index();
   $t->enum('tier_granted',['t1_basic','t2_verified','t3_accredited'])->nullable()->index();
   $t->enum('status',['pending','under_review','approved','rejected','expired'])->default('pending')->index();
   $t->string('documents_hash',64)->comment('SHA256 OCR docs national_id + source_of_funds');
   $t->json('documents')->nullable()->comment('{national_id, source_of_funds, income_proof, liveness}');
   $t->decimal('aml_risk_score',5,2)->default(0)->comment('Agent13 0-100 >80 freeze');
   $t->text('rejection_reason')->nullable();
   $t->dateTime('reviewed_by_agent7_at')->nullable();
   $t->dateTime('reviewed_by_agent13_at')->nullable();
   $t->dateTime('expires_at')->nullable()->index();
   $t->timestamps();
  });
  DB::statement("ALTER TABLE ainv_investment_contracts ADD CONSTRAINT chk_contract_hash CHECK (LENGTH(hash)=64)");
  DB::statement("ALTER TABLE ainv_investor_kyc_verifications ADD CONSTRAINT chk_kyc_risk CHECK (aml_risk_score BETWEEN 0 AND 100)");
 }
 public function down(): void { Schema::dropIfExists('ainv_investor_kyc_verifications'); Schema::dropIfExists('ainv_investment_contracts'); }
};
// Controller: AinvContractController@sign (OTP Redis contract:otp:{id} EX 300 → ECDSA + hash + Document Vault + Reverb private-investor), vault
// AinvKycController@verify (deterministic OCR + Agent7 legal + Agent13 AML velocity/Sybil → private-hitl kyc)
```

### 7.5 Middleware — `VerifyInvestorKYCTier`, `EnforceEscrowThresholdLock`, `CalculatePropertyYields`

```php
// app/Http/Middleware/VerifyInvestorKYCTier.php
public function handle(Request $r, Closure $next){
 $tierOrder = ['t1_basic'=>1,'t2_verified'=>2,'t3_accredited'=>3];
 $required = $r->attributes->get('required_kyc_tier') ?? $this->resolveRequired($r); // high-ticket >500k → t3
 $kyc = AinvInvestorKycVerification::where('investor_user_id',$r->user()->id)->where('status','approved')->first();
 $granted = $kyc? $tierOrder[$kyc->tier_granted] : 0;
 $need = $tierOrder[$required] ?? 1;
 if($granted < $need) return response()->json(['code'=>'kyc_tier_insufficient','required'=>$required,'granted'=>$kyc->tier_granted ?? null], 403);
 // also check aml_risk >80 frozen
 if($kyc && $kyc->aml_risk_score > 80) return response()->json(['code'=>'kyc_aml_frozen'], 403);
 return $next($r);
}
// app/Http/Middleware/EnforceEscrowThresholdLock.php — crowdfunding threshold escrow guard
public function handle(Request $r, Closure $next){
 $campaign = AinvEquityCampaign::lockForUpdate()->findOrFail($r->route('campaign') ?? $r->input('campaign_id'));
 if(!in_array($campaign->status,['live','threshold_met'])) return response()->json(['code'=>'campaign_not_investable'], 422);
 if($campaign->ends_at < now()) return response()->json(['code'=>'campaign_ended'], 422);
 // ensure escrow holding not released early
 if($campaign->escrow && $campaign->escrow->status!=='holding') return response()->json(['code'=>'escrow_not_holding'], 422);
 return $next($r);
}
// app/Http/Middleware/CalculatePropertyYields.php — ROI calculator preflight (also Action)
public function handle(Request $r, Closure $next){
 $listing = AinvRealEstateListing::findOrFail($r->route('listing') ?? $r->input('listing_id'));
 $shares = (int)$r->input('shares',1);
 $downPct = (float)$r->input('down_payment_pct',30);
 $months = (int)$r->input('installment_months',36);
 // compute via Agent1 deterministic: yield_annual_pct, price_per_sqm CAGR, tax/fees, inflation, installment schedule
 $calc = app(CalculatePropertyYieldsAction::class)->execute($listing,$shares,$downPct,$months);
 $r->attributes->set('yield_calc', $calc); // {total_roi, monthly_dividend, breakeven_months, schedule:[]}
 return $next($r);
}
// Routes excerpt — routes/api/v1/au_invest.php
// Route::middleware(['auth:jwt','HasAppId:AU_INVEST'])->group(function(){
//  Route::get('listings', [AinvRealEstateController::class,'index']); // GIS + 3d tour
//  Route::post('fractional/{listing}/buy', [AinvFractionalController::class,'buy'])->middleware([VerifyInvestorKYCTier::class.':t2_verified', CalculatePropertyYields::class]);
//  Route::post('franchises/{opportunity}/apply', [AinvFranchiseController::class,'apply'])->middleware(VerifyInvestorKYCTier::class.':t2_verified');
//  Route::post('campaigns/{campaign}/invest', [AinvEquityCampaignController::class,'invest'])->middleware([VerifyInvestorKYCTier::class.':t1_basic', EnforceEscrowThresholdLock::class]);
//  Route::post('contracts/{contract}/sign', [AinvContractController::class,'sign']); // OTP
//  Route::post('kyc/verify', [AinvKycController::class,'verify']);
//  Route::get('order-book/{listing}', [SecondaryOrderBookController::class,'show']);
//  Route::post('order-book/{listing}/place', [SecondaryOrderBookController::class,'place'])->middleware(VerifyInvestorKYCTier::class.':t2_verified');
//  Route::post('capital-call/{campaign}/milestone/verify', [CapitalCallController::class,'verifyMilestone']); // Agent7 HITL
// });
```

### 7.6 `ainv_secondary_share_order_book` & `ainv_spv_registries` — P2P Liquidity + Digital Share Register

```php
// database/migrations/2026_09_15_000054_create_ainv_secondary_spv_tables.php — MySQL
return new class extends Migration {
 public function up(): void {
  Schema::create('ainv_spv_registries', function(Blueprint $t){
   $t->id(); $t->char('uuid',36)->unique();
   $t->foreignId('listing_id')->constrained('ainv_real_estate_listings')->cascadeOnDelete()->unique();
   $t->string('spv_name',255);
   $t->string('registration_no',80)->unique();
   $t->string('jurisdiction',8)->default('EG');
   $t->char('shareholder_ledger_hash',64)->comment('SHA256(holdings JSON)');
   $t->text('share_register_pdf_encrypted')->comment('AES-GCM');
   $t->string('share_register_iv',64); $t->string('share_register_tag',64);
   $t->char('digital_share_hash',64)->comment('hash for secondary trading verification');
   $t->dateTime('verified_by_agent7_at')->nullable();
   $t->foreignId('verified_by_user_id')->nullable()->constrained('users')->nullOnDelete();
   $t->timestamps();
  });
  Schema::create('ainv_secondary_share_order_book', function(Blueprint $t){
   $t->id(); $t->char('uuid',36)->unique();
   $t->foreignId('listing_id')->constrained('ainv_real_estate_listings')->cascadeOnDelete();
   $t->foreignId('spv_registry_id')->constrained('ainv_spv_registries')->cascadeOnDelete();
   $t->foreignId('investor_user_id')->constrained('users')->cascadeOnDelete();
   $t->enum('type',['bid','ask'])->index();
   $t->bigInteger('price_per_share_subunit')->unsigned();
   $t->integer('shares')->unsigned();
   $t->bigInteger('total_subunit')->unsigned()->comment('price*shares');
   $t->enum('status',['open','matched','settled','cancelled'])->default('open')->index();
   $t->foreignId('matched_order_id')->nullable()->constrained('ainv_secondary_share_order_book')->nullOnDelete();
   $t->foreignId('escrow_id')->nullable()->constrained('escrow_clearings')->nullOnDelete()->comment('escrow verification before share transfer');
   $t->char('hash_prev',64)->nullable(); $t->char('hash_current',64);
   $t->timestamps();
   $t->index(['listing_id','type','status','price_per_share_subunit']);
  });
  DB::statement("ALTER TABLE ainv_secondary_share_order_book ADD CONSTRAINT chk_order_book_shares CHECK (shares>0)");
  DB::statement("ALTER TABLE ainv_secondary_share_order_book ADD CONSTRAINT chk_order_book_price CHECK (price_per_share_subunit>0)");
 }
 public function down(): void { Schema::dropIfExists('ainv_secondary_share_order_book'); Schema::dropIfExists('ainv_spv_registries'); }
};
// Controller: SecondaryOrderBookController@show (order book bids emerald/asks crimson spread), place (VerifyInvestorKYCTier + escrow verification + Reverb private-orderbook.{listing_id} + price-time priority matching)
```

### 7.7 `ainv_investor_aml_audit_logs` & `ainv_capital_call_schedules` — AML Hash Chain + Tranche Releases

```php
// database/migrations/2026_09_15_000055_create_ainv_aml_capital_call_tables.php — MySQL
return new class extends Migration {
 public function up(): void {
  Schema::create('ainv_investor_aml_audit_logs', function(Blueprint $t){
   $t->id(); $t->char('uuid',36)->unique();
   $t->foreignId('investor_user_id')->constrained('users')->cascadeOnDelete();
   $t->foreignId('kyc_verification_id')->nullable()->constrained('ainv_investor_kyc_verifications')->nullOnDelete();
   $t->foreignId('campaign_id')->nullable()->constrained('ainv_equity_campaigns')->nullOnDelete();
   $t->decimal('risk_score',5,2)->comment('Agent13 0-100');
   $t->json('checks')->comment('{velocity, circular_loop, sybil, source_of_funds}');
   $t->enum('decision',['pass','review','freeze'])->default('pass')->index();
   $t->char('hash_prev',64)->nullable(); $t->char('hash_current',64)->comment('SHA256 chain immutable');
   $t->timestamps();
   $t->index(['investor_user_id','decision','created_at']);
  });
  Schema::create('ainv_capital_call_schedules', function(Blueprint $t){
   $t->id(); $t->char('uuid',36)->unique();
   $t->foreignId('campaign_id')->constrained('ainv_equity_campaigns')->cascadeOnDelete();
   $t->smallInteger('tranche_no')->unsigned();
   $t->string('milestone_title',255);
   $t->bigInteger('amount_subunit')->unsigned();
   $t->decimal('amount_pct',5,2)->comment('e.g., 30.00%');
   $t->date('target_date')->index();
   $t->enum('status',['pending','verified','released'])->default('pending')->index();
   $t->char('verification_hash',64)->nullable()->comment('SHA256(evidence+timestamp)');
   $t->dateTime('verified_at')->nullable();
   $t->foreignId('verified_by_user_id')->nullable()->constrained('users')->nullOnDelete();
   $t->json('evidence')->nullable()->comment('[photo/video, invoice]');
   $t->foreignId('escrow_id')->constrained('escrow_clearings')->cascadeOnDelete();
   $t->timestamps();
   $t->unique(['campaign_id','tranche_no']);
  });
  // Immutable trigger on aml logs: BEFORE UPDATE/DELETE SIGNAL 45000 'aml_audit_logs immutable'
  DB::statement("ALTER TABLE ainv_investor_aml_audit_logs ADD CONSTRAINT chk_aml_risk CHECK (risk_score BETWEEN 0 AND 100)");
  DB::statement("ALTER TABLE ainv_capital_call_schedules ADD CONSTRAINT chk_tranche_pct CHECK (amount_pct BETWEEN 0 AND 100)");
 }
 public function down(): void { Schema::dropIfExists('ainv_capital_call_schedules'); Schema::dropIfExists('ainv_investor_aml_audit_logs'); }
};
// Controller: CapitalCallController@requestRelease (founder uploads evidence), verifyMilestone (Agent7 HITL → escrow partial release tranche amount_pct + Reverb private-campaign.{id} milestone.released amber), auditLogs
```

### 7.8 Eloquent Models (Excerpt — Strict Types PHP 8.4 + HasAppIdScope)

```php
// App\Models\AinvRealEstateListing extends Model { use HasAppIdScope, SoftDeletes; table='ainv_real_estate_listings'; casts location=>Point, geofence=>Polygon, drone_footage=>array; relation fractional():HasOne AinvFractionalShare; scopeVerifiedByAgent7($q)=>where('is_verified_by_agent7',true); }
// App\Models\AinvFractionalShare extends Model { table='ainv_fractional_shares'; casts holdings=>array; method yieldForShares(int $n):int; }
// App\Models\AinvSpvRegistry extends Model { table='ainv_spv_registries'; casts verified_by_agent7_at=>datetime; }
// App\Models\AinvFranchiseOpportunity extends Model { use HasAppIdScope; table='ainv_franchise_opportunities'; casts territory_geofence=>Polygon; }
// App\Models\AinvEquityCampaign extends Model { use HasAppIdScope, SoftDeletes; table='ainv_equity_campaigns'; casts starts_at=>datetime, milestones=>array; method isThresholdMet():bool; }
// App\Models\AinvInvestmentContract extends Model { table='ainv_investment_contracts'; casts signed_at=>datetime; method verifyHash():bool; }
// App\Models\AinvInvestorKycVerification extends Model { table='ainv_investor_kyc_verifications'; casts tier_requested=>KycTier; }
// App\Models\AinvSecondaryShareOrderBook extends Model { table='ainv_secondary_share_order_book'; casts created_at=>datetime; scopeOpen($q)=>where('status','open'); }
// App\Models\AinvCapitalCallSchedule extends Model { table='ainv_capital_call_schedules'; casts target_date=>date; }
```

### 7.9 API Controllers (Skeleton — Thin Controllers → Actions/Services)

```
App\Modules\AUInvest\Http\Controllers\User\
  AinvRealEstateController@index (GIS SPATIAL + 3D tour + drone + yield Annual + Agent3 feasibility), show, fractionalBuy (VerifyInvestorKYCTier t2 + CalculatePropertyYields + lockForUpdate fractional_shares + Redis Mutex + escrow holding + SPV hash update + Reverb)
  AinvFranchiseController@discovery (territory_geofence ST_Contains), apply (VerifyInvestorKYCTier t2 + capital check + 2km overlap + Agent3/7 HITL), feasibilityStatus
  AinvEquityCampaignController@create (AU BUSINESS), list, invest (VerifyInvestorKYCTier t1 + EnforceEscrowThresholdLock + Redis campaign:raised INCRBY + escrow holding + Reverb), dashboard (Investor Relations quarterly reports + cash flow projection Agent1), refundCron
  AinvContractController@sign (OTP Redis contract:otp EX 300 → ECDSA + hash + Vault + Reverb private-investor), vault, download (AES-GCM decrypt)
  AinvKycController@verify (deterministic OCR + Agent7 legal + Agent13 AML → investor_aml_audit_logs hash_chain + private-hitl), status
  SecondaryOrderBookController@show (bids/asks spread + SPV verified badge), place (VerifyInvestorKYCTier t2 + escrow verification + price-time matching + Reverb private-orderbook)
  CapitalCallController@requestRelease, verifyMilestone (Agent7 HITL + escrow partial release + Reverb private-campaign milestone.released)
```

### 7.10 Events & Reverb Channels (Laravel Reverb 8080 wss — exclusive)

```php
// App\Events\MerchantCatalogUpdatedEvent (AU BUSINESS) → AU INVEST listener InvalidateAuInvestCacheListener { Redis::del("b2c:catalog:AU_INVEST:*"); Redis::GEOADD invest:geo:{governorate}; broadcast("catalog.updated")->toOthers(); }
// App\Events\FractionalShareBought { listing_id, buyer_masked, shares, price } → broadcast private-property.{listing_id}
// App\Events\MilestoneVerified { listing_id, milestone_no, completion_pct } → broadcast private-property.{listing_id}
// App\Events\CampaignInvestmentPlaced { campaign_id, investor_masked, amount } → broadcast private-campaign.{campaign_id} + Redis campaign:raised
// App\Events\CampaignThresholdFailed { campaign_id } → broadcast private-campaign.{campaign_id} + FCM refund
// App\Events\DividendCredited { investor_id, amount, yield_pct } → broadcast private-investor.{user_id} + wallet Reverb
// App\Events\OrderBookMatched { listing_id, bid_id, ask_id, price } → broadcast private-orderbook.{listing_id}
// App\Events\ContractSigned { contract_id, hash, investor_id } → broadcast private-investor.{user_id}
// App\Events\CapitalCallReleased { campaign_id, tranche_no, amount_pct } → broadcast private-campaign.{campaign_id}
// Channels: private-catalog.AU_INVEST, private-property.{listing_id}, private-campaign.{campaign_id}, private-orderbook.{listing_id}, private-investor.{user_id}, presence-invest.{governorate}, private-hitl (Agent7/13 queue)
```

### 7.11 OpenAPI / REST Summary (Excerpt)

```
GET    /api/v1/au-invest/listings?governorate&category&yield_min&location&radius → 200 {listings[], spv_verified, feasibility_score}
GET    /api/v1/au-invest/listings/{uuid} → 200 {listing, milestones[], fractional:{total_shares, available, share_price}, spv_registry, calculator}
POST   /api/v1/au-invest/fractional/{listing}/buy {shares} → 201 {holding, escrow_holding} 403 kyc_tier_insufficient
GET    /api/v1/au-invest/franchises?category&territory → 200 {opportunities[]}
POST   /api/v1/au-invest/franchises/{opportunity}/apply {proposed_location, capital_proof} → 201 {application financial_eligible} 409 geofence_overlap 2km
GET    /api/v1/au-invest/campaigns → 200 {campaigns[] threshold_met?}
POST   /api/v1/au-invest/campaigns/{campaign}/invest {amount} → 201 {investment holding} 422 campaign_not_investable 403 kyc
GET    /api/v1/au-invest/portfolio → 200 {active_investments[], cash_flow_projection, dividend_history, quarterly_reports[]}
POST   /api/v1/au-invest/contracts/{contract}/sign {otp} → 200 {hash, signature_ecdsa} (OTP 6-digit)
POST   /api/v1/au-invest/kyc/verify {tier, documents, source_of_funds} → 201 {kyc under_review} (Agent7+13)
GET    /api/v1/au-invest/order-book/{listing} → 200 {bids[], asks[], spread, spv_hash}
POST   /api/v1/au-invest/order-book/{listing}/place {type:bid|ask, price_per_share, shares} → 201 {order open} → matched via engine
POST   /api/v1/au-invest/capital-call/{campaign}/milestone/verify {tranche_no, evidence} → 200 {verified → escrow released pct}
GET    /api/v1/au-invest/vault/contracts → 200 {contracts[] hash_chain}
```

---

## 8) BLUEPRINT VERIFICATION & HANDOFF

- **Cinematic Hybrid Duality (Phase 3.0 tokens):** Every widget uses `data-theme=hybrid` — `bg-[#FAFAFA]/86 backdrop-blur-md border-[#F4F4F5] shadow-[0_8px_32px_rgba(9,9,11,.06)]` on `canvas #09090b` — tokens `var(--canvas-background) var(--surface-primary)` re-skin hybrid without `.tsx` change — verified `stylelint color-no-hex` except tokens. `obsidian #09090b` canvas + `Neo-White frost` panels achieve **50/50 balanced contrast** + `particle network 42 nodes + proximity --cx/--cy` encapsulated in `tokens.css` `BackgroundLayer`.
- **13-Agent Lock:** Agent 1 (CFO → portfolio & yield cash-flow), Agent 3 (CMO → feasibility & opportunity), Agent 7 (CLO → legal screening & SPV), Agent 13 (Fraud Sentinel → KYC/AML & Sybil) embedded per §6 — exact Table 1.3 titles, no alias renumbering, no 14th. `agent_actions` ledger `hitl_required` when `confidence<90` + `Hard-blocked auto-sign without Super Admin` for Agent 7.
- **Master HQ & AU BUSINESS Continuity:** AU INVEST reads via `MerchantCatalogUpdatedEvent → Redis del + GEO + Reverb private-catalog.AU_INVEST` — same `TopHeader AU BUSINESS core`, same `Calibrator 100→90 SelfHealing`, same `HITL 4 CTAs Approve/Reject/Modify/AskLater` (Master HQ Screen 1 queue for Agent 7/13).
- **Micro-Sprint Compliance:** This blueprint respects `1-3 files/150 lines` future sprints — migrations split per §7.1→7.7, each `≤130` lines, `DB::transaction + lockForUpdate + Redis Mutex` everywhere, `app_id='AU_INVEST'` scope.
- **Follow-up Sprints:** Phase 3.5 execution will migrate per §7 in order `000050→000055`, seeding `spv EG-2026-441 + franchise payback + campaign threshold 70% + KYC tiers + SPV hash` , then `Inertia Pages/AU INVEST/` `ListingsGIS, FractionalYieldSimulator, FranchiseROI, CampaignVault, ContractVault, OrderBook, InvestorDashboard`.

**ملخص عربي:** منصة AU INVEST الاستثمارية — نظام رأس مال هجين 4 محاور (عقارات بيع/تجزئة حصص ريعية، فرنشايز ووكالات برسوم وامتياز وCAPEX، شراكات وتمويل مشاريع حشد جماهيري بحجز عتبة 70% واسترداد كامل عند الفشل، تأجير معدات) مع خريطة GIS ثلاثية الأبعاد + جولات Matterport + طائرات مسيرة ومراحل إنشاء موثقة، تجزئة حصص `SPV` وسوق ثانوي دفتر أوامر سيولة، حاسبة عائد ديناميكية، مسار فرنشايز 4 مراحل بفحص جدوى `Agent 3/7`، خزنة حشد بعتبة اسكرو وجدول استدعاءات رأس مال مرحلي، عقود توقيع تشفيري OTP وهاش، تحقق KYC/AML متدرج `T1/T2/T3` بحراسة `Agent 7+13`، وعقول مضمنة (1 محفظة وعائد، 3 جدوى وفرص، 7 قانونية وSPV، 13 احتيال) + حزمة 7 هجرات `ainv_` PHP 8.4 + 3 وسطاء — جاهزة للمعاينة الهجينة المتوازنة `#09090b + #FAFAFA`.

*Next: Visual Preview `docs/PREVIEW_AU_INVEST.html` Hybrid Obsidian-Pearl #09090b particle network + Neo-White frost #FAFAFA panels + amber/crimson/cyan/emerald + 4-axis switcher + 3D timeline + yield simulator + franchise calculator + order book + e-sign — temp file `rm docs/PREVIEW_AU_INVEST.html` — PROJECT_STATE v3.7 `PHASE 3.5 DONE`*
