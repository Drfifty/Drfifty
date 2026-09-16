// AU SERV — Universal Discovery & Service Radar — app_id="AU SERV" — Strict TS ZERO any
import { useMemo, useState } from "react";
import { router, usePage } from "@inertiajs/react";
import AppLayout from "@/Layouts/AppLayout";
import Button from "@/Components/UI/Button";
import GlassCard from "@/Components/UI/GlassCard";
import StatusBadge from "@/Components/UI/StatusBadge";
import type { SharedPageProps } from "@/Types/global.d";
import type { AvailabilityMode, ProviderProfile, ServiceCategory, TechnicianSkill } from "@/Types/auserv.d";

const TENANT: "AU SERV" = "AU SERV";

const CATEGORY_META: { key: ServiceCategory | "all"; ar: string; en: string; icon: string }[] = [
  { key: "all", ar: "الكل", en: "All", icon: "🌐" },
  { key: "FIELD_TECHNICAL", ar: "فني وصيانة", en: "Technical & Maintenance", icon: "🔧" },
  { key: "LOGISTICS_FREIGHT", ar: "لوجستيات ونقل", en: "Logistics & Moving", icon: "🚚" },
  { key: "PROFESSIONAL_FREELANCE", ar: "احترافي ومستقل", en: "Professional & Freelance", icon: "💻" },
  { key: "ON_DEMAND_TALENT_JOBS", ar: "وظائف وموظفون", en: "On-Demand Jobs & Staffing", icon: "👷" },
  { key: "CUSTOM_REQUESTS", ar: "طلبات مخصصة", en: "Custom Tenders", icon: "📋" },
];

const MOCK_PROVIDERS: ProviderProfile[] = [
  { id: "p1", app_id: TENANT, name_ar: "أحمد — كهرباء منازل", name_en: "Ahmed — Electric", service_category: "FIELD_TECHNICAL", skills: ["electric","appliance"], certifications: ["licensed_electrician"], rating: 4.8, completed_jobs: 312, status: "available", availability_mode: "INSTANT", geo_lat: 30.04, geo_lng: 31.23, distance_km: 1.2, eta_minutes: 6, avatar: "👨‍🔧" },
  { id: "p2", app_id: TENANT, name_ar: "سارة — سباكة و HVAC", name_en: "Sara — HVAC", service_category: "FIELD_TECHNICAL", skills: ["plumbing","hvac"], certifications: ["certified_plumber","hvac_cert"], rating: 4.9, completed_jobs: 210, status: "available", availability_mode: "INSTANT", geo_lat: 30.05, geo_lng: 31.24, distance_km: 0.9, eta_minutes: 5, avatar: "🧑‍🔧" },
  { id: "p3", app_id: TENANT, name_ar: "خالد — نقل وشحن", name_en: "Khaled — Freight", service_category: "LOGISTICS_FREIGHT", vehicle_class: "cargo_truck", skills: ["auto_mechanics"], certifications: ["driving_license"], rating: 4.6, completed_jobs: 180, status: "available", availability_mode: "SCHEDULED", geo_lat: 30.06, geo_lng: 31.21, distance_km: 2.4, eta_minutes: 11, avatar: "🚚" },
  { id: "p4", app_id: TENANT, name_ar: "منى — مصممة UI/UX", name_en: "Mona — Designer", service_category: "PROFESSIONAL_FREELANCE", freelance_category: "design", skills: ["design"], certifications: [], rating: 4.95, completed_jobs: 540, status: "available", availability_mode: "JOB_APPLICATION", geo_lat: 30.02, geo_lng: 31.22, distance_km: 3.1, eta_minutes: 0, avatar: "🎨" },
  { id: "p5", app_id: TENANT, name_ar: "محمد — محاسب قانوني", name_en: "Mohamed — CPA", service_category: "PROFESSIONAL_FREELANCE", freelance_category: "accounting", skills: ["accounting"], certifications: ["cpa"], rating: 4.88, completed_jobs: 210, status: "available", availability_mode: "SCHEDULED", geo_lat: 30.03, geo_lng: 31.25, distance_km: 1.7, eta_minutes: 0, avatar: "🧮" },
  { id: "p6", app_id: TENANT, name_ar: "عمر — طاقم فعاليات", name_en: "Omar — Event Crew", service_category: "ON_DEMAND_TALENT_JOBS", skills: ["event_crew","security"], certifications: ["security_clearance"], rating: 4.5, completed_jobs: 98, status: "available", availability_mode: "INSTANT", geo_lat: 30.01, geo_lng: 31.27, distance_km: 4.8, eta_minutes: 18, avatar: "👷" },
  { id: "p7", app_id: TENANT, name_ar: "ليلى — تنظيف ومنزل", name_en: "Laila — Housekeeping", service_category: "ON_DEMAND_TALENT_JOBS", skills: ["cleaning","housekeeping"], certifications: [], rating: 4.92, completed_jobs: 310, status: "available", availability_mode: "HOURLY_DAILY" as unknown as AvailabilityMode, geo_lat: 30.03, geo_lng: 31.26, distance_km: 1.5, eta_minutes: 7, avatar: "🧹" },
  { id: "p8", app_id: TENANT, name_ar: "يوسف — طلب مخصص", name_en: "Youssef — Custom Tender", service_category: "CUSTOM_REQUESTS", skills: ["carpentry","painting"], certifications: [], rating: 4.7, completed_jobs: 77, status: "available", availability_mode: "JOB_APPLICATION", geo_lat: 30.045, geo_lng: 31.24, distance_km: 0.6, eta_minutes: 4, avatar: "📋" },
  { id: "p9", app_id: TENANT, name_ar: "نقل سريع — موتوسيكل", name_en: "Express Courier", service_category: "LOGISTICS_FREIGHT", vehicle_class: "motorcycle", skills: ["cleaning"], certifications: ["driving_license"], rating: 4.7, completed_jobs: 420, status: "busy", availability_mode: "INSTANT", geo_lat: 30.04, geo_lng: 31.22, distance_km: 0.8, eta_minutes: 4, avatar: "🏍️" },
];

