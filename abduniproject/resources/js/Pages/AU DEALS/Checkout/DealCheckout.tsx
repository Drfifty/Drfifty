// AU DEALS — Escrow Checkout & Barter Settlement — Deal Summary + Split Payment + Multi-Method
import { useMemo, useState } from "react";
import { router, usePage } from "@inertiajs/react";
import AppLayout from "@/Layouts/AppLayout";
import Button from "@/Components/UI/Button";
import GlassCard from "@/Components/UI/GlassCard";
import type { SharedPageProps } from "@/Types/global.d";
import type { CheckoutSummary, PaymentMethod } from "@/Types/deals.d";

const TENANT: "AU DEALS" = "AU DEALS";

function fmt(minor: number): string {
  return new Intl.NumberFormat("ar-EG", { style: "currency", currency: "EGP", numberingSystem: "latn" }).format(minor / 100);
}

const MOCK_SUMMARY: CheckoutSummary = {
  deal_id: "d3",
  app_id: TENANT,
  item_valuation_minor: 3200000,
  barter_trade_in_minor: 2800000,
  coupon_discount_minor: 15000,
  delivery_minor: 45000,
  escrow_deposit_minor: 0, // computed
  currency: "EGP",
  barter_settlement: {
    asset_a: { id: "a_my", title_ar: "لابتوبي Dell XPS", image: "💻", valuation_minor: 3400000, currency: "EGP", owner: "party_a" },
    asset_b: { id: "d3", title_ar: "دراجة جبلية", image: "🚲", valuation_minor: 3200000, currency: "EGP", owner: "party_b" },
    settlement_minor: 200000,
    cash_direction: "b_owes_a",
    cash_difference_minor: 200000,
  },
  payment_method: "app_wallet",
};

