// Hooks/useVaultDecrypt — FIX-P2-15: SoC split vault 163→120L — decrypt gate + countdown central
import { useEffect, useState } from "react";
import type { EMRRecord } from "@/Types/AU MED.d";

export function canDecrypt(token: string | null, expiresAt: string): boolean {
  if (!token) return false;
  return new Date(expiresAt).getTime() > Date.now();
}

export function mockDecrypt(rec: EMRRecord, token: string | null, expiresAt: string): string {
  if (!canDecrypt(token, expiresAt)) return "🔒 مُشفّر — AES-256-GCM — يتطلب OTP صالح";
  return rec.decrypted?.notes ?? "تشخيص: التهاب حاد — ملاحظات مفكوكة";
}

export function useCountdown(expiresAt: string): string {
  const [left, setLeft] = useState(() => Math.max(0, new Date(expiresAt).getTime() - Date.now()));
  useEffect(() => {
    const t = window.setInterval(() => setLeft(Math.max(0, new Date(expiresAt).getTime() - Date.now())), 1000);
    return () => window.clearInterval(t);
  }, [expiresAt]);
  const m = Math.floor(left / 60000), s = Math.floor((left % 60000) / 1000);
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}
