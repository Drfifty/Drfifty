-- =============================================================================
-- ABD UNI PROJECT — PHASE 2.1d AU SERV SPATIAL CANONICAL DDL (MySQL 8.4 InnoDB utf8mb4)
-- Arena env | branch arena/01a09d54-drfifty | AU SERV (asv_) real-time dispatch
-- Spatial: POINT SRID4326 live + POLYGON SRID4326 coverage + SPATIAL INDEX | ST_Distance_Sphere
-- CORE ANCHOR: AU SERV (asv_) dispatch under AU BUSINESS master — single-payer escrow (Oil3), 5% commission, 48h dispute + 12h grace once (Oil4), Calibrator reroute on gate failure
-- =============================================================================
SET NAMES utf8mb4; SET FOREIGN_KEY_CHECKS=0;

-- 1) service_providers — live POINT + coverage POLYGON (Tier2, dispatchable)
CREATE TABLE `service_providers` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT, `uuid` CHAR(36) NOT NULL,
  `user_id` BIGINT UNSIGNED NULL COMMENT 'linked auth user', `app_id` ENUM('AU_BUSINESS','AU_MED','AU_DEALS','AU_SERV','AU_INVEST') NOT NULL DEFAULT 'AU_SERV',
  `name` VARCHAR(150) NOT NULL, `name_ar` VARCHAR(150) NOT NULL, `phone_encrypted` TEXT NULL COMMENT 'AES-256-GCM',
  `category` VARCHAR(80) NOT NULL COMMENT 'plumbing|electrical|hvac|...', `skills` JSON NULL COMMENT '["ac_repair","install"]',
  `status` ENUM('offline','available','busy','suspended') NOT NULL DEFAULT 'offline', `rating` DECIMAL(3,2) NOT NULL DEFAULT 0.00, `completed_tickets` INT UNSIGNED NOT NULL DEFAULT 0,
  `current_location` POINT SRID 4326 NULL COMMENT 'live POINT(lng lat)', `coverage_zone` POLYGON SRID 4326 NULL COMMENT 'POLYGON service area',
  `last_location_at` DATETIME NULL, `is_verified` TINYINT(1) NOT NULL DEFAULT 0, `is_hidden` TINYINT(1) NOT NULL DEFAULT 0,
  `meta` JSON NULL, `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP, `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`), UNIQUE KEY `uq_provider_uuid` (`uuid`), UNIQUE KEY `uq_provider_user` (`user_id`), KEY `idx_provider_status` (`status`,`is_hidden`), KEY `idx_provider_cat` (`category`),
  SPATIAL INDEX `spx_provider_location` (`current_location`), SPATIAL INDEX `spx_provider_zone` (`coverage_zone`),
  CONSTRAINT `chk_provider_rating` CHECK (`rating`>=0 AND `rating`<=5),
  CONSTRAINT `chk_provider_skills_json` CHECK (`skills` IS NULL OR JSON_VALID(`skills`)), CONSTRAINT `chk_provider_meta_json` CHECK (`meta` IS NULL OR JSON_VALID(`meta`)),
  CONSTRAINT `fk_provider_user` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 2) service_tickets — request POINT + dispatch lifecycle (Tier1 historical → is_hidden only)
CREATE TABLE `service_tickets` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT, `uuid` CHAR(36) NOT NULL,
  `requester_id` BIGINT UNSIGNED NOT NULL, `provider_id` BIGINT UNSIGNED NULL, `app_id` ENUM('AU_BUSINESS','AU_MED','AU_DEALS','AU_SERV','AU_INVEST') NOT NULL DEFAULT 'AU_SERV',
  `module_id` TINYINT UNSIGNED NOT NULL DEFAULT 5 COMMENT 'Module 5/6', `category` VARCHAR(80) NOT NULL, `title` VARCHAR(255) NOT NULL, `title_ar` VARCHAR(255) NOT NULL, `description` TEXT NOT NULL,
  `status` ENUM('open','assigned','dispatched','in_progress','completed','cancelled','disputed','expired_grace') NOT NULL DEFAULT 'open',
  `priority` ENUM('low','normal','high','urgent') NOT NULL DEFAULT 'normal', `price_subunit` BIGINT UNSIGNED NULL, `currency` VARCHAR(8) NOT NULL DEFAULT 'EGP',
  `ticket_location` POINT SRID 4326 NOT NULL COMMENT 'POINT(lng lat) request', `address_text` VARCHAR(500) NULL, `governorate` VARCHAR(80) NULL, `city` VARCHAR(80) NULL,
  `scheduled_at` DATETIME NULL, `dispatched_at` DATETIME NULL, `started_at` DATETIME NULL, `completed_at` DATETIME NULL, `dispute_deadline_at` DATETIME NULL COMMENT 'completed+48h', `grace_expires_at` DATETIME NULL COMMENT 'open+12h once',
  `is_hidden` TINYINT(1) NOT NULL DEFAULT 0, `meta` JSON NULL,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP, `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP, `deleted_at` DATETIME NULL,
  PRIMARY KEY (`id`), UNIQUE KEY `uq_ticket_uuid` (`uuid`), KEY `idx_ticket_requester` (`requester_id`), KEY `idx_ticket_provider` (`provider_id`), KEY `idx_ticket_status` (`status`,`is_hidden`), KEY `idx_ticket_cat` (`category`), KEY `idx_ticket_scheduled` (`scheduled_at`),
  SPATIAL INDEX `spx_ticket_location` (`ticket_location`),
  CONSTRAINT `chk_ticket_module` CHECK (`module_id` BETWEEN 1 AND 9),
  CONSTRAINT `chk_ticket_meta_json` CHECK (`meta` IS NULL OR JSON_VALID(`meta`)),
  CONSTRAINT `fk_ticket_requester` FOREIGN KEY (`requester_id`) REFERENCES `users`(`id`) ON DELETE CASCADE, CONSTRAINT `fk_ticket_provider` FOREIGN KEY (`provider_id`) REFERENCES `service_providers`(`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 3) dispatch_logs — nearest-provider resolution + ETA + distance audit (append-only)
CREATE TABLE `dispatch_logs` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT, `uuid` CHAR(36) NOT NULL,
  `ticket_id` BIGINT UNSIGNED NOT NULL, `provider_id` BIGINT UNSIGNED NOT NULL,
  `app_id` ENUM('AU_BUSINESS','AU_MED','AU_DEALS','AU_SERV','AU_INVEST') NOT NULL DEFAULT 'AU_SERV',
  `status` ENUM('proposed','accepted','rejected','timeout','cancelled') NOT NULL DEFAULT 'proposed',
  `distance_meters` INT UNSIGNED NULL COMMENT 'ST_Distance_Sphere at dispatch', `eta_minutes` SMALLINT UNSIGNED NULL, `rank` TINYINT UNSIGNED NOT NULL DEFAULT 1 COMMENT '1=nearest',
  `provider_location_at_dispatch` POINT SRID 4326 NULL, `dispatched_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP, `responded_at` DATETIME NULL,
  `meta` JSON NULL, `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP, `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`), UNIQUE KEY `uq_dispatch_uuid` (`uuid`), KEY `idx_dispatch_ticket` (`ticket_id`), KEY `idx_dispatch_provider` (`provider_id`), KEY `idx_dispatch_status` (`status`),
  SPATIAL INDEX `spx_dispatch_provider_loc` (`provider_location_at_dispatch`),
  CONSTRAINT `fk_dispatch_ticket` FOREIGN KEY (`ticket_id`) REFERENCES `service_tickets`(`id`) ON DELETE CASCADE, CONSTRAINT `fk_dispatch_provider` FOREIGN KEY (`provider_id`) REFERENCES `service_providers`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

SET FOREIGN_KEY_CHECKS=1;

-- SEEDS — demo providers (Cairo)
INSERT INTO `service_providers` (`uuid`,`name`,`name_ar`,`category`,`status`,`current_location`,`coverage_zone`) VALUES
(UUID(),'Ahmed HVAC','أحمد تكييف','hvac','available', ST_SRID(POINT(31.2357,30.0444),4326), ST_SRID(ST_GeomFromText('POLYGON((30.9 29.9, 31.5 29.9, 31.5 30.4, 30.9 30.4, 30.9 29.9))'),4326))
ON DUPLICATE KEY UPDATE `name`=VALUES(`name`);
