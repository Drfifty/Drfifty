// AU MED — Medical Journey Checkout & Insurance Copay Calculator — journey_id/deal_id + Bundle Discount + Escrow per sub-deal
import { useMemo, useState } from "react";
import { router, usePage } from "@inertiajs/react";
import AppLayout from "@/Layouts/AppLayout";
import Button from "@/Components/UI/Button";
import GlassCard from "@/Components/UI/GlassCard";
import StatusBadge from "@/Components/UI/StatusBadge";
import type { SharedPageProps } from "@/Types/global.d";
import type { MedJourney, InsuranceGate, MedicalWallet, MedDeal } from "@/Types/AU MED.d";

const TENANT: "AU MED" = "AU MED";

function fmt(minor: number): string {
  return new Intl.NumberFormat("ar-EG", { style: "currency", currency: "EGP", numberingSystem: "latn" }).format(minor / 100);
}

const MOCK_JOURNEY: MedJourney = {
  journey_id: "jour_8841",
  patient_id: 7,
  app_id: TENANT,
  title_ar: "باقة علاجية — طبيب + تحليل + إسعاف + صيدلية",
  title_en: "Bundle: Physician + Lab + Ambulance + Pharmacy",
  gross_total_minor: 580000,
  bundle_discount_minor: 80000,
  net_total_minor: 500000,
  currency: "EGP",
  created_at: new Date().toISOString(),
  deals: [
    { deal_id: "deal_doc", journey_id: "jour_8841", app_id: TENANT, type: "physician", title_ar: "كشف طبيب", provider_name: "د. أحمد", amount_minor: 250000, escrow_minor: 250000, status: "held" },
    { deal_id: "deal_lab", journey_id: "jour_8841", app_id: TENANT, type: "lab", title_ar: "تحليل دم", provider_name: "مختبر النيل", amount_minor: 150000, escrow_minor: 150000, status: "held" },
    { deal_id: "deal_amb", journey_id: "jour_8841", app_id: TENANT, type: "ambulance", title_ar: "إسعاف منزلي", provider_name: "AU SERV", amount_minor: 80000, escrow_minor: 80000, status: "held" },
    { deal_id: "deal_pharm", journey_id: "jour_8841", app_id: TENANT, type: "pharmacy", title_ar: "صيدلية", provider_name: "صيدلية النيل", amount_minor: 100000, escrow_minor: 20000, status: "pending" },
  ],
};

const MOCK_WALLET: MedicalWallet = { id: 1, patient_id: 7, app_id: TENANT, balance_minor: 750000, currency: "EGP", locked_minor: 0 };

