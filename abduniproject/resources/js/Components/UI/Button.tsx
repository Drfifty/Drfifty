// زر موحد — يعتمد على الرموز فقط (لا ألوان ثابتة)
// يمثل الحالة المنطقية فقط؛ المظهر يتغير عبر tokens.css
import type { ButtonHTMLAttributes, PropsWithChildren } from "react";
import { cn } from "@/Services/cn"; // helper افتراضي — إن غاب استخدم دمج سلاسل

type Variant = "primary" | "secondary" | "ghost" | "crimson";
type Size = "sm" | "md" | "lg";

interface Props extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  loading?: boolean;
  // يضمن تخصيص الألوان عبر tokens فقط — لا hex داخل الصفحات
}

// أحجام موحدة — شبكة 8pt
const sizeMap: Record<Size, string> = {
  sm: "h-8 ps-3 pe-3 text-micro",
  md: "h-9 ps-4 pe-4 text-body",
  lg: "h-10 ps-6 pe-6 text-section",
};

// متغيرات بصرية — كلها ترجع إلى var(--token)
const variantMap: Record<Variant, string> = {
  primary:
    "bg-[var(--accent-primary)] text-[var(--text-on-accent)] border border-transparent shadow-[var(--shadow-elevation-sm)] hover:bg-[var(--accent-primary-hover)]",
  secondary:
    "bg-[var(--surface-pearl)] text-[var(--text-on-pearl)] border border-[var(--border-pearl)] shadow-[var(--shadow-pearl-sm)] hover:bg-[var(--surface-pearl-strong)]",
  ghost:
    "bg-transparent text-[var(--text-primary)] border border-transparent hover:bg-[var(--surface-secondary)]",
  crimson:
    "bg-[var(--brand-crimson)] text-white border border-transparent shadow-[var(--shadow-elevation-sm)] hover:bg-[var(--brand-crimson-hover)]",
};

export default function Button({
  children,
  variant = "primary",
  size = "md",
  loading = false,
  className,
  disabled,
  ...props
}: PropsWithChildren<Props>) {
  const isDisabled = disabled || loading;

  return (
    <button
      // حلقة تركيز موحدة — AA
      className={cn(
        "inline-flex items-center justify-center rounded-[var(--radius-md)] font-medium",
        "transition-all duration-[var(--motion-duration)] ease-[var(--motion-ease)]",
        "focus-ring focus-visible:outline-none active:translate-y-px disabled:opacity-40 disabled:pointer-events-none",
        "border text-start",
        sizeMap[size],
        variantMap[variant],
        isDisabled && "pointer-events-none",
        className,
      )}
      disabled={isDisabled}
      aria-busy={loading || undefined}
      {...props}
    >
      {loading && (
        <span
          aria-hidden
          className="me-2 inline-block h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent"
        />
      )}
      {children}
    </button>
  );
}

// مساعد دمج فئات — يمنع تكرار المنطق عبر التطبيقات
// إن لم يوجد ملف cn، سيُنشأ في Services/cn.ts
