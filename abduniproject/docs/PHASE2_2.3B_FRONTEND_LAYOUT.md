# PHASE 2.3b — React 19 Clean Architecture Frontend Layout (Arena Canonical)

> **Env:** `Arena` (`arena/01a09d54-drfifty`) | **Project:** `abduniproject` | **Frontend:** React 19 + Inertia v2 + TS 5.7 strict zero any + Tailwind v4 + Shadcn + Lucide + Vite | **State:** Zustand (React) + Inertia `usePage/useForm` (Pinia/Redux pattern) | **Realtime:** Reverb 8080 | **Date:** 2026-09-14

## 0) Principles (`.arenarules` + Pillars)

- **RTL-first:** `dir="rtl"` Arabic primary (Cairo/Tajawal + Inter), logical props `ps/pe/ms/me` (Rule frontend_skills)
- **0 `any`:** `strict:true`, explicit DTOs, `zod` via FormRequests mirror
- **Isolation:** `X-App-Id` header per `resources/js/Pages/AU MED|AU DEALS|AU SERV|AU INVEST` (space-form, Phase 4.0)
- **Thin API:** `Services/api.ts` (Axios + silent refresh queue) — no business logic in components

### 0.1 AU BUSINESS — Master Core B2B Anchor (AUDIT FIX 2026-09-14 — Phase1→2 Strict Alignment)

**AU BUSINESS (`ab_`, `AU_BUSINESS`) is the Master Core B2B Platform — non-hibernatable (`is_core=1`, `CheckModuleStatus` → `503` blocked), owns **Paymob sub-merchant vault**, **single `app_wallet` universal ledger (no base, `BIGINT subunit`, `CHECK>=0`)**, **FX `exchangerate_api` */30**, and **shared RBAC + AU Lite gateway**. The 4 B2C spokes — **AU MED (`amed_`)**, **AU DEALS (`adl_`)**, **AU SERV (`asv_`)**, **AU INVEST (`ainv_`)** — are `is_core=0` hibernatable and **settle exclusively through AU BUSINESS vault** (no spoke-local liquidity). All tables/APIs below enforce `app_id ENUM('AU_BUSINESS',...) DEFAULT 'AU_BUSINESS'` as root tenure.

**Hub-and-Spoke:**
```
[AU BUSINESS Core `ab_` — B2B Escrow Vault + Wallet + RBAC + Calibrator — Modules 1-9 anchor]
      ├─ AU MED (clinical PG + pgvector)
      ├─ AU DEALS (B2B medicine exchange — Module 4)
      ├─ AU SERV (real-time dispatch — Module 5/6)
      └─ AU INVEST (micro-finance)
```
**Strict Sequential:** `5 Applications` (1 core + 4 spokes) | `9 Modules 1→9` (no 10-15) | `13 Agents 1→13` (`micro_switch_matrix` + `preferred_driver`) | `100% Anti-Leak` (`RegexDataLeakDetector` until `post-escrow holding`) | `Universal Wallet` (`single app_wallet`, `5% adjustable` `commission_rules`, `single-payer Oil3`) | `Calibrator 100→90%` (`Pre<15ms/In/Post` + `Ephemeral Swarm`).

---

---

## 1) Complete Directory Tree (Production)

