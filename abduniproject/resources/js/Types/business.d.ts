// B2B Enterprise Hub — AU BUSINESS — Strict TS ZERO any
// App Isolation: app_id = "AU BUSINESS" — Enterprise Backbone
import type { Currency } from "./index";

export const BUSINESS_APP_ID = "AU BUSINESS" as const;
export type BusinessAppId = typeof BUSINESS_APP_ID;

export type BusinessScale =
  | "factory"
  | "importer"
  | "distributor"
  | "warehouse"
  | "wholesaler"
  | "retailer"
  | "home_project"
  | "freelancer";

export interface BusinessScaleMeta {
  scale: BusinessScale;
  label_ar: string;
  label_en: string;
  capabilities: string[];
  maxBulkQty: number;
  canBulkOffer: boolean;
  canTender: boolean;
  canBarter: boolean;
  canHireAI: boolean;
}

export interface BusinessProfile {
  id: number;
  app_id: BusinessAppId;
  company_name: string;
  company_name_ar: string;
  scale: BusinessScale;
  tax_id: string;
  verified: boolean;
  wallet_id: number;
  created_at: string;
}

export type MinorUnits = number; // integer qirsh — لا float

export interface TieredPrice {
  tier: number;
  min_qty: number;
  max_qty: number | null;
  price_minor: MinorUnits;
  currency: Currency;
  discount_pct: number;
  label: string;
}

export interface InventoryItem {
  id: number;
  sku: string;
  title: string;
  title_ar: string;
  app_id: BusinessAppId;
  category: string;
  stock_qty: number;
  reserved_qty: number;
  tiers: TieredPrice[];
  spec_schema_id: string;
  spec_values: Record<string, unknown>;
  status: "active" | "draft" | "archived";
  updated_at: string;
}

export type JsonFieldType = "text" | "number" | "date" | "select" | "boolean" | "file";

export interface JsonSchemaField {
  key: string;
  label: string;
  label_ar: string;
  type: JsonFieldType;
  required?: boolean;
  options?: string[];
  placeholder?: string;
  help?: string;
  validation?: { min?: number; max?: number; pattern?: string; message?: string };
}

export interface JsonSchemaDefinition {
  id: string;
  title: string;
  title_ar: string;
  version: number;
  fields: JsonSchemaField[];
}

export interface CsvImportRow {
  row: number;
  sku?: string;
  errors: string[];
  data: Record<string, unknown>;
}

export interface WholesaleFeedItem {
  id: string;
  type: "bulk_request" | "barter_match" | "quotation";
  title: string;
  title_ar: string;
  company: string;
  qty: number;
  amount_minor: MinorUnits;
  currency: Currency;
  status: "pending" | "matched" | "approved" | "rejected";
  created_at: string;
}

export interface BusinessDashboardSummary {
  wholesale_liquidity_minor: MinorUnits;
  active_escrow_count: number;
  active_escrow_minor: MinorUnits;
  bulk_inventory_value_minor: MinorUnits;
  calibrator_score: number; // 0-100
  calibrator_status: "green" | "amber" | "red";
  currency: Currency;
}

export type CalibratorGate = "pre_op" | "in_op" | "post_op";

export interface GateMetric {
  key: string;
  label: string;
  label_ar: string;
  value: number;
  threshold: number;
  status: "pass" | "warn" | "fail";
  unit?: string;
  hint?: string;
}

export interface GateEvaluation {
  gate: CalibratorGate;
  score: number;
  status: "green" | "amber" | "red";
  metrics: GateMetric[];
  evaluated_at: string;
  recommendation: string;
  recommendation_ar: string;
}

export interface LedgerEntry {
  id: string;
  debit_minor: MinorUnits;
  credit_minor: MinorUnits;
  currency: Currency;
  narration: string;
  created_at: string;
}

export type DeploymentMode = "managed_salary" | "outright_buyout";

export interface AIEmployeePersona {
  id: string;
  slug: string;
  title: string;
  title_ar: string;
  role: string;
  avatar: string;
  capabilities: string[];
  rating: number;
  deployments: number;
  price_monthly_minor: MinorUnits;
  price_buyout_minor: MinorUnits;
  driver: "deterministic" | "cloud" | "local_gpu";
  tenant_isolated: boolean;
  app_id: BusinessAppId;
  featured?: boolean;
}

export interface BusinessPageProps {
  app_id: BusinessAppId;
  profile: BusinessProfile;
  summary: BusinessDashboardSummary;
  feed: WholesaleFeedItem[];
  inventory: InventoryItem[];
  schemas: JsonSchemaDefinition[];
  gates: GateEvaluation[];
  personas: AIEmployeePersona[];
}
