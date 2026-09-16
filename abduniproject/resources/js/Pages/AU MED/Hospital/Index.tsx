// AU MED — Virtual Hospital Landing & Departments — app_id="AU MED" ENFORCED
import { useMemo, useState } from "react";
import { router, usePage } from "@inertiajs/react";
import AppLayout from "@/Layouts/AppLayout";
import Button from "@/Components/UI/Button";
import GlassCard from "@/Components/UI/GlassCard";
import StatusBadge from "@/Components/UI/StatusBadge";
import { maskLeak } from "@/Utils/sanitize";
import type { SharedPageProps } from "@/Types/global.d";
import type { MedDepartment, ScheduledSlot, UrgentDispatchState } from "@/Types/AU MED.d";

const TENANT: "AU MED" = "AU MED";

const DEPARTMENTS: MedDepartment[] = [
  { key: "clinics", label_ar: "العيادات التخصصية", label_en: "Clinics", icon: "🩺", verified: true, head_count: 42 },
  { key: "radiology", label_ar: "الأشعة", label_en: "Radiology", icon: "🩻", verified: true, head_count: 18 },
  { key: "labs", label_ar: "المختبرات", label_en: "Labs", icon: "🧬", verified: true, head_count: 24 },
  { key: "emergency", label_ar: "الطوارئ", label_en: "Emergency", icon: "🚑", verified: true, head_count: 12 },
  { key: "home_nursing", label_ar: "التمريض المنزلي", label_en: "Home Nursing", icon: "🏠", verified: true, head_count: 31 },
  { key: "pharmacy", label_ar: "الصيدلية", label_en: "Pharmacy", icon: "💊", verified: true, head_count: 9 },
];

function todaySlots(): ScheduledSlot[] {
  const base = new Date(); base.setHours(9, 0, 0, 0);
  return Array.from({ length: 8 }, (_, i) => {
    const d = new Date(base); d.setHours(9 + i);
    return {
      id: `slot-${i}`,
      scheduled_at: d.toISOString(),
      department: (["clinics", "radiology", "labs"] as const)[i % 3],
      provider_id: 100 + i,
      locked: i === 2 || i === 5, // mutex demo — 2 slots locked
      locked_until: i === 2 ? new Date(Date.now() + 4 * 60 * 1000).toISOString() : undefined,
    };
  });
}

