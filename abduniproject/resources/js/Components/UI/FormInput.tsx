// حقل إدخال موحد — ذري + RTL + توكنات + رسائل تحقق
// Phase 4.0 Part 2: Standard Form Control — Cairo/Tajawal + Inter tabular
import type { InputHTMLAttributes } from "react";
import { cn } from "@/Services/cn";

export interface FormInputProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
  helperText?: string;
  hint?: string;
}

export default function FormInput({ label, error, helperText, hint, className, id, ...props }: FormInputProps) {
  const helper = helperText ?? hint;
  const inputId = id ?? `in-${label.replace(/\s+/g, "-")}`;

  return (
    <div className="space-y-1.5 text-start">
      <label htmlFor={inputId} className="text-body font-medium text-[var(--text-on-pearl)]">
        {label}
      </label>
      <input
        id={inputId}
        aria-invalid={!!error || undefined}
        aria-describedby={error ? `${inputId}-err` : helper ? `${inputId}-hint` : undefined}
        data-numeric={props.inputMode === "numeric" || props.type === "number" ? "true" : undefined}
        className={cn(
          "w-full rounded-[var(--radius-md)] border bg-[var(--surface-pearl-strong)]",
          "px-3 py-2.5 text-body text-[var(--text-on-pearl)] placeholder:text-[var(--text-secondary)]",
          error ? "border-[var(--brand-crimson)]" : "border-[var(--border-pearl)]",
          "focus:outline-none focus:ring-2 focus:ring-[var(--accent-cyan)] focus:border-transparent focus-ring",
          "disabled:opacity-50 disabled:pointer-events-none",
          className,
        )}
        {...props}
      />
      {helper && !error && (
        <p id={`${inputId}-hint`} className="text-micro text-[var(--text-secondary)]">
          {helper}
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
