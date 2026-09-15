// زر موحد — توكنات فقط — RBAC تطهير DOM + A/B خلف flags + تركيز AA + RTL ps/pe
// Phase 4.0: Token single-source + WCAG 2.1 AA + CSP nonce-ready + Performance chunk
import { forwardRef } from "react";
import type { ButtonHTMLAttributes } from "react";
import { usePage } from "@inertiajs/react";
import type { SharedPageProps } from "@/Types/global.d";
import { cn } from "@/Services/cn";

type Variant = "primary" | "secondary" | "ghost" | "crimson";
type Size = "sm" | "md" | "lg";

interface Props extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  loading?: boolean;
  permission?: string; // إن غابت الصلاحية يُحذف من DOM (Rule 36)
  experiment?: string; // data-experiment للـ kill-switch Agent 12
}

const sizeMap: Record<Size, string> = {
  sm: "h-8 ps-3 pe-3 text-micro",
  md: "h-9 ps-4 pe-4 text-body",
  lg: "h-10 ps-6 pe-6 text-section",
};

const variantMap: Record<Variant, string> = {
  primary: "bg-[var(--accent-primary)] text-[var(--text-on-accent)] border-transparent shadow-[var(--shadow-elevation-sm)] hover:bg-[var(--accent-primary-hover)]",
  secondary: "bg-[var(--surface-pearl)] text-[var(--text-on-pearl)] border-[var(--border-pearl)] shadow-[var(--shadow-pearl-sm)] hover:bg-[var(--surface-pearl-strong)]",
  ghost: "bg-transparent text-[var(--text-primary)] border-transparent hover:bg-[var(--surface-secondary)]",
  crimson: "bg-[var(--brand-crimson)] text-white border-transparent shadow-[var(--shadow-elevation-sm)] hover:bg-[var(--brand-crimson-hover)]",
};

const Button = forwardRef<HTMLButtonElement, Props>(
  ({ children, variant = "primary", size = "md", loading = false, permission, experiment, className, disabled, ...props }, ref) => {
    const { props: page } = usePage<SharedPageProps>();
    if (permission && !page.permissions?.includes(permission)) return null;

    const isDisabled = disabled || loading;

    return (
      <button
        ref={ref}
        data-experiment={experiment}
        className={cn(
          "inline-flex items-center justify-center rounded-[var(--radius-md)] border font-medium",
          "transition-all duration-[var(--motion-duration)] ease-[var(--motion-ease)]",
          "focus-ring active:translate-y-px disabled:opacity-40 disabled:pointer-events-none text-start",
          sizeMap[size],
          variantMap[variant],
          isDisabled && "pointer-events-none",
          className,
        )}
        disabled={isDisabled}
        aria-busy={loading || undefined}
        aria-disabled={isDisabled || undefined}
        {...props}
      >
        {loading && (
          <span aria-hidden className="me-2 inline-block h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
        )}
        {children}
      </button>
    );
  },
);

Button.displayName = "Button";
export default Button;
