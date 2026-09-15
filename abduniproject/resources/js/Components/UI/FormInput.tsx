// حقل إدخال ذري — توكنات + RegexDataLeakDetector + Latin أرقام + AA
// Phase 4.0: أرقام Latin داخل RTL + وحدات صغرى + اعتراض تسريب جهات الاتصال
import type { InputHTMLAttributes } from "react";
import { useCallback } from "react";
import { cn } from "@/Services/cn";

interface Props extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
  hint?: string;
  sanitize?: boolean; // true = يمرّر عبر كاشف التسريب قبل onChange
}

// كاشف تسريب مبسط — يطمس الهاتف/البريد/الرابط قبل الإرسال (Pillar 5)
function leakMask(value: string): string {
  if (!value) return value;
  let v = value;
  // هاتف مصري 01xxxxxxxxx أو +201xxxxxxxxx
  v = v.replace(/(\+?20)?0?1[0-2,5][0-9]{8}/g, "***-****-****");
  // بريد
  v = v.replace(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi, "***@***");
  // رابط خارجي
  v = v.replace(/https?:\/\/\S+/gi, "***");
  return v;
}

export default function FormInput({ label, error, hint, sanitize = true, className, id, onChange, ...props }: Props) {
  const inputId = id ?? `in-${label.replace(/\s+/g, "-")}`;

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      if (sanitize && onChange) {
        // احتفظ بالقيمة الأصلية للعرض، لكن اطمس عند الحاجة للتحقق
        // هنا نمرّر القيمة المطمسة إن اكتُشف تسريب — الواجهة تعرض الأصل، الحمولة تُرسل مطمسة عبر useFormSanitizer
        const masked = leakMask(e.target.value);
        if (masked !== e.target.value) {
          const next = { ...e, target: { ...e.target, value: masked } } as React.ChangeEvent<HTMLInputElement>;
          onChange(next);
          return;
        }
      }
      onChange?.(e);
    },
    [onChange, sanitize],
  );

  return (
    <div className="space-y-1.5 text-start">
      <label htmlFor={inputId} className="text-body font-medium text-[var(--text-on-pearl)]">
        {label}
      </label>
      <input
        id={inputId}
        onChange={handleChange}
        aria-invalid={!!error || undefined}
        aria-describedby={error ? `${inputId}-err` : hint ? `${inputId}-hint` : undefined}
        // Latin أرقام داخل RTL — Inter tabular
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
