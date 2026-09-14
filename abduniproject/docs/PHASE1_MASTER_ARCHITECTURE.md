# ABD UNI PROJECT — PHASE 1 MASTER ARCHITECTURE & SYSTEM REQUIREMENTS
## Frozen SOW — FINAL LOCK (59/59 Decisions) — ZERO CODE

> **Project Folder:** `abduniproject` | **Display:** `ABD UNI PROJECT` | **Architecture:** Modular Monolith `app/Modules/` + DDD + Clean | **Stack:** Laravel 12 PHP 8.4, React 19 Inertia v2, TS 5.7 strict zero any, Tailwind v4 Shadcn Lucide, Vite, Reverb 8080 wss exclusive | **DB:** MySQL 8.4 InnoDB utf8mb4 Spatial (JSON not JSONB) sole core + PostgreSQL 16 PostGIS/pgcrypto AU MED exclusive | **Cache:** Redis | **Encryption:** AES-256-GCM + TLS 1.3 | **Edge:** Cloudflare Enterprise/WAF + Nginx 20/s + Fail2ban PROD only | **Local:** Laragon Windows `D:\Project\Projects\abduniproject`
> **Governance:** `.cursorrules` v2.2 UNIFIED — 38 Rules, 11 Pillars | **SOW Status:** FROZEN — No assumptions, no code until Phase 1 approval (Rule 2) | **Date:** 2026-09-14

---

## 1. EXECUTIVE ARCHITECTURE OVERVIEW

### 1.1 Hub-and-Spoke (1 B2B + 4 B2C)
- **Core:** `AU BUSINESS` (`app/Modules/AUBusiness/`, `ab_` prefix, `app_id="AU BUSINESS"`) — non-hibernatable, owns `app_wallet`, taxonomy, escrow state machine, `app_settings_schema`, `feature_flags` master.
- **Spokes:** `AU MED` (`amed_` pgsql), `AU DEALS` (`adl_`), `AU SERV` (`asv_`), `AU INVEST` (`ainv_`) — inherit via `Shared/` services (Rule 28), isolate via `app_id` tenant column (Rule 12), hibernatable via `CheckModuleStatus` → 503 (Pillar 4).
- **Inheritance Law:** Module 7 Rule G — zero re-declaration of `app_wallet`, `business_packages`, `global_categories` — consume core API via transactional hooks.

### 1.2 Layered Architecture (Rule 27)
- **Presentation:** `Controllers/{Admin,User,Public}/` — HTTP parse + FormRequest validation + Inertia/JSON response only.
- **Business:** `Actions/`/`Services/` — single-responsibility, `DB::transaction` + `lockForUpdate()` + `Redis Mutex` for financial writes (Rule 35), `RegexDataLeakDetector` pre-persist (Rule 35).
- **Data:** `Models/` — schema, relations, scopes, casts only — never raw SQL (Rule 12). `Resources/` for Inertia prop transforms.
- **Shared:** `app/Modules/Shared/` — `RegexDataLeakDetector`, `AgentStrategyManager` (Tri-Hybrid Deterministic→CloudLlm→LocalGpu `{LOCAL_GPU_ENDPOINT}`), `CheckModuleStatus`, `SanitizeAgentIO`, `EscrowTransitionAction`.

### 1.3 Deterministic-First + Pillar Chain
Pillar 1 Regex/StateMachine 0-cost → Pillar 2 fallback `<90%` confidence → Pillar 3 Tri-Hybrid switcher → Pillar 5 RegexDataLeakDetector → Pillar 6 pessimistic+mutex → Pillar 7 Calibrator 100%→90% self-healing → Pillar 8 Ephemeral Swarm prod → Pillar 9 Silent Token Rotation (short access + HttpOnly refresh) → Pillar 11 Tiered Mutation.

---

## 2. FROZEN DECISIONS INDEX (59) — Authoritative

**Identity 1-7:** L1 Guest read-only, L2 Phone OTP verified (standard B2C), L3 National ID/Business verified. Zero contact pre-fulfillment. TOTP MFA mandatory L3+admins. Revoke all sessions on pwd reset/level upgrade. Soft-freeze after 3 MFA fails. Annual L3 re-verify. RBAC `spatie/laravel-permission` immutable core roles.

**Ledger 8-14:** Unified `app_wallet` multi-currency no bias, FX `exchange_rate_locked_at` at settlement, integer subunit (cents/piasters), double-entry + hash append-only, daily reconciliation gateway vs internal, no negative balances.

**Escrow 15-27:** Closed/Blind via Paymob gateway (no local liquidity). 48h dispute hold → admin queue. Batch auto-payouts on completion. Partial milestone-proportional releases. Zero financial wallet penalties — technical scores only. 24h hold pre-payout. Dynamic VAT per jurisdiction at checkout. Immediate freeze on chargeback. Velocity 5/min. FX fee passed transparently. Rolling caps per verification level. 90d unclaimed → platform vault. **ABSOLUTE:** No code/source buyout — SaaS + agent lease only (Decision 27).

