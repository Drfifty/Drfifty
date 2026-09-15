// AU BUSINESS — Catalog & Dynamic Inventory Manager — Tiered Pricing + Schema Engine + Bulk Import
import { useMemo, useState } from "react";
import { router, usePage } from "@inertiajs/react";
import AppLayout from "@/Layouts/AppLayout";
import Button from "@/Components/UI/Button";
import GlassCard from "@/Components/UI/GlassCard";
import Modal from "@/Components/UI/Modal";
import StatusBadge from "@/Components/UI/StatusBadge";
import { maskLeak } from "@/Utils/sanitize";
import type { SharedPageProps } from "@/Types/global.d";
import type { InventoryItem, JsonSchemaDefinition, TieredPrice, CsvImportRow } from "@/Types/business.d";

const TENANT: "AU BUSINESS" = "AU BUSINESS";

function fmt(minor: number): string {
  return new Intl.NumberFormat("ar-EG", { style: "currency", currency: "EGP", numberingSystem: "latn" }).format(minor / 100);
}

const MOCK_SCHEMAS: JsonSchemaDefinition[] = [
  { id:"chem", title:"Chem Spec", title_ar:"مواصفات كيميائية", version:2, fields:[
    { key:"origin_cert", label:"Origin Certificate", label_ar:"شهادة المنشأ", type:"text", required:true, help:"ISO country + cert no." },
    { key:"batch_expiry", label:"Batch Expiry", label_ar:"انتهاء الدفعة", type:"date", required:true },
    { key:"compliance", label:"Compliance", label_ar:"الامتثال", type:"select", options:["ISO 9001","GMP","HALAL"], required:true },
    { key:"hazard", label:"Hazard Class", label_ar:"فئة الخطورة", type:"select", options:["1","2","3","غير مصنف"] },
  ]},
  { id:"steel", title:"Steel Spec", title_ar:"مواصفات صلب", version:1, fields:[
    { key:"grade", label:"Grade", label_ar:"الدرجة", type:"select", options:["A36","S275","S355"], required:true },
    { key:"thickness_mm", label:"Thickness mm", label_ar:"السُمك مم", type:"number", validation:{ min:0.5, max:100 } },
    { key:"origin_cert", label:"Origin Certificate", label_ar:"شهادة المنشأ", type:"text", required:true },
  ]},
];

const MOCK_ITEMS: InventoryItem[] = [
  { id:1, sku:"STL-A36-12", title:"Steel Coil A36", title_ar:"لفائف صلب A36", app_id:TENANT, category:"معادن", stock_qty: 5400, reserved_qty: 400, tiers:[{tier:1,min_qty:100,max_qty:500,price_minor:125000,currency:"EGP",discount_pct:0,label:"100–500"},{tier:2,min_qty:501,max_qty:2000,price_minor:118000,currency:"EGP",discount_pct:5.6,label:"501–2000"},{tier:3,min_qty:2001,max_qty:null,price_minor:112000,currency:"EGP",discount_pct:10.4,label:"2000+"}], spec_schema_id:"steel", spec_values:{ grade:"A36", thickness_mm:12, origin_cert:"TR-8841" }, status:"active", updated_at:new Date().toISOString() },
  { id:2, sku:"CHEM-ISO-9001", title:"Industrial Solvent 200L", title_ar:"مذيب صناعي 200ل", app_id:TENANT, category:"كيميائيات", stock_qty: 900, reserved_qty: 80, tiers:[{tier:1,min_qty:50,max_qty:200,price_minor:89000,currency:"EGP",discount_pct:0,label:"50–200"},{tier:2,min_qty:201,max_qty:1000,price_minor:82000,currency:"EGP",discount_pct:7.9,label:"201–1000"}], spec_schema_id:"chem", spec_values:{ origin_cert:"EG-5521", batch_expiry:"2027-06-01", compliance:"ISO 9001" }, status:"active", updated_at:new Date().toISOString() },
  { id:3, sku:"CEM-42-5", title:"Cement OPC 42.5", title_ar:"أسمنت 42.5", app_id:TENANT, category:"مواد بناء", stock_qty: 12000, reserved_qty: 1200, tiers:[{tier:1,min_qty:500,max_qty:2000,price_minor:62000,currency:"EGP",discount_pct:0,label:"500–2000"}], spec_schema_id:"chem", spec_values:{}, status:"draft", updated_at:new Date().toISOString() },
];

