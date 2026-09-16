# PHASE 3.1 — Master Admin Dashboard & AI C-Suite HQ Blueprint — PART 1: Screen Matrices & Core System Screens (Arena Canonical)

> **Env:** `Arena` (`arena/01a09d54-drfifty`) | **Project:** `abduniproject` (`D:\Project\Projects\abduniproject` — lowercase) | **Stack:** React 19 + Inertia v2 + TS 5.7 strict ZERO `any` + Tailwind v4 + Shadcn + Lucide + Vite 0.0.0.0 + Reverb 8080 + MySQL 8.4 + PostgreSQL 16 + Redis | **Mode:** BLUEPRINT SPEC ONLY — no frontend code | **Date:** 2026-09-15 | **Inherits:** `PHASE 3.0 Design System` (9 semantic tokens + shadow/border/focus via `var(--token)`, Cairo/Tajawal+Inter, 8pt grid, `ps/pe` logical RTL, 4 breakpoints 1440/1024/768/320, WCAG AA) — zero hex in `.tsx` | **Registry Lock:** Part 1 13 Agents exact (Agent 1→13, no 14th, no alias, no renumbering) + 10 Enterprise Suites + 9 Modules 1-9

> **MANDATORY CROSS-REFERENCE:** This blueprint has been generated **after** re-reading and enforcing **`.arenarules` Rules 1-38 + 11 Pillars + Micro-Sprint 1-3 files/150 lines** AND **`PROJECT_STATE.md` v3.2** — no rule overridden, vertical continuity preserved. `AU BUSINESS (ab_)` is Master Core B2B (`is_core=1`) powering 4 spokes (`amed_/adl_/asv_/ainv_`).

> **CINEMATIC GLOBAL PROTOCOL (Enforced):** All visuals are **encapsulated in `tokens.css` / Theme Layer**. No flat hex in `.tsx`. Updating one token re-skins all 5 apps + HQ. Aesthetic **beyond conventional** — **Liquid Metallic & Glassmorphic**: frosted glass `backdrop-blur(12px)`, brushed metallic overlays `linear-gradient(135deg, rgba(255,255,255,.08), transparent)`, neon glowing borders `cyan #06B6D4 / emerald #10B981 / amber #F59E0B / crimson #EF4444` on obsidian canvas `#09090b`, particle meshes, proximity lighting (`--cursor-x/y`), glowing pulses, floating micro-animations `translate-y-2`, shimmer border sweeps. This baseline **must** carry into ALL subsequent app blueprints (AU BUSINESS/MED/DEALS/SERV/INVEST).

---

## 0) Global Architecture — API-First, Token-Isolated, RTL-First

**Shell:** `<AppLayout>` `bg-canvas` → `<BackgroundLayer mode="particle-mesh" interactive dense="med" tint="accent/6%">` (fixed `z:-1` canvas 60 nodes 30fps) → `<TopHeader>` sticky `z-30` `bg-surface/80 backdrop-blur(12px) border-b border-main shadow-elevation-sm` → `<Sidebar>` `bg-surface border-e border-main` → `<main id="main" class="ps-0 lg:ps-[280px] bg-transparent">` → `<Content>` `max-w-[1280px] mx-auto ps-4 lg:ps-8 pe-4 lg:pe-8 py-6 lg:py-8`.

**Token Decoupling:** Every color is `bg-surface | text-primary | border-main | bg-accent` etc. Theme profile `minimal|glassmorphism|brutalist|material|dark|high-contrast` is `data-theme` swap — component `className` never changes. **Isolation verified:** `stylelint color-no-hex` passes except `tokens.css`.

**Motion Budget:** `--motion-press` (`translateY(1px)` minimal / `scale(.98)` soft / `translate(2px,2px)` brutalist) on `active`; `transition: all 180ms ease` var-driven; `prefers-reduced-motion` disables `BackgroundLayer` and sets `--motion-press: none`.

**RBAC Gate:** `useCan(slug)` + `CheckModuleStatus` + `EnsureTenantWorkforce` — DOM stripping (`display:none`) vs `blur-md pointer-events-none` vs `opacity-40` per mode (§4.1 Phase 3.0). Server `->middleware('can:*.execute')` authoritative.

**Realtime Backbone:** Reverb 8080 `wss://` — Channels: `private-calibrator`, `private-hitl`, `private-tenant.{app_id}.workforce`, `presence-dispatch-{region}`, `private-admin-support-intercept.{chatId}`. TopHeader badges subscribe; HUD toasts (§3.7) render.

---

## A) GLOBAL FRAMEWORK & NAVIGATION HIERARCHY

### A.1 Top Persistent Global Header — `sticky top-0 z-30 h-14 lg:h-16`

> **Layout:** `flex items-center gap-2 lg:gap-4 ps-3 lg:ps-6 pe-3 lg:pe-6 bg-surface/80 backdrop-blur(12px)` with liquid metallic sheen `::after { background: linear-gradient(90deg, transparent, rgba(255,255,255,.08), transparent); animation: shimmer 3s infinite; }` on `border-b border-main/50` neon-accent glow `shadow-[0_0_12px_rgba(6,182,212,.15)]` (cyan).

