// جدول ديناميكي موحد — ذري + توكنات فقط + RBAC تطهير DOM + تصفح Inertia (Rule 13)
// Phase 4.0: Performance <250KB chunk + WCAG AA + RTL ps/pe + Money minor-units + CSP nonce
import { router, usePage } from "@inertiajs/react";
import type { Paginated } from "@/Types";
import type { SharedPageProps } from "@/Types/global.d";
import { cn } from "@/Services/cn";

// تعريف العمود — لا any — الصلاحية تطهر العمود من DOM إن غابت
export type Column<T> = {
  key: keyof T | string;
  label: string;
  render?: (row: T) => React.ReactNode;
  permission?: string;
  isMoney?: boolean;
  align?: "start" | "center" | "end";
};

type Props<T extends { id: string | number }> = {
  rows: Paginated<T>;
  columns: Column<T>[];
  resource: string; // مثال: "/admin/wallets"
  caption?: string;
};

// تنسيق نقدي — وحدات صغرى → كبرى — Latin افتراضي داخل RTL
function formatMoney(minor: number, currency: string, digits: string): string {
  const major = minor / 100;
  return new Intl.NumberFormat("ar-EG", {
    style: "currency",
    currency,
    numberingSystem: digits === "arabic" ? "arab" : "latn",
    maximumFractionDigits: 2,
  }).format(major);
}

export default function DynamicTable<T extends { id: string | number }>({
  rows,
  columns,
  resource,
  caption,
}: Props<T>) {
  const { props } = usePage<SharedPageProps>();
  const allowed = new Set(props.permissions ?? []);
  const digits = props.tenant?.locale_digits ?? "latin";
  const currencyDefault = props.currency ?? "EGP";

  // تطهير DOM — أعمدة بلا صلاحية لا تُرسم
  const visible = columns.filter((c) => !c.permission || allowed.has(c.permission));

  const go = (url: string | null): void => {
    if (!url) return;
    router.visit(url, { preserveState: true, preserveScroll: true });
  };

  return (
    <div className="overflow-x-auto rounded-[var(--radius-lg)] border border-[var(--border-main)] bg-[var(--surface-pearl)]">
      <table className="w-full text-start text-body" aria-label={caption ?? "جدول بيانات"}>
        {caption && <caption className="sr-only">{caption}</caption>}
        <thead className="bg-[var(--surface-secondary)] text-[var(--text-secondary)]">
          <tr>
            {visible.map((c) => (
              <th
                key={String(c.key)}
                scope="col"
                className={cn(
                  "ps-4 pe-4 py-3 font-semibold text-micro",
                  c.align === "center" && "text-center",
                  c.align === "end" && "text-end",
                  !c.align && "text-start",
                )}
              >
                {c.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-[var(--border-pearl)]">
          {rows.data.length === 0 ? (
            <tr>
              <td colSpan={visible.length} className="ps-4 pe-4 py-10 text-center text-[var(--text-secondary)]">
                لا توجد بيانات
              </td>
            </tr>
          ) : (
            rows.data.map((row) => (
              <tr key={String(row.id)} className="hover:bg-[var(--surface-pearl-strong)]">
                {visible.map((c) => {
                  const raw = (row as Record<string, unknown>)[String(c.key)];
                  const content = c.render
                    ? c.render(row)
                    : c.isMoney && typeof raw === "number"
                      ? formatMoney(raw as number, currencyDefault, digits)
                      : String(raw ?? "");
                  return (
                    <td
                      key={String(c.key)}
                      className={cn(
                        "ps-4 pe-4 py-3 text-[var(--text-on-pearl)]",
                        c.align === "center" && "text-center",
                        c.align === "end" && "text-end",
                      )}
                      data-numeric={c.isMoney ? "true" : undefined}
                    >
                      {content}
                    </td>
                  );
                })}
              </tr>
            ))
          )}
        </tbody>
      </table>

      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-[var(--border-pearl)] ps-4 pe-4 py-3">
        <span className="text-micro text-[var(--text-secondary)]">
          صفحة {rows.current_page} من {rows.last_page} · {rows.total} إجمالي
        </span>
        <div className="flex flex-wrap gap-2">
          {rows.links.map((l, i) => (
            <button
              key={i}
              disabled={!l.url}
              onClick={() => go(l.url)}
              // eslint-disable-next-line react/no-danger
              dangerouslySetInnerHTML={{ __html: l.label }}
              aria-label={l.label.replace(/<[^>]*>/g, "")}
              className={cn(
                "rounded-[var(--radius-pill)] border px-3 py-1 text-micro font-medium focus-ring",
                l.active
                  ? "bg-[var(--accent-primary)] text-white border-transparent"
                  : "bg-[var(--surface-pearl-strong)] text-[var(--text-on-pearl)] border-[var(--border-pearl)]",
                "disabled:opacity-40 disabled:pointer-events-none",
              )}
            />
          ))}
        </div>
      </div>
      <span data-resource={resource} className="hidden" aria-hidden />
    </div>
  );
}
