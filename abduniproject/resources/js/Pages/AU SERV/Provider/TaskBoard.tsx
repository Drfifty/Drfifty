// AU SERV — Universal Provider & Worker Command Center — Strict TS ZERO any
import { useEffect, useMemo, useState } from "react";
import { router, usePage } from "@inertiajs/react";
import AppLayout from "@/Layouts/AppLayout";
import Button from "@/Components/UI/Button";
import GlassCard from "@/Components/UI/GlassCard";
import Modal from "@/Components/UI/Modal";
import StatusBadge from "@/Components/UI/StatusBadge";
import { maskLeak } from "@/Utils/sanitize";
import type { SharedPageProps } from "@/Types/global.d";
import type { ChatMessage, ServiceCategory, TaskOffer } from "@/Types/auserv.d";

const TENANT: "AU SERV" = "AU SERV";

function fmt(minor: number): string {
  return new Intl.NumberFormat("ar-EG", { style: "currency", currency: "EGP", numberingSystem: "latn" }).format(minor / 100);
}

const MOCK_OFFERS: TaskOffer[] = [
  { id: "t1", app_id: TENANT, service_category: "LOGISTICS_FREIGHT", title_ar: "توصيل طرد — وسط البلد → التجمع", title_en: "Parcel Delivery", pickup_label: "وسط البلد", dropoff_label: "التجمع", distance_km: 12.4, fee_minor: 5200, currency: "EGP", expires_at: new Date(Date.now() + 44 * 1000).toISOString(), status: "incoming", mutex_locked: false, otp_required: "4829", is_bid: false },
  { id: "t2", app_id: TENANT, service_category: "FIELD_TECHNICAL", title_ar: "صيانة تكييف — مدينة نصر", title_en: "AC Repair", pickup_label: "العميل — مدينة نصر", dropoff_label: "موقع الخدمة", distance_km: 3.2, fee_minor: 8500, currency: "EGP", expires_at: new Date(Date.now() + 22 * 1000).toISOString(), status: "incoming", mutex_locked: false, otp_required: "7391", is_bid: false },
  { id: "t3", app_id: TENANT, service_category: "PROFESSIONAL_FREELANCE", title_ar: "مناقصة تصميم — هوية بصرية", title_en: "Brand Design Tender", pickup_label: "عن بُعد — Remote", dropoff_label: "تسليم رقمي", distance_km: 0, fee_minor: 15000, currency: "EGP", expires_at: new Date(Date.now() + 58 * 1000).toISOString(), status: "incoming", mutex_locked: false, otp_required: "1056", is_bid: true, bid_minor: 12000 },
  { id: "t4", app_id: TENANT, service_category: "ON_DEMAND_TALENT_JOBS", title_ar: "مناوبة حراسة — مول — 8 ساعات", title_en: "Security Shift 8h", pickup_label: "مول — الشيخ زايد", dropoff_label: "موقع المناوبة", distance_km: 5, fee_minor: 8000, currency: "EGP", expires_at: new Date(Date.now() + 35 * 1000).toISOString(), status: "incoming", mutex_locked: false, otp_required: "6642", is_bid: false },
  { id: "t5", app_id: TENANT, service_category: "CUSTOM_REQUESTS", title_ar: "طلب مخصص — ترميم شقة بمراحل", title_en: "Custom Renovation Milestones", pickup_label: "المعادي", dropoff_label: "شقة العميل", distance_km: 4.5, fee_minor: 45000, currency: "EGP", expires_at: new Date(Date.now() + 50 * 1000).toISOString(), status: "incoming", mutex_locked: false, otp_required: "2098", is_bid: true, bid_minor: 40000 },
];

const MOCK_CHAT: ChatMessage[] = [
  { id: "m1", from: "client", body_sanitized: "مرحبا، هل يمكنك الوصول خلال 10 دقائق؟", sent_at: new Date(Date.now() - 60000).toISOString() },
];

