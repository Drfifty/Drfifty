// AU DEALS — Dynamic Deals Marketplace & Barter Feed — Tri-Modal + Schema Engine — app_id="AU DEALS"
import { useMemo, useState } from "react";
import { router, usePage } from "@inertiajs/react";
import AppLayout from "@/Layouts/AppLayout";
import Button from "@/Components/UI/Button";
import GlassCard from "@/Components/UI/GlassCard";
import StatusBadge from "@/Components/UI/StatusBadge";
import { maskLeak } from "@/Utils/sanitize";
import type { SharedPageProps } from "@/Types/global.d";
import type { Deal, DealType } from "@/Types/deals.d";

const TENANT: "AU DEALS" = "AU DEALS";

function fmt(minor: number): string {
  return new Intl.NumberFormat("ar-EG", { style: "currency", currency: "EGP", numberingSystem: "latn" }).format(minor / 100);
}

const MOCK_DEALS: Deal[] = [
  { id: "d1", app_id: TENANT, deal_type: "OFFER", title_ar: "آيفون 15 برو — خصم مباشر", title_en: "iPhone 15 Pro Offer", description_ar: "جديد مختوم", category: "إلكترونيات", images: ["/img/iphone.jpg"], price_minor: 5800000, original_price_minor: 7200000, currency: "EGP", savings_pct: 19, verified: true, barter_eligible: true, stock_qty: 12, merchant: { merchant_id: 7, merchant_name: "TechStore", merchant_name_ar: "متجر التقنية", app_id: "AU BUSINESS", verified: true, rating: 4.8 }, condition: "new", geo_lat: 30.04, geo_lng: 31.23, created_at: new Date().toISOString(), attributes: { condition: "new", radius: 10 } },
  { id: "d2", app_id: TENANT, deal_type: "REQUEST", title_ar: "مطلوب: مولد كهرباء 10KVA", title_en: "Wanted: Generator 10KVA", description_ar: "مشترٍ يبحث عن مولد", category: "معدات", images: ["/img/gen.jpg"], price_minor: 4500000, currency: "EGP", verified: false, barter_eligible: false, stock_qty: 0, merchant: { merchant_id: 9, merchant_name: "FactoryCo", merchant_name_ar: "مصنعكو", app_id: "AU BUSINESS", verified: true, rating: 4.6 }, condition: "new", created_at: new Date().toISOString(), attributes: { swap: "none" } },
  { id: "d3", app_id: TENANT, deal_type: "BARTER", title_ar: "مقايضة: لابتوب مقابل دراجة + فرق نقدي", title_en: "Barter: Laptop ↔ Bike", description_ar: "مقايضة مع فرق", category: "مقايضة", images: ["/img/laptop.jpg"], price_minor: 3200000, currency: "EGP", savings_pct: 0, verified: true, barter_eligible: true, stock_qty: 1, merchant: { merchant_id: 12, merchant_name: "BarterHub", merchant_name_ar: "مركز المقايضة", app_id: "AU BUSINESS", verified: true, rating: 4.9 }, condition: "used_like_new", created_at: new Date().toISOString(), attributes: { swap: "bike" } },
  { id: "d4", app_id: TENANT, deal_type: "OFFER", title_ar: "عرض جماعي — سماعة بلوتوث", title_en: "Group BT Speaker", description_ar: "خصم جماعي", category: "إلكترونيات", images: ["/img/speaker.jpg"], price_minor: 85000, original_price_minor: 120000, currency: "EGP", savings_pct: 29, verified: true, barter_eligible: false, stock_qty: 200, merchant: { merchant_id: 7, merchant_name: "TechStore", merchant_name_ar: "متجر التقنية", app_id: "AU BUSINESS", verified: true, rating: 4.8 }, condition: "new", created_at: new Date().toISOString(), attributes: {} },
];

