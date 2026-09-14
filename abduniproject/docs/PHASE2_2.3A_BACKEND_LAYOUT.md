# PHASE 2.3a — Laravel PHP 8.4 Clean Architecture Layout (Arena Canonical)

> **Env:** `Arena` (`arena/01a09d54-drfifty`) | **Project:** `abduniproject` | **Arch:** Modular Monolith `app/Modules/` + DDD + Clean (3 layers: Domain→Application→Infrastructure) | **PHP:** 8.4 | **Laravel:** 12 | **Date:** 2026-09-14

## 0) Principles (from `.arenarules` + Prompt)

- **Layered SoC (Rule27):** `Presentation` (Controllers `Admin/User/Public`) → `Application` (Actions/Services) → `Domain` (Models/Repositories/Entities) → `Infrastructure` (Eloquent/Redis/S3)
- **DRY (Rule28):** Shared logic in `app/Modules/Shared/` + `app/Services/` + `app/Domain/` — zero duplication across 5 apps.
- **Rule5 Routing:** `app/Modules/{AUBusiness,AUMed,AUDeals,AUServ,AUInvest,Shared}/Http/Controllers/{Admin,User,Public}`
- **Mapping:** Prompt’s `app/Domain/` = **canonical Domain layer** shared across modules (wraps `app/Modules/Shared/Domain/` + `app/Domain/` alias) — no conflict with Modular Monolith; `app/Services/*` = deterministic engines.

---

## 1) Full Directory Tree (Production)

```
abduniproject/
├── app/
│   ├── Domain/                           # DDD Domain layer — pure business, zero framework
│   │   ├── Wallet/                       # Unified multi-currency (2.1b)
│   │   │   ├── Models/Wallet.php
│   │   │   ├── Models/WalletTransaction.php
│   │   │   ├── Repositories/WalletRepositoryInterface.php
│   │   │   └── Enums/Currency.php
│   │   ├── Escrow/                       # 3-Tier + immutability (2.1b)
│   │   │   ├── Models/EscrowClearing.php
│   │   │   ├── Repositories/EscrowRepositoryInterface.php
│   │   │   └── ValueObjects/FxSnapshot.php
│   │   ├── AUDeals/                      # Listings (2.1c)
│   │   │   ├── Models/DealCategory.php, Listing.php, DealItem.php
│   │   │   └── Repositories/ListingRepositoryInterface.php
│   │   ├── AUServ/                       # Spatial (2.1d)
│   │   │   ├── Models/ServiceProvider.php, ServiceTicket.php
│   │   │   └── Repositories/DispatchRepositoryInterface.php
│   │   ├── AUInvest/                     # Funding dispatches
│   │   │   └── Models/InvestmentOpportunity.php
│   │   ├── AUMed/                        # PG clinical (2.2d)
│   │   │   ├── Models/MedProvider.php, Appointment.php
│   │   │   └── Repositories/MedRepositoryInterface.php
│   │   ├── Workforce/                    # Digital employees (scaffold)
│   │   │   ├── Entities/Agent.php                # catalogue (13)
│   │   │   ├── Entities/TenantAgent.php          # leased instance
│   │   │   ├── Repositories/WorkforceRepositoryInterface.php
│   │   │   └── Actions/InitiateAgentOrderAction.php
│   │   │           ProvisionDigitalAgentAction.php
│   │   │           DispatchAgentTaskAction.php
│   │   └── Calibrator/                   # Gates + healing
│   │       ├── Interceptors/PreOpInterceptor.php
│   │       ├── Evaluators/SystemHealthEvaluator.php
│   │       ├── Gates/PreOpGate.php, InOpGate.php, PostOpGate.php
│   │       └── SelfHealingEngine.php
│   ├── Services/                         # Application services — deterministic first (Pillar1)
│   │   ├── Rules/                        # 100% Free deterministic (0-cost) — replaces LLM algorithmically
│   │   │   ├── DeterministicRuleEngineInterface.php
│   │   │   ├── PricingRuleEngine.php
│   │   │   ├── RankingRuleEngine.php     # 8-point badge equal weight
│   │   │   └── BarterSplitEngine.php     # 1.5x/1x 50/50
│   │   ├── Security/                     # Pillar5
│   │   │   └── RegexDataLeakDetector.php # + Interface
│   │   ├── Agents/                       # Pillar2+3 Tri-Hybrid
│   │   │   ├── AgentStrategyManager.php
│   │   │   ├── Contracts/DriverInterface.php
│   │   │   ├── Drivers/DeterministicRuleDriver.php
│   │   │   ├── Drivers/CloudLlmDriver.php
│   │   │   └── Drivers/LocalGpuDriver.php # {LOCAL_GPU_ENDPOINT}
│   │   └── Calibrator/                   # Pillar7
│   │       ├── SelfHealingEngine.php
│   │       ├── SystemHealthEvaluator.php
│   │       └── CalibratorSuite.php       # 100%→90% orchestration
│   ├── Modules/                          # Modular Monolith — bounded contexts (Rule5)
│   │   ├── AUBusiness/Http/Controllers/{Admin,User,Public}/
│   │   ├── AUMed/Http/Controllers/{Admin,User,Public}/
│   │   ├── AUDeals/Http/Controllers/{Admin,User,Public}/
│   │   ├── AUServ/Http/Controllers/{Admin,User,Public}/
│   │   ├── AUInvest/Http/Controllers/{Admin,User,Public}/
│   │   └── Shared/
│   │       ├── Http/{Middleware/CheckModuleStatus.php, Requests/, Resources/}
│   │       ├── Traits/HasAppIdScope.php
│   │       └── Enums/AppId.php
│   └── Http/
│       └── Middleware/EnsureTenantWorkforce.php, AnonymizedTelemetryMiddleware.php
├── docker/
│   └── sandboxes/                        # Isolation boundaries (ephemeral workers)
│       ├── agent-sandbox/Dockerfile      # Firecracker-like microVM for agent code exec
│       ├── code-executor/Dockerfile      # n8n/Make workflow runner (Agent 11)
│       └── docker-compose.sandbox.yml
├── database/
│   ├── schema/ (2.1a-d canonical SQL)
│   └── migrations/ (additive, Rule11)
└── routes/
    └── api/v1/{auth_wallet_escrow,deals,serv,invest,med,governance,workforce}.php
    └── channels.php (Reverb 8080)
```

