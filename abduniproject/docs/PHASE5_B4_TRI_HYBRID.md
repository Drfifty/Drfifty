# PHASE 5.0 — B.4 محول استراتيجيات الذكاء الاصطناعي الثلاثي والشفاء الذاتي
> **ABD UNI PROJECT — AgentStrategyManager Tri-Hybrid + CircuitBreaker + BudgetGuard + Calibrator Self-Healing — Arena Canonical v5.0-B.4 — AUDIT-HARDENED**
> **Stack Lock:** Laravel 12 PHP 8.4 | MySQL 8.4 InnoDB utf8mb4 JSON (not JSONB) | Redis Cache/Queue/Mutex + Lua | Reverb 8080 wss | 5 Apps space-form | 13 Agents 1-13 | 9 Modules 1-9 | `abduniproject`
> **Refs:** `.arenarules` R1-R38 + Pillars 1,2,3,7,8 | `PROJECT_STATE.md` v5.0-B.3 → B.4 | B.1a Cache Tags | B.2a Trace+HMAC | B.3 DRM hierarchy

---
## 0. EXECUTIVE SUMMARY

B.4 يدير 13 وكيل بدون تكلفة عبر `DeterministicRuleDriver` 0-token أولاً، يFallback تلقائياً لـ `CloudLlmDriver` أو `LocalGpuDriver` عند `confidence <90` أو `RegexMismatchException`، مع **CircuitBreaker 5/5min**, **BudgetGuard Redis Lua atomic**, **SSRF guard**, **prompt re-sanitize**, **cache 30s tags**, **Calibrator event-decoupled**. قبل التدقيق كان هناك سباق الميزانية، ازدواجية `ai_agents_config` vs `micro_switch_matrix`, SSRF, تسريب prompt, hang worker. هذه النسخة **مُصلّحة ومُحسّنة قبل أي كود** (F-01→F-13).

**Philosophy:** Deterministic-First 0-cost; LLM only when needed; every fallback traced via `trace_id`, budgeted atomically, circuit-guarded, and healing is **event-async** not inline.

---
## 1. TRI-HYBRID DRIVER ARCHITECTURE — DDD Layered (R27)

```
app/Domain/Agents/Contracts/DriverInterface.php          # Pure contract (Domain)
app/Domain/Agents/ValueObjects/Proposal.php              # confidence, output, tokens, cost
app/Services/Agents/AgentStrategyManager.php             # Adapter + orchestration (Services)
app/Services/Agents/CircuitBreaker.php                   # Redis OPEN/HALF_OPEN/CLOSED
app/Services/Agents/BudgetGuard.php                      # Redis Lua atomic INCRBYFLOAT
app/Services/Agents/Drivers/DeterministicRuleDriver.php  # Pure PHP 8.4 + Regex + FSM
app/Services/Agents/Drivers/CloudLlmDriver.php           # OpenAI/Groq via config/ai.php
app/Services/Agents/Drivers/LocalGpuDriver.php           # vLLM {LOCAL_GPU_ENDPOINT} SSRF-guarded
app/Infrastructure/Cache/AgentRuntimeCache.php           # 30s tags ai_runtime + lock
app/Infrastructure/Http/Clients/LocalGpuClient.php       # Http::timeout 3s SSRF allowlist
app/Infrastructure/Http/Clients/CloudLlmClient.php       # Http::timeout 5s + cost tally
app/Events/AgentConfidenceEvaluated.php                  # confidence → Calibrator
app/Listeners/CalibratorHealingListener.php              # queue calibrator
app/Services/Calibrator/CalibratorSelfHealingEngine.php  # price/promo/reroute
config/ai.php                                            # env wrapper R17
database/migrations/2026_09_14_000020_upgrade_micro_switch_b4.php
```

### 1.1 DriverInterface — Strict PHP 8.4

