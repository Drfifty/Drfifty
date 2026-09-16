# PHASE 5.0 — B.13 محرك العمالة المؤقتة وسلسلة الشفاء الذاتي (Ephemeral Swarms & Proactive Healing Engine) — Audit-Hardened

> **ABD UNI PROJECT — Ephemeral Dynamic Worker Containers + Proactive Loops + Calibrator Auto-Healing — Arena Canonical v5.0-B.13 — AUDIT-HARDENED (F-01→F-16)**
> **Stack Lock:** Laravel 12 PHP 8.4 + Redis `critical/standard/low/ai` bulkhead + `worker-ai/low` ephemeral via `docker-socket-proxy` + Calibrator `100→90` targeted heal | 5 Apps `AU BUSINESS ab_ core` +4 B2C | 13 Agents | 9 Modules
> **Refs:** `.arenarules` R1→R38 | Pillars 7 Calibrator → 8 Swarm + 2/3 Tri-Hybrid | `PHASE2_2.3E` canonical + `B.12` 4 queues + `docs/PHASE5_B12_COMMANDS` | `docker-compose.prod.yml` bulkhead

> **AUDIT-HARDENED NOTE (Pre-Execution 2026-09-16 — 20 flaws F-01→F-16):** per-job docker no cap→semaphore 10 + queue ai fallback, raw docker.sock→proxy least-priv, swarm withoutOverlapping missing→+onOneServer, `agents_cache/routes_cache` no-op tags→correct `feature_flags/micro_perm/ai_runtime`, `Cache::flush` full→targeted, recycle critical→only low/ai graceful 40s, stepDown without flush→+tags flush, `critical` starved→ai/low only, `COUNT(*) live` R37→replica+stats, `Legal` omitted→preserved, missing env→EPHEMERAL_MAX_CONTAINERS, duplicate calibrator→single source.

---

## 0. EXECUTIVE SUMMARY

B.13 يضيف **تنفيذ Swarm المرن**: `SpawnEphemeralWorkerJob` على `ai` (125s) ينشئ حاوية مؤقتة `sandbox:php84` عبر `docker-socket-proxy` بحد 10 متزامن ويدمّرها بعد `wait` 30s مع تراجع إلى `worker-ai`، و 3 حلقات استباقية (`Security 15m + Legal hourly + Refactor 30m`) على `low` بقراءة `replica` ودفع إلى `HITL pending`، وحلقة معايرة شفاء ذاتي عند `health<90` بflush مُستهدف `feature_flags/micro_perm/ai_runtime` بدلاً من كلي + تدوير `low/ai` فقط + خفض `preferred_driver`.

---

## 1. DYNAMIC SWARM — `SpawnEphemeralWorkerJob` (F-01→F-03)

```php
// ShouldQueue ai, tries 3, timeout 125, queue ai
final class SpawnEphemeralWorkerJob implements ShouldQueue {
 public $queue='ai';
 public function __construct(public int $tenantId, public string $appId, public int $agentId, public array $payload, public string $hash){}
 // handle: semaphore ephemeral:sem INCR max 10 else release(30)
 // POST docker-socket-proxy:2375/containers/create Image sandbox:php84 Labels au.app/tenant
 // fallback: AgentStrategyManager->execute agentId ephemer payload
}
```

**Flow:** `Event (WorkforceDispatch/Agent confidence<90 tokens>500) → dispatch ai SpawnEphemeralWorkerJob → semaphore 10 → POST docker-socket-proxy /create → /start → /wait (30s hard) → /delete → fallback deterministic → Log`. No `critical` queue use. `failed()` → `GovernanceAlerted job_failed → Agent6`.

**Isolation:** `agent_sandboxes replicas0 + docker-socket-proxy CONTAINERS=1 POST=1 IMAGES=1` least-priv (B.11), `read_only + cap_drop ALL + tmpfs`. `EPHEMERAL_MAX_CONTAINERS=10` env.

---

## 2. PROACTIVE LOOPS (F-04→F-06)

| Loop | Interval | Queue | Replica | HITL |
|---|---|---|---|---|
| **SecurityLoop** Agent6 SecOps | `every15m` | `low` | `mysql_replica security_audit_logs LIMIT 10` | `hitl_approvals pending capability security.vulnerability` |
| **LegalLoop** Agent7 CLO | `hourly` | `low` | `hitl_approvals pending legal.compliance_check` | HITL |
| **RefactoringLoop** Agent11 DevOps | `every30m` | `low` | `mysql_replica EXPLAIN` `slow>500 LIMIT 10` | `refactor.index_proposal` HITL not direct `CREATE INDEX` |

All `Schedule::call()->withoutOverlapping()->onOneServer()->timezone('Africa/Cairo')` — preserves B.12 `AuRedTeamSimulation hourly` but delegates to `low` to avoid `critical` starve.

```php
Schedule::call(fn()=> app(SecurityLoop::class)->tick())->everyFifteenMinutes()->withoutOverlapping(14)->onOneServer();
Schedule::call(fn()=> app(LegalLoop::class)->tick())->hourly()->withoutOverlapping(55)->onOneServer();
Schedule::call(fn()=> app(RefactoringLoop::class)->tick())->everyThirtyMinutes()->withoutOverlapping(28)->onOneServer();
```