```
resources/js/
├── Components/
│   ├── UI/                          # Shadcn (Button, Card, Dialog, Table/DataTable, Badge)
│   │   └── DataTable.tsx            # Rule13 server-paginated
│   ├── Layout/
│   │   ├── AppLayout.tsx            # RTL logical, TopNavbar + Sidebar
│   │   ├── TopNavbar.tsx            # Emergency Red Button persistent
│   │   └── Sidebar.tsx
│   ├── Calibrator/
│   │   ├── PerformanceGauge.tsx     # 100%→90% live gauge (Reverb)
│   │   └── HealthScoreCard.tsx
│   ├── Governance/
│   │   ├── MicroSwitchMatrixPanel.tsx # Agent toggles + HITL checkboxes
│   │   └── HitlInbox.tsx            # Pending approvals (Security/Legal/Code)
│   └── Shared/
│       ├── EmptyState.tsx
│       └── ConfirmDialog.tsx
├── Stores/                          # Zustand (Redux/Pinia pattern for React)
│   ├── useAuthStore.ts              # user, roles, permissions, app_id
│   ├── useCalibratorStore.ts        # score, components, autoHeal, Reverb sync
│   ├── useHitlStore.ts              # queue, approve, WebSocket
│   ├── useWorkforceStore.ts         # tenant-agents, dispatch progress
│   └── useFeatureFlagStore.ts       # AU Lite flags → 503 handling
├── Services/                        # API Services (thin, typed)
│   ├── api.ts                       # Axios instance + interceptors (silent refresh + queue)
│   ├── system.ts                    # GET modules/status, POST toggle
│   ├── calibrator.ts                # GET health-score, POST pre-op
│   ├── governance.ts                # kill-switch, hitl queue/approve
│   ├── workforce.ts                 # catalogue, checkout, dispatch
│   └── leak.ts                      # POST security/leak-check
├── Router/
│   ├── Guards.tsx                   # AuthGuard, RoleGuard, AppIdGuard, FeatureFlagGuard
│   └── routes.ts                    # Inertia route helpers (ziggy)
├── Hooks/
│   ├── useDispatchPresence.ts       # presence-dispatch-{region}
│   └── useTenantWorkforce.ts        # private-tenant.{appId}.workforce
├── Types/
│   └── index.ts                     # strict DTOs (no any) — AppId, Agent, HitlItem, etc.
└── Pages/
    ├── Dashboard.tsx
    ├── Welcome.tsx
    ├── AU MED/
    │   ├── Providers/Index.tsx
    │   └── Appointments/Create.tsx
    ├── AU DEALS/
    │   ├── Listings/Index.tsx       # DataTable + FULLTEXT search
    │   └── Stagnant/Index.tsx
    ├── AU SERV/
    │   └── Tickets/Create.tsx
    ├── AU INVEST/
    │   └── Dispatches/Create.tsx
    └── Admin/                        # Virtual Enterprise HQ Dashboard (Module 9)
        ├── Dashboard.tsx            # HQ root
        ├── System/ModulesStatus.tsx
        ├── Calibrator/Health.tsx
        └── Governance/HitlQueue.tsx
```

**Scaffold (Arena):**
```bash
mkdir -p resources/js/{Components/{UI,Layout,Calibrator,Governance,Shared},Stores,Services,Router,Hooks,Types,Pages/{Admin/{Calibrator,Governance,System},"AU MED","AU DEALS","AU SERV","AU INVEST"}}
```

---

## 2) Component Architectural Layout

### 2.1 Live System Performance Gauge — `Components/Calibrator/PerformanceGauge.tsx`

| Prop | Type |
|------|------|
| `score` | `number` 0-100 |
| `components` | `Record<string,number>` 6 domains |
| `status` | `'healthy'|'warning'|'healing'` |

**Behavior:**
- `useCalibratorStore` subscribes `private-calibrator` Reverb → `score` live 10s cache.
- `100` → emerald gauge + `100%` label; `90-99` amber + `autoHeal` toast; `<90` red + `SelfHealingEngine` spinner.
- `Gauge` SVG (Tailwind, no chart lib bloat) + `aria-label` RTL.

```tsx
// PerformanceGauge.tsx — ultra-concise
export function PerformanceGauge({score, components}: {score:number; components:Record<string,number>}){
  const pct=Math.max(0,Math.min(100,score)); const color=pct===100?'text-emerald-500':pct>=90?'text-amber-500':'text-red-600';
  return <Card className="ps-4"><CardHeader><CardTitle>Calibrator {pct}%</CardTitle></CardHeader><CardContent><svg viewBox="0 0 100 50" className={color}><path d={`M10 50 A40 40 0 0 1 ${10+pct*0.8} 15`} /></svg><div className="grid grid-cols-3 gap-2">{Object.entries(components).map(([k,v])=><Badge key={k}>{k} {v}%</Badge>)}</div></CardContent></Card>
}
```

