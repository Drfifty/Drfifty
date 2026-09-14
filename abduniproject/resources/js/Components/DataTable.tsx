// ABD UNI PROJECT — Reusable DataTable (admin grids, server-side pagination via Inertia)
// Rule 13: Always use this component for administrative listings

import { router } from "@inertiajs/react";
import type { Paginated } from "@/Types";

type Column<T> = {
  key: keyof T | string;
  label: string;
  render?: (row: T) => React.ReactNode;
};

type Props<T> = {
  rows: Paginated<T>;
  columns: Column<T>[];
  resource: string; // e.g. "/admin/wallets"
};

export default function DataTable<T extends { id: number | string }>({
  rows,
  columns,
  resource,
}: Props<T>) {
  const go = (url: string | null) => {
    if (!url) return;
    router.visit(url, { preserveState: true, preserveScroll: true });
  };

  return (
    <div className="overflow-x-auto rounded-lg border border-slate-200">
      <table className="w-full text-sm text-start">
        <thead className="bg-slate-50 text-slate-600">
          <tr>
            {columns.map((c) => (
              <th key={String(c.key)} className="ps-4 pe-4 py-3 font-semibold text-start">
                {c.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.data.map((row) => (
            <tr key={String(row.id)} className="border-t border-slate-100 hover:bg-slate-50">
              {columns.map((c) => (
                <td key={String(c.key)} className="ps-4 pe-4 py-3">
                  {c.render ? c.render(row) : String((row as Record<string, unknown>)[String(c.key)] ?? "")}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>

      {/* Pagination — logical props */}
      <div className="flex items-center justify-between ps-4 pe-4 py-3 border-t border-slate-200">
        <span className="text-xs text-slate-500">
          Page {rows.current_page} of {rows.last_page} · {rows.total} total
        </span>
        <div className="flex gap-2">
          {rows.links.map((l, i) => (
            <button
              key={i}
              disabled={!l.url}
              onClick={() => go(l.url)}
              // eslint-disable-next-line react/no-danger
              dangerouslySetInnerHTML={{ __html: l.label }}
              className={`px-3 py-1 text-xs rounded border ${l.active ? "bg-slate-900 text-white" : "bg-white"} disabled:opacity-40`}
            />
          ))}
        </div>
      </div>

      {/* Hidden resource hint for guards */}
      <span data-resource={resource} className="hidden" />
    </div>
  );
}
