# PHASE 3.0 — Master Design System & Core Component Tokens (Arena Canonical)

> **Env:** `Arena` (`arena/01a09d54-drfifty`) | **Project:** `abduniproject` (`D:\Project\Projects\abduniproject` — lowercase, no spaces) | **Scope:** Master Admin Dashboard + 5 Applications (AU BUSINESS `ab_` core + AU MED `amed_` + AU DEALS `adl_` + AU SERV `asv_` + AU INVEST `ainv_`) | **Stack:** React 19 + Inertia v2 + TS 5.7 strict ZERO `any` + Tailwind v4 + Shadcn + Lucide + Vite 0.0.0.0 + Reverb 8080 | **Mode:** Specification ONLY — no implementation code | **Date:** 2026-09-15 | ** pillared:** Rules 1-38 + 11 Pillars + 9 Modules (1-9) + 13 Agents (Table 1.3) + 5 Apps Hub-and-Spoke + Micro-Sprint limits 1-3 files/150 lines | **Registry Lock:** Part 1 13-Agent C-Suite HQ inherits this system verbatim (Phase 3.1+)

---

## 0) Cross-Reference & Governance (Mandatory per Prompt)

- **Source of Truth:** `.arenarules` v2.2 UNIFIED (38 Rules, 11 Pillars, 13 Agents, 9 Modules, Ecosystem Scope `AU BUSINESS core powering 4 B2C`) + `PROJECT_STATE.md` v3.1 (Phase 2 PRISTINE LOCK) have been re-read and enforced before this spec. No rule overridden.
- **Decoupling Mandate:** Every component is **logic-first, token-second** — structure (`props`, `states`, `a11y`, `RTL`) is immutable; visual (`hex`, `shadow`, `radius`, `blur`) is 100% token-driven via `var(--token)`. Changing token values alone must retheme all 5 apps + Master Dashboard without touching `.tsx` structures.
- **AU BUSINESS Hub Anchor:** `AU BUSINESS (ab_)` is `is_core=1` non-hibernatable master shell — owns `MasterWorkforceFactory + Calibrator + AgentStrategyManager` layouts; 4 spokes `is_core=0` inherit tokens but can hibernate via `feature_flags` → UI falls back to `503 Hibernated` empty state (Pillar 4).
- **13-Agent HQ Binding:** All 13-Agent C-Suite screens (Phase 3.1+) MUST import tokens/components from this file — zero ad-hoc colors, zero inline pixel offsets.

---

## 1) THEME-AGNOSTIC VISUAL PHILOSOPHY & DYNAMIC TOKEN ECOSYSTEM

### 1.0 Adaptive Visual Architecture — One Structure, Infinite Skins

The system defines **no hardcoded aesthetic**. A single component tree is rendered through **Theme Profiles** — JSON objects that assign values to semantic tokens. Swapping `themeProfile` requires zero structural change.

| Theme Profile (example) | Token Overrides | Component Behavior Unchanged |
|---|---|---|
| `minimal` | `--surface-primary: #ffffff; --shadow-elevation-md: 0 1px 3px rgba(0,0,0,.08)` | same `<Button>` `ps-4` `focus:ring-accent` |
| `glassmorphism` | `--surface-primary: rgba(255,255,255,.06); --border-main: rgba(255,255,255,.12); --shadow-elevation-md: 0 8px 32px rgba(0,0,0,.12) + backdrop-blur:12px` | same |
| `brutalist` | `--border-main: #000; --border-bold: 3px; --shadow-elevation-md: 6px 6px 0 #000; --radius-md: 0` | same |
| `material` | `--shadow-elevation-lg: 0 10px 20px ...; --radius-md: 12px` | same |
| `dark` | `--canvas-background: #0a0a0f; --text-primary: #ededf0` | same |
| `high-contrast` | `--text-primary:#000; --canvas-background:#fff; --accent-primary:#000; contrast 21:1` + AA guard | same |

**Injection:** `<html data-theme="glassmorphism">` → `resources/css/tokens.css` reassigns `var(--*)`. `Tailwind` resolves `bg-surface` → `var(--surface-primary)` (see §1.1). `Zustand useThemeStore` persists choice in `localStorage` + `app_settings_schema` per `app_id` (AU BUSINESS vs spoke can have different theme).

### 1.0.1 Semantic Ecosystem Color Architecture — Canonical Token Set (9 Core)

All tokens are **CSS variables** (`--token-kebab`). Never use hex in components.

