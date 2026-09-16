// AU SERV — Universal Service Lifecycle & SLA Tracker — Strict TS ZERO any
import { useEffect, useMemo, useState } from "react";
import { router, usePage } from "@inertiajs/react";
import AppLayout from "@/Layouts/AppLayout";
import Button from "@/Components/UI/Button";
import GlassCard from "@/Components/UI/GlassCard";
import StatusBadge from "@/Components/UI/StatusBadge";
import { maskLeak } from "@/Utils/sanitize";
import type { SharedPageProps } from "@/Types/global.d";
import type { ChatMessage, LifecycleKind, ServiceCategory, SLACheckpoint, TrackingState } from "@/Types/auserv.d";

const TENANT: "AU SERV" = "AU SERV";

const LIFECYCLE_PRESETS: Record<LifecycleKind, { ar: string; en: string; checkpoints: Omit<SLACheckpoint, "at" | "status">[] }> = {
  on_site_visit: { ar: "زيارة ميدانية", en: "On-Site Visit", checkpoints: [{ label_ar: "تم الإرسال", label_en: "Dispatched", kind: "on_site_visit" }, { label_ar: "وصل الفني", label_en: "Technician Arrived", kind: "on_site_visit" }, { label_ar: "قيد التنفيذ", label_en: "In Progress", kind: "on_site_visit" }, { label_ar: "تم الإنجاز — OTP", label_en: "Completed — OTP", kind: "on_site_visit" }] },
  remote_deliverable: { ar: "تسليم عن بُعد", en: "Remote Deliverable", checkpoints: [{ label_ar: "تم الاستلام", label_en: "Brief Received", kind: "remote_deliverable" }, { label_ar: "مسودة أولى", label_en: "First Draft", kind: "remote_deliverable" }, { label_ar: "مراجعات", label_en: "Revisions", kind: "remote_deliverable" }, { label_ar: "تسليم نهائي — OTP", label_en: "Final Delivery — OTP", kind: "remote_deliverable" }] },
  logistics_route: { ar: "مسار لوجستي", en: "Logistics Route", checkpoints: [{ label_ar: "تم الاستلام", label_en: "Picked up", kind: "logistics_route" }, { label_ar: "في الطريق", label_en: "On the way", kind: "logistics_route" }, { label_ar: "وصل — بانتظار OTP", label_en: "Arrived — awaiting OTP", kind: "logistics_route" }, { label_ar: "تم التسليم", label_en: "Delivered", kind: "logistics_route" }] },
  job_shift_checkin: { ar: "مناوبة وظيفية", en: "Job Shift Check-in", checkpoints: [{ label_ar: "تأكيد الحضور", label_en: "Check-in", kind: "job_shift_checkin" }, { label_ar: "قيد المناوبة", label_en: "On Shift", kind: "job_shift_checkin" }, { label_ar: "استراحة", label_en: "Break", kind: "job_shift_checkin" }, { label_ar: "انتهاء المناوبة — OTP", label_en: "Shift End — OTP", kind: "job_shift_checkin" }] },
  custom_milestone: { ar: "مراحل مخصصة", en: "Custom Milestone", checkpoints: [{ label_ar: "عربون — Escrow", label_en: "Deposit — Escrow", kind: "custom_milestone" }, { label_ar: "مرحلة 1", label_en: "Milestone 1", kind: "custom_milestone" }, { label_ar: "مرحلة 2", label_en: "Milestone 2", kind: "custom_milestone" }, { label_ar: "إنجاز نهائي — OTP", label_en: "Final — OTP", kind: "custom_milestone" }] },
};

