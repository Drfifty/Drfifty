<?php
// ReverbBuffer — B.10 F-04/F-16 — Arena — last 50 buffered JSON per channel Redis at-least-once dedup
declare(strict_types=1);
namespace App\Services\Broadcast;
use Illuminate\Support\Facades\Redis; use Illuminate\Support\Facades\Cache;
final class ReverbBuffer {
 private const MAX=50; private const TTL=86400;
 public static function key(string $channel): string { return "broadcast:buffer:{$channel}"; }
 private static function ttl(): int { return (int) config('ai.clock_skew_margin', env('CLOCK_SKEW_MARGIN', 30)) + self::TTL; }
 public static function push(string $channel, array $payload): void {
  $key=self::key($channel); $ttl=self::ttl();
  try{
   $json=json_encode($payload, JSON_UNESCAPED_SLASHES|JSON_UNESCAPED_UNICODE);
   Redis::lpush($key, $json);
   Redis::ltrim($key, 0, self::MAX-1);
   Redis::expire($key, $ttl);
  } catch(\Throwable){
   try{ Cache::put($key, json_encode($payload), $ttl); }catch(\Throwable){}
  }
  // dedup marker 1h + skew (F-16)
  if(isset($payload['event_id'])){
   $skewTtl=3600 + (int) config('ai.clock_skew_margin', env('CLOCK_SKEW_MARGIN', 30));
   try{ Cache::add("processed:event:{$payload['event_id']}",1,$skewTtl); }catch(\Throwable){}
  }
 }
 public static function replay(string $channel, ?string $afterEventId=null): array {
  $key=self::key($channel);
  try{
   $raw=Redis::lrange($key,0,self::MAX-1) ?: [];
   $items=array_map(fn($j)=> json_decode($j,true) ?? [], $raw);
   $items=array_reverse($items); // oldest→newest
   if($afterEventId){
    $idx=null; foreach($items as $i=>$it) if(($it['event_id'] ?? null)===$afterEventId){ $idx=$i; break; }
    if($idx!==null) $items=array_slice($items,$idx+1);
   }
   return array_values($items);
  } catch(\Throwable){ return []; }
 }
 public static function isProcessed(string $eventId): bool {
  try{ return (bool) Cache::has("processed:event:{$eventId}"); }catch(\Throwable){ return false; }
 }
 public static function markProcessed(string $eventId): void {
  $ttl=3600 + (int) config('ai.clock_skew_margin', env('CLOCK_SKEW_MARGIN', 30));
  try{ Cache::add("processed:event:{$eventId}",1,$ttl); }catch(\Throwable){}
 }
}
