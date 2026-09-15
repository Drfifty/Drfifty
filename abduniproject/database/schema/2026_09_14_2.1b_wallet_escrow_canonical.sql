-- =============================================================================
-- ABD UNI PROJECT — PHASE 2.1b FINANCIAL & ESCROW CANONICAL DDL (MySQL 8.4 InnoDB utf8mb4)
-- Arena env | branch arena/01a09d54-drfifty | Pillar 6 (lockForUpdate+Mutex) | 5% Oil2 | Escrow Immutability
-- Rule7 JSON | Rule11 additive | CHECK balance>=0 | subunit BIGINT (cents) | Paymob blind sub-merchant
-- CORE ANCHOR: AU BUSINESS (ab_) owns Paymob sub-merchant + single app_wallet ledger — 4 B2C spokes settle through AU BUSINESS vault (universal, 5% adjustable, single-payer Oil3)
-- =============================================================================
SET NAMES utf8mb4; SET FOREIGN_KEY_CHECKS=0;

-- 1) app_wallets — unified multi-currency, no base bias, sacred wallet (Oil2: 5% base per-module dynamic)
CREATE TABLE `app_wallets` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT, `uuid` CHAR(36) NOT NULL,
  `user_id` BIGINT UNSIGNED NOT NULL, `app_id` ENUM('AU_BUSINESS','AU_MED','AU_DEALS','AU_SERV','AU_INVEST') NOT NULL DEFAULT 'AU_BUSINESS',
  `currency` VARCHAR(8) NOT NULL COMMENT 'EGP,USD,SAR... ISO4217', `balance_subunit` BIGINT NOT NULL DEFAULT 0 COMMENT 'cents/piasters',
  `locked_subunit` BIGINT NOT NULL DEFAULT 0, `available_subunit` BIGINT GENERATED ALWAYS AS (`balance_subunit`-`locked_subunit`) STORED,
  `status` ENUM('active','frozen','closed') NOT NULL DEFAULT 'active', `version` INT UNSIGNED NOT NULL DEFAULT 0 COMMENT 'optimistic+pessimistic guard',
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP, `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`), UNIQUE KEY `uq_wallet_user_app_cur` (`user_id`,`app_id`,`currency`), UNIQUE KEY `uq_wallet_uuid` (`uuid`),
  KEY `idx_wallet_app_cur` (`app_id`,`currency`), KEY `idx_wallet_status` (`status`),
  CONSTRAINT `chk_w_bal_ge0` CHECK (`balance_subunit`>=0), CONSTRAINT `chk_w_locked_ge0` CHECK (`locked_subunit`>=0),
  CONSTRAINT `chk_w_avail_ge0` CHECK (`balance_subunit`>=`locked_subunit`),
  CONSTRAINT `fk_w_user` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 2) exchange_rates — FX core (PROVIDER=exchangerate_api, Cron */30)
CREATE TABLE `exchange_rates` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT, `base_currency` VARCHAR(8) NOT NULL, `quote_currency` VARCHAR(8) NOT NULL,
  `rate` DECIMAL(20,8) NOT NULL, `provider` VARCHAR(64) NOT NULL DEFAULT 'exchangerate_api',
  `fetched_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP, `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP, `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`), UNIQUE KEY `uq_fx_pair` (`base_currency`,`quote_currency`), KEY `idx_fx_provider` (`provider`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 3) commission_rules — 3-Tier Engine (Oil2: 5% unified base, per-module dynamic via dashboard)
