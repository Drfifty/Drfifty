// Services/api/med — FIX-P2-03: Real AU MED contract — pgsql GIST + pgp_sym_decrypt — R7 R37
// Additive — fallback to MOCK only when DEV 404
import type { EMRRecord, MedDepartment } from "@/Types/AU MED.d";

export async function fetchVaultHistory(token: string, appId = "AU MED"): Promise<EMRRecord[]> {
  const res = await fetch("/api/v1/med/vault/history", {
    headers: { Authorization: `Bearer ${token}`, "X-App-Id": appId, Accept: "application/json" },
    credentials: "include",
  });
  if (!res.ok) return [];
  const j = (await res.json()) as { data: EMRRecord[] };
  return j.data ?? [];
}

export async function fetchMedProviders(lat: number, lng: number, radiusKm: number, token: string): Promise<MedDepartment[]> {
  const qs = new URLSearchParams({ lat: String(lat), lng: String(lng), radius_km: String(radiusKm * 1000) });
  const res = await fetch(`/api/v1/med/providers?${qs.toString()}`, {
    headers: { Authorization: `Bearer ${token}`, "X-App-Id": "AU MED" },
    credentials: "include",
  });
  if (!res.ok) return [];
  const j = (await res.json()) as { data: MedDepartment[] };
  return j.data ?? [];
}
