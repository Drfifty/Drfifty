// خطاف قفل الضمان — يفصل الاستقطاع/التحرير عن JSX
// الصفحات تعرض حالة الضمان فقط — المنطق المالي هنا
import { useState, useCallback } from "react";

type EscrowStatus = "unlocked" | "tier1_locked" | "tier2_locked" | "released" | "refunded";

interface UseEscrowLockOptions {
  orderId: number;
  tier1Amount?: number; // 500 افتراضي
  tier2Amount?: number | null;
}

interface UseEscrowLockReturn {
  status: EscrowStatus;
  tier1Amount: number;
  tier2Amount: number | null;
  lockTier1: () => Promise<void>;
  lockTier2: () => Promise<void>;
  release: () => Promise<void>;
  isBusy: boolean;
}

export function useEscrowLock({ orderId: _orderId, tier1Amount = 500, tier2Amount = null }: UseEscrowLockOptions): UseEscrowLockReturn {
  const [status, setStatus] = useState<EscrowStatus>("unlocked");
  const [isBusy, setIsBusy] = useState(false);
  const [tier2, setTier2] = useState<number | null>(tier2Amount);

  const lockTier1 = useCallback(async () => {
    setIsBusy(true);
    try {
      await new Promise((r) => window.setTimeout(r, 500));
      setStatus("tier1_locked");
    } finally {
      setIsBusy(false);
    }
  }, []);

  const lockTier2 = useCallback(async () => {
    setIsBusy(true);
    try {
      await new Promise((r) => window.setTimeout(r, 500));
      setTier2((v) => v ?? 2200);
      setStatus("tier2_locked");
    } finally {
      setIsBusy(false);
    }
  }, []);

  const release = useCallback(async () => {
    setIsBusy(true);
    try {
      await new Promise((r) => window.setTimeout(r, 500));
      setStatus("released");
    } finally {
      setIsBusy(false);
    }
  }, []);

  return { status, tier1Amount, tier2Amount: tier2, lockTier1, lockTier2, release, isBusy };
}