function SchemaRenderer({ schema, values, onChange }: { schema: JsonSchemaDefinition; values: Record<string, unknown>; onChange: (k: string, v: unknown) => void }) {
  return (
    <div className="grid gap-3 md:grid-cols-2">
      {schema.fields.map(f => (
        <div key={f.key} className="space-y-1">
          <label className="text-body font-medium text-[var(--text-on-pearl)]">{f.label_ar} {f.required && <span className="text-[var(--brand-crimson)]">*</span>}</label>
          {f.type === "select" ? (
            <select value={String(values[f.key] ?? "")} onChange={e=>onChange(f.key, e.target.value)} className="w-full rounded-[var(--radius-md)] border border-[var(--border-pearl)] bg-white px-3 py-2 text-body">
              <option value="">اختر</option>{f.options?.map(o=><option key={o} value={o}>{o}</option>)}
            </select>
          ) : f.type === "number" ? (
            <input type="number" value={String(values[f.key] ?? "")} onChange={e=>onChange(f.key, Number(e.target.value))} placeholder={f.help} className="w-full rounded-[var(--radius-md)] border border-[var(--border-pearl)] bg-white px-3 py-2 text-body" />
          ) : f.type === "date" ? (
            <input type="date" value={String(values[f.key] ?? "")} onChange={e=>onChange(f.key, e.target.value)} className="w-full rounded-[var(--radius-md)] border border-[var(--border-pearl)] bg-white px-3 py-2 text-body" />
          ) : (
            <input value={String(values[f.key] ?? "")} onChange={e=>onChange(f.key, maskLeak(e.target.value))} placeholder={f.placeholder ?? f.help} className="w-full rounded-[var(--radius-md)] border border-[var(--border-pearl)] bg-white px-3 py-2 text-body" />
          )}
          {f.help && <p className="text-micro text-[var(--text-secondary)]">{f.help}</p>}
        </div>
      ))}
    </div>
  );
}