CREATE TABLE `commission_rules` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT, `uuid` CHAR(36) NOT NULL,
  `app_id` ENUM('AU_BUSINESS','AU_MED','AU_DEALS','AU_SERV','AU_INVEST') NOT NULL DEFAULT 'AU_BUSINESS', `module_id` TINYINT UNSIGNED NOT NULL,
  `tier` ENUM('tier1','tier2','tier3') NOT NULL, `tier_label` VARCHAR(80) NOT NULL,
  `min_amount_subunit` BIGINT UNSIGNED NOT NULL DEFAULT 0, `max_amount_subunit` BIGINT UNSIGNED NULL COMMENT 'NULL=inf',
  `rate` DECIMAL(6,4) NOT NULL DEFAULT 0.0500 COMMENT '0.0500=5%', `is_active` TINYINT(1) NOT NULL DEFAULT 1,
  `effective_from` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP, `effective_to` DATETIME NULL, `created_by` BIGINT UNSIGNED NULL,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP, `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`), UNIQUE KEY `uq_rule_uuid` (`uuid`), UNIQUE KEY `uq_rule_tier_active` (`app_id`,`module_id`,`tier`,`effective_from`), KEY `idx_rule_active` (`is_active`,`effective_from`),
  CONSTRAINT `chk_rule_module` CHECK (`module_id` BETWEEN 1 AND 9), CONSTRAINT `chk_rule_rate` CHECK (`rate`>=0 AND `rate`<=1),
  CONSTRAINT `chk_rule_range` CHECK (`max_amount_subunit` IS NULL OR `min_amount_subunit`<`max_amount_subunit`),
  CONSTRAINT `fk_rule_creator` FOREIGN KEY (`created_by`) REFERENCES `users`(`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 4) escrow_clearings — Immutability: snapshots frozen at creation, dynamic changes ONLY new rows
CREATE TABLE `escrow_clearings` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT, `uuid` CHAR(36) NOT NULL,
  `app_id` ENUM('AU_BUSINESS','AU_MED','AU_DEALS','AU_SERV','AU_INVEST') NOT NULL DEFAULT 'AU_BUSINESS', `module_id` TINYINT UNSIGNED NOT NULL,
  `buyer_id` BIGINT UNSIGNED NOT NULL COMMENT 'single-payer Oil3', `seller_id` BIGINT UNSIGNED NOT NULL, `deal_id` BIGINT UNSIGNED NULL,
  `amount_subunit` BIGINT UNSIGNED NOT NULL, `currency` VARCHAR(8) NOT NULL,
  `fx_snapshot` JSON NULL, `fx_locked_at` DATETIME NULL, `commission_rule_id` BIGINT UNSIGNED NULL, `commission_rate_snapshot` DECIMAL(6,4) NOT NULL DEFAULT 0.0500 COMMENT '5% Oil2 frozen', `commission_amount_subunit` BIGINT UNSIGNED NOT NULL DEFAULT 0,
  `vat_rate_snapshot` DECIMAL(6,4) NOT NULL DEFAULT 0.0000, `vat_amount_subunit` BIGINT UNSIGNED NOT NULL DEFAULT 0,
  `barter_split` JSON NULL COMMENT '{"ratio":"1.5/1.0","split":"50/50"}',
  `paymob_transaction_id` VARCHAR(80) NULL, `sub_merchant_id` VARCHAR(80) NULL COMMENT 'Paymob auto sub-merchant + manual queue fallback',
  `status` ENUM('holding','disputed','released','refunded','partial_milestone','chargeback_frozen','expired_grace','waiting_list') NOT NULL DEFAULT 'holding',
  `hold_started_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP, `dispute_deadline_at` DATETIME NOT NULL COMMENT 'hold+48h', `grace_expires_at` DATETIME NOT NULL COMMENT 'hold+12h once Oil4',
  `milestone_number` TINYINT UNSIGNED NULL, `total_milestones` TINYINT UNSIGNED NULL, `released_at` DATETIME NULL, `refunded_at` DATETIME NULL,
  `hash_chain` CHAR(64) NOT NULL, `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP, `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`), UNIQUE KEY `uq_esc_uuid` (`uuid`), KEY `idx_esc_buyer` (`buyer_id`), KEY `idx_esc_seller` (`seller_id`), KEY `idx_esc_status` (`status`), KEY `idx_esc_module` (`module_id`), KEY `idx_esc_app` (`app_id`), KEY `idx_esc_paymob` (`paymob_transaction_id`),
  CONSTRAINT `chk_esc_module` CHECK (`module_id` BETWEEN 1 AND 9), CONSTRAINT `chk_esc_amt_gt0` CHECK (`amount_subunit`>0),
  CONSTRAINT `fk_esc_buyer` FOREIGN KEY (`buyer_id`) REFERENCES `users`(`id`) ON DELETE RESTRICT, CONSTRAINT `fk_esc_seller` FOREIGN KEY (`seller_id`) REFERENCES `users`(`id`) ON DELETE RESTRICT,
  CONSTRAINT `fk_esc_comm_rule` FOREIGN KEY (`commission_rule_id`) REFERENCES `commission_rules`(`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 5) deal_exchange_snapshots — FX locked_at settlement (transparent)
