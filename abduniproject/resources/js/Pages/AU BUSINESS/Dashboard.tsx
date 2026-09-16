// AU BUSINESS — B2B Enterprise Dashboard & Overview — app_id="AU BUSINESS" ENFORCED
import { useEffect, useMemo, useState } from "react";
import { router, usePage } from "@inertiajs/react";
import AppLayout from "@/Layouts/AppLayout";
import Button from "@/Components/UI/Button";
import StatCard from "@/Components/UI/StatCard";
import GlassCard from "@/Components/UI/GlassCard";
import StatusBadge from "@/Components/UI/StatusBadge";
import { maskLeak } from "@/Utils/sanitize";
import type { SharedPageProps } from "@/Types/global.d";
import type { BusinessScale, BusinessDashboardSummary, WholesaleFeedItem } from "@/Types/business.d";

const TENANT: "AU BUSINESS" = "AU BUSINESS";

const SCALE_LABEL: Record<BusinessScale, string> = {
  factory: "مصنع", importer: "مستورد", distributor: "موزع", warehouse: "مخزن",
  wholesaler: "تاجر جملة", retailer: "تجزئة", home_project: "مشروع منزلي", freelancer: "مستقل",
};

function fmtEGP(minor: number): string {
  return new Intl.NumberFormat("ar-EG", { style: "currency", currency: "EGP", numberingSystem: "latn" }).format(minor / 100);
}

function Gauge({ score }: { score: number }) {
  const status = score >= 95 ? "green" : score >= 90 ? "amber" : "red";
  const color = status === "green" ? "var(--accent-emerald)" : status === "amber" ? "var(--accent-amber)" : "var(--brand-crimson)";
  const dash = (Math.max(0, Math.min(100, score)) / 100) * 251;
  return (
    <div className="flex flex-col items-center gap-2">
      <svg width={88} height={88} viewBox="0 0 44 44" aria-label={`Calibrator ${score}%`}>
        <circle cx={22} cy={22} r={18} fill="none" stroke="var(--surface-secondary)" strokeWidth={4} />
        <circle cx={22} cy={22} r={18} fill="none" stroke={color} strokeWidth={4} strokeDasharray={`${dash} 251`} strokeLinecap="round" transform="rotate(-90 22 22)" />
        <text x={22} y={26} textAnchor="middle" fontSize={11} fontWeight={700} fill="var(--text-on-pearl)">{score}%</text>
      </svg>
      <span className="text-micro" style={{ color }}>{status === "green" ? "ممتاز" : status === "amber" ? "تحذير" : "خطر"}</span>
    </div>
  );
}

const MOCK_FEED: WholesaleFeedItem[] = [
  { id: "f1", type: "bulk_request", title: "Bulk Request — Steel Coils", title_ar: "طلب جملة — لفائف صلب", company: "Delta Steel", qty: 1200, amount_minor: 98000000, currency: "EGP", status: "pending", created_at: new Date().toISOString() },
  { id: "f2", type: "barter_match", title: "Barter Match — Oil ↔ Cement", title_ar: "مطابقة مقايضة — زيت ↔ أسمنت", company: "Nile Barter", qty: 500, amount_minor: 42000000, currency: "EGP", status: "matched", created_at: new Date().toISOString() },
  { id: "f3", type: "quotation", title: "Quotation Approved — Q-8841", title_ar: "عرض سعر مُعتمد — Q-8841", company: "Pharma Bulk", qty: 2000, amount_minor: 12500000, currency: "EGP", status: "approved", created_at: new Date().toISOString() },
];

