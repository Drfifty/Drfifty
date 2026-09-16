<?php
// AgentRuntimeCache — Arena — B.4 F-08 — 30s tags ai_runtime + stampede lock — precedence micro_switch > budget
declare(strict_types=1);
namespace App\Infrastructure\Cache;
use Illuminate\Support\Facades\Cache; use Illuminate\Support\Facades\DB;
final class AgentRuntimeCache {
 private const TTL=30;
 public static function key(int $agentId,string $appId): string { return "ai:runtime:".app()->environment().":{$agentId}:{$appId}"; }
 public static function resolve(int $agentId,string $appId): array {
  $k=self::key($agentId,$appId);
  // FIX-360-02 pinned redis
  $cached=Cache::store('redis')->get($k) ?? Cache::get($k);
  if($cached!==null) return $cached;
  $lock=Cache::lock($k.':refresh',5);
  try{ $lock->block(3); }catch(\Throwable){ return Cache::get($k) ?? self::defaults(); }
  $cached=Cache::get($k);
  if($cached!==null){ try{$lock->release();}catch(\Throwable){} return $cached; }
  $row=DB::table('micro_switch_matrix')->where('agent_id',$agentId)->where('app_id',$appId)->first(['driver_override','deterministic_threshold','preferred_driver']);
  $val=['driver_override'=>$row->driver_override ?? 'auto','threshold'=> (int)($row->deterministic_threshold ?? 90),'preferred'=>$row->preferred_driver ?? 'cloud'];
  Cache::store('redis')->put($k,$val,self::TTL);
  try{ Cache::store('redis')->tags(['ai_runtime'])->put($k,$val,self::TTL);}catch(\Throwable){ try{Cache::tags(['ai_runtime'])->put($k,$val,self::TTL);}catch(\Throwable){} }
  try{$lock->release();}catch(\Throwable){}
  return $val;
 }
 public static function defaults(): array { return ['driver_override'=>'auto','threshold'=>90,'preferred'=>'cloud']; }
 public static function invalidate(int $agentId,string $appId): void { \App\Support\CacheTagGuard::forget(self::key($agentId,$appId)); \App\Support\CacheTagGuard::flushTags(['ai_runtime']); }
}
