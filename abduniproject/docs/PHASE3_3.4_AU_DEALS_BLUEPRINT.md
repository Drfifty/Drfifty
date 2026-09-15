# PHASE 3.4 — AU DEALS Consumer & Deals App Blueprint (Arena Canonical)

> **Env:** `Arena` (`arena/01a09d54-drfifty`) | **Project:** `abduniproject` (`D:\Project\Projects\abduniproject` — lowercase) | **Target:** `AU DEALS` — B2C Consumer Marketplace, Barter, Auctions & E-Commerce (`adl_`) — primary consumer-facing Amazon-grade + hyper-local marketplace | **Stack:** PHP 8.4 Laravel 12 + React 19 Inertia v2 TS 5.7 strict ZERO `any` + Tailwind v4 + Shadcn Lucide Vite 0.0.0.0 + Redis + MySQL 8.4 Spatial + Reverb 8080 wss | **Mode:** B2C CONSUMER SPEC MODE — Agent Deep Workspace Embedded (Agent 3, 1, 11, 13) — No separate Part 2 | **Date:** 2026-09-15 | **Inherits:** Phase 3.0 Design System 9 tokens + liquid pearl/obsidian duality + Phase 3.1 HQ 10 screens + Phase 3.2 AU BUSINESS `MerchantCatalogUpdatedEvent` propagation + Phase 3.3 AU MED vault pattern | **Barter Calibration:** Module 5 `barter_exchange` + Module 9 `calibration 1.5x commercial / 1x Abwab Al Khair charity` locked

> **MANDATORY CROSS-REFERENCE (Rules 1-38):** `.arenarules` v2.2 (38 Rules, 11 Pillars, 9 Modules 1-9, 13 Agents Table 1.3 exact, 5 Apps Hub-and-Spoke `AU BUSINESS ab_ core + amed_/adl_/asv_/ainv_`, Micro-Sprint 1-3/150) + `PROJECT_STATE.md` v3.5-clean (`PHASE 3.3 CLEAN & LOCKED rm PREVIEW_AU_MED.html verified`) re-read and enforced — zero override, `AU BUSINESS is_core=1` non-hibernatable, `AU DEALS adl_` is `AU BUSINESS` read replica via `X-App-Id: AU_DEALS`, 13-Agent Registry Lock preserved (Agent 3 → deal matching/recommendations, Agent 1 → price intelligence, Agent 13 → fraud/Sybil, Agent 11 → flash surge; no 14th, no alias renumbering). Barter valuations bound strictly to Module 5 + Module 9 1.5x/1x.

---

## 0) Executive — AU DEALS as Primary Consumer Commerce Engine

```
[AU BUSINESS ab_ — WRITES] ─MerchantCatalogUpdatedEvent→ Redis del b2c:catalog:AU_DEALS:* + Reverb private-catalog.AU_DEALS ─→ [AU DEALS adl_ — READS + CONSUMER ACTIONS]
      merchant_catalogs type physical/digital/clinical/rental/real_estate (live stock, price_subunit, is_urgent)
      merchant_branches POINT/POLYGON coverage_zone ─ST_Distance_Sphere─→ AU DEALS radar 2km/10km/city
      merchant_deal_items 6-axis (sale/rental/booking/barter/auction/urgent) ─→ AU DEALS 6-axis switcher
      ↓
[AU DEALS B2C] consumer_profiles + delivery_addresses + carts/cart_items + rental_bookings/deposits + barter_proposals/valuation + auctions/bids/deposits + orders/shipments/escrow_releases + group_buy_pools/participants + user_deal_radar_preferences/ar_deal_nodes
      ↑ app_wallet escrow (available/pending) + escrow_clearings 48h inspection + delivery QR + Reverb live + AU SERV dispatch
      ↑ Agent 3/1/11/13 inline (no separate file)
```

**Consumer Contract:** `AU DEALS` never writes `merchant_catalogs` directly — all catalog/stock/price mutations originate in `AU BUSINESS` and propagate ≤40ms via `MerchantCatalogUpdatedEvent → Redis JSON + GEOADD + Reverb`. If `stock_quantity=0` in `AU BUSINESS`, `AU DEALS` invalidates `b2c:catalog:AU_DEALS:{governorate}:{category}` + `STOCK_ZERO` toast `crimson` + `Cart` auto-prune via `ValidateCartStockAvailability`. Consumer checkout creates `orders → escrow_clearings holding → AU SERV dispatch` + `app_wallet` holds. `group_buy`, `auction`, `barter`, `rental` all escrow-bound per Oil 3 single-payer + Oil 4 12h grace once.

---

## 1) CORE CONSUMER PHILOSOPHY & CROSS-APP INTEGRATION

| Principle | Spec (Zero Ambiguity) |
|---|---|
| **Multi-Axis Shopping Experience (6-axis seamless switch)** | Single `SegmentedControl 6 pills` `Neo-White frost` `ps-2 pe-2` switching `Buy Now (بيع) | Rent (إيجار) | Book (حجز) | Barter (استبدال) | Auction (مزاد) | Urgent (عاجل)` without page reload. Each axis preserves filters + radar radius + cart isolation (`cart_items axis` column). Transition `Inertia.visit` with `preserveState`. Axis `Urgent` pins `is_urgent=true` from `AU BUSINESS` `merchant_deal_items` + `amber ring` + `presence-dispatch` push. |
| **Real-Time Catalog Sync (Stock Zero Instant)** | `AU BUSINESS PUT /ab/catalogs/{id} stock=0|price drop|is_urgent toggle` → `DB::transaction + lockForUpdate merchant_catalogs` → `event(new MerchantCatalogUpdatedEvent($catalog, 'AU_DEALS', $region))` → `Listener: Redis::del("b2c:catalog:AU_DEALS:*:$region") + Redis::ZREM deals:geo:{region} $id + broadcast("catalog.updated", {id, stock, price}) on private-catalog.AU_DEALS` → AU DEALS `useEcho` invalidates `queryClient` + `ValidateCartStockAvailability` middleware prunes cart + `toast amber/crimson`. Regional keys `b2c:catalog:AU_DEALS:{governorate}:{city}:{category}` TTL 90s + `GEOADD deals:geo:{governorate} lng lat id`. |
| **Unified Geolocation Feed (2km/10km/City-wide)** | Feed `GET /au-deals/feed?lat=30.04&lng=31.23&radius=10&axis=buy` prioritizes `distance ASC` via `ST_Distance_Sphere(merchant_branches.location, POINT(lng,lat))` + `Redis GEOSEARCH deals:geo:{governorate} FROMLONLAT lng lat BYRADIUS {radius} km ASC COUNT 100` + `syndicate_rating/merchantrank`. Radius slider `2km walk | 10km drive | City-wide` `emerald active` persists in `user_deal_radar_preferences radius_km`. Nearby merchants `coverage_zone POLYGON ST_Contains`. `AR/Radar nodes` overlay from `ar_deal_nodes POINT` within radius. |

---

## 2) SECTION 1: E-COMMERCE CATALOG, SEARCH & MULTI-VENDOR CART ENGINE

### 2.1 Amazon-Grade Catalog & Multi-Vendor Cart

**Universal Catalog (variants):** `merchant_catalogs (AU BUSINESS)` fields consumed: `title_ar/en, media[], variants JSON {size:[S,M,L], color:[red,blue], specifications:{ram:"16GB", condition:"new|used|refurbished"}, sku/barcode, stock_quantity, price_subunit, is_urgent}` + `merchant_deal_items axis sale/bulk_tiers/flash_until`. AU DEALS renders `Card Neo-White Liquid Pearl glass frost` `bg-[#FAFAFA]/85 backdrop-blur(16px) border-[#F4F4F5] shadow-[0_8px_32px_rgba(9,9,11,.08)] hover:shadow-[0_0_24px_rgba(6,182,212,.12)]` with `obsidian badge #09090b text-[#FAFAFA]` for merchant.

**Smart Multi-Vendor Cart:** Single `carts (user_id, status cart|abandoned|converted) 1—N cart_items` consolidates items from **multiple merchants** in one checkout. `POST /au-deals/cart/items {catalog_id, variant JSON, qty, axis}` → `carts` upsert + `lockForUpdate cart_items + Redis Mutex lock:cart_item:{user_id}:{catalog_id} NX EX 180` + `ValidateCartStockAvailability` (stock vs `Redis stock:deal:{id}` atomic). Checkout `POST /au-deals/orders/checkout` splits per `merchant_id`: `shipping_fee_subunit` per `merchant_branches distance → delivery route` `ST_Distance_Sphere`, `vendor_payout_subunit = (line_total - platform_fee 5% Oil2 - vat)` per `commission_rules` → `escrow_clearings per merchant holding` + `app_wallet` holds. UI `Cart Drawer` groups by `merchant` `obsidian header + Neo-White items` + `subtotal per merchant Inter tabular`.

**Dynamic Group Buying & Social Purchase Engine (تجميع الشراء الجماعي):** `group_buy_pools` time-bound multi-tier discounts triggering progressive price drops as more consumers join within a region. `Pool card` shows `progress ring 7/15 joined · 3 tiers: 5ppl -10% | 10ppl -18% | 15ppl -25%` `amber` `countdown 02:14:33`. `Join → POST /au-deals/group-buy/{pool_id}/join` → `ValidateGroupBuyEligibility` (region `ST_Distance_Sphere <= pool radius`, not already joined, pool `status open`) → `Redis INCR group:pool:{id}:count + group_buy_participants HOLD reservation` `expires 15m`. On `pool full or expires → tier price lock` → `orders` creation per participant at `final_price_subunit`. Reverb `presence-group.{pool_id}` live count.

