// AU BUSINESS — Commercial Calibrator Suite — Tri-Stage Gate (Pre/In/Post)
import { useMemo, useState } from "react";
import { usePage } from "@inertiajs/react";
import AppLayout from "@/Layouts/AppLayout";
import GlassCard from "@/Components/UI/GlassCard";
import StatusBadge from "@/Components/UI/StatusBadge";
import type { SharedPageProps } from "@/Types/global.d";
import type { CalibratorGate, GateEvaluation } from "@/Types/business.d";

const TENANT: "AU BUSINESS" = "AU BUSINESS";

function fmt(minor: number, cur="EGP"): string {
  return new Intl.NumberFormat("ar-EG", { style:"currency", currency:cur, numberingSystem:"latn" }).format(minor/100);
}

const MOCK_GATES: GateEvaluation[] = [
  { gate:"pre_op", score:88, status:"amber", evaluated_at:new Date().toISOString(), recommendation:"Tighten margin ≥ 18% قبل الالتزام", recommendation_ar:"ارفع الهامش إلى ≥ 18% قبل الالتزام",
    metrics:[
      { key:"margin", label:"Profit Margin", label_ar:"هامش الربح", value:15.2, threshold:18, status:"warn", unit:"%" },
      { key:"stock", label:"Stock Capacity", label_ar:"قدرة المخزون", value:78, threshold:70, status:"pass", unit:"%" },
      { key:"solvency", label:"Solvency Score", label_ar:"درجة الملاءة", value:62, threshold:65, status:"warn", unit:"%" },
    ]},
  { gate:"in_op", score:94, status:"green", evaluated_at:new Date().toISOString(), recommendation:"Velocity on track — monitor leakage", recommendation_ar:"السرعة على المسار — راقب التسريب",
    metrics:[
      { key:"sla", label:"SLA Compliance", label_ar:"الالتزام بالـ SLA", value:97, threshold:95, status:"pass", unit:"%" },
      { key:"price_integrity", label:"Price Integrity", label_ar:"سلامة السعر", value:99, threshold:98, status:"pass", unit:"%" },
      { key:"leakage", label:"Cost Leakage", label_ar:"تسريب التكلفة", value:1.1, threshold:2, status:"pass", unit:"%" },
    ]},
  { gate:"post_op", score:81, status:"amber", evaluated_at:new Date().toISOString(), recommendation:"Reconcile 2 entries + collect feedback", recommendation_ar:"طابق قيدين مزدوجين + اجمع التغذية الراجعة",
    metrics:[
      { key:"roi", label:"Actual ROI", label_ar:"العائد الفعلي", value:11.4, threshold:12, status:"warn", unit:"%" },
      { key:"reconciled", label:"Ledgers Reconciled", label_ar:"دفاتر مطابقة", value:92, threshold:100, status:"warn", unit:"%" },
      { key:"sentiment", label:"Feedback Sentiment", label_ar:"رضا العميل", value:4.2, threshold:4.5, status:"warn", unit:"/5" },
    ]},
];

function Gauge({ score, status }: { score:number; status:GateEvaluation["status"] }) {
  const color = status==="green" ? "var(--accent-emerald)" : status==="amber" ? "var(--accent-amber)" : "var(--brand-crimson)";
  const dash = (score/100)*251;
  return (
    <svg width={72} height={72} viewBox="0 0 44 44" aria-label={`${score}%`}>
      <circle cx={22} cy={22} r={18} fill="none" stroke="var(--surface-secondary)" strokeWidth={4} />
      <circle cx={22} cy={22} r={18} fill="none" stroke={color} strokeWidth={4} strokeDasharray={`${dash} 251`} strokeLinecap="round" transform="rotate(-90 22 22)" />
      <text x={22} y={27} textAnchor="middle" fontSize={10} fontWeight={700} fill="var(--text-on-pearl)">{score}%</text>
    </svg>
  );
}