export default function UniversalProviderTaskBoard() {
  const { props } = usePage<SharedPageProps>();
  const isServ = (props.tenant?.app_id ?? props.app_id) === TENANT;

  const [offers, setOffers] = useState<TaskOffer[]>(MOCK_OFFERS);
  const [categoryFilter, setCategoryFilter] = useState<ServiceCategory | "all">("all");
  const [now, setNow] = useState<number>(Date.now());
  const [otpTarget, setOtpTarget] = useState<TaskOffer | null>(null);
  const [otpInput, setOtpInput] = useState<string>("");
  const [otpError, setOtpError] = useState<string>("");
  const [bidAmounts, setBidAmounts] = useState<Record<string, string>>({});
  const [chat, setChat] = useState<ChatMessage[]>(MOCK_CHAT);
  const [chatInput, setChatInput] = useState<string>("");

  useEffect(() => {
    const t = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(t);
  }, []);

  useEffect(() => {
    setOffers((prev) => prev.map((o) => (o.status === "incoming" && new Date(o.expires_at).getTime() <= now ? { ...o, status: "expired" } : o)));
  }, [now]);

  const filteredOffers = useMemo(() => offers.filter((o) => categoryFilter === "all" || o.service_category === categoryFilter), [offers, categoryFilter]);
  const incoming = useMemo(() => filteredOffers.filter((o) => o.status === "incoming"), [filteredOffers]);
  const active = useMemo(() => offers.find((o) => o.status === "accepted") ?? null, [offers]);

  const acceptJob = (id: string): void => {
    setOffers((prev) => prev.map((o) => (o.id === id ? { ...o, status: "accepted", mutex_locked: true } : o.status === "incoming" ? { ...o, status: "rejected" } : o)));
    router.post(`/serv/provider/${id}/accept`, { app_id: TENANT } as unknown as never, { headers: { "X-App-Id": TENANT } as unknown as Record<string, string>, preserveScroll: true });
  };

  const rejectJob = (id: string): void => {
    setOffers((prev) => prev.map((o) => (o.id === id ? { ...o, status: "rejected" } : o)));
  };

  const submitBid = (id: string): void => {
    const amountStr = bidAmounts[id];
    const amount = Number(amountStr);
    if (!amountStr || Number.isNaN(amount) || amount <= 0) return;
    setOffers((prev) => prev.map((o) => (o.id === id ? { ...o, status: "bidding", bid_minor: amount * 100, is_bid: true } : o)));
    router.post(`/serv/provider/${id}/bid`, { app_id: TENANT, bid_minor: amount * 100 } as unknown as never, { headers: { "X-App-Id": TENANT } as unknown as Record<string, string> });
  };

  const pressKey = (d: string): void => {
    if (otpInput.length >= 4) return;
    const next = otpInput + d;
    setOtpInput(next);
    setOtpError("");
    if (next.length === 4 && otpTarget) {
      if (next === otpTarget.otp_required) {
        setOffers((prev) => prev.map((o) => (o.id === otpTarget.id ? { ...o, status: "completed" } : o)));
        router.post(`/serv/provider/${otpTarget.id}/otp-verify`, { app_id: TENANT, otp_code: next } as unknown as never, { headers: { "X-App-Id": TENANT } as unknown as Record<string, string> });
        setOtpTarget(null);
        setOtpInput("");
      } else {
        setOtpError("OTP غير صحيح — حاول مرة أخرى");
      }
    }
  };

  const backspace = (): void => {
    setOtpInput((v) => v.slice(0, -1));
    setOtpError("");
  };

  const sendChat = (): void => {
    if (!chatInput.trim()) return;
    const sanitized = maskLeak(chatInput);
    setChat((prev) => [...prev, { id: `m${prev.length + 1}`, from: "provider", body_sanitized: sanitized, sent_at: new Date().toISOString() }]);
    setChatInput("");
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
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-title font-bold text-white">مركز قيادة المزود — Universal Command Center</h1>
        <span className="rounded-full bg-[var(--accent-cyan)] px-3 py-1 text-micro font-bold text-white">TENANT ISOLATED ✓ AU SERV · Universal</span>
      </div>
      <p className="text-micro text-[var(--text-secondary)]">
        5 فئات — FIELD_TECHNICAL · LOGISTICS_FREIGHT · PROFESSIONAL_FREELANCE · ON_DEMAND_TALENT_JOBS · CUSTOM_REQUESTS — Mutex Lock + Bid + OTP
      </p>

      {/* Category filter for queue */}
      <GlassCard level="inner" className="mt-4">
        <div className="flex flex-wrap gap-2">
          {(["all", "FIELD_TECHNICAL", "LOGISTICS_FREIGHT", "PROFESSIONAL_FREELANCE", "ON_DEMAND_TALENT_JOBS", "CUSTOM_REQUESTS"] as const).map((c) => (
            <button key={c} onClick={() => setCategoryFilter(c as ServiceCategory | "all")} className={`rounded-full px-3 py-1 text-micro font-bold border ${categoryFilter === c ? "bg-[var(--canvas-dark)] text-white border-transparent" : "bg-white border-[var(--border-pearl)]"}`}>
              {c === "all" ? "الكل — All" : c === "FIELD_TECHNICAL" ? "فني" : c === "LOGISTICS_FREIGHT" ? "لوجستيات" : c === "PROFESSIONAL_FREELANCE" ? "احترافي" : c === "ON_DEMAND_TALENT_JOBS" ? "وظائف عند الطلب" : "مخصص"}
            </button>
          ))}
        </div>
      </GlassCard>

      <div className="mt-4 grid gap-4 lg:grid-cols-[1.35fr_0.85fr]">
        {/* Multi-role Queue */}
        <GlassCard level="inner" padding="none" className="overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--border-pearl)] bg-white">
            <h3 className="text-body font-bold">قائمة الطلبات — Multi-role Queue</h3>
            <span className="rounded-full bg-[var(--accent-amber)] px-2 py-1 text-micro font-bold text-black">{incoming.length} واردة</span>
          </div>

          {active && (
            <div className="mx-4 mt-4 rounded-[var(--radius-md)] border-2 border-[var(--accent-emerald)] bg-[rgba(16,185,129,0.08)] p-3">
              <div className="flex items-center gap-2">
                <span className="rounded-full bg-[var(--accent-emerald)] px-2 py-1 text-micro text-white font-bold">مقبول ✓ Mutex LOCKED</span>
                <span className="ms-auto rounded-full bg-white border border-[var(--border-pearl)] px-2 py-1 text-micro">{active.service_category} · {fmt(active.fee_minor)}</span>
              </div>
              <p className="mt-2 text-body font-bold">{active.title_ar}</p>
              <p className="text-micro text-[var(--text-secondary)]">{active.pickup_label} → {active.dropoff_label} · {active.service_category}</p>
              <div className="mt-3 flex gap-2">
                <Button size="sm" onClick={() => setOtpTarget(active)} className="flex-1">إدخال OTP — تسليم و تحصيل</Button>
                <Button size="sm" variant="secondary" onClick={() => router.visit(`/serv/tracking/${active.id}`, { headers: { "X-App-Id": TENANT } as unknown as Record<string, string> })}>تتبع</Button>
              </div>
            </div>
          )}

          <div className="p-4 flex flex-col gap-3 max-h-[620px] overflow-auto">
            {incoming.length === 0 && !active && <p className="text-center text-body text-[var(--text-secondary)] py-8">لا طلبات في هذه الفئة — في انتظار dispatch شامل</p>}
            {incoming.map((o) => {
              const leftMs = Math.max(0, new Date(o.expires_at).getTime() - now);
              const s = Math.floor(leftMs / 1000);
              const pct = Math.max(0, (leftMs / 60000) * 100);
              const urgent = s <= 15;
              return (
                <div key={o.id} className={`rounded-[var(--radius-md)] border-2 p-3 bg-white ${urgent ? "border-[var(--brand-crimson)]" : "border-[var(--border-pearl)]"}`}>
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="text-body font-bold">{o.title_ar}</p>
                      <p className="text-micro text-[var(--text-secondary)]">{o.service_category} · {o.pickup_label} → {o.dropoff_label} · {o.distance_km}km</p>
                      <p className="text-micro font-mono text-[var(--text-secondary)]">{o.title_en} · {o.is_bid ? "Task Bidding" : "Instant"}</p>
                    </div>
                    <span className={`rounded-full px-2 py-1 text-micro font-bold border ${urgent ? "bg-[var(--brand-crimson)] text-white border-[var(--brand-crimson)]" : "bg-white border-[var(--border-pearl)]"}`}>{s}s</span>
                  </div>
                  <div className="mt-2 h-1.5 rounded-full bg-[var(--surface-secondary)] overflow-hidden"><div className={`h-1.5 ${urgent ? "bg-[var(--brand-crimson)]" : "bg-[var(--accent-amber)]"}`} style={{ width: `${pct}%` }} /></div>
                  <div className="mt-2 flex items-center justify-between">
                    <span className="font-mono font-bold text-body">{fmt(o.fee_minor)} {o.bid_minor ? `· عرضك ${fmt(o.bid_minor)}` : ""}</span>
                    <StatusBadge state={o.is_bid ? "AI_Active" : "Pending"} label={o.is_bid ? "BIDDING" : o.status} />
                  </div>
                  <div className="mt-3 flex gap-2">
                    {o.is_bid ? (
                      <>
                        <input
                          value={bidAmounts[o.id] ?? ""}
                          onChange={(e) => setBidAmounts((prev) => ({ ...prev, [o.id]: e.target.value }))}
                          placeholder="عرضك EGP"
                          type="number"
                          className="flex-1 rounded-[var(--radius-md)] border border-[var(--border-pearl)] bg-white px-3 py-2 text-body font-mono"
                        />
                        <Button size="sm" onClick={() => submitBid(o.id)} disabled={!!active || !bidAmounts[o.id]}>إرسال عرض — Bid</Button>
                      </>
                    ) : (
                      <>
                        <Button size="sm" className="flex-1" onClick={() => acceptJob(o.id)} disabled={!!active}>قبول فوري — Accept (Mutex)</Button>
                        <Button size="sm" variant="secondary" onClick={() => rejectJob(o.id)}>رفض</Button>
                      </>
                    )}
                  </div>
                  {active && <p className="mt-1 text-micro text-[var(--text-secondary)]">لديك مهمة نشطة — أكملها قبل قبول جديدة</p>}
                </div>
              );
            })}
            {offers.filter((o) => o.status !== "incoming").length > 0 && (
              <div className="mt-2 border-t border-[var(--border-pearl)] pt-3">
                <p className="text-micro font-bold text-[var(--text-secondary)]">سجل — History</p>
                <div className="mt-2 flex flex-col gap-1">
                  {offers.filter((o) => o.status !== "incoming").slice(0, 6).map((o) => (
                    <div key={o.id} className="flex justify-between rounded-[var(--radius-md)] bg-[var(--surface-pearl-strong)] border border-[var(--border-pearl)] px-3 py-2 text-micro">
                      <span>{o.title_ar}</span>
                      <StatusBadge state={o.status === "completed" ? "Verified" : o.status === "accepted" ? "AI_Active" : o.status === "expired" ? "Danger" : "Pending"} label={o.status} />
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </GlassCard>

        <div className="space-y-4">
          <GlassCard level="inner" accent="emerald">
            <h3 className="text-body font-bold">تحقق OTP — Universal Handshake</h3>
            <p className="text-micro text-[var(--text-secondary)]">4 أرقام — يناسب زيارة فني أو تسليم طرد أو إنجاز مستقل أو نهاية مناوبة</p>
            {active ? (
              <div className="mt-3 rounded-[var(--radius-md)] bg-white border border-[var(--border-pearl)] p-3 text-center">
                <p className="text-micro text-[var(--text-secondary)]">المهمة النشطة — OTP مطلوب</p>
                <p className="font-mono font-bold text-section">{active.otp_required.slice(0, 2)}••</p>
                <Button size="sm" className="mt-2 w-full" onClick={() => setOtpTarget(active)}>فتح لوحة OTP — Keypad</Button>
              </div>
            ) : (
              <p className="mt-3 text-center text-body text-[var(--text-secondary)]">لا مهمة نشطة — اقبل طلباً أو قدّم عرضاً أولاً</p>
            )}
            <p className="mt-2 text-micro text-[var(--text-secondary)]">Mutex Lock يمنع ازدواج القبول — أول قبول يفوز</p>
          </GlassCard>

          <GlassCard level="inner">
            <h3 className="text-body font-bold">دردشة مع العميل — Leak Interceptor</h3>
            <div className="mt-2 max-h-[220px] overflow-auto rounded-[var(--radius-md)] border border-[var(--border-pearl)] bg-[var(--surface-pearl-strong)] p-3 space-y-2">
              {chat.map((m) => (
                <div key={m.id} className={`max-w-[85%] rounded-[var(--radius-md)] px-3 py-2 text-body ${m.from === "provider" ? "ms-auto bg-[var(--canvas-dark)] text-white" : "bg-white border border-[var(--border-pearl)]"}`}>
                  <p>{m.body_sanitized}</p>
                  <p className={`text-micro ${m.from === "provider" ? "text-white/60" : "text-[var(--text-secondary)]"}`}>{new Date(m.sent_at).toLocaleTimeString("ar-EG", { hour: "2-digit", minute: "2-digit", numberingSystem: "latn" })}</p>
                </div>
              ))}
            </div>
            <div className="mt-3 flex gap-2">
              <input value={chatInput} onChange={(e) => setChatInput(e.target.value)} onKeyDown={(e) => e.key === "Enter" && sendChat()} placeholder="رد — سيُطمس الهاتف/الرابط" className="flex-1 rounded-[var(--radius-md)] border border-[var(--border-pearl)] bg-white px-3 py-2 text-body" />
              <Button size="sm" onClick={sendChat}>إرسال</Button>
            </div>
            {chatInput !== maskLeak(chatInput) && <p className="mt-1 text-micro text-[var(--brand-crimson)]">سيُطمس: {maskLeak(chatInput).slice(0, 60)}</p>}
          </GlassCard>
        </div>
      </div>

      {/* OTP Modal */}
      <Modal open={otpTarget !== null} onOpenChange={(o) => !o && (setOtpTarget(null), setOtpInput(""), setOtpError(""))} title="تحقق OTP الشامل — أدخل رمز العميل">
        <div className="space-y-3">
          <p className="text-micro text-[var(--text-secondary)]">اطلب من العميل رمز 4 أرقام — يناسب كل الفئات الخمس — الإدخال الصحيح يحرّر payout فوراً</p>
          <div className="flex justify-center gap-2">
            {[0, 1, 2, 3].map((i) => (
              <span key={i} className={`flex h-14 w-12 items-center justify-center rounded-[var(--radius-md)] border-2 text-body font-bold ${otpInput[i] ? "bg-[var(--canvas-dark)] text-white border-[var(--canvas-dark)]" : "bg-white border-[var(--border-pearl)] text-[var(--text-secondary)]"}`}>{otpInput[i] ?? "•"}</span>
            ))}
          </div>
          {otpError && <p className="text-center text-micro text-[var(--brand-crimson)]">{otpError}</p>}
          {otpTarget && <p className="text-center text-micro text-[var(--text-secondary)]">تلميح اختبار: {otpTarget.otp_required} — لا يُعرض بالإنتاج</p>}
          <div className="grid grid-cols-3 gap-2">
            {["1", "2", "3", "4", "5", "6", "7", "8", "9"].map((d) => (
              <button key={d} onClick={() => pressKey(d)} className="h-14 rounded-[var(--radius-md)] bg-white border border-[var(--border-pearl)] text-body font-bold hover:bg-[var(--surface-pearl-strong)] active:translate-y-px">{d}</button>
            ))}
            <button onClick={backspace} className="h-14 rounded-[var(--radius-md)] bg-[var(--surface-secondary)] border border-[var(--border-pearl)] text-body font-bold">⌫</button>
            <button onClick={() => pressKey("0")} className="h-14 rounded-[var(--radius-md)] bg-white border border-[var(--border-pearl)] text-body font-bold hover:bg-[var(--surface-pearl-strong)]">0</button>
            <button onClick={() => (setOtpInput(""), setOtpError(""))} className="h-14 rounded-[var(--radius-md)] bg-white border border-[var(--border-pearl)] text-body font-bold">مسح</button>
          </div>
          <div className="flex gap-2">
            <Button size="sm" variant="secondary" className="flex-1" onClick={() => { setOtpTarget(null); setOtpInput(""); setOtpError(""); }}>إلغاء</Button>
            <Button size="sm" className="flex-1" onClick={() => otpInput.length === 4 && otpTarget && pressKey("")} disabled={otpInput.length !== 4}>تحقق</Button>
          </div>
          <p className="text-center text-micro text-[var(--text-secondary)]">X-App-Id: AU SERV · Escrow release on success — universal</p>
        </div>
      </Modal>
    </AppLayout>
  );
}