**Scaffold command (Arena):**
```bash
mkdir -p app/Domain/{Wallet,Escrow,AUDeals,AUServ,AUInvest,AUMed,Workforce/{Entities,Repositories,Actions},Calibrator/{Interceptors,Evaluators,Gates}}
mkdir -p app/Services/{Rules,Security,Agents/{Contracts,Drivers},Calibrator}
mkdir -p docker/sandboxes/{agent-sandbox,code-executor}
```

---

## 2) Class Interface Contracts (PHP 8.4 — ultra-concise, strict types)

### 2.1 Domain Repositories (Domain layer — no Eloquent leak)

```php
// app/Domain/Wallet/Repositories/WalletRepositoryInterface.php
namespace App\Domain\Wallet\Repositories;
use App\Domain\Wallet\Models\Wallet;
interface WalletRepositoryInterface {
  public function findForUpdate(int $walletId): Wallet; // lockForUpdate
  public function credit(int $walletId, int $subunit, array $meta): Wallet; // +Mutex
  public function debit(int $walletId, int $subunit, array $meta): Wallet;
  public function available(int $walletId): int;
}
// app/Domain/Escrow/Repositories/EscrowRepositoryInterface.php
namespace App\Domain\Escrow\Repositories;
use App\Domain\Escrow\Models\EscrowClearing;
interface EscrowRepositoryInterface {
  public function lock(array $dto): EscrowClearing; // snapshots frozen, hash_chain
  public function release(string $uuid, ?int $milestone=null): EscrowClearing;
  public function dispute(string $uuid, array $evidence): EscrowClearing;
}
// app/Domain/Workforce/Repositories/WorkforceRepositoryInterface.php
namespace App\Domain\Workforce\Repositories;
use App\Domain\Workforce\Entities\{Agent, TenantAgent};
interface WorkforceRepositoryInterface {
  /** @return Agent[] */ public function catalogue(string $appId): array;
  public function findTenant(int $tenantAgentId, int $userId, string $appId): TenantAgent;
  public function dispatch(int $tenantAgentId, string $taskType, array $payload): string; // dispatch_uuid
}
// app/Domain/Calibrator/ (Gates)
namespace App\Domain\Calibrator\Gates;
interface GateInterface { public function evaluate(array $payload): GateResult; /* score 0-100, pass if 100 */ }
final readonly class GateResult { public function __construct(public bool $pass, public int $score, public array $details, public int $tookMs){} }
// PreOpGate <15ms, InOpGate streaming, PostOpGate audit
```

### 2.2 Workforce Actions (Application layer — single responsibility, DRY)

```php
// app/Domain/Workforce/Actions/InitiateAgentOrderAction.php
namespace App\Domain\Workforce\Actions;
final class InitiateAgentOrderAction {
  public function __construct(private WorkforceRepositoryInterface $repo, private \App\Domain\Escrow\Repositories\EscrowRepositoryInterface $escrow){}
  public function execute(int $userId, int $agentId, string $appId, string $plan, string $refUuid): array; // wallet check + escrow holding + tenant_agents active
}
// app/Domain/Workforce/Actions/ProvisionDigitalAgentAction.php
final class ProvisionDigitalAgentAction {
  public function execute(string $orderUuid): TenantAgent; // escrow released → provision swarm container
}
// DispatchAgentTaskAction — queue + Reverb
final class DispatchAgentTaskAction {
  public function execute(int $tenantAgentId, string $taskType, array $payload): string; // validates micro_switch enabled + HITL → Redis queue → private-tenant.{appId}.workforce
}
```