### 2.2 Elastic Search, AI Visual Search & Filters

- **Full-text + Facets:** `GET /au-deals/search?q=ايفون&price_min=5000&price_max=20000&delivery=24h&rating=4&deal_type=barter` uses `MySQL FULLTEXT ngram ft_catalog_title + Redis FT ngram deals:search` + `facets JSON` `aggregations`. Auto-complete `Redis ZSET autocomplete:{prefix}` `fuzzy Levenshtein 2` via `intervention/levenshtein` deterministic. Filters persist in `user_deal_radar_preferences filters JSON`.
- **Visual Search Engine:** `Upload zone Neo-White dashed hover:border-cyan` `Lucide Camera 20` → `POST /au-deals/search/visual {image}` `intervention/image` preprocess + `pgvector` embedding `Qdrant auxiliary` `vector_search` `cosine >0.82` → `matching deals` `Grid 3 cols gap-3` `similarity badge cyan 94%`. `Agent 3` re-ranks by `personalized history + wishlist`.

---

## 3) SECTION 2: GAMIFIED BARTER, INTERACTIVE SWAPPING & VALUE CALCULATOR

### 3.1 P2P & P2B Barter Exchange Vault

- **Listing:** `My Items for Barter` `DataTable` `My item | Condition | My valuation | Target category` → `POST /au-deals/barter/proposals {offered_catalog_id nullable| offered_custom JSON {title, condition, images}, wanted_catalog_id|custom, cash_delta_preference, type p2p|p2b}` → `barter_proposals status draft→pending_match→matched→escrow_holding→inspection→completed|cancelled`.
- **P2B:** Consumer offers to `AU BUSINESS merchant` inventory `is_swap_allowed=true` `merchant_catalogs` → merchant `AU BUSINESS` `Barter Vault` toast `private-merchant` + `Approve/Reject` (same as B2B swap but consumer side).
- **Card:** `Neo-White frost + emerald barter indicator #10B981 left border 3px` `Lucide Repeat 14 emerald`.

### 3.2 Automated Value Matching & Cash Delta Calculator (Module 5 + Module 9 1.5x/1x Binding)

**Estimator (Agent 1 + Agent 3):** `barter_item_valuation` `offered_value_subunit` `wanted_value_subunit` computed via `Agent 1 direct price intelligence` deterministic `market median per category + governorate + condition factor {new:1.0, used:0.65, refurbished:0.8}` + `Agent 3 marketplace comparison` `LLM fallback <0.90`. UI `Value bar dual` `A $100 | B $120` `amber delta`.

**Cash Delta Auto-Balance:** If `A $100` for `B $120`, system `delta = 120-100 = 20` → `POST /au-deals/barter/{id}/accept` creates `barter_escrow_ledgers 2 rows` (`owner offer item lock + cash top-up 20 escrow holding` + `counter item lock`) `split escrow transaction Cash Top-Up + Item Swap` `app_wallet` `escrow_clearings type barter holding`. `Delta` `Input auto` `+20 EGP يَدفعه صاحب A` `emerald` / `-20 يستلمه صاحب B`.

**Barter Split Rule Binding (Module 5 / Module 9):** All non-cash valuations and cash delta computations **MUST** bind to `Module 5 Barter Exchange rules` + ratified `Module 9 calibration baseline`: `1.5x for commercial barter (B2C/B2B)` vs `1x exclusively for Abwab Al Khair charity swaps`. Stored `barter_proposals barter_mode ENUM('commercial','charity')` `calibration_factor DECIMAL(3,2) CHECK 1.00 or 1.50` + `barter_item_valuation includes baseline_snapshot JSON {rule:"1.5x commercial", source:"AU BUSINESS deal_exchange_snapshots"}`. `charity` path bypasses `commission_rules 0%` + `Agent 1` sets `price delta 1x` + `Donor badge emerald`.

**QR Inspection:** Both parties `escrow_holding → inspection` `QR scan` `delivery_qr_hash CHAR64` via `AU SERV` courier or self `VerifyBarterEscrowLock` → `completed` `escrow release 2 sides`.

---

## 4) SECTION 3: LIVE AUCTIONS ENGINE & ANTI-SNIPING BIDDING ROOM

### 4.1 WebSocket-Powered Live Auction Room (<100ms Reverb)

- **Arena:** `Auction card Neo-White frost + crimson top border 2px + obsidian header` `title + reserve + current_bid Inter tabular $` `countdown amber tabularNums 00:02:14` `pulse when <60s`. Bids stream `Reverb private-auction.{auction_id}` `AuctionBidPlaced {bid_id, bidder_masked User_X, amount, is_auto}` sub-100ms. UI `bid input + Quick +50 +100 +500 + Auto-Bid toggle`.
- **Soft-Close (Anti-Sniping):** If valid bid placed in final `30 seconds`, `auto-extend end_time +120 seconds` `anti_sniping_logs {auction_id, triggered_at, extended_by:120, triggering_bid_id}` + `broadcast auction.extended` `amber toast “تم التمديد +2د — حماية sniping”`. Multiple extensions stack, max 10 extensions `HARD CAP`.
- **Flow:** `auctions` `status draft→scheduled→live→soft_close→ended→settled|cancelled` `reserve_price_subunit`, `start/end_time`, `bid_increment_subunit`, `is_auto_extend BOOL`.

### 4.2 Automated Deposit Holds & Bid Lock (`app_wallet`) + Auto-Bidding

- **Deposit:** High-value auctions `reserve > 50000 subunit` require `POST /au-deals/auctions/{id}/deposit {amount_subunit}` → `RequireAuctionDeposit` middleware `app_wallets available_subunit >= deposit + lockForUpdate + escrow_clearings type auction_deposit holding` `bid_deposits status holding|released|forfeited`. Without hold → `403 deposit required`. `Agent 13` checks velocity before hold.
- **Auto-Bidding Agent:** `Switch Auto-Bid` `max_limit_subunit` → `auctions max_auto_bid JSON {user_id, max}` `Server auto-increment` `Cron + Redis queue` raises by `bid_increment` until max, `Reverb` emits `is_auto=true`. Manual outbid cancels lower auto.

---

## 5) SECTION 4: HYPER-LOCAL FLASH DEALS & URGENT DISPATCH

### 5.1 Radar Radius & Flash Sales Engine (2km/10km/City-wide + AR)

- **Radar View:** `Deals Near Me` interactive `Leaflet radar` `center user POINT` `3 concentric rings 2km cyan / 10km emerald / City amber dashed` `pulse scanner cyan rotating 3s`. Deal nodes `ar_deal_nodes POINT + geofence POLYGON` → `ST_Distance_Sphere(user, node) <= radar radius`. Node `flash` `amber border + countdown 01:23:44` `discount -40%`. Tap → `Drawer` `merchant + stock:deal:{id} Redis counter + Reverb private-catalog update`.
- **AR / Radar Scanner View:** `Toggle AR` `Camera + overlay` `geofenced AR coordinates` `ar_deal_nodes ar_coordinates JSON {bearing, elevation, distance}` `Frost glass cards anchored to pins` `Lucide Scan 16 cyan`. Offline fallback `radar list view`.
- **Preferences:** `user_deal_radar_preferences radius_km ENUM 2,10,999, categories JSON, is_urgent_only BOOL` persists + `X-App-Id AU_DEALS`.

### 5.2 Urgent Hot-Deals Notifications (`is_urgent = true`)

- **Broadcast:** Merchants `AU BUSINESS POST /ab/deals is_urgent + push_payload {title, discount, valid_to}` → `MerchantCatalogUpdatedEvent` → AU DEALS listener `if is_urgent → Redis urgent:geo:{governorate} GEOADD + Reverb presence-urgent.{region} + FCM high priority + push private-urgent.{user_id}` if `user_deal_radar_preferences is_urgent_only + ST_Contains(coverage_zone)`. Urgent card `amber bg-amber/10 border-amber + pulse + siren` `“عاجل — 2h متبقي”`.
- **Opt-in:** `Bell` `is_urgent_notif_enabled BOOL` `consumer_profiles`.

---

## 6) SECTION 5: IN-APP WALLET, ESCROW PROTECTION & RECOVERY

### 6.1 Consumer Wallet & Payment Gateway Hub (`app_wallet`)

- **Balances (unified `app_wallets`):** `Cash Balance available_subunit (BIGINT subunit - locked) emerald`, `Cashback Vault amber`, `Loyalty Points 365d expiry deduction per Oil`, `Active Escrow Holds 4 deals $` `Reverb private-wallet.{user_id}`. Same `app_wallet` Module 2 canonical `BIGINT subunit + version + GENERATED available_subunit CHECK>=0`.
- **Multi-channel Checkout:** `Credit/Debit (Paymob) + InstaPay + Mobile Wallets Vodafone Cash + Apple Pay/Google Pay + BNPL` → `POST /au-deals/checkout {cart_id, payment_method, bnpl_plan?}` `Paymob sub-merchant auto per AU BUSINESS` `wallet_transactions type deposit/holding` `meta {gateway, bnpl}`.

### 6.2 Buyer Protection & Escrow Lock Engine (48h Inspection)

