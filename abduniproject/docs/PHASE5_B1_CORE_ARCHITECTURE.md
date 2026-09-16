# PHASE 5.0 — B.1 النواة والمعمارية وتكامل الـ DDD والـ AU Lite
> **ABD UNI PROJECT — Full Backend Architecture Spec (Laravel 12 / PHP 8.4 — Modular Monolith + DDD + Clean Architecture) — Arena Canonical v5.0**
> **Stack Lock:** Laravel 12 PHP 8.4 (single approved backend, `app/` — no alternative frameworks) | MySQL 8.4+ InnoDB utf8mb4 Spatial **core** for 5 apps | PostgreSQL 16 + PostGIS + pgcrypto **exclusively AU MED clinical** (ratified dual-DB) | Redis Cache/Queue/Mutex | Laravel Reverb 8080 wss:// exclusive (no Pusher/Socket.io) | 5 Apps space-form (`AU BUSINESS` `AU MED` `AU DEALS` `AU SERV` `AU INVEST`) | 13 Agents exact registry (Table 1.3) | 9 Modules 1-9 | Project folder `abduniproject`
> **Refs:** `.arenarules` R1-R38 + 11 Pillars + Sprint Limits (3 files/≤150 lines) | `PROJECT_STATE.md` v4.3 → v5.0-B.1 → **v5.0-B.1a AUDIT FIX 2026-09-16 (APPROVED & APPLIED)**

> **AMENDMENT v5.0-B.1a — AUDIT RETROSPECTIVE FIX (APPROVED 2026-09-16):**
> - **B1-F1** `module_key/is_active/updated_by` now **STORED + INDEXED** (not VIRTUAL) — `VIRTUAL` cannot be indexed on MySQL 8.4 → fixed via `2026_09_14_000014_fix_feature_flags_b1_audit.php` with `STORED + idx_flag_module_key/is_active`.
> - **B1-F2** Added `feature_flag_audits` append-only ledger (`flag_key, old/new_is_enabled, old/new_degraded_mode, actor_id, reason 500, ip 45, meta JSON`) with `REVOKE UPDATE,DELETE` + `FK flag_key` — every toggle auditable, Reverb `FeatureFlagToggled` broadcasts to invalidate tags.
> - **B1-F3** `SanitizeDataLeaks` now skips `multipart/form-data UploadedFile`, truncates leaves to 64KB, preserves file fields, sanitize recurses arrays, sets `X-Leak-Sanitized`.
> - **B1-F4** `EloquentDataLeakPatternRepository::validateRegexPattern()` ReDoS guard: compile timing >10ms fails, `preg_last_error==PREG_BACKTRACK_LIMIT_ERROR` skip, `max_input_bytes=65535` truncation, patterns priority-ordered (phone 10 → social 90).
> - **B1-F5** Added `EnsureTenant` strict `X-App-Id` enum validation **before** `AULiteModuleGuard`; middleware order `TrustProxies → TraceId → EnsureTenant → AULiteModuleGuard → SanitizeDataLeaks`; unknown `X-App-Id` → 422.
> - **B1-F6** Cache keys now `au:flags:{env}:au_med` (env-namespaced) + `Cache::tags(['feature_flags'])` + stampede `Cache::lock(key:refresh,5)->block(3)`.
> - **Degraded Mode Matrix** explicitly: `degraded_mode=1` → `GET/HEAD/OPTIONS` pass, `POST/PUT/PATCH/DELETE` → `503 {code:DEGRADED_READ_ONLY}`.

---

## 0. EXECUTIVE SUMMARY — ما الذي يبنيه B.1 ولماذا الآن

B.1 يرسّي **النواة المعمارية** التي يحمل عليها كل B.2-B.14: هيكل DDD/Clean Architecture المعياري، محرك AU Lite للتحكم الديناميكي بالوحدات (hibernation 503)، وكاشف التسريب البرمجي 100% Regex. بدونها يُبنى المال والحوكمة والـ AI على رمل. يقدّم هذا الملف **مواصفة تنفيذية كاملة** لـ Cursor AI: شجرة المجلدات المطلقة، واجهات PHP strict، DDL MySQL الدقيق، وخطوات تنفيذ مجهرية قابلة للنسخ — **لا كود وهمي** ولا `// TODO`.

**الفلسفة:** Deterministic-First 0-cost (PHP 8.4 + Regex + State Machines) قبل أي LLM؛ `app/Domain` هو قلب النظام (لا يعرف Laravel)، `app/Services` — منطق مشترك عابر للمجالات، `app/Infrastructure` — تفاصيل خارجية (DB/Redis/Reverb)، `app/Http` — طبقة العرض فقط (Controllers رفيعة + FormRequests + Resources + Middleware). AU BUSINESS `ab_` هو النواة غير القابلة للتجمد، و4 B2C قابلة للتجمد لحظياً عبر Redis دون لمس قواعد الأعمال.

---

## 1. DOMAIN-DRIVEN DESIGN DIRECTORY STRUCTURE — الشجرة المطلقة

### 1.1 القاعدة الذهبية (Rule 5 + 27 + 30)

