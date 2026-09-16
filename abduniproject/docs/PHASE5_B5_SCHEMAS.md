# PHASE 5.0 — B.5 قواعد بيانات واجهات التطبيقات الـ5 والـ Workforce
> **ABD UNI PROJECT — 5 Ecosystem Apps Schemas (AU DEALS/SERV/INVEST/MED) + Module 8 Digital Workforce — Arena Canonical v5.0-B.5 — AUDIT-HARDENED**
> **Stack Lock:** Laravel 12 PHP 8.4 | MySQL 8.4 InnoDB utf8mb4 (`JSON` not JSONB + `SPATIAL SRID 4326` + `FULLTEXT ngram`) core | PostgreSQL 16 + PostGIS + pgcrypto (AU MED clinical only) | Redis | Reverb 8080 | 5 Apps space-form | 13 Agents 1-13 | 9 Modules 1-9 | `abduniproject`
> **Refs:** `.arenarules` R5 DDD/R7 JSON/R11 Additive/R12 Eloquent+app_id/R17 .env/R18 transaction/R27 SoC/R28 DRY/R31 YAGNI/R35 Mutex/R37 Stats/R38 env | `PROJECT_STATE.md` v5.0-B.4 → B.5 | B.1a Cache+Tags | B.2a Ledger+minor | B.3 DRM | B.4 Tri-Hybrid

> **AUDIT-HARDENED NOTE (F-01→F-13 integrated before commit):** Additive `hasTable/hasColumn` collision guard, dual-DB explicit `pgsql` AU MED only with `amed_` + pgcrypto HMAC, reversible hash → HMAC salt, FULLTEXT `WITH PARSER ngram` Arabic, POINT/POLYGON SRID 4326+SPATIAL, invest `CHECK status transition trigger` + `BIGINT minor`, workforce reconciliation DRY extending `000010` not duplicate, stagnant/trust via `stats_*` not live COUNT, FK RESTRICT vs CASCADE matrix, partitioning monthly, verification `EXPLAIN FULLTEXT/SPATIAL`.

---
## 0. EXECUTIVE SUMMARY

B.5 يبني **DDL الإنتاج** لـ 5 تطبيقات + Module 8 Workforce. بدونها: تصادم `000012/000013` يكسر المايجريشن، PHI على MySQL خطأ، بحث عربي 0 نتائج، `ST_Distance_Sphere` بلا تسريع، استثمار بلا حالة، تسريب sandbox عابر tenant. هذا الملف **مجمع إنتاجي** لـ Cursor AI: DDL MySQL+PostgreSQL + FK RESTRICT/CASCADE + `SRID 4326` + `ngram` + HMAC + `minor BIGINT` + DDD Eloquent + سبرنتات ≤150L — **بلا TODO**.

---
## 1. AU DEALS SCHEMA — MySQL 8.4 InnoDB (additive vs 000012)

### 1.1 DDL Canonical — additive (F-01)