CREATE TABLE `deal_exchange_snapshots` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT, `escrow_id` BIGINT UNSIGNED NULL, `deal_id` BIGINT UNSIGNED NULL,
  `app_id` ENUM('AU_BUSINESS','AU_MED','AU_DEALS','AU_SERV','AU_INVEST') NOT NULL DEFAULT 'AU_BUSINESS',
  `base_currency` VARCHAR(8) NOT NULL, `quote_currency` VARCHAR(8) NOT NULL, `locked_rate` DECIMAL(20,8) NOT NULL,
  `locked_at` DATETIME NOT NULL, `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP, `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`), KEY `idx_snap_escrow` (`escrow_id`), KEY `idx_snap_app_pair` (`app_id`,`base_currency`,`quote_currency`),
  CONSTRAINT `fk_snap_escrow` FOREIGN KEY (`escrow_id`) REFERENCES `escrow_clearings`(`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 6) wallet_transactions — append-only double-entry hash chain, immutable
CREATE TABLE `wallet_transactions` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT, `uuid` CHAR(36) NOT NULL,
  `wallet_id` BIGINT UNSIGNED NOT NULL, `user_id` BIGINT UNSIGNED NOT NULL,
  `app_id` ENUM('AU_BUSINESS','AU_MED','AU_DEALS','AU_SERV','AU_INVEST') NOT NULL DEFAULT 'AU_BUSINESS',
  `type` ENUM('deposit','withdraw','escrow_hold','escrow_release','escrow_refund','commission','vat','barter_debit','barter_credit','loyalty_points','adjustment','paymob_capture') NOT NULL,
  `amount_subunit` BIGINT NOT NULL COMMENT 'signed +credit -debit', `balance_after_subunit` BIGINT NOT NULL, `currency` VARCHAR(8) NOT NULL,
  `reference_type` VARCHAR(80) NULL, `reference_uuid` CHAR(36) NULL, `paymob_transaction_id` VARCHAR(80) NULL,
  `hash_prev` CHAR(64) NULL, `hash_current` CHAR(64) NOT NULL COMMENT 'SHA256(prev+uuid+amount+balance)',
  `fx_snapshot` JSON NULL, `meta` JSON NULL, `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`), UNIQUE KEY `uq_wt_uuid` (`uuid`), KEY `idx_wt_wallet` (`wallet_id`,`created_at`), KEY `idx_wt_user` (`user_id`), KEY `idx_wt_ref` (`reference_type`,`reference_uuid`), KEY `idx_wt_paymob` (`paymob_transaction_id`),
  CONSTRAINT `chk_wt_amt_ne0` CHECK (`amount_subunit`<>0),
  CONSTRAINT `chk_wt_fx_json` CHECK (`fx_snapshot` IS NULL OR JSON_VALID(`fx_snapshot`)),
  CONSTRAINT `chk_wt_meta_json` CHECK (`meta` IS NULL OR JSON_VALID(`meta`)),
  CONSTRAINT `fk_wt_wallet` FOREIGN KEY (`wallet_id`) REFERENCES `app_wallets`(`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_wt_user` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 7) financial_audit_logs — daily reconciliation, hash append-only, 90d hot → S3 Parquet