| Token | Role | Light Default | Dark Default | Notes |
|---|---|---|---|---|
| `--canvas-background` | Primary global backdrop (`<body>`, `AppLayout`) | `#f8f9fb` | `#09090b` | behind `surface-*` |
| `--surface-primary` | Cards, panels, modals, elevated containers | `#ffffff` | `#18181b` | `bg-surface` |
| `--surface-secondary` | Secondary drawers, active nav, hover wells | `#f1f5f9` | `#27272a` | `bg-surface-secondary` |
| `--text-primary` | High-contrast headings, body, numbers (`Inter` ledger) | `#0f172a` | `#fafafa` | WCAG AA 4.5:1 vs canvas |
| `--text-secondary` | Mid-contrast captions, placeholders, meta | `#64748b` | `#a1a1aa` | `text-secondary` |
| `--border-main` | Structural borders, dividers, inputs | `#e2e8f0` | `#3f3f46` | `border-main` |
| `--accent-primary` | **Brand action** (Primary Button, focus ring, live `Electric Cyan` agent dot) | `#0ea5e9` → `Electric Cyan` in dark `(#22d3ee)` | `brand-accent` | configurable per `app_id` (AU MED teal, AU DEALS indigo, AU BUSINESS cyan) |
| `--accent-secondary` | Feedback, selection, secondary CTAs | `#6366f1` | `#818cf8` | `brand-accent-secondary` |
| `--brand-crimson` | **Error** (`border-brand-crimson`, `Electric Crimson` warnings, escrow `chargeback_frozen`) | `#dc2626` | `#ef4444` | error token |

**Extended alias tokens (derived, not extra):** `--accent-primary-hover` (`color-mix(in srgb, var(--accent-primary) 90%, black)`), `--text-on-accent: #ffffff` (AA check), `--overlay-backdrop: rgba(0,0,0,.45)` (+ `backdrop-blur:8px`).

### 1.0.2 Dynamic Background Visuals & Effects Layer — Configurable Overlay

A **singleton `<BackgroundLayer>`** sits behind `canvas-background` (`z:-1`) and behind content.

**Capabilities (all toggleable via feature flag `ui.background.mode` without code):**
- `mode: 'static-gradient'` → CSS `radial-gradient(var(--accent-primary) 0% ...)` (0 GPU)
- `mode: 'particle-mesh'` → `<canvas>` node mesh (≈ 60 nodes, `requestAnimationFrame` throttled to 30fps, paused when `prefers-reduced-motion` or `document.hidden`)
- `mode: 'vector-mesh'` → SVG mesh warp
- `mode: 'shader'` → WebGL fragment shader (via feature toggle, fallback to gradient if `WebGL` unavailable)

**Interaction rules (abstract, token-driven):**
- Cursor-reactive: `mousemove` → `BackgroundLayer` exposes `css vars --cursor-x/--cursor-y` → child particles compute `distance < 120px → brightness +15%` (no JS per particle, pure CSS `calc` + `filter`).
- Proximity lighting: `data-proximity="near|far"` set by `IntersectionObserver` on cards → `shadow-elevation-md` variable swaps to glow `0 0 20px var(--accent-primary)` when near.
- Feature toggle `ui.background.interactive=true|false` disables tracking instantly (a11y + battery). **No component ever imports particle logic** — it is a wrapper.

---

### 1.1 TAILWIND & FLEXIBLE UI TOKENS CONFIGURATION (Spec — no code execution)

**Engine:** Tailwind CSS v4 (`@theme` + CSS vars) — `tailwind.config.js` extends to `var(--token)` so token swap rethemes instantly.

#### 1.1.1 Semantic Token Mappings

| Utility Class (allowed) | Resolves To | Forbidden |
|---|---|---|
| `bg-canvas` → `background: var(--canvas-background)` | `bg-[#f8f9fb]` ❌ |
| `bg-surface` → `var(--surface-primary)` | `bg-white` ❌ |
| `bg-surface-secondary` → `var(--surface-secondary)` |  |
| `text-primary` → `color: var(--text-primary)` | `text-[#0f172a]` ❌ |
| `text-secondary` → `var(--text-secondary)` |  |
| `border-main` → `border-color: var(--border-main)` | `border-[#e2e8f0]` ❌ |
| `bg-accent` / `text-accent` → `var(--accent-primary)` | `bg-blue-500` ❌ |
| `bg-accent-secondary` | `var(--accent-secondary)` |  |
| `border-crimson` → `var(--brand-crimson)` |  |

**Font tokens:** `font-ar: Cairo/Tajawal` (see §2), `font-latin: Inter`.

#### 1.1.2 Dynamic Spatial Elevation & Shadow Systems

Three elevation primitives — each **CSS var**, theme profile rewrites value (soft shadow vs hard offset vs glow).

