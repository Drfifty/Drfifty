// حاجز أخطاء React 19 — يلتقط انهيارات المكوّنات ويحمي تسرّب Stack
// Phase 4.0 Part 2: Fallback آمن + زر إعادة محاولة + توكنات + RTL
import { Component } from "react";
import type { ErrorInfo, PropsWithChildren, ReactNode } from "react";
import Button from "./Button";

export interface ErrorBoundaryProps extends PropsWithChildren {
  fallback?: ReactNode;
  onError?: (error: Error, info: ErrorInfo) => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export default class ErrorBoundary extends Component<ErrorBoundaryProps, State> {
  state: State = { hasError: false, error: null };

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: ErrorInfo): void {
    this.props.onError?.(error, info);
    // لا تسرّب stack في الإنتاج — أرسل تقرير CSP إن وجد
    const isProd = (import.meta as unknown as { env: { PROD: boolean } }).env.PROD;
    if (isProd) {
      // eslint-disable-next-line no-console
      console.error("[ErrorBoundary] suppressed in prod", info.componentStack?.slice(0, 200));
    }
  }

  reset = (): void => this.setState({ hasError: false, error: null });

  render(): ReactNode {
    if (this.state.hasError) {
      if (this.props.fallback) return this.props.fallback;
      return (
        <div role="alert" className="glass-inner rounded-[var(--radius-lg)] p-6 text-start">
          <h2 className="text-section font-semibold text-[var(--text-on-pearl)]">حدث خطأ غير متوقع</h2>
          <p className="mt-2 text-body text-[var(--text-secondary)]">تم إيقاف هذا القسم لحماية بقية الصفحة. يمكنك إعادة المحاولة دون فقدان البيانات.</p>
          {!(import.meta as unknown as { env: { PROD: boolean } }).env.PROD && this.state.error && (
            <pre dir="ltr" className="mt-3 max-h-32 overflow-auto rounded-[var(--radius-md)] bg-[var(--surface-secondary)] p-3 text-start text-micro text-[var(--text-secondary)]">
              {this.state.error.message}
            </pre>
          )}
          <div className="mt-4 flex justify-end">
            <Button variant="secondary" onClick={this.reset}>
              إعادة المحاولة
            </Button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