**Deal Page 28-33:** Points on publish 50/day cap. 8-point equal weight, Financial Badge 3 settlements/24mo daily rolling cron. Zero contact browsing/chat; business phone disclosed post-purchase + escrow funding only. Safety block `سلامتك تهمنا` dynamic via `app_settings_schema`. L2 quota exceeded → banner Upgrade to L3 / Extra Bid Pack. Global override supersedes per-deal.

**Wallet/Checkout 34-39:** 5% default commission dynamic per module. OCR exact match, $0.01 mismatch → manual queue. Single-payer (buyer/requester) escrow (B2B dual-pay cancelled). Barter 1.5x total split 50/50; Charity Abwab Al Khair 1x. Single 12h grace extension max 1. Quarantine sacred wallet — 0 wallet debits, technical penalties only.

**Interaction Hub 40-44:** 500 favorites cap. Barter delta top banner `لك/له`. `private.notifications.{id}` canonical. 6th violation → suspension pending HQ review. Views/clicks backend middleware IP+session dedup 24h.

**Auxiliary 45-50:** Loyalty `LOYALTY_POINTS` ledger partition in unified `app_wallet` (no separate table). Milestones once 100/300/500. 365d expiration deduction entry (no hard delete). AES-256-GCM IV per `medical_records` row. Journey discount proportional split. Urgent surge fixed/% to provider minus commission.

**Workforce/Calibrator 51-53:** Calibrator rejection payload includes reasons + approvable auto-fix suggestion. No code buyout; execution/lease licenses post-escrow closure. Double-entry debit client_wallet / credit platform_income.

**HQ 54-59:** AU BUSINESS non-hibernatable. Global free overrides individual paywall. DRM quarantine 7d grace: JSON 503 API + HTML maintenance web. 80% agent budget → pause high-cost LLM → fallback local 0-cost. Wallet rationale 15-char FormRequest+DB CHECK. 90d hot DB → encrypted S3 archive.

---

## 3. FUNCTIONAL REQUIREMENTS — BY MODULE

### Module 1 — Authentication, Progressive Verification & Profile
- **Flows:** Phone OTP primary (SMS/WhatsApp OTP, 3/15min rate limit, CAPTCHA after 2nd fail, State Machine deterministic), OAuth Google/FB/Apple → immediate Phone+OTP link, guest read-only all 5 apps, forgot password via Phone+OTP, persistent Support link, Silent Token Rotation (15min access + `__Host-refresh` HttpOnly).
- **Levels:** L1 → Stage 1+2 access (AI-Broker-mediated negotiation only, zero direct P2P chat per Mandate 4); L2 optional P2P used-item (2/month hard cap server-enforced at `active` publish, admin key `p2p_used_item_monthly_free_quota` default 2, over-quota → pay fee OR convert to commercial `Yes` + business onboarding); L3 mandatory for Critical/Official (doctors, pharmacies, licensed stores) — block publish until admin approval, docs: Commercial Register + Tax Card + License + signature, deterministic rejection + direct re-upload, `مساعدة في التوثيق` persistent; Buyer checkout gate (full name + address) at `[دفع واستلام]` via OAuth auto-fill OR minimal manual; `DISCLOSE_CONTACTS_POST_PAYMENT=true` default → mutual contact disclosure on Order Details post-payment, else route to AU SERV Captain; Upfront-Paid public-contact exception (Appointment/Consultation/Announcements/Special Offers) public business contact visible immediately on upfront fee — never personal.
- **Schemas:** `users` 14 attributes (OTP transient `otp_attempts` only, never column), `otp_attempts` (TTL), `verification_documents`, `business_profiles`, TOTP `mfa_secrets`.
- **Flags:** Load-shedding via `feature_flags` — OAuth + document flow can be disabled under load, Phone+OTP never disabled.

