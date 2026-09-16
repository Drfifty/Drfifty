// خطاف المستأجر — FIX-P1-04: single source via TenantContext — no dual usePage (R25)
import { useTenant } from "@/Contexts/TenantContext";
import type { AppId } from "@/Types";

export function useTenantApp(): AppId {
  return useTenant().app_id;
}

export function useTenantDir(): "rtl" | "ltr" {
  return useTenant().dir;
}
