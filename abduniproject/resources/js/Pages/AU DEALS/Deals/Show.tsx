// AU DEALS — Unified Single Deal & Barter Execution — Tri-Modal Action Panel + Counter-Offer Timeline
import { useMemo, useState } from "react";
import { router, usePage } from "@inertiajs/react";
import AppLayout from "@/Layouts/AppLayout";
import Button from "@/Components/UI/Button";
import GlassCard from "@/Components/UI/GlassCard";
import Modal from "@/Components/UI/Modal";
import StatusBadge from "@/Components/UI/StatusBadge";
import { maskLeak } from "@/Utils/sanitize";
import type { SharedPageProps } from "@/Types/global.d";
import type { Deal, CounterOffer, BarterValuation } from "@/Types/deals.d";

const TENANT: "AU DEALS" = "AU DEALS";

function fmt(minor: number): string {
  return new Intl.NumberFormat("ar-EG", { style: "currency", currency: "EGP", numberingSystem: "latn" }).format(minor / 100);
}

const MOCK_DEAL: Deal = {
  id: "d3", app_id: TENANT, deal_type: "BARTER", title_ar: "مقايضة: لابتوب مقابل دراجة + فرق نقدي", title_en: "Laptop ↔ Bike Barter", description_ar: "لابتوب Dell حالة ممتازة مقابل دراجة جبلية", category: "مقايضة", images: ["/img/laptop.jpg", "/img/bike.jpg"], price_minor: 3200000, currency: "EGP", verified: true, barter_eligible: true, stock_qty: 1, merchant: { merchant_id: 12, merchant_name: "BarterHub", merchant_name_ar: "مركز المقايضة", app_id: "AU BUSINESS", verified: true, rating: 4.9 }, condition: "used_like_new", created_at: new Date().toISOString(), attributes: {},
};

const MOCK_OFFERS: CounterOffer[] = [
  { id: "o1", deal_id: "d3", app_id: TENANT, from_user_id: 7, from_name: "أحمد", price_minor: 3000000, note_sanitized: "أعرض لابتوبي + 2000 جنيه فرق", status: "pending", expires_at: new Date(Date.now() + 8 * 60 * 1000).toISOString(), created_at: new Date().toISOString() },
  { id: "o2", deal_id: "d3", app_id: TENANT, from_user_id: 8, from_name: "سارة", price_minor: 2800000, note_sanitized: "دراجتي + دفع 5000", status: "countered", expires_at: new Date(Date.now() + 20 * 60 * 1000).toISOString(), created_at: new Date().toISOString() },
];

const MY_ASSETS = [
  { id: "a_my1", title_ar: "لابتوبي Dell XPS", valuation_minor: 3400000, image: "💻" },
  { id: "a_my2", title_ar: "تابلت آيباد", valuation_minor: 1800000, image: "📱" },
];

