# PHASE 2.3f — 20 Micro-Sprints Roadmap — AU Lite Enhanced (Arena Canonical)

> **Env:** `Arena` (`arena/01a09d54-drfifty`) | **Rule:** 1-3 files / ≤150 lines per sprint (LLM 100% no hallucination) | **Date:** 2026-09-14 | **Source:** Consolidation of 2.1a-d + 2.2a-f + 2.3a-e (15 specs) → 20 atomized sprints

## 0) Principles (from `.arenarules` + Pillars)

- **Deterministic-First:** Micro-Sprints 3.x تسبق أي LLM — `DeterministicRuleEngine` يُبنى أولًا (Pricing/Ranking/Barter = 0 cost) ثم `Tri-Hybrid` 9.x.
- **AU Lite Hibernation:** كل Sprint يحمل `feature_flags` + `CheckModuleStatus` + `micro_switch_matrix` — `POST /governance/modules/toggle` بدون deploy.
- **File Boundary:** كل Sprint يمس `1-3 ملفات` كحد أقصى مع `Header + Scope + Lines` محددة لمنع التجاوز.
- **Idempotence:** كل Migration `IF NOT EXISTS`, كل Action `Idempotency-Key`, كل Worker `self-terminate`.
- **RTL + 0.0.0.0 + Reverb 8080 + MySQL JSON (لا JSONB) enforced.**

---

## 1) Consolidated Roadmap — 10 Phases × 2 Sprints = 20

| Sprint | Title | Files (1-3) | Lines | Depends | Core Deliverable |
|--------|-------|-------------|-------|---------|------------------|
| **1.1** | Canonical Bootstrap | `composer.json`, `.env.example`, `vite.config.ts` | ≤120 | — | Laravel 12 PHP8.4 + React19 Inertia v2 + Vite 0.0.0.0 |
| **1.2** | Shared Kernel & AppIds | `app/Modules/Shared/Enums/AppId.php`, `app/Modules/Shared/Traits/HasAppIdScope.php`, `app/Http/Middleware/CheckModuleStatus.php` | ≤130 | 1.1 | `ab_,amed_,adl_,asv_,ainv_` + 503 hibernation |
| **2.1** | Auth RBAC Schema A | `database/schema/2.1a_auth.sql`, `2026_09_14_000010_auth.php` | ≤150 | 1.2 | `users,roles,permissions,role_permissions` InnoDB utf8mb4 |
| **2.2** | Auth RBAC Schema B + AU Lite Flags | `database/seeders/RbacSeeder.php`, `Types/index.ts` (auth types) | ≤110 | 2.1 | `micro_switch_matrix, feature_flags(AU Lite), data_leak_patterns, refresh_tokens` + silent rotation types |
| **3.1** | **Deterministic Engine First — Rules** | `app/Services/Rules/DeterministicRuleEngineInterface.php`, `app/Services/Rules/PricingRuleEngine.php` | ≤140 | 1.2 | `Pricing 5% 3-Tier` + `RuleResult{confidence}` — 0 cost before any LLM |
| **3.2** | Deterministic Enums + Barter | `app/Services/Rules/RankingRuleEngine.php`, `app/Services/Rules/BarterSplitEngine.php` | ≤130 | 3.1 | `8-point badge + 1.5x/1x 50/50` — deterministic complete |
| **4.1** | Wallet & Escrow Schema | `database/schema/2.1b_wallet.sql`, `2026_09_14_000011_wallet.php` | ≤150 | 3.1 | `app_wallets(CHECK≥0), exchange_rates, escrow_clearings, deal_exchange_snapshots` |
| **4.2** | Wallet Triggers + AU Deals Schema | `database/schema/2.1c_deals.sql`, `2026_09_14_000012_deals.php` | ≤150 | 4.1 | `deals_listings POINT+FULLTEXT ngram + 5 tables + trigger immutability` |
| **5.1** | AU SERV Spatial Schema | `database/schema/2.1d_serv.sql`, `2026_09_14_000013_serv.php` | ≤150 | 4.2 | `service_providers POINT/POLYGON SRID4326 x4 SPATIAL` |
| **5.2** | Auth & Financial APIs | `routes/api/v1/auth_wallet_escrow.php`, `app/Modules/AUBusiness/Http/Controllers/User/AuthController.php` | ≤140 | 2.2,4.1 | 9 endpoints `login|refresh|balance|escrow/lock` + JWT 15m/HttpOnly 7d |
| **6.1** | AU DEALS APIs | `routes/api/v1/deals.php`, `app/Modules/AUDeals/Http/Controllers/User/ListingController.php` | ≤130 | 4.2 | 7 endpoints `POST listings + FULLTEXT feed + stagnant` |
| **6.2** | SERV/INVEST + AU MED APIs | `routes/api/v1/serv.php`, `routes/api/v1/med.php` | ≤150 | 5.1 | 4+4 endpoints + `presence-dispatch-{region}` + hash-only anonymized |
| **7.1** | Governance & Calibrator APIs | `routes/api/v1/governance.php`, `app/Modules/Shared/Http/Controllers/Admin/GovernanceController.php` | ≤140 | 2.2 | 8 endpoints `toggle|leak-check|health-score|kill-switch|hitl` |
| **7.2** | Workforce Marketplace APIs | `routes/api/v1/workforce.php`, `routes/channels.php` | ≤130 | 7.1 | 4 endpoints `agents|checkout|dispatch` + `private-tenant.{app_id}.workforce` |
| **8.1** | Backend Clean Arch DDD | `app/Domain/Wallet/Repositories/WalletRepositoryInterface.php`, `app/Services/Security/RegexDataLeakDetector.php` | ≤120 | 1.2 | `Domain/* + Services/* + docker/sandboxes` — 8 contracts |
| **8.2** | Frontend Layout + HQ Widgets | `resources/js/Stores/useCalibrator.ts`, `resources/js/Components/Calibrator/PerformanceGauge.tsx` | ≤150 | 7.1 | Zustand + 4 widgets `Gauge, RedButton, Matrix, HitlInbox` + Guards |
| **9.1** | **Module 8 — Workforce Marketplace & Master Factory** | `app/Services/Agents/MasterWorkforceFactory.php`, `app/Domain/Workforce/Actions/ProvisionDigitalAgentAction.php` | ≤130 | 7.2,8.1 | `AgentStrategyManager` + `memory bounds + persona` per 13 agents |
| **9.2** | **Tri-Hybrid & Docker** | `app/Services/Agents/Contracts/DriverInterface.php`, `docker-compose.prod.yml` (delta) | ≤150 | 8.1,9.1 | `Deterministic→Cloud→LocalGpu({LOCAL_GPU_ENDPOINT}) + CB 5/5min + 10 services + 4 networks` |
| **10.1** | Ephemeral Swarms & Proactive Loops | `app/Services/Swarm/EphemeralWorker.php`, `app/Services/Proactive/SecurityLoop.php` | ≤140 | 9.2 | `Redis LPUSH → SwarmSpawner --max-time 3600 + Security/Legal/Refactor loops` |
| **10.2** | Calibrator Interceptors & Self-Healing | `app/Services/Calibrator/SelfHealingEngine.php`, `app/Domain/Calibrator/Gates/PreOpGate.php` | ≤130 | 10.1 | `Pre-Op <15ms + In-Op + Post-Op + heal<90% cache:clear/horizon:terminate/recycle` |

