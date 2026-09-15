# PHASE 2.3c — Docker Compose Architecture (Arena Canonical)

> **Env:** `Arena` (`arena/01a09d54-drfifty`) | **Project:** `abduniproject` | **Mode:** Production Docker Swarm (Laragon = local dev only, Rule env) | **Compose:** `docker-compose.prod.yml` (prod) | **Date:** 2026-09-14

## 0) Service Map (6 required + 3 platform)

| Service | Image | Purpose | Network |
|---------|-------|---------|---------|
| **app** | `abduniproject/app:prod` (PHP 8.4-FPM + Laravel 12) | Modular Monolith + DDD + Calibrator | backend, front |
| **db** `mysql` | `mysql:8.4` `--character-set utf8mb4` | MySQL 8.4 Spatial (`POINT/POLYGON SRID4326` + `SPATIAL INDEX` + ngram) | backend |
| **pgsql** | `postgis/postgis:16-3.4` + `pgcrypto` | AU MED clinical + `pgvector` | backend |
| **redis** | `redis:7-alpine` `maxmemory 256mb` | Queue/Cache/Calibrator State/Mutex | backend, sandbox |
| **reverb** | `abduniproject/app:prod` `reverb:start 8080` | WSS 8080 exclusive | backend, front |
| **nginx** | `nginx:alpine` | Cloudflare → WAF → rate-limit 20/s + Fail2ban | front |
| **n8n** | `n8nio/n8n:latest` | Workflow Sandbox (Agent 11) | sandbox |
| **agent_sandboxes** | `abduniproject/sandbox:php84` | Isolated Docker exec for Digital Employees (ephemeral) | sandbox (isolated, no egress) |
| **vllm_gpu** | `vllm/vllm-openai:v0.4` (sim) | `{LOCAL_GPU_ENDPOINT}` Local GPU simulation | gpu |
| **fail2ban** | `crazymax/fail2ban` | Auto-ban abusive IP | host |

---

## 1) Complete `docker-compose.prod.yml` (Production — Swarm)

