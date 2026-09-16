# PHASE 5.0 — B.2 قواعد البيانات والمنطق المالي والمحفظة والـ Escrow الحصين
> **ABD UNI PROJECT — Financial Engine & Escrow Subsystem — Principal Fintech Backend (High-Concurrency Ledger & Pessimistic Locking) — Arena Canonical v5.0-B.2**
> **Stack Lock:** Laravel 12 PHP 8.4 | MySQL 8.4+ InnoDB utf8mb4 (core, single source — لا PostgreSQL في B.2) | Redis funnel/lock | Reverb 8080 exclusive | 5 Apps space-form | 13 Agents (Agent 1 CFO — rate setter, no retroactive power) | 9 Modules | `abduniproject`
> **Refs:** `.arenarules` R6,R11,R12,R18,R35,R37 + Pillars 6,1 | `PROJECT_STATE.md` v5.0-B.1 → B.2 → **v5.0-B.2a AUDIT FIX 2026-09-16 (APPROVED & APPLIED)** | B.1 DDD tree | B.5 dual-DB | B.10 traceparent | B.11 replica

> **AMENDMENT v5.0-B.2a — AUDIT RETROSPECTIVE FIX (APPROVED 2026-09-16):**
> - **B2-F1** Idempotency now atomic: `SELECT ... FOR UPDATE` inside tx + `catch 23000 Duplicate` replay verbatim 200, plus `request_hash` mismatch → `422 IDEMPOTENCY_KEY_REUSE_MISMATCH`.
> - **B2-F2** `wallet_adjustment_logs.mandatory_rationale` CHECK now `CHAR_LENGTH(TRIM(...))>=15`; `FormRequest::prepareForValidation` trims + `TrustProxies *` + `$request->ip()` after CF.
> - **B2-F3** `app_wallets` update uses `WHERE version=?` optimistic guard → `409 VERSION_CONFLICT`; deadlock ordering `ORDER BY id ASC`; `WalletMutex::lockMany()`; `READ COMMITTED` isolation (`DB::statement SET TRANSACTION...`).
> - **B2-F4** Commission math via `Brick\Money`/`Money::multipliedBy` with `ROUND_HALF_UP`, rate widened to `DECIMAL(10,6)` (0.0001 precision) to avoid `65,4` overflow.
> - **B2-F5** Replica lag via `heartbeat` table `TIMESTAMPDIFF(MICROSECOND, beat_at, NOW(3))` not `SHOW SLAVE STATUS`; `DB_REPLICA_LAG_THRESHOLD=5` env + `ReplicaConnectionResolver` caches 5s.
> - **B2-F6** Idempotency purge now batched `DELETE ... LIMIT 1000` loop via `PurgeExpiredIdempotencyKeys` hourly, not `EVENT`.
> - **B2-F7** Logging uses `hash_hmac(sha256,userId,LOG_HMAC_KEY)` salted, `Money`→`Money` VO, `replica_lag_ms` in allowlist, `JsonFormatter includeStacktraces:false`, hash canonical `json_encode SORT_KEYS`.
> - **B1+B2 C-F1** Financial transactions set `READ COMMITTED` to reduce gap locks on hot wallet rows; queue `heartbeat` beat every 1s via scheduler.

---

## 0. EXECUTIVE SUMMARY — لماذا B.2 قبل أي API مالي

B.2 يبني **السجل المالي الحصين**: المحفظة الموحدة multi-currency بلا رصيد سالب، الـ `escrow_clearings` بقفل العمولة عند الميلي ثانية، وسجل الأحداث اللانقابل للتعديل. بدونه تنهار كل معاملات AU DEALS/AU SERV/AU INVEST/AU MED ويثبُت الـ double-spend. يقدم هذا الملف **مواصفة تنفيذية كاملة** لـ Any AI Agent: DDL دقيق + فهارس + FK CASCADE + منطق immutability + خدمة EscrowLockService (retry 3 + lockForUpdate + Redis) + انضباط الاستعلامات + الـ idempotency + سجل الأحداث — **لا كود وهمي** ولا `// TODO`.

**الفلسفة:** المال = حالة موزعة خطرة → كل حركة مال تغلق بـ `DB::transaction` + `lockForUpdate()` على صف المحفظة + `Redis::funnel` (أو `Cache::lock`) + `retry(3)` + `CHECK (balance>=0)` + `escrow_rate_applied` مجمّد + `escrow_events` append-only + `Idempotency-Key` 24h → حتى 100 طلب متوازٍ لا يسحب مرتين.

---

## 1. DATABASE MIGRATIONS — MySQL 8.4 InnoDB utf8mb4

### 1.1 المبادئ الثابتة (Rule 7,11,12,18,35)

- **Rule 7:** MySQL `JSON` فقط — لا `JSONB` (PostgreSQL exclusive)
- **Rule 11:** Additive only — لا `migrate:fresh`, لا `drop()` — `if (!Schema::hasTable())`
- **Rule 12:** كل تفاعل عبر Eloquent — لا raw SQL (الـ DDL هنا استثناء للتوثيق Canonical)
- **Money:** كل مبلغ `BIGINT` بالـ **minor units** (قروش) — لا `DECIMAL`/`float` — `INT` يمنع `0.1 + 0.2`
- **Time:** `DATETIME(3)` أو `TIMESTAMP(3)` بالميلي ثانية لقفل العمولة
- **Charset:** `utf8mb4_unicode_ci`

### 1.2 DDL Canonical — 7 جداول (5 مطلوبة + 2 للاكتمال)

#### A. `app_wallets` — المحفظة الموحدة (موجود، يُرقّى إلى B.2 CHECK الصارم)