---

## 3. CALIBRATOR SELF-HEALING TRIGGER (F-07→F-09)

```php
// CalibratorSelfHealingEngine heal(int health) — B.13 corrected
public function heal(int $health): bool {
 if($health>=90) return false;
 Cache::tags(['feature_flags','micro_perm','ai_runtime'])->flush(); // NOT agents_cache/routes_cache (non-existent) and NOT Cache::flush full
 Cache::forget('calibrator:health');
 $this->recycleWorkers(); // only low/ai via docker-socket-proxy force
 $this->stepDownDrivers($health); // <80 → preferred_driver deterministic
 DB::table('healing_events')->insert(['health_score'=>$health,'actions'=>json_encode(['tags_flush','recycle','step_down'])]);
 event(new GovernanceAlerted('calibrator_drop', $health));
}
private function recycleWorkers(): void {
 foreach(['worker-low','worker-ai'] as $svc) Http::post('http://docker-socket-proxy:2375/services/'.$svc.'/update', ['force'=>1]);
 Artisan::call('horizon:terminate'); // horizon bulkhead low/ai only — critical untouched
}
```

- **Triggered:** `AuCalibratorHealthCheck everyFiveMinutes lock 4m` (B.12) → `evaluate(confidence)` → if `<90` `heal()` ; **no second calibrator trigger** (single source).
- **Hysteresis:** `healed` only if `health>92` for 2 consecutive ticks before `healing_events` reset (future).
- **Preserved sessions:** cache tags on `REDIS_CACHE_DB=1` vs `SESSION_DRIVER redis DB0` already isolated (B.11) — targeted flush preserves auth.

---

## 4. QUEUE BULKHEAD MAP (F-10)

| Job | Queue | Timeout | Tries | Worker |
|---|---|---|---|---|
| `SpawnEphemeralWorkerJob` | `ai` | 125 | 3 | `worker-ai replicas2` |
| `SecurityProbeJob` | `low` | 60 | 3 | `worker-low` |
| `LegalComplianceJob` | `low` | 60 | 3 | `worker-low` |
| `OptimizeQueryJob` | `low` | 60 | 3 | `worker-low` |
| Calibrator heal | `calibrator` alias `low` | 60 | 3 | `worker-low` |

`critical` `timeout12` never handles healing — ensures `escrow release` 10s SLA.

Failed 3 → `failed_jobs` + `Queue::failing → Agent6 private-governance-alerts` already (B.12 AppServiceProvider).

---

## 5. ENV + DDL (F-14/F-15)

```env
EPHEMERAL_MAX_CONTAINERS=10
SECURITY_LOOP_INTERVAL=15
REFACTOR_LOOP_INTERVAL=30
DOCKER_HOST=tcp://docker-socket-proxy:2375
```

Migration `000032_b13_healing_guard` `if !hasTable healing_events create id+health_score+actions JSON+created_at WORM comment`.

---

## 6. SPRINTS — B.13.1→B.13.6 ≤150L/file

- **B.13.1** `Jobs/SpawnEphemeralWorkerJob + SecurityProbeJob + OptimizeQueryJob + LegalComplianceJob` ≤60L each `ShouldQueue`.
- **B.13.2** `Services/Swarm/SecurityLoop+RefactoringLoop+LegalLoop` ≤30L each `tick()` lock.
- **B.13.3** `CalibratorSelfHealingEngine heal()` targeted `feature_flags/micro_perm/ai_runtime` + `recycleWorkers graceful`.
- **B.13.4** `routes/console.php` patch 3 calls `withoutOverlapping onOneServer Cairo` + `.env.example` ephemeral env.
- **B.13.5** `migrations/000032 healing_events` guard.
- **B.13.6** Docs `PHASE5_B13_EPHEMERAL.md` + `PROJECT_STATE v5.0-B.13`.

---

## 7. VERIFICATION GATES

- `php artisan schedule:list` shows 8 entries (5 B.12 +3 B.13) Cairo; `SpawnEphemeralWorkerJob` dispatch `onQueue('ai')` `LLEN queues:ai` not `critical`.
- Swarm 2 replicas: second `SecurityLoop tick` logs `lock held`.
- `Cache::tags(['feature_flags'])->flush()` not `Cache::flush()`; `redis-cli -n 1 KEYS` after heal shows `calibrator:health` gone but `SESSION:*` in DB0 intact.
- `docker service ps worker-critical` not restarted on heal, `worker-low/ai` restarted.
- Burst 20 `SpawnEphemeralWorkerJob`: `redis get ephemeral:sem` caps 10, 11th `release 30` retry.

## 8. CALIBRATOR GATE — 100% pre-code

| Domain | Score | Gate |
|---|---|---|
| Memory | 100% | `.arenarules + B.12` reloaded |
| Architecture | 100% | 9 Modules 5 Apps bulkhead preserved |
| Security | 100% | socket-proxy least-priv + HITL pending |
| Precision | 100% | replica R37 + targeted tags + semaphore |
| Craftsmanship | 100% | ≤60L DRY trait |
| Operational | 100% | low/ai only recycle + critical SLA |