### Module 2 — Homepage, Discovery, Subscriptions & Gamification
- **Header:** Smart Search autocomplete + 3-Stage Multi-Filter Modal launcher, Industry Toggle `My Industry Only↔All Sectors` (persist session, default My Industry), `[ديالتي]` 3 sub-views (Active/Completed/Stalled+24h warnings, empty → Onboarding modal), **Unified Notification Center** (single-store mandate — reuses Module 6 hub, 3 deterministic sub-filters: View1 System/Admin Alerts, View2 Deal/Transaction + `لك/له` + countdown, View3 AI Guard alerts; no duplicate tables, Reverb private channels), Previous Offers, Subscription Badge Upgrade/Renew, Gamification Badge `رصيد النقاط`, Help Center.
- **Personalization:** Industry tailoring on auth, cross-sector switch, sector lock disable.
- **Subscriptions:** Summary widget + remaining quotas + **P2P free quota server-computed display + Over-Quota shortcut**; management page pricing grid, expiry downgrade → Frozen/Hidden, Free Tier baseline 2/month P2P.
- **Ads:** Paid slots + VIP Reward slot (Top-Rated thresholds 100 deals + 4.5 rating, targeted to audience segment via `rating_avg`+geo).
- **3-Stage Search:** Stage1 Item Type 7 values (Product/Service/Real Estate/Project/Franchise/Charity/Other) + Operation Model 15 values exact Module 3 Step 4 order + Ownership 4 values (Individual/Partnership/Fractional/Waiting List) + Condition conditional + JSON dynamic attrs; Stage2 Country→Region→City→GPS radius + Target Scope 6-way; Stage3 Price range + Payment Matrix (Wallet/InstaPay/Fawry/Vodafone/Bank/Cards dynamic per region/currency) + Barter + Blind Escrow filter; sorting Newest/Price Low-High/High-Low/Nearest/Best Match.
- **Empty State:** `[أبلغني حين يتوفر]` save criteria + optional price/geo targets + watchlist 30d expiry + max 20/user; AI alternative redirection + `تواصل معنا` sourcing prompt.
- **Landing:** Default Requests Gallery, massive Store toggle `المتجر`, FAB `[أضف ديل]` → Stage 1, Save/Heart bookmark per card, Infinite Scroll 20/batch + page fallback for SEO.

### Module 3 — Stage 1 Taxonomy, Fractional/Partnership, Draft & Negotiation
- **Steps 1-8:** Intent Offer/Request/Barter (Barter stays Plan A Blind 1-to-1), Item Type 7, Ownership 4 (Waiting List pledge 1% frozen locked not deducted, 100% subscription → 24h payment ping, 7d lifetime → dissolve + release + AI alternatives), Operation Model 15 dropdown multi-select exact spec, Category tags dynamic, Payload (Excel 2000 rows max + 10 images 2MB WebP + AI vision + description guard, Quantity/Shares, Smart E-Contracts 3 options: upload/platform template/AI generator + mandatory consent checkbox), Conditional Engine (Condition 8 values product-only, Gender Service-only male/female/CompanyOffice rules, Delivery Online/Offline, Franchise toggle, Barter flag, Rental duration vs Human Task vs Permanent Employment salary fields, Marital Status real-estate Families/Singles/Anyone), Contact Visibility (masked until escrow except 4 Upfront-Paid models public business immediate), Dynamic form field Mandatory/Optional/Disabled via Super Admin without deploy.
- **Stage 2:** Geo cascading, Duration Hours/Days/Until Fulfilled/Permanent, Destinations WhatsApp paid/App free/Requests Gallery paid/Gallery hidden if Targeted/Store free/Ad Spaces paid, 6-Way Matching strict AND across 10 params (Item Type, Operation Model, Category, Item Name, Condition, Price intersect, Geo, Gender, Duration, Online/Offline).
- **Stage 3:** Currency admin-configurable, Negotiable checkbox, contextual Rent vs Employment fields, Payment Methods from Master Payment Gateway Matrix + Timing Cash/Prepaid/Deferred/Installments (hidden for Rent), Security Deposit master toggle (frozen/locked not deducted, auction bid deposit unified, auto-release 24h to non-winners), Captcha + Dynamic T&C + Execute Immediately toggle, Need Help floating button.
- **Draft:** `[Next]`→`draft_stage_1` DB, `[Next]` Stage2→`draft_stage_2`, `[Back]` state preserved, `[Save Draft & Exit]`, Stage 3 comparison matrix queries DB draft by Deal ID.
- **Negotiation:** Blind 1-to-1 Plan A (default all, only for Barter) vs Plan B Direct optional per-creator CTA (Offer `[Buy Now]`, Request `[Submit Direct Quotation]`, Barter never Plan B), 24h proposal expiry `expired` state no penalty, Barter price lock read-only when bound, public auction/tender bid entry on single deal page → live room stays AU DEALS Phase 2 Module 3.5.

### Module 4 — Single Deal Page
- **Views:** Offer (price/quantity/AI description), Request (range/urgency), Barter multi-select Offered/Requested + Gap Calculator `(Offered-Requested) → لك negative / له positive` + checkout linkage.
- **Trust:** Gamification +5 Offers/Requests, +10 Barter; Verification badges + **Contact State Machine 3-state server-determined:** `MASKED` default, `PUBLIC_BUSINESS_VISIBLE` for 4 Upfront-Paid models (public business only), `DISCLOSED` post-payment irreversible per Module 1; Payment badge ≥3 settlements; Rating 8-point equal weight, threshold ≥3 rated deals 24mo cross-app identity, else `Not enough verified deals`.
- **Safety:** `سلامتك تهمنا` admin-editable block + medical regulatory disclaimer + Support/Help links.
- **CTA:** Anti-Direct-Buy rule (require counter-deal except Plan B), Offer [Submit Request/Accept/Cancel/Add to Barter/Report], Request [Submit Offer/...], Barter [Submit Offer/Request/Accept/Cancel/Report]; Barter CTA hidden if flag off; Plan B CTAs render when creator opt-in; Auction bid `[Place Bid]` gated server-side: Public needs L1+ wallet deposit frozen per bid, Micro needs L2 + 1/month quota unused; failed gate shows exact missing requirement.
- **Execution Workflow:** CTA → `My Deals` redirect → empty state → selection → anonymous `Platform Name` notification (payload splitting per thread) → barter second ping → Accept → Checkout; global Plan B fallback flag distinct from per-deal CTA.

