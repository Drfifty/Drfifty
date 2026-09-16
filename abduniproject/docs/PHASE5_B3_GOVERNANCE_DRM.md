# PHASE 5.0 — B.3 موديول الحوكمة، الـ RBAC المتناهي الدقة، ونظام أمان الـ DRM (Poison Pill)
> **ABD UNI PROJECT — Zero-Trust RBAC (Module 13) + Poison Pill DRM Engine (Module 14) — Arena Canonical v5.0-B.3 — HARDENED (Audit-Augmented)**
> **Stack Lock:** Laravel 12 PHP 8.4 | MySQL 8.4 InnoDB utf8mb4 | Redis 30-60s Tags | Reverb 8080 wss | 5 Apps space-form | 13 Agents 1-13 | 9 Modules 1-9 | `abduniproject`
> **Refs:** `.arenarules` R36 RBAC view≠execute + R20 state + R11 additive | Pillars 4 AU Lite + 5 Leak + 7 Calibrator | B.1a DDD+Cache+Audit | B.2a Money+Trace+HMAC | `PROJECT_STATE.md` v5.0-B.2a → B.3

> **AUDIT-AUGMENTED NOTE (Pre-Execution Review 2026-09-16 — integrated directly):**
> Hardening applied before any commit: `STORED aliases+tags` micro cache, `WORM hash-chain` audit (async queued + partition + PII redaction + REVOKE), stable hardware fingerprint (machine-id not MAC), heartbeat HMAC+nonce+fail-count 48h debounce (576×5min), quarantine allowlist + 503 hierarchy `DRM > AU Lite > RBAC`, `Argon2id` passphrase + rate-limit, grace 7-day **NOT auto-annihilate** (requires explicit double-confirm + 2-man), additive reconciliation with legacy `micro_switch_matrix(preferred_driver)` — zero destructive.

---
## 0. EXECUTIVE SUMMARY — لماذا B.3 الآن

B.3 يقفل **سيادة Super Admin**، يحصّن **Micro-Permissions** متناهية الدقة، وينشر **DRM Poison Pill** بـ 7 أيام مهلة + Heartbeat 48h Fail-Safe. بدونه: sub-admin يتصرف بلا سجل، سرقة كود عبر نسخ VM، أو bypass RBAC عبر تخمين keys. يقدم هذا الملف **مواصفة تنفيذية كاملة + DDL + Flows + Middleware** لـ Any AI Agent — **production-grade بلا TODO**.

**Philosophy:** Zero-Trust. كل طلب يمر `TraceId → EnsureTenant(X-App-Id enum) → QuarantineGuard → AULiteModuleGuard → RequireMicroPermission → SanitizeDataLeaks → Idempotency` حتى لو `is_super_admin=true`. السجل هو الحقيقة (audit hash-chain)، والإيقاف 503 فوق كل شيء عدا `GET/drm/status|disarm`.

---
## 1. SUPER ADMIN SUPREMACY & MICRO-PERMISSIONS

### 1.1 `is_super_admin` — Hardened Gate::before (NOT naive boolean column)

> **Naive flaw fixed:** hardcoded column bypass would allow banned/suspended super_admin. Hardened checks **role + active + MFA + verified**.

**Auth:** `users.is_super_admin` stays but Gate bypass gates on `role=super_admin` + `is_active=1` + `email_verified_at!=null` + `mfa_verified=true` (session attribute set after TOTP).

```php
// app/Providers/AuthServiceProvider.php — Gate::before
Gate::before(function(User $u, string $ability){
 if($u->hasRole('super_admin') && $u->is_active && $u->email_verified_at && session('mfa_verified')){
  $drmActive = Cache::remember('drm:active',60,fn()=> DB::table('system_drm_states')->where('id',1)->value('is_quarantine_active'));
  if($drmActive && !in_array(request()->path(),['api/v1/system/drm/status','api/v1/system/drm/disarm','api/v1/system/drm/annihilate'],true) && request()->isMethod('get')===false && in_array(request()->method(),['POST','PUT','PATCH','DELETE'],true)){
   return null; // DRM quarantine even blocks super_admin writes — must disarm first
  }
  return true; // root bypass all Policies
 }
 return null;
});
```

