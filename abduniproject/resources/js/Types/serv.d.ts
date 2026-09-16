// AU SERV — Universal Non-Medical Services & Talent Dispatch — Strict TS ZERO any — app_id = "AU SERV"
// Covers FIELD_TECHNICAL · LOGISTICS_FREIGHT · PROFESSIONAL_FREELANCE · ON_DEMAND_TALENT_JOBS · CUSTOM_REQUESTS
import type { Currency } from "./index";

export const SERV_APP_ID = "AU SERV" as const;
export type ServAppId = typeof SERV_APP_ID;

export type MinorUnits = number; // integer qirsh — no float

// ── Universal Service Taxonomy — 5 categories (ALL-ENCOMPASSING) ──
export type ServiceCategory =
  | "FIELD_TECHNICAL"
  | "LOGISTICS_FREIGHT"
  | "PROFESSIONAL_FREELANCE"
  | "ON_DEMAND_TALENT_JOBS"
  | "CUSTOM_REQUESTS";

// Backward compat — legacy 3-type system maps onto universal categories
export type ServiceType = ServiceCategory | "DELIVERY_PARCEL" | "FIELD_TECHNICIAN" | "FREELANCE_TASK";

export type DispatchMode = "IMMEDIATE" | "MILESTONE_QUOTE" | "HOURLY_DAILY" | "TASK_BIDDING";
export type AvailabilityMode = "INSTANT" | "SCHEDULED" | "JOB_APPLICATION";

export type VehicleClass = "motorcycle" | "light_van" | "cargo_truck" | "heavy_logistics" | "skilled_technician";
export type FreelanceCategory = "software" | "design" | "accounting" | "legal" | "translation" | "marketing" | "video" | "data";

export interface ServiceCategoryMeta {
  service_category: ServiceCategory;
  // legacy alias for old screens
  service_type?: ServiceType;
  label_ar: string;
  label_en: string;
  icon: string;
  enabled: boolean;
  description_ar: string;
  description_en: string;
}

// ── Skills & Certifications — universal ──
export type TechnicianSkill =
  | "electric"
  | "plumbing"
  | "hvac"
  | "ac"
  | "carpentry"
  | "appliance"
  | "auto_mechanics"
  | "painting"
  | "nursing"
  | "cleaning"
  | "housekeeping"
  | "security"
  | "event_crew"
  | "software"
  | "design"
  | "accounting"
  | "legal"
  | "translation"
  | "marketing";

export type CertificationTag = "licensed_electrician" | "certified_plumber" | "hvac_cert" | "driving_license" | "security_clearance" | "cpa" | "bar_license";

export type TechnicianStatus = "available" | "busy" | "offline";

// ── Provider — universal: technicians, freelancers, drivers, shift workers ──
export interface ProviderProfile {
  id: string;
  app_id: ServAppId;
  name_ar: string;
  name_en: string;
  service_category?: ServiceCategory;
  // legacy alias
  service_type?: ServiceType;
  vehicle_class?: VehicleClass;
  freelance_category?: FreelanceCategory;
  skills: TechnicianSkill[];
  certifications?: CertificationTag[];
  rating: number; // 0-5
  completed_jobs: number;
  status: TechnicianStatus;
  availability_mode?: AvailabilityMode;
  geo_lat?: number;
  geo_lng?: number;
  distance_km: number;
  eta_minutes: number;
  hourly_rate_minor?: MinorUnits;
  avatar: string;
}

export type Technician = ProviderProfile;

export type DispatchStatus = "pending" | "dispatched" | "in_progress" | "completed" | "cancelled" | "expired";
export type DispatchPriority = "normal" | "urgent" | "scheduled";

export interface GeoPoint {
  lat: number;
  lng: number;
  label_ar: string;
  label_en: string;
  address: string;
}

export interface TaskAttachment {
  id: string;
  file_name: string;
  file_size_kb: number;
  url: string;
}

export interface MilestoneBudgetItem {
  id: string;
  title_ar: string;
  title_en: string;
  amount_minor: MinorUnits;
  currency: Currency;
  due_at?: string;
}

