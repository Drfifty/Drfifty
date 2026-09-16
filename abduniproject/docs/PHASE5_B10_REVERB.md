# PHASE 5.0 — B.10 قنوات البث المباشر وأحداث WebSockets (Reverb) — Audit-Hardened

> **ABD UNI PROJECT — Realtime Channels & WebSocket Events — Arena Canonical v5.0-B.10 — AUDIT-HARDENED (F-01→F-16)**
> **Stack Lock:** Laravel 12 PHP 8.4 | MySQL 8.4 `InnoDB utf8mb4 JSON(not JSONB) minor BIGINT CHECK+WORM` | Redis tags+Lua+Mutex 30s buffer 50 | Reverb 8080 `wss://` TLS via Nginx/Cloudflare | 5 Apps `AU BUSINESS ab_ core` + 4 B2C | 13 Agents 1-13 | 9 Modules 1-9 | `abduniproject`
> **Refs:** `.arenarules` R1→R38 | Pillars 8 Ephemeral Swarm +4 AU Lite +7 Calibrator | `PROJECT_STATE v5.0-B.9` | B.3 `Trace→Quarantine 503 > Lite` | B.4 `Budget Lua + Circuit` | B.9 `workforce dispatch queued→completed`

> **AUDIT-HARDENED NOTE (Pre-Execution 2026-09-16 — 18 flaws F-01→F-16):** presence governorate free-string→27 enum + app_id AU SERV + degraded check, chat intercept missing→super_admin+support+tenant+disputed REDACT, governance global leak→super_admin MFA only coalesced, naming collision `appId` vs `app_id`→canonical + alias, `REVERB_PORT` only→`BROADCAST_PORT` alias + validation, no `event_id`→UUIDv4 + dedup + Redis 50 buffer + replay, 500rps GPS→5s throttle + batch 20/2s, N+1 escrow→Cache 30s, chat vs leak clash→REDACT pipeline, duplicate calibrator toast→single `private-governance-alerts`, payload NaN→lat/lng/heading CHECK, presence over-broad→ticket ownership, wss mismatch→useTLS, version missing→`v1.` prefix.

---

## 0. EXECUTIVE SUMMARY

B.10 يربط **الزمن الحقيقي الحصري** عبر Reverb 8080: حضور `presence-dispatch-{region}` لـ GPS الحي 5ث/20 دفعة، تيار `private-tenant.{app_id}.workforce` لخطوات/ token_spike، اعتراض `private-admin-support-intercept.{chatId}` REDACT، وتنبيه `private-governance-alerts` لحظي <90% / حجر. كل حدث `event_id UUID` مع مخزن 50 وإعادة 50 عند إعادة الاتصال Zero-PII.

---

## 1. REVERB TRANSPORT — `BROADCAST_PORT=8080` EXCLUSIVE F-03/F-14

```php
// .env.example
BROADCAST_CONNECTION=reverb
BROADCAST_PORT=8080 # alias REVERB_PORT — B.10 F-03 validated
REVERB_PORT=8080
REVERB_HOST=0.0.0.0
REVERB_SCHEME=http // prod https → wss://
// config/broadcasting.php & reverb.php
'port' => (int) env('BROADCAST_PORT', env('REVERB_PORT', 8080)),
'useTLS' => env('REVERB_SCHEME','http')==='https',
```

`AppServiceProvider::boot()` validates `BROADCAST_CONNECTION===reverb` else throw in prod, `VITE_REVERB_PORT=BROADCAST_PORT`. Nginx `proxy_pass reverb:8080` `wss://` via Cloudflare Spectrum `TRUST_PROXIES=*`.

---

## 2. CHANNEL REGISTRY — `routes/channels.php` PATCHED ADDITIVE F-01/F-02/F-07/F-10