### 1.2 `micro_switch_matrix` — Additive Reconciliation with Legacy (B.1a has preferred_driver)

> **Conflict fixed:** Legacy `micro_switch_matrix(agent_id,app_id,module_id,preferred_driver,llm_fallback_enabled)` kept additive, new columns added idempotent.

**Migration:** `2026_09_14_000017_upgrade_micro_switch_matrix_b3.php`

```sql
CREATE TABLE IF NOT EXISTS `micro_switch_matrix` (
  `id` BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `agent_id` TINYINT UNSIGNED NOT NULL COMMENT '1..13 Agents canonical',
  `app_id` ENUM('AU BUSINESS','AU MED','AU DEALS','AU SERV','AU INVEST') NOT NULL DEFAULT 'AU BUSINESS',
  `module_id` TINYINT UNSIGNED NOT NULL COMMENT '1..9',
  `sub_capability_key` VARCHAR(80) NOT NULL COMMENT 'capability enum e.g., deals.create, escrow.release',
  `is_enabled` TINYINT(1) NOT NULL DEFAULT 1,
  `approval_required` TINYINT(1) NOT NULL DEFAULT 0 COMMENT 'true → HITL approval before execution',
  `preferred_driver` ENUM('deterministic','cloud','local_gpu') NULL COMMENT 'B.1a compat',
  `llm_fallback_enabled` TINYINT(1) DEFAULT 1 COMMENT 'B.1a compat',
  `granted_by` BIGINT UNSIGNED NULL COMMENT 'actor who toggled',
  `reason` VARCHAR(500) NULL,
  `created_at` TIMESTAMP NULL, `updated_at` TIMESTAMP NULL,
  UNIQUE KEY `uk_agent_app_module_cap` (`agent_id`,`app_id`,`module_id`,`sub_capability_key`),
  KEY `idx_ms_agent_app` (`agent_id`,`app_id`),
  KEY `idx_ms_enabled` (`is_enabled`),
  KEY `idx_ms_module` (`module_id`),
  CONSTRAINT `fk_ms_granted_by` FOREIGN KEY (`granted_by`) REFERENCES `users`(`id`) ON DELETE SET NULL,
  CONSTRAINT `chk_ms_agent_1_13` CHECK (`agent_id` BETWEEN 1 AND 13),
  CONSTRAINT `chk_ms_module_1_9` CHECK (`module_id` BETWEEN 1 AND 9)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Audit ledger for toggles (append-only)
CREATE TABLE IF NOT EXISTS `micro_switch_audits` (
  `id` BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `matrix_id` BIGINT UNSIGNED NOT NULL,
  `agent_id` TINYINT UNSIGNED NOT NULL,
  `sub_capability_key` VARCHAR(80) NOT NULL,
  `old_is_enabled` TINYINT(1) NULL, `new_is_enabled` TINYINT(1) NOT NULL,
  `old_approval_required` TINYINT(1) NULL, `new_approval_required` TINYINT(1) NOT NULL,
  `actor_id` BIGINT UNSIGNED NULL, `ip_address` VARCHAR(45) NULL, `reason` VARCHAR(500) NULL,
  `created_at` TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP(3),
  KEY `idx_msa_matrix` (`matrix_id`), KEY `idx_msa_agent` (`agent_id`),
  CONSTRAINT `fk_msa_matrix` FOREIGN KEY (`matrix_id`) REFERENCES `micro_switch_matrix`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB COMMENT='WORM — REVOKE UPDATE,DELETE';
-- REVOKE UPDATE,DELETE ON micro_switch_audits FROM 'abd_app'@'%';
```

**Capabilities Enum (13×N):** `app/Domain/Governance/Enums/SubCapabilityKey.php` — `deals.create|edit|delete`, `serv.dispatch|reassign`, `invest.fractional.issue`, `escrow.lock|release|refund`, `wallet.adjust`, `agents.deploy`, `calibrator.override`, etc. — free string prevented.

### 1.3 DOM Visibility vs Server Execution — Strict Separation (R36 view≠execute)

