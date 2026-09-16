// AU MED — Digital E-Prescription & Instant Pharmacy Fulfillment — QR + ICD-10 + DDI + Fulfillment Hub
import { useState } from "react";
import { router, usePage } from "@inertiajs/react";
import AppLayout from "@/Layouts/AppLayout";
import Button from "@/Components/UI/Button";
import GlassCard from "@/Components/UI/GlassCard";
import Modal from "@/Components/UI/Modal";
import StatusBadge from "@/Components/UI/StatusBadge";
import type { SharedPageProps } from "@/Types/global.d";
import type { EPrescription, FulfillmentMode } from "@/Types/AU MED.d";

const TENANT: "AU MED" = "AU MED";

const MOCK_RX: EPrescription = {
  id: "rx-8841",
  patient_id: 7,
  app_id: TENANT,
  qr_payload: "abduni://rx/rx-8841?sig=MEUCIQ...",
  qr_signature: "sig_0x9a3f_eddsa",
  diagnosis_icd10: ["J02.9", "K29.7"],
  drugs: [
    { active_ingredient: "Azithromycin", brand: "Zithromax", dosage: "500mg", duration: "3 أيام", qty: 1 },
    { active_ingredient: "Omeprazole", brand: "Losec", dosage: "20mg", duration: "14 يوم", qty: 1 },
  ],
  dosage_schedule: "Azithromycin 1× يومياً بعد الأكل — Omeprazole صباحاً على الريق",
  ddi_alerts: [
    { level: "safe", message_ar: "آمن — لا تداخل", message_en: "Safe" },
    { level: "caution", message_ar: "حذر — مع مضاد حموضة", message_en: "Caution with antacid" },
  ],
  issued_at: new Date().toISOString(),
  expires_at: new Date(Date.now() + 7 * 86400000).toISOString(),
  prescriber: "د. ليلى — أطفال",
};

function QRMono({ payload }: { payload: string }) {
  return (
    <div className="mx-auto h-36 w-36 rounded-[var(--radius-md)] border-2 border-[var(--canvas-dark)] bg-white p-2 flex flex-col items-center justify-center">
      <div className="grid h-24 w-24 grid-cols-6 gap-0.5">{Array.from({ length: 36 }).map((_, i) => <span key={i} className={`rounded-sm ${Math.random() > 0.5 ? "bg-black" : "bg-white"} border border-black/10`} />)}</div>
      <span className="mt-1 font-mono text-micro truncate w-full text-center">{payload.slice(0, 18)}…</span>
    </div>
  );
}

