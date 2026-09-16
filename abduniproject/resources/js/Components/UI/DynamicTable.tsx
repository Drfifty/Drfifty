// جدول ديناميكي — توكنات + RBAC + فرز + إجراءات + تحديد متعدد + تصفح (Rule 13)
import { router, usePage } from "@inertiajs/react";
import type { Paginated } from "@/Types";
import type { SharedPageProps } from "@/Types/global.d";
import { cn } from "@/Services/cn";
export type Column<T> = { key: keyof T | string; label: string; render?: (row: T) => React.ReactNode; permission?: string; isMoney?: boolean; align?: "start" | "center" | "end"; sortable?: boolean };
export type RowAction<T> = { key: string; label: string; permission?: string; variant?: "primary" | "secondary" | "danger" | "ai-action" | "gold"; onClick: (row: T) => void };
type Props<T extends { id: string | number }> = { rows: Paginated<T>; columns: Column<T>[]; resource: string; caption?: string; sortKey?: string; sortDir?: "asc" | "desc"; onSort?: (key: string) => void; rowActions?: RowAction<T>[]; selectable?: boolean; selectedIds?: (string | number)[]; onSelectionChange?: (ids: (string | number)[]) => void };
function formatMoney(minor: number, currency: string, digits: string): string {
  const major = minor / 100;
  return new Intl.NumberFormat("ar-EG", { style: "currency", currency, numberingSystem: digits === "arab" ? "arab" : "latn" }).format(major);
}
export default function DynamicTable<T extends { id: string | number }>({ rows, columns, resource, caption, sortKey, sortDir, onSort, rowActions, selectable, selectedIds, onSelectionChange }: Props<T>) {
  const { props } = usePage<SharedPageProps>();
  const allowed = new Set(props.permissions ?? []);
  const digits = props.tenant?.locale_digits ?? "latin";
  const currencyDefault = props.currency ?? "EGP";
  const visible = columns.filter((c) => !c.permission || allowed.has(c.permission));
  const actionsVisible = rowActions?.filter((a) => !a.permission || allowed.has(a.permission)) ?? [];
  const allSelected = selectable && rows.data.length > 0 && rows.data.every((r) => selectedIds?.includes(r.id));
  const go = (url: string | null): void => { if (!url) return; router.visit(url, { preserveState: true, preserveScroll: true }); };
  const toggleAll = (): void => { if (!onSelectionChange) return; onSelectionChange(allSelected ? [] : rows.data.map((r) => r.id)); };
  const toggleOne = (id: string | number): void => { if (!onSelectionChange || !selectedIds) return; onSelectionChange(selectedIds.includes(id) ? selectedIds.filter((x) => x !== id) : [...selectedIds, id]); };
  return (
    <div className="overflow-x-auto rounded-[var(--radius-lg)] border border-[var(--border-main)] bg-[var(--surface-pearl)]">
      <table className="w-full text-start text-body" aria-label={caption ?? "جدول بيانات"}>
        {caption && <caption className="sr-only">{caption}</caption>}
        <thead className="bg-[var(--surface-secondary)] text-[var(--text-secondary)]">
          <tr>
            {selectable && <th className="ps-4 pe-2 py-3"><input type="checkbox" checked={!!allSelected} onChange={toggleAll} aria-label="تحديد الكل" className="rounded border-[var(--border-pearl)]" /></th>}
            {visible.map((c) => (
              <th key={String(c.key)} scope="col" onClick={() => c.sortable && onSort?.(String(c.key))} className={cn("ps-4 pe-4 py-3 font-semibold text-micro", c.sortable && "cursor-pointer select-none hover:text-[var(--text-primary)]", c.align === "center" && "text-center", c.align === "end" && "text-end", !c.align && "text-start")}>
                <span className="inline-flex items-center gap-1">{c.label}{c.sortable && sortKey === String(c.key) && <span aria-hidden>{sortDir === "asc" ? "↑" : "↓"}</span>}</span>
              </th>
            ))}
            {actionsVisible.length > 0 && <th className="ps-4 pe-4 py-3 text-micro text-end">إجراءات</th>}
          </tr>
        </thead>
        <tbody className="divide-y divide-[var(--border-pearl)]">
          {rows.data.length === 0 ? (
            <tr><td colSpan={visible.length + (selectable ? 1 : 0) + (actionsVisible.length ? 1 : 0)} className="ps-4 pe-4 py-10 text-center text-[var(--text-secondary)]">لا توجد بيانات</td></tr>
          ) : (
            rows.data.map((row) => (
              <tr key={String(row.id)} className="hover:bg-[var(--surface-pearl-strong)]">
                {selectable && <td className="ps-4 pe-2 py-3"><input type="checkbox" checked={!!selectedIds?.includes(row.id)} onChange={() => toggleOne(row.id)} aria-label={`تحديد ${row.id}`} className="rounded border-[var(--border-pearl)]" /></td>}
                {visible.map((c) => {
                  const raw = (row as Record<string, unknown>)[String(c.key)];
                  const content = c.render ? c.render(row) : c.isMoney && typeof raw === "number" ? formatMoney(raw as number, currencyDefault, digits) : String(raw ?? "");
                  return <td key={String(c.key)} className={cn("ps-4 pe-4 py-3 text-[var(--text-on-pearl)]", c.align === "center" && "text-center", c.align === "end" && "text-end")} data-numeric={c.isMoney ? "true" : undefined}>{content}</td>;
                })}
                {actionsVisible.length > 0 && <td className="ps-4 pe-4 py-3"><div className="flex justify-end gap-1">{actionsVisible.map((a) => <button key={a.key} onClick={() => a.onClick(row)} className="rounded-[var(--radius-md)] border border-[var(--border-pearl)] bg-white px-2 py-1 text-micro font-medium hover:bg-[var(--surface-pearl)] focus-ring">{a.label}</button>)}</div></td>}
              </tr>
            ))
          )}
        </tbody>
      </table>
      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-[var(--border-pearl)] ps-4 pe-4 py-3">
        <span className="text-micro text-[var(--text-secondary)]">صفحة {rows.current_page} من {rows.last_page} · {rows.total} إجمالي</span>
        <div className="flex flex-wrap gap-2">{rows.links.map((l, i) => <button key={i} disabled={!l.url} onClick={() => go(l.url)} dangerouslySetInnerHTML={{ __html: l.label }} aria-label={l.label.replace(/<[^>]*>/g, "")} className={cn("rounded-[var(--radius-pill)] border px-3 py-1 text-micro font-medium focus-ring", l.active ? "bg-[var(--accent-primary)] text-white border-transparent" : "bg-[var(--surface-pearl-strong)] text-[var(--text-on-pearl)] border-[var(--border-pearl)]", "disabled:opacity-40 disabled:pointer-events-none")} />)}</div>
      </div>
      <span data-resource={resource} className="hidden" aria-hidden />
    </div>
  );
}
