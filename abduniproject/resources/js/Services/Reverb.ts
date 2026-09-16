// Reverb — B.10 F-15 — Arena — Echo dedup Set<event_id> + replay after_event_id last 50 at-least-once exactly-once effect TS strict zero any
import Echo from 'laravel-echo';
import Pusher from 'pusher-js';
declare global { interface Window { Pusher: typeof Pusher } }
if (typeof window !== 'undefined') (window as unknown as { Pusher: typeof Pusher }).Pusher = Pusher;
type ReverbOpts = { key: string; host: string; port: number; scheme: 'http'|'https'; token: string };
export function createReverb(opts: ReverbOpts): Echo<'reverb'> {
  const isHttps = opts.scheme === 'https';
  return new Echo({
    broadcaster: 'reverb',
    key: opts.key,
    wsHost: opts.host,
    wsPort: opts.port,
    wssPort: opts.port,
    forceTLS: isHttps,
    enabledTransports: isHttps ? ['ws','wss'] : ['ws'],
    auth: { headers: { Authorization: `Bearer ${opts.token}` } },
  } as unknown as Record<string, unknown>) as Echo<'reverb'>;
}
export class DedupSet {
  private seen = new Set<string>();
  has(id: string): boolean { return this.seen.has(id); }
  add(id: string): boolean {
    if (this.seen.has(id)) return false;
    this.seen.add(id);
    if (this.seen.size > 5000) { const first = this.seen.values().next().value as string; this.seen.delete(first); }
    return true;
  }
}
export async function fetchReplay(channel: string, afterEventId: string | null, token: string): Promise<Record<string, unknown>[]> {
  const qs = new URLSearchParams({ channel, ...(afterEventId ? { after_event_id: afterEventId } : {}) });
  const res = await fetch(`/api/v1/reverb/replay?${qs.toString()}`, { headers: { Authorization: `Bearer ${token}` } });
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