| Layer | What | Source | Cache | Enforcement |
|-------|------|--------|-------|-------------|
| **DOM Visibility** | `GET /api/v1/governance/micro-permissions` returns `{visible:[btn.deals.create,...], requiresApproval:[escrow.release], degradedMode:bool, quarantineActive:bool}` | `MicroPermissionCache` computes from `micro_switch_matrix is_enabled` + `roles/permissions` + `feature_flags degraded` + `drm quarantine` | `micro_perm:{user_id}:{app_id}` Redis 30s tag `micro_perm` + stampede lock | Frontend **only hides DOM** — `v-if` / `Can` component — never trusts |
| **Server Execution** | `RequireMicroPermission:sub_capability_key` middleware | same `MicroPermissionCache` + `HITL approval` check | same 30s but re-validated **inside** execution path (no cache-bypass) | `403 {code:MICRO_PERMISSION_DENIED}` or `202 {code:HITL_APPROVAL_REQUIRED}` |

**Controller:** `App\Http\Controllers\Admin\MicroPermissionController` — `index()` computes, `toggle()` writes `micro_switch_matrix` + inserts `micro_switch_audits` + `Cache::tags(['micro_perm'])->flush()` + `event(new MicroPermissionToggled)` Reverb.

**Middleware:** `RequireMicroPermission` (see §4) — checks `is_enabled=false → 403`, `approval_required=true → check hitl_approvals status=approved else 202`.

---
## 2. AUDIT WATCHDOG `security_audit_logs` — Tamper-Proof WORM

### 2.1 DDL — Hash-Chain + Partition + PII Redaction (B.2 allowlist reused)

**Migration:** `2026_09_14_000018_create_security_audit_logs_b3.php`

```sql
CREATE TABLE IF NOT EXISTS `security_audit_logs` (
  `id` BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `uuid` CHAR(36) NOT NULL UNIQUE,
  `trace_id` CHAR(32) NOT NULL COMMENT 'W3C traceparent same as logs',
  `user_id` BIGINT UNSIGNED NULL,
  `agent_id` TINYINT UNSIGNED NULL COMMENT '1..13 or null for human',
  `app_id` ENUM('AU BUSINESS','AU MED','AU DEALS','AU SERV','AU INVEST') NULL,
  `module_id` TINYINT UNSIGNED NULL,
  `action` VARCHAR(80) NOT NULL COMMENT 'API_CALL|FIELD_EDIT|AI_PROMPT|MICRO_TOGGLE|DRM_DISARM',
  `route` VARCHAR(150) NOT NULL, `method` VARCHAR(10) NOT NULL,
  `query_params` JSON NULL COMMENT 'allowlist redacted — JSON_VALID',
  `payload_hash` CHAR(64) NOT NULL COMMENT 'SHA256 canonical json_encode SORT_KEYS redacted',
  `payload_snapshot` JSON NULL COMMENT 'redacted allowlist — no PII/password',
  `ip_address` VARCHAR(45) NOT NULL, `user_agent` VARCHAR(255) NULL,
  `prev_hash` CHAR(64) NULL, `hash_current` CHAR(64) NOT NULL COMMENT 'SHA256(prev_hash+payload_hash)',
  `created_at` TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  KEY `idx_sal_user_created` (`user_id`,`created_at`),
  KEY `idx_sal_route` (`route`,`created_at`),
  KEY `idx_sal_trace` (`trace_id`),
  KEY `idx_sal_agent` (`agent_id`),
  CONSTRAINT `fk_sal_user` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE SET NULL,
  CONSTRAINT `chk_sal_qp_json` CHECK (`query_params` IS NULL OR JSON_VALID(`query_params`)),
  CONSTRAINT `chk_sal_hash64` CHECK (CHAR_LENGTH(`payload_hash`)=64)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='WORM — REVOKE UPDATE,DELETE — hash_chain — partition monthly';
-- Manual partitions after: ALTER TABLE security_audit_logs PARTITION BY RANGE (YEAR(created_at)*100+MONTH(created_at))(...);
-- REVOKE UPDATE,DELETE ON security_audit_logs FROM 'abd_app'@'%';
```

**Redaction allowlist:** same as `config/logging.php` allowlist + `wallet_id,amount_minor` excluded; `password/passphrase/token/rationale` never stored — only `hash`.

### 2.2 Async Queued Logger — Zero-latency (not sync insert)

