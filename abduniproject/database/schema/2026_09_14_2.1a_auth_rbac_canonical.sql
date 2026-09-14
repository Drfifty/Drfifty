-- =============================================================================
-- ABD UNI PROJECT — PHASE 2.1a AUTH & RBAC CANONICAL DDL (MySQL 8.4 InnoDB utf8mb4)
-- Arena env | branch arena/01a09d54-drfifty | 5 Apps | 13 Agents | 9 Modules | Pillar 4,5,9
-- Rule7: JSON (not JSONB) | Rule6: AES-256-GCM | Engine InnoDB | Charset utf8mb4_unicode_ci
-- =============================================================================
SET NAMES utf8mb4; SET FOREIGN_KEY_CHECKS=0;

-- 1) users — global identity, app_id = origin tenant, Tier1 historical (soft-hide only)
CREATE TABLE `users` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `uuid` CHAR(36) NOT NULL,
  `app_id` ENUM('AU_BUSINESS','AU_MED','AU_DEALS','AU_SERV','AU_INVEST') NOT NULL DEFAULT 'AU_BUSINESS',
  `name` VARCHAR(120) NOT NULL, `email` VARCHAR(255) NOT NULL,
  `email_verified_at` DATETIME NULL, `phone_encrypted` TEXT NULL COMMENT 'AES-256-GCM base64',
  `phone_iv` VARCHAR(64) NULL, `phone_tag` VARCHAR(64) NULL, `phone_verified_at` DATETIME NULL,
  `password` VARCHAR(255) NOT NULL, `avatar_url` VARCHAR(500) NULL,
  `locale` ENUM('ar','en') NOT NULL DEFAULT 'ar', `status` ENUM('active','suspended','frozen_soft','banned') NOT NULL DEFAULT 'active',
  `mfa_enabled` TINYINT(1) NOT NULL DEFAULT 0, `failed_mfa_attempts` TINYINT UNSIGNED NOT NULL DEFAULT 0,
  `last_login_at` DATETIME NULL, `deleted_at` DATETIME NULL, `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP, `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`), UNIQUE KEY `uq_users_uuid` (`uuid`), UNIQUE KEY `uq_users_email` (`email`),
  KEY `idx_users_app_status` (`app_id`,`status`), KEY `idx_users_locale` (`locale`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 2) roles — spatie-style RBAC immutable system roles + app-scoped
CREATE TABLE `roles` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT, `uuid` CHAR(36) NOT NULL,
  `app_id` ENUM('AU_BUSINESS','AU_MED','AU_DEALS','AU_SERV','AU_INVEST') NULL COMMENT 'NULL=global',
  `slug` VARCHAR(80) NOT NULL, `name` VARCHAR(120) NOT NULL, `name_ar` VARCHAR(120) NOT NULL,
  `description` TEXT NULL, `level` TINYINT UNSIGNED NOT NULL DEFAULT 10, `is_system` TINYINT(1) NOT NULL DEFAULT 0,
  `guard_name` VARCHAR(50) NOT NULL DEFAULT 'web',
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP, `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`), UNIQUE KEY `uq_roles_slug_app` (`slug`,`app_id`), UNIQUE KEY `uq_roles_uuid` (`uuid`),
  KEY `idx_roles_app` (`app_id`), KEY `idx_roles_system` (`is_system`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 3) permissions — view vs execute (Rule36), module 1-9, agent 1-13
CREATE TABLE `permissions` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT, `slug` VARCHAR(120) NOT NULL,
  `name` VARCHAR(150) NOT NULL, `name_ar` VARCHAR(150) NOT NULL,
  `module_id` TINYINT UNSIGNED NULL, `agent_id` TINYINT UNSIGNED NULL, `micro_switch_key` VARCHAR(120) NULL,
  `type` ENUM('view','execute','both') NOT NULL DEFAULT 'view', `description` TEXT NULL,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP, `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`), UNIQUE KEY `uq_perm_slug` (`slug`),
  KEY `idx_perm_module` (`module_id`), KEY `idx_perm_agent` (`agent_id`),
  CONSTRAINT `chk_perm_module` CHECK (`module_id` IS NULL OR `module_id` BETWEEN 1 AND 9),
  CONSTRAINT `chk_perm_agent` CHECK (`agent_id` IS NULL OR `agent_id` BETWEEN 1 AND 13)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 4) role_permissions — pivot
CREATE TABLE `role_permissions` (
  `role_id` BIGINT UNSIGNED NOT NULL, `permission_id` BIGINT UNSIGNED NOT NULL,
  PRIMARY KEY (`role_id`,`permission_id`),
  CONSTRAINT `fk_rp_role` FOREIGN KEY (`role_id`) REFERENCES `roles`(`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_rp_perm` FOREIGN KEY (`permission_id`) REFERENCES `permissions`(`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 5) user_roles — assignment with app context + expiry
