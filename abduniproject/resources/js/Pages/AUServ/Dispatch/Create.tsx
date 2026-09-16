// AU SERV — Universal Service & Job Request Engine — Strict TS ZERO any
import { useMemo, useState } from "react";
import { router, usePage } from "@inertiajs/react";
import AppLayout from "@/Layouts/AppLayout";
import Button from "@/Components/UI/Button";
import GlassCard from "@/Components/UI/GlassCard";
import { maskLeak } from "@/Utils/sanitize";
import type { SharedPageProps } from "@/Types/global.d";
import type { DispatchMode, GeoPoint, PricingBreakdown, ServiceCategory, TechnicianSkill } from "@/Types/auserv.d";

const TENANT: "AU SERV" = "AU SERV";

function fmt(minor: number): string {
  return new Intl.NumberFormat("ar-EG", { style: "currency", currency: "EGP", numberingSystem: "latn" }).format(minor / 100);
}

function haversine(a: GeoPoint, b: GeoPoint): number {
  const R = 6371;
  const dLat = ((b.lat - a.lat) * Math.PI) / 180;
  const dLng = ((b.lng - a.lng) * Math.PI) / 180;
  const sa = Math.sin(dLat / 2) ** 2 + Math.cos((a.lat * Math.PI) / 180) * Math.cos((b.lat * Math.PI) / 180) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(sa));
}

const PICKUP_PRESETS: GeoPoint[] = [
  { lat: 30.0444, lng: 31.2357, label_ar: "وسط البلد — القاهرة", label_en: "Downtown", address: "وسط البلد، القاهرة" },
  { lat: 30.0626, lng: 31.3444, label_ar: "مدينة نصر", label_en: "Nasr City", address: "مدينة نصر" },
  { lat: 29.9792, lng: 31.1342, label_ar: "الجيزة — الهرم", label_en: "Giza", address: "الهرم، الجيزة" },
  { lat: 30.0131, lng: 31.2089, label_ar: "المعادي", label_en: "Maadi", address: "المعادي" },
];

const DROPOFF_PRESETS: GeoPoint[] = [
  { lat: 30.05, lng: 31.32, label_ar: "العاصمة الإدارية", label_en: "New Capital", address: "العاصمة الإدارية" },
  { lat: 30.0808, lng: 31.3333, label_ar: "التجمع الخامس", label_en: "New Cairo", address: "التجمع الخامس" },
  { lat: 30.01, lng: 31.0, label_ar: "الشيخ زايد", label_en: "Sheikh Zayed", address: "الشيخ زايد" },
  { lat: 30.15, lng: 31.38, label_ar: "العبور", label_en: "Obour", address: "العبور الصناعية" },
];

const CATEGORY_BASE: Record<ServiceCategory, number> = {
  FIELD_TECHNICAL: 4000,
  LOGISTICS_FREIGHT: 5000,
  PROFESSIONAL_FREELANCE: 6000,
  ON_DEMAND_TALENT_JOBS: 3500,
  CUSTOM_REQUESTS: 3000,
};

const SKILL_PREMIUM: Record<string, number> = {
  electric: 800, plumbing: 700, hvac: 1200, auto_mechanics: 1000, software: 2500, design: 1500, legal: 3000, security: 900, cleaning: 300,
};