| Token | Light (minimal) | Brutalist | Glassmorphism | Usage |
|---|---|---|---|---|
| `--shadow-elevation-sm` | `0 1px 2px rgba(0,0,0,.06)` | `3px 3px 0 #000` | `0 2px 8px rgba(0,0,0,.04) + inset 0 1px 0 rgba(255,255,255,.6)` | buttons, inputs |
| `--shadow-elevation-md` | `0 4px 12px rgba(0,0,0,.08)` | `6px 6px 0 #000` | `0 8px 32px rgba(0,0,0,.12)` | cards, drawers |
| `--shadow-elevation-lg` | `0 16px 40px rgba(0,0,0,.12)` | `10px 10px 0 #000` | `0 20px 60px rgba(0,0,0,.20) + glow` | modals, HITL cards |

Tailwind maps `shadow-elevation-sm|md|lg` → `box-shadow: var(--shadow-*)`. Components use `shadow-elevation-md` — theme decides shape.

#### 1.1.3 Structural Border & Focus Tokens

| Token | Values (all via var) | Usage |
|---|---|---|
| `--border-subtle: 1px solid var(--border-main)` | `border-subtle` | cards, inputs default |
| `--border-medium: 1.5px solid var(--border-main)` | `border-medium` | active, selected |
| `--border-bold: 2px solid var(--border-main)` → brutalist `3px` | `border-bold` | error, brutalist |
| `--radius-sm: 6px`, `--radius-md: 10px`, `--radius-lg: 16px`, `--radius-pill: 999px` | `rounded-md` maps to `var(--radius-md)` |
| **Focus ring** | `focus:ring-2 focus:ring-accent focus:ring-offset-2 focus:ring-offset-canvas focus:outline-none` → `ring-color: var(--accent-primary)` | **Mandatory** on every interactive (Rule 6 + AA) |

**Validation:** `stylelint` rule `color-no-hex` + `declaration-property-value-disallowed-list: { "/color/": ["/#"] }` except `tokens.css` — hex allowed **only** in token definitions.

---

## 2) TYPOGRAPHY, SPACING & RTL SYSTEM

### 2.1 Font Families — Per `.arenarules` + RTL Lock

| Role | Family | Weights Loaded | `font-display` | App |
|---|---|---|---|---|
| **Arabic primary** | `Cairo` (primary) + `Tajawal` (fallback) | `400 Regular`, `600 SemiBold`, `700 Bold` | `swap` | `ar` locale: `font-ar` is default on `html[lang="ar"]` |
| **Latin / Numerical** | `Inter` | `400,500,600,700` | `swap` | financial ledgers `subunit` tables, code blocks, `app_wallets` numbers, `DataTable` numeric col |

**Implementation spec (no code):** `resources/css/typography.css` `@import` Google Fonts `Cairo+Tajawal+Inter` with `preload` + `unicode-range` split. `html[lang="ar"] body { font-family: var(--font-ar) }`, `html[lang="en"]` → `Inter`, `td[data-numeric] { font-family: var(--font-latin); font-variant-numeric: tabular-nums; }` for ledger alignment.

### 2.2 Type Scale — Fixed 5 Tiers (Strict)

| Tier | Size / Line-Height | Weight | Letter-Spacing | Usage | Token |
|---|---|---|---|---|---|
| **Display Headers** | `32px / 36px` | `700 Bold` (Cairo) | `-0.02em` | Dashboard hero, `AU BUSINESS` hub title | `text-display` |
| **Screen Titles** | `24px / 28px` | `600 SemiBold` | `-0.015em` | Page `<h1>` (e.g., `AU DEALS Inventory`) | `text-title` |
| **Section Headers** | `18px / 22px` | `500 Medium` | `0` | Card titles, drawer headers | `text-section` |
| **Body / Form Inputs** | `14px / 16px` | `400 Regular` | `0` | body, `Input`, `DataTable cell`, `description` | `text-body` |
| **Micro-Labels & Badges** | `11px / 12px` | `700 Bold` `UPPERCASE` `tracking-widest` | `0.08em` | `is_stagnant` badge, `HITL` `requires_hitl` tag, `DataTable` status | `text-micro` |

**Scale is fluid-proof:** No arbitrary `text-[13px]`. Every text element must map to one tier + token `text-primary|secondary` + `font-ar|latin`.

### 2.3 Spacing Grid — Strict 8pt (4px exception only for hairline)

`4px, 8px, 16px, 24px, 32px, 48px, 64px` — Tailwind `spacing` maps to `var(--space-*)`.

| Token | Value | Tailwind | Use |
|---|---|---|---|
| `--space-1: 4px` | hairline gaps only | `gap-1` | icon+label `gap-1` |
| `--space-2: 8px` | base unit | `p-2 gap-2` | button `px-4` (16px = `space-4`), card `p-4`, `gap-2` between form rows |
| `--space-4: 16px` | card padding, section gap | `p-4 gap-4` | `DataTable` cell `py-3 px-4` (12/16 snap to 8pt via calc) |
| `--space-6: 24px` | section separation | `gap-6` | `MicroSwitchMatrix` rows |
| `--space-8: 32px` | page gutters | `p-8` | `AppLayout` `ps-8 pe-8` on 1440+ |
| `--space-12: 48px` | hero | `py-12` | dashboard hero |
| `--space-16: 64px` | page top | `py-16` | |