CREATE TABLE `user_roles` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT, `user_id` BIGINT UNSIGNED NOT NULL, `role_id` BIGINT UNSIGNED NOT NULL,
  `app_id` ENUM('AU_BUSINESS','AU_MED','AU_DEALS','AU_SERV','AU_INVEST') NOT NULL DEFAULT 'AU_BUSINESS',
  `assigned_by` BIGINT UNSIGNED NULL, `assigned_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP, `expires_at` DATETIME NULL,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP, `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`), UNIQUE KEY `uq_user_role_app` (`user_id`,`role_id`,`app_id`),
  KEY `idx_ur_user` (`user_id`), KEY `idx_ur_role` (`role_id`),
  CONSTRAINT `fk_ur_user` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_ur_role` FOREIGN KEY (`role_id`) REFERENCES `roles`(`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_ur_assigner` FOREIGN KEY (`assigned_by`) REFERENCES `users`(`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 6) micro_switch_matrix — granular Agent sub-capability HITL toggles
CREATE TABLE `micro_switch_matrix` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT, `agent_id` TINYINT UNSIGNED NOT NULL,
  `capability_key` VARCHAR(80) NOT NULL, `sub_capability` VARCHAR(80) NULL,
  `label` VARCHAR(150) NOT NULL, `label_ar` VARCHAR(150) NOT NULL, `description` TEXT NULL,
  `is_enabled` TINYINT(1) NOT NULL DEFAULT 1, `requires_hitl` TINYINT(1) NOT NULL DEFAULT 0,
  `hitl_role_id` BIGINT UNSIGNED NULL, `default_enabled` TINYINT(1) NOT NULL DEFAULT 1,
  `app_id` ENUM('AU_BUSINESS','AU_MED','AU_DEALS','AU_SERV','AU_INVEST') NULL COMMENT 'NULL=global',
  `module_id` TINYINT UNSIGNED NULL,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP, `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`), UNIQUE KEY `uq_micro` (`agent_id`,`capability_key`,`sub_capability`,`app_id`),
  KEY `idx_micro_agent` (`agent_id`), KEY `idx_micro_enabled` (`is_enabled`,`requires_hitl`), KEY `idx_micro_app` (`app_id`),
  CONSTRAINT `chk_micro_agent` CHECK (`agent_id` BETWEEN 1 AND 13), CONSTRAINT `chk_micro_module` CHECK (`module_id` IS NULL OR `module_id` BETWEEN 1 AND 9),
  CONSTRAINT `fk_micro_hitl_role` FOREIGN KEY (`hitl_role_id`) REFERENCES `roles`(`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 7) feature_flags — AU Lite (Pillar4) hibernate AU MED/DEALS/SERV/INVEST → 503
CREATE TABLE `feature_flags` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT, `flag_key` VARCHAR(50) NOT NULL COMMENT 'au_med,au_deals,au_serv,au_invest,au_lite_master',
  `flag_name` VARCHAR(120) NOT NULL, `flag_name_ar` VARCHAR(120) NOT NULL, `description` TEXT NULL,
  `is_enabled` TINYINT(1) NOT NULL DEFAULT 1, `is_core` TINYINT(1) NOT NULL DEFAULT 0 COMMENT 'AU_BUSINESS non-hibernatable',
  `rollout_percentage` TINYINT UNSIGNED NOT NULL DEFAULT 100, `allowed_user_ids` JSON NULL COMMENT 'MySQL JSON whitelist',
  `maintenance_message` TEXT NULL, `maintenance_message_ar` TEXT NULL, `enabled_for_roles` JSON NULL,
  `last_toggled_by` BIGINT UNSIGNED NULL, `last_toggled_at` DATETIME NULL,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP, `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`), UNIQUE KEY `uq_flag_key` (`flag_key`), KEY `idx_flag_enabled` (`is_enabled`),
  CONSTRAINT `chk_flag_rollout` CHECK (`rollout_percentage` BETWEEN 0 AND 100),
  CONSTRAINT `fk_flag_toggler` FOREIGN KEY (`last_toggled_by`) REFERENCES `users`(`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 8) data_leak_patterns — RegexDataLeakDetector 100% post-escrow only (Pillar5 + Oil1)
CREATE TABLE `data_leak_patterns` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT, `pattern_name` VARCHAR(100) NOT NULL, `pattern_name_ar` VARCHAR(100) NOT NULL,
  `regex` VARCHAR(500) NOT NULL COMMENT 'PCRE, e.g. phone/email/url',
  `category` ENUM('phone','mobile','email','whatsapp','telegram','url','social','custom') NOT NULL,
  `severity` ENUM('low','medium','high','critical') NOT NULL DEFAULT 'high',
  `is_active` TINYINT(1) NOT NULL DEFAULT 1, `is_strict_post_escrow_only` TINYINT(1) NOT NULL DEFAULT 1,
  `replacement_text` VARCHAR(100) NOT NULL DEFAULT '[محمي]', `description` TEXT NULL, `created_by` BIGINT UNSIGNED NULL,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP, `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`), KEY `idx_dlp_cat_active` (`category`,`is_active`), KEY `idx_dlp_strict` (`is_strict_post_escrow_only`),
  CONSTRAINT `fk_dlp_creator` FOREIGN KEY (`created_by`) REFERENCES `users`(`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 9) refresh_tokens — Silent Token Rotation (Pillar9) HttpOnly Secure SameSite