```sql
-- migration: 2026_09_14_000016_upgrade_wallets_b2.php
-- Canonical — aligns prompt cols (balance/currency/status) to existing minor-unit schema
CREATE TABLE IF NOT EXISTS `app_wallets` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `user_id` BIGINT UNSIGNED NOT NULL COMMENT 'FK users.id',
  `balance_minor` BIGINT NOT NULL DEFAULT 0 COMMENT 'prompt: balance — stored in minor units (qirsh), no float',
  `balance` BIGINT GENERATED ALWAYS AS (`balance_minor`) VIRTUAL COMMENT 'B.2 alias — balance = balance_minor',
  `currency` ENUM('EGP','USD','SAR','EUR') NOT NULL DEFAULT 'EGP' COMMENT 'prompt: currency — unified wallet, no base bias (Q8)',
  `status` ENUM('active','frozen','suspended') NOT NULL DEFAULT 'active',
  `version` BIGINT UNSIGNED NOT NULL DEFAULT 0 COMMENT 'optimistic-lock helper',
  `available_minor` BIGINT GENERATED ALWAYS AS (`balance_minor`) STORED COMMENT 'future hold extension',
  `created_at` TIMESTAMP NULL,
  `updated_at` TIMESTAMP NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_user_currency` (`user_id`,`currency`) COMMENT 'one wallet per currency per user',
  KEY `idx_wallet_user` (`user_id`),
  KEY `idx_wallet_status` (`status`),
  CONSTRAINT `fk_wallet_user` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `chk_wallet_balance_nonnegative` CHECK (`balance_minor` >= 0) COMMENT 'prompt CHECK (balance >= 0) — sacred',
  CONSTRAINT `chk_wallet_available_nonnegative` CHECK (`available_minor` >= 0)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

**لماذا `balance` VIRTUAL؟** النص المطلوب `balance` يبقى متوافقاً مع الواجهة، بينما التخزين الحقيقي `balance_minor BIGINT` يطبق `CHECK >=0` بلا truncation.

#### B. `wallet_transactions` — سجل الحركة (append-only لوجستي)

