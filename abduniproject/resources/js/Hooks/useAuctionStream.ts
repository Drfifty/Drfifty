// خطاف بث المزاد — FIX-P1-02: Reverb service TTL dedup — يفصل Reverb عن JSX
import { useEffect, useState, useCallback } from "react";
import { createReverbFromEnv } from "@/Services/Reverb";

interface Bid {
  id: number;
  amount: number;
  bidderMasked: string;
  at: string;
}

interface UseAuctionStreamOptions {
  auctionId: number;
  channel?: string;
  endsAt?: string;
  token?: string; // FIX-P1-02 bearer for reconnect
  appId?: string;
}

interface UseAuctionStreamReturn {
  bids: Bid[];
  topBid: Bid | null;
  timeLeftSec: number | null;
  placeBid: (amount: number) => Promise<void>;
  isPlacing: boolean;
}

export function useAuctionStream({ auctionId, channel, endsAt, token, appId }: UseAuctionStreamOptions): UseAuctionStreamReturn {
  void auctionId; // FIX-P1-14
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

  // اشتراك بث — FIX-P1-02 fallback Reverb service
  useEffect(() => {
    if (!channel || typeof window === "undefined") return;
    let echo: unknown = null;
    try { echo = (window as unknown as { Echo?: unknown }).Echo; } catch {}
    if (!echo && token) { try { echo = createReverbFromEnv(token, appId); } catch {} }
    if (!echo) return;
    const sub = (echo as unknown as { join:(c:string)=>{listen:(e:string,cb:(arg:{bid:Bid})=>void)=>unknown; leave?:(c:string)=>void} }).join(channel);
    sub.listen("BidPlaced", (e: { bid: Bid }) => setBids((prev) => [e.bid, ...prev].slice(0, 50)));
    return () => {
      try {
        (echo as unknown as { leave:(c:string)=>void }).leave(channel);
      } catch {
        // تنظيف
      }
    };
  }, [channel, token, appId]);

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
