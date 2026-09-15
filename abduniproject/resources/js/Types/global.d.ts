// resources/js/Types/global.d.ts — Inertia Page Props & Tenant Context (Phase 4.0)
// نظام الهوية متعدد التطبيقات — المصدر الوحيد لحالة app_id والصلاحيات
// Phase 4.0: Multi-Tenancy (app_id) + RBAC + Feature Flags + Locale — Strict TS ZERO any

import type { AppId, Currency, AgentId } from "./index";

// اتجاه وكتابة — RTL أولاً
export type Dir = "rtl" | "ltr";
export type Locale = "ar" | "en";
export type LocaleDigits = "latin" | "arabic";

// سياق المستأجر — يغذي Layouts/Header/Context Switcher
export interface TenantContext {
  app_id: AppId;
  available_apps: AppId[];
  dir: Dir;
  locale: Locale;
  locale_digits: LocaleDigits;
  permissions: string[];
  feature_flags: Record<string, boolean>;
  experiment_cohorts: Record<string, string>;
}

// مستخدم مصادق — يطابق auth_2.1a
export interface AuthUser {
  id: number;
  name: string;
  email: string;
  app_id: AppId;
  roles: string[];
}

// رسائل فلاش Inertia
export interface FlashMessages {
  success?: string;
  error?: string;
  info?: string;
}

// حمولة الصفحة المشتركة — تُحقن من HandleInertiaRequests — مع فهرس للتوافق مع Inertia PageProps
export interface SharedPageProps extends Record<string, unknown> {
  auth: { user: AuthUser | null };
  tenant: TenantContext;
  flash: FlashMessages;
  app_id: AppId;
  locale: Locale;
  dir: Dir;
  currency: Currency;
  permissions: string[];
}

// تجارة إلكترونية — مبالغ بالوحدات الصغرى (قروش/سنت) — لا float
export type MinorUnits = number; // integer >=0
export interface Money {
  amount_minor: MinorUnits;
  currency: Currency;
}

// تجارب النمو A/B — خلف feature flags
export interface ExperimentAssignment {
  key: string;
  cohort: string;
  variant: string;
}

// توسيع PageProps لـ Inertia v2 — استخدام usePage<SharedPageProps>()
declare module "@inertiajs/core" {
  interface PageProps extends SharedPageProps {}
}

// Vite HMR
/// <reference types="vite/client" />

// أمان الحافة — تقرير CSP
export interface CspReport {
  document_uri: string;
  violated_directive: string;
  blocked_uri: string;
}