// ── Universal Dispatch Request — supports Immediate / Milestone / Hourly / Bidding ──
export interface DispatchRequest {
  id: string;
  app_id: ServAppId;
  service_category: ServiceCategory;
  service_type?: ServiceType;
  dispatch_mode: DispatchMode;
  vehicle_class?: VehicleClass;
  title_ar: string;
  title_en: string;
  customer_name: string;
  pickup: GeoPoint;
  dropoff?: GeoPoint;
  is_remote: boolean; // true for remote freelance / digital
  distance_km: number;
  eta_minutes: number;
  duration_hours?: number; // for HOURLY_DAILY
  weight_kg?: number;
  skill_tags: TechnicianSkill[];
  certification_tags: CertificationTag[];
  attachments: TaskAttachment[];
  milestones: MilestoneBudgetItem[]; // for MILESTONE_QUOTE / CUSTOM_REQUESTS
  priority: DispatchPriority;
  status: DispatchStatus;
  availability_mode: AvailabilityMode;
  provider_id?: string;
  scheduled_at: string; // ISO
  created_at: string;
  // Pricing — Base + Distance/Duration/Hourly + Skill Complexity Premium → Escrow Total
  base_fee_minor: MinorUnits;
  per_km_rate_minor: MinorUnits;
  per_hour_rate_minor?: MinorUnits;
  skill_premium_minor: MinorUnits;
  total_fee_minor: MinorUnits;
  currency: Currency;
  // Escrow & OTP
  escrow_locked: boolean;
  escrow_minor: MinorUnits;
  otp_code: string; // 4-digit
  otp_verified: boolean;
}

export interface DispatchJob {
  id: string;
  app_id: ServAppId;
  title_ar: string;
  customer_name: string;
  address: string;
  skill_required: TechnicianSkill;
  priority: DispatchPriority;
  status: DispatchStatus;
  technician_id?: string;
  scheduled_at: string;
  geo_lat: number;
  geo_lng: number;
}

export interface PricingBreakdown {
  base_fee_minor: MinorUnits;
  per_km_rate_minor: MinorUnits;
  per_hour_rate_minor?: MinorUnits;
  distance_km: number;
  duration_hours?: number;
  distance_fee_minor: MinorUnits;
  duration_fee_minor: MinorUnits;
  skill_premium_minor: MinorUnits;
  weight_fee_minor: MinorUnits;
  weight_kg?: number;
  total_minor: MinorUnits;
  currency: Currency;
}

export interface RouteCalculation {
  distance_km: number;
  duration_minutes: number;
  polyline: GeoPoint[];
}

// ── SLAs & Tracking — universal lifecycle ──
export type LifecycleKind = "on_site_visit" | "remote_deliverable" | "logistics_route" | "job_shift_checkin" | "custom_milestone";

export interface SLACheckpoint {
  label_ar: string;
  label_en: string;
  at: string; // ISO
  status: "completed" | "current" | "pending";
  kind: LifecycleKind;
}

export interface TrackingState {
  request_id: string;
  app_id: ServAppId;
  service_category: ServiceCategory;
  lifecycle_kind: LifecycleKind;
  provider: ProviderProfile;
  checkpoints: SLACheckpoint[];
  sla_deadline_at: string; // ISO
  progress_pct: number; // 0-100
  otp_code: string;
}

export interface ServiceSLA {
  id: string;
  job_id: string;
  app_id: ServAppId;
  response_time_minutes: number;
  actual_response_minutes?: number;
  resolution_hours: number;
  status: "on_track" | "at_risk" | "breached";
  penalty_minor?: MinorUnits;
}

export type MilestoneStatus = "pending" | "in_progress" | "completed" | "approved" | "released";
export interface ServiceMilestone {
  id: string;
  job_id: string;
  app_id: ServAppId;
  title_ar: string;
  title_en: string;
  amount_minor: MinorUnits;
  currency: Currency;
  status: MilestoneStatus;
  escrow_locked: boolean;
  due_at: string;
}

export interface ServiceRating {
  id: string;
  job_id: string;
  technician_id: string;
  app_id: ServAppId;
  stars: number; // 1-5
  comment_sanitized: string;
  created_at: string;
  reviewer_name: string;
}

// ── Provider Task Board — multi-role ──
export type TaskOfferStatus = "incoming" | "accepted" | "rejected" | "expired" | "completed" | "bidding";

export interface TaskOffer {
  id: string;
  app_id: ServAppId;
  service_category: ServiceCategory;
  service_type?: ServiceType;
  vehicle_class?: VehicleClass;
  title_ar: string;
  title_en: string;
  pickup_label: string;
  dropoff_label: string;
  distance_km: number;
  fee_minor: MinorUnits;
  currency: Currency;
  expires_at: string; // ISO — auto-reject timer
  status: TaskOfferStatus;
  mutex_locked: boolean;
  otp_required: string; // 4-digit expected
  is_bid: boolean; // true for TASK_BIDDING
  bid_minor?: MinorUnits;
}

export interface ChatMessage {
  id: string;
  from: "client" | "provider";
  body_sanitized: string; // after maskLeak
  body_raw?: string; // never displayed
  sent_at: string;
}

export interface ServPageProps {
  app_id: ServAppId;
  technicians: ProviderProfile[];
  jobs: DispatchRequest[];
  milestones: ServiceMilestone[];
  slas: ServiceSLA[];
  ratings: ServiceRating[];
}
