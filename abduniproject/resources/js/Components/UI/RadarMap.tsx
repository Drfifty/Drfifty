// خريطة رادار مكانية — Presentational فقط
// تستقبل بيانات عبر props — المنطق المكاني في useSpatialDispatch — لا استعلامات هنا
import { cn } from "@/Services/cn";

interface ProviderDot {
  id: string | number;
  xPct: number; // 0-100
  yPct: number;
  label?: string;
  accent?: "cyan" | "emerald" | "amber";
}

interface Props {
  providers: ProviderDot[];
  customer?: { xPct: number; yPct: number };
  radiusKm?: number;
  className?: string;
}

// حاوية خارجية Obsidian + شبكة داخلية Pearl — توازن هجين
export default function RadarMap({ providers, customer, radiusKm = 5, className }: Props) {
  return (
    <div
      className={cn(
        "relative h-[320px] overflow-hidden rounded-[var(--radius-lg)] border border-[var(--border-pearl)] bg-[var(--canvas-background)]",
        className,
      )}
      // خريطة تفاعلية — الإضاءة التقاربية عبر --cx/--cy من tokens.css
      aria-label="خريطة الرادار المكاني"
    >
      {/* شبكة */}
      <div
        aria-hidden
        className="absolute inset-0 opacity-[0.06]"
        style={{
          backgroundImage:
            "linear-gradient(rgba(250,250,250,.12) 1px, transparent 1px), linear-gradient(90deg, rgba(250,250,250,.12) 1px, transparent 1px)",
          backgroundSize: "28px 28px",
        }}
      />
      {/* نطاق تغطية */}
      <div className="absolute left-1/2 top-1/2 h-[220px] w-[220px] -translate-x-1/2 -translate-y-1/2 rounded-full border border-[var(--accent-cyan)]/25 bg-[var(--accent-cyan)]/5" />
      <div className="absolute left-1/2 top-1/2 h-[120px] w-[120px] -translate-x-1/2 -translate-y-1/2 rounded-full border border-[var(--accent-emerald)]/25 bg-[var(--accent-emerald)]/5" />
      {/* عميل */}
      {customer && (
        <div
          className="absolute -translate-x-1/2 -translate-y-1/2"
          style={{ left: `${customer.xPct}%`, top: `${customer.yPct}%` }}
        >
          <div className="grid h-10 w-10 place-items-center rounded-full border-2 border-white bg-[var(--accent-amber)] text-[11px] font-bold text-black">
            العميل
          </div>
        </div>
      )}
      {/* مزودون */}
      {providers.map((p) => (
        <div
          key={p.id}
          className={cn(
            "absolute grid h-8 w-8 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full border-2 border-white text-[11px] shadow",
            p.accent === "emerald" && "bg-[var(--accent-emerald)]",
            p.accent === "amber" && "bg-[var(--accent-amber)] text-black",
            (!p.accent || p.accent === "cyan") && "bg-[var(--accent-cyan)]",
          )}
          style={{ left: `${p.xPct}%`, top: `${p.yPct}%` }}
          title={p.label}
        >
          ●
        </div>
      ))}
      {/* شارة نصف قطر */}
      <div className="absolute bottom-2 start-2 rounded-full bg-[var(--surface-pearl)] px-3 py-1.5 text-micro text-[var(--text-on-pearl)] border border-[var(--border-pearl)]">
        نطاق {radiusKm}km · ST_Distance_Sphere
      </div>
    </div>
  );
}