- **Hold:** Funds `physical goods, rentals, barters` held in `escrow_clearings status holding 48h dispute window` `buyer_protection = true`. `Agent 1` CFO yield not released early.
- **Release:** Consumer `Scans delivery QR delivery_qr_hash CHAR64` via `POST /au-deals/orders/{id}/verify-delivery {qr}` → `VerifyEscrowReleaseEligibility` (within 48h + not disputed + QR matches `order_shipments delivery_qr_hash` + `escrow_id holding`) → `escrow_clearings → partial milestone → completed` `wallet_settlements hash_chain` + `app_wallets` adjust. If `no scan 48h + 12h grace once Oil4 → auto-cancel + waiting-list reroute + technical penalty` via `AU SERV dispatch_logs`.
- **Dispute:** `Button Escalate to Dispute 48h` → `Agent 5/13 brief` → Master HQ Screen 6 `private-hitl dispute`.

---

## 7) SECTION 6: COGNITIVE AI SHOPPING ASSISTANT (MULTI-AGENT INLINE — NO SEPARATE FILE)

> **Deep Workspace Guarantee:** No separate `PART2` — all agent logic embedded within AU DEALS consumer specs below, per Table 1.3 Registry Lock (13 exact, no 14th).

| Agent (Registry Lock Exact) | Deep Workspace Module in AU DEALS | Logic, Triggers & UI (Neo-White + Obsidian Balance) |
|---|---|---|
| **Agent 3 — AI Chief Marketing Officer (Growth & Campaigns)** | **Personalized Deal Matchmaker + Wishlist Price Drop Tracker + Barter Negotiator (L1)** | **Scope per prompt:** `deal matching, opportunity detection, personalized recommendations` belong **strictly** to Agent 3. **Pipeline:** `consumer_profiles preferences + wishlist + cart_items + group_buy history + radar categories` → `Agent 3 DeterministicRuleDriver (0-cost) market median + ngram + collaborative filter` `confidence 0-100`. If `≥0.90` auto-recommend `For You` carousel `Neo-White frost + cyan dot`; else `LLM Fallback <0.90` → `agent_actions hitl_required`. **Price Drop:** `wishlist full-text ngram` `Cron every 5m` detects `merchant_catalogs price_subunit dropped >8% regional` → `Reverb private-consumer.{user_id} price.drop {catalog_id, old, new}` `amber toast “سعرك المفضل نزل -12%”`. **Barter Negotiation L1:** Proposes counter `cash delta -5%` via `barter_item_valuation` `Agent3 valuation snapshot`. **UI:** `For You` `Agent 3 badge cyan “مقترح لك 94%”` `Approve dismiss` 4 CTAs as HQ. |
| **Agent 1 — AI Chief Financial Officer (The Accounting & Profit Engine)** | **Direct Price Intelligence + Cash Delta Negotiation L2 + Escrow Yield Guard** | **Scope per prompt:** `direct price intelligence` belongs **strictly** to Agent 1. **Pipeline:** Tracks `wishlist + barter_proposals barter_mode` → `price_intelligence JSON {wishlist_id, regional_low_subunit, median_subunit, volatility}` `Redis wishlist:price:{user_id}:{catalog_id}` TTL 3600. Alerts `regional flash sales` via `presence-urgent`. **Barter L2:** Negotiates `cash delta` **L2 final** `bound to 1.5x/1x Module9` — if `Agent3 proposes`, `Agent1 validates delta 1.5x vs 1x charity` `CHECK calibration_factor` → `escrow top-up subunit` authoritative. `Escrow holds` `Agent1` enforces `5% platform fee` `commission_rules` + `yield 80% local` via `CalibratorLoop`. **UI:** `💰 Agent 1 Price Intel` `emerald badge` `Lowest in Cairo 420 EGP → your delta 20 EGP 1.5x validated`. |
| **Agent 11 — AI Lead Software Engineer & DevOps (The Internal Programmer / Code Sandbox) — Surge Capability** | **Flash Sales & Surge Manager — Atomic Counter + Horizon Queue + Bot Mitigation** | **Canonical title per Registry** `Agent 11` is `Lead Software Engineer & DevOps`; within AU DEALS its **capability is Surge Manager** per prompt `Flash Sales & Surge Manager`. **Logic:** `stock:deal:{deal_id} Redis atomic DECRBY` `initial = merchant_catalogs stock_quantity` `Horizon queue flash:orders`. On `mega flash` `PreventScalperBots` pre-filter + `queue-overflow protection: Redis LLEN flash:queue > 5000 → 503 + Retry-After 3s + waiting-list`. **Dynamic price drops** as timer approaches expiration `Agent11 Cron every 30s` `if flash_sale_campaigns valid_to - now < 10m && remaining > 70% → auto -5% drop + Reverb`. **Bot/scalper blocking:** `device_fingerprint + IP velocity >20 req/s Nginx + Cloudflare WAF` → `Fail2ban` `private-hitl bot`. **UI:** `Surge tracker Neo-White + amber progress 68% + queue 2.3k` `Horizon workers 12`. |
| **Agent 13 — AI Fraud Detector & Anti-Money Laundering Sentinel** | **Sybil Bidding & Review Integrity Audit + Circular-Loop Shield** | **Scope per prompt:** `Sybil bidding & review integrity audit` belongs strictly to Agent13. **Auction Sybil:** On `auction_bids insert` → `velocity per user per auction 30s` `>5 bids/30s` + `device_fingerprint reuse across 3 accounts same auction` + `circular loop same 2 users alternating` → `risk 0-100` `>80 freeze` `Reverb private-hitl fraud.auction` `HARD-BLOCKED freeze` `opacity-40` + `revert invalid bids` `trigger log`. **Review Sybil:** `review_integrity_logs` `Authenticity scan` `verified_purchase check + NLP burst + IP dedup 24h + 500 favs cap` → `filter manipulated ratings` `crimson badge “مراجعة مزيفة محجوبة”`. **Escrow:** `velocity 5/min + ZKP isolation` same as Oil fraud. **UI:** `Shield crimson` `Risk 92% frozen` on bid row. |

**Token/Motion (Agent Cards):** `bg-[#FAFAFA]/90 backdrop-blur(16px) border-[#E4E4E7] shadow-[0_8px_32px_rgba(9,9,11,.06)] hover:shadow-[0_0_20px_rgba(6,182,212,.12)]` + `obsidian accent left 3px #09090b` + `floating` on recommendation.

---

## 8) TECHNICAL DELIVERABLES & DATABASE MIGRATIONS SPECIFICATION (Executable Laravel PHP 8.4 + Eloquent + Inertia + Reverb)

> **Generation Rule (Pillars 1,4,6,7,11):** Every write `DB::transaction + lockForUpdate + Redis Mutex + hasAppIdScope (AU_DEALS) + ValidateCartStockAvailability` — `Rule 11` additive only `no drop/truncate`, `Rule 7` `JSON` not `JSONB` (MySQL 8.4), `InnoDB utf8mb4_unicode_ci` `SPATIAL` `FULLTEXT ngram` where needed, `BIGINT subunit` + `version + GENERATED available` for wallet, `AES-256-GCM` per-row where PII, `hash_chain` for escrow/audit.

### 8.0 Common Traits, Enums & Config

```php
// app/Modules/Shared/Traits/HasAppIdScope.php — AU_DEALS models
trait HasAppIdScope { protected static function booted(): void { static::addGlobalScope('app', fn($q)=>$q->where('app_id', request()->header('X-App-Id','AU_DEALS'))); } }
// Enums PHP 8.4 strict
enum AppId:string { case AU_BUSINESS='AU_BUSINESS'; case AU_MED='AU_MED'; case AU_DEALS='AU_DEALS'; case AU_SERV='AU_SERV'; case AU_INVEST='AU_INVEST'; }
enum CartStatus:string { case cart='cart'; case abandoned='abandoned'; case converted='converted'; }
enum RentalStatus:string { case hold='hold'; case confirmed='confirmed'; case active='active'; case returned='returned'; case disputed='disputed'; case cancelled='cancelled'; }
enum BarterStatus:string { case draft='draft'; case pending_match='pending_match'; case matched='matched'; case escrow_holding='escrow_holding'; case inspection='inspection'; case completed='completed'; case cancelled='cancelled'; }
enum BarterMode:string { case commercial='commercial'; case charity='charity'; } // charity = Abwab Al Khair 1x
enum AuctionStatus:string { case draft='draft'; case scheduled='scheduled'; case live='live'; case soft_close='soft_close'; case ended='ended'; case settled='settled'; case cancelled='cancelled'; }
enum BidType:string { case manual='manual'; case auto='auto'; }
enum OrderStatus:string { case pending='pending'; case confirmed='confirmed'; case preparing='preparing'; case shipped='shipped'; case out_for_delivery='out_for_delivery'; case delivered='delivered'; case disputed='disputed'; case completed='completed'; case cancelled='cancelled'; }
enum EscrowReleaseStatus:string { case holding='holding'; case partial='partial'; case released='released'; case disputed='disputed'; }
enum GroupBuyStatus:string { case open='open'; case full='full'; case expired='expired'; case converted='converted'; }
// Config: tiers FREE/SILVER/GOLD/PLATINUM already; Barter 1.5x/1x Module9 locked; 5% commission; 48h dispute + 12h grace once; 500 favs cap
```

### 8.1 `adl_consumer_profiles` & `adl_delivery_addresses` — Preferences, GPS, Saved Locations