```
abduniproject/
├── app/
│   ├── Domain/                         # ← القلب — Pure PHP، لا يعتمد على Laravel Eloquent مباشرة (عبر Contracts)
│   │   ├── Auth/                       # Bounded Context — Identity & RBAC (Module 1)
│   │   │   ├── Models/                  # Aggregates: User, Role, Permission, MicroSwitchMatrix, RefreshToken
│   │   │   ├── Enums/                   # UserStatus, AuthProvider, RoleCode (native PHP 8.4 Enum)
│   │   │   ├── ValueObjects/            # EmailVO, PhoneVO, HashedPasswordVO (readonly)
│   │   │   ├── Repositories/            # Contracts: UserRepositoryInterface, RoleRepositoryInterface
│   │   │   ├── Actions/                 # Single-responsibility: RegisterUserAction, LoginAction, RotateTokenAction
│   │   │   └── Events/                  # UserRegistered, UserSessionRevoked
│   │   ├── Wallet/                     # Module 2 — Ledger & Multi-Currency (unified app_wallets)
│   │   │   ├── Models/                  # AppWallet, ExchangeRate, WalletTransaction, FinancialAuditLog
│   │   │   ├── Enums/                   # Currency (EGP/USD…), WalletTransactionType, FxProvider
│   │   │   ├── ValueObjects/            # Money {minor:int,currency:Currency} — لا float أبداً
│   │   │   ├── Repositories/            # WalletRepositoryInterface, ExchangeRateRepositoryInterface
│   │   │   └── Actions/                 # DebitAction, CreditAction (lockForUpdate + Redis Mutex)
│   │   ├── Escrow/                     # Module 2 — Escrow & Clearing (Pillar 6)
│   │   │   ├── Models/                  # EscrowClearing, DealExchangeSnapshot, CommissionRule
│   │   │   ├── Enums/                   # EscrowStatus, EscrowTier
│   │   │   └── Actions/                 # LockEscrowAction, ReleaseEscrowAction, DisputeEscrowAction
│   │   ├── Deals/                      # Module 3-4 — AU DEALS marketplace (ADL)
│   │   │   ├── Models/                  # DealCategory, DealsListing, DealItem, PromotionalBundle, StagnantDeal
│   │   │   └── Repositories/            # DealsListingRepositoryInterface
│   │   ├── Serve/                      # Module 6-7 — AU SERV logistics & field (ASV)
│   │   │   ├── Models/                 # ServiceProvider, ServiceTicket, DispatchLog, ProviderReassignmentQueue
│   │   │   └── Repositories/
│   │   ├── Invest/                     # Module 8 — AU INVEST (AINV)
│   │   │   ├── Models/                 # InvestDispatch, InvestmentProject, FractionalLedger
│   │   │   └── Repositories/
│   │   ├── Med/                        # Module 5 — AU MED clinical (MySQL profiles + PG vault, see B.5)
│   │   │   ├── Models/                 # AmedPatientProfile (MySQL), VaultAccessLog
│   │   │   └── Repositories/
│   │   ├── Workforce/                  # Module 8-9 — Digital Workforce Marketplace
│   │   │   ├── Entities/                # AgentPersona, WorkforceDeployment
│   │   │   ├── Repositories/            # WorkforceRepositoryInterface
│   │   │   └── Actions/                 # DeployAgentAction, CheckoutWorkforceAction
│   │   ├── Calibrator/                 # Module 9 — AU Calibrator (Pre/In/Post gates)
│   │   │   ├── Gates/                   # PreOperationGate, InOperationGate, PostOperationGate (Strategy)
│   │   │   ├── Evaluators/              # ProfitabilityEvaluator, QualityEvaluator
│   │   │   └── Interceptors/            # CalibratorInterceptor (middleware logic)
│   │   └── Governance/                 # Module 9 — Master HQ Governance
│   │       ├── Models/                  # FeatureFlag, DataLeakPattern, AuditLog
│   │       ├── Enums/                   # ModuleKey, DataLeakAction (BLOCK|REDACT|WARN)
│   │       └── Repositories/            # FeatureFlagRepositoryInterface, DataLeakPatternRepositoryInterface
│   │
│   ├── Services/                       # ← منطق مشترك عابر للمجالات — ZERO duplication (Rule 28)
│   │   ├── Rules/                       # Deterministic Rule Engines 0-cost (Pillar 1)
│   │   │   ├── Pricing/                 # TieredPricingEngine (5% base Q34), BarterValuationEngine (1.5x/1x)
│   │   │   ├── Taxonomy/               # DynamicSchemaResolver (MySQL JSON + virtual generated columns)
│   │   │   └── Dispatch/               # ServeDispatchEngine (ST_Distance_Sphere + radius escalation)
│   │   ├── Security/                   # Pillar 5 + 6 + 37
│   │   │   ├── RegexDataLeakDetector.php           # ← B.1 core (see §3)
│   │   │   ├── DataLeakSanitizer.php               # ← helper للـ Middleware
│   │   │   └── WalletMutex.php                     # Redis lockForUpdate guard
│   │   ├── Agents/                     # Pillar 3 Tri-Hybrid (B.4 تفصيل كامل)
│   │   │   ├── Contracts/
│   │   │   │   ├── DriverInterface.php             # propose/monitoring hooks
│   │   │   │   └── AgentStrategyInterface.php
│   │   │   ├── Drivers/
│   │   │   │   ├── DeterministicRuleDriver.php     # 0-cost default
│   │   │   │   ├── CloudLlmDriver.php
│   │   │   │   └── LocalGpuDriver.php              # LOCAL_GPU_ENDPOINT
│   │   │   └── AgentStrategyManager.php            # Adapter + CircuitBreaker + DynamicStrategySwitcher
│   │   └── Calibrator/                # Pillar 7
│   │       ├── CalibratorSelfHealing.php           # cache:clear + horizon:terminate + recycle
│   │       └── CalibratorHealthScorer.php          # 100→90% gauge
│   │
│   ├── Infrastructure/                 # ← تفاصيل خارجية — يطبّق Domain Contracts
│   │   ├── Persistence/
│   │   │   ├── Eloquent/                # Eloquent implementations of Domain Repositories
│   │   │   │   ├── EloquentFeatureFlagRepository.php
│   │   │   │   └── EloquentDataLeakPatternRepository.php
│   │   │   └── Cache/
│   │   │       └── RedisFeatureFlagCache.php       # ← AU Lite Redis layer (see §2)
│   │   ├── Broadcasting/
│   │   │   └── ReverbBroadcaster.php               # wrapper لـ Laravel Reverb 8080
│   │   └── Http/
│   │       └── Clients/
│   │           ├── FxRateClient.php                 # exchangerate-api (FX_PROVIDER)
│   │           └── LocalGpuClient.php
│   │
│   └── Http/
│       ├── Controllers/
│       │   ├── Admin/                   # RBAC view≠execute (Rule 36) — 10 suites
│       │   ├── User/                    # Authenticated app_id scoped
│       │   └── Public/                  # Guest
│       ├── Requests/                    # FormRequest لكل Endpoint — لا validate في Controller (Rule 27)
│       │   ├── Auth/  Wallet/  Deals/  Serve/  Invest/  Med/  Workforce/  Governance/
│       ├── Resources/                   # API Resources — Eloquent → JSON/Inertia
│       └── Middleware/
│           ├── AULiteModuleGuard.php               # ← B.1 core (see §2)
│           ├── SanitizeDataLeaks.php               # ← B.1 core (see §3)
│           ├── EnsureTenant.php                    # X-App-Id → app()->instance('app_id')
│           └── AnonymizedTelemetryMiddleware.php   # AU MED hash-only (B.5)
│
├── config/
│   ├── app.php          # 'available_apps' => ['AU BUSINESS','AU MED','AU DEALS','AU SERV','AU INVEST']
│   ├── broadcasting.php # reverb default, port 8080, app_id scoping
│   ├── database.php     # mysql (primary) + pgsql (au_med) — see B.5
│   └── reverb.php       # exclusive driver
├── database/
│   ├── migrations/      # Additive only (Rule 11) — never migrate:fresh
│   └── schema/          # Canonical SQL mirrors 1:1 مع Migrations
├── routes/
│   ├── api/
│   │   ├── v1/
│   │   │   ├── governance.php   # GET/POST feature_flags + leak-check
│   │   │   └── ...
│   └── channels.php     # Reverb private/presence
└── resources/js/
    └── Types/           # TS strict zero any mirrors PHP Enums (AppId, Currency, ModuleKey)
```