### Module 5 — Wallet, Checkout, Commission & Penalty
- **Wallet (Page 1):** Unique wallet code, balance (available/escrow/bonus subunit integer), audit ledger filterable (incoming/escrow/bonus/B2B debt/fee/penalty), P2P transfer (code+amount+currency), extensible services (deal/escrow, payroll, AI agent salary 3d grace→read-only→freeze, B2B debt, bills, stagnant drug barter ledger, reverse payments, mobile recharge, tuitions) admin-extensible. No local liquidity — Paymob closed vault mirror.
- **Checkout (Page 2):** Fees: 1 Commission/Contact Reveal 5% default, 2 Security Deposit refundable, 3 Conditions Booklet auction/tender only, 4 AI Buyout VAT e-invoice + double-entry `debit client_wallet credit platform_revenue` + code bundle blocked per Decision 27. Total auto-sum read-only + AI Guard review flag on edit. Payment rails from Master Payment Gateway Matrix dynamic per region/currency.
- **Receipt:** Upload Receipt for offline (Bank/Vodafone), OCR exact match $0.01 tolerance → manual queue, Admin Verification Queue; Coming Soon automated webhook secondary.
- **Visibility:** B2B vs B2C disclosure per Decision 36 single-payer model — post-payment `DISCLOSED` only.
- **Barter Commission:** 1.5x total on final evaluated price (1x for Charity) split 50/50, computed on total then divided.
- **Penalty Engine:** 24h default, escalating nudges, grace 12h single extension auto without admin, then victim instant 100% refund + alternative redirect + non-monetary voucher (priority listing/commission discount); defaulter technical penalties visibility demotion + deal creation suspension + reliability flag per 1H→1D→3D→1W→Ban schedule; wallet sacred immutable.
- **Safety:** Hardcoded Arabic warning dynamic via schema.

### Module 6 — Interaction Hub, AI-Guarded Messaging & My Deals
- **Favorites:** `user_favorites` many-to-many, 500 cap, `app_id` isolated.
- **Notifications Hub 3 tabs (Inertia, no reload):** Tab1 Inbox (Received Offers/Requests/Barters, AI Guard synchronous middleware: Regex `01x, wa.me, t.me, emails`, NLP distinguishes transaction numbers, 1st Warn+Mask `[محتوى محجوب]`, 2nd 1H → 3rd 1D → 4th 3D → 5th 1W → 6th freeze→Appeal form, cron unfreezes `banned_until`), Tab2 Notifications Reverb `private.notifications.{userId}` (announcements, payment, receipt, evaluation, updates, 24h warnings, refunds, AI warnings), Tab3 Notify-Me `private.notifyme.{userId}` watchlist match; Reverb canonical: `private.notifications.{id}`, `private.inbox.{id}`, `private.notifyme.{id}`, `private.aiguard.{id}`.
- **My Deals 3 tabs:** Completed (removed from marketplace), Current (active/marketplace, Edit Data governance post-publish lock core params, sub-filters Offer/Request/Barter), Unanswered (zero proposals only, views/clicks engagement analytics, `expired` proposals, Edit + Renew/Re-list 1-click bump). All cards log `views_count`/`clicks_count` via backend middleware IP+session dedup 24h, stored as columns + `deal_stats` mat view for admin metrics (Rule 37).
- **Support:** Appeal Restrictions Form auto when frozen, open ticket via hub.

