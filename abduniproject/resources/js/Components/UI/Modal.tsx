// نافذة حوار موحدة — Obsidian backdrop + Pearl inner
// تستخدم Radix-style تركيز محاصر — لا ألوان ثابتة
import type { PropsWithChildren } from "react";
import { cn } from "@/Services/cn";
import Button from "./Button";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string;
}

export default function Modal({ open, onOpenChange, title, description, children }: PropsWithChildren<Props>) {
  if (!open) return null;

  return (
    <div
      // طبقة تغطية — تستخدم overlay token
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
    >
      {/* خلفية — Obsidian 45% + blur */}
      <div
        className="absolute inset-0 bg-[var(--overlay-backdrop)] backdrop-blur-[8px]"
        onClick={() => onOpenChange(false)}
        aria-hidden
      />
      {/* محتوى — Pearl قوي */}
      <div
        className={cn(
          "relative z-10 w-full max-w-lg max-h-[85vh] overflow-auto",
          "glass-pearl-strong rounded-[var(--radius-lg)] shadow-[var(--shadow-elevation-lg)]",
          "p-6",
        )}
      >
        {/* إغلاق — منطقي ps/pe */}
        <Button
          variant="ghost"
          size="sm"
          aria-label="إغلاق"
          onClick={() => onOpenChange(false)}
          className="absolute top-3 end-3"
        >
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