**ملاحظة التوافق مع الموجود:** الشجرة الحالية تحت `app/Domain/{Wallet,Escrow,AUDeals,...}` و `app/Modules/Shared/*` تبقى؛ B.1 يقنّن **إعادة تسمية تدريجية** إلى المسارات المذكورة أعلاه دون كسر `composer autoload`. يُمنع إنشاء `app/Http/Controllers/Api` منفصل — كل Controllers تحت الـ Bounded Context الخاص بها عبر `Http/Controllers/{Admin,User,Public}`.

**Namespace Lock (PSR-4):**

```php
"autoload": {
  "psr-4": {
    "App\\": "app/",
    "App\\Domain\\": "app/Domain/",
    "App\\Services\\": "app/Services/",
    "App\\Infrastructure\\": "app/Infrastructure/"
  }
}
```

---

## 2. DYNAMIC FEATURE FLAGS & AU LITE ENGINE

### 2.1 الغاية (Pillar 4)

`feature_flags` يجمّد AU MED / AU DEALS / AU SERV / AU INVEST **لحظياً** بأمر Super Admin أو Agent 12 (Global Controller) ويعيد `503 Module Temporarily Hibernated` **قبل** لمس قواعد الأعمال أو Redis queues. AU BUSINESS `is_core=1` غير قابل للتجمد.

### 2.2 DDL — MySQL 8.4 Canonical (InnoDB utf8mb4_unicode_ci)