**Anti-drift:** `eslint` rule forbids `p-[13px]` / `m-[7px]` — only `p-2/4/6/8` etc.

### 2.4 Logical Property Standard — RTL/LTR Mandatory

**Every directional utility MUST be logical.** Raw `pl-`, `ml-`, `left-` are banned.

| Logical | Physical `ltr` | `rtl` | Example |
|---|---|---|---|
| `ps-*` → `padding-inline-start` | `padding-left` | `padding-right` | `ps-4` on `Input` icon |
| `pe-*` → `padding-inline-end` | `padding-right` | `padding-left` | `pe-10` for `clear` button |
| `ms-*`/`me-*` | `margin-inline` | flipped | `ms-auto` for app switcher |
| `text-start` / `text-end` | `left`/`right` | flipped | `text-start` on all labels (never `text-left`) |
| `inset-inline-start: 0` | `left:0` | `right:0` | drawer `inset-inline-end-0` |

**Layout contract:** `AppLayout` sets `<html dir="rtl" lang="ar">` by default (`locale` from `users.locale` ENUM `ar|en`); toggling `dir` flips entire UI without CSS change. `DataTable` sticky header uses `inset-block-start`. `Modal` uses `inset-0` + `ps-` logical.

---

## 3) ATOMIC COMPONENT SPECIFICATIONS — States & Micro-Interactions (Logic-First)

> **Rule for all:** Each component exposes `states: Default | Hover | Active | Focus | Disabled | Loading | Error`. Visual deltas are **solely token swaps** (e.g., `hover:bg-surface-secondary` → `active:shadow-elevation-sm`). Theme profile decides whether interaction is `scale(0.98)` (soft) or `translate(1px,1px)` (brutalist) — component never hardcodes.

### 3.1 Flexible System Buttons — Primary / Secondary / Ghost

| Variant | Default | Hover | Active | Focus | Disabled | Loading | Error (never, but guard) |
|---|---|---|---|---|---|---|---|
| **Primary** | `bg-accent text-on-accent border-transparent shadow-elevation-sm` `rounded-md ps-4 pe-4 py-2` `text-body` | `bg-accent-hover` (mix 90%) + `shadow-elevation-md` | `translate-y-px` *or* `scale-[0.98]` per theme (`--motion-press`) + `shadow-elevation-sm` | `ring-2 ring-accent ring-offset-canvas` | `opacity-40 pointer-events-none` `bg-surface-secondary` | `opacity-80 pointer-events-none` + `<Spinner size=16>` inline `ms-2` | `border-crimson` if form submit fails |
| **Secondary** | `bg-surface border-main text-primary border-subtle` | `bg-surface-secondary border-medium` | same press | same ring | `opacity-40` | same | same |
| **Ghost** | `bg-transparent text-primary` `border-transparent` | `bg-surface-secondary` | `bg-surface-secondary` `scale-[0.99]` | ring | `opacity-40` `text-secondary` | same | — |

**Micro-interaction token:** `--motion-press: translateY(1px)` (minimal) or `scale(0.98)` (soft) or `translate(2px,2px)` (brutalist) — button applies `active:var(--motion-press)`. **Icon:** `Lucide` 16px `ms-2`.

### 3.2 Interactive Background Layer Engine — Spec

`<BackgroundLayer mode="particle-mesh|gradient|shader" interactive={bool} />`

- **Wrapper:** `position: fixed; inset: 0; z-index: -1; pointer-events: none;` contains `<canvas>` + `aria-hidden`.
- **Props:** `mode`, `density (low|med|high)`, `interactive`, `tint: var(--accent-primary) at 6%`.
- **Lifecycle:** mounts `canvas` at `devicePixelRatio`, animates via `requestAnimationFrame`; pauses on `visibilitychange` + `prefers-reduced-motion`; destroyed on route change (Inertia `before`).
- **No leakage:** page content never depends on layer — if JS disabled, graceful `gradient` via CSS `background: var(--canvas-background)` remains.

### 3.3 Inputs & Form Controls — Float-Label, Searchable Dropdown, Date/Time, Tags

**Float-Label Input `<TextInput>`**