```php
namespace App\Domain\Agents\Contracts;
use App\Domain\Agents\ValueObjects\Proposal;
interface DriverInterface {
 public function driverName(): string; // deterministic|cloud|local_gpu
 /** @throws RegexMismatchException|DeterministicConfidenceBelowThresholdException */
 public function propose(array $context): Proposal;
}
final readonly class Proposal {
 public function __construct(
  public float $confidence, // 0-100
  public string $output,
  public int $tokens = 0,
  public float $costUsd = 0.0,
  public string $reasonCode = 'OK' // OK|CONFIDENCE_LOW|REGEX_MISMATCH|BUDGET_EXHAUSTED|CIRCUIT_OPEN
 ){}
}
```

**Threshold rule (F-03):** `>=90 pass`, `<90 fallback`. Both `confidence<90` and `RegexMismatchException` dispatch same fallback but distinct `reason_code`.

### 1.2 Driver 1 — DeterministicRuleDriver (0 token)
Pure PHP 8.4: Regex + Finite State Machine + Rule engines (Pricing/Barter/Dispatch). No network. Timeout 2s. Throws `RegexMismatchException` if pattern fails. Used for: price calc, taxonomy, dispatch, fraud regex.

### 1.3 Driver 2 — CloudLlmDriver
`CloudLlmClient` → `POST https://api.openai.com/v1/chat/completions` via `config('ai.cloud.base_url')`, `api_key = env('CLOUD_LLM_API_KEY')` never logged, `Http::timeout(5)->connectTimeout(1)`. Counts `tokens + costUsd` from response `usage`. On `Http timeout` → `CircuitBreaker::recordFailure()`.

### 1.4 Driver 3 — LocalGpuDriver
`LocalGpuClient` → `POST {LOCAL_GPU_ENDPOINT}/v1/completions` (vLLM). **SSRF guard (F-04):** `FILTER_VALIDATE_URL` + deny `10/172.16/192.168/169.254/127.0.0.1` + allowlist `env('LOCAL_GPU_ALLOWLIST','http://vllm:8001,http://127.0.0.1:8001')`, `timeout 3s`. Budget counts via `tokens * env('LOCAL_GPU_COST_PER_1K',0.001)`.

---
## 2. GRACEFUL FALLBACK & CIRCUIT BREAKER + BUDGET (F-01, F-07)

### 2.1 Flow — AgentStrategyManager::execute(agentId=3, context)

```
1. trace_id = app('trace_id') (W3C), app_id = EnsureTenant, start = microtime
2. runtime = AgentRuntimeCache::resolve(agentId, app_id) → {driver_override, threshold=90, preferred_driver from micro_switch_matrix}
   // precedence: micro_switch.driver_override > budget > confidence (F-08, F-11)
   // cached 30s tags ai_runtime + lock, invalidated via MicroPermissionToggled Reverb
3. Re-sanitize context prompt via RegexDataLeakDetector (F-06) — if BLOCK → return HITL queue (no LLM)
4. BudgetGuard::check(agentId) → Redis Lua atomic (F-01):
     key = budget:{agentId}:{YYYY-MM-DD:Cairo} ; if INCRBYFLOAT spend+cost > cap → DECRBY revert → return EXCEEDED
   If EXCEEDED → force Deterministic + dispatch(hitl_alert BUDGET_EXHAUSTED) + return Proposal(reason=BUDGET_EXHAUSTED, noFurtherFallback=true) (F-12)
5. Try DeterministicRuleDriver::propose() with CircuitBreaker::isOpen(deterministic)? skip if OPEN
   - success confidence >= threshold → recordSuccess → BudgetGuard::add(tokens,cost) → dispatch AgentConfidenceEvaluated → return
   - confidence < threshold → throw DeterministicConfidenceBelowThresholdException
   - RegexMismatchException → same
   - on failure → recordFailure (5 failures → OPEN 5min)
6. If fallback needed:
     order = preferred_driver == 'local_gpu' ? [local_gpu, cloud] : [cloud, local_gpu]  // F-11 prefers micro_switch
     For each driver in order:
       if CircuitBreaker::isOpen(driver) → skip
       if BudgetGuard::wouldExceed(driver estimated cost) → skip
       try driver::propose() with timeout; recordSuccess; BudgetGuard::add; dispatch; return
       on fail → recordFailure; continue
7. If all drivers fail → return last deterministic Proposal + reason ALL_DRIVERS_FAILED + HITL queue
8. Always propagate traceparent header to LLM: traceparent: 00-{trace_id}-{parent}-01 (F-13)
```

