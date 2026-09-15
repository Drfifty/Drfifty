// خطاف المستأجر — يفصل app_id عن JSX — Presentational فقط
// Phase 4.0: Multi-Tenancy — الصفحات تستهلك app_id فقط
import { usePage } from "@inertiajs/react";
import type { SharedPageProps } from "@/Types/global.d";
import type { AppId } from "@/Types";

export function useTenantApp(): AppId {
  const { props } = usePage<SharedPageProps>();
  return props.app_id;
}

export function useTenantDir(): "rtl" | "ltr" {
  const { props } = usePage<SharedPageProps>();
  return props.dir;
}