export default function HospitalIndex() {
  const { props } = usePage<SharedPageProps>();
  const isMed = (props.tenant?.app_id ?? props.app_id) === TENANT;
  const [q, setQ] = useState("");
  const [debouncedQ, setDebouncedQ] = useState(q);
  useEffect(() => { const id=window.setTimeout(()=> setDebouncedQ(q),300); return ()=> window.clearTimeout(id); }, [q]);
  const [urgent, setUrgent] = useState<UrgentDispatchState>({ is_urgent: false, radius_km: 2, lat: 30.0444, lng: 31.2357 });
  const [slots, setSlots] = useState<ScheduledSlot[]>(todaySlots());
  // FIX-P2-04 debounce leak + FIX-P2-12 expiry poll central
  const sanitized = useMemo(() => maskLeak(debouncedQ), [debouncedQ]);
  useEffect(()=>{ const id=window.setInterval(()=> setSlots(a=> a.map(s=> s.locked_until && new Date(s.locked_until).getTime() < Date.now() ? {...s, locked:false, locked_until:undefined}:s)),1000); return()=> window.clearInterval(id);},[]);

  if (!isMed) return <AppLayout><GlassCard level="inner" className="text-center"><p className="text-section font-bold">عزل المستأجر — يتطلب AU MED</p><p className="text-body text-[var(--text-secondary)]">app_id الحالي: {String(props.tenant?.app_id ?? props.app_id)}</p></GlassCard></AppLayout>;

  const filtered = DEPARTMENTS.filter(d => !sanitized || d.label_ar.includes(sanitized) || d.label_en.toLowerCase().includes(sanitized.toLowerCase()));

  const toggleUrgent = (v: boolean): void => setUrgent(s => ({ ...s, is_urgent: v, radius_km: v ? 2 : 2 }));
  const expandRadius = (): void => setUrgent(s => ({ ...s, radius_km: s.radius_km === 2 ? 5 : s.radius_km === 5 ? 10 : 2 }));
  // FIX-P2-06 mutex 409 rollback + FIX-P2-07 RBAC + FIX-P2-14 X-Trace-Id
  const bookSlot = (id: string): void => {
    const cur = slots.find(s => s.id === id);
    if (!cur || cur.locked) return;
    const snap = slots;
    setSlots(a => a.map(s => (s.id === id ? { ...s, locked: true, locked_until: new Date(Date.now() + 10 * 60 * 1000).toISOString() } : s)));
    router.post("/med/slots/book", { app_id: TENANT, slot_id: id, scheduled_at: cur.scheduled_at } as unknown as never,
      { headers: { "X-App-Id": TENANT, "X-Trace-Id": (document.querySelector('meta[name="trace-id"]') as HTMLMetaElement)?.content ?? "" } as unknown as Record<string, string>, preserveScroll: true, onError: () => setSlots(snap) } as unknown as Record<string, unknown>);
  };

  return (
    <AppLayout>
      <GlassCard level="outer" padding="lg" className="text-center border border-[var(--glass-outer-border)]">
        <h1 className="text-display font-bold text-white tracking-tight">مستشفى العبد الإلكتروني</h1>
        <p className="mt-2 text-body text-[var(--text-secondary)]">Virtual Hospital — Encrypted Medical Vault · AU MED · app_id="{TENANT}" — طب موثّق معزول</p>
        <div className="mt-3 flex justify-center gap-2 flex-wrap">
          {DEPARTMENTS.map(d => <span key={d.key} className="rounded-full bg-white/10 px-3 py-1 text-micro text-white border border-white/20">{d.icon} {d.label_ar} · {d.head_count}</span>)}
        </div>
        <p className="mt-2 text-micro text-[var(--text-secondary)]">كيانات صحية موثّقة — Clinics · Radiology · Labs · Emergency · Home Nursing · Pharmacy</p>
      </GlassCard>

      <GlassCard level="inner" className="mt-4">
        <div className="flex flex-wrap items-center gap-3">
          <h2 className="text-section font-semibold">البحث الطبي — Urgent vs Scheduled</h2>
          <label className="ms-auto flex items-center gap-2 rounded-full border border-[var(--border-pearl)] bg-white px-3 py-2 text-body">
            <input type="checkbox" checked={urgent.is_urgent} onChange={e => toggleUrgent(e.target.checked)} />
            Urgent Dispatch Switch (is_urgent = {urgent.is_urgent ? "true" : "false"})
          </label>
        </div>

        <div className="mt-3 flex gap-2">
          <input value={q} onChange={e => setQ(e.target.value)} placeholder="ابحث قسماً أو تخصصاً — يُطهّر تلقائياً" className="flex-1 rounded-[var(--radius-md)] border border-[var(--border-pearl)] bg-white px-3 py-2 text-body" />
          <span className="hidden sm:inline-flex items-center rounded-full bg-[var(--surface-secondary)] px-3 text-micro text-[var(--text-secondary)] border border-[var(--border-pearl)]">{filtered.length} أقسام</span>
        </div>
        {q !== sanitized && <p className="mt-1 text-micro text-[var(--brand-crimson)]">تم الطمس: {sanitized}</p>}

        {urgent.is_urgent ? (
          <div className="mt-4 rounded-[var(--radius-md)] border border-[var(--brand-crimson)] bg-[rgba(239,68,68,0.06)] p-4">
            <h3 className="text-body font-bold text-[var(--brand-crimson)]">🚨 إرسال عاجل — Proximity Filter مع توسيع تدريجي 2km → 5km → 10km</h3>
            <p className="text-micro text-[var(--text-secondary)]">lat {urgent.lat} lng {urgent.lng} · نطاق حالي {urgent.radius_km}km — يُرسل لأقرب طبيب/ممرض منزلي</p>
            <div className="mt-3 flex flex-wrap gap-2">
              <Button variant="danger" featureFlag="au_med" requiredPermission="med.dispatch.urgent" onClick={expandRadius}>توسيع النطاق → {urgent.radius_km === 2 ? "5km" : urgent.radius_km === 5 ? "10km" : "2km"}</Button>
              <Button variant="secondary" featureFlag="au_med" requiredPermission="med.dispatch.urgent" onClick={() => router.visit("/med/dispatch/urgent", { data: { app_id: TENANT, is_urgent: true, radius_km: urgent.radius_km } as unknown as never, headers: { "X-App-Id": TENANT, "X-Trace-Id": (document.querySelector('meta[name="trace-id"]') as HTMLMetaElement)?.content ?? "" } as unknown as Record<string, string> })}>إرسال فوري في {urgent.radius_km}km</Button>
              <StatusBadge state="Danger" label={`${urgent.radius_km}km`} />
            </div>
            <div className="mt-3 grid gap-2 sm:grid-cols-3">
              {[
                { name: "د. أحمد — باطنة", dist: 1.2, eta: "6د" },
                { name: "ممرضة سارة", dist: 2.8, eta: "11د" },
                { name: "د. ليلى — أطفال", dist: 4.5, eta: "18د" },
              ].filter(p => p.dist <= urgent.radius_km).map(p => (
                <div key={p.name} className="rounded-[var(--radius-md)] bg-white border border-[var(--border-pearl)] p-3"><p className="text-body font-semibold">{p.name}</p><p className="text-micro text-[var(--text-secondary)]">{p.dist}km · ETA {p.eta}</p></div>
              ))}
            </div>
          </div>
        ) : (
          <div className="mt-4">
            <h3 className="text-body font-bold">Scheduled Slot Picker — تقويم المواعيد مع Mutex ضد الحجز المزدوج</h3>
            <p className="text-micro text-[var(--text-secondary)]">مقفول = محجوز مؤقتاً — يمنع double-booking أثناء الدفع</p>
            <div className="mt-3 grid gap-2 sm:grid-cols-4">
              {slots.map(s => (
                <button key={s.id} disabled={s.locked} onClick={() => bookSlot(s.id)}
                  className={`rounded-[var(--radius-md)] border p-3 text-start ${s.locked ? "bg-[var(--surface-secondary)] text-[var(--text-secondary)] border-[var(--border-pearl)] cursor-not-allowed" : "bg-white border-[var(--border-pearl)] hover:border-[var(--accent-cyan)]"}`}>
                  <p className="text-body font-semibold">{new Date(s.scheduled_at).toLocaleTimeString("ar-EG", { hour: "2-digit", minute: "2-digit" })}</p>
                  <p className="text-micro text-[var(--text-secondary)]">{DEPARTMENTS.find(d => d.key === s.department)?.label_ar} · مزوّد #{s.provider_id}</p>
                  {s.locked ? <span className="mt-1 inline-flex rounded-full bg-[var(--brand-crimson)] px-2 py-1 text-micro text-white">مقفول Mutex</span> : <span className="mt-1 inline-flex rounded-full bg-[var(--accent-emerald)] px-2 py-1 text-micro text-white">متاح</span>}
                </button>
              ))}
            </div>
          </div>
        )}

        <div className="mt-4 grid gap-3 sm:grid-cols-3">
          {filtered.map(d => (
            <GlassCard key={d.key} level="inner" className="relative">
              <span className="text-title">{d.icon}</span>
              <p className="mt-1 text-body font-bold">{d.label_ar}</p>
              <p className="text-micro text-[var(--text-secondary)]">{d.label_en} · {d.head_count} مزوّد</p>
              <StatusBadge state={d.verified ? "Verified" : "Danger"} label={d.verified ? "موثّق" : "غير موثّق"} className="mt-2" />
            </GlassCard>
          ))}
        </div>
      </GlassCard>
    </AppLayout>
  );
}