export default function MarketplaceIndex() {
  const { props } = usePage<SharedPageProps>();
  const isDeals = (props.tenant?.app_id ?? props.app_id) === TENANT;
  const [mode, setMode] = useState<DealType | "ALL">("ALL");
  const [q, setQ] = useState("");
  const [priceMax, setPriceMax] = useState<number>(10000000);
  const [cond, setCond] = useState<string>("all");
  const [radius, setRadius] = useState<number>(50);
  const sanitized = useMemo(() => maskLeak(q), [q]);

  if (!isDeals) return <AppLayout><GlassCard level="inner" className="text-center"><p className="text-section font-bold">يتطلب AU DEALS</p><p className="text-body text-[var(--text-secondary)]">app_id الحالي: {String(props.tenant?.app_id ?? props.app_id)}</p></GlassCard></AppLayout>;

  const filtered = MOCK_DEALS.filter(d => (mode === "ALL" || d.deal_type === mode) && d.price_minor <= priceMax && (cond === "all" || d.condition === cond) && (!sanitized || d.title_ar.includes(sanitized) || d.title_en.toLowerCase().includes(sanitized.toLowerCase())));

  return (
    <AppLayout>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-title font-bold text-white">سوق الصفقات والمقايضة — AU DEALS</h1>
        <span className="rounded-full bg-[var(--brand-gold)] px-3 py-1 text-micro font-bold text-black">TENANT ISOLATED ✓ AU DEALS</span>
      </div>
      <p className="text-micro text-[var(--text-secondary)]">Dynamic link to AU BUSINESS merchant profiles — app_id="{TENANT}" على كل تفاعل</p>

      <GlassCard level="inner" className="mt-4">
        <div className="flex flex-wrap gap-2">
          {(["ALL", "OFFER", "REQUEST", "BARTER"] as const).map(m => (
            <button key={m} onClick={() => setMode(m)} className={`rounded-full px-4 py-2 text-body font-bold border ${mode === m ? "bg-[var(--canvas-dark)] text-white border-transparent" : "bg-white text-[var(--text-on-pearl)] border-[var(--border-pearl)]"}`}>
              {m === "ALL" ? "كل الصفقات" : m === "OFFER" ? "عروض مباشرة" : m === "REQUEST" ? "طلبات شراء" : "مقايضات"}
            </button>
          ))}
        </div>
        <div className="mt-3 grid gap-3 md:grid-cols-4">
          <div><label className="text-micro font-bold">بحث — يُطهّر</label><input value={q} onChange={e => setQ(e.target.value)} placeholder="ابحث صفقة — لا هاتف/رابط" className="mt-1 w-full rounded-[var(--radius-md)] border border-[var(--border-pearl)] bg-white px-3 py-2 text-body" />{q !== sanitized && <p className="text-micro text-[var(--brand-crimson)]">تم الطمس: {sanitized}</p>}</div>
          <div><label className="text-micro font-bold">سعر أقصى</label><input type="range" min={0} max={10000000} step={50000} value={priceMax} onChange={e => setPriceMax(Number(e.target.value))} className="mt-2 w-full" /><p className="text-micro text-[var(--text-secondary)]">{fmt(priceMax)}</p></div>
          <div><label className="text-micro font-bold">الحالة</label><select value={cond} onChange={e => setCond(e.target.value)} className="mt-1 w-full rounded-[var(--radius-md)] border border-[var(--border-pearl)] bg-white px-3 py-2"><option value="all">الكل</option><option value="new">جديد</option><option value="used_like_new">مستعمل ممتاز</option></select></div>
          <div><label className="text-micro font-bold">نطاق جغرافي {radius}km</label><input type="range" min={2} max={50} value={radius} onChange={e => setRadius(Number(e.target.value))} className="mt-2 w-full" /></div>
        </div>
        <p className="mt-2 text-micro text-[var(--text-secondary)]">Dynamic Schema Engine — حقول من الخادم (Price, Condition, Radius, Swap Preferences)</p>
      </GlassCard>

      <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {filtered.map(d => (
          <GlassCard key={d.id} level="inner" className="overflow-hidden p-0">
            <div className="h-36 bg-[var(--surface-secondary)] flex items-center justify-center text-[var(--text-secondary)] relative">
              <span className="text-title">🖼️ {d.title_en}</span>
              {d.verified && <span className="absolute top-2 start-2 rounded-full bg-[var(--accent-emerald)] px-2 py-1 text-micro text-white">موثّق Verified</span>}
              {d.barter_eligible && <span className="absolute top-2 end-2 rounded-full bg-[var(--brand-gold)] px-2 py-1 text-micro font-bold text-black border border-black/10">Barter-Eligible</span>}
              {d.savings_pct ? <span className="absolute bottom-2 end-2 rounded-full bg-[var(--brand-crimson)] px-2 py-1 text-micro text-white">-{d.savings_pct}%</span> : null}
            </div>
            <div className="p-4">
              <p className="text-body font-bold">{d.title_ar}</p>
              <p className="text-micro text-[var(--text-secondary)]">{d.category} · {d.merchant.merchant_name_ar} → AU BUSINESS #{d.merchant.merchant_id} · ★ {d.merchant.rating}</p>
              <div className="mt-2 flex items-baseline gap-2">
                <span className="text-section font-bold tabular-nums">{fmt(d.price_minor)}</span>
                {d.original_price_minor && <span className="text-micro line-through text-[var(--text-secondary)]">{fmt(d.original_price_minor)}</span>}
                <StatusBadge state={d.deal_type === "OFFER" ? "Verified" : d.deal_type === "REQUEST" ? "Pending" : "VIP"} label={d.deal_type} className="ms-auto" />
              </div>
              <p className="mt-1 text-micro text-[var(--text-secondary)]">مخزون {d.stock_qty} · {d.condition}</p>
              <div className="mt-3 flex gap-2">
                <Button size="sm" className="flex-1" onClick={() => router.visit(`/deals/${d.id}`, { headers: { "X-App-Id": TENANT } as unknown as Record<string, string> })}>عرض</Button>
                <Button size="sm" variant="secondary" onClick={() => router.visit(`/deals/${d.id}`, { headers: { "X-App-Id": TENANT } as unknown as Record<string, string> })}>{d.deal_type === "BARTER" ? "اقترح مقايضة" : "تفاصيل"}</Button>
              </div>
            </div>
          </GlassCard>
        ))}
      </div>
      {filtered.length === 0 && <p className="mt-6 text-center text-body text-[var(--text-secondary)]">لا نتائج — عدّل الفلاتر</p>}
    </AppLayout>
  );
}