CREATE TABLE `financial_audit_logs` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT, `uuid` CHAR(36) NOT NULL, `audit_date` DATE NOT NULL,
  `wallet_id` BIGINT UNSIGNED NULL, `user_id` BIGINT UNSIGNED NULL, `app_id` ENUM('AU_BUSINESS','AU_MED','AU_DEALS','AU_SERV','AU_INVEST') NULL,
  `opening_subunit` BIGINT NOT NULL DEFAULT 0, `closing_subunit` BIGINT NOT NULL DEFAULT 0, `total_debits_subunit` BIGINT NOT NULL DEFAULT 0, `total_credits_subunit` BIGINT NOT NULL DEFAULT 0,
  `transactions_hash` CHAR(64) NOT NULL, `prev_hash` CHAR(64) NULL,
  `status` ENUM('pending','reconciled','mismatch') NOT NULL DEFAULT 'pending', `reconciled_by` BIGINT UNSIGNED NULL, `reconciled_at` DATETIME NULL,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`), UNIQUE KEY `uq_audit_uuid` (`uuid`), UNIQUE KEY `uq_audit_day_wallet` (`audit_date`,`wallet_id`), KEY `idx_audit_status` (`status`),
  CONSTRAINT `fk_audit_wallet` FOREIGN KEY (`wallet_id`) REFERENCES `app_wallets`(`id`) ON DELETE SET NULL,
  CONSTRAINT `fk_audit_user` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

SET FOREIGN_KEY_CHECKS=1;

-- TRIGGERS — immutability
DELIMITER $$
CREATE TRIGGER `trg_wt_no_update` BEFORE UPDATE ON `wallet_transactions` FOR EACH ROW BEGIN SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT='wallet_transactions immutable: no UPDATE'; END$$
CREATE TRIGGER `trg_wt_no_delete` BEFORE DELETE ON `wallet_transactions` FOR EACH ROW BEGIN SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT='wallet_transactions immutable: no DELETE'; END$$
CREATE TRIGGER `trg_esc_no_snapshot_update` BEFORE UPDATE ON `escrow_clearings` FOR EACH ROW BEGIN IF OLD.commission_rate_snapshot<>NEW.commission_rate_snapshot OR OLD.amount_subunit<>NEW.amount_subunit OR OLD.fx_snapshot<>NEW.fx_snapshot THEN SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT='escrow immutability violated: snapshots frozen'; END IF; END$$
DELIMITER ;

-- SEEDS — 3-Tier 5% base per module (Oil2)
INSERT INTO `commission_rules` (`uuid`,`app_id`,`module_id`,`tier`,`tier_label`,`min_amount_subunit`,`max_amount_subunit`,`rate`) VALUES
(UUID(), 'AU_BUSINESS', 1, 'tier1','Micro 0–50k',0,5000000,0.0500),(UUID(), 'AU_BUSINESS', 1, 'tier2','Growth 50k–500k',5000000,50000000,0.0500),(UUID(), 'AU_BUSINESS', 1, 'tier3','Enterprise 500k+',50000000,NULL,0.0500)
ON DUPLICATE KEY UPDATE `rate`=VALUES(`rate`);
INSERT INTO `commission_rules` (`uuid`,`app_id`,`module_id`,`tier`,`tier_label`,`min_amount_subunit`,`max_amount_subunit`,`rate`) VALUES
(UUID(), 'AU_DEALS', 4, 'tier1','Micro',0,5000000,0.0500),(UUID(), 'AU_DEALS', 4, 'tier2','Mid',5000000,50000000,0.0500),(UUID(), 'AU_DEALS', 4, 'tier3','High',50000000,NULL,0.0500)
ON DUPLICATE KEY UPDATE `rate`=VALUES(`rate`);