```
[ps-3 pe-10 py-2.5 bg-surface border-subtle rounded-md text-body text-primary placeholder:text-secondary]
label: absolute ps-3 `text-secondary text-body` → on focus/filled: `text-micro text-secondary` `top-1.5`
states:
  Default: border-subtle
  Hover: border-medium
  Focus: border-accent + ring-2 ring-accent (focus-within)
  Error: border-crimson (border-bold) + `aria-invalid=true` + inline micro-label `text-[11px] text-crimson ps-1 mt-1` (required)
  Disabled: bg-surface-secondary opacity-60 pointer-events-none
  Loading: suffix spinner
```

**Searchable Dropdown `<Combobox>`** — headless `cmdk` + `Popover` — `input ps-8` (search icon `ps-3`), list `max-h-60 overflow-auto bg-surface shadow-elevation-lg border-subtle rounded-md`, option `ps-3 pe-8 py-2 hover:bg-surface-secondary aria-selected:bg-accent aria-selected:text-on-accent`.

**Date/Time Picker** — `shadcn Calendar` + `Popover`; `locale="ar"` → `dir=rtl`, `Inter` for numbers; `selected: bg-accent text-on-accent`.

**Multi-Select Tags** — selected pills `bg-accent-secondary text-primary rounded-pill ps-2 pe-1 py-1 text-micro` + `x` `Lucide X` 12px.

**Global Error Rule:** Any `errors.field` from `useForm` → `border-brand-crimson` + `role="alert"` micro-label (Rule 6). Never use `border-red-500` directly.

### 3.4 Data Tables — High-Density Grid (Rule 13)

`<DataTable>` mandatory for all admin grids — `shadcn Table` + `TanStack`.

| Feature | Spec |
|---|---|
| **Container** | `bg-surface border-subtle rounded-md shadow-elevation-sm overflow-hidden` |
| **Header** | `sticky top-0 bg-surface-secondary text-micro text-secondary uppercase tracking-widest border-b border-main` `ps-4 pe-4 py-3` — reorders via `dnd-kit` `ps-2` grip `Lucide GripVertical` |
| **Row** | `border-b border-main hover:bg-surface-secondary` `h-12` (`space` 48px/ `space-4` 16px + 8pt) |
| **Cell** | `text-body text-primary` `ps-4` `text-start`; numeric `font-latin tabular-nums`; `max-w` truncate + drawer on click |
| **Status Badge** | `rounded-pill ps-2 pe-2 py-1 text-micro` `bg-surface-secondary border-subtle` + `dot w-2 h-2 rounded-full bg-accent` (live) / `bg-crimson` (frozen) |
| **Quick Action Drawer** | row `end` slot `pe-2` → `DropdownMenu` `View/Edit/Hide` — respects Tiered Mutation (Tier1 `is_hidden` only) |
| **Pagination** | `Server-side` via Inertia `?page&per_page` + `meta.total` — never client `COUNT(*)` on hot (Rule 37) — `ps-4 pe-4 py-3 border-t border-main bg-surface-secondary` |
| **Empty** | `py-16 text-center text-secondary text-body` + `Illustration` `Lucide Inbox` 32px `opacity-40` |

### 3.5 Micro-Switch Matrix Controls — Agent Sub-Capability Toggles

Per `micro_switch_matrix` row (`agent_id 1-13`, `capability_key`, `preferred_driver`, `llm_fallback_enabled`, `requires_hitl`, `is_enabled`).

```
Row card: bg-surface border-subtle rounded-md p-4 flex items-center gap-4
  left: Agent avatar 32 + `text-section text-primary` label `text-secondary text-body` capability
  center: <Switch checked={is_enabled} onCheckedChange={toggle} aria-label> `data-state` → `bg-accent` (on) `bg-surface-secondary` (off) `focus:ring-accent`
  right: [ ] Approval Required <Checkbox checked={requires_hitl} disabled={!is_enabled} /> `text-micro text-secondary` + Status indicator dot `w-2 h-2 rounded-full bg-accent|bg-crimson|bg-surface-secondary` + Hitl role `text-micro`
```

**States:** `is_enabled=false` → switch off + checkbox `disabled opacity-40`. Pending toggle → `Loading` spinner overlay `absolute inset-0 bg-surface/60 backdrop-blur-sm`.

### 3.6 HITL Approval Cards — Central Suggestion Feed

Modular `HITLCard` for `private-hitl` queue.

```
hitl-card: bg-surface border-subtle rounded-lg shadow-elevation-md p-6 flex-col gap-4
  header: `text-micro text-secondary` Agent ID `Agent 6 SecOps` `·` `micro_switch_key: patch_generate` + `confidence 0.82 <0.90` badge `bg-crimson text-on-accent rounded-pill ps-2 pe-2`
  body: `text-section text-primary` "Proposed: patch XSS vector" + `text-body text-secondary` rationale + `Predicted impact` `+12% efficiency` `text-accent text-micro`
  meta: `is_post_escrow` tag `border-crimson`
  CTA row: grid grid-cols-2 sm:grid-cols-4 gap-2
    Approve `Primary bg-accent`  Reject `Secondary border-main`  Modify `Ghost`  Ask Later `Ghost border main` (all ps-3 pe-3)
  footer: `text-micro text-secondary` `Takes ~2min` + `Reverb live dot bg-accent animate-pulse`
```