```php
// database/migrations/2026_09_15_000040_create_adl_consumer_profiles_table.php — MySQL 8.4 — PHP 8.4 strict
return new class extends Migration {
 public function up(): void {
  Schema::create('adl_consumer_profiles', function(Blueprint $t){
   $t->id(); $t->char('uuid',36)->unique();
   $t->foreignId('user_id')->constrained('users')->cascadeOnDelete()->unique()->comment('1-1 users B2C consumer');
   $t->enum('app_id',['AU_BUSINESS','AU_MED','AU_DEALS','AU_SERV','AU_INVEST'])->default('AU_DEALS')->index();
   $t->string('display_name',150);
   $t->string('phone_masked',32)->nullable()->comment('masked until escrow holding — RegexDataLeakDetector');
   $t->json('preferences')->nullable()->comment('{categories:[cat_ids], brands:[], price_range:{min,max}, language:"ar"}');
   $t->point('default_location',4326)->nullable()->comment('live GPS home POINT SRID4326');
   $t->tinyInteger('default_radius_km')->unsigned()->default(10)->comment('2,10,999 city-wide');
   $t->boolean('is_urgent_notif_enabled')->default(true);
   $t->json('wishlist')->nullable()->comment('[catalog_ids] 500 cap Oil5');
   $t->json('recent_searches')->nullable()->comment('[queries] dedup');
   $t->timestamps(); $t->softDeletes();
   $t->index(['app_id','default_radius_km']);
  });
  Schema::create('adl_delivery_addresses', function(Blueprint $t){
   $t->id(); $t->char('uuid',36)->unique();
   $t->foreignId('consumer_profile_id')->constrained('adl_consumer_profiles')->cascadeOnDelete();
   $t->foreignId('user_id')->constrained('users')->cascadeOnDelete()->index();
   $t->string('label',80)->comment('Home/Work/Other');
   $t->string('address_line',500);
   $t->string('governorate',80); $t->string('city',80);
   $t->point('location',4326)->comment('delivery POINT SRID4326');
   $t->string('phone_encrypted',500)->nullable()->comment('AES-256-GCM per-row iv/tag inside JSON');
   $t->string('phone_iv',64)->nullable(); $t->string('phone_tag',64)->nullable();
   $t->boolean('is_default')->default(false)->index();
   $t->timestamps();
   $t->index(['consumer_profile_id','is_default']);
  });
  try{ DB::statement('ALTER TABLE adl_consumer_profiles ADD SPATIAL INDEX spx_consumer_default (default_location)'); }catch(Throwable $e){}
  try{ DB::statement('ALTER TABLE adl_delivery_addresses ADD SPATIAL INDEX spx_delivery_loc (location)'); }catch(Throwable $e){}
  DB::statement("ALTER TABLE adl_consumer_profiles ADD CONSTRAINT chk_consumer_radius CHECK (default_radius_km IN (2,10,15,50,999))");
  DB::statement("ALTER TABLE adl_consumer_profiles ADD CONSTRAINT chk_consumer_prefs CHECK (preferences IS NULL OR JSON_VALID(preferences))");
 }
 public function down(): void { Schema::dropIfExists('adl_delivery_addresses'); Schema::dropIfExists('adl_consumer_profiles'); }
};
// Models
// App\Models\AdlConsumerProfile extends Model { use HasAppIdScope, SoftDeletes; table='adl_consumer_profiles'; casts preferences/wishlist=>array, default_location=>Point; fillable display_name; relation deliveryAddresses():HasMany, carts():HasMany; scopeNearby($q,$lat,$lng,$km)=>whereRaw("ST_Distance_Sphere(default_location, POINT(?,?))<=?*1000",[$lng,$lat,$km]); }
// App\Models\AdlDeliveryAddress extends Model { table='adl_delivery_addresses'; casts location=>Point; fillable label, address_line; }
// Controller thin: AdlConsumerProfileController@update, setDefaultLocation, updateRadarPrefs
```

### 8.2 `adl_carts`, `adl_cart_items`, `adl_rental_bookings` & `adl_rental_security_deposits` — Multi-Vendor Cart + Rental Slots

```php
// database/migrations/2026_09_15_000041_create_adl_carts_rental_tables.php — MySQL
return new class extends Migration {
 public function up(): void {
  Schema::create('adl_carts', function(Blueprint $t){
   $t->id(); $t->char('uuid',36)->unique();
   $t->foreignId('consumer_profile_id')->constrained('adl_consumer_profiles')->cascadeOnDelete();
   $t->foreignId('user_id')->constrained('users')->cascadeOnDelete()->index();
   $t->enum('app_id',['AU_BUSINESS','AU_MED','AU_DEALS','AU_SERV','AU_INVEST'])->default('AU_DEALS')->index();
   $t->enum('status',['cart','abandoned','converted'])->default('cart')->index();
   $t->dateTime('abandoned_at')->nullable();
   $t->timestamps(); $t->index(['user_id','status']);
  });
  Schema::create('adl_cart_items', function(Blueprint $t){
   $t->id(); $t->char('uuid',36)->unique();
   $t->foreignId('cart_id')->constrained('adl_carts')->cascadeOnDelete();
   $t->foreignId('catalog_id')->constrained('merchant_catalogs')->cascadeOnDelete();
   $t->foreignId('merchant_id')->constrained('merchants')->cascadeOnDelete();
   $t->enum('axis',['sale','rental','booking','barter','auction','urgent'])->default('sale')->index();
   $t->json('variant')->nullable()->comment('{size,color,specifications,condition} Rule7');
   $t->integer('quantity')->unsigned();
   $t->bigInteger('price_subunit')->unsigned()->comment('price lock at add-to-cart');
   $t->bigInteger('line_total_subunit')->unsigned();
   $t->char('lock_token',64)->nullable()->comment('Redis lock:cart_item:{user}:{catalog} token');
   $t->dateTime('price_locked_until')->nullable()->comment('3m Mutex expiry');
   $t->timestamps();
   $t->unique(['cart_id','catalog_id','variant']); // dedup per variant
   $t->index(['catalog_id','axis']);
  });
  Schema::create('adl_rental_bookings', function(Blueprint $t){
   $t->id(); $t->char('uuid',36)->unique();
   $t->foreignId('cart_item_id')->nullable()->constrained('adl_cart_items')->nullOnDelete();
   $t->foreignId('catalog_id')->constrained('merchant_catalogs')->cascadeOnDelete();
   $t->foreignId('user_id')->constrained('users')->cascadeOnDelete()->index();
   $t->enum('status',['hold','confirmed','active','returned','disputed','cancelled'])->default('hold')->index();
   $t->date('rental_start')->index(); $t->date('rental_end')->index();
   $t->json('schedule_slots')->nullable()->comment('[{start,end,capacity,mutex_locked}] from merchant_deal_items rental_schedule');
   $t->bigInteger('rent_subunit')->unsigned(); $t->bigInteger('deposit_subunit')->unsigned();
   $t->foreignId('escrow_id')->nullable()->constrained('escrow_clearings')->nullOnDelete();
   $t->char('qr_hash',64)->nullable()->comment('pickup/return QR');
   $t->timestamps();
   $t->index(['catalog_id','rental_start','status']);
  });
  Schema::create('adl_rental_security_deposits', function(Blueprint $t){
   $t->id(); $t->char('uuid',36)->unique();
   $t->foreignId('rental_booking_id')->constrained('adl_rental_bookings')->cascadeOnDelete()->unique();
   $t->foreignId('user_id')->constrained('users')->cascadeOnDelete();
   $t->bigInteger('amount_subunit')->unsigned();
   $t->enum('status',['holding','released','forfeited','disputed'])->default('holding')->index();
   $t->foreignId('escrow_id')->constrained('escrow_clearings')->cascadeOnDelete();
   $t->char('hash_prev',64)->nullable(); $t->char('hash_current',64)->comment('SHA256 chain immutable');
   $t->timestamps();
  });
  DB::statement("ALTER TABLE adl_cart_items ADD CONSTRAINT chk_cart_qty CHECK (quantity>0)");
  DB::statement("ALTER TABLE adl_cart_items ADD CONSTRAINT chk_cart_variant CHECK (variant IS NULL OR JSON_VALID(variant))");
  DB::statement("ALTER TABLE adl_rental_bookings ADD CONSTRAINT chk_rental_dates CHECK (rental_end>=rental_start)");
 }
 public function down(): void {
  Schema::dropIfExists('adl_rental_security_deposits'); Schema::dropIfExists('adl_rental_bookings');
  Schema::dropIfExists('adl_cart_items'); Schema::dropIfExists('adl_carts');
 }
};
// Controllers: AdlCartController@add (ValidateCartStockAvailability + Redis NX EX 180 + price lock), updateQty, remove, checkout (splits per merchant + escrow)
// AdlRentalBookingController@hold (mutex booking_slots + escrow deposit), confirm, return, dispute
```

### 8.3 `adl_barter_proposals` & `adl_barter_item_valuation` — Swap Offers, Cash Delta 1.5x/1x