```yaml
# ABD UNI PROJECT — Production Docker ONLY (Ephemeral Swarm + Edge)
# WARNING: Laragon = local dev, Docker = prod — never cross-apply.
# Arena env: 0.0.0.0 preview, Reverb 8080 wss://, Cloudflare WAF + Nginx 20/s + Fail2ban

services:
  app:
    image: abduniproject/app:prod
    build: { context: ., dockerfile: Dockerfile }
    environment:
      APP_ENV: production
      APP_KEY: "${APP_KEY}"
      DB_CONNECTION: mysql
      DB_HOST: mysql
      DB_DATABASE: abduniproject
      DB_USERNAME: abduni
      DB_PASSWORD: "${DB_PASSWORD}"
      REDIS_HOST: redis
      BROADCAST_CONNECTION: reverb
      REVERB_APP_ID: "${REVERB_APP_ID}"
      REVERB_APP_KEY: "${REVERB_APP_KEY}"
      REVERB_HOST: "0.0.0.0"
      REVERB_PORT: 8080
      REVERB_SCHEME: https
      LOCAL_GPU_ENDPOINT: "http://vllm_gpu:8000/v1"
      FX_PROVIDER: "${FX_PROVIDER:-exchangerate_api}"
    depends_on: { mysql: { condition: service_healthy }, pgsql: { condition: service_healthy }, redis: { condition: service_healthy }, reverb: { condition: service_started } }
    deploy: { replicas: 2, resources: { limits: { cpus: '2', memory: 2G } }, restart_policy: { condition: on-failure } }
    networks: [backend, front]
    volumes: [app_storage:/var/www/storage]
    healthcheck: { test: ["CMD", "php", "artisan", "health:check"], interval: 30s, timeout: 5s, retries: 3 }

  nginx:
    image: nginx:alpine
    ports: ["80:80", "443:443", "8080:8080"]
    volumes: ["./docker/nginx.prod.conf:/etc/nginx/nginx.conf:ro", "./docker/certs:/etc/nginx/certs:ro", "/var/log/nginx:/var/log/nginx"]
    depends_on: [app, reverb]
    networks: [front]
    deploy: { resources: { limits: { memory: 512M } } }

  mysql: # db — MySQL 8.4 Spatial
    image: mysql:8.4
    command: --character-set-server=utf8mb4 --collation-server=utf8mb4_unicode_ci --innodb-buffer-pool-size=1G --ngram-token-size=2
    environment: { MYSQL_DATABASE: abduniproject, MYSQL_USER: abduni, MYSQL_PASSWORD: "${DB_PASSWORD}", MYSQL_ROOT_PASSWORD: "${DB_ROOT_PASSWORD}" }
    volumes: [mysql_data:/var/lib/mysql, ./docker/mysql/init.sql:/docker-entrypoint-initdb.d/init.sql:ro]
    networks: [backend]
    healthcheck: { test: ["CMD", "mysqladmin", "ping", "-h", "localhost"], interval: 10s, retries: 5 }
    # No ports exposed externally — only via backend network (Cloudflare → nginx → app → mysql)

  pgsql:
    image: postgis/postgis:16-3.4
    environment: { POSTGRES_DB: abduniproject_clinical, POSTGRES_USER: abduni, POSTGRES_PASSWORD: "${DB_PGSQL_PASSWORD}" }
    volumes: [pgsql_data:/var/lib/postgresql/data]
    networks: [backend]
    healthcheck: { test: ["CMD-SHELL", "pg_isready -U abduni"], interval: 10s, retries: 5 }
    # CREATE EXTENSION postgis; CREATE EXTENSION pgcrypto; CREATE EXTENSION vector;

  redis: # Queue/Cache/Calibrator State
    image: redis:7-alpine
    command: redis-server --maxmemory 256mb --maxmemory-policy allkeys-lru --appendonly yes
    volumes: [redis_data:/data]
    networks: [backend, sandbox]
    healthcheck: { test: ["CMD", "redis-cli", "ping"], interval: 10s, retries: 3 }

  reverb:
    image: abduniproject/app:prod
    command: php artisan reverb:start --host=0.0.0.0 --port=8080
    environment: { REVERB_APP_ID: "${REVERB_APP_ID}", REVERB_APP_KEY: "${REVERB_APP_KEY}", REVERB_SCHEME: https }
    networks: [backend, front]
    healthcheck: { test: ["CMD", "nc", "-z", "localhost", "8080"], interval: 10s, retries: 3 }

  worker: # Ephemeral Swarm — auto-scale via Redis, self-terminate (Pillar 8)
    image: abduniproject/app:prod
    command: php artisan queue:work redis --sleep=3 --tries=3 --max-time=3600 --max-jobs=1000
    depends_on: [redis]
    deploy: { replicas: 3, restart_policy: { condition: on-failure } }
    networks: [backend]
    environment: { QUEUE_CONNECTION: redis }

  n8n: # Workflow Sandbox (Agent 11)
    image: n8nio/n8n:latest
    environment: { N8N_HOST: n8n.abduni.com, N8N_PORT: 5678, N8N_PROTOCOL: https, WEBHOOK_URL: https://n8n.abduni.com, GENERIC_TIMEZONE: Africa/Cairo }
    volumes: [n8n_data:/home/node/.n8n]
    networks: [sandbox]
    deploy: { replicas: 1 }

  agent_sandboxes:
    image: abduniproject/sandbox:php84
    build: { context: ./docker/sandboxes/agent-sandbox }
    environment: { SANDBOX_MODE: isolated, REDIS_HOST: redis }
    networks: [sandbox]
    deploy: { replicas: 0 } # spawned on-demand via Redis queue, self-terminate after task
    read_only: true
    tmpfs: [/tmp]
    security_opt: [no-new-privileges:true]
    cap_drop: [ALL]
    cap_add: [CHOWN, SETGID, SETUID]

  vllm_gpu: # Local GPU endpoint simulation — {LOCAL_GPU_ENDPOINT}
    image: vllm/vllm-openai:v0.4
    command: --model mistralai/Mistral-7B-Instruct-v0.2 --port 8000 --dtype half
    environment: { HUGGING_FACE_HUB_TOKEN: "${HF_TOKEN}" }
    volumes: [vllm_cache:/root/.cache/huggingface]
    networks: [gpu]
    deploy: { resources: { reservations: { devices: [{ driver: nvidia, count: 1, capabilities: [gpu] }] } } }
    # App accesses via http://vllm_gpu:8000/v1 (LOCAL_GPU_ENDPOINT)

  fail2ban:
    image: crazymax/fail2ban:latest
    volumes: ["/var/log:/var/log:ro", "./docker/fail2ban/jail.local:/etc/fail2ban/jail.local:ro"]
    network_mode: host
    cap_add: [NET_ADMIN, NET_RAW]
    depends_on: [nginx]

networks:
  front: { driver: overlay, attachable: true } # Cloudflare → nginx → app/reverb (public)
  backend: { driver: overlay, internal: true } # app ↔ db/pgsql/redis (no egress)
  sandbox: { driver: overlay, internal: true } # n8n ↔ agent_sandboxes ↔ redis (isolated, no internet)
  gpu: { driver: overlay, internal: true } # app ↔ vllm_gpu (private)

volumes: { mysql_data: {}, pgsql_data: {}, redis_data: {}, n8n_data: {}, vllm_cache: {}, app_storage: {} }
```