export default function JourneySummary() {
  const { props } = usePage<SharedPageProps>();
  const isMed = (props.tenant?.app_id ?? props.app_id) === TENANT;
  const [insurance, setInsurance] = useState<InsuranceGate>({ provider: "AXA", eligibility: "eligible", coverage_limit_minor: 300000, copay_pct: 20, expiry: "2027-06-01" });
  const [selectedProvider, setSelectedProvider] = useState<InsuranceGate["provider"]>("AXA");

  const copay = useMemo(() => {
    const gross = MOCK_JOURNEY.net_total_minor;
    const coverage = Math.min(insurance.coverage_limit_minor, insurance.eligibility === "eligible" ? gross : 0);
    const simplePayable = insurance.eligibility === "eligible" ? Math.max(0, gross - coverage) : gross;
    return { gross, coverage, netPayable: simplePayable, copayPct: insurance.copay_pct };
  }, [insurance]);

  if (!isMed) return <AppLayout><GlassCard level="inner" className="text-center"><p className="text-section font-bold">يتطلب AU MED</p></GlassCard></AppLayout>;

  const checkEligibility = (p: InsuranceGate["provider"]): void => {
    setSelectedProvider(p);
    if (p === "None") setInsurance({ provider: p, eligibility: "ineligible", coverage_limit_minor: 0, copay_pct: 100, expiry: "-" });
    else if (p === "Syndicate") setInsurance({ provider: p, eligibility: "pending", coverage_limit_minor: 150000, copay_pct: 40, expiry: "2026-12-01" });
    else setInsurance({ provider: p, eligibility: "eligible", coverage_limit_minor: p === "AXA" ? 300000 : 200000, copay_pct: p === "AXA" ? 20 : 25, expiry: "2027-06-01" });
  };

  // FIX-P2-10 Idempotency-Key + FIX-P2-07 RBAC + FIX-P2-14 X-Trace
  const pay = (): void => {
    const idem = typeof crypto!=="undefined" && crypto.randomUUID ? crypto.randomUUID() : String(Date.now());
    router.post("/med/checkout/pay", { app_id: TENANT, journey_id: MOCK_JOURNEY.journey_id, insurance_provider: insurance.provider } as unknown as never,
      { headers: { "X-App-Id": TENANT, "Idempotency-Key": idem, "X-Trace-Id": (document.querySelector('meta[name="trace-id"]') as HTMLMetaElement)?.content ?? "" } as unknown as Record<string, string> } as unknown as Record<string,unknown>);
  };

  return (
    <AppLayout>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-title font-bold text-white">ملخص الرحلة العلاجية — Journey Checkout</h1>
        <span className="rounded-full bg-[var(--accent-cyan)] px-3 py-1 text-micro text-white">journey_id {MOCK_JOURNEY.journey_id}</span>
      </div>
      <p className="text-micro text-[var(--text-secondary)]">Atomized Journey — Parent Journey {MOCK_JOURNEY.journey_id} → {MOCK_JOURNEY.deals.length} Sub-Deals (deal_id) — Bundle Discount Calculator</p>

      <div className="mt-4 grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
        <GlassCard level="inner">
          <h3 className="text-section font-semibold">{MOCK_JOURNEY.title_ar}</h3>
          <p className="text-micro text-[var(--text-secondary)]">{MOCK_JOURNEY.title_en}</p>

          {/* Bundle Discount Calculator Widget */}
          <div className="mt-3 rounded-[var(--radius-md)] border border-[var(--brand-gold)] bg-[rgba(197,160,89,0.08)] p-4">
            <h4 className="text-body font-bold">Bundle Discount Calculator — حساب الحزمة</h4>
            <div className="mt-2 grid gap-2 text-body">
              <div className="flex justify-between"><span>Gross Journey Total</span><span className="font-mono tabular-nums">{fmt(MOCK_JOURNEY.gross_total_minor)}</span></div>
              <div className="flex justify-between text-[var(--accent-emerald)]"><span>Bundle Discount — {Math.round(MOCK_JOURNEY.bundle_discount_minor / MOCK_JOURNEY.gross_total_minor * 100)}%</span><span className="font-mono">- {fmt(MOCK_JOURNEY.bundle_discount_minor)}</span></div>
              <div className="flex justify-between border-t border-[var(--border-pearl)] pt-2 font-bold"><span>Final Amount = Gross − Discount</span><span className="font-mono">{fmt(MOCK_JOURNEY.net_total_minor)}</span></div>
            </div>
            <p className="mt-2 text-micro text-[var(--text-secondary)]">Sub-Deals تنقسم تلقائياً — كل deal_id يُحجز في Escrow مستقل</p>
          </div>

          <div className="mt-4">
            <h4 className="text-body font-semibold">Sub-Deal Escrow Breakdown — توزيع الضمان</h4>
            <div className="mt-2 space-y-2">
              {MOCK_JOURNEY.deals.map((d: MedDeal) => (
                <div key={d.deal_id} className="flex items-center justify-between rounded-[var(--radius-md)] bg-white border border-[var(--border-pearl)] p-3">
                  <div><p className="text-body font-semibold">{d.title_ar} — {d.provider_name}</p><p className="text-micro text-[var(--text-secondary)]">{d.deal_id} · {d.type}</p></div>
                  <div className="text-end"><p className="font-mono text-body">{fmt(d.amount_minor)}</p><span className={`rounded-full px-2 py-1 text-micro font-bold ${d.status === "held" ? "bg-[var(--accent-amber)] text-black" : "bg-[var(--surface-secondary)] text-[var(--text-secondary)]"}`}>Escrow {fmt(d.escrow_minor)} · {d.status}</span></div>
                </div>
              ))}
            </div>
          </div>
        </GlassCard>

        <div className="space-y-4">
          <GlassCard level="inner">
            <h3 className="text-section font-semibold">Insurance Network Gate — بوابة التأمين</h3>
            <div className="mt-3 grid grid-cols-2 gap-2">
              {(["AXA", "MetLife", "Syndicate", "None"] as const).map(p => (
                <button key={p} onClick={() => checkEligibility(p)} className={`rounded-[var(--radius-md)] border p-3 text-body font-bold ${selectedProvider === p ? "border-[var(--accent-cyan)] bg-[rgba(6,182,212,0.08)]" : "bg-white border-[var(--border-pearl)]"}`}>{p}</button>
              ))}
            </div>
            <div className="mt-3 rounded-[var(--radius-md)] bg-white border border-[var(--border-pearl)] p-3">
              <p className="text-body font-semibold">المزود: {insurance.provider} · <StatusBadge state={insurance.eligibility === "eligible" ? "Verified" : insurance.eligibility === "pending" ? "Pending" : "Danger"} label={insurance.eligibility} /></p>
              <p className="text-micro text-[var(--text-secondary)]">Expiry {insurance.expiry} · Coverage Limit {fmt(insurance.coverage_limit_minor)} · Copay {insurance.copay_pct}%</p>
              <p className="mt-1 text-micro font-mono">Eligibility check → app_id AU MED · instant</p>
            </div>
            <div className="mt-3">
              <label className="text-body font-medium">مسح بطاقة التأمين (محاكاة)</label>
              <input placeholder="رقم البطاقة — يُطهّر" className="mt-1 w-full rounded-[var(--radius-md)] border border-[var(--border-pearl)] bg-white px-3 py-2" onChange={() => checkEligibility(selectedProvider)} />
            </div>
          </GlassCard>

          <GlassCard level="inner" accent="cyan">
            <h3 className="text-section font-semibold">Real-Time Copay Split Widget — المحفظة الطبية</h3>
            <div className="mt-3 space-y-2 text-body">
              <div className="flex justify-between"><span>Gross Medical Cost (بعد الحزمة)</span><span className="font-mono">{fmt(copay.gross)}</span></div>
              <div className="flex justify-between text-[var(--accent-emerald)]"><span>Approved Insurance Coverage</span><span className="font-mono">- {fmt(copay.coverage)}</span></div>
              <div className="flex justify-between"><span>Copay Percentage {copay.copayPct}%</span><span className="font-mono">{copay.copayPct}%</span></div>
              <div className="flex justify-between border-t border-[var(--border-pearl)] pt-2 font-bold"><span>Net Payable Balance (app_wallet)</span><span className="font-mono">{fmt(copay.netPayable)}</span></div>
            </div>
            <div className="mt-3 rounded-[var(--radius-md)] bg-white border border-[var(--border-pearl)] p-3">
              <p className="text-body font-semibold">Medical Wallet — {fmt(MOCK_WALLET.balance_minor)} متاح</p>
              <p className="text-micro text-[var(--text-secondary)]">app_wallet · {MOCK_WALLET.app_id} · محجوز {fmt(MOCK_WALLET.locked_minor)}</p>
              <div className="mt-2 h-2 rounded-full bg-[var(--surface-secondary)]"><div className="h-2 rounded-full bg-[var(--accent-emerald)]" style={{ width: `${Math.min(100, (copay.netPayable / MOCK_WALLET.balance_minor) * 100)}%` }} /></div>
              <p className="mt-1 text-micro text-[var(--text-secondary)]">{copay.netPayable <= MOCK_WALLET.balance_minor ? "✓ رصيد كافٍ" : "✗ رصيد غير كافٍ — اشحن المحفظة"}</p>
            </div>
            <Button className="mt-3 w-full" featureFlag="au_med" requiredPermission="med.checkout.pay" isDisabled={copay.netPayable > MOCK_WALLET.balance_minor} onClick={pay}>ادفع عبر المحفظة — Pay {fmt(copay.netPayable)}</Button>
            <p className="mt-1 text-micro text-[var(--text-secondary)]">Headers: X-App-Id AU MED · escrow per sub-deal</p>
          </GlassCard>
        </div>
      </div>
    </AppLayout>
  );
}
