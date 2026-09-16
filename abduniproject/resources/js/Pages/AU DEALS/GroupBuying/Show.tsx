// AU DEALS — Group Buying & Crowd-Discount Tracker — Progressive Tiers + Escrow Lock
import { useEffect, useMemo, useState } from "react";
import { router, usePage } from "@inertiajs/react";
import AppLayout from "@/Layouts/AppLayout";
import Button from "@/Components/UI/Button";
import GlassCard from "@/Components/UI/GlassCard";
import StatusBadge from "@/Components/UI/StatusBadge";
import type { SharedPageProps } from "@/Types/global.d";
import type { GroupBuying } from "@/Types/deals.d";

const TENANT: "AU DEALS" = "AU DEALS";

function fmt(minor: number): string {
  return new Intl.NumberFormat("ar-EG", { style: "currency", currency: "EGP", numberingSystem: "latn" }).format(minor / 100);
}

const MOCK_GROUP: GroupBuying = {
  id: "gb_01",
  deal_id: "d4",
  app_id: TENANT,
  tiers: [
    { tier: 1, target_qty: 50, discount_pct: 10, price_minor: 108000, label_ar: "50 وحدة — 10% خصم" },
    { tier: 2, target_qty: 200, discount_pct: 25, price_minor: 90000, label_ar: "200 وحدة — 25% خصم" },
    { tier: 3, target_qty: 500, discount_pct: 40, price_minor: 72000, label_ar: "500 وحدة — 40% خصم" },
  ],
  current_qty: 137,
  current_tier: 1,
  threshold_qty: 500,
  ends_at: new Date(Date.now() + 2 * 86400000 + 5 * 3600000).toISOString(),
  escrow_locked_minor: 0,
};