**Loading:** `Approve` → `Loading` spinner disables all 4.

### 3.7 AI HUD Floating Toasts / Notifications

Top-right `position: fixed; inset-inline-end: 16px; inset-block-start: 16px; z-index: 60;` stack `gap-2`.

| Type | Visual | Token |
|---|---|---|
| **WS Connected** | `bg-surface border-subtle shadow-elevation-md rounded-md ps-3 pe-3 py-2 flex gap-2` dot `w-2 h-2 rounded-full bg-accent` (`Electric Cyan` in dark) + `text-body text-primary` "Reverb 8080 live" `text-secondary text-micro` region | `bg-accent` live |
| **Agent Activity** | same + `Lucide Bot` 16 `text-accent` + pulse `animate-pulse` | `Electric Cyan` `#22d3ee` alias `--accent-primary` in dark |
| **Warning Override** | `bg-crimson text-on-accent border-crimson shadow-elevation-md` `Lucide AlertTriangle` 16 + `text-micro` "Calibrator 87% → heal" | `Crimson Red` `var(--brand-crimson)` |

**Behavior:** auto-dismiss 5s except `warning` persistent until `healed` event `private-calibrator`; queue via `Zustand useHudStore`; `aria-live="polite"`.

### 3.8 Modals & Slide-over Drawers

| Component | Spec |
|---|---|
| **Modal** | `Overlay: fixed inset-0 bg-overlay-backdrop backdrop-blur-[8px] z-40` + `Content: fixed top-1/2 start-1/2 -translate-x-1/2 -translate-y-1/2 bg-surface rounded-lg shadow-elevation-lg border-subtle p-6 max-w-lg w-[90vw] max-h-[85vh] overflow-auto z-50` + `Close: Lucide X 20 absolute inset-inline-end-4 inset-block-start-4 text-secondary hover:text-primary focus:ring-accent` |
| **Drawer** | `Overlay same` + `Content: fixed inset-block-0 inset-inline-end-0 w-[420px] max-w-[92vw] bg-surface border-s border-main shadow-elevation-lg p-6 overflow-auto` `transition: transform 200ms` `data-state=open: translate-x-0` logical `inset-inline-end` flips in RTL |

Both trap focus (`Radix Dialog`).

---

## 4) MULTI-TENANT & RBAC UI ADAPTATION

### 4.1 Dynamic Role-Based Visibility — 3 Modes (per `permissions.type view|execute`)

| Mode | When `cannot('view')` | When `cannot('execute')` but `can('view')` | Token/Class |
|---|---|---|---|
| **Hidden** | `display: none` (default for nav items, `AppContextSwitcher` apps, `MicroSwitchMatrix` rows) — server also 403 + client `Gate::before` | N/A | `{can('au_med.view') && <NavItem/>}` |
| **Disabled** | N/A | `opacity-40 pointer-events-none select-none` + `tooltip "approval required"` (`requires_hitl` style) | `disabled:*` + `aria-disabled` |
| **Blurred** | Alternative for sensitive metrics (GMV) when `view` missing but layout must preserve space | `blur-md pointer-events-none select-none` `aria-hidden` + `Lock overlay` `Lucide Lock 24` center + `text-micro "Contact admin"` | `blur-md` |

**Enforcement:** `useCan(slug)` (Zustand + `spatie` per `user_roles app_id` scoping) wraps every nav/CTA; DOM stripping is UX only — server `can:permission.execute` middleware is authoritative (Rule 36). Toggle in `micro_switch_matrix requires_hitl` applies **Disabled→HITL card** path.

### 4.2 Multi-App Context Switcher — Top Bar Component

`TopBar: sticky top-0 z-30 bg-surface border-b border-main ps-4 pe-4 py-3 flex items-center gap-4 shadow-elevation-sm`

```
left: Logo `AU BUSINESS` (active app label) `text-section text-primary`
center: App Switcher `SegmentedControl` 5 pills:
  [AU BUSINESS] [AU MED] [AU DEALS] [AU SERV] [AU INVEST]
  each: `ps-3 pe-3 py-1.5 rounded-pill text-micro border-subtle` 
  active: `bg-accent text-on-accent border-accent`
  disabled (no view perm or hibernated `feature_flags is_enabled=0`): `opacity-40 pointer-events-none` + `tooltip "AU MED hibernated"`
  hibernated: `blur-[1px]` + `503` badge
right: User Avatar `Dropdown` + `Notifications private-notifications.{id}` + `Reverb dot` + `Locale Switcher ar|en`
```