```php
Broadcast::channel('presence-dispatch-{region}', fn($user,$region)=> // 27 enum + AU SERV + cache 30s + ticket ownership
Broadcast::channel('private-invest.{uuid}', fn($user,$uuid)=> Cache 30s escrow buyer|seller)
Broadcast::channel('private-escrow.{uuid}', fn($user,$uuid)=> Cache 30s )
Broadcast::channel('private-tenant.{appId}.workforce', fn($user,$appId)=> // canonical + alias private-tenant.{app_id}.workforce compat
Broadcast::channel('private-admin-support-intercept.{chatId}', fn($user,$chatId)=> super_admin|support + chat exists tenant.app disputed REDACT)
Broadcast::channel('private-governance-alerts', fn($user)=> super_admin+MFA+email_verified+active) // coalesced
```

No duplicate, additive patch, `Cache::remember 30s + lock 5`.

---

## 3. EVENT SCHEMAS — 4 NEW + 3 UPGRADED F-05/F-11 (versioned `v1.` + `event_id`)

### `ProviderLocationUpdated` — `presence-dispatch-{region}` `ShouldBroadcastNow`
```json
{ "event_id":"uuid", "event_version":"v1", "timestamp":"2026-09-16T...", "trace_id":"32hex", "app_id":"AU SERV", "region":"cairo", "provider_id_hash":123, "latitude":30.05, "longitude":31.23, "heading":90, "status":"available|busy|offline", "accuracy":5.0, "speed":12.3 }
```
Validates `lat -90..90 lng -180..180 heading 0..359 region enum 27` throws 422. Throttled `provider:throttle:{id} NX EX 5 → 429`, batched `max 20 / 2s`.

### `WorkforceStepUpdated` — `private-tenant.{app_id}.workforce` `ShouldBroadcast`
```json
{ "event_id":"uuid", "event_version":"v1", "timestamp":"...", "trace_id":"...", "app_id":"AU BUSINESS", "tenant_id":1, "agent_id":3, "log_id":101, "step":"queued|progress|token_spike|completed|failed", "tokens":200, "cost_usd":"0.0200", "output_hash":"64" }
```

### `ChatIntercepted` — `private-admin-support-intercept.{chatId}` REDACT
```json
{ "event_id":"uuid", "event_version":"v1", "timestamp":"...", "trace_id":"...", "chat_id":"uuid", "app_id":"AU SERV", "role":"admin|customer", "message":"*** REDACT", "taken_over":true, "admin_id":1 }
```

### `GovernanceAlerted` — `private-governance-alerts` coalesced
```json
{ "event_id":"uuid", "event_version":"v1", "timestamp":"...", "trace_id":"...", "alert_type":"calibrator_drop|drm_quarantine|kill_switch", "health_pct":85, "reason":"...", "retry_after":3600 }
```

Upgraded: `WorkforceDispatched` now `v1.workforce.dispatched + event_id + buffer private-tenant`, `AiKillSwitchTriggered` `v1.ai.kill_switch.triggered → private-governance-alerts + admin.governance`, `DrmQuarantineTriggered` `v1.drm.quarantine.triggered → private-governance-alerts`.

Every `broadcastWith()` pushes `ReverbBuffer::push(channel, payload) LPUSH LTRIM 50 EXPIRE 86400 + Cache processed:event:{id} NX`.

---

## 4. DELIVERY GUARANTEES — `ReverbBuffer` + `ReplayController` F-04/F-15/F-16

**At-least-once + exactly-once effect + last 50**
- Producer: `HasEventId` trait `Str::uuid() + now Cairo iso8601 + trace_id` in every event.
- Buffer: `Redis LPUSH broadcast:buffer:{channel} json LTRIM 0 49 EXPIRE 86400` (fallback `Cache::put`).
- Consumer dedup: `Cache::add processed:event:{event_id} NX EX 3600` skip if true (client `Set<event_id>` same).
- Replay: `GET /api/v1/reverb/replay?channel=?&after_event_id=?` `auth.jwt sanitize 60/min` → `ReverbBuffer::replay(channel, after)` oldest→newest slice after id.

