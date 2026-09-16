# Router — FIX-P1-15 Canonical Path Guard (Arena)

**Canonical space-form (Phase 4.0):** `resources/js/Pages/AU BUSINESS/` `AU MED/` `AU DEALS/` `AU SERV/` `AU INVEST/` — space-form is sole source (frontend_skills, .arenarules).

**Deprecated PascalCase aliases kept for compat:** `Pages/AUInvest/` `Pages/AUServ/` are **thin re-export shims** — do not author new files there. New imports MUST use space-form via `@` alias:

```ts
// ✅ canonical
import Dashboard from '@/Pages/AU BUSINESS/Dashboard';
import Hospital from '@/Pages/AU MED/Hospital/Index';

// ❌ deprecated — will be lint-blocked
import Dashboard from '@/Pages/AUInvest/Portfolio/Dashboard';
```

**Vite:** `vite.config.ts` alias `@ -> resources/js` supports space-form with quotes. No manual encoding needed — `import '@/Pages/AU SERV/Dispatch/Index'` works via bundler.

**Guard:** future `eslint.config.js` will add `no-restricted-imports` for `AUInvest|AUServ` PascalCase. Until then this README is single source.

**Status:** `P1-15` additive — no file deletions — both trees coexist, canonical wins.