---

## 2) Environment Configurations

```env
# .env.prod (excerpt — prod only, never Laragon)
APP_ENV=production
APP_KEY=base64:...
DB_PASSWORD=... DB_ROOT_PASSWORD=... DB_PGSQL_PASSWORD=...
REDIS_HOST=redis
REVERB_APP_ID=abduni REVERB_APP_KEY=... REVERB_HOST=0.0.0.0 REVERB_PORT=8080 REVERB_SCHEME=https
LOCAL_GPU_ENDPOINT=http://vllm_gpu:8000/v1
FX_PROVIDER=exchangerate_api
HF_TOKEN=hf_...
CLOUDFLARE_TOKEN=...
```

---

## 3) Network Isolation Rules

```
[Internet] → Cloudflare Enterprise (WAF, DDoS, Bot) → Nginx:80/443 (front)
  → app:9000 (backend, internal) → mysql:3306/pgsql:5432/redis:6379 (backend, no egress)
  → reverb:8080 (front+backend) → wss:// 8080 via Cloudflare Spectrum
[sandbox] n8n:5678 ↔ agent_sandboxes (ephemeral, read-only, --network=none except sandbox→redis)
[gpu] app → vllm_gpu:8000 (internal, no public port)
```

- **Front:** Only `nginx` exposes `80/443/8080`; `app` never directly public.
- **Backend `internal:true`:** No external egress — even if `app` compromised, cannot reach internet except via `front`.
- **Sandbox `internal:true` + `read_only + no-new-privileges + cap_drop ALL`:** Agent code cannot escape, no net, tmpfs only.
- **GPU `internal:true`:** `vllm_gpu` only reachable by `app` via `LOCAL_GPU_ENDPOINT`.

---

## 4) Edge & Infrastructure DoS Protection (Pillar 10 — Prod Only)

### 4.1 Cloudflare Enterprise (Edge)
- **WAF:** OWASP, SQLi, XSS, `Rate Limiting 20/s/IP` (managed), `Bot Fight Mode`, `DDoS L7`.
- **Spectrum:** `wss://` 8080 proxied via Cloudflare Spectrum (Reverb).
- **Argo + Cache:** Static `resources/js` via `Vite` hashed.

### 4.2 Nginx `nginx.prod.conf` (Dynamic Rate-Limit 20 req/sec)
```nginx
limit_req_zone $binary_remote_addr zone=api:10m rate=20r/s;
limit_req_zone $binary_remote_addr zone=login:10m rate=5r/m;
server {
  listen 80; listen 443 ssl http2;
  ssl_certificate /etc/nginx/certs/fullchain.pem;
  location /api/v1/auth/ { limit_req zone=login burst=5 nodelay; proxy_pass http://app:9000; }
  location /api/ { limit_req zone=api burst=20 nodelay; proxy_pass http://app:9000; }
  location /app/ { proxy_pass http://reverb:8080; proxy_http_version 1.1; proxy_set_header Upgrade $http_upgrade; }
  access_log /var/log/nginx/access.log;
  error_log /var/log/nginx/error.log;
}
```

### 4.3 Fail2ban `jail.local` (Automated Blocking)
```ini
[nginx-limit-req]
enabled = true
filter = nginx-limit-req
logpath = /var/log/nginx/error.log
maxretry = 3
bantime = 3600
findtime = 60
action = iptables[name=nginx, port=http, protocol=tcp]

[nginx-auth]
enabled = true
filter = nginx-auth
logpath = /var/log/nginx/access.log
maxretry = 5
bantime = 86400
```
*On `limit_req` 503 burst → Fail2ban `iptables` bans IP 1h; on `401` brute → 24h.*

**Flow:** `Client → Cloudflare WAF (20/s) → Nginx limit_req (20/s, burst 20 nodelay) → app → Fail2ban tail → iptables DROP → Cloudflare reports via webhook + Reverb `private-admin` alert`.

---

**ملخص عربي:** معمارية حاويات إنتاج — 10 خدمات مع عزل شبكي (front/backend/sandbox/gpu) وحماية طرفية ثلاثية (Cloudflare WAF + Nginx 20/s + Fail2ban) مع حجر صحي وتشغيل سريع مؤقت.

*Next: [PROMPT 2.4] Master Admin HQ*