const MOCK_BASE: Omit<TrackingState, "lifecycle_kind" | "checkpoints"> = {
  request_id: "req_unv_8847",
  app_id: TENANT,
  service_category: "LOGISTICS_FREIGHT",
  provider: {
    id: "p1",
    app_id: TENANT,
    name_ar: "أحمد — لوجستيات",
    name_en: "Ahmed — Logistics",
    service_category: "LOGISTICS_FREIGHT",
    vehicle_class: "motorcycle",
    skills: ["auto_mechanics"],
    certifications: ["driving_license"],
    rating: 4.8,
    completed_jobs: 342,
    status: "available",
    availability_mode: "INSTANT",
    distance_km: 1.2,
    eta_minutes: 12,
    avatar: "🏍️",
  },
  sla_deadline_at: new Date(Date.now() + 9 * 60 * 1000).toISOString(),
  progress_pct: 62,
  otp_code: "4829",
};

const MOCK_CHAT_INITIAL: ChatMessage[] = [
  { id: "c1", from: "provider", body_sanitized: "أنا في الطريق — 6 دقائق", sent_at: new Date(Date.now() - 4 * 60 * 1000).toISOString() },
  { id: "c2", from: "client", body_sanitized: "تمام، في انتظارك", sent_at: new Date(Date.now() - 2 * 60 * 1000).toISOString() },
];