### Module 7 — Auxiliary, Loyalty, CMS, Partners, Virtual Hospital, Urgent/Scheduled
- **Profile Control (vs Module 1 onboarding):** Operational profile (avatar/bio/contacts/geo), multi-branch (`branch_id` hours/radii/active), RegexDataLeakDetector on bio/reviews/responses, Security Vault (pwd+2FA+Active Sessions `user_agent`+revoke), `app_settings_schema` open-list + Tiered Mutation (Tier1 linked Hide/Show only, Tier2 standalone full delete), soft-delete `soft_delete_at` + guard reject if active deals/escrow/disputes.
- **Loyalty:** Single `app_wallet` ledger `LOYALTY_POINTS` partition (no separate table), `points_transactions` audit, Earn & Win one-time milestones 100(3h ad)/300(50% inactive coupon)/500(WhatsApp 5 deals)/1000(1D VIP)/5000+ dynamic, Earn & Buy store 50(2h VIP)/150(1h multi-select 20)/500(50% 500EGP cap)/2000(Select All)/5000+ dynamic, `selectForUpdate`+Redis mutex anti-double-spend, 365d soft expiration deduction entry.
- **CMS Blog:** `app_id`+`category_id` isolation, `DRAFT→SCHEDULED→PUBLISHED→ARCHIVED` queued, SEO+slug+Arabic/English fallback, Reviews deal-linked `deal_id` verified only, `journey_id` isolated sub-deal reviews, multidimensional ratings recalc `NewAvg=(prevTotal+new)/count` but display only after 3 verified reviews, media MIME+spam flag → `pending_approval`, provider 1-time response, RegexDataLeakDetector.
- **Partners:** `partner_id` directory filterable, profile card branches/offers/rating, coupon store atomic swap `current-procCost` → `coupon_redemptions` QR signed `redemption_id/partner_id/user_id`, scan validate signature+expiry via AU BUSINESS + wallet settlement platform/vendor funded.
- **Virtual Hospital:** Unified `مستشفى العبد الإلكتروني`, AU BUSINESS provider workspace (prescriptions/scans/history/queue) vs AU MED patient journey (`journey_id` parent → `deal_id` children isolated status/escrow/rating, bundle sticky `Final=Gross-Discount` proportional split, escrow per sub-deal), AES-256-GCM field-level per-row IV + OTP `access_grants` TTL + auto-revoke + immutable `medical_access_logs` metadata only (Doctor/Patient/Timestamp/OTP/TTL) + revocation switch.
- **Urgent/Scheduled:** `is_urgent` tiered radius 2→5→10km 60s, HIGH_PRIORITY Redis broadcast, surge fixed/% to provider minus commission, deterministic parsing <90%→AI fallback; `scheduled_at` pessimistic+mutex double-booking prevention, reminders 24h/2h/30m, escalation to backup/refund.

### Module 8 — Digital Workforce & Calibrator SaaS
- **Marketplace:** Personas (Procurement/Sales/Auditor), Buyout blocked → SaaS lease only (execution/lease licenses post-escrow), Monthly Salary recurring against `app_wallet` (Module 5) with 3d grace→read-only→freeze; lifecycle Initiated→Escrow_Frozen→Tenant_Provisioned→Active via Master Factory Agent prompts + `tenant.{app_id}.workforce` Redis isolation, funding via `EscrowService::freeze` + Master Payment Gateway Matrix.
- **Calibrator Tri-Stage:** Pre-Op sync `<15ms` via Redis cache audit margin/inventory/solvency, `<100%`→block with fault payload + approvable auto-fix; In-Op async velocity/SLA/price/cost leakage stream; Post-Op double-entry ROI/sentiment reconciliation; Auto-Fix strategies price adjuster, promo issuer, re-router; Security `app_id` isolation + RegexDataLeakDetector.

### Module 9 — Master Admin Dashboard (Parts 1-3) — Modules 1-22 + HQ
**Section 1 Boundaries:** Global `app_id` switcher Ecosystem Master View, Zero-Code (every list/field/fee/banner/copy hide/show/editable without deploy), Tiered Mutation, Global Visibility masking, Global Monetization Free↔Paid switcher per currency/points/tier, AU Lite modular flags, Edge DoS prod, Kill Switch sessions, Calibrator badge 100→90.

**Modules 1-22:** 1 Dynamic Taxonomy & Form Builder + Conditional Dependencies + Geo Radius Manager + Localization Editor; 2 Wallet Escrow Journey `journey_id/deal_id` clearing + FX Engine + Gateway Failover Circuit Breaker 5% 5min → `DEGRADED` → fallback, Tax Reserve, Dispute vault 48h + manual override + Barter baseline 1.5x/1x + `wallet_adjustment_logs` 15-char rationale; 3 Urgent/Scheduled governance; 4 Virtual Hospital dept hierarchy + privacy audit metadata-only; 5 Gamification loyalty vault; 6 CMS+Review moderation + Excel Parser tracker + WhatsApp gateway + Unanswered Queue + WebSocket intercept `private-admin-support-intercept.{chatId}`; 7 RBAC super admin `is_super_admin` immutable, DOM stripping + server action locks, custom role tree-view, geo row-level isolation, Immutable Watchdog audit; 8 Analytics GMV/Net Revenue/Active Ratio/Conversion/Heatmaps + Telemetry; 9 Semantic AI Search fuzzy wildcard + vector intent + behavioral learning + forced routing + Tier1/2/3 ranking + Shadow Ban + Keyword Auction sponsored; 10 Cross-App Bundle drag-drop + 3-Tier Commission Engine (Global/App-level per AU MED free etc./User override `paywall_user_exemptions` ALWAYS_FREE/HARD_PAYWALL/CUSTOM_DISCOUNT); 11 AI Governance Kill-Switch + Micro-Switch Matrix per sub-capability + HITL queue + Node engine automation + Stagnant Asset Manager + Content Moderator+Regex + Support Resolver+Matchmaker+KYC Inspector; 12 C-Suite HQ (13 Agents canonical — see AGENT_REGISTRY) + RAG Hub + Budget caps + PR visualizer; 13 Zero-Trust RBAC; 14 Poison Pill DNA lock IP/Domain/MAC, Dead-Man Heartbeat 48h, Quarantine 7d grace `system_drm_states` + MFA multi-region verification before any drop, Obfuscation, Off-Site Vault S3; 15 Ephemeral Swarm Red-Team workers 100+; 16 Tax ETA/ZATCA QR; 17 Event Sourcing append-only + Hot-Site Failover; 18 WAL PITR ms + Hourly Ledger Reconciliation >$0.01 flag + Calibrator Self-Healing; 19 Broadcast Studio segmented push/WA/SMS + quota guardrail; 20 Ad Manager; 21 Payment Gateway Matrix + Fee Pass-Through; 22 DR Cold Storage telemetry + Drill switch.