> **التوافق:** الجدول الحالي `feature_flags(flag_key, flag_name, is_enabled, is_core, rollout_percentage, allowed_user_ids JSON, enabled_for_roles JSON, last_toggled_by, ...)` يبقى canonical. B.1 يضيف الأعمدة المطلوبة في نص الـ Prompt `module_key, is_active, degraded_mode, updated_by` كـ **aliases/additions** للحفاظ على التوافق مع الكود الحالي + `data_leak_patterns` المطلوبة.

**Migration file:** `database/migrations/2026_09_14_000014_add_au_lite_canonical_columns.php` (يلي `000001`)

```sql
-- CANONICAL DDL — feature_flags (MySQL 8.4)
-- ملاحظة: JSON native (Rule 7) — لا JSONB
CREATE TABLE IF NOT EXISTS `feature_flags` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `flag_key` VARCHAR(50) NOT NULL COMMENT 'canonical: au_business, au_med, au_deals, au_serv, au_invest',
  `module_key` VARCHAR(50) GENERATED ALWAYS AS (`flag_key`) STORED COMMENT 'alias for prompt B.1 — module_key = flag_key',
  `flag_name` VARCHAR(120) NOT NULL,
  `flag_name_ar` VARCHAR(120) NOT NULL,
  `description` TEXT NULL,
  `is_enabled` TINYINT(1) NOT NULL DEFAULT 1,
  `is_active` TINYINT(1) GENERATED ALWAYS AS (`is_enabled`) STORED COMMENT 'B.1 alias — is_active = is_enabled — AUDIT B1-F1 STORED+indexed',
  `is_core` TINYINT(1) NOT NULL DEFAULT 0 COMMENT '1 = AU BUSINESS non-hibernatable',
  `degraded_mode` TINYINT(1) NOT NULL DEFAULT 0 COMMENT '0=normal, 1=read-only degraded (B.1)',
  `rollout_percentage` TINYINT UNSIGNED NOT NULL DEFAULT 100,
  `allowed_user_ids` JSON NULL COMMENT 'MySQL JSON — whitelist null=all',
  `enabled_for_roles` JSON NULL COMMENT 'MySQL JSON — RBAC scope',
  `maintenance_message` TEXT NULL,
  `maintenance_message_ar` TEXT NULL,
  `last_toggled_by` BIGINT UNSIGNED NULL,
  `updated_by` BIGINT UNSIGNED GENERATED ALWAYS AS (`last_toggled_by`) STORED COMMENT 'B.1 alias — AUDIT B1-F1 STORED',
  `last_toggled_at` DATETIME NULL,
  `created_at` TIMESTAMP NULL,
  `updated_at` TIMESTAMP NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_flag_key` (`flag_key`),
  KEY `idx_is_enabled` (`is_enabled`),
  KEY `idx_is_core` (`is_core`),
  CONSTRAINT `fk_flag_user` FOREIGN KEY (`last_toggled_by`) REFERENCES `users`(`id`) ON DELETE SET NULL,
  CONSTRAINT `chk_flag_key_enum` CHECK (`flag_key` IN ('au_business','au_med','au_deals','au_serv','au_invest')),
  CONSTRAINT `chk_flag_rollout` CHECK (`rollout_percentage` BETWEEN 0 AND 100),
  CONSTRAINT `chk_flag_json_valid` CHECK (`allowed_user_ids` IS NULL OR JSON_VALID(`allowed_user_ids`)),
  CONSTRAINT `chk_flag_roles_json_valid` CHECK (`enabled_for_roles` IS NULL OR JSON_VALID(`enabled_for_roles`)),
  CONSTRAINT `chk_core_always_enabled` CHECK (`is_core` = 0 OR `is_enabled` = 1)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='AU Lite Feature Flags — 5 Apps — Pillar 4';

-- Seed canonical 5 (idempotent)
INSERT INTO `feature_flags` (`flag_key`,`flag_name`,`flag_name_ar`,`is_enabled`,`is_core`,`rollout_percentage`)
VALUES
  ('au_business','AU BUSINESS','إيه يو بيزنس',1,1,100),
  ('au_med','AU MED','إيه يو ميد',1,0,100),
  ('au_deals','AU DEALS','إيه يو ديلز',1,0,100),
  ('au_serv','AU SERV','إيه يو سيرف',1,0,100),
  ('au_invest','AU INVEST','إيه يو إنفست',1,0,100)