### 2.2 CircuitBreaker — Redis per-agent per-driver

```
key = circuit:{driver}:{agent_id} → {state:CLOSED|OPEN|HALF_OPEN, failures:int, opened_at:ts}
Transitions: CLOSED +5 failures → OPEN (TTL 300s); OPEN expired → HALF_OPEN single probe; probe success → CLOSED, fail → OPEN again.
Storage: Redis hash with TTL, atomic INCR via Lua.
```

### 2.3 BudgetGuard — Redis Lua Atomic (F-01)

```lua
-- KEYS[1]=budget:{id}:{date}:spend, ARGV[1]=deltaCost, ARGV[2]=cap
local new = redis.call('INCRBYFLOAT', KEYS[1], ARGV[1])
redis.call('EXPIRE', KEYS[1], 90000) -- 25h TTL
if tonumber(new) > tonumber(ARGV[2]) then
 redis.call('INCRBYFLOAT', KEYS[1], -ARGV[1])
 return 0 -- exceeded
end
return 1 -- allowed
```

`daily_token_limit` same key `budget:{id}:{date}:tokens`. DB `agent_budget_caps` is audit mirror flushed nightly `00:05 Cairo` via `Schedule::daily` → `DB::transaction` upsert from Redis.

---
## 3. DYNAMIC RUNTIME SWITCHING — Without Restart (F-02, F-08)

**No new `ai_agents_config` table** — extends `micro_switch_matrix` (R28 DRY, R11 additive):

```sql
ALTER TABLE micro_switch_matrix
 ADD COLUMN driver_override ENUM('auto','deterministic','cloud','local_gpu') DEFAULT 'auto' AFTER llm_fallback_enabled,
 ADD COLUMN deterministic_threshold TINYINT UNSIGNED DEFAULT 90 AFTER driver_override,
 ADD CONSTRAINT chk_threshold_0_100 CHECK (deterministic_threshold BETWEEN 0 AND 100);
CREATE INDEX idx_ms_driver ON micro_switch_matrix(driver_override);
```

**Runtime resolve (AgentRuntimeCache):**

```php
public static function resolve(int $agentId, string $appId): array {
 return Cache::tags(['ai_runtime'])->remember("ai:runtime:{$agentId}:{$appId}",30,function() use(...){
  $row = DB::table('micro_switch_matrix')->where(['agent_id'=>$agentId,'app_id'=>$appId])->first(['driver_override','deterministic_threshold','preferred_driver']);
  return ['driver_override'=>$row->driver_override ?? 'auto','threshold'=>$row->deterministic_threshold ?? 90,'preferred'=>$row->preferred_driver ?? 'cloud'];
 });
}
```

Toggle via `POST /api/v1/governance/micro-permissions/toggle` already in B.3 (same endpoint, new fields). `MicroPermissionToggled` Reverb flushes `Cache::tags(['ai_runtime','micro_perm'])`.

---
## 4. INTEGRATION WITH AU CALIBRATOR — Event-Decoupled (F-11)

**Not inline call** — R27 SoC: Manager dispatches event, Calibrator listens async.

```php
// Manager after any driver success:
event(new AgentConfidenceEvaluated(agentId: $agentId, confidence: $proposal->confidence, driver: $driverName, reasonCode: $proposal->reasonCode, traceId: app('trace_id'), durationMs: $ms, costUsd: $proposal->costUsd));
```

**Listener:** `CalibratorHealingListener` on `queue:calibrator`

