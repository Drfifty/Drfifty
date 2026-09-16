<?php
// MicroPermissionCache — Arena — B.3 — Redis 30s + tags + stampede lock + hierarchy DRM>AU Lite>RBAC
declare(strict_types=1);
namespace App\Infrastructure\Cache;
use Illuminate\Support\Facades\Cache; use Illuminate\Support\Facades\DB;
final class MicroPermissionCache {
 private const TTL=30;
 public static function key(int $agentId, string $appId): string { return "micro_perm:".app()->environment().":{$agentId}:{$appId}"; }
 public static function allForAgent(int $agentId, string $appId): array {
  $k=self::key($agentId,$appId);
  $cached=Cache::get($k);
  if($cached!==null) return $cached;
  $lock=Cache::lock($k.':refresh',5);
  try{ $lock->block(3); }catch(\Throwable){ return Cache::get($k) ?? []; }
  $rows=DB::table('micro_switch_matrix')->where('agent_id',$agentId)->where('app_id',$appId)->get(['sub_capability_key','is_enabled','approval_required','module_id']);
  $val=$rows->mapWithKeys(fn($r)=>[$r->sub_capability_key=>['enabled'=>(bool)$r->is_enabled,'approval'=>(bool)$r->approval_required,'module_id'=>$r->module_id]])->all();
  Cache::put($k,$val,self::TTL);
  try{ Cache::tags(['micro_perm'])->put($k,$val,self::TTL);}catch(\Throwable){}
  try{$lock->release();}catch(\Throwable){}
  return $val;
 }
 public static function isEnabled(int $agentId,string $appId,int $moduleId,string $cap): bool {
  $all=self::allForAgent($agentId,$appId);
  return $all[$cap]['enabled'] ?? true; // default enabled if not seeded
 }
 public static function requiresApproval(int $agentId,string $appId,int $moduleId,string $cap): bool {
  $all=self::allForAgent($agentId,$appId);
  return (bool)($all[$cap]['approval'] ?? false);
 }
 public static function invalidate(int $agentId,string $appId): void { Cache::forget(self::key($agentId,$appId)); try{Cache::tags(['micro_perm'])->flush();}catch(\Throwable){} }
}
