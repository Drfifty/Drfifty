<?php
// ReverbBuffer — B.10 F-04/F-16 — Arena — last 50 buffered JSON per channel Redis at-least-once dedup
declare(strict_types=1);
namespace App\Services\Broadcast;
use Illuminate\Support\Facades\Redis; use Illuminate\Support\Facades\Cache;
final class ReverbBuffer {
 private const MAX=50; private const TTL=86400;
 public static function key(string $channel): string { return "broadcast:buffer:{$channel}"; }
 public static function push(string $channel, array $payload): void {
  $key=self::key($channel);
  try{
   $json=json_encode($payload, JSON_UNESCAPED_SLASHES|JSON_UNESCAPED_UNICODE);
   Redis::lpush($key, $json);
   Redis::ltrim($key, 0, self::MAX-1);
   Redis::expire($key, self::TTL);
  } catch(\Throwable){
   try{ Cache::put($key, json_encode($payload), self::TTL); }catch(\Throwable){}
  }
  // dedup marker 1h
  if(isset($payload['event_id'])){
   try{ Cache::add("processed:event:{$payload['event_id']}",1,3600); }catch(\Throwable){}
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
  try{ Cache::add("processed:event:{$eventId}",1,3600); }catch(\Throwable){}
 }
}