**Behavior:**
- `X-App-Id` header injected on every Inertia/axios request from switcher (`useAppIdStore`).
- App change → `Inertia.visit(route('dashboard', {app_id}))` → `AppLayout` re-evaluates `CheckModuleStatus` per app (`is_core` protects `AU BUSINESS` never hibernated).
- Multi-role user sees only apps where `user_roles.app_id` exists; super_admin sees all 5 via `Gate::before`.

**Mobile:** Switcher collapses to `DropdownMenu` `Lucide LayoutGrid` 20 `ps-2` on `<768px`.

---

## 5) ACCESSIBILITY & RESPONSIVE BREAKPOINTS

### 5.1 Target Breakpoints — 4 Tiers (Mobile-First)

| Tier | Width | Container | TopBar | Nav | DataTable | HITL Grid |
|---|---|---|---|---|---|---|
| **Desktop Ultra-Wide ≥1440px** | `1440px+` | `max-w-[1280px] mx-auto ps-8 pe-8` | `ps-8 pe-8` | Sidebar `w-280` permanent (`ps-0`) | `per_page=20` + sticky header | 3 col |
| **Laptop / Standard 1024-1439px** | `lg` | `max-w-[1024px] ps-6 pe-6` | `ps-6 pe-6` | Sidebar collapsible `w-240` | same | 2 col |
| **Tablet 768-1023px** | `md` | `ps-4 pe-4` | `ps-4 pe-4` | Drawer `overlay` `isOpen` (hamburger `Lucide Menu 20`) | `per_page=15` horizontal scroll `overflow-x-auto` | 2 col → 1 |
| **Mobile 320-767px** | `sm` | `ps-4 pe-4` (`16px`) | `ps-4` + switcher dropdown | Drawer full `w-[92vw]` | cards fallback (`DataTable` → `CardList` stacked) `ps-4 pe-4` per card | 1 col |

**Implementation:** `resources/js/Hooks/useBreakpoint.ts` `window.matchMedia`; Tailwind `sm:768 md:1024 lg:1440`.

### 5.2 Accessibility Constraints — WCAG 2.1 AA (Non-Negotiable)

| Requirement | Token / Rule | Enforcement |
|---|---|---|
| **Contrast** min `4.5:1` (text) `3:1` (large/border) | `text-primary` vs `canvas/surface` AA pair tested per theme profile; `text-secondary` ≥4.5:1 vs `surface-primary` only when `≥14px Bold` else use `text-primary` | `axe-core` `npm run a11y` fails build if `<4.5` |
| **Keyboard** explicit Tab path: `TopBar → AppSwitcher → Nav → Main → first Input/Button → sequential` | `focus:ring-2 ring-accent` visible on **every** interactive; `focus-visible` only; `tabIndex=0` on cards with `role="button"` | `Radix` auto-trap in Modal/Drawer + `skipLink` `href="#main"` |
| **Screen reader** | `aria-label` on `Switch/Checkbox/TopBar toggle`, `aria-invalid+aria-describedby` on error inputs, `aria-live="polite"` HUD | `eslint-plugin-jsx-a11y` |
| **Motion** | `prefers-reduced-motion` → `--motion-press: none`, `BackgroundLayer interactive=false`, `transition-duration 0` | `media (prefers-reduced-motion)` in `tokens.css` |
| **Zoom** `200%` / `320px` readable | `DataTable` horizontal scroll + reflow to cards; no `fixed width` > `100vw` | manual QA at `320px` |
| **Color not sole indicator** | error needs `border + icon + text`; status badge needs `dot + text` | component spec §3.4/3.6 |

**Audit:** `Lighthouse ≥95` a11y per build; `DataTable` sorts announce `aria-sort`.

---

## 6) DESIGN ANTI-PATTERNS & SYSTEM RESTRICTIONS — Strict Prohibitions

### 6.1 Prohibitions (Build-Fail)

| # | Forbid | Allowed | Lint / Fail |
|---|---|---|---|
| 1 | **Hardcoded visual values:** `hex` `#ff...`, `rgb(...)`, `style={{color:'#...'}}`, `p-[13px]`, `bg-[#fff]` inside `.tsx` | ONLY `bg-surface text-primary border-main bg-accent` + `var(--space-*)` + `rounded-md` → `var(--radius-md)` | `eslint no-restricted-syntax` + `stylelint color-no-hex` → **CI fail** |
| 2 | **Non-accessible contrast combos:** any token pair `<4.5:1` (text) | Use pre-audited pairs `text-primary/canvas`, `text-on-accent/accent` only | `axe` CI fail |
| 3 | **Rigid pixel offsets outside 8pt grid:** `margin: 7px`, `gap: 13px` | Only `space-1/2/4/6/8/12/16` (4/8/16/24/32/48/64) | `eslint` fail |
| 4 | **Physical props in components:** `pl-`, `ml-`, `left-`, `text-left` | ONLY `ps- pe- ms- me- text-start text-end inset-inline-*` | `eslint` `tailwindcss/logical` |
| 5 | **JSONB in MySQL core:** `JSONB` type | ONLY `JSON` (MySQL 8.4) + `JSON_VALID` CHECK | migration fail |
| 6 | **Inline CSS pixel offsets** `style.top = '13px'` | Token var `var(--space-*)` | fail |