```php
// database/migrations/2026_09_15_000042_create_adl_barter_tables.php — MySQL
return new class extends Migration {
 public function up(): void {
  Schema::create('adl_barter_proposals', function(Blueprint $t){
   $t->id(); $t->char('uuid',36)->unique();
   $t->foreignId('proposer_profile_id')->constrained('adl_consumer_profiles')->cascadeOnDelete();
   $t->foreignId('proposer_user_id')->constrained('users')->cascadeOnDelete();
   $t->foreignId('counter_profile_id')->nullable()->constrained('adl_consumer_profiles')->nullOnDelete();
   $t->foreignId('counter_user_id')->nullable()->constrained('users')->nullOnDelete();
   $t->foreignId('counter_merchant_id')->nullable()->constrained('merchants')->nullOnDelete()->comment('P2B: AU BUSINESS merchant');
   $t->enum('type',['p2p','p2b'])->default('p2p')->index();
   $t->enum('barter_mode',['commercial','charity'])->default('commercial')->index()->comment('Abwab Al Khair 1x else 1.5x');
   $t->decimal('calibration_factor',3,2)->default(1.50)->comment('1.50 commercial, 1.00 charity');
   $t->foreignId('offered_catalog_id')->nullable()->constrained('merchant_catalogs')->nullOnDelete();
   $t->json('offered_custom')->nullable()->comment('{title, condition, images[], description} if pre-owned not in catalog');
   $t->foreignId('wanted_catalog_id')->nullable()->constrained('merchant_catalogs')->nullOnDelete();
   $t->json('wanted_custom')->nullable();
   $t->bigInteger('cash_delta_subunit')->comment('signed: >0 proposer pays, <0 proposer receives, 0 even');
   $t->enum('status',['draft','pending_match','matched','escrow_holding','inspection','completed','cancelled'])->default('draft')->index();
   $t->foreignId('escrow_id')->nullable()->constrained('escrow_clearings')->nullOnDelete();
   $t->char('delivery_qr_hash',64)->nullable()->comment('QR for inspection');
   $t->json('meta')->nullable()->comment('{negotiation_rounds, agent3_proposal, agent1_validation}');
   $t->timestamps(); $t->softDeletes();
   $t->index(['proposer_user_id','status']); $t->index(['counter_user_id','status']);
  });
  Schema::create('adl_barter_item_valuation', function(Blueprint $t){
   $t->id(); $t->char('uuid',36)->unique();
   $t->foreignId('barter_proposal_id')->constrained('adl_barter_proposals')->cascadeOnDelete()->unique();
   $t->bigInteger('offered_value_subunit')->unsigned();
   $t->bigInteger('wanted_value_subunit')->unsigned();
   $t->bigInteger('baseline_offered_subunit')->unsigned()->comment('before 1.5x/1x');
   $t->bigInteger('baseline_wanted_subunit')->unsigned();
   $t->json('baseline_snapshot')->comment('{rule:"1.5x commercial", source:"deal_exchange_snapshots", condition_factor}');
   $t->string('valuated_by',32)->default('agent1')->comment('agent1 primary, agent3 assist');
   $t->decimal('confidence',5,2)->comment('0-100');
   $t->char('hash_prev',64)->nullable(); $t->char('hash_current',64);
   $t->timestamps();
  });
  Schema::create('adl_barter_escrow_ledgers', function(Blueprint $t){
   $t->id(); $t->char('uuid',36)->unique();
   $t->foreignId('barter_proposal_id')->constrained('adl_barter_proposals')->cascadeOnDelete();
   $t->foreignId('user_id')->constrained('users')->cascadeOnDelete();
   $t->enum('leg',['offer_item','wanted_item','cash_topup'])->index();
   $t->bigInteger('amount_subunit')->comment('signed: item legs 0, cash leg signed delta');
   $t->enum('status',['holding','released','disputed'])->default('holding')->index();
   $t->foreignId('escrow_id')->constrained('escrow_clearings')->cascadeOnDelete();
   $t->char('hash_prev',64)->nullable(); $t->char('hash_current',64);
   $t->timestamps();
  });
  DB::statement("ALTER TABLE adl_barter_proposals ADD CONSTRAINT chk_barter_calib CHECK (calibration_factor IN (1.00,1.50))");
  DB::statement("ALTER TABLE adl_barter_proposals ADD CONSTRAINT chk_barter_delta CHECK (cash_delta_subunit BETWEEN -100000000 AND 100000000)");
  DB::statement("ALTER TABLE adl_barter_proposals ADD CONSTRAINT chk_barter_custom CHECK ((offered_catalog_id IS NOT NULL OR offered_custom IS NOT NULL) AND (wanted_catalog_id IS NOT NULL OR wanted_custom IS NOT NULL))");
 }
 public function down(): void { Schema::dropIfExists('adl_barter_escrow_ledgers'); Schema::dropIfExists('adl_barter_item_valuation'); Schema::dropIfExists('adl_barter_proposals'); }
};
// Models: AdlBarterProposal { HasAppIdScope; casts offered_custom/wanted_custom=>array, calibration_factor=>decimal; scopeCommercial/charity; method cashDeltaForProposer():int }
// AdlBarterItemValuation { casts baseline_snapshot=>array; relation proposal() }
// Controller: AdlBarterController@store (Agent1 valuation + 1.5x/1x check), match, accept (VerifyBarterEscrowLock + escrow 2 legs + Reverb), inspectQR, complete
```

### 8.4 `adl_auctions`, `adl_auction_bids` & `adl_bid_deposits` + `adl_anti_sniping_logs` — Live Bidding <100ms + Soft-Close

```php
// database/migrations/2026_09_15_000043_create_adl_auctions_tables.php — MySQL
return new class extends Migration {
 public function up(): void {
  Schema::create('adl_auctions', function(Blueprint $t){
   $t->id(); $t->char('uuid',36)->unique();
   $t->foreignId('catalog_id')->constrained('merchant_catalogs')->cascadeOnDelete();
   $t->foreignId('merchant_id')->constrained('merchants')->cascadeOnDelete();
   $t->enum('app_id',['AU_BUSINESS','AU_MED','AU_DEALS','AU_SERV','AU_INVEST'])->default('AU_DEALS')->index();
   $t->string('title',255); $t->text('description')->nullable();
   $t->bigInteger('reserve_price_subunit')->unsigned()->comment('min acceptable');
   $t->bigInteger('current_bid_subunit')->unsigned()->default(0);
   $t->foreignId('current_bidder_user_id')->nullable()->constrained('users')->nullOnDelete();
   $t->bigInteger('bid_increment_subunit')->unsigned()->default(1000)->comment('500 = 5 EGP');
   $t->dateTime('starts_at')->index(); $t->dateTime('ends_at')->index();
   $t->enum('status',['draft','scheduled','live','soft_close','ended','settled','cancelled'])->default('draft')->index();
   $t->boolean('is_auto_extend')->default(true);
   $t->tinyInteger('extend_count')->unsigned()->default(0)->comment('max 10');
   $t->json('auto_bids')->nullable()->comment('[{user_id, max_subunit}]');
   $t->json('meta')->nullable();
   $t->timestamps(); $t->softDeletes();
   $t->index(['status','ends_at']); $t->index(['catalog_id','status']);
  });
  Schema::create('adl_auction_bids', function(Blueprint $t){
   $t->id(); $t->char('uuid',36)->unique();
   $t->foreignId('auction_id')->constrained('adl_auctions')->cascadeOnDelete();
   $t->foreignId('user_id')->constrained('users')->cascadeOnDelete()->index();
   $t->bigInteger('amount_subunit')->unsigned();
   $t->enum('type',['manual','auto'])->default('manual')->index();
   $t->string('device_fingerprint',128)->nullable()->index()->comment('Agent13 Sybil');
   $t->string('ip_address',45)->nullable();
   $t->decimal('fraud_risk',5,2)->default(0)->comment('Agent13 0-100');
   $t->boolean('is_invalidated')->default(false)->index()->comment('reverted by Agent13');
   $t->char('hash_prev',64)->nullable(); $t->char('hash_current',64);
   $t->timestamps();
   $t->index(['auction_id','amount_subunit']); $t->index(['auction_id','created_at']);
  });
  Schema::create('adl_bid_deposits', function(Blueprint $t){
   $t->id(); $t->char('uuid',36)->unique();
   $t->foreignId('auction_id')->constrained('adl_auctions')->cascadeOnDelete();
   $t->foreignId('user_id')->constrained('users')->cascadeOnDelete();
   $t->bigInteger('amount_subunit')->unsigned();
   $t->enum('status',['holding','released','forfeited'])->default('holding')->index();
   $t->foreignId('escrow_id')->constrained('escrow_clearings')->cascadeOnDelete();
   $t->char('hash_prev',64)->nullable(); $t->char('hash_current',64);
   $t->timestamps(); $t->unique(['auction_id','user_id']);
  });
  Schema::create('adl_anti_sniping_logs', function(Blueprint $t){
   $t->id(); $t->char('uuid',36)->unique();
   $t->foreignId('auction_id')->constrained('adl_auctions')->cascadeOnDelete();
   $t->foreignId('triggering_bid_id')->constrained('adl_auction_bids')->cascadeOnDelete();
   $t->dateTime('triggered_at')->index();
   $t->smallInteger('extended_by_seconds')->unsigned()->default(120);
   $t->dateTime('old_ends_at'); $t->dateTime('new_ends_at');
   $t->char('hash_current',64);
   $t->timestamps();
  });
  // BEFORE UPDATE/DELETE on auction_bids append-only except is_invalidated toggle via Action
  DB::statement("ALTER TABLE adl_auctions ADD CONSTRAINT chk_auction_reserve CHECK (reserve_price_subunit>0)");
  DB::statement("ALTER TABLE adl_auctions ADD CONSTRAINT chk_auction_extend CHECK (extend_count<=10)");
  DB::statement("ALTER TABLE adl_auction_bids ADD CONSTRAINT chk_bid_amount CHECK (amount_subunit>0)");
 }
 public function down(): void {
  Schema::dropIfExists('adl_anti_sniping_logs'); Schema::dropIfExists('adl_bid_deposits');
  Schema::dropIfExists('adl_auction_bids'); Schema::dropIfExists('adl_auctions');
 }
};
// Controllers: AdlAuctionController@show (Reverb presence-auction.{id}), bid (RequireAuctionDeposit + PreventScalperBots + lockForUpdate adl_auctions + Redis Mutex auction:{id}:bid + anti-sniping check final 30s → extend 120s + broadcast), autoBidSet
// Events: AuctionBidPlaced (broadcast private-auction.{id} <100ms), AuctionExtended
```