export default function DealShow() {
  const { props } = usePage<SharedPageProps>();
  const isDeals = (props.tenant?.app_id ?? props.app_id) === TENANT;
  const [deal] = useState<Deal>(MOCK_DEAL);
  const [activeImg, setActiveImg] = useState(0);
  const [offers, setOffers] = useState<CounterOffer[]>(MOCK_OFFERS);
  const [barterOpen, setBarterOpen] = useState(false);
  const [quoteOpen, setQuoteOpen] = useState(false);
  const [selectedAsset, setSelectedAsset] = useState(MY_ASSETS[0].id);
  const [cashAdj, setCashAdj] = useState(0); // + Cash = buyer pays extra, - Cash = seller pays
  const [note, setNote] = useState("");
  const [qNote, setQNote] = useState("");
  const [qPrice, setQPrice] = useState<number>(3000000);
  const sanitized = useMemo(() => maskLeak(note), [note]);
  const sanitizedQ = useMemo(() => maskLeak(qNote), [qNote]);

  const valuation: BarterValuation = useMemo(() => {
    const my = MY_ASSETS.find(a => a.id === selectedAsset) ?? MY_ASSETS[0];
    const theirVal = deal.price_minor;
    const myVal = my.valuation_minor + cashAdj * 100;
    const settlement = myVal - theirVal;
    const abs = Math.abs(settlement);
    return {
      asset_a: { id: my.id, title_ar: my.title_ar, image: my.image, valuation_minor: myVal, currency: "EGP", owner: "party_a" },
      asset_b: { id: deal.id, title_ar: deal.title_ar, image: "🚲", valuation_minor: theirVal, currency: "EGP", owner: "party_b" },
      settlement_minor: settlement,
      cash_direction: settlement === 0 ? "even" : settlement > 0 ? "b_owes_a" : "a_owes_b",
      cash_difference_minor: abs,
    };
  }, [selectedAsset, cashAdj, deal]);

  if (!isDeals) return <AppLayout><GlassCard level="inner" className="text-center"><p className="text-section font-bold">يتطلب AU DEALS</p></GlassCard></AppLayout>;

  const accept = (id: string): void => { setOffers(a => a.map(o => (o.id === id ? { ...o, status: "accepted" } : o))); router.post(`/deals/${deal.id}/offers/${id}/accept`, { app_id: TENANT } as unknown as never, { headers: { "X-App-Id": TENANT } as unknown as Record<string, string> }); };
  const reject = (id: string): void => setOffers(a => a.map(o => (o.id === id ? { ...o, status: "rejected" } : o)));

  return (
    <AppLayout>
      <div className="flex flex-wrap items-center gap-2 text-micro text-[var(--text-secondary)]">
        <span>AU DEALS</span><span>›</span><span>{deal.category}</span><span>›</span><span className="text-[var(--text-primary)]">{deal.title_ar}</span>
        <span className="ms-auto rounded-full bg-[var(--brand-gold)] px-2 py-1 text-black font-bold">Barter-Eligible #C5A059</span>
      </div>

      <div className="mt-3 grid gap-4 lg:grid-cols-[1.1fr_0.9fr]">
        <GlassCard level="inner" padding="none" className="overflow-hidden">
          <div className="h-64 bg-[var(--surface-secondary)] flex items-center justify-center relative">
            <span className="text-title">🖼️ {deal.title_en} — صورة {activeImg + 1}</span>
            {deal.verified && <span className="absolute top-3 start-3 rounded-full bg-[var(--accent-emerald)] px-2 py-1 text-micro text-white">موثّق Verified</span>}
            <span className="absolute top-3 end-3 rounded-full bg-[var(--surface-pearl)] px-2 py-1 text-micro border">مخزون {deal.stock_qty} · {deal.condition}</span>
          </div>
          <div className="flex gap-2 p-3">
            {deal.images.map((_, i) => <button key={i} onClick={() => setActiveImg(i)} className={`h-16 w-16 rounded-[var(--radius-md)] border-2 flex items-center justify-center bg-white ${activeImg === i ? "border-[var(--accent-cyan)]" : "border-[var(--border-pearl)]"}`}>📷 {i + 1}</button>)}
            <button className="ms-auto text-micro text-[var(--text-secondary)]">تكبير 🔍</button>
          </div>
        </GlassCard>

        <div className="space-y-4">
          <GlassCard level="inner">
            <h1 className="text-section font-bold">{deal.title_ar}</h1>
            <p className="text-micro text-[var(--text-secondary)]">{deal.description_ar} · {deal.merchant.merchant_name_ar} → AU BUSINESS #{deal.merchant.merchant_id} ★ {deal.merchant.rating}</p>
            <div className="mt-3 flex items-baseline gap-2"><span className="text-title font-bold tabular-nums">{fmt(deal.price_minor)}</span><StatusBadge state={deal.deal_type === "BARTER" ? "VIP" : "Verified"} label={deal.deal_type} /></div>
            <p className="text-micro text-[var(--text-secondary)]">Settlement = Valuation A − Valuation B · Escrow app_wallet</p>
          </GlassCard>

          <GlassCard level="inner">
            <h3 className="text-body font-bold">Tri-Modal Action Panel</h3>
            {deal.deal_type === "OFFER" && (
              <div className="mt-3 flex gap-2"><Button className="flex-1" onClick={() => router.visit(`/deals/${deal.id}/checkout`, { headers: { "X-App-Id": TENANT } as unknown as Record<string, string> })}>Buy Now — Escrow</Button><Button variant="secondary" onClick={() => router.visit(`/deals/${deal.id}/checkout`, { headers: { "X-App-Id": TENANT } as unknown as Record<string, string> })}>Add to Cart</Button></div>
            )}
            {deal.deal_type === "REQUEST" && (
              <div className="mt-3"><Button className="w-full" variant="ai-action" onClick={() => setQuoteOpen(true)}>Submit Quotation / Offer Item</Button><p className="mt-1 text-micro text-[var(--text-secondary)]">Buyer seeking — reverse auction</p></div>
            )}
            {deal.deal_type === "BARTER" && (
              <div className="mt-3">
                <div className="rounded-[var(--radius-md)] border border-[var(--brand-gold)] bg-[rgba(197,160,89,0.08)] p-3">
                  <p className="text-body font-bold">Barter Cash Balance Engine</p>
                  <div className="mt-2 grid gap-2 text-body">
                    <div className="flex justify-between"><span>{valuation.asset_a.title_ar} (A)</span><span className="font-mono">{fmt(valuation.asset_a.valuation_minor)}</span></div>
                    <div className="flex justify-between"><span>{valuation.asset_b.title_ar} (B)</span><span className="font-mono">{fmt(valuation.asset_b.valuation_minor)}</span></div>
                    <div className="flex justify-between border-t pt-2 font-bold"><span>Settlement = A − B</span><span className="font-mono" style={{ color: valuation.settlement_minor === 0 ? "var(--text-secondary)" : valuation.settlement_minor > 0 ? "var(--accent-emerald)" : "var(--brand-crimson)" }}>{fmt(valuation.settlement_minor)}</span></div>
                    <p className="text-micro text-[var(--text-secondary)]">{valuation.cash_direction === "even" ? "متعادل — لا فرق نقدي" : valuation.cash_direction === "a_owes_b" ? `Party A تدفع ${fmt(valuation.cash_difference_minor)} لـ B` : `Party B تدفع ${fmt(valuation.cash_difference_minor)} لـ A`} · Escrow app_wallet</p>
                  </div>
                </div>
                <Button className="mt-3 w-full" variant="gold" onClick={() => setBarterOpen(true)}>Propose Barter Swap — اختر صنفك + فرق نقدي</Button>
              </div>
            )}
          </GlassCard>
        </div>
      </div>

      <GlassCard level="inner" className="mt-4">
        <h3 className="text-section font-semibold">Counter-Offer & Negotiation Timeline — سجل التفاوض</h3>
        <p className="text-micro text-[var(--text-secondary)]">Real-time log · accept/reject · expiration countdown</p>
        <div className="mt-3 space-y-2">
          {offers.map(o => {
            const left = Math.max(0, new Date(o.expires_at).getTime() - Date.now());
            const m = Math.floor(left / 60000), s = Math.floor((left % 60000) / 1000);
            return (
              <div key={o.id} className="rounded-[var(--radius-md)] bg-white border border-[var(--border-pearl)] p-3 flex flex-wrap items-center gap-3">
                <div className="flex-1"><p className="text-body font-semibold">{o.from_name} — {fmt(o.price_minor)}</p><p className="text-micro text-[var(--text-secondary)]">{o.note_sanitized} · {new Date(o.created_at).toLocaleTimeString("ar-EG")}</p></div>
                <span className="font-mono text-micro tabular-nums border border-[var(--border-pearl)] rounded-full px-2 py-1 bg-[var(--surface-pearl)]">{String(m).padStart(2, "0")}:{String(s).padStart(2, "0")}</span>
                <StatusBadge state={o.status === "accepted" ? "Verified" : o.status === "rejected" ? "Danger" : o.status === "countered" ? "Pending" : "AI_Active"} label={o.status} />
                <div className="flex gap-1"><Button size="sm" onClick={() => accept(o.id)}>قبول</Button><Button size="sm" variant="secondary" onClick={() => reject(o.id)}>رفض</Button></div>
              </div>
            );
          })}
        </div>
      </GlassCard>

      {/* Barter Drawer */}
      <Modal open={barterOpen} onOpenChange={setBarterOpen} title="اقتراح مقايضة — اختر صنفك">
        <div className="space-y-3">
          <p className="text-micro text-[var(--text-secondary)]">اختر صنفاً من كتالوجك + اضبط فرق نقدي (+ Cash / − Cash) — يُطهّر تلقائياً</p>
          <div className="grid gap-2">
            {MY_ASSETS.map(a => <button key={a.id} onClick={() => setSelectedAsset(a.id)} className={`rounded-[var(--radius-md)] border p-3 text-start flex items-center gap-3 ${selectedAsset === a.id ? "border-[var(--brand-gold)] bg-[rgba(197,160,89,0.12)]" : "bg-white border-[var(--border-pearl)]"}`}><span className="text-title">{a.image}</span><span className="text-body font-semibold">{a.title_ar}</span><span className="ms-auto font-mono text-body">{fmt(a.valuation_minor)}</span></button>)}
          </div>
          <div><label className="text-body font-medium">فرق نقدي — Cash difference (جنيه)</label><input type="range" min={-5000} max={5000} step={100} value={cashAdj} onChange={e => setCashAdj(Number(e.target.value))} className="w-full" /><p className="text-micro text-[var(--text-secondary)]">{cashAdj >= 0 ? `+${cashAdj} جنيه تدفعها أنت` : `${cashAdj} جنيه تستلمها`}</p></div>
          <div className="rounded-[var(--radius-md)] bg-[var(--surface-secondary)] p-3 text-body">
            <p>Settlement = {fmt(valuation.asset_a.valuation_minor)} − {fmt(valuation.asset_b.valuation_minor)} = <b>{fmt(valuation.settlement_minor)}</b></p>
            <p className="text-micro text-[var(--text-secondary)]">{valuation.cash_direction === "even" ? "متعادل" : valuation.cash_direction === "a_owes_b" ? `أنت تدفع ${fmt(valuation.cash_difference_minor)}` : `الطرف الآخر يدفع ${fmt(valuation.cash_difference_minor)}`}</p>
          </div>
          <div><label className="text-body font-medium">ملاحظة مقايضة — تُطهّر</label><textarea value={note} onChange={e => setNote(e.target.value)} rows={3} placeholder="مثال: لابتوب نظيف — لا تضف هاتف/رابط" className="mt-1 w-full rounded-[var(--radius-md)] border border-[var(--border-pearl)] bg-white px-3 py-2" />{note !== sanitized && <p className="text-micro text-[var(--brand-crimson)]">تم الطمس: {sanitized}</p>}</div>
          <div className="flex gap-2"><Button className="flex-1" onClick={() => { setBarterOpen(false); router.post(`/deals/${deal.id}/barter`, { app_id: TENANT, asset_id: selectedAsset, cash_adj: cashAdj, note: sanitized } as unknown as never, { headers: { "X-App-Id": TENANT } as unknown as Record<string, string> }); }}>إرسال اقتراح مقايضة</Button><Button variant="secondary" onClick={() => setBarterOpen(false)}>إلغاء</Button></div>
        </div>
      </Modal>

      <Modal open={quoteOpen} onOpenChange={setQuoteOpen} title="إرسال عرض سعر">
        <div className="space-y-3">
          <label className="text-body font-medium">سعرك (جنيه)</label><input type="number" value={qPrice / 100} onChange={e => setQPrice(Number(e.target.value) * 100)} className="w-full rounded-[var(--radius-md)] border border-[var(--border-pearl)] bg-white px-3 py-2" />
          <label className="text-body font-medium">ملاحظة — تُطهّر</label><textarea value={qNote} onChange={e => setQNote(e.target.value)} rows={3} placeholder="تفاصيل العرض — لا هاتف/رابط" className="w-full rounded-[var(--radius-md)] border border-[var(--border-pearl)] bg-white px-3 py-2" />{qNote !== sanitizedQ && <p className="text-micro text-[var(--brand-crimson)]">تم الطمس: {sanitizedQ}</p>}
          <Button className="w-full" onClick={() => { setQuoteOpen(false); router.post(`/deals/${deal.id}/quote`, { app_id: TENANT, price_minor: qPrice, note: sanitizedQ } as unknown as never, { headers: { "X-App-Id": TENANT } as unknown as Record<string, string> }); }}>إرسال العرض</Button>
        </div>
      </Modal>
    </AppLayout>
  );
}