### 6.2 Mandatory Abstraction Layer — How Theming Works Without Breaking Layout

```
tokens.css (9 core + shadows + borders + radii)
      ↕ var(--*)
tailwind.config.js (extensions map to var)
      ↕ utility classes (bg-surface, shadow-elevation-md)
Component.tsx (logic + states + a11y + RTL)
      ↕ ZERO hex, zero px, zero inline style
ThemeProfile JSON (per app_id) → <html data-theme> swap → instant retheme
```

**Rule:** Updating `tokens.css` ` :root[data-theme="dark"] { --surface-primary: #18181b; }` **instantly** repaints all 5 apps + Master Dashboard **without** re-rendering layout (no box-model change, because `spacing`, `border`, `radius` vars unchanged unless intentional). Layout stability is guaranteed because **only color/shadow/blur tokens are theme-dependent**; `spacing` and `typography` are theme-agnostic (except `high-contrast` enlarges `border-bold`).

**Governance:** PR touching `tokens.css` requires `Lighthouse + axe + visual diff` (`Chromatic`) + `RTL screenshot` pass.

---

## Appendix A — File Map (Spec Only, No Code Yet)

| Target (future implementation) | Spec Source Here |
|---|---|
| `resources/css/tokens.css` | §1-1.1 tokens (9 core + shadows + borders + radii) |
| `resources/css/typography.css` | §2.1 fonts + §2.2 scale |
| `tailwind.config.js` | §1.1 mappings + §5.1 breakpoints |
| `resources/js/Components/UI/{Button,Input,Combobox,Table,Switch,Card,Toast,Modal,Drawer,BackgroundLayer}.tsx` | §3 atomic specs |
| `resources/js/Components/Layout/{TopBar,AppSwitcher,BackgroundLayer}.tsx` | §3.2 + §4.2 |
| `resources/js/Hooks/{useCan,useTheme,useBreakpoint}.ts` | §4.1 + §5.1 |
| `resources/js/Stores/{useTheme, useHud}.ts` | §1 + §3.7 |

**Micro-Sprint obedience:** Phase 3.1+ will respect **1-3 files / ≤150 lines** per sprint — this spec is the scale guard (e.g., `Button.tsx` + `tokens.css` delta per sprint, not bulk).

## Appendix B — 13-Agent HQ Inheritance Contract

> All 13-Agent C-Suite HQ screens (Part 1 Registry Lock: CFO/CTO/CMO/Vendor Success/Customer Support/SecOps/CLO/SupplyChain/PR/QA-Med/DevOps/GlobalController/Fraud-AML) **MUST** import from this system:
> - Use `surface-primary|secondary`, `text-primary|secondary`, `border-main`, `accent-primary` only — never agent-custom hex.
> - `HITLApprovalCard` + `MicroSwitchMatrixControls` + `AI HUD Toast` tokens are locked (§3.5-3.7) — approval queue is single source.
> - `AppSwitcher` must expose `AU BUSINESS` as default; spokes hibernate to `blur-md` per `feature_flags`.

---

**ملخص عربي:** نظام تصميم موحد غير مرتبط بمظهر بصري — طبقة رموز دلالية (9 ألوان + ظلال + حدود + تركيز) عبر `var(--token)` تعيد تلوين 5 تطبيقات + لوحة الإدارة فورًا بتغيير `data-theme` (Minimal/Glass/Brutalist/Material/Dark/High-Contrast) دون لمس بنية المكونات، مع طباعة Cairo/Tajawal+Inter (32→11px)، شبكة 8pt، خصائص منطقية RTL، مكونات ذرية (أزرار/خلفية تفاعلية/inputs/جداول/مفاتيح/HITL/تنبيهات/modals)، تكيّف RBAC (إخفاء/تعطيل/تمويه) + محوّل تطبيقات 5، ونقاط كسر 1440/1024/768/320 + WCAG AA 4.5:1 + حظر صارم للقيم المكتوبة ثابتة.

*Next: [PHASE 3.1] Screen Blueprints — 13-Agent C-Suite HQ (inherits this system)*