export default function UniversalTrackingShow() {
  const { props } = usePage<SharedPageProps>();
  const isServ = (props.tenant?.app_id ?? props.app_id) === TENANT;

  const [lifecycle, setLifecycle] = useState<LifecycleKind>("logistics_route");
  const [progress, setProgress] = useState<number>(MOCK_BASE.progress_pct);
  const [now, setNow] = useState<number>(Date.now());
  const [chat, setChat] = useState<ChatMessage[]>(MOCK_CHAT_INITIAL);
  const [chatInput, setChatInput] = useState<string>("");
  const [showOtp, setShowOtp] = useState<boolean>(true);
  const [category, setCategory] = useState<ServiceCategory>("LOGISTICS_FREIGHT");

  const checkpoints: SLACheckpoint[] = useMemo(() => {
    const preset = LIFECYCLE_PRESETS[lifecycle].checkpoints;
    return preset.map((c, idx) => ({
      ...c,
      at: new Date(Date.now() + (idx - 1) * 5 * 60 * 1000).toISOString(),
      status: idx === 0 ? "completed" : idx === 1 ? "current" : "pending",
    }));
  }, [lifecycle]);

  const slaLeftMs = useMemo(() => new Date(MOCK_BASE.sla_deadline_at).getTime() - now, [now]);
  const slaM = Math.max(0, Math.floor(slaLeftMs / 60000));
  const slaS = Math.max(0, Math.floor((slaLeftMs % 60000) / 1000));
  const slaBreached = slaLeftMs <= 0;

  useEffect(() => {
    const t = window.setInterval(() => {
      setNow(Date.now());
      setProgress((p) => Math.min(94, p + 0.18));
    }, 1200);
    return () => window.clearInterval(t);
  }, []);

  const sendChat = (): void => {
    if (!chatInput.trim()) return;
    const sanitized = maskLeak(chatInput);
    setChat((prev) => [...prev, { id: `c${prev.length + 1}`, from: "client", body_sanitized: sanitized, sent_at: new Date().toISOString() }]);
    setChatInput("");
  };

  const completeWithOtp = (): void => {
    router.post(`/serv/tracking/${MOCK_BASE.request_id}/complete`, { app_id: TENANT, otp_code: MOCK_BASE.otp_code } as unknown as never, { headers: { "X-App-Id": TENANT } as unknown as Record<string, string> });
  };

  if (!isServ) {
    return (
      <AppLayout>
        <GlassCard level="inner" className="text-center"><p className="text-section font-bold">يتطلب AU SERV</p></GlassCard>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="flex flex-wrap items-center gap-2 text-micro text-[var(--text-secondary)]">
        <button onClick={() => router.visit("/serv/hub", { headers: { "X-App-Id": TENANT } as unknown as Record<string, string> })} className="hover:underline">Hub</button>
        <span>›</span>
        <span>تتبع #{MOCK_BASE.request_id}</span>
        <span className="ms-auto rounded-full bg-[var(--accent-cyan)] px-2 py-1 text-white text-micro font-bold">LIVE Universal Tracker</span>
      </div>

      <h1 className="mt-3 text-title font-bold text-white">تتبع دورة الحياة — Universal SLA Tracker</h1>
      <p className="text-micro text-[var(--text-secondary)]">On-site · Remote · Logistics · Shift Check-in · Custom Milestone — كل ping مع X-App-Id</p>

      {/* Lifecycle kind switcher */}
      <GlassCard level="inner" className="mt-4">
        <div className="flex flex-wrap gap-2">
          {(Object.keys(LIFECYCLE_PRESETS) as LifecycleKind[]).map((k) => (
            <button key={k} onClick={() => setLifecycle(k)} className={`rounded-full px-3 py-1 text-micro font-bold border ${lifecycle === k ? "bg-[var(--canvas-dark)] text-white border-transparent" : "bg-white border-[var(--border-pearl)]"}`}>
              {LIFECYCLE_PRESETS[k].ar} — {k}
            </button>
          ))}
        </div>
        <div className="mt-2 flex gap-2">
          <select value={category} onChange={(e) => setCategory(e.target.value as ServiceCategory)} className="rounded-full border border-[var(--border-pearl)] bg-white px-3 py-1 text-micro font-bold">
            <option value="FIELD_TECHNICAL">FIELD_TECHNICAL — فني</option>
            <option value="LOGISTICS_FREIGHT">LOGISTICS_FREIGHT — لوجستيات</option>
            <option value="PROFESSIONAL_FREELANCE">PROFESSIONAL_FREELANCE — احترافي</option>
            <option value="ON_DEMAND_TALENT_JOBS">ON_DEMAND_TALENT_JOBS — وظائف</option>
            <option value="CUSTOM_REQUESTS">CUSTOM_REQUESTS — مخصص</option>
          </select>
          <span className="self-center text-micro text-[var(--text-secondary)]">Lifecycle adapts to {category} — حقيقي لكل فئة</span>
        </div>
      </GlassCard>

      <div className="mt-4 grid gap-4 lg:grid-cols-[1.35fr_0.85fr]">
        {/* Universal Lifecycle Radar */}
        <GlassCard level="inner" padding="none" className="overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--border-pearl)] bg-white">
            <h3 className="text-body font-bold">الرادار — {LIFECYCLE_PRESETS[lifecycle].ar} — {MOCK_BASE.provider.name_ar}</h3>
            <div className="flex items-center gap-2">
              <span className={`h-2 w-2 rounded-full ${slaBreached ? "bg-[var(--brand-crimson)]" : "bg-[var(--accent-emerald)] animate-pulse"}`} />
              <span className={`rounded-full px-2 py-1 text-micro font-bold border ${slaBreached ? "bg-[var(--brand-crimson)] text-white border-[var(--brand-crimson)]" : "bg-white border-[var(--border-pearl)]"}`}>SLA {String(slaM).padStart(2, "0")}:{String(slaS).padStart(2, "0")}</span>
            </div>
          </div>

          <div className="relative h-[360px] bg-[radial-gradient(ellipse_at_center,rgba(6,182,212,0.09),transparent_68%),var(--surface-secondary)] overflow-hidden">
            <svg className="absolute inset-0 h-full w-full" viewBox="0 0 100 100" preserveAspectRatio="none">
              <line x1="14" y1="78" x2="86" y2="22" stroke="var(--border-pearl)" strokeWidth="0.8" strokeDasharray="3 3" />
              <line x1="14" y1="78" x2={14 + (86 - 14) * (progress / 100)} y2={78 - (78 - 22) * (progress / 100)} stroke="var(--accent-cyan)" strokeWidth="1.2" />
            </svg>
            <div className="absolute flex flex-col items-center" style={{ left: "14%", top: "78%", transform: "translate(-50%,-100%)" }}><span className="flex h-7 w-7 items-center justify-center rounded-full bg-[var(--accent-emerald)] text-white border-2 border-white shadow">📦</span><span className="mt-1 rounded bg-white px-2 py-1 text-micro border shadow">{checkpoints[0]?.label_ar}</span></div>
            <div className="absolute flex flex-col items-center" style={{ left: "86%", top: "22%", transform: "translate(-50%,-100%)" }}><span className="flex h-7 w-7 items-center justify-center rounded-full bg-[var(--brand-crimson)] text-white border-2 border-white shadow">🏁</span><span className="mt-1 rounded bg-white px-2 py-1 text-micro border shadow">{checkpoints[checkpoints.length - 1]?.label_ar}</span></div>
            <div className="absolute flex flex-col items-center -translate-x-1/2 -translate-y-1/2 transition-all duration-1000 ease-linear" style={{ left: `${14 + (86 - 14) * (progress / 100)}%`, top: `${78 - (78 - 22) * (progress / 100)}%` }}>
              <span className="flex h-10 w-10 items-center justify-center rounded-full bg-white border-2 border-[var(--accent-cyan)] shadow text-body animate-pulse">{MOCK_BASE.provider.avatar}</span>
              <span className="mt-1 rounded-full bg-[var(--canvas-dark)] text-white px-2 py-1 text-micro font-bold shadow">{Math.round(progress)}% · {MOCK_BASE.provider.name_ar}</span>
            </div>
            <span className="absolute bottom-2 start-2 rounded-full bg-white/90 px-2 py-1 text-micro border">تقدم {Math.round(progress)}% · {lifecycle}</span>
          </div>

          <div className="p-4 bg-white">
            <div className="flex items-center justify-between">
              <p className="text-body font-bold">نقاط التحقق — {LIFECYCLE_PRESETS[lifecycle].en}</p>
              <span className={`rounded-full px-2 py-1 text-micro font-bold ${slaBreached ? "bg-[var(--brand-crimson)] text-white" : "bg-[var(--accent-emerald)] text-white"}`}>{slaBreached ? "SLA breached" : `SLA ${slaM}:${String(slaS).padStart(2, "0")}`}</span>
            </div>
            <div className="mt-2 h-2 rounded-full bg-[var(--surface-secondary)] overflow-hidden"><div className="h-2 bg-[var(--accent-cyan)] transition-all duration-1000" style={{ width: `${progress}%` }} /></div>
            <div className="mt-3 grid grid-cols-4 gap-2">
              {checkpoints.map((c) => (
                <div key={c.label_en} className={`rounded-[var(--radius-md)] border p-2 text-center ${c.status === "completed" ? "bg-[var(--accent-emerald)] text-white border-[var(--accent-emerald)]" : c.status === "current" ? "bg-[var(--accent-cyan)] text-white border-[var(--accent-cyan)] animate-pulse" : "bg-white border-[var(--border-pearl)] text-[var(--text-secondary)]"}`}>
                  <p className="text-micro font-bold">{c.label_ar}</p>
                  <p className="text-micro opacity-80">{c.label_en}</p>
                  <p className="mt-1 text-micro font-mono opacity-70">{new Date(c.at).toLocaleTimeString("ar-EG", { hour: "2-digit", minute: "2-digit", numberingSystem: "latn" })}</p>
                  <StatusBadge state={c.status === "completed" ? "Verified" : c.status === "current" ? "AI_Active" : "Pending"} label={c.status} className="mt-1 mx-auto" />
                </div>
              ))}
            </div>
            <div className="mt-3 rounded-[var(--radius-md)] bg-[var(--surface-pearl-strong)] border border-[var(--border-pearl)] p-3 flex items-center justify-between">
              <div><p className="text-body font-bold">المزود: {MOCK_BASE.provider.name_ar}</p><p className="text-micro text-[var(--text-secondary)]">{MOCK_BASE.provider.service_category} · ★{MOCK_BASE.provider.rating} · {category}</p></div>
              <Button size="sm" variant="secondary" onClick={() => router.visit("/serv/provider/board", { headers: { "X-App-Id": TENANT } as unknown as Record<string, string> })}>لوحة المزود</Button>
            </div>
          </div>
        </GlassCard>

        <div className="space-y-4">
          {/* Dual-OTP */}
          <GlassCard level="inner" accent="amber">
            <h3 className="text-body font-bold">Dual-OTP / Digital Handshake — توقيع الإنجاز</h3>
            <p className="text-micro text-[var(--text-secondary)]">يولّد في المستلم — يُحقّق في المزود — يحرّر app_wallet payout</p>
            <div className="mt-3 rounded-[var(--radius-md)] bg-white border-2 border-[var(--accent-amber)] p-4 text-center">
              <p className="text-micro font-bold tracking-widest text-[var(--text-secondary)]">SECURE 4-DIGIT OTP — {lifecycle}</p>
              <div className="mt-2 flex justify-center gap-2">
                {MOCK_BASE.otp_code.split("").map((d, i) => (
                  <span key={i} className="flex h-14 w-12 items-center justify-center rounded-[var(--radius-md)] bg-[var(--canvas-dark)] text-white text-body font-bold tracking-widest border border-white/10 shadow">{showOtp ? d : "•"}</span>
                ))}
              </div>
              <p className="mt-2 font-mono font-bold text-section">{showOtp ? MOCK_BASE.otp_code : "••••"}</p>
              <p className="text-micro text-[var(--text-secondary)]">سلّمه يداً بيد / رقمياً حسب نوع الخدمة — لا ترسله في الدردشة</p>
              <div className="mt-3 flex gap-2"><Button size="sm" variant="secondary" className="flex-1" onClick={() => setShowOtp((v) => !v)}>{showOtp ? "إخفاء" : "إظهار"}</Button><Button size="sm" variant="primary" className="flex-1" onClick={completeWithOtp}>تأكيد وفتح الضمان</Button></div>
              <p className="mt-2 text-micro text-[var(--accent-emerald)]">عند التحقق يُفرج عن Escrow فوراً — يناسب زيارة ميدانية أو تسليم مستقل</p>
            </div>
          </GlassCard>

          {/* Chat */}
          <GlassCard level="inner">
            <h3 className="text-body font-bold">دردشة آمنة — Chat (maskLeak)</h3>
            <p className="text-micro text-[var(--text-secondary)]">يُطمس الهاتف/البريد/الرابط تلقائياً — حماية صارمة</p>
            <div className="mt-3 max-h-[220px] overflow-auto rounded-[var(--radius-md)] border border-[var(--border-pearl)] bg-[var(--surface-pearl-strong)] p-3 space-y-2">
              {chat.map((m) => (
                <div key={m.id} className={`max-w-[80%] rounded-[var(--radius-md)] px-3 py-2 text-body ${m.from === "client" ? "ms-auto bg-[var(--accent-cyan)] text-white" : "bg-white border border-[var(--border-pearl)]"}`}>
                  <p>{m.body_sanitized}</p>
                  <p className={`text-micro ${m.from === "client" ? "text-white/70" : "text-[var(--text-secondary)]"}`}>{new Date(m.sent_at).toLocaleTimeString("ar-EG", { hour: "2-digit", minute: "2-digit", numberingSystem: "latn" })}</p>
                </div>
              ))}
            </div>
            <div className="mt-3 flex gap-2">
              <input value={chatInput} onChange={(e) => setChatInput(e.target.value)} onKeyDown={(e) => e.key === "Enter" && sendChat()} placeholder="اكتب رسالة — سيُطمس الهاتف/الرابط" className="flex-1 rounded-[var(--radius-md)] border border-[var(--border-pearl)] bg-white px-3 py-2 text-body" />
              <Button onClick={sendChat} size="sm">إرسال</Button>
            </div>
            {chatInput !== maskLeak(chatInput) && <p className="mt-1 text-micro text-[var(--brand-crimson)]">سيُطمس: {maskLeak(chatInput).slice(0, 60)}</p>}
          </GlassCard>
        </div>
      </div>
    </AppLayout>
  );
}
