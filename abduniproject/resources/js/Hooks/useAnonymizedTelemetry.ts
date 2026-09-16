// Hooks/useAnonymizedTelemetry — FIX-P2-11: AnonymizedTelemetryMiddleware client guard 422
import { maskLeak, containsLeak } from "@/Utils/sanitize";

export function useAnonymizedTelemetry() {
  const guard = (payload: Record<string, unknown>): Record<string, unknown> => {
    for (const v of Object.values(payload)) {
      if (typeof v === "string" && containsLeak(v)) return { blocked: true, reason: "DATA_LEAK_BLOCKED" } as unknown as Record<string, unknown>;
    }
    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(payload)) out[k] = typeof v === "string" ? maskLeak(v) : v;
    return out;
  };
  return { guard };
}