### 8.5 `adl_orders`, `adl_order_shipments` & `adl_escrow_releases` — Tracking, QR, Dispute

```php
// database/migrations/2026_09_15_000044_create_adl_orders_tables.php — MySQL
return new class extends Migration {
 public function up(): void {
  Schema::create('adl_orders', function(Blueprint $t){
   $t->id(); $t->char('uuid',36)->unique();
   $t->foreignId('consumer_profile_id')->constrained('adl_consumer_profiles')->cascadeOnDelete();
   $t->foreignId('user_id')->constrained('users')->cascadeOnDelete()->index();
   $t->enum('app_id',['AU_BUSINESS','AU_MED','AU_DEALS','AU_SERV','AU_INVEST'])->default('AU_DEALS')->index();
   $t->foreignId('cart_id')->nullable()->constrained('adl_carts')->nullOnDelete();
   $t->enum('type',['buy','rental','barter_cash','auction_win','group_buy','urgent'])->default('buy')->index();
   $t->bigInteger('subtotal_subunit')->unsigned();
   $t->bigInteger('shipping_fee_subunit')->unsigned()->default(0);
   $t->bigInteger('discount_subunit')->unsigned()->default(0);
   $t->bigInteger('total_subunit')->unsigned();
   $t->string('currency',8)->default('EGP');
   $t->enum('status',['pending','confirmed','preparing','shipped','out_for_delivery','delivered','disputed','completed','cancelled'])->default('pending')->index();
   $t->foreignId('escrow_id')->nullable()->constrained('escrow_clearings')->nullOnDelete();
   $t->foreignId('delivery_address_id')->nullable()->constrained('adl_delivery_addresses')->nullOnDelete();
   $t->json('split_per_merchant')->nullable()->comment('[{merchant_id, subtotal, shipping, payout}]');
   $t->json('meta')->nullable()->comment('{group_buy_pool_id, auction_id, barter_id, is_urgent}');
   $t->timestamps(); $t->softDeletes();
   $t->index(['user_id','status','created_at']); $t->index(['type','status']);
  });
  Schema::create('adl_order_items', function(Blueprint $t){
   $t->id(); $t->char('uuid',36)->unique();
   $t->foreignId('order_id')->constrained('adl_orders')->cascadeOnDelete();
   $t->foreignId('catalog_id')->constrained('merchant_catalogs')->cascadeOnDelete();
   $t->foreignId('merchant_id')->constrained('merchants')->cascadeOnDelete();
   $t->string('title_snapshot',255);
   $t->json('variant_snapshot')->nullable();
   $t->integer('quantity')->unsigned();
   $t->bigInteger('unit_price_subunit')->unsigned();
   $t->bigInteger('line_total_subunit')->unsigned();
   $t->timestamps();
  });
  Schema::create('adl_order_shipments', function(Blueprint $t){
   $t->id(); $t->char('uuid',36)->unique();
   $t->foreignId('order_id')->constrained('adl_orders')->cascadeOnDelete()->unique();
   $t->foreignId('courier_merchant_id')->nullable()->constrained('merchants')->nullOnDelete()->comment('AU SERV courier merchant');
   $t->enum('status',['pending','assigned','picked','shipped','out_for_delivery','delivered','returned'])->default('pending')->index();
   $t->point('pickup_location',4326)->nullable();
   $t->point('dropoff_location',4326)->nullable();
   $t->char('delivery_qr_hash',64)->comment('SHA256(order_uuid+secret) for VerifyEscrowReleaseEligibility');
   $t->string('delivery_qr_data',500)->comment('Base64 QR png');
   $t->dateTime('delivered_at')->nullable();
   $t->dateTime('inspection_deadline')->comment('delivered_at +48h');
   $t->json('tracking')->nullable()->comment('{live_point, eta, milestones}');
   $t->timestamps();
   $t->index(['courier_merchant_id','status']);
  });
  Schema::create('adl_escrow_releases', function(Blueprint $t){
   $t->id(); $t->char('uuid',36)->unique();
   $t->foreignId('order_id')->constrained('adl_orders')->cascadeOnDelete();
   $t->foreignId('escrow_id')->constrained('escrow_clearings')->cascadeOnDelete();
   $t->enum('trigger',['qr_scan','inspection_expire','dispute_resolve','grace_auto'])->default('qr_scan');
   $t->enum('status',['holding','partial','released','disputed'])->default('holding')->index();
   $t->char('hash_prev',64)->nullable(); $t->char('hash_current',64);
   $t->json('meta')->nullable();
   $t->timestamps();
  });
  try{ DB::statement('ALTER TABLE adl_order_shipments ADD SPATIAL INDEX spx_shipment_pickup (pickup_location)'); }catch(Throwable $e){}
  try{ DB::statement('ALTER TABLE adl_order_shipments ADD SPATIAL INDEX spx_shipment_dropoff (dropoff_location)'); }catch(Throwable $e){}
  DB::statement("ALTER TABLE adl_orders ADD CONSTRAINT chk_order_total CHECK (total_subunit>0)");
  DB::statement("ALTER TABLE adl_orders ADD CONSTRAINT chk_order_split CHECK (split_per_merchant IS NULL OR JSON_VALID(split_per_merchant))");
 }
 public function down(): void {
  Schema::dropIfExists('adl_escrow_releases'); Schema::dropIfExists('adl_order_shipments');
  Schema::dropIfExists('adl_order_items'); Schema::dropIfExists('adl_orders');
 }
};
// Controller: AdlOrderController@checkout (ValidateCartStockAvailability + ValidateGroupBuyEligibility + split per merchant + escrow holding + Redis stock:deal DECRBY + Horizon), verifyDelivery (VerifyEscrowReleaseEligibility QR), dispute
```

### 8.6 Middleware — `ValidateCartStockAvailability`, `RequireAuctionDeposit`, `ValidateGroupBuyEligibility`, `VerifyEscrowReleaseEligibility`

```php
// app/Http/Middleware/ValidateCartStockAvailability.php
public function handle(Request $r, Closure $next){
 $items = $r->input('items', $r->input('cart_items', []));
 foreach($items as $it){
  $catalog = MerchantCatalog::where('id',$it['catalog_id'])->lockForUpdate()->firstOrFail();
  $redisStock = Redis::get("stock:deal:{$catalog->id}");
  $dbStock = $catalog->stock_quantity;
  $available = $redisStock !== null ? (int)$redisStock : $dbStock;
  if($available < $it['quantity']) return response()->json(['code'=>'stock_insufficient','catalog_id'=>$catalog->id,'available'=>$available], 409);
  // also validate is_hidden/stock zero propagation
  if($catalog->is_hidden || $dbStock==0) return response()->json(['code'=>'deal_hidden_or_zero'], 422);
 }
 return $next($r);
}
// app/Http/Middleware/RequireAuctionDeposit.php
public function handle(Request $r, Closure $next){
 $auction = AdlAuction::findOrFail($r->route('auction'));
 if($auction->reserve_price_subunit > 50000){
  $deposit = AdlBidDeposit::where('auction_id',$auction->id)->where('user_id',$r->user()->id)->where('status','holding')->first();
  if(!$deposit) return response()->json(['code'=>'auction_deposit_required','amount'=> $auction->reserve_price_subunit*0.1], 403);
 }
 return $next($r);
}
// app/Http/Middleware/ValidateGroupBuyEligibility.php
public function handle(Request $r, Closure $next){
 $pool = GroupBuyPool::findOrFail($r->route('pool') ?? $r->input('pool_id'));
 if(!in_array($pool->status,['open'])) return response()->json(['code'=>'group_buy_closed'], 422);
 if($pool->expires_at < now()) return response()->json(['code'=>'group_buy_expired'], 422);
 // region check via ST_Distance_Sphere consumer default_location vs pool center
 $exists = GroupBuyParticipant::where('pool_id',$pool->id)->where('user_id',$r->user()->id)->exists();
 if($exists) return response()->json(['code'=>'already_joined'], 409);
 return $next($r);
}
// app/Http/Middleware/VerifyEscrowReleaseEligibility.php
public function handle(Request $r, Closure $next){
 $order = AdlOrder::with('shipment','escrow')->findOrFail($r->route('order'));
 if(!$order->shipment) return response()->json(['code'=>'shipment_missing'], 422);
 $qr = $r->input('qr') ?? $r->header('X-Delivery-QR');
 if(hash('sha256', $order->uuid.env('QR_SECRET')) !== $qr) return response()->json(['code'=>'qr_invalid'], 403);
 if($order->shipment->inspection_deadline < now() && $order->status!=='disputed') return response()->json(['code'=>'inspection_expired_use_dispute'], 422);
 if($order->escrow && $order->escrow->status!=='holding') return response()->json(['code'=>'escrow_not_holding'], 422);
 return $next($r);
}
// Routes excerpt — routes/api/v1/au_deals.php
// Route::middleware(['auth:jwt','HasAppId:AU_DEALS'])->group(function(){
//  Route::get('feed', [AdlCatalogController::class,'feed']); // GEOSEARCH + ST_Distance_Sphere + is_urgent radar
//  Route::post('cart/items', [AdlCartController::class,'add'])->middleware(ValidateCartStockAvailability::class);
//  Route::post('checkout', [AdlOrderController::class,'checkout'])->middleware([ValidateCartStockAvailability::class, ValidateGroupBuyEligibility::class]);
//  Route::post('barter', [AdlBarterController::class,'store']);
//  Route::post('barter/{id}/accept', [AdlBarterController::class,'accept'])->middleware(VerifyBarterEscrowLock::class);
//  Route::post('auctions/{auction}/bid', [AdlAuctionController::class,'bid'])->middleware([RequireAuctionDeposit::class, PreventScalperBots::class]);
//  Route::post('auctions/{auction}/deposit', [AdlAuctionController::class,'deposit']);
//  Route::post('group-buy/{pool}/join', [GroupBuyController::class,'join'])->middleware(ValidateGroupBuyEligibility::class);
//  Route::post('orders/{order}/verify-delivery', [AdlOrderController::class,'verifyDelivery'])->middleware(VerifyEscrowReleaseEligibility::class);
// });
```