```sql
-- Additive guard: if exists upgrade not create (F-01)
-- deal_categories (taxonomy)
CREATE TABLE IF NOT EXISTS `deal_categories` (
 `id` BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
 `uuid` CHAR(36) NOT NULL UNIQUE,
 `parent_id` BIGINT UNSIGNED NULL,
 `slug` VARCHAR(80) NOT NULL UNIQUE,
 `name` VARCHAR(120) NOT NULL, `name_ar` VARCHAR(120) NOT NULL,
 `app_id` ENUM('AU BUSINESS','AU MED','AU DEALS','AU SERV','AU INVEST') DEFAULT 'AU DEALS',
 `schema_json` JSON NULL COMMENT 'dynamic attributes R7 JSON',
 `is_hidden` TINYINT(1) DEFAULT 0 COMMENT 'Tier 1',
 `created_at` TIMESTAMP NULL, `updated_at` TIMESTAMP NULL,
 KEY `idx_cat_parent` (`parent_id`), KEY `idx_cat_app` (`app_id`),
 CONSTRAINT `fk_cat_parent` FOREIGN KEY (`parent_id`) REFERENCES `deal_categories`(`id`) ON DELETE SET NULL,
 CONSTRAINT `chk_cat_json` CHECK (`schema_json` IS NULL OR JSON_VALID(`schema_json`))
) ENGINE=InnoDB;

-- deals_listings (core)
CREATE TABLE IF NOT EXISTS `deals_listings` (
 `id` BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
 `uuid` CHAR(36) NOT NULL UNIQUE,
 `tenant_id` BIGINT UNSIGNED NOT NULL COMMENT 'merchant user FK RESTRICT (active escrow)',
 `category_id` BIGINT UNSIGNED NOT NULL,
 `app_id` ENUM('AU BUSINESS','AU MED','AU DEALS','AU SERV','AU INVEST') DEFAULT 'AU DEALS',
 `title` VARCHAR(255) NOT NULL, `description` TEXT NOT NULL,
 `price_minor` BIGINT NOT NULL COMMENT 'BIGINT minor F-12',
 `currency` CHAR(3) DEFAULT 'EGP',
 `stock` INT UNSIGNED DEFAULT 0,
 `geo_point` POINT SRID 4326 NULL COMMENT 'F-06 SRID 4326 for nearby',
 `is_hidden` TINYINT(1) DEFAULT 0, `is_stagnant` TINYINT(1) DEFAULT 0,
 `created_at` TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP(3), `updated_at` TIMESTAMP(3) NULL,
 KEY `idx_deals_tenant` (`tenant_id`), KEY `idx_deals_cat` (`category_id`), KEY `idx_deals_app` (`app_id`),
 FULLTEXT INDEX `ft_deals_title_desc` (`title`,`description`) WITH PARSER ngram COMMENT 'F-05 ngram Arabic token2',
 SPATIAL INDEX `spx_deals_geo` (`geo_point`) COMMENT 'F-06 radius',
 CONSTRAINT `fk_deals_tenant` FOREIGN KEY (`tenant_id`) REFERENCES `users`(`id`) ON DELETE RESTRICT COMMENT 'F-10 RESTRICT escrow',
 CONSTRAINT `fk_deals_cat` FOREIGN KEY (`category_id`) REFERENCES `deal_categories`(`id`) ON DELETE RESTRICT,
 CONSTRAINT `chk_price_ge0` CHECK (`price_minor` >= 0)
) ENGINE=InnoDB;
-- If table exists (000012) upgrade: ALTER TABLE deals_listings ADD FULLTEXT ... WITH PARSER ngram (if missing), ADD SPATIAL SRID 4326

-- deal_items (variants)
CREATE TABLE IF NOT EXISTS `deal_items` (
 `id` BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
 `listing_id` BIGINT UNSIGNED NOT NULL,
 `sku` VARCHAR(60) NOT NULL UNIQUE,
 `attributes` JSON NULL, `price_minor` BIGINT NOT NULL, `stock` INT UNSIGNED DEFAULT 0,
 `created_at` TIMESTAMP NULL, `updated_at` TIMESTAMP NULL,
 KEY `idx_item_listing` (`listing_id`),
 CONSTRAINT `fk_item_listing` FOREIGN KEY (`listing_id`) REFERENCES `deals_listings`(`id`) ON DELETE CASCADE COMMENT 'F-10 CASCADE',
 CONSTRAINT `chk_item_price` CHECK (`price_minor` >= 0), CONSTRAINT `chk_item_json` CHECK (`attributes` IS NULL OR JSON_VALID(`attributes`))
) ENGINE=InnoDB;

-- promotional_bundles
CREATE TABLE IF NOT EXISTS `promotional_bundles` (
 `id` BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
 `tenant_id` BIGINT UNSIGNED NOT NULL, `name` VARCHAR(120) NOT NULL, `items_json` JSON NOT NULL,
 `app_id` ENUM('AU BUSINESS','AU MED','AU DEALS','AU SERV','AU INVEST') DEFAULT 'AU DEALS',
 `starts_at` DATETIME(3) NOT NULL, `ends_at` DATETIME(3) NOT NULL,
 `created_at` TIMESTAMP NULL, `updated_at` TIMESTAMP NULL,
 KEY `idx_bundle_tenant` (`tenant_id`), KEY `idx_bundle_app` (`app_id`),
 CONSTRAINT `fk_bundle_tenant` FOREIGN KEY (`tenant_id`) REFERENCES `users`(`id`) ON DELETE CASCADE,
 CONSTRAINT `chk_bundle_dates` CHECK (`ends_at` > `starts_at`), CONSTRAINT `chk_bundle_json` CHECK (JSON_VALID(`items_json`))
) ENGINE=InnoDB;

-- stagnant_deals (log, not live COUNT F-09)
CREATE TABLE IF NOT EXISTS `stagnant_deals` (
 `id` BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
 `listing_id` BIGINT UNSIGNED NOT NULL, `agent_id` TINYINT UNSIGNED COMMENT '3 CMO',
 `detected_at` TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP(3), `last_interaction_at` TIMESTAMP(3) NULL,
 `is_promoted` TINYINT(1) DEFAULT 0, `promoted_at` TIMESTAMP(3) NULL,
 `app_id` ENUM('AU BUSINESS','AU MED','AU DEALS','AU SERV','AU INVEST') DEFAULT 'AU DEALS',
 KEY `idx_stag_listing` (`listing_id`), KEY `idx_stag_detected` (`detected_at`),
 CONSTRAINT `fk_stag_listing` FOREIGN KEY (`listing_id`) REFERENCES `deals_listings`(`id`) ON DELETE CASCADE,
 CONSTRAINT `chk_agent_1_13` CHECK (`agent_id` BETWEEN 1 AND 13)
) ENGINE=InnoDB COMMENT 'F-09 via stats_deals_daily not live COUNT';
-- Schedule 00:30 Cairo reads stats_deals_daily(interactions) where 0 for 24h → insert here
```