const GATE_TITLES: Record<CalibratorGate, { ar:string; en:string; when:string }> = {
  pre_op:{ ar:"البوابة القَبْلية — قبل الالتزام", en:"Pre-Operation Gate", when:"BEFORE wholesale commit" },
  in_op:{ ar:"البوابة التشغيلية — أثناء التنفيذ", en:"In-Operation Gate", when:"DURING execution" },
  post_op:{ ar:"البوابة الختامية — بعد الإنجاز", en:"Post-Operation Gate", when:"AFTER fulfillment" },
};

export default function AuditView() {
  const { props } = usePage<SharedPageProps>();
  const isBiz = (props.tenant?.app_id ?? props.app_id) === TENANT;
  const [active, setActive] = useState<CalibratorGate>("pre_op");
  const gates = (props as unknown as { gates?: GateEvaluation[] }).gates ?? MOCK_GATES;
  const cur = useMemo(()=> gates.find(g=>g.gate===active) ?? gates[0], [gates, active]);

  if (!isBiz) return <AppLayout><GlassCard level="inner" className="text-center"><p className="text-section font-bold">يتطلب AU BUSINESS</p></GlassCard></AppLayout>;

  return (
    <AppLayout>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-title font-bold text-white">جناح المعايِرة التجاري — AU BUSINESS Calibrator</h1>
          <p className="text-micro text-[var(--text-secondary)]">Tri-Stage Gate — مدقق قبل/أثناء/بعد — app_id="{TENANT}"</p>
        </div>
        <StatusBadge state={cur.status==="green"?"Verified":cur.status==="amber"?"Pending":"Danger"} label={`${cur.score}% ${cur.status}`} />
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        {(["pre_op","in_op","post_op"] as CalibratorGate[]).map(g=>(
          <button key={g} onClick={()=>setActive(g)} className={`rounded-full px-4 py-2 text-body font-bold border transition ${active===g?"bg-[var(--canvas-dark)] text-white border-transparent shadow":"bg-white text-[var(--text-on-pearl)] border-[var(--border-pearl)]"}`}>
            {GATE_TITLES[g].ar} <span className="ms-1 text-micro opacity-70">{gates.find(x=>x.gate===g)?.score}%</span>
          </button>
        ))}
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-[340px_1fr]">
        <GlassCard level="inner" className="text-center">
          <p className="text-micro text-[var(--text-secondary)]">{GATE_TITLES[cur.gate].en} · {GATE_TITLES[cur.gate].when}</p>
          <h3 className="mt-1 text-section font-bold text-[var(--text-on-pearl)]">{GATE_TITLES[cur.gate].ar}</h3>
          <div className="mt-3 flex justify-center"><Gauge score={cur.score} status={cur.status} /></div>
          <p className="mt-2 text-body text-[var(--text-secondary)]">{cur.recommendation_ar}</p>
          <p className="mt-1 text-micro text-[var(--text-secondary)]">توصية: {cur.recommendation}</p>
          <p className="mt-3 text-micro text-[var(--text-secondary)]">تقييم: {new Date(cur.evaluated_at).toLocaleString("ar-EG")}</p>
        </GlassCard>

        <GlassCard level="inner">
          <h3 className="text-section font-semibold">مؤشرات {GATE_TITLES[cur.gate].ar}</h3>
          <div className="mt-3 space-y-3">
            {cur.metrics.map(m=> (
              <div key={m.key} className="rounded-[var(--radius-md)] border border-[var(--border-pearl)] bg-white p-3">
                <div className="flex items-center justify-between">
                  <span className="text-body font-semibold">{m.label_ar}</span>
                  <span className={`rounded-full px-2 py-1 text-micro font-bold ${m.status==="pass"?"bg-[var(--accent-emerald)] text-white":m.status==="warn"?"bg-[var(--accent-amber)] text-black":"bg-[var(--brand-crimson)] text-white"}`}>{m.status}</span>
                </div>
                <div className="mt-2 flex items-baseline gap-2">
                  <span className="text-title font-bold tabular-nums">{m.value}{m.unit ?? ""}</span>
                  <span className="text-micro text-[var(--text-secondary)]">العتبة {m.threshold}{m.unit ?? ""}</span>
                  <span className="ms-auto text-micro text-[var(--text-secondary)]">{m.label}</span>
                </div>
                <div className="mt-2 h-2 rounded-full bg-[var(--surface-secondary)]">
                  <div className="h-2 rounded-full" style={{ width:`${Math.min(100, (m.value/Math.max(m.value,m.threshold))*100)}%`, background: m.status==="pass"?"var(--accent-emerald)":m.status==="warn"?"var(--accent-amber)":"var(--brand-crimson)"}} />
                </div>
                {m.hint && <p className="mt-1 text-micro text-[var(--text-secondary)]">{m.hint}</p>}
              </div>
            ))}
          </div>
        </GlassCard>
      </div>

      {cur.gate==="post_op" && (
        <div className="mt-4 grid gap-4 lg:grid-cols-2">
          <GlassCard level="inner">
            <h3 className="text-section font-semibold">تسوية القيود المزدوجة — Double-Entry Reconciliation</h3>
            <div className="mt-3 space-y-2 text-body">
              {[
                { id:"j-884", debit:12500000, credit:12500000, narration:"استلام بضاعة — Steel Coil 1.2t", at:new Date().toISOString() },
                { id:"j-885", debit:890000, credit:890000, narration:"عمولة منصة 3-Tier — Tier 2", at:new Date().toISOString() },
              ].map(e=>(
                <div key={e.id} className="flex justify-between rounded-[var(--radius-md)] border border-[var(--border-pearl)] bg-white px-3 py-2">
                  <span className="font-mono text-micro">{e.id}</span><span className="text-body">{e.narration}</span><span className="tabular-nums">{fmt(e.debit)}</span>
                </div>
              ))}
            </div>
            <p className="mt-2 text-micro text-[var(--text-secondary)]">الفرق = صفر — سجل ROI الفعلي 11.4% بعد المصاريف</p>
          </GlassCard>
          <GlassCard level="inner">
            <h3 className="text-section font-semibold">سجل العائد ومشاعر التغذية الراجعة</h3>
            <div className="mt-3 grid grid-cols-2 gap-3">
              <div className="rounded-[var(--radius-md)] bg-white border border-[var(--border-pearl)] p-3"><p className="text-micro text-[var(--text-secondary)]">Actual ROI</p><p className="text-section font-bold">11.4%</p><p className="text-micro text-[var(--accent-amber)]">أقل من العتبة 12%</p></div>
              <div className="rounded-[var(--radius-md)] bg-white border border-[var(--border-pearl)] p-3"><p className="text-micro text-[var(--text-secondary)]">Sentiment</p><p className="text-section font-bold">4.2 / 5</p><p className="text-micro text-[var(--text-secondary)]">رضا — 23 مراجعة</p></div>
            </div>
          </GlassCard>
        </div>
      )}

      {cur.gate==="in_op" && (
        <GlassCard level="inner" className="mt-4">
          <h3 className="text-section font-semibold">متتبع السرعة الحي — Velocity Tracker</h3>
          <div className="mt-3 flex flex-wrap gap-2 text-micro">
            <span className="rounded-full bg-[var(--accent-emerald)] px-3 py-1 text-white font-bold">SLA 97% ✓</span>
            <span className="rounded-full bg-white border border-[var(--border-pearl)] px-3 py-1">Price Integrity 99%</span>
            <span className="rounded-full bg-white border border-[var(--border-pearl)] px-3 py-1">Leakage 1.1%</span>
          </div>
          <p className="mt-2 text-body text-[var(--text-secondary)]">يُراقب الالتزام بالـ SLA وسلامة السعر وتسريب التكلفة أثناء تنفيذ الصفقة.</p>
        </GlassCard>
      )}
    </AppLayout>
  );
}