export default function UniversalHubIndex() {
  const { props } = usePage<SharedPageProps>();
  const isServ = (props.tenant?.app_id ?? props.app_id) === TENANT;

  const [category, setCategory] = useState<ServiceCategory | "all">("all");
  const [radius, setRadius] = useState<number>(5);
  const [skillFilter, setSkillFilter] = useState<TechnicianSkill | "all">("all");
  const [availability, setAvailability] = useState<AvailabilityMode | "all">("all");
  const [hovered, setHovered] = useState<string | null>(null);

  const filtered = useMemo(() => {
    return MOCK_PROVIDERS.filter((p) => {
      if (category !== "all" && p.service_category !== category) return false;
      if (p.distance_km > radius) return false;
      if (skillFilter !== "all" && !p.skills.includes(skillFilter)) return false;
      if (availability !== "all" && p.availability_mode !== availability) return false;
      return true;
    });
  }, [category, radius, skillFilter, availability]);

  const availableCount = useMemo(() => filtered.filter((p) => p.status === "available").length, [filtered]);

  if (!isServ) {
    return (
      <AppLayout>
        <GlassCard level="inner" className="text-center">
          <p className="text-section font-bold">يتطلب AU SERV</p>
          <p className="text-body text-[var(--text-secondary)]">app_id الحالي: {String(props.tenant?.app_id ?? props.app_id)}</p>
        </GlassCard>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-title font-bold text-white">الاكتشاف الشامل — Universal Service Radar</h1>
        <span className="rounded-full bg-[var(--accent-cyan)] px-3 py-1 text-micro font-bold text-white">TENANT ISOLATED ✓ AU SERV</span>
      </div>
      <p className="text-micro text-[var(--text-secondary)]">
        5 فئات شاملة — FIELD_TECHNICAL · LOGISTICS_FREIGHT · PROFESSIONAL_FREELANCE · ON_DEMAND_TALENT_JOBS · CUSTOM_REQUESTS — كل مزود مع X-App-Id
      </p>

      {/* Multi-category switcher */}
      <GlassCard level="inner" className="mt-4">
        <h3 className="text-body font-bold">اختر الفئة — Category Switcher</h3>
        <div className="mt-3 grid gap-2 sm:grid-cols-3 lg:grid-cols-6">
          {CATEGORY_META.map((c) => (
            <button
              key={c.key}
              onClick={() => setCategory(c.key)}
              className={`text-start rounded-[var(--radius-md)] border-2 p-3 transition-all ${category === c.key ? "border-[var(--accent-cyan)] bg-[rgba(6,182,212,0.08)] shadow-sm" : "border-[var(--border-pearl)] bg-white hover:bg-[var(--surface-pearl)]"}`}
            >
              <div className="flex items-center gap-2">
                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-white border border-[var(--border-pearl)] text-body">{c.icon}</span>
                <span className="text-micro font-bold leading-tight">{c.ar}</span>
              </div>
              <p className="mt-1 text-micro text-[var(--text-secondary)]">{c.en}</p>
              <p className="mt-1 font-mono text-micro text-[var(--text-secondary)]">{c.key}</p>
              {category === c.key && <span className="mt-1 inline-block h-2 w-2 rounded-full bg-[var(--accent-cyan)]" />}
            </button>
          ))}
        </div>
        <div className="mt-2 flex flex-wrap gap-2">
          <span className="self-center text-micro text-[var(--text-secondary)]">{filtered.length} مزود ضمن {radius}كم · {availableCount} متاح</span>
        </div>
      </GlassCard>

      {/* Dynamic Filter Bar */}
      <GlassCard level="inner" className="mt-4">
        <h3 className="text-body font-bold">شريط الترشيح الديناميكي — Filters</h3>
        <div className="mt-3 grid gap-3 md:grid-cols-3">
          <div>
            <label className="text-micro font-bold">نطاق الموقع — Radius {radius} كم</label>
            <input type="range" min={1} max={15} step={1} value={radius} onChange={(e) => setRadius(Number(e.target.value))} className="mt-2 w-full accent-[var(--accent-cyan)]" />
            <p className="text-micro text-[var(--text-secondary)]">Location Radius</p>
          </div>
          <div>
            <label className="text-micro font-bold">مهارة / شهادة</label>
            <select value={skillFilter} onChange={(e) => setSkillFilter(e.target.value as TechnicianSkill | "all")} className="mt-1 w-full rounded-[var(--radius-md)] border border-[var(--border-pearl)] bg-white px-3 py-2 text-body">
              <option value="all">كل المهارات — All</option>
              <option value="electric">كهرباء</option>
              <option value="plumbing">سباكة</option>
              <option value="hvac">تكييف HVAC</option>
              <option value="carpentry">نجارة</option>
              <option value="auto_mechanics">ميكانيكا سيارات</option>
              <option value="software">برمجة</option>
              <option value="design">تصميم</option>
              <option value="accounting">محاسبة</option>
              <option value="security">أمن</option>
              <option value="cleaning">تنظيف</option>
            </select>
          </div>
          <div>
            <label className="text-micro font-bold">نمط التوافر — Availability</label>
            <select value={availability} onChange={(e) => setAvailability(e.target.value as AvailabilityMode | "all")} className="mt-1 w-full rounded-[var(--radius-md)] border border-[var(--border-pearl)] bg-white px-3 py-2 text-body">
              <option value="all">الكل</option>
              <option value="INSTANT">فوري Instant Dispatch</option>
              <option value="SCHEDULED">مجدول Scheduled</option>
              <option value="JOB_APPLICATION">تقديم وظيفة Job Application</option>
            </select>
            <div className="mt-1">
              <StatusBadge state={availability === "INSTANT" ? "Verified" : availability === "SCHEDULED" ? "Pending" : availability === "JOB_APPLICATION" ? "AI_Active" : "Anonymous"} label={availability === "all" ? "All Modes" : availability} />
            </div>
          </div>
        </div>
      </GlassCard>

      <div className="mt-4 grid gap-4 lg:grid-cols-[1.45fr_0.85fr]">
        {/* Service Radar Canvas */}
        <GlassCard level="inner" padding="none" className="overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--border-pearl)] bg-white">
            <h3 className="text-body font-bold">رادار الخدمات — Service Radar Canvas</h3>
            <span className="rounded-full bg-white border border-[var(--border-pearl)] px-2 py-1 text-micro">{filtered.length} ضمن {radius}كم</span>
          </div>
          <div className="relative h-[460px] bg-[radial-gradient(ellipse_at_center,rgba(6,182,212,0.09),transparent_68%),var(--surface-secondary)] overflow-hidden border-t border-[var(--border-pearl)]">
            <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 flex flex-col items-center">
              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-[var(--canvas-dark)] text-white border-2 border-white shadow">📍</span>
              <span className="mt-1 rounded-full bg-white px-2 py-1 text-micro border shadow">أنت — You</span>
            </div>
            <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-[var(--accent-cyan)]/35 bg-[rgba(6,182,212,0.06)] pointer-events-none" style={{ width: `${(radius / 15) * 82 + 10}%`, height: `${(radius / 15) * 82 + 10}%` }} />
            {filtered.map((p, idx) => {
              const angle = (idx * 53) % 360;
              const distPct = Math.min(44, (p.distance_km / 15) * 40 + 6);
              const rad = (angle * Math.PI) / 180;
              const x = 50 + Math.cos(rad) * distPct;
              const y = 50 + Math.sin(rad) * distPct;
              const isHovered = hovered === p.id;
              return (
                <button
                  key={p.id}
                  onMouseEnter={() => setHovered(p.id)}
                  onMouseLeave={() => setHovered(null)}
                  onClick={() => router.visit(`/serv/dispatch/create?provider=${p.id}`, { headers: { "X-App-Id": TENANT } as unknown as Record<string, string> })}
                  className={`absolute -translate-x-1/2 -translate-y-1/2 flex flex-col items-center transition-transform ${isHovered ? "scale-110 z-10" : ""}`}
                  style={{ left: `${x}%`, top: `${y}%` }}
                >
                  <span className={`flex h-9 w-9 items-center justify-center rounded-full border-2 shadow text-body ${p.status === "available" ? "bg-white border-[var(--accent-emerald)]" : "bg-white border-[var(--accent-amber)]"}`}>{p.avatar}</span>
                  <span className="mt-1 rounded-full bg-white border border-[var(--border-pearl)] px-2 py-1 text-micro font-bold shadow">{p.distance_km}km</span>
                  {isHovered && (
                    <span className="mt-1 rounded-[var(--radius-md)] bg-[var(--canvas-dark)] text-white px-2 py-1 text-micro whitespace-nowrap max-w-[180px] truncate">
                      {p.name_ar} · {p.service_category} · ★{p.rating}
                    </span>
                  )}
                </button>
              );
            })}
            {filtered.length === 0 && (
              <div className="absolute inset-0 flex items-center justify-center">
                <p className="rounded-full bg-white border border-[var(--border-pearl)] px-4 py-2 text-body text-[var(--text-secondary)]">لا مزودين — وسّع النطاق أو غيّر الفلتر</p>
              </div>
            )}
            <span className="absolute bottom-2 start-2 rounded-full bg-white/90 px-2 py-1 text-micro border">تقنيون · سائقون · مستقلون · مناوبات وظائف</span>
            <span className="absolute bottom-2 end-2 rounded-full bg-[var(--accent-cyan)] px-2 py-1 text-micro text-white font-bold">{availableCount} متاح</span>
          </div>
        </GlassCard>

        <div className="space-y-3">
          <GlassCard level="inner">
            <h3 className="text-body font-bold">أقرب المزودين — Universal Nearest</h3>
            <div className="mt-3 flex flex-col gap-2 max-h-[520px] overflow-auto pe-1">
              {filtered.slice(0, 8).map((p) => (
                <div key={p.id} className="flex items-center gap-3 rounded-[var(--radius-md)] border border-[var(--border-pearl)] bg-white p-3 hover:bg-[var(--surface-pearl)] transition-colors">
                  <span className="flex h-10 w-10 items-center justify-center rounded-full bg-[var(--surface-secondary)] border border-[var(--border-pearl)] text-body">{p.avatar}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-body font-bold truncate">{p.name_ar}</p>
                    <p className="text-micro text-[var(--text-secondary)] truncate">{p.service_category} · {p.skills.slice(0,2).join("·")} · {(p.certifications??[]).slice(0,1).join("")} · ★{p.rating}</p>
                    <p className="text-micro font-mono text-[var(--text-secondary)]">{p.distance_km}km · {p.availability_mode}</p>
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    <StatusBadge state={p.status === "available" ? "Verified" : "Pending"} label={p.status} />
                    <Button size="sm" disabled={p.status !== "available"} onClick={() => router.visit(`/serv/dispatch/create?provider=${p.id}`, { headers: { "X-App-Id": TENANT } as unknown as Record<string, string> })}>احجز</Button>
                  </div>
                </div>
              ))}
            </div>
            <Button size="sm" variant="secondary" className="mt-3 w-full" onClick={() => router.visit("/serv/dispatch/create", { headers: { "X-App-Id": TENANT } as unknown as Record<string, string> })}>إنشاء طلب شامل — Universal Request</Button>
          </GlassCard>

          <GlassCard level="inner" accent="amber">
            <h3 className="text-body font-bold">تغطية شاملة</h3>
            <p className="text-body leading-relaxed">فنيو منازل · لوجستيات · شحن ثقيل · مواهب برمجة/تصميم/قانون · طواقم فعاليات · حراسة · تنظيف · طلبات مخصصة بميزانيات مراحل</p>
            <p className="text-micro text-[var(--text-secondary)]">Total = Base + Distance/Duration/Hourly + Skill Premium → Escrow</p>
          </GlassCard>
        </div>
      </div>
    </AppLayout>
  );
}