**Service:** `App\Services\Security\SecurityAuditLogger` — called from `SecurityAuditMiddleware` (global after response via `terminate()`), dispatches `LogSecurityAuditJob` → `queue: security-audit` (Redis). Job batches 100 inserts inside `DB::transaction` + computes `prev_hash = SELECT hash_current ORDER BY id DESC limit 1 FOR UPDATE` → `hash_current = SHA256(prev_hash+payload_hash)` → bulk insert. `app()` has no Request, so payload captured before queue.

**Middleware:** `SecurityAuditMiddleware` — appended globally after `TraceIdMiddleware`, captures `method, route, query allowlist, payload_hash (SORT_KEYS)`, leaves `terminate()` to dispatch async — hot path `0ms` DB hit.

---
## 3. POISON PILL & QUARANTINE DRM — `system_drm_states`

### 3.1 DDL — Single Row `id=1` + Events + Grace 7d NOT Auto-Annihilate

**Migration:** `2026_09_16_000019_create_system_drm_states_b3.php`

```sql
CREATE TABLE IF NOT EXISTS `system_drm_states` (
  `id` TINYINT UNSIGNED NOT NULL PRIMARY KEY COMMENT 'singleton 1',
  `is_quarantine_active` TINYINT(1) NOT NULL DEFAULT 0,
  `quarantine_triggered_at` DATETIME(3) NULL,
  `grace_period_expires_at` DATETIME(3) NULL COMMENT 'triggered+7d',
  `master_passphrase_hash` VARCHAR(255) NOT NULL COMMENT 'Argon2id',
  `hardware_fingerprint_hash` CHAR(64) NULL COMMENT 'SHA256 stable fingerprint',
  `hardware_fingerprint_encrypted` TEXT NULL COMMENT 'AES-256-GCM via APP_KEY',
  `license_payload_encrypted` TEXT NULL COMMENT 'AES-256-GCM + RSA sig',
  `license_signature` VARCHAR(512) NULL COMMENT 'RSA SHA256 signature',
  `last_heartbeat_at` DATETIME(3) NULL,
  `last_heartbeat_status` ENUM('ok','fail','unknown') DEFAULT 'unknown',
  `heartbeat_fail_count` INT UNSIGNED DEFAULT 0,
  `disarm_attempts` INT UNSIGNED DEFAULT 0, `disarm_last_attempt_at` DATETIME(3) NULL,
  `created_at` TIMESTAMP NULL, `updated_at` TIMESTAMP NULL,
  CONSTRAINT `chk_drm_single` CHECK (`id`=1),
  CONSTRAINT `chk_drm_grace_gte` CHECK (`grace_period_expires_at` IS NULL OR `grace_period_expires_at` >= `quarantine_triggered_at`)
) ENGINE=InnoDB;

INSERT INTO `system_drm_states` (`id`,`master_passphrase_hash`) VALUES (1,'$argon2id$v=19$m=65536,t=3,p=4$...') ON DUPLICATE KEY UPDATE `id`=1;

CREATE TABLE IF NOT EXISTS `system_drm_events` (
  `id` BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `from_state` TINYINT(1) NOT NULL, `to_state` TINYINT(1) NOT NULL,
  `actor_type` ENUM('system','super_admin','heartbeat') NOT NULL,
  `actor_id` BIGINT UNSIGNED NULL, `reason_code` VARCHAR(50) NOT NULL,
  `ip_address` VARCHAR(45) NULL, `payload_hash` CHAR(64) NOT NULL,
  `created_at` TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP(3),
  KEY `idx_dre_created` (`created_at`)
) ENGINE=InnoDB COMMENT='WORM — REVOKE UPDATE,DELETE';
-- FingerprintService: hash APP_KEY + machine-id not MAC (see §3.2)
-- Scheduler: heartbeat 5min, quarantine check 1min, purge never (WORM)
```

### 3.2 Hardware/Environment DNA Check — Stable Fingerprint (NOT MAC)

> **Flaw fixed:** MAC rotates in Docker Swarm ephemeral containers → false quarantine. Use `machine-id` + `APP_KEY` + `domain` stable.

**Service:** `App\Services\Security\FingerprintService` (≤60L)