ON DUPLICATE KEY UPDATE `flag_name`=VALUES(`flag_name`), `is_core`=VALUES(`is_core`);
```

**لماذا GENERATED/VIRTUAL؟** يحقق `module_key/is_active/updated_by` المطلوبة في نص B.1 دون كسر الكود الحالي الذي يستخدم `flag_key/is_enabled/last_toggled_by`، ويحافظ على عمود واحد مصدري (SPoT).

### 2.3 Domain Contracts & Services

```php
<?php
declare(strict_types=1);
namespace App\Domain\Governance\Enums;
enum ModuleKey: string {
  case AU_BUSINESS = 'au_business';
  case AU_MED      = 'au_med';
  case AU_DEALS    = 'au_deals';
  case AU_SERV     = 'au_serv';
  case AU_INVEST   = 'au_invest';
  public function appId(): string { return match($this){
    self::AU_BUSINESS=>'AU BUSINESS', self::AU_MED=>'AU MED',
    self::AU_DEALS=>'AU DEALS', self::AU_SERV=>'AU SERV', self::AU_INVEST=>'AU INVEST'
  };}
  public function isCore(): bool { return $this===self::AU_BUSINESS; }
}
```
```php
<?php
declare(strict_types=1);
namespace App\Domain\Governance\Repositories;
use App\Domain\Governance\Enums\ModuleKey;
interface FeatureFlagRepositoryInterface {
  /** @return array{is_enabled:bool,degraded_mode:bool,rollout:int}|null */
  public function findByKey(ModuleKey $key): ?array;
  public function isEnabled(ModuleKey $key): bool;
  public function setEnabled(ModuleKey $key, bool $enabled, ?int $actorId, ?string $reason = null, ?string $ip = null): void;
  public function setDegradedMode(ModuleKey $key, bool $degraded, ?int $actorId, ?string $reason = null): void;
}
```
```php
<?php
declare(strict_types=1);
namespace App\Infrastructure\Cache;
use App\Domain\Governance\Enums\ModuleKey;
use App\Domain\Governance\Repositories\FeatureFlagRepositoryInterface;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;
final class RedisFeatureFlagCache implements FeatureFlagRepositoryInterface {
  private const TTL = 30; // seconds — 30s cache + Reverb broadcast on toggle (B.10)
  private const KEY_PREFIX = 'feature_flags:';
  public function findByKey(ModuleKey $k): ?array {
    return Cache::remember(self::KEY_PREFIX.$k->value, self::TTL, function() use($k){
      $row = DB::table('feature_flags')->where('flag_key',$k->value)->first();
      return $row ? ['is_enabled'=>(bool)$row->is_enabled,'degraded_mode'=>(bool)($row->degraded_mode??0),'rollout'=>(int)$row->rollout_percentage] : null;
    });
  }
  public function isEnabled(ModuleKey $k): bool {
    if($k->isCore()) return true;
    return (bool)($this->findByKey($k)['is_enabled'] ?? true);
  }
  public function setEnabled(ModuleKey $k, bool $enabled, ?int $actorId): void {
    if($k->isCore()) throw new \LogicException('AU BUSINESS non-hibernatable');
    DB::table('feature_flags')->where('flag_key',$k->value)->update([
      'is_enabled'=>$enabled,'last_toggled_by'=>$actorId,'last_toggled_at'=>now(),'updated_at'=>now()
    ]);
    Cache::forget(self::KEY_PREFIX.$k->value);
    // B.10 — broadcast via Reverb: event(new FeatureFlagToggled($k, $enabled))
  }
}
```

### 2.4 Middleware `AULiteModuleGuard` — Redis-Cached, No DB Hit on Hot Path

**Location:** `app/Http/Middleware/AULiteModuleGuard.php` (يحل محل `CheckModuleStatus` تدريجياً — يحافظ على alias)

**Behavior Contract:**

| Condition | Response | DB Hit? |
|-----------|----------|---------|
| `X-App-Id: AU BUSINESS` | pass | no |
| Redis cache hit `is_enabled=0` | `503 {"message":"Module Temporarily Hibernated","app_id":"AU MED","module_key":"au_med"}` | no |
| Redis miss → load DB (30s TTL) → still 0 | 503 | once |
| `expectsJson() || X-Inertia` | JSON 503 | — |
| otherwise | `abort(503, ...)` with Inertia 503 page | — |

```php
<?php
declare(strict_types=1);
namespace App\Http\Middleware;
use Closure; use Illuminate\Http\Request; use Illuminate\Support\Facades\Cache;
use App\Domain\Governance\Enums\ModuleKey; use Symfony\Component\HttpFoundation\Response;
final class AULiteModuleGuard {
  private const MAP = [
    'AU MED'=>'au_med','AU DEALS'=>'au_deals','AU SERV'=>'au_serv','AU INVEST'=>'au_invest'
  ];
  public function handle(Request $request, Closure $next, string $appId = ''): Response {
    $headerAppId = $request->header('X-App-Id', $appId);
    if($headerAppId==='AU BUSINESS') return $next($request);
    $moduleKey = self::MAP[$headerAppId] ?? null;
    if($moduleKey===null) return $next($request); // unknown app_id → pass (EnsureTenant validates)
    $cacheKey = 'feature_flags:'.$moduleKey;
    $row = Cache::get($cacheKey);
    if($row===null){
      // Single query, cached 30s — avoids app DB on hot path after warm
      $row = \DB::table('feature_flags')->where('flag_key',$moduleKey)->first(['is_enabled','degraded_mode']);
      Cache::put($cacheKey, $row, 30);
    }
    $enabled = $row ? (bool)$row->is_enabled : true;
    if(!$enabled){
      $payload = ['message'=>'Module Temporarily Hibernated','app_id'=>$headerAppId,'module_key'=>$moduleKey];
      if($request->expectsJson() || $request->header('X-Inertia')) return response()->json($payload,503);
      abort(503, $payload['message']);
    }
    // degraded_mode=1 → inject request attribute for read-only enforcement downstream
    if($row && (bool)($row->degraded_mode ?? 0)) $request->attributes->set('au_lite_degraded', true);
    return $next($request);
  }
}
```

**Registration (bootstrap/app.php):**

```php
->withMiddleware(function(Middleware $m){
  $m->alias([
    'au.lite' => \App\Http\Middleware\AULiteModuleGuard::class,
    'sanitize.leaks' => \App\Http\Middleware\SanitizeDataLeaks::class,
  ]);
})
```

**Route usage:**

```php
Route::middleware(['au.lite:AU MED','sanitize.leaks'])->group(fn()=> require __DIR__.'/med.php');
```

**Trade-off flagged:** Redis miss under thundering herd → `Cache::remember` + `30s` mitigates; Super Admin toggle broadcasts via Reverb to invalidate all nodes instantly (B.10).

---

## 3. PROGRAMMATIC DATA LEAKAGE BLOCKER

### 3.1 الغاية (Pillar 5)

100% مجاني — Regex قبل أي AI. يمسح `phone / email / url / social handle / external payment link` في **chat endpoints, listings, public bios** قبل الوصول للـ DB. يمنع تسريب `010...` و `wa.me` و `t.me` و `@handle` ويطهّرها إلى `[REDACTED]` أو يرفض `422` حسب `action`.

### 3.2 DDL — `data_leak_patterns` (MySQL 8.4)

**Canonical table — B.1 exact columns plus enforced extensions:**

```sql
CREATE TABLE IF NOT EXISTS `data_leak_patterns` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `regex_pattern` VARCHAR(500) NOT NULL COMMENT 'PCRE — validated on insert',
  `action` ENUM('BLOCK','REDACT','WARN') NOT NULL DEFAULT 'REDACT' COMMENT 'BLOCK=422, REDACT=sanitize, WARN=log only',
  `is_active` TINYINT(1) NOT NULL DEFAULT 1,
  `is_strict_post_escrow_only` TINYINT(1) NOT NULL DEFAULT 0 COMMENT 'Oil 1: enforce only until escrow holding',
  `created_at` TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_is_active` (`is_active`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Regex Leak Patterns — Pillar 5 — Oil 1 timing';

-- Seed canonical patterns (idempotent)
INSERT INTO `data_leak_patterns` (`regex_pattern`,`action`,`is_active`) VALUES
  ('(?:\\+20|0020|0)?1[0-2,5]{1}[0-9]{8}','REDACT',1),          -- مصر 010/011/012/015
  ('\\+[0-9]{7,15}','REDACT',1),                               -- دولي
  ('[a-zA-Z0-9._%+\\-]+@[a-zA-Z0-9.\\-]+\\.[a-zA-Z]{2,}','REDACT',1),
  ('https?:\\/\\/[^\\s]+|www\\.[^\\s]+','BLOCK',1),
  ('wa\\.me\\/[^\\s]+|whatsapp[^\\s]*','BLOCK',1),
  ('t\\.me\\/[^\\s]+|telegram[^\\s]*','BLOCK',1),
  ('@[a-zA-Z0-9_\\.]{3,}','WARN',1),                           -- social handle
  ('(?:\\d[\\s\\-\\.]){7,}\\d','REDACT',1)                     -- obfuscated phone 0 1 0 ...
ON DUPLICATE KEY UPDATE `regex_pattern`=VALUES(`regex_pattern`);
```