CREATE TABLE `refresh_tokens` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT, `uuid` CHAR(36) NOT NULL,
  `user_id` BIGINT UNSIGNED NOT NULL, `token_hash` CHAR(64) NOT NULL COMMENT 'SHA256',
  `device_fingerprint` VARCHAR(128) NULL, `ip_address` VARCHAR(45) NULL, `user_agent` VARCHAR(500) NULL,
  `expires_at` DATETIME NOT NULL, `revoked_at` DATETIME NULL, `rotated_from_id` BIGINT UNSIGNED NULL, `last_used_at` DATETIME NULL,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP, `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`), UNIQUE KEY `uq_rt_uuid` (`uuid`), UNIQUE KEY `uq_rt_hash` (`token_hash`),
  KEY `idx_rt_user` (`user_id`), KEY `idx_rt_expires` (`expires_at`), KEY `idx_rt_rotated` (`rotated_from_id`),
  CONSTRAINT `fk_rt_user` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_rt_rotated` FOREIGN KEY (`rotated_from_id`) REFERENCES `refresh_tokens`(`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

SET FOREIGN_KEY_CHECKS=1;

-- SEEDS (canonical toggles + DLP)
INSERT INTO `feature_flags` (`flag_key`,`flag_name`,`flag_name_ar`,`is_enabled`,`is_core`,`rollout_percentage`) VALUES
('au_med','AU MED','إيه يو ميد',1,0,100),('au_deals','AU DEALS','إيه يو ديلز',1,0,100),
('au_serv','AU SERV','إيه يو سيرف',1,0,100),('au_invest','AU INVEST','إيه يو إنفست',1,0,100),
('au_business','AU BUSINESS','إيه يو بيزنس',1,1,100) ON DUPLICATE KEY UPDATE `flag_key`=VALUES(`flag_key`);

INSERT INTO `data_leak_patterns` (`pattern_name`,`pattern_name_ar`,`regex`,`category`,`severity`,`is_active`,`is_strict_post_escrow_only`) VALUES
('Egypt Mobile','موبايل مصر','(\\+?20|0)?1[0125][0-9]{8}','phone','critical',1,1),
('Email','بريد إلكتروني','[a-zA-Z0-9._%+\\-]+@[a-zA-Z0-9.\\-]+\\.[a-zA-Z]{2,}','email','critical',1,1),
('WhatsApp Link','رابط واتساب','(wa\\.me|whatsapp\\.com|api\\.whatsapp)','url','high',1,1),
('External URL','رابط خارجي','https?:\\/\\/[^\\s]+','url','high',1,1),
('Telegram','تيليجرام','(t\\.me|telegram\\.me)','social','high',1,1) ON DUPLICATE KEY UPDATE `pattern_name`=VALUES(`pattern_name`);