export default function PrescriptionShow() {
  const { props } = usePage<SharedPageProps>();
  const isMed = (props.tenant?.app_id ?? props.app_id) === TENANT;
  const [mode, setMode] = useState<FulfillmentMode | null>(null);
  const [pharmacy, setPharmacy] = useState("صيدلية النيل — 1.2km");

  if (!isMed) return <AppLayout><GlassCard level="inner" className="text-center"><p className="text-section font-bold">يتطلب AU MED</p></GlassCard></AppLayout>;

  // FIX-P2-09 expiry guard + FIX-P2-07 RBAC + FIX-P2-14 X-Trace
  const expired = new Date(MOCK_RX.expires_at).getTime() < Date.now();
  const fulfill = (m: FulfillmentMode): void => {
    if (expired) return;
    setMode(m);
    const idem = typeof crypto!=="undefined" && crypto.randomUUID ? crypto.randomUUID() : String(Date.now());
    router.post("/med/prescriptions/fulfill", { app_id: TENANT, prescription_id: MOCK_RX.id, mode: m, pharmacy } as unknown as never,
      { headers: { "X-App-Id": TENANT, "Idempotency-Key": idem, "X-Trace-Id": (document.querySelector('meta[name="trace-id"]') as HTMLMetaElement)?.content ?? "" } as unknown as Record<string, string>, preserveScroll: true } as unknown as Record<string,unknown>);
  };

  return (
    <AppLayout>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-title font-bold text-white">روشتة رقمية — E-Prescription</h1>
        {expired ? <StatusBadge state="Danger" label="Expired" /> : <StatusBadge state="Verified" label={`QR Signed · ${MOCK_RX.qr_signature.slice(0, 10)}`} /> }
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-[380px_1fr]">
        <GlassCard level="inner" className="text-center">
          <h3 className="text-section font-semibold">QR Code Signature</h3>
          <p className="text-micro text-[var(--text-secondary)]">امسح في الصيدلية — يمنع التزوير</p>
          <div className="mt-3"><QRMono payload={MOCK_RX.qr_payload} /></div>
          <p className="mt-2 font-mono text-micro break-all">{MOCK_RX.qr_signature}</p>
          <div className="mt-3 flex justify-center gap-2"><StatusBadge state="VIP" label="ICD-10 J02.9" /><StatusBadge state="VIP" label="ICD-10 K29.7" /></div>
          <p className="mt-2 text-micro text-[var(--text-secondary)]">صادرة بواسطة {MOCK_RX.prescriber} · تنتهي {new Date(MOCK_RX.expires_at).toLocaleDateString("ar-EG")}</p>
        </GlassCard>

        <GlassCard level="inner">
          <h3 className="text-section font-semibold">المكونات الفعالة وجدول الجرعات</h3>
          <div className="mt-3 space-y-2">
            {MOCK_RX.drugs.map(d => (
              <div key={d.active_ingredient} className="rounded-[var(--radius-md)] bg-white border border-[var(--border-pearl)] p-3 flex justify-between">
                <div><p className="text-body font-bold">{d.active_ingredient} — {d.brand}</p><p className="text-micro text-[var(--text-secondary)]">{d.dosage} · {d.duration}</p></div><span className="rounded-full bg-[var(--surface-secondary)] px-2 py-1 text-micro">Qty {d.qty}</span>
              </div>
            ))}
          </div>
          <p className="mt-3 text-body">جدول الجرعات: <b>{MOCK_RX.dosage_schedule}</b></p>
          <div className="mt-3 flex flex-wrap gap-2">
            {MOCK_RX.ddi_alerts.map((a, i) => <StatusBadge key={i} state={a.level === "safe" ? "Verified" : a.level === "caution" ? "Pending" : "Danger"} label={`${a.level}: ${a.message_ar}`} />)}
          </div>
          <p className="mt-2 text-micro text-[var(--text-secondary)]">DDI Safety Badges — فحص تداخلات دوائية</p>
        </GlassCard>
      </div>

      <GlassCard level="inner" className="mt-4">
        <h3 className="text-section font-semibold">Fulfillment Action Hub — صرف فوري</h3>
        <p className="text-micro text-[var(--text-secondary)]">اختر طريقة الاستلام — تُحوّل للأقرب على AU BUSINESS وتُرسل عبر AU SERV</p>
        <div className="mt-3 grid gap-3 md:grid-cols-2">
          <button disabled={expired} onClick={() => fulfill("home_delivery")} className={`rounded-[var(--radius-md)] border p-4 text-start ${mode === "home_delivery" ? "border-[var(--accent-cyan)] bg-[rgba(6,182,212,0.08)]" : "bg-white border-[var(--border-pearl)]"}`}>
            <p className="text-body font-bold">🚚 Instant Home Delivery</p>
            <p className="text-micro text-[var(--text-secondary)]">يُوجَّه لأقرب صيدلية شريكة على AU BUSINESS ويُرسل عبر AU SERV</p>
            <p className="mt-2 text-micro font-mono">pharmacy 1.2km · ETA 18m · dispatched via AU SERV</p>
          </button>
          <button disabled={expired} onClick={() => fulfill("qr_pickup")} className={`rounded-[var(--radius-md)] border p-4 text-start ${mode === "qr_pickup" ? "border-[var(--brand-gold)] bg-[rgba(197,160,89,0.12)]" : "bg-white border-[var(--border-pearl)]"}`}>
            <p className="text-body font-bold">🏪 In-Store QR Pickup</p>
            <p className="text-micro text-[var(--text-secondary)]">يحجز المخزون في صيدلية مختارة للمسح المادي للـ QR</p>
            <p className="mt-2 text-micro font-mono">lock qty · pickup window 24h</p>
          </button>
        </div>
        {mode && <p className="mt-3 text-body text-[var(--accent-emerald)]">✓ تم التوجيه — {mode === "home_delivery" ? "توصيل منزلي" : "حجز للاستلام"} — pharmacy: {pharmacy}</p>}

        <Modal open={mode !== null} onOpenChange={o => !o && setMode(null)} title={mode === "home_delivery" ? "اختر صيدلية للتوصيل" : "اختر صيدلية للاستلام"}>
          <div className="space-y-3">
            <select value={pharmacy} onChange={e => setPharmacy(e.target.value)} className="w-full rounded-[var(--radius-md)] border border-[var(--border-pearl)] bg-white px-3 py-2">
              <option>صيدلية النيل — 1.2km — متاحة</option><option>صيدلية العبد — 2.4km — متاحة</option><option>صيدلية الشفاء — 0.8km — مغلقة</option>
            </select>
            <div className="flex gap-2"><Button className="flex-1" onClick={() => setMode(null)}>تأكيد {mode === "home_delivery" ? "التوصيل" : "الحجز"}</Button><Button variant="secondary" onClick={() => setMode(null)}>إلغاء</Button></div>
            <p className="text-micro text-[var(--text-secondary)]">Payload: app_id=AU MED · prescription_id={MOCK_RX.id} · dispatched_via AU SERV</p>
          </div>
        </Modal>
      </GlassCard>
    </AppLayout>
  );
}
