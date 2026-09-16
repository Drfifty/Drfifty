// AU DEALS — Commerce, Barter & Deals Marketplace — Strict TS ZERO any — app_id = "AU DEALS"
import type { Currency } from "./index";

export const DEALS_APP_ID = "AU DEALS" as const;
export type DealsAppId = typeof DEALS_APP_ID;

export type MinorUnits = number; // integer qirsh

export type DealType = "OFFER" | "REQUEST" | "BARTER";

export type DealCondition = "new" | "used_like_new" | "used_good" | "refurbished";

export interface MerchantLink {
  merchant_id: number;
  merchant_name: string;
  merchant_name_ar: string;
  app_id: "AU BUSINESS"; // dynamic link to AU BUSINESS profile
  verified: boolean;
  rating: number;
}

export interface Deal {
  id: string;
  app_id: DealsAppId;
  deal_type: DealType;
  title_ar: string;
  title_en: string;
  description_ar: string;
  category: string;
  images: string[];
  price_minor: MinorUnits; // for OFFER: sale price ; for REQUEST: budget ; for BARTER: valuation
  original_price_minor?: MinorUnits; // for discount calc
  currency: Currency;
  savings_pct?: number;
  verified: boolean;
  barter_eligible: boolean; // gold tag #C5A059
  stock_qty: number;
  merchant: MerchantLink;
  condition: DealCondition;
  geo_lat?: number;
  geo_lng?: number;
  created_at: string;
  expires_at?: string;
  // Dynamic Schema attributes (price range, condition, radius, swap prefs)
  attributes: Record<string, unknown>;
}

// Barter valuation engine
export interface BarterAsset {
  id: string;
  title_ar: string;
  image: string;
  valuation_minor: MinorUnits;
  currency: Currency;
  owner: "party_a" | "party_b";
}
export interface BarterValuation {
  asset_a: BarterAsset;
  asset_b: BarterAsset;
  settlement_minor: MinorUnits; // Valuation A - Valuation B ; positive = A owes B? we define: settlement = A - B ; if >0 A higher -> B owes cash? clarify in UI
  cash_direction: "a_owes_b" | "b_owes_a" | "even";
  cash_difference_minor: MinorUnits; // abs(settlement)
}

// Negotiation timeline
export type OfferStatus = "pending" | "countered" | "accepted" | "rejected" | "expired";
export interface CounterOffer {
  id: string;
  deal_id: string;
  app_id: DealsAppId;
  from_user_id: number;
  from_name: string;
  price_minor: MinorUnits;
  note_sanitized: string; // after RegexDataLeakDetector
  status: OfferStatus;
  expires_at: string;
  created_at: string;
}

// Group buying
export interface GroupTier {
  tier: number;
  target_qty: number;
  discount_pct: number;
  price_minor: MinorUnits;
  label_ar: string;
}
export interface GroupBuying {
  id: string;
  deal_id: string;
  app_id: DealsAppId;
  tiers: GroupTier[];
  current_qty: number;
  current_tier: number;
  threshold_qty: number;
  ends_at: string;
  escrow_locked_minor: MinorUnits;
}

// Checkout — Deal summary & split payment
export type PaymentMethod = "app_wallet" | "fawry" | "vodafone_cash" | "instapay" | "credit_card";

export interface CheckoutSummary {
  deal_id: string;
  app_id: DealsAppId;
  item_valuation_minor: MinorUnits;
  barter_trade_in_minor?: MinorUnits;
  coupon_discount_minor: MinorUnits;
  delivery_minor: MinorUnits; // via AU SERV
  escrow_deposit_minor: MinorUnits; // Total Escrow Deposit — app_wallet
  currency: Currency;
  barter_settlement?: BarterValuation;
  payment_method: PaymentMethod;
}

export interface DealsPageProps {
  app_id: DealsAppId;
  deals: Deal[];
  featured: Deal;
  group: GroupBuying;
  checkout: CheckoutSummary;
}