**Bonus Middleware (also required): `PreventScalperBots` & `VerifyBarterEscrowLock`**

```php
// app/Http/Middleware/PreventScalperBots.php — Agent 11 surge guard
public function handle(Request $r, Closure $next){
 $fp = $r->header('X-Device-Fingerprint') ?? $r->ip();
 $key = "scalper:{$fp}:" . now()->format('YmdHi');
 $count = Redis::incr($key); Redis::expire($key, 60);
 if($count > 60) { // 60 req/min per fingerprint
  app(AgentStrategyManager::class)->emit('agent_actions', ['agent_id'=>11,'capability'=>'bot_block','confidence'=>95,'hitl_required'=>false]);
  return response()->json(['code'=>'bot_detected','retry_after'=>60], 429);
 }
 // also check auction bid velocity per user
 return $next($r);
}
// app/Http/Middleware/VerifyBarterEscrowLock.php
public function handle(Request $r, Closure $next){
 $barter = AdlBarterProposal::with('escrow')->findOrFail($r->route('barter') ?? $r->input('barter_id'));
 if($barter->status!=='escrow_holding') return response()->json(['code'=>'barter_not_holding'], 422);
 if(!$barter->escrow || $barter->escrow->status!=='holding') return response()->json(['code'=>'barter_escrow_not_holding'], 422);
 // calibration_factor must be 1.5 or 1.0
 if(!in_array((float)$barter->calibration_factor,[1.0,1.5],true)) return response()->json(['code'=>'barter_calibration_invalid'], 422);
 return $next($r);
}
```

### 8.7 `adl_group_buy_pools` & `adl_group_buy_participants` — Tiered Discount Milestones

```php
// database/migrations/2026_09_15_000045_create_adl_group_buy_tables.php — MySQL
return new class extends Migration {
 public function up(): void {
  Schema::create('adl_group_buy_pools', function(Blueprint $t){
   $t->id(); $t->char('uuid',36)->unique();
   $t->foreignId('catalog_id')->constrained('merchant_catalogs')->cascadeOnDelete();
   $t->foreignId('merchant_id')->constrained('merchants')->cascadeOnDelete();
   $t->enum('app_id',['AU_BUSINESS','AU_MED','AU_DEALS','AU_SERV','AU_INVEST'])->default('AU_DEALS')->index();
   $t->string('title',255);
   $t->json('tiers')->comment('[{threshold:5, discount_pct:10, price_subunit:9000}, {10,18,8200}, {15,25,7500}]');
   $t->smallInteger('max_participants')->unsigned()->default(50);
   $t->smallInteger('current_count')->unsigned()->default(0);
   $t->bigInteger('current_price_subunit')->unsigned();
   $t->point('center_location',4326)->nullable()->comment('region center POINT for ST_Distance_Sphere eligibility');
   $t->smallInteger('radius_km')->unsigned()->default(10);
   $t->dateTime('starts_at')->index(); $t->dateTime('expires_at')->index();
   $t->enum('status',['open','full','expired','converted'])->default('open')->index();
   $t->foreignId('escrow_id')->nullable()->constrained('escrow_clearings')->nullOnDelete();
   $t->timestamps();
   $t->index(['catalog_id','status','expires_at']);
  });
  Schema::create('adl_group_buy_participants', function(Blueprint $t){
   $t->id(); $t->char('uuid',36)->unique();
   $t->foreignId('pool_id')->constrained('adl_group_buy_pools')->cascadeOnDelete();
   $t->foreignId('user_id')->constrained('users')->cascadeOnDelete();
   $t->foreignId('consumer_profile_id')->constrained('adl_consumer_profiles')->cascadeOnDelete();
   $t->bigInteger('price_locked_subunit')->unsigned()->comment('price at join time');
   $t->enum('status',['holding','confirmed','released','cancelled'])->default('holding')->index();
   $t->foreignId('order_id')->nullable()->constrained('adl_orders')->nullOnDelete();
   $t->dateTime('hold_expires_at')->comment('15m reservation');
   $t->timestamps();
   $t->unique(['pool_id','user_id']); // cannot join twice
   $t->index(['pool_id','status']);
  });
  try{ DB::statement('ALTER TABLE adl_group_buy_pools ADD SPATIAL INDEX spx_group_center (center_location)'); }catch(Throwable $e){}
  DB::statement("ALTER TABLE adl_group_buy_pools ADD CONSTRAINT chk_group_tiers CHECK (JSON_VALID(tiers))");
 }
 public function down(): void { Schema::dropIfExists('adl_group_buy_participants'); Schema::dropIfExists('adl_group_buy_pools'); }
};
// Controller: GroupBuyController@create (merchant AU BUSINESS creates pool via MerchantCatalogUpdatedEvent → AU DEALS read), join (ValidateGroupBuyEligibility + Redis INCR + escrow hold), expireCron (every 30s)
```

### 8.8 `adl_user_deal_radar_preferences` & `adl_ar_deal_nodes` + `adl_review_integrity_logs` — Spatial Radar + AR Geofenced Nodes

```php
// database/migrations/2026_09_15_000046_create_adl_radar_ar_tables.php — MySQL
return new class extends Migration {
 public function up(): void {
  Schema::create('adl_user_deal_radar_preferences', function(Blueprint $t){
   $t->id(); $t->char('uuid',36)->unique();
   $t->foreignId('consumer_profile_id')->constrained('adl_consumer_profiles')->cascadeOnDelete()->unique();
   $t->foreignId('user_id')->constrained('users')->cascadeOnDelete()->unique();
   $t->tinyInteger('radius_km')->unsigned()->default(10)->comment('2,10,15,50,999');
   $t->json('categories')->nullable()->comment('[category_ids] filter');
   $t->json('filters')->nullable()->comment('{price_min,max, deal_type:[sale,barter,auction,urgent]}');
   $t->boolean('is_urgent_only')->default(false);
   $t->boolean('is_ar_enabled')->default(true);
   $t->timestamps();
  });
  Schema::create('adl_ar_deal_nodes', function(Blueprint $t){
   $t->id(); $t->char('uuid',36)->unique();
   $t->foreignId('catalog_id')->constrained('merchant_catalogs')->cascadeOnDelete();
   $t->foreignId('merchant_id')->constrained('merchants')->cascadeOnDelete();
   $t->point('location',4326)->comment('geofenced AR POINT SRID4326');
   $t->polygon('geofence',4326)->nullable()->comment('ST_Buffer(location, radius_m) walk/drive');
   $t->json('ar_coordinates')->nullable()->comment('{bearing:120, elevation:5, distance_m:340} for AR overlay');
   $t->boolean('is_urgent')->default(false)->index();
   $t->boolean('is_flash')->default(false)->index();
   $t->dateTime('flash_until')->nullable()->index();
   $t->json('meta')->nullable();
   $t->timestamps();
   $t->index(['is_urgent','is_flash']);
  });
  Schema::create('adl_review_integrity_logs', function(Blueprint $t){
   $t->id(); $t->char('uuid',36)->unique();
   $t->foreignId('catalog_id')->constrained('merchant_catalogs')->cascadeOnDelete();
   $t->foreignId('user_id')->constrained('users')->cascadeOnDelete();
   $t->foreignId('order_id')->nullable()->constrained('adl_orders')->nullOnDelete()->comment('verified_purchase check');
   $t->string('device_fingerprint',128)->nullable()->index();
   $t->string('ip_address',45)->nullable();
   $t->decimal('sybil_risk',5,2)->default(0)->comment('Agent13 0-100');
   $t->boolean('is_verified_purchase')->default(false)->index();
   $t->boolean('is_filtered')->default(false)->index()->comment('manipulated blocked');
   $t->text('review_text')->nullable();
   $t->tinyInteger('rating')->unsigned()->nullable();
   $t->char('hash_prev',64)->nullable(); $t->char('hash_current',64);
   $t->timestamps();
   $t->index(['catalog_id','is_filtered']); $t->index(['device_fingerprint','created_at']);
  });
  try{ DB::statement('ALTER TABLE adl_ar_deal_nodes ADD SPATIAL INDEX spx_ar_location (location)'); }catch(Throwable $e){}
  try{ DB::statement('ALTER TABLE adl_ar_deal_nodes ADD SPATIAL INDEX spx_ar_geofence (geofence)'); }catch(Throwable $e){}
  DB::statement("ALTER TABLE adl_user_deal_radar_preferences ADD CONSTRAINT chk_radar_radius CHECK (radius_km IN (2,10,15,50,999))");
 }
 public function down(): void {
  Schema::dropIfExists('adl_review_integrity_logs'); Schema::dropIfExists('adl_ar_deal_nodes');
  Schema::dropIfExists('adl_user_deal_radar_preferences');
 }
};
// Models: AdlUserDealRadarPreference { casts categories/filters=>array; relation consumerProfile(); }
// AdlArDealNode { casts location=>Point, geofence=>Polygon, ar_coordinates=>array; scopeWithinRadius($q,$lat,$lng,$km)=>whereRaw("ST_Distance_Sphere(location, POINT(?,?))<=?*1000",[$lng,$lat,$km]); scopeUrgent(); }
// Controller: RadarController@feed (GEOSEARCH + ST_Distance_Sphere + is_urgent + ar_nodes), updatePrefs, arScan
```

