<?php
// RedisFeatureFlagCache — B1-F1,F2,F6 + B1-01 stampede lock — Arena — TTL30 + env namespace + audit + Reverb broadcast
declare(strict_types=1);
namespace App\Infrastructure\Cache;
use App\Domain\Governance\Enums\ModuleKey;
use App\Domain\Governance\Repositories\FeatureFlagRepositoryInterface;
use Illuminate\Support\Facades\Cache; use Illuminate\Support\Facades\DB; use Illuminate\Support\Facades\Log;
final class RedisFeatureFlagCache implements FeatureFlagRepositoryInterface {
 private const TTL = 30;
 private static function prefix(): string { return 'au:flags:'.app()->environment().':'; }
 private static function key(ModuleKey $k): string { return self::prefix().$k->value; }
 public function findByKey(ModuleKey $k): ?array {
  $cacheKey=self::key($k);
  // FIX-360-02: pinned redis cache DB1 — tags supported, never array store
  $cached=Cache::store('redis')->get($cacheKey) ?? Cache::get($cacheKey);
  if($cached!==null) return $cached;
  // stampede lock: only 1 loader hits DB
  $lock=Cache::lock($cacheKey.':refresh',5);
  try { $lock->block(3); } catch(\Throwable){ return Cache::get($cacheKey); }
  try {
   $row=DB::table('feature_flags')->where('flag_key',$k->value)->first(['is_enabled','degraded_mode','rollout_percentage']);
   if(!$row){ $lock->release(); return null; }
   $val=['is_enabled'=>(bool)$row->is_enabled,'degraded_mode'=>(bool)($row->degraded_mode??0),'rollout'=>(int)$row->rollout_percentage];
   Cache::store('redis')->put($cacheKey,$val,self::TTL);
   // warm tags for mass invalidation — FIX-360-02 pinned redis
   try{ Cache::store('redis')->tags(['feature_flags'])->put($cacheKey,$val,self::TTL);}catch(\Throwable){ try{Cache::tags(['feature_flags'])->put($cacheKey,$val,self::TTL);}catch(\Throwable){} }
   $lock->release();
   return $val;
  } catch(\Throwable $e){ try{$lock->release();}catch(\Throwable){} throw $e; }
 }
 public function isEnabled(ModuleKey $k): bool {
  if($k->isCore()) return true;
  return (bool)($this->findByKey($k)['is_enabled'] ?? true);
 }
 public function setEnabled(ModuleKey $k,bool $enabled,?int $actorId,?string $reason=null,?string $ip=null):void{
  if($k->isCore()) throw new \LogicException('AU BUSINESS non-hibernatable');
  $prev=DB::table('feature_flags')->where('flag_key',$k->value)->first(['is_enabled','degraded_mode']);
  DB::table('feature_flags')->where('flag_key',$k->value)->update(['is_enabled'=>$enabled,'last_toggled_by'=>$actorId,'last_toggled_at'=>now(),'updated_at'=>now()]);
  // audit ledger B1-F2
  try{ DB::table('feature_flag_audits')->insert(['flag_key'=>$k->value,'old_is_enabled'=>$prev? (bool)$prev->is_enabled:null,'new_is_enabled'=>$enabled,'old_degraded_mode'=>$prev? (bool)($prev->degraded_mode??0):null,'new_degraded_mode'=>$prev? (bool)($prev->degraded_mode??0):false,'actor_id'=>$actorId,'reason'=>mb_substr($reason??'',0,500),'ip_address'=>$ip,'meta'=>json_encode(['source'=>'RedisFeatureFlagCache']),'created_at'=>now()]); }catch(\Throwable $e){ Log::warning('feature_flag_audit_insert_failed',['key'=>$k->value,'e'=>$e->getMessage()]); }
  \App\Support\CacheTagGuard::forget(self::key($k));
  \App\Support\CacheTagGuard::flushTags(['feature_flags']);
  // B.10 Reverb broadcast — event(new FeatureFlagToggled($k,$enabled))
  try{ event(new \App\Events\FeatureFlagToggled($k,$enabled)); }catch(\Throwable){}
 }
 public function setDegradedMode(ModuleKey $k,bool $degraded,?int $actorId,?string $reason=null):void{
  DB::table('feature_flags')->where('flag_key',$k->value)->update(['degraded_mode'=>$degraded,'last_toggled_by'=>$actorId,'last_toggled_at'=>now(),'updated_at'=>now()]);
  \App\Support\CacheTagGuard::forget(self::key($k));
  \App\Support\CacheTagGuard::flushTags(['feature_flags']);
 }
}
