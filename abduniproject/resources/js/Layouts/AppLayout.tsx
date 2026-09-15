// ABD UNI PROJECT — Master layout — Obsidian Canvas Standard Locked
// الخلفية الكونية + الجسيمات + الإضاءة التقاربية موحدة عبر التطبيقات الخمسة + لوحة الإدارة
// الطباعة: Cairo/Tajawal عربي · Inter لاتيني · logical props ps-/pe- لـ RTL

import { PropsWithChildren, useRef } from "react";
import { usePage } from "@inertiajs/react";
import type { PageProps } from "@/Types";
import { useParticleCanvas } from "@/Hooks/useParticleCanvas";
import { useProximityLighting } from "@/Hooks/useProximityLighting";

export default function AppLayout({ children }: PropsWithChildren) {
  const { props } = usePage<PageProps & Record<string, unknown>>();
  const dir = (props.dir as PageProps["dir"] | undefined) ?? "rtl";
  const locale = (props.locale as PageProps["locale"] | undefined) ?? "ar";
  const appId = props.app_id as string | undefined;

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rootRef = useRef<HTMLDivElement>(null);
  useParticleCanvas(canvasRef, { count: 42 });
  useProximityLighting(rootRef);

  return (
    <div ref={rootRef} dir={dir} lang={locale} className="canvas-obsidian min-h-screen text-[var(--text-primary)] antialiased">
      {/* خلفية جسيمية — Obsidian موحدة — --cx/--cy يحدّثها useProximityLighting */}
      <canvas ref={canvasRef} className="particle-grid" aria-hidden />

      {/* Header — Outer Obsidian Glass */}
      <header className="glass-outer sticky top-0 z-30 ps-6 pe-6 py-4 flex items-center justify-between">
        <h1 className="text-section font-bold tracking-tight text-white">ABD UNI PROJECT</h1>
        <span className="text-micro text-[var(--text-secondary)]">{appId ?? "Arena"}</span>
      </header>

      {/* Main — يحمل Pearl داخلي عبر صفحات العرض */}
      <main className="ps-6 pe-6 py-6 text-start">{children}</main>

      <footer className="border-t border-[var(--border-main)] ps-6 pe-6 py-4 text-center text-micro text-[var(--text-secondary)]">
        abduniproject · Obsidian Canvas · Modular Monolith · MySQL 8.4 + PostgreSQL 16 · Reverb 8080
      </footer>
    </div>
  );
}