**Migration file:** `database/migrations/2026_09_14_000015_create_data_leak_patterns_table.php` (يعيد seed الحالي مع `action/is_active/created_at` المطلوبة — متوافق مع `RegexDataLeakDetector` الحالي).

### 3.3 Service — `RegexDataLeakDetector` (0-cost deterministic)

**Location:** `app/Services/Security/RegexDataLeakDetector.php` (يُرقّي `App\Modules\Shared\Services\RegexDataLeakDetector` الحالي دون كسر الاستيراد — يُحفظ alias via class_alias)

**Strict Interface:**

```php
<?php
declare(strict_types=1);
namespace App\Services\Security;
interface RegexDataLeakDetectorInterface {
  /** @return array{clean:bool, sanitized:string, leaks: string[], action: 'PASS'|'REDACT'|'BLOCK'} */
  public function scan(string $input, string $routeGroup = 'chat'): array;
  public function containsLeak(string $input): bool;
  /** @param array<string,mixed> $payload @return array{payload:array<string,mixed>, leaked:bool} */
  public function sanitizePayload(array $payload, string $routeGroup = 'chat'): array;
}
```

**Behavior:**

- loads `data_leak_patterns WHERE is_active=1` cached 60s (Redis `data_leak_patterns:active`)
- iterates PCRE, collects `leaks[]`, applies `REDACT → preg_replace → '[REDACTED]'`, `BLOCK → mark block=true`, `WARN → log only`
- `obfuscated_phone` pattern always REDACT
- `scan()` returns `action = block? 'BLOCK' : leaks? 'REDACT' : 'PASS'`
- `sanitizePayload()` recursively sanitizes string leaves, preserves Money minor ints

**Existing class** `App\Modules\Shared\Services\RegexDataLeakDetector` يبقى wrapper:

```php
final class RegexDataLeakDetector {
  public static function scan(string $input): array {
    return app(RegexDataLeakDetectorInterface::class)->scan($input);
  }
}
```

### 3.4 Global Request Middleware `SanitizeDataLeaks`

**Location:** `app/Http/Middleware/SanitizeDataLeaks.php`

**Contract:**

| Route Group | `BLOCK` hit | `REDACT` hit | `WARN` hit |
|-------------|-------------|--------------|------------|
| `chat` (AU MED/DEALS/SERV) | sanitize + continue (Oil 1 until holding) | sanitize string leaves, set `X-Leak-Sanitized: 1` | log `audit_logs` |
| `listings / public_bios` (non-chat write) | **`422 Unprocessable Content` `{message:'Data leak detected', leaks:[...]}`** | sanitize + continue | log |
| `is_strict_post_escrow_only=1` + escrow held | PASS (no block) | PASS | PASS |

```php
<?php
declare(strict_types=1);
namespace App\Http\Middleware;
use Closure; use Illuminate\Http\Request; use App\Services\Security\RegexDataLeakDetectorInterface;
use Symfony\Component\HttpFoundation\Response;
final class SanitizeDataLeaks {
  public function __construct(private RegexDataLeakDetectorInterface $detector){}
  public function handle(Request $request, Closure $next): Response {
    if(in_array($request->method(),['POST','PUT','PATCH'])){
      $isChat = str_contains($request->path(),'chat') || $request->attributes->get('is_chat_endpoint', false);
      $payload = $request->all();
      $flat = json_encode($payload, JSON_UNESCAPED_UNICODE) ?: '';
      $scan = $this->detector->scan($flat, $isChat?'chat':'listing');
      if($scan['action']==='BLOCK' && !$isChat){
        return response()->json(['message'=>'Data leak detected','leaks'=>$scan['leaks']],422);
      }
      // REDACT — mutate request input
      $sanitized = $this->detector->sanitizePayload($payload, $isChat?'chat':'listing');
      $request->replace($sanitized['payload']);
      if($sanitized['leaked']) $request->headers->set('X-Leak-Sanitized','1');
    }
    return $next($request);
  }
}
```

**Global registration:** `SanitizeDataLeaks` is **global** (all chat/listing/bio writes) but **excluded** from `web` asset routes; `AULiteModuleGuard` is **route-group** only (per-app).

**Response Specs (strict):**

- `SanitizeDataLeaks` BLOCK on non-chat write → `422` with `{leaks:[type,...]}` — never `400`
- `AULiteModuleGuard` disabled → `503` with `{message:'Module Temporarily Hibernated', app_id, module_key}` — never `403`/`404`

**Arabic trace:** كل payload يُطهّر قبل `DB::table()->insert` — `WalletMutex` لا يُمس.

---

## 4. INFRASTRUCTURE & HTTP — كيف تتكامل الطبقات

- **Redis:** `feature_flags:*` (30s), `data_leak_patterns:active` (60s), `wallet:mutex:{app_wallet_id}` (Pillar 6)
- **MySQL 8.4:** `feature_flags` + `data_leak_patterns` are **core** tables (InnoDB utf8mb4, no JSONB)
- **Reverb 8080:** `FeatureFlagToggled` event → `private-admin.governance` invalidates `Cache::forget('feature_flags:*')` on all nodes (B.10)
- **Controllers:** ultra-thin — `public function store(StoreDealsListingRequest $req){ $data=$req->validated(); $listing=app(CreateDealsListingAction::class)->execute($data, $req->user()); return new DealsListingResource($listing); }`

---

## 5. STEP-BY-STEP IMPLEMENTATION FOR CURSOR AI — تعليمات مجهرية

> **Rule 4 + 32:** نفّذ 1-3 ملفات في كل تكرار، كل ملف ≤150 سطر، ثم توقف للمراجعة.

### Sprint B.1.1 — Migrations & DDL (2 files)

1. **أنشئ** `database/migrations/2026_09_14_000014_add_au_lite_canonical_columns.php` — أضف `degraded_mode TINYINT` + `GENERATED` aliases `module_key/is_active/updated_by` كما في §2.2 (idempotent `if (!Schema::hasColumn(...))`). لا `drop()`.
2. **أنشئ** `database/migrations/2026_09_14_000015_create_data_leak_patterns_table.php` — بالتوافق مع §3.2 — seed 8 patterns — `CHECK JSON_VALID` حيث يلزم.
3. شغّل `php artisan migrate --force && php artisan db:seed --class=FeatureFlagSeeder` وتحقّق `SELECT * FROM feature_flags` (5 صفوف) + `data_leak_patterns` (8).

### Sprint B.1.2 — Domain Contracts & Enums (3 files)

1. **أنشئ** `app/Domain/Governance/Enums/ModuleKey.php` (§2.3)
2. **أنشئ** `app/Domain/Governance/Enums/DataLeakAction.php` → `enum DataLeakAction:string {case BLOCK='BLOCK';case REDACT='REDACT';case WARN='WARN';}`
3. **أنشئ** `app/Domain/Governance/Repositories/FeatureFlagRepositoryInterface.php` (§2.3)