| # | Component | Spec (Zero Ambiguity) | Tokens / Motion / RTL | RBAC / API |
|---|-----------|----------------------|----------------------|------------|
| **1** | **Master AI Emergency Kill-Switch** (Pinned Primary) | `position: center` (`absolute start-1/2 -translate-x-1/2` on `≥1024px`, else `ms-auto` right). Button `w-36 lg:w-44 h-9 rounded-pill bg-crimson text-on-accent text-micro tracking-widest border-bold border-crimson shadow-elevation-md hover:shadow-[0_0_20px_var(--brand-crimson)]` `Lucide Power 14 me-2` + label `AI SWARM: ACTIVE` (Cyan `#06B6D4` dot `w-2 h-2 rounded-full bg-accent animate-pulse` when active). **Interaction:** `Hold-to-confirm 2s` progress ring `stroke-dashoffset` around button **or** Click → Modal `MFA + passphrase` confirmation (see A.1.1). On sever: label flips to `AI SWARM: SEVERED (MANUAL MODE)` `bg-crimson` dot `bg-crimson animate-none`, `toast crimson` persistent, `Reverb private-calibrator` broadcasts `kill_switch_engaged`. | `bg-crimson var(--brand-crimson) #EF4444`, `obsidian` canvas contrast 12:1; `focus:ring-crimson`; `active: var(--motion-press)`; `text-start` on modal; `ps-` logical | `can:ai.kill_switch.execute` (super_admin + Agent 12 only) + `2FA TOTP header X-TOTP` — without `view` hidden `display:none`; without `execute` `opacity-40` + tooltip `Requires HITL`. **API:** `POST /api/v1/governance/kill-switch {confirmed:true}` → reverts 100% to `DeterministicRuleDriver` only, severs `{LOCAL_GPU_ENDPOINT}` + Cloud LLM sockets, keeps PHP 8.4 app alive. |
| **2** | **AU Calibrator Telemetry Badge** | Radial gauge `w-9 h-9 lg:w-10 lg:h-10` SVG `stroke-width 6` track `stroke: var(--surface-secondary)` progress `stroke: var(--accent)`. **Value:** `healthScore 90-100` from `GET /governance/health-score` polling 5s + `private-calibrator` push. **Color logic:** `>95` `emerald #10B981` glow `shadow-[0_0_12px_#10B981]` + `text-emerald`; `90-94` `amber #F59E0B` pulse `animate-pulse`; `<90` `crimson #EF4444` `animate-pulse` + `shake` + trigger `SelfHealingEngine` `cache:clear/horizon:terminate/recycle`. Adjacent `text-micro text-secondary` `100%` label `text-title 18/22` numeric `font-latin tabular-nums`. Hover → `Popover` breakdown `components[queue_latency, error_rate, worker_health, db_slow]` + `Heal` button. | `surface-primary` bg `border-main` + `shadow-elevation-sm`; `proximity-light` on hover `box-shadow: 0 0 20px var(--accent-primary)` via `--cursor-x`; `rounded-full` | `can:calibrator.view` — hidden if no view. **API:** `GET /calibrator/health-score` + `private-calibrator` `HealthScoreUpdated {score, components}` |
| **3** | **Multi-App Context Switcher** | `SegmentedControl` 6 pills `ps-2 pe-2 gap-1 bg-surface-secondary rounded-pill p-1` each `ps-3 pe-3 py-1.5 rounded-pill text-micro border-subtle` `All Apps` `AU MED` `AU DEALS` `AU BUSINESS` `AU SERV` `AU INVEST` (tokens §4.2 Phase 3.0). `All Apps` = Master Admin cross-app view (aggregates 5). **Active:** `bg-accent text-on-accent border-accent shadow-elevation-sm neon-glow cyan` + shimmer. **Hibernated** (`feature_flags is_enabled=0` → `CheckModuleStatus 503`): `opacity-40 blur-[1px]` + `amber dot` + tooltip `AU MED hibernated`. On change: `X-App-Id` header injected → `Inertia.visit` → `AppLayout` re-evaluates `feature_flags` + `Reverb` subscription switches to `private-tenant.{app_id}`. | `bg-surface-secondary` + `accent` active; `focus:ring-accent`; `ps/pe` logical; metallic sheen on active | `useCan(app.view)` — no view → pill `display:none` (AU BUSINESS never hidden `is_core=1`). **API:** `GET /system/modules/status` cached 30s |
| **4** | **AU Lite Module Freeze Bar** | Thin `h-7 w-full bg-amber/10 border-y border-amber/30 backdrop-blur(8px)` `flex items-center ps-4 pe-4 gap-3` `Lucide Zap 12 text-amber` + `text-micro text-secondary` "Server load 78% — Peak" + `Progress` `w-24 h-1.5 bg-surface-secondary rounded-pill overflow-hidden` `fill bg-amber width 78%` + `Quick toggles` 4 `Switch sm` `AU MED|DEALS|SERV|INVEST` `is_enabled` bind to `POST /system/modules/toggle` + `TOTP`. Auto-appears when `SystemHealthEvaluator queue_latency > threshold` via `private-calibrator`. Dismiss `X 12`. | `amber #F59E0B` `var(--accent-secondary)` alias for load; `backdrop-blur` glass; `animate-shimmer` on progress | `can:system.modules.toggle.execute` (super_admin/Global Controller Agent 12) — else toggles `opacity-40` |
| **5** | **Super Admin Profile & RBAC Status** | `flex items-center gap-2 lg:gap-3 ps-2 lg:ps-3 pe-2 border-s border-main ms-auto` + Avatar `w-8 h-8 rounded-full bg-accent text-on-accent text-micro` initials + `text-body text-primary hidden lg:block` `Admin #ID 12` + vertical stack `text-micro text-secondary` `MFA ✓` `HW LOCK ✓` `Session 2h 14m` (from `refresh_tokens device_fingerprint + ip` + `mfa_enabled`). Click → `DropdownMenu` `Profile / Active Sessions (user_agent + revoke) / Toggle MFA / Logout` (`POST /auth/logout` clears `__Host-rt`). | `surface-primary` avatar `shadow-elevation-sm` metallic gradient `linear-gradient(135deg, rgba(255,255,255,.12), transparent)` | `auth:jwt` required — always visible for authenticated; `mfa_enabled` flag from `users` |
| **6** | **Global Emergency Mass Revocation Switch** | `Button Ghost size=sm` `Lucide LogOut 14 me-2` + `text-micro` `Kill-All Sessions` `border-crimson text-crimson hover:bg-crimson hover:text-on-accent` `ps-2 pe-2`. **Interaction:** Click → `Modal Danger` `Select scope: Global (all apps) / AU MED / AU DEALS / AU BUSINESS / AU SERV / AU INVEST` + `MFA + confirm typing "REVOKE"` + `2s hold` → `POST /system/sessions/kill-all {scope}` → `DELETE refresh_tokens WHERE app_id=scope` + `Reverb private-admin` `sessions_revoked`. | `crimson` token + `focus:ring-crimson` + `backdrop-blur` modal `8px` | `can:sessions.kill_all.execute` super_admin only — `display:none` otherwise |

**A.1.1 Kill-Switch Confirmation Modal — Shared**
`Overlay backdrop-blur-[8px] bg-overlay-backdrop z-50` → `Content bg-surface border-bold border-crimson shadow-elevation-lg rounded-lg p-6 max-w-md w-[92vw]` `Lucide AlertTriangle 24 text-crimson mx-auto animate-pulse` + `text-title text-primary text-center` "Sever AI Swarm?" + `text-body text-secondary text-center` "All LLM threads → Deterministic manual. PHP 8.4 core remains." + input `Passphrase` `border-crimson focus:ring-crimson` + `TOTP 6-digit font-latin` + `Hold button 2s` `w-full bg-crimson text-on-accent rounded-md py-3 text-micro tracking-widest` with circular progress `svg ring`.

### A.2 Collapsible Sidebar Navigation Hierarchy — 10 Enterprise Suites

> **Container:** `fixed inset-block-0 inset-inline-start-0 z-20 w-[280px] lg:w-[280px] bg-surface border-e border-main shadow-elevation-md backdrop-blur(12px) overflow-y-auto` `ps-0` logical. Collapsed `w-[64px]` icons-only on `≥1024px` toggle `Lucide PanelLeft 18`; on `<1024px` overlay drawer `translate-x-full → 0` (`inset-inline-start` flips RTL). **Metallic accent:** left border `w-[2px] bg-gradient-to-b from-cyan via-transparent to-transparent opacity-60`.

**Header:** `ps-4 pe-4 py-4 border-b border-main flex items-center gap-3` Logo `AU` `w-8 h-8 rounded-md bg-accent text-on-accent text-micro font-700` + `text-section text-primary` `Control Center` `text-micro text-secondary` `v3.2`.

**Menu:** `nav` `ps-2 pe-2 py-3 flex-col gap-1` Each `NavItem` `ps-3 pe-3 py-2.5 rounded-md flex items-center gap-3 text-body transition-all` `Lucide` 18 `me-2` + `text-primary text-start`. States: `Default: text-secondary` `Hover: bg-surface-secondary text-primary shadow-elevation-sm` (+ `proximity glow` on `--cursor-x` near), `Active: bg-accent text-on-accent shadow-elevation-md neon cyan glow + left accent bar w-1 h-6 bg-accent rounded-pill`, `Focus: ring-2 ring-accent`, `Disabled (no view): display:none` or `blur-md` if `view` withheld but structure reserved. Badge `ms-auto text-micro bg-surface-secondary border-subtle rounded-pill ps-2 pe-2` for `pending HITL 12`.

**Suites (exact titles, order locked — Modules 1-22 + DRM + Swarm mapping):**