**Total:** 20 sprints × avg 2 files × avg 130 lines = **~40 files / ~2600 lines** — atomized no hallucination.

---

## 2) File Boundary Detail — Deterministic First + AU Lite

**Sprint 3.1 — Deterministic First (Example):**

```php
// app/Services/Rules/DeterministicRuleEngineInterface.php — 18 lines
interface DeterministicRuleEngineInterface { public function evaluate(array $input): RuleResult; }
final readonly class RuleResult { public function __construct(public float $confidence, public array $output, public bool $requiresHitl){} }

// app/Services/Rules/PricingRuleEngine.php — 62 lines
final class PricingRuleEngine implements DeterministicRuleEngineInterface {
  public function evaluate(array $i): RuleResult {
    $tier=$i['tier']??'standard'; $pct=['premium'=>0.03,'standard'=>0.05,'basic'=>0.07][$tier]??0.05;
    return new RuleResult(0.99, ['commission'=>$i['amount']*$pct,'pct'=>$pct], false);
  }
}
```

**AU Lite Injection (every API sprint 5.2→7.2):**

```php
// In every Controller __construct:
public function __construct(){ $this->middleware(CheckModuleStatus::class.':au_deals'); }
// CheckModuleStatus: if feature_flags[au_lite]==enabled && is_hibernated → 503 {code: module_hibernated}
```

---

## 3) Module 8 Deep — Sprints 9.1-9.2

**9.1 Marketplace + MasterWorkforceFactoryAgent (Agent 12):**

```php
// app/Services/Agents/MasterWorkforceFactory.php — 38 lines
final class MasterWorkforceFactory {
  public function configure(int $agentId, string $cap, array $p): array {
    $agent=DB::table('agents')->find($agentId);
    return ['memoryMb'=>match($agent->tier){'premium'=>1024,default=>512}, 'systemPrompt'=>"You are {$agent->slug} — {$cap}...", 'maxTokens'=>2048];
  }
}
// app/Domain/Workforce/Actions/ProvisionDigitalAgentAction.php — 42 lines
final class ProvisionDigitalAgentAction { public function execute(string $orderUuid): TenantAgent { /* escrow released → swarm container */ } }
```