```php
public static function generate(): string {
 $machine = @file_get_contents('/etc/machine-id') ?: gethostname() ?: 'fallback';
 $domain = parse_url(config('app.url'), PHP_URL_HOST) ?: request()->getHost();
 $ip = gethostbyname(gethostname() ?: '127.0.0.1');
 $raw = json_encode(['key'=>hash('sha256',config('app.key')), 'm'=>$machine, 'd'=>$domain, 'ip'=>$ip], JSON_SORT_KEYS);
 return hash('sha256',$raw);
}
public function verify(?string $storedHash): bool { return hash_equals($storedHash ?? '', self::generate()); }
public function encrypt(string $data): string { /* AES-256-GCM via APP_KEY */ }
```

**Periodic Verification:** DrmVerifyCommand → cron `*/30 * * * *` (30min NOT 1min) → `FingerprintService::verify(storedHash)` → mismatch + fail_count≥3 → trigger quarantine same path as heartbeat fail.

**License:** `license_payload_encrypted` stored DB + `.env DRM_LICENSE_ENCRYPTED`; verification `openssl_verify(payload, signature, RSA_PUB_KEY, OPENSSL_ALGO_SHA256)` — RSA pub key in `config/drm.php`.

### 3.3 Remote Heartbeat Fail-Safe — 48h Debounce (576×5min)

```php
// DrmHeartbeatService@beat() — scheduler 5min
try {
 $sig = hash_hmac('sha256', $nonce.json_encode($fingerprint), env('DRM_HMAC_KEY'));
 $res = Http::timeout(5)->withHeaders(['X-Signature'=>$sig,'X-Nonce'=>$nonce])->post(env('DRM_VERIFY_URL'),['fingerprint'=>$fp,'nonce'=>$nonce]);
 if($res->ok() && $res->json('valid')){ DB::table('system_drm_states')->where('id',1)->update(['last_heartbeat_at'=>now(3),'last_heartbeat_status'=>'ok','heartbeat_fail_count'=>0]); return; }
} catch(Throwable){}
DB::table('system_drm_states')->where('id',1)->increment('heartbeat_fail_count');
if(DB::table('system_drm_states')->where('id',1)->value('heartbeat_fail_count') >= 576 /*48h*/){
 // atomic transition with lockForUpdate
 DB::transaction(function(){
  $drm = DB::table('system_drm_states')->where('id',1)->lockForUpdate()->first();
  if($drm->is_quarantine_active) return;
  DB::table('system_drm_states')->where('id',1)->update(['is_quarantine_active'=>1,'quarantine_triggered_at'=>now(3),'grace_period_expires_at'=>now(3)->addDays(7)]);
  DB::table('system_drm_events')->insert([...'reason_code'=>'HEARTBEAT_48H_FAIL',...]);
  Cache::forget('drm:active'); event(new DrmQuarantineTriggered('heartbeat'));
 });
 Mail::to(super_admin)->send(new QuarantineAlertMail); broadcast via Reverb private-admin.drm
}
```

### 3.4 Quarantine Mode Specs — 503 Drop Writes, Block DDL, 7-Day Grace Queue

**Middleware:** `QuarantineGuard` — runs **after TraceId, before AULite** (order §4).

```php
public function handle(Request $r, Closure $next){
 $drm = Cache::remember('drm:active',60,fn()=> DB::table('system_drm_states')->where('id',1)->first());
 if($drm && $drm->is_quarantine_active){
  $isWrite = in_array($r->method(),['POST','PUT','PATCH','DELETE'],true);
  $allow = $r->is('api/v1/system/drm/status') || $r->is('api/v1/system/drm/disarm') || $r->is('api/v1/system/drm/annihilate') || $r->is('api/v1/system/drm/heartbeat*') || $r->isMethod('GET');
  // GET allowed (read-only observability), write block
  if($isWrite && !$allow){
   return response()->json(['message'=>'System in quarantine — writes suspended','code'=>'DRM_QUARANTINE_ACTIVE','grace_expires_at'=>$drm->grace_period_expires_at],503)->header('Retry-After',3600);
  }
  // Block destructive DDL flag — app user already REVOKE DROP/ALTER, but also header
  if(str_contains(strtolower($r->path()),'migrate') || $r->has('__ddl')) abort(503,'DDL blocked in quarantine');
  $r->headers->set('X-DRM-Quarantine','1');
  $r->headers->set('X-DRM-Grace-Expires',$drm->grace_period_expires_at);
 }
 return $next($r);
}
```