export default function Dashboard() {
  const { props } = usePage<SharedPageProps & { feed?: WholesaleFeedItem[] }>();
  const tenantApp = (props.tenant?.app_id ?? props.app_id) as string;
  const isBusiness = tenantApp === TENANT;
  const scale = (props as unknown as { profile?: { scale: BusinessScale } }).profile?.scale ?? "wholesaler";
  const summary: BusinessDashboardSummary = (props as unknown as { summary?: BusinessDashboardSummary }).summary ?? {
    wholesale_liquidity_minor: 245000000, active_escrow_count: 7, active_escrow_minor: 34200000,
    bulk_inventory_value_minor: 189000000, calibrator_score: 92, calibrator_status: "amber", currency: "EGP",
  };
  // FIX-P1-06: server feed hydration — props.feed when exists, MOCK fallback only for sandbox — no interval when real
  const serverFeed = (props as unknown as { feed?: WholesaleFeedItem[] }).feed;
  const [feed, setFeed] = useState<WholesaleFeedItem[]>(serverFeed ?? MOCK_FEED);
  const [filter, setFilter] = useState<WholesaleFeedItem["type"] | "all">("all");
  const [q, setQ] = useState("");
  const [debouncedQ, setDebouncedQ] = useState(q);
  useEffect(() => { const id=window.setTimeout(()=> setDebouncedQ(q), 300); return ()=> window.clearTimeout(id); }, [q]);
  const sanitizedQ = useMemo(() => maskLeak(debouncedQ), [debouncedQ]);

  // Live tick — FIX-P1-12 only when mock (no server feed) — debounced perf
  useEffect(() => {
    if (serverFeed && serverFeed.length>0) return;
    const t = window.setInterval(() => {
      const types: WholesaleFeedItem["type"][] = ["bulk_request", "barter_match", "quotation"];
      const nt: WholesaleFeedItem = { id: `live-${Date.now()}`, type: types[Math.floor(Math.random() * 3)], title: "Live Bulk RFQ", title_ar: "طلب جملة حي", company: "AutoFeed", qty: 100 + Math.floor(Math.random() * 900), amount_minor: (50 + Math.floor(Math.random() * 90)) * 100000, currency: "EGP", status: "pending", created_at: new Date().toISOString(), };
      setFeed((a) => [nt, ...a].slice(0, 8));
    }, 6000);
    return () => clearInterval(t);
  }, [serverFeed]);

  if (!isBusiness) {
    return <AppLayout><GlassCard level="inner" className="text-center"><p className="text-section font-bold">عزل المستأجر — يتطلب AU BUSINESS</p><p className="text-body text-[var(--text-secondary)]">app_id الحالي: {tenantApp}</p></GlassCard></AppLayout>;
  }

  const canBulk = scale !== "freelancer" && scale !== "home_project";
  // FIX-P1-12: memoize visible — avoids O(n) on every render
  const visible = useMemo(() => feed.filter(f => filter === "all" || f.type === filter).filter(f => !sanitizedQ || f.title_ar.includes(sanitizedQ) || f.company.includes(sanitizedQ)), [feed, filter, sanitizedQ]);

  const go = (path: string): void => router.visit(path, { headers: { "X-App-Id": TENANT, "X-Tenant": TENANT } as unknown as Record<string,string>, preserveScroll: true });

  return (
    <AppLayout>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-title font-bold text-white">AU BUSINESS — مركز المؤسسات</h1>
          <p className="text-micro text-[var(--text-secondary)]">app_id="{TENANT}" · المقياس: {SCALE_LABEL[scale]} · معزول عن AU MED / DEALS</p>
        </div>
        <span className="rounded-full bg-[var(--accent-emerald)] px-3 py-1 text-micro font-bold text-white">TENANT ISOLATED ✓ AU BUSINESS</span>
      </div>

      <div className="grid gap-3 md:grid-cols-4">
        <StatCard label="السيولة الجملية" value={fmtEGP(summary.wholesale_liquidity_minor)} hint="Wholesale Liquidity — minor units" accent="emerald" />
        <StatCard label="صفقات الضمان النشطة" value={`${summary.active_escrow_count} — ${fmtEGP(summary.active_escrow_minor)}`} hint="Active B2B Escrow" accent="amber" />
        <StatCard label="قيمة المخزون الجملي" value={fmtEGP(summary.bulk_inventory_value_minor)} hint="Bulk Inventory Value" accent="cyan" />
        <GlassCard level="inner" padding="md" className="flex flex-col items-center justify-center">
          <p className="text-micro text-[var(--text-secondary)]">مؤشر أعمال Calibrator</p>
          <div className="mt-2"><Gauge score={summary.calibrator_score} /></div>
          <p className="mt-1 text-micro text-[var(--text-secondary)]">Audit Score — {summary.calibrator_score}%</p>
        </GlassCard>
      </div>

      <GlassCard level="inner" className="mt-4">
        <h2 className="text-section font-semibold text-[var(--text-on-pearl)]">شريط العمليات السريعة — حدود مقياس الأعمال</h2>
        <p className="text-micro text-[var(--text-secondary)]">تتكيّف ديناميكياً حسب المقياس — المصنع/المستورد يريان كل الأزرار، المشروع المنزلي/المستقل مقيّد</p>
        <div className="mt-3 flex flex-wrap gap-2">
          <Button variant="primary" isDisabled={!canBulk} onClick={() => go("/business/offers/create")}>Create B2B Bulk Offer</Button>
          <Button variant="secondary" isDisabled={!canBulk} onClick={() => go("/business/tenders/create")}>Publish B2B Buying Tender</Button>
          <Button variant="gold" onClick={() => go("/business/catalog")}>Access Wholesale Catalog</Button>
          <Button variant="ai-action" onClick={() => go("/business/workforce")}>Hire AI Digital Employee</Button>
          {!canBulk && <span className="ms-2 text-micro text-[var(--brand-crimson)]">مقيّد لمقياس {SCALE_LABEL[scale]} — ترقية مطلوبة</span>}
        </div>
      </GlassCard>

      <div className="mt-4 grid gap-4 lg:grid-cols-[1fr_320px]">
        <GlassCard level="inner">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h3 className="text-section font-semibold text-[var(--text-on-pearl)]">Live Wholesale Feed — تيار الجملة الحي</h3>
            <div className="flex gap-1">{(["all","bulk_request","barter_match","quotation"] as const).map(t=>(
              <button key={t} onClick={()=>setFilter(t)} className={`rounded-full px-3 py-1 text-micro font-bold border ${filter===t?"bg-[var(--canvas-dark)] text-white border-transparent":"bg-white text-[var(--text-secondary)] border-[var(--border-pearl)]"}`}>{t==="all"?"الكل":t==="bulk_request"?"طلبات":t==="barter_match"?"مقايضة":"عروض"}</button>
            ))}</div>
          </div>
          <div className="mt-3">
            <input value={q} onChange={e=>setQ(e.target.value)} placeholder="ابحث — يُطهّر تلقائياً (RegexDataLeakDetector)" className="w-full rounded-[var(--radius-md)] border border-[var(--border-pearl)] bg-white px-3 py-2 text-body" />
            {q!==sanitizedQ && <p className="mt-1 text-micro text-[var(--brand-crimson)]">تم الطمس: {sanitizedQ}</p>}
          </div>
          <div className="mt-3 space-y-2 max-h-[420px] overflow-auto">
            {visible.map(f=>(
              <div key={f.id} className="flex items-center justify-between rounded-[var(--radius-md)] border border-[var(--border-pearl)] bg-white p-3">
                <div>
                  <p className="text-body font-semibold text-[var(--text-on-pearl)]">{f.title_ar} — {f.company}</p>
                  <p className="text-micro text-[var(--text-secondary)]">{f.qty} وحدة · {fmtEGP(f.amount_minor)} · {new Date(f.created_at).toLocaleTimeString("ar-EG")}</p>
                </div>
                <StatusBadge state={f.status==="approved"?"Verified":f.status==="matched"?"AI_Active":f.status==="pending"?"Pending":"Danger"} label={f.type} />
              </div>
            ))}
            {visible.length===0 && <p className="py-8 text-center text-body text-[var(--text-secondary)]">لا نتائج — جرّب فلتراً آخر</p>}
          </div>
        </GlassCard>

        <div className="space-y-3">
          <GlassCard level="inner">
            <h4 className="text-body font-semibold">تنبيه العزل</h4>
            <p className="mt-1 text-body text-[var(--text-secondary)]">الوكلاء والسيولة والضمان معزولة داخل <b>app_id="{TENANT}"</b> — لا مشاركة مع AU MED/DEALS.</p>
            <p className="mt-2 text-micro text-[var(--accent-emerald)]">Header: X-App-Id: AU BUSINESS على كل طلب</p>
          </GlassCard>
          <GlassCard level="inner" accent="cyan">
            <h4 className="text-body font-semibold">الخطوة التالية</h4>
            <p className="text-body text-[var(--text-secondary)]">ابدأ بكتالوج الجملة أو استأجر موظف AI للمشتريات.</p>
            <div className="mt-3 flex gap-2"><Button size="sm" onClick={()=>go("/business/catalog")}>الكتالوج</Button><Button size="sm" variant="secondary" onClick={()=>go("/business/workforce")}>AI Workforce</Button></div>
          </GlassCard>
        </div>
      </div>
    </AppLayout>
  );
}