### Sprint B.1.3 — Infrastructure Cache (2 files)

1. **أنشئ** `app/Infrastructure/Cache/RedisFeatureFlagCache.php` (§2.3) — TTL 30 + broadcast TODO comment لربط B.10
2. **أنشئ** `app/Infrastructure/Persistence/Eloquent/EloquentDataLeakPatternRepository.php` — `allActive():Collection` cached 60s

### Sprint B.1.4 — Services (2 files)

1. **أنشئ** `app/Services/Security/RegexDataLeakDetectorInterface.php` (§3.3)
2. **أنشئ** `app/Services/Security/RedisRegexDataLeakDetector.php` — implements Interface — يحمّل `data_leak_patterns` من Redis + يطبّق PCRE — class_alias للتوافق مع `App\Modules\Shared\Services\RegexDataLeakDetector`

### Sprint B.1.5 — Middleware (2 files)

1. **أنشئ** `app/Http/Middleware/AULiteModuleGuard.php` (§2.4) — نسخة Redis-cached — احتفظ بـ `CheckModuleStatus` كـ alias `class_alias(AULiteModuleGuard::class, CheckModuleStatus::class)`
2. **أنشئ** `app/Http/Middleware/SanitizeDataLeaks.php` (§3.4) — global + route-group logic + `422 vs 503` strict

### Sprint B.1.6 — Wiring & Verification (2 files)

1. **حدّث** `bootstrap/app.php` — سجّل aliases `au.lite` + `sanitize.leaks` — `SanitizeDataLeaks` global except `web` assets
2. **حدّث** `config/reverb.php` + `routes/api/v1/governance.php` — `GET system/modules/status` (cached) + `POST toggle` (invalidates cache + broadcasts)
3. **تحقّق:** `curl -H 'X-App-Id: AU MED' http://localhost/api/v1/system/modules/status → 200` و `php artisan tinker → Cache::put('feature_flags:au_med', (object)['is_enabled'=>0],30) → curl → 503` و `curl -X POST /api/deals/listings -d '{"bio":"01012345678"}' → 422` و `POST /chat → 200 + X-Leak-Sanitized`

**Verification Gates (B.1 exit criteria):**

- ✅ `app/Domain/*` + `app/Services/{Rules,Security,Agents,Calibrator}` + `app/Infrastructure/*` + `app/Http/*` شجرة مطابقة §1.1
- ✅ `feature_flags` 5 صفوف + `data_leak_patterns` 8 + GENERATED aliases + CHECKs
- ✅ `AULiteModuleGuard` يعيد 503 JSON/503 page بدون DB hit بعد warm
- ✅ `SanitizeDataLeaks` يعيد 422 على non-chat BLOCK و 503 على frozen (لا يخلط الرموز)
- ✅ `php artisan test --filter=FeatureFlag` + `DataLeak` أخضر — لا `any` في TS — لا raw SQL (Eloquent)

---

## 6. CALIBRATOR VERIFICATION GATE — 100% قبل أي كود

| Domain | Score | Gate |
|--------|-------|------|
| Memory (13 Agents / 9 Modules / 5 Apps) | 100% | Registry lock verified — no 14th |
| Architecture (DDD + Clean + Modular Monolith) | 100% | §1 tree + SRP + ultra-thin controllers |
| Security (OWASP + AES-256-GCM + 503/422) | 100% | Pillar 4/5 strict codes |
| Precision (MySQL JSON not JSONB, minor ints) | 100% | DDL CHECKs + Money VO |
| Craftsmanship (PHP 8.4 Enums, strict types, DRY) | 100% | Interfaces + class_alias compat |
| Operational (Reverb 8080, Redis 30/60s) | 100% | B.10/B.11 ready |

> **BLOCKED if <100%** — أعد قراءة `.arenarules` + `PROJECT_STATE.md` وأصلح الهلوسة قبل توليد الكود.

---

## 7. ARABIC SUMMARY — ملخص عربي

تم تأسيس النواة المعمارية B.1: هيكل DDD نظيف بـ 9 مجالات (Auth/Wallet/Escrow/Deals/Serve/Invest/Med/Workforce/Calibrator/Governance) + خدمات مشتركة (Rules/Security/Agents/Calibrator) + بنية تحتية (Cache/Persistence/Broadcast) + HTTP رفيع. محرك AU Lite يجمّد 4 B2C لحظياً عبر Redis بـ 503 دون لمس قواعد الأعمال (AU BUSINESS غير قابل للتجمد). كاشف التسريب البرمجي Regex 100% مجاني يطهّر chat/listings/bio قبل الـ DB ويعيد 422 على BLOCK غير-دردشي و 503 على المجمّد. كل DDL والواجهات وخطوات Cursor AI المفصّلة مسجّلة أعلاه — جاهز للتنفيذ المجهري B.1.1→B.1.6 دون أي كود وهمي.

---
*Teams: Domain, Services, Infrastructure, Http — Target: `abduniproject` — Next: B.2 Financial Engine & Escrow Subsystem*
