// زر موحد — Part 2 Atomic — Variants: primary/secondary/danger/ai-action/gold + RBAC purge + RTL
// Phase 4.0: Token single-source + WCAG AA + CSP nonce-ready + Performance chunk
import { forwardRef } from "react";
import type { ButtonHTMLAttributes, ReactNode } from "react";
import { usePage } from "@inertiajs/react";
import type { SharedPageProps } from "@/Types/global.d";
import { cn } from "@/Services/cn";

export type ButtonVariant = "primary" | "secondary" | "danger" | "ai-action" | "gold" | "ghost" | "crimson";
export type ButtonSize = "sm" | "md" | "lg";

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  isLoading?: boolean;
  isDisabled?: boolean;
  loading?: boolean; // alias
  disabled?: boolean; // alias compat
  icon?: ReactNode;
  requiredPermission?: string;
  permission?: string; // alias
  featureFlag?: string; // FIX-P1-09 AU Lite flag
  appContext?: string; // ex: "AU MED" — يطهر إن اختلف app_id
  experiment?: string;
}

const sizeMap: Record<ButtonSize, string> = {
  sm: "h-8 ps-3 pe-3 text-micro",
  md: "h-9 ps-4 pe-4 text-body",
  lg: "h-10 ps-6 pe-6 text-section",
};

const variantMap: Record<ButtonVariant, string> = {
  primary: "bg-[var(--canvas-dark)] text-white border border-transparent shadow-[var(--shadow-elevation-sm)] hover:bg-[var(--canvas-dark-hover)]",
  secondary: "bg-[var(--surface-pearl)] text-[var(--text-on-pearl)] border border-[var(--border-pearl)] shadow-[var(--shadow-pearl-sm)] hover:bg-[var(--surface-pearl-strong)]",
  danger: "bg-[var(--brand-crimson)] text-white border-transparent shadow-[var(--shadow-elevation-sm)] hover:bg-[var(--brand-crimson-hover)]",
  "ai-action": "bg-[var(--accent-cyan)] text-white border-transparent shadow-[var(--shadow-elevation-sm)] hover:bg-[var(--accent-primary-hover)]",
  gold: "bg-[var(--brand-gold)] text-black border-transparent shadow-[var(--shadow-elevation-sm)] hover:bg-[var(--brand-gold-hover)]",
  ghost: "bg-transparent text-[var(--text-primary)] border-transparent hover:bg-[var(--surface-secondary)]",
  crimson: "bg-[var(--brand-crimson)] text-white border-transparent shadow-[var(--shadow-elevation-sm)] hover:bg-[var(--brand-crimson-hover)]",
};

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      children,
      variant = "primary",
      size = "md",
      isLoading,
      isDisabled,
      loading,
      disabled,
      icon,
      requiredPermission,
      permission,
      featureFlag,
      appContext,
      experiment,
      className,
      ...props
    },
    ref,
  ) => {
    const { props: page } = usePage<SharedPageProps>();
    const perm = requiredPermission ?? permission;
    if (perm && !page.permissions?.includes(perm) && !page.tenant?.permissions?.includes(perm)) return null;
    // FIX-P1-09: feature_flag view gate (AU Lite) + HITL approval gate
    if (featureFlag && page.feature_flags?.[featureFlag] === false) return null;
    if (featureFlag && page.tenant?.feature_flags?.[featureFlag] === false) return null;
    if (appContext && page.app_id !== appContext && page.tenant?.app_id !== appContext) return null;

    const loadingActive = isLoading ?? loading ?? false;
    const disabledActive = isDisabled ?? disabled ?? false;
    const isDisabledFinal = disabledActive || loadingActive;

    return (
      <button
        ref={ref}
        data-experiment={experiment}
        className={cn(
          "inline-flex items-center justify-center gap-2 rounded-[var(--radius-md)] border font-medium",
          "transition-all duration-[var(--motion-duration)] ease-[var(--motion-ease)]",
          "focus-ring active:translate-y-px disabled:opacity-40 disabled:pointer-events-none text-start",
          sizeMap[size],
          variantMap[variant],
          isDisabledFinal && "pointer-events-none",
          className,
        )}
        disabled={isDisabledFinal}
        aria-busy={loadingActive || undefined}
        aria-disabled={isDisabledFinal || undefined}
        {...props}
      >
        {loadingActive && <span aria-hidden className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />}
        {icon && !loadingActive && <span aria-hidden className="inline-flex">{icon}</span>}
        {children}
      </button>
    );
  },
);

Button.displayName = "Button";
export default Button;