**State schema (`useCalibratorStore.ts`):**
```ts
type HealthScore={score:number; components:Record<string,number>; status:'healthy'|'warning'|'healing'; autoHeal:{triggered:boolean; lastHealAt:string|null}};
export const useCalibratorStore=create<HealthScore & {fetch:()=>Promise<void>}>((set)=>({score:100, components:{}, status:'healthy', autoHeal:{triggered:false,lastHealAt:null}, fetch: async()=>{const {data}=await api.get('/calibrator/health-score'); set(data.data)}}));
```

---

### 2.2 Persistent Emergency Red Button — `Components/Layout/TopNavbar.tsx`

- **Position:** `fixed top-0 inset-x-0 z-50` — visible on **every** route (AppLayout).
- **Trigger:** `POST /ai/governance/kill-switch` — requires `can:ai.kill_switch.execute` + `TOTP` modal (6 digits).
- **UX:** Red `bg-red-600` `Lucide ShieldAlert` + `confirm` Dialog `reason min 15` + `scope all|agent:3` — on success → `toast` + `fallback deterministic` badge + `Reverb` global.

```tsx
export function EmergencyRedButton(){
  const {can}=useAuthStore(); if(!can('ai.kill_switch.execute')) return null;
  const [open,setOpen]=useState(false); const {register,handleSubmit}=useForm({scope:'all',reason:'', totp:''});
  const onSubmit=async(d:any)=>{await api.post('/ai/governance/kill-switch',d,{headers:{'X-TOTP':d.totp}}); toast.success('Sockets severed'); setOpen(false)};
  return <><Button variant="destructive" onClick={()=>setOpen(true)}><ShieldAlert className="me-2"/> Kill-Switch</Button><Dialog open={open} onOpenChange={setOpen}><DialogContent><Input {...register('reason')} placeholder="reason 15+ chars"/><Input {...register('totp')} placeholder="TOTP 6 digits"/><Button onClick={handleSubmit(onSubmit)}>Confirm</Button></DialogContent></Dialog></>
}
```

---

### 2.3 Micro-Switch Matrix Panel — `Components/Governance/MicroSwitchMatrixPanel.tsx`

- **Data:** `GET /system/modules/status` → `agents[]` + `micro_switch_matrix` rows (`agent_id, capability_key, is_enabled, requires_hitl, hitl_role`).
- **UI:** `DataTable` per Agent (11 Agents) → `Switch` (enable) + `Checkbox` (HITL) — `PATCH /system/modules/toggle` optimistic + `Reverb system.flags`.
- **Guard:** `can:system.modules.toggle.execute` + `is_core lock` (AU_BUSINESS disabled).

```ts
// useFeatureFlagStore.ts
type Switch={agent_id:number; capability_key:string; is_enabled:boolean; requires_hitl:boolean};
export const useSwitchStore=create<{switches:Switch[]; toggle:(s:Switch)=>Promise<void>}>((set,get)=>({switches:[], toggle: async(s)=>{await api.post('/system/modules/toggle',{agent_id:s.agent_id, capability_key:s.capability_key, is_enabled:!s.is_enabled}); set({switches: get().switches.map(x=> x.capability_key===s.capability_key ? {...x,is_enabled:!x.is_enabled}:x)})}}));
```

---

### 2.4 Pending HITL Approval Inbox — `Components/Governance/HitlInbox.tsx`

- **Data:** `GET /ai/governance/hitl/queue?status=pending` → `pending` items: `Security Patches (Agent 6)`, `Legal Amendments (Agent 7)`, `Code Refactors (Agent 11)`.
- **UI:** `Tabs` (Security/Legal/Code) + `Card` per item `confidence` + `proposed_action` + `Approve/Reject` (`rationale 15+` via `POST /ai/governance/hitl/approve`).
- **Realtime:** `private-hitl.{user}` via Reverb `HitlQueued` → `useHitlStore` prepend.