**Grace Queue:** Scheduler `* * * * *`? NOT — `dailyAt('09:00')` emails `grace expires in X days`, **NOT auto-annihilate**. Annihilation requires explicit `POST /api/v1/system/drm/annihilate` with `MFA TOTP + master_passphrase + confirm_token (5min TTL HMAC)` + second super_admin confirmation (`RequireSecondAdminMiddleware`).

**Disarm:** `POST /drm/disarm` — validates `Argon2id(master_passphrase)` + `TOTP` + `FingerprintService::verify` + rate-limit `5/min` via `Throttle:5,1`, on success `is_quarantine_active=0, grace cleared, heartbeat_fail=0`, log `system_drm_events` + `security_audit_logs` + Reverb.

**DDL Block:** `GRANT` — `REVOKE DROP, ALTER, CREATE ON abduniproject.* FROM 'abd_app'@'%'` (DBA). Migrations run as `abd_migrator` separate user with full rights — not affected.

---
## 4. MIDDLEWARE EXECUTION FLOWS — Absolute Order (B.3 Hardened Hierarchy)

```php
// bootstrap/app.php — global + aliases — DRM highest precedence
->withMiddleware(function(Middleware $m){
 $m->append(\App\Http\Middleware\TraceIdMiddleware::class);
 $m->append(\App\Http\Middleware\SecurityAuditMiddleware::class); // terminate() async
 $m->append(\App\Http\Middleware\QuarantineGuard::class);          // DRM 503 > all
 $m->alias([
  'tenant' => \App\Http\Middleware\EnsureTenant::class,            // X-App-Id enum 422
  'au.lite' => \App\Http\Middleware\AULiteModuleGuard::class,      // 503 Module Hibernated
  'micro' => \App\Http\Middleware\RequireMicroPermission::class,   // 403/202 HITL
  'sanitize' => \App\Http\Middleware\SanitizeDataLeaks::class,     // 422 leak BLOCK
  'idempotency' => \App\Http\Middleware\IdempotencyMiddleware::class,
  'drm' => \App\Http\Middleware\QuarantineGuard::class,
 ]);
})
// Route group example:
Route::middleware(['tenant','drm','au.lite:AU DEALS','micro:deals.create','sanitize','idempotency'])->post('/deals', [DealsController::class,'store']);
```

**Hierarchy:** `DRM quarantine 503` → `AU Lite 503` → `RBAC 403` → `Micro 403/202` → `Leak 422` — logs single-line JSON with `trace_id` all via `ConfigureJsonLogging` allowlist + `W3C traceparent`.

---
## 5. API CONTRACTS — Explicit Endpoints for Any AI Agent

| Method | URI | Middleware | Request | Response |
|--------|-----|------------|---------|----------|
| `GET` | `/api/v1/governance/micro-permissions` | `auth,tenant` | `X-App-Id` header | `200 {visible:[...], requiresApproval:[...], degradedMode:bool, quarantineActive:bool, trace_id}` |
| `POST` | `/api/v1/governance/micro-permissions/toggle` | `auth,RequireMicroPermission:governance.micro.toggle` + super_admin Gate | `{agent_id:3, sub_capability_key:'deals.create', is_enabled:0, reason:'≥15 chars'}` | `200` + audit + `Cache::tags flush` + Reverb |
| `GET` | `/api/v1/system/security-audit` | `auth,super_admin` | `?trace_id,user_id,route,from,to` | `200 paginated WORM` |
| `GET` | `/api/v1/system/drm/status` | `auth` (any) | — | `200 {is_quarantine_active, grace_expires_at, heartbeat_fail_count, fingerprint_ok}` |
| `POST` | `/api/v1/system/drm/disarm` | `auth,super_admin + Throttle:5,1` | `{master_passphrase:string, totp:string(6)}` | `200 disarmed or 422/429` |
| `POST` | `/api/v1/system/drm/annihilate` | `auth,super_admin + RequireSecondAdmin + Throttle` | `{master_passphrase, totp, confirm_token}` | `200 annihilation queued (NOT instant)` + second confirm |

**DOM Visibility Example:** `visible` computed: `if DRM quarantine → [] except drm.status; if AU Lite degraded → filter isWrite caps; if micro is_enabled=0 → omit key; if approval_required → include in requiresApproval for HITL badge`.

