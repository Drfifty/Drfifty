// ABD UNI PROJECT — Master layout (RTL-first, Inertia v2, React 19)
// Arabic: Cairo/Tajawal · Latin: Inter — via app.css tokens + Tailwind logical props

import { PropsWithChildren } from "react";
import { usePage } from "@inertiajs/react";
import type { PageProps } from "@/Types";

export default function AppLayout({ children }: PropsWithChildren) {
  const { props } = usePage<PageProps>();
  const dir = props.dir ?? "rtl";
  const locale = props.locale ?? "ar";

  return (
    <div dir={dir} lang={locale} className="min-h-screen bg-white text-slate-900">
      {/* Header — logical padding ps/pe for RTL */}
      <header className="border-b border-slate-200 ps-6 pe-6 py-4 flex items-center justify-between">
        <h1 className="text-xl font-bold font-[var(--font-arabic)]">ABD UNI PROJECT</h1>
        <span className="text-sm text-slate-500">{props.app_id}</span>
      </header>

      {/* Main — text-start for RTL/LTR auto */}
      <main className="ps-6 pe-6 py-6 text-start">{children}</main>

      <footer className="border-t border-slate-100 ps-6 pe-6 py-4 text-center text-xs text-slate-400">
        abduniproject · Modular Monolith · MySQL 8.4 + PostgreSQL 16 · Reverb 8080
      </footer>
    </div>
  );
}