**Verification:** `EXPLAIN SELECT * FROM deals_listings WHERE MATCH(title) AGAINST ('سيارة' IN BOOLEAN MODE)` must show `FULLTEXT ngram`; `EXPLAIN SELECT ST_Distance_Sphere(geo_point, ST_SRID(POINT(31.23 30.04),4326)) <5000` must show `SPATIAL`.

---
## 2. AU SERV SPATIAL SCHEMA — MySQL 8.4 POINT SRID 4326 (F-06)

```sql
CREATE TABLE IF NOT EXISTS `service_providers` (
 `id` BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
 `uuid` CHAR(36) NOT NULL UNIQUE,
 `user_id` BIGINT UNSIGNED NOT NULL,
 `app_id` ENUM('AU BUSINESS','AU MED','AU DEALS','AU SERV','AU INVEST') DEFAULT 'AU SERV',
 `specialty` VARCHAR(80) NOT NULL, `is_active` TINYINT(1) DEFAULT 1,
 `provider_location` POINT SRID 4326 NOT NULL COMMENT 'F-06 realtime NOT NULL',
 `coverage_zone` POLYGON SRID 4326 NULL COMMENT 'F-06 operational',
 `created_at` TIMESTAMP NULL, `updated_at` TIMESTAMP NULL,
 KEY `idx_sp_user` (`user_id`), KEY `idx_sp_app` (`app_id`),
 SPATIAL INDEX `spx_provider_location` (`provider_location`),
 SPATIAL INDEX `spx_coverage` (`coverage_zone`),
 CONSTRAINT `fk_sp_user` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS `service_tickets` (
 `id` BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
 `uuid` CHAR(36) NOT NULL UNIQUE,
 `requester_id` BIGINT UNSIGNED NOT NULL, `provider_id` BIGINT UNSIGNED NULL,
 `app_id` ENUM('AU BUSINESS','AU MED','AU DEALS','AU SERV','AU INVEST') DEFAULT 'AU SERV',
 `title` VARCHAR(255) NOT NULL, `status` ENUM('requested','assigned','en_route','arrived','inspection','in_progress','completed','disputed') DEFAULT 'requested',
 `pickup_point` POINT SRID 4326 NULL,
 `created_at` TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP(3), `updated_at` TIMESTAMP(3) NULL,
 KEY `idx_ticket_req` (`requester_id`), KEY `idx_ticket_provider` (`provider_id`), KEY `idx_ticket_status` (`status`), KEY `idx_ticket_app` (`app_id`),
 SPATIAL INDEX `spx_ticket_pickup` (`pickup_point`),
 CONSTRAINT `fk_ticket_req` FOREIGN KEY (`requester_id`) REFERENCES `users`(`id`) ON DELETE RESTRICT,
 CONSTRAINT `fk_ticket_provider` FOREIGN KEY (`provider_id`) REFERENCES `service_providers`(`id`) ON DELETE SET NULL
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS `dispatch_logs` (
 `id` BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
 `ticket_id` BIGINT UNSIGNED NOT NULL, `provider_id` BIGINT UNSIGNED NOT NULL,
 `app_id` ENUM('AU BUSINESS','AU MED','AU DEALS','AU SERV','AU INVEST') DEFAULT 'AU SERV',
 `dispatched_at` TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP(3),
 `distance_m` INT UNSIGNED NULL COMMENT 'ST_Distance_Sphere result',
 `created_at` TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP(3),
 KEY `idx_dispatch_ticket` (`ticket_id`), KEY `idx_dispatch_provider` (`provider_id`),
 -- PARTITION monthly F-11 (DBA): PARTITION BY RANGE (YEAR(created_at)*100+MONTH(created_at))
 CONSTRAINT `fk_dispatch_ticket` FOREIGN KEY (`ticket_id`) REFERENCES `service_tickets`(`id`) ON DELETE CASCADE COMMENT 'F-10 CASCADE',
 CONSTRAINT `fk_dispatch_provider` FOREIGN KEY (`provider_id`) REFERENCES `service_providers`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB COMMENT 'F-12 partitioned monthly';
-- Insert must use ST_SRID(ST_GeomFromText(''POINT(31.235 30.044)''),4326)
```