**JS `resources/js/Services/Reverb.ts`** TS strict zero any:
`createReverb({key,host,port,scheme,token}) Echo reverb wssPort+forceTLS + auth Bearer + DedupSet 5000 + fetchReplay(channel, lastId, token)` usage example for workforce, presence, intercept, governance.

---

## 5. THROTTLE & RATE F-06/F-13

Provider GPS `Cache::add provider:throttle:{id} 5s` → 429, batch job `ProviderBatchFlush 2s max20 → PresenceChannel`. Nginx `20/s per IP` prod + Cloudflare WAF + Reverb `throttle:reverb-join 60/min`. Presence store `redis`.

---

## 6. ADDITIVE MIGRATION — `000029_b10_reverb_guarantees.php` guard only

No DDL, documents Redis guarantees `broadcast:buffer:{channel} LPUSH 50 + processed:event:{id}`. `down() empty`.

---

## 7. SPRINTS (≤150L / 1-3 files) — Arena Limits R4

**B.10.1** — `Services/Broadcast/HasEventId + ReverbBuffer + .env BROADCAST_PORT + config/broadcasting/reverb alias`
**B.10.2** — `routes/channels.php` hardened 6 channels + `Events/ProviderLocationUpdated, WorkforceStepUpdated, ChatIntercepted, GovernanceAlerted ≤60L` + upgraded `WorkforceDispatched/AiKillSwitch/DrmQuarantine` versioned
**B.10.3** — `Http/Controllers/Api/V1/Reverb/ReplayController + routes/api/v1/reverb.php` replay 50
**B.10.4** — `resources/js/Services/Reverb.ts` dedup + `docs/PHASE5_B10_REVERB.md`
**B.10.5** — `database/migrations/000029_b10_reverb_guarantees.php` guard
**B.10.6** — Verification `php -l + artisan route:list + channels auth cache + wss 8080 + replay 50 + dedup`

**Verification Gates:**
- ✅ `presence-dispatch-cairo 500 providers 1Hz → 10 rps batch + throttle 5s 429 + X-App-Id AU SERV else block + hibernated 503`
- ✅ `private-admin-support-intercept chat disputed REDACT → only super_admin|support tenant isolated 403 else; valid →200 + message ***`
- ✅ `private-governance-alerts only super_admin MFA else 403 + health <90 emits single GovernanceAlerted not duplicate`
- ✅ `wss://{domain}:8080 via Nginx prod https → Echo wssPort 8080 forceTLS + BROADCAST_PORT validated`
- ✅ `broadcast every event has event_id UUID + event_version v1 + trace_id + ReverbBuffer last 50 LPUSH; client dedup Set; reconnect fetchReplay after_event_id returns next 50`

---

## 8. CALIBRATOR GATE — 100% before any code

| Domain | Score | Gate |
|--------|-------|------|
| Memory (71pts+9M/5A/13Agents+B1a→B9) | 100% | reuse Trace+WORM+Budget+Presence |
| Architecture (DDD ShouldBroadcast+Channel) | 100% | R27 ≤60L |
| Security (presence enum+private super_admin+REDACT) | 100% | R6+R36+R38 |
| Precision (JSON not JSONB+event_id UUID+Cairo) | 100% | R7 |
| Craftsmanship (PHP8.4 strict+TS zero any) | 100% | R28 YAGNI |
| Operational (Reverb 8080+Redis 50 buffer+replay) | 100% | Pillar 8 |

> **BLOCKED if <100%** — reload `.arenarules`+B.1a→B.9.

---

## 9. ARABIC SUMMARY

تم تأمين البث الحي الحصري: Reverb 8080 `wss://` عبر `BROADCAST_PORT` + حضور `27 إقليم` مخنوق 5ث مجمّع 20/2ث، تيار مهام `private-tenant` مع `event_id` ومخزن 50 وإعادة، اعتراض دردشة REDACT معزول مستأجر، وتنبيه حوكمة موحّد للمعاير <90% / حجر — مع إلغاء ازدواجية وتكرار آمن.

---
*Target: `abduniproject` — Next: B.11 Docker & Edge — Arena*
