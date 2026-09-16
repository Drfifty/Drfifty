-- =============================================================================
-- ABD UNI PROJECT — PHASE 2.1c AU DEALS CANONICAL DDL (MySQL 8.4 InnoDB utf8mb4)
-- Arena env | branch arena/01a09d54-drfifty | AU DEALS (adl_) B2B Inventory & Medicine Exchange
-- Rule7 JSON | Tiered Mutation | FULLTEXT ngram | Spatial-ready | Pillar 1/4 | Oil 30/40
-- CORE ANCHOR: Deals served through AU BUSINESS vault + AU Lite gate — AU DEALS (adl_) is B2C spoke under AU BUSINESS master (shared app_wallet, 5% commission, Regex leak guard)
-- =============================================================================
SET NAMES utf8mb4; SET FOREIGN_KEY_CHECKS=0;

-- 1) deal_categories — hierarchical taxonomy (Tier2 standalone → hard-delete allowed if unlinked)
CREATE TABLE `deal_categories` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT, `uuid` CHAR(36) NOT NULL,
  `app_id` ENUM('AU_BUSINESS','AU_MED','AU_DEALS','AU_SERV','AU_INVEST') NOT NULL DEFAULT 'AU_DEALS',
  `parent_id` BIGINT UNSIGNED NULL, `slug` VARCHAR(120) NOT NULL, `name` VARCHAR(150) NOT NULL, `name_ar` VARCHAR(150) NOT NULL,
  `level` TINYINT UNSIGNED NOT NULL DEFAULT 1, `sort_order` INT NOT NULL DEFAULT 0, `icon` VARCHAR(120) NULL,
  `attributes_schema` JSON NULL COMMENT 'MySQL JSON dynamic fields (Rule7) per-category',
  `is_active` TINYINT(1) NOT NULL DEFAULT 1, `is_hidden` TINYINT(1) NOT NULL DEFAULT 0,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP, `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`), UNIQUE KEY `uq_cat_uuid` (`uuid`), UNIQUE KEY `uq_cat_slug_app` (`slug`,`app_id`), KEY `idx_cat_parent` (`parent_id`), KEY `idx_cat_active` (`is_active`,`is_hidden`),
  CONSTRAINT `chk_cat_schema_json` CHECK (`attributes_schema` IS NULL OR JSON_VALID(`attributes_schema`)),
  CONSTRAINT `fk_cat_parent` FOREIGN KEY (`parent_id`) REFERENCES `deal_categories`(`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 2) promotional_bundles — cross-listing bundles (Rule7 JSON items)
CREATE TABLE `promotional_bundles` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT, `uuid` CHAR(36) NOT NULL,
  `seller_id` BIGINT UNSIGNED NOT NULL, `app_id` ENUM('AU_BUSINESS','AU_MED','AU_DEALS','AU_SERV','AU_INVEST') NOT NULL DEFAULT 'AU_DEALS',
  `name` VARCHAR(150) NOT NULL, `name_ar` VARCHAR(150) NOT NULL, `slug` VARCHAR(150) NOT NULL,
  `discount_type` ENUM('fixed_subunit','percentage') NOT NULL DEFAULT 'percentage', `discount_value` DECIMAL(10,2) NOT NULL DEFAULT 0,
  `valid_from` DATETIME NULL, `valid_to` DATETIME NULL, `status` ENUM('draft','active','expired','hidden') NOT NULL DEFAULT 'draft',
  `bundle_items` JSON NULL COMMENT '[{"listing_id":1,"qty":2}] MySQL JSON', `meta` JSON NULL,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP, `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`), UNIQUE KEY `uq_bundle_uuid` (`uuid`), UNIQUE KEY `uq_bundle_slug_seller` (`slug`,`seller_id`), KEY `idx_bundle_seller` (`seller_id`), KEY `idx_bundle_status` (`status`),
  CONSTRAINT `chk_bundle_discount` CHECK (`discount_value`>=0), CONSTRAINT `fk_bundle_seller` FOREIGN KEY (`seller_id`) REFERENCES `users`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 3) deals_listings — core listing (Tier1 historical → soft-hide only, FULLTEXT ngram)
CREATE TABLE `deals_listings` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT, `uuid` CHAR(36) NOT NULL,
  `seller_id` BIGINT UNSIGNED NOT NULL, `category_id` BIGINT UNSIGNED NOT NULL, `bundle_id` BIGINT UNSIGNED NULL,
  `app_id` ENUM('AU_BUSINESS','AU_MED','AU_DEALS','AU_SERV','AU_INVEST') NOT NULL DEFAULT 'AU_DEALS',
  `title` VARCHAR(255) NOT NULL, `title_ar` VARCHAR(255) NOT NULL, `description` TEXT NOT NULL, `description_ar` TEXT NOT NULL,
  `status` ENUM('draft','active','sold','expired','frozen','hidden') NOT NULL DEFAULT 'draft', `type` ENUM('single','bulk','bundle','barter') NOT NULL DEFAULT 'single',
  `currency` VARCHAR(8) NOT NULL DEFAULT 'EGP', `price_subunit` BIGINT UNSIGNED NOT NULL COMMENT 'cents', `original_price_subunit` BIGINT UNSIGNED NULL, `discount_percentage` DECIMAL(5,2) NOT NULL DEFAULT 0,
  `stock_quantity` INT UNSIGNED NOT NULL DEFAULT 1, `min_order_quantity` INT UNSIGNED NOT NULL DEFAULT 1, `unit` VARCHAR(40) NOT NULL DEFAULT 'piece',
  `governorate` VARCHAR(80) NULL, `city` VARCHAR(80) NULL, `lat` DECIMAL(10,7) NULL, `lng` DECIMAL(10,7) NULL, `location_point` POINT SRID 4326 GENERATED ALWAYS AS (ST_SRID(POINT(`lng`,`lat`),4326)) STORED COMMENT 'native Spatial mirror',
  `expiry_date` DATE NULL, `views_count` INT UNSIGNED NOT NULL DEFAULT 0, `clicks_count` INT UNSIGNED NOT NULL DEFAULT 0, `interactions_count` INT UNSIGNED NOT NULL DEFAULT 0,
  `is_stagnant` TINYINT(1) NOT NULL DEFAULT 0, `is_hidden` TINYINT(1) NOT NULL DEFAULT 0, `is_featured` TINYINT(1) NOT NULL DEFAULT 0,
  `attributes` JSON NULL COMMENT 'dynamic per-category fields (Rule7)', `meta` JSON NULL,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP, `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP, `deleted_at` DATETIME NULL,
  PRIMARY KEY (`id`), UNIQUE KEY `uq_listing_uuid` (`uuid`), KEY `idx_listing_seller` (`seller_id`), KEY `idx_listing_cat` (`category_id`), KEY `idx_listing_bundle` (`bundle_id`), KEY `idx_listing_status` (`status`,`is_hidden`), KEY `idx_listing_app_cur` (`app_id`,`currency`), KEY `idx_listing_expiry` (`expiry_date`), KEY `idx_listing_stagnant` (`is_stagnant`),
  FULLTEXT KEY `ft_listing_title_desc` (`title`,`description`) WITH PARSER ngram, FULLTEXT KEY `ft_listing_title_desc_ar` (`title_ar`,`description_ar`) WITH PARSER ngram,
  SPATIAL INDEX `spx_listing_point` (`location_point`),
  CONSTRAINT `chk_listing_price` CHECK (`price_subunit`>0), CONSTRAINT `chk_listing_stock` CHECK (`stock_quantity`>=0),
  CONSTRAINT `chk_listing_attrs_json` CHECK (`attributes` IS NULL OR JSON_VALID(`attributes`)), CONSTRAINT `chk_listing_meta_json` CHECK (`meta` IS NULL OR JSON_VALID(`meta`)),
  CONSTRAINT `fk_listing_seller` FOREIGN KEY (`seller_id`) REFERENCES `users`(`id`) ON DELETE CASCADE, CONSTRAINT `fk_listing_cat` FOREIGN KEY (`category_id`) REFERENCES `deal_categories`(`id`) ON DELETE RESTRICT, CONSTRAINT `fk_listing_bundle` FOREIGN KEY (`bundle_id`) REFERENCES `promotional_bundles`(`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 4) deal_items — line items per listing (bulk SKU, batch/expiry)
CREATE TABLE `deal_items` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT, `uuid` CHAR(36) NOT NULL,
  `listing_id` BIGINT UNSIGNED NOT NULL, `sku` VARCHAR(80) NOT NULL, `name` VARCHAR(150) NOT NULL, `name_ar` VARCHAR(150) NOT NULL,
  `quantity` INT UNSIGNED NOT NULL DEFAULT 1, `price_subunit` BIGINT UNSIGNED NOT NULL, `batch_number` VARCHAR(80) NULL, `expiry_date` DATE NULL,
  `attributes` JSON NULL, `is_active` TINYINT(1) NOT NULL DEFAULT 1,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP, `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`), UNIQUE KEY `uq_item_uuid` (`uuid`), UNIQUE KEY `uq_item_sku_listing` (`sku`,`listing_id`), KEY `idx_item_listing` (`listing_id`), KEY `idx_item_expiry` (`expiry_date`),
  CONSTRAINT `chk_item_qty` CHECK (`quantity`>0), CONSTRAINT `chk_item_price` CHECK (`price_subunit`>0),
  CONSTRAINT `fk_item_listing` FOREIGN KEY (`listing_id`) REFERENCES `deals_listings`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 5) stagnant_deals — zero interactions 24h tracker (cron hourly, notify seller)
CREATE TABLE `stagnant_deals` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT, `uuid` CHAR(36) NOT NULL,
  `listing_id` BIGINT UNSIGNED NOT NULL, `seller_id` BIGINT UNSIGNED NOT NULL,
  `app_id` ENUM('AU_BUSINESS','AU_MED','AU_DEALS','AU_SERV','AU_INVEST') NOT NULL DEFAULT 'AU_DEALS',
  `stagnant_since` DATETIME NOT NULL, `last_interaction_at` DATETIME NULL, `interaction_count` INT UNSIGNED NOT NULL DEFAULT 0,
  `views_at_detection` INT UNSIGNED NOT NULL DEFAULT 0, `clicks_at_detection` INT UNSIGNED NOT NULL DEFAULT 0,
  `is_notified` TINYINT(1) NOT NULL DEFAULT 0, `notified_at` DATETIME NULL, `status` ENUM('pending','nudged','resolved','archived') NOT NULL DEFAULT 'pending',
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP, `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`), UNIQUE KEY `uq_stagnant_uuid` (`uuid`), UNIQUE KEY `uq_stagnant_listing` (`listing_id`), KEY `idx_stagnant_seller` (`seller_id`), KEY `idx_stagnant_status` (`status`), KEY `idx_stagnant_since` (`stagnant_since`),
  CONSTRAINT `fk_stagnant_listing` FOREIGN KEY (`listing_id`) REFERENCES `deals_listings`(`id`) ON DELETE CASCADE, CONSTRAINT `fk_stagnant_seller` FOREIGN KEY (`seller_id`) REFERENCES `users`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

SET FOREIGN_KEY_CHECKS=1;

-- SEEDS — core categories (medicine exchange)
INSERT INTO `deal_categories` (`uuid`,`slug`,`name`,`name_ar`,`level`) VALUES
(UUID(),'medicines','Medicines','أدوية',1),(UUID(),'medical-devices','Medical Devices','أجهزة طبية',1),(UUID(),'bulk-stock','Bulk Stock','مخزون جملة',1)
ON DUPLICATE KEY UPDATE `slug`=VALUES(`slug`);