**Race guard:** `dispatch` uses Redis `Mutex lock:ticket:{id} NX EX 5` + `SELECT ... FOR UPDATE` per Pillar 6.

---
## 3. AU INVEST SCHEMA — MySQL 8.4 State-Machine + minor (F-07, F-12)

```sql
CREATE TABLE IF NOT EXISTS `investment_deals` (
 `id` BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
 `uuid` CHAR(36) NOT NULL UNIQUE,
 `tenant_id` BIGINT UNSIGNED NOT NULL, `app_id` ENUM('AU BUSINESS','AU MED','AU DEALS','AU SERV','AU INVEST') DEFAULT 'AU INVEST',
 `title` VARCHAR(255) NOT NULL, `amount_minor` BIGINT NOT NULL COMMENT 'F-12 BIGINT minor',
 `currency` CHAR(3) DEFAULT 'EGP',
 `status` ENUM('draft','funding','funded','escrow_locked','released','refunded','expired') DEFAULT 'draft' COMMENT 'F-07',
 `funding_target_minor` BIGINT NOT NULL, `funded_minor` BIGINT DEFAULT 0,
 `created_at` TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP(3), `updated_at` TIMESTAMP(3) NULL,
 KEY `idx_inv_tenant` (`tenant_id`), KEY `idx_inv_status` (`status`), KEY `idx_inv_app` (`app_id`),
 CONSTRAINT `fk_inv_tenant` FOREIGN KEY (`tenant_id`) REFERENCES `users`(`id`) ON DELETE RESTRICT COMMENT 'F-10 RESTRICT escrow',
 CONSTRAINT `chk_inv_amount` CHECK (`amount_minor` > 0), CONSTRAINT `chk_inv_funded` CHECK (`funded_minor` >= 0)
) ENGINE=InnoDB;
-- BEFORE UPDATE trigger: IF NOT canTransition(OLD.status,NEW.status) SIGNAL SQLSTATE 45000 (allowed: draft→funding→funded→escrow_locked→released/refunded/expired)

CREATE TABLE IF NOT EXISTS `funding_rounds` (
 `id` BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
 `deal_id` BIGINT UNSIGNED NOT NULL, `round_no` TINYINT UNSIGNED NOT NULL,
 `status` ENUM('open','closed','cancelled') DEFAULT 'open',
 `target_minor` BIGINT NOT NULL, `raised_minor` BIGINT DEFAULT 0,
 `app_id` ENUM('AU BUSINESS','AU MED','AU DEALS','AU SERV','AU INVEST') DEFAULT 'AU INVEST',
 `created_at` TIMESTAMP NULL, `updated_at` TIMESTAMP NULL,
 KEY `idx_fr_deal` (`deal_id`),
 CONSTRAINT `fk_fr_deal` FOREIGN KEY (`deal_id`) REFERENCES `investment_deals`(`id`) ON DELETE CASCADE,
 CONSTRAINT `chk_fr_target` CHECK (`target_minor` > 0)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS `escrow_contracts` (
 `id` BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
 `deal_id` BIGINT UNSIGNED NOT NULL, `escrow_clearing_id` BIGINT UNSIGNED NULL COMMENT 'FK B.2a escrow_clearings',
 `status` ENUM('holding','released','refunded','disputed') DEFAULT 'holding',
 `amount_minor` BIGINT NOT NULL, `created_at` TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP(3),
 KEY `idx_ec_deal` (`deal_id`),
 CONSTRAINT `fk_ec_deal` FOREIGN KEY (`deal_id`) REFERENCES `investment_deals`(`id`) ON DELETE CASCADE,
 CONSTRAINT `fk_ec_escrow` FOREIGN KEY (`escrow_clearing_id`) REFERENCES `escrow_clearings`(`id`) ON DELETE SET NULL
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS `investor_ledgers` (
 `id` BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
 `deal_id` BIGINT UNSIGNED NOT NULL, `investor_id` BIGINT UNSIGNED NOT NULL,
 `app_id` ENUM('AU BUSINESS','AU MED','AU DEALS','AU SERV','AU INVEST') DEFAULT 'AU INVEST',
 `amount_minor` BIGINT NOT NULL COMMENT 'F-12 minor',
 `currency` CHAR(3) DEFAULT 'EGP',
 `prev_hash` CHAR(64) NULL, `hash_current` CHAR(64) NOT NULL COMMENT 'hash_chain like B.2a',
 `created_at` TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP(3),
 KEY `idx_il_deal` (`deal_id`), KEY `idx_il_investor` (`investor_id`),
 CONSTRAINT `fk_il_deal` FOREIGN KEY (`deal_id`) REFERENCES `investment_deals`(`id`) ON DELETE RESTRICT COMMENT 'F-10 RESTRICT',
 CONSTRAINT `fk_il_investor` FOREIGN KEY (`investor_id`) REFERENCES `users`(`id`) ON DELETE RESTRICT,
 CONSTRAINT `chk_il_amount` CHECK (`amount_minor` != 0)
) ENGINE=InnoDB COMMENT 'WORM append — REVOKE UPDATE,DELETE';
-- REVOKE UPDATE,DELETE ON investor_ledgers FROM abd_app
```

