// نافذة حوار موحدة — Obsidian backdrop + Pearl inner — تركيز محاصر + ESC + قفل تمرير
// Phase 4.0: WCAG AA + RTL + توكنات فقط + CSP nonce-ready
import { useEffect, useRef } from "react";
import type { PropsWithChildren } from "react";
import { cn } from "@/Services/cn";
import Button from "./Button";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string;
  initialFocusRef?: React.RefObject<HTMLElement | null>;
}

export default function Modal({ open, onOpenChange, title, description, children, initialFocusRef }: PropsWithChildren<Props>) {
  const panelRef = useRef<HTMLDivElement>(null);

  // ESC + قفل تمرير + تركيز
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent): void => {
      if (e.key === "Escape") onOpenChange(false);
      if (e.key === "Tab" && panelRef.current) {
        const focusable = panelRef.current.querySelectorAll<HTMLElement>(
          'a[href], button, input, select, textarea, [tabindex]:not([tabindex="-1"])',
        );
        // FIX-P1-08: fallback when no focusable — keep focus on panel, prevent tab leak
        if (focusable.length === 0) { e.preventDefault(); panelRef.current.focus(); return; }
        const first = focusable[0];
        const last = focusable[focusable.length - 1];
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };
    document.addEventListener("keydown", onKey);
    // تركيز أولي
    const t = window.setTimeout(() => {
      (initialFocusRef?.current ?? panelRef.current?.querySelector<HTMLElement>("button, input, [tabindex]") ?? panelRef.current)?.focus();
    }, 0);
    return () => {
      document.body.style.overflow = prev;
      document.removeEventListener("keydown", onKey);
      window.clearTimeout(t);
    };
  }, [open, onOpenChange, initialFocusRef]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" role="dialog" aria-modal="true" aria-labelledby="modal-title">
      <div className="absolute inset-0 bg-[var(--overlay-backdrop)] backdrop-blur-[8px]" onClick={() => onOpenChange(false)} aria-hidden />
      <div
        ref={panelRef}
        tabIndex={-1}
        className={cn(
          "relative z-10 w-full max-w-lg max-h-[85vh] overflow-auto outline-none",
          "glass-pearl-strong rounded-[var(--radius-lg)] shadow-[var(--shadow-elevation-lg)] p-6",
        )}
      >
        <Button variant="ghost" size="sm" aria-label="إغلاق / Close" onClick={() => onOpenChange(false)} className="absolute top-3 end-3">
          ✕
        </Button>
        <h2 id="modal-title" className="text-section font-semibold text-[var(--text-on-pearl)] text-start">
          {title}
        </h2>
        {description && <p className="mt-1 text-body text-[var(--text-secondary)] text-start">{description}</p>}
        <div className="mt-4 text-start">{children}</div>
      </div>
    </div>
  );
}