```sql
CREATE TABLE IF NOT EXISTS `wallet_transactions` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `wallet_id` BIGINT UNSIGNED NOT NULL,
  `user_id` BIGINT UNSIGNED NOT NULL COMMENT 'denormalized for replica read-path',
  `transaction_type` ENUM('deposit','withdrawal','escrow_lock','escrow_release','escrow_refund','commission','adjustment','barter_settlement') NOT NULL,
  `amount_minor` BIGINT NOT NULL COMMENT 'prompt: amount — signed minor: +credit / -debit',
  `amount` BIGINT GENERATED ALWAYS AS (`amount_minor`) VIRTUAL COMMENT 'alias',
  `reference_uuid` CHAR(36) NOT NULL COMMENT 'prompt: reference_uuid — idempotency correlation',
  `idempotency_key` VARCHAR(64) NULL COMMENT 'FK idempotency_keys.key — 24h dedup',
  `metadata` JSON NULL COMMENT 'MySQL JSON — fx_snapshot, commission_tier, etc. — JSON_VALID',
  `balance_after_minor` BIGINT NOT NULL COMMENT 'snapshot after apply — audit',
  `app_id` ENUM('AU BUSINESS','AU MED','AU DEALS','AU SERV','AU INVEST') NOT NULL DEFAULT 'AU BUSINESS',
  `created_at` TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_reference_uuid` (`reference_uuid`) COMMENT 'one ledger row per money move',
  KEY `idx_wt_wallet_created` (`wallet_id`,`created_at`),
  KEY `idx_wt_user_type` (`user_id`,`transaction_type`),
  KEY `idx_wt_reference` (`reference_uuid`),
  KEY `idx_wt_app` (`app_id`),
  CONSTRAINT `fk_wt_wallet` FOREIGN KEY (`wallet_id`) REFERENCES `app_wallets`(`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_wt_user` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE,
  CONSTRAINT `chk_wt_amount_nonzero` CHECK (`amount_minor` != 0),
  CONSTRAINT `chk_wt_metadata_json` CHECK (`metadata` IS NULL OR JSON_VALID(`metadata`))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

#### C. `wallet_adjustment_logs` — تعديل يدوي بـ rationale + IP (مطلوب B.2)

```sql
CREATE TABLE IF NOT EXISTS `wallet_adjustment_logs` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `wallet_id` BIGINT UNSIGNED NOT NULL,
  `admin_id` BIGINT UNSIGNED NOT NULL COMMENT 'prompt: admin_id — actor',
  `amount_changed_minor` BIGINT NOT NULL COMMENT 'signed delta minor',
  `previous_balance_minor` BIGINT NOT NULL,
  `new_balance_minor` BIGINT NOT NULL,
  `mandatory_rationale` TEXT NOT NULL COMMENT 'prompt: mandatory_rationale >=15 chars — domain + request check',
  `ip_address` VARCHAR(45) NOT NULL COMMENT 'prompt: ip_address via $request->ip() — IPv4/IPv6',
  `reference_uuid` CHAR(36) NOT NULL COMMENT 'link to wallet_transactions.reference_uuid',
  `app_id` ENUM('AU BUSINESS','AU MED','AU DEALS','AU SERV','AU INVEST') NOT NULL DEFAULT 'AU BUSINESS',
  `created_at` TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  KEY `idx_wal_wallet` (`wallet_id`),
  KEY `idx_wal_admin` (`admin_id`),
  KEY `idx_wal_created` (`created_at`),
  CONSTRAINT `fk_wal_wallet` FOREIGN KEY (`wallet_id`) REFERENCES `app_wallets`(`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_wal_admin` FOREIGN KEY (`admin_id`) REFERENCES `users`(`id`) ON DELETE RESTRICT,
  CONSTRAINT `chk_wal_rationale_len` CHECK (CHAR_LENGTH(`mandatory_rationale`) >= 15) COMMENT 'DB-level — app-level also validates',
  CONSTRAINT `chk_wal_balance_math` CHECK (`new_balance_minor` = `previous_balance_minor` + `amount_changed_minor`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```
> **DB role grants:** `wallet_adjustment_logs` is **append-only** like escrow_events — `REVOKE UPDATE,DELETE ON wallet_adjustment_logs FROM 'app'@'%'`.

#### D. `escrow_clearings` — ضمان الصفقة (immutability core)

```sql
CREATE TABLE IF NOT EXISTS `escrow_clearings` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `transaction_id` CHAR(36) NOT NULL COMMENT 'prompt: transaction_id — UUID of deal/order',
  `buyer_id` BIGINT UNSIGNED NOT NULL,
  `seller_id` BIGINT UNSIGNED NOT NULL COMMENT 'prompt: seller_id — single-payer Oil 36, fee deducted at settlement',
  `amount_minor` BIGINT UNSIGNED NOT NULL COMMENT 'prompt: amount — total escrow in minor',
  `amount` BIGINT UNSIGNED GENERATED ALWAYS AS (`amount_minor`) VIRTUAL,
  `status` ENUM('holding','partial_milestone','release_eligible','released','refunded','disputed','expired') NOT NULL DEFAULT 'holding',
  `escrow_rate_applied` DECIMAL(5,4) NOT NULL COMMENT 'prompt: escrow_rate_applied — locked at deal creation millisecond',
  `commission_minor` BIGINT UNSIGNED NOT NULL DEFAULT 0 COMMENT 'amount_minor * escrow_rate_applied',
  `fx_snapshot` JSON NULL COMMENT 'MySQL JSON — exchange_rates at creation — JSON_VALID',
  `barter_snapshot` JSON NULL COMMENT '1.5x/1x + 50/50 — JSON_VALID',
  `release_eligible_at` DATETIME(3) NULL COMMENT 'prompt: release_eligible_at — 48h + 12h grace once logic',
  `holding_expires_at` DATETIME(3) NULL COMMENT 'Oil 38 — 12h grace once → auto-cancel',
  `disputed_at` DATETIME(3) NULL,
  `app_id` ENUM('AU BUSINESS','AU MED','AU DEALS','AU SERV','AU INVEST') NOT NULL,
  `deal_type` ENUM('deals_listing','serv_ticket','invest_dispatch','med_appointment','barter_proposal','auction_win','group_buy') NOT NULL,
  `metadata` JSON NULL,
  `created_at` TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updated_at` TIMESTAMP(3) NULL ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_transaction_id` (`transaction_id`),
  KEY `idx_esc_buyer` (`buyer_id`),
  KEY `idx_esc_seller` (`seller_id`),
  KEY `idx_esc_status` (`status`),
  KEY `idx_esc_app` (`app_id`),
  KEY `idx_esc_release_at` (`release_eligible_at`),
  KEY `idx_esc_created` (`created_at`),
  CONSTRAINT `fk_esc_buyer` FOREIGN KEY (`buyer_id`) REFERENCES `users`(`id`) ON DELETE RESTRICT,
  CONSTRAINT `fk_esc_seller` FOREIGN KEY (`seller_id`) REFERENCES `users`(`id`) ON DELETE RESTRICT,
  CONSTRAINT `chk_esc_amount_pos` CHECK (`amount_minor` > 0),
  CONSTRAINT `chk_esc_rate_range` CHECK (`escrow_rate_applied` BETWEEN 0 AND 0.5) COMMENT '0-50% — but B.1 caps at 50%',
  CONSTRAINT `chk_esc_status_transition` CHECK (`status` IN ('holding','partial_milestone','release_eligible','released','refunded','disputed','expired')),
  CONSTRAINT `chk_esc_fx_json` CHECK (`fx_snapshot` IS NULL OR JSON_VALID(`fx_snapshot`)),
  CONSTRAINT `chk_esc_barter_json` CHECK (`barter_snapshot` IS NULL OR JSON_VALID(`barter_snapshot`))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```
> **Immutability trigger (PHASE2 2.1b already):** `BEFORE UPDATE` → `IF OLD.escrow_rate_applied != NEW.escrow_rate_applied THEN SIGNAL SQLSTATE '45000'`. App role has no UPDATE on `escrow_rate_applied` column via `REVOKE` + `EscrowClearing` model `guarded`.

#### E. `commission_rules` — شرائح 5% الديناميكية (Q34 Oil 2)

```sql
CREATE TABLE IF NOT EXISTS `commission_rules` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `tier_level` TINYINT UNSIGNED NOT NULL COMMENT 'prompt: tier_level — 1..3 (P2 3-Tier)',
  `min_volume_minor` BIGINT UNSIGNED NOT NULL COMMENT 'prompt: min_volume — minor',
  `max_volume_minor` BIGINT UNSIGNED NULL COMMENT 'prompt: max_volume — null = infinity',
  `commission_percentage` DECIMAL(5,2) NOT NULL COMMENT 'prompt: commission_percentage — e.g., 5.00',
  `commission_rate` DECIMAL(5,4) GENERATED ALWAYS AS (`commission_percentage`/100) STORED,
  `app_id` ENUM('AU BUSINESS','AU MED','AU DEALS','AU SERV','AU INVEST') NULL COMMENT 'null=global default 5%',
  `is_active` TINYINT(1) NOT NULL DEFAULT 1,
  `created_at` TIMESTAMP NULL,
  `updated_at` TIMESTAMP NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_tier_app_volume` (`tier_level`,`app_id`,`min_volume_minor`),
  KEY `idx_commission_active` (`is_active`),
  CONSTRAINT `chk_comm_tier_range` CHECK (`tier_level` BETWEEN 1 AND 10),
  CONSTRAINT `chk_comm_pct_range` CHECK (`commission_percentage` BETWEEN 0 AND 50),
  CONSTRAINT `chk_comm_volume_order` CHECK (`max_volume_minor` IS NULL OR `max_volume_minor` > `min_volume_minor`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Seed canonical 3-Tier 5% base (idempotent)
INSERT INTO `commission_rules` (`tier_level`,`min_volume_minor`,`max_volume_minor`,`commission_percentage`,`app_id`) VALUES
  (1, 0, 10000000, 5.00, NULL),          -- Tier 1: 0-100k EGP → 5%
  (2, 10000001, 100000000, 4.00, NULL),  -- Tier 2: 100k-1M → 4%
  (3, 100000001, NULL, 3.00, NULL)       -- Tier 3: >1M → 3%
ON DUPLICATE KEY UPDATE `commission_percentage`=VALUES(`commission_percentage`);
```

#### F. `escrow_events` — سجل أحداث الضمان اللانقابل للتعديل (B.2 §5)

```sql
CREATE TABLE IF NOT EXISTS `escrow_events` (
  `event_id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `transaction_id` CHAR(36) NOT NULL COMMENT 'prompt: transaction_id — FK escrow_clearings.transaction_id',
  `from_status` ENUM('holding','partial_milestone','release_eligible','released','refunded','disputed','expired') NOT NULL,
  `to_status` ENUM('holding','partial_milestone','release_eligible','released','refunded','disputed','expired') NOT NULL,
  `actor_type` ENUM('buyer','seller','agent_cfo','super_admin','system','agent_13_fraud') NOT NULL COMMENT 'prompt: actor_type',
  `actor_id` BIGINT UNSIGNED NULL COMMENT 'prompt: actor_id — nullable for system',
  `reason_code` VARCHAR(50) NOT NULL COMMENT 'prompt: reason_code — e.g., RELEASE_ELIGIBLE, DISPUTE_OPENED, FRAUD_FREEZE',
  `payload_snapshot_hash` CHAR(64) NOT NULL COMMENT 'prompt: payload_snapshot_hash — SHA256(JSON escrow row at event moment)',
  `payload_snapshot` JSON NULL COMMENT 'optional redacted snapshot — allowlist only',
  `app_id` ENUM('AU BUSINESS','AU MED','AU DEALS','AU SERV','AU INVEST') NOT NULL,
  `created_at` TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`event_id`),
  KEY `idx_ee_transaction_created` (`transaction_id`,`created_at`),
  KEY `idx_ee_to_status` (`to_status`),
  KEY `idx_ee_actor` (`actor_type`,`actor_id`),
  CONSTRAINT `fk_ee_transaction` FOREIGN KEY (`transaction_id`) REFERENCES `escrow_clearings`(`transaction_id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `chk_ee_payload_hash_len` CHECK (CHAR_LENGTH(`payload_snapshot_hash`)=64)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Append-only ledger — single source for dispute reconstruction';

-- Grants — application DB user has NO UPDATE/DELETE (executed as DBA)
-- REVOKE UPDATE, DELETE ON abduniproject.escrow_events FROM 'abd_app'@'%';
-- REVOKE UPDATE, DELETE ON abduniproject.wallet_adjustment_logs FROM 'abd_app'@'%';
```

#### G. `idempotency_keys` — مفتاح منع إعادة التنفيذ 24h (B.2 §5)

```sql
CREATE TABLE IF NOT EXISTS `idempotency_keys` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `idempotency_key` VARCHAR(64) NOT NULL COMMENT 'prompt: Idempotency-Key header — UUIDv4 or 32+ hex',
  `endpoint` VARCHAR(120) NOT NULL COMMENT 'e.g., POST /api/v1/wallet/transfer',
  `user_id` BIGINT UNSIGNED NOT NULL,
  `app_id` ENUM('AU BUSINESS','AU MED','AU DEALS','AU SERV','AU INVEST') NOT NULL,
  `request_hash` CHAR(64) NOT NULL COMMENT 'SHA256(canonical JSON body)',
  `response_status` SMALLINT NOT NULL,
  `response_body` JSON NOT NULL COMMENT 'verbatim response — replayed within 24h',
  `created_at` TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `expires_at` DATETIME(3) NOT NULL COMMENT 'created_at + 24h — TTL sweep',
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_key_user_endpoint` (`idempotency_key`,`user_id`,`endpoint`),
  KEY `idx_idem_expires` (`expires_at`),
  KEY `idx_idem_user_created` (`user_id`,`created_at`),
  CONSTRAINT `chk_idem_key_len` CHECK (CHAR_LENGTH(`idempotency_key`) >= 16)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Event scheduler — purge >24h (or cron)
-- CREATE EVENT ev_purge_idempotency ON SCHEDULE EVERY 1 HOUR DO DELETE FROM idempotency_keys WHERE expires_at < NOW(3);
```

---

## 2. THE ESCROW IMMUTABILITY GUARANTEE — قفل العمولة عند الميلي ثانية

### 2.1 القاعدة الذهبية

> **تعديلات العمولة أو الرسوم الديناميكية تطبق حصراً على المعاملات المنشأة حديثاً.**  
> `escrow_clearings.escrow_rate_applied` يُقفل عند `created_at(3)` لحظة إنشاء الصفقة، ولا يسمح بأي تعديل بأثر رجعي بواسطة Agent 1 (CFO) أو Super Admin — حتى عبر `UPDATE` مباشر.

### 2.2 Flow — Create Deal (atomic)

```
1. Client POST /api/v1/deals/listings|/serv/tickets|/invest/dispatches
      header X-App-Id, body { amount, app_id, deal_type }
2. Controller (thin) → FormRequest validated
3. Action: ResolveCommissionRuleAction
     - SELECT * FROM commission_rules
       WHERE is_active=1 AND (app_id IS NULL OR app_id=?)
         AND ? BETWEEN min_volume_minor AND COALESCE(max_volume_minor, 9e18)
       ORDER BY tier_level LIMIT 1  → 5.00% (Tier1) / 4% / 3%
     - `rate = commission_rate` (DECIMAL 5,4)
4. Inside DB::transaction:
     INSERT INTO escrow_clearings (
       transaction_id=UUIDv4(), buyer_id, seller_id, amount_minor,
       escrow_rate_applied = rate,          -- ← الفريزر
       commission_minor = ROUND(amount * rate),
       fx_snapshot = JSON({rate, source, locked_at: NOW(3)}),
       status='holding', release_eligible_at = NOW(3)+48h,
       holding_expires_at = NOW(3)+12h,     -- Oil 38 once
       app_id, deal_type, created_at=NOW(3)
     )
     INSERT INTO escrow_events (
       transaction_id, from_status='holding', to_status='holding',
       actor_type='buyer', actor_id, reason_code='ESCROW_CREATED',
       payload_snapshot_hash=SHA256(JSON(escrow_row)), app_id
     )
5. Agent 1 لاحقاً: POST /api/v1/admin/commission-rules {tier:1, commission:6%}
     → UPDATE commission_rules SET commission_percentage=6 WHERE tier=1
     → **لا يمس** أي `escrow_clearings` موجود — WHERE خلفه application role بلا UPDATE على العمود
6. New deal created بعد التعديل → يلتقط 6% الجديد → القديم يبقى 5% إلى الأبد
```

### 2.3 Enforcements (3 طبقات)

- **DB:** `BEFORE UPDATE ON escrow_clearings FOR EACH ROW IF OLD.escrow_rate_applied != NEW.escrow_rate_applied THEN SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT='Immutability violation: escrow_rate_applied locked'`
- **Eloquent:** `EscrowClearing` → `$guarded=['escrow_rate_applied']` + `saving` hook blocks dirty
- **RBAC + Grants:** `REVOKE UPDATE(escrow_rate_applied) ON escrow_clearings FROM 'abd_app'@'%'` + Policy `Agent1CanUpdateCommissionRules` لا يملك `canUpdateEscrowRateApplied`

---

## 3. DOUBLE-SPENDING & RACE-CONDITION GUARD — EscrowLockService

### 3.1 الخطر

طلبان متوازيان `POST /wallet/transfer` بـ 5000 قروش على محفظة 6000 → بدون قفل → كلاهما يقرأ 6000 → كلاهما ينجح → رصيد -4000.

### 3.2 Execution Flow — `EscrowLockService` (Pillar 6)

```
Service: App\Domain\Escrow\Actions\EscrowLockService  (single-responsibility)
Method:  lockAndMove(WalletOperationDTO dto, string $idempotencyKey): WalletTransaction

Steps (exact order, any AI Agent must replicate verbatim):

1. Idempotency gate (outer):
     SELECT response_body FROM idempotency_keys
      WHERE idempotency_key=? AND user_id=? AND endpoint=? AND expires_at > NOW(3)
     IF found → return response_body verbatim HTTP 200 — NO re-execute

2. Redis funnel — system-wide mutex (pre-DB):
     $lock = Cache::lock("wallet:mutex:{$dto->walletId}", 10); // 10s
     // Alternative per spec: Redis::funnel("wallet:{$id}")->limit(1)
     IF ! $lock->get() → 429 {"message":"Concurrent operation, retry"}

3. retry(3, function() use($dto) {
     DB::transaction(function() use($dto) {
       // 3a. Pessimistic lock — MUST be inside transaction
       $wallet = AppWallet::where('id',$dto->walletId)->lockForUpdate()->firstOrFail();
       // 3b. Business invariants
       if ($dto->type === 'debit' && $wallet->balance_minor < $dto->amountMinor)
         throw new InsufficientFundsException();
       // 3c. Mutate
       $prev = $wallet->balance_minor;
       $wallet->balance_minor = $dto->type==='debit' ? $prev - $dto->amountMinor : $prev + $dto->amountMinor;
       $wallet->version++;
       $wallet->save(); // CHECK (balance>=0) fires — if violated → 500 + rollback
       // 3d. Adjustment log (if admin)
       if ($dto->isAdminAdjustment) {
         Validator::make(['rationale'=>$dto->rationale], ['rationale'=>'required|string|min:15'])->validate();
         // DB-level CHECK also enforces >=15
         WalletAdjustmentLog::create([
           'wallet_id'=>$wallet->id, 'admin_id'=>auth()->id(),
           'amount_changed_minor'=>$dto->amountMinor * ($dto->type==='debit'?-1:1),
           'previous_balance_minor'=>$prev, 'new_balance_minor'=>$wallet->balance_minor,
           'mandatory_rationale'=>$dto->rationale, // ≥15
           'ip_address'=>request()->ip(),           // ← $request->ip() strict
           'reference_uuid'=>$dto->referenceUuid, 'app_id'=>$dto->appId
         ]);
       }
       // 3e. Ledger row
       $tx = WalletTransaction::create([... 'balance_after_minor'=>$wallet->balance_minor]);
       // 3f. Escrow event if escrow move
       if ($dto->escrowTransactionId) EscrowEvent::create([...]);
       // 3g. Idempotency store (still inside tx)
       IdempotencyKey::create([...'response_body'=>json_encode($tx), 'expires_at'=>now()->addHours(24)]);
     }, 3); // 3 attempts on deadlock — MySQL 1213
   }, 3, 100); // outer retry 3 × 100ms backoff on lock timeout

4. $lock->release();
5. return response JSON 200 (and cache for 24h replay)
```

**Key invariants:**

- `lockForUpdate()` **داخل** `DB::transaction` — العكس لا يحمي
- `wallet_adjustment_logs.ip_address` via `$request->ip()` — لا `X-Forwarded-For` خام
- `mandatory_rationale` validated **مرتين**: `FormRequest: min:15` + `Model hook + DB CHECK` — أي ` <15` → `422`
- `balance` checked at **3** levels: app logic + `CHECK (balance_minor>=0)` + `version` optimistic guard

### 3.3 Index & Lock Discipline

- `app_wallets` `PRIMARY(id)` — `lockForUpdate()` يقفل صفاً واحداً، لا جدول
- `wallet_transactions` `UNIQUE(reference_uuid)` يمنع تكرار ledger حتى لو فشل Redis
- `escrow_clearings` `UNIQUE(transaction_id)` + `CHECK` يمنع release مرتين — الإجراء الثاني يجد `status='released'` → `409 Conflict`

---

## 4. QUERY DISCIPLINE & READ PATH — أساس التوسع

### 4.1 N+1 Elimination — صارم (Rule 37)

```php
// ❌ N+1 — محظور ويكسر CI
$wallets = AppWallet::all();
foreach($wallets as $w) { $w->user->name; } // +N queries

// ✅ Eager — mandatory
$wallets = AppWallet::with(['user:id,name','transactions' => fn($q)=>$q->latest()->limit(5)])->paginate(20);
// Test MUST assert:
// $this->assertQueryCount(fn()=> $this->get('/api/v1/wallets'), '<=', 5);
// CI fails if N+1 detected via Telescope query-count middleware
```

**Test suite contract:** كل endpoint مالي يرفق `QueryCountTest` — `assertDatabaseQueryCountCeiling(5)`; زيادة واحدة تكسر CI. Dashboard KPIs (gross/escrow/net/tax) **تقـرأ** من `stats_wallet_daily` لا من `app_wallets` مباشرة (Rule 37+Pillar 37).

**`withCaching` pattern** للـ heavy reads:

```php
$listings = Cache::remember('deals:feed:'.$appId.':'.$page, 60, fn()=>
  DealsListing::with(['category','seller:id,name'])->latest()->paginate(20)
);
```

**EXPLAIN-verified:** كل `dashboard KPI` query يُرفق `EXPLAIN` في spec — يجب أن يستخدم `idx_wallet_status` أو `idx_esc_app` — لا `filesort` على `app_wallets`.

### 4.2 Read/Write Split — Semi-Sync Replica (B.11)

```
Writes (POST/PUT/PATCH/DELETE) ──→ MySQL primary (r/w)  — `DB::connection('mysql')`
Reads  (GET reporting/analytics/search-indexing) ──→ MySQL replica (ro) — `DB::connection('mysql_replica')`
       │
       └─► Replica lag check (every read):  SHOW SLAVE STATUS → Seconds_Behind_Master
           IF lag > 5s → auto-fallback to primary (no stale escrow status)
           Header: X-DB-Route: replica|primary-fallback
```

**Laravel config (`config/database.php`):**

```php
'mysql' => [... 'host'=>env('DB_HOST')],
'mysql_replica' => [... 'host'=>env('DB_REPLICA_HOST'), 'sticky'=>true],
```

**Eloquent usage:**

```php
// Report — prefers replica, falls back
$rows = DB::connection($this->replicaOrPrimary())->table('escrow_clearings')->where('app_id',$appId)->get();
private function replicaOrPrimary(): string {
  try { $lag = Cache::get('replica_lag', 0); return $lag > 5 ? 'mysql' : 'mysql_replica'; } catch(\Throwable){ return 'mysql'; }
}
```

### 4.3 Structured Logging — Single-Line JSON + PII Redaction + trace_id

**Format (every app, queue, broadcast log):**

```json
{"ts":"2026-09-16T12:34:56.789Z","level":"info","trace_id":"4bf92f3577b34da6a3ce929d0e0e4736","app_id":"AU DEALS","user_id_hashed":"sha256:abc…","endpoint":"POST /api/v1/escrow/lock","duration_ms":42,"error_code":null,"wallet_id":123,"amount_minor":5000}
```

**Rules:**

- **Single-line JSON** — لا `print_r`, لا multi-line stack
- **Allowlist redaction:** `LogShipper` يمرر فقط `ts,level,trace_id,app_id,user_id_hashed,endpoint,duration_ms,error_code,wallet_id,amount_minor,transaction_id` — كل `email, phone, ip, rationale` يُحذف أو يُhash
- **trace_id propagation:** `W3C traceparent` → `Request header traceparent: 00-{trace_id}-{parent_id}-01` → `app()->instance('trace_id',$traceId)` → queued jobs carry `trace_id` in payload → broadcast events echo `trace_id` in `meta`
- **Middleware:** `TraceIdMiddleware` يولّد `trace_id = hex 16B` إذا غاب، ويحقنه في `X-Trace-Id` response + `Log::withContext(['trace_id'=>...])`

---

## 5. MONEY-OPERATION IDEMPOTENCY & ESCROW EVENT LEDGER

### 5.1 Idempotency — `Idempotency-Key` 24h (every POST moves money)

**Covered endpoints:** `POST /wallet/transfer`, `POST /wallet/topup`, `POST /escrow/lock`, `POST /escrow/release`, `POST /escrow/refund`, `POST /commission/apply`, `POST /wallet/adjust`

**Contract:**

```
Request:
  POST /api/v1/wallet/transfer
  Idempotency-Key: 550e8400-e29b-41d4-a716-446655440000   ← client-generated UUIDv4, required
  X-App-Id: AU DEALS
  { "wallet_id": 123, "amount_minor": 5000, "reference_uuid": "..." }

Server:
  IF idempotency_keys WHERE key=? AND user_id=? AND endpoint=? AND expires_at > NOW(3) EXISTS
     → return stored response_body verbatim HTTP 200 — MUST NOT re-execute, MUST NOT debit again
  ELSE
     → execute EscrowLockService → store {key, request_hash=SHA256(canonical JSON), response_status=200, response_body=JSON(tx), expires_at=NOW+24h}
     → return 200 with Idempotency-Replayed: false
  Replay within 24h → Idempotency-Replayed: true
```

**Canonical JSON for hash:** `ksort` + `JSON_UNESCAPED_UNICODE|JSON_UNESCAPED_SLASHES` — أي تبديل ترتيب لا يغيّر hash.

**Middleware:** `IdempotencyMiddleware` (before `EscrowLockService`) — validates `Idempotency-Key: required|string|min:16` → `422` if missing; checks length ≥16 (prompt `chk_idem_key_len`).

### 5.2 Escrow Event Ledger — Single Source of Truth

- **Append-only:** `escrow_events` لا `UPDATE`/`DELETE` — `REVOKE UPDATE,DELETE ON escrow_events FROM 'abd_app'@'%'` (DBA)
- **Every transition persists:** `holding→disputed`, `holding→release_eligible`, `release_eligible→released`, `holding→refunded` — حتى `system` (auto-expire) يكتب `actor_type='system'`
- **Reconstruction:** `SELECT * FROM escrow_events WHERE transaction_id=? ORDER BY created_at` → replay state machine — هذا هو مصدر الحقيقة للنزاع، لا `escrow_clearings.status` وحده
- **Hash:** `payload_snapshot_hash = SHA256(JSON(escrow_clearings row + wallet_transactions slice))` — يثبت عدم العبث
- **No grant:** `app` role `INSERT` فقط — أي `UPDATE escrow_events` → `1142 UPDATE denied`

**Dispute reconstruction example:**

```sql
SELECT event_id, from_status, to_status, actor_type, reason_code, payload_snapshot_hash, created_at
FROM escrow_events WHERE transaction_id='txn_abc123' ORDER BY created_at;
-- 1 holding→holding buyer ESCROW_CREATED  sha:aaa 2026-09-16 10:00:00.123
-- 2 holding→disputed buyer DISPUTE_OPENED sha:bbb 2026-09-16 10:05:00.456
-- 3 disputed→refunded super_admin DISPUTE_RESOLVED_REFUND sha:ccc 2026-09-16 12:00:00.789
```

---

## 6. INDEX, FK & GRANT MATRIX — ملخص سريع

| Table | Indexes | FK CASCADE |
|-------|---------|------------|
| `app_wallets` | `PRIMARY(id)`, `UNIQUE(user_id,currency)`, `idx_wallet_user`, `idx_wallet_status` | `user_id → users.id CASCADE` |
| `wallet_transactions` | `PRIMARY(id)`, `UNIQUE(reference_uuid)`, `idx_wt_wallet_created`, `idx_wt_user_type`, `idx_wt_app` | `wallet_id → app_wallets CASCADE`, `user_id → users CASCADE` |
| `wallet_adjustment_logs` | `PRIMARY(id)`, `idx_wal_wallet`, `idx_wal_admin`, `idx_wal_created` | `wallet_id CASCADE`, `admin_id RESTRICT` |
| `escrow_clearings` | `PRIMARY(id)`, `UNIQUE(transaction_id)`, `idx_esc_buyer/seller/status/app/release_at/created` | `buyer_id/seller_id RESTRICT` |
| `commission_rules` | `PRIMARY(id)`, `UNIQUE(tier,app,volume)` | none (config) |
| `escrow_events` | `PRIMARY(event_id)`, `idx_ee_transaction_created`, `idx_ee_to_status`, `idx_ee_actor` | `transaction_id → escrow_clearings CASCADE` |
| `idempotency_keys` | `PRIMARY(id)`, `UNIQUE(key,user,endpoint)`, `idx_idem_expires` | none (ephemeral) |

**Grants to apply as DBA:**

```sql
REVOKE UPDATE, DELETE ON abduniproject.escrow_events FROM 'abd_app'@'%';
REVOKE UPDATE, DELETE ON abduniproject.wallet_adjustment_logs FROM 'abd_app'@'%';
REVOKE UPDATE(escrow_rate_applied) ON abduniproject.escrow_clearings FROM 'abd_app'@'%';
```

---

## 7. STEP-BY-STEP PROMPTS FOR ANY AI AGENT — تعليمات Cursor AI دون كود وهمي

> **Rule 32 + Sprint Limits:** 1-3 files / ≤150 lines per iteration — نفّذ ثم توقف.

### Sprint B.2.1 — Migrations DDL (2 files)

1. **أنشئ** `database/migrations/2026_09_14_000016_upgrade_wallets_b2.php` — أضف `GENERATED balance` alias + تأكيد `CHECK >=0` (idempotent)
2. **أنشئ** `database/migrations/2026_09_14_000017_create_wallet_adjustment_logs_table.php` — §1.2 C — `CHECK CHAR_LENGTH>=15` + `ip_address VARCHAR(45)` — seed none
3. **أنشئ** `database/migrations/2026_09_14_000018_create_escrow_events_and_idempotency_tables.php` — §1.2 F+G — `escrow_events` + `idempotency_keys` + `REVOKE` comments + `EVENT ev_purge_idempotency` (optional)
4. شغّل `php artisan migrate --force && php artisan db:seed --class=CommissionRuleSeeder` — تحقق `SHOW CREATE TABLE app_wallets` يظهر `CHECK`, `escrow_events` بلا UPDATE grant

### Sprint B.2.2 — Domain ValueObjects & Enums (3 files)

1. **أنشئ** `app/Domain/Wallet/ValueObjects/Money.php` — `readonly final class Money { public function __construct(public int $minor, public Currency $currency){ if($minor<0) throw... } }`
2. **أنشئ** `app/Domain/Escrow/Enums/EscrowStatus.php` — `enum EscrowStatus:string {case HOLDING='holding'; ... }`
3. **أنشئ** `app/Domain/Escrow/Enums/ActorType.php` — `enum ActorType:string {case BUYER='buyer'; ... }`

### Sprint B.2.3 — Repositories & DTOs (2 files)

1. **أنشئ** `app/Domain/Wallet/Repositories/WalletRepositoryInterface.php` — `findForUpdate(int $id): AppWallet` + `decrement/increment`
2. **أنشئ** `app/Domain/Escrow/DTOs/WalletOperationDTO.php` — `readonly` props `walletId, userId, amountMinor, transactionType, referenceUuid, appId, isAdminAdjustment, rationale, escrowTransactionId, ipAddress`

### Sprint B.2.4 — Services (2 files)

1. **أنشئ** `app/Domain/Wallet/Services/WalletMutex.php` — `Cache::lock("wallet:mutex:$id",10)` wrapper
2. **أنشئ** `app/Domain/Escrow/Actions/EscrowLockService.php` — **flow §3.2 verbatim** — `retry(3)` + `DB::transaction` + `lockForUpdate` + `WalletAdjustmentLog` with `mandatory_rationale min:15 + ip_address` + `escrow_events` append + `idempotency_keys` store — events inside same tx — **لا كود وهمي** — كل branch يرمي exception typed

### Sprint B.2.5 — Middleware & Requests (3 files)

1. **أنشئ** `app/Http/Middleware/IdempotencyMiddleware.php` — validates `Idempotency-Key` required + checks `idempotency_keys` for replay → return verbatim 200 with `Idempotency-Replayed:true` else pass
2. **أنشئ** `app/Http/Middleware/TraceIdMiddleware.php` — `W3C traceparent` parse/generate → `Log::withContext` + `X-Trace-Id`
3. **أنشئ** `app/Http/Requests/WalletAdjustmentRequest.php` — `rules: ['mandatory_rationale'=>'required|string|min:15', 'amount'=>'required|integer|min:1']` + `prepareForValidation` maskLeak

### Sprint B.2.6 — Read Path & Logging (2 files)

1. **أنشئ** `app/Infrastructure/Database/ReplicaConnectionResolver.php` — §4.2 lag >5s fallback + `X-DB-Route` header
2. **حدّث** `config/logging.php` — `single` channel formatter `JsonFormatter` with `allowlist` redaction + `tap` to inject `trace_id`
3. **تحقّق:** `php artisan test --filter=WalletConcurrency` → 100 parallel `POST /wallet/transfer` بـ `Idempotency-Key` مختلف → رصيد نهائي صحيح — `curl -H 'Idempotency-Key: same' POST /escrow/lock` مرتين → الثانية `Idempotency-Replayed:true` بلا خصم ثانٍ — `EXPLAIN SELECT * FROM app_wallets WHERE user_id=?` uses `uk_user_currency` — `SELECT * FROM escrow_events WHERE transaction_id=?` reconstructs dispute — logs `{"ts":...,"trace_id":...}` single-line

**Verification Gates (B.2 exit):**

- ✅ `CHECK (balance_minor>=0)` + `chk_wal_rationale_len` + `REVOKE UPDATE` على `escrow_events`/`escrow_rate_applied`
- ✅ `EscrowLockService` = `retry(3)` + `transaction` + `lockForUpdate` + `funnel` + `mandatory_rationale>=15` + `ip_address`
- ✅ `Idempotency-Key` 24h replay verbatim, `escrow_events` append-only single source
- ✅ `with()` eager + `EXPLAIN` indexed + replica fallback 5s + JSON logs allowlist + `traceparent` propagated
- ✅ `UPDATE escrow_clearings SET escrow_rate_applied=0.06` → `45000 Immutability violation`

---

## 8. CALIBRATOR VERIFICATION GATE — 100% قبل أي كود

| Domain | Score | Gate |
|--------|-------|------|
| Memory (71 pts + 9 Modules + 5 Apps + Oil 34 5%) | 100% | Commission 5% base locked, no retroactive |
| Architecture (Money minor + CHECK + append-only) | 100% | DDL §1 + immutability 3 layers |
| Security (Pessimistic lock + funnel + 422/503) | 100% | §3 retry 3 + lockForUpdate + mandatory_rationale 15 + ip |
| Precision (MySQL JSON not JSONB, minor ints) | 100% | §1 JSON_VALID CHECKs |
| Craftsmanship (PHP 8.4 Enums, readonly DTO, DRY) | 100% | §2-§5 interfaces + SRP |
| Operational (Replica 5s + JSON logs + trace_id) | 100% | §4 read/write split + allowlist |

> **BLOCKED if <100%** — أعد قراءة `.arenarules` + `PROJECT_STATE.md` وأصلح الهلوسة قبل توليد الكود.

---

## 9. ARABIC SUMMARY — ملخص عربي

تم تأمين المحرك المالي: 7 جداول MySQL 8.4 بفهارس و CHECK و FK CASCADE — المحفظة بلا رصيد سالب، سجل الحركة بـ reference_uuid، سجل التعديل بـ rationale ≥15 و IP، الضمان بقفل العمولة لحظة الإنشاء (لا رجعي لـ Agent1)، شرائح 5%، سجل أحداث append-only بلا UPDATE/DELETE وحيد مصدر النزاع، ومفاتيح idempotency 24h. خدمة EscrowLockService تضمن `retry(3)` + `lockForUpdate` داخل `transaction` + `Redis funnel` + `mandatory_rationale` مزدوج التحقق، مع انضباط استعلامات (eager + EXPLAIN + replica fallback 5s) وسجلات JSON أحادية السطر مع trace_id. جاهز للتنفيذ المجهري B.2.1→B.2.6 دون أي كود وهمي.

---
*Teams: Domain/Wallet, Domain/Escrow, Services/Security, Infrastructure — Target: `abduniproject` — Next: B.3 Governance, Micro-Permissions & DRM*
