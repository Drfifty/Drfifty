// سياق المستأجر — يغذي كل التطبيقات الخمسة + HQ — app_id كمحور
// Phase 4.0: Multi-Tenancy + App Isolation — Strict TS + RTL
import { createContext, useContext } from "react";
import type { PropsWithChildren } from "react";
import type { TenantContext } from "@/Types/global.d";
import { usePage } from "@inertiajs/react";
import type { SharedPageProps } from "@/Types/global.d";

const Ctx = createContext<TenantContext | null>(null);

export function TenantProvider({ children }: PropsWithChildren) {
  const { props } = usePage<SharedPageProps>();
  // FIX-P1-04: hydrate tenant from props.tenant or fallback to top-level aliases (compat)
  const tenant: TenantContext = props.tenant ?? {
    app_id: props.app_id as TenantContext['app_id'],
    available_apps: (props as unknown as { available_apps?: TenantContext['available_apps'] }).available_apps ?? [],
    dir: (props.dir as Dir) ?? 'rtl',
    locale: (props.locale as Locale) ?? 'ar',
    locale_digits: 'latin',
    permissions: props.permissions ?? [],
    feature_flags: (props as unknown as { feature_flags?: Record<string,boolean> }).feature_flags ?? {},
    experiment_cohorts: {},
  };
  return <Ctx.Provider value={tenant}>{children}</Ctx.Provider>;
}

export function useTenant(): TenantContext {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useTenant must be inside TenantProvider");
  return ctx;
}

// FIX-P1-04: safe Can — returns null without throwing if outside provider (hydration race)
export function useTenantSafe(): TenantContext | null {
  try { return useContext(Ctx); } catch { return null; }
}

// حارس DOM — يحذف من DOM إن غابت الصلاحية (Rule 36) — FIX-P1-04 safe when no provider
export function Can({ permission, children }: PropsWithChildren<{ permission: string }>) {
  const tenant = useTenantSafe();
  if (!tenant) return null;
  if (!tenant.permissions.includes(permission)) return null;
  return <>{children}</>;
}