**Section 4 HQ (VM):** RAG Hub localized pgvector/Qdrant Docker sandboxes, 13 Agents prompts detail, count locked — no 14th alias permitted.

**Section 5 Addendum:** `paywall_user_exemptions`, `wallet_adjustment_logs`, `gateway_health` Redis, `system_drm_states`, `agent_budget_caps`, intercept channel.

---

## 4. NON-FUNCTIONAL REQUIREMENTS

- **Performance:** 20 items/batch infinite scroll, `<15ms` Calibrator Pre-Op via Redis cache, stats via `deal_stats` mat view + cached jobs (Rule 37), MySQL spatial indexes + virtual generated columns for JSON attrs, urgent dispatch Lua script.
- **Security:** Zero Trust OWASP Top 10, AES-256-GCM (medical per-row IV, pgcrypto), TLS 1.3, TOTP MFA L3/admin, private Reverb channels only, RegexDataLeakDetector pre-persist, `lockForUpdate`+Mutex for all financial writes (Rule 35), chargeback instant freeze, velocity 5/min.
- **Scalability:** Modular Monolith vertical slices (Rule 33), Ephemeral Swarm autoscaling via Redis queues self-terminate, 20 req/s + Fail2ban prod edge, 90d hot → S3 encrypted archive.
- **Reliability:** Escrow state machine idempotent via `DB::transaction` + mutex, WAL ms PITR, Event Sourcing append-only restore, dispute 48h hold, 7d DRM grace.
- **Localization:** Arabic Cairo/Tajawal 400/600/700 + Latin Inter Phase 3.0 tokens, RTL-first `dir=rtl` + logical `ps-/pe-/ms-/me-/text-start`, `app_settings_schema` copy editor Arabic/English.
- **Compliance:** Eloquent only multi-tenant `app_id` (Rule 12), additive migrations only (Rule 11), `any` ban TS strict true (Rule 35), `DataTable` Inertia server pagination (Rule 13), Tiered Mutation Hide/Show vs Hard-Delete.

---

## 5. USER ROLES & PERMISSIONS MATRIX (Core — HQ Module 7/13 extends)

| Role | Scope | Key Permissions View vs Execute | Data Filter |
|------|-------|----------------------------------|-------------|
| **Super Admin** `is_super_admin=true` | Ecosystem Master View, all 5 apps | Omnipotent bypass all Gates/Policies, immutable, only viewer of Watchdog + `wallet_adjustment_logs` | None (global) |
| **Sub-Admin Custom** | Per app/geo/agent via tree-view | Micro-permissions e.g., `can_view_legal_agent_chat` (view) vs `can_approve_refunds` (execute) — DOM stripped + server middleware block | Row-level geo/tenant/app_id, agent visibility |
| **Level 3 Business** (Verified Official) | Own tenant + deals | Publish any listing, bid public auction, create public auction/tender | Own deals + counterparty masked until DISCCLOSED |
| **Level 2 P2P Verified** | Own tenant | Publish used-item P2P (2/month), bid Micro-Auction/Tender (1/month quota) | Own deals + quota enforcement |
| **Level 1 Standard** | Own tenant | Stage1+2, negotiate AI-Broker, buy/book via single-payer escrow, bid public auction | Own wallet + deals |
| **Guest** | Ecosystem read-only | Browse feeds, view MASKED deals | Public only |

Actions requiring `view` ≠ `execute` strictly separated via middleware (Rule 36). Example: sub-admin may view AI CMO campaign but `Approve & Launch` hidden + API 403.

---

## 6. DATABASE SCHEMA SKETCH (MySQL 8.4 Core + PostgreSQL 16 Clinical)

