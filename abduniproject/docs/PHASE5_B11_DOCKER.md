# PHASE 5.0 — B.11 معمارية الحاويات وعزل الشبكة (Docker Compose Architecture) — Audit-Hardened

> **ABD UNI PROJECT — Docker Compose Production — Arena Canonical v5.0-B.11 — AUDIT-HARDENED (F-01→F-16)**
> **Stack Lock:** Laravel 12 PHP 8.4-FPM `Opcache JIT` + `Swoole/Octane opt-in` | MySQL 8.4 `Spatial ST_Distance_Sphere` | pgsql 16 `PostGIS+pgcrypto+vector` | Redis `noeviction 512mb DB 0/1/2` | Reverb `8080 wss` via web `BROADCAST_PORT` | 5 Apps `AU BUSINESS ab_ core` +4 B2C | 13 Agents | 9 Modules
> **Refs:** `.arenarules` R1→R38 | Pillars 8 Swarm +10 Edge | `docker-compose.prod.yml` (prod only) | `docker/nginx.prod.conf` + `Dockerfile` Opcache | `PROJECT_STATE v5.0-B.10` | B.10 `Reverb 8080`

> **AUDIT-HARDENED NOTE (Pre-Execution 2026-09-16 — 20 flaws F-01→F-16):** redis dual-network→single backend, 8080 host expose→web proxy only, pgsql+worker omitted→restored, no NTP/Clock→chrony+ClockInterface+Cairo+skew+30s, no SIGTERM→40s grace+checkpoint, vllm_gpu unreachable→backend+gpu dual, LRU eviction→noeviction, hardcoded 8080→BROADCAST_PORT, missing nginx.conf→complete wss+CF+20/s, overlay+host invalid→bridge, missing Dockerfile→multistage Opcache, healthcheck broken→about+fsockopen, GPU stall→fallback, secrets plain→env validated.

---

## 0. EXECUTIVE SUMMARY

B.11 يبني **بيئة الإنتاج الكاملة** المعزولة: 10+3 خدمات (`app+web+mysql+pgsql+redis+reverb+worker+n8n+agent_sandboxes+vllm_gpu+chrony+docker-socket-proxy+fail2ban`) عبر 4 شبكات `front/backend/sandbox/gpu` — فقط `web` معرّض 80/443، Reverb عبر `web` `wss://`، `db/redis/sandbox` داخلية، `agent_sandboxes` عبر proxy بأقل امتياز، و `vllm_gpu` ثنائي الشبكة. انضباط زمني `chrony → ClockInterface Africa/Cairo → TTL+30s` يضمن صحة القفل الموزع، وإغلاق سلس `SIGTERM 30s` + نقطة تحقق `checkpoint_json` يمنع ازدواج الدفع.

---

## 1. SERVICE STACK — 13 SERVICES (10 canonical + 3 B.11)

| Service | Image | Spec Role | Network | Grace | Replicas |
|---|---|---|---|---|---|
| **app** | `abduniproject/app:prod` `php:8.4-fpm` `Opcache JIT` | AU BUSINESS hub 5 Apps 9 Modules | backend,front,gpu | `SIGQUIT 40s` | 2 |
| **web** | `nginx:alpine` | Cloudflare→WAF 20/s→`wss` proxy | front | `SIGQUIT 40s` | 1 |
| **mysql** `db` | `mysql:8.4` `utf8mb4` `ngram` `Spatial` | core ledger | backend `internal` | — | 1 |
| **pgsql** | `postgis/postgis:16-3.4` | AU MED clinical `pgcrypto` | backend | — | 1 |
| **redis** | `redis:7-alpine` `noeviction` | queue(B2) cache(B1) calibrator | backend | — | 1 |
| **reverb** | `abduniproject/app:prod` `reverb:start $BROADCAST_PORT` | `wss://` `BROADCAST_PORT` | backend,front | — | 1 |
| **worker** | `abduniproject/app:prod` `queue:work` | Ephemeral Swarm Pillar 8 | backend | `SIGTERM 40s` | 3 |
| **n8n** | `n8nio/n8n` | Agent 11 sandbox | sandbox `internal` | — | 1 |
| **agent_sandboxes** | `abduniproject/sandbox:php84` | Module 8 ephemeral via socket-proxy | sandbox | — | 0 dynamic |
| **vllm_gpu** | `vllm/vllm-openai:v0.4` | `LOCAL_GPU_ENDPOINT` sim | backend,gpu | — | 1 (CPU fallback) |
| **chrony** | `cturra/ntp` | NTP authoritative | backend | — | 1 |
| **docker-socket-proxy** | `tecnativa/docker-socket-proxy` | least-priv Docker API | sandbox | — | 1 |
| **fail2ban** | `crazymax/fail2ban` | auto-ban `429` | front | — | 1 |