export default function DealCheckout() {
  const { props } = usePage<SharedPageProps>();
  const isDeals = (props.tenant?.app_id ?? props.app_id) === TENANT;
  const [method, setMethod] = useState<PaymentMethod>("app_wallet");
  const [coupon, setCoupon] = useState("SAVE15");
  const summary = useMemo(() => {
    const couponDisc = coupon === "SAVE15" ? 15000 : 0;
    const base = MOCK_SUMMARY.barter_trade_in_minor ? MOCK_SUMMARY.item_valuation_minor - MOCK_SUMMARY.barter_trade_in_minor : MOCK_SUMMARY.item_valuation_minor;
    const total = base - couponDisc + MOCK_SUMMARY.delivery_minor + (MOCK_SUMMARY.barter_settlement ? 0 : 0);
    // escrow deposit = net after barter settlement + delivery - coupon
    // if barter: settlement 200k B owes A → reduces deposit
    const settlementAdj = MOCK_SUMMARY.barter_settlement?.cash_direction === "b_owes_a" ? -MOCK_SUMMARY.barter_settlement.cash_difference_minor : MOCK_SUMMARY.barter_settlement?.cash_direction === "a_owes_b" ? MOCK_SUMMARY.barter_settlement.cash_difference_minor : 0;
    const escrow = Math.max(0, total + settlementAdj);
    return { ...MOCK_SUMMARY, coupon_discount_minor: couponDisc, escrow_deposit_minor: escrow };
  }, [coupon]);

  if (!isDeals) return <AppLayout><GlassCard level="inner" className="text-center"><p className="text-section font-bold">يتطلب AU DEALS</p></GlassCard></AppLayout>;

  const pay = (): void => {
    router.post(`/deals/${summary.deal_id}/checkout`, { app_id: TENANT, payment_method: method, coupon } as unknown as never, { headers: { "X-App-Id": TENANT } as unknown as Record<string, string> });
  };

  return (
    <AppLayout>
      <h1 className="text-title font-bold text-white">الدفع والضمان — Escrow Checkout</h1>
      <p className="text-micro text-[var(--text-secondary)]">Deal Summary & Split Payment · Barter Settlement · AU SERV logistics</p>

      <div className="mt-4 grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
        <GlassCard level="inner">
          <h3 className="text-section font-semibold">ملخص الصفقة — Deal Summary</h3>
          <div className="mt-3 space-y-2 text-body">
            <div className="flex justify-between"><span>Item Valuation</span><span className="font-mono">{fmt(summary.item_valuation_minor)}</span></div>
            {summary.barter_trade_in_minor !== undefined && <div className="flex justify-between text-[var(--accent-emerald)]"><span>Barter Trade-In Value</span><span className="font-mono">- {fmt(summary.barter_trade_in_minor)}</span></div>}
            {summary.barter_settlement && (
              <div className="rounded-[var(--radius-md)] border border-[var(--brand-gold)] bg-[rgba(197,160,89,0.08)] p-3">
                <p className="text-body font-bold">Barter Settlement — {fmt(summary.barter_settlement.settlement_minor)}</p>
                <p className="text-micro text-[var(--text-secondary)]">{summary.barter_settlement.cash_direction === "b_owes_a" ? `B تدفع ${fmt(summary.barter_settlement.cash_difference_minor)} لـ A` : summary.barter_settlement.cash_direction === "a_owes_b" ? `A تدفع ${fmt(summary.barter_settlement.cash_difference_minor)} لـ B` : "متعادل"} · Escrow app_wallet</p>
              </div>
            )}
            <div className="flex justify-between"><span>Applied Coupon {coupon || "—"}</span><span className="font-mono text-[var(--accent-emerald)]">- {fmt(summary.coupon_discount_minor)}</span></div>
            <div className="flex justify-between"><span>Delivery / Logistics via AU SERV</span><span className="font-mono">{fmt(summary.delivery_minor)}</span></div>
            <div className="flex justify-between border-t pt-2 font-bold text-section"><span>Total Escrow Deposit</span><span className="font-mono">{fmt(summary.escrow_deposit_minor)}</span></div>
          </div>
          <div className="mt-3 flex gap-2">
            <input value={coupon} onChange={e => setCoupon(e.target.value)} placeholder="كوبون — SAVE15" className="flex-1 rounded-[var(--radius-md)] border border-[var(--border-pearl)] bg-white px-3 py-2" />
            <span className="self-center text-micro text-[var(--text-secondary)]">Coupon applied</span>
          </div>
        </GlassCard>

        <GlassCard level="inner" accent="cyan">
          <h3 className="text-section font-semibold">Multi-Method Payment Selector</h3>
          <p className="text-micro text-[var(--text-secondary)]">app_wallet · Fawry · Vodafone Cash · InstaPay · Credit Cards</p>
          <div className="mt-3 grid gap-2">
            {(["app_wallet", "fawry", "vodafone_cash", "instapay", "credit_card"] as PaymentMethod[]).map(m => (
              <button key={m} onClick={() => setMethod(m)} className={`rounded-[var(--radius-md)] border p-3 text-start flex items-center justify-between ${method === m ? "border-[var(--accent-cyan)] bg-[rgba(6,182,212,0.08)]" : "bg-white border-[var(--border-pearl)]"}`}>
                <span className="text-body font-semibold">{m === "app_wallet" ? "محفظة التطبيق app_wallet" : m === "fawry" ? "Fawry" : m === "vodafone_cash" ? "Vodafone Cash" : m === "instapay" ? "InstaPay" : "Credit Card"}</span>
                <span className={`h-4 w-4 rounded-full border-2 ${method === m ? "bg-[var(--accent-cyan)] border-[var(--accent-cyan)]" : "border-[var(--border-pearl)]"}`} />
              </button>
            ))}
          </div>
          <Button className="mt-4 w-full" onClick={pay}>ادفع {fmt(summary.escrow_deposit_minor)} عبر {method === "app_wallet" ? "المحفظة" : method}</Button>
          <p className="mt-2 text-micro text-[var(--text-secondary)]">Headers: X-App-Id AU DEALS · Escrow Vault app_wallet · كل طرق الدفع معزولة بالمستأجر</p>
        </GlassCard>
      </div>
    </AppLayout>
  );
}