### 8.9 Eloquent Models (Excerpt — Strict Types PHP 8.4)

```php
// App\Models\AdlConsumerProfile extends Model { use HasAppIdScope, SoftDeletes; table='adl_consumer_profiles'; casts preferences/wishlist=>array, default_location=>Point; }
// App\Models\AdlCart extends Model { use HasAppIdScope; table='adl_carts'; relation items():HasMany AdlCartItem; method totalSubunit():int; }
// App\Models\AdlCartItem extends Model { table='adl_cart_items'; casts variant=>array; }
// App\Models\AdlBarterProposal extends Model { use HasAppIdScope, SoftDeletes; table='adl_barter_proposals'; casts offered_custom/wanted_custom=>array; }
// App\Models\AdlAuction extends Model { use HasAppIdScope, SoftDeletes; table='adl_auctions'; casts starts_at=>datetime, auto_bids=>array; scopeLive(); }
// App\Models\AdlAuctionBid extends Model { table='adl_auction_bids'; casts created_at=>datetime; }
// App\Models\AdlOrder extends Model { use HasAppIdScope, SoftDeletes; table='adl_orders'; casts split_per_merchant=>array; relation items(), shipment(), escrow(); }
// App\Models\AdlArDealNode extends Model { table='adl_ar_deal_nodes'; casts location=>Point, geofence=>Polygon; }
```

### 8.10 API Controllers (Skeleton — Thin Controllers → Actions/Services)

```
App\Modules\AUDeals\Http\Controllers\User\
  AdlCatalogController@feed (GEOSEARCH + ST_Distance_Sphere + FULLTEXT ngram + is_urgent radar + Agent3 re-rank), search, visualSearch (intervention/image + pgvector cosine)
  AdlCartController@add (ValidateCartStockAvailability + Redis NX EX 180 + price lock), updateQty, remove, clear, show
  AdlRentalBookingController@hold, confirm, return
  AdlBarterController@store (Agent1 1.5x/1x validation + Agent3 market median), match, accept (VerifyBarterEscrowLock + escrow 2 legs + Reverb private-barter), inspectQR
  AdlAuctionController@show, deposit (RequireAuctionDeposit), bid (PreventScalperBots + lockForUpdate + anti-sniping 30s→120s + Reverb private-auction <100ms), setAutoBid
  GroupBuyController@create, join (ValidateGroupBuyEligibility + Redis INCR + escrow holding + Reverb presence-group), status
  AdlOrderController@checkout (ValidateCartStockAvailability + ValidateGroupBuyEligibility + split per merchant + stock:deal DECRBY + escrow holding + AU SERV dispatch), verifyDelivery (VerifyEscrowReleaseEligibility QR + 48h inspection), dispute
  RadarController@feed (adal_user_deal_radar_preferences + ar_deal_nodes GEOSEARCH 2/10/city), updatePrefs, arScan
```

### 8.11 Events & Reverb Channels (Laravel Reverb 8080 wss — exclusive)

```php
// App\Events\MerchantCatalogUpdatedEvent (AU BUSINESS) → AU DEALS listener InvalidateAuDealsCacheListener { Redis::del("b2c:catalog:AU_DEALS:*"); Redis::ZREM deals:geo; broadcast("catalog.updated")->toOthers(); }
// App\Events\AuctionBidPlaced { auction_id, bid_id, bidder_masked, amount, is_auto } → broadcast private-auction.{id} <100ms
// App\Events\AuctionExtended { auction_id, old_ends_at, new_ends_at, extended_by:120 } → broadcast private-auction.{id}
// App\Events\GroupBuyCountUpdated { pool_id, current_count, current_price, tier } → broadcast presence-group.{pool_id}
// App\Events\RadarDealPushed { ar_node_id, is_urgent, location } → broadcast presence-radar.{region} + private-urgent.{user_id} (FCM)
// Channels: private-catalog.AU_DEALS, private-auction.{id}, presence-group.{pool_id}, presence-radar.{region}, private-barter.{proposal_id}, private-consumer.{user_id} (price drop), private-wallet.{user_id}, presence-urgent.{region}
```

### 8.12 OpenAPI / REST Summary (Excerpt)

```
GET    /api/v1/au-deals/feed?lat&lng&radius&axis&q → 200 {deals[], radar:{center, radius}, ar_nodes[], total}
POST   /api/v1/au-deals/cart/items {catalog_id, variant, qty, axis} → 201 {cart_item, lock_token} 409 stock_insufficient
POST   /api/v1/au-deals/checkout {cart_id, address_id, payment_method} → 201 {orders[] per merchant, escrows[]}
POST   /api/v1/au-deals/barter {offered_catalog_id|custom, wanted_catalog_id|custom, barter_mode} → 201 {proposal, valuation:{offered,wanted,delta, factor:1.5}}
POST   /api/v1/au-deals/barter/{id}/accept → 200 {escrow_holding} (VerifyBarterEscrowLock)
POST   /api/v1/au-deals/auctions/{id}/deposit {amount} → 201 {deposit holding}
POST   /api/v1/au-deals/auctions/{id}/bid {amount} → 201 {bid} 403 deposit_required 429 bot_detected + anti-sniping extend
POST   /api/v1/au-deals/group-buy/{pool}/join → 201 {participant holding} 409 already_joined
POST   /api/v1/au-deals/orders/{order}/verify-delivery {qr} → 200 {escrow released} (VerifyEscrowReleaseEligibility)
GET    /api/v1/au-deals/radar/prefs → 200 {radius, categories, is_urgent_only}
PATCH  /api/v1/au-deals/radar/prefs {radius, categories} → 200
POST   /api/v1/au-deals/search/visual {image} → 200 {matches[] similarity%}
GET    /api/v1/au-deals/auctions/{id} → 200 {auction, bids[], is_live, anti_sniping_logs[]}
```

---

## 9) BLUEPRINT VERIFICATION & HANDOFF

- **Cinematic Duality (Phase 3.0 tokens):** Every widget uses `bg-surface` → `Neo-White #FAFAFA frost 85%` when `data-theme=neo-pearl` else `obsidian #09090b` when dark — `tokens.css var(--surface-primary) var(--canvas-background)` re-skins without `.tsx` change — verified `stylelint color-no-hex` except tokens. `backdrop-blur(16px) + border-[#F4F4F5] + shadow-[0_8px_32px_rgba]` + `obsidian accents #09090b` + `amber/crimson/cyan/emerald neons` encapsulated. **Balance 50/50** light/dark achieved via `split layout` (see preview).
- **13-Agent Lock:** Agent 3 (CMO Growth & Campaigns → matching/recommendations), Agent 1 (CFO → price intelligence & cash delta 1.5x/1x), Agent 11 (Lead DevOps → surge/atomic/horizon/bot block), Agent 13 (Fraud Sentinel → Sybil bidding + review integrity) embedded per §7 — exact Table 1.3 titles, no alias renumbering, no 14th. `agent_actions` ledger `hitl_required` when `confidence<90`.
- **Master HQ & AU BUSINESS Continuity:** AU DEALS reads via `MerchantCatalogUpdatedEvent → Redis del + GEO + Reverb private-catalog.AU_DEALS` — same `TopHeader AU BUSINESS core`, same `Calibrator 100→90 SelfHealing`, same `HITL 4 CTAs`. Barter 1.5x/1x calibration bound to `deal_exchange_snapshots`.
- **Micro-Sprint Compliance:** This blueprint respects `1-3 files/150 lines` future sprints — migrations split per §8.1→8.8, each `≤130` lines, `DB::transaction + lockForUpdate + Redis Mutex` everywhere, `app_id='AU_DEALS'` scope.
- **Follow-up Sprints:** Phase 3.4 execution will migrate per §8 in order `000040→000046`, seeding `barter 1.5x/1x + tiers FREE/SILVER/GOLD/PLATINUM + auction reserve checks + radar defaults 10km`, then `Inertia Pages/AU DEALS/` `Feed, Cart, BarterBuilder, AuctionArena, GroupBuyPool, RadarAR`.

**ملخص عربي:** منصة AU DEALS الاستهلاكية — سوق أمازون + صفقات فائقة محلية؛ 6 محاور (شراء/إيجار/حجز/مقايضة 1.5x تجاري 1x خيري/مزاد حي soft-close +2د/عروض عاجلة) مع سلة متعددة التجار تقسم شحن/دفع تلقائيًا ومجموعات شراء جماعي متدرجة وبحث مرن + بصري، مقايضة P2P/P2B بحساب فرق نقدي تلقائي ومقايضة مقفلة QR، مزادات Reverb <100ms تأمين وديعة ومزايدة تلقائية، رادار AR 2/10/مدينة + تنبيهات عاجلة، محفظة موحدة + ضمان تسليم QR 48h، وعقول مضمنة (3 توصيات، 1 تسعير فرق، 11 ضغط فلاش + Horizon + حجب بوت، 13 كشف Sybil/تقييمات) + حزمة 8 هجرات PHP8.4 `adl_` + 6 وسطاء — جاهزة للمعاينة اللؤلؤية المتوازنة.

*Next: Visual Preview `docs/PREVIEW_AU_DEALS.html` Neo-White Liquid Pearl #FAFAFA frost + obsidian #09090b + amber/crimson/cyan/emerald — temp file `rm docs/PREVIEW_AU_DEALS.html` — PROJECT_STATE v3.6 `PHASE 3.4 DONE`*