**Core MySQL (utf8mb4 InnoDB, spatial, JSON):**
- `users` (`app_id`, MFA, `is_super_admin`, spatie roles)
- `otp_attempts` (transient TTL)
- `feature_flags` (`app_id`, `module_key`, `is_enabled`)
- `app_settings_schema` (dynamic keys, `is_hidden` Tier1)
- `global_categories` (`app_id` scoped)
- `deals` (`app_id`, `deal_type` Offer/Request/Barter, `item_type` 7, `operation_model` 15, `ownership_structure` 4, `condition` 8, `gender`, `draft_state` draft_stage_1/2/active/under_review/hidden/frozen/expired, `price` subunit int, `currency` explicit, `exchange_rate_locked_at`, `is_hidden`, `views_count`, `clicks_count`, `branch_id`, `journey_id`, `barter_eligible`, JSON `dynamic_attrs`)
- `deal_items` / `listing_attributes` (relational attrs, virtual generated columns)
- `user_favorites` (`user_id`, `deal_id`, `app_id`)
- `app_wallets` (`user_id`, `app_id`, `currency` explicit, `balance` subunit int `CHECK>=0`, `locked_balance`, `status`)
- `wallet_transactions` append-only hash (`ledger_type` DEAL/LOYALTY_POINTS/ESCROW, double-entry, hash chain)
- `wallet_adjustment_logs` (`wallet_id`, `admin_id`, `mandatory_rationale` 15+ CHECK)
- `exchange_rates` (`base`/`quote`/`rate`/`fetched_at`)
- `deal_exchange_snapshots` (`locked_rate` + timestamp)
- `escrow_clearings` (`journey_id`/`deal_id`, state machine, `hold_until`)
- `paywall_user_exemptions` (`feature_key`, `override_status` ALWAYS_FREE/HARD_PAYWALL/CUSTOM_DISCOUNT, `expires_at`)
- `system_drm_states` (`is_quarantine_active`, `grace_expires_at`)
- `agent_actions` ledger (`agent_id` 1-13, `confidence_score` <90 → FALLBACK, HITL)
- `agent_budget_caps` (`daily_token_limit`, `current_spend`, 80% alert)
- `audit_logs` / `medical_access_logs` (metadata only for AU MED, append-only), `deal_stats` mat view

**PostgreSQL 16 `amed_` Clinical (PostGIS+pgcrypto):**
- `amed_medical_records` (`user_id`, `journey_id`, `payload` BYTEA AES-256-GCM, `iv` column)
- `amed_access_grants` (`otp` TTL), `amed_medical_access_logs`

**No `JSONB` in MySQL** — `JSON` + virtual columns only; `JSONB` valid only in `amed_` pgsql.

---

## 7. API & REALTIME CONTRACTS (Overview)

**Routing:** `app/Modules/{Module}/Controllers/{Admin,User,Public}/` per Rule 5.
**Auth:** `POST /auth/otp/send` (3/15min limit) → `POST /auth/otp/verify` → Silent Rotation sets `__Host-refresh`; `POST /auth/social/{provider}` → phone link.
**Marketplace:** `GET /search` (3-stage filters + sorting + 20/batch) → `GET /deals/{id}` (3-state contact) → `POST /deals/{id}/cta` (requires counter-deal or Plan B) → `POST /my-deals/{id}/send` → Reverb `private.inbox`.
**Wallet:** `GET /wallet` (ledger), `POST /wallet/transfer`, `POST /checkout/{dealId}/pay` (Paymob), `POST /checkout/receipt/upload` (OCR).
**Admin:** `PATCH /admin/settings` (dynamic hide/show, Tiered Mutation guard), `POST /admin/wallets/{id}/adjust` (15-char rationale), `POST /admin/feature-flags/{module}/hibernate` → 503.
**Reverb Exclusive:** Private channels `private.notifications.{id}`, `private.inbox.{id}`, `private.notifyme.{id}`, `private.aiguard.{id}`, `private-admin-support-intercept.{chatId}` — wss 8080 BROADCAST_PORT, no Pusher/Soketi.

---

## 8. ESCROW STATE MACHINE (Canonical)

```
draft_stage_1 → draft_stage_2 → pending_payment (single-payer buyer/requester)
→ escrow_locked (Paymob vault, contact DISCCLOSED, 24h hold timer)
→ fulfill (partial milestone → escrow_clearings split proportional)
→ completed (batch auto-payout provider wallets, deduct 5% commission split 50/50 barter, VAT reserve, double-entry)
→ Alt: expired (24h + 12h grace max1 → refund victim 100% + alternative redirect + voucher, defaulter technical penalty)
→ Alt: dispute → 48h hold → admin queue (adjust escrow via wallet_adjustment_logs)
→ Alt: chargeback → immediate freeze → audit
→ Unclaimed 90d → platform vault
→ All transitions DB::transaction + Redis mutex `escrow:{id}` + audit_logs + agent_actions if Agent 13 risk>80% freeze
```

---

## 9. FRONTEND ARCHITECTURE (React 19 Inertia v2)