**Verifier:** `POST /api/v1/workforce/checkout` → `wallet debit + escrow + MasterWorkforceFactory.configure()` → `private-tenant.{app_id}.workforce` streaming.

---

## 4) Calibrator Interceptors — Sprint 10.2

| Gate | Timing | Contract | Heal |
|------|--------|----------|------|
| **Pre-Op** | <15ms sync before `AgentStrategyManager` | `PreOpGate::evaluate(payload)-> GateResult{pass, score}` | `cache:clear` if leak |
| **In-Op** | streaming during driver `run()` | `InOpGate::stream(chunk)-> confidence delta` | `CircuitBreaker recordFailure` if drift |
| **Post-Op** | async after `DriverResult` | `PostOpGate::audit(result)-> HealDecision{price_adjust|reroute|hitl}` | `SelfHealingEngine.heal()` |

```php
// app/Domain/Calibrator/Gates/PreOpGate.php — 28 lines
final class PreOpGate implements GateInterface {
  public function evaluate(array $p): GateResult {
    $t=microtime(true); $ok=!app(RegexDataLeakDetector::class)->sanitize(json_encode($p), 'pre_op')->blocked;
    return new GateResult($ok, $ok?100:60, ['leak'=>!$ok], (int)((microtime(true)-$t)*1000)); // <15ms
  }
}
// app/Services/Calibrator/SelfHealingEngine.php — 54 lines
final class SelfHealingEngine {
  public function heal(HealthScore $s): HealResult {
    if(!$s->shouldHeal) return new HealResult(false,[]);
    Artisan::call('cache:clear'); Artisan::call('horizon:terminate');
    Http::post('http://docker-socket/services/abduniproject_worker/update',['force_update'=>1]);
    event(new CalibratorHealed($s,['cache:clear','horizon:terminate','recycle']));
    return new HealResult(true,['cache:clear','horizon:terminate','recycle']);
  }
}
```

**Self-Healing Workflow (10.2):** `SystemHealthEvaluator(100→90%)` every 5m → if `<90` → `queue calibrator` → `EphemeralWorker` → `SelfHealingEngine.heal()` → `Reverb private-calibrator` → `PerformanceGauge` 87→95%.

---

## 5) Execution Order & AU Lite Hibernation Map

```
Sprint 1.1-1.2  → 2.1-2.2 (RBAC + AU Lite seeds) → 3.1-3.2 (Deterministic 0-cost FIRST) → 4.1-5.1 (Schemas) → 5.2-7.2 (APIs with CheckModuleStatus) → 8.1-8.2 (Clean Arch + UI) → 9.1-9.2 (Module 8 + Tri-Hybrid + Docker) → 10.1-10.2 (Swarms + Calibrator Gates self-heal)
```

**AU Lite Toggleable Modules (hibernate instantly):**

| Module | Flag key | is_core |
|--------|----------|---------|
| AU DEALS | `au_deals` | false |
| AU SERV | `au_serv` | false |
| AU INVEST | `au_invest` | false |
| AU MED | `au_med` | false |
| Workforce | `workforce` | false |
| AU BUSINESS | `ab_core` | **true** (never hibernate) |

`POST /governance/modules/toggle {module: au_deals, is_hibernated: true}` → `feature_flags` update → `Cache::forget + Reverb` → next request `503 module_hibernated` without deploy.

---

## 6) Verification Matrix (per Sprint)

Each sprint ends with `php artisan test --filter=SprintX` + `curl` + `Reverb` check:

- `1.1`: `php -v` 8.4 + `vite build` OK
- `3.1`: `PricingRuleEngine evaluate 100 → confidence 0.99`
- `5.2`: `POST /auth/login → 200 + refresh cookie HttpOnly`
- `6.2`: `POST /au-med/appointments {hash} → 201, raw → 422`
- `7.2`: `POST /workforce/dispatch → private-tenant.* workforce event`
- `8.2`: `PerformanceGauge renders 100%`
- `9.1`: `MasterWorkforceFactory memory 512/1024`
- `10.2`: `health 87 → heal → 95 + Reverb`

---

**ملخص عربي:** خارطة 20 سبرنت ذرّية — المحرك الحتمي أولًا، كل سبرنت 1-3 ملفات ≤150 سطر، AU Lite للسبات الفوري، الوحدة 8 (سوق العمالة + المصنع الرئيسي) في 9.1-9.2، وبوابات المعاير الثلاث + الشفاء الذاتي في 10.1-10.2.

*Phase 2 COMPLETE — Next: Implementation per Sprint 1.1*