function TierTable({ tiers }: { tiers: TieredPrice[] }) {
  return (
    <div className="overflow-hidden rounded-[var(--radius-md)] border border-[var(--border-pearl)] bg-white">
      <table className="w-full text-start text-body">
        <thead className="bg-[var(--surface-secondary)] text-[var(--text-secondary)]"><tr><th className="ps-4 py-2 text-micro">الشريحة</th><th className="text-micro">الكمية</th><th className="text-end pe-4 text-micro">السعر / وحدة</th><th className="text-center text-micro">خصم</th></tr></thead>
        <tbody className="divide-y divide-[var(--border-pearl)]">
          {tiers.map(t=>(
            <tr key={t.tier}><td className="ps-4 py-2 font-medium">{t.label}</td><td>{t.min_qty} – {t.max_qty ?? "∞"}</td><td className="pe-4 text-end tabular-nums">{fmt(t.price_minor)}</td><td className="text-center"><span className={`rounded-full px-2 py-1 text-micro font-bold ${t.discount_pct>0?"bg-[var(--accent-emerald)] text-white":"bg-[var(--surface-secondary)] text-[var(--text-secondary)]"}`}>{t.discount_pct}%</span></td></tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default function InventoryIndex() {
  const { props } = usePage<SharedPageProps>();
  const isBiz = (props.tenant?.app_id ?? props.app_id) === TENANT;
  const [items, setItems] = useState<InventoryItem[]>(MOCK_ITEMS);
  const [selected, setSelected] = useState<number>(1);
  const cur = useMemo(()=> items.find(i=>i.id===selected) ?? items[0], [items, selected]);
  const schema = useMemo(()=> MOCK_SCHEMAS.find(s=>s.id===cur.spec_schema_id) ?? MOCK_SCHEMAS[0], [cur]);
  const [spec, setSpec] = useState<Record<string, unknown>>(cur.spec_values);
  const [drawer, setDrawer] = useState(false);
  const [importRows, setImportRows] = useState<CsvImportRow[] | null>(null);
  const [filter, setFilter] = useState("");

  if (!isBiz) return <AppLayout><GlassCard level="inner" className="text-center"><p className="text-section font-bold">يتطلب AU BUSINESS</p></GlassCard></AppLayout>;

  const filtered = items.filter(i=> !filter || i.title_ar.includes(filter) || i.sku.includes(filter));

  const handleCsv = (file: File | null): void => {
    if (!file) return;
    // mock parse + validation overlay — schema-aware
    const rows: CsvImportRow[] = [
      { row:1, data:{ sku:"STL-NEW", qty:300, price:118000 }, errors:[] },
      { row:2, data:{ sku:"", qty:-5, price:"abc" }, errors:["SKU مطلوب","الكمية < 0","السعر ليس رقمي"] },
      { row:3, data:{ sku:"CHEM-BAD", compliance:"XYZ" }, errors:["الامتثال يجب أن يكون ISO 9001/GMP/HALAL"] },
    ];
    setImportRows(rows);
  };

  const saveSpec = (): void => {
    setItems((a) => a.map((it) => (it.id === cur.id ? { ...it, spec_values: spec } : it)));
    router.patch(
      `/business/inventory/${cur.id}`,
      { app_id: TENANT, spec_values: spec } as unknown as never,
      { preserveScroll: true, headers: { "X-App-Id": TENANT } as unknown as Record<string, string> },
    );
  };

  return (
    <AppLayout>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-title font-bold text-white">الكتالوج والمخزون — AU BUSINESS</h1>
        <div className="flex gap-2">
          <Button variant="secondary" onClick={()=>setDrawer(true)}>استيراد/تصدير دفعي CSV</Button>
          <Button variant="gold" onClick={()=>router.visit("/business/offers/create", { headers:{ "X-App-Id":TENANT } as unknown as Record<string,string> })}>إنشاء عرض جملة</Button>
        </div>
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-[360px_1fr]">
        <GlassCard level="inner" padding="none" className="overflow-hidden">
          <div className="p-4 border-b border-[var(--border-pearl)]">
            <input value={filter} onChange={e=>setFilter(maskLeak(e.target.value))} placeholder="ابحث SKU / عنوان — يُطهّر" className="w-full rounded-[var(--radius-md)] border border-[var(--border-pearl)] bg-white px-3 py-2 text-body" />
            <p className="mt-1 text-micro text-[var(--text-secondary)]">{filtered.length} صنف · {TENANT}</p>
          </div>
          <div className="max-h-[520px] overflow-auto divide-y divide-[var(--border-pearl)]">
            {filtered.map(it=>(
              <button key={it.id} onClick={()=>{setSelected(it.id); setSpec(it.spec_values);}} className={`w-full text-start p-4 hover:bg-[var(--surface-pearl)] ${it.id===selected?"bg-[var(--surface-pearl-strong)] border-s-2 border-s-[var(--accent-cyan)]":""}`}>
                <p className="text-body font-semibold">{it.title_ar} <span className="text-micro text-[var(--text-secondary)]">· {it.sku}</span></p>
                <p className="text-micro text-[var(--text-secondary)]">{it.category} · مخزون {it.stock_qty} · محجوز {it.reserved_qty}</p>
                <div className="mt-2 flex gap-1"><StatusBadge state={it.status==="active"?"Verified":it.status==="draft"?"Pending":"Anonymous"} label={it.status} /></div>
              </button>
            ))}
          </div>
        </GlassCard>

        <div className="space-y-4">
          <GlassCard level="inner">
            <h3 className="text-section font-semibold text-[var(--text-on-pearl)]">{cur.title_ar} — {cur.sku}</h3>
            <p className="text-body text-[var(--text-secondary)]">{cur.category} · تحديث {new Date(cur.updated_at).toLocaleDateString("ar-EG")}</p>
            <div className="mt-4"><p className="mb-2 text-micro font-bold text-[var(--text-secondary)]">هيكل التسعير المتدرج — خصومات الحجم</p><TierTable tiers={cur.tiers} /></div>
            <p className="mt-2 text-micro text-[var(--text-secondary)]">الأسعار بالوحدات الصغرى — قروش — تُحسب عبر <code>minor/100</code> بـ Intl EGP latn</p>
          </GlassCard>

          <GlassCard level="inner">
            <div className="flex items-center justify-between">
              <h3 className="text-section font-semibold">تبويب المواصفات — Dynamic Schema Engine</h3>
              <span className="rounded-full bg-[var(--accent-cyan)] px-2 py-1 text-micro text-white">Schema: {schema.id} v{schema.version}</span>
            </div>
            <p className="mt-1 text-micro text-[var(--text-secondary)]">مرتّب من الخادم — لا حقول مُصلّبة — يدعم شهادات المنشأ/انتهاء الدفعة/الامتثال</p>
            <div className="mt-4"><SchemaRenderer schema={schema} values={spec} onChange={(k,v)=>setSpec(s=>({...s,[k]:v}))} /></div>
            <div className="mt-4 flex gap-2">
              <Button onClick={saveSpec}>حفظ المواصفات</Button>
              <Button variant="secondary" onClick={()=>setSpec(cur.spec_values)}>إلغاء</Button>
              <span className="ms-auto text-micro text-[var(--text-secondary)] self-center">Payload يحمل <code>app_id=AU BUSINESS</code></span>
            </div>
          </GlassCard>
        </div>
      </div>

      <Modal open={drawer} onOpenChange={(o) => { setDrawer(o); if (!o) setImportRows(null); }} title="استيراد/تصدير دفعي — CSV/Excel">
        <p className="text-body text-[var(--text-secondary)]">ارفع ملف CSV — سيُطبَّق تعيين الحقول ويُعرض overlay أخطاء المخطط.</p>
        <div className="mt-3 rounded-[var(--radius-md)] border-2 border-dashed border-[var(--border-pearl)] bg-white p-6 text-center">
          <input type="file" accept=".csv,.xlsx" onChange={e=>handleCsv(e.target.files?.[0] ?? null)} className="text-body" />
          <p className="mt-2 text-micro text-[var(--text-secondary)]">يدعم تعيين الأعمدة + تحقق من الأخطاء قبل الحفظ</p>
        </div>
        {importRows && (
          <div className="mt-4 overflow-hidden rounded-[var(--radius-md)] border border-[var(--border-pearl)] bg-white">
            <table className="w-full text-start text-body">
              <thead className="bg-[var(--surface-secondary)] text-[var(--text-secondary)]"><tr><th className="ps-4 py-2 text-micro">صف</th><th className="text-micro">البيانات</th><th className="text-micro">الأخطاء</th></tr></thead>
              <tbody className="divide-y divide-[var(--border-pearl)]">
                {importRows.map(r=>(
                  <tr key={r.row} className={r.errors.length?"bg-[rgba(239,68,68,0.06)]":""}><td className="ps-4 py-2">{r.row}</td><td className="font-mono text-body">{JSON.stringify(r.data)}</td><td className={r.errors.length?"text-[var(--brand-crimson)] text-body":"text-[var(--accent-emerald)]"}>{r.errors.length? r.errors.join(" · "): "✓ سليم"}</td></tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        <div className="mt-4 flex justify-between">
          <Button variant="secondary" onClick={()=>setImportRows(null)}>تصدير CSV الحالي</Button>
          <div className="flex gap-2"><Button variant="secondary" onClick={()=>setDrawer(false)}>إغلاق</Button><Button isDisabled={!!importRows?.some(r=>r.errors.length)} onClick={()=>setDrawer(false)}>تأكيد الاستيراد</Button></div>
        </div>
      </Modal>
    </AppLayout>
  );
}
