// AU BUSINESS — Digital Workforce Marketplace — AI Employee Catalog + Deployment Mode
import { useMemo, useState } from "react";
import { router, usePage } from "@inertiajs/react";
import AppLayout from "@/Layouts/AppLayout";
import Button from "@/Components/UI/Button";
import GlassCard from "@/Components/UI/GlassCard";
import Modal from "@/Components/UI/Modal";
import { maskLeak } from "@/Utils/sanitize";
import type { SharedPageProps } from "@/Types/global.d";
import type { AIEmployeePersona, DeploymentMode } from "@/Types/business.d";

const TENANT: "AU BUSINESS" = "AU BUSINESS";

function fmt(minor: number): string {
  return new Intl.NumberFormat("ar-EG", { style:"currency", currency:"EGP", numberingSystem:"latn" }).format(minor/100);
}

const MOCK: AIEmployeePersona[] = [
  { id:"ai-proc", slug:"procurement-specialist", title:"B2B Procurement Specialist", title_ar:"أخصائي مشتريات B2B", role:"Procurement", avatar:"🧑‍💼", capabilities:["RFQ Automation","Supplier Vetting","Negotiation"], rating:4.8, deployments:312, price_monthly_minor:490000, price_buyout_minor:4900000, driver:"deterministic", tenant_isolated:true, app_id:TENANT, featured:true },
  { id:"ai-sales", slug:"bulk-sales-manager", title:"Bulk Sales Manager", title_ar:"مدير مبيعات جملة", role:"Sales", avatar:"📈", capabilities:["Tiered Quotes","Barter Matching","Pipeline"], rating:4.7, deployments:287, price_monthly_minor:550000, price_buyout_minor:5500000, driver:"cloud", tenant_isolated:true, app_id:TENANT },
  { id:"ai-audit", slug:"inventory-auditor", title:"Inventory Auditor", title_ar:"مدقق مخزون", role:"Audit", avatar:"🔍", capabilities:["Stock Reconcile","Expiry Alerts","Schema Validation"], rating:4.9, deployments:198, price_monthly_minor:390000, price_buyout_minor:3900000, driver:"local_gpu", tenant_isolated:true, app_id:TENANT },
  { id:"ai-finance", slug:"b2b-finance", title:"B2B Finance Controller", title_ar:"مراقب مالية B2B", role:"Finance", avatar:"💰", capabilities:["Ledger","Escrow","Tax Reserve"], rating:4.6, deployments:143, price_monthly_minor:620000, price_buyout_minor:6200000, driver:"deterministic", tenant_isolated:true, app_id:TENANT },
];