### 2.3 Services — Deterministic Rules (0-cost, Pillar1)

```php
// app/Services/Rules/DeterministicRuleEngineInterface.php
namespace App\Services\Rules;
interface DeterministicRuleEngineInterface { public function evaluate(array $input): RuleResult; /* confidence 0-1, deterministic */ }
final readonly class RuleResult { public function __construct(public float $confidence, public array $output, public bool $requiresHitl){} }
// Implementations: PricingRuleEngine (5% 3-Tier), RankingRuleEngine (8-point badge), BarterSplitEngine (1.5x/1x)
```

### 2.4 Security — RegexDataLeakDetector (Pillar5, 100%)

```php
// app/Services/Security/RegexDataLeakDetector.php
namespace App\Services\Security;
interface LeakDetectorInterface { public function sanitize(string $text, string $context='post_escrow'): LeakResult; }
final readonly class LeakResult { public function __construct(public string $sanitized, public array $leaks, public bool $blocked, public int $tookMs){} }
final class RegexDataLeakDetector implements LeakDetectorInterface {
  public function sanitize(string $text, string $context='post_escrow'): LeakResult; // loads data_leak_patterns where is_active && (is_strict_post_escrow_only==0 || context==post_escrow) → preg_replace → [محمي]
}
```

### 2.5 Agents — Tri-Hybrid (Pillar2+3)

```php
// app/Services/Agents/Contracts/DriverInterface.php
namespace App\Services\Agents\Contracts;
interface DriverInterface { public function run(string $capability, array $payload): DriverResult; public function name(): string; }
final readonly class DriverResult { public function __construct(public float $confidence, public array $data, public string $driver){} }
// app/Services/Agents/AgentStrategyManager.php
final class AgentStrategyManager {
  public function __construct(private DriverInterface $deterministic, private DriverInterface $cloud, private DriverInterface $local){}
  public function execute(int $agentId, string $capability, array $payload): DriverResult; // try deterministic → if confidence<0.90 fallback to cloud/local via CircuitBreaker → else HITL
}
// Drivers: DeterministicRuleDriver (0-cost), CloudLlmDriver (OpenAI), LocalGpuDriver ({LOCAL_GPU_ENDPOINT})
```

### 2.6 Calibrator — Self-Healing (Pillar7)

```php
// app/Services/Calibrator/SystemHealthEvaluator.php
interface HealthEvaluatorInterface { public function score(): HealthScore; } // 100→90
final readonly class HealthScore { public function __construct(public float $score, public array $components, public bool $shouldHeal){} }
// app/Services/Calibrator/SelfHealingEngine.php
final class SelfHealingEngine { public function heal(HealthScore $score): HealResult; /* cache:clear, queue:restart, route:cache */ }
// app/Domain/Calibrator/Interceptors/PreOpInterceptor.php — <15ms gate
final class PreOpInterceptor { public function intercept(array $payload): GateResult; }
```

### 2.7 Docker Sandboxes — Isolation Boundaries

```dockerfile
# docker/sandboxes/agent-sandbox/Dockerfile — ephemeral, no net, read-only FS
FROM php:8.4-cli-alpine
RUN adduser -D sandbox && mkdir /workspace && chown sandbox /workspace
USER sandbox
WORKDIR /workspace
# Seccomp + AppArmor + --network=none + --read-only + --tmpfs /tmp
```

```yaml
# docker/sandboxes/docker-compose.sandbox.yml (prod Swarm ephemeral)
services:
  agent-sandbox:
    image: abduni/agent-sandbox:php84
    deploy: {replicas: 0} # spawned via Redis queue, self-terminate
    read_only: true
    tmpfs: [/tmp]
    networks: [isolated]
```

---

## 3) Compliance Map

| Rule | Cover |
|------|-------|
| 27 SoC | Domain (pure) → Services (rules) → Modules/Controllers (thin) |
| 28 DRY | Shared Domain + Services reused across 5 apps |
| 29 YAGNI | Only listed engines, no extra abstractions |
| 30 SRP | One Action per use-case (Initiate/Provision/Dispatch) |
| 6 Zero Trust | Regex detector + AES-GCM in Domain models |
| 11 Additive | Migrations additive, sandbox read-only |

---

**ملخص عربي:** هيكل باك إند نظيف بجاهزية إنتاج — طبقات DDD ثلاث (Domain/Services/Modules) مع محركات حتمية مجانية 0 تكلفة، وكاشف تسريب Regex، ومدير استراتيجية ثلاثي (حتمي/سحابي/محلي)، ومعاير شفاء ذاتي وبوابات Pre/In/Post-Op، وحدود عزل Docker للتنفيذ الآمن.

*Next: [PROMPT 2.3b] Frontend + Security Vault*