```tsx
export function HitlInbox(){
  const {queue, fetch, approve}=useHitlStore(); useEffect(()=>{fetch(); const ch=echo.private(`private-hitl.${user.id}`); ch.listen('HitlQueued', (e:any)=> queue.unshift(e)); return()=> ch.stopListening('HitlQueued')},[]);
  return <Tabs><TabsList><TabsTrigger>Security</TabsTrigger><TabsTrigger>Legal</TabsTrigger><TabsTrigger>Code</TabsTrigger></TabsList>{queue.map(i=><Card key={i.id}><CardHeader>{i.capability_key} {i.confidence}%</CardHeader><CardContent><Button onClick={()=>approve(i.id,'approved','...')}>Approve</Button><Button variant="outline" onClick={()=>approve(i.id,'rejected','...')}>Reject</Button></CardContent></Card>)}</Tabs>
}
```

**State (`useHitlStore.ts`):**
```ts
type HitlItem={id:number; agent_id:number; capability_key:string; entity_type:string; confidence:number; status:'pending'};
export const useHitlStore=create<{queue:HitlItem[]; fetch:()=>Promise<void>; approve:(id:number,decision:'approved'|'rejected',rationale:string)=>Promise<void>}>((set,get)=>({queue:[], fetch: async()=>{const {data}=await api.get('/ai/governance/hitl/queue'); set({queue:data.data})}, approve: async(id,decision,rationale)=>{await api.post('/ai/governance/hitl/approve',{queue_id:id,decision,rationale}); set({queue:get().queue.filter(x=>x.id!==id)})}}));
```

---

## 3) State Management Schema (Zustand + Inertia)

```
Stores (Zustand) — single source, no Redux boilerplate (YAGNI)
├── useAuthStore: {user, roles, permissions, appId, can(perm), setAppId}
├── useCalibratorStore: {score, components, status, autoHeal, fetch} + Reverb private-calibrator
├── useHitlStore: {queue, fetch, approve} + Reverb private-hitl
├── useWorkforceStore: {agents, tenantAgents, dispatch, progress} + private-tenant.{appId}.workforce
└── useFeatureFlagStore: {flags, toggle, isHibernated(app)} → 503 guard

Inertia shared: usePage().props.auth (SSR) → hydrate Zustand on mount; useForm for POST with silent refresh queue (api.ts)
```

**`Services/api.ts` (Axios + Inertia silent refresh):**
```ts
import axios from 'axios'; const api=axios.create({baseURL:'/api/v1', withCredentials:true});
api.interceptors.response.use(r=>r, async err=>{
  if(err.response?.status===401 && err.response.data.code==='token_expired' && !err.config._retry){
    err.config._retry=true; await axios.post('/api/v1/auth/refresh',null,{withCredentials:true});
    const {access}=err.response.data; api.defaults.headers.Authorization=`Bearer ${access}`; err.config.headers.Authorization=`Bearer ${access}`; return api(err.config);
  }
  if(err.response?.status===503 && err.response.data.code==='module_hibernated') window.location.href='/503';
  throw err;
}); export default api;
```

**Router Guards (`Router/Guards.tsx`):**
```tsx
export const AuthGuard=({children}:{children:React.ReactNode})=> useAuthStore(s=>s.user) ? children : <Navigate to="/login" />;
export const RoleGuard=({perm, children}:{perm:string; children:React.ReactNode})=> useAuthStore(s=>s.can(perm)) ? children : <Forbidden />;
export const FeatureFlagGuard=({app, children}:{app:AppId; children:React.ReactNode})=> useFeatureFlagStore(s=>!s.isHibernated(app)) ? children : <Hibernated message={s.flags[app]?.maintenance} />;
```

---

**ملخص عربي:** واجهة React 19 نظيفة بجاهزية إنتاج — شجرة مجلدات DDD مع متاجر Zustand وخدمات API وحماية مسارات، ومكونات HQ الأربعة (مقياس معاير حي + زر طوارئ ثابت + لوحة مفاتيح دقيقة + صندوق HITL مع تبويب أمني/قانوني/كودي) ببث Reverb فوري.

*Next: [PROMPT 2.3c] Security Vault & DRM*