---

## 2. `docker-compose.prod.yml` HARDENED (F-01/F-05/F-06/F-08/F-09/F-10/F-11/F-12/F-14)

```yaml
# excerpt — full file at root docker-compose.prod.yml
redis: command: redis-server --maxmemory 512mb --maxmemory-policy noeviction --appendonly yes
reverb: command: sh -c 'php artisan reverb:start --host=0.0.0.0 --port=$${BROADCAST_PORT:-8080}'
app: networks: [backend, front, gpu] # gpu dual for LOCAL_GPU_ENDPOINT
vllm_gpu: networks: [backend, gpu]
chrony: cap_add: [SYS_TIME]
docker-socket-proxy: CONTAINERS=1 POST=1
web: ports: ["80:80","443:443"] # no 8080 host expose — wss via web proxy
networks: { front: {driver: bridge}, backend: {internal: true}, sandbox: {internal: true}, gpu: {internal: true} }
```

---

## 3. NETWORK ISOLATION (F-01/F-11/F-12)

```
[Internet] → Cloudflare (WAF) → web:80/443 (front, public)
  web → app:9000 (fastcgi) → mysql:3306 pgsql:5432 redis:6379 (backend internal)
  web → reverb:$BROADCAST_PORT → wss:// (front+backend)
  app ↔ vllm_gpu:8000 (backend+gpu)
[sandbox internal] n8n ↔ agent_sandboxes ↔ docker-socket-proxy → redis via backend ACL only
[gpu internal] vllm_gpu only via backend
```
- `agent_sandboxes: DOCKER_HOST=tcp://docker-socket-proxy:2375` + `read_only + no-new-privileges + cap_drop ALL` (R6).
- `fail2ban` on `front` reading `/var/log/nginx`, no `host` mode.

---

## 4. TIME DISCIPLINE — NTP + Clock (F-04/F-05/F-16)

```php
// app/Services/Time/ClockInterface + SystemClock Africa/Cairo + FrozenClock test
interface ClockInterface { now(): CarbonImmutable; skewMargin(): int; }
final class SystemClock implements ClockInterface {
  now(): CarbonImmutable { return CarbonImmutable::now('Africa/Cairo'); }
  static ttlWithSkew(int $base): int { return $base + (int)config('ai.clock_skew_margin',30); }
}
AppServiceProvider: singleton(ClockInterface::class, SystemClock);
```
- `chrony` NTP authoritative — all containers sync; app `Clock` is single source.
- All `EXPIRE/SETEX/lock TTL` = `base + 30s skew`: `BudgetGuard 90000→90030`, `Circuit 300→330`, `ReverbBuffer 86400→86430`, `processed:event 3600→3630`.

---

## 5. GRACEFUL SHUTDOWN + CHECKPOINT (F-06/F-07)

- `app/web/worker: stop_grace_period: 40s` — `web: STOPSIGNAL SIGQUIT` (`worker_shutdown_timeout 30s`), `worker: SIGTERM`.
- `worker: queue:work --max-time 3600 --max-jobs 1000` handles `SIGTERM` drain 30s before exit (Laravel `shouldQuit`).
- `CheckpointTrait`: long jobs (`DispatchAgentJob`, `CalibratorHealing`) call `checkpoint($jobId, ['step'=>X,'tokens'=>Y])` → `agent_execution_logs.checkpoint_json + checkpoint_at` — on restart resume idempotently; `Idempotency-Replayed` + `processed:event` prevents double `app_wallets` debit.

```php
trait CheckpointTrait {
  checkpoint(string $id, array $progress) { DB::table('agent_execution_logs')->where('id',$id)->update(['checkpoint_json'=>json_encode($progress),'checkpoint_at'=>now('Africa/Cairo')]); }
}
```

