// خطاف بث المزاد — يفصل Reverb/المزايدة عن JSX
// الصفحات تعرض bids وtimeLeft فقط — لا websocket داخل المكون
import { useEffect, useState, useCallback } from "react";

interface Bid {
  id: number;
  amount: number;
  bidderMasked: string;
  at: string;
}

interface UseAuctionStreamOptions {
  auctionId: number;
  channel?: string; // presence-auction.{id}
  endsAt?: string; // ISO
}

interface UseAuctionStreamReturn {
  bids: Bid[];
  topBid: Bid | null;
  timeLeftSec: number | null;
  placeBid: (amount: number) => Promise<void>;
  isPlacing: boolean;
}

export function useAuctionStream({ channel, endsAt }: UseAuctionStreamOptions): UseAuctionStreamReturn {
  const [bids, setBids] = useState<Bid[]>([
    { id: 1, amount: 12400, bidderMasked: "Ah***12", at: new Date().toISOString() },
    { id: 2, amount: 13100, bidderMasked: "Mo***08", at: new Date().toISOString() },
  ]);
  const [isPlacing, setIsPlacing] = useState(false);
  const [timeLeftSec, setTimeLeftSec] = useState<number | null>(() => {
    if (!endsAt) return null;
    return Math.max(0, Math.floor((new Date(endsAt).getTime() - Date.now()) / 1000));
  });

  // عد تنازلي — منطق منفصل
  useEffect(() => {
    if (timeLeftSec === null) return;
    if (timeLeftSec <= 0) return;
    const t = window.setTimeout(() => setTimeLeftSec((s) => (s === null ? null : s - 1)), 1000);
    return () => window.clearTimeout(t);
  }, [timeLeftSec]);

  // اشتراك بث — معزول
  useEffect(() => {
    if (!channel || typeof window === "undefined") return;
    // @ts-expect-error Echo
    const echo = window.Echo;
    if (!echo) return;
    const sub = echo.join(channel);
    sub.listen("BidPlaced", (e: { bid: Bid }) => setBids((prev) => [e.bid, ...prev].slice(0, 50)));
    return () => {
      try {
        echo.leave(channel);
      } catch {
        // تنظيف
      }
    };
  }, [channel]);

  const placeBid = useCallback(async (amount: number) => {
    setIsPlacing(true);
    try {
      // استدعاء API يُحقن لاحقاً — حالياً محاكاة
      await new Promise((r) => window.setTimeout(r, 400));
      const bid: Bid = { id: Date.now(), amount, bidderMasked: "Yo***", at: new Date().toISOString() };
      setBids((prev) => [bid, ...prev].slice(0, 50));
    } finally {
      setIsPlacing(false);
    }
  }, []);

  const topBid = bids.length ? [...bids].sort((a, b) => b.amount - a.amount)[0] : null;

  return { bids, topBid, timeLeftSec, placeBid, isPlacing };
}