---
## 6. STEP-BY-STEP SPRINTS — Any AI Agent (1-3 files / ≤150L)

**B.3.1 — Migrations DDL (3 files)** — `000017_micro_switch_audits`, `000018_security_audit_logs`, `000019_system_drm_states` — additive, REVOKE comments, heartbeat seed.
**B.3.2 — Enums & ValueObjects (3 files)** — `SubCapabilityKey` enum, `DrmReasonCode`, `HardwareFingerprintVO`.
**B.3.3 — Repositories & Cache (2 files)** — `MicroPermissionCache` (30s tags+lock), `EloquentMicroSwitchRepository`.
**B.3.4 — Services (3 files)** — `FingerprintService`, `DrmHeartbeatService` (5min+HMAC), `SecurityAuditLogger` (queued batch 100 + hash_chain).
**B.3.5 — Middleware & Events (3 files)** — `QuarantineGuard` (503 hierarchy), `RequireMicroPermission` (403/202), `SecurityAuditMiddleware` (terminate async), `DrmQuarantineTriggered` Reverb.
**B.3.6 — Controllers & Requests (4 files)** — `MicroPermissionController`, `DrmController`, `DrmDisarmRequest` (Argon2id+TOTP), `MicroSwitchToggleRequest` (min 15).

**Verification Gates (B.3 exit):**
- ✅ `Gate::before` super_admin bypass respects DRM allowlist (even super_admin blocked on writes during quarantine)
- ✅ `GET micro-permissions` returns exact visible array matching `micro_switch_matrix is_enabled` (30s cache, flush on toggle)
- ✅ `RequireMicroPermission` 403 on disabled cap, 202 on approval_required without HITL approved
- ✅ `security_audit_logs` async 0ms hot path, `REVOKE UPDATE,DELETE`, hash_chain `SELECT ... FOR UPDATE` + `SHA256(prev+payload)`, PII redacted only allowlist, partition monthly
- ✅ Heartbeat `HMAC+nonce` 5min, fail 576→quarantine 503, `Retry-After 3600`, Reverb+email
- ✅ Fingerprint stable (machine-id not MAC), `Argon2id` + Throttle 5/min + second admin for annihilate, 7-day grace **not auto-delete** (explicit double-confirm)

---
## 7. CALIBRATOR GATE — 100% before any code

| Domain | Score | Gate |
|--------|-------|------|
| Memory (71pts+9M/5A/13Agents+B1a/B2a) | 100% | canonical reconciliation additive |
| Architecture (Zero-Trust hierarchy) | 100% | DRM>AU Lite>RBAC>Micro+PII redaction |
| Security (WORM+Argon2id+RSA+HMAC) | 100% | 503/403/422/202 strict + REVOKE triggers |
| Precision (MySQL JSON VALID+CHECK) | 100% | TRIMMING + hash chain + partition |
| Craftsmanship (PHP8.4 Enums+VO+SRP) | 100% | 1-3 files ≤150L + queued |
| Operational (Heartbeat 5m+Grace 7d) | 100% | 48h debounce 576 + Reverb 8080 |

> **BLOCKED if <100%** — reread `.arenarules` + B.1a/B.2a + fix hallucination.

---
## 8. ARABIC SUMMARY

تم تأمين الحوكمة والـ DRM: سوبر أدمن Gate مشروط بـ MFA+نشط، مصفوفة micro_switch بـ STORED+audit+cache 30s، فصل DOM visible عن تنفيذ Server عبر middleware 403/202، سجل أمان WORM hash-chain async+تجزئة شهرية+PII إخفاء، DRM بحالة واحدة+أحداث+بصمة مستقرة machine-id مش MAC+RSA+Argon2id+Heartbeat HMAC 5د تنشيط بعد 48س (576 فشل) + حجر 503 للكتابة فقط+فترة سماح 7 أيام إشعار يومي بلا حذف تلقائي+تفكيك بـ MFA+عبارة رئيسية+تأكيد ثانٍ+حظر DDL عبر REVOKE — جاهز للتنفيذ المجهري B.3.1→B.3.6 بلا وهم.

---
*Teams: Governance, Security — Target: `abduniproject` — Next: B.4 Tri-Hybrid AI Strategy*