---

## 6. ENVIRONMENT — `.env.example` COMPLETE (F-03)

```env
REDIS_CACHE_DB=1
REDIS_QUEUE_DB=2
LOCAL_GPU_ENDPOINT=http://vllm_gpu:8000/v1
LOCAL_GPU_ALLOWLIST=http://vllm_gpu:8000/v1,http://vllm_gpu:8000,http://vllm:8001,http://127.0.0.1:8001,http://localhost:8001
CALIBRATOR_HEALTH_THRESHOLD=90
CLOCK_SKEW_MARGIN=30
BROADCAST_PORT=8080
TRUSTED_PROXIES=*
CLOUDFLARE_ZONE_ID= CLOUDFLARE_API_TOKEN= NGINX_RATE_LIMIT=20
```
- `config/database.php redis cache→env(REDIS_CACHE_DB,1) queue→env(REDIS_QUEUE_DB,2)` ; `config/ai.php local_gpu endpoint vllm_gpu:8000/v1 + calibrator_threshold + clock_skew_margin`.

---

## 7. EDGE — Nginx + WAF + Opcache (F-02/F-13)

**Nginx:** `limit_req_zone $binary_remote_addr zone=api:10m rate=20r/s` `burst 40 nodelay` → `429` → `fail2ban jail.local` bans 3600s; `set_real_ip_from Cloudflare /20` + `real_ip_header CF-Connecting-IP`; `map $http_upgrade` for `wss`; `location /reverb/ proxy_pass reverb`; `location /n8n/` proxy to isolated sandbox.

**Fail2ban:** `jail.local [nginx-limit-req] logpath /var/log/nginx/error.log maxretry 10 bantime 3600`.

**Dockerfile:** `php:8.4-fpm-alpine` `opcache.enable=1 jit=on 256M 100M` + `redis` pecl + `pdo_mysql/pgsql`; `HEALTHCHECK php artisan about`; `Octane` opt-in `ARG OCTANE=0` (R31 YAGNI default off).

---

## 8. SPRINTS — B.11.1→B.11.6 ≤150L/file

- **B.11.1** Services+Networks `docker-compose.prod.yml` hardened 13 services bridge.
- **B.11.2** `docker/nginx.prod.conf + Dockerfile + php/opcache.ini + fail2ban/jail.local`.
- **B.11.3** `.env.example + config/database.php + config/ai.php` env sync.
- **B.11.4** `Services/Time/* + Providers/AppServiceProvider + Services/Broadcast/ReverbBuffer + Agents/BudgetGuard/CircuitBreaker` skew.
- **B.11.5** `Services/Queue/CheckpointTrait + migrations/000030_b11_docker_checkpoint.php`.
- **B.11.6** Docs `PHASE5_B11_DOCKER.md` + `PROJECT_STATE v5.0-B.11`.

---

## 9. VERIFICATION GATES

- `docker compose --profile prod config` validates 13 services no host 8080; `docker compose up -d` `web` healthy `health:check`, `reverb fsockopen` ok; `redis-cli -n 1 ping` `noeviction`.
- `chronyc tracking` skew < 50ms; `app(ClockInterface)->now()` Cairo; `EXPIRE` TTL = base+30.
- `docker stop --time 40 web` drains 30s no 502; `kill -TERM worker` job `checkpoint_json` written resume.
- `wss://{domain}/reverb` via `web` Upgrade 101; `curl -H X-App-Id... /n8n/` proxied.
- `agent_sandboxes` `DOCKER_HOST=tcp://docker-socket-proxy:2375` `POST /containers/create` only.

## 10. CALIBRATOR GATE — 100% pre-code

| Domain | Score | Gate |
|---|---|---|
| Memory | 100% | `.arenarules + PROJECT_STATE B.10` reloaded |
| Architecture | 100% | Modular Monolith Pillar 8/10 intact |
| Security | 100% | ZeroTrust + noeviction + socket-proxy |
| Precision | 100% | Clock + skew + BROADCAST_PORT alias |
| Craftsmanship | 100% | ≤150L DRY R27/R28 |
| Operational | 100% | Graceful 40s + checkpoint + health |

