// مطهّر النماذج — يمرّر الحقول عبر Regex قبل إرسال Inertia
// Phase 4.0: Security Interceptor — لا بيانات حساسة تخرج قبل الضمان
import { useCallback } from "react";
import { maskLeak } from "@/Utils/sanitize";

export function useFormSanitizer() {
  const sanitize = useCallback((value: string): string => maskLeak(value), []);
  const sanitizeRecord = useCallback((record: Record<string, unknown>): Record<string, unknown> => {
    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(record)) out[k] = typeof v === "string" ? maskLeak(v) : v;
    return out;
  }, []);
  return { sanitize, sanitizeRecord };
}
