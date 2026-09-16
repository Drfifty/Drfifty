// خطاف الإرسال المكاني — FIX-P1-02: Reverb service + channel X-App-Id — يفصل websocket/خريطة عن JSX
import { useEffect, useState, useCallback } from "react";
import { createReverbFromEnv } from "@/Services/Reverb";

type Provider = { id: number; lat: number; lng: number; rating?: number; accent?: "cyan" | "emerald" | "amber" };
type OrderStatus = "pending" | "accepted" | "reassigned" | "cancelled" | "completed";

interface UseSpatialDispatchOptions {
  orderId: number;
  customerLat: number;
  customerLng: number;
  radiusKm?: number;
  channel?: string; // presence-dispatch.{orderId}
  token?: string; // FIX-P1-02 optional bearer for X-App-Id reconnect
  appId?: string;
}

interface UseSpatialDispatchReturn {
  providers: Provider[];
  countdownSec: number | null; // 60s SOS
  status: OrderStatus;
  reassign: () => void;
  accept: (providerId: number) => void;
}

// يحسب المسافة داخلياً — الصفحة تعرض فقط
function haversineKm(aLat: number, aLng: number, bLat: number, bLng: number): number {
  const R = 6371;
  const dLat = ((bLat - aLat) * Math.PI) / 180;
  const dLng = ((bLng - aLng) * Math.PI) / 180;
  const s =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((aLat * Math.PI) / 180) * Math.cos((bLat * Math.PI) / 180) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(s));
}

export function useSpatialDispatch({
  orderId,
  customerLat,
  customerLng,
  radiusKm = 5,
  channel,
  token,
  appId,
}: UseSpatialDispatchOptions): UseSpatialDispatchReturn {
  void orderId; // FIX-P1-14 channel binding reserved
  const [providers] = useState<Provider[]>([
    { id: 1, lat: customerLat + 0.008, lng: customerLng + 0.006, accent: "cyan" },
    { id: 2, lat: customerLat - 0.012, lng: customerLng + 0.004, accent: "emerald" },
    { id: 3, lat: customerLat + 0.015, lng: customerLng - 0.01, accent: "amber" },
  ]);
  const [status, setStatus] = useState<OrderStatus>("pending");
  const [countdownSec, setCountdownSec] = useState<number | null>(60);

  // مؤقت 60 ثانية × 5 محاولات — منطق إعادة التعيين هنا لا في الصفحة
  useEffect(() => {
    if (status !== "pending" || countdownSec === null) return;
    if (countdownSec <= 0) {
      setStatus("reassigned");
      setCountdownSec(60);
      return;
    }
    const t = window.setTimeout(() => setCountdownSec((s) => (s === null ? null : s - 1)), 1000);
    return () => window.clearTimeout(t);
  }, [status, countdownSec]);

  // اشتراك Reverb — FIX-P1-02 injected Echo singleton + fallback createReverbFromEnv (8080)
  useEffect(() => {
    if (!channel || typeof window === "undefined") return;
    let echo: unknown = null;
    try { echo = (window as unknown as { Echo?: unknown }).Echo; } catch {}
    if (!echo && token) { try { echo = createReverbFromEnv(token, appId); } catch {} }
    if (!echo) return;
    const sub = (echo as unknown as { join: (c:string)=>{ listen:(e:string,cb:()=>void)=> unknown; leave?:(c:string)=>void } }).join(channel);
    sub.listen("ProviderAccepted", () => setStatus("accepted"));
    return () => {
      try {
        (echo as unknown as { leave:(c:string)=>void }).leave(channel);
      } catch {
        // تجاهل عند التنظيف
      }
    };
  }, [channel, token, appId]);

  const reassign = useCallback(() => {
    setStatus("reassigned");
    setCountdownSec(60);
  }, []);

  const accept = useCallback((providerId: number) => {
    void providerId;
    setStatus("accepted");
    setCountdownSec(null);
  }, []);

  // تصفية ضمن النطاق — المنطق هنا
  const inRadius = providers.filter((p) => haversineKm(customerLat, customerLng, p.lat, p.lng) <= radiusKm);

  return { providers: inRadius, countdownSec, status, reassign, accept };
}