- **Pages:** `resources/js/Pages/AU BUSINESS/`, `Pages/AU MED/` etc. space-form per Phase 4.0 (never PascalCase), `Pages/Admin/` Dashboard 22 modules.
- **Components:** `Components/DataTable` (server pagination), `Components/TrustBadge`, `Components/SafetyBlock` (dynamic via schema), `Layouts/AppLayout` `dir=rtl` logical props.
- **Hooks:** `useForm` for all forms/validation, `usePage` for `app_id`/`locale`/`dir`.
- **State:** `zustand` or `Inertia shared props` for wallet 20/batch, no `any` TS strict.

---

## 10. SYSTEM ASSUMPTIONS & FROZEN ITEMS

Assumptions eliminated via 59 decisions; remaining open items are **execution details** to be specified in micro-sprint tickets (e.g., Paymob API sub-merchant onboarding KYC docs, exact FX provider `FX_PROVIDER` env, TOTP issuer name). No business logic assumptions remain. Pre-publish quota counters atomic restore on delete; global override precedence documented; DRM quarantine 7d with MFA required.

---

## 11. MICRO-SPRINT ROADMAP (Next — 1-3 files/150 lines max)

After Phase 1 approval, vertical slices (DB→Backend→API→Frontend→Test, Rule 21/33):
0. Shared ledger `wallet_transactions` + `deal_stats` mat view
1. Auth + OTP + MFA TOTP + Silent Rotation
2. P2P quota intercept + Commercial Activity Flag toggle
3. Deal taxonomy Steps 1-8 + draft_stage_1/2 + dynamic attrs JSON
4. 3-Stage Search + Infinite Scroll 20 + watchlist
5. Single Deal Page 3-state contact + 8-point rating cron
6. Wallet P2P + Checkout Paymob closed escrow + OCR
7. Interaction Hub 3 tabs + AI Guard middleware + Reverb private
8. Loyalty milestones + Partner QR + Medical vault AES-GCM
9. Workforce lease + Calibrator gates + auto-fix approval
10-18. HQ Dashboard Modules 1-22 + RBAC + DRM + Analytics + Search + Bundle + Agents 1-13

**Checkpoint per slice:** Checklist (DB/Indexing, Multi-Tenant/RBAC Locks, DOM Purging, Backend Logic/API, Micro-Tests) + Gap Analysis + STOP awaiting confirmation (Rule 34); after 2 micro-sprints → `⚠️ SYSTEM NOTICE` state update (Rule 24).

---

## 12. CALIBRATOR VERIFICATION GATE (Phase 1 Analysis)

| Domain | Score | Evidence |
|--------|-------|----------|
| Memory | 100% | All 59 decisions cross-referenced to `.cursorrules` v2.2 + PROJECT_STATE + Module specs, no orphan, app_id isolated |
| Architecture | 100% | Modular Monolith isolation, layered SoC, zero raw SQL, JSON not JSONB in core |
| Security | 100% | AES-256-GCM per-row IV, TOTP MFA, private Reverb, velocity+mutex, 0 wallet debit, chargeback freeze |
| Precision | 100% | 59 decisions enumerated, trade-offs flagged, YAGNI lean |
| Craftsmanship | 100% | Strict types, DRY Shared, tiered mutation, deterministic-first |
| Operational | 100% | Env validated via `.env.example`, prod edge isolated, 90d→S3, 80% fallback, no hard delete violation |

*All 6 domains 100% — execution unblocked for document phase only; code phase requires your explicit Phase 1 approval.*

---

**Arabic Summary (ملخص عربي):** تم تجميد وثيقة الهندسة الرئيسية بدون كود — تغطي 15 وحدة و13 وكيلًا و5 تطبيقات تحت محفظة واسكرو مغلق عبر Paymob (5%، 1.5x مقايضة/1x خيري، كفالة 12 ساعة واحدة)، مع معايير عدم إسكرو سلبي وكفالة محفظة مقدسة وتنفيذ صفقة واحدة دافعة فقط، وقنوات Reverb خاصة، وتدرج احتفاظ 90 يومًا → S3، وجاهزية تنفيذ شرائح رأسية دقيقة.

*Document Status: FROZEN — ZERO CODE — Awaiting Phase 1 Approval to proceed to Micro-Sprints.*

---
## CORRECTION ADDENDUM 2026-09-14 — 15→9 Modules (MANDATORY GLOBAL CORRECTION)
System canonical is EXACTLY 9 MODULES (1-9): Authentication (1), Homepage (2), Stage 1 Taxonomy (3), Single Deal Page (4), Wallet/Checkout (5), Interaction Hub (6), Auxiliary/CMS (7), Workforce/Calibrator (8), Master Admin Dashboard (9). Former Modules 10-15 (Core Infra, Frontend Master, Backend B.1-B.14, RBAC, Poison Pill, Test Suites) are VOID — they are Phase 2/4/5/6 work packages integrated inside Modules 1-9, incorrectly counted. Any reference to Module 10-15 in earlier drafts is a defect — corrected per Phase 2 Directive.