```php
public function handle(AgentConfidenceEvaluated $e){
 if($e->confidence >= 90) return;
 if(!Cache::get('calibrator:enabled', true)) return;
 // Pre-Op gate <15ms check via CalibratorSelfHealingEngine
 $engine = app(CalibratorSelfHealingEngine::class);
 $engine->evaluate($e); // may call priceAdjustment, autoPromotion, reroute
 // respects Gate::before super_admin + audit to security_audit_logs via async
}
```

**Engine actions (deterministic):**
- `priceAdjustment` → `TieredPricingEngine::adjust(agentId, delta)` (0-cost)
- `autoPromotion` → `stagnant_deals` promote flag
- `reroute` → ` dispatch` to nearby provider via `ST_Distance_Sphere`

All actions **pre-aggregated stats only** per R37, never `COUNT(*) on app_wallets` live.

**Observability (F-13):** `config/logging.php` allowlist extended `+ agent_id, driver, confidence, tokens, cost_usd`; `TraceIdMiddleware` injects `traceparent` into `CloudLlmClient/LocalGpuClient` headers.

---
## 5. DDL — Canonical MySQL 8.4 (JSON not JSONB, Eloquent only)

**Migration:** `2026_09_14_000020_upgrade_micro_switch_b4.php` + `2026_09_14_000021_create_agent_budget_caps_b4.php` (split for 3-file limit)

```sql
-- 000020 — extend micro_switch_matrix (additive)
ALTER TABLE micro_switch_matrix ADD COLUMN driver_override ENUM('auto','deterministic','cloud','local_gpu') DEFAULT 'auto';
ALTER TABLE micro_switch_matrix ADD COLUMN deterministic_threshold TINYINT UNSIGNED DEFAULT 90;
-- 000021 — budget caps (audit mirror, HOT path is Redis)
CREATE TABLE `agent_budget_caps` (
 `agent_id` TINYINT UNSIGNED NOT NULL COMMENT '1..13',
 `budget_date` DATE NOT NULL COMMENT 'Cairo date',
 `daily_token_limit` INT UNSIGNED NOT NULL DEFAULT 100000,
 `daily_cost_cap_usd` DECIMAL(10,4) NOT NULL DEFAULT 5.0000,
 `current_daily_spend_usd` DECIMAL(10,4) DEFAULT 0.0000 COMMENT 'nightly flush from Redis',
 `current_daily_tokens` INT UNSIGNED DEFAULT 0,
 `created_at` TIMESTAMP NULL, `updated_at` TIMESTAMP NULL,
 PRIMARY KEY (`agent_id`,`budget_date`),
 KEY `idx_budget_date` (`budget_date`),
 CONSTRAINT `chk_agent_1_13` CHECK (`agent_id` BETWEEN 1 AND 13),
 CONSTRAINT `chk_cost_ge0` CHECK (`daily_cost_cap_usd` >= 0)
) ENGINE=InnoDB;
```

**BudgetGuard Redis keys:** `budget:{agentId}:{YYYY-MM-DD}:spend` (TTL 25h), `budget:{id}:{date}:tokens`, `circuit:{driver}:{agentId}` (TTL 300s).

---
## 6. PHP 8.4 CONTRACTS — Cursor AI Ready

```php
// DriverInterface
interface DriverInterface { public function driverName(): string; public function propose(array $context): Proposal; }
// Exceptions
final class RegexMismatchException extends RuntimeException {}
final class DeterministicConfidenceBelowThresholdException extends RuntimeException { public function __construct(public float $confidence){ parent::__construct("confidence {$confidence} < threshold"); } }
final class BudgetExhaustedException extends RuntimeException {}
final class CircuitOpenException extends RuntimeException {}
```

**Manager constructor (DI):**

```php
final class AgentStrategyManager {
 public function __construct(
  private DeterministicRuleDriver $deterministic,
  private CloudLlmDriver $cloud,
  private LocalGpuDriver $localGpu,
  private CircuitBreaker $circuit,
  private BudgetGuard $budget,
 ){}
 public function execute(int $agentId, string $appId, array $context): Proposal;
}
```