export default function GroupBuyingShow() {
  const { props } = usePage<SharedPageProps>();
  const isDeals = (props.tenant?.app_id ?? props.app_id) === TENANT;
  const [group, setGroup] = useState<GroupBuying>(MOCK_GROUP);
  const [joined, setJoined] = useState(false);

  const pct = useMemo(() => Math.min(100, (group.current_qty / group.threshold_qty) * 100), [group]);
  const activeTier = useMemo(() => group.tiers.filter(t => group.current_qty >= t.target_qty).pop() ?? group.tiers[0], [group]);
  const nextTier = useMemo(() => group.tiers.find(t => t.target_qty > group.current_qty) ?? group.tiers[group.tiers.length - 1], [group]);

  const [left, setLeft] = useState(() => Math.max(0, new Date(group.ends_at).getTime() - Date.now()));
  useEffect(() => {
    const t = window.setInterval(() => setLeft(Math.max(0, new Date(group.ends_at).getTime() - Date.now())), 1000);
    return () => clearInterval(t);
  }, [group.ends_at]);
  const h = Math.floor(left / 3600000), m = Math.floor((left % 3600000) / 60000), s = Math.floor((left % 60000) / 1000);

  if (!isDeals) return <AppLayout><GlassCard level="inner" className="text-center"><p className="text-section font-bold">يتطلب AU DEALS</p></GlassCard></AppLayout>;

  const join = (): void => {
    setJoined(true);
    setGroup(g => ({ ...g, current_qty: g.current_qty + 1, escrow_locked_minor: g.escrow_locked_minor + activeTier.price_minor }));
    router.post(`/deals/${group.deal_id}/group/join`, { app_id: TENANT, tier: activeTier.tier } as unknown as never, { headers: { "X-App-Id": TENANT } as unknown as Record<string, string> });
  };

  return (
    <AppLayout>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-title font-bold text-white">شراء جماعي — Crowd-Discount Tracker</h1>
        <StatusBadge state="VIP" label={`Tier ${activeTier.tier} · ${activeTier.discount_pct}% off`} />
      </div>

      <GlassCard level="inner" className="mt-4">
        <h3 className="text-section font-semibold">Progressive Discount Tier Visualizer</h3>
        <p className="text-micro text-[var(--text-secondary)]">Tier 1: 50 @10% → Tier 2: 200 @25% → Tier 3: 500 @40%</p>
        <div className="mt-4 h-4 rounded-full bg-[var(--surface-secondary)] overflow-hidden flex">
          {group.tiers.map(t => {
            const w = (t.target_qty / group.threshold_qty) * 100;
            const filled = group.current_qty >= t.target_qty;
            return <div key={t.tier} style={{ width: `${w}%` }} className={`border-e border-white/40 ${filled ? "bg-[var(--accent-emerald)]" : "bg-[var(--surface-pearl)]"}`} title={t.label_ar} />;
          })}
        </div>
        <div className="mt-2 flex justify-between text-micro">
          {group.tiers.map(t => <span key={t.tier} className={group.current_qty >= t.target_qty ? "text-[var(--accent-emerald)] font-bold" : "text-[var(--text-secondary)]"}>{t.target_qty} · {t.discount_pct}%</span>)}
        </div>
        <div className="mt-3 flex items-center gap-3">
          <div className="flex-1 h-2 rounded-full bg-[var(--surface-secondary)]"><div className="h-2 rounded-full bg-[var(--accent-cyan)]" style={{ width: `${pct}%` }} /></div>
          <span className="font-mono text-body tabular-nums">{group.current_qty} / {group.threshold_qty} · {pct.toFixed(1)}%</span>
        </div>
        <p className="mt-2 text-body">سعر فعال حالي: <b className="font-mono">{fmt(activeTier.price_minor)}</b> — التالي {nextTier.label_ar} عند {nextTier.target_qty} وحدة</p>
        <p className="text-micro text-[var(--text-secondary)]">ينتهي خلال {String(h).padStart(2, "0")}:{String(m).padStart(2, "0")}:{String(s).padStart(2, "0")}</p>
      </GlassCard>

      <div className="mt-4 grid gap-4 lg:grid-cols-[1.1fr_0.9fr]">
        <GlassCard level="inner">
          <h3 className="text-section font-semibold">تفاصيل الشرائح</h3>
          <div className="mt-3 space-y-2">
            {group.tiers.map(t => (
              <div key={t.tier} className={`rounded-[var(--radius-md)] border p-3 flex justify-between items-center ${group.current_qty >= t.target_qty ? "bg-[rgba(16,185,129,0.08)] border-[var(--accent-emerald)]" : "bg-white border-[var(--border-pearl)]"}`}>
                <div><p className="text-body font-bold">{t.label_ar}</p><p className="text-micro text-[var(--text-secondary)]">هدف {t.target_qty} وحدة</p></div>
                <div className="text-end"><p className="font-mono font-bold">{fmt(t.price_minor)}</p><span className={`rounded-full px-2 py-1 text-micro font-bold ${group.current_qty >= t.target_qty ? "bg-[var(--accent-emerald)] text-white" : "bg-[var(--surface-secondary)] text-[var(--text-secondary)]"}`}>{t.discount_pct}% OFF</span></div>
              </div>
            ))}
          </div>
        </GlassCard>

        <GlassCard level="inner" accent="amber">
          <h3 className="text-section font-semibold">Group Lock-in Checkout — حجز الضمان</h3>
          <p className="text-micro text-[var(--text-secondary)]">يُحجز المبلغ في Escrow بدون خصم فوري حتى بلوغ العتبة/انتهاء المؤقت</p>
          <div className="mt-3 rounded-[var(--radius-md)] bg-white border border-[var(--border-pearl)] p-3">
            <p className="text-body font-semibold">سعرك المحجوز: <span className="font-mono">{fmt(activeTier.price_minor)}</span></p>
            <p className="text-micro text-[var(--text-secondary)]">Escrow locked: {fmt(group.escrow_locked_minor)} · سيُخصم فقط عند نجاح المجموعة</p>
            <div className="mt-2 h-2 rounded-full bg-[var(--surface-secondary)]"><div className="h-2 rounded-full bg-[var(--accent-amber)]" style={{ width: `${pct}%` }} /></div>
          </div>
          <Button className="mt-3 w-full" isDisabled={joined} onClick={join}>{joined ? "تم الحجز في Escrow ✓" : "احجز الآن — Lock in Escrow"}</Button>
          <p className="mt-2 text-micro text-[var(--text-secondary)]">Headers: X-App-Id AU DEALS · حالة held حتى threshold</p>
          {joined && <p className="mt-2 text-body text-[var(--accent-emerald)]">✓ تم قفل {fmt(activeTier.price_minor)} في الضمان — بانتظار {group.threshold_qty - group.current_qty} مشاركين</p>}
        </GlassCard>
      </div>
    </AppLayout>
  );
}