export default function Marketplace() {
  const { props } = usePage<SharedPageProps>();
  const isBiz = (props.tenant?.app_id ?? props.app_id) === TENANT;
  const [selected, setSelected] = useState<AIEmployeePersona | null>(null);
  const [mode, setMode] = useState<DeploymentMode>("managed_salary");
  const [note, setNote] = useState("");
  const sanitized = useMemo(()=> maskLeak(note), [note]);
  const [q, setQ] = useState("");
  const list = useMemo(()=> {
    const qq = maskLeak(q).toLowerCase();
    return MOCK.filter(p=> !qq || p.title_ar.includes(qq) || p.title.toLowerCase().includes(qq) || p.role.toLowerCase().includes(qq));
  }, [q]);

  if (!isBiz) return <AppLayout><GlassCard level="inner" className="text-center"><p className="text-section font-bold">يتطلب AU BUSINESS</p><p className="text-body text-[var(--text-secondary)]">app_id الحالي: {String(props.tenant?.app_id ?? props.app_id)}</p></GlassCard></AppLayout>;

  const deploy = (): void => {
    if (!selected) return;
    router.post(
      "/business/workforce/deploy",
      { app_id: TENANT, persona_id: selected.id, mode, note: sanitized } as unknown as never,
      { headers: { "X-App-Id": TENANT } as unknown as Record<string, string>, preserveScroll: true, onSuccess: () => setSelected(null) },
    );
  };

  return (
    <AppLayout>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-title font-bold text-white">سوق القوى العاملة الرقمية — AU BUSINESS</h1>
          <p className="text-micro text-[var(--text-secondary)]">كتالوج موظفين AI — معزول بالمستأجر app_id="{TENANT}" — كل وكيل يعمل داخل حدود المستأجر فقط</p>
        </div>
        <span className="rounded-full bg-[var(--accent-cyan)] px-3 py-1 text-micro font-bold text-white">TENANT ISOLATED ✓</span>
      </div>

      <GlassCard level="inner" className="mt-4 border-l-2 border-l-[var(--accent-emerald)]">
        <p className="text-body font-bold text-[var(--accent-emerald)]">🛡️ إشعار ضمان العزل المستأجري</p>
        <p className="mt-1 text-body text-[var(--text-secondary)]">الوكلاء المعيَّنون يعملون حصراً داخل <b>app_id = {TENANT}</b> — لا وصول متبادل بين AU BUSINESS و AU MED/DEALS/SERV/INVEST. Payloads تُرسل مع <code>X-App-Id: AU BUSINESS</code>.</p>
        <p className="mt-1 text-micro text-[var(--text-secondary)]">العمليات: deterministic 90% PHP 8.4 + 10% LLM — adapter محلي 127.0.0.1:8000 / Cloud</p>
      </GlassCard>

      <div className="mt-4 flex gap-2">
        <input value={q} onChange={e=>setQ(e.target.value)} placeholder="ابحث موظف AI — مثال: مشتريات / مبيعات" className="flex-1 rounded-[var(--radius-md)] border border-[var(--border-pearl)] bg-white px-3 py-2 text-body" />
        <span className="hidden sm:inline-flex items-center rounded-full bg-white border border-[var(--border-pearl)] px-3 text-micro">{list.length} نتيجة</span>
      </div>
      {q!==maskLeak(q) && <p className="mt-1 text-micro text-[var(--brand-crimson)]">تم الطمس: {maskLeak(q)}</p>}

      <div className="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {list.map(p=>(
          <GlassCard key={p.id} level="inner" className={`relative ${p.featured?"ring-2 ring-[var(--brand-gold)]":""}`}>
            {p.featured && <span className="absolute -top-2 end-3 rounded-full bg-[var(--brand-gold)] px-2 py-1 text-micro font-bold text-black">مميز</span>}
            <div className="flex gap-3">
              <span className="flex h-12 w-12 items-center justify-center rounded-full bg-white border border-[var(--border-pearl)] text-title">{p.avatar}</span>
              <div>
                <p className="text-body font-bold text-[var(--text-on-pearl)]">{p.title_ar}</p>
                <p className="text-micro text-[var(--text-secondary)]">{p.title} · {p.role} · {p.driver}</p>
                <p className="text-micro text-[var(--accent-amber)]">★ {p.rating} · {p.deployments} نشر</p>
              </div>
            </div>
            <div className="mt-3 flex flex-wrap gap-1">
              {p.capabilities.map(c=> <span key={c} className="rounded-full bg-[var(--surface-secondary)] px-2 py-1 text-micro border border-[var(--border-pearl)]">{c}</span>)}
            </div>
            <div className="mt-3 grid grid-cols-2 gap-2 text-center">
              <div className="rounded-[var(--radius-md)] bg-white border border-[var(--border-pearl)] p-2"><p className="text-micro text-[var(--text-secondary)]">شهري</p><p className="text-body font-bold tabular-nums">{fmt(p.price_monthly_minor)}</p></div>
              <div className="rounded-[var(--radius-md)] bg-white border border-[var(--border-pearl)] p-2"><p className="text-micro text-[var(--text-secondary)]">شراء كامل</p><p className="text-body font-bold tabular-nums">{fmt(p.price_buyout_minor)}</p></div>
            </div>
            <div className="mt-3 flex gap-2">
              <Button className="flex-1" variant="primary" onClick={()=>{setSelected(p); setMode("managed_salary");}}>نشر — Deploy</Button>
              <Button variant="secondary" onClick={()=>{setSelected(p); setMode("outright_buyout");}}>شراء</Button>
            </div>
            <p className="mt-2 text-micro text-[var(--accent-emerald)]">✓ معزول: app_id={p.app_id}</p>
          </GlassCard>
        ))}
      </div>

      <Modal open={!!selected} onOpenChange={(o) => { if (!o) setSelected(null); }} title={selected ? `نشر — ${selected.title_ar}` : "نشر موظف AI"}>
        {selected && (
          <div className="space-y-4">
            <div className="rounded-[var(--radius-md)] border border-[var(--border-pearl)] bg-white p-3 flex gap-3">
              <span className="text-title">{selected.avatar}</span>
              <div><p className="text-body font-bold">{selected.title_ar} — {selected.title}</p><p className="text-micro text-[var(--text-secondary)]">{selected.capabilities.join(" · ")}</p></div>
            </div>
            <div className="grid gap-3 md:grid-cols-2">
              <button onClick={()=>setMode("managed_salary")} className={`rounded-[var(--radius-md)] border p-4 text-start ${mode==="managed_salary"?"border-[var(--accent-cyan)] bg-[rgba(6,182,212,0.08)]":"border-[var(--border-pearl)] bg-white"}`}>
                <p className="text-body font-bold">Managed Monthly Salary</p>
                <p className="text-micro text-[var(--text-secondary)]">اشتراك شهري مُدار — تحديثات + مراقبة</p>
                <p className="mt-2 text-section font-bold tabular-nums">{fmt(selected.price_monthly_minor)} / شهر</p>
              </button>
              <button onClick={()=>setMode("outright_buyout")} className={`rounded-[var(--radius-md)] border p-4 text-start ${mode==="outright_buyout"?"border-[var(--brand-gold)] bg-[rgba(197,160,89,0.12)]":"border-[var(--border-pearl)] bg-white"}`}>
                <p className="text-body font-bold">Outright Buyout</p>
                <p className="text-micro text-[var(--text-secondary)]">شراء دائم — ترخيص أحادي</p>
                <p className="mt-2 text-section font-bold tabular-nums">{fmt(selected.price_buyout_minor)}</p>
              </button>
            </div>
            <div>
              <label className="text-body font-medium">ملاحظة للنشر (اختياري — تُطهّر تلقائياً)</label>
              <textarea value={note} onChange={e=>setNote(e.target.value)} rows={3} placeholder="مثال: نحتاج RFQ للصلب — لا تضف هاتف/بريد" className="mt-1 w-full rounded-[var(--radius-md)] border border-[var(--border-pearl)] bg-white px-3 py-2 text-body" />
              {note!==sanitized && <p className="mt-1 text-micro text-[var(--brand-crimson)]">تم الطمس: {sanitized}</p>}
              <p className="mt-1 text-micro text-[var(--text-secondary)]">Payload يُرسل مع app_id="{TENANT}" + note مطموسة</p>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-micro text-[var(--accent-emerald)] font-bold">Tenant Isolation Safeguard — {TENANT} ✓</span>
              <div className="flex gap-2"><Button variant="secondary" onClick={()=>setSelected(null)}>إلغاء</Button><Button onClick={deploy}>{mode==="managed_salary"?"تأكيد اشتراك شهري":"تأكيد شراء كامل"}</Button></div>
            </div>
          </div>
        )}
      </Modal>
    </AppLayout>
  );
}
