// اعتراض التسريب — RegexDataLeakDetector للعميل — 0 تكلفة
// Phase 4.0: Client-Side Security Interceptors — يطمس قبل الإرسال

// هاتف مصري + بريد + رابط — نفس نمط الخادم (data_leak_patterns)
const PHONE_RE = /(\+?20)?0?1[0-2,5][0-9]{8}/g;
const EMAIL_RE = /[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi;
const URL_RE = /https?:\/\/\S+/gi;
const E164_RE = /\+[1-9]\d{7,14}/g;

export function maskLeak(input: string): string {
  if (!input) return input;
  return input.replace(PHONE_RE, "***-****").replace(EMAIL_RE, "***@***").replace(URL_RE, "***").replace(E164_RE, "***");
}

export function containsLeak(input: string): boolean {
  return PHONE_RE.test(input) || EMAIL_RE.test(input) || URL_RE.test(input);
}

// يُستدعى قبل Inertia post — يعيد حمولة مطموسة
export function sanitizePayload<T extends Record<string, unknown>>(payload: T): T {
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(payload)) {
    out[k] = typeof v === "string" ? maskLeak(v) : v;
  }
  return out as T;
}
