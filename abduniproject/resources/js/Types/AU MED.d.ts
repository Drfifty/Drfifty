// AU MED — Encrypted Medical Ecosystem — Strict TS ZERO any — app_id = "AU MED"
import type { Currency } from "./index";

export const MED_APP_ID = "AU MED" as const;
export type MedAppId = typeof MED_APP_ID;

export type MinorUnits = number; // integer qirsh — no float

// Departments — Virtual Hospital
export type MedDepartmentKey = "clinics" | "radiology" | "labs" | "emergency" | "home_nursing" | "pharmacy";
export interface MedDepartment {
  key: MedDepartmentKey;
  label_ar: string;
  label_en: string;
  icon: string;
  verified: boolean;
  head_count: number;
}

// Urgent vs Scheduled Search — Hospital landing
export interface UrgentDispatchState {
  is_urgent: boolean;
  radius_km: 2 | 5 | 10; // progressive expansion 2→5→10
  lat: number;
  lng: number;
}
export interface ScheduledSlot {
  id: string;
  scheduled_at: string; // ISO
  department: MedDepartmentKey;
  provider_id: number;
  locked: boolean; // mutex lock — prevents double-booking
  locked_until?: string;
}

// EMR — AES-256-GCM field-level encrypted payload
export type EMRRecordType = "consultation" | "prescription" | "lab" | "radiology" | "nursing" | "vaccination";
export interface EncryptedPayload {
  ciphertext: string; // base64 AES-256-GCM
  iv: string;
  tag: string;
  alg: "AES-256-GCM";
}
export interface EMRRecord {
  id: string;
  patient_id: number;
  app_id: MedAppId;
  type: EMRRecordType;
  title_ar: string;
  title_en: string;
  created_at: string;
  provider_name: string;
  encrypted: EncryptedPayload; // transmitted encrypted
  decrypted?: DecryptedEMR; // only when access_grant_token valid
}
export interface DecryptedEMR {
  diagnosis: string;
  diagnosis_icd10?: string;
  notes: string;
  attachments: MedicalAttachment[];
}
export interface MedicalAttachment {
  id: string;
  kind: "dicom" | "pdf" | "image" | "lab_pdf";
  filename: string;
  url_encrypted: string;
  watermark: boolean;
}

// OTP Consent — Time-bound patient authorization for AU BUSINESS doctor access
export interface OTPGrant {
  id: string;
  patient_id: number;
  provider_id: number;
  provider_name: string;
  app_id: MedAppId;
  access_grant_token: string | null; // time-bound OTP session
  ttl_seconds: number; // e.g., 15*60
  expires_at: string;
  status: "pending" | "active" | "expired" | "revoked";
  created_at: string;
}

// Journey bundling — Parent Journey + Sub-Deals + Bundle Discount
export interface MedJourney {
  journey_id: string;
  patient_id: number;
  app_id: MedAppId;
  title_ar: string;
  title_en: string;
  gross_total_minor: MinorUnits;
  bundle_discount_minor: MinorUnits;
  net_total_minor: MinorUnits; // Final = Gross - Discount
  currency: Currency;
  deals: MedDeal[];
  created_at: string;
}
export interface MedDeal {
  deal_id: string;
  journey_id: string;
  app_id: MedAppId;
  type: "physician" | "lab" | "radiology" | "ambulance" | "pharmacy" | "nursing";
  title_ar: string;
  provider_name: string;
  amount_minor: MinorUnits;
  escrow_minor: MinorUnits; // held per sub-deal
  status: "pending" | "held" | "released" | "refunded";
}

// E-Prescription — QR + ICD-10 + DDI + Fulfillment
export interface EPrescription {
  id: string;
  patient_id: number;
  app_id: MedAppId;
  qr_payload: string; // signed QR
  qr_signature: string;
  diagnosis_icd10: string[];
  drugs: PrescribedDrug[];
  dosage_schedule: string;
  ddi_alerts: DDIBadge[];
  issued_at: string;
  expires_at: string;
  prescriber: string;
}
export interface PrescribedDrug {
  active_ingredient: string;
  brand: string;
  dosage: string;
  duration: string;
  qty: number;
}
export interface DDIBadge {
  level: "safe" | "caution" | "contraindicated";
  message_ar: string;
  message_en: string;
}
export type FulfillmentMode = "home_delivery" | "qr_pickup";
export interface FulfillmentHub {
  prescription_id: string;
  mode: FulfillmentMode;
  pharmacy_name?: string;
  pharmacy_distance_km?: number;
  locked_qty?: number;
  dispatched_via: "AU SERV" | "AU BUSINESS";
}

// Insurance + Copay + Wallet — Checkout
export type InsuranceProvider = "AXA" | "MetLife" | "Syndicate" | "None";
export interface InsuranceGate {
  provider: InsuranceProvider;
  eligibility: "eligible" | "pending" | "ineligible";
  coverage_limit_minor: MinorUnits;
  copay_pct: number; // 0-100
  expiry: string;
}
export interface CopayBreakdown {
  gross_minor: MinorUnits;
  coverage_minor: MinorUnits;
  copay_minor: MinorUnits;
  net_payable_minor: MinorUnits; // from app_wallet
  currency: Currency;
}
export interface MedicalWallet {
  id: number;
  patient_id: number;
  app_id: MedAppId;
  balance_minor: MinorUnits;
  currency: Currency;
  locked_minor: MinorUnits;
}