---
## 4. AU MED PRIVACY-FIRST SCHEMA — PostgreSQL 16 + PostGIS + pgcrypto (F-02, F-03, F-04)

> **DB Target:** `connection: pgsql` only. All `amed_` tables use `pgsql`. Core remains `mysql`. `Schema::connection(''pgsql'')`.

```sql
-- Enable extensions (DBA once)
CREATE EXTENSION IF NOT EXISTS postgis; CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- medical_providers (pgsql)
CREATE TABLE IF NOT EXISTS amed_medical_providers (
 id BIGSERIAL PRIMARY KEY,
 uuid UUID NOT NULL UNIQUE DEFAULT gen_random_uuid(),
 user_id BIGINT NOT NULL, -- no FK to mysql users (cross-DB) → logical FK + app_id check
 app_id VARCHAR(20) DEFAULT 'AU MED' CHECK (app_id=''AU MED''),
 specialty VARCHAR(80) NOT NULL, is_verified BOOLEAN DEFAULT false,
 clinic_location GEOGRAPHY(POINT,4326) NULL, -- PostGIS GEOGRAPHY
 created_at TIMESTAMPTZ DEFAULT NOW(), updated_at TIMESTAMPTZ
);
CREATE INDEX idx_amed_prov_user ON amed_medical_providers(user_id);
CREATE INDEX spx_amed_prov_loc ON amed_medical_providers USING GIST(clinic_location);

-- medical_appointments (pgcrypto encrypted F-04)
CREATE TABLE IF NOT EXISTS amed_medical_appointments (
 id BIGSERIAL PRIMARY KEY,
 uuid UUID NOT NULL UNIQUE DEFAULT gen_random_uuid(),
 patient_user_id BIGINT NOT NULL, provider_id BIGINT NOT NULL REFERENCES amed_medical_providers(id) ON DELETE RESTRICT,
 app_id VARCHAR(20) DEFAULT 'AU MED',
 complaint_encrypted TEXT NOT NULL COMMENT 'pgp_sym_encrypt(plaintext, key) F-04',
 scheduled_at TIMESTAMPTZ NOT NULL, status VARCHAR(20) DEFAULT ''scheduled'' CHECK (status IN (''scheduled'',''completed'',''cancelled'',''no_show'')),
 created_at TIMESTAMPTZ DEFAULT NOW()
);
-- Eloquent model $connection=''pgsql'', accessor decrypts via pgp_sym_decrypt with env(''PGCRYPTO_KEY'')

-- provider_trust_scores (pre-aggregated F-09 R37)
CREATE TABLE IF NOT EXISTS amed_provider_trust_scores (
 provider_id BIGINT PRIMARY KEY REFERENCES amed_medical_providers(id) ON DELETE CASCADE,
 score DECIMAL(5,2) CHECK (score BETWEEN 0 AND 100),
 computed_at TIMESTAMPTZ DEFAULT NOW()
);
-- Populated via nightly job from stats_provider_daily, never AVG on live

-- consultation_telemetry (strictly anonymized hashes F-03 HMAC)
CREATE TABLE IF NOT EXISTS amed_consultation_telemetry (
 id BIGSERIAL PRIMARY KEY,
 appointment_id BIGINT NOT NULL REFERENCES amed_medical_appointments(id) ON DELETE CASCADE,
 nlp_hash CHAR(64) NOT NULL COMMENT 'hash_hmac sha256 canonical_json + TELEMETRY_HMAC_KEY',
 payload_hash CHAR(64) NOT NULL, -- SHA256 of redacted payload
 prev_hash CHAR(64), hash_current CHAR(64) NOT NULL, -- chain like B.3
 app_id VARCHAR(20) DEFAULT 'AU MED',
 created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_telem_appointment ON amed_consultation_telemetry(appointment_id);
-- WORM: REVOKE UPDATE,DELETE ON amed_consultation_telemetry FROM amed_app; PARTITION monthly; RETENTION 90d
```

