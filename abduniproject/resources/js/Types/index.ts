// ABD UNI PROJECT — Shared TypeScript types (strict: true, ZERO any)

export type AppId =
  | "AU BUSINESS"
  | "AU MED"
  | "AU DEALS"
  | "AU SERV"
  | "AU INVEST";

export type Currency = "EGP" | "USD" | "SAR" | "AED" | "EUR" | "GBP" | "KWD" | "QAR";

export type AgentId = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12 | 13;

export interface Paginated<T> {
  data: T[];
  current_page: number;
  last_page: number;
  per_page: number;
  total: number;
  links: { url: string | null; label: string; active: boolean }[];
}

export interface Wallet {
  id: number;
  user_id: number;
  app_id: AppId;
  currency: Currency;
  balance: string;
  locked_balance: string;
  status: "active" | "frozen" | "closed";
}

export interface AgentAction {
  action_id: string;
  agent_id: AgentId;
  capability_key: string;
  confidence_score: number;
  hitl_required: boolean;
  outcome: "pending" | "executed" | "fallback" | "rejected";
  created_at: string;
}

export interface PageProps {
  auth: { user: { id: number; name: string; app_id: AppId } | null };
  flash: { success?: string; error?: string };
  app_id: AppId;
  locale: "ar" | "en";
  dir: "rtl" | "ltr";
}
