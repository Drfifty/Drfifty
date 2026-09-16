<?php
// ToggleModuleAction — B.8 F-04 — Arena — RedisFeatureFlagCache + MicroPermissionCache + WORM + Reverb
declare(strict_types=1);
namespace App\Domain\Governance\Actions;
use App\Domain\Governance\Enums\ModuleKey; use App\Domain\Governance\Enums\SubCapabilityKey; use Illuminate\Support\Facades\DB;
final class ToggleModuleAction {
 public function execute(array $v, int $actorId, string $ip): array {
  if(isset($v['flag_key'])){
   $key=ModuleKey::tryFrom($v['flag_key']) ?? ModuleKey::from(strtolower($v['flag_key']));
   if($key->isCore()) throw \Illuminate\Validation\ValidationException::withMessages(['flag_key'=>'AU BUSINESS non-hibernatable (is_core lock)']);
   $cache=app(\App\Infrastructure\Cache\RedisFeatureFlagCache::class);
   $cache->setEnabled($key,(bool)$v['is_enabled'],$actorId,$v['reason'],$ip);
   return ['flag_key'=>$v['flag_key'],'is_enabled'=>(bool)$v['is_enabled']];
  }
  if(isset($v['agent_id'])){
   $cap=SubCapabilityKey::tryFrom($v['capability_key']);
   if(!$cap) throw new \RuntimeException('Invalid capability',422);
   app(\App\Domain\Governance\Repositories\MicroSwitchRepositoryInterface::class)->set((int)$v['agent_id'],'AU BUSINESS',(int)($v['module_id']??9),$cap,(bool)$v['is_enabled'],false,$actorId,$v['reason'],$ip);
   return ['agent_id'=>$v['agent_id'],'cap'=>$cap->value,'is_enabled'=>(bool)$v['is_enabled']];
  }
  throw new \RuntimeException('No toggle target',422);
 }
}
