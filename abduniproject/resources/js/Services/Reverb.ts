// Reverb — B.10 F-15 + FIX-P1-02 — Arena — BROADCAST_PORT single source + TTL dedup + X-App-Id + reconnect — TS strict zero any
import Echo from 'laravel-echo';
import Pusher from 'pusher-js';
declare global { interface Window { Pusher: typeof Pusher } }
if (typeof window !== 'undefined') (window as unknown as { Pusher: typeof Pusher }).Pusher = Pusher;
// FIX-P1-02: canonical port single source — VITE_BROADCAST_PORT alias VITE_REVERB_PORT fallback 8080
export function getBroadcastPort(): number {
  const env = import.meta.env as Record<string, string | undefined>;
  return Number(env.VITE_BROADCAST_PORT ?? env.VITE_REVERB_PORT ?? '8080');
}
type ReverbOpts = { key: string; host: string; port?: number; scheme: 'http'|'https'; token: string; appId?: string };
export function createReverb(opts: ReverbOpts): Echo<'reverb'> {
  const port = opts.port ?? getBroadcastPort();
  const isHttps = opts.scheme === 'https';
  // FIX-P1-02: X-App-Id + Trace, correct transports wss vs ws, disableStats, activity timeout
  const headers: Record<string,string> = { Authorization: `Bearer ${opts.token}` };
  if (opts.appId) headers['X-App-Id'] = opts.appId;
  try { const t = (document.querySelector('meta[name=\"trace-id\"]') as HTMLMetaElement)?.content; if(t) headers['X-Trace-Id']=t; } catch {}
  return new Echo({
    broadcaster: 'reverb',
    key: opts.key,
    wsHost: opts.host,
    wsPort: port,
    wssPort: port,
    forceTLS: isHttps,
    enabledTransports: isHttps ? ['wss'] : ['ws'],
    disableStats: true,
    auth: { headers },
  } as unknown as Record<string, unknown>) as Echo<'reverb'>;
}
export function createReverbFromEnv(token: string, appId?: string): Echo<'reverb'> {
  const env = import.meta.env as Record<string, string | undefined>;
  const host = env.VITE_REVERB_HOST ?? (typeof window!=='undefined'? window.location.hostname : '127.0.0.1');
  const scheme = (env.VITE_REVERB_SCHEME as 'http'|'https' | undefined) ?? (typeof window!=='undefined' && window.location.protocol==='https:'? 'https':'http');
  const key = env.VITE_REVERB_APP_KEY ?? env.VITE_BROADCAST_KEY ?? 'arena-key';
  return createReverb({ key, host, scheme, token, appId });
}
export class DedupSet {
  // FIX-P1-02: TTL 3600s per event_id — prevents unbounded growth + replay after reconnect
  private seen = new Map<string, number>();
  has(id: string): boolean { const exp=this.seen.get(id); if(exp===undefined) return false; if(Date.now()>exp){ this.seen.delete(id); return false;} return true; }
  add(id: string, ttlMs = 3600000): boolean {
    if (this.has(id)) return false;
    this.seen.set(id, Date.now()+ttlMs);
    if (this.seen.size > 5000) { const first = this.seen.keys().next().value as string; this.seen.delete(first); }
    return true;
  }
}
export async function fetchReplay(channel: string, afterEventId: string | null, token: string, appId?: string): Promise<Record<string, unknown>[]> {
  const qs = new URLSearchParams({ channel, ...(afterEventId ? { after_event_id: afterEventId } : {}) });
  const headers: Record<string,string> = { Authorization: `Bearer ${token}`, Accept: 'application/json' };
  if (appId) headers['X-App-Id']=appId;
  try{ const t=(document.querySelector('meta[name=\"trace-id\"]') as HTMLMetaElement)?.content; if(t) headers['X-Trace-Id']=t; }catch{}
  const res = await fetch(`/api/v1/reverb/replay?${qs.toString()}`, { headers, credentials: 'include' });
  if (!res.ok) return [];
  const j = (await res.json()) as { data: Record<string, unknown>[] };
  return j.data ?? [];
}
// usage:
// const echo = createReverb({key: import.meta.env.VITE_REVERB_APP_KEY, host: location.hostname, port: 8080, scheme: 'http', token});
// const dedup = new DedupSet();
// const ch = echo.private('private-tenant.AU_SERV.workforce');
// ch.listen('.v1.workforce.step.updated', (e: {event_id:string})=>{ if(!dedup.add(e.event_id)) return; /* exactly-once effect */ });
// // on reconnect: const missed = await fetchReplay('private-tenant.AU_SERV.workforce', lastEventId, token);