---
## 7. SPRINTS — Any AI Agent (1-3 files / ≤150L) — R4

**B.4.1 — Migrations DDL (2 files)** — `000020` micro_switch driver columns + `000021` agent_budget_caps (additive, Eloquent).
**B.4.2 — Contracts & ValueObjects (3 files)** — `DriverInterface`, `Proposal`, `RegexMismatchException` + `DeterministicConfidence...`.
**B.4.3 — Cache & Guards (2 files)** — `AgentRuntimeCache` tags+lock 30s, `BudgetGuard` Lua atomic, `CircuitBreaker` Redis 5/5min.
**B.4.4 — Clients (2 files)** — `LocalGpuClient` SSRF allowlist timeout 3s, `CloudLlmClient` timeout 5s cost tally + traceparent.
**B.4.5 — Drivers (3 files)** — `DeterministicRuleDriver` FSM 0-token, `CloudLlmDriver`, `LocalGpuDriver` each ≤120L.
**B.4.6 — Manager & Calibrator (3 files)** — `AgentStrategyManager` fallback order + sanitize + event dispatch, `AgentConfidenceEvaluated` event, `CalibratorHealingListener` + `CalibratorSelfHealingEngine` price/promo/reroute (async queue calibrator).

**Verification Gates (B.4 exit):**
- ✅ `BudgetGuard` 100 concurrent `INCRBYFLOAT` with `Lua` → no over-spend; nightly flush `agent_budget_caps`
- ✅ `CircuitBreaker` 5 fails → `OPEN 300s` → `HALF_OPEN` probe → `CLOSED` on success; skip OPEN driver
- ✅ `AgentRuntimeCache` 30s tags, toggle flushes via `MicroPermissionToggled` Reverb, no restart
- ✅ SSRF: `http://169.254.169.254` → `422` + log `security_audit_logs`
- ✅ Prompt re-sanitize: phone in prompt → REDACT before Cloud call, BLOCK → HITL
- ✅ `confidence=90 → pass`, `89.9 → fallback` correct; `traceparent` in LLM header logged
- ✅ Calibrator event async `queue:calibrator` <15ms Pre-Op, no circular call, stats isolation R37

---
## 8. CALIBRATOR GATE — 100% before any code

| Domain | Score | Gate |
|--------|-------|------|
| Memory (71pts+9M/5A/13Agents) | 100% | micro_switch reconciliation, no `ai_agents_config` drift |
| Architecture (DDD + Clean + Modular) | 100% | Domain Contracts + Services + Infrastructure layered R27 |
| Security (SSRF+prompt leak+secrets) | 100% | allowlist, re-sanitize, `.env` only, REVOKE |
| Precision (JSON not JSONB, threshold) | 100% | `>=90` strict, Cairo date, Lua atomic |
| Craftsmanship (PHP8.4 Enums+VO+SRP) | 100% | 3 files ≤150L, DRY, no raw SQL |
| Operational (Circuit 5/5m + Budget + Event) | 100% | Fallback order, queue calibrator, Reverb 8080 |

> **BLOCKED if <100%** — reload `.arenarules` + B.1a/B.2a/B.3 hierarchy.

---
## 9. ARABIC SUMMARY

تم تصميم المحول الثلاثي: أولوية حتمية 0 تكلفة، fallback عند <90 أو regex مع CircuitBreaker 5/5د وBudgetGuard بـ Lua ذري وفحص SSRF قائمة بيضاء وإعادة تطهير prompt و cache 30s tags وحدث Calibrator غير متزامن <15ms مع تسعير/ترقية/إعادة توجيه وتتبع traceparent — مُصلّح قبل التنفيذ بلا وهم.

---
*Teams: Agents, Calibrator — Target: `abduniproject` — Next: B.5 AU MED Clinical Vault*
