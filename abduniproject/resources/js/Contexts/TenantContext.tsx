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
  return <Ctx.Provider value={props.tenant}>{children}</Ctx.Provider>;
}

export function useTenant(): TenantContext {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useTenant must be inside TenantProvider");
  return ctx;
}

// حارس DOM — يحذف من DOM إن غابت الصلاحية (Rule 36)
export function Can({ permission, children }: PropsWithChildren<{ permission: string }>) {
  const { permissions } = useTenant();
  if (!permissions.includes(permission)) return null;
  return <>{children}</>;
}