| # | Suite Title | Icon | App/Branch Anchor | Sub-Routes (future) |
|---|-------------|------|-------------------|---------------------|
| **1** | **AI C-Suite & Swarm Governance** | `Bot` | 13 Agents + Agent 12 Global Controller | `Central HITL Feed`, `Micro-Switch Matrix (1-13)`, `Agent Workspaces 13`, `Agent Logs`, `Proactive Learning Queue`, `Vector RAG Drawer` |
| **2** | **Consolidated Financial Ledger, Escrow & Tax Reserve Vault** | `Wallet` | `app_wallet` universal + Paymob + ETA/ZATCA | `Liquidity Split`, `Escrow Immutability`, `Rationale Modal`, `Gateway Failover`, `E-Invoicing Queue` |
| **3** | **Monetization, Dynamic Paywall & Subscription Engine** | `CreditCard` | `feature_flags` + `commission_rules` | `Paywall Matrix 5 Apps`, `Tier Builder`, `Coupon Matrix`, `User Exemption Vault` |
| **4** | **Dynamic Taxonomy, Schema & Form Canvas Engine** | `Database` | `deal_categories` `attributes_schema JSON` | `Field Catalog`, `Form Canvas DnD`, `Live Preview iOS/Android/Web`, `Hierarchy Editor` |
| **5** | **Loyalty Network, Barter Exchange & Merchant HQ** | `Gift` | `loyalty` + `barter 1.5x/1x` | `Points Logic`, `Barter Engine + Anti-Inflation Caps`, `Merchant Registry` |
| **6** | **Disputes, SLA Tracking & Customer Success HQ** | `ShieldAlert` | `escrow_clearings disputed` + `service_tickets` | `Dispute Center`, `SLA Monitor`, `Chat Intercept private-admin-support` |
| **7** | **Enterprise HR, Micro-Permissions & Security Audit** | `Users` | `roles/permissions/user_roles` | `Permission Tree`, `Geo Isolation`, `Impersonation Preview`, `Watchdog Log` |
| **8** | **Security, DRM, Quarantine & Poison Pill Vault** | `Lock` | `system_drm_states` + `ENVIRONMENT MATCHED` | `DNA Lock`, `48h Heartbeat`, `Quarantine`, `7d Grace`, `Manual Self-Destruct`, `PITR S3 Drill` |
| **9** | **System Telemetry, Ephemeral Swarms & Failover** | `Activity` | `Docker Swarm + Redis + Calibrator 100→90` | `Telemetry Graphs`, `Swarm Lifecycle`, `CQRS Stream`, `Hot-Site Failover` |
| **10** | **Broadcast Studio, Dynamic Ad Manager & Geo-Dispatch Engine** | `Megaphone` | `Broadcast Module 19/20` + `Geo-Dispatch` | `Broadcast Studio`, `Budget Guardrail`, `Ad Manager`, `Geo Boundaries` |

**Footer of Sidebar:** `ps-4 pe-4 py-3 border-t border-main` `Calibrator Mini Gauge 90-100%` + `Ephemeral Workers 3 active` dot pulse cyan.

---

## SCREEN 1: THE 24/7 AUTONOMOUS C-SUITE & CENTRAL HITL GOVERNANCE HQ

> **Route:** `/admin/ai-c-suite` | **Guard:** `auth:jwt` + `can:c_suite.view` | **App Context:** `All Apps` (Master) | **Realtime:** `private-calibrator` + `private-hitl` + `private-tenant.*.workforce` | **Tokens:** obsidian `canvas-bg #09090b` + metallic `surface-primary rgba(255,255,255,.06) backdrop-blur` + neon cyan `#06B6D4` live / emerald `#10B981` approve / amber `#F59E0B` modify / crimson `#EF4444` kill

### Purpose & Core Action
Manage, monitor, approve, and restrict all **13 AI Agents** (exact titles below) under strict **"AI proposes, Admin disposes"** — no autonomous ingestion, no auto-merge without `requires_hitl` approval. Single source of truth for Swarm governance.

### Layout Structure

```
TopRow Metrics (4 cards grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4)
Main Canvas split 70/30 (lg:flex gap-6)
  Left 70%: Central Suggestion Feed (HITL Queue) — scrollable ps-4 pe-4
    Tabs: [All | Pending (12) | Proactive Learning (3) | RAG Ingests]
    Card stack gap-4
  Right 30%: Micro-Switch Matrix Panel sticky top-20 max-h-[calc(100vh-6rem)] overflow-auto
Proactive Learning Queue Section (tab within feed)
Vector RAG Drawer (slide-over end)
```

**Cinematic:** Central Feed cards have `border-main hover:border-accent/30 + shadow-elevation-md hover:shadow-[0_0_20px_rgba(6,182,212,.15)] + backdrop-blur` + `shimmer` sweep on `hover` (`::before gradient`).

### A) Top Row — Metrics & Swarm Status (4 Cards)

| Card | Content | Token/Motion | Data Source |
|------|---------|--------------|-------------|
| **Active Ephemeral Workers** | `text-micro text-secondary` "EPHEMERAL WORKERS" + `text-title font-latin text-primary` `3` + `Lucide Container 16 text-accent ms-auto` + `text-micro text-secondary` "Spawned via Redis" `dot w-2 h-2 bg-accent animate-pulse` | `bg-surface border-subtle rounded-md p-4 shadow-elevation-sm hover:shadow-elevation-md proximity-glow` + `float translate-y-[-2px] infinite 3s` | `Horizon metrics + Redis LLEN` via `GET /telemetry/swarm` + `private-calibrator` |
| **Deterministic vs LLM Fallback Ratio** | `text-micro` "EXECUTION MIX" + Donut `70% Deterministic` `emerald` `30% LLM` `cyan` `font-latin` + `text-secondary 90% Free PHP 8.4 / 10% LLM` + micro-bar `w-full h-1.5 bg-surface-secondary rounded-pill` fill `90% bg-accent` | `emerald #10B981` deterministic vs `cyan #06B6D4` LLM legend | `agent_actions where is_fallback` aggregation + `AgentStrategyManager` stats |
| **GPU Endpoint Status** | `text-micro` "LOCAL GPU" + Toggle `Switch` `checked=localGpuActive` `aria-label` + `text-body font-latin` `http://vllm_gpu:8000/v1` `text-secondary text-micro` latency `42ms` dot `emerald` else `amber` | `bg-surface` + `focus:ring-accent` on switch; `crimson` if unreachable | `GET /telemetry/gpu` + `Switcher preferred_driver local_gpu` (2.3d) |
| **Token & Latency Budget Tracker** | Per-agent mini-bars `Agent 1 CFO $12/$30 40%` + `latency 320ms` `amber` when `>80% threshold` → banner `amber bg-amber/10 border-amber` `Lucide AlertTriangle` | `bar bg-surface-secondary` `fill bg-accent (emerald <80, amber 80-90, crimson >90)` + `shimmer` on over-budget | `private-calibrator` `BudgetGuardrail {agent_id, spent, cap, latency}` |

### B) Main Canvas Left 70% — Central Suggestion Feed (Mandatory HITL Queue)

**Unified inbox** where **all 13 Agents** submit proposals. **Tabs:** `All | Pending | Proactive Learning (Agent 12)` | `RAG Ingests`. **Pagination:** server-side `per_page=10` `DataTable` style but card layout (Rule 13 variant).

**Card Architecture — Every Card:**