export default function UniversalDispatchCreate() {
  const { props } = usePage<SharedPageProps>();
  const isServ = (props.tenant?.app_id ?? props.app_id) === TENANT;

  const [category, setCategory] = useState<ServiceCategory>("FIELD_TECHNICAL");
  const [dispatchMode, setDispatchMode] = useState<DispatchMode>("IMMEDIATE");
  const [pickupIdx, setPickupIdx] = useState<number>(0);
  const [dropoffIdx, setDropoffIdx] = useState<number>(1);
  const [isRemote, setIsRemote] = useState<boolean>(false);
  const [skillTags, setSkillTags] = useState<TechnicianSkill[]>(["electric"]);
  const [durationHours, setDurationHours] = useState<number>(4);
  const [milestones, setMilestones] = useState<{ title: string; amount: number }[]>([
    { title: "دفعة مقدمة — عربون", amount: 5000 },
    { title: "تسليم نهائي", amount: 12000 },
  ]);
  const [specNote, setSpecNote] = useState<string>("");
  const sanitizedNote = useMemo(() => maskLeak(specNote), [specNote]);

  const pickup = PICKUP_PRESETS[pickupIdx];
  const dropoff = DROPOFF_PRESETS[dropoffIdx];
  const distanceKm = useMemo(() => (isRemote ? 0 : haversine(pickup, dropoff)), [pickup, dropoff, isRemote]);
  const etaMinutes = useMemo(() => (isRemote ? 0 : Math.max(6, Math.round(distanceKm * 2.2 + 4))), [distanceKm, isRemote]);

  const pricing: PricingBreakdown = useMemo(() => {
    const base = CATEGORY_BASE[category];
    const perKm = 150;
    const perHour = 1200; // 12 EGP/hour in minor
    const distanceFee = isRemote ? 0 : Math.round(distanceKm * perKm);
    const durationFee = dispatchMode === "HOURLY_DAILY" ? durationHours * perHour : 0;
    const skillPremium = skillTags.reduce((acc, s) => acc + (SKILL_PREMIUM[s] ?? 500), 0);
    const milestoneTotal = milestones.reduce((acc, m) => acc + m.amount * 100, 0);
    const total = dispatchMode === "MILESTONE_QUOTE" || dispatchMode === "TASK_BIDDING" ? milestoneTotal : base + distanceFee + durationFee + skillPremium;
    return {
      base_fee_minor: base,
      per_km_rate_minor: perKm,
      per_hour_rate_minor: perHour,
      distance_km: distanceKm,
      duration_hours: durationHours,
      distance_fee_minor: distanceFee,
      duration_fee_minor: durationFee,
      skill_premium_minor: skillPremium,
      weight_fee_minor: 0,
      total_minor: total,
      currency: "EGP",
    };
  }, [category, distanceKm, dispatchMode, durationHours, skillTags, milestones, isRemote]);

  const toggleSkill = (s: TechnicianSkill): void => {
    setSkillTags((prev) => (prev.includes(s) ? prev.filter((x) => x !== s) : [...prev, s]));
  };

  if (!isServ) {
    return (
      <AppLayout>
        <GlassCard level="inner" className="text-center">
          <p className="text-section font-bold">يتطلب AU SERV</p>
        </GlassCard>
      </AppLayout>
    );
  }

  const submit = (): void => {
    router.post(
      "/serv/dispatch",
      {
        app_id: TENANT,
        service_category: category,
        dispatch_mode: dispatchMode,
        pickup: isRemote ? null : pickup,
        dropoff: isRemote ? null : dropoff,
        is_remote: isRemote,
        skill_tags: skillTags,
        spec_note_sanitized: sanitizedNote,
        milestones,
        pricing,
        total_minor: pricing.total_minor,
      } as unknown as never,
      { headers: { "X-App-Id": TENANT } as unknown as Record<string, string> },
    );
  };

  return (
    <AppLayout>
      <div className="flex flex-wrap items-center gap-2 text-micro text-[var(--text-secondary)]">
        <button onClick={() => router.visit("/serv/hub", { headers: { "X-App-Id": TENANT } as unknown as Record<string, string> })} className="hover:underline">Hub</button>
        <span>›</span>
        <span className="text-[var(--text-primary)]">طلب شامل — Universal Request</span>
        <span className="ms-auto rounded-full bg-[var(--accent-cyan)] px-2 py-1 text-white text-micro font-bold">X-App-Id AU SERV</span>
      </div>

      <h1 className="mt-3 text-title font-bold text-white">محرك الطلبات الشامل — Universal Service & Job Request</h1>
      <p className="text-micro text-[var(--text-secondary)]">فوري · مراحل/عروض · بالساعة/اليوم · مزايدة — مع Escrow Total حية</p>

      {/* Service Type Selector */}
      <GlassCard level="inner" className="mt-4">
        <h3 className="text-body font-bold">نوع التنفيذ — Dispatch Mode</h3>
        <div className="mt-3 grid gap-2 sm:grid-cols-4">
          {[
            { k: "IMMEDIATE", ar: "إرسال فوري", en: "Immediate Dispatch", icon: "⚡" },
            { k: "MILESTONE_QUOTE", ar: "مراحل / عرض سعر", en: "Milestone/Quote", icon: "📋" },
            { k: "HOURLY_DAILY", ar: "بالساعة / باليوم", en: "Hourly/Daily Staffing", icon: "⏱️" },
            { k: "TASK_BIDDING", ar: "مزايدة مهام", en: "Task Bidding", icon: "🤝" },
          ].map((m) => (
            <button
              key={m.k}
              onClick={() => setDispatchMode(m.k as DispatchMode)}
              className={`text-start rounded-[var(--radius-md)] border-2 p-3 ${dispatchMode === m.k ? "border-[var(--accent-cyan)] bg-[rgba(6,182,212,0.08)]" : "border-[var(--border-pearl)] bg-white"}`}
            >
              <span className="text-body">{m.icon}</span>
              <p className="text-body font-bold">{m.ar}</p>
              <p className="text-micro text-[var(--text-secondary)]">{m.en}</p>
              <p className="font-mono text-micro text-[var(--text-secondary)]">{m.k}</p>
            </button>
          ))}
        </div>

        <div className="mt-3">
          <p className="text-micro font-bold">الفئة الشاملة — Service Category</p>
          <div className="mt-2 flex flex-wrap gap-2">
            {(["FIELD_TECHNICAL", "LOGISTICS_FREIGHT", "PROFESSIONAL_FREELANCE", "ON_DEMAND_TALENT_JOBS", "CUSTOM_REQUESTS"] as ServiceCategory[]).map((c) => (
              <button key={c} onClick={() => setCategory(c)} className={`rounded-full px-3 py-1 text-micro font-bold border ${category === c ? "bg-[var(--canvas-dark)] text-white border-transparent" : "bg-white border-[var(--border-pearl)]"}`}>
                {c === "FIELD_TECHNICAL" ? "فني" : c === "LOGISTICS_FREIGHT" ? "لوجستيات" : c === "PROFESSIONAL_FREELANCE" ? "احترافي" : c === "ON_DEMAND_TALENT_JOBS" ? "وظائف عند الطلب" : "مخصص"}
              </button>
            ))}
          </div>
        </div>
      </GlassCard>

      <div className="mt-4 grid gap-4 lg:grid-cols-[1.25fr_0.85fr]">
        {/* Flexible Specs Builder */}
        <GlassCard level="inner" padding="none" className="overflow-hidden">
          <div className="px-4 py-3 border-b border-[var(--border-pearl)] bg-white flex items-center justify-between">
            <h3 className="text-body font-bold">باني المواصفات — Specs Builder</h3>
            <span className="rounded-full bg-white border border-[var(--border-pearl)] px-2 py-1 text-micro font-mono">{distanceKm.toFixed(2)} km · {etaMinutes}′</span>
          </div>

          <div className="p-4 space-y-4 bg-[var(--surface-pearl-strong)]">
            {/* Location pin / remote workspace toggle */}
            <div className="rounded-[var(--radius-md)] bg-white border border-[var(--border-pearl)] p-3">
              <div className="flex items-center justify-between">
                <p className="text-body font-bold">الموقع — Location</p>
                <label className="flex items-center gap-2 text-micro font-bold">
                  <input type="checkbox" checked={isRemote} onChange={(e) => setIsRemote(e.target.checked)} className="accent-[var(--accent-cyan)]" />
                  عمل عن بُعد — Remote Workspace
                </label>
              </div>
              {!isRemote ? (
                <div className="mt-2 grid gap-3 sm:grid-cols-2">
                  <div>
                    <label className="text-micro font-bold">📍 استلام — Pickup</label>
                    <select value={pickupIdx} onChange={(e) => setPickupIdx(Number(e.target.value))} className="mt-1 w-full rounded-[var(--radius-md)] border border-[var(--border-pearl)] bg-white px-3 py-2 text-body">
                      {PICKUP_PRESETS.map((p, i) => (
                        <option key={p.label_en} value={i}>{p.label_ar} — {p.label_en}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="text-micro font-bold">🏁 تسليم — Drop-off</label>
                    <select value={dropoffIdx} onChange={(e) => setDropoffIdx(Number(e.target.value))} className="mt-1 w-full rounded-[var(--radius-md)] border border-[var(--border-pearl)] bg-white px-3 py-2 text-body">
                      {DROPOFF_PRESETS.map((p, i) => (
                        <option key={p.label_en} value={i}>{p.label_ar} — {p.label_en}</option>
                      ))}
                    </select>
                  </div>
                </div>
              ) : (
                <p className="mt-2 text-body text-[var(--text-secondary)]">🌐 عمل عن بُعد — لا مسافة، التسعير بالساعة/المهارة فقط — Remote: distance 0</p>
              )}
              {!isRemote && (
                <div className="mt-3 relative h-[180px] bg-[radial-gradient(ellipse_at_center,rgba(6,182,212,0.06),transparent_70%),var(--surface-secondary)] border border-[var(--border-pearl)] rounded-[var(--radius-md)] overflow-hidden">
                  <svg className="absolute inset-0 h-full w-full" viewBox="0 0 100 100" preserveAspectRatio="none">
                    <line x1="18" y1="42" x2="82" y2="68" stroke="var(--accent-cyan)" strokeWidth="0.7" strokeDasharray="2 2" />
                    <circle cx="18" cy="42" r="2.5" fill="var(--accent-emerald)" stroke="white" strokeWidth="0.6" />
                    <circle cx="82" cy="68" r="2.5" fill="var(--brand-crimson)" stroke="white" strokeWidth="0.6" />
                  </svg>
                  <div className="absolute" style={{ left: "18%", top: "42%", transform: "translate(-50%,-100%)" }}><span className="rounded-full bg-[var(--accent-emerald)] text-white px-2 py-1 text-micro font-bold">📍 Pickup</span></div>
                  <div className="absolute" style={{ left: "82%", top: "68%", transform: "translate(-50%,-100%)" }}><span className="rounded-full bg-[var(--brand-crimson)] text-white px-2 py-1 text-micro font-bold">🏁 Drop</span></div>
                </div>
              )}
            </div>

            {/* Required skills / certifications tag selector */}
            <div className="rounded-[var(--radius-md)] bg-white border border-[var(--border-pearl)] p-3">
              <p className="text-body font-bold">المهارات والشهادات المطلوبة — Skills & Certs</p>
              <div className="mt-2 flex flex-wrap gap-2">
                {(["electric","plumbing","hvac","carpentry","auto_mechanics","software","design","accounting","legal","translation","marketing","security","cleaning"] as TechnicianSkill[]).map((s) => (
                  <button key={s} onClick={() => toggleSkill(s)} className={`rounded-full px-3 py-1 text-micro font-bold border ${skillTags.includes(s) ? "bg-[var(--canvas-dark)] text-white border-transparent" : "bg-white border-[var(--border-pearl)] text-[var(--text-secondary)]"}`}>
                    {s} {skillTags.includes(s) ? "✓" : ""}
                  </button>
                ))}
              </div>
              <p className="mt-2 text-micro text-[var(--text-secondary)]">المحدد: {skillTags.join(" · ") || "—"} · قسط المهارة يُحتسب تلقائياً</p>
            </div>

            {/* Task attachments / specs */}
            <div className="rounded-[var(--radius-md)] bg-white border border-[var(--border-pearl)] p-3">
              <p className="text-body font-bold">مواصفات ومرفقات — Specs & Attachments</p>
              <textarea value={specNote} onChange={(e) => setSpecNote(e.target.value)} rows={3} placeholder="اكتب تفاصيل المهمة — لا تضف هاتف (سيُطهّر)" className="mt-2 w-full rounded-[var(--radius-md)] border border-[var(--border-pearl)] bg-white px-3 py-2 text-body" />
              {specNote !== sanitizedNote && <p className="text-micro text-[var(--brand-crimson)]">تم الطمس: {sanitizedNote.slice(0, 80)}</p>}
              <div className="mt-2 flex gap-2">
                <button className="rounded-full bg-white border border-[var(--border-pearl)] px-3 py-1 text-micro" onClick={() => alert("رفع مرفق — محاكاة")}>📎 رفع مرفق — Attach</button>
                <span className="text-micro text-[var(--text-secondary)] self-center">يدعم صور/ملفات المهام المخصصة</span>
              </div>
            </div>

            {/* Milestone payment builder — for MILESTONE_QUOTE / CUSTOM / BIDDING */}
            {(dispatchMode === "MILESTONE_QUOTE" || dispatchMode === "TASK_BIDDING" || dispatchMode === "CUSTOM_REQUESTS" as unknown as DispatchMode || category === "CUSTOM_REQUESTS") && (
              <div className="rounded-[var(--radius-md)] bg-white border-2 border-[var(--brand-gold)] p-3">
                <p className="text-body font-bold">باني الدفعات — Milestone Payment Builder</p>
                <div className="mt-2 flex flex-col gap-2">
                  {milestones.map((m, idx) => (
                    <div key={idx} className="flex gap-2 items-center">
                      <input value={m.title} onChange={(e) => setMilestones((prev) => prev.map((x, i) => (i === idx ? { ...x, title: e.target.value } : x)))} placeholder="عنوان الدفعة" className="flex-1 rounded-[var(--radius-md)] border border-[var(--border-pearl)] bg-white px-3 py-2 text-body" />
                      <input type="number" value={m.amount} onChange={(e) => setMilestones((prev) => prev.map((x, i) => (i === idx ? { ...x, amount: Number(e.target.value) || 0 } : x)))} className="w-28 rounded-[var(--radius-md)] border border-[var(--border-pearl)] bg-white px-3 py-2 text-body font-mono" />
                      <span className="text-micro">EGP</span>
                      <button onClick={() => setMilestones((prev) => prev.filter((_, i) => i !== idx))} className="rounded-full bg-[var(--brand-crimson)] text-white px-2 py-1 text-micro">✕</button>
                    </div>
                  ))}
                </div>
                <div className="mt-2 flex gap-2">
                  <Button size="sm" variant="secondary" onClick={() => setMilestones((prev) => [...prev, { title: "مرحلة جديدة", amount: 3000 }])}>+ إضافة مرحلة</Button>
                  <span className="ms-auto text-micro font-bold font-mono">إجمالي المراحل {fmt(milestones.reduce((a, b) => a + b.amount * 100, 0))}</span>
                </div>
              </div>
            )}

            {dispatchMode === "HOURLY_DAILY" && (
              <div className="rounded-[var(--radius-md)] bg-white border border-[var(--border-pearl)] p-3">
                <label className="text-micro font-bold">المدة — {durationHours} ساعة</label>
                <input type="range" min={1} max={12} step={1} value={durationHours} onChange={(e) => setDurationHours(Number(e.target.value))} className="mt-2 w-full accent-[var(--accent-cyan)]" />
                <p className="text-micro text-[var(--text-secondary)]">التسعير بالساعة: {fmt(1200)}/ساعة</p>
              </div>
            )}
          </div>
        </GlassCard>

        <div className="space-y-4">
          {/* Dynamic Pricing Estimator */}
          <GlassCard level="inner" accent="emerald">
            <h3 className="text-body font-bold">مقدّر التسعير الديناميكي — Dynamic Pricing Estimator</h3>
            <p className="text-micro text-[var(--text-secondary)]">Base + Distance/Duration/Hourly + Skill Premium → Escrow Total</p>
            <div className="mt-3 rounded-[var(--radius-md)] bg-white border border-[var(--border-pearl)] p-3 space-y-2">
              <div className="flex justify-between text-body"><span>أساسي — Base ({category})</span><span className="font-mono font-bold">{fmt(pricing.base_fee_minor)}</span></div>
              {!isRemote && <div className="flex justify-between text-body"><span>مسافة {pricing.distance_km.toFixed(2)}km × {fmt(pricing.per_km_rate_minor)}/km</span><span className="font-mono">{fmt(pricing.distance_fee_minor)}</span></div>}
              {dispatchMode === "HOURLY_DAILY" && <div className="flex justify-between text-body"><span>{durationHours}h × {fmt(pricing.per_hour_rate_minor ?? 1200)}/h</span><span className="font-mono">{fmt(pricing.duration_fee_minor)}</span></div>}
              <div className="flex justify-between text-body"><span>قسط مهارة — Skill Premium ({skillTags.length})</span><span className="font-mono text-[var(--accent-amber)]">{fmt(pricing.skill_premium_minor)}</span></div>
              {(dispatchMode === "MILESTONE_QUOTE" || dispatchMode === "TASK_BIDDING") && <div className="flex justify-between text-micro text-[var(--text-secondary)]"><span>إجمالي المراحل — Milestones</span><span className="font-mono">{fmt(milestones.reduce((a, b) => a + b.amount * 100, 0))}</span></div>}
              <div className="flex justify-between border-t border-[var(--border-pearl)] pt-2 font-bold text-section"><span>Escrow Total</span><span className="font-mono text-[var(--accent-emerald)]">{fmt(pricing.total_minor)}</span></div>
              <p className="text-micro text-[var(--text-secondary)]">يُحجز في ضمان `app_wallet` حتى Dual-OTP handshake</p>
            </div>
            <Button onClick={submit} className="mt-3 w-full" size="lg">تأكيد الطلب — {fmt(pricing.total_minor)} — X-App-Id AU SERV</Button>
            <p className="mt-1 text-center text-micro text-[var(--text-secondary)]">{dispatchMode} · {isRemote ? "Remote" : `${distanceKm.toFixed(2)}km`} · {skillTags.join("·")}</p>
          </GlassCard>
        </div>
      </div>
    </AppLayout>
  );
}
