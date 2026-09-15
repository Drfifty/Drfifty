// حقل إدخال ذري — يوحّد النماذج عبر التطبيقات الخمسة
// ألوان الحدود والتركيز كلها من tokens — صيانة ملف واحد
import type { InputHTMLAttributes } from "react";
import { cn } from "@/Services/cn";

interface Props extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
  hint?: string;
}

export default function FormInput({ label, error, hint, className, id, ...props }: Props) {
  const inputId = id || `in-${label.replace(/\s+/g, "-")}`;

  return (
    <div className="space-y-1.5 text-start">
      <label htmlFor={inputId} className="text-body font-medium text-[var(--text-on-pearl)]">
        {label}
      </label>
      <input
        id={inputId}
        aria-invalid={!!error || undefined}
        aria-describedby={error ? `${inputId}-err` : hint ? `${inputId}-hint` : undefined}
        // حدود وتركيز عبر tokens — لا hex
        className={cn(
          "w-full rounded-[var(--radius-md)] border bg-[var(--surface-pearl-strong)]",
          "px-3 py-2.5 text-body text-[var(--text-on-pearl)] placeholder:text-[var(--text-secondary)]",
          error ? "border-[var(--brand-crimson)]" : "border-[var(--border-pearl)]",
          "focus:outline-none focus:ring-2 focus:ring-[var(--accent-cyan)] focus:border-transparent",
          "disabled:opacity-50 disabled:pointer-events-none",
          className,
        )}
        {...props}
      />
      {hint && !error && (
        <p id={`${inputId}-hint`} className="text-micro text-[var(--text-secondary)]">
          {hint}
        </p>
      )}
      {error && (
        <p id={`${inputId}-err`} className="text-micro text-[var(--brand-crimson)]" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
