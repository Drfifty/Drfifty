// شبكة بيانات ذرية — تغليف DataTable مع رموز موحدة
// تعرض طبقة عرض فقط — المنطق يأتي عبر props — لا استعلامات داخل JSX
import type { Paginated } from "@/Types";
import DataTable from "@/Components/DataTable";

type Column<T> = { key: keyof T | string; label: string; render?: (row: T) => React.ReactNode };

interface Props<T extends { id: string | number }> {
  rows: Paginated<T>;
  columns: Column<T>[];
  resource: string;
  // يسمح بتغيير التخطيط دون لمس backend — Presentational فقط
  variant?: "table" | "cards"; // cards للـ 320px
}

// حاوية Pearl داخلية داخل Outer Obsidian — توازن هجين
export default function DataGrid<T extends { id: string | number }>({ rows, columns, resource, variant = "table" }: Props<T>) {
  if (variant === "cards") {
    // عرض بطاقات للجوال — يحافظ على نفس البيانات
    return (
      <div className="grid gap-3">
        {rows.data.map((row) => (
          <div key={String(row.id)} className="glass-inner rounded-[var(--radius-md)] p-4">
            {columns.map((c) => (
              <div key={String(c.key)} className="flex justify-between py-1 text-body">
                <span className="text-[var(--text-secondary)]">{c.label}</span>
                <span className="font-medium text-[var(--text-on-pearl)] text-start">
                  {c.render ? c.render(row) : String((row as Record<string, unknown>)[String(c.key)] ?? "")}
                </span>
              </div>
            ))}
          </div>
        ))}
      </div>
    );
  }

  // جدول إداري — يعيد استخدام DataTable القانوني (Rule 13)
  return (
    <div className="glass-inner rounded-[var(--radius-md)] p-2">
      <DataTable rows={rows} columns={columns} resource={resource} />
    </div>
  );
}