```
Card: bg-surface border-subtle rounded-lg shadow-elevation-md overflow-hidden hover:shadow-[0_0_20px_rgba(6,182,212,.12)] backdrop-blur-[6px]
  Header ps-4 pe-4 py-3 bg-surface-secondary/50 border-b border-main flex items-center gap-3
    Avatar 32 rounded-full bg-accent/10 border border-main text-micro font-700
    Title stack: `text-section text-primary` Agent Identifier & Role (exact below) + `text-micro text-secondary` Timestamp `2m ago · Risk Low` + Risk Badge `ps-2 pe-2 py-1 rounded-pill text-micro tracking-widest` Low `emerald` #10B981 / Medium `amber` #F59E0B / High `crimson` #EF4444 border `border-main` shimmer
    End: `Lucide MoreHorizontal 16 me-2 text-secondary hover:text-primary` Dropdown `Mute Agent`
  Body ps-4 pe-4 py-4 text-body text-primary leading-6:
    Proposal description (sanitized via RegexDataLeakDetector)
    + Code diff viewer (only Agent 11) — side-by-side `bg-canvas` `font-latin 12px` `emerald` additions `crimson` deletions
    + Projected impact metric "+20% Efficiency" `text-accent font-600` + financial estimate `font-latin $4.2k` (Agent 1) + security patch details (Agent 6) + fraud summary (Agent 13) + sandboxed test results `Passed 12/12` dot emerald
    + Vector source (Proactive Learning) "Admin, I found [Resource X]. It will improve my efficiency by [Y]%. May I ingest it?" (strict format)
  Action Bar ps-4 pe-4 py-3 bg-surface-secondary/30 border-t border-main grid grid-cols-2 lg:grid-cols-4 gap-2
    Approve emerald `bg-emerald text-on-accent hover:bg-emerald/90 shadow-elevation-sm hover:shadow-[0_0_12px_#10B981]` `Lucide Check 14`
    Reject crimson `bg-crimson text-on-accent` `Lucide X 14`
    Modify amber `bg-amber text-[#111] border-amber` `Lucide Pencil 14` → opens inline editor `Textarea` `border-accent focus:ring-accent` + `Save as Approve`
    Ask Me Later gray `bg-surface border-main text-secondary hover:bg-surface-secondary` `Lucide Clock 14` → moves to secondary queue
  Footer ps-4 pe-4 py-2 text-micro text-secondary flex justify-between: `HITL Required` badge `border-amber` + `Reverb live dot cyan pulse`
```

**Exact 13 Agent Identifier & Role Strings (LOCKED — no alias, no renumbering):**

1. `Agent 1: AI Chief Financial Officer (AI CFO)`
2. `Agent 2: AI Chief Technology Officer (System Health & Security)`
3. `Agent 3: AI Chief Marketing Officer (Growth & Campaigns)`
4. `Agent 4: AI Vendor Success Officer`
5. `Agent 5: AI Customer Support Director`
6. `Agent 6: AI SecOps & Self-Healing Guard (Isolated Sandbox & Security Shield)`
7. `Agent 7: AI Chief Legal Counsel & Compliance Officer (Legal & Compliance)`
8. `Agent 8: AI Supply Chain & Dispatch Director`
9. `Agent 9: AI PR & Brand Reputation Manager`
10. `Agent 10: AI Quality Assurance & Medical Compliance`
11. `Agent 11: AI Lead Software Engineer & DevOps (The Internal Programmer / Code Sandbox)` — *includes Interactive Code Sandbox & PR Visualizer modal (see below)*
12. `Agent 12: The Global AI Controller & Proactive Learning Matrix`
13. `Agent 13: AI Fraud Detector & Anti-Money Laundering Sentinel`

**Agent 11 PR Visualizer — Expanded Modal within HITL Card:**
`Expandable section border-t border-main` → Button `View Code & Tests` `ps-3 pe-3 py-2 bg-surface border-main rounded-md text-micro hover:bg-surface-secondary` → Modal `w-[90vw] max-w-[1200px] h-[80vh] bg-surface border-main shadow-elevation-lg rounded-lg overflow-hidden grid grid-cols-2` left `DiffViewer` side-by-side `+ emerald bg-emerald/10` `- crimson bg-crimson/10` + `Copy` `Lucide Copy`, right `Logs` `font-latin 12px bg-canvas p-4 overflow-auto` `Pest test 12 passed` + `Migration Preview` `table add column location_point POINT SRID4326` + `Approve Merge (Requires HITL)` `emerald` disabled until `tests passed`.

### C) Right 30% — EXHAUSTIVE GRANULAR MICRO-SWITCH MATRIX PANEL (Agents 1-13)

**Panel Container:** `bg-surface border-subtle rounded-lg shadow-elevation-md overflow-hidden sticky top-20` `backdrop-blur(12px)` `border-l-2 border-cyan/30` metallic left accent.

**Header:** `ps-4 pe-4 py-3 bg-surface-secondary border-b border-main flex justify-between items-center` `text-section text-primary` "Micro-Switch Matrix" `text-micro text-secondary` "13 Agents" + `Lucide Settings 14` + `Search ps-8` `Input sm` placeholder `Filter capability`.

**High-density Matrix — One collapsible group per Agent (default expanded), gap-1:**

| Agent | Capabilities (Exact Toggles + HITL) |
|-------|-------------------------------------|
| **Agent 1 CFO** | `Monitor Ledgers` `ON/OFF` (Switch) | `Adjust Fee Rates` `Requires HITL` (Checkbox `disabled` when OFF, `amber border`) | `Escrow Intervention` `ON/OFF` |
| **Agent 2 CTO** | `Monitor DB Performance` `ON/OFF` | `Apply Index Recommendations` `Requires HITL` |
| **Agent 3 CMO** | `Market Trend Analysis` `ON/OFF` | `Propose Regional Expansion` `Requires HITL` | `Draft Ads` `ON/OFF` | `Run Deal Matching` `ON/OFF` | `Draft Emails` `ON` | `Send External Emails` `OFF/Requires HITL` (locked) | `Execute Marketing Budget` `Requires HITL` |
| **Agent 4 Vendor Success** | `Analyze Sales Conversions` `ON/OFF` | `Dispatch Guidance Briefs` `ON/OFF` | `Alter Vendor Tiers` `Requires HITL` |
| **Agent 5 Customer Support** | `Auto-Triage Tickets` `ON` | `Route to Queues` `ON` | `Execute Refunds` `Requires HITL` |
| **Agent 6 SecOps** | `Run Penetration Tests` `ON` | `Auto-Generate Patches` `ON` | `Deploy Security Patches` `Requires HITL` |
| **Agent 7 Legal** | `Audit Terms` `ON/OFF` | `Modify Terms of Service` `Requires HITL` |
| **Agent 8 Supply Chain** | `Recalculate Dispatch Radius` `ON/OFF` | `Modify Regional Operational Boundaries` `Requires HITL` |
| **Agent 9 PR** | `Monitor Brand Sentiment` `ON/OFF` | `Publish External Posts` `Requires HITL` |
| **Agent 10 QA & Medical** | `Audit Listings/Chats` `ON/OFF` | `Adjust Hidden Trust Scores` `ON/OFF` | `Suspend Medical Licenses` `Requires HITL` |
| **Agent 11 DevOps** | `Generate Code` `ON` | `Run Queue Tests` `ON` | `Build n8n/Make Workflows` `ON/OFF` | `Merge PR to Production` `Requires HITL` |
| **Agent 12 Global Controller** | `AU Lite Auto-Freeze` `ON` | `Proactive Learning Queue Enforcement` `ON` |
| **Agent 13 Fraud** | `Flag High-Risk Wallets (>80%)` `ON` | `Freeze Suspicious Escrow Release` `ON` | `Seize User Balances` `HARD-BLOCKED Disabled` `opacity-40 pointer-events-none` tooltip `Prohibited by Oil6 & Rule 26` + `crimson lock icon` |

**Row Template (per sub-capability):** `ps-3 pe-3 py-2.5 flex items-center gap-3 hover:bg-surface-secondary rounded-md transition-colors` `text-body text-primary text-start` capability `flex-1` + `Switch size=sm` `bg-accent when ON` `focus:ring-accent` + `Checkbox size=16` `border-main checked:bg-amber checked:border-amber` label `text-micro text-secondary` "Approval Required" + `Status dot w-2 h-2 rounded-full bg-emerald|amber|gray`.

**Interaction:** `Switch toggle` → `POST /system/micro-switches/toggle {agent_id, capability_key, is_enabled}` + `Checkbox` → `PATCH {requires_hitl}` — both `lockForUpdate` + `Reverb private-hitl` broadcast + `Matrix` re-renders with `Lucide Check 12 text-emerald` toast `HUD cyan`.

### D) Proactive Learning Queue Section — Agent 12 Governed

**Tab within Feed:** `Proactive Learning` `badge 3 amber`. **Request Card Format (Strict, no deviation):** `bg-surface border-amber/30 rounded-lg p-4 shadow-elevation-sm` `Lucide Brain 16 text-amber me-2` + `text-body text-primary` exactly: **"Admin, I found [Resource X]. It will improve my efficiency by [Y]%. May I ingest it?"** where `[Resource X]` = `title + URL or doc hash`, `[Y]` = `projected %` (e.g., `Egyptian Commercial Code PDF +12%`). **Controls:** `Approve (emerald)` `Reject (crimson)` inline — **zero autonomous ingestion** without Admin `Approve` → on approve `Agent 12` enqueues `Vector Ingest Job` to `sandbox queue` → `EphemeralWorker`.

### E) AI Knowledge Base & Vector RAG Ingestion Drawer

**Drawer:** `Drawer end w-[520px]` `bg-surface border-s border-main backdrop-blur(12px) shadow-elevation-lg` `ps-6 pe-6 py-6`. **Header:** `text-title text-primary` "RAG Ingestion" `text-micro text-secondary` "Zero third-party LLM exposure — pgvector sandbox isolated".

**Form:** `Upload area` `border-dashed border-medium rounded-md p-8 text-center hover:border-accent bg-surface-secondary/30` `Lucide Upload 24 text-secondary` + `text-body` "Drop PDF / Drag rulebook" `text-micro text-secondary` "Max 50MB" → `File list` `ps-3 pe-3 py-2 bg-surface border-subtle rounded-md flex gap-3` + `Dropdown Tag Agent` `Select: Agent 7 Legal Vector Store (pgvector) | Agent 3 Marketing | Agent 6 SecOps ...` strict isolate — **binding "Egyptian Commercial Code" → Agent 7 only** (foreign key `vector_store_agent_id 7` + `pgvector` collection per agent). **Submit:** `Primary bg-accent` `Ingest` → `POST /vectors/ingest {file, agent_id, tags}` → `private-hitl` card appears "Ingest request +Y%".

---

## SCREEN 2: CONSOLIDATED FINANCIAL LEDGER, ESCROW & TAX RESERVE VAULT

> **Route:** `/admin/financial-ledger` | **Guard:** `can:financial.view` | **Tokens:** `Inter tabular` for all money, `amber` VAT, `crimson` chargeback freeze, `emerald` net earnings

### Purpose
Monitor real-time liquidity across `app_wallet` (5 apps), 3-tier commissions, sub-deal escrow releases (`journey_id`/`deal_id`), isolate tax reserves, configure gateway matrix.

### Layout

**Split-Ledger Overview Cards — 4-Card Grid `grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4` metallic glass `bg-surface/80 backdrop-blur` `border-subtle` `hover:shadow-elevation-md` + `glow` on hover:**

1. **Gross Platform Liquidity** `Lucide Wallet 16 text-accent` + `text-micro text-secondary` "GROSS LIQUIDITY" + `text-title font-latin text-primary` `$ 1,240,520` (sum `app_wallets.balance_subunit` → `Inter`) + `text-micro text-emerald` "+2.4% 24h" `trend`
2. **Active Escrow Locked Pool** `Lucide Lock 16 text-amber` + "ESCROW LOCKED" + `font-latin` `$ 420,100` + `text-micro text-secondary` `1,240 journeys` `progress bar amber 34%`
3. **Net Platform Earnings** `Lucide TrendingUp 16 text-emerald` + "NET EARNINGS" + `font-latin` `$ 82,400` + `commission 3-Tier 5%` `text-micro`
4. **Tax Reserve Ledger (Isolated)** `Lucide ShieldCheck 16 text-secondary` + "TAX RESERVE (NON-SPENDABLE)" + `font-latin amber` `$ 18,200` + `lock icon` `isolation badge border-amber bg-amber/10` "Auto-locked via Module 16"

**Escrow Immutability & Sub-Deal Clearing Queue — `DataTable` + Filters `All Apps | AU MED | AU DEALS | AU BUSINESS | AU SERV | AU INVEST` `segmented pill accent`**

Table Columns: `Transaction ID font-latin ps-4` `App Context badge` `AU MED teal / AU DEALS indigo` `rounded-pill ps-2 pe-2 text-micro` + `Vendor ID` `Buyer ID` `Amount font-latin` `Escrow Lock Date` `Clearing Status` `holding|disputed|released|partial_milestone|chargeback_frozen|expired_grace` badge `holding amber dot / released emerald / disputed crimson` + `Action` `Dropdown View/Release/Refund/Dispute`.

**Immutability Indicator:** `Header badge Lock + text-micro "Escrow snapshots frozen — fee/amount cannot retroactively mutate"` `tooltip: TRIGGER trg_esc_no_snapshot_update` + row `lock icon 12 text-secondary`.

**Dispute Override Drawer:** `Drawer end w-[560px]` → evidence split `Buyer vs Vendor` + `chat history` + `Agent 10/13 brief` `text-secondary` + `Action` `Full Refund crimson / Partial Split amber / Release to Vendor emerald` → `Modal Rationale` mandatory `Textarea 15+ chars` + `double-confirm` `Confirm + TOTP`.

**Manual Ledger Adjustment Rationale Modal:** Trigger `Adjust Balance` `Ghost border-amber` → `Modal Danger` `w-480` `text-section` "Manual Ledger Adjustment — Immutable Audit" + `Amount font-latin` `+ / -` `Reason` `Textarea required` `min 15` `placeholder "e.g. Chargeback correction ..."` + `Confirm` `bg-crimson` + appends `wallet_adjustment_logs rationale + hash_chain` + `audit trail` `private-calibrator`.

**Payment Gateway Matrix & Fee Pass-Through Configurator — Gateway Toggle Table `grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4` Cards:**

Each Gateway `Fawry / Vodafone Cash / InstaPay / Credit Cards / Paymob / Stripe` card `bg-surface border-subtle rounded-md p-4 hover:shadow-elevation-md` + `Logo 32` (frosted glass icon `bg-surface-secondary rounded-md p-2`) + `Switch ON/OFF` `per tenant app` `chips AU MED|DEALS...` + `Fee allocation` `Toggle Absorb into Margin (emerald) vs Pass-Through to User (amber)` `segmented`.

**Automated Gateway Failover Circuit:** Matrix beneath `Circuit Breaker routing` `Canvas` line graph `Failure Rate 2.1%` threshold `5%` dashed amber; when `>5%` auto-reroutes `checkout traffic → fallback Paymob→Stripe` + `HUD amber toast` + `telemetry alert private-calibrator`.

**E-Invoicing Live Stream (ETA/ZATCA):** Table `Invoice ID | App | VAT amount amber font-latin | QR Preview button Lucide QrCode | API Sync status dot emerald/amber/crimson | Retry` + `Live pulse cyan`.

---

## SCREEN 3: MONETIZATION, DYNAMIC PAYWALL & SUBSCRIPTION ENGINE

### Purpose
Dynamically switch any feature between Free/Paid, build tiered subscriptions, enforce per-user exemptions with zero deploy.

### Layout

**Multi-App Paywall Master Control Matrix — High-Density `DataTable` with `Freeze/Pagination` `sticky header` + `quick drawer`:**

Rows = every platform feature/module/UI section across 5 apps (`AU MED 12 rows, AU DEALS 18, AU BUSINESS 10, AU SERV 9, AU INVEST 7`) → Columns `Feature | Module (1-9) | App | State Toggle FREE vs PAID` `Switch size=md` `FREE bg-surface-secondary border-main text-secondary` `PAID bg-accent text-on-accent border-accent neon cyan shadow` + `Description`. Toggle → `POST /monetization/paywall/toggle {feature_key, app_id, is_paid}` → `feature_flags + paywall_rules` + `CheckModuleStatus` → next request renders `Paywall modal` if `paid` without subscription.

**Dynamic Tier & Subscription Package Builder — DnD Creator:**

Left Palette `ps-4 pe-4 py-4 bg-surface-secondary/30 border border-dashed border-main rounded-md` items `Deal Post Limit`, `Commission Discount %`, `Featured Priority`, `Renewal Cycle 30/90/365`. Center Canvas `min-h-[320px] bg-surface border-subtle rounded-md p-6 grid gap-4` droppable `shadow-elevation-md` where admin drags chips → config `Input number` `ps-3` + `Select`. Right Preview `Gold/Silver/Enterprise` card `bg-surface border-accent rounded-lg p-4` metallic header `gradient amber`. Save → `POST /monetization/tiers`.

**Coupon & Dynamic Discount Matrix:** Table `Code | Value %|fixed | Caps | Expiry | Campaign Tag | Usage 42/1000 progress bar` + `Expiry triggers` cron.

**User-Level Exception & Overrides Vault (Specific User Exemptions) — Search Panel top:**

`Search Input ps-10 Lucide Search` `placeholder User/Vendor/Doctor ID` + `Filters app_id` `X-App-Id` + `Result card` `Avatar + ID + app_roles` + `Controls` 3 toggles: `Permanent VIP Free (emerald)` `Timed Override 7d amber` `Hard Paywall enforce (crimson)` regardless of global → `POST /monetization/exemptions {user_id, feature_key, type, expires_at}` → `paywall_user_exemptions` (`ALWAYS_FREE/HARD_PAYWALL/CUSTOM_DISCOUNT`) checked before global.

---

## SCREEN 4: DYNAMIC TAXONOMY, SCHEMA & FORM CANVAS ENGINE

### Purpose
Manage dynamic fields/entity parameters/categories/form structures across all app contexts without backend migrations.

### Layout — 3-Pane `grid-cols-1 xl:grid-cols-12 gap-6`

**Left Pane 3col — Global Field & Entity Catalog:** `bg-surface border-subtle rounded-md overflow-hidden` `header ps-4 pe-4 py-3 bg-surface-secondary border-b border-main text-section` "Field Catalog" + `Search ps-8` + `Create field` `Primary sm`. List `gap-1 ps-2 pe-2 py-2` rows `Icon Lucide Type 16` + `name_ar/en` `text-body` + `type badge text-micro border-subtle` `text|number|select|point_spatial` + `archived` `opacity-40`. Create → `Drawer` `Field name_en/ar | type ENUM | required | JSON attributes_schema` + `JSON_VALID` check.

**Center Pane 6col — Live Form Visual Canvas & Preview Modal:** Canvas `bg-canvas border-dashed border-medium rounded-md p-6 min-h-[480px] relative overflow-hidden` with `BackgroundLayer subtle grid` + drop zone `DnD from left` (using `@dnd-kit`). Field tiles `bg-surface border-subtle rounded-md ps-3 pe-3 py-2 flex gap-2 hover:shadow-elevation-sm cursor-grab` `Lucide GripVertical`. On drop → config `Drawer` `validation, conditional dependencies, geo radius`. Top bar `Preview` `Primary` → `Modal w-[900px]` split `Tabs iOS|Android|Web` rendering `live form` with `Cairo` + `8pt spacing` + `ps logical`. **iOS preview** `phone frame w-320 h-600 border-bold rounded-[32px] shadow-elevation-lg bg-surface overflow-auto` showing float-label inputs.

**Right Pane 3col — Dynamic Category Hierarchy & Schema Editor:** Tree `ps-2` `deal_categories parent_id` hierarchical `Chevron 12` expand + `Drag to reorder` (`attributes_schema JSON` per category). Controls `Add Subcategory` `Rename` `Archive (is_active toggle)` `Filter sets`. Save → `POST /taxonomy/categories {app_id: AU_DEALS default}` + `Category Hierarchy Editor` audit.

---

## SCREEN 5: LOYALTY NETWORK, BARTER EXCHANGE & MERCHANT HQ

### Purpose
Govern loyalty points, barter valuation ratios, external merchant registry.

### Layout — `grid-cols-1 lg:grid-cols-3 gap-6`

**Card 1 — Loyalty Points Logic & Conversion Engine:** `bg-surface border-subtle rounded-lg p-6 shadow-elevation-sm` `Lucide Coins 16 text-amber me-2` + `text-section` "Loyalty Logic" + `Grid 2col` inputs: `Points per EGP 1 spend` `number ps-3` | `Earning limit per day 5000` | `Expiration timer 365d` | `Cash conversion rate 1000pts = 10 EGP Inter tabular` + `Preview calc font-latin`. Save `POST /loyalty/rules`.

**Card 2 — Barter Exchange & Valuation Rules Engine:** `bg-surface border-subtle rounded-lg p-6` `Lucide ArrowLeftRight 16 text-accent` + `text-section` "Barter Valuation". Controls `Ratio 1.5x/1.0` `Slider` + `Split 50/50` `Segmented` + `Fair-market check` `Switch ON` (validates `deal_items.price_subunit` vs `barter` median) + `Anti-Inflation Safety Caps` `Inputs max 30% inflation` `crimson` `border` + `Simulation Preview` `You give 1000 EGP goods → you get 1500 barter credit, platform 750 each`.

**Card 3 — External Merchant Deals & Partner Registry:** Directory `DataTable` `Merchant | Agreement | Discount Pass-through % | QR Redemption telemetry` `Lucide Store 16` + `Agreement terms Drawer` `valid_from/to` + `Discount % slider` + `QR telemetry` `font-latin redemption 1,240` + `Live pulse emerald`.

---

## SCREEN 6: DISPUTES, SLA TRACKING & CUSTOMER SUCCESS HQ

### Purpose
Resolve escrow disputes, monitor SLA, intercept live non-medical chats.

### Layout — `Tabs: Disputes | SLA | ChatIntercept`

**Escrow Dispute Resolution Center — Multi-Pane `grid-cols-12 gap-4` `bg-surface border-subtle rounded-lg overflow-hidden shadow-elevation-md` `h-[640px]`:**

- Left `col-3` Queue `ps-2 pe-2 py-2` list `Dispute #1024` `status disputed amber dot` + `timer 18h remaining until dispute_deadline_at` `text-crimson font-latin` + filter `All/High Risk`.
- Center `col-6` Workspace `ps-4 pe-4 py-4 overflow-auto` `Evidence` `Buyer vs Vendor` split `2col` `border-main` `Images + PDF` + `Chat histories` `bg-canvas p-3 rounded-md font-body` (sanitized `RegexDataLeakDetector`) + `Transaction metadata` `table font-latin` `escrow_clearings uuid | amount $420 | fx_snapshot` + `Agent 10 + 13 Brief` `bg-amber/10 border-amber rounded-md p-3 text-body`.
- Right `col-3` Actions `ps-4 pe-4 py-4 bg-surface-secondary/30 border-s border-main` `Radio` `Full Refund to Buyer (crimson)` `Partial Split (amber) slider 50/50` `Release to Vendor (emerald)` + `CTA` `Execute` `Primary` with `Rationale required 15+ chars` → `POST /escrow/dispute/resolve`.

**Service Provider SLA & Compliance Monitor — Telemetry Grid `grid-cols-1 md:grid-cols-3 gap-4` Cards:** `Vendor On-time Delivery 94% emerald gauge` + `Doctor Response Latency 2.1m amber` + `Order Fulfillment 98%` `Line graph` `warning triggers` `amber toast when <90%` `Auto Warn` `Switch`.

**Live Non-Medical Support & Chat Intercept — Queue `DataTable` + `Live Viewer`:**

List `ChatID | App | Customer | Agent (Support) | Status typing/queue` + `Intercept` `Button Ghost` `Lucide Eye 14`. Click → `Drawer end w-[720px]` split `Messages` `private-admin-support-intercept.{chatId}` `Reverb` streaming + `Admin input` `Textarea ps-3` `Take Over` `Primary` → `admin joins as invisible` + `Warning banner amber` "Human admin watching".

---

## SCREEN 7: ENTERPRISE HR, MICRO-PERMISSIONS & SECURITY AUDIT

### Purpose
Configure micro-permissions, isolate geo data, test role rendering, review Watchdog audit.

### Layout

**Categorized Permissions Tree View — Hierarchical `ps-2` `App → Module 1-9 → Table → Dynamic Action → Agent`:**

Tree node `flex items-center gap-2 ps-2 py-1.5 hover:bg-surface-secondary rounded-md` `Chevron 12` expand + `Checkbox checked` `border-main` `checked:bg-accent` + `label text-body` + `badge text-micro` `view|execute|both` `view emerald dot / execute amber`. Construct role `Legal Assistant` by checking `agent 7 Audit Terms view` + `contracts table execute` → `Save Role` → `roles + permissions` `POST /roles`.

**Row-Level Geographic Data Isolation Filters — Panel `bg-surface border-subtle rounded-md p-4`:** `Dropdown Governorate multi-select ps-8 Lucide MapPin` `Cairo/Alex` + `App scope` `AU BUSINESS/AU DEALS...` `Select` + `Agent scope` `1-13` `Combobox` → builds `WHERE app_id + governorate` scope applied via `HasAppIdScope` trait. Preview `Data filtered: 120 rows visible` `text-micro`.

**Role Impersonation & DOM Preview Mode — Toggle `Switch` `Impersonate Role` `Lucide Eye 16` + `Select role Legal Assistant`:** When ON → `GET /admin/preview?role_id` returns stripped DOM tree — Sidebar re-renders hiding `display:none` items (`Security Vault` etc.) with `banner amber` "Impersonating Legal Assistant — Preview Mode Exit" `Ghost` + `tooltip` "Server lock authoritative".

**Immutable Security Audit Trail (Watchdog) — `DataTable` read-only `bg-canvas` `border-subtle` `font-latin` for timestamps:**

Columns `Timestamp ms | Actor (sub-admin ID) | App | Query Params | API Call | Button Click | Field Modified | Prompt to Agent` `sticky header bg-surface-secondary`. Rows append-only `TRIGGER no UPDATE/DELETE` + `Search micro-bar ps-8` `Query: "escrow release"` filter + `Super Admin only` banner `Lock 12`. Click row → `Drawer` `Full JSON payload` `Copy + Download Parquet`.

---

## SCREEN 8: SECURITY, DRM, QUARANTINE & POISON PILL VAULT

### Purpose
Maintain DNA binding, heartbeat, off-site backup, emergency self-destruct.

### Layout — `grid-cols-1 lg:grid-cols-12 gap-6` + cinematic obsidian + crimson/emerald pulses.

**DNA Lock Status Board — `col-span-12` `bg-surface border-bold border-emerald/30 rounded-lg p-6 shadow-[0_0_20px_rgba(16,185,129,.15)]` + metallic shimmer:**

`Header` `Lucide Fingerprint 20 text-emerald me-2` + `text-title text-primary` "Hardware & Environment Binding (DNA Lock)" + `Badge ENVIRONMENT MATCHED / SECURE emerald bg-emerald text-on-accent ps-2 pe-2 py-1 rounded-pill text-micro` vs `MISMATCH crimson pulse`. Grid `3col` `Server IP 192.168.1.10 font-latin` `Domain abduni.com` `MAC 00:1A:2B...` each `bg-surface-secondary rounded-md ps-3 pe-3 py-2 flex justify-between` + `Check 12 emerald`.

**48-Hour Heartbeat — `col-6` `bg-surface border-subtle rounded-md p-4`:**

Timer `font-latin text-title text-primary` `47:12:04` countdown `mm:ss` `crimson` when `<2h` + `progress bar emerald 98%` + `Ping Log Table` `Timestamp | Latency ms | Token hash truncated` `DataTable` `max-h-200 overflow-auto` `filter`.

**Poison Pill & Self-Destruct Control Panel — `col-12` `bg-surface border-bold border-crimson/50 rounded-lg p-6 shadow-[0_0_20px_rgba(239,68,68,.2)]` `ARMED & WATCHING` banner `crimson bg-crimson text-on-accent text-micro tracking-widest ps-3 pe-3 py-1 rounded-pill animate-pulse`**

Rows `grid-cols-1 md:grid-cols-2 gap-4`:

- `Multi-Factor DDL Schema Lock` `Indicator Lock 16 emerald` `text-body` "DROP TABLE / TRUNCATE BLOCKED" `badge ON emerald`.
- `Multi-Region Fail-Safe Protocol` `Toggle Switch` `Enforces un-cached multi-region verification before any drop` `OFF → ON` requires `TOTP`.
- `Fail-Safe Quarantine Mode Protocol` `Card amber border-amber bg-amber/10 p-3 rounded-md` `text-body` "Quarantine Mode: license failure → maintenance screen, writes locked, 100% data intact (no destroy)" `Lock 12 amber`.
- `Mandatory 7-Day Grace Period` `Card bg-canvas border-subtle p-3` `Lucide Clock 16 amber` + `text-micro` "7d window requires Super Admin MFA + master passphrase + manual confirm before wipe".
- `Manual Emergency Self-Destruct Trigger` `Button Crimson w-full py-3 text-micro tracking-widest border-bold` `Lucide Bomb 16` "MANUAL SELF-DESTRUCT — SERVER COMPROMISE ONLY" → `Modal Multi-Key` `Master Passphrase input border-crimson` + `MFA 6-digit` + `Type "DESTRUCT"` + `Hold 3s` `crimson ring` → `POST /drm/self-destruct` → `overwrite tables + wipe .env` only if `Quarantine 7d` satisfied.

**Off-Site Data Vault & PITR Telemetry — `col-12` `bg-surface border-subtle rounded-md p-4` `Lucide Cloud 16 text-accent`:**

`Live stream indicators` `WAL → S3 / Supabase vault` `dot emerald pulse` `Last WAL 2s ago font-latin` + `One-Click Disaster Recovery Drill Switch` `Button Ghost border-accent text-accent hover:bg-accent hover:text-on-accent` `Lucide FlaskConical` "Simulated Restore in Sandbox" → `Modal` `Progress` `non-disruptive`.

---

## SCREEN 9: SYSTEM TELEMETRY, EPHEMERAL SWARMS & FAILOVER

### Purpose
Monitor infra health, container lifecycles, Redis queues, hot-site DNS failover.

### Layout — `grid-cols-12 gap-4`

**Telemetry Dashboard Grid — `col-12 grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4`:**

Each Graph Card `bg-surface border-subtle rounded-md p-4 shadow-elevation-sm hover:shadow-elevation-md` `Line/area` `Recharts` `canvas 120h` `gradient accent/10`: `CPU 42% emerald` `RAM 68% amber` `DB Latency 18ms emerald dot` `Redis Backlog 1,240 amber progress` `Gateway Uptime 99.9%` `API Failure 0.4% crimson` threshold line `5% amber dashed`. Hover shows `tooltip font-latin`.

**AU Calibrator & Docker Ephemeral Swarm Monitor — `col-12 grid-cols-12 gap-4`:**

- **Health Score Widget** `col-4` `bg-surface border-subtle rounded-lg p-6 text-center shadow-elevation-md` `Radial gauge SVG 120` track `surface-secondary` progress `emerald >95 amber 90-94 crimson <90` + `text-display font-latin 42px` `95%` + `text-micro text-secondary` "Calibrator" + `Heal button emerald` when `<90` triggers `SelfHealingEngine`.
- **Active Docker Workers Grid** `col-8` `grid-cols-2 md:grid-cols-4 gap-3` each Worker Card `bg-surface border-subtle rounded-md p-3` `Container ID truncated font-latin 10px text-secondary` + `Status dot emerald pulse` `Queue calibrator` + `Uptime 12m font-latin` + `RAM 120MB` progress `w-full h-1.5 bg-surface-secondary` `fill emerald`.
- **Lifecycle Status** banner `text-micro text-secondary` `Self-Terminating upon 100% completion to free RAM/CPU` `Lucide Recycle 12 amber` + `Count 3 active via Redis` live `private-calibrator`.

**Geo-Redundant Failover Controls (CQRS Audit) — `col-12 bg-surface border-subtle rounded-md overflow-hidden`:**

Top `CQRS Event Stream Table` `append-only` `DataTable` `Event ID font-latin | App | Mutation | Actor | Timestamp ms | Hash` `sticky + filter` `super admin only`. Bottom `Hot-Site Failover Switch` `Card amber border-amber bg-amber/10 p-4 flex items-center gap-4` `Lucide Globe 20 amber` + `text-section` "Hot-Site DNS Failover" `text-body text-secondary` "Reroute to secondary cloud backup during outage" + `Switch Toggle` + `One-Click Trigger` `Button Crimson` `Confirm + TOTP + Hold 2s` → `POST /failover/trigger` → `DNS switch` + `HUD crimson`.

---

## SCREEN 10: BROADCAST STUDIO, DYNAMIC AD MANAGER & GEO-DISPATCH ENGINE

### Purpose
Dispatch segmented multi-channel comms, manage ad slots, set geo radius per tenant.

### Layout — `Tabs: Broadcast | Ads | GeoDispatch`

**Notification & Broadcast Studio (Module 19) — `grid-cols-12 gap-6`:**

Left Builder `col-7 bg-surface border-subtle rounded-lg p-6 shadow-elevation-sm`:

- `Tabs Push|SMS|WhatsApp` `segmented pill accent` `Lucide Send 14`.
- `Audience Segmentation Filters` `ps-2 gap-2` pills `App AU MED` `Governorate Cairo` `Role vendor` `Tier Gold` `Agent lease` etc. `multi-select` chips `rounded-pill bg-surface-secondary border-subtle text-micro ps-2 pe-2`.
- `Message Composer` `Textarea ps-3 pe-3 py-3 border-subtle rounded-md min-h-[120px] bg-surface text-body placeholder:text-secondary focus:ring-accent` + `Variables {name} {deal_title}` `text-micro`.
- `Schedule` `Calendar Popover` `Instant vs Scheduled` `DateTime picker`.
- `Send Preview` `Button Primary` `Preview on iOS` `phone frame`.

Right Guardrail `col-5 bg-surface border-subtle rounded-lg p-4`:

- **Gateway Budget Guardrail Widget** `text-section` "Budget Guardrail" + `Progress bar stacked` `SMS 42% / WhatsApp 78% amber` vs `Daily cap $500 / Monthly $12k` `font-latin`  `bar bg-surface-secondary h-2 rounded-pill fill amber` `shimmer` when `>80%` + `Alert Switch` `Notify admin at 80%`.
- `Segment Preview` `count 12,400 recipients` `font-latin`.
- `Send` `Primary bg-accent` + `Schedule` `Secondary`.

**In-App Dynamic Ad & Banner Manager (Module 20) — `grid-cols-12 gap-4`:**

Layout Previewer `col-8 bg-canvas border-dashed border-medium rounded-md p-4 min-h-[360px]` shows `Homepage mock` with `Ad slots` `Carousel 1`, `Sponsored Listing 3`, `Banner top` each `dashed border-accent/30 hover:border-accent bg-surface/80 backdrop-blur rounded-md p-3` placeholder `120x60` `text-micro text-secondary` "Vendor Ad". Drag vendor campaign onto slot (DnD).

Campaign Scheduler Table `col-12` `DataTable` `Campaign | Vendor | Slot | Clicks font-latin | Impressions font-latin | Budget cap $ / progress bar | Status active/paused` + `Budget Caps` input `number`.

**Multi-Tenant Architecture & Geo-Dispatch Boundary Control — `col-12 bg-surface border-subtle rounded-lg p-6`:**

Console `grid-cols-2 gap-6`:

- **Tenant Provisioning:** `Table` `Domain endpoint | App (AU SERV) | Tax Rule ETA/ZATCA toggle` + `Provision Tenant` `Modal` `domain input border-subtle focus:ring-accent + tax toggle`.

- **Geo-Dispatch Boundaries:** `Map` `Leaflet` `canvas 400h bg-surface-secondary rounded-md border-subtle` showing `POLYGON coverage_zone SRID4326` + `POINT ticket_location` + `provider current_location` live `pulse cyan`. Controls `Set Radius` `Slider 1-50km` + `Density auto` `Switch ON` adjusts radius per `completed_tickets` density + `Distance calc` `ST_Distance_Sphere` preview `eta 12m` `font-latin`. Save → `PATCH /serv/dispatch/radius`.

---

## Appendix — Cross-Cutting Specs & Handoff

| Concern | Spec |
|---|---|
| **API-First** | All actions map to `routes/api/v1/*.php` (2.2A-F) + `governance.php` (kill-switch, health, micro-switch, hitl) — `Idempotency-Key` + `X-App-Id` + `X-TOTP` where noted. |
| **Realtime** | Reverb 8080 exclusive — `private-*` + `presence-*` channels listed per screen — UI subscribes via `useEcho` + `HUD` reflects `connected/disconnected` |
| **RBAC** | `user_roles app_id` + `permissions view/execute` + `3-check `micro_switch_matrix` + `EnsureTenantWorkforce` — DOM stripping + server middleware dual |
| **AU Lite** | `feature_flags is_core` protects `AU BUSINESS` — freeze bar in Header — `CheckModuleStatus 503` empty state `illustration Lucide Pause 32 + text-micro "AU MED hibernated"` |
| **Calibrator** | Health `100→90` gauge + `SelfHealingEngine cache:clear/horizon:terminate/recycle` + `EphemeralWorkers --max-time 3600` + `Proactive loops Security/Legal/Refactor` |
| **DRM Vault** | `ENVIRONMENT MATCHED` check per request + `Quarantine` not destroy + `7d Grace MFA` |
| **Financial** | `app_wallet BIGINT subunit tabular Inter` + `escrow immutability TRIGGER` + `Rationale Modal 15+` + `Paymob sub_merchant_id` |
| **Cinematic Continuity** | Token-isolated metallic/glass/obsidian theme travels from HQ → AU BUSINESS → AU MED → AU DEALS → AU SERV → AU INVEST (all `tokens.css` swap). Next app blueprints MUST import this HQ baseline verbatim. |
| **File Handoff** | This blueprint is **spec only** — future Phase 3.2+ frontend sprints (1-3 files/≤150 lines each) will implement per screen using inherited tokens. |

**ملخص عربي:** مخطط لوحة القيادة الرئيسية 10 شاشات — إطار علوي (زر قتل AI أحمر + معاير 100→90 + محوّل 5 تطبيقات + شريط تجميد AU Lite + ملف مشرف + قتل الجلسات) + شريط جانبي 10 أجنحة، ثم S1 القيادة و23 اقتراح HITL مع مصفوفة مفاتيح دقيقة 13 وكيل (تفضيل سائق ثلاثي + HITL + HARD-BLOCKED) + قائمة تعلم استباقي + درج RAG، S2 خزنة مالية ومضمون وتحويل بوابات وتأمين ضريبي، S3 نظام حظر ودفع وطبقات، S4 محرك تصنيف ونماذج ومعاينة هاتف، S5 ولاء ومقايضة، S6 نزاعات وSLA واعتراض دردشة، S7 شجرة صلاحيات وعزل جغرافي ومعاينة انتحال وسجل حراسة، S8 ربط DNA ونبضة 48س وحجر 7أيام وتفجير ذاتي وPITR، S9 قياس وأسراب مؤقتة وتحويل ساخن، S10 استوديو بث ومدير إعلانات وحدود جغرافية — كلها برموز Phase 3.0 المتغيرة، ألوان معدنية سائلة وزجاجية بإضاءة قريبة وجسيمات متحركة مستمرة عبر كل التطبيقات.

*Next: [PHASE 3.1 PART 2] 13-Agent Workspace Deep Dives + 5 App Continuity (inherits this blueprint)*