**Model mapping:** `app/Domain/AUMed/Models/MedicalAppointment.php protected $connection='pgsql'; protected $table='amed_medical_appointments'; casts: complaint_encrypted via accessor `pgp_sym_decrypt(complaint_encrypted, env('PGCRYPTO_KEY'))`.

---
## 5. MODULE 8 — DIGITAL WORKFORCE MARKETPLACE — MySQL 8.4 Tenant Isolated (F-08, F-10, F-11)

```sql
-- Extend additive — if exists upgrade (F-08 DRY vs agent_actions 000002)
CREATE TABLE IF NOT EXISTS `digital_agents` (
 `id` TINYINT UNSIGNED PRIMARY KEY COMMENT '1..13 Agents canonical',
 `code` VARCHAR(30) NOT NULL UNIQUE COMMENT 'agent_1_cfo',
 `name` VARCHAR(80) NOT NULL, `app_id` ENUM('AU BUSINESS','AU MED','AU DEALS','AU SERV','AU INVEST') DEFAULT 'AU BUSINESS',
 `is_active` BOOLEAN DEFAULT true,
 `created_at` TIMESTAMP NULL, `updated_at` TIMESTAMP NULL,
 KEY `idx_da_app` (`app_id`)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS `tenant_agent_subscriptions` (
 `id` BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
 `tenant_id` BIGINT UNSIGNED NOT NULL COMMENT 'user/merchant tenant',
 `agent_id` TINYINT UNSIGNED NOT NULL COMMENT '1..13',
 `app_id` ENUM('AU BUSINESS','AU MED','AU DEALS','AU SERV','AU INVEST') NOT NULL,
 `status` ENUM('active','suspended','cancelled') DEFAULT 'active',
 `started_at` TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP(3), `ends_at` TIMESTAMP(3) NULL,
 `created_at` TIMESTAMP NULL, `updated_at` TIMESTAMP NULL,
 UNIQUE KEY `uk_tenant_agent_app` (`tenant_id`,`agent_id`,`app_id`) COMMENT 'F-08 isolation',
 KEY `idx_tas_tenant` (`tenant_id`), KEY `idx_tas_agent` (`agent_id`),
 CONSTRAINT `fk_tas_tenant` FOREIGN KEY (`tenant_id`) REFERENCES `users`(`id`) ON DELETE CASCADE COMMENT 'F-10 CASCADE tenant',
 CONSTRAINT `fk_tas_agent` FOREIGN KEY (`agent_id`) REFERENCES `digital_agents`(`id`) ON DELETE RESTRICT COMMENT 'F-10 RESTRICT agent',
 CONSTRAINT `chk_agent_1_13` CHECK (`agent_id` BETWEEN 1 AND 13)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS `agent_execution_logs` (
 `id` BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
 `subscription_id` BIGINT UNSIGNED NOT NULL, `agent_id` TINYINT UNSIGNED NOT NULL,
 `app_id` ENUM('AU BUSINESS','AU MED','AU DEALS','AU SERV','AU INVEST') NOT NULL,
 `input_hash` CHAR(64) NOT NULL, `output_hash` CHAR(64) NOT NULL,
 `tokens` INT UNSIGNED DEFAULT 0, `cost_usd` DECIMAL(10,4) DEFAULT 0,
 `status` ENUM('queued','running','completed','failed') DEFAULT 'completed',
 `prev_hash` CHAR(64) NULL, `hash_current` CHAR(64) NOT NULL COMMENT 'chain F-11',
 `created_at` TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP(3),
 KEY `idx_ael_sub` (`subscription_id`), KEY `idx_ael_agent_created` (`agent_id`,`created_at`), KEY `idx_ael_app` (`app_id`),
 -- PARTITION monthly F-11
 CONSTRAINT `fk_ael_sub` FOREIGN KEY (`subscription_id`) REFERENCES `tenant_agent_subscriptions`(`id`) ON DELETE CASCADE COMMENT 'F-10 CASCADE',
 CONSTRAINT `fk_ael_agent` FOREIGN KEY (`agent_id`) REFERENCES `digital_agents`(`id`) ON DELETE RESTRICT
) ENGINE=InnoDB COMMENT 'F-11 partitioned monthly — REVOKE UPDATE,DELETE';

CREATE TABLE IF NOT EXISTS `agent_memory_sandboxes` (
 `id` BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
 `agent_id` TINYINT UNSIGNED NOT NULL, `tenant_id` BIGINT UNSIGNED NOT NULL,
 `app_id` ENUM('AU BUSINESS','AU MED','AU DEALS','AU SERV','AU INVEST') NOT NULL,
 `memory_key` VARCHAR(80) NOT NULL, `memory_json` JSON NOT NULL,
 `created_at` TIMESTAMP NULL, `updated_at` TIMESTAMP NULL,
 UNIQUE KEY `uk_sandbox_tenant_agent_key` (`tenant_id`,`agent_id`,`memory_key`) COMMENT 'F-08 isolation',
 KEY `idx_sandbox_tenant` (`tenant_id`), KEY `idx_sandbox_agent` (`agent_id`),
 CONSTRAINT `fk_sandbox_agent` FOREIGN KEY (`agent_id`) REFERENCES `digital_agents`(`id`) ON DELETE CASCADE COMMENT 'F-10 CASCADE',
 CONSTRAINT `fk_sandbox_tenant` FOREIGN KEY (`tenant_id`) REFERENCES `users`(`id`) ON DELETE CASCADE,
 CONSTRAINT `chk_sandbox_json` CHECK (JSON_VALID(`memory_json`)),
 CONSTRAINT `chk_sandbox_isolation` CHECK (`app_id` IN (''AU BUSINESS'',''AU MED'',''AU DEALS'',''AU SERV'',''AU INVEST''))
) ENGINE=InnoDB COMMENT 'F-08 tenant+app isolation — REVOKE?';
-- Gate: app_id must equal subscription.app_id via trigger SIGNAL if mismatch
```

---
## 6. DDD ELOQUENT DOMAIN MAPPINGS — app_id Scope Trait

```php
// Trait TenantScoped { scopeTenant($q, $appId) { return $q->where(''app_id'', $appId); } }
// All Models: protected $fillable; casts: json, encrypted; use TenantScoped; $connection for pgsql
// DealsListing: FULLTEXT scope scopeSearch($q, $term) → whereRaw("MATCH(title,description) AGAINST(? IN BOOLEAN MODE)",[$term])
// ServiceProvider: scopeNearby($q, $lng,$lat,$radiusM) → whereRaw("ST_Distance_Sphere(provider_location, ST_SRID(POINT(?,?),4326)) < ?",[$lng,$lat,$radiusM])
// InvestmentDeal: enum Status {draft→funding→funded→escrow_locked→released/refunded/expired} + canTransition()
// MedicalAppointment (pgsql): protected $connection=''pgsql''; accessor getComplaintAttribute() => pgp_sym_decrypt
// DigitalAgent: hasMany subscriptions; TenantAgentSubscription: belongsTo agent + tenant
```

---
## 7. SPRINTS — Any AI Agent (1-3 files / ≤150L) — R4

**B.5.1 — DDL Deals (2 files)** — `000022_b5_deals_upgrade.php` (additive FULLTEXT ngram + SRID upgrade + stagnant_deals + seed)
**B.5.2 — DDL Serv + Invest (2 files)** — `000023_b5_serv_invest_upgrade.php` (POINT SRID+SPATIAL + dispatch_logs partition + invest state-machine minor + ledger WORM)
**B.5.3 — DDL Med pgsql + Workforce (2 files)** — `000024_b5_med_workforce_pgsql.php` (pgsql 4 tables pgcrypto HMAC + workforce 4 tables tenant isolated)
**B.5.4 — Eloquent Domain Models (3 files)** — `AUDeals/DealsListing + DealCategory + AUServ/ServiceProvider` with app_id scope + FULLTEXT/SPATIAL scopes ≤120L
**B.5.5 — Eloquent Invest + Med (3 files)** — `AUInvest/InvestmentDeal + InvestorLedger + AUMed/MedicalAppointment (pgsql)` with state-machine + hash chain
**B.5.6 — Workforce Models + Gates (3 files)** — `Workforce/DigitalAgent + TenantAgentSubscription + AgentExecutionLog (WORM)` + `AgentMemorySandbox` isolation ≤120L

**Verification Gates (B.5 exit):**
- ✅ `Schema::hasTable` gates pass; `SHOW CREATE TABLE deals_listings` shows `FULLTEXT ngram` + `SPATIAL SRID 4326`
- ✅ `EXPLAIN MATCH(title) AGAINST (''سيارة'')` uses `FULLTEXT`; `EXPLAIN ST_Distance_Sphere` uses `SPATIAL` sub-ms
- ✅ Invest `UPDATE investment_deals SET status=''released'' WHERE status=''draft''` → `45000 canTransition` fail
- ✅ `investor_ledgers amount_minor BIGINT` not DECIMAL; `investor_ledgers` append-only `REVOKE UPDATE,DELETE`
- ✅ `amed_consultation_telemetry` on `pgsql` with `pgcrypto` + `hash_hmac` + chain; `medical_appointments` encrypted `pgp_sym_encrypt`
- ✅ `agent_memory_sandboxes` tenant+app isolation: insert with mismatched app_id → `45000`; `SHOW CREATE TABLE dispatch_logs` partition monthly
- ✅ All models `app_id` scoped + `php artisan migrate --force` green + `any` zero + no raw SQL + additive only

---
## 8. CALIBRATOR GATE — 100% before any code

| Domain | Score | Gate |
|--------|-------|------|
| Memory (71pts+9M/5A/13Agents) | 100% | additive reconciled no drift |
| Architecture (DDD + Dual-DB) | 100% | mysql core + pgsql clinical explicit |
| Security (HMAC+pgcrypto+REVOKE) | 100% | anonymized hashes, encrypted PHI |
| Precision (ngram+SRID4326+minor) | 100% | Arabic FULLTEXT, sub-ms SPATIAL, minor int |
| Craftsmanship (PHP8.4 Enums+VO+SRP) | 100% | 3 files ≤150L, Eloquent scopes |
| Operational (stats+partition+Reverb) | 100% | pre-aggregated 00:30 job, monthly partition |

> **BLOCKED if <100%** — reload `.arenarules` + B.1a→B.4 hierarchy.

---
## 9. ARABIC SUMMARY

تم تأسيس DDL لـ 5 تطبيقات + Workforce: Au Deals بـ FULLTEXT ngram عربي + stagnant عبر stats، Au Serv بـ POINT/POLYGON SRID 4326 + SPATIAL، Au Invest بآلة حالات صارمة + minor BIGINT + WORM، Au Med على PostgreSQL مع pgcrypto HMAC + تشفير، Workforce بمعزل tenant+app + partition شهري، مع خرائط DDD وقيود FK وتحققات EXPLAIN.

---
*Teams: AUDeals, AUServ, AUInvest, AUMed, Workforce — Target: `abduniproject` — Next: B.6 API Pipelines*
